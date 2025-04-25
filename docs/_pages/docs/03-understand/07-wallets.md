---
layout: single
title: Wallets Compatibility with RoboSats
permalink: /docs/wallets/
toc: true
toc_sticky: true
sidebar:
  title: '<img id="side-icon-verybig" src="/assets/vector/wallet.svg"/>Wallets'
  nav: docs
src: "_pages/docs/03-understand/07-wallets.md"

# Icons
good: "<i style='color:#1976d2' class='fa-solid fa-square-check fa-2xl'></i>"
soso: "<i style='color:#9c27b0' class='fa fa-triangle-exclamation fa-2xl'></i>"
bad: "<i style='color:#ef5350' class='fa-solid fa-xmark fa-3x'></i>"
phone: "<i class='fa-solid fa-mobile-screen fa-xl'></i>"
laptop: "<i class='fa-solid fa-laptop fa-xl'></i>"
cli: "<i class='fa-solid fa-terminal fa-xl'></i>"
laptop_phone: "<i class='fa-solid fa-laptop-mobile fa-xl'></i>"
remote: "<i class='fa-solid fa-house fa-xl'></i>"
thumbsup: "<i style='color:#1976d2' class='fa-solid fa-thumbs-up fa-2xl'></i>"
thumbsdown: "<i style='color:#9c27b0' class='fa-solid fa-thumbs-down fa-2xl'></i>"
unclear: "<i style='color:#ff9800' class='fa-solid fa-question fa-2xl'></i>"
bitcoin: "<i class='fa-solid fa-bitcoin-sign'></i>"
---
This is a non-exhaustive compilation based on past experience of users. We have not tested every wallet, if you test a wallet that is not yet covered, please [report here](https://github.com/RoboSats/robosats/issues/44).

| Wallet | Version | Device | UX<sup>1</sup> | Bonds<sup>2</sup> | Payout<sup>3</sup> | Comp<sup>4</sup> | Total<sup>5</sup> |
|:---|:---|:--:|:--:|:--:|:--:|:--:|:--:|
|[Alby](#alby-browser-extension)|[v1.14.2](https://github.com/getAlby/lightning-browser-extension)|{{page.laptop}}|{{page.good}}|{{page.good}}|{{page.good}}|{{page.good}} |{{page.thumbsup}}|
|[Aqua](#aqua-mobile)|[v0.1.55](https://aquawallet.io/)|{{page.phone}}|{{page.good}}|{{page.good}}|{{page.good}}|{{page.good}} |{{page.thumbsup}}|
|[Blink](#blink-mobile-former-bitcoin-beach-wallet)|[2.2.73](https://www.blink.sv/)|{{page.phone}}|{{page.good}}|{{page.good}}|{{page.good}}|{{page.good}} |{{page.thumbsup}}|
|[Blixt](#blixt-androidios-lnd-light-backend-on-device)|[v0.4.1](https://github.com/hsjoberg/blixt-wallet)|{{page.phone}}|{{page.soso}}|{{page.good}}|{{page.good}}|{{page.good}}|{{page.thumbsup}}|
|[Blue](#bluewallet-mobile)|[1.4.4](https://bluewallet.io/)|{{page.phone}}|{{page.good}}|{{page.unclear}}|{{page.unclear}}|{{page.good}}|{{page.unclear}}|
|[Boltz.exchange](#boltzexchange-swap-service)|[1.6.2](https://Boltz.exchange)|{{page.laptop}}{{page.phone}}|{{page.unclear}}|{{page.unclear}}|{{page.good}}|{{page.unclear}}|{{page.unclear}}|
|[Breez](#breez-mobile)|[0.16](https://breez.technology/mobile/)|{{page.phone}}|{{page.good}}|{{page.good}}|{{page.good}}|{{page.good}}|{{page.thumbsup}}|
|[Cash App](#cash-app-mobile)|[4.7](https://cash.app/)|{{page.phone}}|{{page.good}}|{{page.good}}|{{page.good}}|{{page.good}} |{{page.thumbsup}}|
|[Core Lightning](#core-lightning--cln-cli-interface)|[v0.11.1](https://github.com/ElementsProject/lightning)|{{page.cli}}|{{page.good}}|{{page.good}}|{{page.good}}|{{page.good}}|{{page.thumbsup}}|
|[Electrum](#electrum-mobile--desktop)|[4.5.8](https://github.com/spesmilo/electrum)|{{page.laptop}}{{page.phone}}|{{page.good}}|{{page.good}}|{{page.good}}|{{page.good}}|{{page.unclear}}||
|[LND](#lnd-cli-interface)|[v0.14.2](https://github.com/LightningNetwork/lnd)|{{page.cli}}|{{page.good}}|{{page.good}}|{{page.good}}|{{page.good}}|{{page.thumbsup}}|
|[Mash](https://app.mash.com/wallet)|[Beta](https://mash.com/consumer-experience/)|{{page.laptop}}{{page.phone}}|{{page.good}}|{{page.good}}|{{page.good}}|{{page.good}} | {{page.thumbsup}}|
|[Mutiny](#mutiny-mobile--web-browser-wallet)|[1.7.1](https://www.mutinywallet.com/)|{{page.laptop}}{{page.phone}}|{{page.good}}|{{page.good}}|{{page.good}}|{{page.good}}|{{page.thumbsdown}}||
|[Muun](#muun-mobile)|[2.8.0](https://muun.com/)|{{page.phone}}|{{page.good}}|{{page.good}}|{{page.soso}}|{{page.soso}}|{{page.thumbsdown}}|
|[Phoenix](#phoenix-mobile)|[35-1.4.20](https://phoenix.acinq.co/)|{{page.phone}}|{{page.good}}|{{page.bad}}|{{page.soso}}|{{page.soso}}|{{page.thumbsdown}}|
|[SBW](https://github.com/RoboSats/robosats/issues/44#issue-1135544303)|[2.4.27](https://github.com/btcontract/wallet/)|{{page.phone}}|{{page.good}}|{{page.good}}|{{page.good}}|{{page.good}}|{{page.thumbsup}}|
|[WoS](https://github.com/RoboSats/robosats/issues/44#issue-1135544303)|[1.15.0](https://www.walletofsatoshi.com/)|{{page.phone}}|{{page.good}}|{{page.good}}|{{page.good}}|{{page.good}}|{{page.thumbsup}}|
|[Zeus](#zeus-mobile-lnd-cln-eclair-remote-backend)|[v0.6.0-rc3](https://github.com/ZeusLN/zeus)|{{page.phone}}{{page.remote}}|{{page.soso}}|{{page.good}}|{{page.good}}|{{page.good}}|{{page.thumbsup}}|

1. **UX:** Does the wallet convey clearly that there is an "ongoing" payment (hodl invoice)?
2. **Bonds:** Can the wallet lock the invoices with long expiry time needed for the bonds?
3. **Payout:** Can the wallet receive payouts from RoboSats after the user buys Sats?
4. **Compatible:** Is the wallet overall compatible end-to-end with RoboSats?
5. **Total:** Is the wallet compatible and stable enough to be used consistently without issues?

### Alby (browser extension)
Alby is a browser extension compatible with WebLN standard. Given that RoboSats supports WebLN, the experience with Alby is probably best-in-class: you won't have to scan the QR codes or copy/paste generated invoices. Simply click on the Alby pop up to confirm the actions. You can connect the Alby extension to most of the popular nodes and wallets or simply let Alby host a custodial wallet for you.
Default custodian wallet setup is not suitable for extensive trading as the transactions above a certain total summary will be rejected.

Instructions to install Alby in Tor Browser:
1. Install the Alby extension from the [Firefox add-ons store](https://addons.mozilla.org/en-US/firefox/addon/alby/)
2. Click on the Alby extension and follow the prompts to setup your wallet.

### Aqua (Mobile)
Overall the wallet works as expected.
Self-custodial Lightning+Liquid wallet with low fees and the option to swap directly to Tether.
Bond refunds are locked for 3 days

### Blink (Mobile, former Bitcoin Beach Wallet)
Works well with RoboSats. Hodl invoices (Bonds) show as "Pending" in the transaction history. Payouts to the Blink wallet function as intended. Custodial wallet by Galoy which originated from the Bitcoin Beach project in El Salvador (formerly known as "Bitcoin Beach Wallet").

### Blixt (Android/iOS, LND light backend on device)
Most development testing for RoboSats has been done using Blixt. This is one of the most complete Lightning wallets around. However, it does lead to misunderstanding when hold invoices are locked, as it shows a spinner with payment in transit. The user needs to check on the website for confirmation. Blixt allows for multiple pending HTLCs; this is necessary as a seller since you need to lock a taker/maker bond and then a trade escrow (2 pending concurrent HTLCs). It might eventually also display as paid/charged invoices that are still pending, especially if the user force closes Blixt and reopens it. Occasionally, it can display fidelity bonds as charged that have in fact been returned.

### Bluewallet (Mobile)
It works well. Bluewallet has discontinued their custodial service. Previously, the custodial service would cause issues where escrows that RoboSats returns are charged to users and where slashed bonds are charged twice by Bluewallet! This was a known bug for long time in Bluewallet, so they shut down their LN custodial service (which ended up making RoboSats a smoother experience for users).

### Boltz.exchange (Swap service)
Boltx.exchange is a non-custodial Bitcoin bridge, built to swap between different Bitcoin layers. It works very well for receiving sats. Other wallets are better for doing the bond. Boltz.exchange is useful if you're having problems receiving larger amounts of sats in lightning. To use it, you give it a bitcoin receive address, and an amount of sats. It will then create a lightning invoice for you. You paste the lighting invoice into Robosats. The fee is .5%, in addition to the transaction fee.

### Breez (Mobile)
It works well with RoboSats. Breez is a non-custodial wallet. So keep in mind channels managment and stuff like that. It's a versatile and easy-to-use interface.

### Cash App (Mobile)
Works well with RoboSats. Hodl invoices (Bonds) show as "Pending" in the transaction history. Payouts to the Cash App wallet function as intended. Custodial wallet by Block, Inc., formerly known as Square, Inc., which is led by Jack Dorsey.

### Core Lightning / CLN (CLI Interface)
Works as expected. The `lightning-cli pay <invoice>` command does not conclude while the payment is pending, but can use `lightning-cli paystatus <invoice>` to monitor the state.

### Electrum (Mobile & Desktop)
This wallet used to work fine with channels created to ACINQ. 
Recent versions can't create this channel successfully.

### LND (CLI Interface)
Raw; it shows exactly what is happening and what it knows "IN_FLIGHT". It is not user friendly and therefore not recommended to interact with RoboSats by beginners. However, everything works just fine. If you are using LNCLI regularly, then you will find no issue using it with RoboSats.


### Mash Wallet App (Mobile PWA & Desktop Web-Wallet)
Overall the [Mash](https://mash.com/consumer-experience/) wallet works end2end with Robosats on both selling & buying over lightning. Majority of relevant invoice details in the mash wallet are shown and clear to users throughout the process. When the transactions are complete, they open in the mobile app on both sender/receiver sides to highlight that the transactions are completed.The one UX hick-up is that the pending invoices list doesn't explicitly show HOLD invoices and there is a "spinning" screen on first HOLD invoice payment. The team has a bug open to fix this issue shortly (this note is from Aug 21st 2023).

### Mutiny (Mobile & Web Browser Wallet)
The wallet should work as expected, but the interface, transaction states, and the structure of the funds can sometimes be very confusing in the current release version.   
Use the default free Fedimint(Chaumian eCash) account, with the possibility to use zero fee Lightning transfers. 
What is inconvenient: 
- occasionally wallet restart is needed
- more than two pending hold invoices at the same time may cause a rejection of the new transaction    

### Muun (Mobile)
Self-custodial wallet with a minimalist interface. 
Similar to Blixt or LND, Muun plays nicely with hold invoices. You can be a seller in RoboSats using Muun and the user experience will be great. However, in order to be a buyer when using Muun, you need to submit an on-chain address for the payout as a Lightning invoice won't work. Muun is _fee siphoning attacking_ any sender to Muun wallet. There is a mandatory hop through a private channel with a fee of +1500ppm. RoboSats will strictly not route a buyer payout for a net loss. Given that RoboSats trading fees are {{site.robosats.total_fee}}% and it needs to cover the routing fees, **RoboSats will never find a suitable route to a Muun wallet user**. At the moment, RoboSats will scan your invoice for routing hints that can potentially encode a _fee siphoning attack_. If this trick is found, then the invoice will be rejected: submit an on-chain address instead for an on-the-fly swap. Refer to [Understand > On-Chain Payouts](/docs/on-chain-payouts/) for more information about on-the-fly swaps. Important to note that Muun has issues during times of high on chain fee spikes. Regardless, the workaround to receive to Muun is: either submit an on chain address or choose a higher routing budget after enabling the "Advanced Options" switch.

### OBW (Mobile)
One of the simplest and one of the best. The hodl invoice shows as "on fly", it is not custodial and can create your own channels. Buy one from a liquidity provider or use Hosted Channels. It is maintained by the great Fiatjaf and it is a fork of the abandoned SBW.
*Update 26-10-23: At this moment it has no development or support

### Phoenix (Mobile)
This wallet does not support invoice lock.

### SBW (Mobile)
From 2.5 it doesn't support lightning anymore.

### Zeus (Mobile, LND, CLN, Eclair remote backend)
It is an interface to LND, CLN and Eclair. It works as expected. It is extremely misleading with a full red screen "TIME OUT" a few seconds after sending the HTLC. Yet, if the user checks on the website, then the invoice is correctly locked.

## <i class="fa-solid fa-code-pull-request"></i> Help keep this page updated
There are many wallets and all of them keep improving at lightning speed. You can contribute to the RoboSats Open Source Project by testing wallets, editing [the content of this page](https://github.com/RoboSats/robosats/tree/main/docs/{{page.src}}) and opening a [Pull Request](https://github.com/RoboSats/robosats/pulls)

## Additional Information

Receiving Sats over Lightning is not completely private. Refer to [Best Practices > Proxy Wallets](/docs/proxy-wallets/) for more information on receiving Sats privately.

If you are experiencing issues receiving funds to your wallet (due to channel management issues, routing issues, wallet-side issues, etc.), then a quick solution for the sake of receiving a fast payout would be to have a second wallet on hand that is well-connected and with sufficient channel capacity. You could receive Sats to your second wallet and, once issues are resolved, then send to your primary wallet.

Do not hesitate to reach out to the public RoboSats [SimpleX](/contribute/code/#communication-channels) group chat for advice or help in using wallets!

{% include improve %}
