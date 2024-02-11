---
layout: single
title: Limites de intercambio
permalink: /docs/es/limits/
sidebar:
  title: '<img id="side-icon-verybig" src="/assets/vector/gauge-high.svg"/>Limites'
  nav: docs
src: "_pages/docs/es/03-understand/08-limits.md"
---

RoboSats se basa en Lightning Network, una red de micropagos. Por lo tanto, las cantidades enviadas y recibidas a través de la Red Lightning deben ser lo suficientemente pequeñas como para encontrar con éxito una ruta adecuada.

El tamaño máximo de una operación es {{site.robosats.max_trade_limit}} Sats y el tamaño mínimo es {{site.robosats.min_trade_limit}} Sats.

Sin embargo, no hay límites a la cantidad de operaciones que puede realizar/tomar en RoboSats (aunque se recomienda encarecidamente limitar una orden por identidad de robot). Genere y gestione varias identidades de robot mediante la función Garaje de robots. Sólo asegúrese de hacer una copia de seguridad de sus tokens de robot secretos.

## **¿Por qué tener límites?**

La razón de tener un límite en la cantidad de Sats que puede enviar / recibir con RoboSats se debe a minimizar los fallos de enrutamiento Lightning. Esto hace que la experiencia del usuario final con RoboSats mucho más suave para asegurar que los fondos se pagan de forma fiable.

Cuantos más Sats intentes enviar a través de LN, más difícil será encontrar un camino. Si no hubiera límites en un pedido, entonces un usuario podría intentar recibir sats que nunca encontrarán una ruta adecuada.

Para reducir los quebraderos de cabeza y agilizar la experiencia, se ha establecido un límite sensible a la realidad de la capacidad media de los canales de la Lightning Network. Por ejemplo, intentar recibir 10 millones de saturaciones puede no resultar rentable si la capacidad media de los canales de la red es [muy inferior a 10 millones de saturaciones](https://1ml.com/statistics).

{% include improve_es %}
