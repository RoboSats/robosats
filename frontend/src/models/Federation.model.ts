import {
  Coordinator,
  type Exchange,
  LimitList,
  type Origin,
  type PublicOrder,
  type Settings,
  defaultExchange,
} from '.';
import defaultFederation from '../../static/federation.json';
import {
  type FederationDoc,
  type CoordVote,
  type VoterRow,
  voteOnHashes,
  fetchAndVerifyDoc,
  getSeedHash,
} from '../services/FederationDiscovery';
import { federationLottery, getHost } from '../utils';
import type { CoordinatorSeed } from '../utils/federationLottery';
import { coordinatorDefaultValues, type CoordinatorConfig } from './Coordinator.model';
import { updateExchangeInfo } from './Exchange.model';
import eventToPublicOrder, { setLiveCoordinators } from '../utils/nostr';
import { verifyCoordinatorToken } from '../utils/nostr';
import { setFederationPubkeys } from '../services/RoboPool';
import RoboPool from '../services/RoboPool';
import { systemClient } from '../services/System';
import { fetchDevFundProfiles } from '../services/DevFundProfile';

type FederationHooks = 'onFederationUpdate';

/** Per-coordinator request timeout for the generic initialization phase.
 *  Keeps parity with the old DevFund PROBE_TIMEOUT (15 s).
 *  An unreachable coordinator's promise is replaced with `undefined` after
 *  this interval so the rest of the batch is never blocked. */
const COORDINATOR_REQUEST_TIMEOUT_MS = 15_000;

/** Races `promise` against a silent timeout. The timeout resolves to
 *  `undefined`; the original promise continues running and will resolve
 *  or reject on its own — this only unblocks the batch-level await. */
const withTimeout = <T>(promise: Promise<T>): Promise<T | undefined> =>
  Promise.race([
    promise,
    new Promise<undefined>((resolve) =>
      setTimeout(() => resolve(undefined), COORDINATOR_REQUEST_TIMEOUT_MS),
    ),
  ]);

export class Federation {
  constructor(origin: Origin, settings: Settings, hostUrl: string) {
    const federationEntries = Object.entries(defaultFederation) as Array<
      [string, CoordinatorConfig]
    >;
    const coordinators = federationEntries.reduce(
      (acc: Record<string, Coordinator>, [key, value]) => {
        acc[key] = new Coordinator(value, origin, settings, hostUrl);
        acc[key].federated = true;
        return acc;
      },
      {},
    );

    this.coordinators = {};
    federationLottery().forEach((alias) => {
      if (coordinators[alias] !== undefined) this.coordinators[alias] = coordinators[alias];
    });

    this.exchange = {
      ...defaultExchange,
      totalCoordinators: Object.keys(this.coordinators).length,
    };
    this.book = {};
    this.ratings = {};
    this.ratingsLoaded = false;
    this.hooks = {
      onFederationUpdate: [],
    };

    Object.keys(this.coordinators).forEach((key) => {
      if (key !== 'local' || getHost() === '127.0.0.1:8000') {
        // Do not add `Local Dev` unless it is running on localhost
        this.addCoordinator(origin, settings, hostUrl, this.coordinators[key]);
      }
    });

    this.exchange.loadingCoordinators = Object.keys(this.coordinators).length;
    this.loading = true;

    const host = getHost();
    const url = `${window.location.protocol}//${host}`;

    const tesnetHost = Object.values(this.coordinators).find((coor) => {
      return Object.values(coor.testnet).includes(url);
    });
    this.network = settings.network ?? 'mainnet';
    if (tesnetHost) this.network = 'testnet';
    this.connection = null;
    this.roboPool = new RoboPool(settings);

    if (settings.client === 'mobile') {
      const federationUrls = Object.values(this.coordinators)
        .map((c) => c.getRelayUrl())
        .filter(Boolean);
      const federationPubKeys = Object.values(this.coordinators).map((c) => c.nostrHexPubkey);

      systemClient.setItem('federation_relays', JSON.stringify(federationUrls));
      systemClient.setItem('federation_pubkeys', JSON.stringify(federationPubKeys));
    }

    this.coordinatorsRatingInit();
    this.origin = origin;
    this.settings = settings;
    this.hostUrl = hostUrl;
  }

