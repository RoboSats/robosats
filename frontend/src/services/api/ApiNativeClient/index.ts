import { ApiClient, Auth } from '..';
import { systemClient } from '../../System';

class ApiNativeClient implements ApiClient {
  private assetsCache: { [path: string]: string } = {};
  private assetsPromises: { [path: string]: Promise<string | undefined> } = {};

  private readonly getHeaders: (auth?: Auth) => HeadersInit = (auth) => {
    let headers = {
      'Content-Type': 'application/json',
    };

    if (auth) {
      headers = {
        ...headers,
        ...{
          Authorization: `Token ${auth.tokenSHA256}`,
        },
      };
    }

    if (auth?.keys) {
      headers = {
        ...headers,
        ...{
          Cookie: `public_key=${auth.keys.pubKey};encrypted_private_key=${auth.keys.encPrivKey}`,
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

  public delete: (baseUrl: string, path: string, auth?: Auth) => Promise<object | undefined> =
    async (baseUrl, path, auth) => {
      return await window.NativeRobosats?.postMessage({
        category: 'http',
        type: 'delete',
        baseUrl,
        path,
        headers: this.getHeaders(auth),
      }).then(this.parseResponse);
    };

  public post: (
    baseUrl: string,
    path: string,
    body: object,
    auth?: Auth,
  ) => Promise<object | undefined> = async (baseUrl, path, body, auth) => {
    return await window.NativeRobosats?.postMessage({
      category: 'http',
      type: 'post',
      baseUrl,
      path,
      body,
      headers: this.getHeaders(auth),
    }).then(this.parseResponse);
  };

  public get: (baseUrl: string, path: string, auth?: Auth) => Promise<object | undefined> = async (
    baseUrl,
    path,
    auth,
  ) => {
    return await window.NativeRobosats?.postMessage({
      category: 'http',
      type: 'get',
      baseUrl,
      path,
      headers: this.getHeaders(auth),
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
