import React, {
  createContext,
  type Dispatch,
  useState,
  type SetStateAction,
  useEffect,
  type ReactNode,
  useContext,
  useRef,
} from 'react';

import { defaultMaker, type Maker, Garage } from '../models';
import { systemClient } from '../services/System';
import { type UseAppStoreType, AppContext } from './AppContext';
import { type UseFederationStoreType, FederationContext } from './FederationContext';

export interface GarageContextProviderProps {
  children: ReactNode;
}

export interface UseGarageStoreType {
  garage: Garage;
  maker: Maker;
  setMaker: Dispatch<SetStateAction<Maker>>;
  setDelay: Dispatch<SetStateAction<number>>;
  fetchSlotActiveOrder: () => void;
  slotUpdatedAt: string;
}

export const initialGarageContext: UseGarageStoreType = {
  garage: new Garage(),
  maker: defaultMaker,
  setMaker: () => {},
  setDelay: () => {},
  fetchSlotActiveOrder: () => {},
  slotUpdatedAt: '',
};

const defaultDelay = 5000;
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

export const GarageContext = createContext<UseGarageStoreType>(initialGarageContext);

export const GarageContextProvider = ({ children }: GarageContextProviderProps): JSX.Element => {
  // All garage data structured
  const { settings, torStatus, open, page, client } = useContext<UseAppStoreType>(AppContext);
  const pageRef = useRef(page);
  const { federation } = useContext<UseFederationStoreType>(FederationContext);
  const [garage] = useState<Garage>(initialGarageContext.garage);
  const [maker, setMaker] = useState<Maker>(initialGarageContext.maker);
  const [slotUpdatedAt, setSlotUpdatedAt] = useState<string>(new Date().toISOString());
  const [lastOrderCheckAt] = useState<number>(+new Date());
  const lastOrderCheckAtRef = useRef(lastOrderCheckAt);
  const [delay, setDelay] = useState<number>(defaultDelay);
  const [timer, setTimer] = useState<NodeJS.Timer | undefined>(() =>
    setInterval(() => null, delay),
  );

  const onSlotUpdated = (): void => {
    setSlotUpdatedAt(new Date().toISOString());
  };

  useEffect(() => {
    setMaker((maker) => {
      return { ...maker, coordinator: federation.getCoordinatorsAlias()[0] };
    }); // default MakerForm coordinator is decided via sorted lottery
    garage.registerHook('onSlotUpdate', onSlotUpdated);
    clearInterval(timer);
    fetchSlotActiveOrder();

    return () => {
      clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    if (client !== 'mobile' || torStatus === 'ON' || !settings.useProxy) {
      const token = garage.getSlot()?.token;
      if (token) void garage.fetchRobot(federation, token);
    }
  }, [settings.network, settings.useProxy, torStatus]);

  useEffect(() => {
    if (client === 'mobile' && !systemClient.loading) {
      garage.loadSlots();
    }
  }, [systemClient.loading]);

  useEffect(() => {
    pageRef.current = page;
  }, [page]);

  // use effects to fetchRobots on Profile open
  useEffect(() => {
    const slot = garage.getSlot();

    if (open.profile && slot?.hashId && slot?.token) {
      void garage.fetchRobot(federation, slot?.token); // refresh/update existing robot
    }
  }, [open.profile]);

  const fetchSlotActiveOrder: () => void = () => {
    const slot = garage?.getSlot();
    if (slot?.activeOrder?.id) {
      let delay =
        slot.activeOrder.status >= 0 && slot.activeOrder.status <= 18
          ? statusToDelay[slot.activeOrder.status]
          : defaultDelay;
      if (pageRef.current !== 'order') delay = delay * 5;
      if (+new Date() - lastOrderCheckAtRef.current >= delay) {
        void slot.fetchActiveOrder(federation).finally(() => {
          lastOrderCheckAtRef.current = +new Date();
          resetInterval();
        });
      } else {
        resetInterval();
      }
    } else {
      resetInterval();
    }
  };

  const resetInterval = (): void => {
    clearInterval(timer);
    setDelay(defaultDelay);
    setTimer(
      setTimeout(() => {
        fetchSlotActiveOrder();
      }, defaultDelay),
    );
  };

  return (
    <GarageContext.Provider
      value={{
        garage,
        maker,
        setMaker,
        setDelay,
        fetchSlotActiveOrder,
        slotUpdatedAt,
      }}
    >
      {children}
    </GarageContext.Provider>
  );
};
