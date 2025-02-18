---
layout: single
title: "Accediendo a RoboSats"
permalink: /docs/es/access/
toc: true
toc_sticky: true
sidebar:
  title: '<img id="side-icon-verybig" src="/assets/vector/arrow-up-right-from-square.svg"/>Acceso'
  nav: docs
src: "_pages/docs/es/00-quick-start/03-access.md"
---

## <img style='width:32px;height:32px' src='/assets/vector/tor.svg'/> De manera privada con TOR

Una forma segura y muy privada de usar RoboSats es a través de la dirección Onion. Necesitas el [navegador TOR](/docs/es/tor/).

> [<b>robosats</b>y56bwqn56qyadmcxkx767hnab<br/>g4mihxlmgyt6if5gnuxvzad.onion](http://robosatsy56bwqn56qyadmcxkx767hnabg4mihxlmgyt6if5gnuxvzad.onion/)

**Privado:** tu conexión será encriptada de extremo a extremo y retransmitida por varias capas de nodos, lo que dificultará el seguimiento.
{: .notice--primary}

## <img style='width:36px;height:38px;-webkit-filter:grayscale(1);filter:grayscale(1);' src='/assets/vector/Itoopie.svg'/> De manera privada con I2P

I2P es otra forma segura y privada de usar RoboSats. Necesitas instalar [I2P](https://geti2p.com/en/download).

> [<b>robosats.i2p</b>?i2paddresshelper=r7r4sckft<br/>6ptmk4r2jajiuqbowqyxiwsle4iyg4fijtoordc6z7a.b32.i2p](http://robosats.i2p?i2paddresshelper=r7r4sckft6ptmk4r2jajiuqbowqyxiwsle4iyg4fijtoordc6z7a.b32.i2p)

## <i class="fa-solid fa-window-maximize"></i> De forma insegura en Clearnet
Hay una forma insegura de acceder a RoboSats sin TOR que se basa en servicios tor2web de terceros. Con esta URL puedes acceder a RoboSats desde cualquier navegador, pero usar esta URL es **altamente desaconsejado!**

> [unsafe.robosats.org](https://unsafe.robosats.org)

**Inseguro:** tu privacidad puede verse comprometida si utilizas la url insegura de clearnet en un navegador web normal.
{: .notice--secondary}

Si usas la URL de clearnet, debeberías asumir que estás siendo espiado. Sin embargo, las funciones más confidenciales de RoboSats están deshabilitadas (por ejemplo, el chat), por lo que los usuarios no pueden proporcionar datos personales. Usa esta URL solo para echar un vistazo rápido al libro de órdenes. Nunca lo uses para intercambiar o iniciar sesión en avatares de Robot activos.

## <i class="fa-solid fa-person-dots-from-line"></i> Todo en uno

Para simplificar las cosas, se ha creado la URL "robosats.org" para que sirva de enlace fácil de recordar y todo en uno para los navegadores. Si utiliza un navegador TOR o I2P, se le dirigirá al sitio Onion o I2P, respectivamente. De lo contrario, se le dirigirá al sitio no seguro de Clearnet.

> [<span style="font-size:larger;">robosats.org</span>](https://robosats.org)


## Otros

### Testnet

Puedes practicar y probar todas las funcionalidades de RoboSats sin perder fondos usando [Testnet Bitcoin](https://en.bitcoin.it/wiki/Testnet). Todo lo que necesitas es una wallet Lightning Testnet, acceder a la plataforma y cambiar a Tesnet desde la pestaña de *Ajustes*

### Clearnet Mirrors
Hay varios servicios tor2web que sirven como mirrors en caso de que uno de ellos no esté disponible

> [unsafe.robosats.org](https://unsafe.robosats.org/) <br/>


{% include improve_es %}
