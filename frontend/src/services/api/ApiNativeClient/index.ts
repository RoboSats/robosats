import { ApiClient } from '../api';
import { systemClient } from '../../System';
import NativeRobosats from '../../Native';

class ApiNativeClient implements ApiClient {
  private assetsCache: { [path: string]: string } = {};
  private assetsPromises: { [path: string]: Promise<string | undefined> } = {};

  private readonly getHeaders: () => HeadersInit = () => {
    let headers = {
      'Content-Type': 'application/json',
    };

    const sessionid = systemClient.getCookie('sessionid');
    if (sessionid) {
      const robotToken = systemClient.getCookie('robot_token');
      const csrftoken = systemClient.getCookie('csrftoken');
      const pubKey = systemClient.getCookie('pub_key');

      headers = {
        ...headers,
        ...{
          'X-CSRFToken': csrftoken,
          Cookie: `sessionid=${sessionid};robot_token=${robotToken};csrftoken=${csrftoken};pub_key=${pubKey}`,
        },
      };
    }

    return headers;
  };

  private readonly parseResponse = (response: { [key: string]: any }): object => {
    if (response.headers['set-cookie']) {
      response.headers['set-cookie'].forEach((cookie: string) => {
        const keySplit: string[] = cookie.split('=');
        systemClient.setCookie(keySplit[0], keySplit[1].split(';')[0]);
      });
    }
    return response.json;
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
    }).then(this.parseResponse);
  };

  public post: (path: string, body: object) => Promise<object | undefined> = async (path, body) => {
    return await window.NativeRobosats?.postMessage({
      category: 'http',
      type: 'post',
      path,
      body,
      headers: this.getHeaders(),
    }).then(this.parseResponse);
  };

  public get: (path: string) => Promise<object | undefined> = async (path) => {
    return await window.NativeRobosats?.postMessage({
      category: 'http',
      type: 'get',
      path,
      headers: this.getHeaders(),
    }).then(this.parseResponse);
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
