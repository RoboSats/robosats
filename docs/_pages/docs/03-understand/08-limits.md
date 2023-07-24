---
layout: single
title: Exchange Limits
permalink: /docs/limits/
toc: true
toc_sticky: true
sidebar:
  title: '<img id="side-icon-verybig" src="/assets/vector/gauge-high.svg"/>Limits'
  nav: docs
src: "_pages/docs/03-understand/08-limits.md"
---

RoboSats is built on the Lightning Network, a micropayment network. Therefore, amounts sent and received over the Lightning Network must be small enough to successfully find a suitable route.

The maximum single trade size is {{site.robosats.max_trade_limit}} Sats and the minimum single trade size is {{site.robosats.min_trade_limit}} Sats.

However, there are no limits to the quantity of trades you can make/take on RoboSats (although it is strongly recommended to limit one order per robot identity). Generate and manage multiple robot identities using the Robot Garage feature. Just be certain to securely back up your secret robot tokens!

## **Why Have Limits?**

The reason for having a limit on the amount of Sats you can send/receive with RoboSats is due minimizing Lightning routing failure. This makes the end-user experience with RoboSats much smoother to ensure funds get reliably paid out.

The more Sats you try to push through LN, the harder it is to find a path. If there were no limits on an order, then a user might try to receive sats that will never find a suitable route.

To reduce headaches and streamline the experience, a limit is in place that is sensible to the realities of the average channel capacity across the Lightning Network. For example, trying to receive 10M Sats might never payout when the network's average channel capacity is [well below 10M Sats](https://1ml.com/statistics).

{% include improve %}
