# /frontend/src/models — TypeScript Domain Models

## Purpose

TypeScript classes and types representing the core domain: `Order`, `Robot`, `Slot`, `Garage`, `Federation`, `Coordinator`, `Settings`, `LightningInvoice`, and supporting enums/types. Models are plain data containers — no React, no HTTP calls.

## Model Map

| File                        | Key exports                                            | Notes                                                                                            |
| --------------------------- | ------------------------------------------------------ | ------------------------------------------------------------------------------------------------ |
| `Order.model.ts`            | `Order`, `Order.Status` (19 values 0–18), `Order.Type` | Mirrors backend `Order.Status` exactly                                                           |
| `Robot.model.ts`            | `Robot`                                                | Robot identity + active order ref; `activeOrderId` links to `slot.activeOrder`                   |
| `Slot.model.ts`             | `Slot`                                                 | One Slot per token — holds `Robot` + optional `activeOrder: Order`                               |
| `Garage.model.ts`           | `Garage`                                               | Map of token→`Slot`; `getSlot()`, `getActiveOrderId()`                                           |
| `Federation.model.ts`       | `Federation`                                           | Map of shortAlias→`Coordinator`; built from `federation.json` + live API data                    |
| `Coordinator.model.ts`      | `Coordinator`                                          | Per-coordinator info: `alias`, `mainnet`/`testnet` endpoints, `info`, `limits`, `book`, `badges` |
| `Settings.model.ts`         | `Settings`, `Language`, `Exchange`                     | User preferences; `Language` union has a known bug (see Traps)                                   |
| `Maker.model.ts`            | `Maker`                                                | Order creation form state; validates against `currencies.json`                                   |
| `LightningInvoice.model.ts` | `LightningInvoice`                                     | Parsed invoice fields                                                                            |

## `Order.Status` — 19 values (mirrors backend)

`WFB(0) PUB(1) PAU(2) TAK(3) UCA(4) EXP(5) WF2(6) WFE(7) WFI(8) CHA(9) FSE(10) DIS(11) CCA(12) PAY(13) SUC(14) FAI(15) WFR(16) MLD(17) TLD(18)` — must stay in sync with `api/models/order.py`. See `api/models/AGENTS.md` for the full state machine.

## `Settings.model.ts` — fields + defaults

| Field                  | Default                                   | Notes                                              |
| ---------------------- | ----------------------------------------- | -------------------------------------------------- |
| `frontend`             | `'basic'`                                 | Drives `isPro` in `App.tsx`                        |
| `client`               | `'web'`                                   | Set by `window.RobosatsSettings` prefix            |
| `connection`           | `'nostr'`                                 | Primary book discovery transport                   |
| `network`              | `'mainnet'`                               | `'testnet'` is a first-class surface, not dev-only |
| `language`             | `'en'`                                    | Must be a valid `Language` type (see Traps)        |
| `fontSize`             | `14`                                      | Basic UI font size                                 |
| `lightQRs`             | `false`                                   | QR code colour scheme                              |
| `freezeViewports`      | `false`                                   | Mobile viewport lock                               |
| `unsafeClient`         | `false`                                   | Enables clearnet web (discouraged)                 |
| `selfhostedClient`     | `false`                                   | Enables custom coordinator                         |
| `useProxy`             | `false` (mobile: `true` unless `'false'`) | LN proxy routing                                   |
| `androidNotifications` | `false` (mobile: `true`)                  | Nostr DM push notifications                        |

All prefs loaded **asynchronously** from `systemClient.getItem()` in the constructor.

## `Federation.model.ts` / `Coordinator.model.ts`

- `Federation` is built from `federation.json` at module load + enriched with live coordinator `/api/info` + `/api/limits` data.
- `federation.json` is maintainer-owned; a webpack rebuild is required to add/remove coordinators.
- Coordinator order is randomised at runtime — `fav.coordinator: 'robosats'` in the seed is a legacy default, not a preference.

