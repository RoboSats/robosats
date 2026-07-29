# /frontend/src/components — Shared UI Components

## Purpose

Reusable React components used across BasicMain and ProMain. Major components:
`TradeBox` (trade state machine UI), `MakerForm` (order creation), `BookTable` (order
book), `EncryptedChat` (three transport implementations), `RobotAvatar`, `RobotInfo`,
`FederationTable`, `OrderDetails`, and supporting dialogs/widgets.

## Component Map

| Directory / File    | Role                                                                                             |
| ------------------- | ------------------------------------------------------------------------------------------------ |
| `TradeBox/`         | Central trade UI — maps all 19 `Order.Status` values to user-facing prompts and actions          |
| `MakerForm/`        | Order creation form — amount, currency, premium, payment method, duration, bond size             |
| `BookTable/`        | Filterable, sortable order book table                                                            |
| `OrderDetails/`     | Order summary card + `TakeButton`                                                                |
| `EncryptedChat/`    | Chat UI — three transport implementations (see below)                                            |
| `RobotAvatar/`      | Deterministic robot avatar; `placeholder.json` swapped for `placeholder_highres.json` on Android |
| `RobotInfo/`        | Active order summary shown in robot profile; "One active order #{{orderID}}"                     |
| `FederationTable/`  | Coordinator list table with ratings column, "Verify ratings" button                              |
| `Dialogs/`          | Global confirmation dialogs — branches `hasRobot ? StoreTokenDialog : NoRobotDialog`             |
| `HostAlert/`        | Clearnet-use warning suite — `index.tsx`, `SelfhostedAlert.tsx`, `UnsafeAlert.tsx`               |
| `SettingsForm/`     | Settings form shared between BasicMain `SettingsPage` and ProMain `Settings` widget              |
| `Charts/`           | Chart components (used by ProMain `Depth` widget)                                                |
| `DataGrid/`         | Data grid wrapper                                                                                |
| `Map/`              | Leaflet map component for F2F order geolocation picker                                           |
| `PaymentMethods/`   | Payment method icons and display helpers                                                         |
| `Icons/`            | Custom SVG icon components                                                                       |
| `ErrorBoundary.tsx` | React error boundary for uncaught render errors                                                  |

There are **no `TorIndicator/` or `TradeSteps/` directories** — these do not exist.
`NavBar` lives in `src/basic/NavBar/`, not in `components/`.

## TradeBox

The main trade UI component. Consumes `Order.Status` (0–18) and renders the appropriate
prompt, action buttons, timers, and sub-components (chat, invoice input, fiat-sent
confirmation, dispute button, etc.). The 19 backend statuses are deliberately collapsed
into ~8 user-visible states — extra granularity is for coordinator/Lightning operations,
not user decisions. All trade actions dispatch to `POST /api/order/` via `apiClient`.

**Coordinator rating (`TradeBox/Prompts/Successful.tsx`):**
After a successful trade (`SUC`), `Successful.tsx` shows a 5-star coordinator rating
widget. This widget is `disabled={settings.connection !== 'nostr'}` — ratings can only
be published in Nostr mode. Flow:

1. Calls `slot.getRobot(order.shortAlias)?.loadReviewToken(federation, setCoordinatorToken)`
   → `POST /api/review/` to get a coordinator-signed token.
2. On rating change (`useEffect` on `[hostRating]`): publishes a Nostr kind 31986 event
   with tags `sig=token, d={shortAlias}:{orderId}, p=coordinatorPubKey, rating=hostRating/5`.
3. Aborts if the token is missing (`'Missing coordinator token'`) or rating out of range
   (`'Rating not valid'`).

Platform rating (separate from coordinator rating): `rateUserPlatform` in
`TradeBox/index.tsx` → `POST /api/order/ { action: 'rate_platform', rating }`.

## MakerForm

Order creation form. Key product rules enforced client-side (mirrors coordinator validation):

- Premium bounds from coordinator `/api/limits`
- Range order min/max amount validation
- F2F orders require `latitude`/`longitude` — `<Map/>` picker shown
- Duration defaults encode product policy
- `hasRobot={Boolean(garage.getSlot()?.hashId)}` gate — if no robot, `Confirmation.tsx`
  prompts to generate one (no order creation attempted). No separate one-active-order gate.

## TakeButton (`OrderDetails/TakeButton.tsx`)

