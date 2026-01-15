---
layout: single
title: Trade Escrow
permalink: /docs/escrow/
toc: true
toc_sticky: true
sidebar:
  title: '<img id="side-icon-verybig" src="/assets/vector/money-bill-transfer.svg"/>Escrow'
  nav: docs
src: "_pages/docs/03-understand/05-trade-escrow.md"
---

When selling bitcoin, a trade escrow is used as an assurance of security. RoboSats leverages Lightning [hold invoices](https://github.com/lightningnetwork/lnd/pull/2022) in the escrow system to protect the buyer from fraud or nonpayment against their trading peer.

The alotted time to pay (lock) a trade escrow is determined by the order maker. The escrow's expiry timer defaults to {{site.robosats.hours_submit_escrow}} hours; however, this can be customized to range anywhere from 1 to 10 hours.

If the seller fails to lock their trade escrow within the given time limit, then the seller forfeits their fidelity bond. Refer to [Understand > Bonds](/docs/bonds/) for additional information on fidelity bonds. In addition, if a dispute is opened, then the Satoshis in escrow are released to the dispute winner.

Be sure to use a Lightning wallet that plays well with RoboSats, refer to [Understand > Wallets](/docs/wallets/) for additional information.

*Note: The term "seller" refers to selling bitcoin while "buyer" refers to buying bitcoin.*

## **What is a Hold Invoice?**

Lightning hold invoices, also known as "hodl" invoices, are a type of invoice that "locks" funds in your wallet and then "unlocks" those funds depending on the status of the invoice as determined by the receiver. In some wallets, the user interface describes this type of payment as an "in-flight" or "frozen" payment.

Unlike typical Lightning payments that immediately lock in and settle the HTLC when the payment arrives, a hold invoice only locks in the payment but does not yet settle it. From this moment, the sender is not able to revoke their payment and the funds are thus locked in your wallet but have yet to leave your wallet. The receiver chooses whether to settle (complete) or unlock (cancel) the HTLC and invoice.

In practice, the escrow hold invoice is locked towards the RoboSats experimental coordinator node. This means the invoice is charged exactly when the seller clicks "Confirm Fiat Received" and then the buyer invoice is paid. During the time it takes to settle the Lightning payment to the buyer, RoboSats has the funds as it tries to repeatedly payout the buyer.

This method is, at the moment, the safest approach to ensuring peers hold up to their end of the deal since a direct hold invoice between seller and buyer has yet to be practically demonstrated with conventional wallets.

## **How to Submit a Trade Escrow**

First, refer to [Understand > Wallets](/docs/wallets/) for compatible Lightning wallets that will help make using RoboSats a smoother experience. Depending on the wallet, the locked funds might show as a payment that is in transit, frozen, or even appearing to fail. Check the wallet compatability list!

Read the relevant guide depending on if you are making or taking an order to sell bitcoin:
* **Maker**: Create an order and modify the order conditions to your liking. The order can be customized to require an "Escrow/Invoice Timer" (expiry timer) other than the default of {{site.robosats.hours_submit_escrow}} hours, ranging anywhere from 1 to 10 hours. When your published order gets taken and the taker has submitted their fidelity bond, use the shown QR code with your Lightning wallet to lock the indicated amount of sats as collateral (escrow). *Note: Escrow funds are released to the buyer once you select "Confirm Fiat Received" which settles the order. Only confirm after the fiat has arrived in your account.*
* **Taker**: Browse the order book and find an order to your liking. Click "Take Order" and lock your fidelity bond. Immediately after submitting the bond, use the shown QR code with your Lightning wallet to lock the indicated amount of sats as collateral (escrow). *Note: Escrow funds are released to the buyer once you select "Confirm Fiat Received" which settles the order. Only confirm after the fiat has arrived in your account.*

As soon as the order taker locks their bond, the buyer and seller are required to submit the payout invoice and trade escrow, respectively, within the given time limit.

By default, the expiry timer is {{site.robosats.hours_submit_escrow}} hours; however, as the order maker, you can customize the timer to be anywhere from 1 hour to 10 hours. In other words, modify the time allowed to lock the escrow funds and provide the payout invoice. Maybe you want an expedited transaction and will set the timer to a maximum of 1 hour instead of {{site.robosats.hours_submit_escrow}} hours.

If the seller locks the escrow funds before the buyer has provided the payout invoice, then the seller waits to enter the peer-to-peer chat stage until after the buyer has provided their invoice.

If the seller doesn't lock the escrow funds at all, then the order will expire and the seller forfeits their bond. Half of the lost bond goes to the buyer as compensation for wasted time. Similarly, if the buyer does not provide the payout invoice within the given time limit, then the buyer forfeits their bond where half goes to the seller. The remaining half of a forfeitted bond is "donated" to RoboSats!

After the order is taken, it cannot be cancelled except if both the maker and taker agree to collaboratively cancel during the peer-to-peer chat stage. More importantly, after the seller clicks "Confirm Fiat Received", the order is considered successful and cannot enter into dispute nor be collaboratively cancelled anymore. Therefore, it is strongly recommended to use a payment method without chargeback risk (irreversible).

## **How and When the Escrow is Released**

The trade escrow is always released to its rightful owner depending on the status of the trade or, if necessary, the outcome of the dispute. There are two scenarios that cause the escrow hold invoice to be released:
* Completing a successful trade where funds are sent to the buyer (seller confirms the fiat was received)
* Opening a dispute if the trade was unsuccessful where funds are held until dispute resolution (seller intentionally did not confirm the fiat was received)

The scenarios above are expanded upon in additional detail below:

Once the fiat payment method is coordinated with the buyer, the seller clicks "Confirm Fiat Received" to end the trade which instantly releases the escrow funds to the buyer. The seller should only confirm the fiat is received *after* it appears in their possession.

If you never received the fiat payment from the buyer, do not click "Confirm Fiat Received" and instead open a dispute for RoboSats staff to review. Trying to cheat by intentionally not confirming the fiat was received results in a dispute being automatically opened on the buyer's behalf.

The cheating robot will risk losing that dispute and consequently forfeit their bond. The entirety of the locked escrow is released and rewarded to the honest robot.

Don't forget about your order! If your peer sent the fiat and the order timer expires before you confirm the fiat was received, then you will risk losing the following dispute which will in turn cause your bond to be forfeitted. Take care to remember your order and back up your robot’s unique token!

Due to the time limits involved in the order process, it is recommended to use instant fiat payment methods to avoid exceeding the expiry timer. Be aware of fiat payment methods that allow the buyer to contact their fiat institution and chargeback the transaction. It is recommended to use payment methods that are irreversible. Refer to [Best Practices > Payment Methods](/docs/payment-methods/) for additional information.

Although a very small window of time (about one second), the trade escrow could be permanently lost if RoboSats were shutdown or suddenly disappeared between the seller confirming fiat was received and the moment the buyer's Lightning wallet registers the released escrow funds. Use a well-connected Lightning wallet with sufficient inbound liquidity to help avoid routing failures and subsequently minimize any such window of opportunity.

## **Additional Information**

Some Lightning wallets have difficulty with recognizing the Lightning hold invoice as a hold on your funds. As the seller, it is necessary to use a wallet that allows for multiple pending HTLCs since you will need to lock funds for a bond and then an escrow.

If issues arise, please reach out to the RoboSats SimpleX group; but beware of scammers that may directly contact you and impersonate RoboSats staff! RoboSats staff will never directly contact you first. See [Contribute > Code > Communication Channels](/contribute/code/#communication-channels) for the SimpleX group link.

{% include improve %}
