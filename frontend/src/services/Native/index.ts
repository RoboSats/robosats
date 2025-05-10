import {
  type NativeRobosatsPromise,
  type NativeWebViewMessage,
  type NativeWebViewMessageSystem,
} from './index.d';

class NativeRobosats {
  public torDaemonStatus = 'NOTINIT';

  private messageCounter: number = 0;

  private readonly pendingMessages = new Map<number, NativeRobosatsPromise>();

  public cookies: Record<string, string> = {};

  public loadCookie = (cookie: { key: string; value: string }): void => {
    this.cookies[cookie.key] = cookie.value;
  };

  public onMessageResolve: (messageId: number, response?: object) => void = (
    messageId,
    response = {},
  ) => {
    if (this.pendingMessages.has(messageId)) {
      this.pendingMessages.get(messageId)?.resolve(response);
      this.pendingMessages.delete(messageId);
    }
  };

  public onMessageReject: (messageId: number, response?: object) => void = (
    messageId,
    response = {},
  ) => {
    if (this.pendingMessages.has(messageId)) {
      this.pendingMessages.get(messageId)?.reject(response);
      this.pendingMessages.delete(messageId);
    }
  };

  public onMessage: (message: NativeWebViewMessageSystem) => void = (message) => {
    if (message.type === 'torStatus') {
      this.torDaemonStatus = message.detail ?? 'ERROR';
      window.dispatchEvent(new CustomEvent('torStatus', { detail: this.torDaemonStatus }));
    } else if (message.type === 'setCookie') {
      if (message.key !== undefined) {
        this.cookies[message.key] = String(message.detail);
      }
    } else {
      window.dispatchEvent(new CustomEvent(message.type, { detail: message?.detail }));
    }
  };

  public postMessage: (message: NativeWebViewMessage) => Promise<object> = async (message) => {
    this.messageCounter += 1;
    message.id = this.messageCounter;
    const json = JSON.stringify(message);
    void window.ReactNativeWebView?.postMessage(json);

    return await new Promise<object>((resolve, reject) => {
      if (message.id !== undefined) {
        this.pendingMessages.set(message.id, {
          resolve,
          reject,
        });
      }
    });
  };
}

export default NativeRobosats;
