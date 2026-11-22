import { v4 as uuidv4 } from 'uuid';

import ApiAndroidClient from '.';

jest.mock('uuid', () => ({ v4: jest.fn(() => 'test-uuid') }));

describe('ApiAndroidClient.put', () => {
  it('sends a PUT request through the Android bridge and parses its response', async () => {
    const sendRequest = jest.fn();
    const storePromise = jest.fn((_uuid: string, resolve: (value: string) => void) =>
      resolve(JSON.stringify({ json: { saved: true }, headers: {} })),
    );
    Object.defineProperty(globalThis, 'window', {
      configurable: true,
      value: {
        AndroidAppRobosats: { sendRequest },
        AndroidRobosats: { storePromise },
      },
    });

    const body = { webhook_enabled: false };
    const result = await new ApiAndroidClient().put(
      'http://coordinator.onion',
      '/api/robot/',
      body,
      { tokenSHA256: 'token-sha256' },
    );

    expect(uuidv4).toHaveBeenCalledTimes(1);
    expect(sendRequest).toHaveBeenCalledWith(
      'test-uuid',
      'PUT',
      'http://coordinator.onion/api/robot/',
      JSON.stringify({
        'Content-Type': 'application/json',
        Authorization: 'Token token-sha256',
      }),
      JSON.stringify(body),
    );
    expect(storePromise).toHaveBeenCalledWith(
      'test-uuid',
      expect.any(Function),
      expect.any(Function),
    );
    expect(result).toEqual({ saved: true });
  });
});
