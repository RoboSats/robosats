import React, {
  createContext,
  type Dispatch,
  useEffect,
  useState,
  type SetStateAction,
  useMemo,
  useContext,
  type ReactNode,
} from 'react';

import { type Order, Federation } from '../models';

import { federationLottery } from '../utils';

import { AppContext, type UseAppStoreType } from './AppContext';
import { GarageContext, type UseGarageStoreType } from './GarageContext';

// Refresh delays (ms) according to Order status
const defaultDelay = 5000;
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

export interface CurrentOrderIdProps {
  id: number | null;
  shortAlias: string | null;
}

export interface FederationContextProviderProps {
  children: ReactNode;
}

export interface UseFederationStoreType {
  federation: Federation;
  sortedCoordinators: string[];
  setDelay: Dispatch<SetStateAction<number>>;
  currentOrderId: CurrentOrderIdProps;
  setCurrentOrderId: Dispatch<SetStateAction<CurrentOrderIdProps>>;
  currentOrder: Order | null;
  coordinatorUpdatedAt: string;
  federationUpdatedAt: string;
}

export const initialFederationContext: UseFederationStoreType = {
  federation: new Federation(),
  sortedCoordinators: [],
  setDelay: () => {},
  currentOrderId: { id: null, shortAlias: null },
  setCurrentOrderId: () => {},
  currentOrder: null,
  coordinatorUpdatedAt: '',
  federationUpdatedAt: '',
};

export const FederationContext = createContext<UseFederationStoreType>(initialFederationContext);

export const FederationContextProvider = ({
  children,
}: FederationContextProviderProps): JSX.Element => {
  const { settings, page, origin, hostUrl, open, torStatus } =
    useContext<UseAppStoreType>(AppContext);
  const { setMaker, garage, setBadOrder } = useContext<UseGarageStoreType>(GarageContext);
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
  const [currentOrderId, setCurrentOrderId] = useState<CurrentOrderIdProps>(
    initialFederationContext.currentOrderId,
  );
  const [currentOrder, setCurrentOrder] = useState<Order | null>(
    initialFederationContext.currentOrder,
  );

  const [delay, setDelay] = useState<number>(defaultDelay);
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
    let newDelay = defaultDelay;
    if (order?.bad_request) {
      newDelay = 99999999;
      setBadOrder(order.bad_request);
      garage.updateOrder(null);
      setCurrentOrder(null);
    }
    if (order?.id) {
      newDelay =
        order.status >= 0 && order.status <= 18
          ? page === 'order'
            ? statusToDelay[order.status]
            : statusToDelay[order.status] * 5 // If user is not looking at "order" tab, refresh less often.
          : 99999999;
      garage.updateOrder(order);
      setCurrentOrder(order);
      setBadOrder(undefined);
    }
    clearInterval(timer);
    console.log('New Delay:', newDelay);
    setDelay(newDelay);
    setTimer(setTimeout(fetchCurrentOrder, newDelay));
  };

  const fetchCurrentOrder: () => void = () => {
    const slot = garage?.getSlot();
    const robot = slot?.getRobot();
    if (currentOrderId.id && currentOrderId.shortAlias) {
      const coordinator = federation.getCoordinator(currentOrderId.shortAlias);
      void coordinator?.fetchOrder(currentOrderId.id, robot, slot.token).then((order) => {
        onOrderReceived(order as Order);
      });
    } else if (slot?.token && slot?.activeShortAlias && robot?.activeOrderId) {
      const coordinator = federation.getCoordinator(slot.activeShortAlias);
      void coordinator?.fetchOrder(robot.activeOrderId, robot, slot.token).then((order) => {
        onOrderReceived(order as Order);
      });
    } else {
      clearInterval(timer);
      setTimer(setTimeout(fetchCurrentOrder, defaultDelay));
    }
  };

  useEffect(() => {
    if (currentOrderId.id && currentOrderId.shortAlias) {
      setCurrentOrder(null);
      setBadOrder(undefined);
      clearInterval(timer);
      fetchCurrentOrder();
    }
    return () => {
      clearInterval(timer);
    };
  }, [currentOrderId]);

  useEffect(() => {
    if (page === 'offers') void federation.updateBook();
  }, [page]);

  // use effects to fetchRobots on app start and network change
  useEffect(() => {
    const slot = garage.getSlot();
    const robot = slot?.getRobot();

    if (robot && garage.currentSlot && slot?.token && robot.encPrivKey && robot.pubKey) {
      void federation.fetchRobot(garage, slot.token);
    }
  }, [settings.network]);
  // use effects to fetchRobots on Profile open
  useEffect(() => {
    const slot = garage.getSlot();

    if (open.profile && slot?.hashId && slot?.token) {
      void federation.fetchRobot(garage, slot?.token); // refresh/update existing robot
    }
  }, [open.profile]);

  return (
    <FederationContext.Provider
      value={{
        federation,
        sortedCoordinators,
        currentOrderId,
        setCurrentOrderId,
        currentOrder,
        setDelay,
        coordinatorUpdatedAt,
        federationUpdatedAt,
      }}
    >
      {children}
    </FederationContext.Provider>
  );
};
