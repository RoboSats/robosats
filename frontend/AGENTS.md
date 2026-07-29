# /frontend — React TypeScript SPA

## Purpose

Single-page application serving web, desktop, Android, and self-hosted clients. Two UI modes (basic/pro). Dual webpack config (`configNode` + `configAndroid`). Also a Django app (`FrontendConfig`) — serves its own HTML and has Django-side routes.

## Child docs (load on demand)

- `frontend/static/AGENTS.md` — asset source dir, federation.json, locales tooling, copy fan-out
- `frontend/templates/AGENTS.md` — HtmlWebpackPlugin template, basePath, WASM gate
- `frontend/src/basic/AGENTS.md` — BasicMain, all page/drawer components
- `frontend/src/components/AGENTS.md` — shared UI components (TradeBox, MakerForm, EncryptedChat…)
- `frontend/src/contexts/AGENTS.md` — AppContext, FederationContext, GarageContext, ThemeProvider
- `frontend/src/geo/AGENTS.md` — GeoJSON web/Android split
- `frontend/src/hooks/AGENTS.md` — custom React hooks (`useBondEstimate` — the only hook)
- `frontend/src/i18n/AGENTS.md` — i18next setup, Web.js vs Mobile.js, 17 locales
- `frontend/src/models/AGENTS.md` — TypeScript models (Order, Robot, Slot, Garage, Federation…)
- `frontend/src/pgp/AGENTS.md` — OpenPGP key management and message encryption
- `frontend/src/pro/AGENTS.md` — ProMain, grid layout, arbitrage views
- `frontend/src/services/AGENTS.md` — API, WebSocket, System, Roboidentities singletons
- `frontend/src/utils/AGENTS.md` — utility functions, bond calculator, federation helpers

## Architecture

```
webpack.config.ts (config array [configNode, configAndroid])
  configNode  → static/frontend/main.v{ver}.[contenthash].js  (prod)
                HtmlWebpackPlugin (7 outputs from templates/frontend/index.ejs)
                  templates/frontend/basic.html + pro.html
                  ../nodeapp/basic.html + pro.html
                  ../desktopApp/index.html   (publicPath: ./static/frontend/, basePath: /)
                  ../web/basic.html + pro.html
  configAndroid → ../android/app/src/main/assets/index.html
                  static/frontend/main.v{ver}.[contenthash].js (prod)
                  publicPath: ./static/frontend/
                  basePath: file:///android_asset/
  afterEmit CopyFilesPlugin: frontend/static → {nodeapp,desktopApp,web}/static

App.tsx (entry via src/index.js)
  200 ms systemClient.loading poll → ReactDOM.createRoot(document.getElementById('app'))
  ErrorBoundary > Suspense > I18nextProvider
    > AppContextProvider (contains ThemeProvider) > FederationContextProvider
      > GarageContextProvider
        > {client !== 'mobile' && <HostAlert/>}
        > isPro ? <ProMain/> : <BasicMain/>
        > <Snackbar autoHideDuration={6000}>
  window.ROBOSATS_API_ERROR CustomEvent → 6 s global error Snackbar
```

## Key Files

| File                                         | Role                                                                                                                                                                                                                                      |
| -------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `webpack.config.ts`                          | Dual config; afterEmit fan-out; 4 file-replace-loader rules                                                                                                                                                                               |
| `src/App.tsx`                                | Root — loading poll, provider nesting, global error handler                                                                                                                                                                               |
| `src/index.js`                               | Entry point — single line `import App from './App'`                                                                                                                                                                                       |
| `templates/frontend/index.ejs`               | HtmlWebpackPlugin source — **never hand-edit**                                                                                                                                                                                            |
| `templates/frontend/basic.html` / `pro.html` | Build outputs — **never hand-edit**                                                                                                                                                                                                       |
| `views.py`                                   | Django: renders `frontend/basic.html`/`pro.html` with `ONION_LOCATION`                                                                                                                                                                    |
| `urls.py`                                    | Django routes: `""` (×2 same path), `create/`, `garage/`, `garage/<token>/`, `offers/`, `order/<shortAlias>/<int:orderId>/`, `settings/`, `pro/` — `shortAlias` is a frontend route parameter, not an API parameter (see `api/AGENTS.md`) |
| `package.json`                               | `"dev"` = webpack --watch --progress --mode development (no HMR); `"build"` = webpack production; `"test"` = Jest 30 (not required, not ready); `"lint"`, `"lint:fix"`, `"format"` = ESLint/Prettier                                      |
| `babel.config.json`                          | `@babel/preset-env, -react, -typescript`; `@babel/plugin-transform-runtime (regenerator:true)` — webpack babel-loader inlines the same presets redundantly                                                                                |
| `tsconfig.json`                              | `noEmit:true, strict:true, jsx:react-jsx, allowImportingTsExtensions`; include `src/**/*` + `webpack.config.ts`; exclude `**/*.spec.ts` — type-check only, no emit                                                                        |
| `eslint.config.mjs`                          | ESLint 9 flat config; **ignores `**/index.js`** and PaymentMethods `code.js`                                                                                                                                                              |
| `Dockerfile` / `docker-compose.yml`          | node:18-bullseye-slim; `entrypoint.sh` shuffles `node_modules` via `/tmp` on first run; `CMD npm run build`; compose: `frontend` + `nginx` (host 8888:80, mounts `../web/nginx.conf` + `../web/coordinators/`)                            |

## `window.RobosatsSettings` Values

| Value              | Client     | View  |
| ------------------ | ---------- | ----- |
| `web-basic`        | web        | basic |
| `web-pro`          | web        | pro   |
| `selfhosted-basic` | selfhosted | basic |
| `selfhosted-pro`   | selfhosted | pro   |
| `desktop-basic`    | desktop    | basic |
| `mobile-basic`     | mobile     | basic |

