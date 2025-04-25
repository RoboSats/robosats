---
layout: single
title: Criptografia fácil com PGP
permalink: /docs/pt/pgp-encryption/
toc: true
toc_sticky: true
sidebar:
  title: '<img id="side-icon-verybig" src="/assets/vector/fingerprint.svg"/>Criptografia PGP'
  nav: docs
src: "_pages/docs/pt/01-best-practices/01-pgp-guide.md"
---

Todas as comunicações no RoboSats são criptografadas por PGP. O aplicativo cliente é totalmente transparente e oferece uma maneira fácil de copiar e exportar as chaves PGP.

## Verifique a privacidade da sua comunicação

Você pode garantir a confidencialidade de seus dados verificando a implementação do padrão PGP pelo RoboSats. Qualquer implementação PGP de terceiros que permita importar chaves e mensagens pode ser usada para verificar o bate-papo do RoboSats. Neste pequeno guia usaremos a ferramenta de linha de comando [GnuPG](https://gnupg.org/).

### Importar chaves para o GnuPG

#### Importe sua chave privada criptografada

Cada avatar de robô possui uma chave pública e uma chave privada criptografada. Podemos importar a chave privada para o GPG, primeiro copiamos do RoboSats:

<div align="center">
    <img src="/assets/images/sensitive-data-PGP-guide/copy-private-key.png" width="550"/>
</div>

Em seguida, importamos para o GnuPG com o seguinte comando:

```
echo "<cole_sua_chave_privada_encriptada>" | gpg --import
```

parecerá assim:

<div align="center">
    <img src="/assets/images/sensitive-data-PGP-guide/gpg-1.png" width="450"/>
</div>

Você será solicitado a inserir a frase secreta da chave privada. Nós usamos nosso **token** de robô _supersecreto_ para descriptografá-lo, você é o único que conhece o token do robô.

<div align="center">
    <img src="/assets/images/sensitive-data-PGP-guide/gpg-2.png" width="350"/>
</div>

Se o seu token for o correto, você deverá ter importado a chave privada para comunicação.

<div align="center">
    <img src="/assets/images/sensitive-data-PGP-guide/gpg-3.png" width="650"/>
</div>
Podemos ver como o aplicativo frontend nomeou essa chave `"RoboSats ID<hash>"`. Este é o ID do robô, o segundo hash SHA256 do nosso token secreto, e foi usado originalmente para gerar deterministicamente o apelido do robô e a imagem do avatar do robô ([saiba mais](/docs/private/#robot-avatar-generation-pipeline) ).

#### Importe a chave pública do seu par
Só precisamos repetir os passos acima para importar a chave pública da sua contraparte.

```
echo "<cole_sua_chave_privada_encriptada>" | gpg --import
```

<div align="center">
    <img src="/assets/images/sensitive-data-PGP-guide/gpg-4.png" width="650"/>
</div>

Estamos prontos. Importamos nossa chave privada criptografada e a chave pública de nosso parceiro GPG. Até agora, tudo ok.

### Descriptografe e verifique mensagens com GnuPG
#### Descriptografar mensagem
Agora vamos tentar ler uma das mensagens criptografadas que nosso parceiro nos enviou e ver se elas podem ser descriptografadas com nossa chave privada e se estão corretamente assinadas por ele.

<div align="center">
    <img src="/assets/images/sensitive-data-PGP-guide/chat-1.png" width="320"/>
</div>

Ao clicar no ícone "olho", podemos ver a mensagem bruta do Armored ASCII PGP. Podemos clicar no botão copiar para levá-lo ao GnuPG.

<div align="center">
    <img src="/assets/images/sensitive-data-PGP-guide/chat-2.png" width="320"/>
</div>

Tudo o que resta é descriptografar a mensagem PGP do nosso par usando nossa chave privada. É muito provável que o GnuPG nos peça novamente nosso _token_ para descriptografar nossa chave privada.

```
echo "<cole_sua_chave_privada_encriptada>" | gpg --decrypt
```

#### Verificação da mensagem criptografada

<div align="center">
    <img src="/assets/images/sensitive-data-PGP-guide/gpg-5.png" width="650"/>
</div>

Voilà! Aqui está. Podemos ter certeza de que:

1. A **mensagem criptografada diz** "É tão legal que o RoboSats tem uma maneira tão transparente de verificar sua comunicação criptografada!" (Marcado em vermelho)
2. A mensagem só pode ser descriptografada por 2 chaves privadas: a nossa e a do nosso parceiro. **Ninguém mais pode ler!** (marcado em azul)
3. A mensagem **foi assinada pelo nosso peer**, deve ser ele. Ninguém se infiltrou neste chat fingindo ser seu parceiro. (marcado em verde)

Como as mensagens são assinadas pelos robôs que mantêm o registo, o nosso token de robô é muito útil em caso de disputa. Se o seu colega tentar traí-lo e depois mentir para a equipe encarregada de resolver a disputa, você pode provar isso! É útil exportar o log completo do chat como JSON (clique no botão exportar) ou, pelo menos, salvar o token do seu robô. Com eles você pode fornecer excelentes evidências de que ele disse algo diferente no bate-papo privado com você.

O aplicativo frontend do RoboSats executado em seu navegador faz o trabalho de criptografar, descriptografar e verificar cada mensagem. Mas neste tutorial verificamos de forma independente que funciona conforme o esperado: verificamos que **apenas a pessoa com acesso ao token do robô pode ler (descriptografar) e assinar mensagens** durante uma negociação RoboSats.

**Dica Pro:** Para verificar de forma independente se o seu token é absolutamente secreto e nunca foi enviado a terceiros, você precisará executar um sniffer de pacotes de solicitação HTTP. Você também pode verificar você mesmo o [código-fonte do frontend](https://github.com/RoboSats/robosats/tree/main/frontend/src).
{: .notice--secondary}

## Legado: Por que a criptografia é necessária?

RoboSats inicialmente não tinha uma configuração de criptografia PGP integrada. Portanto, os usuários tinham que fazer isso manualmente para garantir que suas comunicações fossem privadas. O que se segue é um documento antigo para você aprender como criptografar sua comunicação sozinho usando OpenKeychain no Android. No entanto, a mesma ferramenta também pode ser usada para verificar o pipeline de criptografia integrado. Quem sabe? Talvez você queira criptografar duas vezes suas mensagens. Então este é o seu guia.

Como o RoboSats funciona na rede TOR, toda a comunicação é criptografada de ponta a ponta. Isso ajuda a evitar que dados em trânsito sejam lidos ou adulterados por ataques man-in-the-middle. Além disso, o protocolo TOR garante que o usuário esteja conectado ao nome de domínio na barra de endereço do navegador, neste caso o endereço tor oficial do RoboSats (robosats6tkf3eva7x2voqso3a5wcorsnw34jveyxfqi2fu7oyheasid.onion). No entanto, no RoboSats v0.1.0 os dados foram transferidos como texto simples através do front-end e back-end do aplicativo. Esse comportamento permitiu que dados confidenciais trocados em relação a informações de pagamento fiduciário pudessem ser capturados por um sniffer malicioso no computador de qualquer uma das partes ou mesmo no servidor RoboSats na camada de abstração do aplicativo. Isso representaria um ataque à privacidade do proprietário dos dados. Mesmo que o bate-papo do RoboSats tenha sido completamente criptografado em todas as etapas, você ainda não deve confiar que os dados confidenciais estejam criptografados (consulte o guia de verificação acima). A melhor prática para evitar este problema foi usar criptografia assimétrica durante a troca de dados confidenciais. Este guia mostra um método que garante a confidencialidade dos dados sensíveis usando o padrão PGP.

### Aplicativos PGP

#### Android

OpenKeychain é um aplicativo Android de código aberto que permite criar e gerenciar pares de chaves criptográficas e assinar e/ou criptografar/descriptografar textos e arquivos. OpenKeychain é baseado no padrão OpenPGP bem estabelecido, tornando a criptografia compatível entre dispositivos e sistemas. O aplicativo OpenKeychain pode ser encontrado em F-droid.org [[Link]](https://f-droid.org/packages/org.sufficientlysecure.keychain/) ou na Google Play Store [[Link]](https:/ /play.google.com/store/apps/details?id=org.sufficientlysecure.keychain).

<div align="center">
    <img src="/assets/images/sensitive-data-PGP-guide_es/OpenKeychain-logo.png" width="150"/>
</div>

#### iOS

PGPro é um aplicativo iOS de código aberto que permite criar e gerenciar pares de chaves criptográficas e assinar e/ou criptografar/descriptografar textos e arquivos. PGPro é baseado em ObjectivePGP que é compatível com OpenPGP. Ele pode ser encontrado no site deles [[Link]](https://pgpro.app/) ou na App Store [[Link]](https://apps.apple.com/us/app/pgpro/id1481696997 ).

<div align="center">
    <img src="/assets/images/sensitive-data-PGP-guide_es/OpenKeychain-logo.png" width="150"/>
</div>

#### Outros
Para uma lista de softwares compatíveis para Windows, Mac OS e outros sistemas operacionais, consulte [openpgp.org/software/](https://openpgp.org/software/). Como o conceito é o mesmo, este método pode ser replicado em qualquer outro aplicativo.


### Esquema de criptografia.

Na maioria dos casos, as informações confidenciais que gostaríamos de proteger são as informações de pagamento fiduciário do vendedor, ou seja, número de telefone, conta PayPal, etc. Portanto, a imagem abaixo mostra o esquema de criptografia que garante que as informações de pagamento do vendedor só possam ser lidas pelo comprador.

<div align="center">
    <img src="/assets/images/sensitive-data-PGP-guide_es/encrypted-communication-schema_es.png" width="900"/>
</div>

O processo de troca de dados foi dividido em 3 etapas fáceis:

- Criação de pares de chaves pelo comprador.

- Compartilhar a chave pública do comprador com o vendedor.

- Troca de dados criptografados.

### Guia passo a passo.

#### Criação de pares de chaves pelo comprador.

O primeiro passo para garantir a confidencialidade dos dados é criar um par de chaves pública/privada. Abaixo estão as etapas para criar um par de chaves no aplicativo OpenKeychain; Este procedimento só precisa ser feito pelo comprador. Este passo só precisa ser feito uma vez, não há necessidade de repeti-lo quando os compradores quiserem comprar novamente, pois em uma transação futura já terão o par de chaves.

<br/>

<div align="center">
    <img src="/assets/images/sensitive-data-PGP-guide_es/PGP-keys-creation-steps_es.png" width="900"/>
</div>

<br/>

#### Compartilhar a chave pública do comprador com o vendedor.

Agora o comprador possui duas chaves, a chave privada deve ser conhecida apenas pelo seu proprietário (neste caso específico, o comprador, que também a criou), e a chave pública pode ser conhecida por qualquer outra pessoa (o vendedor). O vendedor precisa da chave pública do comprador para criptografar dados confidenciais, portanto o comprador deve enviar o texto simples que representa a chave pública. As etapas abaixo mostram como compartilhar o texto simples que representa a chave pública, bem como como o vendedor o adiciona ao aplicativo OpenKeychain para uso posterior.

<br/>

<div align="center">
    <img src="/assets/images/sensitive-data-PGP-guide_es/pub-key-sharing-steps_es.png" width="900"/>
</div>

<br/>

A chave deve ser copiada, incluindo o cabeçalho `(-----BEGIN PGP PUBLIC KEY BLOCK-----)` e o rodapé `(-----END PGP PUBLIC KEY BLOCK-----) ` para o correto funcionamento do aplicativo.

### Troca de dados criptografados.

Assim que o vendedor tiver a chave pública do comprador, o esquema de criptografia mostrado acima pode ser aplicado. As etapas a seguir descrevem o processo de troca de dados criptografados.

<br/>

<div align="center">
    <img src="/assets/images/sensitive-data-PGP-guide_es/encrypted-data-sharing-steps_es.png" width="900"/>
</div>

<br/>

Os dados criptografados devem ser copiados incluindo o cabeçalho `(-----BEGIN PGP MESSAGE-----)` e o rodapé `(-----END PGP MESSAGE-----)` para operação correta da aplicação. Se o comprador visualizar corretamente os dados do vendedor no aplicativo, significa que a troca foi bem-sucedida e a confidencialidade dos dados está garantida, pois a única chave que pode descriptografá-los é a chave privada do comprador.

Se você quiser ler um tutorial sobre como usar o OpenKeychain para uso geral, consulte [As Easy as P,G,P](https://diverter.hostyourown.tools/as-easy-as-pgp/)

{% include improve_pt %}
