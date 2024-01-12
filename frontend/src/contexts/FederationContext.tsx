import React, {
  createContext,
  type Dispatch,
  useEffect,
  useState,
  type SetStateAction,
  useMemo,
  useContext,
  ReactNode,
} from 'react';
import { useParams } from 'react-router-dom';

import { type Coordinator, type Order, Federation } from '../models';

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

export interface fetchRobotProps {
  coordinator?: Coordinator;
  newKeys?: { encPrivKey: string; pubKey: string };
  newToken?: string;
  slot?: number;
  isRefresh?: boolean;
}

export interface FederationContextProviderProps {
  children: ReactNode;
}

export interface UseFederationStoreType {
  federation: Federation;
  sortedCoordinators: string[];
  setDelay: Dispatch<SetStateAction<number>>;
  coordinatorUpdatedAt: string;
  federationUpdatedAt: string;
  currentOrder: Order | null;
  currentOrderId: number | null;
  setCurrentOrderId: (orderId: number | null) => void;
  updateCurrentOrder: () => void;
  setCurrentAlias: (currentAlias: string | null) => void;
}

export const initialFederationContext: UseFederationStoreType = {
  federation: new Federation(),
  sortedCoordinators: [],
  setDelay: () => {},
  coordinatorUpdatedAt: '',
  federationUpdatedAt: '',
  currentOrder: null,
  currentOrderId: null,
  setCurrentOrderId: () => {},
  updateCurrentOrder: () => {},
  setCurrentAlias: () => {},
};

export const FederationContext = createContext<UseFederationStoreType>(initialFederationContext);

export const FederationContextProvider = ({
  children,
}: FederationContextProviderProps): JSX.Element => {
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

  const [delay, setDelay] = useState<number>(defaultDelay);
  const [timer, setTimer] = useState<NodeJS.Timer | undefined>(() =>
    setInterval(() => null, delay),
  );
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
  const [currentOrderId, setCurrentOrderId] = useState<number | null>(null);
  const [currentAlias, setCurrentAlias] = useState<string | null>(null);

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
      console.log('bad request on order, new delay', newDelay);
      setBadOrder(order.bad_request);
      garage.updateOrder(null);
    }
    if (order?.id) {
      newDelay =
        order.status >= 0 && order.status <= 18
          ? page === 'order'
            ? statusToDelay[order.status]
            : statusToDelay[order.status] * 5 // If user is not looking at "order" tab, refresh less often.
          : 99999999;
      console.log('has order id, new delay is', newDelay);
      garage.updateOrder(order);
      setBadOrder(undefined);
    }
    console.log('setting delay!', newDelay);
    setDelay(newDelay);
    setTimer(setTimeout(fetchCurrentOrder, newDelay));
  };

  const fetchCurrentOrder: () => void = () => {
    const slot = garage?.getSlot();
    const robot = slot?.getRobot();
    if (slot?.token && currentAlias && currentOrderId && robot) {
      const coordinator = federation.getCoordinator(currentAlias);
      void coordinator?.fetchOrder(currentOrderId, robot, slot.token).then((order) => {
        onOrderReceived(order as Order);
      });
    } else {
      console.log('Hit no order, delay', defaultDelay);
      setTimer(setTimeout(fetchCurrentOrder, defaultDelay));
    }
  };

  const updateCurrentOrder = (): void => {
    if (currentOrderId !== null) {
      const params = useParams();
      const coordinator = federation.getCoordinator(params.shortAlias ?? '');
      const slot = garage.getSlot();
      const robot = slot?.getRobot();
      if (robot != null && slot?.token != null) {
        void federation.fetchRobot(garage, slot.token);
        coordinator
          .fetchOrder(currentOrderId, robot, slot.token)
          .then((order) => {
            if (order?.bad_request !== undefined) {
              setBadOrder(order.bad_request);
            } else if (order?.id) {
              setCurrentOrder(order);
              if (order?.is_participant) {
                garage.updateOrder(order);
              }
            }
          })
          .catch((e) => {
            console.log(e);
          });
      }
    }
  };

  useEffect(() => {
    clearInterval(timer);
    fetchCurrentOrder();
    setDelay(defaultDelay);
    return () => {
      clearInterval(timer);
    };
  }, [coordinatorUpdatedAt, federationUpdatedAt]);

  useEffect(() => {
    if (page === 'offers') void federation.updateBook();
  }, [page]);

  useEffect(() => {
    const slot = garage.getSlot();
    const robot = slot?.getRobot();

    if (robot && garage.currentSlot) {
      if (open.profile && Boolean(slot?.hashId) && slot?.token) {
        void federation.fetchRobot(garage, slot?.token); // refresh/update existing robot
      } else if (slot?.token && robot.encPrivKey && robot.pubKey) {
        void federation.fetchRobot(garage, slot.token); // create new robot with existing token and keys (on network and coordinator change)
      }
    }
  }, [open.profile, hostUrl, robotUpdatedAt]);

  useEffect(() => {
    if (currentOrderId === null) {
      const slot = garage.getSlot();
      const robot = slot?.getRobot();
      if (robot?.activeOrderId) setCurrentOrderId(robot.activeOrderId);
    } else {
      setCurrentOrder(null);
      updateCurrentOrder();
    }
  }, [currentOrderId, currentAlias]);

  return (
    <FederationContext.Provider
      value={{
        federation,
        sortedCoordinators,
        setDelay,
        coordinatorUpdatedAt,
        federationUpdatedAt,
        currentOrder,
        currentOrderId,
        setCurrentOrderId,
        updateCurrentOrder,
        setCurrentAlias,
      }}
    >
      {children}
    </FederationContext.Provider>
  );
};
