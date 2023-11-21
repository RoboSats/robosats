---
layout: single
title: "Accéder à RoboSats"
permalink: /docs/fr/access/
toc: true
toc_sticky: true
sidebar:
  title: '<img id="side-icon-verybig" src="/assets/vector/arrow-up-right-from-square.svg"/>Access'
  nav: docs
src: "_pages/docs/fr/00-quick-start/03-access.md"
---

## <img style='width:32px;height:32px' src='/assets/vector/tor.svg'/> En privé avec TOR

Un moyen sûr et très privé d'accéder à RoboSats est de passer par l'adresse Onion. Vous avez besoin d'un [navigateur TOR](/docs/fr/tor/) et d'un accès via le lien :

> [<b>robosats</b>6tkf3eva7x2voqso3a5wcorsnw34j<br/>veyxfqi2fu7oyheasid.onion](http://robosats6tkf3eva7x2voqso3a5wcorsnw34jveyxfqi2fu7oyheasid.onion/)

**Privé :** Votre connexion est chiffrée de bout-en-bout et relayée par plusieurs couches de nœuds, ce qui rend le suivi plus difficile.
{: .notice--primary}

## <img style='width:32px;height:32px' src='/assets/vector/tor.svg'/> En privé avec une application Android compatible avec TOR

RoboSats est accessible en toute sécurité et en privé via l'application Android. L'application est disponible sur la page GitHub de RoboSats :

> [Download the <b>latest release</b> of the universal RoboSats APK for Android](https://github.com/RoboSats/robosats/releases)

## <img style='width:36px;height:38px;-webkit-filter:grayscale(1);filter:grayscale(1);' src='/assets/vector/Itoopie.svg'/> En privé avec I2P
 est un autre moyen sûr et privé d'accéder à RoboSats. Vous avez besoin d'un [navigateur I2P](https://geti2p.com/en/download) et d'un accès via le lien :

> [<b>robosats.i2p</b>?i2paddresshelper=r7r4sckft<br/>6ptmk4r2jajiuqbowqyxiwsle4iyg4fijtoordc6z7a.b32.i2p](http://robosats.i2p?i2paddresshelper=r7r4sckft6ptmk4r2jajiuqbowqyxiwsle4iyg4fijtoordc6z7a.b32.i2p)

## <i class="fa-solid fa-window-maximize"></i> Sans sécurité en clair sur le net (Clearnet)

Il existe un moyen peu sûr de consulter la liste des transactions de RoboSats sans TOR, qui repose sur des services tor2web tiers. Avec cette URL, vous pouvez accéder à RoboSats à partir de n'importe quel navigateur, mais l'utilisation de cette URL est **fortement déconseillée !**.

> [unsafe.robosats.com](https://unsafe.robosats.com)

**Dangereux** Votre vie privée peut être compromise si vous utilisez l'URL non sécurisée du Clearnet dans un navigateur web normal.
{: .notice--secondary}

Si vous utilisez l'URL clearnet, vous devez supposer que vous êtes espionné. Cependant, la plupart des fonctions sensibles de RoboSats sont désactivées (par exemple, le chat P2P) afin que les utilisateurs ne puissent pas divulguer de données personnelles sensibles. N'utilisez l'URL clearnet que pour jeter un coup d'œil rapide à la liste des transactions. Ne l'utilisez jamais pour négocier ou vous connecter pour gérer des ordres actifs.

## <i class="fa-solid fa-person-dots-from-line"></i> URL Tout-en-un

Pour simplifier les choses, l'URL "robosats.com" a été créée pour servir de lien facile à retenir et tout-en-un pour les navigateurs. Si vous utilisez le navigateur TOR ou I2P, vous serez dirigé vers le site Onion ou I2P, respectivement. Dans le cas contraire, vous êtes dirigé vers le site Clearnet, qui n'est pas sûr.

> [<span style="font-size:larger;">robosats.com</span>](https://robosats.com)

## Autres

### Testnet

Vous pouvez vous entraîner et tester toutes les fonctionnalités de RoboSats sans risque de perdre de l'argent en utilisant [bitcoin testnet](https://en.bitcoin.it/wiki/Testnet). Tout ce dont vous avez besoin, c'est d'un portefeuille Lightning testnet et d'accéder à la plateforme testnet via le lien :

> [<b>robotest</b>agw3dcxmd66r4rgksb4nmmr43fh7<br/>7bzn2ia2eucduyeafnyd.onion](http://robotestagw3dcxmd66r4rgksb4nmmr43fh77bzn2ia2eucduyeafnyd.onion/)

Ou accéder de manière non sécurisée au pont testnet clearnet via le lien :

> [unsafe.testnet.robosats.com](http://unsafe.testnet.robosats.com)

### Miroirs Onion

Il est possible d'accéder à la plateforme **testnet** sur le port 8001 du réseau Onion principal :

> [robosats6tkf3eva7x2voqso3a5wcorsnw34j<br/>veyxfqi2fu7oyheasid.onion:8001](http://robosats6tkf3eva7x2voqso3a5wcorsnw34jveyxfqi2fu7oyheasid.onion:8001)

Il est également possible d'accéder à la plateforme **mainnet** sur le port 8001 du testnet Onion :

> [robotestagw3dcxmd66r4rgksb4nmmr43fh7<br/>7bzn2ia2eucduyeafnyd.onion:8001](http://robotestagw3dcxmd66r4rgksb4nmmr43fh77bzn2ia2eucduyeafnyd.onion:8001)

### Miroirs Clearnet

Il existe plusieurs services tor2web qui servent de miroirs en cas d'indisponibilité de l'un d'entre eux :

> [unsafe.robosats.com](https://unsafe.robosats.com/) <br/>
> [unsafe2.robosats.com](https://unsafe2.robosats.com/) <br/>
> [unsafe3.robosats.com](https://unsafe3.robosats.com/) <br/>
> [unsafe.testnet.robosats.com](http://unsafe.testnet.robosats.com/) <br/>
> [unsafe2.testnet.robosats.com](http://unsafe2.testnet.robosats.com/)

{% include improve %}
