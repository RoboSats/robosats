import { Robot, type Order } from '.';
import { systemClient } from '../services/System';
import { saveAsJson } from '../utils';
export interface Slot {
  robot: Robot;
  order: Order | null;
}

type GarageHooks = 'onRobotUpdate' | 'onOrderUpdate';

class Garage {
  constructor() {
    this.slots = [];
    const slotsDump: string = systemClient.getItem('garage') ?? '';
    if (slotsDump !== '') {
      const rawSlots = JSON.parse(slotsDump);
      this.slots = rawSlots
        .filter((raw: any) => raw !== null)
        .map((raw: any) => {
          const robot = new Robot(raw.robot);
          robot.update(raw.robot);
          return { robot, order: raw.order as Order };
        });
      console.log('Robot Garage was loaded from local storage');
    }

    if (this.slots.length < 1) {
      this.slots = [{ robot: new Robot(), order: null }];
    }

    this.currentSlot = 0;

    this.hooks = {
      onRobotUpdate: [],
      onOrderUpdate: [],
    };
  }

  slots: Slot[];
  currentSlot: number;

  hooks: Record<GarageHooks, Array<() => void>>;

  // Hooks
  registerHook = (hookName: GarageHooks, fn: () => void): void => {
    this.hooks[hookName].push(fn);
  };

  triggerHook = (hookName: GarageHooks): void => {
    this.hooks[hookName]?.forEach((fn) => {
      fn();
    });
  };

  // Storage
  download = (): void => {
    saveAsJson(`robotGarage_${new Date().toISOString()}.json`, this.slots);
  };

  save = (): void => {
    const saveSlots = this.slots.filter((slot: Slot) => slot !== null);
    systemClient.setItem('garage', JSON.stringify(saveSlots));
  };

  // Slots
  delete = (): void => {
    this.slots = [{ robot: new Robot(), order: null }];
    systemClient.deleteItem('garage');
    this.triggerHook('onRobotUpdate');
    this.triggerHook('onOrderUpdate');
  };

  deleteSlot: (index?: number) => void = (index) => {
    const targetSlot = index ?? this.slots.length - 1;
    this.slots.splice(targetSlot, 1);
    this.currentSlot = 0;
    this.triggerHook('onRobotUpdate');
    this.triggerHook('onOrderUpdate');
    this.save();
  };

  getSlot: (index: number) => Slot = (index) => {
    if (this.slots[index] === undefined) {
      this.slots[index] = { robot: new Robot(), order: null };
    }

    return this.slots[index];
  };

  // Robots
  updateRobot: (attributes: Record<any, any>, index?: number) => void = (
    attributes,
    index = this.currentSlot,
  ) => {
    const robot = this.getSlot(index).robot;
    if (robot != null) {
      robot.update(attributes);
      this.triggerHook('onRobotUpdate');
      this.save();
    }
  };

  getRobot = (slot: number = this.currentSlot): Robot => {
    return this.getSlot(slot).robot;
  };

  createRobot = (attributes: Record<any, any>): void => {
    const newSlot = { robot: new Robot(), order: null };
    newSlot.robot.update(attributes);
    this.slots.push(newSlot);
    this.currentSlot = this.slots.length - 1;
    this.save();
  };

  // Orders
  updateOrder: (order: Order | null, index?: number) => void = (
    order,
    index = this.currentSlot,
  ) => {
    const slot = this.getSlot(index);
    this.slots[index] = {
      ...slot,
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
