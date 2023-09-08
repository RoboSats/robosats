RoboSats v0.5.2 is now out! :rocket: RoboSats client apps before v0.5.1 might no longer be compatible!

## Changes:
- New language: Swahili. Thank you @turizspace!
- Improved French and Italian translations. Thank you @LeoSpyke and @jinformatique !
- Update CLN (core-lightning) plugin (@daywalker91) and CLN base version to v23.08
- Add verbose order logs to coordinator panel: a detailed timestamped record of every change to an order from creation to finalization.
- Improved invoice descriptions.
- New coordinator maintenance messages.
- Small UI fixes.
- Fix pinch to zoom Android.
- Add bd taka as currency @dapsavoie /
- Update communities links in client app.
- Patch Android bogus "connected" chat status when connection is offline.
- Date to date ranges added to /api/ticks.
- New admin actions for dispute resolutions.
- Force PGP signed invoices and onchain addresses (multi-coordinator security).
- New RoboSats Federation basis v0.6.0~1
- Fix allow auth header to carry pgp keys: easier authentication for federation from browser.

# Android

**[Click to download universal RoboSats APK for Android](https://github.com/RoboSats/robosats/releases/download/v0.5.2-alpha/robosats-v0.5.2.alpha-universal.apk)**
Smaller bundles for each CPU architecture available in the attachments.

### Verify the app using GPG:

1. [Download the ascii armored signature](https://github.com/Reckless-Satoshi/robosats/releases/download/v0.5.2-alpha/robosats-v0.5.2.alpha-universal.apk.asc)

2. Run this command on a directory that contains the apk file and and the ascii armored signature.
`gpg --verify robosats-v0.5.2.alpha-universal.apk.asc`

3. Verify the signer is actually Reckless-Satoshi (fingerprints match): [B4AB5F19113D4125DDF217739C4585B561315571](https://keys.openpgp.org/vks/v1/by-fingerprint/B4AB5F19113D4125DDF217739C4585B561315571)

Alternatively you can also verify with the release with the SHA256 checksum.

Known missing features:
- Android APK has no sound or notifications.


# Docker Images

[Coordinator Backend Image v0.5.2-alpha (Docker Hub)](https://hub.docker.com/r/recksato/robosats/tags?page=1&name=v0.5.2-alpha)


```bash
docker pull recksato/robosats:v0.5.2-alpha
```

[Client App Image v0.5.2-alpha (Docker Hub)](https://hub.docker.com/r/recksato/robosats-client/tags?page=1&name=v0.5.2-alpha)

```bash
docker pull recksato/robosats-client:v0.5.2-alpha
```

See [nodeapp/docker-compose.yml](https://github.com/Reckless-Satoshi/robosats/blob/2cd9d748706a8dcc0f03006b483acc6000e0572a/nodeapp/docker-compose.yml) for an example docker-compose usage of the `robosats-client` image.

