# /nodeapp — Self-Hosted Client Container

## Purpose
Alpine container serving the RoboSats SPA locally for sovereign-node deployments
(Umbrel, Citadel, Start9, or bare Docker). Runs Nginx + socat: socat opens SOCKS5-over-Tor
TCP bridges to each coordinator `.onion`, Nginx serves the bundled SPA and reverse-proxies
API/WS/Nostr-relay calls through those bridges.

This is **not** the clearnet web client (`unsafe.robosats.org` and similar public web
deployments are served by the separate `/web` directory → `recksato/robosats-web` image;
see `web/readme.md`). The nodeapp image sets `window.RobosatsSettings = 'selfhosted-basic'`
or `'selfhosted-pro'`.

## Architecture
```
Host :12596  (published on the tor service — see Traps)
  └── Nginx  (network_mode: service:tor — shares Tor container's network namespace)
        ├── /                     → SPA (basic.html)
        ├── /pro                  → SPA (pro.html)
        ├── /static/              → filesystem alias /usr/src/robosats/static/ (autoindex on)
        ├── /favicon.ico          → filesystem alias /usr/src/robosats/static/assets/images/favicon-32x32.png
        ├── /selfhosted           → 200 OK (container healthcheck probe)
        └── /mainnet/{alias}/...
        └── /testnet/{alias}/...  → socat upstreams (127.0.0.1:{port})
              └── socat tcp4-LISTEN:{port} … SOCKS5-CONNECT:{Tor}:{onion}:80
```

`network_mode: service:tor` is **mandatory** — all egress exits through Tor.
No clearnet path exists; no I2P fallback is implemented.

## Key Files
| File | Role |
|---|---|
| `robosats-client.sh` | Starts 12 socat bridges (2 per coordinator: mainnet + testnet) then `nginx` in foreground |
| `nginx.conf` | Nginx config; `daemon off;` listen 12596; includes `conf.d/{alias}/upstreams.conf` (http block) + `locations.conf` (server block) per coordinator |
| `Dockerfile` | Alpine 3.23; installs socat + nginx; `COPY . .`; `EXPOSE 12596`; HEALTHCHECK uses `wget` (BusyBox); `CMD ["sh", "robosats-client.sh"]` |
| `docker-compose.yml` | **Dev-only** — builds `../frontend` + `../docker/tor` locally; references non-existent `../node/tor/*` path (see Traps) |
| `docker-compose-example.yml` | **End-user reference** — has both `build: .` and `image: recksato/robosats-client:latest` (see Traps); ports published on the `tor` service |
| `coordinators/` | One subdirectory per coordinator with `upstreams.conf` + `locations.conf` |
| `basic.html` / `pro.html` | **Gitignored webpack outputs** — injected by CI; sets `window.RobosatsSettings = 'selfhosted-basic'/'selfhosted-pro'` |
| `static/` | **Gitignored webpack output** — copied from `frontend/static` by CI before image build |
| `assets/` | App-store listing artwork (Umbrel/Start9/Citadel); **excluded from Docker image** via `.dockerignore` |

Child docs (load on demand):
- `nodeapp/coordinators/AGENTS.md` — coordinator port matrix, nginx route contract, known bugs, add/remove procedure

## CI / Build Pipeline
```
frontend-build.yml
  └── webpack build → artifact "nodeapp-main-static"
        (nodeapp/static/ + nodeapp/basic.html + nodeapp/pro.html)

selfhosted-client-image.yml  (triggered on push/PR to main for frontend|nodeapp paths,
                               or called from release.yml with semver)
  ├── downloads "nodeapp-main-static" into nodeapp/
  └── docker buildx build ./nodeapp → push recksato/robosats-client
        platforms: linux/amd64, linux/arm64
        tags: :latest, :{semver major.minor}, :{short sha}, :{PR ref}
```

The static bundle (`static/frontend/` + HTML entry points) is **never committed to git**
(`nodeapp/static` and `nodeapp/*.html` are `.gitignore`d). HTML files present in the
working tree are local dev builds — never hand-edit them.

The CI `push`/`pull_request` path filter is `paths: ["frontend", "nodeapp"]` — missing
`/**` globs; this filter likely never triggers on file changes *inside* those directories
(same latent bug as `desktop-build.yml`).

## Environment Variables
| Variable | Default | Purpose |
|---|---|---|
| `TOR_PROXY_IP` | `127.0.0.1` | Tor SOCKS5 proxy host |
| `TOR_PROXY_PORT` | `9050` | Tor SOCKS5 proxy port |

## Product Intent
- **Sovereign-node users are the primary audience.** Umbrel, Start9, and Citadel are the
  target deployment platforms. These users already run a Bitcoin/LN full node and want
  to access RoboSats without relying on any third-party web server.
