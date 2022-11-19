import Tor from 'react-native-tor';

class TorClient {
  daemon: ReturnType<typeof Tor>;

  constructor() {
    this.daemon = Tor({
      stopDaemonOnBackground: false,
      numberConcurrentRequests: 0,
    });
  }

  private readonly connectDaemon: () => void = async () => {
    try {
      this.daemon.startIfNotStarted();
    } catch {
      console.log('TOR already started');
    }
  };

  public reset: () => void = async () => {
    console.log('Reset TOR');
    await this.daemon.stopIfRunning();
    await this.daemon.startIfNotStarted();
  };

  public get: (baseUrl: string, path: string, headers: object) => Promise<object> = async (
    baseUrl,
    path,
    headers,
  ) => {
    return await new Promise<object>(async (resolve, reject) => {
      try {
        const response = await this.daemon.get(`${baseUrl}${path}`, headers);

        resolve(response);
      } catch (error) {
        reject(error);
      }
    });
  };

  public delete: (baseUrl: string, path: string, headers: object) => Promise<object> = async (
    baseUrl,
    path,
    headers,
  ) => {
    return await new Promise<object>(async (resolve, reject) => {
      try {
        const response = await this.daemon.delete(`${baseUrl}${path}`, '', headers);

        resolve(response);
      } catch (error) {
        reject(error);
      }
    });
  };

  public request: (baseUrl: string, path: string) => Promise<object> = async (
    baseUrl: string,
    path,
  ) => {
    return await new Promise<object>(async (resolve, reject) => {
      try {
        const response = await this.daemon
          .request(`${baseUrl}${path}`, 'GET', '', {}, true)
          .then((resp) => {
            resolve(resp);
          });

        resolve(response);
      } catch (error) {
        reject(error);
      }
    });
  };

  public post: (baseUrl: string, path: string, body: object, headers: object) => Promise<object> =
    async (baseUrl, path, body, headers) => {
      return await new Promise<object>(async (resolve, reject) => {
        try {
          const json = JSON.stringify(body);
          const response = await this.daemon.post(`${baseUrl}${path}`, json, headers);

          resolve(response);
        } catch (error) {
          reject(error);
        }
      });
    };
}

export default TorClient;
