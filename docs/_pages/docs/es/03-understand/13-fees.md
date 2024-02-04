---
layout: single
title: Comisiones de la plataforma
permalink: /docs/es/fees/
sidebar:
  title: '<img id="side-icon-verybig" src="/assets/vector/hand-holding-hand.svg"/>Comisiones'
  nav: docs
src: "_pages/docs/es/03-understand/13-fees.md"
---

RoboSats cobra una comisión de {{site.robosats.total_fee}}% del importe total de la operación; esta comisión se distribuye entre el emisor y el receptor de la orden, que pagan {{site.robosats.maker_fee}}% y {{site.robosats.taker_fee}}%, respectivamente.

Las comisiones de la plataforma se resumen en la siguiente tabla para enfatizar que el porcentaje de comisión depende de si usted hace o toma la orden:

| Lado   | Maker                        | Taker                        |
|--------|------------------------------|------------------------------|
| Comprador  | {{site.robosats.maker_fee}}% | {{site.robosats.taker_fee}}% |
| Vendedor | {{site.robosats.maker_fee}}% | {{site.robosats.taker_fee}}% |

*Nota: Se puede incurrir en tarifas externas, como las tarifas de enrutamiento de Lightning Network y las tarifas de transacción en la cadena.

## **Costes de plataforma en la práctica**

La comisión total ({{site.robosats.total_fee}}%) se divide entre el creador y el receptor. El comprador paga una cantidad mayor ({{site.robosats.taker_fee}}%) que el vendedor ({{site.robosats.maker_fee}}%); esto está diseñado para animar a más vendedores y aumentar la liquidez disponible en la bolsa.

En la práctica, las comisiones se aplican cuando se presenta al usuario la presentación de la garantía de la operación (vendedor) o la factura de pago (comprador) después de que se bloquee la garantía del tomador.

Si el precio de la orden es *relativo*, entonces la cantidad de Sats que se negocia en relación con el tipo de cambio fiat (que llamaremos `trade_sats`) fluctúa hasta que se bloquea el bono tomador. En los casos de precios de órdenes *explícitos*, la cantidad de Sats que se negocia es fija. Consulte [Entender > Precios](/docs/es/prices/) para obtener información adicional sobre los métodos de fijación de precios relativos y explícitos.

Hasta que se bloquea el bono del tomador, el precio de la orden continúa moviéndose con el mercado a lo largo del tiempo. Una vez que el bono taker está bloqueado para una orden con precio relativo, la cantidad de Sats que se negocia se calcula de la siguiente manera:

````
tarifa_prima = tarifa_CEX * (1 + (prima / 100))
trade_sats = cantidad / tarifa_prima
````

donde `trade_sats` son los Sats que se van a negociar, `premium` es lo que el creador de la orden definió durante la creación de la orden, y `CEX_rate` es el precio actual de cambio de bitcoin dada la moneda que se está utilizando.

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

donde `fracción_de_tarifa` se combina para una tarifa de plataforma total compartida de {{site.robosats.total_fee}}%. Como se ha indicado anteriormente, el tomador paga una cantidad mayor ({{site.robosats.taker_fee}}%) que la que paga el creador ({{site.robosats.maker_fee}}%) para fomentar el crecimiento de la liquidez con más creadores de órdenes.

RoboSats cobra las comisiones en el proceso de depósito en garantía (`escrow_amount`) y factura de pago (`payout_amount`) calculando lo siguiente:
* Para el vendedor:
  ````
  escrow_amount = trade_sats + fee_sats
  ````
* Para el comprador
  ````
  payout_amount = trade_sats - fee_sats
  ````

En esencia, RoboSats añade a la `escrow_amount`, deduce de la `payout_amount`, y, dependiendo de si usted es el tomador de la orden o el ordenante, se aplica el apropiado `fee_fraction` cálculos.

## **¿Por qué hay comisiones?**

Las cuotas sirven para mejorar la experiencia del usuario final de la plataforma a través del desarrollo continuo, ofreciendo soporte multilingüe y elaborando guías para interactuar con la plataforma.

A su vez, las tarifas recompensan a los desarrolladores y colaboradores voluntarios de GitHub por completar tareas que son [elegibles para ganar bitcoin](https://github.com/users/Reckless-Satoshi/projects/2). ¡Compruébalo! Si ganas Sats por tus contribuciones, las tarifas en las que incurras al utilizar RoboSats estarán suficientemente cubiertas.

Implementar tarifas también ayuda a mitigar la oportunidad de ataques de denegación de servicio por parte de bots maliciosos que congestionan el coordinador RoboSats.

## **Tarifas externas**

Se puede incurrir en comisiones externas de la plataforma cuando se realizan pagos en la cadena (swaps en la cadena) y cuando se enrutan pagos a través de la Red Lightning.

Al elegir recibir bitcoin en la cadena, se muestra un resumen de la tarifa de minería (`fee_mining`) y la tarifa de intercambio (`fee_swap`). El `payout_amount` para recibir on-chain se calcula de la siguiente manera:

````
payout_amount = trade_sats - fee_sats - fee_mining - fee_swap
````

La tarifa de intercambio es una tarifa adicional que RoboSats cobra por hacer el pago on-chain y la tarifa de minería es la tarifa de la tarifa en la cadena en sats/vbyte que se puede personalizar para adaptarse a sus necesidades. Consulte [Entender > Pagos on-chain](/docs/es/on-chain-payouts/) para obtener información adicional sobre los pagos on-chain.

RoboSats aprovecha la velocidad y la seguridad de la Red Lightning, por lo tanto los pagos enviados a través de la Red Lightning pueden incurrir en gastos dependiendo de la "ruta" necesaria que el pago debe tomar.

Los usuarios pueden recibir pagos de forma privada a través de [lnproxy](https://lnproxy.org/), una sencilla herramienta de privacidad de la Red Lightning, pero su presupuesto de enrutamiento puede aumentar para cubrir las tarifas adicionales en las que incurre el servidor lnproxy. Consulte [Mejores Practicas > Proxy Wallets](/docs/es/proxy-wallets/) para obtener más información sobre la recepción privada.

El usuario tiene la opción de especificar el presupuesto de enrutamiento de Lightning Network, que puede ayudar a reducir los fallos de enrutamiento. Consulta [Acceso Rápido > Lightning Network](/docs/es/lightning/) para obtener más información sobre los fallos de enrutamiento.

{% include improve_es %}
