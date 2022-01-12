# Buy and sell non-KYC Bitcoin using the lightning network.

## What is this?

{project_name} is a BTC/FIAT peer-to-peer exchange over lightning. It simplifies matchmaking and minimizes the trust needed to trade with a peer. 

## That’s cool, so how it works?

Alice wants to sell sats, posts a sell order. Bob wants to buy sats, and takes Alice's order. Alice posts the sats as collateral using a hodl LN invoice. Bob also posts some sats as a bond to prove he is real. {project_name} locks the sats until Bob confirms he sent the fiat to Alice. Once Alice confirms she received the fiat, she tells {project_name} to release her sats to Bob. Enjoy your sats Bob!

At no point, Alice and Bob have to trust the funds to each other. In case Alice and Bob have a conflict, {project_name} staff will resolve the dispute.

(TODO: Long explanation and tutorial step by step, link)

## Nice, and fiat payments method are...?

Basically all of them. It is up to you to select your preferred payment methods. You will need to search for a peer who also accepts that method. Lightning is fast, so we highly recommend using instant fiat payment rails. Be aware trades have a expiry time of 8 hours. Paypal or credit card are not advice due to chargeback risk.

## Trust

The buyer and the seller never have to trust each other. Some trust on {project_name} is needed. Linking the seller’s hodl invoice and buyer payment is not atomic (yet, research ongoing). In addition, disputes are solved by the {project_name} staff. 

Note: this is not an escrow service. While trust requirements are minimized, {project_name} could run away with your sats. It could be argued that it is not worth it, as it would instantly destroy {project_name} reputation. However, you should hesitate and only trade small quantities at a time. For larger amounts and safety assurance use an escrow service such as Bisq or Hodlhodl.

You can build more trust on {project_name} by inspecting the source code, link.

## If {project_name} suddenly disappears during a trade my sats…

Your sats will most likely return to you. Any hodl invoice that is not settled would be automatically returned even if {project_name} goes down forever. This is true for both, locked bonds and traded sats. However, in the window between the buyer confirms FIAT SENT and the sats have not been released yet by the seller, the fund could be lost.

## Limits

Max trade size is 500K Sats to minimize failures in lightning routing. The limit will be raised as LN grows.

## Privacy

User token is generated locally as the unique identifier (back it up on paper! If lost {project_name} cannot help recover it). {project_name} doesn’t know anything about you and doesn’t want to know.

Your trading peer is the only one who can potentially guess anything about you. Keep chat short and concise. Avoid providing non-essential information other than strictly necessary for the fiat payment.

The chat with your peer is end-to-end encrypted, {project_name} cannot read. It can only be decrypted with your user token. The chat encryption makes it hard to resolve disputes. Therefore, by opening a dispute you are sending a viewkey to {project_name} staff. The encrypted chat cannot be revisited as it is deleted automatically when the trade is finalized (check the source code).
 
For best anonymity use Tor Browser and access the .onion hidden service.

## So {project_name} is a decentralized exchange?
Not quite, though it shares some elements. 

A simple comparisson:
* Privacy worst to best: Coinbase/Binance/others < hodlhodl < {project_name} < Bisq
* Safety (not your keys, not your coins): Coinbase/Binance/others < {project_name} < hodlhodl < Bisq 
*(take with a pinch of salt)*

So, if bisq is best for both privacy and safety, why {project_name} exists? Bisq is great, but it is difficult, slow, high-fee and needs extra steps to move to lightning. {project_name} aims to be as easy as Binance/Coinbase greatly improving on privacy and requiring minimal trust.

## Any risk?

Sure, this is a beta bot, things could go wrong. Trade small amounts! 

The seller faces the same chargeback risk as with any other peer-to-peer exchange. Avoid accepting payment methods with easy chargeback!

## What are the fees?

{project_name} takes a 0.2% fee of the trade to cover lightning routing costs. This is akin to a Binance trade fee (but hey, you do not have to sell your soul to the devil, nor pay the withdrawal fine...).

The loser of a dispute pays a 1% fee that is slashed from the collateral posted when the trade starts. This fee is necessary to disincentive cheating and keep the site healthy. It also helps to cover the staff cost of dispute solving. 

Note: your selected fiat payment rails might have other fees, these are to be covered by the buyer.

## I am a pro and {project_name} is too simple, it lacks features…

Indeed, this site is a simple front-end that aims for user friendliness and forces best privacy for casual users. 

If you are a big maker, liquidity provider, or want to create many trades simultaneously use the API: {API_LINK_DOCUMENTATION}

## Is it legal to use {project_name} in my country?

In many countries using {project_name} is not different than buying something from a peer on Ebay or Craiglist. Your regulation may vary, you need to figure out.

## Disclaimer

This tool is provided as is. It is in active development and can be buggy. Be aware that you could lose your funds: trade with the utmost caution. There is no private support. Support is only offered via public channels (link telegram groups). {project_name} will never contact you. And {project_name} will definitely never ask for your user token.