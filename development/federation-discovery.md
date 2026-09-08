# Federation Discovery

## Why this exists

`frontend/static/federation.json` is compiled into the app bundle. Adding or removing a
coordinator requires a full app release. This document describes the runtime discovery
mechanism that removes that dependency after the one-time release shipping this feature.

---

## Part 1 — Shipped design: hash-first discovery

### Performance

The original design fetched the full `federation.json` from every coordinator (53 KB
over Tor per poll). The shipped design reduces this to **zero bytes in the common case**
by piggybacking on `/api/info/`, which is already polled for every coordinator by
`loadDevFund()`.

```
full document poll (original):  3 × 17,731 B = 53,193 B
hash-first (no change):              3 × 64 B =    192 B  → 277× reduction
hash-first (change detected):                   ~17,731 B  (one coordinator, once)
```

### Three-phase flow

**Phase A — zero new requests.**
`/api/info/` now includes a `federation_hash` field (SHA-256 of the coordinator's
normalized canonical federation document). `loadDevFund()` already fetches `/api/info/`
from every enabled coordinator. `refreshFederationList()` is called at the end of
`loadDevFund()`, after all coordinator info is populated, and simply reads
`coordinator.info.federation_hash`. No new Tor circuits opened.

**Phase B — seniority-weighted vote (pure, no I/O).**
```
votes = [{ alias, hash } for each coordinator that reported federation_hash]

Minimum quorum: ≥ 2 votes; else → no decision (keep current doc).

For each voter:
  weight = seniorityWeight(trustedEstablished(alias), oldestTrustedDate, now)

  trustedEstablished priority (root of trust = client's own data only):
    1. bundled seed date  (compiled into the app bundle — cannot be spoofed)
    2. client's persisted join-date ledger  (federation_join_dates storage key)
    3. null  → WEIGHT_MIN (1)

  Piecewise linear, anchored on the oldest voter's trusted date:
    age <  1 year  →  1 + floor(3 × age / ONE_YEAR)          [ramp 1 → 3]
    age >= 1 year  →  4 + floor(6 × (age−1y) / (oldest−1y)) [ramp 4 → 10]

  Special cases:
    null / future-dated established  → WEIGHT_MIN (1)
    all voters under 1 year old      → use lower ramp only (young federation)

A hash wins only with STRICT MAJORITY: its total weight > 50% of all weight.
On indecision (tie / quorum not met) → winnerHash = null.
  The caller keeps the client's current trusted document unchanged.
  "No decision" is always the safe direction — it never regresses.
```

**Phase C — fetch once on mismatch.**
If the winning hash equals the current trusted doc's hash → done, nothing downloaded.
If it differs → fetch `/api/federation/` from ONE coordinator that voted for the
winning hash, recompute the hash locally, and require it to equal the winning hash.
Mismatch → discard, keep current. The document must hash to the voted value, so a
coordinator cannot serve a doc different from what it committed to via `/api/info/`.

### Seniority weight table (live federation, 2026-08-26)

| Coordinator | Established  | Age    | Weight |
|-------------|--------------|--------|--------|
| temple      | 2023-12-02   | ~2.7y  | **10** |
| lake        | 2023-12-30   | ~2.7y  | **9**  |
| bazaar      | 2025-05-20   | ~1.3y  | **4**  |
| freedomsats | 2025-06-30   | ~1.2y  | **4**  |
| alice       | 2025-11-27   | ~0.75y | **3**  |
| any sybil   | today        | ~0     | **1**  |

Honest total ≈ 30. An attacker needs **16 fresh sybils** (weight 16 > 15, i.e. >50%)
to force a change — vs. just 5 under the old equal-weight vote.

### Sybil resistance — why established dates can't be spoofed

Coordinator-served `established` fields are **never used** for weight computation.
The only two trusted sources are:
1. The bundled seed `federation.json` (compiled into the app at release time).
2. The client's persisted `federation_join_dates` ledger (set locally when the
   client *first accepts* a newcomer, regardless of what the doc claims).

A sybil claiming `established: 2020` in its federation.json receives weight 1 on
every client until the client has personally observed it for a full year.

### Join-date ledger (`federation_join_dates`)

Written by `refreshFederationList` on the first successful acceptance of each
newcomer coordinator (alias absent from the bundled seed).  The ledger value is
the client's local observation date — never a date from any served document.  This
means seniority accumulates from the client's own clock, independently on each
device, and is not transferable or spoofable.

### Normalization (what gets hashed)

Only identity/reachability fields are included; cosmetic fields (`description`, `motto`,
`color`, `policies`, `badges`, `contact`) are excluded so a typo-fix never splits the
vote. Included: `shortAlias`, `nostrHexPubkey`, `established`, `federated`,
`mainnetNodesPubkeys`, `testnetNodesPubkeys`, `mainnet/testnet.{onion,clearnet,i2p}`.

Canonical serialization: parse → sort all keys recursively → compact JSON → UTF-8 →
SHA-256 hex. Verified on the live file: reordered+reindented produces the same hash;
one character change produces a different hash.

### Indecision is safe

When no hash reaches strict majority (fragmented vote, quorum not met, all weights
equal), `voteOnHashes` returns `winnerHash = null` and `refreshFederationList` exits
without touching the current document or the manifest.  The federation never regresses
to a less-trusted state on indecision.

### Validation before a document can win

- Non-empty `object` of `object` entries; `shortAlias` matches key + `/^[a-z0-9]{1,20}$/`
- `mainnet.onion` must contain `.onion` — **Tor-less entries are rejected outright**

### Badges are not votable

