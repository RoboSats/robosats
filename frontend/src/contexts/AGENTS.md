# /frontend/src/contexts — React Global State

## Purpose

Four React contexts provide app-wide state: `AppContext` (settings, theme, UI dialogs), `FederationContext` (coordinator registry, order book), `GarageContext` (robot slots, active orders), and `ThemeProvider` (MUI theme, inside `AppContextProvider`). Consumed everywhere via custom `use*` hooks.

## Context Map

| File                    | Provider                    | Key State                                                            |
| ----------------------- | --------------------------- | -------------------------------------------------------------------- |
| `AppContext.tsx`        | `AppContextProvider`        | `settings`, `fav`, `open` dialogs, `windowSize`, tor status (mobile) |
| `FederationContext.tsx` | `FederationContextProvider` | `federation` (Federation model), order book, coordinator info        |
| `GarageContext.tsx`     | `GarageContextProvider`     | `garage` (Garage model), slot polling, `slotUpdatedAt`               |
| `ThemeProvider.tsx`     | `ThemeProvider`             | MUI `theme` derived from `settings.mode` + `settings.fontSize`       |

`ThemeProvider` is rendered **inside `AppContextProvider`** (wraps its children), not at the root App level.

## AppContext (`AppContext.tsx`)

- `settings: Settings` — loaded async from `systemClient` on mount; all prefs read via `systemClient.getItem(key).then()`.
- `fav: Favorites` — default `{ type: null, currency: 0, mode: 'fiat', coordinator: 'robosats' }`; `'robosats'` is a **legacy artifact replaced at runtime**; federation neutrality (randomised order) is the actual policy.
- `open: OpenDialogs` — keys: `more, learn, community, info, coordinator, warning, exchange, client, update, profile, recovery, confirmCollabCancel, search, thirdParty`.
- `entryPage` — `'garage'` if `client === 'mobile'`, else current path or `'garage'`.
- `torStatus` — mobile-only: 5 s polling via `window.AndroidAppRobosats.getTorStatus(uuid)` + `window.AndroidRobosats.storePromise`.
- Settings keys read from `systemClient`: `settings_mode`, `settings_fontsize_basic`, `settings_light_qr`, `settings_language`, `settings_connection` (default `'nostr'`), `settings_network` (default `'mainnet'`), `settings_notifications` (on by default for mobile), `settings_use_proxy` (on for mobile unless explicitly `'false'`).

## FederationContext (`FederationContext.tsx`)

- Builds the `Federation` model from `federation.json` seed data at startup.
- Polls coordinators for info/limits on mount and periodically.
- Order book is fetched via Nostr (primary) or REST fallback per `settings.connection`.
- Calls `federation.loadRatings()` on mount — loads Nostr kind 31986 coordinator ratings
  without signature verification (trusted by default for performance). The "Verify ratings"
  button in `FederationTable` triggers `federation.loadRatings(true)` for on-demand
  cryptographic verification.
- Exposes `coordinatorUpdatedAt`, `bookUpdatedAt` for consumers that need cache-busting.
- Calls `void federation.loadDevFund()` on mount — probes every coordinator's live
  `DEVFUND` via `/api/info/`, overrides the static federation badge, re-runs the lottery
  and reorders `Federation.coordinators`.
- Custom coordinator discovery (power-user `SettingsPage/Coordinators.tsx`) is supported
  but is an escape hatch, not a headline feature.

## GarageContext (`GarageContext.tsx`)

- Manages `Garage` — a map of token→`Slot` (each Slot holds a `Robot` + optional active order).
- Polls `slot.activeOrder` status using `statusToDelay[status]` — faster polling for active trade statuses, `defaultDelay` otherwise.
- Exposes `garage.getSlot()` (current slot), `garage.getActiveOrderId()`.
- **Single-active-order invariant** is coordinator-enforced; `slot.activeOrder` just surfaces what the coordinator reports. The garage does not prevent creating a second order client-side.

## Product Intent

- **`settings.connection = 'nostr'` by default** — Nostr is the primary book discovery transport; REST is the fallback. Changing the default would break the product's privacy model.
- **Testnet** (`settings_network`) is a first-class surface — toggling it changes which coordinator endpoints are used, not just a dev flag.
- **`unsafeClient` / `HostAlert`** gated on `settings.unsafeClient` and `settings.selfhostedClient` — actively discourages clearnet web use in favour of Tor/desktop/mobile. Do not downplay or remove this gate.
- **Mobile tor polling** exists solely because Android has an embedded Tor daemon whose status must be surfaced to the user before making API calls.
- **Custom coordinators** (`selfhostedClient`, coordinators settings page) are a power-user escape hatch; federation neutrality for standard users is enforced by the random seed ordering in `federation.json`.

## Traps

- `ThemeProvider` is inside `AppContextProvider`, not at `App.tsx` root — searching `App.tsx` for `ThemeProvider` will find nothing.
- `fav.coordinator: 'robosats'` default looks like a preference but is replaced at runtime; treating it as authoritative coordinator selection is wrong.
- Settings are loaded **asynchronously** — components consuming `settings` must handle the initial default state before async load completes.
- `torStatus` polling uses `window.AndroidAppRobosats` which is only defined on Android; calling it on web throws.

## Constraints

- Never move `ThemeProvider` out of `AppContextProvider` — theme depends on `settings.mode` which lives in AppContext.
- Never make `fav.coordinator: 'robosats'` a hard preference — federation neutrality is a product invariant.
- Do not add a clearnet-first path that bypasses `unsafeClient` / `HostAlert`.
- Do not add one-active-order client enforcement to `GarageContext` — that is coordinator logic.
