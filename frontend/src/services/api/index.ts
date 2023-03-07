import ApiWebClient from './ApiWebClient';
import ApiNativeClient from './ApiNativeClient';

export interface ApiClient {
  post: (
    baseUrl: string,
    path: string,
    body: object,
    options?: object,
  ) => Promise<object | undefined>;
  put: (
    baseUrl: string,
    path: string,
    body: object,
    options?: object,
  ) => Promise<object | undefined>;
  get: (baseUrl: string, path: string, options?: object) => Promise<object | undefined>;
  delete: (baseUrl: string, path: string, options?: object) => Promise<object | undefined>;
  fileImageUrl?: (baseUrl: string, path: string) => Promise<string | undefined>;
}

export const apiClient: ApiClient =
  window.ReactNativeWebView != null ? new ApiNativeClient() : new ApiWebClient();
