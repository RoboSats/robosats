import ReconnectingWebSocket from 'reconnecting-websocket';
import { type WebsocketConnection } from '..';

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

  public send: (message: object) => void = (message: object) => {
    this.rws.send(
      JSON.stringify({
        type: 'message',
        ...message,
      }),
    );
  };

  public close: () => void = () => {
    this.rws.close();
  };

  public onMessage: (event: (message: any) => void) => void = (event) => {
    this.rws.addEventListener('message', event);
  };

  public onClose: (event: () => void) => void = (event) => {
    this.rws.addEventListener('close', event);
  };

  public onError: (event: () => void) => void = (event) => {
    this.rws.addEventListener('error', event);
  };
}

export default WebsocketConnectionWeb;
