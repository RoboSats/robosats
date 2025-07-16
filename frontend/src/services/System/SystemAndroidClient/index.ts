import { type SystemClient } from '..';
import AndroidRobosats from '../../Android';

class SystemAndroidClient implements SystemClient {
  constructor() {
    window.AndroidRobosats = new AndroidRobosats();
  }

  public loading = false;

  // TODO
  public copyToClipboard: (value: string) => void = () => {};

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

export default SystemAndroidClient;
