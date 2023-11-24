import {
  Coordinator,
  type Exchange,
  type Garage,
  type Origin,
  type PublicOrder,
  type Settings,
  defaultExchange,
  type Order,
} from '.';
import defaultFederation from '../../static/federation.json';
import { updateExchangeInfo } from './Exchange.model';

type FederationHooks = 'onCoordinatorUpdate' | 'onFederationReady';

export class Federation {
  constructor() {
    this.coordinators = Object.entries(defaultFederation).reduce(
      (acc: Record<string, Coordinator>, [key, value]: [string, any]) => {
        acc[key] = new Coordinator(value);
        return acc;
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
      onFederationReady: [],
    };
    this.loading = true;
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

  onCoordinatorSaved = (shortAlias: string): void => {
    this.book = [...this.book, ...this.getCoordinator(shortAlias).book];
    this.loading = false;
    this.triggerHook('onCoordinatorUpdate');
    if (Object.values(this.coordinators).every((coor) => coor.isUpdated())) {
      this.updateExchange();
      this.triggerHook('onFederationReady');
    }
  };

  // Setup
  start = async (origin: Origin, settings: Settings, hostUrl: string): Promise<void> => {
    const onCoordinatorStarted = (shortAlias: string): void => {
      this.exchange.onlineCoordinators = this.exchange.onlineCoordinators + 1;
      this.onCoordinatorSaved(shortAlias);
    };
    this.loading = true;
    // Object.values(this.coordinators).forEach(async (coor) => {
    for (const coor of Object.values(this.coordinators)) {
      await coor.start(origin, settings, hostUrl, onCoordinatorStarted);
    }
  };

  update = async (): Promise<void> => {
    this.loading = false;
    // Object.values(this.coordinators).forEach(async (coor) => {
    for (const coor of Object.values(this.coordinators)) {
      await coor.update(() => {
        this.onCoordinatorSaved(coor.shortAlias);
      });
    }
  };

  updateExchange = (): void => {
    this.exchange.info = updateExchangeInfo(this);
  };

  // Fetchs
  fetchRobot = async (garage: Garage, token: string): Promise<void> => {
    Object.values(this.coordinators).forEach((coor) => {
      void coor.fecthRobot(garage, token);
    });
  };

  // Coordinators
  getCoordinator = (shortAlias: string): Coordinator => {
    return this.coordinators[shortAlias];
  };

  disableCoordinator = (shortAlias: string): void => {
    this.coordinators[shortAlias].disable();
    this.triggerHook('onCoordinatorUpdate');
  };

  enableCoordinator = (shortAlias: string): void => {
    this.coordinators[shortAlias].enable(() => {
      this.triggerHook('onCoordinatorUpdate');
    });
  };
}

export default Federation;
