import { type RoboidentitiesClient } from '..';
// import { generate_roboname } from 'robo-identities-wasm';

class RoboidentitiesClientWebClient implements RoboidentitiesClient {
  public generateRoboname: (initialString: string) => Promise<string> = async (initialString) => {
    return new Promise<string>(async (resolve, _reject) => {
      // resolve(generate_roboname(initialString))
    });
  };
}

export default RoboidentitiesClientWebClient;
