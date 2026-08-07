# /web — Clearnet Web Client Container

## Purpose
Alpine + Nginx container serving the RoboSats SPA over clearnet HTTP (port 80).
Builds the `recksato/robosats-web` Docker image. Unlike `/nodeapp`, there is **no Tor
layer and no coordinator proxying** — the browser contacts coordinators directly over
their clearnet or `.onion` URLs (using the user's own Tor if present). This is the
"unsafe" deployment target actively discouraged by `HostAlert`/`UnsafeAlert` in the
frontend; it exists for discoverability and as a fallback for users who have not yet
switched to a privacy-preserving client.

Do not confuse with `/nodeapp` (`recksato/robosats-client`), which is the
**self-hosted, Tor-proxied** container intended for sovereign-node users.

## Architecture
```
Port 80 (exposed)
  └── Nginx (daemon off; run.sh → nginx)
        ├── /                         → basic.html (SPA entry, web-basic)
        ├── /pro                      → pro.html (SPA entry, web-pro)
        ├── /static/                  → /usr/src/robosats/static/ (autoindex on)
        ├── /favicon.ico              → static/assets/images/favicon-96x96.png
        └── /clearnetonion_verify     → /serve_misc/ (onion-location verification)
```

No coordinator upstream proxying — unlike nodeapp, this Nginx config has no socat
bridges or per-coordinator `proxy_pass` directives. All coordinator API/WS calls go
directly from the browser to coordinator URLs.

## Key Files
| File | Role |
|---|---|
| `nginx.conf` | Nginx config; `daemon off;` listen 80; simple static file server |
| `Dockerfile` | Alpine 3.18; installs nginx; `COPY . .`; `EXPOSE 80`; `CMD ["sh", "run.sh"]` |
| `run.sh` | One-liner: `nginx` |
| `docker-compose.yml` | Local dev compose — references `../frontend` build + nginx service |
| `basic.html` | **Gitignored webpack output** — CI-injected; sets `window.RobosatsSettings = 'web-basic'` |
| `pro.html` | **Gitignored webpack output** — CI-injected; sets `window.RobosatsSettings = 'web-pro'` |
| `static/` | **Gitignored webpack output** — copied from `frontend/static` by CI before image build |
| `coordinators/` | Empty placeholder directory — coordinator config for nginx is managed externally |

## CI / Build Pipeline
```
frontend-build.yml
  └── webpack build → artifact "web-main-static"
        (web/static/ + web/basic.html + web/pro.html)

web-client-image.yml (or release.yml)
  ├── downloads "web-main-static" into web/
  └── docker buildx build ./web → push recksato/robosats-web
        tags: :latest, :{semver}, :{short sha}
```

`basic.html`, `pro.html`, and `static/` are **never committed to git** — they are CI
artifacts. `.gitignore` lists `web/static` as an ignored pattern. HTML files present in
the working tree are local dev builds — never hand-edit them.

## `window.RobosatsSettings` Values
| Entry point | Value |
|---|---|
| `basic.html` | `'web-basic'` |
| `pro.html` | `'web-pro'` |

Both are output by the same `frontend/webpack.config.ts` `HtmlWebpackPlugin` run that
also emits `nodeapp/basic.html`, `nodeapp/pro.html`, `desktopApp/index.html`, etc.

## Product Intent
- **This is the "unsafe" / clearnet entry point** — `HostAlert` / `UnsafeAlert` shown
  to all users of `web-basic`/`web-pro` actively discourages clearnet use in favour of
  Tor, desktop, or self-hosted clients. This is intentional, not a bug.
- **No coordinator proxying** — unlike nodeapp, the browser contacts coordinators
  directly. Users relying on Tor for coordinator traffic must have their own Tor
  Browser or system Tor running; the container provides none.
- **Port 80 is the only exposed port.** TLS termination (if desired) must be handled
  by an upstream reverse proxy (e.g., Nginx/Caddy at the host). The container itself
  does not terminate HTTPS.
- **`/clearnetonion_verify`** serves static files from `/serve_misc/` — this is the
  `onion-location` HTTP header verification endpoint used by Tor Browser to confirm the
  site has a `.onion` equivalent. It is not part of the SPA.
- **`/pro` is a first-class route** — same bundle, pro entry point.

## Traps
- **`curl` is not installed** in the Alpine image; the Dockerfile
  `HEALTHCHECK CMD curl --fail http://localhost:80` always fails. Replace with
  `wget -q -O- …` or remove the HEALTHCHECK.
- **Stale Dockerfile comment**: `# Needs a copy or symlink of /frontend/static in /nodeapp/static` —
  copy-paste from nodeapp; this is the `/web` container, not `/nodeapp`.
- `basic.html` and `pro.html` are gitignored — any copy in the working tree is a local
  dev build that may be out of date. CI always injects the correct build artifact.
- The `coordinators/` directory is empty — it exists only to ensure the directory is
  present when the `docker-compose.yml` mounts it. No per-coordinator nginx config lives
  here (unlike nodeapp, which has per-coordinator `upstreams.conf` + `locations.conf`).
- The `web/docker-compose.yml` is a **dev-only compose** and mounts `../web/nginx.conf` +
  `../web/coordinators/` into the frontend nginx container — this is also mounted by
  `frontend/docker-compose.yml` for local frontend dev (`host 8888:80`).

## Constraints
- Never hand-edit `basic.html`, `pro.html`, or anything under `static/` — they are CI
  outputs; edit `frontend/templates/frontend/index.ejs` or `frontend/static/` instead.
- Never add coordinator proxy_pass directives to `nginx.conf` — that is nodeapp's
  responsibility. This container serves the SPA only; coordinator communication is
  the browser's concern.
- Do not add a Tor SOCKS proxy layer — use `/nodeapp` for Tor-proxied self-hosting.
- Do not downplay or remove `UnsafeAlert` — clearnet use warning is a deliberate product
  privacy stance.
