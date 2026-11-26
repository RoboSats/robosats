import { signCleartextMessage } from '../../pgp';
import {
  ACTION_SIGNATURE_WINDOW,
  orderActionContent,
  reviewActionContent,
  signAction,
  timedActionContent,
} from '../actionSignature';

jest.mock('../../pgp', () => ({
  signCleartextMessage: jest.fn().mockResolvedValue('-----BEGIN PGP SIGNED MESSAGE-----'),
}));

describe('action signature content builders', () => {
  it('binds order actions to action, order id and coordinator shortAlias', () => {
    expect(orderActionContent('confirm', 93, 'bazaar')).toBe('confirm:93:bazaar');
    expect(orderActionContent('take', 1, 'robosats')).toBe('take:1:robosats');
  });

  it('binds timed actions to the action and the current unix timestamp', () => {
    const before = Math.floor(Date.now() / 1000);
    const content = timedActionContent('make');
    const after = Math.floor(Date.now() / 1000);
    expect(content).toMatch(/^make:\d+$/);
    const ts = Number(content.split(':')[1]);
    expect(ts).toBeGreaterThanOrEqual(before);
    expect(ts).toBeLessThanOrEqual(after);
  });

  it('binds the review action to the robot nostr pubkey without a timestamp', () => {
    expect(reviewActionContent('abc123')).toBe('review:abc123');
  });

  it('keeps the signature window at 300 seconds', () => {
    expect(ACTION_SIGNATURE_WINDOW).toBe(300);
  });
});

describe('signAction', () => {
  it('returns undefined when the encrypted private key is missing', async () => {
    await expect(signAction('make:1', undefined, 'token')).resolves.toBeUndefined();
    expect(signCleartextMessage).not.toHaveBeenCalled();
  });

  it('returns undefined when the token is missing', async () => {
    await expect(signAction('make:1', 'enc-priv-key', undefined)).resolves.toBeUndefined();
    expect(signCleartextMessage).not.toHaveBeenCalled();
  });

  it('signs the content with the robot key material', async () => {
    const result = await signAction('make:1', 'enc-priv-key', 'token');
    expect(signCleartextMessage).toHaveBeenCalledWith('make:1', 'enc-priv-key', 'token');
    expect(result).toBe('-----BEGIN PGP SIGNED MESSAGE-----');
  });
});
