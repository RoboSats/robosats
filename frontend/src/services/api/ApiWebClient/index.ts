import { ApiClient, Auth } from '..';
import { systemClient } from '../../System';

class ApiWebClient implements ApiClient {
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

    // set cookies before sending the request
    if (auth?.keys) {
      systemClient.setCookie('public_key', auth.keys.pubKey);
      systemClient.setCookie('encrypted_private_key', auth.keys.encPrivKey);
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
