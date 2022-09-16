import { ApiClient } from '../api';
import { getCookie } from '../../../utils/cookies';
import NativeRobosats from '../../Native';

class ApiNativeClient implements ApiClient {
  constructor() {
    window.NativeRobosats = new NativeRobosats()
  }

  private readonly getHeaders: () => HeadersInit = () => {
    return { 'Content-Type': 'application/json', 'X-CSRFToken': getCookie('csrftoken') || '' };
  };

  public put: (path: string, body: object) => Promise<object | undefined> = async (path, body) => {
    const requestOptions = {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(body),
    };
    return await fetch('https://unsafe.robosats.com' + path, requestOptions).then(async (response) => await response.json());
  };

  public delete: (path: string) => Promise<object | undefined> = async (path) => {
    const requestOptions = {
      method: 'DELETE',
      headers: this.getHeaders(),
    };
    return await fetch('https://unsafe.robosats.com' + path, requestOptions).then(async (response) => await response.json());
  };

  public post: (path: string, body: object) => Promise<object | undefined> = async (path, body) => {
    return window.NativeRobosats?.postMessage({
      category: 'http',
      type: 'post',
      path,
      body,
      headers: this.getHeaders()
    })
  };

  public get: (path: string) => Promise<object | undefined> = async (path) => {
    return window.NativeRobosats?.postMessage({
      category: 'http',
      type: 'get',
      path
    })
  };
}

export default ApiNativeClient;
