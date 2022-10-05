import { SystemClient } from '..';
import NativeRobosats from '../../Native';

class SystemNativeClient implements SystemClient {
  constructor() {
    if (!window.NativeRobosats) {
      window.NativeRobosats = new NativeRobosats();
    }
  }

  public copyToClipboard: (value: string) => void = (path) => {
    return window.NativeRobosats?.postMessage({
      category: 'http',
      type: 'get',
      path,
    });
  };
}

export default SystemNativeClient;
