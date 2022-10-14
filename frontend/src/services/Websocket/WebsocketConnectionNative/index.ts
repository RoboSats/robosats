import ReconnectingWebSocket from 'reconnecting-websocket';
import { WebsocketConnection } from '..';

class WebsocketConnectionNative implements WebsocketConnection {
  constructor(path: string) {
    this.path = path;
    this.receiveMessage = (_message: object) => {};
    this.receiveClose = () => {};
    this.receiveError = () => {};
  }

  public path: string;
  public receiveMessage: (message: object) => void;
  public receiveClose: () => void;
  public receiveError: () => void;

  public send: (message: object) => void = (message: object) => {
    window.NativeRobosats?.postMessage({
      category: 'socket',
      type: 'open',
      path: this.path,
      body: message
    });
  };

  public onMessage: (event: (message: object) => void) => void = (event) => {
    this.receiveMessage = event
  };

  public onClose: (event: () => void) => void = (event) => {
    this.receiveClose = event
  };

  public onError: (event: () => void) => void = (event) => {
    this.receiveError = event
  };
}

export default WebsocketConnectionNative;
