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
  garageKeyUpdatedAt: string;
  recoverAccountFromRelays: () => void;
}

export const initialGarageContext: UseGarageStoreType = {
  garage: new Garage(),
  maker: defaultMaker,
  setMaker: () => { },
  setDelay: () => { },
  fetchSlotActiveOrder: () => { },
  garageKeyUpdatedAt: '',
  recoverAccountFromRelays: () => { },
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

export const GarageContextProvider = ({
  children,
}: GarageContextProviderProps): React.JSX.Element => {
  // All garage data structured
  const { settings, torStatus, page, setSlotUpdatedAt } = useContext<UseAppStoreType>(AppContext);
  const pageRef = useRef(page);
  const { federation } = useContext<UseFederationStoreType>(FederationContext);
  const [garage] = useState<Garage>(initialGarageContext.garage);
  const [maker, setMaker] = useState<Maker>(initialGarageContext.maker);
  const [garageKeyUpdatedAt, setGarageKeyUpdatedAt] = useState<string>(new Date().toISOString());
  const [lastOrderCheckAt] = useState<number>(+new Date());
  const lastOrderCheckAtRef = useRef(lastOrderCheckAt);
  const [delay, setDelay] = useState<number>(defaultDelay);
  const [timer, setTimer] = useState<NodeJS.Timer | undefined>(() =>
    setInterval(() => null, delay),
  );

  const onSlotUpdated = (): void => {
    setSlotUpdatedAt(new Date().toISOString());
  };

  const onGarageKeyUpdated = (): void => {
    setGarageKeyUpdatedAt(new Date().toISOString());
  };

  const recoverAccountFromRelays = (): void => {
    const garageKey = garage.getGarageKey();
    if (!garageKey || !federation.roboPool) return;

    let latestAccountIndex = 0;
    let latestCreatedAt = 0;

    federation.roboPool.subscribeAccountRecovery(
      garageKey.nostrPubKey,
      garageKey.nostrSecKey,
      (accountIndex, createdAt) => {
        if (createdAt > latestCreatedAt) {
          latestCreatedAt = createdAt;
          latestAccountIndex = accountIndex;
        }
      },
      () => {
        if (latestAccountIndex > 0 && latestAccountIndex !== garageKey.currentAccountIndex) {
          garageKey.setAccountIndex(latestAccountIndex);
          console.log(`Recovered account index: ${latestAccountIndex}`);
        }
      },
    );
  };

  useEffect(() => {
    setMaker((maker) => {
      return { ...maker, coordinator: federation.getCoordinatorsAlias()[0] };
    }); // default MakerForm coordinator is decided via sorted lottery
    garage.registerHook('onSlotUpdate', onSlotUpdated);
    garage.registerHook('onGarageKeyUpdate', onGarageKeyUpdated);
    clearInterval(timer);
    fetchSlotActiveOrder();

    void garage.loadGarageKey();

    return () => {
      clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    const token = garage.getSlot()?.token;

    if (pageRef.current !== page) {
      pageRef.current = page;
      if (token && page === 'garage') {
        void garage.fetchRobot(federation, token);
      }
    } else if (token) {
      void garage.fetchRobot(federation, token);
    }
  }, [settings.network, settings.useProxy, torStatus, page]);

  useEffect(() => {
    if (settings.garageMode && garage.getMode() !== settings.garageMode) {
      garage.setMode(settings.garageMode);
    }
  }, [settings.garageMode]);

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
        garageKeyUpdatedAt,
        recoverAccountFromRelays,
      }}
    >
      {children}
    </GarageContext.Provider>
  );
};
