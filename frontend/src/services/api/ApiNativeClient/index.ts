import { ApiClient } from '../api';
import { systemClient } from '../../System';
import NativeRobosats from '../../Native';

class ApiNativeClient implements ApiClient {
  constructor() {
    if (!window.NativeRobosats) {
      window.NativeRobosats = new NativeRobosats();
    }
  }

  private assetsCache: { [path: string]: string } = {};
  private assetsPromises: { [path: string]: Promise<string | undefined> } = {};

  private readonly getHeaders: () => HeadersInit = () => {
    return { 'Content-Type': 'application/json', 'X-CSRFToken': systemClient.getCookie('csrftoken') || '' };
  };

  public put: (path: string, body: object) => Promise<object | undefined> = async (path, body) => {
    return await new Promise((res, _rej) => res({}));
  };

  public delete: (path: string) => Promise<object | undefined> = async (path) => {
    return await window.NativeRobosats?.postMessage({
      category: 'http',
      type: 'delete',
      path,
      headers: this.getHeaders(),
    });
  };

  public post: (path: string, body: object) => Promise<object | undefined> = async (path, body) => {
    return await window.NativeRobosats?.postMessage({
      category: 'http',
      type: 'post',
      path,
      body,
      headers: this.getHeaders(),
    });
  };

  public get: (path: string) => Promise<object | undefined> = async (path) => {
    return await window.NativeRobosats?.postMessage({
      category: 'http',
      type: 'get',
      path,
    });
  };

  public fileImageUrl: (path: string) => Promise<string | undefined> = async (path) => {
    if (!path) {
      return '';
    }

    if (this.assetsCache[path]) {
      return this.assetsCache[path];
    } else if (path in this.assetsPromises) {
      return this.assetsPromises[path];
    }

    this.assetsPromises[path] = new Promise<string>(async (resolve, reject) => {
      const fileB64 = await window.NativeRobosats?.postMessage({
        category: 'http',
        type: 'xhr',
        path,
      }).catch(reject);

      this.assetsCache[path] = `data:image/png;base64,${fileB64?.b64Data}`;
      delete this.assetsPromises[path];

      resolve(this.assetsCache[path]);
    });

    return this.assetsPromises[path];
  };
}

export default ApiNativeClient;
