---
layout: single
title: Prix des commandes
permalink: /docs/fr/prices/
toc: true
toc_sticky: true
sidebar:
  title: '<img id="side-icon-verybig" src="/assets/vector/bitcoin.svg"/>Prix'
  nav: docs
src: "_pages/docs/fr/03-understand/12-prices.md"
---

Le prix est le taux fiat auquel le bitcoin a été échangé pour la dernière fois sur un marché boursier. En d'autres termes, il indique le prix d'échange qu'un acheteur et un vendeur seraient tous deux prêts à accepter pour une transaction ultérieure entre le bitcoin et le fiat.

Lors de la passation d'un ordre, il existe deux méthodes de tarification différentes :
* Méthode de tarification **Relative** : laisser le prix de l'ordre évoluer avec le marché au fil du temps (dynamique).
* Méthode de tarification **Explicite**** : fixer le prix de l'ordre à l'aide d'un montant fixe de satoshis (statique).

Lorsque vous parcourez la liste des ordres, le prix du bitcoin-fiat des ordres en direct que vous voyez est automatiquement ajusté pour inclure la prime correspondante de l'ordre. Reportez-vous à [Comprendre > Prime](/docs/fr/premium/) pour plus d'informations sur les primes.

Si une monnaie fiat n'est pas disponible sur RoboSats, vous pouvez facilement ajouter une nouvelle monnaie en ouvrant une pull request sur [GitHub](https://github.com/RoboSats/robosats) !

****La méthode de tarification explicite a été supprimée en tant qu'option pour des raisons techniques, mais pourrait potentiellement revenir dans de futures mises à jour. Actuellement, la tarification des ordres n'est que relative au taux du marché**.

## **Les prix en pratique**

Si le prix de l'ordre est *relatif*, alors le montant de satoshis échangé par rapport au taux de change fiduciaire (que nous appellerons `trade_sats`) devient "verrouillé" une fois que le preneur d'ordre verrouille son obligation. Jusqu'à ce que l'obligation du preneur soit bloquée, le prix de l'ordre continue d'évoluer avec le marché au fil du temps.

Une fois que l'obligation du preneur d'ordre est bloquée pour un ordre dont le prix est relativement élevé, la quantité de satoshis échangée est calculée comme suit :

````
premium_rate = CEX_rate * (1 + (premium / 100))
trade_sats = amount / premium_rate
````

où `trade_sats` est le nombre de satoshis à échanger, `premium` est ce que le donneur d'ordre a défini lors de la création de l'ordre, et `CEX_rate` est le prix actuel de l'échange de bitcoins dans la devise que vous utilisez.

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

où `fee_fraction` se combine pour un total partagé de frais de plateforme de {{site.robosats.total_fee}}% ; cela se décompose en {{site.robosats.maker_fee}}% et {{site.robosats.taker_fee}}% pour le maker et le taker, respectivement. Référez-vous à [Comprendre > Frais] (https://learn.robosats.org/docs/fr/fees/) pour plus d'informations sur les frais.

RoboSats collecte ensuite les frais dans le processus de dépôt de garantie (`escrow_amount`) et la facture de paiement (`payout_amount`) en calculant ce qui suit :
* Pour le vendeur:
  ````
  escrow_amount = trade_sats + fee_sats
  ````
* Pour l'acheteur':
  ````
  payout_amount = trade_sats - fee_sats
  ````

Essentiellement, RoboSats ajoute au `escrow_amount`, déduit du `payout_amount`, et, selon que vous êtes le preneur d'ordre ou le faiseur d'ordre, applique les calculs de `fee_fraction` appropriés.

Si la tarification de l'ordre est *explicite*, alors le montant de satoshis échangé est fixe, quel que soit le taux de change fiat actuel (`CEX_rate`). Une fois l'ordre créé, les satoshis sont bloqués dès le départ ; cependant, la prime associée évoluera avec le marché au fil du temps au lieu du prix.

## **Comment les bourses centralisées déterminent le taux du marché Bitcoin-Fiat**

Le taux du marché global bitcoin-fiat est déterminé par un simple arbitrage bitcoin, ce qui fait converger le prix fiat du bitcoin vers les prix que vous voyez sur les bourses centralisées typiques.

Par exemple, si la bourse "A" fixe le prix du bitcoin à 10 000 dollars et la bourse "B" à 10 100 dollars (différence de 100 dollars), l'achat de bitcoins sur la bourse "A" et leur vente immédiate sur la bourse "B" vous permettra de réaliser un bénéfice de 100 dollars (sans tenir compte des frais de négociation).

Cette action entraînera une hausse du prix du bitcoin sur la bourse "A" et une baisse du prix du bitcoin sur la bourse "B". Les prix sur les deux bourses se rapprochent finalement l'un de l'autre, tandis que les possibilités d'arbitrage rentable diminuent.

Les pays qui n'autorisent pas les grandes bourses à opérer sur leur territoire verront souvent le bitcoin s'échanger à un prix plus élevé, ou à une prime, en raison de la difficulté pour les arbitragistes d'intervenir et de tirer profit de cette différence de prix.

## **Où RoboSats obtient-il des informations sur les prix ?**

Le prix d'échange du bitcoin sur RoboSats est déterminé par les taux de change actuels des API publiques, en particulier les prix de blockchain.info et de yadio.io. En fonction de la devise que vous utilisez, le prix médian du bitcoin-fiat est alors calculé à partir des taux de change actuels.

Les données tirées de blockchain.info et de yadio.io sont accessibles au public et facilement vérifiables par n'importe qui à tout moment.

N'hésitez pas à suggérer d'autres fournisseurs d'API ! RoboSats calcule le prix médian du bitcoin-fiat à partir de toutes les API référencées. L'ajout d'autres API permettrait d'obtenir des prix plus robustes et plus précis sur la plateforme.

## **Comment ajouter des devises**

Toutes les devises disponibles dans les APIs yadio.io et blockchain.info devraient également être disponibles dans RoboSats.

Vous ne voyez pas une monnaie avec laquelle vous voulez faire du commerce ? Il est très facile pour les contributeurs d'ajouter une nouvelle devise en ouvrant une pull request sur [GitHub] (https://github.com/RoboSats/robosats).

Tout d'abord, vérifiez le fichier [currencies.json](https://github.com/RoboSats/robosats/blob/main/frontend/static/assets/currencies.json) actuel pour vérifier si la devise que vous recherchez est effectivement absente de RoboSats.

Si vous trouvez une devise manquante dans RoboSats et pourtant disponible dans l'une des deux API référencées, vous pouvez alors modifier directement les fichiers currencies.json et [FlagsWithProps.tsx](https://github.com/RoboSats/robosats/blob/main/frontend/src/components/FlagWithProps/FlagWithProps.tsx).

Après avoir fusionné la pull request, la devise ajoutée sera désormais disponible dans RoboSats !

{% include improve_fr %}
