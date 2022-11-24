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

When selling bitcoin, a trade escrow is used to protect the buyer from fraud or nonpayment. The escrow acts as an assurance of security, leveraging Lightning [hold invoices](https://github.com/lightningnetwork/lnd/pull/2022) for a trustless transaction between robots.

The alotted time to submit (lock) a trade escrow is determined by the order maker. The escrow's expiry timer defaults to {{site.robosats.hours_submit_escrow}} hours; however, this can be customized to range anywhere from 1 to 8 hours.

If the seller fails to lock the trade escrow within the order's given time limit, then the seller forfeits their fidelity bond. Refer to [Understand > Bonds](https://learn.robosats.com/docs/bonds/) for additional information on fidelity bonds. In addition, if a dispute is opened, then the satoshis in escrow are released to the dispute winner.

Be sure to use a Lightning wallet that plays well with RoboSats, refer to [Understand > Wallets](https://learn.robosats.com/docs/wallets/) for additional information.

*Note: The term "seller" refers to selling bitcoin while "buyer" refers to buying bitcoin.*

## **How to Submit a Trade Escrow**

First, refer to [Understand > Wallets](https://learn.robosats.com/docs/wallets/) for compatible Lightning wallets that will help make using RoboSats a smoother experience. Depending on the wallet, the locked funds might show as a payment that is in transit, frozen, or even appearing to fail. Check the wallet compatability list!

Read the relevant guide depending on if you are making or taking an order to sell bitcoin:
* **Maker**: Select "Make Order" and modify the order conditions to your liking. The order can be customized to require an "Escrow Deposit Time-Out" (expiry timer) other than the default of {{site.robosats.hours_submit_escrow}} hours, ranging anywhere from 1 to 8 hours. When your live order gets taken and the taker has submitted their fidelity bond, use the shown QR code found in the "Contract Box" with your Lightning wallet to lock the indicated amount of sats as collateral (escrow). *Note: Escrow funds are released to the buyer once you select "Confirm Fiat Received" which settles the order. Only confirm after the fiat has arrived in your account.*
* **Taker**: Browse the order book and find an order to your liking. Simply select the "Take Order" option and lock your fidelity bond. Immediately after submitting the bond, use the following QR code found in the "Contract Box" with your Lightning wallet to lock the indicated amount of sats as collateral (escrow). *Note: Escrow funds are released to the buyer once you select "Confirm Fiat Received" which settles the order. Only confirm after the fiat has arrived in your account.*

As soon as the order taker locks their bond, the buyer and seller are required to submit the payout invoice and trade escrow, respectively, within the given time limit.

By default, the expiry timer is {{site.robosats.hours_submit_escrow}} hours; however, as the order maker, you can customize the timer to be anywhere from 1 hour to 8 hours. In other words, modify the time allowed to lock the escrow funds and provide the payout invoice. Maybe you want an expedited transaction and will set the timer to a maximum of 1 hour instead of {{site.robosats.hours_submit_escrow}} hours.

If you lock the escrow funds before the buyer has provided the payout invoice, then you will have to wait to chat with your peer until after they have provided the invoice.

If you don't lock the escrow funds at all, then the order will expire and the seller forfeits their bond. Half of the lost bond goes to the honest robot as compensation for wasted time. Similarly, if the buyer does not provide the payout invoice within the given time limit, then the buyer forfeits their bond.

After the trade escrow is locked, the order cannot be cancelled except if both the maker and taker agree to collaboratively cancel. Furthermore, after the seller confirms the fiat was received, the order cannot be collaboratively cancelled anymore. The order can then be either completed successfully or enter into a dispute.

## **How and When the Escrow is Released**

The trade escrow is always released to its rightful owner depending on the status of the trade or, if necessary, the outcome of the dispute. There are two scenarios that cause the trade escrow to be released:
* Completing a successful trade (seller confirms the fiat was received)
* Opening a dispute if the trade was unsuccessful (seller intentionally did not confirm the fiat was received)

The scenarios above are expanded upon in additional detail below.

Once the fiat payment method is coordinated with the buyer, the seller clicks "Confirm Fiat Received" to end the trade which releases the escrow funds to the buyer. The seller should only confirm the fiat is received *after* it appears in their possession.

If you never received the fiat payment from the buyer, do not click "Confirm Fiat Received" and instead open a dispute for RoboSats staff to review. Trying to cheat by intentionally not confirming the fiat was received results in a dispute being automatically opened on the buyer's behalf.

The cheating robot will risk losing that dispute and consequently forfeit their bond. The entirety of the locked escrow is released and rewarded to the honest robot.

Don't forget about your order! If your peer sent the fiat and the order timer expires before you confirm the fiat was received, then you will risk losing the following dispute which will in turn cause your bond to be forfeitted. Take care to remember your order and back up your robot’s unique token!

Due to the time limits involved in the order process, it is recommended to use instant fiat payment methods to avoid exceeding the expiry timer. Refer to [Best Practices > Payment Methods](https://learn.robosats.com/docs/payment-methods/) for additional information.

Although a very small window of time (about one second), the trade escrow could be permanently lost if RoboSats were shutdown or suddenly disappeared between the seller confirming fiat was received and the moment the buyer's Lightning wallet registers the released escrow funds. Use a well-connected Lightning wallet with sufficient inbound liquidity to help avoid routing failures and subsequently minimize any such window of opportunity.

## **Additional Information**

Some Lightning wallets have difficulty with recognizing the Lightning hold invoice as a hold on your funds. As the seller, it is necessary to use a wallet that allows for multiple pending HTLCs since you will need to lock funds for a bond and then an escrow.

If issues arise, please reach out to the RoboSats Telegram group; but beware of scammers that may directly contact you and impersonate RoboSats staff! RoboSats staff will never directly contact you first. See [Contribute > Code > Communication Channels](https://learn.robosats.com/contribute/code/#communication-channels) for available Telegram groups.

{% include improve %}
