import { signCleartextMessage } from '../../pgp';
import { apiClient } from '../../services/api';
import type Federation from '../Federation.model';
import Robot from '../Robot.model';
import type Slot from '../Slot.model';
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
      expect.stringMatching(/^make:\d+$/),
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
