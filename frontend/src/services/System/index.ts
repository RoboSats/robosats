import SystemNativeClient from './SystemNativeClient';
import SystemWebClient from './SystemWebClient';

export interface SystemClient {
  loading: boolean;
  copyToClipboard: (value: string) => void;
  getCookie: (key: string) => string | undefined;
  setCookie: (key: string, value: string) => void;
  deleteCookie: (key: string) => void;
}

export const systemClient: SystemClient =
  window.ReactNativeWebView != null ? new SystemNativeClient() : new SystemWebClient();
