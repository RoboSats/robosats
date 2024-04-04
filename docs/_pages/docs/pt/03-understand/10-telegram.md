---
layout: single
title: Notificaciones, alertas y grupos en Telegram
permalink: /docs/es/telegram/
sidebar:
  title: '<img id="side-icon-verybig" src="/assets/vector/telegram.svg"/>Telegram'
  nav: docs
src: "_pages/docs/es/03-understand/10-telegram.md"
---

<!-- Cover: telegram notification bot: how to enable (on phone and desktop). What are the privacy trade offs. Alert bot (Jacky). Telegram public support group, different language group. Warning: never reply to privates. Never share your robot token -->

{% include wip_es %}

**Robots Alert bot 🔔**

Puedes encontrarlo en Telegram con el nombre de usuario @RobosatsAlertBot,
cuyo administrador es @jakyhack.

**¿Que puedo hacer con @RobosatsAlertBot?**

Es un bot diseñado para notificarte cuando una orden que cumpla tus requerimientos
sea posteada en el libro de ordenes de RoboSats.

Esto quiere decir que si quieres "COMPRAR" satoshis con "EUROS" con una prima máxima
del "5%" a través de los medios de pago "BIZUM,PAYPAL,SEPA,STRIKE", díselo a
@RobosatsAlertBot y él se encargará de avisarte cuando una orden que cumple con
estos requisitos se publique en robosats.

**Guía de usuario**

Accede a @RobosatsAlertBot e inicia el bot con el comando /start

A continuación, te dará a elegir entre 2 opciones, añadir una nueva alerta o listar
las alertas que ya tienes configuradas (Obviamente cuando inicies el bot por primera
vez no tendrás ninguna).

![image](https://user-images.githubusercontent.com/47178010/170114653-f1d22f61-1db3-4a6a-b38c-5542a1b76648.png)

Crea una nueva alerta haciendo clic en el botón "+ Add new alert" o usando el comando /new

A partir de ese momento el bot está listo para guardar tus preferencias, te hará 4 preguntas:
- ¿Qué es lo que quieres hacer? Podrás elegir entre comprar o vender, esto significa
decirle al bot lo que quieres hacer dentro de Robosats.

![image](https://user-images.githubusercontent.com/47178010/170114706-a4226028-50a5-414e-8ae8-c44f90833ff6.png)

- ¿Cuál es tu moneda FIAT? Te dará una lista de monedas FIAT, solo elige la tuya

![image](https://user-images.githubusercontent.com/47178010/170114837-3e83f1c9-035a-4b59-8c8e-043f77995a33.png)

- ¿Cuál es la prima máxima que estás dispuesto a pagar? o ¿Cuál es la prima mínima
que estás dispuesto a aceptar? Dependiendo de si quieres comprar o vender satoshis
te hará una pregunta u otra.

![image](https://user-images.githubusercontent.com/47178010/170115618-66117113-e702-4faa-b02d-a8101244f7da.png)

- ¿Qué métodos de pago aceptas para realizar/recibir pagos con FIAT? Simplemente dile
al bot qué métodos de pago estarías dispuesto a aceptar para tu intercambio.
Informarle en el siguiente formato: "Revolut,SEPA,Strike,Bizum" (sin comillas).
Si es indiferente al método de pago FIAT, simplemente envía: "Any" (sin comillas).

![image](https://user-images.githubusercontent.com/47178010/170115693-7378b25a-93af-4ad3-ad7e-d0185364003d.png)


Una vez informado todo esto, tu alerta está configurada correctamente. En caso de que
se publique una orden en Robosats que cumpla con tus condiciones, @RobosatsAlertBot te
notificará por telegram con un enlace al libro de ordenes para que puedas continuar con
el intercambio si lo deseas. A continuación se muestra un ejemplo de una alerta.

![image](https://user-images.githubusercontent.com/47178010/170116003-6316c10a-0c6f-44bc-8eb6-17a1df8e1f3f.png)

**¿Con qué frecuencia mira robosats al libro de órdenes?**

Robosats revisa el libro de órdenes cada minuto, esto quiere decir que el tiempo máximo
que pasará desde que se publica una orden que cumple tus condiciones hasta que
@RobosatsAlertBot te notifica será de 1 minuto.

**¿Una vez que @RobosatsAlertBot me haya notificado, ¿puedo usar esa misma alerta nuevamente?**

Sí, una vez que @RobosatsAlertBot te notifica, tu alerta permanece en deshabilitada,
simplemente vuelve a habilitarla y @RobosatsAlertBot te notificará nuevamente cuando
una orden cumpla con tus condiciones.

**¿Qué puede ir mal?**

No pasa nada, pero puede haber decepciones, es posible que las condiciones de tu alerta
sean condiciones compartidas por muchos usuarios, esto significa que hay muchos usuarios
que quieren encontrar una orden con las mismas (o muy similares) condiciones que tú.
Esto significa que un pedido con condiciones muy restrictivas puede estar en el libro de
órdenes muy poco tiempo porque algún otro usuario lo acepta antes que tú, por lo que el
creador del bot recomienda tenerlo siempre con sonido.

**PÉRDIDA DE PRIVACIDAD**

Robosats es un exchange enfocado en la privacidad del usuario, es por eso que no se
utiliza KYC y su uso óptimo está orientado a ser utilizado con el navegador TOR.

Una vez que abandonas TOR y vas a una aplicación de terceros (Telegram en este caso)
estás perdiendo privacidad.

Este bot, como cualquier otro, almacenará tu ID de usuario de Telegram, ya que es
necesario para contactar con el usuario. También almacenará los datos de tu alerta.

Es decir, el bot sabrá que el usuario 123456789 tiene una alerta para comprar sats con
euros con un máximo del 5% de prima a través de bizum o paypal o strike.

Es importante tener esto siempre en cuenta. No debemos obsesionarnos con la privacidad,
pero sí debemos tener en cuenta lo que damos y lo que no damos de ella.

