import { NativeRobosatsPromise, NativeWebViewMessage } from './index.d';

class NativeRobosats {
  constructor() {
    this.messageCounter = 0;
  }

  private messageCounter: number;

  private pendingMessages: { [id: number]: NativeRobosatsPromise } = {};

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
