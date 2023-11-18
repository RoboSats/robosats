---
layout: single
title: Dépôt de garantie
permalink: /docs/fr/escrow/
toc: true
toc_sticky: true
sidebar:
  title: '<img id="side-icon-verybig" src="/assets/vector/money-bill-transfer.svg"/>Dépôt de garantie'
  nav: docs
src: "_pages/docs/fr/03-understand/05-trade-escrow.md"
---

Lors de la vente de bitcoins, un dépôt de garantie est utilisé comme garantie de sécurité. RoboSats utilise Lightning [facture retenue] (https://github.com/lightningnetwork/lnd/pull/2022) dans le système de dépôt pour protéger l'acheteur contre la fraude ou le non-paiement de son partenaire.

Le temps alloué pour payer (verrouiller) un dépôt de garantie est déterminé par le donneur d'ordre. Le délai d'expiration du dépôt de garantie est par défaut de {{site.robosats.hours_submit_escrow}} heures ; cependant, il peut être personnalisé pour varier de 1 à 8 heures.

Si le vendeur ne verrouille pas son dépôt dans le délai imparti, il perd sa caution. Reportez-vous à [Comprendre > Obligations] (/docs/fr/obligations/) pour plus d'informations sur les cautions. En outre, si un litige est ouvert, les Satoshis en dépôt de garantie sont libérés au profit du gagnant du litige.

Assurez-vous d'utiliser un portefeuille Lightning qui fonctionne bien avec RoboSats, référez-vous à [Comprendre > Portefeuilles](/docs/fr/wallets/) pour plus d'informations.

*Note : Le terme "vendeur" se réfère à la vente de bitcoins tandis que le terme "acheteur" se réfère à l'achat de bitcoins.*

## **Qu'est-ce qu'une facture de retenue ?**

Les factures "lightning de retenue", sont un type de facture qui "bloque" des fonds dans votre portefeuille et les "débloque" ensuite en fonction de l'état de la facture tel que déterminé par le destinataire. Dans certains portefeuilles, l'interface utilisateur décrit ce type de paiement comme un paiement "en cours" ou "gelé".

Contrairement aux paiements Lightning classiques qui bloquent et règlent immédiatement le HTLC à l'arrivée du paiement, une facture bloquée ne fait que bloquer le paiement mais ne le règle pas encore. À partir de ce moment, l'expéditeur ne peut plus révoquer son paiement et les fonds sont donc bloqués dans votre portefeuille, mais ne l'ont pas encore quitté. Le destinataire choisit de régler (compléter) ou de débloquer (annuler) le HTLC et la facture.

Dans la pratique, la facture du dépôt de garantie est bloquée vers le nœud coordinateur expérimental de RoboSats. Cela signifie que la facture est facturée exactement au moment où le vendeur clique sur "Confirmer la réception du Fiat" et que la facture de l'acheteur est payée. Pendant le temps nécessaire pour régler le paiement Lightning à l'acheteur, RoboSats dispose des fonds en essayant de payer l'acheteur de manière répétée.

Cette méthode est, à l'heure actuelle, l'approche la plus sûre pour s'assurer que les partenaires respectent leur part du marché, étant donné qu'une facture directe entre le vendeur et l'acheteur n'a pas encore été démontrée dans la pratique avec les portefeuilles conventionnels.

## **Comment soumettre un dépôt de garantie**

Tout d'abord, reportez-vous à [Comprendre > Portefeuilles](/docs/fr/wallets/) pour connaître les portefeuilles Lightning compatibles qui vous aideront à utiliser RoboSats plus facilement. Selon le portefeuille, les fonds bloqués peuvent apparaître comme un paiement en transit, gelé ou même semblant échouer. Vérifiez la liste de compatibilité des portefeuilles !

Lisez le guide approprié selon que vous donnez ou recevez un ordre de vente de bitcoins :
* **Créateur** : Créez un ordre et modifiez les conditions de l'ordre à votre convenance. L'ordre peut être personnalisé pour exiger un "Dépôt de garantie/Facture minutée" (délai d'expiration) différent du délai par défaut de {{site.robosats.hours_submit_escrow}} heures, allant de 1 à 8 heures. Lorsque votre commande publiée est prise et que le preneur a soumis sa caution, utilisez le code QR affiché avec votre portefeuille Lightning pour bloquer le montant indiqué de sats en tant que garantie (dépôt). *Note : Les fonds bloqués sont libérés à l'acheteur une fois que vous avez sélectionné "Confirmer la réception du fiat", ce qui règle la commande. Ne confirmez qu'une fois que le fiat est arrivé sur votre compte.*
**Preneur d'ordre** : Parcourez le carnet d'ordres et trouvez l'ordre qui vous convient. Cliquez sur "Prendre l'ordre" et verrouillez votre dépôt de garantie. Immédiatement après avoir soumis l'engagement, utilisez le code QR affiché avec votre portefeuille Lightning pour verrouiller le montant indiqué de sats en tant que garantie (dépôt). *Remarque : les fonds bloqués sont remis à l'acheteur une fois que vous avez sélectionné "Confirmer la réception du fiat", ce qui règle la commande. Ne confirmez qu'une fois que le fiat est arrivé sur votre compte.*

Dès que le preneur d'ordre bloque son obligation, l'acheteur et le vendeur sont tenus de soumettre la facture de paiement et le dépôt de garantie, respectivement, dans le délai imparti.

Par défaut, le délai d'expiration est de {{site.robosats.hours_submit_escrow}} heures ; cependant, en tant que preneur d'ordre, vous pouvez personnaliser le délai pour qu'il soit compris entre 1 heure et 8 heures. En d'autres termes, vous pouvez modifier le temps alloué pour bloquer les fonds et fournir la facture de paiement. Peut-être souhaitez-vous une transaction accélérée et fixerez-vous le délai à 1 heure maximum au lieu de {{site.robosats.hours_submit_escrow}} heures.

Si le vendeur bloque le dépôt de garantie avant que l'acheteur n'ait fourni la facture de paiement, le vendeur attendra que l'acheteur ait fourni sa facture pour passer à l'étape du chat en pair-à-pair.

Si le vendeur ne bloque pas du tout le dépôt de garantie, la commande expirera et le vendeur perdra sa caution. La moitié de la caution perdue est versée à l'acheteur à titre de compensation pour le temps perdu. De même, si l'acheteur ne fournit pas la facture de paiement dans le délai imparti, il perd sa caution et la moitié revient au vendeur. La moitié restante de la caution perdue est "donnée" à RoboSats !

Une fois la commande prise, elle ne peut pas être annulée, sauf si le donneur et le preneur d'ordre conviennent d'une annulation concertée au cours de la phase de discussion de pair à pair. Plus important encore, une fois que le vendeur a cliqué sur "Confirmer Fiat reçu", la commande est considérée comme réussie et ne peut plus faire l'objet d'un litige ni être annulée en collaboration. Il est donc fortement recommandé d'utiliser un mode de paiement sans risque de rétrofacturation (irréversible).

## **Quand et comment le dépôt de garantie est débloqué**

La facture bloquée est toujours remise à son propriétaire légitime en fonction de l'état de la transaction ou, le cas échéant, de l'issue du litige. Il y a deux scénarios qui entraînent la libération de la facture du dépôt fiduciaire :
* La réalisation d'une transaction réussie où les fonds sont envoyés à l'acheteur (le vendeur confirme que le fiat a été reçu).
* L'ouverture d'un litige si la transaction n'a pas abouti : les fonds sont retenus jusqu'à la résolution du litige (le vendeur n'a intentionnellement pas confirmé la réception des fiats).

Les scénarios ci-dessus sont décrits plus en détail ci-dessous :

Une fois que la méthode de paiement en fiats est coordonnée avec l'acheteur, le vendeur clique sur "Confirmer la réception des fiats" pour mettre fin à la transaction, ce qui libère instantanément les fonds bloqués au profit de l'acheteur. Le vendeur ne doit confirmer la réception des fiats qu'une fois qu'ils sont en sa possession.

Si vous n'avez jamais reçu le paiement en fiat de l'acheteur, ne cliquez pas sur "Confirmer la réception du fiat" et ouvrez plutôt un litige que l'équipe de RoboSats examinera. Essayer de tricher en ne confirmant pas intentionnellement que le fiat a été reçu entraîne l'ouverture automatique d'un litige au nom de l'acheteur.

Le robot tricheur risque de perdre ce litige et par conséquent de perdre sa caution. L'intégralité du dépôt bloqué est libérée et récompensée pour le robot honnête.

N'oubliez pas votre commande ! Si votre partenaire a envoyé le fiat et que le délai de commande expire avant que vous ne confirmiez la réception du fiat, vous risquez de perdre le litige suivant, ce qui entraînera la perte de votre caution. Veillez à vous souvenir de votre ordre et à sauvegarder le jeton unique de votre robot !

En raison des délais impliqués dans le processus de commande, il est recommandé d'utiliser des méthodes de paiement fiat instantanées pour éviter de dépasser le délai d'expiration. Attention aux méthodes de paiement en monnaie fiat qui permettent à l'acheteur de contacter sa banque et de restituer la transaction. Il est recommandé d'utiliser des modes de paiement irréversibles. Pour plus d'informations, voir [Bonnes pratiques > Méthodes de paiement](/docs/fr/payment-methods/).

Bien qu'il s'agisse d'une très petite fenêtre de temps (environ une seconde), le dépôt de garantie de l'échange pourrait être définitivement perdu si RoboSats était arrêté ou disparait soudainement entre le moment où le vendeur confirme qu'il a reçu des fiats et le moment où le portefeuille Lightning de l'acheteur enregistre les fonds du dépôt de garantie libérés. Utilisez un portefeuille Lightning bien connecté avec suffisamment de liquidités entrantes pour éviter les échecs d'acheminement et minimiser par la suite toute fenêtre d'opportunité de ce type.

## **Informations complémentaires**

Certains portefeuilles Lightning ont des difficultés à reconnaître la facture de retenue Lightning comme une retenue sur vos fonds. En tant que vendeur, il est nécessaire d'utiliser un portefeuille qui permet plusieurs HTLC en attente puisque vous devrez bloquer des fonds pour une caution et ensuite un dépôt.

Si des problèmes surviennent, veuillez contacter le groupe SimpleX de RoboSats ; mais méfiez-vous des escrocs qui peuvent vous contacter directement et se faire passer pour des membres du personnel de RoboSats ! Le personnel de RoboSats ne vous contactera jamais directement en premier. Voir [Contribute > Code > Communication Channels](/contribute/code/#communication-channels) pour le lien vers le groupe SimpleX.

{% include improve %}
