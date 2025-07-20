import { type ApiClient, type Auth } from '..';
import { systemClient } from '../../System';
import ApiWebClient from '../ApiWebClient';
import { v4 as uuidv4 } from 'uuid';

class ApiAndroidClient implements ApiClient {
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
        },
      };
    } else if (auth?.keys != null && auth.nostrPubkey != null) {
      headers = {
        ...headers,
        ...{
          Authorization: `Token ${auth.tokenSHA256} | Public ${auth.keys.pubKey} | Private ${auth.keys.encPrivKey} | Nostr ${auth.nostrPubkey}`,
        },
      };
    }

    return headers;
  };

  private readonly parseResponse = (response: Record<string, object>): object => {
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

      const jsonHeaders = JSON.stringify(this.getHeaders(auth));

      const result = await new Promise<string>((resolve, reject) => {
        const uuid: string = uuidv4();
        window.AndroidAppRobosats?.sendRequest(uuid, 'DELETE', baseUrl + path, jsonHeaders, '');
        window.AndroidRobosats?.storePromise(uuid, resolve, reject);
      });

      return this.parseResponse(JSON.parse(result));
    };

  public post: (
    baseUrl: string,
    path: string,
    body: object,
    auth?: Auth,
  ) => Promise<object | undefined> = async (baseUrl, path, body, auth) => {
    if (!this.useProxy) return await this.webClient.post(baseUrl, path, body, auth);

    const jsonHeaders = JSON.stringify(this.getHeaders(auth));
    const jsonBody = JSON.stringify(body);

    const result = await new Promise<string>((resolve, reject) => {
      const uuid: string = uuidv4();
      window.AndroidAppRobosats?.sendRequest(uuid, 'POST', baseUrl + path, jsonHeaders, jsonBody);
      window.AndroidRobosats?.storePromise(uuid, resolve, reject);
    });

    return this.parseResponse(JSON.parse(result));
  };

  public get: (baseUrl: string, path: string, auth?: Auth) => Promise<object | undefined> = async (
    baseUrl,
    path,
    auth,
  ) => {
    if (!this.useProxy) return await this.webClient.get(baseUrl, path, auth);

    const jsonHeaders = JSON.stringify(this.getHeaders(auth));

    const result = await new Promise<string>((resolve, reject) => {
      const uuid: string = uuidv4();
      window.AndroidAppRobosats?.sendRequest(uuid, 'GET', baseUrl + path, jsonHeaders, '');
      window.AndroidRobosats?.storePromise(uuid, resolve, reject);
    });

    return this.parseResponse(JSON.parse(result));
  };
}

export default ApiAndroidClient;
