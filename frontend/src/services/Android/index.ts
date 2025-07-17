declare global {
  interface Window {
    AndroidAppRobosats?: AndroidAppRobosats;
    AndroidRobosats?: AndroidRobosats;
    RobosatsSettings: 'web-basic' | 'web-pro' | 'selfhosted-basic' | 'selfhosted-pro';
  }
}

interface AndroidAppRobosats {
  generateRoboname: (uuid: string, initialString: string) => void;
  generateRobohash: (uuid: string, initialString: string) => void;
  copyToClipboard: (value: string) => void;
  getTorStatus: (uuid: string) => void;
  openWS: (uuid: string, path: string) => void;
  sendWsMessage: (uuid: string, path: string, message: string) => void;
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
      delete this.promises[uuid]; // Clean up after resolving
    } else {
      console.warn(`No promise found for UUID: ${uuid}`);
    }
  };

  public onRejectPromise: (uuid: string, error: string) => void = (uuid, error) => {
    if (this.promises[uuid]) {
      this.promises[uuid].reject(error);
      delete this.promises[uuid]; // Clean up after rejecting
    } else {
      console.warn(`No promise found for UUID: ${uuid}`);
    }
  };

  public registerWSConnection: (
    path: string,
    onMesage: (message?: string) => void,
    onClose: () => void,
    onError: () => void,
  ) => void = (path, onMesage, onClose, onError) => {
    this.WSConnections[path] = onMesage;
    this.WSError[path] = onError;
    this.WSClose[path] = onClose;
  };

  public removeWSConnection: (path: string) => void = (path) => {
    delete this.WSConnections[path];
    delete this.WSError[path];
    delete this.WSClose[path];
  };

  public onWSMessage: (path: string, message: string) => void = (path, message) => {
    this.WSConnections[path](message);
  };

  public onWsError: (path: string) => void = (path) => {
    this.WSError[path]();
  };

  public onWsClose: (path: string) => void = (path) => {
    this.WSClose[path]();
  };
}

export default AndroidRobosats;
