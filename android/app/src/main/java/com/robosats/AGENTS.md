# /android/app/src/main/java/com/robosats — Core Kotlin Sources

## Purpose
Entry point, JS↔Kotlin bridge, native identity generation, and network state detection.

## File map
| File | Role |
|---|---|
| `MainActivity.kt` | App entry point: Tor init, WebView setup, deep-link handling, privacy teardown |
| `WebAppInterface.kt` | All `@JavascriptInterface` bridge methods; registered as `window.AndroidAppRobosats` |
| `RoboIdentities.kt` | JNI wrapper for `librobohash.so` + `librobonames.so` (Rust) |
| `Connectivity.kt` | Network capability tracking (mobile/wifi detection) |

## Startup flow (`MainActivity.onCreate`)
1. `EncryptedStorage.init(this)` + `LanguageManager.init(this)`
2. Force portrait orientation; inflate layout (`webView`, `loadingContainer`, `statusTextView`, `useOrbotButton`)
3. Request `POST_NOTIFICATIONS` on API 33+
4. Branch on `EncryptedStorage.getEncryptedStorage("settings_use_proxy") == "false"`:
   - **Orbot path**: persist `settings_use_proxy=false`, `useProxy=false`, show Orbot toast, call `setupWebView()` directly
   - **kmp-tor path**: `initializeTor()` → background thread `waitForTorConnection()` → `setupWebView()`
5. `waitForTorConnection()`: max 15 retries × 2s sleep; re-calls `startQuietly()` when not starting; updates status text every 3rd retry; on success calls `HttpClientManager.setDefaultProxy(getTorKmpObject().proxy)` then `setupWebView()`
6. Deep-link: `intent.getStringExtra("order_id")` → stored as `intentData`; also handled in `onNewIntent`

## WebView hardening (`setupWebView` + `secureWebViewSettings`)
**Fail-closed pattern**: a hard-blocking `WebViewClient` is installed *first* (intercepts all requests → empty response, overrides all URL loads → `true`). Only after a background Tor re-check does it swap in the real client.

Real `WebViewClient` behavior:
- `shouldInterceptRequest`: allows `file:///android_asset/` only; all other requests blocked
- `shouldOverrideUrlLoading`: external URLs routed to `Intent.ACTION_VIEW` (opens system browser), never loaded in-app

