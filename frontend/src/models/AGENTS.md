# /frontend/src/models — TypeScript Data Models

## Purpose

Domain models as TypeScript classes with methods (not plain interfaces). Models handle API communication, localStorage persistence, and business logic on the client side.

## Model Index (`index.ts`)

Re-exports all models. Import from `models/` not individual files.

## Order (`Order.model.ts`)

Represents one trade contract. Mirrors the backend Order model.

**Key fields** (subset):

- `id`, `shortAlias`, `reference` — identifiers
- `type`: 0=BUY, 1=SELL (from maker's perspective)
- `status`: 0–18 (matches backend status integers)
- `currency`, `amount`, `has_range`, `min_amount`, `max_amount`
- `is_explicit`, `premium`, `satoshis` — pricing
- `is_fiat_sent`, `is_disputed` — trade state flags
- `maker_nick`, `taker_nick`, `maker_hash_id`, `taker_hash_id`
- `maker_status`, `taker_status`: `"Active"` | `"Seen recently"` | `"Inactive"`
- `bond_invoice`, `escrow_invoice`, `payout_invoice` — invoice strings
- `chat_last_index` — last seen chat message index

**Methods**:

- `make(coordinator, garage, amount?)` — POST `/api/make/` to create order
- `take(coordinator, garage, amount?)` — POST `/api/order/` with action `"take"`
- `submitAction(coordinator, garage, action, body?)` — generic order action (confirm_fiat, dispute, cancel, etc.)
- `fecth(coordinator, garage)` — GET `/api/order/` (note: intentional typo in codebase, do not "fix")
- `nullify()` — reset to empty state

**Status integers** (same as backend):
`WFB=0, PUB=1, PAU=2, TAK=3, UCA=4, EXP=5, WF2=6, WFE=7, WFI=8, CHA=9, FSE=10, DIS=11, CCA=12, PAY=13, SUC=14, FAI=15, WFR=16, MLD=17, TLD=18`

## Robot (`Robot.model.ts`)

Represents a robot identity on a specific coordinator.

**Fields**:

- `token`, `tokenSHA256`: raw token + hash for anonymous auth
- `pubKey`, `encPrivKey`: PGP keypair (public key + encrypted private key)
- `nostrPubKey`: for Nostr DM notifications
- `activeOrderId`, `lastOrderId`: current/previous order
- `found`: whether robot exists on coordinator
- `loading`: async fetch in progress
- `earned_rewards`, `wants_stealth`

**Methods**:

- `getAuthHeaders()` — returns `{ Authorization: "Token {tokenSHA256}", ... }` for API calls
- `fetchRobot(coordinator, token)` — GET `/api/robot/`, populates fields
- `fetchReward(coordinator, invoice)` — POST `/api/reward/` to claim earned sats
- `fetchStealth(coordinator, wantsStealth)` — POST `/api/stealth/`

## Slot (`Slot.model.ts`)

Container for a single robot token across multiple coordinators. One Slot = one identity that can trade with any coordinator.

**Fields**:

- `token`, `hashId`, `nickname`, `nostrPubKey`, `nostrSecKey` — identity
- `robots`: `Record<shortAlias, Robot>` — one Robot instance per coordinator
- `activeOrderShortAlias`, `lastOrderShortAlias` — which coordinator has the active order

**Methods**:

- `fetchRobot(coordinator, systemClient)` — creates/updates Robot for given coordinator
- `fetchActiveOrder(coordinator)` — polls Order status
- `syncCoordinator(coordinator)` — ensures robot exists on coordinator

## Garage (`Garage.model.ts`)

Collection of all robot Slots. Persisted to localStorage.

**Fields**:

- `slots`: `Slot[]` — all stored robot identities
- `currentSlot`: active slot index
- `onSlotUpdate`: hook callback for external subscribers

**Methods**:

- `createRobot(token, coordinator, systemClient)` — add new slot
- `deleteSlot(index, systemClient)` — remove slot + clear localStorage
- `getSlot(index?)` — get slot by index (defaults to currentSlot)
- `loadSlots(systemClient)` — restore from localStorage on startup
- `save(systemClient)` — persist current state

## Federation (`Federation.model.ts`)

Collection of Coordinator instances. Aggregates orders into a unified book.

**Fields**:

- `coordinators`: `Record<shortAlias, Coordinator>` — all known coordinators
- `book`: `Order[]` — aggregated public orders
- `exchange`: aggregated exchange rate info

**Methods**:

- `getCoordinator(shortAlias)` → `Coordinator`
- `getCoordinatorsAlias()` → `string[]`
- `loadBook(coordinator?)` — fetch orders from one or all coordinators
- `setBook(orders)` — replace aggregated book

**Lottery**: coordinator order is randomized to distribute traffic fairly.

## Coordinator (`Coordinator.model.ts`)

One coordinator instance. Largest model (~1000 lines).

**Fields**:

- `shortAlias`, `longAlias`, `url` — identity and URL
- `info`: version, fees, limits, volume stats from `/api/info/`
- `contact`: email, telegram, nostr, PGP key, matrix, website
- `testnet` / `mainnet`: URL objects for each network
- `book`: `Order[]` — this coordinator's public orders
- `exchange`: current price info
- `limits`: min/max per currency

**Methods**:

- `fetchInfo(systemClient)` — GET `/api/info/`, updates limits/fees/version
- `loadBook(systemClient)` — GET `/api/book/`, populates `book`
- `getExchangeRate(currency)` — fiat/BTC rate for given currency

## Settings (`Settings.model.ts`)

User preferences, persisted via systemClient.

**Fields**:

- `mode`: `"light"` | `"dark"`
- `fontSize`: integer
- `language`: BCP-47 string
- `network`: `"mainnet"` | `"testnet"`
- `useProxy`, `connection`: network settings
- `freezeViewports`: pro mode layout lock

Defaults vary by deployment type (`web-basic`, `web-pro`, `self-hosted`). Do not hardcode defaults — read from `Settings.defaultValues`.

## Maker (`Maker.model.ts`)

Form state for order creation. Not persisted — lives in GarageContext.

All order creation parameters: `type`, `currency`, `amount`, `has_range`, `min_amount`, `max_amount`, `is_explicit`, `premium`, `satoshis`, `payment_method`, `bond_size`, `public_duration`, `escrow_duration`, `latitude`, `longitude`, `is_advanced`.

## Book (`Book.model.ts`)

Lightweight order data for book display (subset of Order fields).
Used in BookTable and DepthChart — does not include sensitive trade details.
