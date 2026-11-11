# /frontend/src/services — Platform Service Singletons

## Purpose

Platform-abstraction layer. Four singleton clients hide transport/platform differences from the rest of the app. Selected at module load via `window.navigator.userAgent` — **not** from `window.RobosatsSettings`. All four are exported from barrel `index.ts` files and consumed as singletons.

## Service Tree

```
services/
  Android/index.ts            ← AndroidAppRobosats bridge helpers
  DevFundProfile.ts            ← live DevFund % per coordinator via Coordinator.loadInfo (module-level TTL cache)
  api/
    index.ts                  ← exports apiClient singleton
    ApiAndroidClient/         ← OkHttp via WebAppInterface
    ApiWebClient/             ← browser fetch
  Roboidentities/
    Android.ts                ← Rust JNI bridge (file-replace-loader swap)
    Web.ts                    ← WASM RoboidentitiesWebClient
    type.ts                   ← shared interface
    RoboidentitiesAndroidClient/
    RoboidentitiesWebClient/
      index.ts
      robohash.worker.ts      ← Web Worker for avatar generation
      RobohashGenerator.ts
  RoboPool/index.ts           ← robot identity pre-generation pool
  System/
    index.ts                  ← exports systemClient singleton
    SystemAndroidClient/      ← Android Keystore storage + UA
    SystemDesktopClient/      ← Electron detection + localStorage
    SystemWebClient/          ← localStorage + web UA
  Websocket/
    index.ts                  ← exports websocketClient singleton
    WebsocketAndroidClient/   ← OkHttp WebSocket via WebAppInterface
    WebsocketWebClient/       ← browser WebSocket
```

## Selection Logic (module load, by userAgent)

| Service singleton      | Android UA `AndroidRobosats`           | Electron UA `Electron` | Default                   |
| ---------------------- | -------------------------------------- | ---------------------- | ------------------------- |
| `apiClient`            | `ApiAndroidClient`                     | —                      | `ApiWebClient`            |
| `websocketClient`      | `WebsocketAndroidClient`               | —                      | `WebsocketWebClient`      |
| `systemClient`         | `SystemAndroidClient`                  | `SystemDesktopClient`  | `SystemWebClient`         |
| `roboidentitiesClient` | swapped by webpack file-replace-loader | —                      | `RoboidentitiesWebClient` |

## Key Service Contracts

### `apiClient`

- HTTP request/response abstraction; handles auth header (base91 token), error events, coordinator URL routing.
- Fires `window.ROBOSATS_API_ERROR` CustomEvent on unrecoverable errors — caught by `App.tsx` global Snackbar.

### `websocketClient`

- WebSocket connection for real-time order/chat updates.
- Android uses `WebsocketAndroidClient` backed by OkHttp via `WebAppInterface`.

### `systemClient`

- **Storage**: `getItem(key)` / `setItem(key, value)` — async, returns `Promise<string | null>`.
- Android: Android Keystore encrypted storage. Web/Desktop: `localStorage`.
- **Loading state**: `systemClient.loading` — `true` until initial system check completes; `App.tsx` polls every 200 ms before mounting React.
- Desktop (`SystemDesktopClient`): detects Electron UA, uses `localStorage` for storage.

### `roboidentitiesClient`

- Generates robot avatar (robohash) + name deterministically from token hash.
- Web: WASM-based, runs in a Web Worker (`robohash.worker.ts`) to avoid blocking the main thread.
- Android: Rust JNI bridge via `Android.ts` (file-replace-loader swaps `Web.ts` at build time).
- Both must produce **identical output** from the same token — coordinator uses the same algorithm server-side.

### `RoboPool`

Nostr relay pool for the client. Manages WebSocket connections to coordinator relays and multiplexes subscriptions.

**Relay management:**

- `updateRelays(hostUrl, coordinators)` — rebuilds the relay pool from coordinator `getRelayUrl()` values. Always includes the host relay first, then fills up to `min(3, available)` at random. Coordinators with empty relay URLs (no address for current network/origin) are excluded. After rebuild: re-subscribes notifications and resubscribes any active account-recovery subscriptions.

**Connection resilience (watchdog + REQ replay):**

