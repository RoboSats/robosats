---
layout: single
title: "Wallets Proxy"
permalink: /docs/pt/proxy-wallets/
sidebar:
  title: '<img id="side-icon-verybig" src="/assets/vector/route.svg"/>Wallets Proxy'
  nav: docs
src: "_pages/docs/pt/01-best-practices/03-proxy-wallets.md"
---

Receber na Rede Lightning pode revelar informações pessoais
por isso é importante manter algumas coisas em mente.

Se o seu nó tiver canais públicos,
quaisquer faturas que você fizer revelarão os UTXOs que foram usados para abrir esses canais.
Se esses UTXOs vierem de uma exchange KYC,
então qualquer pessoa com acesso ao banco de dados da exchange
poderá vincular suas faturas lightning à sua identidade.
Mesmo se você usar UTXOs coinjoined para abrir seus canais,
ou você inicializa seu nó exclusivamente pagando por canais de entrada,
faturas ainda são potencialmente comprometedoras
uma vez que permitem que um invasor correlacione diferentes
pagamentos para saber que eles estão indo para a mesma entidade (você).
Além disso, se você fechar esses canais,
os UTXOs resultantes continuarão vinculados àqueles
transações.
Se o seu nó tiver apenas canais não anunciados
será mais difícil encontrar seus UTXOs on-chain
mas você ainda terá o problema de
correlação de pagamento.

Para pequenas quantias, usar uma carteira proxy de custódia é uma maneira razoável de
melhorar sua privacidade ao receber na rede lightning.
Receber em uma boa carteira de custódia revelará apenas os UTXOs do custodiante.
Para saber informações sobre você,
o pagador de suas faturas teria que conspirar com o custodiante da carteira.

Uma alternativa sem custódia é usar um servidor lnproxy
para agrupar as faturas em seu próprio nodo e receber as faturas agrupadas.
Basta gerar uma fatura em seu nodo e colá-la em uma interface web lnproxy.
O servidor lnproxy retornará uma fatura "embrulhada" para o nodo lightning do servidor lnproxy.
A fatura embalada deve ter a mesma
descrição e hash de pagamento daquele que você colou,
e um valor um pouco maior para levar em conta o roteamento.
Você deve verificar isso usando um decodificador de notas como https://lightningdecoder.com.
Se os hashes de pagamento corresponderem, você pode ter certeza de que o nó lnproxy
não será capaz de roubar seus fundos.
Em seguida, basta usar a fatura embrulhada em qualquer lugar onde você usaria a fatura original.
Para saber qualquer informação sobre você em uma fatura embrulhada,
um invasor teria que conspirar com o servidor lnproxy que você usou.

{% include wip_pt %}
