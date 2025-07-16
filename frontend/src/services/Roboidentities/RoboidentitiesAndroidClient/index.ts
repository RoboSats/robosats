import { type RoboidentitiesClient } from '../type';
import { v4 as uuidv4 } from 'uuid';

class RoboidentitiesAndroidClient implements RoboidentitiesClient {
  private robonames: Record<string, string> = {};
  private robohashes: Record<string, string> = {};

  public generateRoboname: (initialString: string) => Promise<string> = async (initialString) => {
    if (this.robonames[initialString]) {
      return this.robonames[initialString];
    } else {
      try {
        const result = await new Promise<string>((resolve, reject) => {
          const uuid: string = uuidv4();
          window.AndroidAppRobosats?.generateRoboname(uuid, initialString);
          window.AndroidRobosats?.storePromise(uuid, resolve, reject);
        });

        this.robonames[initialString] = result;
        return result;
      } catch (error) {
        console.error('Error generating roboname:', error);
        return '';
      }
    }
  };

  public generateRobohash: (initialString: string, size: 'small' | 'large') => Promise<string> =
    async (initialString, size) => {
      const key = `${initialString};${size === 'small' ? 80 : 256}`;

      if (this.robohashes[key]) {
        return this.robohashes[key];
      } else {
        try {
          const result = await new Promise<string>((resolve, reject) => {
            const uuid: string = uuidv4();
            window.AndroidAppRobosats?.generateRobohash(uuid, initialString);
            window.AndroidRobosats?.storePromise(uuid, resolve, reject);
          });

          const image: string = `data:image/png;base64,${result}`;
          this.robohashes[key] = image;
          return image;
        } catch (error) {
          console.error('Error generating robohash:', error);
          return '';
        }
      }
    };
}

export default RoboidentitiesAndroidClient;
