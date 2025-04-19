import { type RoboidentitiesClient } from '../type';

class RoboidentitiesNativeClient implements RoboidentitiesClient {
  private robonames: Record<string, string> = {};
  private robohashes: Record<string, string> = {};

  public generateRoboname: (initialString: string) => Promise<string> = async (initialString) => {
    if (this.robonames[initialString]) {
      return this.robonames[initialString];
    } else {
      const response = await window.NativeRobosats?.postMessage({
        category: 'roboidentities',
        type: 'roboname',
        detail: initialString,
      });
      const result = response ? Object.values(response)[0] : '';
      this.robonames[initialString] = result;
      return result;
    }
  };

  public generateRobohash: (initialString: string, size: 'small' | 'large') => Promise<string> =
    async (initialString, size) => {
      const key = `${initialString};${size === 'small' ? 80 : 256}`;

      if (this.robohashes[key]) {
        return this.robohashes[key];
      } else {
        const response = await window.NativeRobosats?.postMessage({
          category: 'roboidentities',
          type: 'robohash',
          detail: key,
        });
        const result: string = response ? Object.values(response)[0] : '';
        const image: string = `data:image/png;base64,${result}`;
        this.robohashes[key] = image;
        return image;
      }
    };
}

export default RoboidentitiesNativeClient;
