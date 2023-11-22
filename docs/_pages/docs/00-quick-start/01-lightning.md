---
layout: single
title: "The Lightning Network"
permalink: /docs/lightning/
toc: true
toc_sticky: true
sidebar:
  title: '<img id="side-icon-verybig" src="/assets/vector/bolt.svg"/>Lightning Network'
  nav: docs
src: "_pages/docs/00-quick-start/01-lightning.md"
---

The Lightning Network, or simply referred to as LN, is an off chain (layer two) micropayment network featuring low fees and instant payments. RoboSats leverages the advantages of transacting off chain to provide users a quick and inexpensive experience! There are many great resources out there to learn more about how the Lightning Network works. Check out ["Mastering the Lightning Network"](https://github.com/lnbook/lnbook) for one such great resource.

RoboSats is experimental, and as such is currently supported by an [experimental coordinator node](https://amboss.space/node/02187352cc4b1856b9604e0a79e1bc9b301be7e0c14acbbb8c29f7051d507127d7). The upcoming [federation upgrade](https://github.com/RoboSats/robosats/pull/601) allows anyone to become a coordinator node and support the RoboSats federation, thereby creating a decentralized but unified order book consisting of federation members competing against each other to attract traders.

## **Using the Lightning Network**

A prerequisite to using LN is a wallet. It is highly recommended to use a non-custodial and FOSS wallet where only you hold the keys. Custodial and closed source wallets can collect information on your transactions, account information, and potentially other metadata. Also remember that any funds kept on LN are not considered cold storage, but are in a "hot" wallet connected to the internet. For the purpose of using RoboSats, it is recommended to use a wallet that plays well with [Lightning hold invoices](/docs/escrow/#what-is-a-hold-invoice), refer to [Understand > Wallets](/docs/wallets/) for a non-exhaustive list of LN wallet compatibility.

When using Lightning, payments are done via invoices. The receiver of Sats gives an invoice to the sender of Sats, often in the form of a QR code, requesting the sender to pay the specific amount of Sats requested by the invoice. The invoice begins with the prefix "lnbc" and can be decoded to inspect the contents of it, like the amount of Sats sent, the node ID the Sats were sent to, any descriptions that were provided, etc.

Lightning as it stands is not completely private. Users should take care to not reveal sensitive information when sending and receiving payments on LN. Do not trust a closed source and custodial wallet to respect your information, you can gain a greater degree of privacy if using a non-custodial wallet. As well, refer to [Best Practices > Proxy Wallets](/docs/proxy-wallets/) for more information on privacy concerns when receiving Sats over LN.

## **Lightning Network "Shenanigans"**

While very infrequent, it can happen that some intermediary routing node goes offline or the transaction becomes "stuck" while attempting a payment. Informally referred to as Lightning Network shenanigans, issues like this are due to current limitations of LN. It solves by itself after a few hours or maximum of a couple days.

When buying bitcoin (receiving Sats on LN), the invoice you provide can fail in routing and take many retries. RoboSats attempts to send the Sats three times and, if it fails, will request a new invoice to try again. Rinse and repeat until it sends! During this time, your funds are considered safe.

In the event of such a scenario, securely back up your robot's private token and check back on your order payout from time to time. If the issue persists, do not hesitate to reach out to the [SimpleX support group](/contribute/code/#communication-channels) so that RoboSats staff can investigate.

{% include improve %}
