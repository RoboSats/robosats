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

describe('Robot.fetchWebhook', () => {
  beforeEach(() => {
    mockPut.mockReset();
  });

  it('applies a structurally valid response and reports success', async () => {
    mockPut.mockResolvedValue({
      webhook_url: 'http://updated.onion/webhook',
      webhook_enabled: true,
      webhook_api_key: 'updated-key',
    });
    const robot = new Robot({
      tokenSHA256: 'token-sha256',
      webhookUrl: 'http://existing.onion/webhook',
      webhookEnabled: false,
      webhookApiKey: 'existing-key',
    });
    const settings = {
      webhook_url: 'http://updated.onion/webhook',
      webhook_enabled: true,
      webhook_api_key: 'updated-key',
    };

    await expect(robot.fetchWebhook(federation, settings)).resolves.toBe(true);
    expect(robot.webhookUrl).toBe('http://updated.onion/webhook');
    expect(robot.webhookEnabled).toBe(true);
    expect(robot.webhookApiKey).toBe('updated-key');
  });

  it('rejects an array-shaped validation response without changing local state', async () => {
    mockPut.mockResolvedValue({ webhook_url: ['Invalid URL'] });
    const robot = new Robot({
      webhookUrl: 'http://existing.onion/webhook',
      webhookEnabled: true,
      webhookApiKey: 'existing-key',
    });

    await expect(
      robot.fetchWebhook(federation, {
        webhook_url: 'https://invalid.example',
        webhook_enabled: false,
        webhook_api_key: 'replacement-key',
      }),
    ).resolves.toBe(false);
    expect(robot.webhookUrl).toBe('http://existing.onion/webhook');
    expect(robot.webhookEnabled).toBe(true);
    expect(robot.webhookApiKey).toBe('existing-key');
  });
});

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
