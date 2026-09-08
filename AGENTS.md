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
| `/frontend/src/models` | TypeScript models: Order, Robot, Slot, Garage, Federation, Coordinator |
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
- **Backend**: Python/Django 5.1, DRF, PostgreSQL, Redis, Celery, Django Channels (WebSocket)
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

## Gotchas

- Modifications to api endpoint paths or coordinators requires updating /nodeapp
- **CLN + holdinvoice version constraint**: `holdinvoice v4.0.0` (the committed binary in
  `docker/cln/plugins/holdinvoice`) only supports **CLN up to v25.09.x**. Upgrading CLN
  beyond v25.09.x will cause holdinvoice to fail silently — hold invoices never reach
  ACCEPTED state and all invoice-locking (maker bond, taker bond, trade escrow) breaks in
  both production and tests. Before upgrading CLN, verify a compatible holdinvoice release
  exists at https://github.com/daywalker90/holdinvoice/releases and update the binary.
  See `api/lightning/AGENTS.md` for full details.
