import {
  type NativeRobosatsPromise,
  type NativeWebViewMessage,
  type NativeWebViewMessageSystem,
} from './index.d';

class NativeRobosats {
  public torDaemonStatus = 'OFF';

  private messageCounter: number = 0;

  private pendingMessages: Record<number, NativeRobosatsPromise> = {};

  public cookies: Record<string, string> = {};

  public loadCookie = (cookie: { key: string; value: string }) => {
    this.cookies[cookie.key] = cookie.value;
  };

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

  public postMessage: (message: NativeWebViewMessage) => Promise<Record<string, any>> = async (
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
