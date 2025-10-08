---
layout: single
title: On-chain Payouts
permalink: /docs/on-chain-payouts/
toc: true
toc_sticky: true
sidebar:
  title: '<img id="side-icon-verybig" src="/assets/vector/link-solid.svg"/>On-chain Payouts'
  nav: docs
src: "_pages/docs/03-understand/14-on-chain-payouts.md"
---

Although RoboSats is an exchange built on top of the Lightning Network, there is an option for the buyer to receive their Sats to an on-chain bitcoin address. This is referred to as an on-chain payout or, sometimes, an on-chain swap (not to be confused with [P2P Swaps](/docs/swaps)).

In the UI, this option is available after the taker has locked their bond. When the order status is on "Waiting for buyer invoice", you should see two options: "Lightning" and "Onchain"

<div align="center">
    <img src="/assets/images/understand/14-on-chain-payouts/contract-box-on-waiting-for-buyer-invoice.png"/>
</div>

When you click on the on-chain address option you see the following:

<div align="center">
    <img src="/assets/images/understand/14-on-chain-payouts/on-chain-box.png"/>
</div>

An overview of the fees is displayed and you can enter an on-chain bitcoin address for the payout and also enter the mining fees. The *swap fee* is an additional fee that RoboSats charges for making the on-chain payment. This does not include the taker/maker fees. The swap fee is charged on the amount after deducting the taker/maker fees.

In addition to the swap fee, there's also the mining fee for the on-chain transaction. You can choose the mining fee that suits your need of the hour. The *mining fee* input let's you choose the fee rate in sats/vbyte.

If the on-chain address is valid, then the order moves to the next stage as usual. At the end, if the trade was successful, then you should see a screen something like this with the transaction ID of the payout:

<div align="center">
    <img src="/assets/images/understand/14-on-chain-payouts/successful-trade-on-chain.png"/>
</div>

## On-chain Payout Fees

The on-chain payout fees (AKA swap fees) keep changing from time to time. It may range from 1% to 10%. To get the current on-chain fees, you can check the exchange summary by clicking on the "%" button from the home screen:

<div align="center">
    <img src="/assets/images/understand/14-on-chain-payouts/exchange-info-icon.png"/>
</div>

The exchange summary dialogue displays the current value of the on-chain payout fees:

<div align="center">
    <img src="/assets/images/understand/14-on-chain-payouts/exchange-summary.png"/>
</div>

{% include improve %}
