---
layout: single
title: Notifications Telegram, alertes et groupes
permalink: /docs/fr/telegram/
toc: true
toc_sticky: true
sidebar:
  title: '<img id="side-icon-verybig" src="/assets/vector/telegram.svg"/>Telegram'
  nav: docs
src: "_pages/docs/fr/03-understand/10-telegram.md"
---

<!-- Cover: telegram notification bot: how to enable (on phone and desktop). What are the privacy trade offs. Alert bot (Jacky). Telegram public support group, different language group. Warning: never reply to privates. Never share your robot token -->

## **RoboSats Alert bot 🔔**

Vous pouvez le trouver sur Telegram avec le nom d'utilisateur @RobosatsAlertBot, dont l'administrateur est @jakyhack.

## **Que puis-je faire avec @RobosatsAlertBot ?**

Il s'agit d'un bot conçu pour vous avertir lorsqu'une commande répondant à vos exigences est publiée sur RoboSats.

Cela signifie que si vous voulez "ACHETER" des Sats avec des "EUROS" avec une prime maximale de "5%" via les méthodes de paiement "BIZUM, PAYPAL, SEPA, STRIKE", dites-le à @RobosatsAlertBot et il se chargera de vous notifier lorsqu'une transaction répondant à ces exigences sera publiée sur RoboSats.

## **Guide d'utilisation**

Accédez à @RobosatsAlertBot et démarrez le bot avec la commande /start.

Ensuite, il vous donnera le choix entre 2 options : ajouter une nouvelle alerte ou lister les alertes que vous avez déjà configurées. Évidemment, lorsque vous démarrez le bot pour la première fois, vous n'aurez aucune alerte configurée.

![image](https://user-images.githubusercontent.com/47178010/170114653-f1d22f61-1db3-4a6a-b38c-5542a1b76648.png)

Créez une nouvelle alerte en cliquant sur le bouton "+ Ajouter une nouvelle alerte" ou en utilisant la commande /new.

A partir de ce moment, le bot est prêt à enregistrer vos préférences. Il vous posera 4 questions :
- Que voulez-vous faire ? Vous pourrez choisir entre acheter ou vendre, c'est-à-dire indiquer au robot ce que vous voulez faire au sein de RoboSats.

![image](https://user-images.githubusercontent.com/47178010/170114706-a4226028-50a5-414e-8ae8-c44f90833ff6.png)

- Quelle est votre monnaie fiat ? Une liste de monnaies fiat s'affiche, choisissez la vôtre.

![image](https://user-images.githubusercontent.com/47178010/170114837-3e83f1c9-035a-4b59-8c8e-043f77995a33.png)

- Quelle est la prime maximale que vous êtes prêt à payer ? Ou quelle est la prime minimale que vous êtes prêt à accepter ? Selon que vous voulez acheter ou vendre des Sats, il vous posera l'une ou l'autre question.

![image](https://user-images.githubusercontent.com/47178010/170115618-66117113-e702-4faa-b02d-a8101244f7da.png)

- Quels modes de paiement acceptez-vous pour effectuer/recevoir des paiements en monnaie fiat ? Indiquez simplement au robot les méthodes de paiement que vous êtes prêt à accepter pour votre échange. Indiquez-les dans le format suivant : "Révolut,SEPA,Strike,Bizum" (sans les guillemets). Si vous êtes indifférent à la méthode de paiement fiat, envoyez-la simplement : "Any" (sans guillemets).

![image](https://user-images.githubusercontent.com/47178010/170115693-7378b25a-93af-4ad3-ad7e-d0185364003d.png)

Une fois que tout cela a été signalé, votre alerte est configurée correctement. Dans le cas où un ordre est posté sur RoboSats qui répond à vos conditions, @RobosatsAlertBot vous notifiera via Telegram avec un lien vers la liste des ordres afin que vous puissiez procéder à votre transaction si vous le souhaitez. Vous trouverez ci-dessous un exemple d'alerte.

![image](https://user-images.githubusercontent.com/47178010/170116003-6316c10a-0c6f-44bc-8eb6-17a1df8e1f3f.png)

## **À quelle fréquence RoboSats consulte-t-il la liste de commandes ?**

RoboSats vérifie la liste des ordres toutes les minutes ; cela signifie que le temps maximum qui s'écoulera entre la publication d'un ordre qui répond à vos conditions et la notification de @RobosatsAlertBot sera de 1 minute.

## **Une fois que le robot @RobosatsAlertBot m'a notifié, puis-je réutiliser la même alerte ?**

Oui, une fois que @RobosatsAlertBot vous a notifié, votre alerte reste désactivée. Il vous suffit de la réactiver et @RobosatsAlertBot vous notifiera à nouveau lorsqu'un ordre répondra à vos conditions.

## **Qu'est-ce qui peut mal tourner ?**

Il n'y a rien de mal, mais il peut y avoir des déceptions. Il est possible que les conditions de votre alerte soient des conditions partagées par de nombreux utilisateurs, ce qui signifie qu'il y a de nombreux utilisateurs qui veulent trouver une transaction avec les mêmes conditions (ou des conditions très similaires) que vous. Cela signifie qu'un ordre avec des conditions très restrictives peut rester très peu de temps dans la liste des ordres parce qu'un autre utilisateur l'accepte avant vous, c'est pourquoi le créateur du bot recommande de toujours l'avoir avec soi.

## **PERTE DE VIE PRIVÉE**

RoboSats est un échange axé sur la protection de la vie privée des utilisateurs, car aucune information personnelle n'est requise. L'installation optimale de RoboSats se fait par le biais d'une méthode d'accès recommandée, comme le navigateur privé TOR.

Dès que vous quittez TOR pour une application tierce (c'est-à-dire Telegram), vous perdez votre vie privée.

Ce robot, comme tous les autres, stockera votre identifiant Telegram car il est nécessaire pour contacter l'utilisateur. Il stockera également les données de votre alerte.

En d'autres termes, le robot saura que l'utilisateur 123456789 a lancé une alerte pour acheter des Sats en EUROS avec une prime maximale de 5 % via Bizum, PayPal ou Strike.

Il est important de toujours garder cela à l'esprit. Certains sont prêts à sacrifier un certain degré de confidentialité en faveur de notifications pratiques, mais vous devez prendre en compte les compromis associés à la révélation des informations susmentionnées. La vie privée est ce que nous choisissons de révéler de manière sélective et c'est en fin de compte à l'utilisateur final de décider du degré de confidentialité qu'il souhaite donner à son expérience RoboSats.

{% include improve_fr %}
