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

Currently, there are no restrictions on the fiat payment method. You can pay with any method that both you and your peer agree on. This includes the higher risk method such as PayPal, Venmo, and Cash apps. However, the payment method with lower risk is recommended, you can learn more details about the characteristics and differences of each fiat payment method from <a href =  "https://bisq.wiki/Payment_methods#Payment_method_guides">Bisq wiki</a>.

## General recommendation

This recommendation is created as a best practice for trading in the RoboSats platform. These best practices are highly encouraged for both trading peers to follow to ensure successful trade and prevent unnecessary disputes.

Note: This guidance is modified from Bisq's <a href="https://bisq.wiki/Trading_rules">trading rules</a> and adjusted according to the difference in the trading mechanism of each platform.

### For both bitcoin buyer and seller

  1. Make sure to checking out the  <a href="https://github.com/Reckless-Satoshi/robosats/blob/main/docs/how-to-use.md">How to use </a>section before begin trading.<br>
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

## High-risk payment method

The best practice for users trying to transact with a payment method with a high risk of losing funds is discussed in this section.

### Paypal
Paypal is one of the widely used fiat payment methods. However, with <a href="https://www.paypal.com/us/webapps/mpp/ua/buyer-protection">PayPal buyer protection policy</a>, buyer can do fraudulent action by creating a refund request in PayPal after the trading process in RoboSats is finished and therefore taking both fiat and bitcoin all by themselves. 

This fraud can be prevented by agreeing with the buyer to have them send money using the “send money to a friend or family member” option. This will make the buyer become the one liable for the transaction fee and make it less likely for them to request a refund.

### For seller
If you are a seller and your peer both agreed to use “send money to a friend or family member” but your peer used the "send money for Goods or Services" option, you should return the fiat payment and ask your peer to send with an agreed method. If they insist to break the agreement, you may ask them to voluntarily end the trade or end the trade by calling a dispute.

### For buyer
If you are a buyer and you need to use “send money to a friend or family member” to pay fiat to your peer, you can choose the specified payment type by following these steps.

#### PayPal Desktop
In PayPal desktop, it is located below the drop-down currency list, it should be labeled as "Sending to a friend".
If it is labeled otherwise, you'll need to click "Change" on the right to change the payment type.
<div align="center">
<img src="/assets/images/fiat-payment-methods/PayPal-main-desktop.png" width="370"/>
</div>
Then select "Sending to a friend" in the payment type choosing page.
<div align="center">
<img src="/assets/images/fiat-payment-methods/PayPal-choose-desktop.png" width="370"/>
</div>

#### PayPal Mobile
In PayPal mobile, it is located below the payment method (In this case is VISA), it should be labeled as "Friends or Family".
If it is labeled otherwise, you'll need to tab ">" on the right to change the payment type.
<div align="center">
<img src="/assets/images/fiat-payment-methods/PayPal-main-phone.png" width="230"/>
</div>
Then select "Friends or Family" in the payment type choosing page.
<div align="center">
<img src="/assets/images/fiat-payment-methods/PayPal-choose-phone.png" width="230"/>
</div>

{% include improve %}