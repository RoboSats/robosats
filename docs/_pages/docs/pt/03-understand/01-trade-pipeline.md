---
layout: single
classes: wide
title: "Trade Pipeline"
permalink: /docs/es/trade-pipeline/
sidebar:
  title: '<img id="side-icon-verybig" src="/assets/vector/timeline.svg"/>Trade Pipeline'
  nav: docs
src: "_pages/docs/es/03-understand/01-trade-pipeline.md"
---

Alice quiere comprar Sats de manera privada. Esto es paso a paso lo que sucede cuando compra usando RoboSats.

## Flujo de órdenes en pasos numéricos

1. Alice genera un avatar (AdequateAlice01) usando su token aleatorio privado.
2. Alice almacena de forma segura el token para poder recuperar AdequateAlice01 en el futuro.
3. Alice hace una nueva orden y bloquea una factura retenida pequeña para publicarla (fianza de creador).
4. Bob quiere vender satoshis, ve el pedido de Alice en el libro y lo toma.
5. Bob escanea una factura retenida pequeña como su fianza de tomador. El contrato termina.
6. Bob publica una factura retenida con los satoshis a negociar. Mientras Alice envía su invoice de recibir.
7. En un chat privado, Bob le dice a Alice cómo enviarle el fiat.
8. Alice le paga a Bob, luego confirman que el fiat ha sido enviado y recibido.
9. Se cobra la factura retenida de Bob y se envían los satoshis a Alice.
10. Las fianzas de Bob y Alice regresan automáticamente, ya que cumplieron con las reglas.
11. Las fianzas serían cobradas (perdidas) en caso de cancelación unilateral o engaño (disputa perdida).

##  Flujo de ordenes en el organigrama

<div align="center">
    <img src="/assets/images/trade-pipeline/buyer-en.jpg" width="650"/>
</div>

<div align="center">
    <img src="/assets/images/trade-pipeline/seller-en.jpg" width="650"/>
</div>

{% include improve_es %}
