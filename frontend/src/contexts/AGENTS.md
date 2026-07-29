# /frontend/src/contexts — Global React State

## Purpose

Three layered context providers manage all global application state. No Redux — state flows down via React Context and is mutated only through setter functions exposed by each provider.

## Provider Composition Order

```
AppContextProvider            ← outermost
  └── FederationContextProvider
        └── GarageContextProvider
              └── UI (BasicMain or ProMain)
```

Order matters: lower contexts can read from higher ones, not vice versa.

## AppContext (`AppContext.tsx`)

Top-level app-wide state. Available everywhere.

**UI state**:

- `theme`: `"dark"` | `"light"` — MUI theme mode
- `windowSize`: `{ width, height }` — responsive layout
- `currentPage`: active page identifier for BasicMain navigation
- `openDialogs`: record of open modal dialogs by key

**Settings** (persisted to localStorage via `systemClient`):

- `language`, `fontSize`, `mode` (basic/pro), `network` (mainnet/testnet)
- `useProxy`, `connection`, `freezeViewports`

**Platform info**:

- `clientVersion`: frontend semver
- `hostUrl`: coordinator base URL
- `isMobile`, `windowWidth`: breakpoint flags
- `torStatus`: Tor circuit status (web only)

**Timestamps** — used to trigger context refreshes:

- `slotUpdatedAt`, `federationUpdatedAt`, `notificationsUpdatedAt`

**Favorites**: recently used payment methods and currencies

## GarageContext (`GarageContext.tsx`)

Manages the robot garage (collection of robot slots) and trade polling.

**State**:

- `garage`: `Garage` model instance — all robot slots, persisted to localStorage
- `maker`: current `Maker` form state for order creation
- `activeSlot`: currently selected robot slot index

**Auto-refresh polling**:
Polls active orders with status-dependent delays. Never add blocking operations to this loop.

```
Status-based delays (seconds):
  WFB, TAK, WF2, WFE, WFI  →  3s (bond/escrow pending)
  PUB, PAU                  →  30s (waiting for taker)
  CHA, FSE, DIS             →  10s (active trade)
  PAY                       →  5s (payment in flight)
  SUC, FAI, EXP, UCA, CCA  →  999s (terminal — stop polling)

Off-page multiplier: delay × 5 when user is not on OrderPage
```

Polling resets to shortest applicable delay on page navigation.

**Key actions**:

- `createRobot(token, coordinator)` — generate new robot slot
- `deleteSlot(slotIndex)` — remove slot from garage
- `fetchActiveOrder(slot)` — triggers order status refresh
- `setMaker(partial)` — update maker form fields

**Hooks pattern**:
Register `onSlotUpdate` callback to react to slot changes outside React render cycle.

## FederationContext (`FederationContext.tsx`)

Manages the list of coordinators and their public order books.

**State**:

- `federation`: `Federation` model instance — all known coordinators
- `sortedCoordinators`: coordinator list in randomized (lottery) order
- `book`: aggregated public orders from all coordinators
- `loading`: book loading state

**Key behaviors**:

- Loads coordinator info from `coordinators.json` (bundled) + fetches live `/api/info/` per coordinator
- Fetches public order book when user navigates to BookPage
- Subscribes to Nostr relay for real-time order updates
- Tracks connection status per coordinator (API vs Nostr)

**Key actions**:

- `setBook(orders)` — replace book contents
- `fetchBook()` — trigger full book refresh from all coordinators
- `getCoordinator(shortAlias)` — look up coordinator by alias

## Agent Guidelines

- **Do not** add synchronous operations to polling loops — they run on a tight interval
- State setters from contexts are stable references (wrapped in `useCallback`) — safe to use as effect dependencies
- `slotUpdatedAt` / `federationUpdatedAt` are Date timestamps — compare with `>` not `===`
- Persist settings changes immediately via `systemClient.setItem()` — context state and localStorage must stay in sync
- The `garage` object is mutated in place then a new reference is assigned to trigger re-render — treat it as immutable from component code
