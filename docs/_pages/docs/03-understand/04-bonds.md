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

The RoboSats trade pipeline utilizes fidelity bonds to incentivize both the order maker and taker to play by the rules and not cheat their fellow robot. More specifically, the bonds are [hold invoices](https://github.com/lightningnetwork/lnd/pull/2022) using the Lightning Network; it's the tech that makes RoboSats possible!

By default, the bond is 3% of the total trade amount. Alternatively, order makers can customize this amount to be anywhere from 2% to 15%. Larger bonds mean more "skin in the game" that is required to trade.

The bond does not leave your Lightning wallet, but please know some wallets play nicer with RoboSats than others due to the nature of the Lightning hold invoice mechanic. Refer to [Understand > Wallets](https://learn.robosats.com/docs/wallets/) for additional information.

*Note: The option allowing "Bondless Takers" is in the works but not available at the moment.*

## **How to Lock a Bond**

First, refer to [Understand > Wallets](https://learn.robosats.com/docs/wallets/) for compatible Lightning wallets that will help make using RoboSats a smoother experience. Depending on the wallet, the invoice might show as a payment that is in transit, frozen, or even appearing to fail. Check the wallet compatability list!

Read the relevant guide depending on if you are making or taking the order:
* **Maker**: Select "Make Order" and modify the order conditions to your liking. The order can be customized to require a fidelity bond other than the default 3% of the total trade amount, ranging anywhere from 2% to 15%. Once complete, confirm with "Create Order" and then use the following QR code found in the "Contract Box" with your Lightning wallet to lock the indicated amount of sats for your fidelity bond. You can always cancel the untaken order while it is live and the bond will automatically unlock; however, if you try to cancel the order after it gets taken, you will forfeit your bond. *Note: Be prepared with your wallet beforehand because the order box expires in ten minutes.*
* **Taker**: Browse the order book and find an order to your liking. Simply select the "Take Order" option and then use the following QR code found in the "Contract Box" with your Lightning wallet to lock the indicated amount of sats for your fidelity bond. *Note: Be prepared with your wallet beforehand because the order box expires in four minutes. If you do not proceed, the taken order is made public again.*

After the trade is completed and both robots are satisfied, the maker and taker bonds are unlocked. Technically, the locked bond never left your wallet; but take caution, if you fail to follow the contract obligations by trying to cheat or cancelling unilaterally, you will forfeit your fidelity bond.

Your wallet may take a while for funds to show as unlocked on your account balance. Some wallets have difficulty with recognizing the Lightning hold invoice as a temporary hold on your funds.

If the issue persists, please reach out to the RoboSats Telegram group; but beware of scammers that may directly contact you and impersonate RoboSats staff! RoboSats staff will never directly contact you first. See [Contribute > Code > Communication Channels](https://learn.robosats.com/contribute/code/#communication-channels) for available Telegram groups. 

## **Losing Your Bond**

There are basically five conditions that causes a user to lose their bond:
* Cheat or deceive your peer (and lose the order dispute)
* Unilaterally cancel the order without your peer's collaboration
* Fail to submit the payment invoice as the bitcoin buyer within the given time limit
* Fail to submit the trade escrow as the bitcoin seller within the given time limit
* Fail to confirm the fiat was received as the bitcoin seller

The conditions above are expanded upon in additional detail below.

If the time limit for submitting the invoice (buyer) or locking the escrow (seller) runs out, then the order will expire and the robot who did not hold up to their end of the deal will lose the bond. Half of the lost bond goes to the honest robot as compensation for wasted time.

Therefore, don't forget about your order because once a robot takes it and locks their fidelity bond, you could lose your bond since the timer might expire. Take care to remember your order and back up your robot's unique token!

If you received fiat but neglect to click "Confirm Fiat Received" on your end, then you risk losing your bond since a dispute is automatically opened and the RoboSats staff will find you failed to follow the rules of the contract.

Due to the time limits involved in the order process, it is recommended to use instant fiat payment methods which help reduce the chances of losing your bond. Refer to [Best Practices > Payment Methods](https://learn.robosats.com/docs/payment-methods/) for additional information.

Opening a dispute just to cancel an order is not recommended because one of the two traders will lose their fidelity bond, barring exceptional cases that are up to the discretion of the RoboSats staff. 

As a sidenote, if RoboSats suddenly vanished or was shutdown, then bonds are automatically unlocked since they technically never left your wallet.

## **Don't Have Any Bitcoin for Bonds?**

Because the bonds require a Lightning hold invoice, what are you to do if you have no bitcoin to begin with? Even though the bond is typically just 3% of your total trade amount, this presents a real barrier to using RoboSats for the first time if your sat stack is non-existent.

Currently, bondless takers are not available; however, please know this is in the works! Bondless takers present a greater risk to the order maker since the taker has no skin in the game. It can be reasonable to expect higher premiums on orders that allow bondless takers.

There are a myriad of available apps and services where very small amounts of bitcoin can be earned. RoboSats does not endorse a specific app, but users have reported success with apps like [Stacker News](https://stacker.news/), [Fountain](https://www.fountain.fm/), [Carrot](https://www.earncarrot.com/), [THNDR](https://www.thndr.games/), etc.

Since the bond is a temporary hold on your funds, you could even borrow satoshis from a friend just for the fidelity bond. After the bond is unlocked from a successful trade, simply return the funds to your friend!
