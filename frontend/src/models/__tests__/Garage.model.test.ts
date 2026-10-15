import { nip59, type Event } from 'nostr-tools';
import Garage from '../Garage.model';
import GarageKey from '../GarageKey.model';
import Slot from '../Slot.model';
import Order from '../Order.model';
import type Federation from '../Federation.model';
import { apiClient } from '../../services/api';
import { systemClient } from '../../services/System';
import { deriveCoordinatorToken } from '../../utils/garageKey';
import { sha256 } from 'js-sha256';
import hexToBase91 from '../../utils/hexToBase91';

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

// ─── Per-coordinator bearer isolation ────────────────────────────────────────

describe('Slot.legacy flag and per-coordinator bearer tokens', () => {
  it('legacy slot: all coordinators share the same tokenSHA256', () => {
    const token = new GarageKey(key).getCurrentRobotToken();
    const slot = new Slot(token, ['coordA', 'coordB'], {}, jest.fn(), true);
    const sha256A = slot.robots['coordA']?.tokenSHA256;
    const sha256B = slot.robots['coordB']?.tokenSHA256;
    expect(sha256A).toBeTruthy();
    expect(sha256A).toBe(sha256B);
    expect(slot.legacy).toBe(true);
  });

  it('legacy slot: tokenSHA256 matches base91(sha256(token))', () => {
    const token = new GarageKey(key).getCurrentRobotToken();
    const slot = new Slot(token, ['coordA'], {}, jest.fn(), true);
    const expected = hexToBase91(sha256(token));
    expect(slot.robots['coordA']?.tokenSHA256).toBe(expected);
  });

  it('non-legacy slot: coordinators get distinct tokenSHA256 values', () => {
    const token = new GarageKey(key).getCurrentRobotToken();
    const slot = new Slot(token, ['coordA', 'coordB'], {}, jest.fn(), false);
    const sha256A = slot.robots['coordA']?.tokenSHA256;
    const sha256B = slot.robots['coordB']?.tokenSHA256;
    expect(sha256A).toBeTruthy();
    expect(sha256B).toBeTruthy();
    expect(sha256A).not.toBe(sha256B);
    expect(slot.legacy).toBe(false);
  });

  it('non-legacy slot: tokenSHA256 matches the derived coordinator bearer', () => {
    const token = new GarageKey(key).getCurrentRobotToken();
    const slot = new Slot(token, ['coordA'], {}, jest.fn(), false);
    const coordToken = deriveCoordinatorToken(token, 'coordA');
    const expected = hexToBase91(sha256(coordToken));
    expect(slot.robots['coordA']?.tokenSHA256).toBe(expected);
  });

  it('non-legacy slot: tokenSHA256Hex is the hex sha256 of the coordinator token', () => {
    const token = new GarageKey(key).getCurrentRobotToken();
    const slot = new Slot(token, ['coordA'], {}, jest.fn(), false);
    const coordToken = deriveCoordinatorToken(token, 'coordA');
    expect(slot.robots['coordA']?.tokenSHA256Hex).toBe(sha256(coordToken));
  });

  it('non-legacy slot: per-coordinator bearer differs from the base token sha256', () => {
    const token = new GarageKey(key).getCurrentRobotToken();
    const slot = new Slot(token, ['coordA'], {}, jest.fn(), false);
    const baseBearer = hexToBase91(sha256(token));
    expect(slot.robots['coordA']?.tokenSHA256).not.toBe(baseBearer);
  });

  it('createRobotFromGarageKey creates a non-legacy slot', async () => {
    jest.mocked(systemClient.getItem).mockResolvedValue(undefined);
    jest.spyOn(apiClient, 'get').mockResolvedValue({ earned_rewards: 0 });
    const garage = new Garage();
    await garage.waitForSlotsLoaded();
    garage.setMode('garageKey');
    garage.setGarageKey(new GarageKey(key));
    await garage.createRobotFromGarageKey(federation, 0);
    const slot = garage.getSlot();
    expect(slot).not.toBeNull();
    expect(slot!.legacy).toBe(false);
  });

  it('legacy flag is persisted and restored through save/load', async () => {
    let savedJson = '';
    jest.mocked(systemClient.setItem).mockImplementation((name, value) => {
      if (name === 'garage_slots') savedJson = value as string;
    });
    jest.mocked(systemClient.getItem).mockImplementation(async (name) => {
      if (name === 'garage_slots') return savedJson || undefined;
      return undefined;
    });
    jest.spyOn(apiClient, 'get').mockResolvedValue({ earned_rewards: 0 });

    // Create a non-legacy slot via createRobotFromGarageKey.
    const garage1 = new Garage();
    await garage1.waitForSlotsLoaded();
    garage1.setMode('garageKey');
    garage1.setGarageKey(new GarageKey(key));
    await garage1.createRobotFromGarageKey(federation, 0);
    const originalToken = garage1.getSlot()!.token!;
    // Trigger explicit save so savedJson is populated with the legacy flag.
    garage1.save();

    // Load a fresh Garage from the saved JSON.
    const garage2 = new Garage();
    await garage2.waitForSlotsLoaded();
    const restoredSlot = garage2.getSlot(originalToken);
    expect(restoredSlot).not.toBeNull();
    expect(restoredSlot!.legacy).toBe(false);
    // Bearer must still be coordinator-specific after restore.
    const coordToken = deriveCoordinatorToken(originalToken, 'test');
    expect(restoredSlot!.robots['test']?.tokenSHA256).toBe(hexToBase91(sha256(coordToken)));
  });

  it('absent legacy field in stored JSON defaults to true (backwards compat)', async () => {
    const token = new GarageKey(key).getCurrentRobotToken();
    const storedJson = JSON.stringify({
      [token]: { token, robots: { test: {} } },
      // No "legacy" field — simulates a slot stored before this feature.
    });
    jest.mocked(systemClient.getItem).mockImplementation(async (name) => {
      if (name === 'garage_slots') return storedJson;
      return undefined;
    });
    const garage = new Garage();
    await garage.waitForSlotsLoaded();
    const slot = garage.getSlot(token);
    expect(slot).not.toBeNull();
    expect(slot!.legacy).toBe(true);
    // Legacy bearer: base91(sha256(token)).
    expect(slot!.robots['test']?.tokenSHA256).toBe(hexToBase91(sha256(token)));
  });
});

it('loads a recovered account only once and selects cached accounts before the refresh completes', async () => {
  const { garage } = await garageWithSlot();
  const get = jest.spyOn(apiClient, 'get').mockResolvedValue({ earned_rewards: 0 });
  await garage.createRobotFromGarageKey(federation, 1);
  expect(get).toHaveBeenCalledTimes(1);
  const accountOne = garage.getSlot();
  await garage.createRobotFromGarageKey(federation, 0);
  let finish: (value: object) => void = () => {};
  let started: () => void = () => {};
  const requestStarted = new Promise<void>((resolve) => {
    started = resolve;
  });
  get.mockImplementationOnce(
    () =>
      new Promise((resolve) => {
        finish = resolve;
        started();
      }),
  );
  const switching = garage.createRobotFromGarageKey(federation, 1);
  await requestStarted;
  expect(garage.getSlot()).toBe(accountOne);
  finish({ earned_rewards: 0 });
  await switching;
});
