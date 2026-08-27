import { apiClient } from '../services/api';
import Robot from './Robot.model';
import type Federation from './Federation.model';

jest.mock('../services/api', () => ({
  apiClient: { put: jest.fn() },
}));

const mockPut = apiClient.put as jest.MockedFunction<typeof apiClient.put>;
const federation = {
  getCoordinator: jest.fn(() => ({ url: 'http://coordinator.onion' })),
} as unknown as Federation;

describe('Robot.saveNostrForward', () => {
  beforeEach(() => {
    mockPut.mockReset();
  });

  it('applies an explicit null clear and reports success', async () => {
    mockPut.mockResolvedValue({
      nostr_forward_pubkey: null,
      nostr_forward_relay: null,
      nostr_forward_enabled: false,
    });
    const robot = new Robot({
      tokenSHA256: 'token-sha256',
      nostrForwardPubkey: 'npub1existing',
      nostrForwardRelay: 'ws://existing.onion',
      nostrForwardEnabled: true,
    });
    const settings = {
      nostr_forward_pubkey: null,
      nostr_forward_relay: null,
      nostr_forward_enabled: false,
    };

    await expect(robot.saveNostrForward(federation, settings)).resolves.toBe(true);
    expect(mockPut).toHaveBeenCalledWith('http://coordinator.onion', '/api/robot/', settings, {
      tokenSHA256: 'token-sha256',
    });
    expect(robot.nostrForwardPubkey).toBe('');
    expect(robot.nostrForwardRelay).toBe('');
    expect(robot.nostrForwardEnabled).toBe(false);
  });

  it('rejects a validation response without changing local state', async () => {
    mockPut.mockResolvedValue({ nostr_forward_relay: ['Invalid relay'] });
    const robot = new Robot({
      nostrForwardPubkey: 'npub1existing',
      nostrForwardRelay: 'ws://existing.onion',
      nostrForwardEnabled: true,
    });

    await expect(
      robot.saveNostrForward(federation, {
        nostr_forward_pubkey: null,
        nostr_forward_relay: null,
        nostr_forward_enabled: false,
      }),
    ).resolves.toBe(false);
    expect(robot.nostrForwardPubkey).toBe('npub1existing');
    expect(robot.nostrForwardRelay).toBe('ws://existing.onion');
    expect(robot.nostrForwardEnabled).toBe(true);
  });
});
