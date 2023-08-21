import { Robot, type Order } from '.';
import { systemClient } from '../services/System';
import { saveAsJson } from '../utils';
export interface Slot {
  robot: Robot;
  order: Order | null;
}

const emptySlot: Slot = { robot: new Robot(), order: null };

class Garage {
  constructor(initialState?: Garage) {
    const slotsDump: string = systemClient.getItem('garage');
    if (initialState?.slots === undefined && slotsDump !== '') {
      this.slots = JSON.parse(slotsDump);
      console.log('Robot Garage was loaded from local storage');
    } else {
      this.slots = [emptySlot];
    }
  }

  slots: Slot[] = [emptySlot];

  save = (): void => {
    systemClient.setItem('garage', JSON.stringify(this.slots));
  };

  delete = (): void => {
    this.slots = [emptySlot];
    systemClient.deleteItem('garage');
  };

  updateRobot: (robot: Robot, index: number) => void = (robot, index) => {
    this.slots[index] = { robot, order: null };
    this.save();
  };

  download = (): void => {
    saveAsJson(`robotGarage_${new Date().toISOString()}.json`, this.slots);
  };

  deleteSlot: (index?: number) => void = (index) => {
    const targetSlot = index ?? this.slots.length - 1;
    this.slots.splice(targetSlot, 1);
    this.save();
  };
}

export default Garage;
