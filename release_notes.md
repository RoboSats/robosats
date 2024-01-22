RoboSats v0.5.3 is now out! :rocket: RoboSats client apps before v0.5.1 are no longer be compatible.

# Changes
## New Features: Face to face.
We have introduced a new feature, F2F (Face-to-Face), allowing users to add a location for face-to-face cash trades. The book page now displays a map with all F2F orders. For privacy reasons, the exact location of your order is slightly randomized (uniform random 15 x 15 Km noise) when you click on the map to locate it. This means it's not possible to be precise, and the exact location can only be shared on the encrypted chat. Please note that using high-resolution maps can leak your IP to external tiling servers if you are not using Tor Browser.

Of course, adding a geolocation tag to your order is only a good idea if you want to use face-to-face cash as a payment method. You can completely disregard this feature if you do not want to use this payment method.

## RoboSats-deploy Coordinator Orchestration
We have released the RoboSats-deploy coordinator orchestration in https://github.com/RoboSats/robosats-deploy

## Bug Fixes and Performance Improvements
- Dependency updates.
- Small bug fixes.
- Improved DB Writes performance related to last_login user field.
- Fix small bug on order logging that made automatic dispute resolutions fail.
- Devfund Donation Pubkey has been updated to RoboSats experimental LND2 node.

# Android

**[Click to download universal RoboSats APK for Android](https://github.com/RoboSats/robosats/releases/download/v0.5.3-alpha/robosats-v0.5.3.alpha-universal.apk)**
Smaller bundles for each CPU architecture available in the attachments.

### Verify the app using GPG:

1. [Download the ascii armored signature](https://github.com/Reckless-Satoshi/robosats/releases/download/v0.5.3-alpha/robosats-v0.5.3.alpha-universal.apk.asc)

2. Run this command on a directory that contains the apk file and and the ascii armored signature.
`gpg --verify robosats-v0.5.3.alpha-universal.apk.asc`

3. Verify the signer is actually Reckless-Satoshi (fingerprints match): [B4AB5F19113D4125DDF217739C4585B561315571](https://keys.openpgp.org/vks/v1/by-fingerprint/B4AB5F19113D4125DDF217739C4585B561315571)

Alternatively you can also verify with the release with the SHA256 checksum.

Known missing features:
- Android APK has no sound or notifications.


# Docker Images

[Coordinator Backend Image v0.5.3-alpha (Docker Hub)](https://hub.docker.com/r/recksato/robosats/tags?page=1&name=v0.5.3-alpha)


```bash
docker pull recksato/robosats:v0.5.3-alpha
```

[Client App Image v0.5.3-alpha (Docker Hub)](https://hub.docker.com/r/recksato/robosats-client/tags?page=1&name=v0.5.3-alpha)

```bash
docker pull recksato/robosats-client:v0.5.3-alpha
```

See [nodeapp/docker-compose.yml](https://github.com/Reckless-Satoshi/robosats/blob/2cd9d748706a8dcc0f03006b483acc6000e0572a/nodeapp/docker-compose.yml) for an example docker-compose usage of the `robosats-client` image.

