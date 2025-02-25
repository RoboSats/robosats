---
layout: single
title: Comissões da plataforma
permalink: /docs/pt/fees/
sidebar:
  title: '<img id="side-icon-verybig" src="/assets/vector/hand-holding-hand.svg"/>Comissões'
  nav: docs
src: "_pages/docs/pt/03-understand/13-fees.md"
---

RoboSats cobra uma taxa de {{site.robosats.total_fee}}% do montante total da negociação; essa taxa é distribuída entre o criador do pedido e o tomador do pedido, que pagam, respectivamente, {{site.robosats.maker_fee}}% e {{site.robosats.taker_fee}}%.

As taxas da plataforma estão resumidas na tabela abaixo para enfatizar que a porcentagem da taxa depende se você cria ou aceita a ordem

| Lado      | Criador                      | Tomador                      |
| --------- | ---------------------------- | ---------------------------- |
| Comprador | {{site.robosats.maker_fee}}% | {{site.robosats.taker_fee}}% |
| Vendedor  | {{site.robosats.maker_fee}}% | {{site.robosats.taker_fee}}% |

\*Nota: Taxas externas podem ser incorridas, como taxas de roteamento da Rede Lightning e taxas de transação on-chain.

## **Taxas da Plataforma na Prática**

A taxa total ({{site.robosats.total_fee}}%) é dividida entre o criador e o tomador. O tomador paga uma quantia maior ({{site.robosats.taker_fee}}%) do que o criador paga ({{site.robosats.maker_fee}}%); isso é projetado para incentivar mais criadores e, subsequentemente, aumentar a liquidez disponível na exchange.

Na prática, as taxas são aplicadas quando o usuário é apresentado com a submissão do escrow de negociação (vendedor) ou fatura de pagamento (comprador) após a garantia do tomador ser bloqueado.

Se a precificação do pedido for _relativa_, então a quantidade de Sats sendo negociada em relação à taxa de câmbio de fiat (vamos chamar de `trade_sats`) flutua até que a garantia do tomador seja bloqueado. Em casos de precificação _explícita_ do pedido, a quantidade de Sats sendo negociada é fixa. Consulte [Entender > Preços](/docs/pt/prices/) para obter informações adicionais sobre os métodos de precificação relativa e explícita.

Até que a garantia do tomador seja bloqueado, o preço da ordem continua a se mover com o mercado ao longo do tempo. Uma vez que a garantia do tomador seja bloqueado para um pedido com preço relativo, a quantidade de Sats sendo negociada é calculada da seguinte forma:

```
tarifa_premio = tarifa_CEX * (1 + (premio / 100))
trade_sats = quantidade / tarifa_premio
```

A onde `trade_sats` são os Satoshis que serão negociados, `premio` é o que o criador da ordem definiu durante a criação da ordem, e CEX_rate é o preço atual de câmbio do bitcoin dado a moeda que está sendo utilizada.

As comissões da plataforma (`fee_sats`) associadas ao seu pedido são calculadas usando a variável `trade_sats`:

- Para o criador:
  ````
  fee_fraction = 0.002 * 0.125
               = 0.00025 ==> {{site.robosats.maker_fee}}%
  fee_sats = trade_sats * fee_fraction
  ````
- Para o tomador:
  ````
  fee_fraction = 0.002 * (1 - 0.125)
               = 0.00175 ==> {{site.robosats.taker_fee}}%
  fee_sats = trade_sats * fee_fraction
  ````

onde `fee_fraction` se combina para uma taxa de plataforma total compartilhada de {{site.robosats.total_fee}}%. Como mencionado anteriormente, o tomador paga uma quantidade maior ({{site.robosats.taker_fee}}%) do que o criador paga ({{site.robosats.maker_fee}}%) para incentivar o crescimento da liquidez com mais criadores de ordens.

RoboSats cobra as comissões no processo de depósito em garantia (`escrow_amount`) e fatura de pagamento (`payout_amount`) calculando o seguinte:

- Para o vendedor:
  ````
  escrow_amount = trade_sats + fee_sats
  ````
- Para o comprador
  ````
  payout_amount = trade_sats - fee_sats
  ````

Em essência, o RoboSats adiciona ao `escrow_amount`, deduz do `payout_amount` e, dependendo se você é o tomador do pedido ou o criador do pedido, aplica os cálculos apropriados de `fee_fraction`.

## **Por que ter taxas?**

As taxas funcionam para melhorar a experiência do usuário final da plataforma através do desenvolvimento contínuo, oferecendo suporte multilíngue e criando guias para interagir com a plataforma.

As taxas, por sua vez, recompensam os desenvolvedores voluntários do GitHub e os colaboradores por completar tarefas que são [elegíveis para ganhar bitcoin](https://github.com/users/Reckless-Satoshi/projects/2). Confira! Se você ganhar Satoshis por suas contribuições, então as taxas incorridas ao usar o RoboSats seriam suficientemente cobertas!

A implementação de taxas também ajuda a mitigar a oportunidade de ataques de negação de serviço por bots maliciosos congestionando o coordenador do RoboSats.

## **Taxas externas**

Taxas externas da plataforma podem ser incorridas ao realizar pagamentos on-chain (swaps on-chain) e ao rotear pagamentos através da Rede Lightning.

Ao escolher receber bitcoin on-chain, uma visão geral da taxa de mineração (`fee_mining`) e taxa de swap (`fee_swap`) é exibida. O `payout_amount` para receber on-chain é calculado da seguinte forma:

````
payout_amount = trade_sats - fee_sats - fee_mining - fee_swap
````

A taxa de swap é uma taxa adicional que o RoboSats cobra para fazer o pagamento on-chain e a taxa de mineração é a taxa de transação na Blockchain em sats/vbyte que pode ser personalizada para atender às suas necessidades. Consulte [Entender > Pagamentos on-chain](/docs/pt/on-chain-payouts/) para obter informações adicionais sobre pagamentos on-chain.

O RoboSats aproveita a velocidade e segurança da Rede Lightning, portanto, pagamentos enviados através da Rede Lightning podem incorrer em taxas dependendo do "caminho" necessário que o pagamento deve percorrer.

Os usuários podem receber pagamentos de forma privada através do [lnproxy](https://lnproxy.org/), uma ferramenta simples de privacidade da Rede Lightning, mas seu orçamento de roteamento pode aumentar para cobrir taxas extras incorridas pelo servidor lnproxy. Consulte [Melhores Práticas > Proxy Wallets](/docs/pt/proxy-wallets/) para obter mais informações sobre recebimento privado.

O usuário tem a opção de especificar o orçamento de roteamento da Rede Lightning, o que pode ajudar a reduzir falhas de roteamento. Consulte [Acesse Rápido > Rede Lightning] para obter informações adicionais sobre falhas de roteamento.

{% include improve_pt %}
