import { NativeModules } from 'react-native';
const { NotificationsModule } = NativeModules;

interface NotificationsModuleInterface {
  monitorOrders: (slotsJson: string) => void;
  useProxy: (useProxy: string) => void;
  setFederation: (federation: string) => void;
}

export default NotificationsModule as NotificationsModuleInterface;
