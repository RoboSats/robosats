# /api — Django REST API (agent reference)

Core backend app: trade state machine, Lightning orchestration, notifications, Nostr, admin.
Child docs (load on demand): `api/models/AGENTS.md`, `api/lightning/AGENTS.md`,
`api/management/commands/AGENTS.md`, `api/nick_generator/AGENTS.md`, `api/tests/AGENTS.md`,
`api/migrations/AGENTS.md`.

## File → role
| File | Role |
|---|---|
| `logics.py` | `Logics` — all trade-state mutation, fee/bond math. Called from `views.py`, never reverse |
| `views.py` | DRF ViewSets, thin — delegate to `Logics`, inject `TAK` pseudo-status |
| `serializers.py` | Validation, incl. `UpdateOrderSerializer.action` dispatch |
| `tasks.py` | Celery tasks |
| `notifications.py` | `Notifications` — multi-channel fan-out |
| `nostr.py` | `Nostr` — order events (kind 38383) + encrypted DMs |
| `admin.py` | Django admin, incl. fund-moving dispute-resolution actions |
| `utils.py` | Price aggregation, base91, PGP clearsign validation |
| `errors.py` | `new_error(code)` — decade-coded error responses |
| `oas_schemas.py` | drf-spectacular overrides, reads live settings at import |

## Endpoints (`urls.py`)
| Endpoint | Method | View | Notes |
|---|---|---|---|
| `/api/schema/` | GET | `SpectacularAPIView` | OpenAPI schema |
| `/api/` | GET | `SpectacularRedocView` | Redoc UI |
| `/api/make/` | POST | `MakerView` | Create order, returns maker bond invoice |
| `/api/order/` | GET/POST | `OrderView` | GET reads state; POST is single dispatch (below) |
| `/api/robot/` | GET/PUT | `RobotView` | Robot profile/settings |
| `/api/book/` | GET | `BookView` | Public order book |
| `/api/info/` | GET | `InfoView` | Coordinator info: version, fees, limits, `devfund` |
| `/api/price/` | GET | `PriceView` | Current market rates |
| `/api/limits/` | GET | `LimitView` | Min/max order size per currency |
| `/api/reward/` | POST | `RewardView` | Claim `earned_rewards` via invoice |
| `/api/historical/` | GET | `HistoricalView` | Aggregated trade volume history |
| `/api/ticks/` | GET | `TickView` | `MarketTick` history |
| `/api/stealth/` | POST | `StealthView` | Toggle stealth invoice descriptions — POST-only |
| `/api/chat/` | GET/POST | `chat.views.ChatView` | Owned by `chat/`, mounted here |
| `/api/notifications/` | GET | `NotificationsView` | In-app notifications |
| `/api/review/` | POST | `ReviewView` | Nostr-signed proof-of-trade token for coordinator rating |

`GET /api/info/` exposes `devfund` (percentage, `DEVFUND` × 100) — the coordinator's real
DevFund donation. Public, additive field; used by the frontend to live-overlay the
federation lottery weight (`donatesToDevFund`) with the coordinator's actual value,
falling back to `frontend/static/federation.json` when `/api/info/` is unreachable.

No `shortAlias` param exists on `/api/order/` — do not invent one. **`POST /api/order/`**
dispatches on `UpdateOrderSerializer.action`: `pause, take, update_invoice, update_address,
submit_statement, dispute, cancel, confirm, undo_confirm, rate_platform`. Optional
`cancel_status` is an optimistic-concurrency guard — `Logics.cancel_order` rejects if
`order.status != cancel_status`.

## Order state machine
19 statuses in `api/models/order.py` — see `api/models/AGENTS.md` for the full enum, expiry
reasons, `t_to_expire` table.

```
WFB(0) → PUB(1) ⇄ PAU(2)
PUB(1) --[take]--> WF2(6) --[finalize_contract]-->  (TakeOrder row; TAK never persisted)
WF2(6) → [WFE(7) xor WFI(8)] → CHA(9) ⇄ FSE(10) → PAY(13) → SUC(14)
                                            ↘ DIS(11) → WFR(16) → MLD(17) / TLD(18)
Side statuses: UCA(4) unilateral cancel, EXP(5) timeout, CCA(12) collaborative cancel,
FAI(15) LN routing failure (retryable back to PAY).
```

