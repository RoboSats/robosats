## RoboSats - Buy and sell Satoshis Privately
[![Docker Image CI](https://github.com/Reckless-Satoshi/robosats/actions/workflows/docker-image.yml/badge.svg?branch=main)](https://github.com/Reckless-Satoshi/robosats/actions/workflows/docker-image.yml)
[![Frontend Build](https://github.com/Reckless-Satoshi/robosats/actions/workflows/frontend-build.yml/badge.svg?branch=main)](https://github.com/Reckless-Satoshi/robosats/actions/workflows/frontend-build.yml)
[![release](https://img.shields.io/badge/release-v0.1.0%20MVP-red)](https://github.com/Reckless-Satoshi/robosats/releases)
[![AGPL-3.0 license](https://img.shields.io/badge/license-AGPL--3.0-blue)](https://github.com/Reckless-Satoshi/robosats/blob/main/LICENSE)
[![Telegram](https://img.shields.io/badge/chat-telegram-brightgreen)](https://t.me/robosats)

RoboSats is a simple and private way to exchange bitcoin for national currencies. Robosats simplifies the peer-to-peer user experience and uses lightning hold invoices to minimize custody and trust requirements. The deterministically generated avatars help users stick to best privacy practices. 


<div align="center">
  <img width="75%" src="https://raw.githubusercontent.com/Reckless-Satoshi/robosats/main/frontend/static/assets/images/robosats-0.1.1-banner.png">
</div>

## Try it out! 
### **Bitcoin Mainnet**
- **TOR URL:** [**RoboSats**6tkf3eva7x2voqso3a5wcorsnw34jveyxfqi2fu7oyheasid.onion](http://robosats6tkf3eva7x2voqso3a5wcorsnw34jveyxfqi2fu7oyheasid.onion) ( Open with [Tor Browser](https://www.torproject.org/download/))
- Clearnet URL: [unsafe.robosats.com](https://unsafe.robosats.com) (not recommended!) 
- Clearnet Mirrors: [unsafe2](https://unsafe2.robosats.com) || [unsafe3](https://unsafe3.robosats.com) (not recommended!) 

*Always use [Tor Browser](https://www.torproject.org/download/) and .onion for best privacy. The Clearnet URL redirects to a third party Tor2web service. Your privacy cannot be guaranteed to be respected. Use clearnet only to check around the app, never use for trading!*

- [Testnet and mirrors](https://learn.robosats.com/docs/access)

## How to use it

- **[Full Walkthrough how to use RoboSats (English)](https://learn.robosats.com/read/en)**

- **[Guia completa de como usar RoboSats (Español)](https://learn.robosats.com/read/es)**

- **[Vollständiges how to use RoboSats (Deutsch)](https://learn.robosats.com/read/de)**

**Short video-walktrough**

https://user-images.githubusercontent.com/90936742/167310017-dc211a05-dd5e-4ef4-b93f-250f80bc5bca.mp4

**Video tutorial** by Ben from BTCsessions (YouTube)
[![ROBOSATS - Buy and Sell Bitcoin With No ID (Youtube)](https://user-images.githubusercontent.com/90936742/167309821-79be8570-fcd1-4677-b43f-fb1aedc896bb.png)](https://www.youtube.com/watch?v=XW_wzRz_BDI)

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
10. Bob and Alice's bonds return automatically, since they complied by the rules.
11. The bonds would be charged (lost) in case of unilateral cancellation or cheating (lost dispute).


## Contribute to the Robotic Satoshis Open Source Project
Check out our [Contribution Guide](https://learn.robosats.com/contribute/) to find how you can make RoboSats great.

### ⚡Developer Rewards ⚡
Check out the [Developer Rewards Panel](https://github.com/users/Reckless-Satoshi/projects/2/views/5) for tasks paid in Sats.

## Sponsors 
<div align="center">
  <img src="https://raw.githubusercontent.com/Reckless-Satoshi/robosats/main/docs/assets/images/sponsors/hrf.png" width="300px">
</div>

## Inspiration
The concept of a simple custody-minimized lightning exchange with hold invoices is inspired in [P2PLNBOT](https://github.com/grunch/p2plnbot) by @grunch

## License

The Robotic Satoshis Open Source Project is released under the terms of the AGPL3.0 license. See [LICENSE](LICENSE) for more details.
