## RoboSats - Buy and sell Satoshis Privately
[![release](https://img.shields.io/badge/release-v0.1.0%20MVP-red)](https://github.com/Reckless-Satoshi/robosats/releases)
[![AGPL-3.0 license](https://img.shields.io/badge/license-AGPL--3.0-blue)](https://github.com/Reckless-Satoshi/robosats/blob/main/LICENSE)
[![Telegram](https://img.shields.io/badge/chat-telegram-brightgreen)](https://t.me/robosats)

RoboSats is a simple and private way to exchange bitcoin for national currencies. Robosats simplifies the peer-to-peer user experience and uses lightning hold invoices to minimize custody and trust requirements. The deterministically generated avatars help users stick to best privacy practices. 

## Try it out
<div align="center">
  <img width="75%" src="https://raw.githubusercontent.com/Reckless-Satoshi/robosats/main/frontend/static/assets/images/robosats_0.1.0_banner.png">
</div>

**Bitcoin mainnet:**
- Tor: robosats6tkf3eva7x2voqso3a5wcorsnw34jveyxfqi2fu7oyheasid.onion
- Url: robosats.com (Coming soon)
- Version: v0.1.0-mvp

**Bitcoin testnet:**
- Tor: robotestagw3dcxmd66r4rgksb4nmmr43fh77bzn2ia2eucduyeafnyd.onion
- Url: testnet.robosats.com (Coming soon)
- Latest commit.

*Always use [Tor Browser](https://www.torproject.org/download/) and .onion for best anonymity.*

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
See [CONTRIBUTING.md](CONTRIBUTING.md)

## Original idea
The concept of a simple custody-minimized lightning exchange using hold invoices is heavily inspired in [P2PLNBOT](https://github.com/grunch/p2plnbot) by @grunch

## License

The Robotic Satoshis Open Source Project is released under the terms of the AGPL3.0 license. See [LICENSE](LICENSE) for more details.
