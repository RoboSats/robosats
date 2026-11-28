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

import { signCleartextMessage } from '../../pgp';
import { apiClient } from '../../services/api';
import type { Slot } from '../Slot.model';
import type Federation from '../Federation.model';
import Order from '../Order.model';
import Robot from '../Robot.model';

jest.mock('../../pgp', () => ({
  signCleartextMessage: jest.fn().mockResolvedValue('SIGNED_ACTION'),
}));

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

describe('Robot — signed actions', () => {
  const makeSigningRobot = (): Robot =>
    new Robot({
      shortAlias: 'test',
      token: 'token',
      encPrivKey: 'enc-priv-key',
      tokenSHA256: 'sha',
      nostrPubKey: 'npub123',
      hasEnoughEntropy: true,
    });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('fetchStealth posts the wantsStealth flag with a timestamped signature', async () => {
    const postSpy = jest.spyOn(apiClient, 'post').mockResolvedValue(null);
    const robot = makeSigningRobot();

    await robot.fetchStealth(makeFederation('http://testcoord.onion'), false);

    expect(signCleartextMessage).toHaveBeenCalledWith(
      expect.stringMatching(/^stealth:test:\d+$/),
      'enc-priv-key',
      'token',
    );
    expect(postSpy).toHaveBeenCalledWith(
      'http://testcoord.onion',
      '/api/stealth/',
      { wantsStealth: false, signature: 'SIGNED_ACTION' },
      { tokenSHA256: 'sha' },
    );
    expect(robot.stealthInvoices).toBe(false);
  });

  it('fetchWebhook puts the webhook settings with a timestamped signature', async () => {
    const putSpy = jest.spyOn(apiClient, 'put').mockResolvedValue({
      webhook_url: 'http://testwebhook.onion/notify',
      webhook_enabled: true,
      webhook_api_key: 'key',
    });
    const robot = makeSigningRobot();

    await robot.fetchWebhook(makeFederation('http://testcoord.onion'), {
      webhook_url: 'http://testwebhook.onion/notify',
    });

    expect(signCleartextMessage).toHaveBeenCalledWith(
      expect.stringMatching(/^robot:test:\d+$/),
      'enc-priv-key',
      'token',
    );
    expect(putSpy).toHaveBeenCalledWith(
      'http://testcoord.onion',
      '/api/robot/',
      { webhook_url: 'http://testwebhook.onion/notify', signature: 'SIGNED_ACTION' },
      { tokenSHA256: 'sha' },
    );
    expect(robot.webhookUrl).toBe('http://testwebhook.onion/notify');
  });

  it('loadReviewToken posts the nostr pubkey with its signature as content', async () => {
    const postSpy = jest.spyOn(apiClient, 'post').mockResolvedValue({ token: 'review-token' });
    const robot = makeSigningRobot();

    let loaded: string | undefined;
    robot.loadReviewToken(makeFederation('http://testcoord.onion'), (token) => {
      loaded = token;
    });

    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(signCleartextMessage).toHaveBeenCalledWith('review:npub123', 'enc-priv-key', 'token');
    expect(postSpy).toHaveBeenCalledWith(
      'http://testcoord.onion',
      '/api/review/',
      { pubkey: 'npub123', signature: 'SIGNED_ACTION' },
      { tokenSHA256: 'sha' },
    );
    expect(loaded).toBe('review-token');
  });
});
