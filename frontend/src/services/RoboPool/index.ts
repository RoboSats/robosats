import { type Event } from 'nostr-tools';
import { type Settings } from '../../models';
import defaultFederation from '../../../static/federation.json';

interface RoboPoolEvents {
  onevent: (event: Event) => void;
  oneose: () => void;
}

class RoboPool {
  constructor(settings: Settings, origin: string) {
    this.network = settings.network ?? 'mainnet';

    this.relays = [];
    const federationRelays = Object.values(defaultFederation)
      .map((coord) => {
        const url: string = coord[this.network][settings.selfhostedClient ? 'onion' : origin];

        if (!url) return undefined;

        return `ws://${url.replace(/^https?:\/\//, '')}/nostr`;
      })
      .filter((item) => item !== undefined);
    if (settings.host) {
      const hostNostr = `ws://${settings.host.replace(/^https?:\/\//, '')}/nostr`;
      if (federationRelays.includes(hostNostr)) {
        this.relays.push(hostNostr);
      }
    }
    while (this.relays.length < 3) {
      const randomRelay =
        federationRelays[Math.floor(Math.random() * Object.keys(federationRelays).length)];
      if (!this.relays.includes(randomRelay)) {
        this.relays.push(randomRelay);
      }
    }
  }

  public relays: string[];
  public network: string;

  public webSockets: WebSocket[] = [];
  private readonly messageHandlers: Array<(url: string, event: MessageEvent) => void> = [];

  connect = (): void => {
    this.relays.forEach((url) => {
      if (this.webSockets.find((w: WebSocket) => w.url === url)) return;

      let ws: WebSocket;

      const connect = (): void => {
        ws = new WebSocket(url);

        // Add event listeners for the WebSocket
        ws.onopen = () => {
          console.log(`Connected to ${url}`);
        };

        ws.onmessage = (event) => {
          this.messageHandlers.forEach((handler) => {
            handler(url, event);
          });
        };

        ws.onerror = (error) => {
          console.error(`WebSocket error on ${url}:`, error);
        };

        ws.onclose = () => {
          console.log(`Disconnected from ${url}. Attempting to reconnect...`);
          setTimeout(connect, 1000); // Reconnect after 1 second
        };
      };

      connect();
      this.webSockets.push(ws);
    });
  };

  close = (): void => {
    this.webSockets.forEach((ws) => {
      ws.close();
    });
  };

  sendMessage = (message: string): void => {
    const send = (index: number, message: string): void => {
      const ws = this.webSockets[index];

      if (ws.readyState === WebSocket.OPEN) {
        ws.send(message);
      } else if (ws.readyState === WebSocket.CONNECTING) {
        setTimeout(send, 500, index, message);
      }
    };

    this.webSockets.forEach((_ws, index) => {
      send(index, message);
    });
  };

  subscribeBook = (events: RoboPoolEvents): void => {
    const authors = Object.values(defaultFederation)
      .map((f) => f.nostrHexPubkey)
      .filter((item) => item !== undefined);

    const request = ['REQ', 'subscribeBook', { authors, kinds: [38383], '#n': [this.network] }];

    this.messageHandlers.push((_url: string, messageEvent: MessageEvent) => {
      const jsonMessage = JSON.parse(messageEvent.data);
      if (jsonMessage[0] === 'EVENT') {
        events.onevent(jsonMessage[2]);
      } else if (jsonMessage[0] === 'EOSE') {
        events.oneose();
      }
    });
    this.sendMessage(JSON.stringify(request));
  };
}

export default RoboPool;
