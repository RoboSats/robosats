import { createContext, type Dispatch, useState, type SetStateAction } from 'react';

import { defaultMaker, type Maker, Robot, Garage } from '../models';

export interface UseGarageStoreType {
  garage: Garage;
  setGarage: Dispatch<SetStateAction<Garage>>;
  currentSlot: number;
  setCurrentSlot: Dispatch<SetStateAction<number>>;
  maker: Maker;
  setMaker: Dispatch<SetStateAction<Maker>>;
  robot: Robot;
  setRobot: Dispatch<SetStateAction<Robot>>;
  avatarLoaded: boolean;
  setAvatarLoaded: Dispatch<SetStateAction<boolean>>;
}

export const initialGarageContext: UseGarageStoreType = {
  garage: new Garage(),
  setGarage: () => {},
  currentSlot: 0,
  setCurrentSlot: () => {},
  maker: defaultMaker,
  setMaker: () => {},
  robot: new Robot(),
  setRobot: () => {},
  avatarLoaded: false,
  setAvatarLoaded: () => {},
};

export const GarageContext = createContext<UseGarageStoreType>(initialGarageContext);

export const useGarageStore = (): UseGarageStoreType => {
  // All garage data structured
  const [garage, setGarage] = useState<Garage>(initialGarageContext.garage);
  const [currentSlot, setCurrentSlot] = useState<number>(() => {
    return garage.slots.length - 1;
  });
  const [robot, setRobot] = useState<Robot>(() => {
    return new Robot(garage.slots[currentSlot].robot);
  });
  const [maker, setMaker] = useState<Maker>(initialGarageContext.maker);
  const [avatarLoaded, setAvatarLoaded] = useState<boolean>(initialGarageContext.avatarLoaded);

  return {
    garage,
    setGarage,
    currentSlot,
    setCurrentSlot,
    maker,
    setMaker,
    robot,
    setRobot,
    setAvatarLoaded,
    avatarLoaded,
  };
};
