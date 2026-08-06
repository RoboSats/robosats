# /.github/workflows — GitHub Actions Workflows

## Purpose
12 workflows: one build orchestrator (`frontend-build.yml`) that is the single source of
all static bundles, downstream build/image/test workflows that consume those artifacts, two
linters, CodeQL scanning, and a weekly third-party data sync.

## Workflow Table
| Workflow file | Name | Trigger | Consumes | Produces |
|---|---|---|---|---|
| `frontend-build.yml` | Build: Frontend All Bundles | dispatch / workflow_call(`semver`) / push+PR `main paths:["frontend"]` | — | 5 artifacts (see below) + dispatches 3 Docker workflows when non-release |
| `integration-tests.yml` | Test: Coordinator | dispatch / workflow_call / push `main paths:["api","chat","control","robosats"]` / `pull_request_target **.py` | `django-main-static` | coverage HTML artifact |
| `coordinator-image.yml` | Docker: Coordinator | dispatch / workflow_call(`semver`) / push+PR `main paths:["api","robosats","frontend"]` | `django-main-static` | Docker image `recksato/robosats` |
| `selfhosted-client-image.yml` | Docker: Selfhosted Client | dispatch / workflow_call(`semver`) / push+PR `main paths:["frontend","nodeapp"]` | `nodeapp-main-static` | Docker image `recksato/robosats-client` |
| `web-client-image.yml` | Docker: Web Client | dispatch / workflow_call(`semver`) / push+PR `main paths:["frontend","web"]` | `web-main-static` | Docker image `recksato/robosats-web` |
| `android-build.yml` | Build: Android | workflow_call(`semver`, secrets) / push+PR `main paths:["android","frontend"]` | `mobile-web.bundle` | APK artifacts (4 ABIs) |
| `desktop-build.yml` | Build: Desktop | dispatch / workflow_call(`semver`) / push+PR `main paths:["desktopApp","frontend"]` | `desktop-main-static` | desktop zip artifacts (mac/linux/win) |
| `release.yml` | Release | `push: tags: v*.*.*` | all build artifacts | Draft GitHub release + all APK/zip assets |
| `js-linter.yml` | Lint: Javascript Client | push `main` / `pull_request_target **.(js\|ts\|tsx)` | — | ESLint + Prettier check |
| `py-linter.yml` | Lint: Python Coordinator | push `main` / `pull_request_target **.py` | — | ruff check (`chartboost/ruff-action@v1`) |
| `codeql.yml` | CodeQL Advanced | push/PR `main` / `schedule: Sun 21:27 UTC` | — | GitHub security alerts |
| `lnproxy-sync.yml` | Sync lnproxy relays | `schedule: Sun 12:00 UTC` | live `lnproxy-webui2/assets/relays.json` | PR against `main` updating `frontend/static/lnproxies.json` |

## Artifact Contract (frontend-build → all downstream consumers)
| Artifact name | Source paths | Consumed by |
|---|---|---|
| `django-main-static` | `frontend/static`, `frontend/templates/frontend/*.html` | `integration-tests`, `coordinator-image` |
| `nodeapp-main-static` | `nodeapp/static`, `nodeapp/*.html` | `selfhosted-client-image` |
| `desktop-main-static` | `desktopApp/static`, `desktopApp/*.html` | `desktop-build` |
| `web-main-static` | `web/static`, `web/*.html` | `web-client-image` |
| `mobile-web.bundle` | `android/app/src/main/assets` | `android-build` |

`frontend-build.yml` uses Node **16.17.0** + `NODE_OPTIONS=--max-old-space-size=4096`.
All 5 uploads use `actions/upload-artifact@v4`.

## Pre-release Fan-out (non-release only)
When `inputs.semver == ''` (i.e. a plain push to `main`, not a tag release),
`frontend-build.yml` dispatches the three Docker image workflows via
`benc-uk/workflow-dispatch@v1` + `PERSONAL_TOKEN`. Android and desktop builds are
**not** dispatched on plain pushes — they are release-only artifacts.

## Integration Tests (`integration-tests.yml`)
- **Stack**: `docker-tests.yml` with services `bitcoind`, `postgres`, `redis`,
  `coordinator-LND`/`coordinator-CLN`, `robot-LND`, `coordinator` (health-polled).
- **Matrix**: `python-tag: 3.12.3-slim-bookworm` × `ln-vendor: [LND, CLN]`;
  `lnd-version: v0.18.2-beta`, `cln-version: v24.08`; `max-parallel: 2`; 30 min timeout.
- **Patching**: `sed`-patches `Dockerfile` FROM line and `.env-sample LNVENDOR` before
  build; `ROBOSATS_ENVS_FILE=".env-sample"`, `DEVELOPMENT=True`, `USE_TOR=False`.
- **Coverage**: `docker exec test-coordinator coverage run manage.py test` + `coverage report`
  + `coverage html`; uploads artifact `coverage-report-{python-tag}-{ln-vendor}-{run_id}`.
- Integration tests gate `coordinator-image` in `release.yml` — coordinator image only
  builds after both LND and CLN test jobs pass.

## Docker Images
| Image | Arch | Context | Notes |
|---|---|---|---|
| `recksato/robosats` | **amd64 only** (no QEMU/buildx) | `.` (repo root) | Bakes long commit hash into `commit_sha` file at repo root before build |
| `recksato/robosats-client` | `linux/amd64,linux/arm64` | `./nodeapp` | QEMU + buildx |
| `recksato/robosats-web` | `linux/amd64,linux/arm64` | `./web` | QEMU + buildx |

