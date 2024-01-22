---
layout: single
title: P2P Swaps
permalink: /docs/es/swaps/
sidebar:
  title: '<img id="side-icon-verybig" src="/assets/vector/arrow-right-arrow-left.svg"/>Swaps'
  nav: docs
src: "_pages/docs/es/03-understand/09-swaps.md"
---

Además de los diversos métodos de pago fiat disponibles, hay algo
llamado *Destino Swap* también. Estos son métodos de pago, pero en BTC, en una red que no sea Lightning Network. Esto es útil si deseas intercambiar satoshis lightning por satoshis on-chain (o en cualquier otra red como Liquid BTC si lo prefiere). Este proceso de intercambio de satoshis en la red Lightning a cambio de satoshis on-chain generalmente se denomina "swap".

La siguiente tabla hace facil entender el swap en términos de "comprador" y "vendedor":

| Lado      | Vende       | Recibe     | Tipo Swap |
|-----------|-------------|------------|-----------|
| Vendedor  | ⚡BTC        | 🔗 BTC     | Swap out  |
| Comprador | 🔗 BTC      | ⚡BTC       | Swap in   |


### Como hacer un swap P2P

Recuerda, en RoboSats siempre compras o vendes satoshis de Lightning. Si deseas recibir satoshis a través de Lightning a cambio de tus satoshis on-chain, crearás una orden de **COMPRA**. Por el contrario, si quieres recibir satoshis on-chain a cambio de tus satoshis Lightning, crearás una orden de *VENTA*.

En la pantalla de crear orden, selecciona "BTC" del menudo desplegable de moneda:

<div align="center">
    <img src="/assets/images/understand/btc-swap-in-dropdown.png"/>
</div>

Selecciona el destino del Swap en el menú desplegable:

<div align="center">
    <img src="/assets/images/understand/swap-destination-selection.png"/>
</div>

A continuación, establece la cantidad o rango por el que desea hacer el swap. Recuerda que si tu es un vendedor, entonces recibirás BTC on-chain; si eres el comprador, enviarás BTC on-chain:

<div align="center">
    <img src="/assets/images/understand/amount-swap.png"/>
</div>

Luego simplemente crea la orden y espera a que un tomador tome la orden. En la sala de chat avanza como de costumbre, pero esta vez el método de pago es simplemente una dirección de bitcoin on-chain.

### Cantidad de orden y comisiones mineras

La cantidad a enviar on-chain debe ser del valor exacto mencionado en la orden. El que envía sats on-chain debe cubrir las tarifas de minería (tarifas de transacción on-chain).

### Que prima debería poner?

En el caso de los swaps, es mejor mantener la prima al 0%, pero si deseas hacer la oferta a tu contraparte, puedes seguir las siguientes recomendaciones:

1. Si eres el **vendedor** - estarás **recibiendo** BTC on-chain; ajustar la prima un poco por debajo de 0% (ej. -0.1%, -0.5%) hará tu oferta mas atractiva. El tomador ya paga un 0.125% de comisión en el intercambio y además tiene que pagar las tarifas de minado para enviar BTC on-chain.
2. Si eres el **comprador** - estarás **enviando** BTC on-chain; ajustar la prima un poco por encima de 0% (ej. 0.1%, 0.5%) hará tu oferta mas atractiva.

Estas son solo recomendaciones generales sobre qué prima configurar para comenzar con swaps, pero al final del día, el precio es el que establece el mercado, por lo que experimenta y comprueba lo que funciona para ti.
