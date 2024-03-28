import React, {
  createContext,
  type Dispatch,
  useState,
  type SetStateAction,
  useEffect,
  type ReactNode,
} from 'react';

import { defaultMaker, type Maker, Garage } from '../models';
import { systemClient } from '../services/System';

export interface GarageContextProviderProps {
  children: ReactNode;
}

export interface UseGarageStoreType {
  garage: Garage;
  maker: Maker;
  setMaker: Dispatch<SetStateAction<Maker>>;
  badOrder?: string;
  setBadOrder: Dispatch<SetStateAction<string | undefined>>;
  robotUpdatedAt: string;
  orderUpdatedAt: string;
}

export const initialGarageContext: UseGarageStoreType = {
  garage: new Garage(),
  maker: defaultMaker,
  setMaker: () => {},
  badOrder: undefined,
  setBadOrder: () => {},
  robotUpdatedAt: '',
  orderUpdatedAt: '',
};

export const GarageContext = createContext<UseGarageStoreType>(initialGarageContext);

export const GarageContextProvider = ({ children }: GarageContextProviderProps): JSX.Element => {
  // All garage data structured
  const [garage] = useState<Garage>(initialGarageContext.garage);
  const [maker, setMaker] = useState<Maker>(initialGarageContext.maker);
  const [badOrder, setBadOrder] = useState<string>();
  const [robotUpdatedAt, setRobotUpdatedAt] = useState<string>(new Date().toISOString());
  const [orderUpdatedAt, setOrderUpdatedAt] = useState<string>(new Date().toISOString());

  const onRobotUpdated = (): void => {
    setRobotUpdatedAt(new Date().toISOString());
  };

  const onOrderUpdate = (): void => {
    setOrderUpdatedAt(new Date().toISOString());
  };

  useEffect(() => {
    garage.registerHook('onRobotUpdate', onRobotUpdated);
    garage.registerHook('onOrderUpdate', onOrderUpdate);
  }, []);

  useEffect(() => {
    if (window.NativeRobosats !== undefined && !systemClient.loading) {
      garage.loadSlots();
    }
  }, [systemClient.loading]);

  return (
    <GarageContext.Provider
      value={{
        garage,
        maker,
        setMaker,
        badOrder,
        setBadOrder,
        robotUpdatedAt,
        orderUpdatedAt,
      }}
    >
      {children}
    </GarageContext.Provider>
  );
};
