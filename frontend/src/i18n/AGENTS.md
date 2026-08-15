# /frontend/src/i18n — Internationalisation

## Purpose

i18next setup with two entry points: `Web.js` (HTTP-fetched locales, used by web/desktop/selfhosted) and `Mobile.js` (static imports, used by Android — HTTP fetch is impossible in the WebView). `Mobile.js` is swapped in at build time via webpack `file-replace-loader` for the Android config.

## Files

| File        | Used by                            | Locale loading                                            |
| ----------- | ---------------------------------- | --------------------------------------------------------- |
| `Web.js`    | web, desktop, selfhosted           | `i18next-http-backend` fetches JSON at runtime            |
| `Mobile.js` | Android (file-replace-loader swap) | 17 static `import` statements — all locales in the bundle |

## Locale List — canonical order (from `Mobile.js`)

`en, es, ru, de, ja, pl, fr, ca, it, pt, eu, sw, cs, th, sv, zh-SI, zh-TR`

17 locales total. Locale JSON files live in `frontend/static/locales/`.

## `Mobile.js` Details

- Statically imports all 17 locale JSON files at build time — they are bundled into the Android JS.
- Still calls `.use(HttpApi)` despite using static resources (dead plugin registration — harmless but confusing).
- Top-level `await i18n.use(...).init(config)` — init is async and awaited at module level.
- `keySeparator: false` — flat key namespace.
- `react.useSuspense: false` — components render with fallback key string rather than suspending.

## `Web.js` Details

- Uses `i18next-http-backend` to fetch locale JSON from `/static/locales/<lang>.json` at runtime.
- Same config options as `Mobile.js` except locale source is HTTP.

## Product Intent

- **17 locales are a product commitment** — each locale has a community contributor. Adding or removing a locale requires updating `static/locales/` AND `Mobile.js` static imports together, else Android ships without the locale.
- **`keySeparator: false`** means all translation keys are flat strings (no dot-notation nesting). New translation keys must follow this convention.
- **`react.useSuspense: false`** is a deliberate choice to avoid blank screens on slow locale load — components show the key string as fallback instead of suspending.
- **Android static bundling** avoids any network request for translations — critical for offline/Tor robustness on mobile.

## Traps

- `Mobile.js` calls `.use(HttpApi)` but never uses HTTP backend — the plugin is registered but inert. Do not rely on it for Android locale loading.
- Adding a new locale to `static/locales/` alone is **not enough** — `Mobile.js` needs a new `import` + the locale added to the `resources` object, or Android will fall back to English silently.
- `Settings.model.ts`'s `Language` union **duplicates `'pl'` and omits `'ja'`** — `ja` locale ships and resolves at runtime but is not a valid `Language` TS type. Typed `Language` fields will reject `'ja'` at compile time.
- `zh-SI` and `zh-TR` are non-standard locale codes (simplified/traditional Chinese) — do not normalise them to `zh-CN`/`zh-TW` without updating all locale JSON filenames and import paths.

## Constraints

- New locale: add JSON to `static/locales/` AND add static import to `Mobile.js` — both together, atomically.
- Do not change `keySeparator` from `false` — all existing keys are flat strings; changing would break every translation lookup.
- Do not enable `react.useSuspense` without adding Suspense boundaries around all i18n-consuming components.
