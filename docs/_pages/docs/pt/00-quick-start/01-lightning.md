---
layout: single
title: "A rede Lightning"
permalink: /docs/pt/lightning/
toc: true
toc_sticky: true
sidebar:
  title: '<img id="side-icon-verybig" src="/assets/vector/bolt.svg"/>Rede Lightning'
  nav: docs
src: "_pages/docs/pt/00-quick-start/01-lightning.md"
---

A Rede Lightning, ou simplesmente referida como LN, é uma rede de micropagamentos off chain (camada dois) com baixas taxas e pagamentos instantâneos. RoboSats aproveita as vantagens da transação fora da cadeia para fornecer aos usuários uma experiência rápida e barata! Existem muitos conteúdos excelentes para aprender mais sobre como funciona a rede Lightning! Consulte ["Mastering the Lightning Network"](https://github.com/lnbook/lnbook) para ver um ótimo conteúdo.

RoboSats é experimental e, como tal, atualmente é suportado por um [nodo coordenador experimental](https://amboss.space/node/{{site.robosats.node_id}}). A próxima [atualização da federação](https://github.com/RoboSats/robosats/pull/601) permite que qualquer pessoa se torne um nodo coordenador e apoie a federação RoboSats, criando assim um livro de ordens descentralizada, mas unificada, composta por membros da federação competindo contra uns aos outros para atrair negociantes.

## **Usando a Rede Lightning**

Um pré-requisito para usar o LN é uma carteira. É altamente recomendável usar uma carteira sem custódia e de código aberto, onde somente você possui as chaves. As carteiras custodiais e de código fechado podem coletar informações sobre suas transações, informações de conta e, potencialmente, outros metadados. Lembre-se também de que quaisquer fundos mantidos no LN não são considerados armazenamento frio, mas estão em uma carteira “quente” conectada à internet. Para usar o RoboSats, é recomendado usar uma carteira que funcione bem com [hold de faturas lightning](/docs/pt/escrow/#qué-es-una-factura-de-retención), consulte [Entender > Wallets](/docs/pt/wallets/) para obter uma lista não exaustiva de compatibilidade de carteiras LN.

Ao usar Lightning, os pagamentos são feitos por meio de faturas. O comprador de Sats emite uma fatura para o vendedor de Sats, muitas vezes na forma de um código QR, solicitando ao vendedor o pagamento da quantia específica de Sats solicitada pela fatura. A fatura começa com o prefixo "lnbc" e pode ser decodificada para inspecionar seu conteúdo, como a quantidade de Sats enviados, o ID do nó para o qual os Sats foram enviados, quaisquer descrições fornecidas, etc.

A Rede Lightning, como está, não é completamente privada. Os usuários devem ter cuidado para não revelar informações sensíveis ao enviar e receber pagamentos na LN. Não confie em uma carteira de código fechado e custodial para respeitar suas informações; você pode obter um maior grau de privacidade se usar uma carteira sem custódia. Ademais, consulte [Práticas recomendadas > Wallets Proxy](/docs/pt/proxy-wallets/) para obter mais informações sobre questões de privacidade ao receber Sats pela LN.

## **"Travessuras" da Rede Lightning**

Embora seja muito raro, pode acontecer que algum nó de roteamento intermediário fique offline ou a transação fique “travada” durante a tentativa de pagamento. Informalmente chamados de travessuras da Rede Lightning, problemas como esse se devem às limitações atuais do LN. Isso se resolve sozinho após algumas horas ou no máximo alguns dias.

Ao comprar bitcoin (receber Sats na LN), a fatura que você fornece pode falhar no roteamento e exigir muitas tentativas. RoboSats tenta enviar o Sats três vezes e, se falhar, solicitará uma nova fatura para tentar novamente. Repita até que seja enviado! Durante este tempo, seus fundos são considerados seguros.

No caso de esse cenário, faça backup do token privado do seu robô e verifique o pagamento do sua ordem de tempos em tempos". Se o problema persistir, não hesite em entrar em contato com o [grupo de suporte no SimpleX](/contribute/code/#communication-channels) para que a equipe do RoboSats possa investigar.

{% include wip_pt %}
