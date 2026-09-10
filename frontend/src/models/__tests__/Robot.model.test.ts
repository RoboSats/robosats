/**
 * Regression tests for Robot.fetch / Order.submitAction coordinator guards.
 *
 * A coordinator may have no address for the current network/origin (e.g.
 * testnet.onion is null) — its url is ''. Any request made against '' becomes
 * a relative fetch resolved against the CURRENT host (the wrong coordinator!):
 * a robot whose alias is 'alice' would receive the current host's
 * last_order_id and every coordinator in the slot would display the same
 * order. The guard must skip the request — and fetch must clear the stale
 * order ids that a previous bug may have persisted in the garage.
 */

import { apiClient } from '../../services/api';
import type { Slot } from '../Slot.model';
import type Federation from '../Federation.model';
import Order from '../Order.model';
import Robot from '../Robot.model';

const makeFederation = (url: string): Federation =>
  ({
    getCoordinator: (alias: string) => (alias === 'test' ? { url, shortAlias: 'test' } : undefined),
  }) as unknown as Federation;

const makeRobot = (lastOrderId = 93): Robot =>
  new Robot({
    shortAlias: 'test',
    token: 'token',
    tokenSHA256: 'sha',
    hasEnoughEntropy: true,
    activeOrderId: lastOrderId,
    lastOrderId,
  });

describe('Robot.fetch — coordinator.url guard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('clears stale order ids and skips the request when the coordinator has no url', async () => {
    const spy = jest.spyOn(apiClient, 'get').mockResolvedValue(null);
    const robot = makeRobot();
    await robot.fetch(makeFederation(''));
    expect(spy).not.toHaveBeenCalled();
    expect(robot.lastOrderId).toBeNull();
    expect(robot.activeOrderId).toBeNull();
  });

  it('requests the robot data from the coordinator url when available', async () => {
    const spy = jest
      .spyOn(apiClient, 'get')
      .mockResolvedValue({ nickname: 'robo', last_order_id: 5 });
    const robot = makeRobot();
    await robot.fetch(makeFederation('http://testcoord.onion'));
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith(
      'http://testcoord.onion',
      '/api/robot/',
      expect.anything(),
      true,
    );
    expect(robot.lastOrderId).toBe(5);
  });
});

describe('Order.submitAction — coordinator.url guard', () => {
  it('does not post when the coordinator has no url', async () => {
    const postSpy = jest.spyOn(apiClient, 'post').mockResolvedValue(null);
    const order = new Order({ id: 93, shortAlias: 'test' });
    await order.submitAction(makeFederation(''), {} as unknown as Slot, {
      action: 'cancel',
    });
    expect(postSpy).not.toHaveBeenCalled();
  });
});
