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
    return new Promise((res, _rej) => res({}))
  };

  public delete: (path: string) => Promise<object | undefined> = async (path) => {
    return window.NativeRobosats?.postMessage({
      category: 'http',
      type: 'delete',
      path,
      headers: this.getHeaders()
    })
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
