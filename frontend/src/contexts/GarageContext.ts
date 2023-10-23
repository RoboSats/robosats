import { createContext, type Dispatch, useState, type SetStateAction, useEffect } from 'react';

import { defaultMaker, type Maker, Garage } from '../models';

export interface UseGarageStoreType {
  garage: Garage;
  maker: Maker;
  setMaker: Dispatch<SetStateAction<Maker>>;
  robotUpdatedAt: string;
}

export const initialGarageContext: UseGarageStoreType = {
  garage: new Garage(),
  maker: defaultMaker,
  setMaker: () => {},
  robotUpdatedAt: '',
};

export const GarageContext = createContext<UseGarageStoreType>(initialGarageContext);

export const useGarageStore = (): UseGarageStoreType => {
  // All garage data structured
  const [garage] = useState<Garage>(initialGarageContext.garage);
  const [maker, setMaker] = useState<Maker>(initialGarageContext.maker);
  const [robotUpdatedAt, setRobotUpdatedAt] = useState<string>(new Date().toISOString());

  const onRobotUpdated = (): void => {
    setRobotUpdatedAt(new Date().toISOString());
  };

  useEffect(() => {
    garage.registerHook('onRobotUpdate', onRobotUpdated);
  }, []);

  return {
    garage,
    maker,
    setMaker,
    robotUpdatedAt,
  };
};
