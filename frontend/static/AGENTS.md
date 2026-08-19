# /frontend/static — Static Asset Source Directory

## Purpose

Build **source** directory for static assets. Copied wholesale to `nodeapp/static`, `desktopApp/static`, and `web/static` by webpack's `afterEmit CopyFilesPlugin`. The Android build copies subsets separately. Only `static/frontend/` (the JS bundle) is generated output; everything else is source.

## Directory Map

| Directory / File         | Contents                              | Notes                                                                                                                                                                      |
| ------------------------ | ------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `assets/currencies.json` | Integer-indexed currency list         | Used by `Maker.model.ts` and frontend currency pickers                                                                                                                     |
| `assets/geo/`            | `countries-coastline-10km.geo.json`   | World map for F2F order display; 10km resolution                                                                                                                           |
| `assets/images/`         | App icons, logos, favicons            |                                                                                                                                                                            |
| `assets/sounds/`         | Notification sound files              | Copied to Android assets by CopyWebpackPlugin                                                                                                                              |
| `assets/vector/`         | SVG assets                            |                                                                                                                                                                            |
| `css/`                   | CSS + webfonts (Roboto)               | Font URLs rewritten for Android (see Android Trap below)                                                                                                                   |
| `css_pro/`               | Pro-view CSS overrides                | Loaded only when `pro=true` template param is set                                                                                                                          |
| `federation/`            | `avatars/`, `pgp/`                    | Coordinator avatar images and PGP keys                                                                                                                                     |
| `federation.json`        | Coordinator seed data                 | **Canonical source** for coordinator list; imported by `Federation.model`, `Maker.model`, `utils/nostr`, `utils/getHost`, `RoboPool`, `UnsafeAlert`, `NotificationsDrawer` |
| `frontend/`              | Webpack JS bundle output              | **Generated** — do not hand-edit                                                                                                                                           |
| `lnproxies.json`         | Lightning proxy endpoint list         | Maintainer-owned; webpack rebuild required to propagate                                                                                                                    |
| `locales/`               | 17 locale JSON files + Python tooling | See Locales below                                                                                                                                                          |
| `thirdparties.json`      | Third-party service metadata          | Maintainer-owned; webpack rebuild required to propagate                                                                                                                    |

## Copy Fan-out (webpack `afterEmit CopyFilesPlugin`)

The entire `frontend/static/` directory is copied to:

- `../nodeapp/static/`
- `../desktopApp/static/`
- `../web/static/`

These destinations are **generated outputs** — never hand-edit files there; edit the source in `frontend/static/`.

## Android Build (CopyWebpackPlugin — `configAndroid`)

Android receives three specific subsets, not the whole directory:

| Source                 | Destination (in `android/app/src/main/assets/`) | Notes                                                                                                     |
| ---------------------- | ----------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `static/css`           | `static/css`                                    | Font URLs rewritten: `url(/static/css/fonts/roboto` → `url(file:///android_asset/static/css/fonts/roboto` |
| `static/assets/sounds` | `static/assets/sounds`                          | Notification sounds                                                                                       |
| `static/federation`    | `static/assets/federation`                      | **Path rename**: `federation/` becomes `assets/federation/` in Android assets                             |

## Locales (`locales/`)

17 locale JSON files — canonical order (per `src/i18n/Mobile.js`):
`en, es, ru, de, ja, pl, fr, ca, it, pt, eu, sw, cs, th, sv, zh-SI, zh-TR`

Also contains Python locale tooling:

- `collect_phrases.py` — extracts translation keys from source
- `handcrafted.py` — manually maintained translations
- `CONTRIBUTING.MD` — locale contribution guide
- `__pycache__/` — Python bytecache (committed; should be gitignored but isn't)

## Product Intent

`federation.json` is the canonical, **maintainer-owned** coordinator seed list. Changes require a webpack rebuild to propagate into the bundle. It is imported at module load time in multiple places. `lnproxies.json` and `thirdparties.json` follow the same pattern — not user-configurable at runtime, propagated only via build.

## Traps

- **`static/frontend/`** is generated — it lives inside a source directory, which is confusing. Never hand-edit it.
- Django collectstatic outputs (`static/{rest_framework,admin,import_export,drf_spectacular_sidecar}/`) are also inside the source tree and listed in `.prettierignore` — not hand-editable, not the same as the JS bundle.
- **`locales/__pycache__/`** is committed to git — it contains Python `.pyc` bytecache files that should be in `.gitignore` but aren't.
- **Android path rename**: `static/federation/` is copied to `assets/static/assets/federation/` in Android assets — not `assets/static/federation/`. Code that references federation assets on Android must use the renamed path.
- `federation.json` has no schema validation — malformed entries will silently produce broken coordinators at runtime.

## Constraints

- Never hand-edit files in `nodeapp/static/`, `desktopApp/static/`, or `web/static/` — they are copied outputs; change the source in `frontend/static/` instead.
- New locale: add to `locales/` AND to `src/i18n/Mobile.js` static imports.
- Do not increase GeoJSON resolution without checking Android APK size impact.
