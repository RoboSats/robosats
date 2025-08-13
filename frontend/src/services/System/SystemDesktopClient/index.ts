import { type SystemClient } from '..';

class SystemDesktopClient implements SystemClient {
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
      textArea.style.visibility = 'hidden';
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
    const value = window.sessionStorage.getItem(key);
    return value ?? '';
  };

  public setItem: (key: string, value: string) => void = (key, value) => {
    window.sessionStorage.setItem(key, value);
  };

  public deleteItem: (key: string) => void = (key) => {
    window.sessionStorage.removeItem(key);
  };

  public restart: () => void = () => {};
}

export default SystemDesktopClient;
