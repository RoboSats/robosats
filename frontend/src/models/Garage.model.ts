import { Robot, type Order } from '.';
import { systemClient } from '../services/System';
import { saveAsJson } from '../utils';
export interface Slot {
  robot: Robot;
  order: Order | null;
}

const emptySlot: Slot = { robot: new Robot(), order: null };

type GarageHooks = 'onRobotUpdate';

class Garage {
  constructor() {
    const slotsDump: string = systemClient.getItem('garage') ?? '';
    if (slotsDump !== '') {
      this.slots = JSON.parse(slotsDump);
      console.log('Robot Garage was loaded from local storage');
    }

    if (!this.slots || this.slots.length < 1) {
      this.slots = [emptySlot];
    }

    this.currentSlot = this.slots.length - 1;
    this.hooks = {
      onRobotUpdate: [],
    };
  }

  slots: Slot[] = [emptySlot];
  currentSlot: number;

  hooks: Record<GarageHooks, (() => void)[]>;

  registerHook = (hookName: GarageHooks, fn: () => void): void => {
    this.hooks[hookName].push(fn);
  };

  triggerHook = (hookName: GarageHooks): void => {
    this.hooks[hookName]?.forEach((fn) => fn());
  };

  download = (): void => {
    saveAsJson(`robotGarage_${new Date().toISOString()}.json`, this.slots);
  };

  save = (): void => {
    systemClient.setItem('garage', JSON.stringify(this.slots));
  };

  delete = (): void => {
    this.slots = [emptySlot];
    systemClient.deleteItem('garage');
    this.triggerHook('onRobotUpdate');
  };

  updateRobot: (attributes: Record<any, any>, index?: number) => void = (
    attributes,
    index = this.currentSlot,
  ) => {
    if (this.slots[index] === undefined) this.slots[index] = emptySlot;

    this.slots[index] = {
      ...this.slots[index],
      robot: {
        ...this.slots[index].robot,
        ...attributes,
      },
    };
    this.triggerHook('onRobotUpdate');
    this.save();
  };

  deleteSlot: (index?: number) => void = (index) => {
    const targetSlot = index ?? this.slots.length - 1;
    this.slots.splice(targetSlot, 1);
    this.currentSlot = this.slots.length - 1;
    this.triggerHook('onRobotUpdate');
    this.save();
  };

  getRobot = (): Robot => {
    if (this.slots[this.currentSlot] === undefined) {
      this.slots[this.currentSlot] = emptySlot;
    }

    return this.slots[this.currentSlot].robot;
  };
}

export default Garage;
