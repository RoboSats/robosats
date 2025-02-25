---
layout: single
title: Maker and Taker Bonds
permalink: /docs/pt/bonds/
toc: true
toc_sticky: true
sidebar:
  title: '<img id="side-icon-verybig" src="/assets/vector/ticket-simple.svg"/>Bonds'
  nav: docs
src: "_pages/docs/pt/03-understand/04-bonds.md"
---

O depósito de garantia (bond) é um pequeno depósito que o usuário “bloqueia” e que será desbloqueado após a conclusão da negociação; no entanto, os usuários podem perder a garantia se não cumprirem as obrigações do contrato.

O processo de negociação de RoboSats utiliza depósitos de garantia para incentivar tanto o criador da ordem quanto o tomador a seguir as regras e não enganar seu companheiro robô. Mais especificamente, as garantias são [faturas bloqueadas](https://github.com/lightningnetwork/lnd/pull/2022) utilizando a Rede Lightning; é a tecnologia que torna possível o RoboSats! Consulte [Entender > Custódia de Operações > O que é uma fatura retida?](/docs/pt/escrow/#qué-es-una-factura-de-retención) para entender como funcionam na prática as faturas retidas.

Por padrão, a garantia é de 3% do valor total da transação. Alternativamente, os criadores de ordens podem personalizar esse valor de 2% a 15%. Garantias maiores significam mais "comprometimento" necessário para negociar.

A garantia não sai da sua carteira Lightning, mas observe que algumas carteiras funcionam melhor com RoboSats do que outras devido à natureza do mecanismo de fatura bloqueada da Lightning. Consulte [Entender > Wallets](/docs/pt/wallets/) para obter informações adicionais.

_Nota: A opção que permite "Tomadores sem garantia" está em desenvolvimento, mas não está disponível no momento._

## **Como bloquear uma garantia**

Primeiro, consulte [Entender > Carteiras](/docs/pt/wallets/) para encontrar carteiras compatíveis com Lightning que facilitarão o uso do RoboSats. Dependendo da carteira, a fatura pode aparecer como um pagamento em trânsito, congelado ou até mesmo como falha. Confira a lista de compatibilidade de carteiras!

Leia o guia correspondente, dependendo se você está criando ou aceitando a ordem:

- **Criador (Maker)**: Selecione "Criar ordem" e ajuste as condições da ordem conforme sua preferência. A ordem pode ser personalizada para exigir uma garantia diferente dos 3% padrão do valor total da transação, variando de 2% a 15%. Depois de concluído, confirme com "Criar ordem" e então use o código QR a seguir encontrado na "Caixa de Contrato" com sua carteira Lightning para bloquear a quantia indicada de satoshis para sua garantia. Você sempre pode cancelar a ordem não aceita enquanto estiver ativa, e a garantia será desbloqueada automaticamente; no entanto, se você tentar cancelar a ordem depois de ser aceita, perderá sua garantia. _Nota: Prepare-se com sua carteira com antecedência, pois a caixa de ordem expira em dez minutos._

- **Tomador (Taker)**: Explore o livro de ordens e encontre uma ordem de sua preferência. Simplesmente selecione a opção "Aceitar ordem" e então use o código QR a seguir encontrado na "Caixa de Contrato" com sua carteira Lightning para bloquear a quantia indicada de satoshis para sua garantia. _Nota: Prepare-se com sua carteira com antecedência, pois a caixa de ordem expira em quatro minutos. Se você não prosseguir, a ordem aceita volta a ser pública._

Depois que a transação for concluída e ambos os robôs estiverem satisfeitos, as garantias do criador e do tomador serão desbloqueadas. Tecnicamente, a garantia bloqueada nunca saiu da sua carteira; mas tenha cuidado, se você não seguir as obrigações do contrato tentando enganar ou cancelando unilateralmente, perderá seu depósito de garantia.

Sua carteira pode levar um tempo para mostrar os fundos como desbloqueados no saldo da sua conta. Algumas carteiras têm dificuldades em reconhecer a fatura bloqueada da Lightning como uma retenção temporária dos seus fundos.

Se o problema persistir, entre em contato com o grupo de Telegram do RoboSats; mas tenha cuidado com os golpistas que podem entrar em contato diretamente e se passar pelo pessoal do RoboSats. O pessoal do RoboSats nunca entrará em contato com você primeiro. Consulte [Contribuir > Código > Canais de Comunicação](/contribute/code/#communication-channels) para conhecer os grupos de Telegram disponíveis.

## **Perder sua garantia**

Basicamente, existem cinco condições que levam a um usuário a perder sua garantia:

- Enganar ou decepcionar seu par (e perder a disputa da ordem)

- Cancelar unilateralmente a ordem sem a colaboração do seu par

- Não apresentar a fatura de pagamento como comprador de bitcoin dentro do prazo estabelecido

- Não apresentar a garantia da transação como vendedor de bitcoin dentro do prazo estabelecido

- Não confirmar o recebimento do fiat como vendedor de bitcoin

Observe que você não perderá sua garantia como criador de pedidos se cancelar seu pedido _antes_ de ser recebido por um colega. As condições acima são expandidas em detalhes adicionais abaixo.

Se o prazo para apresentar a fatura (comprador) ou bloquear o escrow (vendedor) expirar, a ordem será cancelada e o robô que não cumpriu sua parte perderá a garantia. Metade da garantia perdida vai para o robô honesto como compensação pelo tempo perdido.

Portanto, não esqueça sua ordem, pois uma vez que um robô a aceita e bloqueia seu depósito de garantia, você pode perder sua garantia se o temporizador expirar. Certifique-se de lembrar sua ordem e fazer backup do token único do seu robô!

Se você receber fiat mas não clicar em "Confirmar recebimento de fiat", corre o risco de perder sua garantia, pois uma disputa será aberta automaticamente e o pessoal do RoboSats verá que você não seguiu as regras do contrato.

Devido aos prazos envolvidos no processo de ordem, é recomendável utilizar métodos de pagamento instantâneo em fiat para ajudar a reduzir as chances de perder sua garantia. Consulte [Melhores Práticas > Métodos de Pagamentos](/docs/pt/payment-methods/) para obter informações adicionais.

Não é recomendado abrir uma disputa apenas para cancelar uma ordem, pois um dos dois negociantes perderá seu depósito de garantia, exceto em casos excepcionais que ficam a critério do pessoal do RoboSats.

Como nota final, se o RoboSats desaparecer repentinamente ou fechar, as garantia serão desbloqueadas automaticamente, pois tecnicamente nunca saíram da sua carteira.

## **Não tem bitcoin para as garantias?**

Como as garantias requerem uma fatura bloqueada da Lightning, o que você pode fazer se não tiver bitcoin desde o início? Embora a garantia geralmente seja apenas 3% do valor total da transação, isso apresenta uma barreira real para usar o RoboSats pela primeira vez se você não tiver satoshis disponíveis.

Atualmente, os tomadores sem garantia não estão disponíveis; no entanto, esteja ciente de que isso está em desenvolvimento! Os tomadores sem garantia apresentam um maior risco para o criador da ordem, já que o tomador não tem nada em jogo. Pode ser razoável esperar prêmios mais altos em ordens que permitam tomadores sem garantia.

Existem muitos aplicativos e serviços disponíveis onde você pode ganhar pequenas quantidades de bitcoin. O RoboSats não endossa um aplicativo específico, mas os usuários relataram sucesso com aplicativos como [Stacker News](https://stacker.news/), [Fountain](https://www.fountain.fm/), [Carrot](https://www.earncarrot.com/), [THNDR](https://www.thndr.games/), etc.

Dado que a garantia é uma retenção temporária de seus fundos, você também pode pedir emprestado satoshis a um amigo apenas para o depósito de garantia. Depois que a garantia for desbloqueada de uma transação bem-sucedida, basta devolver os fundos ao seu amigo!

{% include improve_pt %}
