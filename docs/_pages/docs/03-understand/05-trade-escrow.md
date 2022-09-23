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

When selling bitcoin, a trade escrow is used to protect the buyer from fraud or nonpayment. The escrow acts as an assurance of security, leveraging Lightning [hold invoices](https://github.com/lightningnetwork/lnd/pull/2022)  for a trustless transaction between robots.

If the seller fails to submit the trade escrow within the order's given time limit, then the seller forfeits their fidelity bond. As well, if a dispute is opened, the satoshis in escrow are sent to the dispute winner.

The alotted time to submit a trade escrow is determined by the order maker. The escrow's expiry timer defaults to three hours; however, this can be customized to range anywhere from one to eight hours.

Be sure to use a Lightning wallet that plays well with RoboSats, refer to [Understand > Wallets](https://learn.robosats.com/docs/wallets/) for additional information.

*Note: In this section, "seller" specifically refers to selling bitcoin while "buyer" specifically refers to buying bitcoin.*

## **How to Submit a Trade Escrow**

First, refer to [Understand > Wallets](https://learn.robosats.com/docs/wallets/) for compatible Lightning wallets that will help make using RoboSats a smoother experience. Depending on the wallet, the locked funds might show as a payment that is in transit, frozen, or even appearing to fail. Check the wallet compatability list!

Read the relevant guide depending on if you are making or taking an order to sell bitcoin:
* **Maker**: Select "Make Order" and modify the order conditions to your liking. The order can be customized to require an "Escrow Deposit Time-Out" (expiry timer) other than the default of three hours, ranging anywhere from one to eight hours. When your live order gets taken and the taker submits their payout invoice, use the shown QR code found in the "Contract Box" with your Lightning wallet to lock the indicated amount of sats as collateral (escrow). You can now chat with your robot peer to coordinate the fiat payment. *Note: Escrow funds are released to the buyer once you select "Confirm Fiat Received" which settles the order. Only confirm after the fiat has arrived in your account.*
* **Taker**: Browse the order book and find an order to your liking. Simply select the "Take Order" option and lock your fidelity bond. Only after the buyer submits their payout invoice will you be required to submit the trade escrow. Use the shown QR code found in the "Contract Box" with your Lightning wallet to lock the indicated amount of sats as collateral (escrow). You can now chat with your robot peer to coordinate the fiat payment. *Note: Escrow funds are released to the buyer once you select "Confirm Fiat Received" which settles the order. Only confirm after the fiat has arrived in your account.*

The escrow is not required by the seller until the buyer has locked their payout invoice. As soon as the buyer submits the invoice, the seller then has three hours (by default) to lock the escrow. If the timer runs out, then the order expires and the seller forfeits their bond.

By default, the expiry timer for the escrow is three hours; however, you can customize the order to have an "Escrow Deposit Time-Out" ranging from one hour to eight hours. In other words, modify the time allowed for the seller to submit the escrow funds. Maybe you want a quicker transaction and will set the timer to a maximum of one hour instead of three hours.

Once the fiat payment method is coordinated with your fellow robot, the seller selects "Confirm Fiat Received" to end the trade which releases the escrow funds to the buyer. Only confirm the fiat is received *after* it appears in your possession.

## **Losing Your Trade Escrow**

There are basically three conditions that causes a user to lose their locked trade escrow:
* Cheat or deceive your peer (and lose the order dispute)
* Unilaterally cancel the order without your peer’s collaboration (after they sent the fiat payment)
* Fail to confirm the fiat was received within the given time

The conditions above are expanded upon in additional detail below.

Trying to cheat by intentionally not confirming you received the fiat results in a dispute being automatically opened. You will risk losing that dispute and consequently lose your escrow funds and bond. Refer to [Understand > Bonds](https://learn.robosats.com/docs/bonds/) for additional information on fidelity bonds.

After the trade escrow is locked, the order cannot be cancelled except if both the maker and taker agree to cancel collaboratively. If your peer has confirmed the fiat was sent and you unilaterally cancel the order, then you will risk losing the escrow funds and bond.

Don't forget about your order! If your peer sent the fiat and the order timer expires before you confirm the fiat was received, then you will risk losing your escrow funds and bond. Take care to remember your order and back up your robot’s unique token!

Due to the time limits involved in the order process, it is recommended to use instant fiat payment methods to avoid exceeding the expiry timer. Refer to [Best Practices > Payment Methods](https://learn.robosats.com/docs/payment-methods/) for additional information.

Although a very small window of time (about one second), the trade escrow could be permanently lost if RoboSats were shutdown or suddenly disappeared between the seller confirming fiat was received and the moment the buyer's Lightning wallet registers the released escrow funds. Use a well-connected Lightning wallet with sufficient inbound liquidity to help avoid routing failures and subsequently minimize any such window of opportunity.

## **Additional Information**

Your Lighting wallet may take a while for funds to show as unlocked on your account balance. Some wallets have difficulty with recognizing the Lightning hold invoice as a temporary hold on your funds.

If the issue persists, please reach out to the RoboSats Telegram group; but beware of scammers that may directly contact you and impersonate RoboSats staff! RoboSats staff will never directly contact you first. See [Contribute > Code > Communication Channels](https://learn.robosats.com/contribute/code/#communication-channels) for available Telegram groups.
