## RoboSats - Buy and sell Satoshis Privately
[![GitHub downloads](https://img.shields.io/github/downloads/RoboSats/robosats/total?label=Downloads&labelColor=27303D&color=0D1117&logo=github&logoColor=FFFFFF&style=flat)](https://github.com/RoboSats/robosats/releases)
[![release](https://img.shields.io/github/v/release/RoboSats/robosats)](https://github.com/RoboSats/robosats/releases)
[![AGPL-3.0 license](https://img.shields.io/badge/license-AGPL--3.0-blue)](https://github.com/RoboSats/robosats/blob/main/LICENSE)
[![SimpleX](https://img.shields.io/badge/chat-simplex-brightgreen)](https://simplex.chat/contact#/?v=1-2&smp=smp%3A%2F%2F0YuTwO05YJWS8rkjn9eLJDjQhFKvIYd8d4xG8X1blIU%3D%40smp8.simplex.im%2FyEX_vdhWew_FkovCQC3mRYRWZB1j_cBq%23%2F%3Fv%3D1-2%26dh%3DMCowBQYDK2VuAyEAnrf9Jw3Ajdp4EQw71kqA64VgsIIzw8YNn68WjF09jFY%253D%26srv%3Dbeccx4yfxxbvyhqypaavemqurytl6hozr47wfc7uuecacjqdvwpw2xid.onion&data=%7B%22type%22%3A%22group%22%2C%22groupLinkId%22%3A%22hWnMVPnJl-KT3-virDk0JA%3D%3D%22%7D)
[![Nostr](https://img.shields.io/badge/chat-nostr-brightgreen)](https://chachi.chat/groups.0xchat.com/925b1aa20cd1b68dd9a0130e35808d66772fe082cf3f95294dd5755c7ea1ed59)

RoboSats is a simple and private way to exchange bitcoin for national currencies. Robosats simplifies the peer-to-peer user experience and uses lightning hold invoices to minimize custody and trust requirements. The deterministically generated avatars help users stick to best privacy practices.


<div align="center">
  <img width="75%" src="https://raw.githubusercontent.com/RoboSats/robosats/main/frontend/static/assets/images/robosats-0.1.1-banner.png">
</div>

## Learn

Check our tutorials and many more at https://learn.robosats.org

## Try it out!
- **TOR URL:** [**RoboSats**y56bwqn56qyadmcxkx767hnabg4mihxlmgyt6if5gnuxvzad.onion](http://RoboSatsy56bwqn56qyadmcxkx767hnabg4mihxlmgyt6if5gnuxvzad.onion) ( Open with [Tor Browser](https://www.torproject.org/download/))
- Clearnet URL: [unsafe.robosats.org](https://unsafe.robosats.org) (not recommended!)

*Always use [Tor Browser](https://www.torproject.org/download/) and .onion for best privacy. The Clearnet URL redirects to a third party Tor2web service. Your privacy cannot be guaranteed to be respected. Use clearnet only to check around the app, never use for trading!*

*You can use Testnet Bitcoin by going to the Settings page and switching to Testnet*

Robosats is also available for Android devices

<div align="center">
    <a href="https://apt.izzysoft.de/fdroid/index/apk/com.robosats" target="_blank">
        <img src="./docs/IzzyOnDroid.png" alt="Get it on IzzyOnDroid.png" height="70" />
    </a>
    <a href="https://github.com/ImranR98/Obtainium" target="_blank">
        <img src="./docs/obtainium.png" alt="Get it on Obtaininum" height="70" />
    </a>
    <a href="https://github.com/zapstore/zapstore/releases" target="_blank">
        <img src="./docs/zapstore.svg" alt="Get it on Zap.Store" height="70" />
    </a>
    <a href="https://github.com/RoboSats/robosats/releases" target="_blank">
        <img src="https://github.com/machiav3lli/oandbackupx/raw/034b226cea5c1b30eb4f6a6f313e4dadcbb0ece4/badge_github.png" alt="Get it on GitHub" height="70">
    </a>
</div>

## How to use it
https://user-images.githubusercontent.com/90936742/167310017-dc211a05-dd5e-4ef4-b93f-250f80bc5bca.mp4

### Written guides
- **[English](https://learn.robosats.org/read/en)**
- **[Español](https://learn.robosats.org/read/es)**
- **[Deutsch](https://learn.robosats.org/read/de)**
- **[Français](https://learn.robosats.org/read/fr)**
- **[Русский](https://learn.robosats.org/read/ru)**

### Video guides
- **[English](https://learn.robosats.org/watch/en/)**
- **[Español](https://learn.robosats.org/watch/es/)**
- **[Deutsch](https://learn.robosats.org/watch/de)**
- **[Português](https://learn.robosats.org/watch/pt)**
- **[Polski](https://learn.robosats.org/watch/pl)**
- **[Français](https://learn.robosats.org/watch/fr)**
- **[Русский](https://learn.robosats.org/watch/ru)**

## How it works

Alice wants to buy satoshis privately:
1. Alice generates an avatar (AdequateAlice01) using her private random token.
2. Alice stores safely the token in case she needs to recover AdequateAlice01 in the future.
3. Alice makes a new order and locks a small hold invoice to publish it (maker bond).
4. Bob wants to sell satoshis, sees Alice's order in the book and takes it.
5. Bob scans a small hold invoice as his taker bond. The contract is final.
6. Bob posts the traded satoshis with a hold invoice. While Alice submits her payout invoice.
7. On a private chat, Bob tells Alice how to send him fiat.
8. Alice pays Bob, then they confirm the fiat has been sent and received.
9. Bob's trade hold invoice is charged and the satoshis are sent to Alice.
10. Bob and Alice's bonds return automatically, since they complied with the rules.
11. The bonds would be charged (lost) in case of unilateral cancellation or cheating (lost dispute).

## Contribute to the Robotic Satoshis Open Source Project
Check out our [Contribution Guide](https://learn.robosats.org/contribute/) to find how you can make RoboSats great.

RoboSats is a monorepo, arguably a messy one at the moment.
 - The top level is a Django application (the coordinator backend) with apps `/api`, `/control`, and `/chat`. Django settings are in `/robosats` and `/tests` has integration tests for the RoboSats backend.
 - The `/frontend` directory contains the ReactJS client.
 - The `/nodeapp` directory contains the docker orchestration and utilities for the self-hosted application (Umbrel, StartOS, etc). We also use this one in unsafe.robosats.org

 - The `/mobile` directory contains our React Native app (a wrapper around our ReactJS app in `/frontend`)
 - The `/docs` directory has the learn.robosats.org static Jekyll site markdown docs.
 - The `/web` directory is a light wrapper around our client app `/frontend` intended to host a RoboSats dex client to be used for the public. Used for our official onion address.

You can run the whole stack for local development following the instructions in [setup.md](/setup.md)

Officially mantained docker orchestration for coordinators can be found in the repo [robosats-deploy](https://github.com/RoboSats/robosats-deploy)
### ⚡Developer Rewards ⚡
Check out the [Developer Rewards Panel](https://github.com/users/Reckless-Satoshi/projects/2/views/5) for tasks paid in Sats.

## Sponsors
<div align="center">
  <img src="https://raw.githubusercontent.com/RoboSats/robosats/main/docs/assets/images/sponsors/hrf.png" width="300px">
</div>

## Reviews
- **[Athena Alpha](https://www.athena-alpha.com/robosats-review/)**
- **[Bitcoin Magazine](https://bitcoinmagazine.com/business/robosats-private-bitcoin-exchange)**
- **[KYC? Not Me!](https://kycnot.me/service/robosats)**
- **[H17N Bitcoin](https://h17n.com/exchange/robosats/)**
- **[blockdyor](https://blockdyor.com/robosats/)**

## Inspiration
The concept of a simple custody-minimized lightning exchange with hold invoices is inspired in [P2PLNBOT](https://github.com/grunch/p2plnbot) by @grunch

## License

The Robotic Satoshis Open Source Project is released under the terms of the AGPL3.0 license. See [LICENSE](LICENSE) for more details.
