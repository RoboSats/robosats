# Blocked / Constrained Library Upgrades

Libraries that were attempted and rolled back, or are known to be incompatible at a higher
version. Do not upgrade these without resolving the noted blocker first.

---

## Frontend (npm)

### Babel — pinned at `^7.x`

**Packages**: `@babel/core`, `@babel/plugin-transform-runtime`, `@babel/preset-env`,
`@babel/preset-react`, `@babel/preset-typescript`, `@babel/runtime`

**Current**: `^7.29.7`
**Attempted**: `^8.x` (branch `bump-babel-8`, Aug 2026 — reverted in `downgrade-babel`)

Babel 8 broke the build. The `babel.config.json` preset structure also differs between
major versions (`runtime: automatic` in `@babel/preset-react` is v8-specific). Do not
upgrade until the config incompatibilities are resolved.

---

### OpenPGP.js — pinned at `^5.x`

**Package**: `openpgp`

**Current**: `^5.11.3`
**Attempted**: `^6.x` (branch `bump-openpgp-6`, Aug 2026 — reverted in `downgrade-pgp`, Sep 2026)

OpenPGP v6 renamed the ECC curve from `'curve25519'` to `'curve25519Legacy'` in the
`generateKey` API. Upgrading without a migration plan would break key generation and
cross-version compatibility with existing user robot keys stored in armored form. The
constant in `frontend/src/pgp/index.ts` (`genKey`) must stay as `'curve25519'` for v5.
Before upgrading, audit all existing armored keys and plan a migration.

---

### ESLint — pinned at `^9.x`

**Package**: `eslint` (and ecosystem: `@eslint/js`, `@eslint/compat`, `eslint-plugin-n`,
`eslint-plugin-react-hooks`, `globals`)

**Current**: `^9.39.5`
**Attempted**: `^10.x` (branch `bump-eslint-10`, Aug 2026 — never merged to `main`)

ESLint 10 requires config and plugin updates that were not completed. The branch
`bump-eslint-10` contains the partial attempt. Do not upgrade until that branch is
revisited and all plugin versions aligned.

---

### TypeScript — pinned at `^6.x`

**Package**: `typescript`

**Current**: `^6.0.3`
**Attempted**: `^7.x` (branch `bump-typescript-7`, Aug 2026 — chained with `bump-eslint-10`, never merged to `main`)

The TypeScript 7 bump was developed together with the ESLint 10 upgrade and was not merged
independently. It is blocked on the ESLint 10 work landing first.

---

## Backend (Python)

### Django — pinned at `5.2.x`

**Package**: `django`

**Current**: `5.2.17`
**Attempted**: `6.1.1` (analysis Sep 2026 — not attempted, blocked pre-upgrade)

Three third-party packages are not yet compatible with Django 6.1 and block the upgrade:

| Package (pinned) | Problem |
|---|---|
| `django-cors-headers==4.9.0` | Explicitly supports Django **up to 6.0** only; 6.1 not listed |
| `django-celery-results==2.6.0` | Latest release declares classifiers only up to **Django 5.2**; no 6.x support |
| `drf-spectacular==0.30.0` | Supports Django up to **6.0** only; 6.1 not listed |

Additionally, **PostgreSQL 14 is dropped in Django 6.1** — confirm the deployment runs
PostgreSQL 15+ before upgrading.

The Django codebase itself is clean: `DEFAULT_AUTO_FIELD = BigAutoField` is already set
everywhere, no deprecated `url()` patterns are used, Django's email framework is not used
(so the `EMAIL_BACKEND` → `MAILERS` deprecation chain is irrelevant), and no custom ORM
expressions returning list `params` exist. The custom `SplitAuthorizationHeaderMiddleware`
uses `MiddlewareMixin` which provides the async adapter automatically, so the Django 6.1
async-middleware change should not require code edits — but smoke-test it.

Do not upgrade until `django-cors-headers`, `django-celery-results`, and `drf-spectacular`
publish releases that declare Django 6.1 support.

---

## Infrastructure

### CLN (Core Lightning) — hard version cap at `≤ v25.09.x`

**Component**: `docker/cln/plugins/holdinvoice` binary

**Current holdinvoice**: `v4.0.0`
**Supported CLN range**: up to `v25.09.x` only

`holdinvoice v4.0.0` does not support CLN `v26.06+`. Upgrading CLN beyond `v25.09.x`
causes the plugin to fail silently — hold invoices never reach `ACCEPTED` state, breaking
all invoice-locking (maker bond, taker bond, trade escrow) in both production and tests.

Before upgrading CLN, verify a compatible holdinvoice release exists at:
https://github.com/daywalker90/holdinvoice/releases

See `api/lightning/AGENTS.md` for full details.
