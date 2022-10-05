import { SystemClient } from '..';
import NativeRobosats from '../../Native';

class SystemNativeClient implements SystemClient {
  constructor() {
    if (!window.NativeRobosats) {
      window.NativeRobosats = new NativeRobosats();
    }
  }

  public copyToClipboard: (value: string) => void = (value) => {
    return window.NativeRobosats?.postMessage({
      category: 'system',
      type: 'copyToClipboardString',
      detail: value,
    });
  };
}

export default SystemNativeClient;
