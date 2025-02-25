---
layout: single
title: Avatares de robôs
permalink: /docs/pt/robots/
toc: true
toc_sticky: true
sidebar:
  title: '<img id="side-icon-verybig" src="/assets/vector/robot.svg"/>Robôs'
  nav: docs
src: "_pages/docs/pt/03-understand/02-robots.md"
---

Assuma a identidade de um robô com um token privado correspondente. Use esta identidade anônima para começar a criar e pegar ordens com RoboSats! Não é recomendado usar o mesmo robô duas vezes, pois isso prejudica a privacidade do usuário final.

Cada nova visita à página do site RoboSats apresentará ao usuário final um avatar de robô e um nome de usuário gerados de forma automática e aleatória para fornecer privacidade padrão ao usuário final.

Portanto, certifique-se de **armazenar com segurança o token privado** associado a esse avatar específico. Sem o token, você não poderá acessar nem gerar novamente aquele avatar exclusivo.

Lembre-se de ser conciso, mas cortês ao conversar com seus pares robôs!

## **Por que a privacidade?**

Priorizar a privacidade absoluta do usuário final proporciona o mais alto grau de proteção. Os dados do usuário estão especialmente preparados para serem explorados por hackers e cibercriminosos; para evitar tais cenários, em primeiro lugar, o RoboSats não coleta nenhum dado do usuário final.

As plataformas que recolhem informações pessoais apresentam um risco real para o utilizador final. As violações de dados apenas na última década vazaram bilhões de informações confidenciais de usuários por meio de uma combinação de invasões e segurança deficiente da plataforma.

A privacidade é extremamente importante para RoboSats; no entanto, suas transações no RoboSats são tão privadas quanto você as realiza. Os usuários devem ter o cuidado de usar métodos de preservação de privacidade ao interagir com RoboSats e seus pares robôs. Consulte [Início rápido > Acesso](/docs/access/) para obter informações adicionais.

## **Reutilização do robô: não recomendado**

É altamente recomendável gerar um novo robô aleatório após cada negociação para aumentar sua privacidade. A reutilização de robôs tem o potencial de expor informações do usuário final, uma vez que vários pedidos podem ser vinculados a um único avatar.

O token único associado a cada avatar não se destina à reutilização do robô; em vez disso, pretende funcionar como uma senha para acessar ordens em andamento e resolver disputas ativas. Armazene este token com segurança ou arrisque nunca mais acessar aquele avatar de robô específico.

Recuperar um robô é fácil: basta substituir o token gerado aleatoriamente pelo token de backup e selecionar "Gerar Robô" para recuperar o perfil do seu robô.

Embora possamos gostar de nossa identidade de robô única durante o curto período de tempo em que uma ordem é feita ou pega, é melhor passar para um novo avatar. Pense em todos os ótimos momentos que você passará fazendo e recebendo ordens com novas identidades de robôs!

Conforme afirmado, a reutilização de robôs é imprudente e pode, em última análise, tornar-se um prejuízo para a privacidade do utilizador final.

## **Processo de construção do robô**

RoboSats faz referência ao código-fonte do RoboHash.org como uma maneira rápida de gerar novos avatares para um site. Seu robô é "construído" a partir de um token único, uma sequência aleatória de caracteres (ZD3I7XH...), onde apenas os caracteres em sua ordem exata podem gerar aquele avatar exato do robô.

Um token é gerado automaticamente para você cada vez que a página do RoboSats é acessada. Os usuários podem gerar novamente quantos tokens aleatórios desejarem, o que é fortemente recomendado após cada negociação. Como observação, você pode inserir um token de entropia suficiente criado por você mesmo, em vez de depender do RoboSats; mas como só você conhece o token, é aconselhável fazer backup do seu token com segurança.

Em background, a criação de token na página inicial do RoboSats é o processo de geração e criptografia de sua chave privada PGP com seu token no lado do cliente do aplicativo. O usuário final solicita do nó RoboSats um avatar e um apelido gerado a partir do seu token criptografado e retorna para você a identidade do robô correspondente. Veja o gráfico abaixo:

![Geração de identidade RoboSats](https://learn.robosats.com/assets/images/private/usergen-pipeline.png)

## **Comunicando-se com seus pares robôs**

Sua identidade pode estar oculta por uma identidade de robô, mas isso não é desculpa para ser um colega difícil durante as negociações. Outros robôs também têm sentimentos robóticos! Seja sucinto e respeitoso ao conversar com colegas; isso tornará a experiência mais fácil e tranquila no RoboSats. Nunca compartilhe mais informações do que o absolutamente necessário para concluir a ordem.

Todas as comunicações no RoboSats são criptografadas com PGP. Mensagens criptografadas de bate-papo ponto a ponto são assinadas por cada bot, provando que ninguém interceptou o bate-papo e é útil para resolver disputas. Consulte [Práticas recomendadas > Criptografia PGP](https://learn.robosats.com/docs/pgp-encryption/pt/) para obter informações adicionais.
