import SystemNativeClient from './SystemNativeClient';
import SystemWebClient from './SystemWebClient';

export interface SystemClient {
  loading: boolean;
  copyToClipboard: (value: string) => void;
  getCookie: (key: string) => string | undefined;
  setCookie: (key: string, value: string) => void;
  deleteCookie: (key: string) => void;
  getItem: (key: string) => string | undefined;
  setItem: (key: string, value: string) => void;
  deleteItem: (key: string) => void;
}

export const systemClient: SystemClient =
  // If userAgent has "RoboSats", we assume the app is running inside of the
  // react-native-web view of the RoboSats Android app.
  window.navigator.userAgent.includes('robosats')
    ? new SystemNativeClient()
    : new SystemWebClient();