`WebChromeClient`:
- Denies all geolocation + all `PermissionRequest`s
- `onShowFileChooser`: image/* picker gated on `READ_MEDIA_IMAGES` / `READ_EXTERNAL_STORAGE` (maxSdk 32)

Security settings (non-obvious ones):
| Setting | Value | Rationale |
|---|---|---|
| `allowUniversalAccessFromFileURLs` | `true` | Required for CORS from `file://` origin to `.onion` coordinator URLs via Tor proxy |
| `allowFileAccessFromFileURLs` | `true` | Allows JS to load bundled static assets |
| `allowContentAccess` | `false` | No content:// URI access |
| `domStorageEnabled` | `true` | Frontend uses localStorage for robot/settings state |
| `cacheMode` | `LOAD_NO_CACHE` | Privacy: no disk cache |
| `saveFormData`/`savePassword` | `false` | Privacy |
| `MIXED_CONTENT_NEVER_ALLOW` | — | No HTTP inside HTTPS (not relevant for file:// but defensive) |
| Third-party cookies | blocked | `CookieManager.setAcceptThirdPartyCookies(false)` |

User agent: `"AndroidRobosats"`. Service Workers disabled.

On load: if `settings_notifications != "false"` → `startForegroundService(NotificationsService)`.
Deep-link injection: `webView.evaluateJavascript("javascript:window.AndroidDataRobosats = { navigateToPage: '$intentData' }", null)`.

## Privacy teardown (`onDestroy`)
Removes all cookies + flushes, clears cache/history/formData/sslPreferences, `WebStorage.deleteAllData()`, removes session cookies. Full wipe on every app close.

## JS↔Kotlin bridge (`WebAppInterface`)
Registered as `window.AndroidAppRobosats`. Promise-based: every method takes a `uuid` param; native resolves via JS callbacks:
- `window.AndroidRobosats.onResolvePromise('$uuid', '$result')`
- `window.AndroidRobosats.onRejectPromise('$uuid', '$error')`

| Method | Purpose |
|---|---|
| `generateRoboname(uuid, message)` | Rust JNI deterministic nickname |
| `generateRobohash(uuid, message)` | Rust JNI deterministic avatar |
| `copyToClipboard(message)` | ClipData label `"RoboSats Data"` |
| `getTorStatus(uuid)` | Returns `getTorKmpObject().torState.state.name` |
| `openWS(uuid, path)` | Open OkHttp WebSocket via Tor |
| `sendWsMessage(uuid, path, message)` | Send on existing WebSocket |
| `sendBinary(uuid, url, headers, base64Data)` | PUT binary; default content-type `application/octet-stream` |
| `getBinary(uuid, url)` | GET → base64 `NO_WRAP` |
| `sendRequest(uuid, action, url, headers, body)` | HTTP; body as `application/json; charset=utf-8`; result: `{"json":…,"headers":…}` |
| `getEncryptedStorage(uuid, key)` | Read Keystore-backed value |
| `setEncryptedStorage(uuid, key, value)` | Write + optionally signals `NotificationsService` via Intent |
| `deleteEncryptedStorage(uuid, key)` | Delete key |
| `restart()` | Relaunch with CLEAR_TOP\|NEW_TASK\|CLEAR_TASK then `context.finish()` |

WebSocket events pushed to JS:
- `window.AndroidRobosats.onWSMessage('$path', '$msg')` — **capital WS**
- `window.AndroidRobosats.onWsError('$path')` / `onWsClose('$path')` — lowercase Ws

Input validation: `UUID_PATTERN` (hex UUID format) + `SAFE_STRING_PATTERN` (`[a-zA-Z0-9\s_\-.,:;!?()\[\]{}"]*`) — invalid uuid silently returns (logged only). `encodeForJavaScript` escapes `\ ' " \n \r \t` and `< > &` → `\u003C \u003E \u0026`. `safeEvaluateJavascript` strips `\u0000` and posts to `webView.post{}`.

## RoboIdentities (`RoboIdentities.kt`)
`class RoboIdentities` — instance methods `generateRoboname(initial_string)` and `generateRobohash(initial_string)`. `companion object` tracks `librariesLoaded` + exposes `areLibrariesLoaded()`. Catches `UnsatisfiedLinkError` gracefully — no crash if `.so` missing.

## Connectivity (`Connectivity.kt`)
`companion object` — `var isOnMobileData`, `var isOnWifiData`; `updateNetworkCapabilities(networkCapabilities): Boolean` using `TRANSPORT_CELLULAR`/`TRANSPORT_WIFI`; returns `true` if network type changed.

## Traps
- WebSocket callbacks have **inconsistent casing**: `onWSMessage` (capital WS) vs `onWsError`/`onWsClose` (capital W, lowercase s). The private Kotlin function is `onWsMessage` — the JS-facing name differs. Frontend must match these exactly.
- `allowUniversalAccessFromFileURLs = true` is required and intentional — do not remove it without confirming `.onion` requests still work.
- `resolvePromise`/`rejectPromise` silently swallow invalid UUIDs (log only, no JS callback fired) — the frontend promise will hang if a UUID is malformed.

## Constraints
- Never relax the fail-closed WebViewClient swap — the block-everything-first pattern is a deliberate security guarantee.
- Never load coordinator URLs directly in the WebView — all network goes through OkHttp via the Tor SOCKS proxy.
- The `allowUniversalAccessFromFileURLs` flag must remain `true` for the app to function; do not "fix" it as a security hardening measure without a replacement CORS strategy.
