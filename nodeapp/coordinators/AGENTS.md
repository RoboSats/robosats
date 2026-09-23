# /nodeapp/coordinators — Per-Coordinator Nginx Config

## Purpose
One subdirectory per federation coordinator. Each contains exactly two files loaded by
`nginx.conf`: `upstreams.conf` (http-block upstream definitions) and `locations.conf`
(server-block location blocks). The coordinator alias doubles as the URL path segment
(`/mainnet/{alias}/...`), the nginx upstream name (`mainnet_{alias}`), and the directory
name — all three must match exactly.

## Port Matrix (`robosats-client.sh` socat ↔ `upstreams.conf`)
| Coordinator | Mainnet socat port | Testnet socat port | Distinct testnet onion? | Notes |
|---|---|---|---|---|
| temple | 102 | 1002 | ✅ yes | Full testnet nginx locations |
| lake | 104 | 1004 | ✅ yes | Full testnet nginx locations |
| bazaar | 107 | — | ❌ no testnet bridge | Nginx answers `/testnet/bazaar/` with `return 503` |
| alice | 109 | — | ❌ no testnet bridge | Nginx answers `/testnet/alice/` with `return 503` |
| eleuteria | 110 | 1010 | ✅ yes | Full testnet nginx locations |
| freeport | 111 | — | ❌ no testnet bridge | Nginx answers `/testnet/freeport/` with `return 503` |
| ammanaya | 112 | — | ❌ no testnet bridge | Nginx answers `/testnet/ammanaya/` with `return 503` |

Testnet port convention for coordinators that have testnet: mainnet port + 900 (e.g. 102 → 1002).
There is no `moon` coordinator — that entry was a documentation error.

## `upstreams.conf` Contract
Coordinators with a live testnet bridge (temple, lake, eleuteria) declare both upstreams:
```nginx
upstream mainnet_{alias} {
    server 127.0.0.1:{mainnet_port};
}
upstream testnet_{alias} {
    server 127.0.0.1:{testnet_port};
}
```
Mainnet-only coordinators (bazaar, alice, freeport, ammanaya) declare only `mainnet_{alias}`.
Both upstream names must match exactly what `locations.conf` references in `proxy_pass`.

## `locations.conf` Route Set (canonical pattern, per coordinator)

**Mainnet routes** — present on every coordinator:
| Location | Upstream | Notes |
|---|---|---|
| `/mainnet/{alias}/static/assets/avatars/` | `mainnet_{alias}` | Coordinator avatar images |
| `/mainnet/{alias}/api/` | `mainnet_{alias}` | REST API; WS upgrade headers set (`Upgrade`, `Connection "Upgrade"`, `Host $host`, `proxy_http_version 1.1`) |
| `/mainnet/{alias}/ws/` | `mainnet_{alias}` | WebSocket; same upgrade headers |
| `/mainnet/{alias}/relay/` | `mainnet_{alias}` | Nostr relay; also sets `Origin $http_origin` + `add_header Access-Control-Allow-Origin *` |
| `/mainnet/{alias}/blossom/` | `mainnet_{alias}` | Blossom media upload proxy |

**Testnet routes** — two patterns depending on coordinator:

*Full testnet locations* (temple, lake, eleuteria — have a live `testnet_{alias}` upstream):
| Location | Upstream | Notes |
|---|---|---|
| `/testnet/{alias}/static/assets/avatars/` | `testnet_{alias}` | Coordinator avatar images (testnet) |
| `/testnet/{alias}/api/` | `testnet_{alias}` | |
| `/testnet/{alias}/ws/` | `testnet_{alias}` | |
| `/testnet/{alias}/relay/` | `testnet_{alias}` | Nostr relay; same upgrade headers + `Origin $http_origin` + `Access-Control-Allow-Origin *` |
| `/testnet/{alias}/blossom/` | `testnet_{alias}` | Blossom media upload proxy (testnet) |

*503 stub* (bazaar, alice, freeport, ammanaya — no testnet bridge):
```nginx
location /testnet/{alias}/ {
    return 503;
}
```

## CORS Policy
- API and WS routes carry **no CORS headers** — all traffic is same-origin through Nginx;
  a commented-out CORS OPTIONS/POST/GET block exists in every `locations.conf` as
  scaffolding only.
- `relay/` sets `Access-Control-Allow-Origin: *` because the Nostr relay client connects
  to it cross-origin.

## Adding a Coordinator
1. Choose unused mainnet port (`{n}`) and testnet port (`{n+900}`) — verify no collision
   with the matrix above.
2. Add socat vars + commands for both networks in `robosats-client.sh`.
3. Create `coordinators/{alias}/upstreams.conf` (exact template above).
4. Create `coordinators/{alias}/locations.conf` (copy a working coordinator's file,
   replace all occurrences of the old alias with the new one and update upstream names;
   prefer temple or lake as the source — they have distinct testnet onions and clean configs).
5. Add two `include` lines in `nginx.conf`: one in the `http` block
   (`conf.d/{alias}/upstreams.conf`) and one in the `server` block
   (`conf.d/{alias}/locations.conf`).

## Removing a Coordinator
Reverse of the above: remove socat lines from `robosats-client.sh`, delete the
`coordinators/{alias}/` directory, and remove both `include` lines from `nginx.conf`.

## Product Intent
- **The alias is the single identifier across all layers.** It is simultaneously the
  directory name, the nginx upstream prefix, the URL path segment, and the key in
  `frontend/static/federation.json`. Keeping these four in sync is a hard invariant.
- **The coordinator set is frozen at build time.** This is intentional: sovereign-node
  users deploy a known, auditable set of coordinators torified at the container level,
  not a runtime-fetched list. Generating this config automatically from
  `federation.json` is a known improvement path but has not been implemented.
- **Testnet support in nodeapp is best-effort.** Only temple, lake, and eleuteria have a
  distinct testnet onion and a live testnet socat bridge with full nginx locations. The
  remaining four coordinators (bazaar, alice, freeport, ammanaya) are mainnet-only —
  `/testnet/{alias}/` returns 503.

## Traps
- Several `locations.conf` comments name the wrong coordinator (e.g., lake's testnet
  section heading says "Freedomsats Coordinator Testnet Locations", bazaar's says
  "TheBigLake Coordinator Mainnet") — copy-paste artefacts; functionally harmless.
- Mainnet-only coordinators (`bazaar`, `alice`, `freeport`, `ammanaya`) have no
  `testnet_{alias}` upstream in `upstreams.conf` — do not add a testnet location block
  for them without first adding the socat bridge in `robosats-client.sh` and the upstream
  in `upstreams.conf`.

## Constraints
- Every coordinator must have a **unique** mainnet port across the full matrix — reuse
  causes a silent socat bind failure at container start. The same applies to testnet ports
  for coordinators that have them.
- Upstream names (`mainnet_{alias}`, `testnet_{alias}`) must match exactly in both
  `upstreams.conf` and `locations.conf` for the same coordinator.
- Never duplicate the nginx include lines for the same coordinator in `nginx.conf`.
- When copying an existing coordinator as a template, prefer temple, lake, or eleuteria
  as the source — they have distinct testnet onions and complete config sets.
- New coordinators must include the `/mainnet/{alias}/blossom/` location block — it is
  part of the canonical mainnet route set.
