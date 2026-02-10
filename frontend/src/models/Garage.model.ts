import { type Federation, Order } from '.';
import { genKey } from '../pgp';
import { systemClient } from '../services/System';
import { saveAsJson, createAccountRecoveryEvent, publishAccountRecoveryEvent } from '../utils';
import Slot from './Slot.model';
import GarageKey from './GarageKey.model';

export type GarageMode = 'legacy' | 'garageKey';
export type EnsureReusableSource = 'auto' | 'manual';

export interface EnsureReusableSlotOptions {
  source?: EnsureReusableSource;
  allowRelayPublish?: boolean;
}

export interface EnsureReusableSlotResult {
  switched: boolean;
  fromIndex: number;
  toIndex: number;
  reason: 'reusable' | 'active_order' | 'manual_navigation' | 'switched' | 'no_slot';
}

type GarageHooks = 'onSlotUpdate';

const STORAGE_MODE_KEY = 'garage_mode';

interface StoredSlot {
  token: string;
  robots: Record<string, { pubKey?: string; encPrivKey?: string }>;
  lastOrder?: Partial<Order> & { id?: number };
  activeOrder?: Partial<Order> & { id?: number };
  lastOrderStatusKnown?: boolean;
}

const hasStoredOrderDetails = (
  order: (Partial<Order> & { id?: number }) | null | undefined,
): boolean => {
  if (!order) return false;

  return (
    (order.maker ?? 0) > 0 ||
    (order.taker ?? 0) > 0 ||
    (order.payment_method ?? '') !== '' ||
    (order.maker_nick ?? '') !== '' ||
    (order.status_message ?? '') !== '' ||
    (order.bond_size ?? '') !== '' ||
    Boolean(order.bad_request)
  );
};

class Garage {
  constructor() {
    this.slots = {};
    this.currentSlot = null;
    this.garageKey = null;
    this.mode = 'legacy'; // default mode
    this.manualNavigationActive = false;

    this.hooks = {
      onSlotUpdate: [],
    };

    this.loadMode();
    this.slotsLoaded = this.loadSlots();
  }

  slots: Record<string, Slot>;
  currentSlot: string | null;
  garageKey: GarageKey | null;
  mode: GarageMode;
  manualNavigationActive: boolean;
  slotsLoaded: Promise<void>;

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

  waitForSlotsLoaded = async (): Promise<void> => {
    await this.slotsLoaded;
  };

  // Storage
  download = (client: 'mobile' | 'web' | 'desktop' | string): void => {
    const keys = Object.keys(this.slots);
    saveAsJson(`garage_slots_${new Date().toISOString()}.json`, keys, client);
  };

  save = (): void => {
    systemClient.setItem('garage_slots', JSON.stringify(this.slots));
    if (this.currentSlot) systemClient.setItem('garage_current_slot', this.currentSlot);
  };

  delete = (): void => {
    this.slots = {};
    this.currentSlot = null;
    this.manualNavigationActive = false;
    systemClient.deleteItem('garage_slots');
    systemClient.deleteItem('garage_current_slot');
    this.triggerHook('onSlotUpdate');
  };

