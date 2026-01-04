import { type ApiClient, type Auth } from '..';

// helper to broadcast errors to the UI
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

  // Helper to handle the fetch request with error catching
  private async request(url: string, options: RequestInit): Promise<any> {
    try {
      const response = await fetch(url, options);
      
      // Check for HTTP errors 
      if (!response.ok) {
        dispatchError(`Request failed: ${response.status} ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      // Check for Network errors
      console.error("API Error:", error);
      dispatchError("Coordinator unreachable! Please check your connection.");
      throw error; // Re-throw so the app logic still knows it failed
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
}

export default ApiWebClient;