- REQ delivery model — subscriptions are delivered to a socket at exactly one point:
  1. **Subscribe-time fan-out**: `subscribeBook` / `updateNotificationSubscriptions` send their `REQ`s to sockets that are already `OPEN` at call time.
  2. **On-open replay**: `connectRelay` calls `resubscribeAll(url)` right after the open promise resolves (initial connect, watchdog recreation), and again on every subsequent `open` event (RWS auto-reconnects). `resubscribeAll` re-registers the tracked book/notification handlers (idempotent) and re-sends their `REQ`s to that socket only. This is what makes book, notifications and the Nostr chat recover automatically after any drop — the `since` backfill (book 30 h, notifications 48 h) re-delivers missed events, and consumers dedupe by event id / idempotent writes.
- `WebsocketWebClient` uses `reconnecting-websocket` with `maxRetries: Infinity` (was 4 — a relay that failed 4 retries became permanently silent for the session; the observed "offers stop updating after hours on an idle onion tab" bug), `minReconnectionDelay: 15000`, `reconnectionDelayGrowFactor: 2`, `maxReconnectionDelay: 300000`.
- **Watchdog** (`setInterval`, 60 s): a socket observed `CLOSED` is recreated immediately; a socket `CONNECTING` (or with a pending open promise) for more than 5 min is closed and recreated — this resets the exponential backoff so a recovered relay is re-probed sooner. Watchdog runs from `connect()` until `close()`.
- **Liveness probe** — `readyState` alone cannot detect a silently dead socket (idle TCP death fires no `close`; common on Tor circuits). The watchdog tracks per-url last-received-message time: an `OPEN` socket silent for >10 min is sent a Nostr probe `["REQ", "liveness_<n>", {limit: 0}]` (relays answer `EOSE` immediately without events). Any reply clears the probe (and closes the probe subscription). An unanswered probe after 20 s → socket treated as dead and recreated via `reconnectRelay`, so detection completes within ~80 s of the silence threshold. Healthy-but-quiet relays are left untouched.
- **Failover with rotation** — the watchdog never replaces a dead relay with a _different_ coordinator's relay on its own; retries go to the same url forever (`maxRetries: Infinity`). `updateRelays` therefore builds a `spareQueue` with every federation relay left outside the picked pool. A pool relay (except the **host relay** — the user's own coordinator's relay, which a spare cannot replace for chat/notifications) that stays unhealthy continuously for >10 min (`downSince` on the per-url `RelayHealth` entry, set at the first watchdog tick observing `CLOSED`/stuck-`CONNECTING`/pending-open, cleared on every successful open) is swapped 1:1 with `spareQueue.shift()`: evicted socket closed, health entry dropped, spare connected (picking up book/notification REQs via the on-open replay), and the evicted url pushed to the **back of the spare queue** — if the coordinator recovers, it can re-enter the pool when another member dies. Pool size stays constant, so EOSE counting and the UI chip are unaffected. No spares → falls back to endless same-url retry.
- `connectRelay` guards each open resolution with a per-url **epoch** (incremented on every `connectRelay` call) — a late-resolving orphan open (e.g. a stuck first attempt replaced by the watchdog) is closed instead of overwriting the newer socket.
- `disconnect()` clears `messageHandlers` and the book subscription; recovery `resubscribe` and `resubscribeAll` re-register their handlers, so nothing dangles. `subscribeBook` replaces its previous handler instead of stacking duplicates (the old bug: one event processed N times after N book re-subscriptions).
- `getConnectionStates(): Record<url, readyState>` + `onConnectionStateChange` callback (invoked on open/close/reconnect) — wired by `Federation.model` into the `onFederationUpdate` hook; the order-book footer shows a connected/total relay chip from this.

**Notification subscriptions (kind 1059, NIP-17 DMs):**

- `updateNotificationSubscriptions({ pubkeys, events, options })` — replaces the active notification subscription set. Subscribes each pubkey individually (separate `REQ` per pubkey) with a `since` backfill of `options.backfillSeconds` (default 48 h). Survives relay pool replacement — resubscribed in `updateRelays` and re-sent by the on-open replay.
- `clearNotificationSubscriptions()` — closes all notification `REQ`s and removes handlers; called before a connection reset.
- Called by `FederationContext` keyed on the Nostr pubkeys of interested slots (current slot + slots with active orders), not on token strings.

**Account recovery (kind 1059, NIP-59 gift wrap):**

- `subscribeAccountRecovery(nostrPubKey, nostrSecKey, onAccountFound, onComplete)` — sends one `REQ` for kind-1059 events `#p`-tagged with `nostrPubKey`. For each event: NIP-59 unwrap with `nostrSecKey`, **author check** (`unwrappedEvent.pubkey === nostrPubKey` — critical: anyone can gift-wrap to this pubkey), parse kind-30078 account tag via `parseAccountRecoveryEvent`. Completes when all relays send `EOSE` or after 5 s timeout. Re-subscribes on relay pool refresh (re-registering its handler — `disconnect()` cleared it). Called by `GarageKey.recoverAccount` for both current and legacy Nostr sec-key derivations.

