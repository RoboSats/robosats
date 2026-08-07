# /api/management/commands — background daemons (agent reference)

Three infinite-loop management commands (`docker-compose.yml` services `follow-invoices`,
`clean-orders`, `telegram-watcher`), each `restart: always`, sharing the `backend-image`
image, `network_mode: service:tor`, and identical volume mounts (`.:/usr/src/robosats`,
`./node/lnd:/lnd`, `./node/cln:/cln`). Only `follow-invoices` declares
`depends_on: [bitcoind, lnd]` — the other two start without waiting on the node. These —
not Celery beat — are what actually drives order-state transitions in real time.

## `follow_invoices.py`
`while True: sleep(rest=5)` then `follow_hold_invoices()` and `send_payments()`, each in
its own `try/except` so one failure doesn't kill the loop.

**Polls, doesn't subscribe** — LND's `SubscribeInvoices` stream only emits OPEN/SETTLED,
but RoboSats needs ACCEPTED and CANCELLED too. So this command does `InvoiceLookupV2`-style
polling over all `LNPayment`s in `INVGEN`/`LOCKED` status every 5s (plus a 48h-old sweep of
stuck `LOCKED` invoices).

`update_order_status(lnpayment)` dispatches purely on `hasattr()` of the payment's reverse
relations (`order_made`, `take_order`, `order_escrow`, `order_taken` — see
`api/models/AGENTS.md`'s `related_name` list): a locked `maker_bond` → `Logics.publish_order`
+ `order_published` notification; a locked `taker_bond` → `Logics.finalize_contract` (or,
if another taker already locked first, `Logics.take_order_expires`); a locked
`trade_escrow` → `Logics.trade_escrow_received`. A `LOCKED` invoice matching **none** of
these `hasattr()` checks is treated as an orphan and force-cancelled immediately — holding
it to CLTV expiry risks channel force-closure. On `CANCEL` status, the same `hasattr()`
dispatch calls `Logics.order_expires`/`Logics.take_order_expires` instead.

`send_payments()` also drives **retries and broadcast**: `send_ln_payments()` re-dispatches
the Celery task `follow_send_payment` for LN payouts stuck `in_flight` >3 min, newly
`FLIGHT`, or `FAILRO` retries older than env `RETRY_TIME` minutes (attempts capped at 2).
`send_onchain_payments()` calls `LNNode.pay_onchain` for any `QUEUE`d `OnchainPayment` once
`trade_escrow` is confirmed `SETLED` and sufficient — see `api/lightning/AGENTS.md` for the
swap flow this drives. `is_same_status` (the CANCEL/RETNED equivalence check — see
`api/lightning/AGENTS.md`) has a **dead duplicate definition** inside this file: a
module-level function (the one actually called) and an unbound `Command` method with an
identical body that's never invoked. An unimplemented `elif status == INVGEN: pass` branch
(with a `# TODO` comment about a LOCKED→INVGEN regression) is a known gap, not a bug fix
target.

## `clean_orders.py`
`while True: sleep(5)` (hardcoded literal, no named constant), single outer `try/except`
that specifically swallows `"database is locked"` (SQLite-only concern) — an **uncaught
exception here exits the loop entirely**, unlike `follow_invoices.py`'s per-call isolation.

Sweeps `Order.objects.exclude(status__in=do_nothing).filter(expires_at__lt=now())` and
calls `Logics.order_expires` per row, plus a separate sweep of expired `TakeOrder` rows via
`Logics.take_order_expires`. `do_nothing` (terminal statuses, skipped): `UCA, EXP, DIS,
CCA, PAY, SUC, FAI, MLD, TLD, WFR`.

`invoice_lookup_error(exc_string)` does **vendor-specific string matching** (keyed off env
`LNVENDOR`) to recognize "invoice not found" from node error text: LND matches
`"unable to locate invoice"`; CLN matches `"empty result for listdatastore_state"` or
`"Invoice dropped from internal state unexpectedly"`. Used to force an order straight to
`EXP` when the underlying hold invoice has vanished node-side.

## `telegram_watcher.py`
`while True: sleep(rest=3)`, long-polls Telegram's `getUpdates` (`timeout=5` server-side
hold) using env `TELEGRAM_TOKEN`. Errors logged to a local `error.log` file, not stderr.

Links a chat to a `Robot` via a `/start <token>` deep link: splits the message, takes the
last token, looks up `Robot.objects.filter(telegram_token=token).first()`. On match, writes
`telegram_chat_id`/`telegram_lang_code`/`telegram_enabled` inside `transaction.atomic()`,
retried up to 5 times with a 5s sleep between attempts — silently gives up after exhausting
retries (no error surfaced beyond falling through the loop). Each loop iteration issues the
`getUpdates` GET request **twice in a row** — the first response is fetched and discarded,
then immediately re-fetched — a redundant-request bug, not intentional deduplication.

## Constraints
These commands are the real state-transition drivers — changes here have the same blast
radius as `Logics` itself. Never remove a `hasattr()` branch in `follow_invoices.py`
without checking `api/models/AGENTS.md`'s `related_name` table for what it corresponds to.
Don't assume Celery beat schedules these — they run in their own infinite loops, independent
of `robosats/celery/__init__.py`.
