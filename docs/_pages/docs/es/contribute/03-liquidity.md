---
layout: single
title: "Abre un canal"
permalink: /contribute/es/liquidity/
sidebar:
  title: '<img id="side-icon-verybig" src="/assets/vector/circle-nodes.svg"/>LN liquidity'
  nav: contribute
toc: true
toc_sticky: true
src: "_pages/docs/es/contribute/03-liquidity.md"
---

Una forma de contribuir a RoboSats es abrir un canal al nodo de los coordinadores que suelas usar con más frecuencia y proporcionarles liquidez de salida. Basta con utilizar la plataforma para vender bitcoin y empujar la liquidez hacia el extremo de RoboSats.

## RoboSats no es un nodo de enrutamiento

RoboSats no es un nodo de enrutamiento típico de la Lightning Network. Un nodo destinado a enrutar pagos quiere canales equilibrados para maximizar las posibilidades de éxito en el reenvío de pagos. El nodo coordinador experimental RoboSats quiere maximizar:

1. La cantidad de HTLCs concurrentes pendientes sin fallo (bono/escrow).
2. La fiabilidad de los pagos entrantes que se abonan a los usuarios, independientemente del canal.

Dicho esto, no importa si toda la liquidez saliente del nodo coordinador experimental RoboSats se concentra en dos canales, siempre y cuando, cuando sea necesario pagar a un comprador, los nodos conectados encaminen eficazmente el pago. La concentración de liquidez en unos pocos canales sólo es un problema para los nodos mal conectados.

## Vendedores de Bitcoin que abren canales

Como ejemplo, un vendedor crea un nuevo nodo y su único canal es con el nodo coordinador experimental RoboSats. Empujan liquidez al extremo de RoboSats y, en consecuencia, el nodo coordinador experimental RoboSats no puede usar ese mismo canal para entregar los Sats al comprador. El canal se considera liquidez "sin salida".

Por este motivo, la apertura de un canal al nodo coordinador experimental RoboSats sólo es útil para el proveedor de liquidez (vendedor), ya que no incurre en gastos de enrutamiento y tiene una mayor fiabilidad de enrutamiento. Cuando un canal está completamente saturado (y el vendedor ya no puede empujar liquidez), entonces se cierra y los Sats se utilizan para abrir canales de salida a un peer fiable.

## Compradores de Bitcoin Abriendo Canales

Como comprador, abrir canales es menos útil. Hacerlo sólo mejoraría la fiabilidad. Tenga en cuenta que al abrir un canal directo con el nodo coordinador experimental RoboSats, ¡toda la liquidez estará de su lado! Por lo tanto, ese canal no sería útil para recibir un pago de inmediato.

{% include improve_es %}
