import ReconnectingWebSocket from 'reconnecting-websocket';
import { StringOrBuffer } from 'simple-plist';
import { WebsocketConnection } from '..';

class WebsocketConnectionWeb implements WebsocketConnection {
  constructor(path: string) {
    this.rws = new ReconnectingWebSocket(path, [], { connectionTimeout: 15000 });
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

  public onMessage: (event: (message: object) => void) => void = (event) => {
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
