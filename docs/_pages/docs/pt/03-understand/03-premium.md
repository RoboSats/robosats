---
layout: single
title: Prêmio sobre o mercado
permalink: /docs/pt/premium/
toc: true
toc_sticky: true
sidebar:
  title: '<img id="side-icon-verybig" src="/assets/vector/percent.svg"/>Prêmio'
  nav: docs
src: "_pages/docs/pt/03-understand/03-premium.md"
---

O prêmio associado ao seu pedido peer-to-peer é a diferença de preço que existe acima ou abaixo da taxa atual do bitcoin-fiat encontrada em suas exchanges centralizadas típicas.

Ao navegar na livro de ofertas, o preço de troca de bitcoin das ordens ao vivo é automaticamente ajustado para incluir o prêmio correspondente do pedido.

Na parte inferior da interface da exchange está o preço prêmio do mercado nas últimas 24 horas, geralmente em torno de +5%, e é esperado em um ambiente privado ponto a ponto.

Escolha um prêmio competitivo e incentive outros robôs a fornecer liquidez ao mercado com seus bitcoins e moedas fiduciárias anônimas!

## **Escolhendo um prêmio**

Crie uma ordem e insira o "Prêmio sobre Mercado (%)", que pode ser um valor percentual positivo, negativo ou zero. Por padrão, o preço do prêmio do pedido é relativo à taxa de mercado fiduciária do Bitcoin.

Ou, em vez da configuração padrão, os criadores de ordens podem selecionar o método de precificação explícito (_ver nota de rodapé_) escolhendo uma quantidade exata de Sats para trocar pelo valor fiduciário fornecido.

Ao selecionar um prêmio, considere os métodos de pagamento e o valor que você escolheu; Estes, juntamente com o bônus desejado, competirão com outras ordens em tempo real para incentivar e atrair outros robôs. Experimente diferentes prêmios para encontrar aquele que melhor se adapta aos suas ordens específicas.

Se você comprar bitcoin, um prêmio mais alto aumenta as chances de um vendedor aceitar a ordem; Ou, se você vender bitcoin, um prêmio mais alto diminuirá as chances de um comprador aceitar a ordem. Como criador da ordem, você verá como o prêmio da sua ordem se compara a outras ordens ativas na mesma moeda.

Resumindo:

- **Prêmio positivo**: negocie BTC a um preço acima do preço médio em exchanges centralizadas.
- **Prêmio negativo**: negocie BTC com desconto em relação ao preço médio em exchanges centralizadas.
- **Prêmio Zero**: negocie BTC sem diferença de preço em relação ao preço médio em exchanges centralizadas.
- **Método de precificação relativa**: deixe o preço prêmio se mover com a taxa de mercado bitcoin-fiat.
- **Método de precificação explícito**: defina um preço prêmio usando uma quantidade fixa de Sats.
- **Classificação Prêmio**: indica a classificação do prêmio do seu pedido entre todos os pedidos públicos com a mesma moeda, variando de 0% (menor prêmio) a 100% (maior prêmio).

Ao realizar uma ordem, no botão “Criar ordem”, você verá um resumo em texto com a descrição da sua ordem. Por exemplo, comprar bitcoin por US$ 100 com um prêmio de + 5,00% em relação ao preço de mercado seria: "Criar uma ordem de compra de BTC por US$ 100 com um prêmio de 5%".

Se for cometido um erro ao selecionar um prêmio ou se o pedido não for atendido dentro de sua preferência de tempo, o pedido poderá ser facilmente cancelado para fazer um novo.

Observe que o valor percentual está limitado a duas casas decimais. Além disso, formate valores decimais usando "." (ponto) e não "," (vírgula) como separador decimal.

Então... o que você _deve_ escolher como prêmio? De modo geral, a maioria dos robôs deseja que suas ordens sejam atendidas rapidamente. Uma abordagem simples ao decidir um prêmio competitivo é primeiro dar uma olhada na lista de ordens existente. Revise as ofertas existentes e observe os prêmios associados à moeda e método de pagamento desejados. Torne seu pedido mais desejável do que outros escolhendo um prêmio um pouco maior (comprador) ou menor (vendedor) do que qualquer prêmio de pedido existente associado à moeda e método de pagamento desejados.

Por exemplo, você (comprador) descobre que o prêmio mais alto entre as ordens existentes associados à moeda e método de pagamento desejados é de 5% de prêmio. Crie uma ordem exatamente com as mesmas condições, mas com um prêmio um pouco mais alto que o do seu concorrente. Agora, os vendedores que navegam na lista de ordens compararão as ordens e perceberão que seu pedido lhes dá mais dinheiro para seus preciosos Sats e ficarão mais tentados a aceitar sua ordem!

Mas seus competidores de ordens concorrentes podem perceber que sua ordem existente não tem mais o prêmio mais alto na lista de ordens e, assim, cancelar sua ordem para criar uma nova com um prêmio maior que o seu... Cuidado com uma guerra de prêmios!

_Nota de rodapé: o método de precificação explícito foi removido como opção por motivos técnicos, mas poderá voltar em atualizações futuras. Atualmente, o preço da ordem é relativo apenas à taxa de mercado._

## **Por que ter prêmios?**

Naturalmente, muitos robôs querem comprar bitcoin, mas poucos querem vender; posteriormente, há uma grande demanda para a troca privada de bitcoins. Os prêmios são simplesmente o subproduto dessa relação de oferta e demanda num mercado anônimo, peer-to-peer.

Portanto, os compradores devem ser realistas e ajustar os seus prêmios em conformidade; na verdade, os vendedores que negociam bitcoin por moeda fiduciária geralmente buscam um prêmio porque estão fornecendo liquidez com seu bitcoin e moeda fiduciária. Contudo, dependendo das condições de mercado, o premio pode tornar-se zero ou negativo.

A privacidade é valiosa tanto para o comprador quanto para o vendedor e sempre vale um prêmio, seja por causa do tempo, esforço ou risco; como tal, os utilizadores finais podem esperar um prêmio de acompanhamento nas suas negociações.

## **Informações adicionais**

O prêmio relativo refere-se às taxas de câmbio atuais das APIs públicas, especificamente aos preços blockchain.io e yadio.io. O preço médio do bitcoin na moeda selecionada é então calculado e exibido como a taxa de mercado após o seu prêmio.

O prêmio de 24 horas mostrado na interface da exchange é determinado pela mediana ponderada, e não pela média, de pedidos bem-sucedidos nas últimas 24 horas. Este método de cálculo é mais resistente a outliers e mais representativo do consenso do mercado peer-to-peer. Por outras palavras, o usuário final deve ver este valor como o prêmio que pode esperar pagar aproximadamente por uma ordem.

{% include improve_pt %}
