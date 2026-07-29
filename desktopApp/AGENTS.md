# /desktopApp — Electron Desktop App

## Purpose
Electron wrapper that loads the React frontend as a local file, routes all network traffic through a bundled Tor binary, and packages the result as a native desktop app for Windows, macOS, and Linux.

## Key Files
| File | Role |
|---|---|
| `index.ts` | Electron main process (TypeScript source) |
| `index.js` | Compiled output — **do not edit directly**, edit `index.ts` and recompile |
| `index.html` | Frontend shell — sets `RobosatsSettings`, loads bundled JS |
| `package.json` | Electron builder config, packaging scripts |
| `tor/` | Pre-built Tor binaries for each platform |
| `assets/icon/` | App icons (`.icns`, `.ico`, `.svg`) |

`static/frontend/` is **not** in this directory — it must be copied from a frontend build before packaging:
```bash
npm run build  # in /frontend
cp -r frontend/static desktopApp/static
```

## Startup Sequence (`index.ts`)
1. **Tor launch** — immediately on module load, spawns platform-appropriate Tor binary:
   - `win32`: `./tor/tor-win/tor/tor.exe`
   - `darwin`: `./tor/tor-mac/tor/tor`
   - `linux`: `./tor/tor-linux/tor/tor`
   - If Tor stderr fires → `app.exit(1)` (hard abort — desktop app requires Tor)

2. **Window creation** (`createWindow()`):
   - `BrowserWindow` 1200×800
   - `nodeIntegration: false`, `contextIsolation: true` (security defaults)
   - Loads `file://${__dirname}/index.html#/garage`
   - On `did-fail-load`: retries the same URL

3. **Session setup** (on `app.ready`):
   - `webRequest.onBeforeRequest` for `file:///static/*`: rewrites URLs to local filesystem paths — this is how the renderer accesses `./static/` assets
   - `setProxy({ proxyRules: "socks://localhost:9050", proxyBypassRules: "<local>" })` — all renderer HTTP/WS traffic routes through the Tor SOCKS proxy started in step 1

4. **Teardown**: `window-all-closed` kills the Tor process (`tor?.kill()`).

## Frontend Entry Point (`index.html`)
```javascript
window.RobosatsSettings = 'desktop-basic'
```
Loads: `./static/frontend/main.v0.8.4.js`

The `'desktop-basic'` value activates BasicMain in the React app. There is no desktop-pro build in this entry point — for pro mode, the self-hosted `nodeapp/pro.html` is used instead.

## Build & Packaging
```bash
npm run compile     # tsc: compiles index.ts → index.js
npm run start       # electron . (development)
npm run package-linux  # @electron/packager for linux/x64
npm run package-win    # @electron/packager for win32/ia32
npm run package-mac    # @electron/packager for darwin/x64
```

Output: standalone app bundles per platform. See `package.json` for electron-builder config (linux: AppImage + deb, mac: dmg, win: NSIS installer).

## Tor Proxy Details
- All renderer network traffic is proxied through `socks://localhost:9050`
- `<local>` is bypassed (no proxy for `localhost` / `file://`)
- The Tor binary must reach bootstrap before coordinator APIs respond
- No polling for Tor readiness — if Tor fails (stderr), the app exits immediately

## Key Difference from Android
The desktop app has **no JS↔Native bridge**. The renderer uses standard web APIs (`fetch`, `WebSocket`) — they are transparently proxied through Tor at the session level. No `window.AndroidAppRobosats` equivalent exists.

The frontend service layer detects `window.RobosatsSettings.startsWith('desktop')` and uses `ApiWebClient` (standard `fetch`) rather than any bridge client.
