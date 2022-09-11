---
layout: single
title: Premium over the Market
permalink: /docs/premium/
toc: true
toc_sticky: true
sidebar:
  title: '<img id="side-icon-verybig" src="/assets/vector/percent.svg"/>Premium'
  nav: docs
src: "_pages/docs/03-understand/03-premium.md"
---

The premium associated with your peer-to-peer order is the price difference that exists over or under the going rate for bitcoin-fiat found on your typical centralized exchanges.

Order makers choose their desired premium when buying and selling bitcoin. This premium, expressed as a percentage, is priced relative to the current bitcoin-fiat market rate.

Alternatively, the maker can pick a premium using the explicit pricing method with a fixed amount of satoshis in lieu of following the current market rate.

At the bottom of the exchange interface is the price premium of the marketplace over the last 24 hours, generally around +5%, and is to be expected in a private, peer-to-peer environment.

Choose a competitive premium and incentivize fellow robots to provide liquidity to the marketplace with their anonymous bitcoin and fiat!

## **Choosing a Premium**

Create an order, then input the "Premium over Market (%)" which can be a positive, negative, or zero percentage value. By default, the order premium is priced relative to the bitcoin-fiat market rate.

Or, instead of the default setting, makers can select the explicit pricing method by choosing an exact amount of satoshis to exchange for the fiat amount given.

When selecting a premium, consider the payment method(s) and amount you have chosen; these, along with your desired premium, will compete with other live orders to incentivize and entice robot takers. Experiment with different premiums to find what works best for your specific orders.

If buying bitcoin, then a higher premium increases the chances an order is fulfilled by a seller; or, if selling bitcoin, then a higher premium decreases the chances of the order being taken by a buyer. As an order maker, you are shown how your order premium ranks (compares) across similar live orders of the same currency.

In short:
* **Positive** premium: trade BTC at an overprice with respect to the average price in centralized exchanges.
* **Negative** premium: trade BTC at a discount with respect to the average price in centralized exchanges.
* **Zero** premium: trade BTC at no price difference with respect to the average price in centralized exchanges. 
* **Relative** pricing method: let the price premium move with the bitcoin-fiat market rate.
* **Explicit** pricing method: set a price premium using a fixed amount of satoshis.
* **Premium Rank**: indicates how your order premium ranks among all public orders with the same currency, ranging from 0% (smallest premium) to 100% (largest premium).

When making the order, you will see a text summary describing your order below the "Create Order" button. For example, buying bitcoin for $100 at a +5.00% premium relative to the market rate would read: "Create a BTC buy order for 100 USD at a 5% premium."

If a mistake is made when selecting a premium, or the order is not taken within your time preference, then the order can be easily cancelled to make a new one.

Note that the percent value is limited to within two decimal places. Furthermore, format the decimal values using "." (point) and not "," (comma) as the decimal separator.

## **Why Have Premiums?**

Naturally, many robots want to buy bitcoin but very few want to sell; subsequently, there is high demand for exchanging bitcoin privately. Premiums are simply the byproduct of that supply and demand relationship in an anonymous, peer-to-peer marketplace.

Therefore, buyers should be realistic and adjust their premiums accordingly; indeed, sellers trading bitcoin for fiat will generally seek a premium because they are providing liquidity with their bitcoin and fiat. However, depending on market conditions, the premium can become zero or negative.

Privacy is valuable for both buyer and seller and always worth a premium, whether it be because of time, effort, or risk; as such, end-users can expect an accompanying premium with their trades.

## **Additional Information**

The relative premium references the current exchange rates of public APIs, specifically blockchain.io and yadio.io prices. The median price of bitcoin in the selected currency is then calculated and displayed as the market rate your premium follows.

The 24-hour premium shown on the exchange interface is determined by the weighted median, not the mean, of successful orders in the past 24 hours. This calculation method is more resistant to outliers and more representative of peer-to-peer market consensus. In other words, the end-user should view this value as the premium they can roughly expect to pay for an order.
