import { type ApiClient, type Auth } from '..';
import { systemClient } from '../../System';
import ApiWebClient from '../ApiWebClient';

class ApiNativeClient implements ApiClient {
  public useProxy = true;

  private readonly webClient: ApiClient = new ApiWebClient();

  private readonly getHeaders: (auth?: Auth) => HeadersInit = (auth) => {
    let headers = {
      'Content-Type': 'application/json',
    };

    if (auth != null && auth.keys === undefined) {
      headers = {
        ...headers,
        ...{
          Authorization: `Token ${auth.tokenSHA256}`,
          Nostr: auth.nostrPubKey,
        },
      };
    } else if (auth?.keys != null) {
      headers = {
        ...headers,
        ...{
          Authorization: `Token ${auth.tokenSHA256} | Public ${auth.keys.pubKey} | Private ${auth.keys.encPrivKey}`,
          Nostr: auth.nostrPubKey,
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
    _baseUrl,
    _path,
    _body,
  ) => {
    return await new Promise<object>((resolve, _reject) => {
      resolve({});
    });
  };

  public delete: (baseUrl: string, path: string, auth?: Auth) => Promise<object | undefined> =
    async (baseUrl, path, auth) => {
      if (!this.useProxy) return await this.webClient.delete(baseUrl, path, auth);
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
    if (!this.useProxy) return await this.webClient.post(baseUrl, path, body, auth);
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
    if (!this.useProxy) return await this.webClient.get(baseUrl, path, auth);
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
