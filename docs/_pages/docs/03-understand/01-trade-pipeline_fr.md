---
layout: single
classes: wide
title: "Procédure des Commandes"
permalink: /docs/trade-pipeline/
toc: true
toc_sticky: true
sidebar:
  title: '<img id="side-icon-verybig" src="/assets/vector/timeline.svg"/>Procédure des Commandes'
  nav: docs
src: "_pages/docs/03-understand/01-trade-pipeline.md"
---

La procédure des commandes de RoboSats est simple et structurée. Le flux général des commandes est présenté ci-dessous sous forme d'étapes numériques et d'organigramme.

## Ordre du schéma par étape

Alice souhaite acheter des Sats à titre privé. Voici, étape par étape, ce qui se passe lorsqu'elle achète en utilisant RoboSats :

1. Alice génère un avatar (AdequateAlice01) en utilisant son jeton aléatoire privé.
2. Alice stocke le jeton en toute sécurité au cas où elle aurait besoin de récupérer AdequateAlice01 à l'avenir.
3. Alice passe une nouvelle commande et bloque une petite facture pour la publier (obligation de l'auteur).
4. Bob veut vendre des Sats, voit la commande d'Alice dans la liste des transactions et la prend.
5. Bob scanne une facture de petite retenue comme caution de preneur. Le contrat est définitif.
6. Bob comptabilise les Sats échangés avec une facture de retenue. Tandis qu'Alice soumet sa facture de paiement.
7. Dans une discussion privée, Bob explique à Alice comment lui envoyer des fiats.
8. Alice paie Bob, puis ils confirment l'envoi et la réception des fiats.
9. La facture du fonds de commerce de Bob est débitée et les Sats sont envoyés à Alice.
10. Les obligations de Bob et d'Alice sont restituées automatiquement, puisqu'ils ont respecté les règles.
11. Les obligations seraient facturées (perdues) en cas d'annulation unilatérale ou de tricherie (litige perdu).

## Ordre des commandes dans l'organigramme
<div align="center">
    <img src="/assets/images/trade-pipeline/buyer-en.jpg" width="650"/>
</div>

<div align="center">
    <img src="/assets/images/trade-pipeline/seller-en.jpg" width="650"/>
</div>

{% include improve %}