  // Store constructor args for use in refreshFederationList
  private origin: Origin;
  private settings: Settings;
  private hostUrl: string;

  /**
   * The voted (or seed) federation document, kept in sync after every
   * successful discovery poll.  Static so modules that run before the
   * Federation instance is available (e.g. getHost.ts on mobile bootstrap)
   * can read it via Federation.liveFedDoc without needing the instance.
   *
   * On cold start (mobile / offline) the persisted manifest written by
   * refreshFederationList() is restored here so getHostUrl() can pick a
   * valid onion from the last known-good list before the vote completes.
   */
  public static liveFedDoc: Record<string, Record<string, unknown>> = (() => {
    try {
      const stored = systemClient.getSyncItem?.('federation_manifest');
      if (stored) {
        const parsed = JSON.parse(stored) as Record<string, Record<string, unknown>>;
        if (parsed && typeof parsed === 'object' && Object.keys(parsed).length > 0) {
          return parsed;
        }
      }
    } catch {
      // ignore — fall through to seed
    }
    return defaultFederation as unknown as Record<string, Record<string, unknown>>;
  })();

  private coordinators: Record<string, Coordinator>;
  public exchange: Exchange;
  public book: Record<string, PublicOrder | undefined>;
  public ratings: Record<string, Record<string, number>>;
  private ratingsLoaded: boolean;
  public loading: boolean;
  public devFundLoaded: boolean = false;
  /** True once refreshFederationList() has fully settled (majority applied
   *  or safe keep-current decision). The coordinator list is final at this
   *  point — UI gates order creation/selection on this, not on per-coordinator
   *  loading state, so users can never pick a coordinator that is about to be
   *  removed by discovery. */
  public federationListLoaded: boolean = false;
  public connection: 'api' | 'nostr' | null;
  public network: 'testnet' | 'mainnet';

  public hooks: Record<FederationHooks, Array<() => void>>;

  public roboPool: RoboPool;

  /**
   * The hash that won the seniority-weighted Phase B vote (strict >50% majority).
   * Set to null when no majority is reached (indecision / quorum not met).
   * Updated every time refreshFederationList() runs so the UI can colour the
   * winning hash green in the coordinator list.
   */
  public majorityFederationHash: string | null = null;

  /**
   * Raw tally from the most recent call to voteOnHashes().
   * Stored so logConsensus() can print the exact ballot inputs without
   * recomputing against liveFedDoc (which may have already been updated by
   * Phase C adoption, producing a misleading post-hoc weight table).
   */
  private lastVoteTally: {
    voterRows: VoterRow[];
    abstainerRows: Array<{ alias: string; reason: string }>;
    weightByHash: Map<string, number>;
    totalWeight: number;
    now: Date;
    /** 'adopted' | 'already-current' | 'fetch-failed' | 'no-majority' */
    adoptionOutcome?: string;
  } | null = null;

