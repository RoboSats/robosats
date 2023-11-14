---
layout: single
title: Platform Fees
permalink: /docs/fees/
toc: true
toc_sticky: true
sidebar:
  title: '<img id="side-icon-verybig" src="/assets/vector/hand-holding-hand.svg"/>Frais'
  nav: docs
src: "_pages/docs/03-understand/13-fees.md"
---

RoboSats facture des frais de {{site.robosats.total_fee}}% du montant total de la transaction ; ces frais sont répartis entre le donneur et le preneur d'ordre qui paient respectivement {{site.robosats.maker_fee}}% et {{site.robosats.taker_fee}}%.

Les frais de plateforme sont résumés dans le tableau ci-dessous afin de souligner que le pourcentage des frais varie selon que vous passez ou prenez l'ordre :

| Côté     | Créateur                     | Preneur                      |
|----------|------------------------------|------------------------------|
| Acheteur | {{site.robosats.maker_fee}}% | {{site.robosats.taker_fee}}% |
| Vendeur  | {{site.robosats.maker_fee}}% | {{site.robosats.taker_fee}}% |

*Note : Des frais externes peuvent être encourus, tels que les frais de routage du Lightning Network et les frais de transaction sur la chaîne.*

## **Les frais de plateforme en pratique**

Le montant total des frais ({{site.robosats.total_fee}}%) est réparti entre le créateur et le preneur. Le preneur paie un montant plus élevé ({{site.robosats.taker_fee}}%) que le créateur ({{site.robosats.maker_fee}}%) ; ceci a pour but d'encourager un plus grand nombre de faiseurs et par conséquent d'augmenter la liquidité disponible sur la bourse.

En pratique, les frais sont appliqués lorsque l'utilisateur est invité à soumettre le dépôt de garantie (vendeur) ou la facture de paiement (acheteur) après que l'obligation du preneur a été verrouillée.

Si le prix de l'ordre est *relatif*, alors le montant de Sats échangé par rapport au taux de change fiat (que nous appellerons `trade_sats`) fluctue jusqu'à ce que l'obligation du preneur soit verrouillée. Dans le cas d'une tarification *explicite*, la quantité de Sats échangée est fixe. Reportez-vous à [Comprendre > Prix](/docs/prices/) pour plus d'informations sur les méthodes de tarification relative et explicite.

Tant que l'obligation du preneur n'est pas bloquée, le prix de l'ordre continue d'évoluer avec le marché au fil du temps. Une fois que l'obligation du preneur est bloquée pour un ordre à prix relatif, la quantité de Sats échangée est calculée comme suit :

````
premium_rate = CEX_rate * (1 + (premium / 100))
trade_sats = amount / premium_rate
````

où `trade_sats` est le Sats à échanger, `premium` est ce que le donneur d'ordre a défini lors de la création de l'ordre, et `CEX_rate` est le prix d'échange actuel du bitcoin dans la devise que vous utilisez.

Les frais de plateforme (`fee_sats`) associés à votre ordre sont calculés en utilisant la variable `trade_sats` :
* Pour le créateur:
  ````
  fee_fraction = 0.002 * 0.125
               = 0.00025 ==> {{site.robosats.maker_fee}}%
  fee_sats = trade_sats * fee_fraction
  ````
* Pour le preneur:
  ````
  fee_fraction = 0.002 * (1 - 0.125)
               = 0.00175 ==> {{site.robosats.taker_fee}}%
  fee_sats = trade_sats * fee_fraction
  ````

où `fee_fraction` se combine pour un total partagé de frais de plateforme de {{site.robosats.total_fee}}%. Comme indiqué précédemment, le preneur paie un montant plus élevé ({{site.robosats.taker_fee}}%) que le donneur d'ordre ({{site.robosats.maker_fee}}%) afin d'encourager la croissance de la liquidité avec davantage de donneurs d'ordre.

RoboSats collecte ensuite les frais dans le processus de dépôt des transactions (`escrow_amount`) et la facture de paiement (`payout_amount`) en calculant ce qui suit :
* Pour le vendeur:
  ````
  escrow_amount = trade_sats + fee_sats
  ````
* Pour l'acheteur:
  ````
  payout_amount = trade_sats - fee_sats
  ````

En substance, RoboSats ajoute au `escrow_amount`, déduit du `payout_amount`, et, selon que vous êtes le preneur d'ordre ou le créateur d'ordre, applique les calculs de `fee_fraction` appropriés.

## **Pourquoi des frais ?**

Les frais permettent d'améliorer l'expérience de l'utilisateur final de la plateforme en poursuivant le développement, en offrant une assistance multilingue et en élaborant des guides pour interagir avec la plateforme.

Les frais récompensent à leur tour les développeurs et contributeurs bénévoles de GitHub pour l'accomplissement de tâches [éligibles pour gagner des bitcoins](https://github.com/users/Reckless-Satoshi/projects/2). A vérifier ! Si vous gagnez des Sats pour vos contributions, les frais encourus lors de l'utilisation de RoboSats seront suffisamment couverts !

La mise en place de frais permet également d'atténuer les risques d'attaques par déni de service par des robots malveillants qui encombrent le coordinateur RoboSats.

## **Frais externes**

Des frais de plateforme externes peuvent être encourus lors de l'exécution de paiements on-chain (swaps on-chain) et lors de l'acheminement de paiements via le Lightning Network.

Lorsque vous choisissez de recevoir des bitcoins on-chain, un aperçu des frais de minage (`fee_mining`) et des frais de swap (`fee_swap`) est affiché. Le `payout_amount` pour la réception sur la chaîne est calculé comme suit :

````
payout_amount = trade_sats - fee_sats - fee_mining - fee_swap
````

Les frais de swap sont des frais supplémentaires que RoboSats facture pour effectuer le paiement on-chain et les frais de minage sont le taux de frais on-chain en sats/vbyte qui peut être personnalisé pour répondre à vos besoins. Reportez-vous à [Comprendre > Paiements sur la chaîne](/docs/on-chain-payouts/) pour plus d'informations sur les paiements on-chain.

RoboSats utilise la vitesse et la sécurité du Lightning Network, par conséquent les paiements envoyés via le Lightning Network peuvent encourir des frais en fonction du "chemin" nécessaire que le paiement doit emprunter.

Les utilisateurs peuvent recevoir des paiements en privé via [lnproxy](https://lnproxy.org/), un simple outil de confidentialité du Lightning Network, mais votre budget de routage peut augmenter pour couvrir les frais supplémentaires encourus par le serveur lnproxy. Reportez-vous à [Best Practices > Proxy Wallets](/docs/proxy-wallets/) pour en savoir plus sur la réception privée.

L'utilisateur a la possibilité de spécifier le budget de routage du Lightning Network, ce qui peut aider à réduire les échecs de routage. Voir [Quick Start > Lightning Network](/docs/lightning/) pour plus d'informations sur les échecs de routage.

{% include improve %}
