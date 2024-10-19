import { NativeModules } from 'react-native';
const { SystemModule } = NativeModules;

interface SystemModuleInterface {
  useProxy: (useProxy: string) => void;
  setFederation: (federation: string) => void;
  stopNotifications: (stopNotifications: string) => void;
}

export default SystemModule as SystemModuleInterface;