  loadSlots = async (): Promise<void> => {
    this.slots = {};
    const slotsDump: string = (await systemClient.getItem('garage_slots')) ?? '';

    if (slotsDump !== '') {
      const rawSlots = JSON.parse(slotsDump) as Record<string, StoredSlot>;
      Object.values(rawSlots).forEach((rawSlot) => {
        if (rawSlot?.token) {
          const robotAliases = Object.keys(rawSlot.robots ?? {});
          if (robotAliases.length === 0) {
            return;
          }

          const robotAttributes = Object.values(rawSlot.robots ?? {})[0] ?? {};
          this.slots[rawSlot.token] = new Slot(
            rawSlot.token,
            robotAliases,
            {
              pubKey: robotAttributes?.pubKey,
              encPrivKey: robotAttributes?.encPrivKey,
            },
            () => {
              this.triggerHook('onSlotUpdate');
            },
          );
          if (rawSlot.lastOrder?.id) {
            this.slots[rawSlot.token].lastOrder = new Order(rawSlot.lastOrder);
            this.slots[rawSlot.token].lastOrderStatusKnown =
              typeof rawSlot.lastOrderStatusKnown === 'boolean'
                ? rawSlot.lastOrderStatusKnown
                : hasStoredOrderDetails(rawSlot.lastOrder);
          }
          if (rawSlot.activeOrder?.id) {
            this.slots[rawSlot.token].activeOrder = new Order(rawSlot.activeOrder);
          }
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

  setCurrentSlot: (currentSlot: string) => void = (currentSlot) => {
    this.currentSlot = currentSlot;
    this.save();
    this.triggerHook('onSlotUpdate');
  };

  resetManualNavigation = (): void => {
    this.manualNavigationActive = false;
  };

  ensureReusableSlot = async (
    federation: Federation,
    options: EnsureReusableSlotOptions = {},
  ): Promise<EnsureReusableSlotResult> => {
    const { source = 'auto', allowRelayPublish = true } = options;

    if (this.mode !== 'garageKey' || !this.garageKey) {
      return { switched: false, fromIndex: 0, toIndex: 0, reason: 'no_slot' };
    }

    await this.waitForSlotsLoaded();

    const currentIndex = this.garageKey.currentAccountIndex;

    if (source === 'auto' && this.manualNavigationActive) {
      return {
        switched: false,
        fromIndex: currentIndex,
        toIndex: currentIndex,
        reason: 'manual_navigation',
      };
    }

    const currentSlot = this.getSlot();

    if (!currentSlot) {
      return { switched: false, fromIndex: currentIndex, toIndex: currentIndex, reason: 'no_slot' };
    }

    if (currentSlot.activeOrder?.id) {
      return {
        switched: false,
        fromIndex: currentIndex,
        toIndex: currentIndex,
        reason: 'active_order',
      };
    }

    await currentSlot.ensureLastOrderStatus(federation);

    if (currentSlot.isReusable()) {
      return {
        switched: false,
        fromIndex: currentIndex,
        toIndex: currentIndex,
        reason: 'reusable',
      };
    }

    const fromIndex = currentIndex;
    const nextIndex = await this.findNextUnusedAccount(federation, fromIndex + 1);

    this.garageKey.setAccountIndex(nextIndex);
    await this.createRobotFromGarageKey(federation, nextIndex);

    if (allowRelayPublish) {
      this.publishAccountRecovery(federation, nextIndex);
    }

    return { switched: true, fromIndex, toIndex: nextIndex, reason: 'switched' };
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

  loadMode = async (): Promise<void> => {
    const savedMode = await systemClient.getItem(STORAGE_MODE_KEY);
    if (savedMode === 'legacy' || savedMode === 'garageKey') {
      this.mode = savedMode;
    }
  };

  setMode = (mode: GarageMode): void => {
    this.mode = mode;
    this.manualNavigationActive = false;
    systemClient.setItem(STORAGE_MODE_KEY, mode);
    this.triggerHook('onSlotUpdate');
  };

  getMode = (): GarageMode => {
    return this.mode;
  };

  setGarageKey = (garageKey: GarageKey): void => {
    this.garageKey = garageKey;
    this.garageKey.save();
    this.triggerHook('onSlotUpdate');
  };

  getGarageKey = (): GarageKey | null => {
    return this.garageKey;
  };

  loadGarageKey = async (): Promise<void> => {
    this.garageKey = await GarageKey.load(() => {
      this.triggerHook('onSlotUpdate');
    });
    if (this.garageKey) {
      console.log('Garage Key was loaded from local storage');
      this.triggerHook('onSlotUpdate');
    }
  };

  deleteGarageKey = (): void => {
    if (this.garageKey) {
      this.garageKey.delete();
      this.garageKey = null;
      this.manualNavigationActive = false;
      this.triggerHook('onSlotUpdate');
    }
  };

  createRobotFromGarageKey = async (
    federation: Federation,
    accountIndex?: number,
    autoFindUnused: boolean = false,
  ): Promise<void> => {
    if (!this.garageKey) {
      throw new Error('No garage key set');
    }

    await this.waitForSlotsLoaded();

    let index = accountIndex ?? this.garageKey.currentAccountIndex;

    if (autoFindUnused) {
      index = await this.findNextUnusedAccount(federation, 0);
      this.garageKey.setAccountIndex(index);
    } else if (accountIndex !== undefined && accountIndex !== this.garageKey.currentAccountIndex) {
      this.garageKey.setAccountIndex(accountIndex);
    }

    const token = this.garageKey.deriveRobotToken(index);

    await this.createRobot(federation, token);
    await this.fetchRobot(federation, token);
    await this.getSlot(token)?.ensureLastOrderStatus(federation);
    this.setCurrentSlot(token);
  };

  nextAccount = async (federation: Federation, source: EnsureReusableSource = 'manual'): Promise<void> => {
    if (!this.garageKey) {
      throw new Error('No garage key set');
    }

    if (source === 'manual') {
      this.manualNavigationActive = true;
    }
    this.garageKey.incrementAccount();
    await this.createRobotFromGarageKey(federation);
  };

  previousAccount = async (
    federation: Federation,
    source: EnsureReusableSource = 'manual',
  ): Promise<void> => {
    if (!this.garageKey) {
      throw new Error('No garage key set');
    }

    if (source === 'manual') {
      this.manualNavigationActive = true;
    }
    this.garageKey.decrementAccount();
    await this.createRobotFromGarageKey(federation);
  };

  getCurrentAccountIndex = (): number => {
    return this.garageKey?.currentAccountIndex ?? 0;
  };

  setAccountIndex = async (
    federation: Federation,
    index: number,
    source: EnsureReusableSource = 'manual',
  ): Promise<void> => {
    if (!this.garageKey) {
      throw new Error('No garage key set');
    }

    if (source === 'manual') {
      this.manualNavigationActive = true;
    }
    this.garageKey.setAccountIndex(index);
    await this.createRobotFromGarageKey(federation);
  };

  publishAccountRecovery = (federation: Federation, accountIndex?: number): void => {
    if (!this.garageKey || !federation.roboPool) {
      return;
    }

    const indexToPublish = accountIndex ?? this.garageKey.currentAccountIndex;

    try {
      const event = createAccountRecoveryEvent(
        this.garageKey.nostrSecKey,
        indexToPublish,
      );
      publishAccountRecoveryEvent(event, federation.roboPool);
      console.log(`Published account recovery event for account ${indexToPublish}`);
    } catch (error) {
      console.error('Failed to publish account recovery event:', error);
    }
  };

  makeOrderWithRecovery = async (
    federation: Federation,
    attributes: object,
  ): Promise<Order | null> => {
    const slot = this.getSlot();
    if (!slot) {
      console.error('No slot available');
      return null;
    }

    const order = await slot.makeOrder(federation, attributes);

    if (!order?.bad_request && this.garageKey) {
      this.publishAccountRecovery(federation);
    }

    return order;
  };

  findNextUnusedAccount = async (
    federation: Federation,
    startIndex: number = 0,
  ): Promise<number> => {
    if (!this.garageKey) {
      throw new Error('No garage key set');
    }

    await this.waitForSlotsLoaded();

    const maxSearch = 100;
    for (let i = startIndex; i < startIndex + maxSearch; i++) {
      const token = this.garageKey.deriveRobotToken(i);
      const existingSlot = this.getSlot(token);

      if (!existingSlot) {
        return i;
      }

      await existingSlot.ensureLastOrderStatus(federation);
      if (existingSlot.isReusable()) {
        return i;
      }
    }

    console.warn(`No unused account found in range ${startIndex}-${startIndex + maxSearch}`);
    return startIndex + maxSearch;
  };

  isCurrentSlotUsed = (): boolean => {
    const slot = this.getSlot();
    return slot ? slot.lastOrder !== null : false;
  };
}

export default Garage;
