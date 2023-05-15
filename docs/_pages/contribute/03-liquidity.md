---
layout: single
title: "Open a Channel"
permalink: /contribute/liquidity/
sidebar:
  title: '<img id="side-icon-verybig" src="/assets/vector/circle-nodes.svg"/>LN liquidity'
  nav: contribute
toc: true
toc_sticky: true
src: "_pages/contribute/03-liquidity.md"
---


One way to contribute to RoboSats is by opening a channel to the [RoboSats experimental coordinator node](https://amboss.space/node/0282eb467bc073833a039940392592bf10cf338a830ba4e392c1667d7697654c7e) and providing RoboSats outbound liquidity. Simply use the platform to sell bitcoin and push liquidity to RoboSats' end!

## RoboSats is Not a Routing Node

RoboSats is not a typical Lightning Network routing node. A node intended for routing payments wants balanced channels to maximize chance of successful payment forwarding. The RoboSats node wants to maximize:

1. The amount of concurrent pending HTLCs without failure (bond/escrow).
2. The reliability of incoming payments being paid out to users, regardless of the channel.

With that being said, it doesn't matter if all of the outbound liquidity from RoboSats is concentrated in two channels so long as when paying a buyer is necessary, connected nodes effectively route the payment. Liquidity concentration of a few channels is only an issue for poorly-connected nodes.

## Bitcoin Sellers Opening Channels

As an example, a seller creates a new node and their only channel is with RoboSats. They push liquidity to RoboSats and then RoboSats cannot use that same channel to deliver the Sats to the buyer. The channel is considered "dead end" liquidity.

It is for this reason that opening a channel to RoboSats is only useful for the liquidity provider (seller) where they incur zero routing fees and have higher routing reliability. When a channel is completely saturated (and the seller cannot push liquidity anymore), it then gets closed and Sats are used to open outbound channels to a reliable peer.

## Bitcoin Buyers Opening Channels

As a buyer, opening channels is less useful. Doing so would only improve reliability. Keep in mind that by opening a channel directly with RoboSats, all liquidity will be on your side! So, that channel would not be useful to receive a payout right away.

{% include improve %}
