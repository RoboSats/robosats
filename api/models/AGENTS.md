# /api/models — Django ORM (agent reference)

All models re-exported from `api/models/__init__.py`. `Order` is the central model; this
file owns the **authoritative status enum** referenced from `api/AGENTS.md`.

## `Order.Status` — 19 values, with `t_to_expire(status)` timeout
`t_to_expire` is a method (order.py), not a static table — it returns a dict-lookup per
call. Values below are the *source* of each timeout, not the number (numbers drift).
| Code | Value | Label | Timeout source |
|---|---|---|---|
| WFB | 0 | Waiting for maker bond | env `EXP_MAKER_BOND_INVOICE` (default 300) |
| PUB | 1 | Public | `order.public_duration` field |
| PAU | 2 | Paused | `0` (hardcoded) |
| TAK | 3 | Waiting for taker bond | env `EXP_TAKER_BOND_INVOICE` (default 150) — **never persisted, see below** |
| UCA | 4 | Cancelled (unilateral) | `0` |
| EXP | 5 | Expired | `0` |
| WF2 | 6 | Waiting for escrow + buyer invoice | `order.escrow_duration` field |
| WFE | 7 | Waiting only for seller escrow | `order.escrow_duration` field |
| WFI | 8 | Waiting only for buyer invoice | `order.escrow_duration` field |
| CHA | 9 | Sending fiat — in chatroom | `60*60*settings.FIAT_EXCHANGE_DURATION` |
| FSE | 10 | Fiat sent — in chatroom | `60*60*settings.FIAT_EXCHANGE_DURATION` |
| DIS | 11 | In dispute | `1 day` (hardcoded) |
| CCA | 12 | Collaboratively cancelled | `0` |
| PAY | 13 | Sending satoshis to buyer | `100 days` (hardcoded) |
| SUC | 14 | Successful trade | `100 days` |
| FAI | 15 | Failed LN routing | `100 days` |
| WFR | 16 | Wait for dispute resolution | `100 days` |
| MLD | 17 | Maker lost dispute | `100 days` |
| TLD | 18 | Taker lost dispute | `100 days` |

`Order.ExpiryReasons`: `NTAKEN`(0) not taken, `NMBOND`(1) maker bond not locked,
`NESCRO`(2) escrow not locked, `NINVOI`(3) invoice not submitted, `NESINV`(4) neither.

Don't add a `Status` member without adding a `t_to_expire` entry for it.

## `Order` (order.py) — key fields
`reference` (UUID), `status`, `created_at`, `expires_at`, `expiry_reason`, `type`
(BUY=0/SELL=1), `currency` (FK), `amount`/`min_amount`/`max_amount`/`has_range`,
`payment_method`, `is_explicit`, `premium`, `satoshis`, `public_duration`,
`escrow_duration`, `bond_size` (default `settings.DEFAULT_BOND_SIZE`), `latitude`/
`longitude`, `password`, `description`, `t0_satoshis` (amount at creation), `last_satoshis`
(amount as of last recheck — **the actual escrow/payout basis, frozen at taker-bond-lock**),
`last_satoshis_time`, `contract_finalization_time`, `maker`/`taker` (FK User),
`maker_asked_cancel`/`taker_asked_cancel`, `is_fiat_sent`, `reverted_fiat_sent`,
`is_disputed`, `maker_statement`/`taker_statement`, `is_swap` (LN payout=false / onchain
address=true), `proceeds`, `maker_rated`/`taker_rated`,
`maker_platform_rated`/`taker_platform_rated` (4 distinct rating bools, not 2), `logs`.

**`fiat_exchange_duration` is not a field** — it's `settings.FIAT_EXCHANGE_DURATION`, read
inside `t_to_expire`. Payment FKs (all OneToOne → `LNPayment` except `payout_tx`):
`maker_bond` (`related_name="order_made"`), `taker_bond` (`"order_taken"`), `trade_escrow`
(`"order_escrow"`), `payout` (`"order_paid_LN"`), `payout_tx` → `OnchainPayment`
(`"order_paid_TX"`). These `related_name`s are how `follow_invoices.py` dispatches via
`hasattr()` — see `api/management/commands/AGENTS.md`.

Methods: `log(event, level="INFO")` — gated by `DISABLE_ORDER_LOGS` (code default `True`
i.e. off; `.env-sample` ships `False` i.e. on — they disagree). `update_status(new_status)`
— logs the transition and, if `new_status == FAI`, fires
`send_notification.delay(message="lightning_failed")`. A `pre_delete` receiver cascades
delete to `maker_bond`/`payout`/`taker_bond`/`trade_escrow` (not `payout_tx`) when an
`Order` is deleted.

