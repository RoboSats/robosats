import {
  createContext,
  type Dispatch,
  useEffect,
  useState,
  type SetStateAction,
  useMemo,
  useContext,
} from 'react';

import { type Coordinator, type Order, Federation } from '../models';

import { federationLottery } from '../utils';

import { AppContext, type UseAppStoreType } from './AppContext';
import { GarageContext, type UseGarageStoreType } from './GarageContext';

// Refresh delays (ms) according to Order status

// FIXME statusToDelay is never used. On order received, we should setDelay according to new received status.
// const statusToDelay = [
//   3000, // 'Waiting for maker bond'
//   35000, // 'Public'
//   180000, // 'Paused'
//   3000, // 'Waiting for taker bond'
//   999999, // 'Cancelled'
//   999999, // 'Expired'
//   8000, // 'Waiting for trade collateral and buyer invoice'
//   8000, // 'Waiting only for seller trade collateral'
//   8000, // 'Waiting only for buyer invoice'
//   10000, // 'Sending fiat - In chatroom'
//   10000, // 'Fiat sent - In chatroom'
//   100000, // 'In dispute'
//   999999, // 'Collaboratively cancelled'
//   10000, // 'Sending satoshis to buyer'
//   60000, // 'Sucessful trade'
//   30000, // 'Failed lightning network routing'
//   300000, // 'Wait for dispute resolution'
//   300000, // 'Maker lost dispute'
//   300000, // 'Taker lost dispute'
// ];

export interface fetchRobotProps {
  coordinator?: Coordinator;
  newKeys?: { encPrivKey: string; pubKey: string };
  newToken?: string;
  slot?: number;
  isRefresh?: boolean;
}

export interface CurrentOrder {
  shortAlias: string | null;
  id: number | null;
  order: Order | null;
}

export interface UseFederationStoreType {
  federation: Federation;
  sortedCoordinators: string[];
  focusedCoordinator: string | null;
  setFocusedCoordinator: Dispatch<SetStateAction<string>>;
  currentOrder: CurrentOrder;
  setCurrentOrder: Dispatch<SetStateAction<CurrentOrder>>;
  setDelay: Dispatch<SetStateAction<number>>;
  coordinatorUpdatedAt: string;
  federationUpdatedAt: string;
}

export const initialFederationContext: UseFederationStoreType = {
  federation: new Federation(),
  sortedCoordinators: [],
  focusedCoordinator: '',
  setFocusedCoordinator: () => {},
  currentOrder: { shortAlias: null, id: null, order: null },
  setCurrentOrder: () => {},
  setDelay: () => {},
  coordinatorUpdatedAt: '',
  federationUpdatedAt: '',
};

export const FederationContext = createContext<UseFederationStoreType>(initialFederationContext);

export const useFederationStore = (): UseFederationStoreType => {
  const { settings, page, origin, hostUrl, open, torStatus } =
    useContext<UseAppStoreType>(AppContext);
  const { setMaker, garage, robotUpdatedAt, badOrder } =
    useContext<UseGarageStoreType>(GarageContext);
  const [federation, setFederation] = useState(initialFederationContext.federation);
  const sortedCoordinators = useMemo(() => {
    const sortedCoordinators = federationLottery(federation);
    setMaker((maker) => {
      return { ...maker, coordinator: sortedCoordinators[0] };
    }); // default MakerForm coordinator is decided via sorted lottery
    return sortedCoordinators;
  }, []);
  const [coordinatorUpdatedAt, setCoordinatorUpdatedAt] = useState<string>(
    new Date().toISOString(),
  );
  const [federationUpdatedAt, setFederationUpdatedAt] = useState<string>(new Date().toISOString());

  const [focusedCoordinator, setFocusedCoordinator] = useState<string>(sortedCoordinators[0]);

  const [delay, setDelay] = useState<number>(60000);
  const [timer, setTimer] = useState<NodeJS.Timer | undefined>(() =>
    setInterval(() => null, delay),
  );
  const [currentOrder, setCurrentOrder] = useState<CurrentOrder>(
    initialFederationContext.currentOrder,
  );

  useEffect(() => {
    // On bitcoin network change we reset book, limits and federation info and fetch everything again
    setFederation(() => {
      const newFed = initialFederationContext.federation;
      newFed.registerHook('onFederationReady', () => {
        setCoordinatorUpdatedAt(new Date().toISOString());
      });
      newFed.registerHook('onCoordinatorUpdate', () => {
        setFederationUpdatedAt(new Date().toISOString());
      });
      void newFed.start(origin, settings, hostUrl);
      return newFed;
    });
  }, [settings.network, torStatus]);

  const fetchCurrentOrder = (): void => {
    if (currentOrder.id != null && (page === 'order' || badOrder === undefined)) {
      void federation.fetchOrder(currentOrder, garage.getRobot());
    }
  };

  // Fetch current order at load and in a loop
  useEffect(() => {
    fetchCurrentOrder();
  }, [currentOrder, page]);

  useEffect(() => {
    clearInterval(timer);
    setTimer(setInterval(fetchCurrentOrder, delay));
    return () => {
      clearInterval(timer);
    };
  }, [delay, currentOrder, page, badOrder]);

  useEffect(() => {
    const robot = garage.getRobot();

    if (robot !== null) {
      if (open.profile && robot?.avatarLoaded) {
        void federation.fetchRobot(garage, garage.currentSlot); // refresh/update existing robot
      } else if (
        !robot.avatarLoaded &&
        robot.token !== undefined &&
        robot.encPrivKey !== undefined &&
        robot.pubKey !== undefined
      ) {
        void federation.fetchRobot(garage, garage.currentSlot); // create new robot with existing token and keys (on network and coordinator change)
      }
    }
  }, [open.profile, hostUrl, robotUpdatedAt]);

  return {
    federation,
    sortedCoordinators,
    focusedCoordinator,
    setFocusedCoordinator,
    setDelay,
    currentOrder,
    setCurrentOrder,
    coordinatorUpdatedAt,
    federationUpdatedAt,
  };
};
