---
layout: single
classes: wide
title: "Trade Pipeline"
permalink: /docs/trade-pipeline/
sidebar:
  title: "<i class='fa-solid fa-timeline'></i> Trade Pipeline"
  nav: docs
src: "_pages/docs/03-understand/01-trade-pipeline.md"
--- 

Alice wants to buy Sats privately. This is step-by-step what happens when she buys using RoboSats.


1. Alice generates an avatar (AdequateAlice01) using her private random token.
2. Alice stores safely the token in case she needs to recover AdequateAlice01 in the future.
3. Alice makes a new order and locks a small hold invoice to publish it (maker bond).
4. Bob wants to sell satoshis, sees Alice's order in the book and takes it.
5. Bob scans a small hold invoice as his taker bond. The contract is final.
6. Bob posts the traded satoshis with a hold invoice. While Alice submits her payout invoice.
7. On a private chat, Bob tells Alice how to send him fiat.
8. Alice pays Bob, then they confirm the fiat has been sent and received.
9. Bob's trade hold invoice is charged and the satoshis are sent to Alice.
10. Bob and Alice's bonds return automatically, since they complied by the rules.
11. The bonds would be charged (lost) in case of unilateral cancellation or cheating (lost dispute).


{% include improve %}