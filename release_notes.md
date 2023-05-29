RoboSats v0.5.1 is now out! :rocket:

## Changes:
- CLN (core-lightning) can now be used as robosats coordinator node vendor. It is however, experimental, and not recommended in mainnet. Thank you for this great contribution @daywalker91 !
- Full rework of the Lnproxy feature by @shyfire131 . Thank you!
- Chat now allows multiple line inputs by @shyfire131
- RoboSats client should now work inside of Blixt's webln browser. Thank you @SynthLock for the tips and debugging!
- API requests to POST /order that contain important information, i.e, the payout invoice or address, are now signed by the robot PGP key and validated by the coordinator. This way, on a multi coordinator set up, a robot can potentially be re-used across several coordinators without risk of identity stealing (auth token) by a rogue coordinator (_alla_ man-in-the-middle).
- New Keysend functionality. RoboSats coordinators can now, voluntarily, keysend devfund donations automatically for each trade they host.
- Simplify coordinator updates. Now migrations are tracked and apply on first start-up. Static files are collected on start up as well.
- New maker form switch for exact and range amounts thanks to @JooVLC
- Fix negative premium field by @JooVLC
- Self-hosted node app has been fully re-worked. It is now based on Alpine (size went down from 130MB to 7MB) and the ram-heavy dependencies have been dropped. The app is now lighter, and fully self-contained, as no part of the frontend depends on the existing coordinator anymore.
- Overall update of Android app, slightly better performance and smaller size.
- Sounds do work on the Android app now.
- New reviews section to learn.robosats.com by @athena-alpha
- New tutorial by @BitcoinQnA
- Add new payment methods: Sinpe movil and Qiwi.

# Android

**[Click to download universal RoboSats APK for Android](https://github.com/RoboSats/robosats/releases/download/v0.5.1-alpha/robosats-v0.5.1.alpha-universal.apk)**
Smaller bundles for each CPU architecture available in the attachments.

### Verify the app using GPG:

1. [Download the ascii armored signature](https://github.com/Reckless-Satoshi/robosats/releases/download/v0.5.1-alpha/robosats-v0.5.1.alpha-universal.apk.asc)

2. Run this command on a directory that contains the apk file and and the ascii armored signature.
`gpg --verify robosats-v0.5.1.alpha-universal.apk.asc`

3. Verify the signer is actually Reckless-Satoshi (fingerprints match): [B4AB5F19113D4125DDF217739C4585B561315571](https://keys.openpgp.org/vks/v1/by-fingerprint/B4AB5F19113D4125DDF217739C4585B561315571)

Alternatively you can also verify with the release with the SHA256 checksum.

Known missing features:
- Android APK has no sound or notifications.


# Docker Images

[Coordinator Backend Image v0.5.1-alpha (Docker Hub)](https://hub.docker.com/r/recksato/robosats/tags?page=1&name=v0.5.1-alpha)


```bash
docker pull recksato/robosats:v0.5.1-alpha
```

[Client App Image v0.5.1-alpha (Docker Hub)](https://hub.docker.com/r/recksato/robosats-client/tags?page=1&name=v0.5.1-alpha)

```bash
docker pull recksato/robosats-client:v0.5.1-alpha
```

See [nodeapp/docker-compose.yml](https://github.com/Reckless-Satoshi/robosats/blob/2cd9d748706a8dcc0f03006b483acc6000e0572a/nodeapp/docker-compose.yml) for an example docker-compose usage of the `robosats-client` image.

