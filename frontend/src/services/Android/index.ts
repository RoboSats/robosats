declare global {
  interface Window {
    AndroidAppRobosats?: AndroidAppRobosats;
    AndroidRobosats?: AndroidRobosats;
    RobosatsSettings: 'web-basic' | 'web-pro' | 'selfhosted-basic' | 'selfhosted-pro';
  }
}

interface AndroidAppRobosats {
  generateRoboname: (uuid: string, initialString: string) => void;
}

class AndroidRobosats {
  private promises: Record<string, (value: string | PromiseLike<string>) => void> = {};

  public storePromise: (
    uuid: string,
    promise: (value: string | PromiseLike<string>) => void,
  ) => void = (uuid, promise) => {
    this.promises[uuid] = promise;
  };

  public onResolvePromise: (uuid: string, response: string) => void = (uuid, respone) => {
    this.promises[uuid](respone);
  };
}

export default AndroidRobosats;