  /**
   * Hash-first federation discovery — called after loadDevFund() has populated
   * coordinator.info for every coordinator (zero new requests in the common case).
   *
   * Phase A: read coordinator.info.federation_hash from already-fetched info.
   * Phase B: seniority-weighted vote — strict majority (>50% of total weight).
   *          Dates are sourced only from the client's own trusted data:
   *          (1) bundled seed, (2) persisted join-date ledger.
   *          On indecision, the current trusted document is kept unchanged.
   * Phase C: compare winner hash against the bundled seed hash.
   *          If equal → apply defaultFederation directly (no fetch, immune to manifest corruption).
   *          If different → fetch /api/federation/ from coordinators that voted for the winner
   *          (using coord.url, not raw onion) until one verifies; on failure, keep current list.
   */
  refreshFederationList = async (): Promise<void> => {
    // Phase A: collect votes from all coordinators' already-loaded info.
    // Coordinators without federation_hash (older versions) simply abstain.
    const votes: CoordVote[] = [];
    // All voters per hash (not just the first) so Phase C can retry on failure.
    const coordsByHash = new Map<string, Coordinator[]>();
    const abstainerRows: Array<{ alias: string; reason: string }> = [];

    for (const coord of Object.values(this.coordinators)) {
      const h = (coord.info as Record<string, unknown> | undefined)?.federation_hash;
      if (typeof h === 'string' && h.length === 64) {
        votes.push({ alias: coord.shortAlias, hash: h });
        const existing = coordsByHash.get(h) ?? [];
        existing.push(coord);
        coordsByHash.set(h, existing);
      } else {
        abstainerRows.push({
          alias: coord.shortAlias,
          reason: coord.info === undefined ? 'info not loaded' : 'no federation_hash',
        });
      }
    }

    // Load the client's own join-date ledger (persisted by this method on
    // successful adoption of a newcomer coordinator).
    let joinDates: Record<string, string> = {};
    try {
      const stored = await systemClient.getItem('federation_join_dates');
      if (stored) joinDates = JSON.parse(stored) as Record<string, string>;
    } catch {
      // Corrupted ledger — start fresh; seniority for all unknown = WEIGHT_MIN (safe)
    }

    // Phase B: seniority-weighted vote.
    // Use the bundled seed as the trusted doc for weight computation: established
    // dates are read only from the seed (or the client-side join-date ledger for
    // newcomers), never from any coordinator-served document.
    const seedDoc = defaultFederation as unknown as FederationDoc;
    const { winnerHash, weightByHash, totalWeight, voterRows, now } = voteOnHashes(votes, {
      trustedDoc: seedDoc,
      joinDates,
    });

    // Snapshot the exact ballot inputs so logConsensus() can print them
    // faithfully, even after Phase C has updated liveFedDoc.
    this.lastVoteTally = { voterRows, abstainerRows, weightByHash, totalWeight, now };

    // Always record the majority result (or null) so the UI can highlight the
    // winning hash even when no document update is required.
    this.majorityFederationHash = winnerHash;
    this.triggerHook('onFederationUpdate');

    // No strict majority reached — keep the current trusted document as-is.
    // "No decision" is always the safe direction.
    if (winnerHash === null) {
      if (this.lastVoteTally) this.lastVoteTally.adoptionOutcome = 'no-majority';
      this.logConsensus();
      this.federationListLoaded = true;
      this.triggerHook('onFederationUpdate');
      return;
    }

    // Phase C: resolve the winner document.
    //
    // The seed (bundled defaultFederation) is always the primary reference:
    // - If the winner hash matches the seed hash → use defaultFederation directly,
    //   no network fetch needed. This is the common steady-state case and is immune
    //   to any corruption in the persisted manifest.
    // - If the winner hash differs from the seed → fetch /api/federation/ from a
    //   coordinator that voted for the winner and verify the hash locally.
    //   Use coord.url (origin-aware: nodeapp proxy / clearnet / onion) — the same
    //   URL every other request uses — so the fetch works regardless of client type.
    //   Try every voter of the winning hash in order until one succeeds.
    const seedHash = await getSeedHash();

    let winnerDoc: FederationDoc | null = null;

    if (winnerHash === seedHash) {
      // Winner is the bundled seed — use it directly, no fetch required.
      if (this.lastVoteTally) this.lastVoteTally.adoptionOutcome = 'already-current';
      console.log(
        `[FederationDiscovery] = winner matches seed (${winnerHash.slice(0, 8)}…) — applying static bundle`,
      );
      winnerDoc = seedDoc;
    } else {
      // Winner differs from seed — fetch from a voting coordinator.
      const winnerCoords = coordsByHash.get(winnerHash) ?? [];
      for (const winnerCoord of winnerCoords) {
        const baseUrl = winnerCoord.url.replace(/\/$/, '');
        if (baseUrl) {
          winnerDoc = await fetchAndVerifyDoc(baseUrl, winnerHash);
          if (winnerDoc) break;
        }
      }

      if (!winnerDoc) {
        if (this.lastVoteTally) this.lastVoteTally.adoptionOutcome = 'fetch-failed';
        console.warn(
          `[FederationDiscovery] ⚠️ winner ${winnerHash.slice(0, 8)}… could not be fetched/verified from any voter — keeping current doc`,
        );
        this.logConsensus();
        this.federationListLoaded = true;
        this.triggerHook('onFederationUpdate');
        return;
      }
    }

    // Stamp today's date into the join-date ledger for any alias that is absent
    // from the bundled seed (newcomer coordinator). This is the ONLY place that
    // writes to the ledger, ensuring the client's own observation of first-seen
    // date is used for seniority — not any date claimed by the coordinator.
    // (seedDoc is already declared above in Phase B.)
    const today = new Date().toISOString().slice(0, 10); // 'YYYY-MM-DD'
    let ledgerDirty = false;
    for (const alias of Object.keys(winnerDoc)) {
      if (!seedDoc[alias] && !joinDates[alias]) {
        joinDates[alias] = today;
        ledgerDirty = true;
      }
    }
    if (ledgerDirty) {
      systemClient.setItem('federation_join_dates', JSON.stringify(joinDates));
    }

    const finalDoc: FederationDoc = winnerDoc;

    // Update the static in-memory source of truth so all consumers read from here.
    Federation.liveFedDoc = finalDoc;
    // Persist for cold starts (Android / offline).
    systemClient.setItem('federation_manifest', JSON.stringify(finalDoc));

    // Diff: which aliases are added, kept, or removed
    const currentAliases = new Set(Object.keys(this.coordinators));
    const winnerAliases = new Set(Object.keys(finalDoc));

    const added = [...winnerAliases].filter((a) => !currentAliases.has(a));
    const removed = [...currentAliases].filter((a) => !winnerAliases.has(a));

    // Check for identity changes in coordinators that are in both sets.
    // An identity change (onion, nostrHexPubkey, clearnet, i2p) does not
    // change the alias set but does change the hash — we must update the
    // live Coordinator instances so URL resolution and Nostr routing stay
    // correct, then propagate to RoboPool / nostr.ts.
    const identityFields = ['nostrHexPubkey', 'mainnet', 'testnet'] as const;
    const identityChanged: string[] = [];
    for (const alias of [...winnerAliases].filter((a) => currentAliases.has(a))) {
      const winnerEntry = finalDoc[alias] as Record<string, unknown>;
      const existing = this.coordinators[alias];
      const hasChange = identityFields.some((field) => {
        const newVal = winnerEntry[field];
        const oldVal = (existing as unknown as Record<string, unknown>)[field];
        return JSON.stringify(newVal) !== JSON.stringify(oldVal);
      });
      if (hasChange) identityChanged.push(alias);
    }

    // No actual change at all — nothing to do beyond cache write above
    if (added.length === 0 && removed.length === 0 && identityChanged.length === 0) {
      this.federationListLoaded = true;
      this.triggerHook('onFederationUpdate');
      return;
    }

    // Update existing coordinators whose identity fields changed by replacing
    // them with fresh instances (avoids manual field patching).
    identityChanged.forEach((alias) => {
      const value = finalDoc[alias];
      const updated = new Coordinator(
        value as unknown as CoordinatorConfig,
        this.origin,
        this.settings,
        this.hostUrl,
      );
      updated.federated = true;
      this.coordinators[alias] = updated;
    });

    // Remove dropped coordinators
    removed.forEach((alias) => {
      this.coordinators[alias]?.disable();
      delete this.coordinators[alias];
    });

    // Add new coordinators (preserve existing ones intact to avoid resetting their state)
    added.forEach((alias) => {
      const value = finalDoc[alias];
      const newCoord = new Coordinator(
        value as unknown as CoordinatorConfig,
        this.origin,
        this.settings,
        this.hostUrl,
      );
      newCoord.federated = true;
      this.coordinators[alias] = newCoord;
    });

    // Re-sort according to lottery (preserving existing coordinator instances)
    const discoveryDevfundOverrides: Record<string, number> = {};
    Object.entries(finalDoc).forEach(([alias, entry]) => {
      if ((entry as Record<string, unknown>)._votedIn) discoveryDevfundOverrides[alias] = 0;
    });
    const sorted: Record<string, Coordinator> = {};
    federationLottery(
      finalDoc as unknown as Record<string, CoordinatorSeed>,
      discoveryDevfundOverrides,
    ).forEach((alias) => {
      if (this.coordinators[alias]) sorted[alias] = this.coordinators[alias];
    });
    this.coordinators = sorted;

    this.exchange.totalCoordinators = Object.keys(this.coordinators).length;

    // Register only the newly added coordinators
    added.forEach((alias) => {
      if (alias !== 'local' || this.hostUrl.includes('127.0.0.1:8000')) {
        this.addCoordinator(this.origin, this.settings, this.hostUrl, this.coordinators[alias]);
      }
    });

    // Update relay pool
    Object.values(this.coordinators).forEach((c) =>
      c.updateUrl(this.origin, this.settings, this.hostUrl),
    );
    this.roboPool.updateRelays(this.hostUrl, Object.values(this.coordinators));

    // Push live coordinator list into the modules that still need it for
    // Nostr event routing (nostr.ts) and REQ author filters (RoboPool).
    const liveCoordEntries = Object.values(this.coordinators).map((c) => ({
      shortAlias: c.shortAlias,
      nostrHexPubkey: c.nostrHexPubkey,
      federated: c.federated,
    }));
    setLiveCoordinators(liveCoordEntries);
    setFederationPubkeys(liveCoordEntries.map((c) => c.nostrHexPubkey).filter(Boolean));

    // Update Android notification relay list
    if (this.settings.client === 'mobile') {
      const federationUrls = Object.values(this.coordinators)
        .map((c) => c.getRelayUrl())
        .filter(Boolean);
      const federationPubKeys = Object.values(this.coordinators).map((c) => c.nostrHexPubkey);
      systemClient.setItem('federation_relays', JSON.stringify(federationUrls));
      systemClient.setItem('federation_pubkeys', JSON.stringify(federationPubKeys));
    }

    this.coordinatorsRatingInit();
    this.updateEnabledCoordinators();

    // Reload the order book so it reflects the new coordinator set.
    // Without this, removed coordinators' orders linger in the book and
    // newly added coordinators contribute nothing until the user navigates away.
    // In nostr mode roboPool.updateRelays() already closed the sockets, so the
    // active subscribeBook REQ is gone — we must clear the book and re-subscribe.
    if (this.connection === 'nostr') {
      this.book = {};
      this.loadBookNostr(false);
    } else if (this.connection === 'api') {
      void this.loadBook();
    }

    // New coordinators also need their info fetched (limits, fees, federation_hash)
    // so they can participate in the next discovery vote and appear correctly in the UI.
    added.forEach((alias) => {
      this.coordinators[alias]?.loadInfo(() => {
        this.onCoordinatorSaved();
      });
    });

    if (this.lastVoteTally) this.lastVoteTally.adoptionOutcome = 'adopted';
    this.logConsensus();

    this.federationListLoaded = true;
    this.triggerHook('onFederationUpdate');
  };

