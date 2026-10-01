# /api/tests — mocked unit tests (agent reference)

Plain Django `TestCase` (not DRF `APITestCase`) — no HTTP client cycle exercised. Every
external call (config lookups, HTTP session, file I/O) is mocked via `unittest.mock`.
**Not** a live Lightning-node or live-HTTP suite.

| File | Scope |
|---|---|
| `test_errors.py` | `api/errors.py`'s `new_error()` decade routing (1000/2000/3000/4000/5000/6000/7000 → correct response field name) |
| `test_utils.py` | `api/utils.py` helpers — exchange rates, base91, PGP, token validation (see detail below) |
| `test_community_donation.py` | DevFund community split end-to-end (LNURL-pay, donation math, failure branches) |
| `test_federation.py` | Federation JSON parsing and coordinator loading helpers |
| `test_info.py` | `/api/info/` data construction |
| `test_lightning_node.py` | LNNode method signatures and behaviour (mocked gRPC) |
| `test_nostr.py` | Nostr event construction (`nostr.py`) |
| `test_notifications.py` | `Notifications` fan-out methods |
| `test_payout_amount.py` | `payout_amount` / fee-split math |
| `test_withdraw_rewards.py` | `withdraw_rewards` flow |

- `test_utils.py` detail: `get_exchange_rates` (rate aggregation, asserts median across
  mocked API responses), `weighted_median`, `validate_pgp_keys`/`verify_signed_message`
  (against real fixture keys under `tests/robots/1/`), `is_valid_token`,
  `objects_to_hyperlinks`. `base91_to_hex`/`hex_to_base91` are tested with `decode`/`encode`
  themselves mocked out — the actual base91 codec is **not** exercised here, only the wrapper
  plumbing. `get_lnd_version`/`get_cln_version` are the one exception: gated by env
  `LNVENDOR` and unmocked, so they can touch a real node/binary if that env var happens to
  be set.
- `test_community_donation.py` detail: `api.utils.resolve_lightning_address` (LNURL-pay
  flow: metadata fetch, bounds validation, invoice request, amount verification),
  `api.tasks.send_devfund_donation` (split math: fraction × total → community sats,
  remainder to keysend), and `api.tasks.send_community_donation` (happy-path + all failure
  branches: bad address format, LNURL error, routing failure). All failures in the community
  task must be swallowed — the test asserts the devfund keysend still fires regardless.

  **Patch-at-source convention** (important for adding future tests): all task/util
  functions use *lazy local imports*, so `unittest.mock.patch` must target the name where
  it is **defined**, not where it is called from inside a function body. Canonical mapping:

  | Lazy import inside | Patch target |
  |---|---|
  | `api.tasks` → `Order`, `LNPayment` | `"api.models.Order"`, `"api.models.LNPayment"` |
  | `api.tasks` → `User` | `"django.contrib.auth.models.User"` |
  | `api.tasks` / `api.utils` → `LNNode` | `"api.lightning.node.LNNode"` |
  | `api.tasks` → `get_devfund_pubkey` | `"api.utils.get_devfund_pubkey"` |
  | `api.tasks` → `resolve_lightning_address` | `"api.utils.resolve_lightning_address"` |
  | `api.tasks` → `send_community_donation` (delay) | `"api.tasks.send_community_donation"` |
  | `api.tasks` / `api.utils` → `config` | `"decouple.config"` (patch at each module) |

## Contrast with root `/tests`
`/home/koala/Workspace/robosats/tests/` (outside `api/`) is a **separate**, much heavier
suite: end-to-end against a live Django server with real LND/CLN/bitcoind nodes in
regtest (`docker-tests.yml`), explicitly never mocking the Lightning layer. If a change
needs verification against real payment/escrow flows, that suite is the one to run —
`api/tests/` cannot catch node-integration regressions.
