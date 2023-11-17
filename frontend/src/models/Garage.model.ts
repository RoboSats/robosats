import { Robot, type Order } from '.';
import { systemClient } from '../services/System';
import { saveAsJson } from '../utils';
export interface Slot {
  robot: Robot;
  lastOrderId: number | null;
  lastOrderShortAlias: string | null;
  activeOrderId: number | null;
  activeOrderShortAlias: string | null;
  order: Order | null;
}

const defaultSlot = {
  robot: new Robot(),
  lastOrderId: null,
  lastOrderShortAlias: null,
  activeOrderId: null,
  activeOrderShortAlias: null,
  order: null,
};

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
          return {
            ...defaultSlot,
            ...raw,
            robot,
            order: null,
          };
        });
      console.log('Robot Garage was loaded from local storage');
    }

    if (this.slots.length < 1) {
      this.slots = [defaultSlot];
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
    this.slots = [defaultSlot];
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

  getSlot: (index?: number) => Slot = (index = this.currentSlot) => {
    if (this.slots[index] === undefined) {
      this.slots[index] = defaultSlot;
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
      if (attributes.lastOrderId !== undefined && attributes.lastOrderId != null) {
        this.slots[index].lastOrderId = attributes.lastOrderId;
        this.slots[index].lastOrderShortAlias = attributes.shortAlias;
        if (attributes.lastOrderId === this.slots[index].activeOrderId) {
          this.slots[index].activeOrderId = null;
          this.slots[index].activeOrderShortAlias = null;
        }
      }
      if (attributes.activeOrderId !== undefined && attributes.activeOrderId != null) {
        this.slots[index].activeOrderId = attributes.activeOrderId;
        this.slots[index].activeOrderShortAlias = attributes.shortAlias;
        this.slots[index].lastOrderId = null;
        this.slots[index].lastOrderShortAlias = null;
      }
      this.triggerHook('onRobotUpdate');
      this.save();
    }
  };

  createRobot = (attributes: Record<any, any>): void => {
    const newSlot = defaultSlot;
    newSlot.robot.update(attributes);
    this.slots.push(newSlot);
    this.currentSlot = this.slots.length - 1;
    this.save();
  };

  getActiveOrderId: (index?: number) => number | null = (index = this.currentSlot) => {
    return this.getSlot(index)?.robot?.activeOrderId ?? null;
  };

  // Orders
  updateOrder: (order: Order, index?: number) => void = (order, index = this.currentSlot) => {
    this.slots[index].order = order;
    this.triggerHook('onOrderUpdate');
    this.save();
  };

  deleteOrder: (index?: number) => void = (index = this.currentSlot) => {
    this.slots[index].order = null;
    this.triggerHook('onOrderUpdate');
    this.save();
  };

  getOrder: (index?: number) => Order | null = (index = this.currentSlot) => {
    return this.getSlot(index)?.order;
  };
}

export default Garage;
