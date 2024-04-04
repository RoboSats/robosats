---
layout: single
title: Pagos On-chain
permalink: /docs/es/on-chain-payouts/
sidebar:
  title: '<img id="side-icon-verybig" src="/assets/vector/link-solid.svg"/>Pagos on-chain'
  nav: docs
src: "_pages/docs/es/03-understand/14-on-chain-payouts.md"
---

Aunque Robosats es un exchange construido sobre la red lightning, hay una opción para que el comprador reciba sus sats en una dirección BTC on-chain. Esto se conoce como pago on-chain o, a veces,intercambio a on-chain (que no debe confundirse con [Swaps P2P](/docs/es/swaps/es)). En la interfaz de usuario, esta opción está disponible después de que el tomador haya bloqueado su fianza.
Cuando el estado de la orden es "Esperando factura del comprador", deberías ver dos opciones: "Lightning" y "on-chain":

<div align="center">
    <img src="/assets/images/understand/14-on-chain-payouts/contract-box-on-waiting-for-buyer-invoice.png"/>
</div>

Cuando hagas click en la opción de dirección on-chain, veras lo siguiente:

<div align="center">
    <img src="/assets/images/understand/14-on-chain-payouts/on-chain-box.png"/>
</div>

Se muestra una descripción general de las tarifas y puedes ingresar una dirección bitcoin on-chain donde recibir el pago y también ingresa la tarifa de minería. La *Comisión de swap* es un comisión adicional que cobra Robosats por realizar el pago on-chain. Esto no incluye las comisiones del tomador/creador. La comisión del Swap se cobra sobre el importe después de deducir las comisiones de tomador/creador.

Además de la comisión de swap, también existe la tarifa de minería para la transacción on-chain. Puedes elegir la tarifa de minería que se adapte a tus necesidades. La entrada *Tarifa minera* te permite elegir la tarifa en sats/vbyte.

Si la dirección on-chain es válida, entonces la orden pasa a la siguiente etapa como habitualmente. Al final, si la operación es exitosa, debería ver una pantalla con el id de transacción de pago:

<div align="center">
    <img src="/assets/images/understand/14-on-chain-payouts/successful-trade-on-chain.png"/>
</div>

### Comisiones de pago on-chain

Las comisiones de pago on-chain (también conocidas como comisiones de swap) van cambiando de vez en cuando. Puede oscilar entre el 1% y el 10%. Para obtener las comisiones actuales on-chain, puedes consultar el resumen de intercambio haciendo clic en el botón "%" de la pantalla de inicio:

<div align="center">
    <img src="/assets/images/understand/14-on-chain-payouts/exchange-info-icon.png"/>
</div>

El cuadro de diálogo de resumen de intercambio muestra el valor actual de las comisiones de pago on-chain:

<div align="center">
    <img src="/assets/images/understand/14-on-chain-payouts/exchange-summary.png"/>
</div>

% include improve_es %}
