---
layout: single
title: Limites da Exchange
permalink: /docs/pt/limits/
sidebar:
  title: '<img id="side-icon-verybig" src="/assets/vector/gauge-high.svg"/>Limites'
  nav: docs
src: "_pages/docs/pt/03-understand/08-limits.md"
---

RoboSats é baseado na Rede Lightning, uma rede de micropagamentos. Portanto, os valores enviados e recebidos pela Lightning Network devem ser pequenos o suficiente para encontrar com sucesso uma rota adequada.

O tamanho máximo de negociação única é de {{site.robosats.max_trade_limit}} Sats e o tamanho mínimo de negociação única é de {{site.robosats.min_trade_limit}} Sats.

No entanto, não há limites para a quantidade de negociações que você pode fazer/aceitar na RoboSats (embora seja altamente recomendável limitar um pedido por identidade de robô). Gere e gerencie várias identidades de robô usando o recurso Robot Garage. Apenas certifique-se de fazer backup com segurança de seus tokens de robô secreto!

## **Por que ter limites?**

O motivo de ter um limite na quantidade de Sats que você pode enviar/receber com a RoboSats é minimizar as falhas de roteamento da Lightning. Isso torna a experiência do usuário final com a RoboSats muito mais suave para garantir que os fundos sejam pagos de forma confiável.

Quanto mais Sats você tentar enviar pela LN, mais difícil será encontrar um caminho. Se não houvesse limites em uma ordem, então um usuário poderia tentar receber sats que nunca encontrariam uma rota adequada.

Para reduzir dores de cabeça e simplificar a experiência, um limite está em vigor que é sensato para as realidades da capacidade média de canal em toda a Lightning Network. Por exemplo, tentar receber 10M Sats pode nunca ser pago quando a capacidade média de canal da rede está [bem abaixo de 10M Sats](https://1ml.com/statistics).

{% include improve_pt %}
