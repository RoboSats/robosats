import WebsocketAndroidClient from './WebsocketAndroidClient';
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
  if (window.navigator.userAgent.includes('AndroidRobosats')) {
    // If userAgent has "AndroidRobosats", we assume the app is running inside of the
    // WebView of the Kotlin RoboSats Android app.
    return new WebsocketAndroidClient();
  } else {
    // Otherwise, we assume the app is running in a web browser.
    return new WebsocketWebClient();
  }
}

export const websocketClient: WebsocketClient = getWebsocketClient();
