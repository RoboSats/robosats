import WebsocketNativeClient from './WebsocketNativeClient';
import WebsocketWebClient from './WebsocketWebClient';

export interface WebsocketConnection {
  send: (message: object) => void;
  onMessage: (event: (message: object) => void) => void;
  onClose: (event: () => void) => void;
  onError: (event: () => void) => void;
}

export interface WebsocketClient {
  open: (path: string) => Promise<WebsocketConnection>;
}

export const websocketClient: WebsocketClient = window.ReactNativeWebView != null ? new WebsocketNativeClient() : new WebsocketWebClient() ;
