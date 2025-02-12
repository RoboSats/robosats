---
layout: single
title: Order Pricing
permalink: /docs/prices/
toc: true
toc_sticky: true
sidebar:
  title: '<img id="side-icon-verybig" src="/assets/vector/bitcoin.svg"/>Prices'
  nav: docs
src: "_pages/docs/03-understand/12-prices.md"
---

The price is the fiat rate at which bitcoin was last traded on an exchange. In other words, it indicates the exchange price a buyer and seller would both be willing to accept for a subsequent trade between bitcoin and fiat.

When making an order, there are two different pricing methods available:
* **Relative** pricing method: let the order price move with the market over time (dynamic).
* **Explicit**** pricing method: set the order price using a fixed amount of satoshis (static).

When browsing the order book, the bitcoin-fiat price of live orders you see are automatically adjusted to include the order’s corresponding premium. Refer to [Understand > Premium](/docs/premium/) for additional information on premiums.

If a fiat currency isn't available on RoboSats, then one can easily add a new currency by opening a pull request on [GitHub](https://github.com/RoboSats/robosats)!

***The explicit pricing method has been removed as an option for technical reasons, but could potentially come back in future updates. Currently, order pricing is only relative to the market rate.*

## **Prices in Practice**

If the order pricing is *relative*, then the amount of satoshis being traded relative to the fiat exchange rate (we'll call `trade_sats`) becomes "locked" once the order taker locks their bond. Until the taker bond is locked, the order's price continues to move with the market over time.

Once the taker bond is locked for a relatively priced order, the amount of satoshis being traded is calculated as follows:

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

where `fee_fraction` combines for a shared total platform fee of {{site.robosats.total_fee}}%; that breaks down to {{site.robosats.maker_fee}}% and {{site.robosats.taker_fee}}% for maker and taker, respectively. Refer to [Understand > Fees](https://learn.robosats.org/docs/fees/) for additional information on fees.

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

If the order pricing is *explicit*, then the amount of satoshis being traded is fixed regardless of the current fiat exchange rate (`CEX_rate`). Once the order is created, the satoshis are locked from the very beginning; however, the associated premium will move with the market over time instead of the price.

## **How Centralized Exchanges Determine the Bitcoin-Fiat Market Rate**

The global bitcoin-fiat market rate is determined through simple bitcoin arbitrage; this causes the fiat price of bitcoin to converge toward the prices you see on your typical centralized exchanges.

For example, if Exchange 'A' prices bitcoin at $10,000 and Exchange 'B' prices bitcoin at $10,100 ($100 difference), then buying bitcoin on Exchange 'A' and immediately selling it on Exchange 'B' would net you a $100 profit (ignoring trading fees).

This action will cause the price of bitcoin on Exchange 'A' to rise and similarly the price of bitcoin on Exchange 'B' to lower. The price on both exchanges are eventually driven closer to one another while opportunity for profitable arbitrage is diminished.

Countries that do not permit large exchanges to operate in their jurisdiction will often see bitcoin traded at a higher price, or a premium, due to the difficulty for arbitrageurs to step in and profit off that price difference.

## **Where Does RoboSats Get Price Information?**

The bitcoin exchange price on RoboSats is determined by the current exchange rates of public APIs, specifically blockchain.info and yadio.io prices. Given the currency you are using, the median bitcoin-fiat price is then calculated from the current exchange rates.

The data pulled from blockchain.info and yadio.io are publicly available and easily verifiable by anyone at anytime.

Feel free to suggest additional API providers! RoboSats calculates the median bitcoin-fiat price from all referenced APIs. Adding more APIs would lead to more robust and accurate prices on the platform.

## **How to Add Currencies**

All currencies available in yadio.io and blockchain.info APIs should be available in RoboSats as well.

Don't see a currency you want to trade with? It is very easy for contributors to add a new currency by opening a pull request on the [GitHub](https://github.com/RoboSats/robosats).

First, check the current [currencies.json](https://github.com/RoboSats/robosats/blob/main/frontend/static/assets/currencies.json) file to verify if the currency you are seeking is indeed missing from RoboSats.

If you find a currency that is missing from RoboSats and also available in any of the two referenced APIs, then you can directly edit the currencies.json and [FlagsWithProps.tsx](https://github.com/RoboSats/robosats/blob/main/frontend/src/components/FlagWithProps/FlagWithProps.tsx) files.

After merging the pull request, the added currency will now be available in RoboSats!

{% include improve %}
