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
  request: unknown[];
  handler: (url: string, event: MessageEvent) => void;
}

interface BookSubscriptionState {
  robosatsOnly: boolean;
  events: RoboPoolEvents;
  handler: (url: string, event: MessageEvent) => void;
}

interface RelayHealth {
  epoch: number;
  connectingSince?: number;
  downSince?: number;
  lastActivityAt?: number;
  probingSince?: number;
  probeId?: string;
}

const DEFAULT_NOTIFICATION_BACKFILL_SECONDS = 48 * 60 * 60;
const DEFAULT_NOTIFICATION_EOSE_TIMEOUT_MS = 5000;
const BOOK_BACKFILL_SECONDS = 108000;
const WATCHDOG_INTERVAL_MS = 60000;
const WATCHDOG_CONNECTING_TIMEOUT_MS = 300000;
const LIVENESS_PROBE_AFTER_MS = 600000;
const LIVENESS_PROBE_TIMEOUT_MS = 20000;
const FAILOVER_AFTER_MS = 600000;
const SEND_RETRY_MS = 500;

type MessageHandler = (url: string, event: MessageEvent) => void;

class RoboPool {
  constructor(settings: Settings) {
    this.network = settings.network ?? 'mainnet';

    this.relays = [];
  }

  public relays: string[];
  public network: string;

  public webSockets: Record<string, WebsocketConnection | null> = {};
  public onConnectionStateChange?: () => void;
  private readonly messageHandlers: MessageHandler[] = [];
  private readonly notificationSubscriptions: Map<string, NotificationSubscriptionState> =
    new Map();
  private notificationSubscriptionId = 0;
  private notificationSubscriptionParams?: UpdateNotificationSubscriptionsParams;
  private readonly notificationTimeouts = new Set<ReturnType<typeof setTimeout>>();
  private readonly accountRecoverySubscriptions = new Map<
    string,
    { resubscribe: () => void; complete: () => void }
  >();
  private bookSubscription?: BookSubscriptionState;
  private watchdog?: ReturnType<typeof setInterval>;
  private livenessId = 0;
  private spareQueue: string[] = [];
  private hostRelay?: string;
  private everConnected = false;
  private readonly relayHealth = new Map<string, RelayHealth>();

  private health = (url: string): RelayHealth => {
    let h = this.relayHealth.get(url);
    if (!h) {
      h = { epoch: 0 };
      this.relayHealth.set(url, h);
    }
    return h;
  };

  private clearConnectionState = (url: string): void => {
    const h = this.relayHealth.get(url);
    if (!h) return;
    h.connectingSince = undefined;
    h.lastActivityAt = undefined;
    h.probingSince = undefined;
    h.probeId = undefined;
  };

  updateRelays = (hostUrl: string, coordinators: Coordinator[]) => {
    const notifications = this.notificationSubscriptionParams;
    this.clearNotificationSubscriptions();
    this.disconnect();
    this.relays = [];
    // Coordinators without an address for the current network/origin produce an
    // empty relay URL — they must never enter the pool.
    const federationRelays = coordinators.map((coord) => coord.getRelayUrl()).filter(Boolean);
    this.hostRelay = federationRelays.find((relay) => relay.includes(hostUrl));
    if (this.hostRelay) this.relays.push(this.hostRelay);

    while (this.relays.length < Math.min(3, federationRelays.length)) {
      const randomRelay = federationRelays[Math.floor(Math.random() * federationRelays.length)];
      if (!this.relays.includes(randomRelay)) {
        this.relays.push(randomRelay);
      }
    }
    this.spareQueue = federationRelays.filter((relay) => !this.relays.includes(relay));
    this.connect();
    if (notifications) this.updateNotificationSubscriptions(notifications);
    this.accountRecoverySubscriptions.forEach(({ resubscribe }) => resubscribe());
  };

  connect = (relays: string[] = this.relays): void => {
    const sockets = this.webSockets;
    relays.forEach((url: string) => {
      if (Object.keys(this.webSockets).find((wUrl) => wUrl === url)) return;

      this.webSockets[url] = null;
      this.connectRelay(url, sockets);
    });
    this.startWatchdog();
  };

