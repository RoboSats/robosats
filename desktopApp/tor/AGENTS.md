# desktopApp/tor — Vendored Tor Expert Bundle

## Purpose
Pre-built Tor binaries for Linux, macOS, and Windows, committed directly to git. The
parent `index.ts` spawns the appropriate binary at module load. This directory contains
no application logic — it is a pure platform-binary depot.

## Current versions
See `versions.json` for the authoritative per-platform record.

| Platform | Bundle | tor version |
|---|---|---|
| Linux x86_64 | Expert Bundle 16.0 | 0.4.9.15 |
| macOS x86_64 | Expert Bundle 16.0 | 0.4.9.15 |
| Windows x86_64 | Expert Bundle 16.0 | 0.4.9.15 |

`versions.json` records `minimumTorVersion`, per-platform `bundleUrl`, `bundleSha256`,
`binarySha256`, and `libs` sha256. Update all fields when replacing binaries.

## Updating the bundled binaries

1. Download the three Expert Bundle tarballs from
   `https://dist.torproject.org/torbrowser/<bundle-version>/`:
   `tor-expert-bundle-linux-x86_64-<bundle>.tar.gz`, `-macos-x86_64-`, `-windows-x86_64-`.
   Verify `.asc` signatures against Tor Browser Developers key
   `EF6E 286D DA85 EA2A 4BA7 DE68 4E2C 6E87 9329 8290`.
2. Replace `tor-<platform>/tor/` and `tor-<platform>/data/` with the bundle contents.
   Preserve executable bits (`chmod +x` on binaries).
3. Update `versions.json`: bump `expertBundle`, `torVersion`, `updatedAt`,
   all `bundleUrl`, `bundleSha256`, `binarySha256`, and `libs` sha256 values.
4. Run `node tor/verify.js` from `desktopApp/` — must exit 0.
5. Recompile: `npm run compile` from `desktopApp/`.
6. Commit binaries, `versions.json`, and compiled JS together.

## Layout
```
tor/
  versions.json                  ← provenance manifest and minimum-version record
  verify.js                      ← guard script (run by CI before packaging)
  __tests__/verify.test.js       ← unit tests for verify.js
  geoip                          ← root-level GeoIP database (unused — see Traps)
  geoip6                         ← root-level GeoIP6 database (unused)
  README.CONJURE.md              ← upstream bundle readme
  README.SNOWFLAKE.md
  README.WEBTUNNEL.md
  tor-linux/
    tor/
      tor                        ← ELF binary (x86_64)
      libcrypto.so.3
      libevent-2.1.so.7
      libssl.so.3
    data/geoip
    data/geoip6
    pluggable_transports/        ← conjure-client, lyrebird, pt_config.json
  tor-mac/
    tor/
      tor                        ← Mach-O binary (x86_64; Apple Silicon uses Rosetta)
      libevent-2.1.7.dylib
    data/geoip
    data/geoip6
    pluggable_transports/        ← conjure-client, lyrebird, pt_config.json
  tor-win/
    tor/
      tor.exe
      tor-gencert.exe
    data/geoip
    data/geoip6
    pluggable_transports/        ← conjure-client.exe, lyrebird.exe, pt_config.json
```

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
Tor starts with **all defaults**, binding SocksPort **9050** on localhost.
The parent's `session.setProxy({ proxyRules: "socks://localhost:9050" })` targets exactly
that default port. The dependency is implicit — there is no config file linking the two.

## Version guard
`verify.js` is run by CI (`desktop-build.yml`) after `npm ci` and before packaging.
It checks sha256 of every committed binary against `versions.json` and confirms that
the self-reported version satisfies `minimumTorVersion`. Run it locally with
`node tor/verify.js` from `desktopApp/`.

Raise `minimumTorVersion` when the Tor consensus changes `required-client-protocols`
to a value a lower series cannot satisfy, or when the current series reaches EOL.

## Traps
1. **`pluggable_transports/` is dead payload.** `conjure-client` and `lyrebird` are
   shipped as a side effect of copying the upstream bundle. No torrc is ever written, so
   no bridge/pluggable-transport is configured. Censorship-circumvention via bridges is
   **unimplemented**, not a supported feature. Do not advertise or document it as one.
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
5. **`libstdc++.so.6` was removed in Expert Bundle 16.0.** Do not re-add it unless
   a future bundle reintroduces it.

## Constraints
- Do not move or rename `tor-linux/`, `tor-mac/`, `tor-win/` — paths are hardcoded in
  `../index.ts`.
- Do not hand-patch binaries — replace the entire bundle from the upstream release.
- Do not advertise pluggable transports as a working feature; they are unconnected.
- Do not add a torrc unless the parent `index.ts` is updated to pass it as a spawn arg.
- Always update `versions.json` and run `verify.js` after any binary replacement.
- Always bump `minimumTorVersion` when the Tor Project changes `required-client-protocols`.
