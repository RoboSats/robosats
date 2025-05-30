import { type Event } from 'nostr-tools';
import { type Coordinator, type Settings } from '../../models';
import defaultFederation from '../../../static/federation.json';
import { websocketClient, type WebsocketConnection, WebsocketState } from '../Websocket';
import thirdParties from '../../../static/thirdparties.json';

interface RoboPoolEvents {
  onevent: (event: Event) => void;
  oneose: () => void;
}

class RoboPool {
  constructor(settings: Settings) {
    this.network = settings.network ?? 'mainnet';

    this.relays = [];
  }

  public relays: string[];
  public network: string;

  public webSockets: Record<string, WebsocketConnection | null> = {};
  private readonly messageHandlers: Array<(url: string, event: MessageEvent) => void> = [];

  updateRelays = (hostUrl: string, coordinators: Coordinator[]) => {
    this.close();
    this.relays = [];
    const federationRelays = coordinators.map((coord) => coord.getRelayUrl(hostUrl));
    const hostRelay = federationRelays.find((relay) => relay.includes(hostUrl));
    if (hostRelay) this.relays.push(hostRelay);

    while (this.relays.length < 3) {
      const randomRelay =
        federationRelays[Math.floor(Math.random() * Object.keys(federationRelays).length)];
      if (!this.relays.includes(randomRelay)) {
        this.relays.push(randomRelay);
      }
    }
    this.connect();
  };

  connect = (relays: string[] = this.relays): void => {
    relays.forEach((url: string) => {
      if (Object.keys(this.webSockets).find((wUrl) => wUrl === url)) return;

      this.webSockets[url] = null;

      const connectRelay = (): void => {
        void websocketClient.open(url).then((connection) => {
          console.log(`Connected to ${url}`);

          connection.onMessage((event) => {
            this.messageHandlers.forEach((handler) => {
              handler(url, event);
            });
          });

          connection.onError((error) => {
            console.error(`WebSocket error on ${url}:`, error);
          });

          connection.onClose(() => {
            console.log(`Disconnected from ${url}`);
          });

          this.webSockets[url] = connection;
        });
      };
      connectRelay();
    });
  };

  close = (): void => {
    Object.values(this.webSockets).forEach((ws) => {
      ws?.close();
    });
    this.webSockets = {};
  };

  sendMessage = (message: string): void => {
    const send = (url: string, message: string): void => {
      const ws = this.webSockets[url];

      if (!ws || ws.getReadyState() === WebsocketState.CONNECTING) {
        setTimeout(send, 500, url, message);
      } else if (ws.getReadyState() === WebsocketState.OPEN) {
        ws.send(message);
      }
    };

    Object.keys(this.webSockets).forEach((url) => {
      send(url, message);
    });
  };

  subscribeBook = (robosatsOnly: boolean, events: RoboPoolEvents): void => {
    let scope = Object.values(defaultFederation);
    if (!robosatsOnly) {
      scope = [...scope, ...Object.values(thirdParties)];
    }
    const authors = scope.map((f) => f.nostrHexPubkey).filter((item) => item !== undefined);

    const requestPending = [
      'REQ',
      'subscribeBookPending',
      { authors, kinds: [38383], '#s': ['pending'] },
    ];
    const requestSuccess = [
      'REQ',
      'subscribeBookSuccess',
      {
        authors,
        kinds: [38383],
        '#s': ['success', 'canceled', 'in-progress'],
        since: Math.floor(new Date().getTime() / 1000),
      },
    ];

    this.messageHandlers.push((_url: string, messageEvent: MessageEvent) => {
      const jsonMessage = JSON.parse(messageEvent.data);
      if (jsonMessage[0] === 'EVENT') {
        const event: Event = jsonMessage[2];
        const network = event.tags.find((e) => e[0] === 'network');
        if (network?.[1] === this.network) events.onevent(jsonMessage[2]);
      } else if (jsonMessage[0] === 'EOSE') {
        events.oneose();
      }
    });
    this.sendMessage(JSON.stringify(requestPending));
    this.sendMessage(JSON.stringify(requestSuccess));
  };

  subscribeRatings = (events: RoboPoolEvents, pubkeys?: string[], id?: string): void => {
    const defaultPubkeys = Object.values(defaultFederation)
      .map((f) => f.nostrHexPubkey)
      .filter((item) => item !== undefined);

    const requestRatings = [
      'REQ',
      `subscribeRatings${id ?? ''}`,
      { kinds: [31986], '#p': pubkeys ?? defaultPubkeys, since: 1746316800 },
    ];

    this.messageHandlers.push((_url: string, messageEvent: MessageEvent) => {
      const jsonMessage = JSON.parse(messageEvent.data);
      if (jsonMessage[0] === 'EVENT') {
        events.onevent(jsonMessage[2]);
      } else if (jsonMessage[0] === 'EOSE') {
        events.oneose();
      }
    });
    this.sendMessage(JSON.stringify(requestRatings));
  };

  subscribeChat = (hexPubKeys: string[], since: number, events: RoboPoolEvents): void => {
    const requestRatings = ['REQ', 'subscribeChat', { kinds: [1059], '#p': hexPubKeys, since }];

    this.messageHandlers.push((_url: string, messageEvent: MessageEvent) => {
      const jsonMessage = JSON.parse(messageEvent.data);
      if (jsonMessage[0] === 'EVENT') {
        events.onevent(jsonMessage[2]);
      } else if (jsonMessage[0] === 'EOSE') {
        events.oneose();
      }
    });
    this.sendMessage(JSON.stringify(requestRatings));
  };

  sendEvent = (event: Event): void => {
    const message = ['EVENT', event];

    this.sendMessage(JSON.stringify(message));
  };
}

export default RoboPool;
