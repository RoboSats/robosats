import WebsocketWebClient from './WebsocketWebClient';

export interface WebsocketConnection {
  send: (message: object) => void;
  onMessage: (event: (message: any) => void) => void;
  onClose: (event: () => void) => void;
  onError: (event: () => void) => void;
  close: () => void;
}

export interface WebsocketClient {
  open: (path: string) => Promise<WebsocketConnection>;
}

export const websocketClient: WebsocketClient = new WebsocketWebClient();
