---
layout: single
title: "Le Réseau Lightning"
permalink: /docs/fr/lightning/
toc: true
toc_sticky: true
sidebar:
  title: '<img id="side-icon-verybig" src="/assets/vector/bolt.svg"/>Réseau Lightning'
  nav: docs
src: "_pages/docs/fr/00-quick-start/01-lightning.md"
---

Le Réseau Lightning est un réseau de micropaiement hors chaîne (couche 2) qui propose des frais réduits et des paiements instantanés. RoboSats exploite les avantages des transactions hors chaîne pour offrir aux utilisateurs une expérience rapide et peu coûteuse ! Il existe de nombreuses ressources intéressantes pour en savoir plus sur le fonctionnement du Lightning Network. Consultez ["Maîtriser le réseau Lightning"](https://github.com/lnbook/lnbook) pour une de ces excellentes ressources.

RoboSats est expérimental et, en tant que tel, est actuellement soutenu par un [nœud expérimental de coordinateur](https://amboss.space/node/0282eb467bc073833a039940392592bf10cf338a830ba4e392c1667d7697654c7e). La prochaine [mise à jour de la fédération](https://github.com/RoboSats/robosats/pull/601) permet à quiconque de devenir un nœud coordinateur et de soutenir la fédération RoboSats, créant ainsi une liste de transactions décentralisée mais unifiée composé de membres de la fédération en concurrence les uns avec les autres pour attirer les traders.

## **Utiliser le réseau Lightning**

La condition préalable à l'utilisation de LN est l'existence d'un portefeuille. Il est fortement recommandé d'utiliser un portefeuille n'ayant pas la garde de vos clés, mais du logiciel libre dans lequel vous êtes le seul à détenir les clés. Les portefeuilles qui détiennent vos clés et les portefeuilles en logiciel propriétaire peuvent collecter des informations sur vos transactions, des informations sur votre compte et éventuellement d'autres métadonnées. N'oubliez pas non plus que les fonds conservés sur LN ne sont pas considérés comme étant stockés à froid, mais qu'ils se trouvent dans un portefeuille "chaud" connecté à l'internet. Pour l'utilisation de RoboSats, il est recommandé d'utiliser un portefeuille qui fonctionne bien avec [mise en attente des factures Lightning](/docs/fr/escrow/#what-is-a-hold-invoice), se référer à [Comprendre > Portefeuilles](/docs/fr/wallets/) pour une liste non exhaustive de la compatibilité des portefeuilles LN.

Lorsque l'on utilise Lightning, les paiements sont effectués par le biais de factures. Le destinataire des Sats remet une facture à l'expéditeur des Sats, souvent sous la forme d'un code QR, demandant à l'expéditeur de payer le montant spécifique de Sats demandé par la facture. La facture commence par le préfixe "lnbc" et peut être décodée pour en inspecter le contenu, comme la quantité de Sats envoyée, l'ID du nœud auquel les Sats ont été envoyés, toute description fournie, etc.

Dans sa forme actuelle, Lightning n'est pas totalement privé. Les utilisateurs doivent veiller à ne pas révéler d'informations sensibles lorsqu'ils envoient et reçoivent des paiements sur LN. Ne faites pas confiance à une source fermée et à un portefeuille dépositaire pour respecter vos informations, vous pouvez obtenir un plus grand degré de confidentialité en utilisant un portefeuille non dépositaire. De même, consultez [Best Practices > Proxy Wallets](/docs/fr/proxy-wallets/) pour plus d'informations sur les problèmes de confidentialité lors de la réception de Sats sur LN.

## **Réseau Lightning "Manigances"**

Bien que cela soit très rare, il peut arriver qu'un nœud de routage intermédiaire se déconnecte ou que la transaction soit "bloquée" lors d'une tentative de paiement. Ce type de problème, que l'on appelle officieusement "manigances du Réseau Lightning", est dû aux limites actuelles du LN. Ils se résolvent d'eux-mêmes au bout de quelques heures ou de quelques jours au maximum.

Lors de l'achat de bitcoins (réception de Sats sur le LN), la facture que vous fournissez peut échouer dans l'acheminement et nécessiter de nombreuses tentatives. RoboSats tente d'envoyer les Sats trois fois et, en cas d'échec, demande une nouvelle facture pour réessayer. Recommencez et répéter jusqu'à ce qu'il envoie ! Pendant cette période, vos fonds sont considérés comme sûrs.

Dans l'éventualité d'un tel scénario, sauvegardez en toute sécurité le jeton privé de votre robot et vérifiez de temps en temps le paiement de votre commande. Si le problème persiste, n'hésitez pas à contacter le [groupe d'assistance SimpleX](/contribute/code/#communication-channels) afin que le personnel de RoboSats puisse investiguer.

{% include improve_fr %}
