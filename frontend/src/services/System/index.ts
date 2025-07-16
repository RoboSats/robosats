import SystemNativeClient from './SystemNativeClient';
import SystemWebClient from './SystemWebClient';
import SystemDesktopClient from './SystemDesktopClient';
import SystemAndroidClient from './SystemAndroidClient';

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

function getSystemClient(): SystemClient {
  if (window.navigator.userAgent.includes('robosats')) {
    // If userAgent has "RoboSats", we assume the app is running inside of the
    // react-native-web view of the RoboSats Android app.
    return new SystemNativeClient();
  } else if (window.navigator.userAgent.includes('Electron')) {
    // If userAgent has "Electron", we assume the app is running inside of an Electron app.
    return new SystemDesktopClient();
  } else if (window.navigator.userAgent.includes('AndroidRobosats')) {
    // If userAgent has "AndroidRobosats", we assume the app is running inside the Kotlin webview of the RoboSats Android app.
    return new SystemAndroidClient();
  } else {
    // Otherwise, we assume the app is running in a web browser.
    return new SystemWebClient();
  }
}

export const systemClient: SystemClient = getSystemClient();
