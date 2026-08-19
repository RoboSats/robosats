# /frontend/src/utils — Utility Functions

## Purpose

Pure utility functions and helpers used across the app. No React state or lifecycle.
Most files are standalone modules; `index.ts` barrel-exports all of them.
One subdirectory: `crypto/`.

## File Map

| File / Dir             | Key exports                                              | Notes                                                                      |
| ---------------------- | -------------------------------------------------------- | -------------------------------------------------------------------------- |
| `aggregateInfo.ts`     | `aggregateInfo`                                          | Merges `/api/info` responses across coordinators                           |
| `array.ts`             | misc array helpers                                       |                                                                            |
| `blossom.ts`           | Blossom media-upload helpers                             | Used by chat image upload                                                  |
| `bondCalculator.ts`    | `BondCalculatorProps`, `calculateBondAmount`             | Bond sats ↔ percent, delegates from `useBondEstimate`                      |
| `checkVer.ts`          | `checkVer`                                               | Compares client version vs coordinator-reported `version`                  |
| `computeSats.ts`       | `computeSats`                                            | Fiat ↔ sats conversion using current price + premium                       |
| `crypto/`              | subdirectory                                             | Crypto helpers (entropy, hashing)                                          |
| `federationLottery.ts` | `federationLottery`                                      | Randomises coordinator order weighted by DevFund donation % (capped at 50) |
| `filterOrders.ts`      | `filterOrders`                                           | Applies book filter state to an order list                                 |
| `getHost.ts`           | `getHost`, `getOrigin`                                   | Coordinator URL resolution per client type                                 |
| `getRouter.ts`         | `getRouter`                                              | Returns the active React Router instance                                   |
| `hexToBase91.ts`       | `hexToBase91`, `base91ToHex`                             | Token encoding helpers (match backend `api/utils.py`)                      |
| `hexToRgb.ts`          | `hexToRgb`                                               | Colour conversion                                                          |
| `index.ts`             | barrel re-exports                                        | All utils from one entry point                                             |
| `match.ts`             | `matchOrder`                                             | Checks if a taker's offer matches a maker's order                          |
| `nip17File.ts`         | `nip17File`                                              | NIP-17 file message helpers for Nostr chat                                 |
| `nostr.ts`             | `eventToPublicOrder` (default), `verifyCoordinatorToken` | NIP-69 event → Order; coordinator token schnorr-verify                     |
| `prettyNumbers.ts`     | `prettyNumbers`, `pn`                                    | Human-readable number formatting                                           |
| `saveFile.ts`          | `saveFile`                                               | Browser file-save helper                                                   |
| `settings.ts`          | `getSettings`, `getClientType`                           | Reads `window.RobosatsSettings`, returns typed Settings                    |
| `statusBadgeColor.ts`  | `statusBadgeColor`                                       | Maps `Order.Status` → MUI badge colour                                     |
| `stringToInteger.ts`   | `stringToInteger`                                        | Deterministic string → integer hash                                        |
| `theme.ts`             | `getRobosatsTheme`                                       | MUI theme factory                                                          |
| `token.ts`             | `genBase62Token`, `hexToBase62`, `validateToken`         | Robot token generation + validation                                        |
| `webln.ts`             | WebLN helpers                                            | WebLN/Alby integration utilities                                           |
| `weightedMean.ts`      | `weightedMean`                                           | Weighted average (used in price aggregation display)                       |

## Key modules

### `bondCalculator.ts`

`calculateBondAmount({ amount, minAmount, maxAmount, isRange, bondSize, mode, price, premium })`
— computes bond sats from the resolved `bondSize` percent and fiat/swap params.
Called by `useBondEstimate`; not called directly by components.

### `federationLottery.ts`

Returns coordinators in **randomised order weighted by DevFund donation % (capped at 50)**
— an explicit donation-incentive mechanism, not a flat-neutral shuffle. Called at runtime
to replace the seed order from `federation.json`. This randomisation is the mechanism
that makes `fav.coordinator: 'robosats'` (the seed default) a transient legacy value —
it is overwritten at runtime.

