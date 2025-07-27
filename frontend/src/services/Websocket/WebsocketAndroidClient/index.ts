import { WebsocketState, type WebsocketClient, type WebsocketConnection } from '..';
import WebsocketWebClient from '../WebsocketWebClient';
import { v4 as uuidv4 } from 'uuid';

class WebsocketConnectionAndroid implements WebsocketConnection {
  constructor(path: string) {
    this.path = path;
    window.AndroidRobosats?.registerWSConnection(
      path,
      (message) => {
        this.wsMessagePromises.forEach((f) => f({ data: message }));
      },
      () => {
        this.wsClosePromises.forEach((f) => f());
      },
      () => {},
    );
  }

  private readonly path: string;

  private readonly wsMessagePromises: Array<(message: object) => void> = [];
  private readonly wsClosePromises: Array<() => void> = [];

  public send: (message: string) => void = (message: string) => {
    const uuid: string = uuidv4();
    window.AndroidAppRobosats?.sendWsMessage(uuid, this.path, message);
  };

  public close: () => void = () => {
    window.AndroidRobosats?.removeWSConnection(this.path);
  };

  public onMessage: (event: (message: object) => void) => void = (event) => {
    this.wsMessagePromises.push(event);
  };

  public onClose: (event: () => void) => void = (event) => {
    this.wsClosePromises.push(event);
  };

  public onError: (event: (error: object) => void) => void = (_event) => {
    // Not implemented
  };

  public getReadyState: () => number = () => WebsocketState.OPEN;
}

class WebsocketAndroidClient implements WebsocketClient {
  private readonly webClient: WebsocketWebClient = new WebsocketWebClient();

  public open: (path: string) => Promise<WebsocketConnection> = async (path) => {
    return new Promise<WebsocketConnectionAndroid>((resolve, reject) => {
      const uuid: string = uuidv4();
      window.AndroidAppRobosats?.openWS(uuid, path);
      window.AndroidRobosats?.storePromise(
        uuid,
        () => {
          resolve(new WebsocketConnectionAndroid(path));
        },
        () => {
          reject(new Error('Failed to establish a websocket connection.'));
        },
      );
    });
  };
}

export default WebsocketAndroidClient;
