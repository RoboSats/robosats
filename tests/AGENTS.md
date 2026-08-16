# /tests — Integration Tests

## Purpose
End-to-end integration tests against a real Django server with real Lightning nodes running in regtest. No mocking of Lightning — tests require the full stack.

## Requirements
Tests require `docker-tests.yml` stack running:
- Bitcoin Core (regtest)
- LND node(s) or CLN
- PostgreSQL + Redis
- Django server

**Never mock the Lightning layer.** Past incidents showed mock/prod divergence silently masks broken migrations and payment flows.

## Test Files

| File | Scope |
|---|---|
| `test_trade_pipeline.py` | Full end-to-end trade flow: make → bond → escrow → fiat → payout → SUC |
| `test_api.py` | Base test case class (`BaseAPITestCase`) + general API tests |
| `test_api_info.py` | `/api/info/` endpoint |
| `test_api_cache.py` | Redis response-cache behavior for `/api/book/`, `/api/info/`, `/api/price/` (locmem cache override, no Redis dependency) |
| `test_api_limits.py` | `/api/limits/` endpoint |
| `test_api_robot_webhook.py` | Robot webhook notification delivery |
| `test_frontend_fetch.py` | Frontend asset serving |

## Key Utilities (`utils/`)

### `utils/trade.py`
`Trade` class — orchestrates a full trade sequence programmatically:
- Creates maker and taker robots
- Steps through order state machine
- Locks bonds and escrow via regtest invoice payments
- Confirms fiat, triggers payout

`maker_form_buy_with_range` — fixture dict for a BUY order with range amounts.

### `utils/node.py`
- `set_up_regtest_network()` — mines blocks, connects LND nodes, opens channels
- `add_invoice(node, amount)` — creates invoice on regtest node

### `utils/pgp.py`
- `sign_message(message, privkey)` — signs a message for robot auth in tests

## Base Test Case (`test_api.py: BaseAPITestCase`)
- Extends `django.test.TestCase`
- `assertResponse(response)` — validates API response against OpenAPI schema (drf-spectacular)
- Provides authenticated client helper methods
- Sets up superuser (`ESCROW_USERNAME` from env, default `admin`)

## Test Setup Pattern (`TradeTest.setUpTestData`)
```python
# Runs once per test class:
User.objects.create_superuser(...)  # admin user
cache_market()                       # populate exchange rates
set_up_regtest_network()            # mine blocks, open LN channels
compute_node_balance()              # initial balance snapshot
```

## Robot Identity in Tests
Test robots are in `/tests/robots/1/`, `/tests/robots/2/`, `/tests/robots/3/` — each directory contains pre-generated token and key material for deterministic test identities.

## Running Tests
```bash
# Requires full test stack running
docker compose -f docker-tests.yml --env-file ./tests/compose.env up -d
python manage.py test tests.test_trade_pipeline
python manage.py test tests  # all tests
```

## Agent Guidelines
- Add new trade flow tests to `TradeTest` in `test_trade_pipeline.py`
- Endpoint-specific tests belong in their own `test_api_*.py` file
- Use `Trade` utility class for any test that needs a live order — do not reproduce the multi-step setup manually
- Schema validation via `assertResponse` is mandatory for new endpoint tests
- Test data must be idempotent — `setUpTestData` runs once per class, individual tests must not leave state that breaks siblings
