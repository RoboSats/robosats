---
layout: home
author_profile: true
title:  "RoboSats v0.6.0 pre-release Announcement"
date:   2023-12-31 01:01:01 -0500
categories: robosats update
---

**Note** this is a very early release, so expect to find bugs! If you find a bug that is stopping you from continuing your order, recover your robot in the v0.5.3 client of your coordinator and continue the trade as usual. We keep a [list of known bugs here](https://github.com/RoboSats/robosats/issues/1069), please report if you find a new one :D
{: .notice--primary}

We are thrilled to announce the launch for testing of the new version of RoboSats v0.6.0. This is the biggest ever upgrade to RoboSats. We have, figuratively, lifted the house and built a basement below it :)

This new version introduces a significant enhancement known as the **RoboSats Federation**, that effectively fully decentralizes RoboSats into many independent and fully redundant coordinators that will compete to host your orders.

**Caution, READ!** Prior to hosting your order with a new coordinator, ensure you trust the RoboSats coordinator you select. A malicious p2p coordinator can potentially steal from you!
{: .notice--secondary}

## How to test the pre-release?
The new federated client will now be permanently available in http://robosatsy56bwqn56qyadmcxkx767hnabg4mihxlmgyt6if5gnuxvzad.onion
(visit with Tor Browser) and http://unsafe.robosats.org (with extremely limited functionality). Once stable, it will be released as version v0.6.0 and you will be able to install it as usual on your node (e.g., [Umbrel](https://apps.umbrel.com/app/robosats), [StartOS](https://github.com/RoboSats/robosats-startos/releases), etc).

## What is RoboSats Federation?

The RoboSats Federation is a set of rules that allows multiple RoboSats instances to work together under a unified client app. This federated client app enables users to seamlessly interact with any coordinator, track the coordinator reputation, verify transparently devFund donations, and more. The aim is to improve RoboSats robustness while keeping complexity down for the user, providing robots a experience as close as possible to the app they are used to.

## Key Features of the New Version
### Multiple Coordinators

With the new version, RoboSats introduces the concept of coordinators or hosts. Coordinators will now compete to provide users with the best fees, support, uptime and reliability and overall user experience. Lightning node runners can become RoboSats coordinator in the federation, given they gain the trust of the users. The coordinators host the full infrastructure needed for the p2p trades, they route the lightning payments, they solve the disputes, and much more. Therefore **is important to pick always a coordinator you trust** when creating or taking a RoboSats order, given that, there are ways a coordinator could potentially steal from you (this is true for any p2p btc/fiat on-off ramp, not only RoboSats, regardless of escrow system, coordinators must always be trusted).

If you operate a lightning node and are interested in becoming a coordinator yourself, refer to the [RoboSats Federation basis](https://github.com/RoboSats/robosats/blob/main/federation.md)

### Decentralized Instances

The new version brings the power of decentralization to RoboSats. By spawning new instances, we increase the robustness of the platform. In order to fully stop the p2p market of RoboSats, every single instance must be stopped.

### Know Your Coordinator

Make sure to take a look at the coordinator profile before hosting your orders with them. You can find a lot about them in the profile such as ways to get in contact for private support, what fees they apply to the trades, what their privacy and data policies are, their lightning node pubkeys, and much more.

<div align="center">
<img src="/assets/images/pre-release-robosats-decentralized/coordinator-profile-example.png" width="470" />
</div>

There is currently 4 registered coordinators:
- Experimental
- Temple of Sats
- [Satstralia](https://satstralia.com)
- TheBigLake

If you want to help testing the new client without experimenting with novel coordinators you should pick the "Experimental" coordinator. Experimental is the same coordinator infrastructure you have been using so far in the non-decentralized client.

**They are also learning,** just like you. The RoboSats federation is new for everyone, so keep in mind some coordinators do not yet have much experience hosting trades. It is a learning experience for everyone.
{: .notice--primary}

### DevFund Revenue

Maintaining and implementing new features into the codebase is only supported by donations. The RoboSats Federation addresses this issue by allowing coordinators to voluntarily stream Sats to the RoboSats Development fund, ensuring continued development and maintenance. Coordinators can freely opt to not donate Sats for development. Coordinators that donate part of their revenue for development have some advantages such as, their orders are better positioned in the Order book and better support from the developers in case help is needed.

### Other improvements

Many other small improvements come in v0.6.0. For example, your Robot identity is now generated in your client app, when previously, the robot identity was created by the coordinator. This allows now for super-fast Robot avatar and nickname generation that works even if your connection to the coordinators is down. The new robot avatars, are in fact, more diverse and better looking, however, the same token will now yield a different avatar when compared to v0.5.3 (but the robot identity remains the same, also keeping the same nickname)

## Disclaimer

Please note trust in a coordinator is paramount, a malicious or rogue p2p coordinators can always find ways to steal from the users. Always exercise caution and make sure to understand the potential risks before engaging with any coordinator. Research them by: exploring their coordinator profile in the RoboSats app, reading about them in their website and social media, asking other users about their experience, etc.

## Acknowledgements

The big push needed to get the Federation Client working would not have been possible without the contributions of KoalaSat and Reckless-Satoshi.