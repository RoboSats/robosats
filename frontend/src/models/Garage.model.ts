import { type Federation, Order } from '.';
import { systemClient } from '../services/System';
import { saveAsJson } from '../utils';
import Slot from './Slot.model';

type GarageHooks = 'onSlotUpdate';

class Garage {
  constructor() {
    this.slots = {};
    this.currentSlot = null;

    this.hooks = {
      onSlotUpdate: [],
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
    this.save();
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
    this.triggerHook('onSlotUpdate');
  };

  loadSlots = (): void => {
    this.slots = {};
    const slotsDump: string = systemClient.getItem('garage_slots') ?? '';

    if (slotsDump !== '') {
      const rawSlots = JSON.parse(slotsDump);
      Object.values(rawSlots).forEach((rawSlot: Record<any, any>) => {
        if (rawSlot?.token) {
          this.slots[rawSlot.token] = new Slot(
            rawSlot.token,
            Object.keys(rawSlot.robots),
            {},
            () => {
              this.triggerHook('onSlotUpdate');
            },
          );
          this.slots[rawSlot.token].updateSlotFromOrder(new Order(rawSlot.lastOrder));
          this.slots[rawSlot.token].updateSlotFromOrder(new Order(rawSlot.activeOrder));
          this.currentSlot = rawSlot?.token;
        }
      });
      console.log('Robot Garage was loaded from local storage');
      this.triggerHook('onSlotUpdate');
    }
  };

  // Slots
  getSlot: (token?: string) => Slot | null = (token) => {
    const currentToken = token ?? this.currentSlot;
    return currentToken ? this.slots[currentToken] ?? null : null;
  };

  deleteSlot: (token?: string) => void = (token) => {
    const targetIndex = token ?? this.currentSlot;
    if (targetIndex) {
      Reflect.deleteProperty(this.slots, targetIndex);
      this.currentSlot = null;
      this.save();
      this.triggerHook('onSlotUpdate');
    }
  };

  updateSlot: (attributes: { copiedToken?: boolean }, token?: string) => Slot | null = (
    attributes,
    token,
  ) => {
    const slot = this.getSlot(token);
    if (attributes) {
      if (attributes.copiedToken !== undefined) slot?.setCopiedToken(attributes.copiedToken);
      this.save();
      this.triggerHook('onRobotUpdate');
    }
    return slot;
  };

  setCurrentSlot: (currentSlot: string) => void = (currentSlot) => {
    this.currentSlot = currentSlot;
    this.save();
    this.triggerHook('onRobotUpdate');
  };

  getSlotByOrder: (coordinator: string, orderID: number) => Slot | null = (
    coordinator,
    orderID,
  ) => {
    return (
      Object.values(this.slots).find((slot) => {
        const robot = slot.getRobot(coordinator);
        return slot.activeShortAlias === coordinator && robot?.activeOrderId === orderID;
      }) ?? null
    );
  };

  // Robots
  createRobot: (token: string, shortAliases: string[], attributes: Record<any, any>) => void = (
    token,
    shortAliases,
    attributes,
  ) => {
    if (!token || !shortAliases) return;

    if (this.getSlot(token) === null) {
      this.slots[token] = new Slot(token, shortAliases, attributes, () => {
        this.triggerHook('onSlotUpdate');
      });
      this.save();
    }
  };

  fetchRobot = async (federation: Federation, token: string): Promise<void> => {
    const slot = this.getSlot(token);

    if (slot != null) {
      await slot.fetchRobot(federation);
      this.save();
      this.triggerHook('onSlotUpdate');
    }
  };

  // Coordinators
  syncCoordinator: (federation: Federation, shortAlias: string) => void = (
    federation,
    shortAlias,
  ) => {
    Object.values(this.slots).forEach((slot) => {
      slot.syncCoordinator(federation, shortAlias);
    });
    this.save();
  };
}

export default Garage;
