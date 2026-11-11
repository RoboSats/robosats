import type { Coordinator, Settings } from '../../models';
import RoboPool from '../RoboPool';
import { websocketClient, WebsocketState, type WebsocketConnection } from '../Websocket';

jest.mock('../System', () => ({ systemClient: { setItem: jest.fn() } }));

const relayUrl = 'wss://relay';
const pubkey = 'a'.repeat(64);

function bookEvent(network: string): object {
  return {
    id: '1',
    pubkey: 'c'.repeat(64),
    kind: 38383,
    tags: [
      ['d', 'order'],
      ['network', network],
    ],
  };
}

function relayHarness() {
  const listeners: {
    open: Array<() => void>;
    close: Array<() => void>;
    message: Array<(event: unknown) => void>;
  } = { open: [], close: [], message: [] };
  let state = WebsocketState.OPEN;

  const connection: WebsocketConnection = {
    send: jest.fn(),
    close: jest.fn(),
    getReadyState: () => state,
    onMessage: (callback) => {
      listeners.message.push(callback);
    },
    onOpen: (callback) => {
      listeners.open.push(callback);
    },
    onClose: (callback) => {
      listeners.close.push(callback);
    },
    onError: () => {},
  };

  return {
    connection,
    open: () => {
      state = WebsocketState.OPEN;
      listeners.open.forEach((cb) => cb());
    },
    restore: () => {
      state = WebsocketState.OPEN;
    },
    drop: () => {
      state = WebsocketState.CLOSED;
      listeners.close.forEach((cb) => cb());
    },
    receive: (...message: unknown[]) =>
      listeners.message.forEach((cb) => cb({ data: JSON.stringify(message) })),
    messages: () => jest.mocked(connection.send).mock.calls.map(([message]) => JSON.parse(message)),
    requests: (subId: string) =>
      jest
        .mocked(connection.send)
        .mock.calls.map(([message]) => JSON.parse(message))
        .filter(([type, id]) => type === 'REQ' && id === subId),
  };
}

type Harness = ReturnType<typeof relayHarness>;