**Live DevFund weight (`loadDevFund`)** — `Coordinator.Info` carries an optional `devfund`
(percentage, from `GET /api/info/`). `Federation.loadDevFund()` (called by
`FederationContext` on mount) probes all coordinators via `services/DevFundProfile.ts`,
overwrites `badges.donatesToDevFund` with the live value for reachable coordinators, then
re-runs `federationLottery` and reorders `this.coordinators` (the lottery order drives the
default MakerForm host and the book sort). Sets `devFundLoaded = true` and fires the
`onFederationUpdate` hook so the UI re-renders; `GarageContext` watches
`federation.devFundLoaded` to re-derive the default host only if the user has not already
picked one manually (`markCoordinatorPicked`/`resetCoordinatorPicked`).

**Coordinator ratings**

`public ratings: Record<string, Record<string, number>>` — outer key: coordinator
`nostrHexPubkey`; inner key: voter robot pubkey; value: normalised rating (0–1).
Seeded to empty maps by `coordinatorsRatingInit()` (called on init and on `addCoordinator`).

`loadRatings(verify: boolean = false)`:

- Subscribes to Nostr kind 31986 events via `RoboPool.subscribeRatings` with a
  6-month rolling window (`since: now - 6×30×24×60×60`).
- `onevent` callback: extracts coordinator pubkey (`p` tag) and rating (`rating` tag);
  if `verify=true`, calls `verifyCoordinatorToken(event)` (schnorr-verify); if
  `verify=false`, trusts the event without checking. Stores one vote per voter pubkey
  (last event wins if a voter re-rates).
- `oneose`: closes the subscription, triggers UI update.
- Guards against duplicate subscriptions: if `ratingsLoaded` is true and `verify=false`,
  returns early (ratings already loaded; re-fetch only when verifying).

**Average rating** is computed on-the-fly (not cached) in `FederationTable` and
`Dialogs/Coordinator.tsx`: `sum(values) / count` of `ratings[pubkey]` entries, displayed
as `avg × 5` stars + `(count)`.

## `Garage.model.ts` / `Slot.model.ts`

- `Garage` stores all robot slots across sessions (persisted via `systemClient`).
- Each `Slot` holds exactly one `Robot` and its `activeOrder` (if any).
- `getSlot()` returns the **currently selected** slot (one active at a time in the UI, but multiple can exist).
- The garage does not enforce single-active-order — the coordinator does.

## Product Intent

- `Order.Status` must mirror backend exactly — the TradeBox renders user-facing prompts from these numeric values; mismatches cause wrong UI state.
- `Settings.network = 'testnet'` is intentionally supported for trading real testnet Lightning — not a dev/debug mode.
- `Settings.useProxy` defaults on for mobile: Lightning invoice proxies protect the buyer's privacy (invoice reveals IP to the sender) — particularly important on mobile.
- `Maker.model.ts` rules (premium bounds, range amounts, duration) encode product policy — don't relax them without coordinator alignment.

## Traps

- `Settings.model.ts`'s `Language` union **duplicates `'pl'` and omits `'ja'`** — `ja` locale ships and is fetchable at runtime but is not a valid TypeScript `Language` type. Passing `'ja'` to any typed `Language` field causes a compile error.
- `Order.Status` has 19 values (0–18); `TAK(3)` is **never persisted** by the backend — it's a view-layer projection. See `api/AGENTS.md`.
- `Coordinator` fields are populated asynchronously after startup — components must handle the partial state (e.g., `limits` may be undefined until the first fetch).
- `Garage` persistence relies on `systemClient` which is platform-specific (`SystemAndroidClient` uses Android Keystore; `SystemWebClient` uses `localStorage`). Never assume a specific storage implementation.

## Constraints

- Keep `Order.Status` values in sync with `api/models/order.py` — never add a status without a corresponding backend entry.
- Do not add logic to `Garage`/`Slot` that prevents creating a second active order — that is coordinator-enforced.
- Do not remove `Language` without also fixing the `'pl'` duplication and adding `'ja'` — the current union is a known bug, not intentional design.
