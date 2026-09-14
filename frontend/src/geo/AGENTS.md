# /frontend/src/geo — GeoJSON Web/Android Split

## Purpose

Provides the world map GeoJSON used for F2F (face-to-face) order geolocation display.
Split into two implementations: `Web.js` (API-client fetch) and `Mobile.js` (static
import). `Mobile.js` is swapped in at Android build time via webpack `file-replace-loader`.

## Files

| File        | Used by                            | GeoJSON loading                                                                  |
| ----------- | ---------------------------------- | -------------------------------------------------------------------------------- |
| `Web.js`    | web, desktop, selfhosted           | `apiClient.get(baseUrl, '/static/assets/geo/countries-coastline-10km.geo.json')` |
| `Mobile.js` | Android (file-replace-loader swap) | Static `import` — bundled into the Android JS                                    |

**`Web.js` real implementation:**

```js
export const getWorldmapGeojson = async (apiClient, baseUrl) => {
  return apiClient.get(baseUrl, '/static/assets/geo/countries-coastline-10km.geo.json');
};
export default getWorldmapGeojson;
```

It takes `apiClient` and `baseUrl` as parameters — it is **not** a bare `fetch()` call.
This means it routes through the same client/proxy chain as all other API calls
(important for Tor transport on desktop and selfhosted).

## Why the Split

On Android, the app runs from `file:///android_asset/` — absolute URL fetch
(`/static/assets/...`) resolves against `file://` and fails. `Mobile.js` imports the
GeoJSON statically so it is bundled at build time and available offline.

## GeoJSON Source

`frontend/static/assets/geo/countries-coastline-10km.geo.json` — 10km coastline
resolution world map. Used by the `<Map/>` component (`src/components/Map/`) to render
the F2F order location picker (Leaflet map) in `MakerForm` and `BookTable`.

## Android Asset Path Note

Webpack's `CopyWebpackPlugin` (Android config) copies `static/federation/` to
`assets/static/assets/federation/` in Android assets (path rename). The GeoJSON file
itself is bundled into the JS, not copied separately — no path rename applies to it.

## Product Intent

- **F2F orders require geolocation** — `MakerForm` shows the map picker when the payment
  method includes a physical-location indicator. This is a product requirement, not
  optional UI.
- **10km resolution** is a deliberate privacy/size trade-off — enough for a useful map
  pin, low enough not to inflate the APK with a high-res dataset.
- **Static bundling on Android** ensures the map works without network access —
  important for Tor-first mobile where latency is high and connectivity intermittent.
- **`apiClient` routing on web/desktop** ensures the GeoJSON fetch shares the same Tor
  SOCKS proxy as coordinator API calls — no clearnet leakage on desktop.

## Traps

- `Web.js` takes `(apiClient, baseUrl)` parameters — callers must pass both. Calling it
  without arguments or with a bare `fetch` substitute will silently break on desktop
  (Tor proxy not applied).
- Increasing GeoJSON resolution increases both web bundle and APK size — evaluate Android
  APK impact before switching to a finer resolution file.
- On web, the GeoJSON is fetched lazily — the map picker will not render until the fetch
  completes. Components must handle the loading state.
- `Mobile.js` bundles the full GeoJSON into the Android JS — not code-split. This is
  intentional (offline support) but adds to the Android bundle size.

## Constraints

- Never change the fetch path in `Web.js` without also checking whether the Android asset
  path in the webpack `CopyWebpackPlugin` config needs updating.
- Do not increase GeoJSON resolution without checking Android APK size impact.
- Do not import `Web.js` explicitly in Android-targeted code — `file-replace-loader`
  swaps it; explicit imports bypass that swap.
