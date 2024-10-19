import { NativeModules } from 'react-native';
const { NotificationsModule } = NativeModules;

interface NotificationsModuleInterface {
  monitorOrders: (slotsJson: string) => void;
}

export default NotificationsModule as NotificationsModuleInterface;
