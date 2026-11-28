jest.mock('uuid', () => ({ v4: jest.fn(() => 'test-uuid-0000-0000-0000-000000000000') }));

jest.mock('..', () => ({
  WebsocketState: { CONNECTING: 0, OPEN: 1, CLOSING: 2, CLOSED: 3 },
}));

const WebsocketAndroidClient = jest.requireActual<{
  default: (typeof import('../index'))['default'];
}>('../index').default;

const WebsocketState = { CONNECTING: 0, OPEN: 1, CLOSING: 2, CLOSED: 3 };

type OnMessageCb = (message?: string) => void;
type OnCloseCb = () => void;
type OnErrorCb = () => void;

interface FakeBridge {
  connections: Record<string, { onMessage: OnMessageCb; onClose: OnCloseCb; onError: OnErrorCb }>;
  openCalls: Array<{ connectionId: string; path: string }>;
  closeCalls: string[];
  sendCalls: Array<{ connectionId: string; message: string }>;
  resolveOpen: (connectionId: string) => void;
  rejectOpen: (connectionId: string) => void;
  deliverMessage: (connectionId: string, message: string) => void;
  deliverClose: (connectionId: string) => void;
  deliverError: (connectionId: string) => void;
}

function makeBridge(sendResult: boolean = true): FakeBridge {
  const pendingPromises: Record<
    string,
    { resolve: (v: string) => void; reject: (r: string) => void }
  > = {};
  const connections: FakeBridge['connections'] = {};
  const openCalls: FakeBridge['openCalls'] = [];
  const closeCalls: string[] = [];
  const sendCalls: FakeBridge['sendCalls'] = [];

  window.AndroidRobosats = {
    storePromise: (connectionId, resolve, reject) => {
      pendingPromises[connectionId] = { resolve, reject: reject ?? (() => {}) };
    },
    registerWSConnection: (connectionId, onMessage, onClose, onError) => {
      connections[connectionId] = { onMessage, onClose, onError };
    },
    removeWSConnection: (connectionId) => {
      delete connections[connectionId];
    },
    onWSMessage: jest.fn(),
    onWsError: jest.fn(),
    onWsClose: jest.fn(),
    navigateToPage: jest.fn(),
    onResolvePromise: jest.fn(),
    onRejectPromise: jest.fn(),
  } as unknown as typeof window.AndroidRobosats;

  window.AndroidAppRobosats = {
    openWS: (connectionId: string, path: string) => {
      openCalls.push({ connectionId, path });
    },
    sendWsMessage: (connectionId: string, message: string): boolean => {
      sendCalls.push({ connectionId, message });
      return sendResult;
    },
    closeWS: (connectionId: string) => {
      closeCalls.push(connectionId);
    },
    getEncryptedStorage: jest.fn(),
    setEncryptedStorage: jest.fn(),
    deleteEncryptedStorage: jest.fn(),
    generateRoboname: jest.fn(),
    generateRobohash: jest.fn(),
    copyToClipboard: jest.fn(),
    getTorStatus: jest.fn(),
    sendRequest: jest.fn(),
    sendBinary: jest.fn(),
    getBinary: jest.fn(),
    restart: jest.fn(),
  } as unknown as typeof window.AndroidAppRobosats;

  return {
    connections,
    openCalls,
    closeCalls,
    sendCalls,
    resolveOpen: (id) => pendingPromises[id]?.resolve(id),
    rejectOpen: (id) => pendingPromises[id]?.reject('connection refused'),
    deliverMessage: (id, message) => connections[id]?.onMessage(message),
    deliverClose: (id) => connections[id]?.onClose(),
    deliverError: (id) => connections[id]?.onError(),
  };
}

afterEach(() => {
  window.AndroidRobosats = undefined;
  window.AndroidAppRobosats = undefined;
});

