import { NativeModules } from 'react-native';
const { RoboIdentitiesModule } = NativeModules;

interface RoboIdentitiesModuleInterface {
  generateRoboname: (initialString: string) => Promise<string>;
  generateRobohash: (initialString: string) => Promise<string>;
}

export default RoboIdentitiesModule as RoboIdentitiesModuleInterface;
