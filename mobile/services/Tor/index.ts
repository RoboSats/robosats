import Tor from 'react-native-tor';

interface TcpStream {
  close(): Promise<boolean>;
  write(msg: string): Promise<boolean>;
}

class TorClient {
  baseUrl: string;
  daemon: ReturnType<typeof Tor>;

  constructor() {
    this.baseUrl = 'robotestagw3dcxmd66r4rgksb4nmmr43fh77bzn2ia2eucduyeafnyd.onion';
    this.daemon = Tor({
      stopDaemonOnBackground: false,
      numberConcurrentRequests: 0,
    });
  }

  private sockets: {[path: string]: TcpStream } = {}

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

  public openSocket: (path: string, headers: object, onMessage: (message: string) => void, onError: () => void) => Promise<void> = async (path, headers, onMessage, onError) => {
    return new Promise<void>(async (resolve, reject) =>{
      try {
        console.log('HANDSHAKE REQUEST ======>', `ws://${this.baseUrl}/ws/chat/584`, headers)
        const response = await this.daemon
          .request(`ws://${this.baseUrl}/ws/chat/584`, 'GET', '', headers, true)
          .then((resp) => {
            console.log('HANDSHAKE RESPONSE =======>', resp)
          });
        resolve(response);
        // this.daemon.createTcpConnection({ target: `${this.baseUrl}${path}:80` }, (data, error) => {
        //   if(error){
        //     console.error('error sending msg', error);
        //     onError();
        //   }
        //   console.log('recieved tcp msg', data);
        //   onMessage(JSON.parse(data || '{}'));
        // })
        // .then((connection) => {
        //   this.sockets[path] = connection 
        //   resolve()
        // })
        // .catch(() => reject())
      } catch (error) {
        console.log('CATCH ERROR ===========', error)
        reject()
      }
      
    })
  }

  public sendSocket: (path: string, message: object) => void = async (path, message) => {
    this.sockets[path].write(JSON.stringify(message))
  }

  public get: (path: string, headers: object) => Promise<object> = async (path, headers) => {
    return await new Promise<object>(async (resolve, reject) => {
      try {
        const response = await this.daemon.get(`http://${this.baseUrl}${path}`, headers);

        resolve(response);
      } catch (error) {
        reject(error);
      }
    });
  };

  public delete: (path: string, headers: object) => Promise<object> = async (path, headers) => {
    return await new Promise<object>(async (resolve, reject) => {
      try {
        const response = await this.daemon.delete(`http://${this.baseUrl}${path}`, '', headers);

        resolve(response);
      } catch (error) {
        reject(error);
      }
    });
  };

  public request: (path: string) => Promise<object> = async (path) => {
    return await new Promise<object>(async (resolve, reject) => {
      try {
        const response = await this.daemon
          .request(`http://${this.baseUrl}${path}`, 'GET', '', {}, true)
          .then((resp) => {
            resolve(resp);
          });

        resolve(response);
      } catch (error) {
        reject(error);
      }
    });
  };

  public post: (path: string, body: object, headers: object) => Promise<object> = async (
    path,
    body,
    headers,
  ) => {
    return await new Promise<object>(async (resolve, reject) => {
      try {
        const json = JSON.stringify(body);
        const response = await this.daemon.post(`http://${this.baseUrl}${path}`, json, headers);

        resolve(response);
      } catch (error) {
        reject(error);
      }
    });
  };
}

export default TorClient;
