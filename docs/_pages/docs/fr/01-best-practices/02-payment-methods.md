---
layout: single
title: Bonnes pratiques Fiat
permalink: /docs/fr/payment-methods/
toc: true
toc_sticky: true
sidebar:
  title: '<img id="side-icon-verybig" src="/assets/vector/hand-peace.svg"/>Bonnes pratiques Fiat'
  nav: docs
src: "_pages/docs/fr/01-best-practices/02-payment-methods.md"
---

Actuellement, il n'y a pas de restrictions sur la méthode de paiement en monnaie fiduciaire. Vous pouvez payer avec n'importe quelle méthode sur laquelle vous et votre correspondant vous êtes mis d'accord. Cela inclut les méthodes plus risquées telles que PayPal, Venmo et les applications de paiement en espèces. Vous pouvez obtenir plus de détails sur les caractéristiques et les différences de chaque méthode de paiement en monnaie fiduciaire à l'adresse suivante <a href =  "https://bisq.wiki/Payment_methods#Payment_method_guides">wiki Bisq</a>. Les directives Bisq s'appliquent par défaut aux RoboSats.

## Recommendation générale

Cette recommandation est faite en tant que bonne pratique pour le trading sur la plateforme RoboSats. Nous encourageons vivement les deux parties à suivre ces bonnes pratiques afin de garantir la réussite des échanges et d'éviter les litiges inutiles.

Remarque : ces indications sont modifiées à partir des <a href="https://bisq.wiki/Trading_rules">règles de trading</a> de Bisq et ajustées en fonction des différences entre les mécanismes de négociation de chaque plateforme.

### Pour l'acheteur et le vendeur de bitcoins

  1. Assurez-vous de consulter la section <a href="https://github.com/RoboSats/robosats/blob/main/docs/fr/how-to-use.md">comment utiliser </a> avant de commencer à négocier.<br>
  2. Énoncer clairement l'accord afin d'éviter tout malentendu.<br>
  3. La méthode de paiement fiat devrait pouvoir être envoyée et reçue instantanément car la facture hodl a un délai d'expiration de 24 heures.<br>
Si le délai d'expiration est dépassé, cela peut déclencher un litige et entraîner la perte de la caution.<br>
  4. Une fois que le preneur a pris la commande, les deux parties doivent être prêtes à passer à l'étape suivante avant l'expiration du délai.<br>
  5. Sachez que personne ne peut lire les discussions entre vous et votre correspondant.

### Pour l'acheteur de bitcoins

  1. Assurez-vous que l'adresse/le compte de destination de l'envoi de fiats est correct·e.<br>
  2. Veillez à conserver les preuves de l'envoi de votre monnaie fiduciaire, comme le reçu de la transaction.<br>
  3. Cliquez sur le bouton "Confirmer l'envoi de fiats" après avoir envoyé avec succès les fiats hors de votre compte.<br>

### Pour le vendeur de bitcoins

  1. Confirmer que le montant final de fiat reçu est correct.<br>
  2. Cliquez sur "Confirmer la réception de fiats" après vous être assuré à 100 % que les fiats ont bien été déposés sur votre compte.<br>
  3. Si vous convenez avec l'acheteur d'utiliser la plate-forme à risque élevé, vous devrez prendre des précautions particulières pour éviter les rétrofacturations (nous y reviendrons plus tard).<br>

## Méthode de paiement à risque moyen-faible

### Cartes cadeaux Amazon
Les cartes cadeaux Amazon sont l'une des méthodes de paiement les plus privées sur RoboSats. Elles ont tendance à être rapides et pratiques, mais les fonds doivent être dépensés sur Amazon.

Il est important de ne pas partager un code de carte cadeau directement sur le chat, car cela pourrait entraîner des litiges difficiles à résoudre en cas de fraude. En tant que vendeur, **n'acceptez pas de code de carte-cadeau sur le chat**. Au lieu de cela, le vendeur doit fournir un email dans le chat. L'acheteur doit acheter une nouvelle carte cadeau explicitement pour l'échange et la faire envoyer à l'adresse e-mail du vendeur. De cette manière, le vendeur sait qu'il est le seul à avoir accès au code modifiable. Cette approche génère également une preuve vérifiable que la carte-cadeau a été achetée pour l'échange de RoboSats en cas de litige.

Si l'acheteur dispose déjà d'un code de carte cadeau Amazon, il devra d'abord appliquer le code à son propre compte. Ensuite, il achètera une nouvelle carte cadeau Amazon pour l'e-mail du vendeur en utilisant le solde de son compte.

