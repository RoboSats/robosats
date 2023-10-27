import {
  Coordinator,
  Exchange,
  Garage,
  Origin,
  PublicOrder,
  Robot,
  Settings,
  defaultExchange,
} from '.';
import defaultFederation from '../../static/federation.json';
import { CurrentOrder } from '../contexts/FederationContext';
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

  public hooks: Record<FederationHooks, (() => void)[]>;

  // Hooks
  registerHook = (hookName: FederationHooks, fn: () => void): void => {
    this.hooks[hookName].push(fn);
  };

  triggerHook = (hookName: FederationHooks): void => {
    this.hooks[hookName]?.forEach((fn) => fn());
  };

  onCoordinatorSaved = (shortAlias: string) => {
    this.book = [...this.book, ...this.getCoordinator(shortAlias).book];
    this.loading = false;
    this.triggerHook('onCoordinatorUpdate');
    if (Object.values(this.coordinators).every((coor) => coor.isUpdated())) {
      this.updateExchange();
      this.triggerHook('onFederationReady');
    }
  };

  // Setup
  start = (origin: Origin, settings: Settings, hostUrl: string): void => {
    const onCoordinatorStarted = (shortAlias: string) => {
      this.exchange.onlineCoordinators = this.exchange.onlineCoordinators + 1;
      this.onCoordinatorSaved(shortAlias);
    };
    this.loading = true;
    Object.values(this.coordinators).forEach((coor) =>
      coor.start(origin, settings, hostUrl, onCoordinatorStarted),
    );
  };

  update = (): void => {
    this.loading = false;
    Object.values(this.coordinators).forEach((coor) =>
      coor.update(() => {
        this.onCoordinatorSaved(coor.shortAlias);
      }),
    );
  };

  updateExchange = () => {
    this.exchange.info = updateExchangeInfo(this);
  };

  // Fetchs
  fetchRobot = async (garage: Garage, slot: number): Promise<void> => {
    Object.values(this.coordinators).forEach((coor) => {
      coor.fecthRobot(garage, slot);
    });
  };

  fetchOrder = async (currentOrder: CurrentOrder, robot: Robot): Promise<CurrentOrder | null> => {
    if (currentOrder.shortAlias !== null) {
      const coordinator = this.coordinators[currentOrder.shortAlias];
      if (coordinator && currentOrder.id !== null) {
        const newOrber = await coordinator.fetchOrder(currentOrder.id, robot);

        return {
          ...currentOrder,
          order: newOrber,
        };
      }
    }
    return currentOrder;
  };

  //Coordinators
  getCoordinator = (shortAlias: string): Coordinator => {
    return this.coordinators[shortAlias];
  };

  disbaleCoordinator = (shortAlias: string) => {
    this.coordinators[shortAlias].disable();
  };

  enaleCoordinator = (shortAlias: string) => {
    this.coordinators[shortAlias].enable();
  };
}

export default Federation;
