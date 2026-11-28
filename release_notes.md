RoboSats v0.8.9-alpha is now out! :rocket:

# Changes
## What's new

**TL;DR**

### For Users
- Security fix (GHSA-22q8-9ghc-jg3h): every state-changing request now requires a PGP signature from the robot's private key — a stolen bearer token can no longer be replayed at another coordinator or used to settle escrow
- Timed signatures are now bound to the target coordinator, preventing cross-coordinator signature replay
- Nostr relay auto-recovery: dropped relays are automatically reconnected, subscriptions replayed and failed relays replaced by federation spares — long-session order-book and chat degradation is fixed
- Nostr order book REQ split into pending-only and tombstone streams — orders were silently truncated near the 500-event relay cap, making the book incomplete
- Third-party NIP-69 order tombstones (`canceled`, `in-progress`, `expired`) now remove stale orders from the book; previously only RoboSats `success` events were handled
- Nostr relay status chip now shown in the chat header alongside the order book footer
- Relay chip blinks red on total outage to signal the connectivity issue immediately
- Android Nostr chat and websocket handling overhauled for reliability
- Desktop Tor upgraded (new binaries for Linux/Mac/Windows, Conjure and Lyrebird pluggable transports updated, Snowflake and WebTunnel removed)
- Robot reusability enforced client-side: a finished robot slot is correctly offered for reuse instead of blocking a new order
- Automatic dispute resolution removed — all disputes now require manual coordinator intervention
- Gumpellite coordinator dropped from the federation
- OpenStreetMaps 403 blocked access fixed
- Multiple libraries security updates

**Bugs**

- Fixed "1048 signature does not verify" error when making an order after recovering a garage key on a fresh client
- Fixed order description dialog being skipped when taking an order with an already-used robot
- Fixed stale third-party NIP-69 orders lingering in the Nostr order book

### For Coordinators
- Security fix (GHSA-22q8-9ghc-jg3h): signed actions enforced by default (`REQUIRE_SIGNED_ACTIONS=true`); set to `false` as a temporary escape hatch while outdated desktop/Android clients are still in use — never leave it off permanently
- New error codes: 1059 (missing signature — points user to coordinator address for client update), 1060 (signature outside time window — asks user to sync device clock); 1048 now means strictly "signature fails to verify"
- Automatic dispute resolution removed — disputes are now fully manual
- Django bumped to 5.2.19
- Gunicorn bumped to 27.0.1
- Multiple libraries security updates

# Android

**[Click to download universal RoboSats APK for Android](https://github.com/RoboSats/robosats/releases/download/v0.8.9-alpha/robosats-v0.8.9.alpha-universal.short_sha.apk)**
Smaller bundles for each CPU architecture available in the attachments.

### Verify the app using GPG:

1. [Download the ascii armored signature](https://github.com/Robosats/robosats/releases/download/v0.8.9-alpha/robosats-v0.8.9.alpha-universal.short_sha.apk.asc)

2. Run this command on a directory that contains the apk file and and the ascii armored signature.
`gpg --verify robosats-v0.8.9.alpha-universal.apk.asc`

3. Verify the signer is actually KoalaSat [8FCDBF574CCFD73DB68B00CC2F7F61C6146AB157](https://keys.openpgp.org/vks/v1/by-fingerprint/8FCDBF574CCFD73DB68B00CC2F7F61C6146AB157)

Additionally, you can download it from [Izzysoft repository](https://apt.izzysoft.de/fdroid/) or [ZapStore](https://zapstore.dev/)

# Desktop

**Download the Desktop App zip file**
Find the zip file that suits with your operative system:

- [Windows](https://github.com/RoboSats/robosats/releases/download/v0.8.9-alpha/robosats-desktop-v0.8.9.alpha-win32-ia32.short_sha.zip)
- [Mac](https://github.com/RoboSats/robosats/releases/download/v0.8.9-alpha/robosats-desktop-v0.8.9.alpha-mac-darwin-x64.short_sha.zip)
- [Linux](https://github.com/RoboSats/robosats/releases/download/v0.8.9-alpha/robosats-desktop-v0.8.9.alpha-linux-x64.short_sha.zip)

### Verify the app using GPG:

1. Download the ascii armored signature:

- [Windows](https://github.com/RoboSats/robosats/releases/download/v0.8.9-alpha/robosats-desktop-v0.8.9.alpha-win32-ia32.short_sha.zip.asc)
- [Mac](https://github.com/RoboSats/robosats/releases/download/v0.8.9-alpha/robosats-desktop-v0.8.9.alpha-mac-darwin-x64.short_sha.zip.asc)
- [Linux](https://github.com/RoboSats/robosats/releases/download/v0.8.9-alpha/robosats-desktop-v0.8.9.alpha-linux-x64.short_sha.zip.asc)

3. Run this command on a directory that contains the apk file and and the ascii armored signature.
`gpg --verify robosats-v0.8.9.alpha-....asc`

4. Verify the signer is actually KoalaSat [8FCDBF574CCFD73DB68B00CC2F7F61C6146AB157](https://keys.openpgp.org/vks/v1/by-fingerprint/8FCDBF574CCFD73DB68B00CC2F7F61C6146AB157)

# Docker Images

[Coordinator Backend Image v0.8.9-alpha (Docker Hub)](https://hub.docker.com/r/recksato/robosats/tags?page=1&name=v0.8.9-alpha)


```bash
docker pull recksato/robosats:v0.8.9-alpha
```

[Client App Image v0.8.9-alpha (Docker Hub)](https://hub.docker.com/r/recksato/robosats-client/tags?page=1&name=v0.8.9-alpha)

```bash
docker pull recksato/robosats-client:v0.8.9-alpha
```

See [nodeapp/docker-compose.yml](https://github.com/Robosats/robosats/blob/main/nodeapp/docker-compose.yml) for an example docker-compose usage of the `robosats-client` image.
