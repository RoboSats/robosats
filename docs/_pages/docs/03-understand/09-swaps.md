---
layout: single
title: P2P Swaps
permalink: /docs/swaps/
sidebar:
  title: '<img id="side-icon-verybig" src="/assets/vector/arrow-right-arrow-left.svg"/>Swaps'
  nav: docs
src: "_pages/docs/03-understand/09-swaps.md"
---

Apart from the various fiat payment methods available, there are something
called *Swap Destinations* as well. These are payment methods, but for BTC, on
a network other than the Lightning Network. This is useful if you want to
exchange lightning satoshis for on-chain satoshis (or on any other network like
Liquid BTC if you prefer). This process of exchanging satoshis on the Lightning
Network for on-chain satoshis is usually referred to as a "swap".

The table below makes it simple to understand swap in terms of "buyer" and "seller":

| Side   | Sends         | Receives     | Swap type |
|--------|---------------|--------------|-----------|
| Seller | ⚡BTC         | 🔗 BTC       | Swap out  |
| Buyer  | 🔗 BTC        | ⚡BTC        | Swap in   |


### How to do a P2P Swap

Remember, in RoboSats you always buy or sell Lightning Network satoshis. If you
want to receive satoshis over the Lightning Network in exchange for your
on-chain satoshis, then you create a **BUY** order. On the contrary, if you
want to receive satoshis on-chain in exchange for your Lightning Network
satoshis, then create a *SELL* order.

In the Order Create screen, select "BTC" from the currency dropdown menu:

<div align="center">
    <img src="/assets/images/understand/btc-swap-in-dropdown.png"/>
</div>

Select your Swap Destination from the dropdown:

<div align="center">
    <img src="/assets/images/understand/swap-destination-selection.png"/>
</div>

You then set the amount or range you want to swap for. Remember that if you
are a seller, then you will receive on-chain BTC and if you are the buyer, you
will be sending on-chain BTC:

<div align="center">
    <img src="/assets/images/understand/amount-swap.png"/>
</div>

You then simply create the order and wait for a taker to take your order. In
the chatroom you move forward as usual, but this time the payment method is
simply an on-chain bitcoin address.


### Order amount and mining fees

The amount to be sent on-chain must be the exact value mentioned in the order
amount. The sender of on-chain sats needs to cover for mining fees (on-chain
transaction fees).

### What premium do I set?

In case of a swap it's better to keep premium to 0% but if you want to make the
offer a little more attractive to your counterparty you can follow the below
recommendations:

1. If you are the **seller** - you will be **receiving** on-chain BTC; setting
   the premium slightly below 0% (eg. -0.1%, -0.5%) will make your offer
   attractive. The taker already pays 0.125% fees on the trade plus they have
   to pay mining fees for sending the on-chain BTC.

2. If you are the **buyer** - you will be **sending** on-chain BTC; setting the
   premium slightly above 0% (eg. 0.1%, 0.5%) will make your offer attractive.

These are just general recommendations about what premium to set to get started
with swaps, but at the end of the day, the price is what the market sets, so
experiment and see what works for you.
