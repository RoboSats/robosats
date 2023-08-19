This is RoboSats v0.6.0 PRERELEASE

## Changes:
The RoboSats client is now Federation enabled! The RoboSats client now can talk to many RoboSats coordinators at once. Effectively, RoboSats is now many-coordinators to many-clients: it has decentralized. To stop RoboSats one would have to stop every RoboSats coordinator.
There is too many changes in this release, so let's summarize: many things have broken! (probably) and many things have been upgraded!

# Android

**[Click to download universal RoboSats APK for Android](https://github.com/RoboSats/robosats/releases/download/v0.6.0-alpha/robosats-v0.6.0.alpha-universal.apk)**
Smaller bundles for each CPU architecture available in the attachments.

### Verify the app using GPG:

1. [Download the ascii armored signature](https://github.com/Reckless-Satoshi/robosats/releases/download/v0.6.0-alpha/robosats-v0.6.0.alpha-universal.apk.asc)

2. Run this command on a directory that contains the apk file and and the ascii armored signature.
`gpg --verify robosats-v0.6.0.alpha-universal.apk.asc`

3. Verify the signer is actually Reckless-Satoshi (fingerprints match): [B4AB5F19113D4125DDF217739C4585B561315571](https://keys.openpgp.org/vks/v1/by-fingerprint/B4AB5F19113D4125DDF217739C4585B561315571)

Alternatively you can also verify with the release with the SHA256 checksum.

Known missing features:
- Android APK has no sound or notifications.


# Docker Images

[Coordinator Backend Image v0.6.0-alpha (Docker Hub)](https://hub.docker.com/r/recksato/robosats/tags?page=1&name=v0.6.0-alpha)


```bash
docker pull recksato/robosats:v0.6.0-alpha
```

[Client App Image v0.6.0-alpha (Docker Hub)](https://hub.docker.com/r/recksato/robosats-client/tags?page=1&name=v0.6.0-alpha)

```bash
docker pull recksato/robosats-client:v0.6.0-alpha
```

See [nodeapp/docker-compose.yml](https://github.com/Reckless-Satoshi/robosats/blob/2cd9d748706a8dcc0f03006b483acc6000e0572a/nodeapp/docker-compose.yml) for an example docker-compose usage of the `robosats-client` image.

