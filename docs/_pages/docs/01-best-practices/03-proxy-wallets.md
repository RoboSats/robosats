---
layout: single
title: "Proxy Wallets"
permalink: /docs/proxy-wallets/
sidebar:
  title: '<img id="side-icon-verybig" src="/assets/vector/route.svg"/>Proxy Wallets'
  nav: docs
src: "_pages/docs/01-best-practices/03-proxy-wallets.md"
---

Receiving on the lightning network can reveal personal information
so it's important to keep a few things in mind.

If your node has public channels,
any invoices you make will reveal the UTXOs that were used to open those channels.
If those UTXOs come from a KYC exchange,
then anyone with access to the exchange's database
will be able to link your lightning invoices to you identity.
Even if you use coinjoined UTXOs to open your channels,
or you bootstrap your node exclusively by paying for inbound channels,
invoices are still potentially compromising
since they allow an attacker to correlate different
payments to know that they are going same entity (you).
Moreover, if you close those channels,
the resulting UTXOs will continue to be tied to those
transactions.
If your node only has unannounced channels
it will be harder to find your onchain UTXOs
but you will still have the problem of
payment correlation.

For small amounts, using a custodial proxy wallet is a reasonable way to
improve your privacy when receiving on the lightning network.
Receiving to a good custodial wallet will only reveal the custodian's UTXO's.
To learn information about you,
the payer of your invoices would have to collude with the wallet custodian.

A non-custodial alternative is to use an lnproxy server
to wrap invoices to your own node and receive to the wrapped invoices instead.
Simply generate an invoice to your node and paste it into an lnproxy web interface.
The lnproxy server will return a "wrapped" invoice to the lnproxy server's lightning node.
The wrapped invoice should have the same
description and payment hash as the one you pasted in,
and a slightly higher amount to account for routing.
You should verify this using an invoice decoder like https://lightningdecoder.com .
If the payment hashes match, you can be certain that the lnproxy node
will not be able to steal your funds.
Then, simply use the wrapped invoice anywhere you
would have used your original invoice.
To learn any information about you from a wrapped invoice,
an attacker would have to collude with the lnproxy server you used.

{% include wip %}
