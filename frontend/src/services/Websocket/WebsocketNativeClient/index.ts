import { WebsocketClient, WebsocketConnection } from '..';
import { systemClient } from '../../System';
import WebsocketConnectionNative from '../WebsocketConnectionNative';

class WebsocketNativeClient implements WebsocketClient {
  private readonly getHeaders: () => HeadersInit = () => {
    let headers = {
      "Sec-Fetch-Dest": "websocket",
      "Sec-Fetch-Mode": "websocket",
      "Sec-Fetch-Site": "same-origin",
      "Sec-WebSocket-Extensions": "permessage-deflate",
      "Sec-WebSocket-Key": "Tvi3UUF3R+zDhcOK6j87jg==",
      "Sec-WebSocket-Version": "13",
      "Upgrade": "websocket",
      "Connection": "keep-alive, Upgrade",
      "Origin": "http://robotestagw3dcxmd66r4rgksb4nmmr43fh77bzn2ia2eucduyeafnyd.onion"
    };

    const sessionid = systemClient.getCookie('sessionid');
    if (sessionid) {
      const robotToken = systemClient.getCookie('robot_token');
      const csrftoken = systemClient.getCookie('csrftoken');
      const pubKey = systemClient.getCookie('pub_key');

      headers = {
        ...headers,
        ...{
          Cookie: `sessionid=${sessionid};robot_token=${robotToken};csrftoken=${csrftoken};pub_key=${pubKey}`,
        },
      };
    }

    return headers;
  };
  
  public open: (path: string) => Promise<WebsocketConnection> = (path) => {
    return new Promise<WebsocketConnection>((resolve, reject) => {
      try {
        window.NativeRobosats?.postMessage({
          category: 'socket',
          type: 'open',
          headers: this.getHeaders(),
          path
        }).then(({connected}) => {
          if (connected) {
            const connection = new WebsocketConnectionNative(path);
            window.NativeRobosats?.loadSocket(path, connection)
            resolve(connection);
          } else {
            reject();
          }
        });
      } catch {
        reject();
      }
    });
  };
}

export default WebsocketNativeClient;