  close = (): void => {
    this.clearNotificationSubscriptions();
    this.accountRecoverySubscriptions.forEach(({ complete }) => complete());
    this.stopWatchdog();
    this.disconnect();
  };

  getConnectionStates = (): Record<string, number> => {
    const states: Record<string, number> = {};
    Object.entries(this.webSockets).forEach(([url, ws]) => {
      states[url] = ws ? ws.getReadyState() : WebsocketState.CONNECTING;
    });
    return states;
  };

  hasEverConnected = (): boolean => this.everConnected;

  private connectRelay = (
    url: string,
    sockets: Record<string, WebsocketConnection | null> = this.webSockets,
  ): void => {
    const health = this.health(url);
    health.epoch += 1;
    const epoch = health.epoch;

    void websocketClient.open(url).then((connection) => {
      if (
        sockets !== this.webSockets ||
        epoch !== this.relayHealth.get(url)?.epoch ||
        this.webSockets[url] !== null
      ) {
        connection.close();
        return;
      }
      console.log(`Connected to ${url}`);

      connection.onOpen(() => {
        if (sockets !== this.webSockets || epoch !== this.relayHealth.get(url)?.epoch) return;
        const h = this.health(url);
        h.connectingSince = undefined;
        h.downSince = undefined;
        this.resubscribeAll(url);
        this.notifyConnectionChange();
      });

      connection.onMessage((event) => {
        if (sockets !== this.webSockets || epoch !== this.relayHealth.get(url)?.epoch) return;
        const h = this.health(url);
        h.lastActivityAt = Date.now();
        const answeredProbe = h.probeId;
        if (answeredProbe !== undefined) {
          h.probeId = undefined;
          h.probingSince = undefined;
          this.sendToSocket(url, JSON.stringify(['CLOSE', answeredProbe]));
        }
        this.messageHandlers.forEach((handler) => {
          handler(url, event as unknown as MessageEvent<unknown>);
        });
      });

      connection.onError((error) => {
        console.error(`WebSocket error on ${url}:`, error);
      });

      connection.onClose(() => {
        if (sockets !== this.webSockets || epoch !== this.relayHealth.get(url)?.epoch) return;
        console.log(`Disconnected from ${url}`);
        this.clearConnectionState(url);
        this.notifyConnectionChange();
      });

      this.webSockets[url] = connection;
      const h = this.health(url);
      h.downSince = undefined;
      h.lastActivityAt = Date.now();
      this.everConnected = true;
      this.resubscribeAll(url);
      this.notifyConnectionChange();
    });
  };

  private reconnectRelay = (url: string): void => {
    const stale = this.webSockets[url];
    this.webSockets[url] = null;
    this.clearConnectionState(url);
    stale?.close();
    this.connectRelay(url);
  };

  private startWatchdog = (): void => {
    if (this.watchdog) return;
    this.watchdog = setInterval(this.watchdogTick, WATCHDOG_INTERVAL_MS);
  };

  private stopWatchdog = (): void => {
    if (this.watchdog) {
      clearInterval(this.watchdog);
      this.watchdog = undefined;
    }
  };

  private watchdogTick = (): void => {
    const now = Date.now();
    Object.entries(this.webSockets).forEach(([url, ws]) => {
      if (!ws) {
        this.noteUnhealthyAndMaybeFailover(url, now);
        if (url in this.webSockets) this.trackConnectingAndMaybeReconnect(url, now);
        return;
      }

      const state = ws.getReadyState();
      if (state === WebsocketState.OPEN) {
        const h = this.health(url);
        h.connectingSince = undefined;
        h.downSince = undefined;
        this.checkLiveness(url, now);
        return;
      }

      if (state === WebsocketState.CLOSED) {
        this.noteUnhealthyAndMaybeFailover(url, now);
        if (url in this.webSockets) this.reconnectRelay(url);
        return;
      }

      this.noteUnhealthyAndMaybeFailover(url, now);
      if (url in this.webSockets) this.trackConnectingAndMaybeReconnect(url, now);
    });
  };

