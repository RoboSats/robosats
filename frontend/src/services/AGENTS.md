# /frontend/src/services — Platform Services

## Purpose

Abstracts platform-specific I/O (HTTP, WebSocket, storage, identity) so business logic in models and contexts is platform-agnostic. Each service has multiple implementations; the correct one is injected at App level based on `window.RobosatsSettings`.

## API Client (`api/`)

### Interface

```typescript
interface ApiClient {
  get(path, auth?, coordinator?): Promise<Response>;
  post(path, body, auth?, coordinator?): Promise<Response>;
  put(path, body, auth?, coordinator?): Promise<Response>;
  delete(path, auth?, coordinator?): Promise<Response>;
  sendBinary(path, body, auth?): Promise<Response>;
  getBinary(path, auth?): Promise<Response>;
}
```

### Implementations

- `ApiWebClient` — standard `fetch`-based HTTP for web browsers
- `ApiAndroidClient` — JavaScript bridge to Android WebView native layer

### Auth Pattern

Every authenticated request includes:

```typescript
{
  headers: {
    "Authorization": `Token ${tokenSHA256}`,
    "nostrPubKey": robot.nostrPubKey,
    "pubKey": robot.pubKey,            // PGP public key
    "encPrivKey": robot.encPrivKey,    // encrypted PGP private key
  }
}
```

`tokenSHA256` is the SHA256 of the raw robot token — never send the raw token.

## WebSocket Client (`Websocket/`)

### Interface

```typescript
interface WebsocketClient {
  open(path: string): WebsocketConnection;
}
interface WebsocketConnection {
  send(message: object): void;
  close(): void;
  onMessage(handler: (data) => void): void;
}
```

### Implementations

- `WebsocketWebClient` — wraps `ReconnectingWebSocket`:
  - Min reconnect delay: **15 seconds**
  - Max retries: **4**
  - Exponential backoff factor: 2×
  - Connection timeout: 15 seconds
- `WebsocketAndroidClient` — Android bridge implementation

Used for: real-time order status updates, live book changes, EncryptedSocketChat.

## Nostr Relay Client (`RoboPool/`)

Manages Nostr WebSocket relay connections for push notifications.

- Maintains one connection per active robot's coordinator relay
- Subscribes to events tagged with robot's `nostrPubKey`
- Receives encrypted DM notifications (NIP-17)
- Used by FederationContext for real-time order book updates (kind 38383)

## System Service (`System/`)

Abstracts localStorage and platform-specific storage.

### Interface

```typescript
interface SystemClient {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}
```

### Implementations

- `SystemWebClient` — `window.localStorage`
- `SystemAndroidClient` — Android WebView bridge to native storage
- `SystemDesktopClient` — Electron storage

**Key storage keys** (written/read by models):

- `garage` — serialized Garage (all robot slots + tokens)
- `settings` — serialized Settings
- `coordinators` — coordinator config overrides

## Roboidentities Service (`Roboidentities/`)

Generates robot avatars and validates nicknames.

- `getRoboHash(hash, size)` — fetches avatar PNG from RoboHash service using `tokenSHA256`
- Returns deterministic avatar tied to robot identity
- Coordinator-specific: avatar fetched from coordinator's RoboHash endpoint, not a central server

### Implementations

- `RoboidentitiesWebClient` — HTTP fetch from coordinator URL
- `RoboidentitiesAndroidClient` — Android bridge

## Injection Pattern

Services are instantiated once in `App.tsx` and passed to context providers:

```typescript
// App.tsx
const [client] = window.RobosatsSettings.split('-');
const apiClient = client === 'android' ? new ApiAndroidClient() : new ApiWebClient();
const wsClient = client === 'android' ? new WebsocketAndroidClient() : new WebsocketWebClient();
const systemClient = client === 'android' ? new SystemAndroidClient() : new SystemWebClient();
```

Models receive the appropriate client via method parameters — never instantiate clients inside models.

## Agent Guidelines

- Always use `auth.getAuthHeaders()` (from Robot model) rather than constructing headers manually
- WebSocket connections must be closed on component unmount — no automatic cleanup
- `systemClient` is the only valid way to read/write persistent state in frontend code
- Never import a platform-specific implementation directly in business logic — use the interface type
