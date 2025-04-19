---
layout: single
title: Preço das ordens
permalink: /docs/pt/prices/
sidebar:
  title: '<img id="side-icon-verybig" src="/assets/vector/bitcoin.svg"/>Preços'
  nav: docs
src: "_pages/docs/pt/03-understand/12-prices.md"
---

O preço é a taxa fiduciária pela qual o bitcoin foi negociado pela última vez em uma exchange. Em outras palavras, ele indica o preço de troca que um comprador e um vendedor estariam dispostos a aceitar para uma negociação subsequente entre bitcoin e moeda fiduciária.

Ao fazer uma ordem, existem dois métodos de precificação diferentes disponíveis:

- **Método de precificação Relativa**: permite que o preço da ordem se mova com o mercado ao longo do tempo (dinâmico).
- **Método de precificação Explícito**: define o preço da ordem usando uma quantidade fixa de satoshis (estático).

Ao navegar no livro de ordens, o preço bitcoin-fiat das ordens ativas que você vê é automaticamente ajustado para incluir o prêmio correspondente da ordem. Consulte [Entenda > Prêmio](/docs/pt/premium/) para informações adicionais sobre prêmios.

Se uma moeda fiduciária não estiver disponível na RoboSats, então é possível adicionar facilmente uma nova moeda abrindo uma solicitação de Pull Request no [GitHub](https://github.com/RoboSats/robosats)!

_\*\*O método de precificação explícita foi removido como opção por razões técnicas, mas poderia potencialmente retornar em atualizações futuras. Atualmente, a precificação de pedidos é apenas relativa à taxa de mercado._

## Preços na prática

Se a precificação da ordem for relativa, então a quantidade de satoshis sendo negociada em relação à taxa de câmbio fiat (vamos chamar de `trade_sats`) fica "travada" assim que o tomador da ordem bloqueia sua garantia. Até que a garantia do tomador seja bloqueado, o preço da ordem continua a se mover com o mercado ao longo do tempo.

Uma vez que a garantia do tomador é bloqueado para um pedido com preço relativo, a quantidade de satoshis sendo negociada é calculada da seguinte forma:

```
tarifa_premio = tarifa_CEX * (1 + (premio / 100))
trade_sats = quantidade / tarifa_premio
```

onde `trade_sats` são os satoshis a serem negociados, `premio` é o que o criador da ordem definiu durante a criação do pedido, e `tarifa_CEX` é o preço atual de troca de bitcoins dado a moeda que você está usando.

As taxas da plataforma (`fee_sats`) associadas ao seu pedido são calculadas usando a variável `trade_sats`:

- Para o criador:
  ````
  fee_fraction = 0.002 * 0.125
               = 0.00025 ==> {{site.robosats.maker_fee}}%%.
  fee_sats = trade_sats * fee_fraction
  ````
- Para o tomador:
  ````
  fee_fraction = 0.002 * (1 - 0.125)
               = 0.00175 ==> {{site.robosats.taker_fee}}%
  fee_sats = trade_sats * fee_fraction
  ````

onde `fee_fraction` se combina para uma taxa total compartilhada da plataforma de {{site.robosats.total_fee}}%; que é dividida em {{site.robosats.maker_fee}}% e {{site.robosats.taker_fee}}% para criador e tomador, respectivamente. Consulte [Entender > Taxas](https://learn.robosats.com/docs/fees/) para obter informações adicionais sobre as taxas.

RoboSats cobra as taxas no processo de depósito em garantia (`escrow_amount`) e no valor de pagamento (`payout_amount`) calculando o seguinte:

- Para o vendedor:
  ````
  escrow_amount = trade_sats + fee_sats
  ````
- Para o comprador
  ````
  payout_amount = trade_sats - fee_sats
  ````

Em essência, o RoboSats adiciona ao `escrow_amount`, subtrai do `payout_amount` e, dependendo se você é o tomador ou o criador do pedido, aplica os cálculos apropriados de `fee_fraction`.

Se a precificação do pedido for _explícita_, então a quantidade de satoshis sendo negociada é fixa, independentemente da taxa de câmbio de fiat atual (`CEX_rate`). Uma vez que a ordem é criada, os satoshis são bloqueados desde o início; no entanto, o prêmio associado se moverá com o mercado ao longo do tempo em vez do preço.

## **Como os exchanges centralizados determinam a taxa de mercado entre bitcoin-fiat**

A taxa de mercado global entre bitcoin e moedas fiduciárias é determinada através de um simples arbitragem de bitcoin; isso faz com que o preço do bitcoin em moeda fiduciária convirja para os preços vistos nos típicos exchanges centralizados.

Por exemplo, se a exchange "A" listar o bitcoin a $10.000 e a exchange "B" a $10.100 (uma diferença de $100), comprar bitcoin na exchange "A" e vendê-lo imediatamente na exchange "B" renderá um lucro de $100 (desconsiderando as taxas de negociação).

Essa ação fará com que o preço do bitcoin na exchange "A" suba e o preço do bitcoin na exchange "B" desça. No final, o preço em ambas as exchanges se aproximará e as oportunidades de arbitragem lucrativa diminuirão.

Países que não permitem que grandes exchanges operem em sua jurisdição muitas vezes verão o bitcoin sendo negociado a um preço mais alto, ou com um prêmio, devido à dificuldade para os arbitradores intervirem e se beneficiarem dessa diferença de preço.

## **De onde o RoboSats obtém informações sobre preços?**

O preço de troca de bitcoin no RoboSats é determinado pelos atuais tipos de câmbio das APIs públicas, especificamente os preços de blockchain.info e yadio.io. Dada a moeda que você está usando, o preço médio entre bitcoin e moeda fiduciária é calculado a partir dos atuais tipos de câmbio.

Os dados extraídos de blockchain.info e yadio.io são públicos e facilmente verificáveis por qualquer pessoa a qualquer momento.

Sinta-se à vontade para sugerir outros provedores de API. O RoboSats calcula o preço médio entre bitcoin e moeda fiduciária de todas as APIs referenciadas. Adicionar mais APIs levaria a preços mais robustos e precisos na plataforma.

## **Como adicionar moedas**

Todas as moedas disponíveis nas APIs yadio.io e blockchain.info devem estar disponíveis também no RoboSats.

Não está vendo uma moeda com a qual deseja operar? É muito fácil para os colaboradores adicionar uma nova moeda abrindo uma solicitação de Pull Request no [GitHub](https://github.com/RoboSats/robosats).

Primeiro, verifique o arquivo atual [currencies.json](https://github.com/RoboSats/robosats/blob/main/frontend/static/assets/currencies.json) para confirmar se a moeda que você está procurando realmente está faltando no RoboSats.

Se encontrar uma moeda faltando no RoboSats e ela estiver disponível em qualquer uma das duas APIs referenciadas, então você pode editar diretamente os arquivos currencies.json e [FlagsWithProps.tsx](https://github.com/RoboSats/robosats/blob/main/frontend/src/components/FlagWithProps/FlagWithProps.tsx).

Após merge da solicitação de Pull Request, a moeda adicionada estará disponível no RoboSats.

{% include wip_pt %}
