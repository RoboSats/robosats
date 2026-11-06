import Slot from '../Slot.model';
import Order from '../Order.model';
import type Federation from '../Federation.model';
import { apiClient } from '../../services/api';

jest.mock('../../services/System', () => ({
  systemClient: { getItem: jest.fn(), setItem: jest.fn(), deleteItem: jest.fn() },
}));

const token = 'aQ7wD3pL9xN2vK6mR1tY8sB4cF0hJ5gZ';
const federation = {
  getCoordinatorsAlias: () => ['test'],
  getCoordinator: () => ({ shortAlias: 'test', url: 'https://test.example' }),
  roboPool: { sendEvent: jest.fn() },
} as unknown as Federation;

async function slotWithActiveOrder(status: number) {
  const slot = new Slot(token, ['test'], {}, jest.fn());
  await Promise.resolve();
  slot.activeOrder = new Order({ id: 7, shortAlias: 'test', maker: 1, status });
  jest.mocked(slot.onSlotUpdate).mockClear();
  return slot;
}

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(console, 'log').mockImplementation(() => {});
});

afterEach(() => jest.restoreAllMocks());

it('refreshes the slot when an action on its active order changes the status', async () => {
  const slot = await slotWithActiveOrder(9);
  jest.spyOn(apiClient, 'post').mockResolvedValue({ id: 7, status: 10 });

  await slot.submitOrderAction(federation, slot.activeOrder!, { action: 'confirm' });

  expect(slot.activeOrder?.status).toBe(10);
  expect(slot.onSlotUpdate).toHaveBeenCalled();
});

it('does not refresh the slot when the status stays the same', async () => {
  const slot = await slotWithActiveOrder(9);
  jest.spyOn(apiClient, 'post').mockResolvedValue({ id: 7, status: 9 });

  await slot.submitOrderAction(federation, slot.activeOrder!, { action: 'pause' });

  expect(slot.onSlotUpdate).not.toHaveBeenCalled();
});
