# /nodeapp — Self-Hosted Client Deployment

## Purpose
Packages the RoboSats frontend as a self-contained container for Umbrel, StartOS, and unsafe.robosats.org deployments. Runs an Nginx reverse proxy that routes API and WebSocket calls through Tor socat bridges to federation coordinators.

## Architecture
```
Host port 12596
    └── Nginx (shares tor container's network namespace)
            ├── /static/ → local filesystem (frontend bundle)
            ├── /        → basic.html SPA fallback
            ├── /pro     → pro.html SPA fallback
            └── /mainnet/{alias}/api|ws|relay|static/
                └── socat SOCKS5 bridge → coordinator .onion:80
```

The `nginx` service uses `network_mode: service:tor` — it shares the Tor container's network stack. All outbound traffic exits through Tor.

## Services (`docker-compose.yml`)
| Service | Role |
|---|---|
| `frontend` | webpack build — produces `/nodeapp/static/frontend/main.*.js` |
| `tor` | Tor daemon, exposes port 12596 to host |
| `nginx` | Reverse proxy — lives on tor's network namespace |

## Socat Bridges (`robosats-client.sh`)
One socat bridge per coordinator per network:
```sh
socat tcp4-LISTEN:{port},reuseaddr,fork,keepalive,bind=127.0.0.1 \
  SOCKS5-CONNECT:${TOR_PROXY_IP}:{onion}:80,socksport=${TOR_PROXY_PORT}
```

Coordinator local ports:
| Coordinator | Mainnet | Testnet |
|---|---|---|
| temple | 102 | 1002 |
| lake | 104 | 1004 |
| moon | 106 | 1006 |
| bazaar | 107 | 1007 |
| freedomsats | 108 | 1008 |
| alice | 108 | 1008 |

All socats run in background (`&`), then nginx runs in foreground.

## Nginx Routes (`nginx.conf`)
| Location | Backend |
|---|---|
| `/` | `try_files $uri /basic.html` (SPA) |
| `/pro` | `try_files $uri /pro.html` (SPA) |
| `/static/` | filesystem alias |
| `/selfhosted` | 200 OK (healthcheck) |
| `/mainnet/{alias}/api/` | proxy_pass to socat upstream + WS upgrade headers |
| `/mainnet/{alias}/ws/` | proxy_pass to socat upstream + WS upgrade headers |
| `/mainnet/{alias}/relay/` | proxy_pass + `Access-Control-Allow-Origin: *` |
| `/mainnet/{alias}/static/assets/avatars/` | proxy_pass (avatar images) |
| `/testnet/{alias}/api\|ws\|static` | same pattern on testnet ports |

Upstreams and locations are included from `/etc/nginx/conf.d/{alias}/`:
- `upstreams.conf` — defines `upstream mainnet_{alias}` → `127.0.0.1:{port}`
- `locations.conf` — defines all location blocks for that coordinator

## Adding a New Coordinator
1. Add entry in `robosats-client.sh` with onion addresses and local ports
2. Create `coordinators/{alias}/upstreams.conf` and `locations.conf`
3. Include both files in `nginx.conf`

## HTML Entry Points
`basic.html` and `pro.html` inject `window.RobosatsSettings` before the bundle loads:
- `basic.html` → `window.RobosatsSettings = 'selfhosted-basic'`
- `pro.html` → `window.RobosatsSettings = 'selfhosted-pro'`

Both files also include `<meta http-equiv="onion-location" content="{{ ONION_LOCATION }}" />` — a template placeholder left literal in nodeapp context, populated by Django in coordinator context.

## Static Assets
The `Dockerfile` copies the entire repo context but the `static/frontend/` bundle is **not** produced by the Dockerfile. It must be copied or symlinked from a frontend build before building the image:
```bash
# Required before docker build:
cp -r frontend/static/frontend nodeapp/static/frontend
```
This is handled by the GitHub release workflow for official releases.

## Environment Variables
| Variable | Default | Purpose |
|---|---|---|
| `TOR_PROXY_IP` | `127.0.0.1` | Tor SOCKS5 proxy host |
| `TOR_PROXY_PORT` | `9050` | Tor SOCKS5 proxy port |
