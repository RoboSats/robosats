import { ApiClient } from '../api';
import { systemClient } from '../../System';

class ApiNativeClient implements ApiClient {
  private assetsCache: { [path: string]: string } = {};
  private assetsPromises: { [path: string]: Promise<string | undefined> } = {};

  private readonly getHeaders: (tokenSHA256?: string) => HeadersInit = (tokenSHA256) => {
    let headers = {
      'Content-Type': 'application/json',
    };

    if (tokenSHA256) {
      headers = {
        ...headers,
        ...{
          Authorization: `Token ${tokenSHA256.substring(0, 40)}`,
        },
      };
    }
    const encrypted_private_key = systemClient.getCookie('encrypted_private_key');
    const public_key = systemClient.getCookie('public_key');

    if (encrypted_private_key && public_key) {
      headers = {
        ...headers,
        ...{
          Cookie: `public_key=${public_key};encrypted_private_key=${encrypted_private_key}`,
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

  public put: (baseUrl: string, path: string, body: object) => Promise<object | undefined> = async (
    baseUrl,
    path,
    body,
  ) => {
    return await new Promise((res, _rej) => res({}));
  };

  public delete: (
    baseUrl: string,
    path: string,
    tokenSHA256?: string,
  ) => Promise<object | undefined> = async (baseUrl, path, tokenSHA256) => {
    return await window.NativeRobosats?.postMessage({
      category: 'http',
      type: 'delete',
      baseUrl,
      path,
      headers: this.getHeaders(tokenSHA256),
    }).then(this.parseResponse);
  };

  public post: (
    baseUrl: string,
    path: string,
    body: object,
    tokenSHA256?: string,
  ) => Promise<object | undefined> = async (baseUrl, path, body, tokenSHA256) => {
    return await window.NativeRobosats?.postMessage({
      category: 'http',
      type: 'post',
      baseUrl,
      path,
      body,
      headers: this.getHeaders(tokenSHA256),
    }).then(this.parseResponse);
  };

  public get: (baseUrl: string, path: string, tokenSHA256?: string) => Promise<object | undefined> =
    async (baseUrl, path, tokenSHA256) => {
      return await window.NativeRobosats?.postMessage({
        category: 'http',
        type: 'get',
        baseUrl,
        path,
        headers: this.getHeaders(tokenSHA256),
      }).then(this.parseResponse);
    };

  public fileImageUrl: (baseUrl: string, path: string) => Promise<string | undefined> = async (
    baseUrl,
    path,
  ) => {
    if (!path) {
      return '';
    }

    if (this.assetsCache[path]) {
      return this.assetsCache[path];
    } else if (path in this.assetsPromises) {
      return await this.assetsPromises[path];
    }

    this.assetsPromises[path] = new Promise<string>(async (resolve, reject) => {
      const fileB64 = await window.NativeRobosats?.postMessage({
        category: 'http',
        type: 'xhr',
        baseUrl,
        path,
      }).catch(reject);

      this.assetsCache[path] = `data:image/png;base64,${fileB64?.b64Data}`;
      delete this.assetsPromises[path];

      resolve(this.assetsCache[path]);
    });

    return await this.assetsPromises[path];
  };
}

export default ApiNativeClient;
