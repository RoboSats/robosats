import type NativeRobosats from './index';

declare global {
  interface Window {
    ReactNativeWebView?: ReactNativeWebView;
    NativeRobosats?: NativeRobosats;
    RobosatsSettings: 'web-basic' | 'web-pro' | 'selfhosted-basic' | 'selfhosted-pro';
  }
}

export interface ReactNativeWebView {
  postMessage: (message: string) => Promise<Record<string, any>>;
}

export interface NativeWebViewMessageHttp {
  id?: number;
  category: 'http';
  type: 'post' | 'get' | 'put' | 'delete';
  path: string;
  baseUrl: string;
  headers?: object;
  body?: object;
}

export interface NativeWebViewMessageSystem {
  id?: number;
  category: 'system';
  type: 'init' | 'torStatus' | 'copyToClipboardString' | 'setCookie' | 'deleteCookie';
  key?: string;
  detail?: string;
}

export declare type NativeWebViewMessage = NativeWebViewMessageHttp | NativeWebViewMessageSystem;

export interface NativeRobosatsPromise {
  resolve: (value: object | PromiseLike<object>) => void;
  reject: (reason?: any) => void;
}
