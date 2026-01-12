import { type ApiClient, type Auth } from '..';
import { v4 as uuidv4 } from 'uuid';

const dispatchError = (message: string) => {
  if (typeof window !== 'undefined') {
    const event = new CustomEvent('ROBOSATS_API_ERROR', { detail: message });
    window.dispatchEvent(event);
  }
};

class ApiAndroidClient implements ApiClient {
  private readonly getHeaders: (auth?: Auth) => HeadersInit = (auth) => {
    let headers = {
      'Content-Type': 'application/json',
    };

    if (auth != null && !auth.keys && !auth.nostrPubkey) {
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

  private readonly parseResponse = (response: string): object => {
    return JSON.parse(response).json;
  };

  private async request(
    method: 'GET' | 'POST' | 'DELETE',
    baseUrl: string,
    path: string,
    headers: string,
    body: string = '',
  ): Promise<object> {
    try {
      const result = await new Promise<string>((resolve, reject) => {
        const uuid: string = uuidv4();
        window.AndroidAppRobosats?.sendRequest(uuid, method, baseUrl + path, headers, body);
        window.AndroidRobosats?.storePromise(uuid, resolve, reject);
      });

      return this.parseResponse(result);
    } catch (error) {
      console.error('API Error:', error);
      dispatchError('Coordinator unreachable! Please check your connection.');
      throw error;
    }
  }

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
      const jsonHeaders = JSON.stringify(this.getHeaders(auth));

      return await this.request('DELETE', baseUrl, path, jsonHeaders);
    };

  public post: (
    baseUrl: string,
    path: string,
    body: object,
    auth?: Auth,
  ) => Promise<object | undefined> = async (baseUrl, path, body, auth) => {
    const jsonHeaders = JSON.stringify(this.getHeaders(auth));
    const jsonBody = JSON.stringify(body);

    return await this.request('POST', baseUrl, path, jsonHeaders, jsonBody);
  };

  public get: (baseUrl: string, path: string, auth?: Auth) => Promise<object | undefined> = async (
    baseUrl,
    path,
    auth,
  ) => {
    const jsonHeaders = JSON.stringify(this.getHeaders(auth));

    return await this.request('GET', baseUrl, path, jsonHeaders);
  };
}

export default ApiAndroidClient;
