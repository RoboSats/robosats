## RoboSats - Buy and sell Satoshis Privately
[![release](https://img.shields.io/badge/release-v0.1.0%20MVP-red)](https://github.com/Reckless-Satoshi/robosats/releases)
[![AGPL-3.0 license](https://img.shields.io/badge/license-AGPL--3.0-blue)](https://github.com/Reckless-Satoshi/robosats/blob/main/LICENSE)
[![Telegram](https://img.shields.io/badge/chat-telegram-brightgreen)](https://t.me/robosats)

RoboSats is a simple and private way to exchange bitcoin for national currencies. Robosats simplifies the peer-to-peer user experience and uses lightning hold invoices to minimize custody and trust requirements. The deterministically generated avatars help users stick to best privacy practices. 


<div align="center">
  <img width="75%" src="https://raw.githubusercontent.com/Reckless-Satoshi/robosats/main/frontend/static/assets/images/robosats-0.1.1-banner.png">
</div>

## Try it out! 
### **Bitcoin Mainnet**
- 🧅 **TOR URL:** [**RoboSats**6tkf3eva7x2voqso3a5wcorsnw34jveyxfqi2fu7oyheasid.onion](http://robosats6tkf3eva7x2voqso3a5wcorsnw34jveyxfqi2fu7oyheasid.onion) ( Open with [Tor Browser](https://www.torproject.org/download/))
- Clearnet URL: [unsafe.robosats.com](https://unsafe.robosats.com) (not recommended!) 
- Clearnet Mirrors: [unsafe2](https://unsafe2.robosats.com) || [unsafe3](https://unsafe3.robosats.com) (not recommended!) 
- Version: v0.1.0 MVP (+++)

*⚠️ Always use [Tor Browser](https://www.torproject.org/download/) and .onion for best anonymity. The Clearnet URL redirects to a third party Tor2web service. Your privacy cannot be guaranteed to be respected. Use clearnet only to check around the app, never use for trading!⚠️*

### **Bitcoin Testnet**
- TOR URL: [RoboTestagw3dcxmd66r4rgksb4nmmr43fh77bzn2ia2eucduyeafnyd.onion](http://robotestagw3dcxmd66r4rgksb4nmmr43fh77bzn2ia2eucduyeafnyd.onion)
- Clearnet URL: [unsafe.testnet.robosats.com](https://unsafe.testnet.robosats.com)

## How to use it

- **[Full Walkthrough how to use RoboSats (English)](https://github.com/Reckless-Satoshi/robosats/blob/main/docs/how-to-use.md)**

- **[Guia completa de como usar RoboSats (Español)](https://github.com/Reckless-Satoshi/robosats/blob/main/docs/how-to-use_es.md)**

- **[Vollständiges how to use RoboSats (German)](https://github.com/Reckless-Satoshi/robosats/blob/main/docs/how-to-use_de.md)**

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
