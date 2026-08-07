# /android/…/com/robosats/tor — Tor Lifecycle

## Purpose
kmp-tor lifecycle management: daemon startup, port configuration, SOCKS proxy exposure, and Orbot bypass. All outbound HTTP and WebSocket traffic from OkHttp routes through the SOCKS proxy this module provides.

## File map
| File | Role |
|---|---|
| `TorKmpManager.kt` | Contains both `class TorKmp` (daemon instance) and `object TorKmpManager` (singleton holder) |
| `TorState.kt` | Data class wrapping `EnumTorState` + bootstrap progress |
| `EnumTorState.kt` | Enum: `ON`, `STARTING`, `OFF`, `STOPPING` |

**Note**: there is no `TorKmp.kt` — both `class TorKmp` and `object TorKmpManager` live in `TorKmpManager.kt`.

## Port configuration (`TorKmp` constructor body)
| Port type | Ports | Extra flags |
|---|---|---|
| DNS | 9252, 9253 | — |
| Socks | 9254, 9255 | — |
| HttpTunnel | 9258, 9259 | — |
| Trans | 9262, 9263 | — |
| Socks (isolated) | 9264 | `OnionTrafficOnly` + `IsolateClientAddr` |

`DormantClientTimeout` = 10 minutes.

## TorKmpManager (singleton object)
- `getTorKmpObject()`: returns current `TorKmp` instance; throws `UninitializedPropertyAccessException` if not yet created
- `updateTorKmpObject(torKmp: TorKmp)`: stores the instance
- Exposes: `torOperationManager.startQuietly()`, `torState: TorState`, `isConnected(): Boolean`, `isStarting(): Boolean`, `proxy: Proxy` (SOCKS `InetSocketAddress`)

## Startup integration (`MainActivity`)
1. `getTorKmpObject()` — if `UninitializedPropertyAccessException`, create `TorKmp(application)` + call `TorKmpManager.updateTorKmpObject`
2. `torOperationManager.startQuietly()`
3. Background thread polls `isConnected()` / `isStarting()` (max 15 retries × 2s)
4. On success: `HttpClientManager.setDefaultProxy(getTorKmpObject().proxy)` — all subsequent OkHttp calls use this proxy

## Orbot mode
When `EncryptedStorage.getEncryptedStorage("settings_use_proxy") == "false"`, `MainActivity` skips `initializeTor()` entirely and calls `setupWebView()` directly with `useProxy=false`. No `TorKmp` is created; the user is responsible for providing a system-level SOCKS proxy via Orbot.

## Product intent
Embedded kmp-tor is the **default and primary transport**. Orbot mode is an escape hatch for power users who already run Orbot (conserves battery/resources). It is not the intended path for most users — do not treat it as equivalent.

## Traps
- `getTorKmpObject()` throws (not returns null) when uninitialized — callers in `WebAppInterface` (`getTorStatus`) must be aware.
- `DormantClientTimeout = 10 min` means Tor may go dormant during background use; `NotificationsService` must call `startQuietly()` / check `isConnected()` independently (it does so via `keepAlive()`).

## Constraints
- Never instantiate `TorKmp` more than once per process — use `TorKmpManager.getTorKmpObject()` and only create a new instance on `UninitializedPropertyAccessException`.
- Never bypass the proxy assignment (`HttpClientManager.setDefaultProxy`) — OkHttp clients built before this call will not route through Tor.
