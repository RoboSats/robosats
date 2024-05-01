import { type ApiClient, type Auth } from '..';
import { systemClient } from '../../System';

class ApiNativeClient implements ApiClient {
  private assetsCache: Record<string, string> = {};
  private readonly assetsPromises = new Map<string, Promise<string | undefined>>();

  private readonly getHeaders: (auth?: Auth) => HeadersInit = (auth) => {
    let headers = {
      'Content-Type': 'application/json',
    };

    if (auth != null && auth.keys === undefined) {
      headers = {
        ...headers,
        ...{
          Authorization: `Token ${auth.tokenSHA256}`,
        },
      };
    } else if (auth?.keys != null) {
      headers = {
        ...headers,
        ...{
          Authorization: `Token ${auth.tokenSHA256} | Public ${auth.keys.pubKey} | Private ${auth.keys.encPrivKey}`,
        },
      };
    }

    return headers;
  };

  private readonly parseResponse = (response: Record<string, any>): object => {
    if (response.headers['set-cookie'] != null) {
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
    return await new Promise<object>((resolve, _reject) => {
      resolve({});
    });
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
}

export default ApiNativeClient;
