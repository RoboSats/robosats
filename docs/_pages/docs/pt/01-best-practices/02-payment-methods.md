---
layout: single
title: Boas práticas da Fiat
permalink: /docs/pt/payment-methods/
toc: true
toc_sticky: true
sidebar:
  title: '<img id="side-icon-verybig" src="/assets/vector/hand-peace.svg"/>Boas práticas da Fiat'
  nav: docs
src: "_pages/docs/pt/01-best-practices/02-payment-methods.md"
---

Atualmente, não há restrições ao método de pagamento fiduciário. Você pode pagar com qualquer método que você e seu par concordem. Isso inclui métodos de maior risco, como aplicativos PayPal, Venmo e Cash. No entanto, o método de pagamento com menor risco é recomendado. Você pode aprender mais detalhes sobre as características e diferenças de cada método de pagamento fiduciário em <a href = "https://bisq.wiki/Payment_methods#Payment_method_guides">Bisq wiki</a >. As diretrizes Bisq se aplicam como diretrizes padrão para RoboSats.

## Recomendações gerais

Esta recomendação foi criada como uma prática recomendada para negociação na plataforma RoboSats. Estas melhores práticas são altamente encorajadas a serem seguidas por ambos os pares comerciais para garantir o sucesso da negociação e evitar disputas desnecessárias.

Nota: Este guia é uma modificação das regras de negociação da <a href="https://bisq.wiki/Trading_rules">Bisq</a> e ajustada de acordo com as diferenças na operação de cada plataforma.

### Para comprador e vendedor de bitcoin

1. Não deixe de conferir a seção <a href="https://github.com/Reckless-Satoshi/robosats/blob/main/docs/_pages/tutorials/read/how-to-use_es.md">Como usar </a >antes de começar a negociar.<br>
2. Declare o acordo claramente para evitar mal-entendidos.<br>
3. O método de pagamento fiduciário deve poder enviar e receber instantaneamente porque a fatura retida tem prazo de validade de 24 horas.<br>
   Se o cronômetro expirar, isso poderá desencadear uma disputa e levar à perda do depósito.<br>
4. Depois que o tomador tiver pego a ordem, ambas as partes deverão estar prontas para passar para a próxima etapa antes que o tempo expire.<br>
5. Lembre-se de que ninguém pode ler o bate-papo entre você e seu par.

### Para comprador de bitcoin

1. Certifique-se de que a conta/endereço de destino do envio fiduciário esteja correto.<br>
2. Certifique-se de guardar um comprovante de envio fiduciário, como o recibo da transação.<br>
3. Clique no botão "Confirmar envio da moeda fiduciária" depois de enviar a moeda fiduciária da sua conta.<br>

### Para vendedor de bitcoin

1. Confirme se o valor final fiat recebido está correto.<br>
2. Clique em "Confirmar moeda fiduciária recebida" quando tiver 100% de certeza de que a moeda fiduciária foi depositada com sucesso em sua conta.<br>
3. Se você concordar com o comprador em usar a plataforma de alto risco, precisará de precauções especiais para evitar estornos (isso será discutido mais adiante).<br>

## Método de pagamento de risco médio-baixo

### Amazon eGift Cards

Os vales-presente da Amazon são um dos métodos de pagamento mais privados no RoboSats. Eles tendem a ser rápidos e convenientes, mas os fundos devem ser gastos na Amazon.

É importante não compartilhar o código do vale-presente diretamente no chat, pois isso pode gerar disputas difíceis de resolver em caso de fraude. Como vendedor, **não aceite código de vale-presente no chat**. Em vez disso, o vendedor deve fornecer um e-mail no chat. O comprador deve adquirir explicitamente um novo vale-presente para a troca e enviá-lo para o endereço de e-mail do vendedor. Desta forma, o vendedor sabe que é o único que tem acesso ao código resgatável. Esta abordagem também gera provas verificáveis ​​de que o vale-presente foi adquirido para troca no RoboSats em caso de disputa.

Caso o comprador possua um código de vale-presente da Amazon, ele deverá primeiro aplicar o código em sua própria conta. Em seguida, compre um novo vale-presente da Amazon para o e-mail do vendedor usando o saldo da conta.

