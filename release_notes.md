RoboSats v0.8.9-alpha is now out! :rocket:

# Changes
## What's new

**TL;DR**

### For Users

- Gumpellite coordinator dropped from the federation
- Security fix (GHSA-22q8-9ghc-jg3h): state-changing requests now require a PGP signature — bearer tokens alone can no longer be replayed
- Timed signatures bound to the target coordinator, preventing cross-coordinator replay
- Nostr relay auto-recovery: dropped relays reconnect, subscriptions replay, failed relays replaced by federation spares
- Desktop Tor upgraded
- Robot reusability enforced client-side after finishing a trade
- Automatic dispute resolution removed — all disputes now require manual coordinator intervention
- Multiple libraries security updates

**Bugs**

- Fixed "1048 signature does not verify" error when making an order after recovering a garage key on a fresh client
- Fixed order description dialog being skipped when taking an order with an already-used robot
- Fixed stale third-party NIP-69 orders lingering in the Nostr order book
- Fixed OpenStreetMaps 403 blocked access

### For Coordinators
- Security fix (GHSA-22q8-9ghc-jg3h): `REQUIRE_SIGNED_ACTIONS=true` by default; set to `false` temporarily while outdated clients are still in use
- New error codes: 1059 (missing signature), 1060 (clock skew); 1048 now means strictly "signature fails to verify"
- Automatic dispute resolution removed
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
