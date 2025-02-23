---
layout: single
title: Avatars robot
permalink: /docs/fr/robots/
toc: true
toc_sticky: true
sidebar:
  title: '<img id="side-icon-verybig" src="/assets/vector/robot.svg"/>Robots'
  nav: docs
src: "_pages/docs/fr/03-understand/02-robots.md"
---

Endossez l'identité d'un robot avec un jeton privé associé. Utilisez cette identité anonyme pour commencer à passer et à recevoir des commandes avec RoboSats ! Il n'est pas recommandé d'utiliser deux fois le même robot, car cela dégrade la vie privée de l'utilisateur.

Chaque nouvelle page web visitant le site de RoboSats présentera à l'utilisateur un avatar robot et un nom d'utilisateur générés automatiquement et de manière aléatoire afin de fournir une confidentialité par défaut à l'utilisateur.

Par conséquent, assurez-vous de **conserver en toute sécurité le jeton privé** associé à cet avatar spécifique. Sans ce jeton, vous ne pourrez plus accéder à cet avatar unique ni le générer à nouveau.

N'oubliez pas d'être concis mais courtois lorsque vous discutez avec vos collègues robots !

## **Pourquoi la protection de la vie privée ?**

La priorité donnée à la protection absolue de la vie privée de l'utilisateur offre le plus haut degré de protection. Les données des utilisateurs sont particulièrement propices à l'exploitation par les pirates informatiques et les cybercriminels ; pour éviter de tels scénarios, RoboSats ne collecte aucune donnée sur les utilisateurs.

Les plateformes qui collectent des informations personnelles présentent un risque réel pour l'utilisateur. Au cours de la dernière décennie, des milliards d'informations sensibles d'utilisateurs ont été divulguées à cause d'une combinaison de piratages et d'une mauvaise sécurité des plateformes.

La confidentialité est extrêmement importante pour RoboSats ; cependant, vos transactions sur RoboSats ne sont privées que dans la mesure où vous les rendez privées. Les utilisateurs doivent veiller à utiliser des méthodes de préservation de la vie privée lorsqu'ils interagissent avec RoboSats et leurs pairs robots. Reportez-vous à [Guide de démarrage rapide > Access](/docs/fr/access/) pour plus d'informations.

## **Réutilisation du robot : non recommandée**

Il est fortement recommandé de générer un nouveau robot aléatoire après chaque transaction afin d'améliorer votre confidentialité. La réutilisation d'un robot peut potentiellement exposer les informations de l'utilisateur puisque plusieurs ordres peuvent être liés à un seul avatar.

Le jeton unique associé à chaque avatar n'est pas destiné à être réutilisé par les robots ; il est plutôt destiné à servir de mot de passe pour accéder aux ordres en cours et résoudre les litiges actifs. Conservez ce jeton en lieu sûr ou vous risquez de ne plus jamais avoir accès à l'avatar de ce robot.

La récupération d'un robot est facile : il suffit de remplacer le jeton généré aléatoirement par votre jeton sauvegardé et de sélectionner "Générer un robot" pour récupérer le profil de votre robot.

Bien que nous puissions nous attacher à notre identité de robot unique pendant la courte période où une commande est passée ou prise, il est préférable de passer à un nouvel avatar. Pensez à tous les bons moments que vous passerez à faire et à prendre des commandes avec de nouvelles identités de robot !

Comme nous l'avons dit, la réutilisation d'un robot est déconseillée et peut, à terme, porter atteinte à la vie privée de l'utilisateur.

## **Processus de construction du robot**

RoboSats fait référence au code source de RoboHash.org comme moyen rapide de générer de nouveaux avatars pour un site web. Votre robot est "construit" à partir d'un jeton unique, une chaîne aléatoire de caractères (ZD3I7XH...), où seuls ces caractères, dans leur ordre exact, peuvent générer l'avatar exact du robot.

Un jeton est automatiquement généré pour vous à chaque fois que vous accédez à la page web de RoboSats. Les utilisateurs peuvent générer à nouveau autant de jetons aléatoires qu'ils le souhaitent, ce qui est fortement encouragé après chaque échange. Vous pouvez saisir un jeton d'entropie suffisante créé par vous-même au lieu de vous fier à RoboSats ; mais comme vous êtes le seul à connaître le jeton, il est sage de sauvegarder votre jeton en toute sécurité.

Sous le capot, la création d'un jeton dans la page d'accueil de RoboSats est le processus de génération et de cryptage de votre clé privée PGP avec votre jeton du côté client de l'application. L'utilisateur demande au nœud RoboSats un avatar et un surnom générés à partir de votre jeton chiffré et vous renvoie l'identité du robot correspondant. Voir le graphique ci-dessous :

![RoboSats Identity Generation Pipeline](https://learn.robosats.org/assets/images/private/usergen-pipeline.png)

## **Communiquer avec vos robots partenaires**

Votre identité peut être cachée par celle d'un robot, mais ce n'est pas une excuse pour être un partenaire difficile pendant les transactions. Les autres robots ont aussi des sentiments de robots ! Soyez succinct et respectueux lorsque vous discutez avec vos partenaires ; cela rendra votre expérience sur RoboSats plus facile et plus fluide. Ne partagez jamais plus d'informations que ce qui est absolument nécessaire pour compléter l'ordre.

Toutes les communications sur RoboSats sont chiffrés par PGP. Les messages de discussion chiffrés de pair-à-pair sont signés par chaque robot partenaire, ce qui prouve que personne n'a intercepté la discussion et est utile pour résoudre les litiges. Reportez-vous à [Bonnes pratiques > Chiffrement PGP simplifié](/docs/fr/pgp-encryption/) pour plus d'informations.

{% include improve_fr %}
