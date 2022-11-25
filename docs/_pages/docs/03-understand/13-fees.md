---
layout: single
title: Platform Fees
permalink: /docs/fees/
toc: true
toc_sticky: true
sidebar:
  title: '<img id="side-icon-verybig" src="/assets/vector/hand-holding-hand.svg"/>Fees'
  nav: docs
src: "_pages/docs/03-understand/13-fees.md"
---

RoboSats charges a {{site.robosats.total_fee}}% fee of the total trade amount; this fee is distributed between the order maker and the order taker who pay {{site.robosats.maker_fee}}% and {{site.robosats.taker_fee}}%, respectively.

The platform fees are summarized in the table below:

| Side   | Maker                        | Taker                        |
|--------|------------------------------|------------------------------|
| Buyer  | {{site.robosats.maker_fee}}% | {{site.robosats.taker_fee}}% |
| Seller | {{site.robosats.maker_fee}}% | {{site.robosats.taker_fee}}% |

*Note: External fees may be incurred such as Lightning Network routing fees and on-chain transaction fees.*

## **Platform Fees in Practice**

The total fee ({{site.robosats.total_fee}}%) is split between the maker and taker. The taker pays a greater amount ({{site.robosats.taker_fee}}%) than the maker pays ({{site.robosats.maker_fee}}%); this is designed to encourage more makers and subsequently increase available liquidity on the exchange.

In practice, the fees are applied when the user is presented with submitting the trade escrow (seller) or payout invoice (buyer) after the taker bond is locked.

If the order pricing is *relative*, then the amount of satoshis being traded relative to the fiat exchange rate (we'll call `trade_sats`) fluctuates until the taker bond is locked. In cases of *explicit* order pricing, the amount of satoshis being traded is fixed. Refer to [Understand > Prices](https://learn.robosats.com/docs/prices/) for additional information regarding relative and explicit pricing methods.

Until the taker bond is locked, the order's price continues to move with the market over time. Once the taker bond is locked for a relatively priced order, the amount of satoshis being traded is calculated as follows:

````
premium_rate = CEX_rate * (1 + (premium / 100))
trade_sats = amount / premium_rate
````

where `trade_sats` is the satoshis to be traded, `premium` is what the order maker defined during order creation, and `CEX_rate` is the current bitcoin exchange price given the currency you are using.

The platform fees (`fee_sats`) associated with your order are calculated using the `trade_sats` variable:
* For maker:
  ````
  fee_fraction = 0.002 * 0.125
               = 0.00025 ==> {{site.robosats.maker_fee}}%
  fee_sats = trade_sats * fee_fraction
  ````
* For taker:
  ````
  fee_fraction = 0.002 * (1 - 0.125)
               = 0.00175 ==> {{site.robosats.taker_fee}}%
  fee_sats = trade_sats * fee_fraction
  ````

where `fee_fraction` combines for a shared total platform fee of {{site.robosats.total_fee}}%. As noted hereinbefore, the taker pays a greater amount ({{site.robosats.taker_fee}}%) than the maker pays ({{site.robosats.maker_fee}}%) to encourage liquidity growth with more order makers.

RoboSats then collects fees in the trade escrow (`escrow_amount`) and payout invoice (`payout_amount`) process by calculating the following:
* For seller:
  ````
  escrow_amount = trade_sats + fee_sats
  ````
* For buyer:
  ````
  payout_amount = trade_sats - fee_sats
  ````

In essence, RoboSats adds to the `escrow_amount`, deducts from the `payout_amount`, and, depending on whether you are the order taker or the order maker, applies the appropriate `fee_fraction` calculations.

## **Why Have Fees?**

Fees work to improve the platform's end-user experience through continuing development, offering multilingual support, and building out guides for interacting with the platform.

Fees in turn reward the volunteer GitHub developers and contributors for completing tasks that are [elligible for earning bitcoin](https://github.com/users/Reckless-Satoshi/projects/2). Check it out! If you earn satoshis for your contributions, then fees incurred while using RoboSats would be sufficiently covered!

Implementing fees also helps mitigate the opportunity for denial of service attacks by malicious bots congesting the RoboSats coordinator.

## **External Fees**

External platform fees can be incurred when performing on-chain payouts (on-chain swaps) and when routing payments through the Lightning Network.

When choosing to receive bitcoin on-chain, an overview of the fees (swap fee and mining fee) is displayed.

The swap fee is an additional fee that RoboSats charges for making the on-chain payment and the mining fee is the on-chain fee rate in sats/vbyte which can be customized to suit your needs. Refer to [Understand > On-Chain Payouts](https://learn.robosats.com/docs/on-chain-payouts/) for additional information regarding on-chain payouts.

RoboSats leverages the speed and security of the Lightning Network, therefore payments sent through the Lightning Network may incur fees depending on the necessary "path" that payment must take.

The user has the option to specify the Lightning Network routing budget which may help reduce routing failures. Refer to [Quick Start > Lightning Network](https://learn.robosats.com/docs/lightning/) for additional information on routing failures.

{% include improve %}