Re-applied from the bundled seed after adoption. Coordinators absent from the seed get
neutral badges and zero lottery weight (via `devfundOverrides=0` in `federationLottery`)
so self-declared `donatesToDevFund` cannot buy order-book placement.

### Coordinator side

`GET /api/federation/` (`FederationView`, `api/views.py`). Reads from
`FEDERATION_JSON_PATH` env var if set, else the bundled copy. Operators change their
vote by editing this file — **no coordinator release needed**. Redis-cached 5 min.

### Lifecycle (client)

`FederationContext.tsx` calls `federation.refreshFederationList()` on mount and on
`settings.network` / `torStatus` / `settings.connection` change.
`refreshFederationList` fetches all coordinator `/api/federation/` endpoints (Tor,
silent), votes, rebuilds the coordinator map if the winner differs from the seed,
updates `RoboPool` relays, Android `federation_relays`/`federation_pubkeys`, and
triggers `onFederationUpdate`.

### nodeapp behaviour

`/nodeapp` (the self-hosted container) uses static hardcoded socat Tor bridges — one per
coordinator per network. This is intentional and **does not need to change**:

- **Removed coordinator**: the client's voted manifest no longer lists it, so the
  frontend stops routing traffic to it. The stale socat bridge keeps running harmlessly.
- **New coordinator**: the bridge for it does not exist in a running container, so
  self-hosted users cannot reach it until a new image is released. This is acceptable —
  new coordinators are rare, and other platforms (web, desktop, mobile) work immediately.
- A future release can add the new coordinator's bridge in the normal way (`robosats-client.sh`
  + `coordinators/{alias}/`), which is already documented in `nodeapp/coordinators/AGENTS.md`.

### Files changed

| File | Change |
|---|---|
| `api/views.py` | `FederationView` + helpers (`_normalize_federation`, `_canonical_hash`, `_load_federation_doc`) |
| `api/urls.py` | `path("federation/", ...)` |
| `api/oas_schemas.py` | `FederationViewSchema` |
| `api/tests/test_federation.py` | 14 unit tests (incl. null-attr coercion, golden hash, `/api/info/` field, validator alignment) |
| `api/federation.json` | Copy of `frontend/static/federation.json` (kept in sync by webpack + CI) |
| `.env-sample` | `FEDERATION_JSON_PATH` |
| `frontend/src/services/FederationDiscovery/index.ts` | seniority-weighted vote / normalize / validate / fetch+verify |
| `frontend/src/services/FederationDiscovery/__tests__/index.test.ts` | frontend unit tests (golden hash, null coercion, weight math, sybil-attack, vote logic, validation) |
| `frontend/src/models/Federation.model.ts` | `refreshFederationList` + join-date ledger + `liveFedDoc` cold-start bootstrap |
| `frontend/src/utils/federationLottery.ts` | `_votedIn` guard via `devfundOverrides` |
| `frontend/src/utils/nostr.ts` | `liveCoordinators` + `setLiveCoordinators` |
| `frontend/src/services/RoboPool/index.ts` | `liveFederationPubkeys` + `setFederationPubkeys` |
| `frontend/src/utils/getHost.ts` | reads `Federation.liveFedDoc` for mobile bootstrap |
| `frontend/src/components/HostAlert/UnsafeAlert.tsx` | `safeUrls` from live coordinator list |
| `frontend/src/basic/TopBar/NotificationsDrawer/index.tsx` | coordinator lookup via `federation.getCoordinators()` |
| `frontend/webpack.config.ts` | copies `frontend/static/federation.json` → `api/federation.json` on build |
| `.github/workflows/release.yml` | CI check: federation.json files are in sync |

---

## Part 2 — Registered migration: Option A (Nostr-native quorum endorsement)

### Why migrate

HTTP voting polls coordinators the client already knows — it cannot bootstrap a new
member without a seed hop. Nostr-native discovery is self-propagating over the existing
Tor relay mesh. Additionally the HTTP model still relies on the bundled seed for the
initial trust anchor.

### Prerequisite: add `verifyEvent`

`grep -r 'verifyEvent\|validateEvent' frontend/src` returns zero results today. Trust
rests entirely on `RoboPool`'s `authors` filter. Before enabling Nostr discovery, every
relay event **must** be verified with `verifyEvent` from `nostr-tools`.

### New event kinds

**`kind 38384` — self-announcement** (addressable, signed with existing `NOSTR_NSEC`):
```
tags: ["d","<shortAlias>"], ["z","coordinator"], ["y","robosats"],
      ["network","mainnet"], ["s","active"|"retired"],
      ["relay","ws://…onion/relay/"], ["onion","http://…onion"],
      ["node","<ln pubkey>"], ["pgp","<fingerprint>"], ["devfund","0.2"]
content: JSON { longAlias, description, motto, color, contact, policies, established }
```

**`kind 30000 d=robosats-federation` — membership endorsement** (NIP-51 peer set):
```
tags: ["d","robosats-federation"], ["p","<hexpubkey>","<relay>","<shortAlias>"] × N
```

### Trust model

Quorum: `max(2, ceil(trustedSeeds / 3))`. A coordinator is shown when endorsed by
enough current members. Leave = publish `s=retired` or go stale (7 days no re-publish).

### What carries over unchanged

Normalization, canonical hash, vote logic, validation, badge re-application, and
`refreshFederationList` wiring are **transport-agnostic** — migrating replaces only
the HTTP fan-out in `discoverFederation` with `RoboPool.subscribeFederation()` (new
`REQ` for kinds 38384 + 30000), adds `verifyEvent`, and raises the quorum threshold.

### Relay mesh additions needed

Add kinds 38384 and 30000 to `--filter` in:
- `docker/strfry/sync.sh`
- `scripts/traditional/strfry-sync-federation`