Plus d'informations sur [Amazon eGift card Bisq guidelines](https://bisq.wiki/Amazon_eGift_card)

### Interac e-Transfer

Au Canada, [Interac e-Transfer](https://www.interac.ca/en/consumers/support/faq-consumers/) est une méthode de paiement populaire et largement acceptée qui permet d'envoyer des paiements d'un compte bancaire à un autre, en utilisant uniquement une adresse électronique (ou un numéro de téléphone) enregistrée. Les virements électroniques (e-Transfers) sont considérés comme présentant un faible risque de rétrofacturation ; toutefois, des rétrofacturations restent possibles dans de rares cas. Les virements électroniques (e-Transfers) peuvent être initiés soit par l'expéditeur en envoyant un paiement à l'adresse électronique du destinataire, soit par le destinataire en envoyant une demande de paiement à l'adresse électronique de l'expéditeur.

### Wise

[Wise](https://wise.com/) (anciennement TransferWise) est un transmetteur de fonds international réglementé dans 175 pays et 50 devises. Il est connu pour ses frais relativement peu élevés pour les transferts d'argent entre pays et devises. Les rétrocessions restent un risque, mais elles sont probablement peu fréquentes. Les utilisateurs peuvent transférer de l'argent entre des comptes Wise à l'aide d'une adresse électronique, comme pour les virements électroniques. Au Canada, les utilisateurs peuvent demander des virements électroniques (e-Transfers) standard directement à partir de leurs comptes Wise.

## Mode de paiement à risque élevé

La meilleure pratique pour les utilisateurs qui tentent d'effectuer des transactions avec une méthode de paiement présentant un risque élevé de perte de fonds est abordée dans cette section.

### Paypal
Paypal est une des méthodes de paiement fiat les plus utilisés. Cependant, avec <a href="https://www.paypal.com/us/webapps/mpp/ua/buyer-protection">la politique de protection des acheteurs de PayPal</a>, l'acheteur peut effectuer une action frauduleuse en créant une demande de remboursement dans PayPal après que le processus d'échange dans RoboSats soit terminé et donc en prenant à la fois les fiats et les bitcoins par eux-mêmes.

Cette fraude peut être évitée en convenant avec l'acheteur qu'il envoie de l'argent en utilisant l'option "envoyer de l'argent à un ami ou à un membre de la famille". L'acheteur sera ainsi responsable des frais de transaction et il sera moins enclin à demander un remboursement.

### Pour le vendeur
Si vous êtes un vendeur et que votre correspondant a convenu d'utiliser l'option "envoyer de l'argent à un ami ou à un membre de la famille" mais que ce dernier a utilisé l'option "envoyer de l'argent pour des biens ou des services", vous devez renvoyer le paiement en fiats et demander à votre correspondant d'utiliser une méthode convenue pour l'envoi. S'il persiste à ne pas respecter l'accord, vous pouvez lui demander de mettre fin volontairement à l'échange ou de mettre fin à l'échange en déclenchant un litige.

### Pour l'acheteur
Si vous êtes un acheteur et que vous devez utiliser l'option "envoyer de l'argent à un ami ou à un membre de la famille" pour payer des fiats à votre pair, vous pouvez choisir le type de paiement spécifié en suivant les étapes suivantes.

#### PayPal version bureau
Dans la version bureau de PayPal, il se trouve sous la liste déroulante des devises et doit être intitulé "Envoyer à un ami".
Si c'est le cas, vous devez cliquer sur "Modifier" à droite pour changer le type de paiement.
<div align="center">
<img src="/assets/images/fiat-payment-methods/PayPal-main-desktop.png" width="370"/>
</div>
Sélectionnez ensuite "Envoyer à un ami" dans la page de choix du type de paiement.
<div align="center">
<img src="/assets/images/fiat-payment-methods/PayPal-choose-desktop.png" width="370"/>
</div>

#### PayPal Mobile
Dans PayPal mobile, il se trouve sous le mode de paiement (dans ce cas, il s'agit de VISA) et doit être intitulé "Amis ou famille".
S'il est étiqueté autrement, vous devrez tabuler ">" à droite pour changer le type de paiement.
<div align="center">
<img src="/assets/images/fiat-payment-methods/PayPal-main-phone.png" width="230"/>
</div>
Sélectionnez ensuite "Amis ou famille" dans la page de choix du type de paiement.
<div align="center">
<img src="/assets/images/fiat-payment-methods/PayPal-choose-phone.png" width="230"/>
</div>

{% include improve %}
