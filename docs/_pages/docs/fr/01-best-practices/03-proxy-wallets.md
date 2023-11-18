---
layout: single
title: "Portefeuilles Proxy"
permalink: /docs/fr/proxy-wallets/
sidebar:
  title: '<img id="side-icon-verybig" src="/assets/vector/route.svg"/>Portefeuilles Proxy'
  nav: docs
src: "_pages/docs/fr/01-best-practices/03-proxy-wallets.md"
---

La réception sur le réseau Lightning peut révéler des informations personnelles.
il est donc important de garder certaines choses à l'esprit.

Si votre nœud dispose de canaux publics,
les factures que vous établissez révèlent les UTXO qui ont été utilisés pour ouvrir ces canaux.
Si ces UTXO proviennent d'un échange KYC,
toute personne ayant accès à la base de données de l'échange
sera en mesure d'établir un lien entre vos factures éclair et votre identité.
Même si vous utilisez des UTXO coinjoined pour ouvrir vos canaux,
ou que vous démarrez votre nœud exclusivement en payant pour des canaux entrants,
les factures sont toujours potentiellement compromettantes
car elles permettent à un attaquant de corréler
différents paiements pour savoir qu'il s'agit de la même entité (vous).
De plus, si vous fermez ces canaux,
les UTXO qui en résultent continueront d'être liés à ces
transactions.
Si votre nœud ne dispose que de canaux non annoncés
il sera plus difficile de trouver vos UTXO onchain
mais vous aurez toujours le problème de la
corrélation des paiements.

Pour les petits montants, l'utilisation d'un portefeuille proxy qui détient vos clés est un moyen raisonnable d'améliorer votre confidentialité lorsque vous recevez sur le réseau Lightning.
La réception sur un bon portefeuille de dépôt ne révélera que les UTXO du dépositaire.
Pour obtenir des informations sur vous,
le payeur de vos factures devrait être de mèche avec le dépositaire du portefeuille.

Une alternative moins contraignante consiste à utiliser un serveur lnproxy
afin d'envelopper les factures dans votre propre nœud et de recevoir les factures enveloppées à la place.
Il suffit de générer une facture pour votre nœud et de la coller dans une interface web lnproxy.
Le serveur lnproxy renverra une facture "enveloppée" au nœud lightning du serveur lnproxy.
La facture enveloppée doit avoir la même
description et le hachage du paiement que celle que vous avez collée,
et un montant légèrement plus élevé pour tenir compte du routage.
Vous devez vérifier cela à l'aide d'un décodeur de factures tel que https://lightningdecoder.com .
Si les hachages de paiement correspondent, vous pouvez être certain que le nœud lnproxy
ne pourra pas voler vos fonds.
Ensuite, il vous suffit d'utiliser la facture enveloppée partout
où vous auriez utilisé votre facture originale.
Pour obtenir des informations sur vous à partir d'une facture enveloppée,
un attaquant devrait être de mèche avec le serveur lnproxy que vous avez utilisé.

{% include wip %}
