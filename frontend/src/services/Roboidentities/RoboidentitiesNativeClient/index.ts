import { type RoboidentitiesClient } from '..';
import NativeRobosats from '../../Native';

class RoboidentitiesNativeClient implements RoboidentitiesClient {
  constructor() {
    window.NativeRobosats = new NativeRobosats();
  }

  public loading = true;

  public generateRoboname: (initialString: string) => Promise<string> = async (initialString) => {
    const response = await window.NativeRobosats?.postMessage({
      category: 'roboIdentities',
      type: 'roboname',
      detail: initialString,
    });
    return response ? Object.values(response)[0] : '';
  };
}

export default RoboidentitiesNativeClient;
