---
layout: single
title: "Traduza RoboSats"
permalink: /contribute/pt/languages/
sidebar:
  title: '<img id="side-icon-verybig" src="/assets/vector/language.svg"/>Tradução'
  nav: contribute
toc: true
toc_sticky: true
src: "_pages/pt/contribute/02-languages.md"
---

RoboSats é uma maneira de trocar bitcoins por **qualquer moeda do mundo**. Portanto, muitos usuários podem achar essa ferramenta útil apenas se estiver disponível em um idioma que entendam. Traduzir o RoboSats para um novo idioma é uma das contribuições mais valiosas para o projeto! Isso torna a plataforma disponível para novos públicos, aumenta o alcance desta ferramenta de liberdade legal e, consequentemente, aumenta a liquidez do livro de ofertas para ainda mais usuários acumularem Sats de forma privada.

Não há muito texto no RoboSats; no entanto, pode ser melhor dividir o trabalho com outro colaborador. Você pode entrar em contato com as [comunidades do RoboSats](https://learn.robosats.com/contribute/pt/code/#canales-de-comunicación) e encontrar usuários dispostos a dividir a tarefa.

## Como contribuir com uma nova tradução

Basta criar um novo arquivo de tradução em `frontend/static/locales` [link para o GitHub](https://github.com/RoboSats/robosats/tree/main/frontend/static/locales). Em `locales`, há um único arquivo com um dicionário JSON para cada idioma. Para criar uma nova tradução, basta copiar `en.json` (o texto principal) para um novo arquivo com o nome do [código de duas letras do idioma ISO 639](https://www.loc.gov/standards/iso639-2/php/English_list.php).

## Diretrizes

Cada dicionário de idioma `.json` contém pares de chaves e valores no seguinte formato { "chave1":"valor1", "chave2":"valor2", ...}. A maioria das chaves é a sentença literal em inglês. Estas simplesmente devem ser traduzidas no lado direito. Por exemplo, para traduzir o botão `Make Order` para o português, você editaria o arquivo JSON para que ficasse assim {... "Make Order":"Criar ordem",...}.

### 1. **Nem todas as chaves são sentenças explícitas.**

Algumas chaves não são a sentença em inglês, mas um nome de variável. Por exemplo, "phone_unsafe_alert". Nesse caso, você deve dar uma olhada no valor original em `en.json`.

### 2. **O dicionário de idioma é dividido em 9 seções.**

A primeira chave de cada seção é uma referência e não precisa ser traduzida. Por exemplo, a segunda seção começa com a chave:valor `"USER GENERATION PAGE - UserGenPage.js": "Landing Page and User Generation"`. Não precisa ser traduzida; é apenas informação para o tradutor entender em qual parte do aplicativo ele estará trabalhando.

### 3. **Tente manter um tamanho similar à frase original.**

Na maioria dos casos, estará tudo bem se a tradução for mais curta. No entanto, traduções que resultarem em um maior número de caracteres podem quebrar a interface do usuário! Nem sempre será possível manter o comprimento da sentença em inglês. Nesses casos, a interface do usuário pode precisar ser alterada. Entre em contato com a pessoa responsável por essa alteração.

### 4. **Algumas sentenças contêm variáveis.**

Por exemplo, {{currencyCode}}. Ele inserirá o código da moeda onde a variável for encontrada. Por exemplo, `"Pagar 30 {{currencyCode}}"` será exibido como "Pagar 30 USD".

### 5. **Algumas sentenças contêm tags HTML.**

Essas tags geralmente são hiperlinks. Por exemplo, em `{"phone_unsafe_alert": "Use <1>Tor Browser</1> and visit the <3>Onion</3> site."}` o texto entre <1> (Tor Browser) será linkado para o site de download do Tor, e o texto entre <3> será linkado para o site Onion do RoboSats.

### 6. **É melhor traduzir de cima para baixo do arquivo .json**.

Alguns textos são de alta prioridade, outros são de baixa prioridade. Algumas chaves provavelmente mudarão em breve ou podem não ser tão relevantes para o usuário do aplicativo. Os arquivos de tradução são ordenados de cima para baixo pela prioridade da tradução.

### 7. **Use um verificador ortográfico.**

Sim, por favor! 😉

### 8. **Entenda o contexto; onde essa string será exibida?**

Traduções literais podem não funcionar bem em alguns idiomas. Enquanto em inglês a redação é sempre semelhante, independentemente da posição na interface do usuário, em alguns idiomas pode ser muito diferente se você estiver traduzindo um botão (o usuário está tomando uma ação) ou se estiver simplesmente traduzindo uma dica de ferramenta. Pode ser inteligente traduzir as strings enquanto olha para o aplicativo. No entanto, muitas strings só podem ser encontradas durante a negociação. O site de teste do RoboSats é ótimo para esse uso! Você pode explorar todo o aplicativo simplesmente interagindo com ele usando uma carteira Lightning de teste. No entanto, se você não conseguir encontrar onde uma string é exibida, pode ser mais rápido simplesmente escrever uma mensagem no [grupo no SimpleX](https://simplex.chat/contact#/?v=1-2&smp=smp%3A%2F%2F0YuTwO05YJWS8rkjn9eLJDjQhFKvIYd8d4xG8X1blIU%3D%40smp8.simplex.im%2FyEX_vdhWew_FkovCQC3mRYRWZB1j_cBq%23%2F%3Fv%3D1-2%26dh%3DMCowBQYDK2VuAyEAnrf9Jw3Ajdp4EQw71kqA64VgsIIzw8YNn68WjF09jFY%253D%26srv%3Dbeccx4yfxxbvyhqypaavemqurytl6hozr47wfc7uuecacjqdvwpw2xid.onion&data=%7B%22type%22%3A%22group%22%2C%22groupLinkId%22%3A%22hWnMVPnJl-KT3-virDk0JA%3D%3D%22%7D).

### 9. **Parabéns para você!**

Sério. É incrível que você esteja ajudando a construir ferramentas para a liberdade!

{% include improve_pt %}
