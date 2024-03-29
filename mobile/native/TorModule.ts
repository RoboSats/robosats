import { NativeModules } from 'react-native';
const { TorModule } = NativeModules;

interface TorModuleInterface {
  start: () => void;
  restart: () => void;
  getTorStatus: () => void;
  sendRequest: (action: string, url: string, headers: string, body: string) => Promise<string>;
}

export default TorModule as TorModuleInterface;
