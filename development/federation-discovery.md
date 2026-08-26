# Federation Discovery

## Why this exists

`frontend/static/federation.json` is compiled into the app bundle. Adding or removing a
coordinator requires a full app release. This document describes the runtime discovery
mechanism that removes that dependency after the one-time release shipping this feature.

---

## Part 1 — Shipped design: `/api/federation/` + client majority vote

### The vote

```
For each voter: parse → normalize → canonical JSON → SHA-256 → hash

Step 1 — coordinator-only tally (client excluded):
  single plurality  →  adopt that document
  tied              →  go to step 2

Step 2 — coordinators are split, client breaks the tie by casting 2 votes
          for the document it already holds (decides positively):
  single plurality  →  adopt that document
  still tied        →  client holds a 3rd version that breaks no bloc
                        → keep client's bundled document (safe fallback)

Minimum quorum: ≥ 2 coordinator responses; else keep bundled unchanged.
```

**Why coordinators go first:** the coordinator-only check in step 1 ensures the client
can never override a coordinator majority. Its 2 votes only matter when coordinators
are exactly split — which is the only case where the client *should* decide.

### Normalization (what gets hashed)

Only identity/reachability fields are included; cosmetic fields (`description`, `motto`,
`color`, `policies`, `badges`, `contact`) are excluded so a typo-fix never splits the
vote. Included: `shortAlias`, `nostrHexPubkey`, `established`, `federated`,
`mainnetNodesPubkeys`, `testnetNodesPubkeys`, `mainnet/testnet.{onion,clearnet,i2p}`.

Canonical serialization: parse → sort all keys recursively → compact JSON → UTF-8 →
SHA-256 hex. Verified on the live file: reordered+reindented produces the same hash;
one character change produces a different hash.

### Tie-break guarantee

Normal join/leave = 2 document versions, client holds one of them.
Exhaustive simulation (349,504 configurations, N=2..12): **zero ties** for all
normal join/leave cases. Coordinators either have a majority (step 1 decides) or are
split evenly (step 2: client casts 2 votes for its version, outnumbering the other side).

The only unresolvable shape: coordinators split across ≥3 versions AND client holds a
3rd that matches no bloc (stale-client edge case). Fallback: keep bundled.

Key property: **coordinators always decide when they agree** — client's ×2 weight
only activates when coordinators are already tied. New rule: 7.3% ties overall
vs 10.6% under the old drop-client rule; both have 0 ties for the normal 2-version flow.

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
| `api/views.py` | `FederationView` + helpers |
| `api/urls.py` | `path("federation/", ...)` |
| `api/oas_schemas.py` | `FederationViewSchema` |
| `api/tests/test_federation.py` | 9 unit tests |
| `.env-sample` | `FEDERATION_JSON_PATH` |
| `frontend/src/services/FederationDiscovery/index.ts` | vote / normalize / validate |
| `frontend/src/models/Federation.model.ts` | `refreshFederationList` |
| `frontend/src/contexts/FederationContext.tsx` | calls `refreshFederationList` |
| `frontend/src/utils/federationLottery.ts` | `_votedIn` guard via `devfundOverrides` |
| `frontend/src/utils/nostr.ts` | `liveCoordinators` + `setLiveCoordinators` |
| `frontend/src/services/RoboPool/index.ts` | `liveFederationPubkeys` + `setFederationPubkeys` |
| `frontend/src/utils/getHost.ts` | reads live manifest from `systemClient` for mobile bootstrap |
| `frontend/src/models/Maker.model.ts` | default coordinator from live manifest |
| `frontend/src/components/HostAlert/UnsafeAlert.tsx` | `safeUrls` from live manifest |
| `frontend/src/basic/TopBar/NotificationsDrawer/index.tsx` | coordinator lookup via `federation.getCoordinators()` |

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
