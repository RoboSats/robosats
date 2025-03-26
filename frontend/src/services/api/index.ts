import ApiWebClient from './ApiWebClient';
import ApiNativeClient from './ApiNativeClient';

export interface Auth {
  tokenSHA256: string;
  nostrPubKey: string;
  keys?: { pubKey: string; encPrivKey: string };
}

export interface ApiClient {
  useProxy: boolean;
  post: (baseUrl: string, path: string, body: object, auth?: Auth) => Promise<object | undefined>;
  put: (baseUrl: string, path: string, body: object, auth?: Auth) => Promise<object | undefined>;
  get: (baseUrl: string, path: string, auth?: Auth) => Promise<object | undefined>;
  delete: (baseUrl: string, path: string, auth?: Auth) => Promise<object | undefined>;
}

export const apiClient: ApiClient =
  window.ReactNativeWebView != null ? new ApiNativeClient() : new ApiWebClient();
