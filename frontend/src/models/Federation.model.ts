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
  getSeedHash,
  voteOnHashes,
  fetchAndVerifyDoc,
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
      const federationUrls = Object.values(this.coordinators).map((c) => c.getRelayUrl());
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
   */
  public static liveFedDoc: Record<string, Record<string, unknown>> =
    defaultFederation as unknown as Record<string, Record<string, unknown>>;

  private coordinators: Record<string, Coordinator>;
  public exchange: Exchange;
  public book: Record<string, PublicOrder | undefined>;
  public ratings: Record<string, Record<string, number>>;
  private ratingsLoaded: boolean;
  public loading: boolean;
  public devFundLoaded: boolean = false;
  public connection: 'api' | 'nostr' | null;
  public network: 'testnet' | 'mainnet';

  public hooks: Record<FederationHooks, Array<() => void>>;

  public roboPool: RoboPool;

  /**
   * Hash-first federation discovery — called after loadDevFund() has populated
   * coordinator.info for every coordinator (zero new requests in the common case).
   *
   * Phase A: read coordinator.info.federation_hash from already-fetched info.
   * Phase B: vote on hashes with voteOnHashes().
   * Phase C: only if the winning hash != seed hash, fetch /api/federation/ from
   *          ONE coordinator that voted for the winner and verify its hash locally.
   */
  refreshFederationList = async (): Promise<void> => {
    // Phase A: collect hashes from all coordinators' already-loaded info.
    // Coordinators without federation_hash (older versions) simply abstain.
    const seedHash = await getSeedHash();
    const coordHashes: string[] = [];
    const coordByHash = new Map<string, Coordinator>(); // hash → first coordinator reporting it

    for (const coord of Object.values(this.coordinators)) {
      const h = (coord.info as Record<string, unknown> | undefined)?.federation_hash;
      if (typeof h === 'string' && h.length === 64) {
        coordHashes.push(h);
        if (!coordByHash.has(h)) coordByHash.set(h, coord);
      }
    }

    // Phase B: vote
    const { winnerHash, usedSeed } = voteOnHashes(coordHashes, seedHash);

    // Phase C: fetch the full document only when the winner differs from the seed
    let winnerDoc: FederationDoc | null = null;
    if (!usedSeed) {
      const winnerCoord = coordByHash.get(winnerHash);
      if (winnerCoord) {
        const net = this.network ?? 'mainnet';
        const onion =
          (winnerCoord[net] as unknown as Record<string, string> | undefined)?.onion ?? '';
        const baseUrl = onion.replace(/\/$/, '');
        if (baseUrl) winnerDoc = await fetchAndVerifyDoc(baseUrl, winnerHash);
      }
    }

    // If the vote said seed or the fetch+verify failed, keep the seed
    const finalDoc: FederationDoc = winnerDoc ?? (defaultFederation as unknown as FederationDoc);

    // Update the static in-memory source of truth so all consumers read from here.
    Federation.liveFedDoc = finalDoc;
    // Persist for cold starts (Android / offline).
    systemClient.setItem('federation_manifest', JSON.stringify(finalDoc));

    if (!winnerDoc) return; // seed won or fetch failed — no coordinator set change

    // Diff: which aliases are added, kept, or removed
    const currentAliases = new Set(Object.keys(this.coordinators));
    const winnerAliases = new Set(Object.keys(finalDoc));

    const added = [...winnerAliases].filter((a) => !currentAliases.has(a));
    const removed = [...currentAliases].filter((a) => !winnerAliases.has(a));

    // No actual change in coordinator set — nothing to do beyond cache write above
    if (added.length === 0 && removed.length === 0) return;

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
      const federationUrls = Object.values(this.coordinators).map((c) => c.getRelayUrl());
      const federationPubKeys = Object.values(this.coordinators).map((c) => c.nostrHexPubkey);
      systemClient.setItem('federation_relays', JSON.stringify(federationUrls));
      systemClient.setItem('federation_pubkeys', JSON.stringify(federationPubKeys));
    }

    this.coordinatorsRatingInit();
    this.updateEnabledCoordinators();
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
    this.connection = settings.connection;
    this.loading = true;
    this.book = {};
    this.exchange.loadingCache = this.roboPool.relays.length;
    this.network = settings.network ?? 'mainnet';

    const coordinators = Object.values(this.coordinators);
    coordinators.forEach((c) => c.updateUrl(origin, settings, hostUrl));
    this.roboPool.updateRelays(hostUrl, Object.values(this.coordinators));

    coordinators[0].loadLimits();

    if (this.connection === 'nostr') {
      this.loadBookNostr(coordinator !== 'any');
    } else {
      void this.loadBook();
    }
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
        this.loading = this.exchange.loadingCache > 0 && this.exchange.loadingCoordinators > 0;
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

    // federation_hash is now populated on every coordinator's info — run the
    // hash-first discovery. This is the only call site; zero extra requests
    // in the common case (hashes read from already-fetched /api/info/ data).
    void this.refreshFederationList();
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
    this.loading = this.exchange.loadingCache > 0 && this.exchange.loadingCoordinators > 0;
    this.updateExchange();
    this.triggerHook('onFederationUpdate');
  };

  loadInfo = async (): Promise<void> => {
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

    for (const coor of Object.values(this.coordinators)) {
      coor.loadInfo(() => {
        this.exchange.onlineCoordinators = this.exchange.onlineCoordinators + 1;
        this.onCoordinatorSaved();
      });
    }
  };

  loadBook = async (): Promise<void> => {
    if (this.connection !== 'api') return;

    this.book = {};
    this.loading = true;
    this.exchange.onlineCoordinators = 0;
    this.exchange.loadingCoordinators = Object.keys(this.coordinators).length;
    this.triggerHook('onFederationUpdate');
    for (const coor of Object.values(this.coordinators)) {
      coor.loadBook(() => {
        this.exchange.onlineCoordinators = this.exchange.onlineCoordinators + 1;
        this.onCoordinatorSaved();
      });
    }
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

  getCoordinator = (shortAlias: string): Coordinator => {
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
}

export default Federation;
