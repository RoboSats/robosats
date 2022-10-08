import { SystemClient } from '..';
import NativeRobosats from '../../Native';

class SystemNativeClient implements SystemClient {
  constructor() {
    window.NativeRobosats = new NativeRobosats();
    window.NativeRobosats.postMessage({
      category: 'system',
      type: 'init',
    }).then(() => {
      this.loading = false;
    });
  }

  public loading = true;

  public copyToClipboard: (value: string) => void = (value) => {
    return window.NativeRobosats?.postMessage({
      category: 'system',
      type: 'copyToClipboardString',
      detail: value,
    });
  };

  public getCookie: (key: string) => string | undefined = (key) => {
    return window.NativeRobosats?.cookies[key];
  };

  public setCookie: (key: string, value: string) => void = (key, value) => {
    delete window.NativeRobosats?.cookies[key];
    window.NativeRobosats?.postMessage({
      category: 'system',
      type: 'setCookie',
      key,
      detail: value,
    });
  };

  public deleteCookie: (key: string) => void = (key) => {
    delete window.NativeRobosats?.cookies[key];

    window.NativeRobosats?.postMessage({
      category: 'system',
      type: 'deleteCookie',
      key,
    });
  };
}

export default SystemNativeClient;
