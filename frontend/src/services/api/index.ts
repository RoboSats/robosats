import ApiWebClient from './ApiWebClient';
import ApiNativeClient from './ApiNativeClient';

export interface ApiClient {
  post: (
    baseUrl: string,
    path: string,
    body: object,
    tokenSHA256?: string,
  ) => Promise<object | undefined>;
  put: (
    baseUrl: string,
    path: string,
    body: object,
    tokenSHA256?: string,
  ) => Promise<object | undefined>;
  get: (baseUrl: string, path: string, tokenSHA256?: string) => Promise<object | undefined>;
  delete: (baseUrl: string, path: string, tokenSHA256?: string) => Promise<object | undefined>;
  fileImageUrl?: (baseUrl: string, path: string) => Promise<string | undefined>;
}

export const apiClient: ApiClient =
  window.ReactNativeWebView != null ? new ApiNativeClient() : new ApiWebClient();
