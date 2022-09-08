---
layout: single
title: Premium over the Market
permalink: /docs/premium/
sidebar:
  title: '<img id="side-icon-verybig" src="/assets/vector/percent.svg"/>Premium'
  nav: docs
src: "_pages/docs/03-understand/03-premium.md"
---

# **Summary**

Order makers choose any premium (positive/negative/zero) when buying or selling bitcoin. This premium can be either "relative" to the current bitcoin-fiat market rate or an "explicit" amount using a fixed number of satoshis.

At the bottom of the exchange interface is the marketplace 24-hour premium, generally around +5%, and is to be expected in a private, peer-to-peer environment.

Choose a competitive premium and incentivize fiat-consuming robots to provide liquidity to the marketplace with their anonymous bitcoin!

## **Choosing a Premium**

Create an order, then input the "Premium over Market (%)" which can be a positive, negative, or zero percentage value and is priced either relative to the bitcoin-fiat market rate or an explicit amount in satoshis.

When selecting a premium, consider the payment method(s) and amount you have chosen; these, along with your desired premium, will compete with other live orders to incentivize and entice robot takers. Experiment with different premiums to find what works best for your specific orders.

If buying bitcoin, then a higher premium increases the chances an order is fulfilled by a seller; or, if selling bitcoin, then a higher premium decreases the chances of the order being taken by a buyer. As an order maker, you are shown how your order premium ranks (compares) across similar live orders of the same currency.

In short:
* **Positive** value: trade BTC at an overprice with respect to the average price in centralized exchanges.
* **Negative** value: trade BTC at a discount with respect to the average price in centralized exchanges.
* **Zero** value: trade BTC at no price difference with respect to the average price in centralized exchanges. 
* **Relative**: let the price move with the bitcoin-fiat market rate.
* **Explicit**: set a fixed amount of satoshis.
* **Premium Rank**: indicates how your order premium ranks among all public orders with the same currency, ranging from 0% (smallest premium) to 100% (largest premium).

When making the order, you will see a text summary describing your order below the "Create Order" button. For example, buying bitcoin for $100 at a +5.00% premium relative to the market rate would read: "Create a BTC buy order for 100 USD at a 5% premium."

If a mistake is made when selecting a premium, or the order is not taken within your time preference, then the order can be easily cancelled to make a new one.

Note that the value is limited to within two decimal places. Furthermore, format the decimal values using "." (point) and not "," (comma) as the decimal separator.

## **Why Have Premiums?**

Naturally, many robots want to buy bitcoin but very few want to sell; subsequently, there is high demand for non-KYC bitcoin. Premiums are simply the byproduct of a private, peer-to-peer marketplace. 

Therefore, buyers should be realistic and increase their premiums accordingly; indeed, sellers trading bitcoin for fiat will generally demand a premium because they are the liquidity providers of precious, anonymous satoshis.

Privacy is always worth a premium, whether it be because of time, effort, or risk; as such, end-users should expect an accompanying premium with their trades.

## **Additional Information**

The premium, if relative to the market rate, references the exchange rates of public APIs, specifically blockchain.io and yadio.io prices. The median price of bitcoin in the selected currency is then calculated and displayed as the market rate your premium follows.

The 24-hour premium shown on the exchange interface is determined by the weighted median, not the mean, of successful orders in the past 24 hours. This calculation method is more resistant to outliers and more representative of peer-to-peer market consensus. In other words, the end-user should view this value as the premium they can roughly expect to pay for an order.
