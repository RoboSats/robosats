# Development

Check out our [Contribution Guide](https://learn.robosats.org/contribute/) to find how you can make RoboSats great.

RoboSats is a monorepo, arguably a messy one at the moment.
 - The top level is a Django application (the coordinator backend) with apps `/api`, `/control`, and `/chat`. Django settings are in `/robosats` and `/tests` has integration tests for the RoboSats backend.
 - The `/frontend` directory contains the ReactJS client.
 - The `/nodeapp` directory contains the docker orchestration and utilities for the self-hosted application (Umbrel, StartOS, etc). We also use this one in unsafe.robosats.org

 - The `/mobile` directory contains our React Native app (a wrapper around our ReactJS app in `/frontend`)
 - The `/docs` directory has the learn.robosats.org static Jekyll site markdown docs.
 - The `/web` directory is a light wrapper around our client app `/frontend` intended to host a RoboSats dex client to be used for the public. Used for our official onion address.

## Documentation

We always try to keep a high level documentation of all involved workflows in coordinators and clients. Check the [docs](/development/docs.md)

## Start

You can run the whole stack for local development following the [instructions](/development/setup.md)

Officially mantained docker orchestration for coordinators can be found in the repo [robosats-deploy](https://github.com/RoboSats/robosats-deploy)

### Release

Learn all the steps we do when we want to announce a new [release](./release.md)

## ⚡Developer Rewards ⚡
Check out the [Developer Rewards Panel](https://github.com/users/Reckless-Satoshi/projects/2/views/5) for tasks paid in Sats.