  coordinatorsRatingInit = (): void => {
    Object.values(this.coordinators).forEach((coord) => {
      if (coord.nostrHexPubkey && !this.ratings[coord.nostrHexPubkey]) {
        this.ratings[coord.nostrHexPubkey] = {};
      }
    });
  };

  setConnection = (
    origin: Origin,
    settings: Settings,
    hostUrl: string,
    coordinator: string,
  ): void => {
    this.connectionGeneration += 1;
    this.connection = settings.connection;
    this.loading = true;
    this.federationListLoaded = false;
    this.book = {};
    this.exchange.loadingCache = this.roboPool.relays.length;
    this.network = settings.network ?? 'mainnet';

    const coordinators = Object.values(this.coordinators);
    coordinators.forEach((c) => {
      c.updateUrl(origin, settings, hostUrl);
      // Clear stale data from the previous connection so old values don't vote
      c.info = undefined;
      c.limits = {};
    });
    this.roboPool.updateRelays(hostUrl, Object.values(this.coordinators));

    // Nostr book loading is fully independent — start immediately.
    if (this.connection === 'nostr') {
      this.loadBookNostr(coordinator !== 'any');
    }

    // Generic coordinator data + DevFund + discovery run in sequence,
    // in parallel with Nostr relay loading above.
    void this.loadCoordinatorData();
  };

