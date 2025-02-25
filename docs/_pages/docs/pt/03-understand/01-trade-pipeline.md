---
layout: single
classes: wide
title: "Trade Pipeline"
permalink: /docs/pt/trade-pipeline/
sidebar:
  title: '<img id="side-icon-verybig" src="/assets/vector/timeline.svg"/>Trade Pipeline'
  nav: docs
src: "_pages/docs/pt/03-understand/01-trade-pipeline.md"
---

O trade pipeline do RoboSats é direto e simplificado. O fluxo geral de ordens ao fazer e receber ordens é apresentado abaixo em etapas numéricas e em um fluxograma.

Alice quer comprar Sats em maneira privada. Isto é passo a passo o que acontece quando ela compra usando RoboSats:

## Fluxo de ordens em etapas numéricas

1. Alice gera um avatar (AdequateAlice01) usando seu token aleatório privado.
2. Alice armazena o token com segurança caso precise recuperar AdequateAlice01 no futuro.
3. Alice faz uma nova ordem e bloqueia uma fatura de pequena retenção para publicá-la (maker bond).
4. Bob quer vender Sats, vê o pedido de Alice nas ofertas e aceita.
5. Bob escaneia uma fatura de pequena retenção como seu título de tomador (taker bond). O contrato é definitivo.
6. Bob publica os Sats negociados com uma hold invoice. Enquanto Alice envia sua fatura de pagamento.
7. Em um bate-papo privado, Bob diz a Alice como enviar fiat para ele.
8. Alice paga a Bob e eles confirmam que o fiat foi enviado e recebido.
9. A hold invoice de Bob é cobrada e os Sats são enviados para Alice.
10. Os títulos (bonds) de Bob e Alice retornam automaticamente, desde que cumpram as regras.
11. Os títulos seriam cobrados (perdidos) em caso de cancelamento unilateral ou fraude (disputa perdida).

## Fluxo de ordens no fluxograma

<div align="center">
    <img src="/assets/images/trade-pipeline/buyer-en.jpg" width="650"/>
</div>

<div align="center">
    <img src="/assets/images/trade-pipeline/seller-en.jpg" width="650"/>
</div>

{% include improve_pt %}
