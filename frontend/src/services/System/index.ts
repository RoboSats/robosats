import SystemNativeClient from "./SystemNativeClient";
import SystemWebClient from "./SystemWebClient";


export interface SystemClient {
  copyToClipboard: (value: string) => void;
}

export const systemClient: SystemClient =
  window.ReactNativeWebView != null ? new SystemNativeClient() : new SystemWebClient();
