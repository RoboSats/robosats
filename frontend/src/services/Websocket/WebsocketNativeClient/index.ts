import { WebsocketState, type WebsocketClient, type WebsocketConnection } from '..';
import WebsocketWebClient from '../WebsocketWebClient';

class WebsocketConnectionNative implements WebsocketConnection {
  constructor(path: string) {
    this.path = path;
    window.addEventListener('wsMessage', (event) => {
      const path: string = event?.detail?.path;
      const message: string = event?.detail?.message;
      if (path && message && path === this.path) {
        this.wsMessagePromises.forEach((fn) => {
          fn({ data: message });
        });
      }
    });
  }

  private readonly path: string;

  private readonly wsMessagePromises: Array<(message: any) => void> = [];
  private readonly wsClosePromises: Array<() => void> = [];

  public send: (message: string) => void = (message: string) => {
    void window.NativeRobosats?.postMessage({
      category: 'ws',
      type: 'send',
      path: this.path,
      message,
    });
  };

  public close: () => void = () => {
    void window.NativeRobosats?.postMessage({
      category: 'ws',
      type: 'close',
      path: this.path,
    }).then((response) => {
      if (response.connection) {
        this.wsClosePromises.forEach((fn) => {
          fn();
        });
      } else {
        Error('Failed to close websocket connection.');
      }
    });
  };

  public onMessage: (event: (message: any) => void) => void = (event) => {
    this.wsMessagePromises.push(event);
  };

  public onClose: (event: () => void) => void = (event) => {
    this.wsClosePromises.push(event);
  };

  public onError: (event: (error: any) => void) => void = (_event) => {
    // Not implemented
  };

  public getReadyState: () => number = () => WebsocketState.OPEN;
}

class WebsocketNativeClient implements WebsocketClient {
  public useProxy = true;

  private readonly webClient: WebsocketWebClient = new WebsocketWebClient();

  public open: (path: string) => Promise<WebsocketConnection> = async (path) => {
    if (!this.useProxy) return await this.webClient.open(path);

    return await new Promise<WebsocketConnection>((resolve, reject) => {
      window.NativeRobosats?.postMessage({
        category: 'ws',
        type: 'open',
        path,
      })
        .then((response) => {
          if (response.connection) {
            resolve(new WebsocketConnectionNative(path));
          } else {
            reject(new Error('Failed to establish a websocket connection.'));
          }
        })
        .catch(() => {
          reject(new Error('Failed to establish a websocket connection.'));
        });
    });
  };
}

export default WebsocketNativeClient;
