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
| temple | 102 | 1002 | ✅ yes | |
| lake | 104 | 1004 | ✅ yes | |
| moon | 106 | 1006 | ✅ yes | |
| bazaar | 107 | 1007 | ❌ same onion | testnet traffic hits mainnet service |
| freedomsats | 108 | 1008 | ❌ same onion | **BUG**: port collision with alice — see Traps |
| alice | 108 | 1008 | ❌ same onion | **BUG**: port collision with freedomsats; `upstreams.conf` wrongly points to 107/1007 |

Testnet port convention: mainnet port + 900 (e.g. 102 → 1002).

## `upstreams.conf` Contract
```nginx
upstream mainnet_{alias} {
    server 127.0.0.1:{mainnet_port};
}
upstream testnet_{alias} {
    server 127.0.0.1:{testnet_port};
}
```
Both upstream names must match exactly what `locations.conf` references in `proxy_pass`.

## `locations.conf` Route Set (canonical pattern, per coordinator)
| Location | Upstream | Notes |
|---|---|---|
| `/mainnet/{alias}/static/assets/avatars/` | `mainnet_{alias}` | Coordinator avatar images |
| `/mainnet/{alias}/api/` | `mainnet_{alias}` | REST API; WS upgrade headers set (`Upgrade`, `Connection "Upgrade"`, `Host $host`, `proxy_http_version 1.1`) |
| `/mainnet/{alias}/ws/` | `mainnet_{alias}` | WebSocket; same upgrade headers |
| `/mainnet/{alias}/relay/` | `mainnet_{alias}` | Nostr relay; also sets `Origin $http_origin` + `add_header Access-Control-Allow-Origin *` |
| `/testnet/{alias}/static/assets/avatars/` | `testnet_{alias}` | Coordinator avatar images (testnet) |
| `/testnet/{alias}/api/` | `testnet_{alias}` | |
| `/testnet/{alias}/ws/` | `testnet_{alias}` | |
| `/testnet/{alias}/relay/` | `testnet_{alias}` | Nostr relay; same upgrade headers + `Origin $http_origin` + `Access-Control-Allow-Origin *` as the mainnet relay |

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
- **Testnet support in nodeapp is best-effort.** Three of five coordinators (bazaar,
  freedomsats, alice) share a single onion for mainnet and testnet, so their testnet
  traffic (API, WS, and relay) hits the mainnet service — the coordinator must distinguish
  them server-side. Only temple and lake have distinct testnet onions with a real testnet
  relay.

## Traps
- `coordinators/alice/upstreams.conf` comments say "Libre Bazaar" (copy-paste error) and
  its upstream servers point to `127.0.0.1:107/1007` (Bazaar's ports) instead of alice's
  socat ports 108/1008 — alice API/WS traffic currently routes to Libre Bazaar. Fix pending
  in an open PR; live in `:latest`.
- `robosats-client.sh` assigns `mainnet_alice_port=108` and `mainnet_freedomsats_port=108`
  — identical ports; the second socat process to bind will fail (`EADDRINUSE`). Fix pending
  in the same PR; live in `:latest`. **Net effect: one of alice or freedomsats is
  completely unreachable in any running `:latest` container.**
- All five `locations.conf` testnet avatar routes now use `/testnet/{alias}/...`
  consistent with the API/WS routes — fixed in this codebase.
- All five `locations.conf` now include a `/testnet/{alias}/relay/` route — fixed in this
  codebase. For bazaar/freedomsats/alice the route proxies to the shared onion, so the
  same relay serves mainnet and testnet events (the client filters by `network` tag).
- `coordinators/freedomsats/upstreams.conf` comments say "Libre freedomsats" — another
  copy-paste artefact; functionally harmless but misleading.
- Several `locations.conf` comments name the wrong coordinator (e.g., lake's testnet
  section heading says "Freedomsats Coordinator Testnet Locations", bazaar's says
  "TheBigLake Coordinator Mainnet") — copy-paste artefacts; functionally harmless.

## Constraints
- Every coordinator must have a **unique** mainnet port and a **unique** testnet port
  across the full matrix — reuse causes a silent socat bind failure at container start.
- Upstream names (`mainnet_{alias}`, `testnet_{alias}`) must match exactly in both
  `upstreams.conf` and `locations.conf` for the same coordinator.
- Never duplicate the nginx include lines for the same coordinator in `nginx.conf`.
- When copying an existing coordinator as a template, prefer temple or lake as the source
  — they have distinct testnet onions and clean configs.
