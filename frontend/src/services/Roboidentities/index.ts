import RoboidentitiesClientNativeClient from './RoboidentitiesNativeClient';
import RoboidentitiesClientWebClient from './RoboidentitiesWebClient';

export interface RoboidentitiesClient {
  generateRoboname: (initialString: string) => Promise<string>;
}

export const roboidentitiesClient: RoboidentitiesClient =
  // If userAgent has "RoboSats", we assume the app is running inside of the
  // react-native-web view of the RoboSats Android app.
  window.navigator.userAgent.includes('robosats')
    ? new RoboidentitiesClientNativeClient()
    : new RoboidentitiesClientWebClient();
