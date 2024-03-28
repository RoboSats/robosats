---
layout: single
title: On-chain Payouts
permalink: /docs/fr/on-chain-payouts/
toc: true
toc_sticky: true
sidebar:
  title: '<img id="side-icon-verybig" src="/assets/vector/link-solid.svg"/>Paiements On-chain'
  nav: docs
src: "_pages/docs/fr/03-understand/14-on-chain-payouts.md"
---

Bien que RoboSats est une plateforme construite sur le Lightning Network, il existe une option pour l'acheteur de recevoir ses Sats à une adresse bitcoin on-chain. C'est ce qu'on appelle un paiement on-chain ou, parfois, un swap on-chain (à ne pas confondre avec [P2P Swaps](/docs/fr/swaps)).

Dans l'interface utilisateur, cette option est disponible une fois que le preneur a verrouillé son obligation. Lorsque l'état de la commande est "En attente de la facture de l'acheteur", vous devriez voir deux options : "Lightning" et "Onchain"

<div align="center">
    <img src="/assets/images/understand/14-on-chain-payouts/contract-box-on-waiting-for-buyer-invoice.png"/>
</div>

Lorsque vous cliquez sur l'option de l'adresse on-chain, vous voyez ce qui suit :

<div align="center">
    <img src="/assets/images/understand/14-on-chain-payouts/on-chain-box.png"/>
</div>

Un aperçu des frais est affiché et vous pouvez saisir une adresse bitcoin on-chain pour le paiement ainsi que les frais de minage. Les *frais de swap* sont des frais supplémentaires que RoboSats facture pour effectuer le paiement on-chain. Cela n'inclut pas les frais du preneur ou du créateur. Les frais de swap sont facturés sur le montant après déduction des frais du preneur/créateur.

En plus des frais d'échange, il y a également des frais de minage pour la transaction on-chain. Vous pouvez choisir les frais de minage qui correspondent à vos besoins du moment. L'entrée *mining fee* vous permet de choisir le taux de frais en sats/vbyte.

Si l'adresse on-chain est valide, la commande passe à l'étape suivante comme d'habitude. À la fin, si la transaction a réussi, vous devriez voir un écran comme celui-ci avec l'ID de la transaction du paiement :

<div align="center">
    <img src="/assets/images/understand/14-on-chain-payouts/successful-trade-on-chain.png"/>
</div>

## Frais de paiement on-chain

Les frais de paiement on-chain (AKA swap fees) changent de temps en temps. Ils peuvent varier de 1 % à 10 %. Pour connaître les frais actuels de la chaîne, vous pouvez consulter le résumé de la bourse en cliquant sur le bouton "%" de l'écran d'accueil :

<div align="center">
    <img src="/assets/images/understand/14-on-chain-payouts/exchange-info-icon.png"/>
</div>

La boîte de dialogue du résumé de l'échange affiche la valeur actuelle des frais de paiement on-chain :

<div align="center">
    <img src="/assets/images/understand/14-on-chain-payouts/exchange-summary.png"/>
</div>

{% include improve_fr %}
