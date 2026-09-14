# /android — Native Android App

## Purpose
Kotlin Android app wrapping the React frontend in a WebView. Platform bridge only —
provides embedded Tor networking, Android Keystore encrypted storage, Nostr push
notifications, and Rust JNI robot identity generation. Frontend lives in `/frontend`;
this app is not a standalone product.

## Architecture
```
MainActivity
  ├── kmp-tor (TorKmpManager / TorKmp)  ← embedded Tor daemon
  │     └── OkHttp SOCKS proxy          ← all outbound HTTP/WS
  ├── WebView (file:///android_asset/index.html)
  │     └── WebAppInterface             ← @JavascriptInterface bridge
  │           ├── OkHttp (HTTP + WS)
  │           ├── EncryptedStorage      ← Android Keystore
  │           └── RoboIdentities        ← Rust JNI .so
  └── NotificationsService (foreground) ← Nostr push, runs independently
        └── NostrClient
```

Child docs (load on demand):
- `app/src/main/java/com/robosats/AGENTS.md` — MainActivity, WebAppInterface, RoboIdentities, Connectivity
- `app/src/main/java/com/robosats/tor/AGENTS.md` — TorKmpManager, TorKmp, ports, Orbot
- `app/src/main/java/com/robosats/models/AGENTS.md` — EncryptedStorage, LanguageManager, NostrClient
- `app/src/main/java/com/robosats/services/AGENTS.md` — NotificationsService

## Layer map
| Directory / File | Role |
|---|---|
| `app/src/main/java/com/robosats/` | Core Kotlin sources |
| `app/src/main/java/com/robosats/tor/` | kmp-tor lifecycle |
| `app/src/main/java/com/robosats/models/` | EncryptedStorage, LanguageManager, NostrClient |
| `app/src/main/java/com/robosats/services/` | Foreground NotificationsService |
| `app/src/main/assets/` | Baked-in frontend bundle (index.html + static/) |
| `app/src/main/jniLibs/` | Pre-compiled Rust .so per ABI |
| `app/src/main/AndroidManifest.xml` | Permissions, service declarations |
| `app/build.gradle.kts` | Build config, ABI splits, version code math |
| `zapstore.yaml` | Zapstore (Nostr app store) publication config |

## Frontend bundle (assets)
`app/src/main/assets/index.html` sets `window.RobosatsSettings = 'mobile-basic'` and
loads the bundled JS. The `static/` tree (JS, CSS, fonts, locales, avatars, sounds) is
baked into the APK — **not fetched at runtime**. Bundle must be copied from a `/frontend`
build before assembling the APK. `index.html` also declares `window.RobosatsSettings`
before the bundle loads — the React app gates on this value.

## Build & packaging (`app/build.gradle.kts`)
- `applicationId`: `com.robosats`; `compileSdk`/`targetSdk`: 36; `minSdk`: 26
- `isMinifyEnabled = false` for release (ProGuard off)
- ABI splits: `armeabi-v7a, arm64-v8a, x86, x86_64` + universal APK
- Version code formula: `baseVersionCode * 1000 + abiCode` (armeabi-v7a=1, arm64-v8a=2, x86=3, x86_64=4, universal=0)
- `jniLibs.useLegacyPackaging = true` — required for `.so` extraction
- Repos: google, mavenCentral, mvnrepository, **jitpack.io** (quartz/ammolite Nostr libs)
- `quartz`/`ammolite` both exclude `net.java.dev.jna`; `jna` added as `aar` artifact type

## Distribution
`zapstore.yaml` publishes arm64-v8a APK to Zapstore (Nostr-based app store), AGPL-3.0.
Asset regex: `robosats-v\d+\.\d+\.\d+.\w+-arm64-v8a\.\w+.apk`.

## Product intent
- Embedded kmp-tor is the **default and primary transport** — Orbot mode is an escape
  hatch for power users who already run Orbot and want to conserve battery/resources;
  it is not the intended path for most users.
- The app learns about active trades **only via Nostr DMs** (kind 1059 gift-wrap) sent to
  the robot's pubkey — it never background-polls the coordinator REST API.
- Rust JNI robohash/roboname exist for **offline deterministic parity** with coordinator
  avatars, not for performance. The coordinator uses the same algorithm server-side;
  the app must produce identical output from the same token.

## Traps
- **`x86` ABI split is built but never uploaded.** `app/build.gradle.kts` defines four ABI
  splits (`armeabi-v7a, arm64-v8a, x86, x86_64`) plus universal, but CI
  (`android-build.yml` + `release.yml`) only uploads and releases universal, arm64-v8a,
  armeabi-v7a, and x86_64. The `x86` APK is produced locally but silently discarded — do
  not expect it on any release page or in Zapstore.
