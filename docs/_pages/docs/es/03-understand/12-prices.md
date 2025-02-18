---
layout: single
title: Precio de las ordenes
permalink: /docs/es/prices/
sidebar:
  title: '<img id="side-icon-verybig" src="/assets/vector/bitcoin.svg"/>Precios'
  nav: docs
src: "_pages/docs/es/03-understand/12-prices.md"
---

El precio es la tarifa fiat a la que el bitcoin se negoció por última vez en un exchange. En otras palabras, indica el precio de intercambio que un comprador y un vendedor estarían dispuestos a aceptar para una operación posterior entre bitcoin y fiat.

Al hacer una orden, hay dos métodos diferentes de fijación de precios disponibles:
* **Método de fijación de precios relativo**: deja que el precio de la orden se mueva con el mercado a lo largo del tiempo (dinámico).
* **Método de fijación de precios explícito**: establece el precio de la orden utilizando una cantidad fija de satoshis (estático).

Cuando navegue por el libro de órdenes, el precio bitcoin-fiat de las órdenes en vivo que vea se ajustará automáticamente para incluir la prima correspondiente a la orden. Consulte [Entender > Prima](/docs/es/premium/) para obtener información adicional sobre las primas.

¡Si una moneda fiduciaria no está disponible en RoboSats, entonces se puede añadir fácilmente una nueva moneda mediante la apertura de una solicitud de extracción en [GitHub](https://github.com/RoboSats/robosats)!

***El método de precios explícitos se ha eliminado como opción por razones técnicas, pero podría volver en futuras actualizaciones. Actualmente, el precio de las órdenes sólo es relativo a la tarifa de mercado.

## Precios en la práctica

Si el precio de la orden es *relativo*, entonces la cantidad de satoshis que se negocian en relación con el tipo de cambio fiat (llamaremos `trade_sats`) se "bloquea" una vez que el tomador de la orden bloquea su bono. Hasta que se bloquea el bono del tomador, el precio de la orden sigue moviéndose con el mercado a lo largo del tiempo.

Una vez que el bono del tomador se bloquea para una orden de precio relativo, la cantidad de satoshis que se negocian se calcula de la siguiente manera:

````
tarifa_prima = tarifa_CEX * (1 + (prima / 100))
trade_sats = importe / tarifa_prima
````

donde `trade_sats` son los satoshis que se van a negociar, `prima` es lo que el creador de la orden definió durante la creación de la orden, y `tarifa_CEX` es el precio de cambio actual del bitcoin dada la divisa que se está utilizando.

Las comisiones de la plataforma (`fee_sats`) asociadas a tu orden se calculan usando la variable `trade_sats`:
* Para maker:
  ````
  fee_fraction = 0.002 * 0.125
               = 0.00025 ==> {{site.robosats.maker_fee}}%%.
  fee_sats = trade_sats * fee_fraction
  ````
* Para el tomador:
  ````
  fee_fraction = 0.002 * (1 - 0.125)
               = 0.00175 ==> {{site.robosats.taker_fee}}%
  fee_sats = trade_sats * fee_fraction
  ````

donde `fracción_de_tarifa` se combina para una tarifa total compartida de la plataforma de {{site.robosats.total_fee}}%; que se desglosa en {{site.robosats.maker_fee}}% y {{site.robosats.taker_fee}}% para maker y taker, respectivamente. Consulte [Entender > Tarifas](https://learn.robosats.org/docs/fees/) para obtener información adicional sobre las tarifas.

RoboSats cobra las tarifas en el proceso de depósito en garantía (`escrow_amount`) y la factura de pago (`payout_amount`) calculando lo siguiente:
* Para el vendedor:
  ````
  escrow_amount = trade_sats + fee_sats
  ````
* Para el comprador
  ````
  payout_amount = trade_sats - fee_sats
  ````

En esencia, RoboSats añade a la `escrow_amount`, deduce de la `payout_amount`, y, dependiendo de si usted es el tomador de la orden o el ordenante, aplica los cálculos apropiados `fee_fraction`.

Si el precio de la orden es *explícito*, entonces la cantidad de satoshis que se negocia es fija, independientemente del tipo de cambio fiat actual (`CEX_rate`). Una vez creada la orden, los satoshis están bloqueados desde el principio; sin embargo, la prima asociada se moverá con el mercado a lo largo del tiempo en lugar del precio.

## **Cómo determinan los exchange centralizados el tipo de mercado bitcoin-fiat**

La tarifa de mercado global bitcoin-fiat se determina a través de un simple arbitraje bitcoin; esto hace que el precio fiat de bitcoin converja hacia los precios que se ven en los intercambios centralizados típicos.

Por ejemplo, si el exchange "A" cotiza el bitcoin a 10.000 $ y el exchange "B" a 10.100 $ (100$ de diferencia), comprar bitcoin en el exchange "A" y venderlo inmediatamente en el exchange "B" le reportará un beneficio de 100 $ (sin tener en cuenta las comisiones de negociación).

Esta acción hará que suba el precio del bitcoin en el exchange "A" y que baje el precio del bitcoin en el exchange "B". Al final, el precio de ambos exchanges se aproxima y disminuyen las oportunidades de arbitraje rentable.

Los países que no permiten que grandes exchanges operen en su jurisdicción a menudo verán que el bitcoin se negocia a un precio más alto, o con una prima, debido a la dificultad para que los arbitrajistas intervengan y se beneficien de esa diferencia de precio.

## **¿De dónde obtiene RoboSats información sobre precios?**

El precio de intercambio de bitcoin en RoboSats está determinado por los tipos de cambio actuales de las API públicas, específicamente los precios de blockchain.info y yadio.io. Dada la moneda que estás utilizando, el precio medio de bitcoin-fiat se calcula a partir de los tipos de cambio actuales.

Los datos extraídos de blockchain.info y yadio.io son públicos y fácilmente verificables por cualquiera en cualquier momento.

No dude en sugerir otros proveedores de API. RoboSats calcula el precio medio bitcoin-fiat de todas las APIs referenciadas. Añadir más APIs conduciría a precios más robustos y precisos en la plataforma.

## **Cómo añadir divisas**

Todas las monedas disponibles en yadio.io y blockchain.info APIs deben estar disponibles en RoboSats también.

¿No ves una divisa con la que quieras operar? Es muy fácil para los colaboradores añadir una nueva moneda mediante la apertura de una solicitud de extracción en el [GitHub](https://github.com/RoboSats/robosats).

En primer lugar, compruebe el archivo actual [currencies.json](https://github.com/RoboSats/robosats/blob/main/frontend/static/assets/currencies.json) para verificar si la moneda que usted está buscando es, en efecto, falta en RoboSats.

Si encuentras una moneda que falta en RoboSats y también está disponible en cualquiera de las dos APIs referenciadas, entonces puedes editar directamente los archivos currencies.json y [FlagsWithProps.tsx](https://github.com/RoboSats/robosats/blob/main/frontend/src/components/FlagWithProps/FlagWithProps.tsx).

Después de fusionar el pull request, la moneda añadida estará disponible en RoboSats.

{% include wip_es %}