  refreshBookHosts: (robosatsOnly: boolean) => void = (robosatsOnly) => {
    if (this.connection === 'nostr') {
      this.loadBookNostr(robosatsOnly);
    }
  };

  loadBookNostr = (robosatsOnly: boolean): void => {
    this.roboPool.subscribeBook(robosatsOnly, {
      onevent: (event) => {
        const { dTag, publicOrder, network } = eventToPublicOrder(event);
        if (publicOrder && network == this.network) {
          this.book[dTag] = publicOrder;
        } else {
          this.book[dTag] = undefined;
        }
      },
      oneose: () => {
        this.exchange.loadingCache = this.exchange.loadingCache - 1;
        this.updateExchange();
        this.triggerHook('onFederationUpdate');
      },
    });
  };

  loadRatings = (verify: boolean = false): void => {
    if (this.ratingsLoaded && !verify) {
      return;
    }

    this.coordinatorsRatingInit();

    if (verify) {
      this.ratings = {};
      this.coordinatorsRatingInit();
    }

    if (!verify) {
      this.ratingsLoaded = true;
    }

    const subscriptionId = this.roboPool.subscribeRatings({
      onevent: (event) => {
        const coordinatorPubKey = event.tags.find((t) => t[0] === 'p')?.[1];
        const verified = verify ? verifyCoordinatorToken(event) : true;

        if (verified && coordinatorPubKey) {
          const rating = event.tags.find((t) => t[0] === 'rating')?.[1];
          if (rating) {
            if (!this.ratings[coordinatorPubKey]) {
              this.ratings[coordinatorPubKey] = {};
            }
            this.ratings[coordinatorPubKey][event.pubkey] = parseFloat(rating);
            this.triggerHook('onFederationUpdate');
          }
        }
      },
      oneose: () => {
        this.roboPool.closeSubscription(subscriptionId);
        this.triggerHook('onFederationUpdate');
      },
    });
  };

