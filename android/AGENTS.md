# /android — Native Android App

## Purpose
Native Kotlin Android app that wraps the React frontend in a WebView. Provides Tor networking, encrypted local storage, push notifications (Nostr), and native robot identity generation via Rust JNI libraries. Frontend code lives in `/frontend` — this app is a platform bridge only.

## Architecture
```
MainActivity.kt
  └── TorKmpManager (kmp-tor)
        └── WebView (loads file:///android_asset/index.html)
              └── WebAppInterface (JS ↔ Kotlin bridge)
                    ├── HTTP requests (OkHttp through Tor SOCKS proxy)
                    ├── WebSocket (OkHttp through Tor)
                    ├── EncryptedStorage (Android Keystore)
                    └── RoboIdentities (Rust .so — robohash + robonames)
```

## Key Kotlin Files
| File | Role |
|---|---|
| `MainActivity.kt` | App entry, Tor init, WebView setup, deep link handling |
| `WebAppInterface.kt` | `@JavascriptInterface` bridge — all JS↔Native calls |
| `RoboIdentities.kt` | JNI wrapper for `librobohash.so` + `librobonames.so` (Rust) |
| `Connectivity.kt` | Network availability checks |
| `models/EncryptedStorage.kt` | Android Keystore-backed encrypted key-value store |
| `models/LanguageManager.kt` | Device locale → i18n language mapping |
| `models/NostrClient.kt` | Nostr relay client for push notifications (uses quartz/ammolite) |
| `services/NotificationsService.kt` | Android notification delivery service |
| `tor/TorKmpManager.kt` | kmp-tor v4.8.10 lifecycle manager |

## JS → Native Bridge (`WebAppInterface.kt`)
Registered as `window.AndroidAppRobosats`. All methods use a `uuid` parameter — the native layer resolves the matching JS Promise via:
```
window.AndroidRobosats.onResolvePromise(uuid, result)
window.AndroidRobosats.onRejectPromise(uuid, error)
```

Key bridge methods:
| Method | Purpose |
|---|---|
| `generateRoboname(uuid, message)` | Deterministic nickname from token (Rust) |
| `generateRobohash(uuid, message)` | Robot avatar from token (Rust) |
| `sendRequest(uuid, action, url, headers, body)` | HTTP GET/POST/PUT/DELETE via Tor OkHttp |
| `sendBinary(uuid, url, headers, base64Data)` | PUT binary (avatar upload) |
| `getBinary(uuid, url)` | GET returning base64 |
| `openWS(uuid, path)` / `sendWsMessage(uuid, path, message)` | WebSocket via Tor |
| `getEncryptedStorage` / `setEncryptedStorage` / `deleteEncryptedStorage` | Keystore-backed storage |
| `getTorStatus(uuid)` | Returns `ON`/`STARTING`/`OFF`/`STOPPING` |
| `copyToClipboard(message)` | System clipboard |
| `restart()` | Reload WebView |

Security: all inputs validated with UUID_PATTERN and SAFE_STRING_PATTERN before processing.

WebSocket events pushed to JS:
- `window.AndroidRobosats.onWSMessage(path, message)`
- `window.AndroidRobosats.onWsError(path)` / `onWsClose(path)`

## Tor Integration
Uses `kmp-tor` v4.8.10. Configured in `tor/TorKmp.kt`:
- SOCKS ports: 9254, 9255, 9264 (last port: `OnionTrafficOnly` + `IsolateClientAddr`)
- DNS ports: 9252, 9253
- `DormantClientTimeout` = 10 min
- Bootstrap progress polled (up to 15 retries × 2s before timeout)
- Proxy for OkHttp: `InetSocketAddress` SOCKS proxy from TorKmpManager's AddressInfo

Orbot mode: if `settings_use_proxy=false` in EncryptedStorage, built-in Tor is skipped — the app expects Orbot to provide a system SOCKS proxy instead.

## Startup Flow (`MainActivity.kt`)
1. Init EncryptedStorage + LanguageManager
2. Check `settings_use_proxy` → start TorKmp or skip
3. Wait for Tor bootstrap in background thread
4. Call `setupWebView()`:
   - Register `WebAppInterface` as `window.AndroidAppRobosats`
   - Set user agent: `"AndroidRobosats"`
   - Load `file:///android_asset/index.html`
5. If deep-link intent present: inject `window.AndroidDataRobosats = { navigateToPage: '...' }`

## Frontend Entry Point
`app/src/main/assets/index.html` sets:
```javascript
window.RobosatsSettings = 'mobile-basic'
```
Loads: `./static/frontend/main.v0.8.4.js`

The frontend `static/` bundle is bundled into the APK assets — it is **not** fetched at runtime.

## Native Libraries (Rust JNI)
Pre-compiled `.so` files in `jniLibs/{arm64-v8a,armeabi-v7a,x86_64}/`:
- `librobohash.so` — generates robot avatar PNGs
- `librobonames.so` — generates deterministic robot nicknames

Falls back gracefully if JNI load fails (`UnsatisfiedLinkError`).

## Build Config (`app/build.gradle.kts`)
- `applicationId`: `com.robosats`
- `compileSdk`/`targetSdk`: 36, `minSdk`: 26
- `versionName`: `"0.8.5-alpha"`, `versionCode`: 85
- ABI split version codes: `baseVersionCode * 1000 + {armeabi-v7a=1, arm64-v8a=2, x86=3, x86_64=4}`
- `jniLibs.useLegacyPackaging = true` (required for .so files)
- Custom repo: `jitpack.io` (for quartz/ammolite Nostr libraries)

## Distribution
`zapstore.yaml` — configures publication to Zapstore (Nostr-based app store, AGPL-3.0).
