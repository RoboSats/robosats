# /frontend/src/utils — Utility Functions

## Purpose

Pure utility functions and helpers used across the app. No React state or lifecycle.
Most files are standalone modules; `index.ts` barrel-exports all of them.
One subdirectory: `crypto/`.

## File Map

| File / Dir             | Key exports                                                                                                                                                                                                                                                              | Notes                                                                                                                                                        |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `array.ts`             | misc array helpers                                                                                                                                                                                                                                                       |                                                                                                                                                              |
| `accountRecovery.ts`   | `createAccountRecoveryEvent`, `parseAccountRecoveryEvent`, `publishAccountRecoveryEvent`, `saveAccountRecovery`                                                                                                                                                          | Nostr account-recovery events (kind 30078, NIP-59 gift-wrapped); see §accountRecovery below                                                                  |
| `blossom.ts`           | `uploadToBlossom`, `downloadFromBlossom`, `downloadFromBlossomWithFallback`, `verifyBlobHash`, `computeSha256`                                                                                                                                                           | Chat image E2E upload/download; uploads **ciphertext only** (see §Blossom below)                                                                             |
| `bondCalculator.ts`    | `BondCalculatorProps`, `calculateBondAmount`                                                                                                                                                                                                                             | Bond sats ↔ percent, delegates from `useBondEstimate`                                                                                                        |
| `checkVer.ts`          | `checkVer`, `getHigherVer`, `getClientVersion`                                                                                                                                                                                                                           | Compares client version vs coordinator-reported `version`; **live** `getHigherVer` — do not edit the dead duplicate that was in `aggregateInfo.ts` (deleted) |
| `computeSats.ts`       | `computeSats`                                                                                                                                                                                                                                                            | Fiat ↔ sats conversion using current price + premium                                                                                                         |
| `crypto/xchacha20.ts`  | `encryptFile`, `decryptFile`, `generateKey`, `toBase64`, `fromBase64`                                                                                                                                                                                                    | XChaCha20-Poly1305 symmetric file encryption for chat images (`@noble/ciphers`)                                                                              |
| `federationLottery.ts` | `federationLottery`                                                                                                                                                                                                                                                      | Randomises coordinator order weighted by DevFund donation % (capped at 50)                                                                                   |
| `filterOrders.ts`      | `filterOrders`                                                                                                                                                                                                                                                           | Applies book filter state to an order list                                                                                                                   |
| `garageKey.ts`         | `generateGarageKey`, `encodeGarageKey`, `decodeGarageKey`, `validateGarageKey`, `deriveRobotKey`, `derivedKeyToToken`, `garageKeyToRobotToken`, `getNostrSecKeyFromGarageKey`, `getNostrPubKeyFromGarageKey`, `getLegacyNostrSecKeyFromGarageKey`, `isValidAccountIndex` | Garage Key crypto primitives; see §garageKey below                                                                                                           |
| `getHost.ts`           | `getHost`, `getOrigin`                                                                                                                                                                                                                                                   | Coordinator URL resolution per client type                                                                                                                   |
| `getRouter.ts`         | `getRouter`                                                                                                                                                                                                                                                              | Returns the active React Router instance                                                                                                                     |
| `hexToBase91.ts`       | `hexToBase91`, `base91ToHex`                                                                                                                                                                                                                                             | Token encoding helpers (match backend `api/utils.py`)                                                                                                        |
| `hexToRgb.ts`          | `hexToRgb`                                                                                                                                                                                                                                                               | Colour conversion                                                                                                                                            |
| `index.ts`             | barrel re-exports                                                                                                                                                                                                                                                        | All utils from one entry point                                                                                                                               |
| `match.ts`             | `matchOrder`                                                                                                                                                                                                                                                             | Checks if a taker's offer matches a maker's order                                                                                                            |
| `nip17File.ts`         | `nip17File`                                                                                                                                                                                                                                                              | NIP-17 file message helpers for Nostr chat                                                                                                                   |
| `nostr.ts`             | `eventToPublicOrder` (default), `verifyCoordinatorToken`                                                                                                                                                                                                                 | NIP-69 event → Order; coordinator token schnorr-verify                                                                                                       |
| `prettyNumbers.ts`     | `prettyNumbers`, `pn`                                                                                                                                                                                                                                                    | Human-readable number formatting                                                                                                                             |
| `saveFile.ts`          | `saveFile`                                                                                                                                                                                                                                                               | Browser file-save helper                                                                                                                                     |
| `settings.ts`          | `getSettings`, `getClientType`                                                                                                                                                                                                                                           | Reads `window.RobosatsSettings`, returns typed Settings                                                                                                      |
| `statusBadgeColor.ts`  | `statusBadgeColor`                                                                                                                                                                                                                                                       | Maps `Order.Status` → MUI badge colour                                                                                                                       |
| `stringToInteger.ts`   | `stringToInteger`                                                                                                                                                                                                                                                        | Deterministic string → integer hash                                                                                                                          |
| `theme.ts`             | `getRobosatsTheme`                                                                                                                                                                                                                                                       | MUI theme factory                                                                                                                                            |
| `token.ts`             | `genBase62Token`, `hexToBase62`, `validateToken`                                                                                                                                                                                                                         | Robot token generation + validation                                                                                                                          |
| `webln.ts`             | WebLN helpers                                                                                                                                                                                                                                                            | WebLN/Alby integration utilities                                                                                                                             |
| `weightedMean.ts`      | `weightedMean`                                                                                                                                                                                                                                                           | Weighted average (used in price aggregation display)                                                                                                         |