  loadDevFund = async (): Promise<void> => {
    const overrides = await fetchDevFundProfiles(this);

    const feeOverrides: Record<string, number> = {};
    Object.entries(this.coordinators).forEach(([alias, coor]) => {
      if (typeof coor.info?.maker_fee === 'number' && typeof coor.info?.taker_fee === 'number') {
        feeOverrides[alias] = coor.info.maker_fee + coor.info.taker_fee;
      }
    });

    if (Object.keys(overrides).length > 0) {
      Object.entries(overrides).forEach(([alias, pct]) => {
        if (this.coordinators[alias]) this.coordinators[alias].badges.donatesToDevFund = pct;
      });

      const order = federationLottery(defaultFederation, overrides, feeOverrides);
      const ordered = new Set(order);
      const sorted = [
        ...order.filter((alias) => this.coordinators[alias]),
        ...Object.keys(this.coordinators).filter((alias) => !ordered.has(alias)),
      ];
      this.coordinators = Object.fromEntries(
        sorted.map((alias) => [alias, this.coordinators[alias]]),
      );
    }

    this.devFundLoaded = true;
    this.triggerHook('onFederationUpdate');
  };

  addCoordinator = (
    origin: Origin,
    settings: Settings,
    hostUrl: string,
    attributes: object,
  ): void => {
    const value = {
      ...coordinatorDefaultValues,
      ...attributes,
    } as unknown as CoordinatorConfig;
    this.coordinators[value.shortAlias] = new Coordinator(value, origin, settings, hostUrl);

    if (this.coordinators[value.shortAlias].nostrHexPubkey) {
      if (!this.ratings[this.coordinators[value.shortAlias].nostrHexPubkey]) {
        this.ratings[this.coordinators[value.shortAlias].nostrHexPubkey] = {};
      }
    }

    this.exchange.totalCoordinators = Object.keys(this.coordinators).length;
    this.updateEnabledCoordinators();
    this.triggerHook('onFederationUpdate');
  };

  // Hooks
  registerHook = (hookName: FederationHooks, fn: () => void): void => {
    this.hooks[hookName].push(fn);
  };

  triggerHook = (hookName: FederationHooks): void => {
    this.hooks[hookName]?.forEach((fn) => {
      fn();
    });
  };

  onCoordinatorSaved = (): void => {
    if (this.connection === 'api') {
      this.book = Object.values(this.coordinators).reduce<Record<string, PublicOrder>>(
        (book, coordinator) => {
          return { ...book, ...coordinator.book };
        },
        {},
      );
    }
    this.exchange.loadingCoordinators =
      this.exchange.loadingCoordinators < 1 ? 0 : this.exchange.loadingCoordinators - 1;
    this.loading = this.exchange.loadingCoordinators > 0;
    this.updateExchange();
    this.triggerHook('onFederationUpdate');
  };

