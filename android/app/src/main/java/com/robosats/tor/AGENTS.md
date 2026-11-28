# /android/…/com/robosats/tor — Tor Lifecycle

## Purpose
kmp-tor 2.x (`io.matthewnelson.kmp-tor:runtime` + `resource-exec-tor`, tor 0.4.9) lifecycle management: daemon startup, port configuration, SOCKS proxy exposure, and Orbot bypass. All outbound HTTP and WebSocket traffic from OkHttp routes through the SOCKS proxy this module provides.

## File map
| File | Role |
|---|---|
| `TorKmpManager.kt` | Contains both `class TorKmp` (daemon instance) and `object TorKmpManager` (singleton holder) |
| `TorState.kt` | Data class wrapping `EnumTorState` + bootstrap progress |
| `EnumTorState.kt` | Enum: `ON`, `STARTING`, `OFF`, `STOPPING` |

**Note**: there is no `TorKmp.kt` — both `class TorKmp` and `object TorKmpManager` live in `TorKmpManager.kt`.

## Port configuration (`TorRuntime.Builder` `config {}` block)
| Port type | Ports | Extra flags |
|---|---|---|
| DNS | 9252, 9253 | — |
| Socks | 9254, 9255 | — |
| HttpTunnel | 9258, 9259 | — |
| Trans | 9262, 9263 | — |
| Socks (isolated) | 9264 | `OnionTrafficOnly` + `IsolateClientAddr` |

All use the `__XxxPort` options: a taken port is reassigned to `auto` instead of failing startup.
`proxy` is built from `RuntimeEvent.LISTENERS`: the 9254 listener, else any non-9264 one (9264 is onion-only and would break clearnet requests).
`DormantClientTimeout` = 10 minutes. tor runs as its own process (exec), workDir `getDir("kmptor")`, cache `cacheDir/kmptor`; no Android Service.

## TorKmpManager (singleton object)
- `getTorKmpObject()`: returns current `TorKmp` instance; throws `UninitializedPropertyAccessException` if not yet created
- `updateTorKmpObject(torKmp: TorKmp)`: stores the instance
- Exposes: `startQuietly()` / `stopQuietly()` / `restartQuietly()` / `newIdentity()`, `torState: TorState`, `isConnected(): Boolean`, `isStarting(): Boolean`, `proxy: Proxy` (SOCKS `InetSocketAddress`)

## Startup integration (`MainActivity`)
1. `getTorKmpObject()` — if `UninitializedPropertyAccessException`, create `TorKmp(application)` + call `TorKmpManager.updateTorKmpObject`
2. `startQuietly()` (enqueues `Action.StartDaemon`, never throws)
3. Background thread polls `isConnected()` / `isStarting()` (max 15 retries × 2s)
4. On success: `HttpClientManager.setDefaultProxy(getTorKmpObject().proxy)` — all subsequent OkHttp calls use this proxy

## Orbot mode
When `EncryptedStorage.getEncryptedStorage("settings_use_proxy") == "false"`, `MainActivity` skips `initializeTor()` entirely and calls `setupWebView()` directly with `useProxy=false`. No `TorKmp` is created; the user is responsible for providing a system-level SOCKS proxy via Orbot.

## Product intent
Embedded kmp-tor is the **default and primary transport**. Orbot mode is an escape hatch for power users who already run Orbot (conserves battery/resources). It is not the intended path for most users — do not treat it as equivalent.

## Traps
- `getTorKmpObject()` throws (not returns null) when uninitialized — callers in `WebAppInterface` (`getTorStatus`) must be aware.
- tor 0.4.8 (kmp-tor 1.x) stalls at ~30% bootstrap since the 28 Oct 2026 consensus requires Desc=3/Microdesc=3 — do not downgrade below tor 0.4.9.
- Exec mode needs `jniLibs.useLegacyPackaging = true` (tor ships as `libtor.so` and is executed from `nativeLibraryDir`).
- `DormantClientTimeout = 10 min` means Tor may go dormant during background use; `NotificationsService` must call `startQuietly()` / check `isConnected()` independently (it does so via `keepAlive()`).

## Constraints
- Never instantiate `TorKmp` more than once per process — use `TorKmpManager.getTorKmpObject()` and only create a new instance on `UninitializedPropertyAccessException`.
- Never bypass the proxy assignment (`HttpClientManager.setDefaultProxy`) — OkHttp clients built before this call will not route through Tor.
