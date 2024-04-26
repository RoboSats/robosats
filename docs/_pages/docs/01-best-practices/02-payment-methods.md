---
layout: single
title: Fiat Best Practices
permalink: /docs/payment-methods/
toc: true
toc_sticky: true
sidebar:
  title: '<img id="side-icon-verybig" src="/assets/vector/hand-peace.svg"/>Fiat Best Practices'
  nav: docs
src: "_pages/docs/01-best-practices/02-payment-methods.md"
---

Currently, there are no restrictions on the fiat payment method. You can pay with any method that both you and your peer agree on. This includes the higher risk method such as PayPal, Venmo, and Cash apps. However, the payment method with lower risk is recommended, you can learn more details about the characteristics and differences of each fiat payment method from <a href =  "https://bisq.wiki/Payment_methods#Payment_method_guides">Bisq wiki</a>. The Bisq guidelines apply as the default guidelines for RoboSats.

## General recommendation

This recommendation is created as a best practice for trading in the RoboSats platform. These best practices are highly encouraged for both trading peers to follow to ensure successful trade and prevent unnecessary disputes.

Note: This guidance is modified from Bisq's <a href="https://bisq.wiki/Trading_rules">trading rules</a> and adjusted according to the difference in the trading mechanism of each platform.

### For both bitcoin buyer and seller

  1. Make sure to checking out the  <a href="https://github.com/RoboSats/robosats/blob/main/docs/how-to-use.md">How to use </a>section before begin trading.<br>
  2. State the agreement clearly to prevent misunderstanding.<br>
  3. The fiat payment method should be able to send and receive instantly because the hodl invoice had an expiration time of 24 hours.<br>
if the timer reaches the expiration, it could trigger a dispute and could lead to a loss of fidelity bond.<br>
  4. After the taker had taken the order, both sides should be ready to process to the next step before the timer expire.<br>
  5. Please be aware that no one can read the chat between you and your peer.

### For bitcoin buyer

  1. Make sure the fiat sending destination address/account is correct.<br>
  2. Make sure to keep your fiat sending evidence such as transaction receipt.<br>
  3. Click the "Confirm fiat send" button after you successfully send the fiat out of your account.<br>

### For bitcoin seller

  1. Confirm if the final amount of fiat received is correct.<br>
  2. Click "Confirm fiat receive" after you are 100% sure that fiat is successfully deposited in your account.<br>
  3. If you agree with the buyer to use the high-risk platform you will need special precautions to prevent chargeback (This'll be discussed later).<br>

## Medium-low risk payment method

### Amazon eGift Cards
Amazon eGift Cards are one of the more private payment methods on RoboSats. They tend to be quick and convenient, but funds must be spent on Amazon.

It is important to not share a giftcard code directly on the chat, as this might lead to difficult to solve disputes in case of fraud. As a seller, **do not accept a giftcard code on the chat**. Instead, the seller should provide an email in chat. The buyer should buy a new giftcard explicitly for the trade and have it sent to the email address of the seller. This way the seller knows he is the only one to have access to the redemeable code. This apprach also generates verifiable evidence that the giftcard was bought for the RoboSats trade in case of dispute.

**Amazon no longer accepts gift card as payment to buy gift cards.**

Find more details on [Amazon eGift card Bisq guidelines](https://bisq.wiki/Amazon_eGift_card)

### Interac e-Transfer

In Canada, [Interac e-Transfer](https://www.interac.ca/en/consumers/support/faq-consumers/) is a popular and widely accepted payment method used to send payments from one bank account to another, using only a registered email (or telephone number). e-Transfers are considered to have low charge-back risk; however, charge-backs likely remain possible in rare cases. e-Transfers can either be initiated by the sender by sending a payment to the recipient's email address, or by the receiver by sending a payment request to the sender's email address.

### Wise

[Wise](https://wise.com/) (formerly TransferWise) is a regulated international money transmitter in 175 countries and 50 currencies. It is known for its relatively cheap fees for transferring money between countries and currencies. Chargebacks remain a risk, but are likely uncommon. Users may transfer money between Wise accounts using an email address similar to how e-Transfers work; or in Canada, users may request standard e-Transfers directly from their Wise accounts.

## High-risk payment method

The best practice for users trying to transact with a payment method with a high risk of losing funds is discussed in this section.

### Instant SEPA Payment Guidelines

Instant SEPA is a widely adopted payment method across Europe, offering fast and efficient cashless transactions. However, it comes with a significant risk for sellers, including the potential for chargebacks. To mitigate these risks, it is advisable for sellers to request the buyer's information before sharing their SEPA details. This information could include the buyer's country, full name, and bank account number. By obtaining this information, sellers can reduce the risk of fraudulent transactions, such as triangle attacks, while buyers, sharing this information does not decrease their privacy, as they are not exposing any additional information that the seller would not have access to anyway after the SEPA transfer.

For buyers, it is crucial to comply with sellers' if they request personal information when they are initiating SEPA transactions. Failure to provide this information can lead to the seller raising an immediate dispute, which sellers are likely to win (the seller will also earn the buyer's bond in this specific case). Therefore, it is in the best interest of buyers to cooperate with sellers' requests for information.

Sellers are encouraged to share a link to this guide with their buyers when requesting information. This ensures that both parties are informed and understand the importance of this step when using Instant SEPA.

### Revolut via payment links

In a Revolut payment, a `@revtag` is usually exchanged in the chat and can be verified in the payment history of the app making proof of payments easy.

However, payment links, which have the format https://revolut.me/p/XXXXX, don't contain recipient address information.

In a dispute, there's no recipient address reference and both buyer and seller could cheat. The payment link could be redeemed by an unknown third party complicit with either buyer or seller.

Therefore, insist on receiving the `@revtag` when making a payment with Revolut to avoid these risks. The  `@revtag` can also be received as a link. This link would look like this: https://revolut.me/@revtag.

### Paypal
Paypal is one of the widely used fiat payment methods. However, as a seller Paypal is the highest risk you can take. Using Paypal as payment method is not advised.

If you still wish to use Paypal there is a few things to take into account. With <a href="https://www.paypal.com/us/webapps/mpp/ua/buyer-protection">PayPal buyer protection policy</a>, buyers can do fraudulent action by creating a refund request in PayPal after the trading process in RoboSats is finished and therefore taking both fiat and bitcoin all by themselves.

This fraud could be prevented by agreeing with the buyer to have them send money using the “send money to a friend or family member” option. This will make the buyer become the one liable for the transaction fee and make it less likely for them to request a refund.

### For seller
If you are a seller and your peer both agreed to use “send money to a friend or family member” but your peer used the "send money for Goods or Services" option, you should return the fiat payment and ask your peer to send with an agreed method. If they insist to break the agreement, you may ask them to voluntarily end the trade or end the trade by calling a dispute.

### For buyer
If you are a buyer and you need to use “send money to a friend or family member” to pay fiat to your peer, you can choose the specified payment type by following these steps.

{% include improve %}
