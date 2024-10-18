import { Event } from 'nostr-tools';
import { Settings } from '../../models';
import defaultFederation from '../../../static/federation.json';
import { Origins } from '../../models/Coordinator.model';

interface RoboPoolEvents {
  onevent: (event: Event) => void;
  oneose: () => void;
}

class RoboPool {
  constructor(settings: Settings, origin: string) {
    this.network = settings.network ?? 'mainnet';
    this.relays = Object.values(defaultFederation)
      .map((coord) => {
        const url = coord[this.network][settings.selfhostedClient ? 'onion' : origin];

        if (!url) return;

        return `ws://${url.replace(/^https?:\/\//, '')}/nostr`;
      })
      .filter((item) => item !== undefined);
  }

  public relays: string[];
  public network: string;

  public webSockets: WebSocket[] = [];
  private messageHandlers: Array<(url: string, event: MessageEvent) => void> = [];

  connect = () => {
    this.relays.forEach((url) => {
      if (this.webSockets.find((w: WebSocket) => w.url === url)) return;

      let ws: WebSocket;

      const connect = () => {
        ws = new WebSocket(url);

        // Add event listeners for the WebSocket
        ws.onopen = () => {
          console.log(`Connected to ${url}`);
        };

        ws.onmessage = (event) => {
          this.messageHandlers.forEach((handler) => handler(url, event));
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

  close = () => {
    this.webSockets.forEach((ws) => ws.close());
  };

  sendMessage = (message: string) => {
    const send = (index: number, message: string) => {
      const ws = this.webSockets[index];

      if (ws.readyState === WebSocket.OPEN) {
        ws.send(message);
      } else if (ws.readyState === WebSocket.CONNECTING) {
        setTimeout(send, 500, index, message);
      }
    };

    this.webSockets.forEach((_ws, index) => send(index, message));
  };

  subscribeBook = (events: RoboPoolEvents) => {
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
