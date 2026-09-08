/** Minimal stub for the Websocket service to avoid uuid ESM in Jest. */
export enum WebsocketState {
  CONNECTING = 0,
  OPEN = 1,
  CLOSING = 2,
  CLOSED = 3,
}

export interface WebsocketConnection {
  send: (msg: string) => void;
  close: () => void;
  getReadyState: () => WebsocketState;
  onMessage: (cb: (e: unknown) => void) => void;
  onError: (cb: (e: unknown) => void) => void;
  onClose: (cb: () => void) => void;
}

export interface WebsocketClient {
  open: (url: string) => Promise<WebsocketConnection>;
}

export const websocketClient: WebsocketClient = {
  open: () =>
    Promise.resolve({
      send: () => {},
      close: () => {},
      getReadyState: () => WebsocketState.OPEN,
      onMessage: () => {},
      onError: () => {},
      onClose: () => {},
    }),
};

export default websocketClient;
