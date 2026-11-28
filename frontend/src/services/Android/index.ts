declare global {
  interface Window {
    AndroidDataRobosats?: AndroidDataRobosats;
    AndroidAppRobosats?: AndroidAppRobosats;
    AndroidRobosats?: AndroidRobosats;
    RobosatsSettings: 'web-basic' | 'web-pro' | 'selfhosted-basic' | 'selfhosted-pro';
  }
}

interface AndroidDataRobosats {
  navigateToPage: string;
}

interface AndroidAppRobosats {
  getEncryptedStorage: (uuid: string, key: string) => void;
  setEncryptedStorage: (uuid: string, key: string, value: string) => void;
  deleteEncryptedStorage: (uuid: string, key: string) => void;
  generateRoboname: (uuid: string, initialString: string) => void;
  generateRobohash: (uuid: string, initialString: string) => void;
  copyToClipboard: (value: string) => void;
  getTorStatus: (uuid: string) => void;
  openWS: (uuid: string, path: string) => void;
  sendWsMessage: (connectionId: string, message: string) => boolean;
  closeWS: (connectionId: string) => void;
  sendRequest: (
    uuid: string,
    action: 'GET' | 'POST' | 'DELETE' | 'PUT',
    url: string,
    headers: string,
    body: string,
  ) => void;
  sendBinary: (uuid: string, url: string, headers: string, base64Data: string) => void;
  getBinary: (uuid: string, url: string) => void;
  restart: () => void;
}

class AndroidRobosats {
  private WSConnections: Record<string, (message?: string) => void> = {};
  private WSError: Record<string, () => void> = {};
  private WSClose: Record<string, () => void> = {};

  private promises: Record<
    string,
    {
      resolve: (value: string | PromiseLike<string>) => void;
      reject: (reason?: string) => void;
    }
  > = {};

  public navigateToPage: (orderPath: string) => void = (orderPath) => {
    console.log('orderPath', orderPath);
  };

  public storePromise: (
    uuid: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolve: (value: any | PromiseLike<any>) => void,
    reject?: (reason?: string) => void,
  ) => void = (uuid, resolve, reject) => {
    this.promises[uuid] = {
      resolve,
      reject: reject || ((error) => console.error('Promise rejected:', error)),
    };
  };

  public onResolvePromise: (uuid: string, response: string) => void = (uuid, response) => {
    if (this.promises[uuid]) {
      this.promises[uuid].resolve(response);
      delete this.promises[uuid];
    } else {
      console.warn(`No promise found for UUID: ${uuid}`);
    }
  };

  public onRejectPromise: (uuid: string, error: string) => void = (uuid, error) => {
    if (this.promises[uuid]) {
      this.promises[uuid].reject(error);
      delete this.promises[uuid];
    } else {
      console.warn(`No promise found for UUID: ${uuid}`);
    }
  };

  public registerWSConnection: (
    connectionId: string,
    onMessage: (message?: string) => void,
    onClose: () => void,
    onError: () => void,
  ) => void = (connectionId, onMessage, onClose, onError) => {
    this.WSConnections[connectionId] = onMessage;
    this.WSError[connectionId] = onError;
    this.WSClose[connectionId] = onClose;
  };

  public removeWSConnection: (connectionId: string) => void = (connectionId) => {
    delete this.WSConnections[connectionId];
    delete this.WSError[connectionId];
    delete this.WSClose[connectionId];
  };

  public onWSMessage: (connectionId: string, message: string) => void = (connectionId, message) => {
    this.WSConnections[connectionId]?.(message);
  };

  public onWsError: (connectionId: string) => void = (connectionId) => {
    this.WSError[connectionId]?.();
  };

  public onWsClose: (connectionId: string) => void = (connectionId) => {
    this.WSClose[connectionId]?.();
  };
}

export default AndroidRobosats;
