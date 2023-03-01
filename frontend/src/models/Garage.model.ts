import { Robot, Order } from '.';
import { systemClient } from '../services/System';
import { saveAsJson } from '../utils';
export interface Slot {
  robot: Robot;
  order: Order | null;
}

const emptySlot: Slot = { robot: new Robot(), order: null };

class Garage {
  constructor(initialState?: Garage) {
    if (initialState?.slots === undefined && systemClient.getItem('garage') != '') {
      this.slots = JSON.parse(systemClient.getItem('garage'));
      console.log('Robot Garage was loaded from local storage');
    } else {
      this.slots = [emptySlot];
    }
    this.setGarage = initialState?.setGarage || (() => {});
  }
  slots: Slot[] = [emptySlot];
  setGarage: (state: Garage) => void = () => {};

  save = () => {
    systemClient.setItem('garage', JSON.stringify(this.slots));
    this.setGarage(new Garage(this));
  };

  delete = () => {
    this.slots = [emptySlot];
    systemClient.deleteItem('garage');
    this.save();
  };

  updateRobot: (robot: Robot, index: number) => void = (robot, index) => {
    this.slots[index] = { robot, order: null };
    this.save();
  };

  download = () => {
    saveAsJson(`robotGarage_${new Date().toISOString()}.json`, this.slots);
  };

  deleteSlot: (index?: number) => void = (index) => {
    const targetSlot = index ?? this.slots.length - 1;
    this.slots.splice(targetSlot, 1);
    this.save();
  };
}

export default Garage;
