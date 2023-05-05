import { ApiClient } from '..';

class ApiWebClient implements ApiClient {
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

    return headers;
  };

  public post: (
    baseUrl: string,
    path: string,
    body: object,
    tokenSHA256?: string,
  ) => Promise<object> = async (baseUrl, path, body, tokenSHA256) => {
    const requestOptions = {
      method: 'POST',
      headers: this.getHeaders(tokenSHA256),
      body: JSON.stringify(body),
    };

    return await fetch(baseUrl + path, requestOptions).then(
      async (response) => await response.json(),
    );
  };

  public put: (
    baseUrl: string,
    path: string,
    body: object,
    tokenSHA256?: string,
  ) => Promise<object> = async (baseUrl, path, body, tokenSHA256) => {
    const requestOptions = {
      method: 'PUT',
      headers: this.getHeaders(tokenSHA256),
      body: JSON.stringify(body),
    };
    return await fetch(baseUrl + path, requestOptions).then(
      async (response) => await response.json(),
    );
  };

  public delete: (baseUrl: string, path: string, tokenSHA256?: string) => Promise<object> = async (
    baseUrl,
    path,
    tokenSHA256,
  ) => {
    const requestOptions = {
      method: 'DELETE',
      headers: this.getHeaders(tokenSHA256),
    };
    return await fetch(baseUrl + path, requestOptions).then(
      async (response) => await response.json(),
    );
  };

  public get: (baseUrl: string, path: string, tokenSHA256?: string) => Promise<object> = async (
    baseUrl,
    path,
    tokenSHA256,
  ) => {
    return await fetch(baseUrl + path, { headers: this.getHeaders(tokenSHA256) }).then(
      async (response) => await response.json(),
    );
  };
}

export default ApiWebClient;