Tag set (all three): `type=ref,event=pr`, `type=ref,event=tag`,
`type=semver,pattern={{major}}.{{minor}}`, `type=sha,priority=100,format=short`,
`type=raw,value=latest`. Uses `docker/metadata-action@v5` + `docker/build-push-action@v6`.

## Android Build (`android-build.yml`)
- Node: N/A; Gradle cache on `~/.gradle/caches`.
- `cd android && ./gradlew assembleRelease --stacktrace`.
- **IzzyOnDroid FOSS scan**: downloads Apktool 2.7.0 jar+wrapper, clones
  `gitlab.com/IzzyOnDroid/repo`, runs `repo/bin/scanapk.php` on the universal APK. Purpose:
  keeps the APK acceptable for IzzyOnDroid and F-Droid alternative app stores.
- **Signing**: `r0adkll/sign-android-release@v1`, `BUILD_TOOLS_VERSION: "34.0.0"` →
  `*-unsigned-signed.apk`.
- Release path (`semver != ''`): uploads 4 ABI artifacts (universal, arm64-v8a, armeabi-v7a, x86_64).
- Non-release path: cuts a **draft** pre-release via `actions/create-release@v1` and
  uploads universal + arm64-v8a + armeabi-v7a only (x86_64 omitted on this path).

## Desktop Build (`desktop-build.yml`)
- Node 16; downloads `desktop-main-static` into `desktopApp/`.
- `apt-get install zip`; runs `npm run package-mac`, `package-win`, `package-linux`
  (all cross-compiled on `ubuntu-latest`); **never runs `npm run compile` (tsc)**.
- Artifact names use `inputs.semver` for release builds, short commit hash otherwise.

## lnproxy Sync (`lnproxy-sync.yml`)
- Weekly (Sundays 12:00 UTC): curls live relay list → `node ./scripts/lnproxy-sync.js` →
  `peter-evans/create-pull-request@v6` with branch `lnproxy-{date}`, `delete-branch: true`.
- **Never auto-commits to `main`** — always a PR so a maintainer reviews third-party data.

## Product Intent
- **Build-once / fan-out** is the core CI invariant: one `npm run build` produces every
  platform bundle; downstream jobs only download and package, never rebuild from source.
- **Real-node regtest gates coordinator image**: integration tests run against actual LND
  and CLN nodes; mock tests cannot catch payment-flow regressions (mirrors `tests/AGENTS.md`
  policy "never mock the Lightning layer").
- **FOSS scan protects distribution channels**: IzzyOnDroid/F-Droid reject APKs containing
  non-free libraries; the `scanapk.php` gate must pass for every release.
- **Draft releases require human sign-off**: releases are never auto-published.
- **lnproxy PR keeps human review**: third-party relay data changes are always human-reviewed
  before landing in `main`, preventing silent supply-chain edits.

## Traps
1. **Path filters missing `/**`** — `paths: [ "frontend" ]`, `["api","chat",…]`, etc. use
   bare directory names; GitHub's path filter requires glob patterns to match files inside
   a dir. These push/PR triggers likely never fire on file changes within those directories.
2. **`pull_request_target` + PR-head checkout** in `js-linter.yml`, `py-linter.yml`, and
   `integration-tests.yml` — checks out `github.event.pull_request.head.sha` (fork code)
   with privileged context and secret access.
3. **Deprecated actions**: `::set-output` in `release.yml check-versions`;
   `actions/upload-release-asset@v1` (all APK/zip uploads in `release.yml`);
   `actions/create-release@v1` (android non-release path).
4. **Coverage artifact likely empty**: `integration-tests.yml` uploads `htmlcov/` from the
   runner host, but `coverage html` ran inside the `test-coordinator` Docker container —
   the host directory is empty.
5. **Dead step in `android-build.yml`**: `kaisugi/action-regex-match@v1.0.1` on `github.ref`
   is run but its output is never consumed by any subsequent step.
6. **Malformed pre-release APK asset names**: the non-release android path names assets with
   `github.ref` (e.g. `refs/tags/…`) — includes the `refs/…` prefix, producing invalid
   filenames. x86_64 APK is also omitted from this path.
7. **`desktop-build.yml` never runs tsc**: `npm run compile` is not in the CI script; a
   stale committed `desktopApp/index.js` ships silently (see `desktopApp/AGENTS.md`).
8. **`js-linter.yml` runs `npm run format`** (Prettier write mode) — Prettier writes files
   in place rather than failing; this step likely never blocks CI on formatting issues.
9. **`codeql.yml` uses `checkout@v4`** while all other workflows use `v5`; its `runs-on`
   expression branches on `swift` (absent from the matrix → always falls through to default).
10. **`py-linter.yml` uses `chartboost/ruff-action@v1`** (third-party, no SHA pin).

## Constraints
- Never add a new build target without adding its artifact upload to `frontend-build.yml`
  and its download + consumption to the relevant downstream workflow.
- Never rename a `frontend-build.yml` artifact without updating every consumer workflow
  and the `release.yml` asset download steps simultaneously.
- Never remove or bypass the `integration-tests` gate before `coordinator-image` in
  `release.yml`.
- Never remove the IzzyOnDroid `scanapk.php` step without an alternative FOSS-compliance
  gate.
- Keep LND and CLN in the integration test matrix symmetrically.
- The `lnproxy-sync` workflow must always open a PR — never auto-commit third-party data.
