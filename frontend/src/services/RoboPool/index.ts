import { nip59, type Event } from 'nostr-tools';
import { Garage, type Coordinator, type Settings } from '../../models';
import defaultFederation from '../../../static/federation.json';
import { websocketClient, type WebsocketConnection, WebsocketState } from '../Websocket';
import thirdParties from '../../../static/thirdparties.json';
import { parseAccountRecoveryEvent } from '../../utils/accountRecovery';

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
    const federationRelays = coordinators.map((coord) => coord.getRelayUrl());
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

    const subscribeBook = 'subscribeBook';

    const requestBook = [
      'REQ',
      subscribeBook,
      {
        authors,
        kinds: [38383],
        since: Math.floor(new Date().getTime() / 1000) - 108000,
      },
    ];

    this.messageHandlers.push((_url: string, messageEvent: MessageEvent) => {
      const jsonMessage = JSON.parse(messageEvent.data);

      if (subscribeBook !== jsonMessage[1]) return;

      if (jsonMessage[0] === 'EVENT') {
        const event: Event = jsonMessage[2];
        const network = event.tags.find((e) => e[0] === 'network');
        if (network?.[1] === this.network) events.onevent(jsonMessage[2]);
      } else if (jsonMessage[0] === 'EOSE') {
        events.oneose();
      }
    });

    this.sendMessage(JSON.stringify(requestBook));
  };

  subscribeRatings = (events: RoboPoolEvents, pubkeys?: string[], id?: string): string => {
    const pubkeysFilter =
      pubkeys ??
      Object.values(defaultFederation)
        .map((f) => f.nostrHexPubkey)
        .filter((item) => item !== undefined);

    const subscriptionId = `subscribeRatings${id ?? ''}`;
    const sixMonthsAgo = Math.floor(new Date().getTime() / 1000) - 6 * 30 * 24 * 60 * 60;
    const requestRatings = [
      'REQ',
      subscriptionId,
      { kinds: [31986], '#p': pubkeysFilter, since: sixMonthsAgo },
    ];

    this.messageHandlers.push((_url: string, messageEvent: MessageEvent) => {
      const jsonMessage = JSON.parse(messageEvent.data);

      if (subscriptionId !== jsonMessage[1]) return;

      if (jsonMessage[0] === 'EVENT') {
        events.onevent(jsonMessage[2]);
      } else if (jsonMessage[0] === 'EOSE') {
        events.oneose();
      }
    });
    this.sendMessage(JSON.stringify(requestRatings));

    return subscriptionId;
  };

  closeSubscription = (subscriptionId: string): void => {
    this.sendMessage(JSON.stringify(['CLOSE', subscriptionId]));
  };

  subscribeNotifications = (garage: Garage, events: RoboPoolEvents): void => {
    const hexPubKeys = Object.values(garage.slots).map((s) => s.nostrPubKey);

    if (hexPubKeys.length === 0) return;

    const subscribeNotification = 'subscribeNotification';

    const requestNotifications = [
      'REQ',
      subscribeNotification,
      { kinds: [1059], '#p': hexPubKeys },
    ];

    this.messageHandlers.push((_url: string, messageEvent: MessageEvent) => {
      const jsonMessage = JSON.parse(messageEvent.data);

      if (subscribeNotification !== jsonMessage[1]) return;

      if (jsonMessage[0] === 'EVENT') {
        const event: Event = jsonMessage[2];
        events.onevent(event);
      } else if (jsonMessage[0] === 'EOSE') {
        events.oneose();
      }
    });

    this.sendMessage(JSON.stringify(requestNotifications));
  };

  sendEvent = (event: Event): void => {
    const message = ['EVENT', event];

    this.sendMessage(JSON.stringify(message));
  };

  subscribeAccountRecovery = (
    nostrPubKey: string,
    nostrSecKey: Uint8Array,
    onAccountFound: (accountIndex: number, createdAt: number) => void,
    onComplete: () => void,
  ): void => {
    const subscriptionId = `accountRecovery_${Math.random().toString(36).substring(7)}`;

    const request = [
      'REQ',
      subscriptionId,
      {
        kinds: [1059],
        '#p': [nostrPubKey],
      },
    ];

    this.messageHandlers.push((_url: string, messageEvent: MessageEvent) => {
      try {
        const jsonMessage = JSON.parse(messageEvent.data);

        if (jsonMessage[1] !== subscriptionId) return;

        if (jsonMessage[0] === 'EVENT') {
          const wrappedEvent: Event = jsonMessage[2];

          try {
            const unwrappedEvent = nip59.unwrapEvent(wrappedEvent, nostrSecKey);

            const recoveryData = parseAccountRecoveryEvent(unwrappedEvent as Event);

            if (recoveryData) {
              onAccountFound(recoveryData.accountIndex, unwrappedEvent.created_at);
            }
          } catch {
            // Ignore events we can't unwrap (might be for other purposes)
          }
        } else if (jsonMessage[0] === 'EOSE') {
          this.sendMessage(JSON.stringify(['CLOSE', subscriptionId]));
          onComplete();
        }
      } catch {
        // Ignore parse errors
      }
    });

    this.sendMessage(JSON.stringify(request));
  };
}

export default RoboPool;