## `Robot` (robot.py)
OneToOne with Django `User`; two `post_save` receivers on `User` auto-create/save the
`Robot` (`api/` never creates a Robot directly — see `api/AGENTS.md` cross-app boundaries).
Fields: `hash_id`, `public_key`/`encrypted_private_key` (PGP), `total_contracts`,
`telegram_token`/`telegram_chat_id`/`telegram_enabled`/`telegram_lang_code`/
`telegram_welcomed`, `nostr_pubkey`, `webhook_url`/`webhook_api_key`/`webhook_enabled`,
`earned_rewards`/`claimed_rewards`, `num_disputes`/`lost_disputes`/
`num_disputes_started`/`orders_disputes_started`, `avatar` (`ImageField`, default
`unknown_avatar.webp` — **webp, not PNG**), `penalty_expiration`, `platform_rating`,
`wants_stealth`. `is_valid_onion_url(url)` is a `@staticmethod` (not a model/field
constraint) — restricts `webhook_url` to `.onion`, called from `serializers.py` and
`notifications.py`.

**`nostr_pubkey` is write-once via `ReviewView`** — set on the first `POST /api/review/`
call and never changed by that endpoint again (mismatch → error 1052). It is also settable
via `PUT /api/robot/`, but `ReviewView` only trusts the value already stored.

**`platform_rating` vs coordinator Nostr rating** — `platform_rating` is set by
`POST /api/order/ { action: 'rate_platform' }` (REST, stored in DB). Coordinator Nostr
ratings are published as kind 31986 events by the frontend and aggregated client-side in
`Federation.ratings` — they are **not** stored in `platform_rating` and are entirely
separate from the Django model. Do not conflate them.

