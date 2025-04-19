---
layout: single
title: "Develop RoboSats"
permalink: /contribute/es/code/
sidebar:
  title: '<img id="side-icon-verybig" src="/assets/vector/code.svg"/>Code'
  nav: contribute
toc: true
toc_sticky: true
src: "_pages/es/contribute/01-development.md"
---

Todo el mundo puede contribuir al desarrollo del proyecto de código abierto RoboSats. Si estás buscando un lugar donde empezar a contribuir, entonces echa un vistazo a la lista de temas que comparten la etiqueta ["good first issue"](https://github.com/RoboSats/robosats/issues?q=is%3Aopen+is%3Aissue+label%3A "good+first+issue"); estos temas son buenos para los recién llegados.

Esta guía de contribución se basa en la [Guía de contribución de Bisq](https://github.com/bisq-network/bisq/blob/master/CONTRIBUTING.md). Seguir las mejores prácticas del software libre ayuda a que el desarrollo se mantenga organizado a medida que el proyecto crece con nuevas características y se optimiza continuamente. Los futuros colaboradores te agradecerán que sigas estas buenas prácticas y que tu trabajo sea más fácil de desarrollar.

## Canales de comunicación

*!!! Cuidado con los estafadores que se hacen pasar por administradores de RoboSats. Los administradores NUNCA te llamarán o enviarán mensajes privados.*

- **Simplex:**
  - [Grupo principal RoboSats](https://simplex.chat/contact#/?v=1-2&smp=smp%3A%2F%2F0YuTwO05YJWS8rkjn9eLJDjQhFKvIYd8d4xG8X1blIU%3D%40smp8.simplex.im%2FyEX_vdhWew_FkovCQC3mRYRWZB1j_cBq%23%2F%3Fv%3D1-2%26dh%3DMCowBQYDK2VuAyEAnrf9Jw3Ajdp4EQw71kqA64VgsIIzw8YNn68WjF09jFY%253D%26srv%3Dbeccx4yfxxbvyhqypaavemqurytl6hozr47wfc7uuecacjqdvwpw2xid.onion&data=%7B%22type%22%3A%22group%22%2C%22groupLinkId%22%3A%22hWnMVPnJl-KT3-virDk0JA%3D%3D%22%7D). ¿Tienes preguntas o un problema? Encuentra apoyo comunitario en el chat público del grupo SimpleX. Si quieres pasar el rato con otros robots geniales y aprender más sobre RoboSats, entonces esas discusiones ocurren en los chats de grupo SimpleX, Nostr y Matrix.
  - [Grupo de Desarrollo RoboSats](https://simplex.chat/contact#/?v=2-7&smp=smp%3A%2F%2F6iIcWT_dF2zN_w5xzZEY7HI2Prbh3ldP07YTyDexPjE%3D%40smp10.simplex.im%2FKEkNLMlgM8vrrU3xjBt5emS7EsP0c4s1%23%2F%3Fv%3D1-3%26dh%3DMCowBQYDK2VuAyEABehx7Tgefl_vvOGOe2SThJCGACKRgSU2wiUdIJ5bQHw%253D%26srv%3Drb2pbttocvnbrngnwziclp2f4ckjq65kebafws6g4hy22cdaiv5dwjqd.onion&data=%7B%22type%22%3A%22group%22%2C%22groupLinkId%22%3A%22gFi-9hvL3XgXXTgnlZPyJw%3D%3D%22%7D). Principal grupo de chat de comunicación de desarrolladores donde tienen lugar discusiones abiertas y técnicas sobre el desarrollo. La discusión sobre los cambios en el código se realiza en GitHub issues y pull requests (PRs).

- **Nostr:** [Grupo General RoboSats](https://chachi.chat/groups.0xchat.com/925b1aa20cd1b68dd9a0130e35808d66772fe082cf3f95294dd5755c7ea1ed59). Pasa el rato con otros robots geniales y no dudes en hacer preguntas sobre RoboSats. Además, la cuenta [Nostr RoboSats](https://njump.me/npub1gdfr0r0an32jalqryqlvpn3gsef2hu832wv6kp5p2gt2aqa2n8yqd42ffw) proporciona actualizaciones importantes del proyecto, consejos y trucos sobre el uso de RoboSats y otros comentarios centrados en la privacidad. Las preguntas y la participación son bienvenidas. Recuerda: los problemas que requieran la ayuda del personal de RoboSats deben dirigirse al chat principal del grupo SimpleX, donde las respuestas son más rápidas y el personal puede investigar más a fondo su problema.

## Flujo de trabajo de los colaboradores

Todos los colaboradores de RoboSats envían cambios a través de pull requests. El flujo de trabajo es el siguiente:
 - Fork el repositorio
 - Crear una rama a partir de la rama `main`
 - Haz commit de los cambios
 - Elimina/Squash commits redundantes o innecesarios
 - Envíe un pull request desde tu rama a la rama `main` del repositorio principal
 - Realiza cambios en el pull request si los revisores lo solicitan y pide una nueva revisión

Los pull requests deben centrarse en un único cambio. No mezcle, por ejemplo, refactorizaciones con una corrección de errores o la implementación de una nueva característica. Esta práctica facilita a los colaboradores la revisión de cada pull request.

## Revisión de Pull Requests

Robosats sigue el flujo de revisión establecido por el proyecto Bitcoin Core. Lo siguiente es una adaptación de la [Bitcoin Core contributor documentation](https://github.com/bitcoin/bitcoin/blob/master/CONTRIBUTING.md#peer-review):

Cualquiera puede participar en la revisión por pares que se expresa mediante comentarios en el pull request. Típicamente los revisores revisarán el código en busca de errores obvios, así como probar el parche y opinar sobre los méritos técnicos del parche. Los mantenedores del proyecto tienen en cuenta la revisión por pares a la hora de determinar si hay consenso para fusionar una pull request (recuerda que las discusiones pueden haberse repartido entre GitHub y Telegram). El siguiente lenguaje se utiliza en los comentarios de pull-request:
 - `ACK` significa "He probado el código y estoy de acuerdo en que se fusione";
 - `NACK` significa "No estoy de acuerdo en que esto se fusione", y debe ir acompañado de una justificación técnica sólida. Los NACK que no vayan acompañados de una justificación pueden no tenerse en cuenta;
 - `utACK` significa "No he probado el código, pero lo he revisado y parece correcto, estoy de acuerdo en que se fusione";
 - El `concepto ACK` significa "Estoy de acuerdo con el principio general de esta solicitud de extracción";
 - `Nit` se refiere a problemas triviales, a menudo no bloqueantes.

Tenga en cuenta que los Pull Requests marcados con `NACK` y/o `Change requested` de GitHub se cierran a los 30 días si no se atienden.

## Compensación para desarrolladores (Programa piloto)

[Consulta el estado actual de las tareas compensadas para desarrolladores en el proyecto de Github](https://github.com/users/Reckless-Satoshi/projects/2/views/5)

Por el momento, RoboSats es un proyecto joven y sin financiación, pero ha demostrado la capacidad de generar ingresos suficientes para cubrir a duras penas los costes operativos. Un programa de compensación a los desarrolladores es la mejor manera de garantizar el apoyo sostenido de la base de código. Por el momento, las contribuciones de código al núcleo del proyecto recibirán pequeñas recompensas más parecidas a una propina que a una compensación monetaria significativa. El procedimiento piloto para el desarrollo compensado:

1. El desarrollador abre un PR con la descripción del trabajo que va a realizar, incluyendo opcionalmente la cantidad de Sats que cree que merece el trabajo.
2. Se produce una oferta/negociación para fijar una cantidad de Sats hasta llegar a un acuerdo. Todo el mundo es bienvenido a expresar su opinión sobre si la compensación es adecuada para el RP.
3. El trabajo se lleva a cabo: ¡construir, construir, construir!
4. La revisión tiene lugar. Una vez que los mantenedores dan el visto bueno a la fusión...
5. El desarrollador presenta una factura LN (con un largo plazo de vencimiento). La factura se paga en el momento de la fusión.

Cada paso (negociación, envío de código, revisión y envío de factura) debe realizarse públicamente en GitHub (es decir, nada de mensajes privados ni similares). Póngase en contacto con el jefe del equipo de desarrollo (@reckless-satoshi) por adelantado si tiene dudas sobre si su contribución es adecuada para recibir una compensación. Actualmente, sólo las contribuciones a la funcionalidad y mantenimiento del frontend o backend son elegibles para compensaciones (por el momento, esto excluye: arte, traducciones, etc.).

## Convenciones de estilo y codificación

### Configurar nombre de usuario Git y metadatos de correo electrónico

Ver https://help.github.com/articles/setting-your-username-in-git/ para instrucciones.

### Escribir mensajes de commits bien formados

De https://chris.beams.io/posts/git-commit/#seven-rules:

 1. Separa el asunto del cuerpo con una línea en blanco
 2. Limite la línea de asunto a 50 caracteres (*)
 3. Escriba el asunto en mayúsculas
 4. No termine el asunto con un punto
 5. Utilice el modo imperativo en el asunto
 6. Envuelva el cuerpo a 72 caracteres (*)
 7. Utilice el cuerpo para explicar qué y por qué en lugar de cómo.

### Firma tus commits con GPG

Ver https://github.com/blog/2144-gpg-signature-verification para más información y
https://help.github.com/articles/signing-commits-with-gpg/ para instrucciones.

### Use un editor que soporte Editorconfig

La configuración [.editorconfig](.editorconfig) de este repositorio asegura una gestión consistente de los espacios en blanco. La mayoría de los editores modernos lo soportan de forma nativa o con un plugin. Vea http://editorconfig.org para más detalles.

### Mantener limpio el historial de git

Es muy importante mantener el historial git claro, ligero y fácilmente navegable. Esto significa que los contribuidores deben asegurarse de que sus pull requests incluyen sólo commits significativos (si son redundantes o fueron añadidas después de una revisión, deben ser eliminadas) y _no merge commits_.

### Mirros
- https://git.robosats.org/Robosats
- https://codeberg.org/Robosats