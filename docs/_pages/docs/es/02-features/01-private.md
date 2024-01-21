---
layout: single
title: Privado por defecto
permalink: /docs/es/private/
toc: true
toc_sticky: true
sidebar:
  title: '<img id="side-icon-verybig" src="/assets/vector/user-ninja.svg"/>Privado'
  nav: docs
src: "_pages/docs/es/02-features/01-private.md"
---

<!-- TODO: explain TOR, high entropy avatar, no registration, no identity reuse, lightning onion routing, no logs policy, etc. -->
RoboSats es absolutamente privado por defecto. Los cuatro ingredientes principales son:

1. **Sin registro.** Con un solo click generarás un avatar de robot: eso es todo lo que necesitas. Dado que no se necesita correo electrónico, teléfono, nombre de usuario o cualquier entrada del usuario, no hay forma posible de cometer un error y identificarte a ti mismo. Tus avatares de Robot no se pueden vincular a ti.
2. **Comunicación encriptada con PGP auditable.** Cada robot tiene un par de claves PGP para encriptar la comunicación de extremo a extremo. RoboSats hace que sea muy fácil para ti exportar tus claves y [<b>verificar por ti mismo</b>](/docs/es/pgp-encryption/) que la comunicación es privada con cualquier otra aplicación de terceros que implemente el estándar OpenPGP.
3. **Solo en la red Tor.** Tu ubicación o dirección IP nunca es conocida por el nodo o tus pares.
4. **Una identidad -> un intercambio.** Puede (y se recomienda) operar con una identidad diferente cada vez. Es conveniente y fácil. Ningún otro exchange tiene esta característica y **¡es fundamental para la privacidad!** En RoboSats, los observadores no tienen forma de saber que el mismo usuario ha realizado varios intercambios si usó diferentes avatares de robot.

La combinación de estas características hace que los intercambios en RoboSats sean lo más privados posible.

## Generación de avatares de robot
<div align="center">
    <img src="/assets/images/private/usergen-pipeline.png" width="650"/>
</div>

Solo tu contraparte puede conocer cosas sobre ti mientras chateais. Mantén el chat breve y conciso y evita proporcionar más información de la estrictamente necesaria para el intercambio fiat.

**ProTip** Puedes mejorar tu privacidad usando una [billetera proxy](/docs/es/proxy-wallets/) lightning cuando compre Sats en RoboSats.
{: .notice--primary}


{% include wip_es %}
