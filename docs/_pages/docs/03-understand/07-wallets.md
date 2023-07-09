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
|[Blixt](#blixt-androidios-lnd-light-backend-on-device)|[v0.4.1](https://github.com/hsjoberg/blixt-wallet)|{{page.phone}}|{{page.soso}}|{{page.good}}|{{page.good}}|{{page.good}}|{{page.thumbsup}}|
|[Electrum](#electrum-desktop)|[4.1.4](https://github.com/spesmilo/electrum)|{{page.laptop}}|{{page.good}}|{{page.good}}|{{page.good}}|{{page.good}}|{{page.thumbsup}}||
|[LND](#lnd-cli-interface)|[v0.14.2](https://github.com/LightningNetwork/lnd)|{{page.cli}}|{{page.good}}|{{page.good}}|{{page.good}}|{{page.good}}|{{page.thumbsup}}|
|[Core Lightning](#core-lightning--cln-cli-interface)|[v0.11.1](https://github.com/ElementsProject/lightning)|{{page.cli}}|{{page.good}}|{{page.good}}|{{page.good}}|{{page.good}}|{{page.thumbsup}}|
|[Zeus](#zeus-mobile-lnd-cln-eclair-remote-backend)|[v0.6.0-rc3](https://github.com/ZeusLN/zeus)|{{page.phone}}{{page.remote}}|{{page.soso}}|{{page.good}}|{{page.good}}|{{page.good}}|{{page.thumbsup}}|
|[SBW](https://github.com/RoboSats/robosats/issues/44#issue-1135544303)|[2.4.27](https://github.com/btcontract/wallet/)|{{page.phone}}|{{page.good}}|{{page.good}}|{{page.good}}|{{page.good}}|{{page.thumbsup}}|
|[Muun](#muun-mobile)|[47.3](https://muun.com/)|{{page.phone}}|{{page.good}}|{{page.good}}|{{page.bad}}|{{page.bad}}|{{page.thumbsdown}}|
|[lntxbot](https://github.com/RoboSats/robosats/issues/44#issuecomment-1054607956)|[NA](https://t.me/lntxbot)|{{page.laptop}}{{page.phone}}|{{page.good}}|{{page.good}}|{{page.good}}|{{page.good}} | [{{page.thumbsup}}](https://github.com/RoboSats/robosats/issues/44#issuecomment-1054607956)|
|[Blue](#bluewallet-mobile)|[1.4.4](https://bluewallet.io/)|{{page.phone}}|{{page.good}}|{{page.unclear}}|{{page.unclear}}|{{page.good}}|{{page.unclear}}|
|[WoS](https://github.com/RoboSats/robosats/issues/44#issue-1135544303)|[1.15.0](https://www.walletofsatoshi.com/)|{{page.phone}}|{{page.good}}|{{page.good}}|{{page.good}}|{{page.good}}|{{page.thumbsup}}|
|[Phoenix](#phoenix-mobile)|[35-1.4.20](https://phoenix.acinq.co/)|{{page.phone}}|{{page.good}}|{{page.soso}}|{{page.good}}|{{page.good}}|{{page.unclear}}|
|[Blink](#blink-mobile-former-bitcoin-beach-wallet)|[2.2.73](https://www.blink.sv/)|{{page.phone}}|{{page.good}}|{{page.good}}|{{page.good}}|{{page.good}} |{{page.thumbsup}}|
|[Alby](#alby-browser-extension)|[v1.14.2](https://github.com/getAlby/lightning-browser-extension)|{{page.laptop}}|{{page.good}}|{{page.good}}|{{page.good}}|{{page.good}} |{{page.thumbsup}}|

1. **UX:** Does the wallet convey clearly that there is an "ongoing" payment (hodl invoice)?
2. **Bonds:** Can the wallet lock the invoices with long expiry time needed for the bonds?
3. **Payout:** Can the wallet receive payouts from RoboSats after the user buys Sats?
4. **Compatible:** Is the wallet overall compatible end-to-end with RoboSats?
5. **Total:** Is the wallet compatible and stable enough to be used consistently without issues?

### Alby (browser extension)
Alby is a browser extension compatible with WebLN standard. Given that RoboSats supports WebLN, the experience with Alby is probably best-in-class: you won't have to scan the QR codes or copy/paste generated invoices. Simply click on the Alby pop up to confirm the actions. You can connect the Alby extension to most of the popular nodes and wallets or simply let Alby host a custodial wallet for you.

Instructions to install Alby in Tor Browser:
1. Install the Alby extension from the [Firefox add-ons store](https://addons.mozilla.org/en-US/firefox/addon/alby/)
2. Click on the Alby extension and follow the prompts to setup your wallet.

### Blixt (Android/iOS, LND light backend on device)
Most development testing for RoboSats has been done using Blixt. This is one of the most complete Lightning wallets around. However, it does lead to misunderstanding when hold invoices are locked, as it shows a spinner with payment in transit. The user needs to check on the website for confirmation. Blixt allows for multiple pending HTLCs; this is necessary as a seller since you need to lock a taker/maker bond and then a trade escrow (2 pending concurrent HTLCs). It might eventually also display as paid/charged invoices that are still pending, especially if the user force closes Blixt and reopens it. Occasionally, it can display fidelity bonds as charged that have in fact been returned.

### Electrum (Desktop)
Experience using Electrum is limited. It does not seem to support more than one pending HTLC (even if there are multiple channels). This wallet is not recommended to use with RoboSats. However, it works well if you are a buyer, as only one hold invoice for the fidelity bond is needed. The payment shows as pending with a spinner for the duration of the locktime.

### LND (CLI Interface)
Raw; it shows exactly what is happening and what it knows "IN_FLIGHT". It is not user friendly and therefore not recommended to interact with RoboSats by beginners. However, everything works just fine. If you are using LNCLI regularly, then you will find no issue using it with RoboSats.

### Core Lightning / CLN (CLI Interface)
Works as expected. The `lightning-cli pay <invoice>` command does not conclude while the payment is pending, but can use `lightning-cli paystatus <invoice>` to monitor the state.

### Zeus (Mobile, LND, CLN, Eclair remote backend)
It is an interface to LND, CLN and Eclair. It works as expected. It is extremely misleading with a full red screen "TIME OUT" a few seconds after sending the HTLC. Yet, if the user checks on the website, then the invoice is correctly locked.

### Muun (Mobile)
Similar to Blixt or LND, Muun plays nicely with hold invoices. You can be a seller in RoboSats using Muun and the user experience will be great. However, in order to be a buyer when using Muun, you need to submit an on chain address for the payout as a Lightning invoice won't work. Muun is _fee siphoning attacking_ any sender to Muun wallet. There is a mandatory hop through a private channel with a fee of +1500ppm. RoboSats will strictly not route a buyer payout for a net loss. Given that RoboSats trading fees are {{site.robosats.total_fee}}% and it needs to cover the routing fees, **RoboSats will never find a suitable route to a Muun wallet user**. At the moment, RoboSats will scan your invoice for routing hints that can potentially encode a _fee siphoning attack_. If this trick is found, then the invoice will be rejected: submit an on chain address instead for an on-the-fly swap. Refer to [Understand > On-Chain Payouts](/docs/on-chain-payouts/) for more information about on-the-fly swaps.

### Phoenix (Mobile)
Phoenix works very well as an order taker. Phoenix will also work well as an order maker as long as the order settings `public duration` + `deposit duration` are lower than 10 hours. Otherwise, you might have problems locking the maker bond. If the total duraton of bonds/escrow invoices exceeds 450 blocks, then Phoenix will not allow users to lock the bond (`Cannot add htlc (...) reason=expiry too big`).

### Bluewallet (Mobile)
It works well. But they are having issues in the custodial mode. Escrows that RoboSats returns are charged to users (so Bluewallet is keeping that balance?). Bonds that are slashed... are charged twice by Blue! More info once they reply to us. EDIT: Blue has confirmed they are working to soon solve these accounting bugs!

### Blink (Mobile, former Bitcoin Beach Wallet)
Works well with RoboSats. Hodl invoices (Bonds) show as "Pending" in the transaction history. Payouts to the Blink wallet function as intended. Custodial wallet by Galoy which originated from the Bitcoin Beach project in El Salvador (formerly known as "Bitcoin Beach Wallet").

### OBW (Mobile)
One of the simplest and one of the best. The hodl invoice shows as "on fly", it is not custodial and can create your own channels. Buy one from a liquidity provider or use Hosted Channels. It is maintained by the great Fiatjaf and it is a fork of the abandoned SBW.

## <i class="fa-solid fa-code-pull-request"></i> Help keep this page updated
There are many wallets and all of them keep improving at lightning speed. You can contribute to the RoboSats Open Source Project by testing wallets, editing [the content of this page](https://github.com/RoboSats/robosats/tree/main/docs/{{page.src}}) and opening a [Pull Request](https://github.com/RoboSats/robosats/pulls)

## Additional Information

Receiving Sats over Lightning is not completely private. Refer to [Best Practices > Proxy Wallets](/docs/proxy-wallets/) for more information on receiving Sats privately.

If you are experiencing issues receiving funds to your wallet (due to channel management issues, routing issues, wallet-side issues, etc.), then a quick solution for the sake of receiving a fast payout would be to have a second wallet on hand that is well-connected and with sufficient channel capacity. You could receive Sats to your second wallet and, once issues are resolved, then send to your primary wallet.

Do not hesitate to reach out to the public RoboSats [SimpleX](/contribute/code/#communication-channels) group chat for advice or help in using wallets!

{% include improve %}
