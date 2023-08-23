import { NativeModules } from 'react-native';

const { OkHttpModule } = NativeModules;
class TorClient {
  public attemptStartTor: () => Promise<boolean> = async () => {
    try {
      let socksPort = await NativeModules.RoboTor.startTor();
      if (socksPort > 0) {
        console.log('Tor proxy started on port ', socksPort);
        return true;
      } else {
        console.error('Failed to start Tor. Invalid port:', socksPort);
        return false;
      }
    } catch (e) {
      console.error('Error while starting Tor:', e);
      return false;
    }
  };

  public get: (baseUrl: string, path: string, headers: Record<string, string>) => Promise<object> =
    async (baseUrl, path, headers) => {
      try {
        const fullUrl = `${baseUrl}${path}`;

        let result = await OkHttpModule.get(fullUrl, headers);
        return result;
      } catch (e) {
        throw e;
      }
    };

  public delete: (
    baseUrl: string,
    path: string,
    headers: Record<string, string>,
  ) => Promise<object> = async (baseUrl, path, headers) => {
    try {
      const fullUrl = `${baseUrl}${path}`;
      let result = await OkHttpModule.delete(fullUrl, headers);
      return result;
    } catch (e) {
      throw e;
    }
  };

  public post: (
    baseUrl: string,
    path: string,
    body: object,
    headers: Record<string, string>,
  ) => Promise<object> = async (baseUrl, path, body, headers) => {
    try {
      const fullUrl = `${baseUrl}${path}`;
      const bodyAsString = JSON.stringify(body);
      let result = await OkHttpModule.post(fullUrl, headers, bodyAsString);
      return result;
    } catch (e) {
      throw e;
    }
  };

  public request: (baseUrl: string, path: string) => Promise<object> = async (
    baseUrl: string,
    path,
  ) => {
    return this.get(baseUrl, path, {});
  };
}

export default TorClient;
