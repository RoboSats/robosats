import { type SystemClient } from '..';
import AndroidRobosats from '../../Android';
import { v4 as uuidv4 } from 'uuid';

class SystemAndroidClient implements SystemClient {
  constructor() {
    window.AndroidRobosats = new AndroidRobosats();
  }

  public loading = false;

  // Clipboard
  public copyToClipboard: (value: string) => void = (value) => {
    window.AndroidAppRobosats?.copyToClipboard(value ?? '');
  };

  // Local storage
  public getItem: (key: string) => Promise<string | undefined> = async (key) => {
    try {
      const result = await new Promise<string>((resolve, reject) => {
        const uuid: string = uuidv4();
        window.AndroidAppRobosats?.getEncryptedStorage(uuid, key);
        window.AndroidRobosats?.storePromise(uuid, resolve, reject);
      });

      return result;
    } catch (error) {
      console.error('Error generating roboname:', error);
      return;
    }
  };

  public setItem: (key: string, value: string) => void = (key, value) => {
    const uuid: string = uuidv4();
    window.AndroidAppRobosats?.setEncryptedStorage(uuid, key, value);
  };

  public deleteItem: (key: string) => void = (key) => {
    const uuid: string = uuidv4();
    window.AndroidAppRobosats?.deleteEncryptedStorage(uuid, key);
  };

  public restart: () => void = () => {
    window.AndroidAppRobosats?.restart();
  };
}

export default SystemAndroidClient;
