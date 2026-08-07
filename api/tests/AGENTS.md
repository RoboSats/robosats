# /api/tests — mocked unit tests (agent reference)

Two files: `test_errors.py`, `test_utils.py`. Plain Django `TestCase` (not DRF
`APITestCase`) — no HTTP client cycle exercised. Every external call
(config lookups, HTTP session, file I/O) is mocked via `unittest.mock`. **Not** a live
Lightning-node or live-HTTP suite.

- `test_errors.py`: `api/errors.py`'s `new_error()` decade routing (1000/2000/3000/4000/
  5000/6000/7000 → the correct response field name), plus one parametrized-message case.
- `test_utils.py`: `api/utils.py` helpers — `get_exchange_rates` (rate aggregation,
  asserts median across mocked API responses), `weighted_median`, `validate_pgp_keys`/
  `verify_signed_message` (against real fixture keys under `tests/robots/1/`),
  `is_valid_token`, `objects_to_hyperlinks`. `base91_to_hex`/`hex_to_base91` are tested
  with `decode`/`encode` themselves mocked out — the actual base91 codec is **not**
  exercised here, only the wrapper plumbing. `get_lnd_version`/`get_cln_version` are the one
  exception: gated by env `LNVENDOR` and unmocked, so they can touch a real node/binary if
  that env var happens to be set.

## Contrast with root `/tests`
`/home/koala/Workspace/robosats/tests/` (outside `api/`) is a **separate**, much heavier
suite: end-to-end against a live Django server with real LND/CLN/bitcoind nodes in
regtest (`docker-tests.yml`), explicitly never mocking the Lightning layer. If a change
needs verification against real payment/escrow flows, that suite is the one to run —
`api/tests/` cannot catch node-integration regressions.
