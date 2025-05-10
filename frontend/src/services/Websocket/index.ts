import WebsocketNativeClient from './WebsocketNativeClient';
import WebsocketWebClient from './WebsocketWebClient';

export const WebsocketState = {
  CONNECTING: 0,
  OPEN: 1,
  CLOSING: 2,
  CLOSED: 3,
} as const;

export interface WebsocketConnection {
  send: (message: string) => void;
  onMessage: (event: (message: object) => void) => void;
  onClose: (event: () => void) => void;
  onError: (event: (error: object) => void) => void;
  close: () => void;
  getReadyState: () => number;
}

export interface WebsocketClient {
  useProxy: boolean;
  open: (path: string) => Promise<WebsocketConnection>;
}

function getWebsocketClient(): WebsocketClient {
  if (window.navigator.userAgent.includes('robosats')) {
    // If userAgent has "RoboSats", we assume the app is running inside of the
    // react-native-web view of the RoboSats Android app.
    return new WebsocketNativeClient();
  } else {
    // Otherwise, we assume the app is running in a web browser.
    return new WebsocketWebClient();
  }
}

export const websocketClient: WebsocketClient = getWebsocketClient();
