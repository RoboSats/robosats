# RoboSats — Agent Context

## What This Is
Bitcoin P2P Lightning exchange. Users trade fiat for sats through a coordinator that escrows Lightning hold invoices. Privacy-first: Tor, PGP-encrypted chat, deterministic robot identities.

## Monorepo Map
| Directory | Role |
|---|---|
| `/api` | Django REST API — trade logic, Lightning, notifications |
| `/api/models` | Django ORM: Order, Robot, LNPayment, bond models |
| `/api/lightning` | LND/CLN abstraction layer — hold invoice operations |
| `/chat` | WebSocket encrypted chat (Django Channels) |
| `/control` | Admin accounting/balance tracking (coordinator finances) |
| `/robosats` | Django project config: settings, Celery, ASGI/WSGI, routing |
| `/frontend` | React 19 + TypeScript SPA — web, desktop, Android WebView, self-hosted |
| `/frontend/src/contexts` | Global React state: App, Garage, Federation contexts |
| `/frontend/src/components` | UI components: TradeBox, BookTable, MakerForm, EncryptedChat |
| `/frontend/src/models` | TypeScript models: Order, Robot, Slot, Garage, GarageKey, Federation, Coordinator |
| `/frontend/src/services` | API client, WebSocket, Nostr relay, platform abstraction |
| `/android` | Native Kotlin Android app (WebView bridge to frontend) |
| `/desktopApp` | Electron wrapper around React frontend |
| `/nodeapp` | Self-hosted deployment: Umbrel/StartOS, Nginx, coordinator configs |
| `/web` | Clearnet web client — Nginx + coordinator proxies; `recksato/robosats-web` image |
| `/tests` | Integration tests — requires real Lightning nodes (regtest) |
| `/docker` | Dockerfiles for Bitcoin, LND, CLN, Tor, Strfry services |
| `/docs` | Jekyll docs site (learn.robosats.org) |
| `/development` | Detailed documentation for developers (Humans and Agents) |
| `/scripts` | Utility scripts (API spec update, gRPC generation, devfund, lnproxy sync) |
| `/fastlane` | Fastlane metadata for app-store listings |
| `/.github` | CI/CD workflows, release orchestration, issue/PR templates, CODEOWNERS |

## Tech Stack
- **Backend**: Python/Django 5.2, DRF, PostgreSQL, Redis, Celery, Django Channels (WebSocket)
- **Frontend**: React 19, TypeScript, Webpack 5, MUI, i18next, OpenPGP.js, nostr-tools
- **Lightning**: LND or CLN via gRPC — selected by `LNVENDOR` env var
- **Privacy**: Tor, PGP-encrypted chat, SHA256-hashed robot tokens

## Coordinator Architecture
- Each deployment is **one coordinator** — independent operator running their own Lightning node
- Multiple coordinators form a federation discovered via **Nostr** (kind 38383 order events)
- Coordinator identity set by `COORDINATOR_ALIAS` env var
- Network (mainnet/testnet) toggled via `NETWORK` env var

## Key Entry Points
| File | Purpose |
|---|---|
| `manage.py` | Django CLI |
| `docker-compose.yml` | Full dev stack (Redis, Postgres, Bitcoin, LND, CLN, Django, React, Tor) |
| `.env-sample` | All required environment variables |
| `frontend/package.json` | Frontend build (`npm run build`, `npm run dev`) |
| `frontend/src/index.js` → `App.tsx` | React entry point |
| `api/logics.py` | Central business logic class (`Logics`) |

## Dev Tooling
- Python linting: `ruff` (pyproject.toml)
- Frontend linting: ESLint 9 + Prettier
- Pre-commit hooks: `.pre-commit-config.yaml`
- API docs: drf-spectacular at `/api/schema/`

## Rules

- When creating/editing AGENTS.md files, follow .claude/references/agents-md.md for good practices.
- Check /development docs for unclear business rules or entities relationships.
- Before upgrading any library or infrastructure component, consult
  `development/blocked-upgrades.md` — it lists every pinned version with its blocker.
  See `development/AGENTS.md` for an overview of all developer reference docs.
- **No inline comments in source code.** Rationale, design decisions, field semantics,
  security properties, and non-obvious behaviour belong in the nearest AGENTS.md —
  never in JSDoc blocks, block comments, or inline `//` comments in source files.
  The only acceptable comments are TODOs that reference a tracked issue and
  pre-existing comments in code you did not author in the current task.

## Testing

Every branch that adds or changes behaviour **must ship tests covering that change in the same branch** — never deferred to a follow-up.

- **Backend — unit (mocked):** `api/tests/` for logic, utils, serializers, tasks, notifications. See `api/tests/AGENTS.md` for the patch-at-source convention and existing file map.
- **Backend — integration:** `/tests/` for any endpoint change, order state-machine path, or Lightning/escrow flow. `assertResponse` schema validation is mandatory for every new endpoint test. See `tests/AGENTS.md` for setup and utilities.
- **Frontend — unit:** Jest tests colocated in `__tests__/` next to the module under test (`src/models/`, `src/utils/`, `src/services/`). Run with `npm test`. See `frontend/AGENTS.md` for the Jest environment constraints and mock conventions.
- **Exemptions** (no tests required): pure documentation edits, comment-only changes, AGENTS.md updates, config-only changes with zero behaviour delta. State the exemption reason explicitly in the PR description.

### Coverage regression gate

CI compares each PR's coverage against the **last passing `main` baseline**, cached in GitHub Actions. A PR fails if coverage drops on any metric — no hardcoded floor to maintain. The baseline updates automatically after every successful merge to `main`.

| Suite | Comparison script | Baseline cache key |
|---|---|---|
| Frontend (Jest) | `.github/scripts/check-frontend-coverage.js` | `frontend-coverage-main-{sha}` |
| Backend (Python, per ln-vendor) | `.github/scripts/check-backend-coverage.py` | `backend-coverage-main-{LND\|CLN}-{sha}` |

If no cached baseline exists (first run or cache eviction after 7 days of inactivity), the check is skipped with a warning — it never blocks on a cold cache.

## Gotchas

- Modifications to api endpoint paths or coordinators requires updating /nodeapp
- **Blocked / pinned upgrades**: several frontend (Babel, OpenPGP.js, ESLint, TypeScript)
  and backend (Django, CLN) dependencies are pinned due to known breakage or missing
  compatibility. Always read `development/blocked-upgrades.md` before bumping any
  dependency version.
- **CLN + holdinvoice version constraint**: `holdinvoice v4.0.0` (the committed binary in
  `docker/cln/plugins/holdinvoice`) only supports **CLN up to v25.09.x**. Upgrading CLN
  beyond v25.09.x will cause holdinvoice to fail silently — hold invoices never reach
  ACCEPTED state and all invoice-locking (maker bond, taker bond, trade escrow) breaks in
  both production and tests. Before upgrading CLN, verify a compatible holdinvoice release
  exists at https://github.com/daywalker90/holdinvoice/releases and update the binary.
  See `api/lightning/AGENTS.md` for full details.
