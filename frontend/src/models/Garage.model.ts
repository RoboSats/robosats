import { type Order } from '.';
import { systemClient } from '../services/System';
import { saveAsJson } from '../utils';
import Slot from './Slot.model';

type GarageHooks = 'onRobotUpdate' | 'onOrderUpdate';

class Garage {
  constructor() {
    this.slots = {};
    this.currentSlot = null;

    this.hooks = {
      onRobotUpdate: [],
      onOrderUpdate: [],
    };

    this.loadSlots();
  }

  slots: Record<string, Slot>;
  currentSlot: string | null;

  hooks: Record<GarageHooks, Array<() => void>>;

  // Hooks
  registerHook = (hookName: GarageHooks, fn: () => void): void => {
    this.hooks[hookName]?.push(fn);
  };

  triggerHook = (hookName: GarageHooks): void => {
    this.hooks[hookName]?.forEach((fn) => {
      fn();
    });
  };

  // Storage
  download = (): void => {
    saveAsJson(`garage_slots_${new Date().toISOString()}.json`, this.slots);
  };

  save = (): void => {
    systemClient.setItem('garage_slots', JSON.stringify(this.slots));
  };

  delete = (): void => {
    this.slots = {};
    this.currentSlot = null;
    systemClient.deleteItem('garage_slots');
    this.triggerHook('onRobotUpdate');
    this.triggerHook('onOrderUpdate');
  };

  loadSlots = (): void => {
    this.slots = {};
    const slotsDump: string = systemClient.getItem('garage_slots') ?? '';

    if (slotsDump !== '') {
      const rawSlots = JSON.parse(slotsDump);
      Object.values(rawSlots).forEach((rawSlot: Record<any, any>) => {
        if (rawSlot?.token != null) {
          this.createSlot(rawSlot?.token);
          Object.keys(rawSlot.robots).forEach((shortAlias) => {
            const rawRobot = rawSlot.robots[shortAlias];
            this.upsertRobot(rawRobot.token, shortAlias, rawRobot);
          });
          this.currentSlot = rawSlot?.token;
        }
      });
      console.log('Robot Garage was loaded from local storage');
      this.triggerHook('onRobotUpdate');
      this.triggerHook('onOrderUpdate');
    }
  };

  // Slots
  getSlot: (token?: string) => Slot | null = (token) => {
    const currentToken = token ?? this.currentSlot;
    return currentToken != null ? this.slots[currentToken] ?? null : null;
  };

  createSlot: (token: string) => Slot | null = (token) => {
    if (token !== null) {
      this.slots[token] = new Slot(token);
      return this.slots[token];
    }
    return null;
  };

  deleteSlot: (token?: string) => void = (token) => {
    const targetIndex = token ?? this.currentSlot;
    if (targetIndex != null) {
      Reflect.deleteProperty(this.slots, targetIndex);
      this.currentSlot = null;
      this.triggerHook('onRobotUpdate');
      this.triggerHook('onOrderUpdate');
      this.save();
    }
  };

  updateSlot: (attributes: { copiedToken?: boolean }, token?: string) => Slot | null = (
    attributes,
    token,
  ) => {
    const slot = this.getSlot(token);
    if (attributes != null) {
      if (attributes.copiedToken !== undefined) slot?.setCopiedToken(attributes.copiedToken);
      this.triggerHook('onRobotUpdate');
    }
    return slot;
  };

  // Robots
  upsertRobot: (token: string, shortAlias: string, attributes: Record<any, any>) => void = (
    token,
    shortAlias,
    attributes,
  ) => {
    if (token === null || shortAlias === null) return;

    let slot = this.getSlot(token);

    if (slot === null && attributes.token != null) {
      slot = this.createSlot(attributes.token);
    }

    if (slot != null) {
      slot.upsertRobot(shortAlias, attributes);
      this.triggerHook('onRobotUpdate');
      this.save();
    }
  };

  // Orders
  updateOrder: (order: Order) => void = (order) => {
    const slot = this.getSlot();
    if (slot != null) {
      const updatedOrder = slot.order ?? null;
      if (updatedOrder !== null && updatedOrder.id === order.id) {
        Object.assign(updatedOrder, order);
        slot.order = updatedOrder;
      } else {
        slot.order = order;
      }
      if (slot.order?.is_participant) {
        slot.activeShortAlias = order.shortAlias;
      }
      this.triggerHook('onOrderUpdate');
      this.save();
    }
  };
}

export default Garage;
