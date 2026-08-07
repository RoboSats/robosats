# /api/lightning — Lightning node abstraction (agent reference)

## `node.py` is a runtime dispatcher, not an interface
No ABC, no `abstractmethod`. At **import time**, `node.py` does a plain `if/elif/else` on
env `LNVENDOR` (default `"LND"`) and aliases `LNNode = LNDNode` or `LNNode = CLNNode`; any
other value raises `ValueError` at import (crashes app startup, not first use). Every
method on `LNDNode`/`CLNNode` is `@classmethod` — nodes are **never instantiated**, always
called as `LNNode.method(...)`. The gRPC channel is built once as a **class attribute** at
class-definition time (also import time), reused by every call.

## Methods — signatures (both vendors unless noted)
- `gen_hold_invoice(cls, num_satoshis, description, invoice_expiry, cltv_expiry_blocks,
  order_id, lnpayment_concept, time)` → **dict**: `invoice, preimage, payment_hash,
  created_at, expires_at, cltv_expiry`. CLN **discards** the caller's `invoice_expiry` and
  recomputes `cltv_expiry_blocks * 10 * 60` (comment: CLN must cancel HTLCs on invoice
  expiry). LND instead **pads** the caller's value by 1.5x.
- `validate_hold_invoice_locked(cls, lnpayment)` — takes an `LNPayment` object, does **one**
  lookup call (no polling loop in this method — polling lives in `follow_invoices.py`).
  Returns `True` only on ACCEPTED/LOCKED state; other states fall through with an implicit
  `None`.
- `lookup_invoice_status(cls, lnpayment)` → **tuple** `(status, expiry_height)`.
- `settle_hold_invoice(cls, preimage)` / `cancel_return_hold_invoice(cls, payment_hash)` →
  bool.
- `validate_ln_invoice(cls, invoice, num_satoshis, routing_budget_ppm)` → **dict**
  `{valid, context, description, payment_hash, created_at, expires_at}`.
- `pay_invoice(cls, lnpayment)` — **rewards-withdrawal payouts only** (sole caller:
  `Logics.withdraw_rewards`). Returns `(bool, Optional[str] failure_reason)` on all paths — consistent with CLN.
- `follow_send_payment(cls, lnpayment, fee_limit_sat, timeout_seconds)` — **`fee_limit_sat`
  is absolute satoshis, not ppm** (converted by the caller in `tasks.py`). LND streams via
  `RouterStub.SendPaymentV2`; CLN polls `ListPays` in a loop with recursive retry.
- `send_keysend(cls, target_pubkey, message, num_satoshis, routing_budget_sats, timeout,
  sign)` → always `(True, keysend_payment_dict)` — the bool is not meaningful on either
  vendor. Self-keysend (`ALLOW_SELF_KEYSEND` env) is **LND-only**; CLN's request has no such
  field and the env read is commented out (`# Cannot perform selfpayments`).
- `pay_onchain(cls, onchainpayment, queue_code=5, on_mempool_code=2)` — first arg is an
  `OnchainPayment` **object**. Flips status from `queue_code` to `on_mempool_code`
  *before* broadcasting.
- `estimate_fee(cls, amount_sats, target_conf=2, min_confs=1)` → `{mining_fee_sats,
  mining_fee_rate}`. LND actually uses `target_conf`/`min_confs` against a dummy/burn
  address; CLN accepts but ignores both, using a fixed ~12-block "opening channel" bucket.
- `get_info` / `newaddress` — **CLN-only** (no equivalent on LND).
- `resetmc` — dead/commented-out on LND (not callable); on CLN it's live but always
  `return False` (no-op, comment: no gossip-store equivalent).
- `wallet_balance()` / `channel_balance()` / `decode_payreq()` — identical shape both
  vendors, 10s-cached via `@ring.dict`.

## `is_same_status` and the CANCEL/RETNED problem
LND's invoice state has no distinct "returned" state — a genuinely cancelled invoice and
one whose HTLC was returned after being ACCEPTED both report `CANCELED` from LND. RoboSats'
own `LNPayment.Status` distinguishes `CANCEL` (never locked) from `RETNED` (locked then
returned). `is_same_status(a, b)` (module-level function in `follow_invoices.py`, plus a
dead duplicate defined as an unbound `Command` method — the module-level one is what's
called) treats `CANCEL`/`RETNED` as equivalent so the poller doesn't spuriously "change"
status between two DB-distinct-but-LND-indistinguishable states.

## LND vs CLN divergences
- **Second gRPC channel**: CLN needs `CLN_GRPC_HOLD_HOST` for the hold-invoice plugin,
  separate from `CLN_GRPC_HOST` — all hold-invoice ops route through it.
