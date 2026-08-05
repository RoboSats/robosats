# RoboSats API Security Audit

**Date:** 2026-08-05  
**Scope:** `/api` endpoints, auth middleware, chat, models, Lightning layer, background tasks, Django settings  
**Severity Scale:**
- **Tier 1 — Funds / Identity Loss:** Direct loss of sats, bonds, escrow, or robot identity compromise
- **Tier 2 — State Corruption / Logic Bypass:** Order state machine broken, funds temporarily stuck, incorrect business logic outcome
- **Tier 3 — DoS / Resource Exhaustion:** Service degradation, CPU/DB/worker exhaustion, availability impact
- **Tier 4 — Information Leak / Hardening:** Metadata exposure, missing defenses, defense-in-depth gaps

---

## TIER 1 — Funds / Identity Loss

### F1. `taker_wins` admin action credits wrong bond amount

**File:** `api/admin.py:233`  
**Status:** Confirmed bug

**Description:**  
In `OrderAdmin.taker_wins`, the variable `own_bond_sats` is derived from `order.maker_bond.num_satoshis` (the maker's bond) instead of the taker's bond. The taker is then credited `own_bond_sats + trade_sats`.

```python
# BUG: line 233 — should be taker_bond, not maker_bond
own_bond_sats = order.maker_bond.num_satoshis
...
order.taker.robot.earned_rewards = own_bond_sats + trade_sats
```

**Exploit Scenario:**  
A coordinator operator resolves a dispute in favor of the taker via the Django admin `taker_wins` action. If the maker bond is larger than the taker bond (common in range orders where amounts differ), the taker is credited excess sats. Conversely if the maker bond is smaller, the taker is under-compensated. In both cases the coordinator's node balance is affected.

**Impact:** Direct sats misallocation on every dispute admin resolution favoring the taker. Coordinator financial loss or incorrect user compensation.

**Fix:**
```python
# api/admin.py, taker_wins action
own_bond_sats = order.taker_bond.num_satoshis  # was: order.maker_bond.num_satoshis
```

---

### F2. `automatic_dispute_resolution` bypasses protection after `undo_confirm`

**File:** `api/logics.py:468`  
**Status:** Confirmed bug

**Description:**  
`automatic_dispute_resolution` guards against resolving orders where fiat was sent with:

```python
if order.is_fiat_sent and not order.reverted_fiat_sent:
    return False
```

However, after `undo_confirm_fiat_sent`, the order has `is_fiat_sent=False` and `reverted_fiat_sent=True`. This means the guard evaluates as `False and not True` → `False` — the auto-resolution proceeds despite fiat having been sent and then "cancelled".

**Exploit Scenario:**  
1. Order is in CHA status. Buyer and seller are trading.
2. Buyer confirms fiat sent → `is_fiat_sent=True`, status→FSE.
3. Buyer immediately calls `undo_confirm` → `is_fiat_sent=False`, `reverted_fiat_sent=True`, status→CHA.
4. Buyer goes silent (sends no chat messages).
5. Order expires → `order_expires` auto-opens a dispute.
6. `automatic_dispute_resolution` is called. Guard passes (is_fiat_sent=False). Seller wrote in chat, buyer did not → `elif num_messages_taker == 0` branch executes.
7. Escrow is **returned** to seller, seller's bond returned, **taker's bond settled** (funds taken from buyer/taker).
8. The buyer, who actually sent fiat, loses both their bond AND received nothing.

**Impact:** A malicious seller can weaponize this: claim to have received fiat, wait for the buyer to undo-confirm out of confusion, then trigger expiry. Or a malicious buyer who actually sent fiat loses funds via a race they didn't intend.

**Fix:** The guard should block auto-resolution if fiat was EVER sent (reverted or not):

```python
# api/logics.py, automatic_dispute_resolution
if order.is_fiat_sent or order.reverted_fiat_sent:
    return False
```

---

### F3. Unauthenticated robot creation — no rate limit, no cost

**File:** `robosats/middleware.py` — `RobotTokenSHA256AuthenticationMiddleWare`  
**Status:** Confirmed

**Description:**  
Any HTTP request bearing a valid-format base91 token (39–40 chars) that is not yet in the database triggers automatic creation of:
- A Django `User`
- A `Robot` (via post_save signal)
- A DRF `Token` with the base91 key
- A full PGP keypair import via gnupg

There is no rate limiting, no proof-of-work, no captcha, and no cost. The only mitigation is a daily `users_cleansing` task that removes robots older than 12h that have never traded — but any robot that creates even one order (which is also rate-limit-free) stays alive permanently.

**Exploit Scenarios:**

*DoS via gnupg CPU:*  
Each robot creation imports a PGP keypair into the system gnupg keyring. This is CPU-intensive (~10-50ms per import). Generating thousands of tokens/second and firing parallel requests can saturate the gnupg worker thread and the Django application process.

*DB exhaustion:*  
Each robot creates rows in `auth_user`, `api_robot`, `authtoken_token` tables. At scale this inflates the DB significantly.

*Nickname collision (IntegrityError → 500):*  
`NickGenerator` has a finite collision-resistant pool (~60 billion combos). Under adversarial load generating many similar SHA256 hashes, nickname collisions are possible. `User.objects.create_user` with a duplicate username raises `IntegrityError` → unhandled 500.

**Impact:** Resource exhaustion DoS against the coordinator. Identity system can be polluted with millions of zombie robots.

**Fix Options:**
1. Add IP-based rate limiting in middleware (e.g., Redis-backed: max N new robots per IP per hour).
2. Require a proof-of-work token attached to registration.
3. Wrap `create_user` in a `try/except IntegrityError` to avoid the 500.
4. Optionally move PGP key import to an async task rather than the synchronous request path.

---

### F4. Webhook SSRF with plaintext API key exposure

**File:** `api/models/robot.py` (`is_valid_onion_url`), `api/notifications.py` (`send_webhook`)  
**Status:** Confirmed

**Description:**  
Two separate weaknesses combine:

**4a. Insufficient webhook URL validation:**  
`is_valid_onion_url` only checks `urlparse(url).hostname.endswith(".onion")`. It does not validate:
- URL scheme (accepts `ftp://`, `file://`, `ssh://`, etc.)
- Port (allows any port including privileged ones)
- Path (no restrictions)
- Trailing dots or Unicode homoglyphs in hostname

A URL like `file:///etc/passwd.onion` passes the validator (the `.onion` suffix check passes on the last component), and `http://[::1].onion/` would too with some parsers.

**4b. Plaintext webhook API key:**  
`Robot.webhook_api_key` (CharField(256)) is stored in plaintext in the DB. It is also returned in `GET /api/robot/` responses to the authenticated robot. Any DB dump exposes all webhook API keys.

**Exploit Scenario:**  
1. Robot registers a webhook pointing to `http://attacker-controlled.onion/` with a high-frequency trading scenario.
2. Each trade event triggers `send_webhook` with a 60-second timeout.
3. The attacker's .onion endpoint delays responses for 59 seconds → each notification ties a Celery worker for nearly a minute.
4. If the attacker participates in multiple simultaneous trades (or registers multiple robots), all Celery workers are exhausted → payment processing, bond tracking, and all background tasks halt.

**Impact:** Celery worker pool exhaustion → coordinator becomes unresponsive. Plaintext API key exposure on DB compromise.

**Fix:**
```python
# api/models/robot.py — tighten is_valid_onion_url
@staticmethod
def is_valid_onion_url(url):
    try:
        parsed = urlparse(url)
        return (
            parsed.scheme == "http"
            and parsed.hostname is not None
            and parsed.hostname.endswith(".onion")
            and not parsed.hostname.endswith("..onion")
        )
    except Exception:
        return False
```

Additionally: reduce webhook timeout from 60s to a tighter value (e.g., 10s), and consider hashing the stored API key.

---

## TIER 2 — State Corruption / Logic Bypass

### F5. Missing `return` in `OrderView.take` — order state leaked to non-participants

**File:** `api/views.py:554`  
**Status:** Confirmed bug

**Description:**  
When `action == "take"` and `order.status != PUB`, the else branch at line 553 constructs an error Response but **does not return it**:

```python
else:
    Response(new_error(1046), status.HTTP_400_BAD_REQUEST)  # BUG: no `return`
```

Execution falls through the entire `elif` chain and reaches line 653: `return self.get(request)`.

**Exploit Scenario:**  
Any authenticated robot (not necessarily a participant) sends:
```
POST /api/order/?order_id=<in-progress-order-id>
{action: "take"}
```
on an order that is in status WF2, WFE, WFI, CHA, FSE, DIS etc. Instead of an error, they receive the full `OrderView.get` response, which for participants includes: bond invoice details, escrow invoice, payout invoice, trade amounts, peer nick + hash_id + nostr_pubkey, fiat_sent status, dispute statements indicator, etc.

**Impact:** Information disclosure of confidential trade details to any authenticated third party.

**Fix:**
```python
# api/views.py:553-554
else:
    return Response(new_error(1046), status.HTTP_400_BAD_REQUEST)  # add `return`
```

---

### F6. `finalize_contract` race — concurrent taker bond locks can orphan funds

**File:** `api/logics.py:1332`, `api/management/commands/follow_invoices.py:140-148`  
**Status:** Probable (narrow window; single-threaded follow_invoices mitigates but does not eliminate)

**Description:**  
`finalize_contract` has no guard on `order.status`. It directly overwrites `order.taker` and `order.taker_bond` and deletes the `TakeOrder` row:

```python
order.taker = take_order.taker
order.taker_bond = take_order.taker_bond
order.status = Order.Status.WF2
order.save(...)
take_order.delete()
```

`follow_invoices.py` checks `order.status == PUB` (line 140) before calling `finalize_contract`, but this check and the subsequent save are NOT atomic. Two concurrent taker bond lock events arriving within the same 5-second polling window can both pass the status check before either saves.

**Impact:** First taker's bond is orphaned in LOCKED state. Funds remain frozen until CLTV expiry (potentially hours or days). `total_contracts` inflated by 2. Duplicate `MarketTick` logged.

**Fix:** Add a `select_for_update` guard in `follow_invoices` when transitioning the order:
```python
# follow_invoices.py — taker bond lock branch
with transaction.atomic():
    order = Order.objects.select_for_update().get(id=lnpayment.take_order.order.id)
    if order.status == Order.Status.PUB:
        Logics.finalize_contract(lnpayment.take_order)
    else:
        Logics.take_order_expires(lnpayment.take_order)
```

---

### F7. `open_dispute` sets `orders_disputes_started` to `None`

**File:** `api/logics.py:572-574`  
**Status:** Confirmed bug

**Description:**  
```python
robot.orders_disputes_started = list(
    robot.orders_disputes_started
).append(str(order.id))
```

`list.append()` returns `None`. The field is set to `None` on every user-triggered dispute after the first one (the first is handled by the `if robot.orders_disputes_started is None` branch at line 569).

**Impact:** Data corruption. `robot.orders_disputes_started` becomes `None` after the first dispute, breaking all downstream code that expects a list. `num_disputes` is still incremented correctly, but the order-id tracking is silently destroyed.

**Fix:**
```python
# api/logics.py:569-574
if robot.orders_disputes_started is None:
    robot.orders_disputes_started = [str(order.id)]
else:
    disputes = list(robot.orders_disputes_started)
    disputes.append(str(order.id))
    robot.orders_disputes_started = disputes
```

---

### F8. Chat message index race — duplicate indices under concurrency

**File:** `chat/views.py` (POST), `chat/consumers.py:64-94`  
**Status:** Confirmed (no DB constraint protecting the invariant)

**Description:**  
Both REST and WebSocket message creation compute the next index as:
```python
last_index = Message.objects.filter(order=order).count()  # REST
# or
last_message = Message.objects.filter(order=order).latest()
index = last_message.index + 1  # WS
```

There is no `select_for_update`, no `unique_together` constraint on `(order, index)`, and no atomic increment. Two concurrent message submissions get the same index.

**Impact:** Client-side chat sync breaks permanently for that order. Messages with duplicate indices confuse the offset-based polling used by REST clients.

**Fix:** Add a `unique_together` constraint and use `select_for_update`:
```python
# chat/models.py — Message
class Meta:
    unique_together = [("order", "index")]

# chat/views.py and consumers.py — wrap in transaction
with transaction.atomic():
    last = Message.objects.select_for_update().filter(order=order).order_by("-index").first()
    index = (last.index + 1) if last else 1
    Message.objects.create(order=order, index=index, ...)
```

---

### F9. `new_error()` unhandled `KeyError` → 500

**File:** `api/errors.py`  
**Status:** Confirmed

**Description:**  
`new_error(code, parameters)` calls `message.format(**parameters)`. If a caller passes `new_error(1012)` without the required `{"time_out": ...}` dict, or passes a dict missing a placeholder key, Python raises a `KeyError` that propagates as an unhandled 500.

**Fix:** Add a `try/except` in `new_error`:
```python
try:
    message = message.format(**parameters)
except KeyError:
    pass  # return unformatted message rather than crash
```

---

## TIER 3 — DoS / Resource Exhaustion

### F10. No DRF throttling on any endpoint

**File:** `robosats/settings.py`

Every endpoint — order creation, book queries, chat POST, reward withdrawal, review token — is rate-limit-free. `REST_FRAMEWORK` has no `DEFAULT_THROTTLE_CLASSES`.

**Fix:** Add throttle classes:
```python
REST_FRAMEWORK = {
    "DEFAULT_THROTTLE_CLASSES": [
        "rest_framework.throttling.AnonRateThrottle",
        "rest_framework.throttling.UserRateThrottle",
    ],
    "DEFAULT_THROTTLE_RATES": {
        "anon": "60/minute",
        "user": "300/minute",
    },
    ...
}
```

---

### F11. Telegram notification infinite retry loop

**File:** `api/notifications.py` — `send_telegram_message`

```python
while True:
    try:
        ...
    except:
        pass
```

A single unreachable Telegram API endpoint permanently occupies a Celery worker.

**Fix:** Replace with bounded retries using Celery's built-in retry mechanism or a max-retry counter.

---

### F12. `location_country` CPU amplification

**File:** `api/utils.py` — `location_country()`

Loads the full ~500KB GeoJSON file and runs shapely `prep()` on every call. With F3's free robot creation, a simple loop of requests with lat/long fields triggers a CPU spike per request.

**Fix:** Cache the prepared geometry at module load time (module-level variable) so the file is only loaded once per process.

---

### F13. Chat message spam — no count or rate limit

**File:** `chat/views.py`, `chat/consumers.py`

Each message (up to 5000 chars) triggers a Celery `send_notification` task. No cap on messages per order, no rate limit per user.

**Fix:** Add a per-order message count cap and a per-user rate limit on chat POST.

---

### F14. Webhook 60s timeout ties Celery workers

**File:** `api/notifications.py`

`session.post(url, timeout=60)` blocks a worker for up to 60s on each notification per robot. Combined with F13, easy worker pool exhaustion.

**Fix:** Reduce timeout to 10s and add a Celery `soft_time_limit` on the notification task.

---

## TIER 4 — Information Leak / Hardening

### F16. `SESSION_COOKIE_HTTPONLY = False`

**File:** `robosats/settings.py`

Session cookie is readable from JavaScript. In combination with any XSS vector (e.g., admin stored-XSS — see F23), an attacker can exfiltrate session cookies.

**Fix:** Set `SESSION_COOKIE_HTTPONLY = True`.

---

### F17. WebSocket token in URL query string

**File:** `robosats/middleware.py` — `TokenAuthMiddleware`

The `token_sha256_hex` query parameter appears in proxy logs, server access logs, and browser history. Even though it's the SHA256 of the actual token (not the token itself), it is still a bearer credential for the WebSocket connection.

**Fix:** Pass the token in the WebSocket subprotocol header or in the first message after connection (many WS auth patterns do this). Alternatively, use the existing DRF `Authorization` header by upgrading via a pre-authenticated cookie or a short-lived WS ticket.

---

### F18. Plaintext sensitive fields in DB

**Files:** `api/models/order.py` (`password` TextField), `api/models/robot.py` (`webhook_api_key`), `api/models/ln_payment.py` (`preimage`)

- `Order.password` is stored in plaintext. A DB leak exposes all password-protected order credentials.
- `Robot.webhook_api_key` (256 chars) is stored and returned in plaintext via `GET /api/robot/`.
- `LNPayment.preimage` for unsettled hold invoices is the most dangerous: anyone with DB read access can call `settle_hold_invoice(preimage)` on any LOCKED invoice, instantly settling escrow or bonds without coordinator intent.

**Fix:**
- Hash `Order.password` with a one-way function (bcrypt/argon2) and use `compare_digest` on comparison (already done for the `take` password check, should be extended to storage).
- Hash `webhook_api_key` before storage; only compare, never retrieve.
- `LNPayment.preimage` is necessarily stored to enable settlement — this is inherent to the hold-invoice model. Mitigate by encrypting at rest (Django encrypted fields) or restricting DB read access to the minimum required.

---

### F19. `verify_signed_message` — no replay protection

**File:** `api/utils.py`

PGP-signed invoices and onchain addresses carry no nonce or timestamp. A signed invoice from order A can be replayed in order B by the same robot. For invoices this is bounded by payment_hash uniqueness (LNPayment has a unique constraint on `invoice`), but onchain addresses have no such constraint and are fully replayable.

**Fix:** Include the order ID or a timestamp in the signed message content, and verify it server-side.

---

### F20. Password order metadata leaked to non-participants

**File:** `api/views.py:265-268`

For orders with `password != None` and `status == PUB`, `GET /api/order/` returns the full public metadata to any authenticated user without checking the password:
- `description`, `latitude`, `longitude`, `payment_method`, `premium`, `amount`, `maker_nick`, `maker_hash_id`, `maker_nostr_pubkey`

The password is only enforced on the `take` action, not on the GET.

**Fix:** In the non-participant PUB branch (lines 265-268), if `order.password is not None`, return only minimal metadata (order type, currency, amount range) without description, location, or maker identity details.

---

### F21. `premium=-100` → division by zero

**File:** `api/logics.py:231`, `api/models/order.py` (`MinValueValidator(-100)`)

`MinValueValidator(-100)` allows `premium=-100`, which causes `calc_sats` to divide by `(1 + -100/100) = 0` → `ZeroDivisionError` → 500. Self-inflicted by the maker.

**Fix:** Clamp the minimum allowed premium to -99 (change the validator lower bound).

---

### F22. Unhandled `DoesNotExist` → 500

**Files:** `api/views.py:511` (`Order.objects.get`), `chat/views.py` (GET/POST), MakerView (`Currency.objects.get`)

Sending a non-existent `order_id` or `currency` value to these endpoints raises `DoesNotExist`, which Django renders as a 500 (or exposes a stack trace when `DEBUG=True`).

**Fix:** Use `Order.objects.filter(...).first()` or wrap in `try/except ObjectDoesNotExist` and return a proper 404 response.

---

### F23. Admin `_logs` raw HTML rendering — stored XSS pattern

**File:** `api/admin.py` — `_logs` method

`order.log()` appends raw HTML rows to `order.logs`. `_logs` renders this via `format_html(...)`. If any user-controlled string flows into `order.log()` (e.g., a dispute statement, order description, or payment method), it would be stored XSS in the Django admin panel.

Currently most logged strings are server-generated, but the pattern is inherently dangerous as log calls expand.

**Fix:** Escape user-controlled strings before logging them, or use `mark_safe` only on strings that are guaranteed to be server-generated.

---

### F24. LND `pay_invoice` bare `False` return — caller crash

**File:** `api/lightning/lnd.py` — `pay_invoice`

One fall-through path returns a bare `False` (1-element) instead of the expected `(bool, reason)` 2-tuple. Any caller that unpacks `success, reason = LNNode.pay_invoice(...)` will raise `ValueError: not enough values to unpack`.

**Fix:** Change the fall-through return to `return False, "Unknown failure"`.

---

### F25. Nostr Celery tasks registered with `name=""`

**File:** `api/tasks.py`

Both `nostr_send_order_event` and `nostr_send_notification_event` are registered with `name=""`. Celery task name collision means one may silently override the other or both may fail to dispatch.

**Fix:** Give each task a unique, explicit `name=` parameter.

---

---

## TIER 1 — Additional Finding (F26)

### F26. `confirm_fiat` / `open_dispute` TOCTOU race — buyer steals escrow

**Files:** `api/logics.py:1682-1734` (`confirm_fiat`), `:534-556` (`open_dispute`)  
**Status:** Confirmed critical — distinct from F2  
**Fix:** Implemented — `select_for_update` + status re-validation in `confirm_fiat`, `open_dispute`, `collaborative_cancel`; `order.status==PAY` gate in `follow_invoices`  
**Tests:** `api/tests/test_confirm_fiat_race.py`

**Description:**  
`confirm_fiat`, `open_dispute`, and `collaborative_cancel` all accept status `{CHA, FSE}` with no row lock. A buyer fires `open_dispute` concurrently with the seller's `confirm_fiat`. Both pass their outer status check simultaneously. The dispute settles escrow + both bonds and sets `status=DIS`. `confirm_fiat` resumes, calls `double_check_htlc_is_settled` (a presence check, not an ownership check) → True, then calls `return_bond` which catches "invoice already settled" and returns `True` anyway (the amplifier), then calls `pay_buyer`. Result: buyer receives off-band fiat **and** the LN payout; seller loses escrow + maker bond.

**Race interleaving (5 steps):**
```
T1  Seller: confirm_fiat  → status==CHA ✓ passes. NO lock.
T2  Buyer:  open_dispute  → status==CHA ✓ passes. NO lock.
T3  Dispute: settle_escrow + settle_bond(maker) + settle_bond(taker) → status=DIS
T4  confirm_fiat resumes: settle_escrow() no-ops (already settled)
T5  double_check → True (presence, not ownership)
T6  return_bond(taker) catches "already settled" → True; bond stays SETLED
T7  return_bond(maker) same → both bonds silently SETLED-and-kept
T8  pay_buyer() → payout.status = FLIGHT, order.status = PAY
T9  follow_invoices: escrow==SETLED ✓ → follow_send_payment.delay() → BUYER PAID
```

**Victim table:**

| Party | Gets | Loses | Net |
|---|---|---|---|
| Seller (maker) | — | escrow + maker bond | −100% trade + bond |
| Buyer (scammer) | LN payout + off-band fiat | taker bond only | ≈ +99% of trade |
| Coordinator | both bond sats (stranded) | — | neutral |

**Benign twin:** `clean_orders → order_expires → open_dispute` (auto-dispute on CHA/FSE expiry) fires the same settlement path when a seller's `confirm_fiat` is in-flight near expiry. Two honest traders can both have bonds burned by latency — no attacker needed.

**Root cause:** All four mutating transitions out of `{CHA, FSE}` — `confirm_fiat`, `open_dispute`, `collaborative_cancel`, `cancel_order` — mutate hold invoices and bonds without acquiring a DB row lock or re-reading `order.status`.

**Fix applied:**

*Layer 1 — Row lock + status re-validation:*
```python
# In confirm_fiat (seller path):
with transaction.atomic():
    locked_order = Order.objects.select_for_update().get(pk=order.pk)
    if locked_order.status not in [Order.Status.CHA, Order.Status.FSE]:
        return False, new_error(1029)  # abort — dispute/cancel won the race
    if cls.settle_escrow(order): ...

# Same pattern in open_dispute and collaborative_cancel.
```

*Layer 2 — Bond-settled abort in `confirm_fiat`:*
```python
# After return_bond, check if it was already settled by the dispute:
if order.maker_bond.status == LNPayment.Status.SETLED:
    return False, new_error(1028)  # abort payout
```

*Layer 3 — Defense-in-depth in `follow_invoices`:*
```python
if (
    order.trade_escrow.status == LNPayment.Status.SETLED
    and order.is_swap is False
    and order.status == Order.Status.PAY  # NEW — blocks race slippage
):
    follow_send_payment.delay(...)
```

**Sibling defects (same root cause family — not yet fixed):**
- `pay_onchain` flips `MEMPO` before `SendCoins`, no `try/except` → on-chain swap payout orphaned on crash
- `withdraw_rewards` commits `earned_rewards=0` before paying → crash between zero and pay = permanent loss
- CLN `return_bond` ignores cancel return value → settled bond recorded as `RETNED`
- LND `settle`/`cancel` success decided by `str(response)==""` → false-negative traps funds

---

## Quick Reference — Fix Priority

| # | Tier | Finding | File | Fix Complexity |
|---|---|---|---|---|
| F1 | 1 | `taker_wins` wrong bond amount | `api/admin.py:233` | Trivial (1 line) |
| F2 | 1 | Auto-dispute bypass after undo_confirm | `api/logics.py:468` | Trivial (1 line) |
| F3 | 1 | Free robot creation / gnupg DoS | `robosats/middleware.py` | Medium |
| F4 | 1 | Webhook SSRF + plaintext API key | `api/models/robot.py` | Small |
| F5 | 2 | Missing `return` in take action | `api/views.py:554` | Trivial (1 char) |
| F6 | 2 | finalize_contract race | `follow_invoices.py:140` | Small |
| F7 | 2 | open_dispute `None` data corruption | `api/logics.py:572` | Trivial (3 lines) |
| F8 | 2 | Chat index race | `chat/views.py`, `consumers.py` | Small + migration |
| F9 | 2 | new_error KeyError → 500 | `api/errors.py` | Trivial |
| F10 | 3 | No DRF throttling | `robosats/settings.py` | Small |
| F11 | 3 | Telegram infinite retry | `api/notifications.py` | Small |
| F12 | 3 | location_country CPU amplification | `api/utils.py` | Small |
| F13 | 3 | Chat message spam | `chat/views.py` | Small |
| F14 | 3 | Webhook 60s timeout | `api/notifications.py` | Trivial |
| F16 | 4 | SESSION_COOKIE_HTTPONLY | `robosats/settings.py` | Trivial |
| F17 | 4 | WS token in URL | `robosats/middleware.py` | Medium |
| F18 | 4 | Plaintext secrets in DB | `api/models/` | Large |
| F19 | 4 | Signed message replay | `api/utils.py` | Medium |
| F20 | 4 | Password order metadata leak | `api/views.py:265` | Small |
| F21 | 4 | premium=-100 division by zero | `api/logics.py:231` | Trivial |
| F22 | 4 | DoesNotExist → 500 | Multiple views | Small |
| F23 | 4 | Admin logs stored XSS | `api/admin.py` | Small |
| F24 | 4 | pay_invoice bare False return | `api/lightning/lnd.py` | Trivial |
| F25 | 4 | Nostr tasks name="" collision | `api/tasks.py` | Trivial |
