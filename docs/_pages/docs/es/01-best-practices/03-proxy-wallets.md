---
layout: single
title: "Wallets Proxy"
permalink: /docs/es/proxy-wallets/
sidebar:
  title: '<img id="side-icon-verybig" src="/assets/vector/route.svg"/>Wallets Proxy'
  nav: docs
src: "_pages/docs/es/01-best-practices/03-proxy-wallets.md"
---

Recibir en la red lightning puede revelar información personal
por lo que es importante tener en cuenta algunas cosas.

Si tu nodo tiene canales públicos
cualquier factura que hagas revelará los UTXOs que se usaron para abrir esos canales.
Si esos UTXOs provienen de un intercambio KYC,
entonces cualquiera con acceso a la base de datos del intercambio
podrá vincular tus facturas lightning a tu identidad.
Incluso si utilizas UTXOs coinjoined para abrir tus canales,
o que arrancar su nodo exclusivamente mediante el pago de los canales de entrada,
las facturas siguen siendo potencialmente comprometedoras
ya que permiten a un atacante correlacionar diferentes
pagos para saber que van a la misma entidad (tú).
Además, si cierras esos canales
los UTXOs resultantes seguirán ligados a esas
transacciones.
Si tu nodo sólo tiene canales no anunciados
será más difícil encontrar tus UTXOs onchain
pero seguirás teniendo el problema de la
correlación de pagos.

Para pequeñas cantidades, el uso de una wallet proxy de custodia es una forma razonable de
mejorar su privacidad al recibir en la red lightning.
Recibir en una buena cartera de custodia sólo revelará los UTXO del custodio.
Para conocer información sobre ti,
el pagador de tus facturas tendría que confabularse con el custodio del monedero.

Una alternativa sin custodia es usar un servidor lnproxy
para envolver las facturas a su propio nodo y recibir a las facturas envueltas en su lugar.
Simplemente genere una factura a su nodo y péguela en una interfaz web lnproxy.
El servidor lnproxy devolverá una factura "envuelta" al nodo de lightning del servidor lnproxy.
La factura empaquetada debe tener la misma
descripción y hash de pago que la que pegó,
y un importe ligeramente superior para tener en cuenta el enrutamiento.
Debe verificar esto utilizando un descodificador de facturas como https://lightningdecoder.com .
Si los hash de pago coinciden, puede estar seguro de que el nodo lnproxy
no será capaz de robar sus fondos.
A continuación, sólo tiene que utilizar la factura envuelta en cualquier lugar donde hubiera utilizado la factura original.
factura original.
Para aprender cualquier información sobre usted de una factura envuelta,
un atacante tendría que confabularse con el servidor lnproxy que usaste.

{% include wip_es %}
