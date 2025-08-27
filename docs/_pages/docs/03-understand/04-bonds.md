---
layout: single
title: Maker and Taker Bonds
permalink: /docs/bonds/
toc: true
toc_sticky: true
sidebar:
  title: '<img id="side-icon-verybig" src="/assets/vector/ticket-simple.svg"/>Bonds'
  nav: docs
src: "_pages/docs/03-understand/04-bonds.md"
---

The fidelity bond is a small deposit that the user "locks" which will become unlocked after the trade is completed; however, users can lose their bond if they fail to follow the obligations of the contract.

The RoboSats trade pipeline utilizes fidelity bonds to incentivize both the order maker and taker to play by the rules and not cheat their fellow robot. More specifically, the bonds are [hold invoices](https://github.com/lightningnetwork/lnd/pull/2022) using the Lightning Network; it's the tech that makes RoboSats possible! Refer to [Understand > Trade Escrow > What is a Hold Invoice?](/docs/escrow/#what-is-a-hold-invoice) for understanding how hold invoices work in practice.

By default, the bond is {{site.robosats.default_bond_size}}% of the total trade amount. Alternatively, order makers can customize this amount to be anywhere from {{site.robosats.min_bond_size}}% to {{site.robosats.max_bond_size}}%. Larger bonds mean more "skin in the game" that is required to trade.

The bond does not leave your Lightning wallet, but please know some wallets play nicer with RoboSats than others due to the nature of the Lightning hold invoice mechanic. Refer to [Understand > Wallets](/docs/wallets/) for additional information.

*Note: The option allowing "Bondless Takers" is not available.*

## **How to Lock a Bond**

First, refer to [Understand > Wallets](/docs/wallets/) for compatible Lightning wallets that will help make using RoboSats a smoother experience. Depending on the wallet, the invoice might show as a payment that is in transit, frozen, or even appearing to fail. Check the wallet compatability list!

Bonds are not linked to orders. You can use any Sats to fund the bond invoice. There is no link between the bond and your order, nor any link between the bond and your payout invoice.

Read the relevant guide depending on if you are making or taking the order:
* **Maker**: Select "Make Order" and modify the order conditions to your liking. The order can be customized to require a fidelity bond other than the default {{site.robosats.default_bond_size}}% of the total trade amount, ranging anywhere from {{site.robosats.min_bond_size}}% to {{site.robosats.max_bond_size}}%. Once complete, confirm with "Create Order" and then use the QR code presented to you with your Lightning wallet to lock the indicated amount of Sats for your fidelity bond. You can always cancel the untaken order while it is live and the bond will automatically unlock; however, if you try to cancel the order after it gets taken, you will forfeit your bond. *Note: Be prepared with your wallet beforehand because the order box expires in ten minutes.*
* **Taker**: Browse the order book and find an order to your liking. Simply select the "Take Order" option and then use the QR code presented to you with your Lightning wallet to lock the indicated amount of sats for your fidelity bond. *Note: Be prepared with your wallet beforehand because the order box expires in four minutes. If you do not proceed, the taken order is made public again.*

After the trade is completed and both robots held up to their end of the deal, the maker and taker bonds are unlocked. Technically, the locked bond never left your wallet; but take heed, if you fail to follow the contract obligations by trying to cheat or cancelling unilaterally, you will forfeit your fidelity bond.

Your wallet may take a while for funds to show as unlocked on your account balance. Some wallets have difficulty with recognizing the Lightning hold invoice as a temporary hold on your funds.

If the issue persists, please reach out to the RoboSats SimpleX group; but beware of scammers that may directly contact you and impersonate RoboSats staff! RoboSats staff will never directly contact you first. See [Contribute > Code > Communication Channels](/contribute/code/#communication-channels) for the public SimpleX support group.

## **Losing Your Bond**

There are basically four conditions that causes a user to lose their bond:
* Cheat or deceive your peer (and lose the order dispute)
* Unilaterally cancel the order without your peer's collaboration during the peer-to-peer chat stage
* Fail to submit the escrow invoice (seller) or payment invoice (buyer) within the given time limit
* Fail to confirm the fiat was received as the bitcoin seller

Note that you do not lose your bond as an order maker if you cancel your order *before* it has been taken by a peer. The conditions above are expanded upon in additional detail below.

If the time limit for submitting the invoice (buyer) or locking the escrow (seller) runs out, then the order will expire and the robot who did not hold up to their end of the deal will lose the bond. Half of the lost bond goes to the honest robot as compensation for wasted time. Winning your counterparty’s bond as a reward only happens in exceptional cases and mostly depends on your coordinator’s judgment for your specific case. The only situations in which half of the counterparty’s bond is awarded as a reward are when the deposit is not completed (step 2 for sellers), no Lightning invoice is provided to receive the funds (step 2 for buyers), or the counterparty writes absolutely nothing after the chat is opened. As a rule, on RoboSats you will not be able to win your counterparty’s bond, and any exception is at the coordinator’s discretion. In cases of clear negligence or an active attempt at fraud, each coordinator will investigate the specific case and may decide what percentage of the bond to award to the counterparty.

Therefore, don't forget about your order because once a robot takes it and locks their fidelity bond, you could lose your bond since the timer might expire. Take care to remember your order and back up your robot's unique token! Keep in mind this token is only known by you and, without it, your unique robot avatar is not recoverable.

If you received fiat but neglect to click "Confirm Fiat Received" on your end, then you risk losing your bond since a dispute is automatically opened and the RoboSats staff will find you failed to follow the rules of the contract.

Due to the time limits involved in the order process, it is recommended to use instant fiat payment methods which help reduce the chances of losing your bond. Refer to [Best Practices > Payment Methods](/docs/payment-methods/) for additional information.

Opening a dispute just to cancel an order is not recommended because one of the two traders will lose their fidelity bond, barring exceptional cases that are up to the discretion of the RoboSats staff.

For orders that allow takers to choose from a range, peers only risk losing an amount of Sats proportional to the amount of Sats taken in the order.

As a sidenote, if RoboSats suddenly vanished or was shutdown, then bonds are automatically unlocked since they technically never left your wallet.

## **Don't Have Any Bitcoin for Bonds?**

Because the bonds require a Lightning hold invoice, what are you to do if you have no bitcoin to begin with? Even though the bond is typically just {{site.robosats.default_bond_size}}% of your total trade amount, this presents a real barrier to using RoboSats for the first time if your Sat stack is non-existent.

Currently, bondless takers are not available but are in consideration for a future update. Bondless takers present a greater risk to the order maker since the taker has no skin in the game. It would be reasonable to expect higher premiums on orders that allow bondless takers.

There are a myriad of available apps and services where very small amounts of bitcoin can be earned. RoboSats does not endorse a specific app, but users have reported success with apps like [Stacker News](https://stacker.news/), [Fountain](https://www.fountain.fm/), [Bitcoin Magazine App](https://app.bitcoinmagazine.com/), [THNDR](https://www.thndr.games/), etc.

Since the bond is just a temporary hold on funds, you could have a friend cover the fidelity bond by paying the QR code for you. The bond is instantly unlocked following a successful trade!

{% include improve %}