### `getHost.ts` / `getOrigin`

`getOrigin()` returns `'onion'` when `client === 'desktop'`, else derives from
`settings.network` and the coordinator's `.onion`/clearnet address. Desktop always forces
`origin = 'onion'` — mandatory Tor-only constraint.

### `nostr.ts`

Two exports:

- **`eventToPublicOrder(event)` (default)** — parses Nostr kind 38383 NIP-69 order events
  into frontend `Order` objects. Called by `FederationContext` when
  `settings.connection === 'nostr'`. Tag mapping must stay in sync with
  `api/nostr.py`'s event construction.
- **`verifyCoordinatorToken(event)`** — schnorr-verifies a kind 31986 coordinator-rating
  event signature. Reads `sig` tag (coordinator schnorr signature), `d` tag
  (`{alias}:{orderId}`), and `p` tag (coordinator pubkey); verifies
  `schnorr.verify(sig, UTF8(${event.pubkey}${orderId}), coordinatorPubKey)`. Returns
  `false` on any error. Used by `Federation.model.loadRatings(verify=true)`.

### `token.ts`

`genBase62Token()` — generates a new robot token (high-entropy random base62 string).
`validateToken(token)` — checks length and charset. Token is the single robot secret:
passphrase for the PGP private key and the SHA256 pre-image of `tokenSHA256`.

### `hexToBase91.ts`

`hexToBase91` / `base91ToHex` — encoding used by the HTTP auth header (`tokenSHA256`
transmitted as base91). Must remain in sync with backend `api/utils.py`
`hex_to_base91` / `base91_to_hex`.

## Product Intent

- **`federationLottery` randomisation is weighted by DevFund donation % (capped at 50)** — a
  donation-incentive mechanism. It must always run before presenting coordinators to the user.
  Bypassing it (e.g., with a flat sort) removes the incentive without achieving true neutrality.
- **Desktop `getOrigin` = `'onion'` is mandatory** — all desktop traffic routes through
  the embedded Tor SOCKS proxy; using clearnet URLs bypasses it and leaks traffic.
- **`nostr.ts` tag mapping must mirror `api/nostr.py`** — a mismatch silently drops
  orders from the book (they parse as missing required fields).
- **`verifyCoordinatorToken` is opt-in by default** — `loadRatings(verify=false)` trusts
  events without schnorr-checking, for performance on Tor. The "Verify ratings" button
  triggers the full cryptographic pass. This is deliberate: freezing the UI for every
  page load is worse UX than deferred verification.

## Traps

- `federationLottery` is a randomisation function — it returns a different order on
  every call. Do not memoize it with a stable key or the neutrality guarantee is lost.
- `getOrigin` reads `client` from `window.RobosatsSettings.split('-')[0]` at call time —
  if called before `RobosatsSettings` is set (WASM not loaded), it returns undefined and
  URL construction breaks silently.
- `nostr.ts` `eventToPublicOrder` drops malformed events silently — no error logging for
  individual bad events.
- `verifyCoordinatorToken` uses raw UTF-8 bytes (not a 32-byte hash) as the message
  passed to `schnorr.verify`. This deviates from BIP340's convention. The backend
  `Nostr.sign_message` also uses raw bytes — both sides must remain identical.
- `index.ts` barrel-exports everything — importing from `utils/index.ts` pulls in all
  modules. Prefer direct file imports in performance-critical paths.

## Constraints

- `federationLottery` must not be replaced with a deterministic sort — the donation-weighted
  randomisation is a product invariant; a flat sort removes the DevFund incentive.
- Keep `nostr.ts` tag names in sync with `api/nostr.py` — divergence silently breaks
  Nostr book discovery.
- Keep `hexToBase91`/`base91ToHex` in sync with `api/utils.py` — auth header mismatch
  breaks robot authentication.
- Do not add network calls to utility functions — they must remain pure.
- `verifyCoordinatorToken`'s message format (`${event.pubkey}${orderId}`, raw UTF-8)
  must stay byte-identical to `api/nostr.py`'s `Nostr.sign_message` call in `ReviewView`.
