RoboSats v0.8.4-alpha is now out! :rocket:

# Changes
## What's new

**TL;DR**

### For Users
-

**Payment methods marked as reversible**

-

**New payment methods**

-

**Bugs**

-

### For Coordinators
-

# Android

**[Click to download universal RoboSats APK for Android](https://github.com/RoboSats/robosats/releases/download/v0.8.4-alpha/robosats-v0.8.4.alpha-universal.short_sha.apk)**
Smaller bundles for each CPU architecture available in the attachments.

### Verify the app using GPG:

1. [Download the ascii armored signature](https://github.com/Robosats/robosats/releases/download/v0.8.4-alpha/robosats-v0.8.4.alpha-universal.short_sha.apk.asc)

2. Run this command on a directory that contains the apk file and and the ascii armored signature.
`gpg --verify robosats-v0.8.4.alpha-universal.apk.asc`

3. Verify the signer is actually KoalaSat [8FCDBF574CCFD73DB68B00CC2F7F61C6146AB157](https://keys.openpgp.org/vks/v1/by-fingerprint/8FCDBF574CCFD73DB68B00CC2F7F61C6146AB157)

Additionally, you can download it from [Izzysoft repository](https://apt.izzysoft.de/fdroid/) or [ZapStore](https://zapstore.dev/)

# Desktop

**Download the Desktop App zip file**
Find the zip file that suits with your operative system:

- [Windows](https://github.com/RoboSats/robosats/releases/download/v0.8.4-alpha/robosats-desktop-v0.8.4.alpha-win32-ia32.short_sha.zip)
- [Mac](https://github.com/RoboSats/robosats/releases/download/v0.8.4-alpha/robosats-desktop-v0.8.4.alpha-mac-darwin-x64.short_sha.zip)
- [Linux](https://github.com/RoboSats/robosats/releases/download/v0.8.4-alpha/robosats-desktop-v0.8.4.alpha-linux-x64.short_sha.zip)

### Verify the app using GPG:

1. Download the ascii armored signature:

- [Windows](https://github.com/RoboSats/robosats/releases/download/v0.8.4-alpha/robosats-desktop-v0.8.4.alpha-win32-ia32.short_sha.zip.asc)
- [Mac](https://github.com/RoboSats/robosats/releases/download/v0.8.4-alpha/robosats-desktop-v0.8.4.alpha-mac-darwin-x64.short_sha.zip.asc)
- [Linux](https://github.com/RoboSats/robosats/releases/download/v0.8.4-alpha/robosats-desktop-v0.8.4.alpha-linux-x64.short_sha.zip.asc)

3. Run this command on a directory that contains the apk file and and the ascii armored signature.
`gpg --verify robosats-v0.8.4.alpha-....asc`

4. Verify the signer is actually KoalaSat [8FCDBF574CCFD73DB68B00CC2F7F61C6146AB157](https://keys.openpgp.org/vks/v1/by-fingerprint/8FCDBF574CCFD73DB68B00CC2F7F61C6146AB157)

# Docker Images

[Coordinator Backend Image v0.8.4-alpha (Docker Hub)](https://hub.docker.com/r/recksato/robosats/tags?page=1&name=v0.8.4-alpha)


```bash
docker pull recksato/robosats:v0.8.4-alpha
```

[Client App Image v0.8.4-alpha (Docker Hub)](https://hub.docker.com/r/recksato/robosats-client/tags?page=1&name=v0.8.4-alpha)

```bash
docker pull recksato/robosats-client:v0.8.4-alpha
```

See [nodeapp/docker-compose.yml](https://github.com/Robosats/robosats/blob/2cd9d748706a8dcc0f03006b483acc6000e0572a/nodeapp/docker-compose.yml) for an example docker-compose usage of the `robosats-client` image.
