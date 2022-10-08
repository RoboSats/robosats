import { NativeRobosatsPromise, NativeWebViewMessage, NativeWebViewMessageSystem } from './index.d';

class NativeRobosats {
  public torDaemonStatus = 'NOTINIT';

  private messageCounter: number = 0;

  private pendingMessages: { [id: number]: NativeRobosatsPromise } = {};

  public cookies: { [key: string]: string } = {};

  public onMessageResolve: (messageId: number, response?: object) => void = (
    messageId,
    response = {},
  ) => {
    if (this.pendingMessages[messageId]) {
      this.pendingMessages[messageId].resolve(response);
      delete this.pendingMessages[messageId];
    }
  };

  public onMessageReject: (messageId: number, response?: object) => void = (
    messageId,
    response = {},
  ) => {
    if (this.pendingMessages[messageId]) {
      this.pendingMessages[messageId].reject(response);
      delete this.pendingMessages[messageId];
    }
  };

  public onMessage: (message: NativeWebViewMessageSystem) => void = (message) => {
    if (message.type === 'torStatus') {
      this.torDaemonStatus = message.detail || 'ERROR';
      window.dispatchEvent(new CustomEvent('torStatus', { detail: this.torDaemonStatus }));
    } else if (message.type === 'setCookie') {
      if (message.key !== undefined) {
        this.cookies[message.key] = message.detail;
      }
    }
  };

  public postMessage: (message: NativeWebViewMessage) => Promise<{ [key: string]: any }> = async (
    message,
  ) => {
    this.messageCounter += 1;
    message.id = this.messageCounter;
    const json = JSON.stringify(message);
    window.ReactNativeWebView?.postMessage(json);

    return await new Promise<object>(async (resolve, reject) => {
      if (message.id) {
        this.pendingMessages[message.id] = {
          resolve,
          reject,
        };
      }
    });
  };
}

export default NativeRobosats;
