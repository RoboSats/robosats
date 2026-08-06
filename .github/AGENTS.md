# /.github — CI/CD, Governance, Community Intake

## Purpose
CI/CD automation, release orchestration, CODEOWNERS enforcement, PR template, and
structured community intake (federation onboarding, payment methods, bug reports,
feature requests). Contains no product code.

## Layout
| Path | Role |
|---|---|
| `workflows/` | 12 GitHub Actions workflows — see child doc (load on demand) |
| `ISSUE_TEMPLATE/` | Structured issue forms for federation, payment methods, bugs, features |
| `CODEOWNERS` | Auto-assign reviewers; single rule `* @RoboSats/maintainers` |
| `pull_request_template.md` | PR checklist; requires pre-commit install |

Child doc: `workflows/AGENTS.md`

## Release Topology
Triggered by `push: tags: v*.*.*`. Every reusable workflow is called pinned to `@main`
(the live workflow definitions, not the tag being released).

```
push tag v*.*.*
  └─ check-versions ──────────────────────────────────────────────────────────┐
       └─ frontend-build                                                       │
             ├─ integration-tests ──→ coordinator-image (needs tests + build)  │
             ├─ selfhosted-client-image                                        │
             ├─ web-client-image                                               │
             ├─ android-build                                                  │
             └─ desktop-build                                                  │
                                                                               │
  release (needs ALL above) ◄─────────────────────────────────────────────────┘
    draft GitHub release + APK/zip asset upload
```

## Version-Parity Invariant
All four version sources must match before any release artifact is built. Mismatch
aborts `check-versions` and nothing proceeds.

| Source | Expression |
|---|---|
| Git tag | `git describe --tags --abbrev=0` stripped of `v` prefix |
| Frontend | `jq -r .version frontend/package.json` |
| Android | `grep -oP '(?<=versionName = ").*?((?=\-)\|$)' android/app/build.gradle.kts` |
| Coordinator | `jq -r .major version.json`.`minor`.`patch` |

**Rule**: bump all four files in the same commit before pushing a release tag.

## Secrets
| Secret | Used by | Purpose |
|---|---|---|
| `PERSONAL_TOKEN` | `frontend-build.yml` | Cross-workflow dispatch (pre-release Docker images) |
| `DOCKER_USERNAME` / `DOCKER_PASSWORD` | image workflows | Docker Hub push to `recksato/*` |
| `KEYSTORE` / `KEY_ALIAS` / `KEY_PASS` / `KEY_STORE_PASS` | `android-build.yml` | APK signing |
| `GITHUB_TOKEN` | `release.yml` | GitHub release + asset upload |

## Governance
- **CODEOWNERS**: `* @RoboSats/maintainers` — last-match-wins; enforcement requires
  "Require review from Code Owners" enabled in Settings → Branches for `main`.
- **PR template**: single checkbox list requiring `pip install pre-commit &&
  pre-commit install` before merge (enforces ruff + ESLint/Prettier hooks locally).

## Issue Templates
| Template | Label | Assignee | Downstream effect |
|---|---|---|---|
| `coordinator_registration.yaml` | `Federation` | `KoalaSat` | Entry in `frontend/static/federation.json` |
| `payment_method.md` | `Payment method` | — | Entry in frontend PaymentMethods list |
| `bug_report.md` | — | — | Triage only; privacy warning on screenshots |
| `feature_request.md` | — | — | Triage only |

### Federation Onboarding (`coordinator_registration.yaml`)
The issue thread is the **official comms channel** between the prospective coordinator and
the dev team. Technically proficient applicants may PR `federation.json` directly; partial
submissions are accepted and updatable later. Required fields: `alias` (short + long),
`description`, `motto`, `devfund`, `pgp`, `privacy-policy`, `data-policy`, `onion-mainnet`,
`onion-testnet`, `nodeids-mainnet`, `nodeids-testnet`, and acceptance of `federation.md`
(the binding Federation Basis).

The `shortAlias` is the **cross-layer identifier** — must match exactly across:
`frontend/static/federation.json`, `nodeapp/coordinators/{alias}/` nginx config, and
`/order/<shortAlias>/<orderId>/` frontend routes. See `nodeapp/coordinators/AGENTS.md`
for the port-matrix constraint.

**DevFund business logic**: donations voluntary, no minimum; backend `.env` default 20%.
The value in the template is **display-only** and must match the coordinator's `.env`
`DEVFUND` setting. The RoboSats client **randomly sorts coordinators weighted by their
DevFund donation value** — higher donors surface earlier in the order book. DevFund
contributors receive priority dev support. Post-decentralization, DevFund donations are
the project's only revenue source (no VC, no coordinator fees to the core team).

## Product Intent
- **Build-once / fan-out**: a single webpack run in `frontend-build.yml` produces all 5
  platform artifacts — every downstream target ships byte-identical frontend code.
- **Draft releases only**: the final `release` job creates a `draft: true` GitHub release
  requiring a human to publish, preventing accidental public release.
- **Reusable-workflow pinning at `@main`**: release jobs always run the current `main`
  workflow definitions, not the ones at the tagged commit.
- **Community intake is structured**: federation and payment-method additions arrive as
  issue-template forms, not free-form PRs, so required fields are always present.

## Traps
- `release.yml` uses deprecated `::set-output` to pass `semver` out of `check-versions`;
  `actions/upload-release-asset@v1` and (in android pre-release path)
  `actions/create-release@v1` are also deprecated/archived upstream.
- Path-filter globs on push/PR triggers are bare directory names (e.g.
  `paths: [ "frontend" ]`) without `/**` — these filters likely never match file changes
  inside those directories. Affects `frontend-build`, `integration-tests`, image workflows,
  `android-build`, `desktop-build`.
- `pull_request_target` + `github.event.pull_request.head.sha` checkout in `js-linter`,
  `py-linter`, and `integration-tests` — runs untrusted fork code in a privileged context.

## Constraints
- Always bump all four version files (tag, `frontend/package.json`, `version.json`,
  `android/app/build.gradle.kts`) together before pushing a release tag.
- Never make releases non-draft — human sign-off before publish is required.
- Never rename a `federation.json` `shortAlias` without coordinating with nodeapp nginx
  config and frontend routes simultaneously.
- Never add a coordinator whose `shortAlias` collides with an existing nodeapp port
  assignment — consult `nodeapp/coordinators/AGENTS.md` first.