## `LNPayment` (ln_payment.py)
`payment_hash` is the **primary key**. `Types`: NORM(0)/HOLD(1)/KEYS(2). `Concepts`:
MAKEBOND(0)/TAKEBOND(1)/TRESCROW(2)/PAYBUYER(3)/WITHREWA(4)/DEVDONAT(5). `Status` (all
6-char codes): INVGEN(0)/LOCKED(1)/**SETLED**(2)/**RETNED**(3)/CANCEL(4)/EXPIRE(5)/
VALIDI(6)/FLIGHT(7)/SUCCED(8)/FAILRO(9) — `SETLED`/`RETNED`, not SETTLED/RETURNED.
`FailureReason` (singular, exists): NOTYETF(0)/TIMEOUT(1)/NOROUTE(2)/NONRECO(3)/
INCORRE(4)/NOBALAN(5). Other fields: `invoice`, `preimage`, `description`, `num_satoshis`,
`routing_budget_ppm`/`routing_budget_sats`, `fee`, `created_at`/`expires_at`,
`cltv_expiry`/`expiry_height`, `routing_attempts`, `last_routing_time`, `in_flight`,
`sender`/`receiver` (FK User), `order_donated` (FK Order, for devfund payments).

## `TakeOrder` (take_order.py)
Ephemeral pre-take record. `order` (FK), `taker` (FK User, `related_name="pretaker"`),
`amount` (range-order fiat amount), `expires_at`, `taker_bond` (OneToOne → LNPayment,
`related_name="take_order"`), `last_satoshis`/`last_satoshis_time`.

## `MarketTick` (market_tick.py)
Logged once per contract, at **taker-bond-lock** (`finalize_contract`) — so expired or
disputed trades still produce one. No `payment_method` field. `volume` is **BTC, not
satoshis** (`order.last_satoshis / 100_000_000`). `price`, `premium`, `currency` (FK),
`timestamp`, `fee`. `log_a_tick(order)` is a bare function (no `self`), called as
`MarketTick.log_a_tick(order)`.

## `OnchainPayment` (onchain_payment.py)
`Concepts`: single member `PAYBUYER(3)` (matches `LNPayment.Concepts.PAYBUYER`'s value).
`Status`: CREAT(0)→VALID(1)→MEMPO(2)→**CONFI(3)**→CANCE(4)/QUEUE(5). **`CONFI` is defined
but no code path ever assigns it** — only read/filtered in `views.py` and
`control/tasks.py`; there is no confirmation watcher. `address`, `txid`, `num_satoshis`,
`sent_satoshis`, `suggested_mining_fee_rate`/`mining_fee_rate`/`mining_fee_sats`,
`swap_fee_rate`, `broadcasted`, `receiver`, `created_at`. `balance` FK →
`control.models.BalanceLog`, `default=get_balance` where `get_balance()` **creates a
`BalanceLog` row but returns `balance.time`** (a datetime) as the FK default value — a real
oddity, not a doc error.

## `Currency` (currency.py)
`currency` is a `PositiveSmallIntegerField` — an **integer index into
`frontend/static/assets/currencies.json`**, not an ISO code string. `exchange_rate`,
`timestamp`.

## `Notification` (notification.py)
`robot` and `order` FKs are both **required** (no `null=True`) — not optional. `title`,
`description`, `created_at`.

## Trade economics (`Logics` methods in `logics.py`, documented here next to the fields
they mutate — see `api/AGENTS.md` for the endpoint/state-machine context)
- `FEE`/`MAKER_FEE_SPLIT` (module constants, from env): maker pays `FEE * MAKER_FEE_SPLIT`,
  taker pays the remainder — applied in `payout_amount` (buyer invoice, fee subtracted) and
  `escrow_amount` (seller escrow, fee added).
- `compute_proceeds(order)`: coordinator revenue → `order.proceeds +=
  trade_escrow.num_satoshis - (payout.num_satoshis + payout.fee)`, or for swaps
  `- (payout_tx.sent_satoshis + payout_tx.mining_fee_sats)`. Fires
  `send_devfund_donation.delay(order.id, new_proceeds, reason)`.
- `send_devfund_donation` (`tasks.py`): donation fraction is env `DEVFUND`, clamped
  `min(1.0, max(0.0, ...))`, default `0.2`; sent via `LNNode.send_keysend`.
- `add_slashed_rewards(order, slashed_bond, staked_bond)`: splits the slashed bond by env
  `SLASHED_BOND_REWARD_SPLIT` (default `0.5`) — reward fraction credits the waiting robot's
  `Robot.earned_rewards`, remainder credits `order.proceeds` (also donates). Range-order
  overhang (`staked_bond` smaller than `slashed_bond`) above 100 sats is returned to the
  *slashed* robot's own `earned_rewards`.
- `PENALTY_TIMEOUT` (env) drives `Robot.penalty_expiration`, set by `kick_taker`.
- `withdraw_rewards(user, invoice, routing_budget_ppm)`: needs `earned_rewards >= 1`; sets
  it to `0` before paying, re-credits on payment failure. No `routing_budget_ppm` given →
  falls back to `max(sats * PROPORTIONAL_ROUTING_FEE_LIMIT,
  MIN_FLAT_ROUTING_FEE_LIMIT_REWARD)` (marked "deprecate in the future" in-code).
- `summarize_trade(order, user)`: valid only for `SUC`/`PAY`/`FAI`. Computes per-role
  `trade_fee_percent` from `FEE`/`MAKER_FEE_SPLIT` and bond size in sats/percent.

## Admin actions (`admin.py`) — money-moving, bypass `Logics`
`OrderAdmin.actions`: `cancel_public_order` (PUB/PAU → `return_bond(maker_bond)`, status
`UCA`), `maker_wins`/`taker_wins` (DIS/WFR only — credit the winner via a **raw
assignment** `robot.earned_rewards = own_bond_sats + trade_sats`, set loser's status to
`TLD`/`MLD`), `return_everything` (DIS/WFR — adds all three bond/escrow sat amounts back to
each sender's `earned_rewards`, status `CCA`), `successful_trade` (DIS/WFR — **overwrites**,
not adds to, `earned_rewards` for both sides, then calls `Logics.pay_buyer`),
`compute_median_trade_time` (reporting only, no mutation). None of these call through
`Logics`'s bond/escrow guard methods — a change here is a direct field write moving funds.

## Traps
`get_balance()` (§OnchainPayment above) returns a datetime, not a `BalanceLog` instance, as
an FK default callable. `DISABLE_ORDER_LOGS` code/`.env-sample` defaults disagree (§Order).
`MarketTick` still logs for orders that later expire/dispute — don't assume every tick maps
to a `SUC` order. `admin.py`'s `maker_wins`/`taker_wins` both derive `own_bond_sats` from
`order.maker_bond.num_satoshis` — verify which bond is actually intended before relying on
`taker_wins` crediting the right amount.

## Constraints
Never add an `Order.Status` member without a `t_to_expire` entry. Never delete/rename a
`related_name` on a payment FK — `follow_invoices.py` dispatches on it via `hasattr()`.
Admin actions in this file's **Admin actions** section move real funds outside `Logics` —
review changes to them as carefully as `Logics` itself.
