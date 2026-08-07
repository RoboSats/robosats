# /frontend/src/basic — BasicMain SPA Shell

## Purpose

`BasicMain` is the primary product surface for all shipping targets (web-basic,
selfhosted-basic, desktop-basic, mobile-basic). It provides the single-page routing
shell and page-level layout for the core user flow:
robot identity → offers → order → trade.

## File Map

| File / Dir      | Role                                                                |
| --------------- | ------------------------------------------------------------------- |
| `Main.tsx`      | Root — renders `<NavBar/>` + `<Routes/>`, wraps in `<MainDialogs/>` |
| `Routes.tsx`    | React Router hash-router: defines all page routes                   |
| `index.ts`      | Barrel export of all pages + `MainDialogs`, `NavBar`                |
| `BookPage/`     | Wraps `<BookTable/>` — browse/filter the order book                 |
| `MakerPage/`    | Wraps `<MakerForm/>` — create a new order                           |
| `NavBar/`       | Navigation bar (AppBar + mobile FAB logic)                          |
| `OrderPage/`    | Wraps `<TradeBox/>` + `<OrderDetails/>` — live trade state          |
| `RobotPage/`    | Garage — robot identity, active slot, token management              |
| `SettingsPage/` | User preferences + custom coordinator (power-user)                  |
| `TopBar/`       | Top-bar chrome used by some pages                                   |
| `MainDialogs/`  | Global overlay dialogs (not page-routed)                            |

## Routes (from `Routes.tsx`)

| Path                          | Component         | Notes                                                           |
| ----------------------------- | ----------------- | --------------------------------------------------------------- |
| `/garage/:token?`             | `<RobotPage/>`    | Optional token param for deep-link robot load                   |
| `/garage`                     | `<RobotPage/>`    | Alias                                                           |
| `/`                           | `<RobotPage/>`    | Root redirect → garage                                          |
| `` (empty)                    | `<RobotPage/>`    | Fallback                                                        |
| `/offers`                     | `<BookPage/>`     | Public order book                                               |
| `/create`                     | `<MakerPage/>`    | Create order                                                    |
| `/order/:shortAlias/:orderId` | `<OrderPage/>`    | Active trade — `shortAlias` is frontend-only (not an API param) |
| `/settings`                   | `<SettingsPage/>` | Settings                                                        |

There is **no `/coordinator` route** in BasicMain — coordinator info is exposed via
dialogs and the Pro `Federation` widget.

## Android Deep-Link Handshake (`Routes.tsx`)

When the Android app receives a push notification and navigates to a trade, it sets
`window.AndroidDataRobosats` to a path string before the React app reads it:

```ts
const orderPath = window.AndroidDataRobosats;
if (orderPath) {
  const [coordinator, orderId] = orderPath.split('/');
  const slot = garage.getSlotByOrder(coordinator, parseInt(orderId, 10));
  if (slot) {
    garage.setCurrentSlot(slot.token);
    navigateToPage('order/' + coordinator + '/' + orderId);
  }
  window.AndroidDataRobosats = undefined; // consume once
}
// Also: pathPage === 'index.html' → navigateToPage('garage')
```

`window.AndroidDataRobosats` is consumed exactly once and then cleared.

## Page Components

### `RobotPage` (Garage)

- Displays the current robot (avatar, nickname, hash ID) from the active `Garage` slot.
- Token generation creates a new slot; existing slots remain until explicitly removed.
- **Token loss = no recovery** — there is no recovery UI; ephemeral identity is a product
  privacy invariant.
- Shows "One active order #{{orderID}}" when `robot?.activeOrderId` is set.

### `OrderPage`

- Wraps `<TradeBox/>` and `<OrderDetails/>` — the live trade management surface.
- Route param `:shortAlias` identifies the coordinator; `:orderId` identifies the order.
  `shortAlias` is a frontend routing parameter only — it is **not** passed to
  `POST /api/order/`.

### `SettingsPage`

- Custom coordinator entry (power-user escape hatch in a sub-section) — reachable from
  Settings but not prominently advertised.

## NavBar Behaviour

- `AppBar` (mobile/narrow): FAB navigates to `'order'` if `slot?.activeOrder` exists,
  else `'create'`.
- Navigation reflects coordinator-reported `slot.activeOrder`; it does not enforce
  business rules.

## `entryPage`

`entryPage` from `AppContext` determines the initial route: always `'garage'` for mobile,
otherwise preserves the current path (or defaults to `'garage'`). This ensures mobile
users always start at the robot identity screen — required before making any trade.

## Product Intent

- **BasicMain must never regress** — it is the only UI surface on desktop/mobile and the
  default for selfhosted. All fixes must work in BasicMain before being considered done.
- **The garage (`RobotPage`) is the mandatory first step** — `entryPage: 'garage'` on
  mobile enforces this; every session begins here by product design.
- **Nostr-first book** — `FederationContext` serves the order book via Nostr by default
  (`settings.connection === 'nostr'`); REST is the fallback.
- **`MainDialogs` for secondary content** — global dialogs overlay any page without
  polluting the URL space, avoiding back-button confusion on mobile.

## Traps

- `BasicMain` is rendered by `App.tsx` only when `isPro === false` — `isPro` is derived
  from `settings.frontend === 'pro'` which is loaded asynchronously. There is a brief
  render with default settings before async load completes.
- `window.AndroidDataRobosats` is cleared to `undefined` after being read — do not
  access it twice; the second read returns `undefined`.
- Route `:shortAlias` in `/order/:shortAlias/:orderId` is a **frontend routing parameter
  only** — it must never be forwarded as a query param to `POST /api/order/`.

## Constraints

- Never add a token recovery UI to `RobotPage` — ephemeral robot identity is a product
  invariant.
- Do not add one-active-order enforcement to navigation — surface `slot.activeOrder`
  as-is from the coordinator.
- BasicMain pages must work correctly without `ProMain` being loaded — no cross-dependency.
- Do not add a `/coordinator` route to BasicMain without product sign-off — coordinator
  details are surfaced through dialogs and the Pro `Federation` widget.
