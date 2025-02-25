---
layout: single
title: Notificações, alertas e grupos no Telegram
permalink: /docs/pt/telegram/
sidebar:
  title: '<img id="side-icon-verybig" src="/assets/vector/telegram.svg"/>Telegram'
  nav: docs
src: "_pages/docs/pt/03-understand/10-telegram.md"
---

<!-- Cover: telegram notification bot: how to enable (on phone and desktop). What are the privacy trade offs. Alert bot (Jacky). Telegram public support group, different language group. Warning: never reply to privates. Never share your robot token -->

## **Bot de Alerta RoboSats 🔔**

Você pode encontrá-lo no Telegram com o nome de usuário @RobosatsAlertBot, cujo administrador é @jakyhack.

## **O que posso fazer com @RobosatsAlertBot?**

É um bot projetado para notificar quando um pedido que atende aos seus requisitos for publicado na RoboSats.

Isso significa que se você quiser "COMPRAR" Sats com "EUROS" com um prêmio máximo de "5%" pelos métodos de pagamento "BIZUM, PAYPAL, SEPA, STRIKE", diga ao @RobosatsAlertBot e ele cuidará de notificá-lo quando um negócio que atenda a esses requisitos for publicado na RoboSats.

## **Guia do usuário**

Acesse @RobosatsAlertBot e inicie o bot com o comando /start.

Em seguida, ele lhe dará uma escolha entre 2 opções: adicionar um novo alerta ou listar os alertas que você já configurou. Obviamente, quando você inicia o bot pela primeira vez, você não terá nenhum alerta configurado.

![image](https://user-images.githubusercontent.com/47178010/170114653-f1d22f61-1db3-4a6a-b38c-5542a1b76648.png)

Prossiga para criar um novo alerta clicando no botão "+ Adicionar novo alerta" ou usando o comando /new.

A partir desse momento, o bot está pronto para salvar suas preferências. Ele fará 4 perguntas:

- O que você deseja fazer? Você poderá escolher entre comprar ou vender; isso significa dizer ao bot o que você deseja fazer dentro da RoboSats.

![image](https://user-images.githubusercontent.com/47178010/170114706-a4226028-50a5-414e-8ae8-c44f90833ff6.png)

- Qual é a sua moeda fiduciária? Ele lhe dará uma lista de moedas fiduciárias, basta escolher a sua.

![image](https://user-images.githubusercontent.com/47178010/170114837-3e83f1c9-035a-4b59-8c8e-043f77995a33.png)

- Qual é o prêmio máximo que você está disposto a pagar? Ou qual é o prêmio mínimo que você está disposto a aceitar? Dependendo se você deseja comprar ou vender Sats, ele fará uma pergunta ou outra.

![image](https://user-images.githubusercontent.com/47178010/170115618-66117113-e702-4faa-b02d-a8101244f7da.png)

- Quais métodos de pagamento você aceita para fazer/receber pagamento em moeda fiduciária? Basta informar ao bot quais métodos de pagamento você estaria disposto a aceitar para sua negociação. Informe-os no seguinte formato: "Revolut, SEPA, Strike, Bizum" (sem aspas). Se você for indiferente ao método de pagamento em moeda fiduciária, simplesmente envie: "Any" (sem aspas).

![image](https://user-images.githubusercontent.com/47178010/170115693-7378b25a-93af-4ad3-ad7e-d0185364003d.png)

Uma vez que tudo isso tenha sido informado, seu alerta está configurado corretamente. No caso de um pedido ser publicado na RoboSats que atenda às suas condições, @RobosatsAlertBot irá notificá-lo via Telegram com um link para o livro de pedidos para que você possa prosseguir com sua negociação, se desejar. Abaixo está um exemplo de um alerta.

![image](https://user-images.githubusercontent.com/47178010/170116003-6316c10a-0c6f-44bc-8eb6-17a1df8e1f3f.png)

## **Com que frequência a RoboSats verifica o Livro de ofertas?**

A RoboSats verifica o livro de ofertas a cada minuto; isso significa que o tempo máximo que passará desde a publicação de um pedido que atenda às suas condições até que @RobosatsAlertBot o notifique será de 1 minuto.

## **Depois que @RobosatsAlertBot me notificar, posso usar o mesmo alerta novamente?**

Sim, assim que @RobosatsAlertBot notificar você, seu alerta permanecerá no estado desativado, basta ativá-lo novamente e @RobosatsAlertBot irá notificá-lo novamente quando um pedido atender às suas condições.

## **O que pode dar errado?**

Nada de errado, mas pode haver decepções. É possível que as condições do seu alerta sejam compartilhadas por muitos usuários, o que significa que há muitos usuários que desejam encontrar uma negociação com as mesmas (ou muito semelhantes) condições que você. Isso significa que um pedido com condições muito restritivas pode estar no livro de pedidos por um tempo muito curto porque algum outro usuário o aceita antes de você, razão pela qual o criador do bot recomenda sempre tê-lo com som.

## **PERDA DE PRIVACIDADE**

A RoboSats é uma exchange focada na privacidade do usuário porque informações pessoais não são necessárias. A configuração ideal para a RoboSats é através de um método de acesso recomendado como o navegador TOR privado.

Uma vez que você sai do TOR para um aplicativo de terceiros (ou seja, Telegram), você perde privacidade.

Este bot, como qualquer outro, armazenará o seu ID de usuário do Telegram, pois é necessário para entrar em contato com o usuário. Ele também armazenará os dados do seu alerta.

Isso significa que o bot saberá que o usuário 123456789 tem um alerta para comprar Sats com EUROS com um prêmio máximo de 5% através de Bizum, PayPal ou Strike.

É importante sempre ter isso em mente. Alguns estão dispostos a sacrificar um grau de privacidade em favor de notificações convenientes, mas você deve considerar as compensações associadas à revelação das informações mencionadas acima. A privacidade é o que escolhemos revelar seletivamente e, em última análise, cabe ao usuário final decidir o quão privada deseja tornar sua experiência na RoboSats.

{% include improve_pt %}
