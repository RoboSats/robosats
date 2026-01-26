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
import { federationLottery, getHost } from '../utils';
import { coordinatorDefaultValues } from './Coordinator.model';
import { updateExchangeInfo } from './Exchange.model';
import eventToPublicOrder from '../utils/nostr';
import { verifyCoordinatorToken } from '../utils/nostr';
import RoboPool from '../services/RoboPool';
import { systemClient } from '../services/System';

type FederationHooks = 'onFederationUpdate';

export class Federation {
  constructor(origin: Origin, settings: Settings, hostUrl: string) {
    const coordinators = Object.entries(defaultFederation).reduce(
      (acc: Record<string, Coordinator>, [key, value]: [string, object]) => {
        acc[key] = new Coordinator(value, origin, settings, hostUrl);
        acc[key].federated = true;
        return acc;
      },
      {},
    );

    this.coordinators = {};
    federationLottery().forEach((alias) => {
      if (coordinators[alias]) this.coordinators[alias] = coordinators[alias];
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
    this.network = settings.network;
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
  }

  private coordinators: Record<string, Coordinator>;
  public exchange: Exchange;
  public book: Record<string, PublicOrder | undefined>;
  public ratings: Record<string, Record<string, number>>;
  private ratingsLoaded: boolean;
  public loading: boolean;
  public connection: 'api' | 'nostr' | null;
  public network: 'testnet' | 'mainnet';

  public hooks: Record<FederationHooks, Array<() => void>>;

  public roboPool: RoboPool;

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
    this.network = settings.network;

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

  addCoordinator = (
    origin: Origin,
    settings: Settings,
    hostUrl: string,
    attributes: object,
  ): void => {
    const value = {
      ...coordinatorDefaultValues,
      ...attributes,
    };
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
