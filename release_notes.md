RoboSats v0.6.1 is now out! :rocket:

# Changes
## What's new
### Android app comes back stronger than ever!
After we skipped several Android app releases in order to focus on the decentralization, now the Android app comes back with all the strength. The Android app is now THE BEST WAY to use RoboSats. The It's a full RoboSats self-hosted client, it connects to all RoboSats coordinators and can generate robot identities fully locally. All of the networking is torified by default and now torification is more stable than it ever was. With this release, we aim to publish on F-Droid.

## Other
This release contains many small client and coordinator bug fixes. Most importantly, this release has a large bump on critical coordinator dependencies (Django v5). Introduces some new coordinator panel utilities and adds a new Coordinator setting to Geo block F2F orders in some countries.

## Special thanks
Special thanks to @KoalaSat who has driven all the work to improve the torification of the Android app, the embedding of the robot avatar generator libraries and got the app cleaned up and ready for publishing on F-Droid.

# Android

**[Click to download universal RoboSats APK for Android](https://github.com/RoboSats/robosats/releases/download/v0.6.1-alpha/robosats-v0.6.1.alpha-universal.apk)**
Smaller bundles for each CPU architecture available in the attachments.

### Verify the app using GPG:

1. [Download the ascii armored signature](https://github.com/Reckless-Satoshi/robosats/releases/download/v0.6.1-alpha/robosats-v0.6.1.alpha-universal.apk.asc)

2. Run this command on a directory that contains the apk file and and the ascii armored signature.
`gpg --verify robosats-v0.6.1.alpha-universal.apk.asc`

3. Verify the signer is actually Reckless-Satoshi (fingerprints match): [B4AB5F19113D4125DDF217739C4585B561315571](https://keys.openpgp.org/vks/v1/by-fingerprint/B4AB5F19113D4125DDF217739C4585B561315571)

Alternatively you can also verify with the release with the SHA256 checksum.

# Docker Images

[Coordinator Backend Image v0.6.1-alpha (Docker Hub)](https://hub.docker.com/r/recksato/robosats/tags?page=1&name=v0.6.1-alpha)


```bash
docker pull recksato/robosats:v0.6.1-alpha
```

[Client App Image v0.6.1-alpha (Docker Hub)](https://hub.docker.com/r/recksato/robosats-client/tags?page=1&name=v0.6.1-alpha)

```bash
docker pull recksato/robosats-client:v0.6.1-alpha
```

See [nodeapp/docker-compose.yml](https://github.com/Reckless-Satoshi/robosats/blob/2cd9d748706a8dcc0f03006b483acc6000e0572a/nodeapp/docker-compose.yml) for an example docker-compose usage of the `robosats-client` image.

