---
layout: single
title: Telegram Notifications, Alert and Groups
permalink: /docs/telegram/
sidebar:
  title: '<img id="side-icon-verybig" src="/assets/vector/telegram.svg"/>Telegram'
  nav: docs
src: "_pages/docs/03-understand/10-telegram.md"
---

<!-- Cover: telegram notification bot: how to enable (on phone and desktop). What are the privacy trade offs. Alert bot (Jacky). Telegram public support group, different language group. Warning: never reply to privates. Never share your robot token -->

**Robosats Alert bot 🔔**

Podrás encontrarlo en telegram con el username @RobosatsAlertBot, cuyo administrador es @jakyhahck.

**¿Qué puedo hacer con @RobosatsAlertBot?**
Es un bot dieñado para notificarte cuando se publique en robosats una orden que cumpla con tus requisitos.

Esto quiere decir, que si quieres "COMPRAR" satoshis con "EUROS" con un premium máximo de un "5%" a través de los metodos de pago "BIZUM,PAYPAL,SEPA,STRIKE", diselo a @RobosatsAlertBot y el se encargará de avisarte cuando en robosats se publique un trade que cumpla con esos requerimientos.

**Guia de uso**

Accede @RobosatsAlertBot e inicia el bot con el comando /start

A continuación te dará a elegir entre 2 opciones, añadir una nueva alerta o listar las alertas que ya tengas configuradas (Evidentemente al iniciar el bot por primera vez no tendrás ninguna.)

![image](https://user-images.githubusercontent.com/47178010/170114653-f1d22f61-1db3-4a6a-b38c-5542a1b76648.png)

Procede a crear una nueva alerta pulsando en el botón "+ Add new alert" o usando el comando /new

Desde ese momento el bot se dispone a guardar tus preferencias, te hará 4 preguntas:
- ¿Qué quieres hacer? Podrás elegir entre comprar o vender, es decir, informarle al bot que es lo que quieres hacer dentro de Robosats.

![image](https://user-images.githubusercontent.com/47178010/170114706-a4226028-50a5-414e-8ae8-c44f90833ff6.png)

- ¿Cual es tu moneda FIAT? Te dará un listado de monedas FIAT, simplemente elige la tuya

![image](https://user-images.githubusercontent.com/47178010/170114837-3e83f1c9-035a-4b59-8c8e-043f77995a33.png)

- ¿Cual es el premium máximo que estás dispuesto a pagar? o ¿Cual es el mínimo de premium que estás dispuesto a aceptar?. Depende de si quieres comprar o vender sats te hará una pregunta u otra.

![image](https://user-images.githubusercontent.com/47178010/170115618-66117113-e702-4faa-b02d-a8101244f7da.png)

- ¿Qué metodos de pago aceptas para realizar/recibir el pago en fiat? Simplemente infórmale al bot cuales son los metodos de pago por los cuales estarías dispuesto a aceptar tu trade. Infórmaselos con el siguiente formato: "Révolut,SEPA,Strike,Bizum" (Sin comillas). En caso de que el método de pago FIAT te sea indiferente simplemente mándale: "Any" (Sin comillas).

![image](https://user-images.githubusercontent.com/47178010/170115693-7378b25a-93af-4ad3-ad7e-d0185364003d.png)


Una vez informado todo esto tu alerta estará configurada. En caso de que una orden sea publicada en Robosats que cumpla con tus condiciones, @RobosatsAlertBot te notificará a través de telegram con un enlace al libro de ordenes para que puedas proceder con tu trade si así lo deseas. A continuación verás un ejemplo de una alerta.

![image](https://user-images.githubusercontent.com/47178010/170116003-6316c10a-0c6f-44bc-8eb6-17a1df8e1f3f.png)

**¿Cada cuanto tiempo mira robosats el libro de ordenes?**
Robosats mira el libro de ordenes cada minuto, es decir, el tiempo máximo que pasará desde que una orden que cumpla tus condiciones se publique hasta que @RobosatsAlertBot te notifique será de 1 minuto.

**Una vez @RobosatsAlertBot me ha notificado, ¿Puedo volver a usar esa misma alerta?**
Si, una vez @RobosatsAlertBot te notifica, tu alerta queda en estado desactivado, simplemente vuelve a activarla y @RobosatsAlertBot te avisará de nuevo cuando una orden cumpla con tus condiciones.

**¿Qué puede salir mal?**
Mal nada, pero si puede haber desilusiones, es posible que las condiciones de tu alerta sean condiciones compartidas por muchos usuarios, es decir, hay muchos usuarios que quieren encontrar un trade con las mismas (o muy parecidas) condiciones que tu. Esto quiere decir que una orden con unas condiciones muy restrictivas es posible que estén durante muy poco tiempo en el libro de órdenes porque algún otro usuario se haga con ella, es por eso que el creador del bot recomienda tenerlo siempre con sonido.

**PÉRDIDA DE PRIVACIDAD**
Robosats es un exchange centrado en la privacidad del usuario, es por eso que no se usa KYC y que su uso óptimo está orientado para ser usado con el navegador TOR. 

Una vez sales de TOR a una aplicación de terceros (Télegram en este caso) estás peridiendo privacidad. 

Este bot, como cualquier otro, almacenará tu ID de usuario de Telegram, pues es necesario para ponerse en contacto con el usuario. Además almacenará los datos de tu alerta.

Es decir, el bot sabrá que el usuario 123456789 tiene una alerta para comprar sats con euros con un maximo de 5% de premium a través de bizum o paypal o strike.

Es importante tener siempre esto presente. No hay que obsesionarse con la privacidad, pero si tener en cuenta qué cedemos y qué no cedemos de la misma.


{% include wip %}
