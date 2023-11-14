---
layout: single
title: Limites d'échange
permalink: /docs/limits/
toc: true
toc_sticky: true
sidebar:
  title: '<img id="side-icon-verybig" src="/assets/vector/gauge-high.svg"/>Limites'
  nav: docs
src: "_pages/docs/03-understand/08-limits.md"
---

RoboSats est construit sur le Réseau Lightning, un réseau de micropaiement. Par conséquent, les montants envoyés et reçus sur le Réseau Lightning doivent être suffisamment petits pour trouver un itinéraire approprié.

La taille maximale d'une transaction est {{site.robosats.max_trade_limit}} Sats et la taille minimale d'une transaction unique est {{site.robosats.min_trade_limit}} Sats.

Cependant, il n'y a pas de limites à la quantité de transactions que vous pouvez faire/prendre sur RoboSats (bien qu'il soit fortement recommandé de limiter un ordre par identité de robot). Générez et gérez plusieurs identités de robot à l'aide de la fonction Robot Garage. Veillez simplement à sauvegarder en toute sécurité vos jetons de robot secrets !

## **Pourquoi avoir des limites ?**

La raison pour laquelle la quantité de Sats que vous pouvez envoyer/recevoir avec RoboSats est limitée est de minimiser l'échec de routage Lightning. Cela rend l'expérience de l'utilisateur final avec RoboSats beaucoup plus fluide afin de s'assurer que les fonds sont payés de manière fiable.

Plus vous essayez de faire passer de sats par LN, plus il est difficile de trouver un chemin. S'il n'y avait pas de limites à une commande, un utilisateur pourrait essayer de recevoir des sats qui ne trouveraient jamais un chemin approprié.

Afin de réduire les prises de tête et de simplifier l'expérience, une limite a été mise en place, qui tient compte de la capacité moyenne des canaux du Réseau Lightning. Par exemple, essayer de recevoir 10M Sats peut ne jamais payer lorsque la capacité moyenne des canaux du réseau est [bien en dessous de 10M Sats](https://1ml.com/statistics).

{% include improve %}
