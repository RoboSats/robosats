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
const statusToDelay = [
  3000, // 'Waiting for maker bond'
  35000, // 'Public'
  180000, // 'Paused'
  3000, // 'Waiting for taker bond'
  999999, // 'Cancelled'
  999999, // 'Expired'
  8000, // 'Waiting for trade collateral and buyer invoice'
  8000, // 'Waiting only for seller trade collateral'
  8000, // 'Waiting only for buyer invoice'
  10000, // 'Sending fiat - In chatroom'
  10000, // 'Fiat sent - In chatroom'
  100000, // 'In dispute'
  999999, // 'Collaboratively cancelled'
  10000, // 'Sending satoshis to buyer'
  60000, // 'Sucessful trade'
  30000, // 'Failed lightning network routing'
  300000, // 'Wait for dispute resolution'
  300000, // 'Maker lost dispute'
  300000, // 'Taker lost dispute'
];

export interface fetchRobotProps {
  coordinator?: Coordinator;
  newKeys?: { encPrivKey: string; pubKey: string };
  newToken?: string;
  slot?: number;
  isRefresh?: boolean;
}

export interface UseFederationStoreType {
  federation: Federation;
  sortedCoordinators: string[];
  setDelay: Dispatch<SetStateAction<number>>;
  coordinatorUpdatedAt: string;
  federationUpdatedAt: string;
}

export const initialFederationContext: UseFederationStoreType = {
  federation: new Federation(),
  sortedCoordinators: [],
  setDelay: () => {},
  coordinatorUpdatedAt: '',
  federationUpdatedAt: '',
};

export const FederationContext = createContext<UseFederationStoreType>(initialFederationContext);

export const useFederationStore = (): UseFederationStoreType => {
  const { settings, page, origin, hostUrl, open, torStatus } =
    useContext<UseAppStoreType>(AppContext);
  const { setMaker, garage, setBadOrder, robotUpdatedAt } =
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

  const [delay, setDelay] = useState<number>(5000);
  const [timer, setTimer] = useState<NodeJS.Timer | undefined>(() =>
    setInterval(() => null, delay),
  );

  useEffect(() => {
    // On bitcoin network change we reset book, limits and federation info and fetch everything again
    const newFed = initialFederationContext.federation;
    newFed.registerHook('onFederationReady', () => {
      setCoordinatorUpdatedAt(new Date().toISOString());
    });
    newFed.registerHook('onCoordinatorUpdate', () => {
      setFederationUpdatedAt(new Date().toISOString());
    });
    void newFed.start(origin, settings, hostUrl);
    setFederation(newFed);
  }, [settings.network, torStatus]);

  const onOrderReceived = (order: Order): void => {
    if (order?.bad_request) {
      setBadOrder(order.bad_request);
      setDelay(99999999);
      garage.updateOrder(null);
    }
    if (order?.id) {
      setDelay(
        order.status >= 0 && order.status <= 18
          ? page === 'order'
            ? statusToDelay[order.status]
            : statusToDelay[order.status] * 5 // If user is not looking at "order" tab, refresh less often.
          : 99999999,
      );
      garage.updateOrder(order);
      setBadOrder(undefined);
    }
  };

  const fetchCurrentOrder = (): void => {
    const activeSlot = garage.getSlot();
    const robot = activeSlot?.getRobot(activeSlot?.activeShortAlias ?? '');
    if (robot?.activeOrderId && activeSlot?.activeShortAlias) {
      const coordinator = federation.getCoordinator(activeSlot?.activeShortAlias ?? '');
      coordinator
        ?.fetchOrder(robot.activeOrderId, robot)
        .then((order) => {
          onOrderReceived(order as Order);
        })
        .finally(() => {
          setTimer(setTimeout(fetchCurrentOrder, delay));
        });
    } else {
      setTimer(setTimeout(fetchCurrentOrder, delay));
    }
  };

  useEffect(() => {
    clearInterval(timer);
    fetchCurrentOrder();
    return () => {
      clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    if (page === 'offers') void federation.updateBook();
  }, [page]);

  useEffect(() => {
    const slot = garage.getSlot();
    const robot = slot?.getRobot();

    if (robot && garage.currentSlot) {
      if (open.profile && Boolean(slot?.hashId) && slot?.token) {
        void federation.fetchRobot(garage, slot?.token); // refresh/update existing robot
      } else if (robot.token && robot.encPrivKey && robot.pubKey) {
        void federation.fetchRobot(garage, robot.token); // create new robot with existing token and keys (on network and coordinator change)
      }
    }
  }, [open.profile, hostUrl, robotUpdatedAt]);

  return {
    federation,
    sortedCoordinators,
    setDelay,
    coordinatorUpdatedAt,
    federationUpdatedAt,
  };
};
