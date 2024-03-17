RoboSats v0.6.0 is now out! :rocket:

# Changes
## New Features
### Decentralization
RoboSats v0.6.0 introduces a major upgrade, introducing the RoboSats Federation, a decentralized system of independent coordinators to host orders, enhancing the platform's robustness and user experience. This version is a significant step towards decentralization, allowing users to interact with any coordinator seamlessly.

It's crucial to choose trustworthy coordinators due to the potential risks of malicious activity. The federated client is available for testing at specific URLs, with a stable release planned. Key features include multiple coordinators competing for users, decentralized instances for increased robustness, and a focus on coordinators profiles and trust.

Learn more in https://learn.robosats.com/robosats/update/pre-release-robosats-decentralized/

### New avatar generator
Your Robot identity is now generated in your client app, when previously, the robot identity was created by the coordinator. This allows now for super-fast Robot avatar and nickname generation that works even if your connection to the coordinators is down. The new robot avatars, are in fact, more diverse and better looking, however, the same token will now yield a different avatar when compared to v0.5.4 (but the robot identity remains the same, also keeping the same nickname).

## Bug Fixes and Performance Improvements
The whole app architecture is new. There might be new bugs, solved bugs, worse performance and better performance: who knows!! :D

## Special thanks
Special thanks to @KoalaSat who has driven some of the largest development pushes needed to get The Federation Layer fully working.

# Android

The Android app is currently not supported on this early phase of the Federated app.


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

