import ApiWebClient from './ApiWebClient';
import ApiAndroidClient from './ApiAndroidClient';

export interface Auth {
  tokenSHA256: string;
  nostrPubkey?: string;
  keys?: { pubKey: string; encPrivKey: string };
}

export interface ApiClient {
  useProxy: boolean;
  post: (baseUrl: string, path: string, body: object, auth?: Auth) => Promise<object | undefined>;
  put: (baseUrl: string, path: string, body: object, auth?: Auth) => Promise<object | undefined>;
  get: (baseUrl: string, path: string, auth?: Auth) => Promise<object | undefined>;
  delete: (baseUrl: string, path: string, auth?: Auth) => Promise<object | undefined>;
}

export const apiClient: ApiClient = window.navigator.userAgent.includes('AndroidRobosats')
  ? new ApiAndroidClient()
  : new ApiWebClient();
