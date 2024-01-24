RoboSats v0.5.4 is now out! :rocket: RoboSats client apps before v0.5.1 are no longer be compatible.

# Changes
This is a minor release with some small enhancements and bug fixes. This is the last release before the federated client release.

- Dependency updates and security fixes.
- Coordinator serves robot hash_ids needed for >v0.6.0 client side robot identity generator.
- Recommended and minimum onchain fees for payouts are now more accurate.
- Devfund node has moved. The new node now has public access to the invoices services (read-only).
- Fix book re-render on swap/fiat change (by @aftermath2)
- Docs have been fully translated to Spanish by @OSFr0g
- Perf increase on coordinator image build by @proof-of-reality
- Build new full integration tests on testnet.
- Fix API /chat endpoint bugs.
- Updated API docs, now OpenAPIspec is tested during the integration tests.
- Fix buggy pricing for ARS.
- New currency Albanian LEK.
- Updated Russian translation.

# Android

The Android app is not currently supported. It will come back stronger in the future.

# Docker Images

[Coordinator Backend Image v0.5.4-alpha (Docker Hub)](https://hub.docker.com/r/recksato/robosats/tags?page=1&name=v0.5.4-alpha)


```bash
docker pull recksato/robosats:v0.5.4-alpha
```

[Client App Image v0.5.4-alpha (Docker Hub)](https://hub.docker.com/r/recksato/robosats-client/tags?page=1&name=v0.5.4-alpha)

```bash
docker pull recksato/robosats-client:v0.5.4-alpha
```

See [nodeapp/docker-compose.yml](https://github.com/Reckless-Satoshi/robosats/blob/2cd9d748706a8dcc0f03006b483acc6000e0572a/nodeapp/docker-compose.yml) for an example docker-compose usage of the `robosats-client` image.

