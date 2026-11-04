RoboSats v0.8.8-alpha is now out! :rocket:

# Changes
## What's new

**TL;DR**

### For Users
- New garage key introduced as a replacement of the robot key, more info: https://github.com/RoboSats/robosats/issues/2342
- Nostr encrypted chat is now enabled
- Alice and Eleuteria coordinators dropped the fedeation.
- Android app now embeds Tor via kmp-tor 2.6.0 (tor 0.4.9)
- Payout safety: reward sources and buyer payouts are verified against the Lightning node, with optional withdrawal limits
- Reward withdrawal UI now shows when withdrawals can be made again
- Multiple libraries security updates

**New payment methods**

- Efectivo BBVA
- BTCB2 (BTC B2 Swap)

**Bugs**

- Fixed race conditions in orders
- Fixed reward withdrawal duplicate invoice 500 error
- Fixed bond credit being applied more than once per slashed bond
- Fixed incomplete admin order cancel
- Fixed XSS: order logs are now stored as JSON and user-controlled data is properly escaped
- Fixed dispute order ID corruption
- Fixed admin trade resolution swap
- Fixed broken state after onchain admin resolution
- Fixed do_accounting crash on disputed swap orders
- Fixed null coordinator URL materialization
- Fixed federation order URL routing
- Fixed mempool Tor hang with hard deadline
- Fixed Criptoya exchange rate to use ask/bid midpoint

### For Coordinators
- Payout safety checks added: optional `WITHDRAWAL_LIMIT` env var to cap reward withdrawals
- Django bumped to 5.2.18
- Pillow bumped to 13.0.0
- Multiple libraries security updates
- Coordinator onion addresses documented as fallback on the access page

# Android

**[Click to download universal RoboSats APK for Android](https://github.com/RoboSats/robosats/releases/download/v0.8.8-alpha/robosats-v0.8.8.alpha-universal.short_sha.apk)**
Smaller bundles for each CPU architecture available in the attachments.

### Verify the app using GPG:

1. [Download the ascii armored signature](https://github.com/Robosats/robosats/releases/download/v0.8.8-alpha/robosats-v0.8.8.alpha-universal.short_sha.apk.asc)

2. Run this command on a directory that contains the apk file and and the ascii armored signature.
`gpg --verify robosats-v0.8.8.alpha-universal.apk.asc`

3. Verify the signer is actually KoalaSat [8FCDBF574CCFD73DB68B00CC2F7F61C6146AB157](https://keys.openpgp.org/vks/v1/by-fingerprint/8FCDBF574CCFD73DB68B00CC2F7F61C6146AB157)

Additionally, you can download it from [Izzysoft repository](https://apt.izzysoft.de/fdroid/) or [ZapStore](https://zapstore.dev/)

# Desktop

**Download the Desktop App zip file**
Find the zip file that suits with your operative system:

- [Windows](https://github.com/RoboSats/robosats/releases/download/v0.8.8-alpha/robosats-desktop-v0.8.8.alpha-win32-ia32.short_sha.zip)
- [Mac](https://github.com/RoboSats/robosats/releases/download/v0.8.8-alpha/robosats-desktop-v0.8.8.alpha-mac-darwin-x64.short_sha.zip)
- [Linux](https://github.com/RoboSats/robosats/releases/download/v0.8.8-alpha/robosats-desktop-v0.8.8.alpha-linux-x64.short_sha.zip)

### Verify the app using GPG:

1. Download the ascii armored signature:

- [Windows](https://github.com/RoboSats/robosats/releases/download/v0.8.8-alpha/robosats-desktop-v0.8.8.alpha-win32-ia32.short_sha.zip.asc)
- [Mac](https://github.com/RoboSats/robosats/releases/download/v0.8.8-alpha/robosats-desktop-v0.8.8.alpha-mac-darwin-x64.short_sha.zip.asc)
- [Linux](https://github.com/RoboSats/robosats/releases/download/v0.8.8-alpha/robosats-desktop-v0.8.8.alpha-linux-x64.short_sha.zip.asc)

3. Run this command on a directory that contains the apk file and and the ascii armored signature.
`gpg --verify robosats-v0.8.8.alpha-....asc`

4. Verify the signer is actually KoalaSat [8FCDBF574CCFD73DB68B00CC2F7F61C6146AB157](https://keys.openpgp.org/vks/v1/by-fingerprint/8FCDBF574CCFD73DB68B00CC2F7F61C6146AB157)

# Docker Images

[Coordinator Backend Image v0.8.8-alpha (Docker Hub)](https://hub.docker.com/r/recksato/robosats/tags?page=1&name=v0.8.8-alpha)


```bash
docker pull recksato/robosats:v0.8.8-alpha
```

[Client App Image v0.8.8-alpha (Docker Hub)](https://hub.docker.com/r/recksato/robosats-client/tags?page=1&name=v0.8.8-alpha)

```bash
docker pull recksato/robosats-client:v0.8.8-alpha
```

See [nodeapp/docker-compose.yml](https://github.com/Robosats/robosats/blob/main/nodeapp/docker-compose.yml) for an example docker-compose usage of the `robosats-client` image.