- `hasRobot={Boolean(garage.getSlot()?.hashId)}` — if no robot, `NoRobotDialog` shown.
- Penalty cooldown: when `Robot.penalty_expiration` is active, button `disabled={true}`
  with tooltip `'Wait until you can take an order'`.
- **No client-side check for an existing active order** — the coordinator rejects a second
  order; the frontend surfaces this post-attempt.

## EncryptedChat — Three Implementations

All in `TradeBox/EncryptedChat/`:

| Component             | Transport                   | Status                                       |
| --------------------- | --------------------------- | -------------------------------------------- |
| `EncryptedSocketChat` | Django Channels WebSocket   | **Primary** — preferred                      |
| `EncryptedApiChat`    | REST polling (`/api/chat/`) | Fallback when WebSocket unavailable          |
| `EncryptedNostrChat`  | Nostr relay DMs             | **Under development** — not production-ready |

Also in `TradeBox/EncryptedChat/`:

- `ChatHeader/` — shared header bar for all three implementations
- `MessageCard/` — message bubble component
- `ImageLightbox.tsx` — full-screen image overlay for chat image messages
- `PrivacyWarningDialog.tsx` — shown before first message, warns about metadata

Messages are PGP-encrypted client-side before sending; the server stores ciphertext only.
See `src/pgp/AGENTS.md` for encryption details.

## FederationTable

Shows the list of active coordinators with a ratings column (`field: 'rating'`, avg ×5
stars + `(count)`). Includes a **"Verify ratings"** button that triggers
`federation.loadRatings(true)` — re-subscribes to Nostr kind 31986 events and
schnorr-verifies every signature, filtering out invalid ones. Warning text:
_"Verifying all ratings might take some time; this window may freeze for a few seconds
while the cryptographic certification is in progress."_

## HostAlert

- `index.tsx` — selects which alert to show based on client type.
- `UnsafeAlert.tsx` — shown when `settings.unsafeClient = true`; discourages clearnet use.
- `SelfhostedAlert.tsx` — shown on selfhosted client.
  These are not bugs or over-engineering — they actively discourage clearnet use for privacy.

## Dialogs / `Confirmation.tsx`

`return hasRobot ? <StoreTokenDialog .../> : <NoRobotDialog .../>` — props: `onClickDone`,
`hasRobot`, `onClickGenerateRobot`. The "generate robot" path is shown to any user without
a robot in the current garage slot; it is not a one-active-order guard.

## Product Intent

- **TradeBox prompt collapsing is intentional** — 19 backend statuses → ~8 user states;
  the granularity is for coordinator/LN ops, not user decisions.
- **MakerForm validation rules are product policy** — mirror coordinator `/api/limits`;
  must stay in sync or the UX breaks (client allows, coordinator rejects).
- **Coordinator rating gated on Nostr mode** — kind 31986 events only make sense when
  Nostr connectivity is active; rating in REST-only mode would have no delivery channel.
- **Platform rating vs coordinator rating are separate flows** — `rate_platform` updates
  the coordinator's `Robot.platform_rating` via REST; coordinator Nostr rating publishes
  a kind 31986 event to the Nostr relay. Both happen in `Successful.tsx`/`TradeBox`.
- **Nostr chat is under development** — do not make `EncryptedNostrChat` the default
  transport or present it as production-ready.
- **Password/private orders** (when `order.password` is set) are shared out-of-band via
  link+password — they never appear on the public book. `MakerForm` password field enables
  this flow.

## Traps

- `RobotAvatar` imports `placeholder.json` on web but `placeholder_highres.json` on Android
  (webpack `file-replace-loader`) — do not hard-code the placeholder path.
- Chat transport selection is done by `TradeBox` — do not add UA-based transport switching
  inside `EncryptedChat` components.
- Coordinator rating widget is `disabled` unless `settings.connection === 'nostr'` — do
  not assume it is always interactive.
- `FederationTable`'s "Verify ratings" can freeze the UI for several seconds on Tor — the
  user warning is intentional.

## Constraints

- Do not add one-active-order enforcement to `TakeButton` or `MakerForm` — coordinator logic.
- Do not make `EncryptedNostrChat` the default transport until production-ready.
- Keep `MakerForm` validation in sync with coordinator `/api/limits`.
- Do not add a token recovery UI — ephemeral robot identity is a product invariant.
- Do not add `TorIndicator/` or `TradeSteps/` — these components do not exist.