- **Auth**: LND uses one-way TLS (`LND_CERT_BASE64`) + macaroon
  (`LND_MACAROON_BASE64`/`MACAROON_PATH`). CLN uses mTLS with hardcoded cert filenames
  (`client.pem`, `client-key.pem`, `server.pem` under `CLN_DIR`) and **no macaroon**.
- **Failure reasons**: LND stores its own numeric `failure_reason` directly (lines up 1:1
  with `LNPayment.FailureReason`). CLN collapses most gRPC status codes (203/205/206/210)
  to a single `NOROUTE` — the distinct reason is lost.
- `estimate_fee`, `get_info`/`newaddress`, `resetmc`, self-keysend — see method list above.

## Env vars
LND: `LND_DIR`, `MACAROON_PATH` (relative to `LND_DIR`), `LND_CERT_BASE64`,
`LND_MACAROON_BASE64`, `LND_GRPC_HOST` (single `host:port`, no separate port var),
`LOG_LND`. CLN: `CLN_DIR`, `CLN_GRPC_HOST`, `CLN_GRPC_HOLD_HOST`. Shared:
`DISABLE_ONCHAIN` (default `True`), `MAX_SWAP_AMOUNT`, `SPEND_UNCONFIRMED`,
`PROPORTIONAL_ROUTING_FEE_LIMIT`, `MIN_FLAT_ROUTING_FEE_LIMIT_REWARD`,
`REWARDS_TIMEOUT_SECONDS`, `ALLOW_SELF_KEYSEND` (LND-only, read but inert on CLN),
`TESTING` (skips broadcast jitter sleep). `PAYOUT_TIMEOUT_SECONDS` is **not** read inside
this module — it's read in `api/tasks.py` and passed in as `timeout_seconds`.

## CLTV expiry (`Logics.compute_cltv_expiry_blocks`, in `logics.py`, not here)
`cltv_expiry_secs = t_to_expire(CHA) + t_to_expire(WFE)`, plus `t_to_expire(PUB) +
t_to_expire(TAK)` **only** for the maker bond. The safety factor
(`MAX_MINING_NETWORK_SPEEDUP_EXPECTED`, env) is a **multiplier over the whole sum**, not an
addend. Converted to blocks via `BLOCK_TIME` (minutes/block, env).

## On-chain swap flow (disabled by default — `DISABLE_ONCHAIN=True`)
`Logics.create_onchain_payment` — creates an empty `OnchainPayment`, checks available
liquidity (`confirmed - 300_000 reserve - pending VALID/QUEUE txs`), caps suggested mining
fee at 1000 sats/vbyte, floors at 2.05. → `Logics.update_address` — assumed-vbyte fee math
(`mining_fee_rate * 280`), rejects below a 20,000-sat dust floor, sets `order.is_swap =
True`, flips `OnchainPayment.Status` to `VALID`. → `Logics.pay_buyer` flips it to `QUEUE`. →
`follow_invoices.py`'s `send_onchain_payments()` asserts `trade_escrow` is `SETLED` and
sufficient, then calls `LNNode.pay_onchain`, which flips `QUEUE → MEMPO` *before*
broadcasting. **`OnchainPayment.Status.CONFI` is never written by any code path** — defined
in the enum, only ever read/filtered (`views.py`, `control/tasks.py`) — there is no
block-confirmation watcher in this codebase.

## Retry/timeout mechanics
`follow_send_payment` runs as the Celery task of the same name with `time_limit=180,
soft_time_limit=175` (`api/tasks.py`). On `SoftTimeLimitExceeded`, `last_routing_time` is
deferred to `now() + 10 minutes` so the next retry check doesn't hammer immediately.
`fee_limit_sat` is pre-converted from `routing_budget_ppm` by the caller in `tasks.py`
before reaching this module. Retry **scheduling** (deciding *when* to dispatch) lives in
`api/management/commands/follow_invoices.py`, not Celery beat — see
`api/management/commands/AGENTS.md`.

## Traps
Both `settle_hold_invoice` and `cancel_return_hold_invoice` on LND detect success by
checking `str(response) == ""` (an empty gRPC response), annotated `# TODO` in-code as
fragile. `pay_invoice` on LND returns a consistent `(bool, str|None)` 2-tuple on all paths
(fixed). Do not re-add a bare `return False` or a broad `try/except` that re-credits
`earned_rewards` on exceptions — see `api/AGENTS.md` Constraints for the exploit rationale.

## Constraints
Keep LND and CLN method signatures in lockstep — `node.py`'s aliasing assumes identical
call signatures on both classes. Never call vendor gRPC stubs directly from `api/` —
always go through `LNNode`. Don't assume `CONFI` is reachable; anything gating on it will
never fire. Treat `pay_onchain`/broadcast code as irreversible once past the `MEMPO` flip.
