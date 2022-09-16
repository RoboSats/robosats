import { ApiClient } from '../api';
import { getCookie } from '../../../utils/cookies';

class ApiWebClient implements ApiClient {
  private readonly getHeaders: () => HeadersInit = () => {
    return { 'Content-Type': 'application/json', 'X-CSRFToken': getCookie('csrftoken') || '' };
  };

  public post: (path: string, body: object) => Promise<object> = async (path, body) => {
    const requestOptions = {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(body),
    };
    return await fetch(path, requestOptions).then(async (response) => await response.json());
  };

  public put: (path: string, body: object) => Promise<object> = async (path, body) => {
    const requestOptions = {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(body),
    };
    return await fetch(path, requestOptions).then(async (response) => await response.json());
  };

  public delete: (path: string) => Promise<object> = async (path) => {
    const requestOptions = {
      method: 'DELETE',
      headers: this.getHeaders(),
    };
    return await fetch(path, requestOptions).then(async (response) => await response.json());
  };

  public get: (path: string) => Promise<object> = async (path) => {
    return await fetch(path).then(async (response) => await response.json());
  };
}

export default ApiWebClient;
