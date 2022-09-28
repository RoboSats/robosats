import NativeRobosats from './index'

declare global {
  interface Window {
    ReactNativeWebView?: ReactNativeWebView
    NativeRobosats?: NativeRobosats
  }
}

export interface ReactNativeWebView {
  postMessage(message: string): void
}

export interface NativeWebViewMessageHttp {
  id?: number
  category: 'http'
  type: 'post' | 'get' | 'put' | 'delete' | 'xhr'
  path: string
  headers?: object
  body?: object
}

export declare type NativeWebViewMessage = NativeWebViewMessageHttp

export interface NativeRobosatsPromise {
  resolve: (value: object | PromiseLike<object>) => void, 
  reject: (reason?: any) => void
}
