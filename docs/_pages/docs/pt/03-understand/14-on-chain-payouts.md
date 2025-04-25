---
layout: single
title: Pagamentos on-chain
permalink: /docs/pt/on-chain-payouts/
sidebar:
  title: '<img id="side-icon-verybig" src="/assets/vector/link-solid.svg"/>Pagamentos on-chain'
  nav: docs
src: "_pages/docs/pt/03-understand/14-on-chain-payouts.md"
---

Embora o RoboSats seja uma exchange construída em cima da Rede Lightning, há uma opção para o comprador receber seus Satoshis para um endereço de bitcoin on-chain. Isso é referido como um pagamento on-chain ou, às vezes, como uma troca on-chain (não deve ser confundido com [Trocas P2P](/docs/swaps)).

Na interface do usuário, essa opção está disponível depois que o tomador bloqueou seu vínculo. Quando o status da ordem estiver em "Aguardando fatura do comprador", você deverá ver duas opções: "Lightning" e "Onchain".

<div align="center">
    <img src="/assets/images/understand/14-on-chain-payouts/contract-box-on-waiting-for-buyer-invoice.png"/>
</div>

Ao clicar na opção de endereço on-chain, você verá o seguinte:

<div align="center">
    <img src="/assets/images/understand/14-on-chain-payouts/on-chain-box.png"/>
</div>

Uma visão geral das taxas é exibida e você pode inserir um endereço de bitcoin on-chain para o pagamento, além de inserir as taxas de mineração. A _taxa de swap_ é uma taxa adicional que o RoboSats cobra para fazer o pagamento on-chain. Isso não inclui as taxas do tomador/criador. A taxa de Swap é cobrada sobre o montante após deduzir as taxas do tomador/criador.

Além da taxa de swap, há também a taxa de mineração para a transação on-chain. Você pode escolher a taxa de mineração que atende às suas necessidades do momento. A entrada da _taxa de mineração_ permite que você escolha a taxa de transação on-chain em sats/vbyte.

Se o endereço on-chain for válido, então o pedido avança para a próxima etapa como de costume. No final, se a negociação foi bem-sucedida, você deve ver uma tela algo assim com o ID da transação do pagamento:

<div align="center">
    <img src="/assets/images/understand/14-on-chain-payouts/successful-trade-on-chain.png"/>
</div>

### Taxas de pagamento on-chain

As taxas de pagamento on-chain (também conhecidas como taxas de swap) mudam de tempos em tempos. Elas podem variar de 1% a 10%. Para obter as taxas de pagamento on-chain atuais, você pode verificar o resumo da exchange clicando no botão "%" na tela inicial:

<div align="center">
    <img src="/assets/images/understand/14-on-chain-payouts/exchange-info-icon.png"/>
</div>

O diálogo do resumo da exchange exibe o valor atual das taxas de pagamento on-chain:

<div align="center">
    <img src="/assets/images/understand/14-on-chain-payouts/exchange-summary.png"/>
</div>

{% include improve_pt %}