describe('RoboPool relay reconnection', () => {
  let pool: RoboPool;
  let first: Harness;
  let second: Harness;

  beforeEach(() => {
    jest.useFakeTimers();
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
    first = relayHarness();
    second = relayHarness();
    jest
      .spyOn(websocketClient, 'open')
      .mockResolvedValueOnce(first.connection)
      .mockResolvedValue(second.connection);
    pool = new RoboPool({ network: 'mainnet' } as Settings);
  });

  afterEach(() => {
    pool.close();
    jest.clearAllTimers();
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('delivers the book REQ on initial open even when subscribed before the socket opens', async () => {
    pool.connect([relayUrl]);

    const events = { onevent: jest.fn(), oneose: jest.fn() };
    pool.subscribeBook(false, events);
    expect(first.requests('subscribeBook')).toHaveLength(0);

    await Promise.resolve();
    expect(first.requests('subscribeBook')).toHaveLength(1);
  });

  it('re-sends book and notification REQs after a relay reconnects', async () => {
    pool.connect([relayUrl]);
    await Promise.resolve();

    const bookEvents = { onevent: jest.fn(), oneose: jest.fn() };
    pool.subscribeBook(false, bookEvents);
    expect(first.requests('subscribeBook')).toHaveLength(1);

    const notificationEvents = { onevent: jest.fn(), oneose: jest.fn() };
    pool.updateNotificationSubscriptions({ pubkeys: [pubkey], events: notificationEvents });
    await Promise.resolve();
    expect(first.requests('notification_1')).toHaveLength(1);

    first.drop();
    first.open();

    expect(first.requests('subscribeBook')).toHaveLength(2);
    expect(first.requests('notification_1')).toHaveLength(2);

    first.receive('EVENT', 'subscribeBook', bookEvent('mainnet'));
    expect(bookEvents.onevent).toHaveBeenCalledTimes(1);
  });

  it('replaces the book handler instead of stacking duplicates across re-subscriptions', async () => {
    pool.connect([relayUrl]);
    await Promise.resolve();

    const firstEvents = { onevent: jest.fn(), oneose: jest.fn() };
    const secondEvents = { onevent: jest.fn(), oneose: jest.fn() };
    pool.subscribeBook(false, firstEvents);
    pool.subscribeBook(false, secondEvents);

    first.receive('EVENT', 'subscribeBook', bookEvent('mainnet'));

    expect(firstEvents.onevent).not.toHaveBeenCalled();
    expect(secondEvents.onevent).toHaveBeenCalledTimes(1);
  });

  it('keeps subscriptions alive after updateRelays on the new sockets', async () => {
    pool.connect([relayUrl]);
    await Promise.resolve();

    const events = { onevent: jest.fn(), oneose: jest.fn() };
    pool.subscribeBook(false, events);

    pool.updateRelays('relay', [{ getRelayUrl: () => relayUrl } as Coordinator]);
    await Promise.resolve();

    const replacementEvents = { onevent: jest.fn(), oneose: jest.fn() };
    pool.subscribeBook(false, replacementEvents);
    expect(second.requests('subscribeBook')).toHaveLength(1);

    second.receive('EVENT', 'subscribeBook', bookEvent('mainnet'));
    expect(replacementEvents.onevent).toHaveBeenCalledTimes(1);
    expect(events.onevent).not.toHaveBeenCalled();
  });

  it('watchdog replaces a permanently closed relay and re-subscribes the new socket', async () => {
    pool.connect([relayUrl]);
    await Promise.resolve();

    const events = { onevent: jest.fn(), oneose: jest.fn() };
    pool.subscribeBook(false, events);

    first.drop();
    jest.advanceTimersByTime(60000);
    await Promise.resolve();

    expect(first.connection.close).toHaveBeenCalled();
    expect(pool.getConnectionStates()[relayUrl]).toBe(WebsocketState.OPEN);
    expect(second.requests('subscribeBook')).toHaveLength(1);

    second.receive('EVENT', 'subscribeBook', bookEvent('mainnet'));
    expect(events.onevent).toHaveBeenCalledTimes(1);
  });

  it('watchdog replaces a relay stuck connecting and resets the backoff', async () => {
    const openSpy = jest.mocked(websocketClient.open);
    openSpy.mockReset();
    let resolveOpen: (connection: WebsocketConnection) => void = () => {};
    openSpy
      .mockImplementationOnce(() => new Promise((resolve) => (resolveOpen = resolve)))
      .mockResolvedValue(second.connection);

    pool.connect([relayUrl]);
    jest.advanceTimersByTime(420000);
    resolveOpen(first.connection);
    await Promise.resolve();

    expect(openSpy.mock.calls).toHaveLength(2);
    expect(first.connection.close).toHaveBeenCalled();
    expect(pool.getConnectionStates()[relayUrl]).toBe(WebsocketState.OPEN);
  });

  it('reports connection states and notifies on open and close', async () => {
    const changeSpy = jest.fn();
    pool.onConnectionStateChange = changeSpy;

    pool.connect([relayUrl]);
    await Promise.resolve();

    expect(pool.getConnectionStates()[relayUrl]).toBe(WebsocketState.OPEN);
    expect(changeSpy).toHaveBeenCalled();

    first.drop();

    expect(pool.getConnectionStates()[relayUrl]).toBe(WebsocketState.CLOSED);
    expect(changeSpy).toHaveBeenCalledTimes(2);
  });

  it('tracks whether the pool ever connected, resetting on pool rebuild', async () => {
    expect(pool.hasEverConnected()).toBe(false);

    pool.connect([relayUrl]);
    await Promise.resolve();
    expect(pool.hasEverConnected()).toBe(true);

    pool.updateRelays('relay', [{ getRelayUrl: () => 'wss://second' } as Coordinator]);
    expect(pool.hasEverConnected()).toBe(false);

    await Promise.resolve();
    expect(pool.hasEverConnected()).toBe(true);
  });

  it('does not probe a relay that is receiving traffic', async () => {
    pool.connect([relayUrl]);
    await Promise.resolve();

    const events = { onevent: jest.fn(), oneose: jest.fn() };
    pool.subscribeBook(false, events);

    for (let minute = 0; minute < 20; minute += 1) {
      first.receive('EVENT', 'subscribeBook', bookEvent('mainnet'));
      jest.advanceTimersByTime(60000);
    }

    const probes = first
      .messages()
      .filter(([type, id]) => type === 'REQ' && String(id).startsWith('liveness_'));
    expect(probes).toHaveLength(0);
  });

  it('probes a quiet relay and re-creates the socket when the probe is not answered', async () => {
    pool.connect([relayUrl]);
    await Promise.resolve();

    const events = { onevent: jest.fn(), oneose: jest.fn() };
    pool.subscribeBook(false, events);

    jest.advanceTimersByTime(660000);

    const probes = first
      .messages()
      .filter(([type, id]) => type === 'REQ' && String(id).startsWith('liveness_'));
    expect(probes).toHaveLength(1);
    expect(first.connection.close).not.toHaveBeenCalled();

    jest.advanceTimersByTime(80000);
    await Promise.resolve();

    expect(first.connection.close).toHaveBeenCalled();
    expect(pool.getConnectionStates()[relayUrl]).toBe(WebsocketState.OPEN);
    expect(second.requests('subscribeBook')).toHaveLength(1);
  });

  it('probes a quiet relay and leaves the socket untouched when the probe is answered', async () => {
    pool.connect([relayUrl]);
    await Promise.resolve();

    const events = { onevent: jest.fn(), oneose: jest.fn() };
    pool.subscribeBook(false, events);

    jest.advanceTimersByTime(660000);
    const probes = first
      .messages()
      .filter(([type, id]) => type === 'REQ' && String(id).startsWith('liveness_'));
    expect(probes).toHaveLength(1);

    first.receive('EOSE', probes[0][1]);

    jest.advanceTimersByTime(120000);
    await Promise.resolve();

    expect(
      first.messages().filter(([type, id]) => type === 'CLOSE' && id === probes[0][1]),
    ).toHaveLength(1);
    expect(first.connection.close).not.toHaveBeenCalled();
    expect(pool.getConnectionStates()[relayUrl]).toBe(WebsocketState.OPEN);
  });
});

describe('RoboPool relay failover', () => {
  let pool: RoboPool;
  let harnesses: Map<string, Harness>;
  let deadRelays: Set<string>;

  const urlFor = (name: string): string => `wss://${name}`;

  function coordinator(name: string): Coordinator {
    return { getRelayUrl: () => urlFor(name) } as unknown as Coordinator;
  }

  beforeEach(() => {
    jest.useFakeTimers();
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
    pool = new RoboPool({ network: 'mainnet' } as Settings);
    harnesses = new Map();
    deadRelays = new Set();
    ['first', 'second', 'third', 'fourth'].forEach((name) =>
      harnesses.set(urlFor(name), relayHarness()),
    );
    jest.spyOn(websocketClient, 'open').mockReset();
    jest
      .spyOn(websocketClient, 'open')
      .mockImplementation((url: string) =>
        deadRelays.has(url)
          ? new Promise<WebsocketConnection>(() => {})
          : Promise.resolve(harnesses.get(url)!.connection),
      );
  });

  afterEach(() => {
    pool.close();
    jest.clearAllTimers();
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  function buildPool(names: string[]): void {
    jest.spyOn(Math, 'random').mockReturnValueOnce(0.05).mockReturnValueOnce(0.35);
    pool.updateRelays('first', names.map(coordinator));
  }

  it('swaps a relay that stays down for more than 10 minutes for a spare', async () => {
    buildPool(['second', 'third', 'fourth', 'first']);
    await Promise.resolve();

    expect(pool.relays).toEqual(['wss://first', 'wss://second', 'wss://third']);

    const events = { onevent: jest.fn(), oneose: jest.fn() };
    pool.subscribeBook(false, events);

    harnesses.get('wss://second')!.drop();
    deadRelays.add('wss://second');
    jest.advanceTimersByTime(720000);
    await Promise.resolve();

    expect(pool.relays).toEqual(['wss://first', 'wss://third', 'wss://fourth']);
    expect(harnesses.get('wss://fourth')!.requests('subscribeBook')).toHaveLength(1);
  });

  it('keeps a relay that comes back within the failover window', async () => {
    buildPool(['second', 'third', 'fourth', 'first']);
    await Promise.resolve();

    harnesses.get('wss://second')!.drop();
    deadRelays.add('wss://second');
    jest.advanceTimersByTime(300000);

    expect(pool.relays).toEqual(['wss://first', 'wss://second', 'wss://third']);
  });

  it('never swaps the host relay', async () => {
    buildPool(['second', 'third', 'fourth', 'first']);
    await Promise.resolve();

    harnesses.get('wss://first')!.drop();
    deadRelays.add('wss://first');
    jest.advanceTimersByTime(1200000);

    expect(pool.relays).toEqual(['wss://first', 'wss://second', 'wss://third']);
  });

  it('rotates evicted relays back into the pool when another member dies', async () => {
    buildPool(['second', 'third', 'fourth', 'first']);
    await Promise.resolve();

    const events = { onevent: jest.fn(), oneose: jest.fn() };
    pool.subscribeBook(false, events);

    harnesses.get('wss://second')!.drop();
    deadRelays.add('wss://second');
    jest.advanceTimersByTime(720000);
    await Promise.resolve();
    expect(pool.relays).toEqual(['wss://first', 'wss://third', 'wss://fourth']);

    deadRelays.delete('wss://second');
    harnesses.get('wss://second')!.restore();
    harnesses.get('wss://third')!.drop();
    deadRelays.add('wss://third');
    jest.advanceTimersByTime(720000);
    await Promise.resolve();

    expect(pool.relays).toEqual(['wss://first', 'wss://fourth', 'wss://second']);
    expect(harnesses.get('wss://second')!.requests('subscribeBook')).toHaveLength(2);
  });

  it('keeps retrying a dead relay when there are no spares', async () => {
    buildPool(['second', 'third', 'first']);
    await Promise.resolve();

    expect(pool.relays).toEqual(['wss://first', 'wss://second', 'wss://third']);

    harnesses.get('wss://second')!.drop();
    deadRelays.add('wss://second');
    jest.advanceTimersByTime(1200000);

    expect(pool.relays).toEqual(['wss://first', 'wss://second', 'wss://third']);
  });
});
