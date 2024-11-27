---
layout: single
title: P2P Swaps
permalink: /docs/pt/swaps/
sidebar:
  title: '<img id="side-icon-verybig" src="/assets/vector/arrow-right-arrow-left.svg"/>Swaps'
  nav: docs
src: "_pages/docs/pt/03-understand/09-swaps.md"
---

Além dos vários métodos de pagamento em moeda fiduciária disponíveis, existem também algo chamado _Destinos Swap_. Estes são métodos de pagamento, mas para BTC, em uma rede diferente da Lightning Network.

Isso é útil se você quiser trocar Sats da Lightning por Sats on-chain (ou em qualquer outra rede como Liquid BTC, se preferir). Esse processo de trocar Sats na Rede Lightning por Sats on-chain geralmente é chamado de "swap".

A tabela abaixo simplifica o entendimento da troca em termos de "comprador" e "vendedor":

| Lado      | Envia  | Recebe | Tipo Swap |
| --------- | ------ | ------ | --------- |
| Vendedor  | ⚡BTC  | 🔗 BTC | Swap out  |
| Comprador | 🔗 BTC | ⚡BTC  | Swap in   |

### Como fazer uma swap P2P

Lembre-se, no RoboSats você sempre compra ou vende Sats da Rede Lightning. Se você deseja receber Sats pela Rede Lightning em troca de seus Sats on-chain, então você cria um pedido de **COMPRA**. Por outro lado, se você deseja receber Sats on-chain em troca de seus Sats da Rede Lightning, então crie um pedido de _VENDA_ .

Na tela de Criação de Pedido, selecione "BTC" no dropdown menu de moeda:

<div align="center">
    <img src="/assets/images/understand/btc-swap-in-dropdown.png"/>
</div>

Selecione seu Destino de Swap no dropdown menu:

<div align="center">
    <img src="/assets/images/understand/swap-destination-selection.png"/>
</div>

Em seguida, defina a quantidade ou intervalo que você deseja trocar. Lembre-se de que se você for um vendedor, receberá BTC on-chain e se for o comprador, enviará BTC da on-chain:

<div align="center">
    <img src="/assets/images/understand/amount-swap.png"/>
</div>

Em seguida, basta criar a ordem e aguardar que um tomador aceite o seu pedido. Na sala de bate-papo, você avança como de costume, mas desta vez o método de pagamento é simplesmente um endereço de bitcoin on-chain.

### Valor da ordem e taxas de mineração

O valor a ser enviado on-chain deve ser exatamente o valor mencionado no valor da ordem. O remetente dos sats on-chain precisa cobrir as taxas de mineração (taxas de transação on-chain).

### Que prêmio devo definir?

Em caso de swaps, é melhor manter o prêmio em 0%; mas se você quiser tornar a oferta um pouco mais atraente para a contraparte, então você pode seguir as recomendações abaixo:

1. Se você é o **vendedor** - você estará **recebendo** BTC on-chain; definir o prêmio ligeiramente abaixo de 0% (por exemplo, -0.1%, -0.5%) tornará sua oferta mais atraente. O tomador já paga {{site.robosats.taker_fee}}% de taxas na negociação, além de ter que pagar as taxas de mineração para enviar o BTC on-chain.

2. Se você é o **comprador** - você estará **enviando** BTC on-chain; definir o prêmio ligeiramente acima de 0% (por exemplo, 0.1%, 0.5%) tornará sua oferta mais atraente.

Essas são apenas recomendações gerais sobre qual prêmio definir para começar com os swaps, mas no final do dia, o preço é determinado pelo mercado... Então, experimente e veja o que funciona para você!
