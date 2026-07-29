# /frontend/src/components — UI Components

## Purpose

Reusable React components shared across BasicMain and ProMain. Organized by feature area, not by atomic design level.

## Top-Level Components

| Directory / File    | Role                                                 |
| ------------------- | ---------------------------------------------------- |
| `TradeBox/`         | Main trading interface — bonds, chat, status prompts |
| `BookTable/`        | Public order book table with filters                 |
| `MakerForm/`        | Order creation form                                  |
| `OrderDetails/`     | Order summary view                                   |
| `Charts/`           | DepthChart, MapChart, NivoScheme                     |
| `Dialogs/`          | All modal dialogs                                    |
| `FederationTable/`  | Coordinator list and status                          |
| `RobotAvatar/`      | Robot avatar image wrapper                           |
| `RobotInfo/`        | Robot profile display                                |
| `SettingsForm/`     | Settings panel                                       |
| `PaymentMethods/`   | Payment method selector/display                      |
| `Map/`              | F2F order map display                                |
| `DataGrid/`         | Generic data grid wrapper                            |
| `Icons/`            | Custom icon components                               |
| `HostAlert/`        | Self-hosted coordinator warning banner               |
| `ErrorBoundary.tsx` | Top-level React error boundary                       |

## TradeBox (`TradeBox/index.tsx`)

The most complex component. Renders the full trade lifecycle UI for an active order.

**Sub-components**:

- `Prompts/` — one component per order status:
  - `LockInvoice.tsx` — show bond/escrow invoice QR
  - `TakerFound.tsx` — taker confirmed, waiting for bonds
  - `EscrowWait.tsx` — waiting for trade escrow to lock
  - `Chat.tsx` — fiat exchange chat wrapper
  - `Payout.tsx` — submit buyer Lightning invoice or Bitcoin address
  - `PayoutWait.tsx` — waiting for coordinator to pay buyer
  - `SendingSats.tsx` — payment in flight
  - `Successful.tsx` — trade complete
  - `RoutingFailed.tsx` — Lightning routing failure
  - `Dispute.tsx` / `DisputeLoser.tsx` / `DisputeWinner.tsx` / `DisputeWaitPeer.tsx` / `DisputeWaitResolution.tsx`
  - `Expired.tsx`, `Paused.tsx`, `PublicWait.tsx`
- `EncryptedChat/` — chat implementations (see below)
- `Forms/` — trade action forms (dispute statement, cancel confirmation, etc.)
- `Dialogs/` — trade-specific dialogs
- `BondStatus.tsx` — bond lock progress indicator
- `TradeSummary.tsx` — fee breakdown and trade summary
- `WalletsButton.tsx` — Lightning wallet integration shortcuts
- `CancelButton.tsx` / `CollabCancelAlert.tsx` — cancel flow

The active Prompt is selected by mapping `order.status` integer to the corresponding component.

## EncryptedChat (`TradeBox/EncryptedChat/`)

Three implementations of the same chat interface:

| Implementation | File                   | Transport                   |
| -------------- | ---------------------- | --------------------------- |
| Socket         | `EncryptedSocketChat/` | WebSocket (preferred)       |
| API            | `EncryptedApiChat/`    | REST polling fallback       |
| Nostr          | `EncryptedNostrChat/`  | Nostr relay (decentralized) |

All implementations:

- Decrypt incoming PGP messages using robot's private key
- Encrypt outgoing messages to both own and peer public keys
- Display messages via `MessageCard/` component
- Show `ChatHeader/` with peer info and connection status

Swap implementations via a `chatType` prop — do not fork logic between them.

## Dialogs (`Dialogs/`)

All modals rendered in `MainDialogs` (BasicMain) or inline in widgets (ProMain).

Key dialogs:

- `Profile.tsx` — robot stats and settings
- `Coordinator.tsx` — coordinator info and stats
- `Exchange.tsx` — current exchange rate info
- `Community.tsx` — social links
- `AuditPGP.tsx` — PGP key audit for chat integrity
- `StoreToken.tsx` — robot token backup warning
- `EnableTelegram.tsx` — Telegram notification setup
- `F2fMap.tsx` — face-to-face meeting map
- `OrderDescription.tsx` — order details summary
- `CancelOrder.tsx` — cancellation confirmation
- `Recovery.tsx` — recover robot from token
- `NoRobot.tsx` — no active robot state

## Charts (`Charts/`)

- `DepthChart/` — order book depth visualization (Recharts) — used in ProMain widget
- `MapChart/` — world map with F2F order pins (GeoJSON + D3)
- `NivoScheme/` — color scheme for Nivo charts
- `helpers/` — shared chart utilities

## BookTable

Displays public orders from `FederationContext.book`. Supports filtering by:

- Currency
- Order type (buy/sell)
- Payment method
- Amount range

Clicking a row navigates to the order or opens take dialog.

## MakerForm

Driven by `GarageContext.maker` state. Validates limits from coordinator `Coordinator.limits` before allowing submission. Calls `Order.make()` on submit.

## Agent Guidelines

- Prompt components are state-display only — they should not fetch data, only dispatch actions via `order.submitAction()`
- Never duplicate status integer checks — import status constants from `models/Order.model.ts`
- Chat components must unmount their WebSocket on cleanup (return cleanup function from useEffect)
- `RobotAvatar` fetches from coordinator URL — always pass `coordinator` prop, never hardcode URLs
- Dialog open state lives in `AppContext.openDialogs` — use context setters, not local state, for dialogs that need to be triggered from multiple places
