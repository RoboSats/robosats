import { getPublicKey, nip59 } from 'nostr-tools';
import type { Coordinator, Settings } from '../../models';
import { createAccountRecoveryEvent } from '../../utils/accountRecovery';
import RoboPool from '../RoboPool';
import { websocketClient, WebsocketState, type WebsocketConnection } from '../Websocket';

const secret = new Uint8Array(32).fill(1);
const pubkey = getPublicKey(secret);

function relay() {
  let onMessage: (message: object) => void = () => { };
  const connection: WebsocketConnection = {
    send: jest.fn(),
    close: jest.fn(),
    getReadyState: () => WebsocketState.OPEN,
    onMessage: (callback) => {
      onMessage = callback;
    },
    onError: () => { },
    onClose: () => { },
  };
  return {
    connection,
    receive: (...message: unknown[]) => onMessage({ data: JSON.stringify(message) }),
    requests: () =>
      jest
        .mocked(connection.send)
        .mock.calls.map(([message]) => JSON.parse(message))
        .filter(([type]) => type === 'REQ'),
  };
}

describe('Garage Key relay subscriptions', () => {
  let pool: RoboPool;
  let first: ReturnType<typeof relay>;
  let second: ReturnType<typeof relay>;

  beforeEach(async () => {
    jest.useFakeTimers();
    jest.spyOn(console, 'log').mockImplementation(() => { });
    first = relay();
    second = relay();
    jest
      .spyOn(websocketClient, 'open')
      .mockResolvedValueOnce(first.connection)
      .mockResolvedValue(second.connection);
    pool = new RoboPool({ network: 'mainnet' } as Settings);
    pool.connect(['wss://first']);
    await Promise.resolve();
  });

  afterEach(() => {
    pool.close();
    jest.clearAllTimers();
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  async function replaceRelays(url = 'wss://second') {
    pool.updateRelays(url, [{ getRelayUrl: () => url } as Coordinator]);
    await Promise.resolve();
    jest.advanceTimersByTime(500);
  }

  it('accepts self-authored recovery and rejects a valid gift wrap from another author', () => {
    const found = jest.fn();
    pool.subscribeAccountRecovery(pubkey, secret, found, jest.fn());
    const id = first.requests()[0][1];
    const otherAuthor = nip59.wrapEvent(
      {
        kind: 30078,
        created_at: 100,
        content: '',
        tags: [
          ['d', 'robosats-garage-account'],
          ['account', '18'],
        ],
      },
      new Uint8Array(32).fill(2),
      pubkey,
    );

    first.receive('EVENT', id, otherAuthor);
    expect(found).not.toHaveBeenCalled();
    first.receive('EVENT', id, createAccountRecoveryEvent(secret, 7));
    expect(found).toHaveBeenCalledWith(7, expect.any(Number));
  });

  it('finishes a silent recovery once after five seconds and ignores late events', () => {
    const found = jest.fn();
    const complete = jest.fn();
    pool.subscribeAccountRecovery(pubkey, secret, found, complete);
    const id = first.requests()[0][1];
    jest.advanceTimersByTime(4999);
    expect(complete).not.toHaveBeenCalled();
    jest.advanceTimersByTime(1);
    expect(complete).toHaveBeenCalledTimes(1);
    expect(first.connection.send).toHaveBeenCalledWith(JSON.stringify(['CLOSE', id]));
    first.receive('EVENT', id, createAccountRecoveryEvent(secret, 9));
    first.receive('EOSE', id);
    expect(found).not.toHaveBeenCalled();
    expect(complete).toHaveBeenCalledTimes(1);
  });

  it('waits for all relays and completes early only once', async () => {
    pool.connect(['wss://second']);
    await Promise.resolve();
    const complete = jest.fn();
    pool.subscribeAccountRecovery(pubkey, secret, jest.fn(), complete);
    const id = first.requests()[0][1];
    first.receive('EOSE', id);
    first.receive('EOSE', id);
    expect(complete).not.toHaveBeenCalled();
    second.receive('EOSE', id);
    jest.advanceTimersByTime(5000);
    expect(complete).toHaveBeenCalledTimes(1);
  });

  it('replays notifications on replacement, ignores old sockets and respects clearing', async () => {
    const events = { onevent: jest.fn(), oneose: jest.fn() };
    const params = { pubkeys: [pubkey], events };
    pool.updateNotificationSubscriptions(params);
    const oldId = first.requests()[0][1];
    await replaceRelays();
    expect(second.requests()).toHaveLength(1);
    const [, newId, filter] = second.requests()[0];
    expect(filter['#p']).toEqual([pubkey]);
    first.receive('EVENT', oldId, { id: 'stale' });
    first.receive('EVENT', newId, { id: 'stale' });
    expect(events.onevent).not.toHaveBeenCalled();
    second.receive('EVENT', newId, { id: 'current' });
    expect(events.onevent).toHaveBeenCalledTimes(1);
    pool.updateNotificationSubscriptions(params);
    expect(second.requests()).toHaveLength(1);
    pool.clearNotificationSubscriptions();
    const calls = events.oneose.mock.calls.length;
    await replaceRelays();
    jest.advanceTimersByTime(5000);
    expect(second.requests()).toHaveLength(1);
    expect(events.oneose).toHaveBeenCalledTimes(calls);
  });

  it('replays recovery with fresh relay EOSE tracking and its original deadline', async () => {
    pool.connect(['wss://second']);
    await Promise.resolve();
    const complete = jest.fn();
    const found = jest.fn();
    pool.subscribeAccountRecovery(pubkey, secret, found, complete);
    const id = first.requests()[0][1];
    jest.advanceTimersByTime(3000);
    first.receive('EOSE', id);
    await replaceRelays();
    expect(second.requests()).toHaveLength(2);
    second.receive('EVENT', id, createAccountRecoveryEvent(secret, 18));
    expect(found).toHaveBeenCalledWith(18, expect.any(Number));
    jest.advanceTimersByTime(1499);
    expect(complete).not.toHaveBeenCalled();
    jest.advanceTimersByTime(1);
    expect(complete).toHaveBeenCalledTimes(1);
  });

  it('finishes recovery immediately when the replacement has no relays', () => {
    const complete = jest.fn();
    pool.subscribeAccountRecovery(pubkey, secret, jest.fn(), complete);
    pool.updateRelays('', []);
    expect(complete).toHaveBeenCalledTimes(1);
    jest.advanceTimersByTime(5000);
    expect(complete).toHaveBeenCalledTimes(1);
  });

  it('requires EOSE from every replacement relay, including a reused URL', async () => {
    pool.connect(['wss://second']);
    await Promise.resolve();
    const complete = jest.fn();
    pool.subscribeAccountRecovery(pubkey, secret, jest.fn(), complete);
    const id = first.requests()[0][1];
    first.receive('EOSE', id);
    const replacementA = relay();
    const replacementB = relay();
    jest
      .mocked(websocketClient.open)
      .mockResolvedValueOnce(replacementA.connection)
      .mockResolvedValueOnce(replacementB.connection);
    pool.updateRelays(
      'wss://first',
      ['wss://first', 'wss://third'].map(
        (url) =>
          ({
            getRelayUrl: () => url,
          }) as Coordinator,
      ),
    );
    await Promise.resolve();
    jest.advanceTimersByTime(500);
    replacementB.receive('EOSE', id);
    expect(complete).not.toHaveBeenCalled();
    replacementA.receive('EOSE', id);
    expect(complete).toHaveBeenCalledTimes(1);
  });

  it('does not send expired recovery or cleared notification requests after a slow connection', async () => {
    pool.close();
    let resolveOpen!: (connection: WebsocketConnection) => void;
    jest.mocked(websocketClient.open).mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveOpen = resolve;
        }),
    );
    pool.connect(['wss://slow']);
    const complete = jest.fn();
    const events = { onevent: jest.fn(), oneose: jest.fn() };
    pool.subscribeAccountRecovery(pubkey, secret, jest.fn(), complete);
    pool.updateNotificationSubscriptions({ pubkeys: [pubkey], events });
    pool.clearNotificationSubscriptions();
    jest.advanceTimersByTime(5000);
    expect(complete).toHaveBeenCalledTimes(1);
    resolveOpen(second.connection);
    await Promise.resolve();
    jest.advanceTimersByTime(500);
    expect(second.requests()).toHaveLength(0);
    expect(events.oneose).not.toHaveBeenCalled();
    expect(jest.getTimerCount()).toBe(0);
  });

  it('discards a connection opened after its pool was replaced', async () => {
    const late = relay();
    let resolveOpen!: (connection: WebsocketConnection) => void;
    jest.mocked(websocketClient.open).mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveOpen = resolve;
        }),
    );
    pool.connect(['wss://late']);
    pool.sendMessage(JSON.stringify(['REQ', 'obsolete', {}]));
    await replaceRelays();
    resolveOpen(late.connection);
    await Promise.resolve();
    jest.advanceTimersByTime(1000);
    expect(late.connection.close).toHaveBeenCalledTimes(1);
    expect(late.connection.send).not.toHaveBeenCalled();
    expect(Object.keys(pool.webSockets)).toEqual(['wss://second']);
  });
});
