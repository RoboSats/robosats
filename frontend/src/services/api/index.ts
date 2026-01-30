import ApiWebClient from './ApiWebClient';
import ApiAndroidClient from './ApiAndroidClient';

export interface Auth {
  tokenSHA256: string;
  nostrPubkey?: string;
  keys?: { pubKey: string; encPrivKey: string };
}

export interface ApiClient {
  post: (baseUrl: string, path: string, body: object, auth?: Auth) => Promise<object | undefined>;
  put: (baseUrl: string, path: string, body: object, auth?: Auth) => Promise<object | undefined>;
  get: (baseUrl: string, path: string, auth?: Auth) => Promise<object | undefined>;
  delete: (baseUrl: string, path: string, auth?: Auth) => Promise<object | undefined>;
  sendBinary: (
    baseUrl: string,
    path: string,
    data: Uint8Array,
    authHeader?: string,
  ) => Promise<string | undefined>;
  getBinary: (baseUrl: string, path: string) => Promise<Uint8Array | undefined>;
}

export const apiClient: ApiClient = window.navigator.userAgent.includes('AndroidRobosats')
  ? new ApiAndroidClient()
  : new ApiWebClient();