  private _loadInfoPromise?: Promise<void>;

  loadInfo = (): Promise<void> => {
    if (this._loadInfoPromise) return this._loadInfoPromise;

    this.exchange.info = {
      num_public_buy_orders: 0,
      num_public_sell_orders: 0,
      book_liquidity: 0,
      active_robots_today: 0,
      last_day_nonkyc_btc_premium: 0,
      last_day_volume: 0,
      lifetime_volume: 0,
      version: { major: 0, minor: 0, patch: 0 },
    };
    this.loading = true;
    this.exchange.onlineCoordinators = 0;
    this.exchange.loadingCoordinators = Object.keys(this.coordinators).length;
    this.updateEnabledCoordinators();

    this._loadInfoPromise = Promise.allSettled(
      Object.values(this.coordinators).map((coor) =>
        withTimeout(
          coor.loadInfo(() => {
            this.exchange.onlineCoordinators = this.exchange.onlineCoordinators + 1;
            this.onCoordinatorSaved();
          }),
        ),
      ),
    ).then(() => {
      // Force-drain the counter so the loading spinner always clears even when
      // some coordinators timed out without firing their onDataLoad callback.
      this.exchange.loadingCoordinators = 0;
      this.loading = false;
      this.updateExchange();
      this._loadInfoPromise = undefined;
    });

    return this._loadInfoPromise;
  };

  private _loadBookPromise?: Promise<void>;

  loadBook = (): Promise<void> => {
    if (this.connection !== 'api') return Promise.resolve();
    if (this._loadBookPromise) return this._loadBookPromise;

    this.book = {};
    this.loading = true;
    this.exchange.onlineCoordinators = 0;
    this.exchange.loadingCoordinators = Object.keys(this.coordinators).length;
    this.triggerHook('onFederationUpdate');

    this._loadBookPromise = Promise.allSettled(
      Object.values(this.coordinators).map((coor) =>
        withTimeout(
          coor.loadBook(() => {
            this.exchange.onlineCoordinators = this.exchange.onlineCoordinators + 1;
            this.onCoordinatorSaved();
          }),
        ),
      ),
    ).then(() => {
      // Force-drain the counter so the loading spinner always clears even when
      // some coordinators timed out without firing their onDataLoad callback.
      this.exchange.loadingCoordinators = 0;
      this.loading = false;
      this.updateExchange();
      this._loadBookPromise = undefined;
    });

    return this._loadBookPromise;
  };

  loadLimits = (): Promise<void> => {
    return Promise.allSettled(
      Object.values(this.coordinators).map((coor) => withTimeout(coor.loadLimits())),
    ).then(() => {});
  };

  /**
   * Connection generation counter — incremented every time setConnection() runs.
   * loadCoordinatorData() captures the generation at start; if it changes before
   * the promise settles (user switched network/connection), the stale completion
   * is silently discarded and discovery is not triggered.
   */
  private connectionGeneration = 0;

  /**
   * Generic startup initialization: fetches info and limits for every coordinator
   * in parallel (and API book in API mode). Nostr relay/book loading is deliberately
   * excluded — it runs independently via setConnection(). Only after this settles
   * should loadDevFund() and refreshFederationList() be called.
   *
   * Discovery runs as soon as all *reachable* coordinators have responded
   * (loadingCoordinators reaches 0 via onCoordinatorSaved), without waiting
   * for the full 15 s withTimeout wall on unreachable ones.
   * The withTimeout batch continues in the background and still force-drains
   * the counter when it eventually settles.
   */
  loadCoordinatorData = async (): Promise<void> => {
    const generation = this.connectionGeneration;

    // Resolve as soon as every coordinator that is going to respond has done so
    // (loadingCoordinators == 0), rather than waiting for the 15 s withTimeout
    // wall. The full batch still runs in the background.
    const allRespondedOrTimedOut = new Promise<void>((resolve) => {
      // If all coordinators are already done (e.g. zero coordinators), resolve immediately.
      if (this.exchange.loadingCoordinators === 0) {
        resolve();
        return;
      }
      const unsubscribe = (): void => {
        this.hooks.onFederationUpdate = this.hooks.onFederationUpdate.filter((fn) => fn !== check);
      };
      const check = (): void => {
        if (this.exchange.loadingCoordinators === 0) {
          unsubscribe();
          resolve();
        }
      };
      this.hooks.onFederationUpdate.push(check);
    });

    // Start all loading in parallel; await the "all responded" signal.
    this.loadInfo();
    this.loadLimits();
    if (this.connection === 'api') this.loadBook();
    await allRespondedOrTimedOut;

    // If the connection changed while we were loading, discard this stale completion.
    if (this.connectionGeneration !== generation) return;

    await this.loadDevFund();
    await this.refreshFederationList();
  };