## Key modules

### `bondCalculator.ts`

`calculateBondAmount({ amount, minAmount, maxAmount, isRange, bondSize, mode, price, premium })`
— computes bond sats from the resolved `bondSize` percent and fiat/swap params.
Called by `useBondEstimate`; not called directly by components.

### `federationLottery.ts`

Returns coordinators in **randomised order weighted by DevFund donation % (capped at 50)**
— an explicit donation-incentive mechanism, not a flat-neutral shuffle. Called at runtime
to replace the seed order from `federation.json`. Signature
`federationLottery(federation = defaultFederation, devfundOverrides = {})`: the static
`badges.donatesToDevFund` is used as weight unless a **live override** (from
`services/DevFundProfile.ts`, backed by each coordinator's `/api/info/` `devfund`) is
provided. The value is clamped to `[0, 50]`. This randomisation is the mechanism that
makes `fav.coordinator: 'robosats'` (the seed default) a transient legacy value — it is
overwritten at runtime.

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

### `blossom.ts` — Chat image E2E encryption

Chat images are **fully end-to-end encrypted** — the Blossom server (coordinator) stores
only undecryptable ciphertext:

1. **EXIF strip**: the image is re-encoded through a canvas before encryption to remove
   metadata that could identify the sender.
2. **`encryptFile(data, key?)`** (`crypto/xchacha20.ts`): encrypts with
   **XChaCha20-Poly1305** (`@noble/ciphers`) using a random 32-byte key and 24-byte nonce
   per file. Returns `{ ciphertext, nonce, key }`.
3. **`uploadToBlossom(ciphertext, coordinatorUrl, nostrSecKey)`**: uploads **only the
   ciphertext** (`Uint8Array`) to `/blossom/upload` on the coordinator. Authorization uses
   a Nostr **kind-24242** auth event (signed with the robot's `nostrSecKey`, expiry 5 min,
   `x` tag = SHA-256 of the ciphertext). Returns `{ url, sha256 }` where `url` is
   `${coordinatorUrl}/blossom/${sha256}`.
4. **Key transport**: the `key` and `nonce` are embedded inside the PGP-encrypted
   `Message` (the normal text chat row) — so they are also E2E-encrypted and never
   visible to the coordinator.
5. **`downloadFromBlossomWithFallback(senderUrl, sha256, coordinatorUrl?)`**: tries the
   receiver's local coordinator URL first (nodeapp always proxies `/mainnet|testnet/<alias>/blossom/`),
   falls back to the sender's embedded absolute URL. Prevents cross-topology URL failures.
6. **`verifyBlobHash(data, expectedSha256)`**: verifies the SHA-256 of the downloaded blob
   matches what the sender committed to — prevents coordinator blob substitution.

### `garageKey.ts`

Crypto primitives for the Garage Key system. All functions are pure (no side effects, no storage).

- **Format**: bech32 `robo1...` string encoding a random 32-byte payload. `GARAGE_KEY_PREFIX = 'robo'`, bech32 limit 90 chars, valid length 55–65 chars.
- **Key derivation**: `deriveRobotKey(plainKey, accountIndex)` → `sha512(plainKey)` as BIP32 seed → `HDKey.derive("m/44'/88'/{accountIndex}'/0")` → 32-byte privkey. `derivedKeyToToken` converts it to a 36-char base62 robot token (big-endian BigInt mod 62 loop).
- **Nostr identity**: `getNostrSecKeyFromGarageKey(plainKey)` = `sha256(sha512(plainKey))`. **Legacy variant** (`getLegacyNostrSecKeyFromGarageKey`) = `sha256(sha512(TextEncoder(hex(plainKey))))` — kept for reading recovery events published before the raw-byte fix. Both must coexist indefinitely.
- `isValidAccountIndex(n)` — must be integer in `[0, 0x80000000)` (BIP32 non-hardened boundary); used everywhere an account index is stored or compared.
- `@scure/base` (bech32) and `@scure/bip32` (BIP32) are **transitive deps via nostr-tools** — not in `package.json` directly.

### `accountRecovery.ts`

Publishes and parses Nostr account-state recovery events so a Garage Key can recover its current account index after reinstall.

- **Event format**: kind **30078** (parameterized replaceable), d-tag `robosats-garage-account`, `account` tag = account index as string, content empty.
- **Privacy**: wrapped with NIP-59 gift wrap (`nip59.wrapEvent`, kind 1059) — only the key holder can decrypt; relay sees only an opaque sealed event directed at the Garage Key's Nostr pubkey.
- `createAccountRecoveryEvent(nostrSecKey, accountIndex)` builds and seals the event.
- `parseAccountRecoveryEvent(event)` unwraps the inner event and validates kind/d-tag/account tag.
- `saveAccountRecovery(nostrSecKey, accountIndex, roboPool)` = create + publish; called by `Garage.makeOrderWithRecovery`.

### `token.ts`

`genBase62Token()` — generates a new robot token (high-entropy random base62 string) for **legacy mode only**. In garageKey mode, tokens are derived by `garageKey.ts:derivedKeyToToken` — never call `genBase62Token` for garageKey-mode robots.
`validateToken(token)` — checks length and charset. In legacy mode, the token is the single robot secret: passphrase for the PGP private key and the SHA256 pre-image of `tokenSHA256`.

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
  the relay's own author filter for performance on Tor. Structural sybil resistance comes
  from two Nostr protocol properties: (1) kind 31986 is a **replaceable event** — the relay
  keeps only the latest per `pubkey + d-tag`, so each robot can submit at most one rating
  per `{shortAlias}:{orderId}`; (2) the `sig` tag embeds the **coordinator's own schnorr
  signature** of `${robotPubKey}${orderId}`, so only a robot that completed a real trade
  (and received that token from the coordinator) can produce a valid event. The "Verify
  ratings" button triggers `verifyCoordinatorToken` on every event, providing
  cryptographic proof that neither a relay operator nor anyone without the coordinator's
  `NOSTR_NSEC` tampered with the ratings.

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
- **`garageKey.ts` imports `@scure/base` and `@scure/bip32`** — both are transitive deps of `nostr-tools`, not listed as direct deps. A `nostr-tools` semver bump that changes these peers will break key derivation at runtime without a TypeScript error. Promote to direct deps if this becomes a risk.
- **`accountRecovery.ts` event author check**: `subscribeAccountRecovery` (in `RoboPool`) verifies `unwrappedEvent.pubkey === nostrPubKey` before trusting a recovery event — anyone can gift-wrap a message to our pubkey, so this check is the only protection against injected fake account indices.

## Constraints

- `federationLottery` must not be replaced with a deterministic sort — the donation-weighted
  randomisation is a product invariant; a flat sort removes the DevFund incentive.
- Keep `nostr.ts` tag names in sync with `api/nostr.py` — divergence silently breaks
  Nostr book discovery.
- Keep `hexToBase91`/`base91ToHex` in sync with `api/utils.py` — auth header mismatch
  breaks robot authentication.
- Do not add network calls to utility functions — they must remain pure (note: `accountRecovery.ts` does call `roboPool.sendEvent` but does not do HTTP — `roboPool` is injected, maintaining testability).
- Never call `genBase62Token` for garageKey-mode robot creation — tokens must be derived from the key via `garageKey.ts:derivedKeyToToken`.
- Never change `garageKey.ts` derivation constants (`DERIVATION_COIN_TYPE = 88`, path template, sha512 seed) without a migration plan — existing users' keys are silently invalidated.
- `verifyCoordinatorToken`'s message format (`${event.pubkey}${orderId}`, raw UTF-8)
  must stay byte-identical to `api/nostr.py`'s `Nostr.sign_message` call in `ReviewView`.
