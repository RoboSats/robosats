import ApiWebClient from './ApiWebClient';

export interface ApiClient {
  post: (path: string, body: object) => Promise<object>;
  put: (path: string, body: object) => Promise<object>;
  get: (path: string) => Promise<object>;
  delete: (path: string) => Promise<object>;
}

export const apiClient: ApiClient = new ApiWebClient();
