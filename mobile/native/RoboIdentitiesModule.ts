import { NativeModules } from 'react-native';
const { RoboIdentitiesModule } = NativeModules;

interface RoboIdentitiesModuleInterface {
  generateRoboname: (initialString: String) => Promise<string>;
  generateRobohash: (initialString: String) => Promise<string>;
}

export default RoboIdentitiesModule as RoboIdentitiesModuleInterface;