  private noteUnhealthyAndMaybeFailover = (url: string, now: number): void => {
    const h = this.health(url);
    if (h.downSince === undefined) h.downSince = now;
    this.maybeFailover(url, now);
  };

  private maybeFailover = (url: string, now: number): void => {
    if (url === this.hostRelay) return;

    const since = this.relayHealth.get(url)?.downSince;
    if (since === undefined || now - since <= FAILOVER_AFTER_MS) return;

    const spare = this.spareQueue.shift();
    if (!spare) return;

    this.failoverRelay(url, spare);
  };

  private failoverRelay = (url: string, spare: string): void => {
    const stale = this.webSockets[url];
    delete this.webSockets[url];
    this.relayHealth.delete(url);
    this.relays = this.relays.filter((relay) => relay !== url);
    this.relays.push(spare);
    this.spareQueue.push(url);
    stale?.close();
    this.webSockets[spare] = null;
    this.connectRelay(spare);
    console.log(`Relay ${url} down for too long — failed over to ${spare}`);
  };

  private checkLiveness = (url: string, now: number): void => {
    const h = this.health(url);

    if (h.probingSince !== undefined) {
      if (now - h.probingSince > LIVENESS_PROBE_TIMEOUT_MS) {
        this.reconnectRelay(url);
      }
      return;
    }

    const last = h.lastActivityAt ?? now;
    if (now - last > LIVENESS_PROBE_AFTER_MS) {
      const probeId = `liveness_${++this.livenessId}`;
      h.probingSince = now;
      h.probeId = probeId;
      this.sendToSocket(url, JSON.stringify(['REQ', probeId, { limit: 0 }]));
    }
  };

  private trackConnectingAndMaybeReconnect = (url: string, now: number): void => {
    const h = this.health(url);
    if (h.connectingSince === undefined) {
      h.connectingSince = now;
      return;
    }
    if (now - h.connectingSince > WATCHDOG_CONNECTING_TIMEOUT_MS) {
      this.reconnectRelay(url);
    }
  };

  private notifyConnectionChange = (): void => {
    this.onConnectionStateChange?.();
  };

  private ensureMessageHandler = (handler: MessageHandler): void => {
    if (!this.messageHandlers.includes(handler)) this.messageHandlers.push(handler);
  };

  private sendToSocket = (url: string, message: string): void => {
    const ws = this.webSockets[url];
    if (ws && ws.getReadyState() === WebsocketState.OPEN) ws.send(message);
  };

  private disconnect = (): void => {
    const sockets = this.webSockets;
    this.webSockets = {};
    this.bookSubscription = undefined;
    this.messageHandlers.splice(0, this.messageHandlers.length);
    this.relayHealth.clear();
    this.spareQueue = [];
    this.hostRelay = undefined;
    this.everConnected = false;
    Object.values(sockets).forEach((ws) => {
      ws?.close();
    });
  };

  private removeMessageHandler = (handler: MessageHandler): void => {
    const handlerIndex = this.messageHandlers.indexOf(handler);
    if (handlerIndex >= 0) {
      this.messageHandlers.splice(handlerIndex, 1);
    }
  };

  private resubscribeAll = (url: string): void => {
    if (this.bookSubscription) {
      this.ensureMessageHandler(this.bookSubscription.handler);
      this.sendToSocket(url, this.buildBookRequest(this.bookSubscription.robosatsOnly));
    }

    this.notificationSubscriptions.forEach(({ request, handler }) => {
      this.ensureMessageHandler(handler);
      this.sendToSocket(url, JSON.stringify(request));
    });
  };

  sendMessage = (message: string, isActive?: () => boolean): void => {
    const sockets = this.webSockets;
    const send = (url: string, message: string): void => {
      if (sockets !== this.webSockets || (isActive && !isActive())) return;
      const ws = this.webSockets[url];

      if (!ws || ws.getReadyState() === WebsocketState.CONNECTING) {
        setTimeout(send, SEND_RETRY_MS, url, message);
      } else if (ws.getReadyState() === WebsocketState.OPEN) {
        ws.send(message);
      }
    };

    Object.keys(this.webSockets).forEach((url) => {
      send(url, message);
    });
  };