**Other:**

- `sendEvent(event)` — broadcasts a signed Nostr event to all connected relays (used to publish account-recovery events).
- `subscribeNotifications(garage, events)` — subscribes to kind-1059 notifications for all slot pubkeys; called by `FederationContext`.
- `setFederationPubkeys(pubkeys)` — module-level function; injects live coordinator pubkeys for ratings verification.

### `DevFundProfile.ts`

`fetchDevFundProfiles(federation): Promise<Record<string, number>>` — reads each enabled
coordinator's live `devfund` percentage by reusing `Coordinator.loadInfo()` (the canonical
`GET /api/info/` fetch, which already shares in-flight requests and is `silent`), reading
the value from `coordinator.info.devfund`, and returning a `shortAlias → %` map. It never
issues its own `/api/info/` request. Used by `Federation.loadDevFund()` to override the
static `badges.donatesToDevFund` before re-running the weighted lottery. A coordinator with
`coordinator.info.devfund` already valid is not re-fetched. The `loadInfo` wait is bounded
by a 15 s timeout; failures/unreachable URLs (e.g. Tor-only coordinators on clearnet web)
are simply omitted → those coordinators keep the static fallback. Results are cached at
module level for 30 min, keyed by the `alias|url` set so a network/origin switch forces a
refresh.

## Product Intent

- **WASM is required for robot avatar generation on web** — `robo-identities-wasm` uses `asyncWebAssembly: true`. If WASM is blocked, avatars will not render and `window.RobosatsSettings` is never set (see `templates/AGENTS.md`).
- **Android Rust JNI parity**: the Android app generates robohash/roboname offline (no network) via Rust `.so` — must produce identical output to the coordinator's server-side algorithm. This is for privacy (no round-trip) and offline-capable deterministic identity.
- **Storage is security-sensitive on Android** (Keystore encryption) — never bypass `systemClient` to write raw `localStorage` in mobile-targeted code.
- `RoboPool` is the Nostr relay connection pool — it is **not** a robot identity pre-generation pool (that was the old description). Its primary roles are: serving coordinator-relay WebSocket connections, fan-out of notification subscriptions, and account-recovery relay queries.

## Traps

- `systemClient.loading` is `true` at module load — `App.tsx` **must** poll it before mounting. Any component that reads `systemClient` synchronously before loading completes will get stale defaults.
- `roboidentitiesClient` on Android is swapped at **build time** (file-replace-loader), not at runtime — there is no UA-based switch for this service; the wrong binary will silently produce wrong avatars if the build target is mixed up.
- `window.AndroidAppRobosats` and `window.AndroidRobosats` are only defined in the Android WebView — calling them on web throws `TypeError`.
- `ApiAndroidClient` and `WebsocketAndroidClient` route through `WebAppInterface` (Kotlin `@JavascriptInterface`) — response latency includes Android main-thread dispatch.
- **`subscribeAccountRecovery` author check is the only injection protection** — gift-wrap is public-key addressed, so any actor can send a kind-1059 event to our pubkey. Without the `unwrappedEvent.pubkey === nostrPubKey` guard, a malicious relay could feed a forged recovery event with a high account index, causing the user's robot to jump to a non-existent account.
- **Jest now transforms `@noble`/`@scure`/`nostr-tools`** — `jest.config.js:transformIgnorePatterns` has been updated to allow these ESM packages through Babel. The old mock for `@noble/curves` is removed.
- **Android relay resilience is weaker than web** — the Kotlin bridge does not expose reconnect events (`onOpen` is a no-op) and `WebsocketAndroidClient.getReadyState()` always reports `OPEN`, so the RoboPool watchdog and REQ replay cannot detect a dead socket there; the Kotlin side owns reconnection. Web/desktop/selfhosted (the `WebsocketWebClient` path) get the full watchdog + replay behaviour.

## Constraints

- Never add a UA-based switch for `roboidentitiesClient` — use webpack file-replace-loader for Android, matching the existing build pattern.
- Never call `localStorage` directly in components — use `systemClient.getItem/setItem` for platform portability.
- Do not bypass the `systemClient.loading` gate in `App.tsx` — premature mount before system is ready causes missing settings.
