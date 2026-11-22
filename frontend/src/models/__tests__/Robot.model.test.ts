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

  it('clears stale order ids, resolves loading and skips the request when the coordinator has no url', async () => {
    const spy = jest.spyOn(apiClient, 'get').mockResolvedValue(null);
    const robot = makeRobot();
    await robot.fetch(makeFederation(''));
    expect(spy).not.toHaveBeenCalled();
    expect(robot.lastOrderId).toBeNull();
    expect(robot.activeOrderId).toBeNull();
    expect(robot.loading).toBe(false);
  });

  it('resolves loading for a coordinator missing from the federation', async () => {
    const robot = makeRobot();
    robot.shortAlias = 'ghost';
    const result = await robot.fetch(makeFederation('http://testcoord.onion'));
    expect(result).toBeNull();
    expect(robot.loading).toBe(false);
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

describe('Robot.fetchReward routing budget', () => {
  afterEach(() => jest.restoreAllMocks());

  it.each([undefined, 0, 1000, 10000])(
    'sends budget %p without dropping explicit zero',
    async (ppm) => {
      const postSpy = jest
        .spyOn(apiClient, 'post')
        .mockResolvedValue({ successful_withdrawal: true });
      const robot = makeRobot();
      robot.earnedRewards = 10000;
      await robot.fetchReward(makeFederation('http://testcoord.onion'), 'signed-fixture', ppm);
      expect(postSpy).toHaveBeenCalledWith(
        'http://testcoord.onion',
        '/api/reward/',
        { invoice: 'signed-fixture', routing_budget_ppm: ppm },
        { tokenSHA256: 'sha' },
      );
      expect(robot.earnedRewards).toBe(0);
    },
  );

  it('preserves rewards after a failed claim and does not post to an empty coordinator url', async () => {
    const postSpy = jest
      .spyOn(apiClient, 'post')
      .mockResolvedValue({ successful_withdrawal: false, earned_rewards: 0 });
    const robot = makeRobot();
    robot.earnedRewards = 10000;
    await robot.fetchReward(makeFederation('http://testcoord.onion'), 'signed-fixture', 1000);
    expect(robot.earnedRewards).toBe(10000);
    postSpy.mockClear();
    await robot.fetchReward(makeFederation(''), 'signed-fixture', 1000);
    expect(postSpy).not.toHaveBeenCalled();
  });

  it.each([
    [{ successful_withdrawal: true, earned_rewards: 100 }, 100],
    [{ successful_withdrawal: true, earned_rewards: 0 }, 0],
    [{ successful_withdrawal: true }, 0],
  ])(
    'uses successful response %p to set the remaining balance to %p',
    async (response, balance) => {
      jest.spyOn(apiClient, 'post').mockResolvedValue(response);
      const robot = makeRobot();
      robot.earnedRewards = 10000;
      await robot.fetchReward(makeFederation('http://testcoord.onion'), 'signed-fixture', 1000);
      expect(robot.earnedRewards).toBe(balance);
    },
  );

  it('keeps the authoritative remaining balance after a refresh during a pending claim', async () => {
    let resolveRequest: (value: {
      successful_withdrawal: boolean;
      earned_rewards: number;
    }) => void = () => {};
    jest
      .spyOn(apiClient, 'post')
      .mockImplementation(() => new Promise((resolve) => (resolveRequest = resolve)));
    jest.spyOn(apiClient, 'get').mockResolvedValue({ earned_rewards: 100 });
    const robot = makeRobot();
    robot.earnedRewards = 10000;
    const federation = makeFederation('http://testcoord.onion');
    const request = robot.fetchReward(federation, 'signed-fixture', 1000);
    await robot.fetch(federation);
    expect(robot.earnedRewards).toBe(100);
    resolveRequest({ successful_withdrawal: true, earned_rewards: 100 });
    await request;
    expect(robot.earnedRewards).toBe(100);
  });
});