  private bookAuthors = (robosatsOnly: boolean): string[] => {
    let authors: string[] = [...liveFederationPubkeys];
    if (!robosatsOnly) {
      const thirdPartyPubkeys = (Object.values(thirdParties) as Array<{ nostrHexPubkey?: string }>)
        .map((f) => f.nostrHexPubkey)
        .filter((item): item is string => item !== undefined);
      authors = [...authors, ...thirdPartyPubkeys];
    }
    return authors;
  };

  private buildBookRequest = (robosatsOnly: boolean): string => {
    const requestBook = [
      'REQ',
      'subscribeBook',
      {
        authors: this.bookAuthors(robosatsOnly),
        kinds: [38383],
        since: Math.floor(new Date().getTime() / 1000) - BOOK_BACKFILL_SECONDS,
      },
    ];
    return JSON.stringify(requestBook);
  };

  private sendBookRequest = (robosatsOnly: boolean): void => {
    const request = this.buildBookRequest(robosatsOnly);
    Object.keys(this.webSockets).forEach((url) => {
      this.sendToSocket(url, request);
    });
  };

  subscribeBook = (robosatsOnly: boolean, events: RoboPoolEvents): void => {
    if (this.bookSubscription) this.removeMessageHandler(this.bookSubscription.handler);

    const subscribeBook = 'subscribeBook';

    const handler = (_url: string, messageEvent: MessageEvent): void => {
      const jsonMessage = JSON.parse(messageEvent.data);

      if (subscribeBook !== jsonMessage[1]) return;

      if (jsonMessage[0] === 'EVENT') {
        const event: Event = jsonMessage[2];
        const network = event.tags.find((e) => e[0] === 'network');
        if (network?.[1] === this.network) events.onevent(jsonMessage[2]);
      } else if (jsonMessage[0] === 'EOSE') {
        events.oneose();
      }
    };

    this.messageHandlers.push(handler);
    this.bookSubscription = { robosatsOnly, events, handler };
    this.sendBookRequest(robosatsOnly);
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
    this.notificationSubscriptionParams = undefined;
    this.notificationTimeouts.forEach((timeout) => clearTimeout(timeout));
    this.notificationTimeouts.clear();
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
    this.notificationSubscriptionParams = { pubkeys, events, options };
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
        this.notificationTimeouts.delete(eoseTimeout);
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
      this.notificationTimeouts.add(eoseTimeout);
    }

    toAdd.forEach((pubkey) => {
      const subId = `notification_${++this.notificationSubscriptionId}`;
      pendingSubIds.add(subId);
      eoseBySubscription.set(subId, new Set<string>());

      const requestNotifications: unknown[] = [
        'REQ',
        subId,
        { kinds: [1059], '#p': [pubkey], since },
      ];

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
      this.notificationSubscriptions.set(pubkey, { subId, request: requestNotifications, handler });

      const message = JSON.stringify(requestNotifications);
      Object.keys(this.webSockets).forEach((socketUrl) => {
        this.sendToSocket(socketUrl, message);
      });
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
    let expectedRelayCount = Object.keys(this.webSockets).length;
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
      this.accountRecoverySubscriptions.delete(subscriptionId);
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
            // Anyone can encrypt to our pubkey; only this key may author its recovery state.
            if (unwrappedEvent.pubkey !== nostrPubKey) return;
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
        }
      } catch {
        // Ignore parse errors
      }
    };

    const resubscribe = (): void => {
      if (isComplete) return;

      eoseRelays.clear();
      expectedRelayCount = Object.keys(this.webSockets).length;
      if (expectedRelayCount === 0) {
        completeRecovery();
      } else {
        this.ensureMessageHandler(handler);
        this.sendMessage(JSON.stringify(request), () => !isComplete);
      }
    };

    this.messageHandlers.push(handler);
    this.accountRecoverySubscriptions.set(subscriptionId, {
      resubscribe,
      complete: completeRecovery,
    });
    // Bound the whole recovery, including silent relays and pool replacements.
    completeTimeout = setTimeout(completeRecovery, completeTimeoutMs);
    resubscribe();
  };
}

export default RoboPool;
