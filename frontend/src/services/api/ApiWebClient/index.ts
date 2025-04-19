import { type ApiClient, type Auth } from '..';

class ApiWebClient implements ApiClient {
  public useProxy = false;

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

  public post: (baseUrl: string, path: string, body: object, auth?: Auth) => Promise<object> =
    async (baseUrl, path, body, auth) => {
      const requestOptions = {
        method: 'POST',
        headers: this.getHeaders(auth),
        body: JSON.stringify(body),
      };

      return await fetch(baseUrl + path, requestOptions).then(
        async (response) => await response.json(),
      );
    };

  public put: (baseUrl: string, path: string, body: object, auth?: Auth) => Promise<object> =
    async (baseUrl, path, body, auth) => {
      const requestOptions = {
        method: 'PUT',
        headers: this.getHeaders(auth),
        body: JSON.stringify(body),
      };
      return await fetch(baseUrl + path, requestOptions).then(
        async (response) => await response.json(),
      );
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
    return await fetch(baseUrl + path, requestOptions).then(
      async (response) => await response.json(),
    );
  };

  public get: (baseUrl: string, path: string, auth?: Auth) => Promise<object> = async (
    baseUrl,
    path,
    auth,
  ) => {
    return await fetch(baseUrl + path, { headers: this.getHeaders(auth) }).then(
      async (response) => await response.json(),
    );
  };
}

export default ApiWebClient;
