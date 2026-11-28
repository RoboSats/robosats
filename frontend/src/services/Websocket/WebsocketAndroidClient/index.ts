import { WebsocketState, type WebsocketClient, type WebsocketConnection } from '..';
import { v4 as uuidv4 } from 'uuid';

class WebsocketConnectionAndroid implements WebsocketConnection {
  constructor(connectionId: string, path: string) {
    this.connectionId = connectionId;
    this.path = path;
    this.state = WebsocketState.OPEN;

    window.AndroidRobosats?.registerWSConnection(
      connectionId,
      (message) => {
        this.wsMessageListeners.forEach((f) => f({ data: message }));
      },
      () => {
        this.markClosed();
      },
      () => {
        this.wsErrorListeners.forEach((f) => f({}));
        this.markClosed();
      },
    );
  }

  private readonly connectionId: string;
  private readonly path: string;
  private state: number;

  private readonly wsMessageListeners: Array<(message: object) => void> = [];
  private readonly wsCloseListeners: Array<() => void> = [];
  private readonly wsErrorListeners: Array<(error: object) => void> = [];

  private markClosed = (): void => {
    if (this.state === WebsocketState.CLOSED) return;
    this.state = WebsocketState.CLOSED;
    window.AndroidRobosats?.removeWSConnection(this.connectionId);
    this.wsCloseListeners.forEach((f) => f());
  };

  public send: (message: string) => void = (message: string) => {
    if (this.state !== WebsocketState.OPEN) return;
    const sent = window.AndroidAppRobosats?.sendWsMessage(this.connectionId, message);
    if (sent === false) {
      this.markClosed();
    }
  };

  public close: () => void = () => {
    if (this.state === WebsocketState.CLOSED) return;
    this.state = WebsocketState.CLOSED;
    window.AndroidRobosats?.removeWSConnection(this.connectionId);
    window.AndroidAppRobosats?.closeWS(this.connectionId);
  };

  public onOpen: (event: () => void) => void = (_event) => {};

  public onMessage: (event: (message: object) => void) => void = (event) => {
    this.wsMessageListeners.push(event);
  };

  public onClose: (event: () => void) => void = (event) => {
    this.wsCloseListeners.push(event);
  };

  public onError: (event: (error: object) => void) => void = (event) => {
    this.wsErrorListeners.push(event);
  };

  public getReadyState: () => number = () => this.state;

  public getPath: () => string = () => this.path;
}

class WebsocketAndroidClient implements WebsocketClient {
  public open: (path: string) => Promise<WebsocketConnection> = async (path) => {
    return new Promise<WebsocketConnectionAndroid>((resolve, reject) => {
      const connectionId: string = uuidv4();
      window.AndroidAppRobosats?.openWS(connectionId, path);
      window.AndroidRobosats?.storePromise(
        connectionId,
        () => {
          resolve(new WebsocketConnectionAndroid(connectionId, path));
        },
        () => {
          reject(new Error('Failed to establish a websocket connection.'));
        },
      );
    });
  };
}

export default WebsocketAndroidClient;
