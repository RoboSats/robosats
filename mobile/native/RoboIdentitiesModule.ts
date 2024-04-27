import { NativeModules } from 'react-native';
const { RoboIdentitiesModule } = NativeModules;

interface RoboIdentitiesModuleInterface {
  generateRoboname: (initialString: String) => String;
}

export default RoboIdentitiesModule as RoboIdentitiesModuleInterface;
