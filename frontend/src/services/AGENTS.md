# /frontend/src/services — Platform Service Singletons

## Purpose

Platform-abstraction layer. Four singleton clients hide transport/platform differences from the rest of the app. Selected at module load via `window.navigator.userAgent` — **not** from `window.RobosatsSettings`. All four are exported from barrel `index.ts` files and consumed as singletons.

## Service Tree

```
services/
  Android/index.ts            ← AndroidAppRobosats bridge helpers
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

- Pre-generates a pool of robot identities in the background to reduce wait time when
  switching slots.
- **`subscribeRatings(events, pubkeys?, id?)`** — opens a Nostr `REQ` subscription for
  coordinator rating events:
  ```ts
  const sixMonthsAgo = Math.floor(Date.now() / 1000) - 6 * 30 * 24 * 60 * 60;
  ['REQ', subscriptionId, { kinds: [31986], '#p': pubkeysFilter, since: sixMonthsAgo }];
  ```
  Called by `Federation.model.loadRatings()`. Returns a subscription ID that can be
  passed to `closeSubscription(id)` when the `oneose` callback fires.

## Product Intent

- **WASM is required for robot avatar generation on web** — `robo-identities-wasm` uses `asyncWebAssembly: true`. If WASM is blocked, avatars will not render and `window.RobosatsSettings` is never set (see `templates/AGENTS.md`).
- **Android Rust JNI parity**: the Android app generates robohash/roboname offline (no network) via Rust `.so` — must produce identical output to the coordinator's server-side algorithm. This is for privacy (no round-trip) and offline-capable deterministic identity.
- **Storage is security-sensitive on Android** (Keystore encryption) — never bypass `systemClient` to write raw `localStorage` in mobile-targeted code.
- `RoboPool` pre-generation is a UX optimisation — generating a new robot identity is slow (WASM/JNI), so the pool keeps identities ready.

## Traps

- `systemClient.loading` is `true` at module load — `App.tsx` **must** poll it before mounting. Any component that reads `systemClient` synchronously before loading completes will get stale defaults.
- `roboidentitiesClient` on Android is swapped at **build time** (file-replace-loader), not at runtime — there is no UA-based switch for this service; the wrong binary will silently produce wrong avatars if the build target is mixed up.
- `window.AndroidAppRobosats` and `window.AndroidRobosats` are only defined in the Android WebView — calling them on web throws `TypeError`.
- `ApiAndroidClient` and `WebsocketAndroidClient` route through `WebAppInterface` (Kotlin `@JavascriptInterface`) — response latency includes Android main-thread dispatch.

## Constraints

- Never add a UA-based switch for `roboidentitiesClient` — use webpack file-replace-loader for Android, matching the existing build pattern.
- Never call `localStorage` directly in components — use `systemClient.getItem/setItem` for platform portability.
- Do not bypass the `systemClient.loading` gate in `App.tsx` — premature mount before system is ready causes missing settings.
