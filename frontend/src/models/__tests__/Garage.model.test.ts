import { nip59, type Event } from 'nostr-tools';
import Garage from '../Garage.model';
import GarageKey from '../GarageKey.model';
import Slot from '../Slot.model';
import Order from '../Order.model';
import type Federation from '../Federation.model';
import { apiClient } from '../../services/api';
import { systemClient } from '../../services/System';

jest.mock('../../services/System', () => ({
  systemClient: { getItem: jest.fn(), setItem: jest.fn(), deleteItem: jest.fn() },
}));
jest.mock('../../pgp', () => ({
  genKey: jest
    .fn()
    .mockResolvedValue({ publicKeyArmored: 'public', encryptedPrivateKeyArmored: 'encrypted' }),
}));

const key = 'robo180cvv07tjdrrgpa0j7j7tmnyl2yr6yr7l8j4s3evf6u64th6gkwsg9czpj';
const federation = {
  getCoordinatorsAlias: () => ['test'],
  getCoordinator: () => ({ shortAlias: 'test', url: 'https://test.example' }),
  roboPool: { sendEvent: jest.fn() },
} as unknown as Federation;

async function garageWithSlot() {
  const garage = new Garage();
  await garage.waitForSlotsLoaded();
  garage.setMode('garageKey');
  garage.setGarageKey(new GarageKey(key));
  const token = garage.garageKey!.getCurrentRobotToken();
  const slot = new Slot(token, ['test'], {}, jest.fn());
  garage.slots[token] = slot;
  garage.currentSlot = token;
  await Promise.resolve();
  jest.mocked(slot.onSlotUpdate).mockClear();
  return { garage, slot };
}

beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(systemClient.getItem).mockReset().mockResolvedValue(undefined);
  jest.spyOn(console, 'log').mockImplementation(() => {});
});

afterEach(() => jest.restoreAllMocks());

it('notifies completion for an empty robot without repeatedly fetching it', async () => {
  const { slot } = await garageWithSlot();
  const get = jest.spyOn(apiClient, 'get').mockResolvedValue({ earned_rewards: 0 });
  await slot.fetchRobot(federation);
  expect(slot.loading).toBe(false);
  expect(slot.onSlotUpdate).toHaveBeenCalledTimes(1);
  expect(get).toHaveBeenCalledTimes(1);
});

it.each([4, 5, 12, 14, 17, 18])(
  'reconciles terminal status %s once and preserves renewal eligibility',
  async (status) => {
    const { slot } = await garageWithSlot();
    slot.activeOrder = new Order({ id: 1, shortAlias: 'test', maker: 1, status: 9 });
    expect(slot.isReusable()).toBe(false);
    jest.spyOn(apiClient, 'get').mockResolvedValue({ status });
    await slot.fetchActiveOrder(federation);
    expect(slot.activeOrder).toBeNull();
    expect(slot.lastOrder?.status).toBe(status);
    expect(slot.isReusable()).toBe([4, 5].includes(status));
    slot.updateSlotFromOrder(slot.lastOrder);
    expect(slot.onSlotUpdate).toHaveBeenCalledTimes(1);
  },
);

it.each([13, 15, 16])('keeps unsettled status %s active', async (status) => {
  const { slot } = await garageWithSlot();
  slot.activeOrder = new Order({ id: 1, shortAlias: 'test', maker: 1, status: 9 });
  jest.spyOn(apiClient, 'get').mockResolvedValue({ status });
  await slot.fetchActiveOrder(federation);
  expect(slot.activeOrder?.status).toBe(status);
  expect(slot.isReusable()).toBe(false);
});

it('advances a persisted completed account but respects manual navigation', async () => {
  const { garage, slot } = await garageWithSlot();
  slot.activeOrder = new Order({ id: 1, shortAlias: 'test', maker: 1, status: 14 });
  jest.spyOn(apiClient, 'get').mockResolvedValue({ earned_rewards: 0 });
  garage.manualNavigationActive = true;
  expect((await garage.ensureReusableSlot(federation)).reason).toBe('manual_navigation');
  garage.resetManualNavigation();
  const result = await garage.ensureReusableSlot(federation);
  expect(result).toMatchObject({ switched: true, fromIndex: 0, toIndex: 1 });
  expect(garage.getSlot()?.token).toBe(garage.garageKey!.deriveRobotToken(1));
  expect(slot.activeOrder).toBeNull();
  expect(slot.isReusable()).toBe(false);
});

it('fails safely after 100 used accounts instead of selecting an unchecked account', async () => {
  const { garage, slot } = await garageWithSlot();
  slot.lastOrder = new Order({ id: 1, maker: 1, status: 14 });
  slot.lastOrderStatusKnown = true;
  for (let i = 0; i <= 100; i++) garage.slots[garage.garageKey!.deriveRobotToken(i)] = slot;
  await expect(garage.findNextUnusedAccount(federation)).rejects.toThrow('No unused account');
  expect(garage.getCurrentAccountIndex()).toBe(0);
});

it.each([undefined, { bad_request: 'rejected' }])(
  'does not publish or discard order history when creation fails (%j)',
  async (response) => {
    const { garage, slot } = await garageWithSlot();
    slot.lastOrder = new Order({ id: 3, maker: 1, status: 5 });
    jest.spyOn(apiClient, 'post').mockResolvedValue(response);
    await garage.makeOrderWithRecovery(federation, { shortAlias: 'test' });
    expect(federation.roboPool.sendEvent).not.toHaveBeenCalled();
    expect(slot.activeOrder).toBeNull();
    expect(slot.lastOrder?.id).toBe(3);
  },
);

it('publishes the creating account even if navigation changes during the request', async () => {
  const { garage, slot } = await garageWithSlot();
  const secret = garage.garageKey!.nostrSecKey;
  jest.spyOn(apiClient, 'post').mockImplementation(async () => {
    garage.garageKey!.setAccountIndex(8);
    return { id: 4, maker: 1 };
  });
  await garage.makeOrderWithRecovery(federation, { shortAlias: 'test' });
  expect(slot.activeOrder?.id).toBe(4);
  const event = jest.mocked(federation.roboPool.sendEvent).mock.calls[0][0];
  expect((nip59.unwrapEvent(event, secret) as Event).tags).toContainEqual(['account', '0']);
});

it('keeps the requested legacy default and loads saved mode without overwriting pending slots', async () => {
  let finishSlots!: (value: string) => void;
  const slots = new Promise<string>((resolve) => {
    finishSlots = resolve;
  });
  const token = new GarageKey(key).getCurrentRobotToken();
  jest.mocked(systemClient.getItem).mockImplementation(async (name) => {
    if (name === 'garage_slots') return slots;
    if (name === 'garage_mode') return 'garageKey';
    return undefined;
  });
  const garage = new Garage();
  const updated = jest.fn();
  garage.registerHook('onSlotUpdate', updated);
  expect(garage.mode).toBe('legacy');
  await Promise.resolve();
  expect(systemClient.setItem).not.toHaveBeenCalled();
  finishSlots(JSON.stringify({ [token]: { token, robots: { test: {} } } }));
  await garage.loadMode();
  expect(garage.mode).toBe('garageKey');
  expect(garage.getSlot(token)?.token).toBe(token);
  expect(updated).toHaveBeenCalled();
  const saves = jest
    .mocked(systemClient.setItem)
    .mock.calls.filter(([name]) => name === 'garage_slots');
  expect(JSON.parse(saves[saves.length - 1][1])[token].token).toBe(token);
});
