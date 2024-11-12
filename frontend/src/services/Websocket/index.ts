import WebsocketWebClient from './WebsocketWebClient';

export const WebsocketState = {
  CONNECTING: 0,
  OPEN: 1,
  CLOSING: 2,
  CLOSED: 3,
} as const;

export interface WebsocketConnection {
  send: (message: string) => void;
  onMessage: (event: (message: any) => void) => void;
  onClose: (event: () => void) => void;
  onError: (event: (error: any) => void) => void;
  close: () => void;
  getReadyState: () => number;
}

export interface WebsocketClient {
  open: (path: string) => Promise<WebsocketConnection>;
}

export const websocketClient: WebsocketClient = new WebsocketWebClient();
