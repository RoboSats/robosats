---
layout: single
title: Encriptación fácil con PGP
permalink: /docs/pgp-encryption/es/
toc: true
toc_sticky: true
sidebar:
  title: '<img id="side-icon-verybig" src="/assets/vector/fingerprint.svg"/>Encriptación PGP'
  nav: docs
src: "_pages/docs/es/01-best-practices/01-pgp-guide_es.md"
---

Cómo usar OpenKeychain para cifrar datos sensibles al usar RoboSats.

## ¿Por qué es necesaria la encriptación?

Dado que RoboSats funciona a través de la red Tor, todas las comunicaciones están cifradas de extremo a extremo. Esto ayuda a prevenir ataques de intermediarios que podrían leer o manipular datos durante su transmisión. Además, el protocolo Tor asegura que el usuario esté conectado al nombre de dominio en la barra de direcciones del navegador, en este caso la dirección Tor oficial de RoboSats (robosatsy56bwqn56qyadmcxkx767hnabg4mihxlmgyt6if5gnuxvzad.onion). Sin embargo, en RoboSats v0.1.0, los datos se transfieren como texto sin formato a través del front-end (la interfaz de usuario) y el back-end (administración) de la aplicación. Esto podría hacer que los datos confidenciales como la información del pago en fiat (ARS, EUR, USD, …) puedan ser interceptados por un rastreador malicioso en el dispositivo de cualquiera de las partes o incluso en el servidor de RoboSats en la capa de abstracción de la aplicación. Esto supondría un ataque a la privacidad del titular de los datos. Incluso si el chat de RoboSats estuviera completamente encriptado en cada paso, no deberías confiar en que los datos confidenciales estén encriptados. La mejor práctica para evitar este problema es usar encriptación asimétrica durante el intercambio de datos confidenciales. Esta guía detalla un método que garantiza la confidencialidad de los datos personales utilizando el estándar PGP.

## La aplicación OpenKeychain.

OpenKeychain es una aplicación de Android de código abierto que permite crear y administrar pares de claves criptográficas y firmar y/o cifrar/descifrar texto y archivos. OpenKeychain se basa en el estándar OpenPGP que hace que el cifrado sea compatible en todos los dispositivos y sistemas. Puedes consultar una lista de software compatible para Windows, Mac OS y otros sistemas operativos, en este enlace: [openpgp.org/software/](https://openpgp.org/software/). Ya que el concepto es el mismo, este método se puede replicar utilizando cualquier otra aplicación. La aplicación OpenKeychain se puede encontrar en F-droid.org [[Link]](https://f-droid.org/packages/org.sufficientlysecure.keychain/) o en Google play store [[Link]](https://play.google.com/store/apps/details?id=org.sufficientlysecure.keychain)

<div align="center">
    <img src="/assets/images/sensitive-data-PGP-guide_es/OpenKeychain-logo.png" width="150"/>
</div>

## Esquema de cifrado.

En la mayoría de los casos, la información confidencial que queremos proteger es la información de pago en moneda fiat del vendedor, es decir: el número de teléfono, la cuenta de PayPal, etc. La imagen a continuación muestra el esquema de encriptación que garantiza que la información de pago del vendedor solo pueda ser leída por el comprador.

<div align="center">
    <img src="/assets/images/sensitive-data-PGP-guide_es/encrypted-communication-schema_es.png" width="900"/>
</div>

El proceso de intercambio de datos se ha dividido en 3 sencillos pasos:

- Creación de pares de claves por parte del comprador.

- Compartir la clave pública del comprador con el vendedor.

- Intercambio de datos encriptados.

## Guía paso a paso.

### Creación de pares de claves por parte del comprador.

El primer paso para garantizar la confidencialidad de los datos es crear un par de claves pública/privada. A continuación se muestran los pasos para crear un par de claves en la aplicación OpenKeychain. Este procedimiento solo debe ser realizado por el comprador. Este paso solo se debe realizar una vez, no es necesario repetirlo cuando el comprador quiera volver a comprar, ya que en una futura operación ya tendrá el par de claves.

<br/>

<div align="center">
    <img src="/assets/images/sensitive-data-PGP-guide_es/PGP-keys-creation-steps_es.png" width="900"/>
</div>

<br/>

### Compartir la clave pública del comprador con el vendedor.

Ahora el comprador tiene dos claves: la clave privada sólo debe ser conocida por su propietario (en este caso concreto el comprador, que también la ha creado); la clave pública puede ser conocida por cualquier otra persona (el vendedor). El vendedor necesita la clave pública del comprador para cifrar los datos confidenciales, por lo que el comprador debe enviar el texto sin formato que representa la clave pública. Los pasos a continuación muestran cómo compartir el texto sin formato que representa la clave pública (imágenes 1-2), y también cómo el vendedor puede agregarla a su aplicación OpenKeychain para usarla más tarde (imágenes 3-8).

<br/>

<div align="center">
    <img src="/assets/images/sensitive-data-PGP-guide_es/pub-key-sharing-steps_es.png" width="900"/>
</div>

<br/>

La clave debe copiarse incluyendo el encabezado `(-----BEGIN PGP PUBLIC KEY BLOCK-----)` y el pie de página `(-----END PGP PUBLIC KEY BLOCK-----)` para el funcionamiento correcto de la aplicación.

### Intercambio de datos encriptados.

Una vez que el vendedor tiene la clave pública del comprador, se puede aplicar el esquema de cifrado que se muestra arriba. Los siguientes pasos describen el proceso de intercambio de datos cifrados.

<br/>

<div align="center">
    <img src="/assets/images/sensitive-data-PGP-guide_es/encrypted-data-sharing-steps_es.png" width="900"/>
</div>

<br/>

Los datos cifrados deben copiarse incluyendo el encabezado `(-----BEGIN PGP MESSAGE-----)` y el pie de página `(-----END PGP MESSAGE-----)` para el funcionamiento correcto de la aplicación. Si el comprador visualiza correctamente en la app los datos del vendedor significa que el intercambio ha sido exitoso y la confidencialidad de los datos está asegurada ya que la única clave que puede descifrarlos es la clave privada del comprador.

Si quieres leer un tutorial sobre cómo usar OpenKeychain para uso general, consulta [As Easy as P,G,P](https://diverter.hostyourown.tools/as-easy-as-pgp/)

{% include improve_es %}
