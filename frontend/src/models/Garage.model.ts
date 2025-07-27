import { type Federation, Order } from '.';
import { genKey } from '../pgp';
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
    if (this.currentSlot) systemClient.setItem('garage_current_slot', this.currentSlot);
  };

  delete = (): void => {
    this.slots = {};
    this.currentSlot = null;
    systemClient.deleteItem('garage_slots');
    systemClient.deleteItem('garage_current_slot');
    this.triggerHook('onSlotUpdate');
  };

  loadSlots = async (): Promise<void> => {
    this.slots = {};
    const slotsDump: string = (await systemClient.getItem('garage_slots')) ?? '';

    if (slotsDump !== '') {
      const rawSlots: Record<string, object> = JSON.parse(slotsDump);
      Object.values(rawSlots).forEach((rawSlot: object) => {
        if (rawSlot?.token) {
          const robotAttributes = Object.values(rawSlot.robots)[0] as object;
          this.slots[rawSlot.token] = new Slot(
            rawSlot.token,
            Object.keys(rawSlot.robots),
            {
              pubKey: robotAttributes?.pubKey,
              encPrivKey: robotAttributes?.encPrivKey,
            },
            () => {
              this.triggerHook('onSlotUpdate');
            },
          );
          this.slots[rawSlot.token].updateSlotFromOrder(new Order(rawSlot.lastOrder));
          this.slots[rawSlot.token].updateSlotFromOrder(new Order(rawSlot.activeOrder));
        }
      });

      this.currentSlot =
        (await systemClient.getItem('garage_current_slot')) ?? Object.keys(rawSlots)[0];
      console.log('Robot Garage was loaded from local storage');
      this.triggerHook('onSlotUpdate');
    }
  };

  // Slots
  getSlot: (token?: string) => Slot | null = (token) => {
    const currentToken = token ?? this.currentSlot;
    return currentToken ? (this.slots[currentToken] ?? null) : null;
  };

  deleteSlot: (token?: string) => void = (token) => {
    const targetIndex = token ?? this.currentSlot;
    if (targetIndex) {
      Reflect.deleteProperty(this.slots, targetIndex);
      this.currentSlot = Object.keys(this.slots)[0] ?? null;
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
      this.triggerHook('onSlotUpdate');
    }
    return slot;
  };

  setCurrentSlot: (currentSlot: string) => void = (currentSlot) => {
    this.currentSlot = currentSlot;
    this.save();
    this.triggerHook('onSlotUpdate');
  };

  getSlotByOrder: (coordinator: string, orderID: number) => Slot | null = (
    coordinator,
    orderID,
  ) => {
    return (
      Object.values(this.slots).find((slot) => {
        const robot = slot.getRobot(coordinator);
        return slot.activeOrder?.shortAlias === coordinator && robot?.activeOrderId === orderID;
      }) ?? null
    );
  };

  getSlotByNostrPubKey: (nostrHexPubkey: string) => Slot | null = (nostrHexPubkey) => {
    return (
      Object.values(this.slots).find((slot) => {
        return slot.nostrPubKey === nostrHexPubkey;
      }) ?? null
    );
  };

  // Robots
  createRobot: (federation: Federation, token: string, skipSelect?: boolean) => Promise<void> =
    async (federation, token, skipSelect) => {
      if (!token) return;

      if (this.getSlot(token) === null) {
        try {
          const key = await genKey(token);
          const robotAttributes = {
            token,
            pubKey: key.publicKeyArmored,
            encPrivKey: key.encryptedPrivateKeyArmored,
          };

          if (!skipSelect) this.setCurrentSlot(token);

          this.slots[token] = new Slot(
            token,
            federation.getCoordinatorsAlias(),
            robotAttributes,
            () => {
              this.triggerHook('onSlotUpdate');
            },
          );
          void this.fetchRobot(federation, token);
          this.save();
        } catch (error) {
          console.error('Error:', error);
        }
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
