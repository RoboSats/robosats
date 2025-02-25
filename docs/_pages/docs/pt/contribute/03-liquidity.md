---
layout: single
title: "Abrir um canal"
permalink: /contribute/pt/liquidity/
sidebar:
  title: '<img id="side-icon-verybig" src="/assets/vector/circle-nodes.svg"/>LN liquidez'
  nav: contribute
toc: true
toc_sticky: true
src: "_pages/docs/pt/contribute/03-liquidity.md"
---

Uma maneira de contribuir para o RoboSats é abrindo um canal para o [nó coordenador experimental do RoboSats](https://amboss.space/node/0282eb467bc073833a039940392592bf10cf338a830ba4e392c1667d7697654c7e) e fornecendo ao nó liquidez de saída. Basta usar a plataforma para vender bitcoin e direcionar liquidez para o final do RoboSats!

## RoboSats não é um nó de roteamento

RoboSats não é um nó de roteamento típico da Rede Lightning. Um nó destinado ao roteamento de pagamentos deseja canais balanceados para maximizar a chance de roteamento bem-sucedido de pagamentos. O nó coordenador experimental do RoboSats deseja maximizar:

1. A quantidade de HTLCs pendentes simultâneos sem falha (bond/escrow).
2. A confiabilidade dos pagamentos recebidos sendo pagos aos usuários, independentemente do canal.

Com isso dito, não importa se toda a liquidez de saída do nó coordenador experimental do RoboSats está concentrada em dois canais, desde que, ao pagar um comprador, os nós conectados roteiem efetivamente o pagamento. A concentração de liquidez de alguns canais é apenas um problema para nodes mal conectados.

## Vendedores de bitcoin abrindo canais

Como exemplo, um vendedor cria um novo nó e seu único canal é com o nó coordenador experimental do RoboSats. Eles direcionam a liquidez para o final do RoboSats e, consequentemente, o nó coordenador experimental do RoboSats não pode usar o mesmo canal para entregar os Sats ao comprador. O canal é considerado liquidez "sem saída".

É por essa razão que abrir um canal para o nó coordenador experimental do RoboSats é útil apenas para o provedor de liquidez (vendedor), onde eles incorrem em zero taxas de roteamento e têm uma maior confiabilidade de roteamento. Quando um canal está completamente saturado (e o vendedor não pode mais direcionar liquidez), ele é então fechado e Sats são usados para abrir canais de saída para um par confiável.

## Compradores de bitcoin abrindo canais

Como comprador, abrir canais é menos útil. Fazê-lo só melhoraria a confiabilidade. Tenha em mente que ao abrir um canal direto com o nó coordenador experimental do RoboSats, toda a liquidez estará do seu lado! Portanto, esse canal não seria útil para receber um pagamento imediatamente.

{% include improve_pt %}
