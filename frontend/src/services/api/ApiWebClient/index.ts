import { type ApiClient, type Auth } from '..';

const dispatchError = (message: string) => {
  if (typeof window !== 'undefined') {
    const event = new CustomEvent('ROBOSATS_API_ERROR', { detail: message });
    window.dispatchEvent(event);
  }
};

class ApiWebClient implements ApiClient {
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

  private async request(url: string, options: RequestInit): Promise<object> {
    try {
      const response = await fetch(url, options);

      if (!response.ok && ![400, 404].includes(response.status)) {
        dispatchError(`Request failed: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      dispatchError('Coordinator unreachable! Please check your connection.');
      throw error;
    }
  }

  public post: (baseUrl: string, path: string, body: object, auth?: Auth) => Promise<object> =
    async (baseUrl, path, body, auth) => {
      const requestOptions = {
        method: 'POST',
        headers: this.getHeaders(auth),
        body: JSON.stringify(body),
      };
      return await this.request(baseUrl + path, requestOptions);
    };

  public put: (baseUrl: string, path: string, body: object, auth?: Auth) => Promise<object> =
    async (baseUrl, path, body, auth) => {
      const requestOptions = {
        method: 'PUT',
        headers: this.getHeaders(auth),
        body: JSON.stringify(body),
      };
      return await this.request(baseUrl + path, requestOptions);
    };

  public delete: (baseUrl: string, path: string, auth?: Auth) => Promise<object> = async (
    baseUrl,
    path,
    auth,
  ) => {
    const requestOptions = {
      method: 'DELETE',
      headers: this.getHeaders(auth),
    };
    return await this.request(baseUrl + path, requestOptions);
  };

  public get: (baseUrl: string, path: string, auth?: Auth) => Promise<object> = async (
    baseUrl,
    path,
    auth,
  ) => {
    return await this.request(baseUrl + path, { headers: this.getHeaders(auth) });
  };

  public putBinary: (
    baseUrl: string,
    path: string,
    data: Uint8Array,
    authHeader?: string,
  ) => Promise<object> = async (baseUrl, path, data, authHeader) => {
    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/octet-stream',
      };
      if (authHeader) {
        headers['Authorization'] = authHeader;
      }

      const response = await fetch(baseUrl + path, {
        method: 'PUT',
        headers,
        body: data.slice().buffer,
      });

      if (!response.ok) {
        dispatchError(`Binary upload failed: ${response.status} ${response.statusText}`);
        throw new Error(`Binary upload failed: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Binary upload error:', error);
      throw error;
    }
  };

  public getBinary: (baseUrl: string, path: string) => Promise<Uint8Array> = async (
    baseUrl,
    path,
  ) => {
    try {
      const response = await fetch(baseUrl + path);

      if (!response.ok) {
        dispatchError(`Binary download failed: ${response.status} ${response.statusText}`);
        throw new Error(`Binary download failed: ${response.status} ${response.statusText}`);
      }

      const buffer = await response.arrayBuffer();
      return new Uint8Array(buffer);
    } catch (error) {
      console.error('Binary download error:', error);
      throw error;
    }
  };
}
export default ApiWebClient;
