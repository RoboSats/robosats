import { createContext, type Dispatch, useState, type SetStateAction, useEffect } from 'react';

import { defaultMaker, type Maker, Garage } from '../models';

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

export const useGarageStore = (): UseGarageStoreType => {
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

  return {
    garage,
    maker,
    setMaker,
    badOrder,
    setBadOrder,
    robotUpdatedAt,
    orderUpdatedAt,
  };
};
