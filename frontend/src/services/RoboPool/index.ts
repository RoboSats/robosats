import { nip59, type Event } from 'nostr-tools';
import { Garage, type Coordinator, type Settings } from '../../models';
import defaultFederation from '../../../static/federation.json';
import { websocketClient, type WebsocketConnection, WebsocketState } from '../Websocket';
import thirdParties from '../../../static/thirdparties.json';
import { parseAccountRecoveryEvent } from '../../utils/accountRecovery';

// Live coordinator pubkeys injected by Federation.model via setFederationPubkeys().
// Starts from the bundled seed; updated after every successful federation vote.
let liveFederationPubkeys: string[] = Object.values(defaultFederation)
  .map((c) => c.nostrHexPubkey)
  .filter(Boolean);

export function setFederationPubkeys(pubkeys: string[]): void {
  if (pubkeys.length > 0) liveFederationPubkeys = pubkeys;
}

interface RoboPoolEvents {
  onevent: (event: Event) => void;
  oneose: () => void;
}

interface NotificationSubscriptionOptions {
  backfillSeconds?: number;
  now?: number;
  eoseTimeoutMs?: number;
}

interface UpdateNotificationSubscriptionsParams {
  pubkeys: string[];
  events: RoboPoolEvents;
  options?: NotificationSubscriptionOptions;
}

interface NotificationSubscriptionState {
  subId: string;
  handler: (url: string, event: MessageEvent) => void;
}

const DEFAULT_NOTIFICATION_BACKFILL_SECONDS = 48 * 60 * 60;
const DEFAULT_NOTIFICATION_EOSE_TIMEOUT_MS = 5000;

class RoboPool {
  constructor(settings: Settings) {
    this.network = settings.network ?? 'mainnet';

    this.relays = [];
  }

  public relays: string[];
  public network: string;

  public webSockets: Record<string, WebsocketConnection | null> = {};
  private readonly messageHandlers: Array<(url: string, event: MessageEvent) => void> = [];
  private readonly notificationSubscriptions: Map<string, NotificationSubscriptionState> =
    new Map();

