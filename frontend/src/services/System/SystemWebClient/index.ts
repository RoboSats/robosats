import { type SystemClient } from '..';

class SystemWebClient implements SystemClient {
  public loading = false;

  public copyToClipboard: (value: string) => void = (value) => {
    // navigator clipboard api needs a secure context (https)
    // this function attempts to copy also on http contexts
    // useful on the http i2p site and on torified browsers
    if (navigator.clipboard !== undefined && window.isSecureContext) {
      // navigator clipboard api method'
      void navigator.clipboard.writeText(value);
    } else {
      // text area method
      const textArea = document.createElement('textarea');
      textArea.value = value;
      // make the textarea out of viewport
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      // here the magic happens
      document.execCommand('copy');
      textArea.remove();
    }
  };

  // Local storage
  public getItem: (key: string) => Promise<string | undefined> = async (key) => {
    const value = window.localStorage.getItem(key);
    return value ?? '';
  };

  public getSyncItem: (key: string) => string | undefined = (key) => {
    const value = window.localStorage.getItem(key);
    return value ?? '';
  };

  public setItem: (key: string, value: string) => void = (key, value) => {
    window.localStorage.setItem(key, value);
  };

  public deleteItem: (key: string) => void = (key) => {
    window.localStorage.removeItem(key);
  };
}

export default SystemWebClient;
