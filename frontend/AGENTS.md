# /frontend — React TypeScript SPA

## Purpose

Single-page application serving web, desktop, and mobile (via React Native) clients. Supports two UI modes (basic/pro) and multiple deployment contexts. Built with Webpack 5 + Babel.

## Entry Points

```
src/index.js          → mounts React root
src/App.tsx           → context providers + UI mode selection
src/basic/BasicMain   → mobile-optimized, page-based navigation
src/pro/ProMain       → dashboard with draggable/resizable widgets
```

## UI Mode Selection

`window.RobosatsSettings` (injected by server/Electron at page load) controls which UI loads:

```
"web-basic"      → BasicMain (default web)
"web-pro"        → ProMain (desktop-optimized)
"mobile-basic"   → BasicMain (React Native)
"desktop-basic"  → BasicMain (Electron)
"desktop-pro"    → ProMain (Electron)
```

## Basic Mode (`src/basic/`)

Page-based navigation, mobile-optimized:

- `Routes.tsx` — React Router config
- Pages: `RobotPage`, `BookPage`, `MakerPage`, `OrderPage`, `SettingsPage`
- Layout: `NavBar` (bottom) + `TopBar` (header) + `MainDialogs` (modals)
- URL scheme: `/`, `/offers`, `/create`, `/order/:shortAlias/:orderId`, `/settings`

## Pro Mode (`src/pro/`)

Dashboard with `react-grid-layout` — draggable/resizable widgets:

- Widgets: Maker, Book, DepthChart, Settings, Garage, Federation status
- `ToolBar` — lock/unlock layout, add/remove widgets
- `WidgetDrawer` — widget selector panel
- Layout persisted to settings (localStorage)

## Context Composition

```
AppContextProvider
  └── FederationContextProvider
        └── GarageContextProvider
              └── UI (BasicMain or ProMain)
```

See `src/contexts/AGENTS.md` for state details.

## Internationalization

- Framework: i18next with React integration
- Locale files: `/static/locales/{lng}.json` (HTTP-loaded)
- Browser language detection with English fallback
- 11+ supported languages
- Keys are the English strings (no abstract key system)
- `src/i18n/Web.js` (web) / `src/i18n/Mobile.js` (React Native)

## PGP Encryption (`src/pgp/index.ts`)

- Library: `openpgp` (lightweight, Curve25519)
- `genKey(token)` — generates keypair; passphrase = token; date offset -1 day (avoids clock skew)
- `encryptMessage(msg, ownPubKey, peerPubKey, privKey)` — encrypts to both parties + signs
- `decryptMessage(ciphertext, pubKey, privKey)` — decrypts + validates signature
- `signCleartextMessage(msg, privKey)` — produces PGP-signed cleartext

## Geolocation (`src/geo/`)

- `Web.js`: loads world GeoJSON from `/static/assets/geo/countries-coastline-10km.geo.json`
- Used for F2F (face-to-face) order map display
- `Mobile.js`: alternative implementation for React Native

## Build

```bash
npm run build   # production webpack build → /static/frontend/
npm run dev     # dev server with HMR
```

Config files: `webpack.config.ts`, `tsconfig.json`, `babel.config.json`, `.eslintrc`, `.prettierrc`

## Static Assets

- `static/locales/` — translation JSON files
- `static/assets/geo/` — world map GeoJSON
- `static/assets/` — icons, images
- Build output: `static/frontend/` (served by Django)

## Platform Abstraction Pattern

Each platform-specific concern has multiple implementations selected at runtime:

- `services/System/` — localStorage (Web/Android/Desktop)
- `services/api/` — HTTP client (Web/Android)
- `services/Websocket/` — WebSocket (Web/Android)
- `src/i18n/` — locale loading (Web/Mobile)
- `src/geo/` — map rendering (Web/Mobile)

## TypeScript Patterns

- Models are classes with methods (not plain interfaces) — see `src/models/AGENTS.md`
- Contexts expose typed state + setter functions
- Service interfaces defined as abstract classes; implementations injected at App level
- No Redux — React Context API + local state only