  updateRelays = (hostUrl: string, coordinators: Coordinator[]) => {
    this.close();
    this.relays = [];
    // Coordinators without an address for the current network/origin produce an
    // empty relay URL — they must never enter the pool.
    const federationRelays = coordinators.map((coord) => coord.getRelayUrl()).filter(Boolean);
    const hostRelay = federationRelays.find((relay) => relay.includes(hostUrl));
    if (hostRelay) this.relays.push(hostRelay);

    while (this.relays.length < Math.min(3, federationRelays.length)) {
      const randomRelay = federationRelays[Math.floor(Math.random() * federationRelays.length)];
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
              handler(url, event as unknown as MessageEvent<unknown>);
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

  private removeMessageHandler = (handler: (url: string, event: MessageEvent) => void): void => {
    const handlerIndex = this.messageHandlers.indexOf(handler);
    if (handlerIndex >= 0) {
      this.messageHandlers.splice(handlerIndex, 1);
    }
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
    // Use the live coordinator list (updated after each federation vote).
    // Fall back to the bundled seed via liveFederationPubkeys initializer.
    let authors: string[] = [...liveFederationPubkeys];
    if (!robosatsOnly) {
      const thirdPartyPubkeys = (Object.values(thirdParties) as Array<{ nostrHexPubkey?: string }>)
        .map((f) => f.nostrHexPubkey)
        .filter((item): item is string => item !== undefined);
      authors = [...authors, ...thirdPartyPubkeys];
    }

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
    // Use the live coordinator list; caller can still pass explicit pubkeys to override.
    const pubkeysFilter = pubkeys ?? [...liveFederationPubkeys];

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

  clearNotificationSubscriptions = (): void => {
    this.notificationSubscriptions.forEach(({ subId, handler }) => {
      this.sendMessage(JSON.stringify(['CLOSE', subId]));
      this.removeMessageHandler(handler);
    });

    this.notificationSubscriptions.clear();
  };

  updateNotificationSubscriptions = ({
    pubkeys,
    events,
    options,
  }: UpdateNotificationSubscriptionsParams): void => {
    const targetPubkeys = Array.from(
      new Set(
        pubkeys.filter((pubkey): pubkey is string => typeof pubkey === 'string' && pubkey !== ''),
      ),
    ).sort();
    const targetSet = new Set(targetPubkeys);

    Array.from(this.notificationSubscriptions.entries()).forEach(([pubkey, subscription]) => {
      if (!targetSet.has(pubkey)) {
        this.sendMessage(JSON.stringify(['CLOSE', subscription.subId]));
        this.removeMessageHandler(subscription.handler);
        this.notificationSubscriptions.delete(pubkey);
      }
    });

    const toAdd = targetPubkeys.filter((pubkey) => !this.notificationSubscriptions.has(pubkey));

    if (toAdd.length === 0) {
      events.oneose();
      return;
    }

    const now = options?.now ?? Math.floor(new Date().getTime() / 1000);
    const backfillSeconds = options?.backfillSeconds ?? DEFAULT_NOTIFICATION_BACKFILL_SECONDS;
    const eoseTimeoutMs = options?.eoseTimeoutMs ?? DEFAULT_NOTIFICATION_EOSE_TIMEOUT_MS;
    const since = Math.max(0, now - Math.max(0, backfillSeconds));

    const expectedRelayCount = Object.keys(this.webSockets).length;
    const pendingSubIds = new Set<string>();
    const eoseBySubscription = new Map<string, Set<string>>();
    let eoseTimeout: ReturnType<typeof setTimeout> | null = null;
    let completed = false;

    const complete = (): void => {
      if (completed) return;
      completed = true;

      if (eoseTimeout) {
        clearTimeout(eoseTimeout);
        eoseTimeout = null;
      }

      events.oneose();
    };

    if (expectedRelayCount === 0) {
      complete();
    } else {
      eoseTimeout = setTimeout(() => {
        complete();
      }, eoseTimeoutMs);
    }

    toAdd.forEach((pubkey) => {
      const subId = `subscribeNotification_${pubkey}_${Math.random().toString(36).substring(2, 9)}`;
      pendingSubIds.add(subId);
      eoseBySubscription.set(subId, new Set<string>());

      const requestNotifications = ['REQ', subId, { kinds: [1059], '#p': [pubkey], since }];

      const handler = (url: string, messageEvent: MessageEvent): void => {
        try {
          const jsonMessage = JSON.parse(messageEvent.data);

          if (subId !== jsonMessage[1]) return;

          if (jsonMessage[0] === 'EVENT') {
            const event: Event = jsonMessage[2];
            events.onevent(event);
          } else if (jsonMessage[0] === 'EOSE' && expectedRelayCount > 0) {
            const relays = eoseBySubscription.get(subId);
            if (!relays) return;

            relays.add(url);

            if (relays.size >= expectedRelayCount) {
              pendingSubIds.delete(subId);

              if (pendingSubIds.size === 0) {
                complete();
              }
            }
          }
        } catch {
          // Ignore parse errors
        }
      };

      this.messageHandlers.push(handler);
      this.notificationSubscriptions.set(pubkey, { subId, handler });
      this.sendMessage(JSON.stringify(requestNotifications));
    });
  };

  subscribeNotifications = (garage: Garage, events: RoboPoolEvents): void => {
    const hexPubKeys = Object.values(garage.slots)
      .map((s) => s.nostrPubKey)
      .filter((pubkey): pubkey is string => Boolean(pubkey));

    this.updateNotificationSubscriptions({ pubkeys: hexPubKeys, events });
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
    const eoseRelays = new Set<string>();
    const expectedRelayCount = Object.keys(this.webSockets).length;
    const completeTimeoutMs = 5000;
    let completeTimeout: ReturnType<typeof setTimeout> | null = null;
    let isComplete = false;

    const completeRecovery = (): void => {
      if (isComplete) return;

      isComplete = true;

      if (completeTimeout) {
        clearTimeout(completeTimeout);
        completeTimeout = null;
      }

      this.sendMessage(JSON.stringify(['CLOSE', subscriptionId]));
      this.removeMessageHandler(handler);
      onComplete();
    };

    if (expectedRelayCount === 0) {
      onComplete();
      return;
    }

    const request = [
      'REQ',
      subscriptionId,
      {
        kinds: [1059],
        '#p': [nostrPubKey],
      },
    ];

    const handler = (_url: string, messageEvent: MessageEvent) => {
      if (isComplete) return;

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
          eoseRelays.add(_url);

          if (eoseRelays.size >= expectedRelayCount) {
            completeRecovery();
            return;
          }

          if (!completeTimeout) {
            completeTimeout = setTimeout(() => {
              completeRecovery();
            }, completeTimeoutMs);
          }
        }
      } catch {
        // Ignore parse errors
      }
    };

    this.messageHandlers.push(handler);
    this.sendMessage(JSON.stringify(request));
  };
}

export default RoboPool;