No `desktop-pro` value exists.

## Build-time Platform Swapping (`configAndroid` only — file-replace-loader)

| Web module                                    | Android replacement                                                       |
| --------------------------------------------- | ------------------------------------------------------------------------- |
| `src/i18n/Web.js`                             | `Mobile.js` (17 static locale imports — HTTP fetch impossible in WebView) |
| `src/geo/Web.js`                              | `Mobile.js` (static GeoJSON import)                                       |
| `src/services/Roboidentities/Web.ts`          | `Android.ts` (Rust JNI bridge)                                            |
| `src/components/RobotAvatar/placeholder.json` | `placeholder_highres.json`                                                |

## Service Injection — userAgent-based (module-level singletons)

Not from `window.RobosatsSettings`; selection happens at **module load** via `window.navigator.userAgent`:
| Service | Android UA `AndroidRobosats` | Electron UA `Electron` | Default |
|---|---|---|---|
| `api/` → `apiClient` | `ApiAndroidClient` | — | `ApiWebClient` |
| `Websocket/` → `websocketClient` | `WebsocketAndroidClient` | — | `WebsocketWebClient` |
| `System/` → `systemClient` | `SystemAndroidClient` | `SystemDesktopClient` | `SystemWebClient` |
| `Roboidentities/` → `roboidentitiesClient` | swapped by file-replace | — | `RoboidentitiesWebClient` |

## Product Intent

- **BasicMain is the primary product surface.** Every shipping target except web/selfhosted `-pro` uses it. BasicMain must never regress.
- **One-robot-per-trade / disposable identity** is a privacy invariant enforced coordinator-side. Client-side, take/create buttons gate only on `hasRobot` (robot exists in current slot) and a penalty cooldown — **not** on existing active orders. The coordinator rejects a second active order per robot; the frontend surfaces this via `slot.activeOrder`.
- **Token loss = no recovery by design.** Robots are ephemeral; losing the token means losing the identity. No recovery UI exists or should be added.
- **Nostr is the primary book-discovery transport; REST is the fallback.** `settings.connection` defaults to `'nostr'`.
- **`HostAlert` / `unsafeClient` actively discourages clearnet web use** in favour of Tor/selfhosted/desktop/mobile. This is intentional, not a warning to downplay.
- **`fav.coordinator: 'robosats'` is a legacy artifact** replaced at runtime; federation neutrality (randomised coordinator order) is the actual policy.
- **Testnet is a first-class product surface**, not a dev-only escape hatch.
- **ProMain targets arbitrage traders** who need a multi-panel dashboard with live orderbook depth and portfolio controls.
- **`federation.json`/`lnproxies.json`/`thirdparties.json` are maintainer-owned seed files.** A webpack rebuild is required to propagate changes into the bundle.
- **Jest tests are present (`npm test`) but not required** — the test suite is not ready. Do not mandate frontend tests in new code Constraints.
- **Coordinator reputation is Nostr-native and coordinator-attested** — after a successful
  trade (`SUC`/`MLD`/`TLD`), the coordinator signs a proof-of-trade token (`POST /api/review/`)
  that the robot uses to publish a Nostr kind 31986 rating event. Ratings aggregate in
  `Federation.ratings` (one per voter pubkey, 6-month window). The 5-star widget in
  `Successful.tsx` is `disabled` unless `settings.connection === 'nostr'`. This is
  _coordinator_ reputation only — there is deliberately no peer/robot reputation system.

## Traps

- `npm run dev` = webpack --watch (no dev server, no HMR) — unlike typical Vite/CRA setups.
- Babel handles TS transpile; `tsconfig.json` is type-check only. **Never add `ts-loader`.**
- `templates/frontend/basic.html`/`pro.html`, `desktopApp/index.html`, `android/.../assets/index.html` are webpack outputs — **never hand-edit**.
- Both `configNode` and `configAndroid` use `./static/frontend/` as relative `publicPath` for desktop/Android targets; only web/selfhosted/nodeapp targets use `/static/frontend/` (absolute). The relative path is **not** unique to desktop.
- ESLint **ignores `**/index.js`\*\* — the webpack entry is unchecked by lint.
- `window.WebAssembly` gate in `index.ejs`: without WASM the `window.RobosatsSettings` global is **never set** and the app silently shows `.noscript-error` instead of loading. Required by `robo-identities-wasm` (`experiments.asyncWebAssembly: true`).
- `static/frontend/` (JS bundle) is generated output living inside the source directory — **never hand-edit it**.
- Django collectstatic outputs (`static/{rest_framework,admin,import_export,drf_spectacular_sidecar}/`) are also inside the tree (`.prettierignore` lists them) — not hand-editable.
- `Settings.model.ts`'s `Language` union **duplicates `'pl'` and omits `'ja'`** — `ja` locale ships and resolves but is not a valid TypeScript `Language` type (latent type-safety bug).

## Constraints

- Never use `ts-loader` — Babel transpiles TypeScript.
- Never hand-edit webpack output HTML files (see Traps).
- Never change desktop/Android `publicPath` from `./static/frontend/` to absolute — breaks `file://` loading.
- Never add a `desktop-pro` HTML entry without explicit product sign-off.
- New locales: add to `static/locales/` AND to `src/i18n/Mobile.js` static imports together — Android bundle will be missing the locale otherwise.
- Do not add one-active-order enforcement to take/create buttons — that is coordinator-side logic.
- Do not add a token recovery UI — ephemeral robot identity is a product privacy invariant.