  updateExchange = (): void => {
    this.exchange.info = updateExchangeInfo(this);
    this.triggerHook('onFederationUpdate');
  };

  getLimits = (shortAlias?: string): LimitList => {
    let limits = shortAlias ? this.coordinators[shortAlias]?.limits || {} : {};
    if (Object.keys(limits).length === 0) {
      limits = this.getCoordinators()[0]?.limits;
    }
    return limits;
  };

  // Coordinators
  getCoordinators = (): Coordinator[] => {
    return Object.values(this.coordinators);
  };

  getCoordinatorsAlias = (): string[] => {
    return Object.keys(this.coordinators);
  };

  getCoordinator = (shortAlias: string): Coordinator | undefined => {
    return this.coordinators[shortAlias];
  };

  disableCoordinator = (shortAlias: string): void => {
    this.coordinators[shortAlias].disable();
    this.updateEnabledCoordinators();
    this.triggerHook('onFederationUpdate');
  };

  enableCoordinator = (shortAlias: string): void => {
    this.coordinators[shortAlias].enable(() => {
      this.updateEnabledCoordinators();
      this.triggerHook('onFederationUpdate');
    });
  };

  updateEnabledCoordinators = (): void => {
    this.exchange.enabledCoordinators = Object.values(this.coordinators).filter(
      (c) => c.enabled,
    ).length;
    this.triggerHook('onFederationUpdate');
  };

  private logConsensus = (): void => {
    // Always print the snapshot captured at vote time — never recompute from
    // the current liveFedDoc, which may already have been swapped by Phase C
    // adoption (that would produce misleading post-hoc weights).
    if (!this.lastVoteTally) return;

    const { voterRows, abstainerRows, weightByHash, totalWeight, now, adoptionOutcome } =
      this.lastVoteTally;
    const winnerHash = this.majorityFederationHash;

    const hashRows = Array.from(weightByHash.entries()).map(([h, w]) => ({
      hash: h.slice(0, 8) + '…',
      weight: w,
      pct: totalWeight > 0 ? ((w / totalWeight) * 100).toFixed(1) + '%' : '—',
      winner: h === winnerHash,
    }));

    console.group(`[FederationDiscovery] consensus check (ballot at ${now.toISOString()})`);
    console.table(voterRows);
    if (abstainerRows.length > 0) console.table(abstainerRows);
    console.table(hashRows);

    let resultLine: string;
    if (winnerHash === null) {
      resultLine = `❌ no majority — keeping current doc (${voterRows.length} voter(s), quorum needs ≥2)`;
    } else {
      const weightStr = `${weightByHash.get(winnerHash)}/${totalWeight} weight`;
      switch (adoptionOutcome) {
        case 'adopted':
          resultLine = `✅ adopted new doc: ${winnerHash.slice(0, 8)}… (${weightStr})`;
          break;
        case 'already-current':
          resultLine = `= winner ${winnerHash.slice(0, 8)}… already current (${weightStr}) — no update needed`;
          break;
        case 'fetch-failed':
          resultLine = `⚠️ winner ${winnerHash.slice(0, 8)}… (${weightStr}) — fetch/verify failed, keeping current doc`;
          break;
        default:
          resultLine = `✅ winner: ${winnerHash.slice(0, 8)}… (${weightStr})`;
      }
    }
    console.log(resultLine);
    console.groupEnd();
  };
}

export default Federation;
