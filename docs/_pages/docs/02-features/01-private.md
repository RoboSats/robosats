---
layout: single
title: Private by Default
permalink: /docs/private/
toc: true
toc_sticky: true
sidebar:
  title: '<img id="side-icon-verybig" src="/assets/vector/user-ninja.svg"/>Private'
  nav: docs
src: "_pages/docs/02-features/01-private.md"
---

<!-- TODO: explain TOR, high entropy avatar, no registration, no identity reuse, lightning onion routing, no logs policy, etc. -->
RoboSats is absolutely private by default. The main four ingredients are:

1. **No registration at all.** With a single click you will generate a robot avatar: that's all you need. Since no email, phone, username or any sort of input from the user is needed, there is no possible way for the user to make a mistake and doxx himself. Your Robot avatars cannot be linked to you.
2. **Auditable PGP encrypted communication** Every robot has a pair of PGP keys to encrypt your communicaiton end-to-end. RoboSats makes it very easy for you to export your keys and verify for yourself that your communication is private with any other third party app implementing the OpenPGP standard.
3. **Tor Network Only.** Your location or IP is never known by the node or your trading peers.
4. **One identity -> one trade.** You can (and you are advised to) trade with a different identity every single time, it is convenient and easy. No other exchange has this feature and it is critical for privacy! In RoboSats there is no way for observers to know that several trades have been made by the same user if he used different robot avatars.

The combination of these features makes RoboSats absolutely private, period.

## Robot Avatar Generation Pipeline
<div align="center">
    <img src="/assets/images/private/usergen-pipeline.png" width="650"/>
</div>

Only your trading peer can get to know things about you while you chat. Keep the chat short and concise and avoid providing more information than strictly necessary for the fiat exchange. 

**ProTip** You can step up your privacy by using a lightning [proxy wallet](/docs/proxy-wallets/) when you buy Sats in RoboSats.
{: .notice--primary}


{% include wip %}