**`TAK(3)` never persisted** — real transition is `PUB → WF2` (`Logics.finalize_contract`,
via `follow_invoices.py` on taker-bond lock); `views.py` injects `TAK` only when a live
`TakeOrder` row exists (view-layer projection). Only **escrow settlement** (`settle_escrow`
via `confirm_fiat`) is irreversible; `PAU ⇄ PUB`, `FSE → CHA` (`undo_confirm_fiat_sent`),
`FAI → PAY` (retry) are reversible. `SUC`/`FAI` decided in node layer, not `logics.py`.
`maker_wins`→`TLD`, `taker_wins`→`MLD`, both reachable directly from `DIS`/`WFR` via admin.

## Bond mechanics
3 hold invoices (`LNPayment.Types.HOLD`) per trade: **maker bond** (`MAKEBOND`, before
`PUB`), **taker bond** (`TAKEBOND`, locking drives `WF2`), **trade escrow** (`TRESCROW`,
seller's full amount, settled in `confirm_fiat`). `bond_size`: per-order `Decimal`, default
`settings.DEFAULT_BOND_SIZE`, clamped `MIN_BOND_SIZE`/`MAX_BOND_SIZE`, % of `last_satoshis`.
Losing robot's bond is **settled** to coordinator; counterparty compensated via
`add_slashed_rewards` (split rationale, fee splits, proceeds math: see Product intent below
and `api/models/AGENTS.md`'s **Trade economics**).

## Logics — key methods (`logics.py`)
- `take()` / `kick_taker()` — pre-take `TakeOrder` lifecycle; `kick_taker` sets
  `PENALTY_TIMEOUT` (anti-DDoS, see Product intent)
- `finalize_contract(take_order)` — taker bond locked → contract final, `last_satoshis` frozen
- `gen_maker_hold_invoice()` / `gen_taker_hold_invoice()` / `gen_escrow_hold_invoice()`
- `settle_escrow()`/`return_escrow()`/`cancel_escrow()`/`settle_bond()`/`return_bond()`/
  `cancel_bond()` — escrow/bond outcome primitives (mostly bare functions, no `cls`/`self`)
- `pay_buyer(order)` — flips payout to `FLIGHT` (LN) or `QUEUE` (swap); send happens in
  `follow_invoices.py`
- `confirm_fiat()` / `undo_confirm_fiat_sent()` — fiat-sent state, drives escrow settlement
- `cancel_order()` / `collaborative_cancel()` — branches per status; post-escrow
  collaborative cancel is **always free** (see Product intent — `oas_schemas.py`'s "future
  cost" text is stale)
- `open_dispute()` / `automatic_dispute_resolution()` / `dispute_statement()` — dispute flow;
  auto-resolution short-circuits when one side never wrote in chat (char limits: see Traps)
- `order_expires()` — general timeout handler, branches per status; CHA/FSE timeout
  **auto-opens a dispute** (see Product intent)
- `calc_sats()` / `satoshis_now()` / `price_and_premium_now()` — fiat↔sats conversion
- `compute_cltv_expiry_blocks()`, `create_onchain_payment()`/`update_address()` — on-chain
  swap setup (see `api/lightning/AGENTS.md` + Product intent)
- `compute_proceeds()`, `add_slashed_rewards()`, `withdraw_rewards()`, `summarize_trade()` —
  trade economics, documented in `api/models/AGENTS.md`

## Celery (`tasks.py`) + beat (`robosats/celery/__init__.py`)
| Beat key | Task name | Schedule | Owner |
|---|---|---|---|
| `cache-market-prices` | `cache_external_market_prices` (fn `cache_market`) | 60s | api |
| `users-cleansing` | `users_cleansing` | daily `crontab(0,0)` | api |
| `lnpayments-cleansing` | `payments_cleansing` | daily `crontab(0,0)` | api |
| `chatrooms-cleansing` | `chatrooms_cleansing` | daily `crontab(0,0)` | `chat/` |
| `do-accounting` | `do_accounting` | daily `crontab(23,59)` | `control/` |
| `compute-node-balance` | `compute_node_balance` | 60 min | `control/` |

`cache_market`'s registered name differs from its fn name (`cache_market`) — search by
registered name. `users_cleansing` deletes robots +12h old, never traded, no rewards/TG/
webhook (see Product intent — ephemeral robots). On-demand (no beat entry):
`follow_send_payment` (dispatched by `follow_invoices.py`), `send_devfund_donation`,
`nostr_send_order_event`/`nostr_send_notification_event` (both registered `name=""`),
`send_notification` (message-name router only).

## Notifications (`notifications.py`)
`send_notification` (`tasks.py`) is a pure message-name → `Notifications` method router.
Fan-out (in-app record, Telegram, Nostr DM, `.onion` webhook) happens in
`Notifications.send_message`, called per event — except `welcome` (Telegram only; see
Traps for a dispatch bug). Message types: `welcome`, `order_published`,
`order_taken_confirmed`, `fiat_exchange_starts`, `new_chat_message`, `trade_successful`,
`dispute_opened`, `collaborative_cancelled`, `lightning_failed`, `order_expired_untaken`,
`public_order_cancelled`, `coordinator_cancelled`, `dispute_closed`. `new_chat_message`
throttles on `CHAT_NOTIFICATION_TIMEGAP` min (env, default 5) since the prior chatroom
message — except the first message, which always notifies. Webhooks restricted to
`.onion` via `Robot.is_valid_onion_url` (`@staticmethod`, not a model constraint).

## Nostr (`nostr.py`)
Order events (kind 38383), NIP-69 tags: `d, name, k, f, s, amt, fa, pm, premium, source,
expiration, y, network, layer, bond, z` (+`g` only if lat/long set). `get_status_tag` is
binary: `"pending"` only if `status==PUB`, else `"success"`. No order-id tag on the order
event — `d` is `md5(COORDINATOR_ALIAS+order.id)` as UUID (DM event does carry `order_id`).
Password orders (`order.password is not None`) skipped before construction (see Product
intent). DMs via `send_private_msg`; signs with `NOSTR_NSEC`; publishes to one self-hosted
strfry relay (`STRFRY_HOST`/`STRFRY_PORT`) over plain `ws://`.

## Admin actions (`admin.py`) — move real funds, bypass `Logics`
`OrderAdmin.actions`: `cancel_public_order`, `maker_wins`, `taker_wins`,
`return_everything`, `successful_trade`, `compute_median_trade_time` — all credit
`Robot.earned_rewards` directly, bypassing every `Logics` guard (dispute payout intent: see
Product intent). Field-level breakdown in `api/models/AGENTS.md`'s **Admin actions**.
`TokenProxy` admin (`ETokenAdmin`) exposes robot DRF auth tokens in `list_display`.

## Cross-app boundaries
`robosats/middleware.py` runs before every view: validates base91 token header, on first
sight **auto-creates `User`+`Robot`**, nickname via `NickGenerator` (see
`api/nick_generator/AGENTS.md`). `api/` never creates a Robot directly. `chat/` owns
`/api/chat/` + `chatrooms_cleansing`. `control/` owns `BalanceLog` + `do_accounting`/
`compute_node_balance`.

## Supporting modules
`utils.py`: `get_exchange_rates` — median across `MARKET_PRICE_APIS` (env), skips
`bitpay.com`/`criptoya.com` under `USE_TOR`, excludes `ARS` from blockchain.info; also
`base91_to_hex`/`hex_to_base91`, `validate_pgp_keys`/`verify_signed_message`. `errors.py`:
decade→field — 1000s→`bad_request` (default, incl. unlisted 6000s/7000s), 2000s→
`bad_statement`, 3000s→`bad_invoice`, 4000s→`bad_address`, 5000s→`bad_summary`.
`oas_schemas.py` reads bond/duration settings at **import time** — needs app reload on change.

## `/api/review/` — coordinator rating token
`ReviewView.post(request)`:
1. Validates `{ pubkey }` via `ReviewSerializer`.
2. Finds `last_order = Order.objects.filter(maker=user | taker=user).last()` (highest pk).
3. Requires `last_order.status ∈ {SUC, MLD, TLD}` — error 1052 otherwise.
4. Binds `robot.nostr_pubkey = pubkey` on first call (write-once); mismatch → error 1052.
5. Returns `{ pubkey, token: Nostr.sign_message(f"{pubkey}{last_order.id}") }`.
   `Nostr.sign_message` schnorr-signs with `NOSTR_NSEC`, returns hex signature string.

The frontend (`Successful.tsx`) uses `token` as the `sig` tag in a kind 31986 Nostr event.
`verifyCoordinatorToken` on the client reconstructs the message as
`UTF8("${event.pubkey}${orderId}")` and verifies the schnorr signature against the
coordinator's Nostr pubkey.

**Losing a trade (MLD/TLD) does not block review** — intentional. Coordinator
attestation proves the trade happened, not who won; a losing trader can still rate
the coordinator's service.

**`robot.nostr_pubkey` is write-once via this endpoint** — a robot that calls
`/api/review/` once cannot rotate its Nostr pubkey. The field is also set via
`PUT /api/robot/` but the ReviewView check only trusts the first value.

## Product intent (business rationale, not just mechanics)
Collaborative cancel post-escrow is **intentionally free, permanently** —
`oas_schemas.py`'s "future cost" text is stale/aspirational, not a roadmap item. Slashed-
bond split (`SLASHED_BOND_REWARD_SPLIT`, default 0.5) compensates the waiting robot for
wasted time; coordinator keeps the rest for dispute/operational overhead. Dispute winner is
made **whole** (own bond + escrow/payout); loser only forfeits funds — `num_disputes` is the
only intended reputation signal, no separate penalty field is expected. Password-protected
orders are private, direct P2P trades shared out-of-band (link+password) — never meant to
reach the book/federation. On-chain swap payout is a **per-coordinator opt-in** feature
(`DISABLE_ONCHAIN` default on); its fee curve deliberately **rises as on-chain liquidity
drops**, protecting the node wallet from drain. Robot identities are **deliberately
ephemeral/disposable** (one robot per trade, privacy-by-design) — `users_cleansing` reaping
abandoned empties is intended, not a bug. `PENALTY_TIMEOUT` (`kick_taker`) exists to protect
order-book/LN-node availability against takers locking orders without committing a bond —
anti-DDoS, not a reputation flag. Auto-opening a dispute on CHA/FSE timeout (instead of
auto-cancel) is a deliberate pro-safety default favoring human/coordinator review over
automatic resolution once funds sit in escrow.

## Traps
Both nostr Celery tasks registered with empty `name=""`. `send_telegram_message` retries
unbounded (`while True`/`except: pass`). `send_notification` routes
`"taker_expired_b4bond"` to a non-existent method → `AttributeError` if triggered.
`send_notification(message="welcome")` passes an `Order` but `Notifications.welcome`
expects a `User` — likely dead/broken path. `dispute_statement` enforces **100–50,000
chars** (errors 2001/2000) — narrower than `oas_schemas.py`'s "100–5000" and the
serializer's `max_length=500_000`; `logics.py` is authoritative. `update_invoice`'s error
3001 text claims "3 failed attempts" but code only checks `payout.status == EXPIRE`.
`OnchainPayment.Status.CONFI` defined but never assigned. `successful_trade` **overwrites**
(not adds to) `earned_rewards` and also calls `Logics.pay_buyer` — unlike the other
credit-only admin actions. Several `Logics` methods are plain functions with no `self`/
`cls` (`is_buyer`, `is_seller`, `calc_sats`, `settle_bond`, `dispute_statement`) — adding
one breaks call sites. `chat/urls.py` is dead — `/api/chat/` mounts from `api/urls.py`.
`Order.log()` gated by `DISABLE_ORDER_LOGS` — code default `True` vs `.env-sample`'s
`False` disagree. `ReviewView` returns error 1052 for two distinct failure modes (no
completed order AND pubkey mismatch) — clients cannot distinguish them. `Nostr.sign_message`
signs the raw UTF-8 bytes `f"{pubkey}{last_order.id}"` (not a 32-byte hash); the frontend's
`verifyCoordinatorToken` must use the same raw bytes — any hash/encode change to one side
silently breaks verification on the other. `Order.objects.filter(...).last()` in
`ReviewView` uses the **highest pk** (default ordering), not the most recently active order;
a robot whose latest-by-pk order is not `SUC/MLD/TLD` will be blocked even if an earlier
order was successful.

## Constraints
Never settle `trade_escrow` before `order.is_fiat_sent` is confirmed by the buyer. Never
call node gRPC directly — always go through `LNNode` (`api/lightning/`). Don't assume `TAK`
is ever a DB row. Admin dispute actions bypass `Logics` and move real funds — review as
carefully as `Logics` itself. Never add an `Order.Status` member without a `t_to_expire`
entry. Don't add a cost to collaborative cancel, or a loser-penalty field to disputes beyond
`num_disputes`, without confirming the product intent above first.

**Do not** re-credit rewards — a user able to force repeated
exceptions could restore rewards they already received (exploit).

## Rules

- Always update or create integration and/or unitary tests in ../tests
