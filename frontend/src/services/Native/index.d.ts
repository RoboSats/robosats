import type NativeRobosats from './index';

declare global {
  interface Window {
    ReactNativeWebView?: ReactNativeWebView;
    NativeRobosats?: NativeRobosats;
    RobosatsSettings: 'web-basic' | 'web-pro' | 'selfhosted-basic' | 'selfhosted-pro';
  }
}

export interface ReactNativeWebView {
  postMessage: (message: string) => Promise<Record<string, object>>;
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
  type:
    | 'init'
    | 'torStatus'
    | 'WsMessage'
    | 'copyToClipboardString'
    | 'setCookie'
    | 'deleteCookie'
    | 'navigateToPage';
  key?: string;
  detail?: string;
}

export interface NativeWebViewMessageRoboidentities {
  id?: number;
  category: 'roboidentities';
  type: 'roboname' | 'robohash';
  string?: string;
  size?: string;
}

export declare type NativeWebViewMessage =
  | NativeWebViewMessageHttp
  | NativeWebViewMessageSystem
  | NativeWebViewMessageRoboidentities
  | NA;

export interface NativeRobosatsPromise {
  resolve: (value: object | PromiseLike<object>) => void;
  reject: (reason?: string) => void;
}