- **Tor is mandatory and non-optional.** `network_mode: service:tor` makes every
  nginx → socat → Tor connection implicit. There is no clearnet API path. Leaking API
  traffic outside Tor contradicts the privacy guarantees of the product.
- **The browser never contacts coordinators directly.** All API/WS/relay traffic is
  same-origin through Nginx, torified by socat → `network_mode: service:tor`. CORS is
  intentionally absent on API and WS routes for this reason. The relay route (Nostr)
  sets `Access-Control-Allow-Origin: *` because the client connects to it cross-origin.
- **Coordinator set is hardcoded** in `robosats-client.sh` and `nginx.conf` at image
  build time. Adding or removing a coordinator requires a code change + image rebuild.
  Generating this config from `frontend/static/federation.json` at build time is a known
  improvement with no active blocker.
- **`/selfhosted → 200 OK`** is the container healthcheck probe only — not used by the
  frontend to detect selfhosted mode. The frontend detects mode via `window.RobosatsSettings`.
- **`/pro` ships as a first-class route.** The pro dashboard (arbitrage view) is accessible
  at `/pro` on any selfhosted deployment — same bundle, just the pro entry point.
- **LAN/VPN access is intentional.** Port 12596 is bound to all interfaces on the tor
  container's network, making it accessible from any device on the same LAN or VPN. There
  is no authentication on the container itself — access control is the deployer's
  responsibility.

## Traps
- **HEALTHCHECK uses `wget`** (BusyBox, ships with Alpine) against `/selfhosted`. `curl`
  is not installed in the image; the previous `curl --fail …` command was always failing.
  Fixed in this codebase; do not replace `wget` with `curl` without adding a curl install.
- **Port 12596 is published by the `tor` service**, not by the `nodeapp` service. Because
  `nodeapp` uses `network_mode: service:tor`, it shares the tor container's network
  namespace. The `ports:` mapping in `docker-compose-example.yml` must be on the `tor`
  service entry, not on `nodeapp`.
- **`docker-compose-example.yml` has both `build: .` and `image: recksato/robosats-client:latest`.**
  Docker Compose uses the `build` key if both are present (when running `docker compose
  up --build`), or pulls the `image` if no build is requested. The intent is pull-only for
  end users — remove `build: .` to avoid ambiguity.
- **`docker-compose.yml` (dev) mounts `../node/tor/data` and `../node/tor/config`** — the
  `../node/` directory is **untracked**; it is created at runtime by the dev stack and is
  absent on a fresh clone. The dev compose will fail at startup unless that directory is
  created first or the volume mounts are adjusted.
- **Three coordinators (bazaar, freedomsats, alice) reuse the same `.onion` for both
  mainnet and testnet** in `robosats-client.sh`. Only temple, lake, and moon have distinct
  testnet onions. This means testnet and mainnet traffic for those three coordinators is
  routed to the same hidden service — the coordinator must distinguish them server-side, or
  testnet is effectively absent for those three.
- **alice and freedomsats both define socat ports 108/1008** — port collision at runtime;
  the second socat to bind will fail (`EADDRINUSE`). Additionally,
  `coordinators/alice/upstreams.conf` points to `127.0.0.1:107/1007` (Bazaar's ports) with
  "Libre Bazaar" comments — alice API/WS traffic currently routes to Libre Bazaar. Both
  bugs are tracked in an open PR; they are live in `:latest`.
- **All six `locations.conf` testnet avatar routes use `/test/{alias}/...`** instead of
  `/testnet/{alias}/...` — testnet avatar requests return 404 for all coordinators.
- **No `/testnet/{alias}/relay/`** route exists in any coordinator config — testnet Nostr
  relay is unreachable through nodeapp.
- **`basic.html` / `pro.html` in the working tree** are local dev outputs — they may pin
  an old bundle version (e.g., v0.8.4 while `static/frontend/` contains v0.8.5). CI
  always injects the correct artifact; never rely on committed HTML.
- `README.md` is stale: "localhost:81", references an old default onion address, "Future:
  I2P" (unimplemented), and a WebLN/getAlby note (not an active product feature).

## Constraints
- Never add a clearnet network path or set `network_mode` to anything other than
  `service:tor`.
- Never hand-edit `basic.html`, `pro.html`, or anything under `static/` — they are CI
  outputs; edit `frontend/templates/frontend/index.ejs` or `frontend/static/` instead.
- When adding a coordinator: update `robosats-client.sh` (unique port pair), create
  `coordinators/{alias}/upstreams.conf` + `locations.conf`, and `include` both in
  `nginx.conf`. See `nodeapp/coordinators/AGENTS.md` for the full procedure.
- Do not replace `wget` in the HEALTHCHECK with `curl` — `curl` is not installed; use
  `wget -q -O-` (BusyBox, ships with Alpine) or install `curl` explicitly.
- Do not assume `nodeapp` sets `network_mode: bridge` — it shares the `tor` service's
  network namespace; any port mapping must live on the `tor` service.
