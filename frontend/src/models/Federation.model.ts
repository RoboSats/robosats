import {
  Coordinator,
  type Exchange,
  type Garage,
  type Origin,
  type PublicOrder,
  type Settings,
  defaultExchange,
} from '.';
import defaultFederation from '../../static/federation.json';
import { getHost } from '../utils';
import { updateExchangeInfo } from './Exchange.model';

type FederationHooks = 'onCoordinatorUpdate' | 'onFederationUpdate';

export class Federation {
  constructor(origin: Origin, settings: Settings, hostUrl: string) {
    this.coordinators = Object.entries(defaultFederation).reduce(
      (acc: Record<string, Coordinator>, [key, value]: [string, any]) => {
        if (getHost() !== '127.0.0.1:8000' && key === 'local') {
          // Do not add `Local Dev` unless it is running on localhost
          return acc;
        } else {
          acc[key] = new Coordinator(value, origin, settings, hostUrl);
          return acc;
        }
      },
      {},
    );
    this.exchange = {
      ...defaultExchange,
      totalCoordinators: Object.keys(this.coordinators).length,
    };
    this.book = [];
    this.hooks = {
      onCoordinatorUpdate: [],
      onFederationUpdate: [],
    };

    this.loading = true;
    this.exchange.loadingCoordinators = Object.keys(this.coordinators).length;

    const host = getHost();
    const url = `${window.location.protocol}//${host}`;
    const tesnetHost = Object.values(this.coordinators).find((coor) => {
      return Object.values(coor.testnet).includes(url);
    });
    if (tesnetHost) settings.network = 'testnet';
  }

  public coordinators: Record<string, Coordinator>;
  public exchange: Exchange;
  public book: PublicOrder[];
  public loading: boolean;

  public hooks: Record<FederationHooks, Array<() => void>>;

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
    this.book = Object.values(this.coordinators).reduce<PublicOrder[]>((array, coordinator) => {
      return [...array, ...coordinator.book];
    }, []);
    this.triggerHook('onCoordinatorUpdate');
    this.exchange.loadingCoordinators =
      this.exchange.loadingCoordinators < 1 ? 0 : this.exchange.loadingCoordinators - 1;
    this.loading = this.exchange.loadingCoordinators > 0;
    this.updateExchange();
    this.triggerHook('onFederationUpdate');
  };

  updateUrl = async (origin: Origin, settings: Settings, hostUrl: string): Promise<void> => {
    for (const coor of Object.values(this.coordinators)) {
      coor.updateUrl(origin, settings, hostUrl);
    }
  };

  update = async (): Promise<void> => {
    this.loading = true;
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
    this.exchange.onlineCoordinators = 0;
    this.exchange.loadingCoordinators = Object.keys(this.coordinators).length;
    this.updateEnabledCoordinators();
    for (const coor of Object.values(this.coordinators)) {
      coor.update(() => {
        this.exchange.onlineCoordinators = this.exchange.onlineCoordinators + 1;
        this.onCoordinatorSaved();
      });
    }
  };

  updateBook = async (): Promise<void> => {
    this.loading = true;
    this.book = [];
    this.triggerHook('onCoordinatorUpdate');
    this.exchange.loadingCoordinators = Object.keys(this.coordinators).length;
    for (const coor of Object.values(this.coordinators)) {
      coor.updateBook(() => {
        this.onCoordinatorSaved();
      });
    }
  };

  updateExchange = (): void => {
    this.exchange.info = updateExchangeInfo(this);
    this.triggerHook('onFederationUpdate');
  };

  // Fetchs
  fetchRobot = async (garage: Garage, token: string): Promise<void> => {
    Object.values(this.coordinators).forEach((coor) => {
      void coor.fetchRobot(garage, token);
    });
  };

  // Coordinators
  getCoordinator = (shortAlias: string): Coordinator => {
    return this.coordinators[shortAlias];
  };

  disableCoordinator = (shortAlias: string): void => {
    this.coordinators[shortAlias].disable();
    this.updateEnabledCoordinators();
    this.triggerHook('onCoordinatorUpdate');
  };

  enableCoordinator = (shortAlias: string): void => {
    this.coordinators[shortAlias].enable(() => {
      this.updateEnabledCoordinators();
      this.triggerHook('onCoordinatorUpdate');
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
