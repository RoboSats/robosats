import { ApiClient } from "../api"
import { getCookie } from '../../../utils/cookies';

class ApiWebClient implements ApiClient {
  private getHeaders: () => HeadersInit = () => {
    return { 'Content-Type': 'application/json', 'X-CSRFToken': getCookie('csrftoken') || "" }
  }

  public post: (path: string, body: object) => Promise<object> = (path, body) => {
    const requestOptions = {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(body),
    };
    return fetch(path, requestOptions).then((response) => response.json())
  }

  public put: (path: string, body: object) => Promise<object> = (path, body) => {
    const requestOptions = {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(body),
    };
    return fetch(path, requestOptions).then((response) => response.json())
  }

  public delete: (path: string) => Promise<object> = (path) => {
    const requestOptions = {
      method: 'DELETE',
      headers: this.getHeaders(),
    };
    return fetch(path, requestOptions).then((response) => response.json())
  }

  public get: (path: string) => Promise<object> = (path) => {
    return fetch(path).then((response) => response.json())
  }
}

export default ApiWebClient
