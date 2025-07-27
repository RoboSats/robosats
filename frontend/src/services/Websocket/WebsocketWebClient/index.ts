import ReconnectingWebSocket from 'reconnecting-websocket';
import { type WebsocketClient, type WebsocketConnection } from '..';

class WebsocketConnectionWeb implements WebsocketConnection {
  constructor(path: string) {
    this.rws = new ReconnectingWebSocket(path, [], {
      WebSocket,
      minReconnectionDelay: 15000,
      connectionTimeout: 15000,
      reconnectionDelayGrowFactor: 2,
      maxRetries: 4,
      maxReconnectionDelay: 1000000,
    });
  }

  public rws: ReconnectingWebSocket;

  public send: (message: string) => void = (message: string) => {
    this.rws.send(message);
  };

  public close: () => void = () => {
    this.rws.close();
  };

  public onMessage: (event: (message: object) => void) => void = (event) => {
    this.rws.addEventListener('message', event);
  };

  public onClose: (event: () => void) => void = (event) => {
    this.rws.addEventListener('close', event);
  };

  public onError: (event: (error: object) => void) => void = (event) => {
    this.rws.addEventListener('error', event);
  };

  public getReadyState: () => number = () => this.rws.readyState;
}

class WebsocketWebClient implements WebsocketClient {
  public open: (path: string) => Promise<WebsocketConnection> = async (path) => {
    return await new Promise<WebsocketConnection>((resolve, reject) => {
      try {
        const connection = new WebsocketConnectionWeb(path);
        connection.rws.addEventListener('open', () => {
          resolve(connection);
        });
      } catch {
        reject(new Error('Failed to establish a websocket connection.'));
      }
    });
  };
}

export default WebsocketWebClient;
