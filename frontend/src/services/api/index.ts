import ApiWebClient from './ApiWebClient';
import ApiNativeClient from './ApiNativeClient';

export interface ApiClient {
  post: (path: string, body: object) => Promise<object | undefined>;
  put: (path: string, body: object) => Promise<object | undefined>;
  get: (path: string) => Promise<object | undefined>;
  delete: (path: string) => Promise<object | undefined>;
}

export const apiClient: ApiClient = window.ReactNativeWebView ? new ApiNativeClient() : new ApiWebClient();
