---
layout: single
title: "Desenvolva RoboSats"
permalink: /contribute/pt/code/
sidebar:
  title: '<img id="side-icon-verybig" src="/assets/vector/code.svg"/>Código'
  nav: contribute
toc: true
toc_sticky: true
src: "_pages/pt/contribute/01-development.md"
---

Qualquer pessoa pode contribuir para o desenvolvimento do projeto de código aberto RoboSats. Se você está procurando por um lugar para começar a contribuir, então confira a lista de problemas compartilhado ["good first issue"](https://github.com/RoboSats/robosats/issues?q=is%3Aopen+is%3Aissue+label%3A"good+first+issue"); tais problemas são bons para iniciantes.

Este guia de contribuição é baseado no [guia de contribuição do Bisq](https://github.com/bisq-network/bisq/blob/master/CONTRIBUTING.md). Seguir as melhores práticas de software livre e de código aberto ajuda o desenvolvimento a permanecer organizado à medida que o projeto cresce com novos recursos e é continuamente otimizado. Futuros colaboradores irão agradecer por seguir essas melhores práticas e facilitar a construção sobre seu trabalho!

## Canais de comunicação

_!!! Cuidado com golpistas que se passam por administradores do RoboSats. Os administradores NUNCA entrarão em contato privadamente com você por mensagem ou ligação._

- **Simplex:** [Grupo Principal do RoboSats](https://simplex.chat/contact#/?v=1-2&smp=smp%3A%2F%2F0YuTwO05YJWS8rkjn9eLJDjQhFKvIYd8d4xG8X1blIU%3D%40smp8.simplex.im%2FyEX_vdhWew_FkovCQC3mRYRWZB1j_cBq%23%2F%3Fv%3D1-2%26dh%3DMCowBQYDK2VuAyEAnrf9Jw3Ajdp4EQw71kqA64VgsIIzw8YNn68WjF09jFY%253D%26srv%3Dbeccx4yfxxbvyhqypaavemqurytl6hozr47wfc7uuecacjqdvwpw2xid.onion&data=%7B%22type%22%3A%22group%22%2C%22groupLinkId%22%3A%22hWnMVPnJl-KT3-virDk0JA%3D%3D%22%7D). Tem perguntas ou um problema? Encontre suporte comunitário na conversa pública do grupo SimpleX. Se você quer se juntar a outros robôs legais e aprender mais sobre o RoboSats, então essas discussões acontecem no SimpleX, Nostr e nos grupos de chat Matrix.

- **Nostr:** [Grupo Geral do RoboSats](https://snort.social/e/note1tfwvglg8xz8420pfgav0dc9mqekv02nkpck2axefklrema7lk6wszmwxdy). Junte-se a outros robôs legais e não hesite em fazer perguntas sobre o RoboSats! Além disso, a conta [RoboSats Nostr](npub1p2psats79rypr8lpnl9t5qdekfp700x660qsgw284xvq4s09lqrqqk3m82) fornece atualizações importantes do projeto, dicas e truques de uso do RoboSats, e outros comentários centrados na privacidade. Perguntas e interações são bem-vindas. Lembre-se: problemas que exigem suporte da equipe do RoboSats devem ser direcionados para o grupo principal do SimpleX, onde as respostas são mais rápidas e a equipe pode investigar mais a fundo o seu problema.

- **Matrix:** [Grupo de Desenvolvimento do RoboSats](https://matrix.to/#/#robosats:matrix.org). Grupo de chat principal de comunicação entre desenvolvedores, onde discussões abertas e técnicas sobre o desenvolvimento ocorrem. Discussões sobre mudanças de código acontecem em issues e pull requests (PRs) do GitHub.


## Fluxo de Contribuição

Todos os contribuidores do RoboSats enviam alterações através de pull requests. O fluxo de trabalho é o seguinte:

- Faça um fork do repositório
- Crie um branch de tópico a partir do branch `main`
- Faça commits nas alterações
- Agrupe commits redundantes ou desnecessários
- Envie um pull request do seu branch de tópico de volta para o branch main do repositório principal
- Faça alterações no pull request se os revisores solicitarem e solicite uma nova revisão

Os pull requests devem se concentrar em uma única alteração. Não misture, por exemplo, refatorações com correção de bugs ou implementação de um novo recurso. Essa prática facilita para os outros contribuidores revisarem cada pull request.

## Revisão de Pull Requests

O RoboSats segue o fluxo de revisão estabelecido pelo projeto Bitcoin Core. O seguinte é adaptado da documentação de contribuidores do [Bitcoin Core](https://github.com/bitcoin/bitcoin/blob/master/CONTRIBUTING.md#peer-review):

Qualquer pessoa pode participar da revisão por pares, que é expressa por comentários no pull request. Normalmente, os revisores irão revisar o código em busca de erros óbvios, além de testar o conjunto de patches e opinar sobre os méritos técnicos do patch. Os mantenedores do projeto levam em consideração a revisão por pares ao determinar se há consenso para mesclar um pull request (lembre-se de que as discussões podem ter sido espalhadas pelo GitHub e pelo Telegram). A seguinte linguagem é usada nos comentários de pull requests:

- `ACK` significa "Testei o código e concordo que deve ser mesclado";
- `NACK` significa "Discordo que isso deva ser mesclado" e deve ser acompanhado de uma justificativa técnica sólida. NACKs sem justificativa podem ser ignorados;
- `utACK` significa "Não testei o código, mas revisei e parece OK, concordo que pode ser mesclado";
- `Concept ACK` ACK significa "Concordo com o princípio geral deste pull request";
- `Nit` refere-se a questões triviais, muitas vezes não bloqueadoras.

Observe que os Pull Requests marcados como `NACK` e/ou `Change requested` pelo GitHub são fechados após 30 dias se não forem abordados.

## Remuneração para Desenvolvedores (Programa Piloto)

[Verifique o estado atual das tarefas de desenvolvimento compensadas no Projeto do GitHub](https://github.com/users/Reckless-Satoshi/projects/2/views/5)

Atualmente, o RoboSats é um projeto jovem e sem financiamento, mas mostrou a capacidade de gerar receita suficiente para cobrir apenas os custos operacionais. Um programa de remuneração para desenvolvedores é a melhor maneira de garantir o apoio sustentado da base de código. Por enquanto, contribuições de código para o projeto principal receberão pequenas recompensas mais próximas de uma gorjeta do que de uma compensação monetária significativa. O procedimento piloto para desenvolvimento compensado é o seguinte:

1. O desenvolvedor abre um PR com a descrição do trabalho que será realizado, incluindo opcionalmente a quantidade de Sats que ele acha que o trabalho merece.
2. Uma oferta/negociação ocorre para definir uma quantidade de Sats até que seja acordada. Todos são bem-vindos para expressar opinião sobre se a compensação é adequada para o PR.
3. O trabalho acontece: construir, construir, construir!
4. A revisão ocorre. Uma vez que os mantenedores dão o OK para o merge....
5. O desenvolvedor envia uma fatura LN (com um longo prazo de validade). A fatura é paga no merge.

Cada etapa (negociação, submissão de código, revisão e submissão de fatura) deve ocorrer publicamente no GitHub (ou seja, sem mensagens privadas e similares). Entre em contato com o líder da equipe de desenvolvimento (@reckless-satoshi) antecipadamente se tiver dúvidas sobre se sua contribuição é adequada para compensação. Atualmente, apenas contribuições para a funcionalidade central do frontend ou backend e manutenção são elegíveis para compensações (por enquanto, isso exclui: arte, traduções, etc.).

## Estilo e Convenções de Codificação

### Configure metadados de nome de usuário e e-mail do Git

Ver https://help.github.com/articles/setting-your-username-in-git/ para instruções.

### Escreva mensagens de commit bem formadas

De https://chris.beams.io/posts/git-commit/#seven-rules:

1.  Separe o assunto do corpo com uma linha em branco
2.  Limite a linha de assunto a 50 caracteres (\*)
3.  Capitalize a linha de assunto
4.  Não termine a linha de assunto com um ponto
5.  Use o modo imperativo na linha de assunto
6.  Quebre o corpo em 72 caracteres (\*)
7.  Use o corpo para explicar o que e por que vs. como

### Assine seus commits com GPG

Ver https://github.com/blog/2144-gpg-signature-verification para mais informações e
https://help.github.com/articles/signing-commits-with-gpg/ para instruções.

### Use um editor que suporte Editorconfig

As configurações [.editorconfig](.editorconfig) neste repositório garantem o gerenciamento consistente de espaços em branco. A maioria dos editores modernos o suporta nativamente ou com plugin. Consulte http://editorconfig.org para obter detalhes.

### Mantenha o histórico do git limpo

É muito importante manter o histórico do git claro, leve e facilmente navegável. Isso significa que os contribuidores devem garantir que seus pull requests incluam apenas commits significativos (se forem redundantes ou foram adicionados após uma revisão, devem ser removidos) e _nenhum commit de merge_.
