import { NativeModules } from 'react-native';
const { TorModule } = NativeModules;

interface TorModuleInterface {
  start: () => void;
  restart: () => void;
  getTorStatus: () => void;
  sendWsOpen: (path: string) => Promise<boolean>;
  sendWsClose: (path: string) => Promise<boolean>;
  sendWsSend: (path: string, message: string) => Promise<boolean>;
  sendRequest: (action: string, url: string, headers: string, body: string) => Promise<string>;
}

export default TorModule as TorModuleInterface;
