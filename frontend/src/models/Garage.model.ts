import { Robot, type Order } from '.';
import { systemClient } from '../services/System';
import { saveAsJson } from '../utils';
export interface Slot {
  robot: Robot;
  order: Order | null;
}

const emptySlot: Slot = { robot: new Robot(), order: null };

type GarageHooks = 'onRobotUpdate' | 'onOrderUpdate';

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
      onOrderUpdate: [],
    };
  }

  slots: Slot[] = [emptySlot];
  currentSlot: number;

  hooks: Record<GarageHooks, (() => void)[]>;

  // Hooks
  registerHook = (hookName: GarageHooks, fn: () => void): void => {
    this.hooks[hookName].push(fn);
  };

  triggerHook = (hookName: GarageHooks): void => {
    this.hooks[hookName]?.forEach((fn) => fn());
  };

  // Storage
  download = (): void => {
    saveAsJson(`robotGarage_${new Date().toISOString()}.json`, this.slots);
  };

  save = (): void => {
    systemClient.setItem('garage', JSON.stringify(this.slots));
  };

  // Slots
  delete = (): void => {
    this.slots = [emptySlot];
    systemClient.deleteItem('garage');
    this.triggerHook('onRobotUpdate');
    this.triggerHook('onOrderUpdate');
  };

  deleteSlot: (index?: number) => void = (index) => {
    const targetSlot = index ?? this.slots.length - 1;
    this.slots.splice(targetSlot, 1);
    this.currentSlot = this.slots.length - 1;
    this.triggerHook('onRobotUpdate');
    this.triggerHook('onOrderUpdate');
    this.save();
  };

  getSlot: (index: number) => Slot = (index) => {
    if (this.slots[index] === undefined) {
      this.slots[index] = emptySlot;
    }

    return this.slots[index];
  };

  // Robots
  updateRobot: (attributes: Record<any, any>, index?: number) => void = (
    attributes,
    index = this.currentSlot,
  ) => {
    const slot = this.getSlot(index);
    this.slots[index] = {
      order: slot.order,
      robot: {
        ...slot.robot,
        ...attributes,
      },
    };
    this.triggerHook('onRobotUpdate');
    this.save();
  };

  getRobot = (): Robot => {
    return this.getSlot(this.currentSlot).robot;
  };

  // Orders
  updateOrder: (order: Order | null, index?: number) => void = (
    order,
    index = this.currentSlot,
  ) => {
    const slot = this.getSlot(index);
    this.slots[index] = {
      robot: slot.robot,
      order,
    };
    this.triggerHook('onOrderUpdate');
    this.save();
  };

  getOrder = (): Order | null => {
    return this.getSlot(this.currentSlot).order;
  };
}

export default Garage;
