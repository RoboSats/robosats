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
    method: 'GET' | 'POST' | 'DELETE' | 'PUT',
    baseUrl: string,
    path: string,
    headers: string = '{}',
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

  public sendBinary: (
    baseUrl: string,
    path: string,
    data: Uint8Array,
    nostrAuthHeader?: string,
  ) => Promise<object | undefined> = async (baseUrl, path, data, nostrAuthHeader) => {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/octet-stream',
      };
      if (nostrAuthHeader) {
        headers['Authorization'] = nostrAuthHeader;
      }

      // binary to base64 for Android bridge
      const base64Data = btoa(String.fromCharCode.apply(null, Array.from(data)));

      // Use dedicated sendBinary method for binary uploads
      const result = await new Promise<string>((resolve, reject) => {
        const uuid: string = uuidv4();
        window.AndroidAppRobosats?.sendBinary(
          uuid,
          baseUrl + path,
          JSON.stringify(headers),
          base64Data,
        );
        window.AndroidRobosats?.storePromise(uuid, resolve, reject);
      });

      return this.parseResponse(result);
    } catch (error) {
      console.error('Binary upload error:', error);
      dispatchError('Binary upload failed! Please check your connection.');
      throw error;
    }
  };

  public getBinary: (baseUrl: string, path: string) => Promise<Uint8Array | undefined> = async (
    baseUrl,
    path,
  ) => {
    try {
      // Parse base64 response from Android bridge
      const response = (await this.request('GET', baseUrl, path)) as { base64: string };

      if (response.base64) {
        return Uint8Array.from(atob(response.base64), (c) => c.charCodeAt(0));
      }

      const buffer = await (await fetch(baseUrl + path)).arrayBuffer();
      return new Uint8Array(buffer);
    } catch (error) {
      console.error('Binary download error:', error);
      dispatchError('Binary download failed! Please check your connection.');
      throw error;
    }
  };
}

export default ApiAndroidClient;