Encontre mais detalhes em [Diretrizes Bisq para vales-presente da Amazon](https://bisq.wiki/Amazon_eGift_card)

### Interac e-Transfer

No Canadá, [Interac e-Transfer](https://www.interac.ca/en/consumers/support/faq-consumers/) é um método de pagamento popular e amplamente aceito, usado para enviar pagamentos de uma conta bancária para outra, usando apenas um e-mail cadastrado (ou número de telefone). As transferências eletrônicas são consideradas de baixo risco de estornos; no entanto, estornos provavelmente ainda são possíveis em casos raros. As transferências eletrônicas podem ser iniciadas pelo remetente, enviando um pagamento para o e-mail do destinatário, ou pelo destinatário, enviando uma solicitação de pagamento para o e-mail do remetente.

### Wise

[Wise](https://wise.com/) (antigo TransferWise) é um transmissor de dinheiro internacional regulamentado em 175 países e 50 moedas. É conhecido pelas suas taxas relativamente baixas para transferência de dinheiro entre países e moedas. Os estornos ainda são um risco, mas provavelmente são raros. Os usuários podem transferir dinheiro entre contas Wise usando um endereço de e-mail semelhante ao funcionamento das transferências eletrônicas; ou no Canadá, os usuários podem solicitar transferências eletrônicas padrão diretamente de suas contas Wise.
Os destinatários podem ver os detalhes da sua conta?
Se você enviar dinheiro com o Wise, o destinatário não pode ver os detalhes da sua conta. Na verdade, essa privacidade funciona em ambas as direções - também existem maneiras de você enviar dinheiro para alguém sem precisar que eles compartilhem os detalhes da conta bancária com você.
Isso pode ser mais fácil e significa que nenhum dado sensível é compartilhado também.
- Se você quiser enviar dinheiro para alguém sem obter os detalhes da conta bancária deles, há algumas opções:
- Se o seu destinatário tiver uma conta Wise, ele pode sincronizar seus contatos do telefone com o Wise, para que você possa encontrá-los e processar o pagamento apenas com esse contato do telefone.
- Se o seu destinatário tiver uma conta Wise, ele também pode marcar uma conta como sua conta principal para receber pagamentos, o que significa que você pode enviar apenas com um endereço de e-mail.
- Se o seu destinatário não tiver uma conta Wise, você ainda pode enviar apenas com o e-mail deles - a Wise entrará em contato e pedirá as informações bancárias através de um link seguro.


## Método de pagamento de alto risco

Esta seção discute as práticas recomendadas para usuários que tentam fazer transações com uma forma de pagamento com alto risco de perda de fundos.

### Diretrizes para Pagamentos Instant SEPA

O Instant SEPA é um método de pagamento amplamente adotado na Europa, oferecendo transações rápidas e eficientes. No entanto, ele apresenta um risco significativo para os vendedores, incluindo a possibilidade de estornos. Para mitigar esses riscos, é aconselhável que os vendedores solicitem as informações do comprador antes de compartilhar seus dados SEPA. Essas informações podem incluir o país do comprador, nome completo e número da conta bancária. Ao obter essas informações, os vendedores podem reduzir o risco de transações fraudulentas, como ataques em triângulo, enquanto os compradores, ao compartilhar essas informações, não diminuem sua privacidade, pois não estão expondo nenhuma informação adicional que o vendedor não teria acesso de qualquer maneira após a transferência SEPA.

Para os compradores, é crucial cumprir com os pedidos de informações pessoais dos vendedores quando estão iniciando transações SEPA. A falha em fornecer essas informações pode levar o vendedor a abrir uma disputa imediata, que os vendedores têm grande probabilidade de ganhar (o vendedor também ganhará o depósito do comprador neste caso específico). Portanto, é do melhor interesse dos compradores cooperar com os pedidos de informações dos vendedores.

Os vendedores são incentivados a compartilhar um link para este guia com seus compradores ao solicitar informações. Isso garante que ambas as partes estejam informadas e compreendam a importância desse passo ao usar o SEPA Instantâneo.

### Revolut via links de pagamento

  Troca de @revtag: Ao fazer um pagamento através do Revolut, é essencial que tanto o comprador quanto o vendedor troquem seus @revtag no chat. Esse @revtag pode ser verificado no histórico de pagamentos do aplicativo, facilitando a confirmação das transações.

  Formato do Link de Pagamento: Os links de pagamento do Revolut seguem este formato: https://revolut.me/p/XXXXX. Por favor, note que esses links não contêm informações de endereço do destinatário.

  Riscos em Disputas: No caso de uma disputa, a ausência de referências de endereço do destinatário pode levar a fraudes. Tanto o comprador quanto o vendedor podem agir de forma desonesta, uma vez que o link de pagamento pode ser resgatado por um terceiro desconhecido que esteja em conluio com uma das partes.

  Solicitando o @revtag: Para mitigar esses riscos, é crucial que ambas as partes (comprador e vendedor) solicitem e forneçam seu @revtag ao fazer um pagamento. Isso garante que cada parte tenha um registro claro e verificável da transação.

  Link do @revtag: O @revtag também pode ser recebido como um link, que terá a seguinte aparência: https://revolut.me/@revtag. Certifique-se de compartilhar e verificar este link para maior segurança.

Nota Importante: Lembre-se de que tanto o comprador quanto o vendedor têm o direito de solicitar o @revtag de seu interlocutor a qualquer momento. Isso é essencial para garantir transparência e segurança na transação.

### Paypal
Paypal é um dos métodos de pagamento fiduciário mais utilizados. No entanto, com a <a href="https://www.paypal.com/us/webapps/mpp/ua/buyer-protection">política de proteção ao comprador do PayPal</a>, o comprador pode realizar uma ação fraudulenta criando um solicitação de reembolso no Paypal após a conclusão da troca. Desta forma, permanecendo com moeda fiduciária e bitcoin.

Esta fraude pode ser evitada fazendo com que o comprador envie dinheiro usando a opção “enviar dinheiro para um amigo ou familiar”. Isso tornará o comprador responsável pela taxa de transação e será menos provável que solicite um reembolso.

### Para o vendedor

Se você é um vendedor e seu par concordou em usar “enviar dinheiro para um amigo ou membro da família”, mas seu par usou a opção “enviar dinheiro para bens ou serviços”, você deve devolver o pagamento fiduciário e pedir ao seu par para enviar com um método acordado. Se eles insistirem em quebrar o acordo, você pode pedir-lhes que encerrem voluntariamente a negociação ou encerrem a negociação abrindo uma disputa.

### Para o comprador

Se você é um comprador e precisa usar “enviar dinheiro para um amigo ou membro da família” para pagar moeda fiduciária a seu colega, você pode escolher o tipo de pagamento especificado seguindo estas etapas.

#### PayPal Desktop

No PayPal Desktop, ele está localizado abaixo da lista suspensa de moedas e deve ser rotulado como "Enviar para um amigo".
Se estiver rotulado de forma diferente, você precisará clicar em “Alterar” à direita para alterar o tipo de pagamento.

<div align="center">
<img src="/assets/images/fiat-payment-methods/PayPal-main-desktop.png" width="370"/>
</div>
Em seguida, selecione “Enviar para um amigo” na página de seleção do tipo de pagamento.
<div align="center">
<img src="/assets/images/fiat-payment-methods/PayPal-choose-desktop.png" width="370"/>
</div>

#### PayPal Mobile

No PayPal mobile, está localizado abaixo da forma de pagamento (neste caso é VISA), deve estar rotulado “Amigos ou Familiares”.
Se estiver rotulado de forma diferente, você precisará pressionar a guia ">" à direita para alterar o tipo de pagamento.

<div align="center">
<img src="/assets/images/fiat-payment-methods/PayPal-main-phone.png" width="230"/>
</div>
Em seguida, selecione “Enviar para um amigo” na página de seleção do tipo de pagamento.
<div align="center">
<img src="/assets/images/fiat-payment-methods/PayPal-choose-phone.png" width="230"/>
</div>

{% include improve_pt %}
