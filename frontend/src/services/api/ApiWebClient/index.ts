import { ApiClient } from '..';
import { systemClient } from '../../System';

class ApiWebClient implements ApiClient {
  private readonly getHeaders: () => HeadersInit = () => {
    return {
      'Content-Type': 'application/json',
      'X-CSRFToken': systemClient.getCookie('csrftoken') || '',
    };
  };

  public post: (baseUrl: string, path: string, body: object) => Promise<object> = async (
    baseUrl,
    path,
    body,
  ) => {
    const requestOptions = {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(body),
    };

    console.log(requestOptions);

    return await fetch(baseUrl + path, requestOptions).then(
      async (response) => await response.json(),
    );
  };

  public put: (baseUrl: string, path: string, body: object) => Promise<object> = async (
    baseUrl,
    path,
    body,
  ) => {
    const requestOptions = {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(body),
    };
    return await fetch(baseUrl + path, requestOptions).then(
      async (response) => await response.json(),
    );
  };

  public delete: (baseUrl: string, path: string) => Promise<object> = async (baseUrl, path) => {
    const requestOptions = {
      method: 'DELETE',
      headers: this.getHeaders(),
    };
    return await fetch(baseUrl + path, requestOptions).then(
      async (response) => await response.json(),
    );
  };

  public get: (baseUrl: string, path: string) => Promise<object> = async (baseUrl, path) => {
    return await fetch(baseUrl + path).then(async (response) => await response.json());
  };
}

export default ApiWebClient;
