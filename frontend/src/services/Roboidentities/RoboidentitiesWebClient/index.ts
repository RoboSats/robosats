import { type RoboidentitiesClient } from '../type';
import { generate_roboname } from 'robo-identities-wasm';
import { robohash } from './RobohashGenerator';

class RoboidentitiesClientWebClient implements RoboidentitiesClient {
  public generateRoboname: (initialString: string) => Promise<string> = async (initialString) => {
    return await new Promise<string>((resolve, _reject) => {
      resolve(generate_roboname(initialString));
    });
  };

  public generateRobohash: (initialString: string, size: 'small' | 'large') => Promise<string> =
    async (initialString, size) => {
      return await robohash.generate(initialString, size);
    };
}

export default RoboidentitiesClientWebClient;
