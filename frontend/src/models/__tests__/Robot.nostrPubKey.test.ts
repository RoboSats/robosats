import { apiClient } from '../../services/api';
import type Federation from '../Federation.model';
import Robot from '../Robot.model';

const derivedPubKey = '3bf0c63fcb93463407af97a5e5ee64fa883d107ef9e558472c4eb9aaaefa459d';
const storedPubKey = `${'0'.repeat(63)}1`;

const federation = {
  getCoordinator: (alias: string) =>
    alias === 'test' ? { url: 'http://testcoord.onion', shortAlias: 'test' } : undefined,
} as unknown as Federation;

const makeRobot = (): Robot =>
  new Robot({
    shortAlias: 'test',
    token: 'token',
    tokenSHA256: 'sha',
    hasEnoughEntropy: true,
    nostrPubKey: derivedPubKey,
  });

describe('Robot.fetch — nostr_pubkey from the coordinator', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it.each([['0'.repeat(64)], ['None'], ['Nostr'], [''], [undefined]])(
    'keeps the derived key when the coordinator returns %p',
    async (nostrPubkey) => {
      jest
        .spyOn(apiClient, 'get')
        .mockResolvedValue({ nickname: 'robo', nostr_pubkey: nostrPubkey });
      const robot = makeRobot();
      await robot.fetch(federation);
      expect(robot.nostrPubKey).toBe(derivedPubKey);
      expect(robot.getAuthHeaders()?.nostrPubkey).toBe(derivedPubKey);
    },
  );

  it('adopts a valid key stored by the coordinator', async () => {
    jest
      .spyOn(apiClient, 'get')
      .mockResolvedValue({ nickname: 'robo', nostr_pubkey: storedPubKey });
    const robot = makeRobot();
    await robot.fetch(federation);
    expect(robot.nostrPubKey).toBe(storedPubKey);
  });
});
