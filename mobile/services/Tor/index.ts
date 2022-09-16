import Tor from 'react-native-tor';

class TorClient {
  baseUrl: string;
  daemon: ReturnType<typeof Tor>;

  constructor() {
    this.baseUrl =
      'http://robosats6tkf3eva7x2voqso3a5wcorsnw34jveyxfqi2fu7oyheasid.onion';
    this.daemon = Tor({
      stopDaemonOnBackground: false,
      startDaemonOnActive: true,
    });
  }

  public startDaemon = async () => {
    await this.daemon.startIfNotStarted();
  };

  public get: (path: string) => Promise<object> = async path => {
    await this.startDaemon();

    return new Promise<object>(async (resolve, reject) => {
      try {
        const response = await this.daemon.get(`${this.baseUrl}${path}`);

        resolve(response.json);
      } catch (error) {
        reject(error);
      }
    });
  };

  public post: (
    path: string,
    body: object,
    headers: object,
  ) => Promise<object> = async (path, body, headers) => {
    await this.startDaemon();

    return new Promise<object>(async (resolve, reject) => {
      try {
        const json = JSON.stringify(body);
        const response = await this.daemon.post(
          `${this.baseUrl}${path}`,
          json,
          headers,
        );

        resolve(response.json);
      } catch (error) {
        reject(error);
      }
    });
  };
}

export const torClient = new TorClient();

export default TorClient;
