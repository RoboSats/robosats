import Tor from 'react-native-tor';

class TorClient {
  baseUrl: string;
  daemon: ReturnType<typeof Tor>;

  constructor() {
    this.baseUrl =
      'http://robosats6tkf3eva7x2voqso3a5wcorsnw34jveyxfqi2fu7oyheasid.onion';
    this.daemon = Tor({
      stopDaemonOnBackground: false,
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

  public delete: (path: string, headers: object) => Promise<object> = async (
    path,
    headers,
  ) => {
    await this.startDaemon();

    return new Promise<object>(async (resolve, reject) => {
      try {
        const response = await this.daemon.delete(
          `${this.baseUrl}${path}`,
          '',
          headers,
        );

        resolve(response.json);
      } catch (error) {
        reject(error);
      }
    });
  };

  public request: (path: string) => Promise<object> = async path => {
    await this.startDaemon();

    return new Promise<object>(async (resolve, reject) => {
      try {
        const response = await this.daemon
          .request(`${this.baseUrl}${path}`, 'GET', '', {}, true)
          .then(resp => {
            resolve(resp);
          });

        resolve(response);
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
