import { signCleartextMessage } from '../../pgp';
import { apiClient } from '../../services/api';
import type Federation from '../Federation.model';
import Robot from '../Robot.model';
import Slot from '../Slot.model';
import Order from '../Order.model';

jest.mock('../../pgp', () => ({
  signCleartextMessage: jest.fn().mockResolvedValue('SIGNED_ACTION'),
}));

const makeFederation = (url: string): Federation =>
  ({
    getCoordinator: (alias: string) => (alias === 'test' ? { url, shortAlias: 'test' } : undefined),
  }) as unknown as Federation;

const makeSlot = (robot: Robot): Slot =>
  ({
    getRobot: () => robot,
    ensureRobot: () => robot,
    token: robot.token,
  }) as unknown as Slot;

describe('Order.submitAction — action signature', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('does not post when the coordinator has no url', async () => {
    const postSpy = jest.spyOn(apiClient, 'post').mockResolvedValue(null);
    const order = new Order({ id: 93, shortAlias: 'test' });
    await order.submitAction(makeFederation(''), {} as unknown as Slot, {
      action: 'cancel',
    });
    expect(postSpy).not.toHaveBeenCalled();
  });

  it('posts the action with a signature bound to action, order id and shortAlias', async () => {
    const postSpy = jest.spyOn(apiClient, 'post').mockResolvedValue({ id: 93 });
    const robot = new Robot({ token: 'token', encPrivKey: 'enc-priv-key', tokenSHA256: 'sha' });
    const order = new Order({ id: 93, shortAlias: 'test' });

    await order.submitAction(makeFederation('http://testcoord.onion'), makeSlot(robot), {
      action: 'confirm',
    });

    expect(signCleartextMessage).toHaveBeenCalledWith('confirm:93:test', 'enc-priv-key', 'token');
    expect(postSpy).toHaveBeenCalledWith(
      'http://testcoord.onion',
      '/api/order/?order_id=93',
      { action: 'confirm', signature: 'SIGNED_ACTION' },
      { tokenSHA256: 'sha' },
    );
  });

  it('posts without a signature when the robot has no key material', async () => {
    const postSpy = jest.spyOn(apiClient, 'post').mockResolvedValue({ id: 93 });
    const robot = new Robot({ tokenSHA256: 'sha' });
    const order = new Order({ id: 93, shortAlias: 'test' });

    await order.submitAction(makeFederation('http://testcoord.onion'), makeSlot(robot), {
      action: 'dispute',
    });

    expect(postSpy).toHaveBeenCalledWith(
      'http://testcoord.onion',
      '/api/order/?order_id=93',
      { action: 'dispute', signature: undefined },
      { tokenSHA256: 'sha' },
    );
  });
});

describe('Order.make — action signature', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('posts the maker form with a timestamped signature', async () => {
    const postSpy = jest.spyOn(apiClient, 'post').mockResolvedValue({ id: 7 });
    const robot = new Robot({ token: 'token', encPrivKey: 'enc-priv-key', tokenSHA256: 'sha' });
    const order = new Order({ id: 0, shortAlias: 'test', type: 1, currency: 1 });

    await order.make(makeFederation('http://testcoord.onion'), makeSlot(robot));

    expect(signCleartextMessage).toHaveBeenCalledWith(
      expect.stringMatching(/^make:test:\d+$/),
      'enc-priv-key',
      'token',
    );
    expect(postSpy).toHaveBeenCalledWith(
      'http://testcoord.onion',
      '/api/make/',
      expect.objectContaining({ signature: 'SIGNED_ACTION' }),
      expect.objectContaining({ tokenSHA256: 'sha' }),
    );
  });

  it('does not post when the robot has no auth headers', async () => {
    const postSpy = jest.spyOn(apiClient, 'post').mockResolvedValue(null);
    const robot = new Robot({ token: 'token', encPrivKey: 'enc-priv-key' });
    robot.getAuthHeaders = () => null;
    const order = new Order({ id: 0, shortAlias: 'test', type: 1, currency: 1 });

    await order.make(makeFederation('http://testcoord.onion'), makeSlot(robot));

    expect(postSpy).not.toHaveBeenCalled();
  });
});

describe('Order signatures — per-coordinator robot resolution', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const twoCoordinatorFederation = {
    getCoordinator: (alias: string) =>
      alias === 'a' || alias === 'b'
        ? { url: `http://${alias}.onion`, shortAlias: alias }
        : undefined,
  } as unknown as Federation;

  const slotWithDivergentKeys = (): Slot => {
    const slot = new Slot('token', ['a', 'b'], { pubKey: 'pub-b', encPrivKey: 'enc-b' }, jest.fn());
    slot.robots['a'].update({ pubKey: 'pub-a', encPrivKey: 'enc-a' });
    return slot;
  };

  it.each(['a', 'b'])('make signs with the robot of the target coordinator %s', async (alias) => {
    const postSpy = jest.spyOn(apiClient, 'post').mockResolvedValue({ id: 7 });
    jest.spyOn(apiClient, 'get').mockResolvedValue(null);
    const order = new Order({ id: 0, shortAlias: alias, type: 1, currency: 1 });

    await order.make(twoCoordinatorFederation, slotWithDivergentKeys());

    expect(signCleartextMessage).toHaveBeenCalledWith(
      expect.stringMatching(/^make:[ab]:\d+$/),
      `enc-${alias}`,
      'token',
    );
    expect(postSpy).toHaveBeenCalledWith(
      `http://${alias}.onion`,
      '/api/make/',
      expect.objectContaining({ signature: 'SIGNED_ACTION' }),
      expect.objectContaining({ tokenSHA256: expect.any(String) }),
    );
  });

  it('submitAction signs with the order coordinator robot even when the last order points elsewhere', async () => {
    const postSpy = jest.spyOn(apiClient, 'post').mockResolvedValue({ id: 93 });
    jest.spyOn(apiClient, 'get').mockResolvedValue(null);
    const slot = slotWithDivergentKeys();
    slot.lastOrder = new Order({ id: 5, shortAlias: 'a' });
    const order = new Order({ id: 93, shortAlias: 'b' });

    await order.submitAction(twoCoordinatorFederation, slot, { action: 'take', amount: 1 });

    expect(signCleartextMessage).toHaveBeenCalledWith('take:93:b', 'enc-b', 'token');
    expect(postSpy).toHaveBeenCalledWith(
      'http://b.onion',
      '/api/order/?order_id=93',
      { action: 'take', amount: 1, signature: 'SIGNED_ACTION' },
      { tokenSHA256: expect.any(String) },
    );
  });
});
