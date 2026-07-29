# desktopApp/tor — Vendored Tor Expert Bundle

## Purpose
Pre-built Tor binaries for Linux, macOS, and Windows, committed directly to git. The
parent `index.ts` spawns the appropriate binary at module load. This directory contains
no application logic — it is a pure platform-binary depot.

## Layout
```
tor/
  geoip                          ← root-level GeoIP database (unused — see Traps)
  geoip6                         ← root-level GeoIP6 database (unused)
  README.CONJURE.md              ← upstream bundle readme
  README.SNOWFLAKE.md
  README.WEBTUNNEL.md
  tor-linux/
    tor/
      tor                        ← ELF binary
      libcrypto.so.3
      libevent-2.1.so.7
      libssl.so.3
      libstdc++.so.6
    data/geoip
    data/geoip6
    pluggable_transports/        ← conjure-client, lyrebird, snowflake-client,
                                    webtunnel-client, pt_config.json, READMEs
  tor-mac/
    tor/
      tor                        ← Mach-O binary
      libevent-2.1.7.dylib
    data/geoip
    data/geoip6
    pluggable_transports/        ← same set as linux
  tor-win/
    tor/
      tor.exe
      tor-gencert.exe
    data/geoip
    data/geoip6
    pluggable_transports/        ← same set as linux
```
Total: **44 files** tracked in git.

## Invocation
Called from `../index.ts` `checkPlatformAndRunTor()`:
```
spawn(path.join(__dirname, '/tor/tor-<platform>/tor/tor[.exe]'))
  — no arguments
  — no torrc
  — no DataDirectory override
  — no GeoIPFile / GeoIPv6File override
  — no SocksPort override
```
Tor starts with **all defaults**, which means it binds SocksPort **9050** on localhost.
The parent's `session.setProxy({ proxyRules: "socks://localhost:9050" })` targets exactly
that default port. The dependency is implicit — there is no config file linking the two.

## Provenance
- Binaries are copies from the upstream **Tor Expert Bundle** (one zip per platform,
  published by the Tor Project).
- Updated **manually** by a maintainer: download the new bundle, extract, replace files,
  commit.
- **No automation**: no download script, no CI step, no in-repo checksum or signature
  verification file.
- All 44 files are committed to git (including the platform ELF/Mach-O/PE binaries).

## Traps
1. **`pluggable_transports/` is dead payload.** `conjure-client`, `lyrebird`,
   `snowflake-client`, and `webtunnel-client` are shipped as a side effect of copying
   the upstream bundle. No torrc is ever written, so no bridge/pluggable-transport is
   configured. Censorship-circumvention via bridges is **unimplemented**, not a supported
   feature. Do not advertise or document it as one.
2. **Root `geoip`/`geoip6` and per-platform `data/geoip*` are also dead payload** for the
   same reason — GeoIP is a torrc-configured feature; with no torrc these files are never
   loaded.
3. **Port 9050 collision.** If the host already runs a Tor daemon (e.g. system Tor or
   Tor Browser) bound to `localhost:9050`, the bundled Tor either fails to bind or
   silently co-exists, and the proxy target becomes ambiguous. There is no port
   configuration or collision detection.
4. **All three platform trees ship in every packaged build.** `@electron/packager` does
   not filter `tor/` by target platform — every release zip contains the Linux, macOS,
   and Windows binaries regardless of the packaged platform, inflating binary size.
5. **No readiness polling.** `checkPlatformAndRunTor()` returns as soon as `spawn()`
   returns. The app window opens immediately; if Tor hasn't bootstrapped yet, outbound
   coordinator API calls fail silently until it does. (Documented here and in the parent
   `desktopApp/AGENTS.md`.)

## Constraints
- Do not move or rename `tor-linux/`, `tor-mac/`, `tor-win/` — paths are hardcoded in
  `../index.ts`.
- Do not hand-patch binaries — replace the entire bundle from the upstream release.
- Do not advertise pluggable transports as a working feature; they are unconnected.
- Do not add a torrc unless the parent `index.ts` is updated to pass it as a spawn arg.