describe('WebsocketAndroidClient', () => {
  it('resolves open() when the native bridge resolves the promise', async () => {
    const bridge = makeBridge();
    const client = new WebsocketAndroidClient();

    const connectionPromise = client.open('wss://relay.example.com');
    bridge.resolveOpen(bridge.openCalls[0].connectionId);
    const connection = await connectionPromise;

    expect(connection).toBeDefined();
    expect(connection.getReadyState()).toBe(WebsocketState.OPEN);
  });

  it('rejects open() when the native bridge rejects the promise', async () => {
    const bridge = makeBridge();
    const client = new WebsocketAndroidClient();

    const connectionPromise = client.open('wss://relay.example.com');
    bridge.rejectOpen(bridge.openCalls[0].connectionId);

    await expect(connectionPromise).rejects.toThrow();
  });

  it('routes messages to onMessage listeners by connection id', async () => {
    const bridge = makeBridge();
    const client = new WebsocketAndroidClient();

    const p = client.open('wss://relay.example.com');
    const id = bridge.openCalls[0].connectionId;
    bridge.resolveOpen(id);
    const connection = await p;

    const listener = jest.fn();
    connection.onMessage(listener);
    bridge.deliverMessage(id, '["EOSE","subscribeBook"]');

    expect(listener).toHaveBeenCalledWith({ data: '["EOSE","subscribeBook"]' });
  });

  it('marks connection CLOSED and runs listeners on native close', async () => {
    const bridge = makeBridge();
    const client = new WebsocketAndroidClient();

    const p = client.open('wss://relay.example.com');
    const id = bridge.openCalls[0].connectionId;
    bridge.resolveOpen(id);
    const connection = await p;

    const closeSpy = jest.fn();
    connection.onClose(closeSpy);
    bridge.deliverClose(id);

    expect(connection.getReadyState()).toBe(WebsocketState.CLOSED);
    expect(closeSpy).toHaveBeenCalledTimes(1);
    expect(bridge.connections[id]).toBeUndefined();
  });

  it('runs onClose only once even if native fires both error and close', async () => {
    const bridge = makeBridge();
    const client = new WebsocketAndroidClient();

    const p = client.open('wss://relay.example.com');
    const id = bridge.openCalls[0].connectionId;
    bridge.resolveOpen(id);
    const connection = await p;

    const closeSpy = jest.fn();
    const errorSpy = jest.fn();
    connection.onClose(closeSpy);
    connection.onError(errorSpy);

    bridge.deliverError(id);
    bridge.deliverClose(id);

    expect(errorSpy).toHaveBeenCalledTimes(1);
    expect(closeSpy).toHaveBeenCalledTimes(1);
    expect(connection.getReadyState()).toBe(WebsocketState.CLOSED);
  });

  it('marks CLOSED and runs listeners when sendWsMessage returns false', async () => {
    const bridge = makeBridge(false);
    const client = new WebsocketAndroidClient();

    const p = client.open('wss://relay.example.com');
    const id = bridge.openCalls[0].connectionId;
    bridge.resolveOpen(id);
    const connection = await p;

    const closeSpy = jest.fn();
    connection.onClose(closeSpy);
    connection.send('["REQ","sub1",{}]');

    expect(connection.getReadyState()).toBe(WebsocketState.CLOSED);
    expect(closeSpy).toHaveBeenCalledTimes(1);
  });

  it('does not send after the connection is CLOSED', async () => {
    const bridge = makeBridge();
    const client = new WebsocketAndroidClient();

    const p = client.open('wss://relay.example.com');
    const id = bridge.openCalls[0].connectionId;
    bridge.resolveOpen(id);
    const connection = await p;

    bridge.deliverClose(id);
    connection.send('late message');

    expect(bridge.sendCalls).toHaveLength(0);
  });

  it('calls closeWS and sets CLOSED on explicit close()', async () => {
    const bridge = makeBridge();
    const client = new WebsocketAndroidClient();

    const p = client.open('wss://relay.example.com');
    const id = bridge.openCalls[0].connectionId;
    bridge.resolveOpen(id);
    const connection = await p;

    connection.close();

    expect(connection.getReadyState()).toBe(WebsocketState.CLOSED);
    expect(bridge.closeCalls).toContain(id);
  });

  it('is safe to call close() multiple times', async () => {
    const bridge = makeBridge();
    const client = new WebsocketAndroidClient();

    const p = client.open('wss://relay.example.com');
    const id = bridge.openCalls[0].connectionId;
    bridge.resolveOpen(id);
    const connection = await p;

    connection.close();
    connection.close();

    expect(bridge.closeCalls).toHaveLength(1);
  });

  it('does not leak callbacks from an old connection into a new one on the same url', async () => {
    const bridge = makeBridge();
    const { v4: uuidV4 } = jest.requireMock<{ v4: jest.Mock }>('uuid');
    uuidV4
      .mockReturnValueOnce('aaaa-0000-0000-0000-000000000001')
      .mockReturnValueOnce('bbbb-0000-0000-0000-000000000002');

    const client = new WebsocketAndroidClient();
    const url = 'wss://relay.example.com';

    const p1 = client.open(url);
    bridge.resolveOpen('aaaa-0000-0000-0000-000000000001');
    const conn1 = await p1;

    const listener1 = jest.fn();
    conn1.onMessage(listener1);
    bridge.deliverClose('aaaa-0000-0000-0000-000000000001');

    const p2 = client.open(url);
    bridge.resolveOpen('bbbb-0000-0000-0000-000000000002');
    const conn2 = await p2;

    const listener2 = jest.fn();
    conn2.onMessage(listener2);
    bridge.deliverMessage('bbbb-0000-0000-0000-000000000002', '["EOSE","x"]');

    expect(listener2).toHaveBeenCalledTimes(1);
    expect(listener1).not.toHaveBeenCalled();
  });
});
