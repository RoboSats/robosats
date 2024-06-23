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

  // Cookies
  public getCookie: (key: string) => string = (key) => {
    let cookieValue = null;
    if (document?.cookie !== '') {
      const cookies = document.cookie.split(';');
      for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i].trim();
        // Does this cookie string begin with the key we want?
        if (cookie.substring(0, key.length + 1) === key + '=') {
          cookieValue = decodeURIComponent(cookie.substring(key.length + 1));
          break;
        }
      }
    }

    return cookieValue ?? '';
  };

  public setCookie: (key: string, value: string) => void = (key, value) => {
    document.cookie = `${key}=${value};path=/;SameSite=None;Secure`;
  };

  public deleteCookie: (key: string) => void = (key) => {
    document.cookie = `${key}= ;path=/; expires = Thu, 01 Jan 1970 00:00:00 GMT`;
  };

  // Local storage
  public getItem: (key: string) => string = (key) => {
    const value = window.sessionStorage.getItem(key);
    return value ?? '';
  };

  public setItem: (key: string, value: string) => void = (key, value) => {
    window.sessionStorage.setItem(key, value);
  };

  public deleteItem: (key: string) => void = (key) => {
    window.sessionStorage.removeItem(key);
  };
}

export default SystemDesktopClient;
