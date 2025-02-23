---
layout: single
title: Encriptación fácil con PGP
permalink: /docs/es/pgp-encryption/
toc: true
toc_sticky: true
sidebar:
  title: '<img id="side-icon-verybig" src="/assets/vector/fingerprint.svg"/>Encriptación PGP'
  nav: docs
src: "_pages/docs/es/01-best-practices/01-pgp-guide.md"
---

# Encriptación PGP en RoboSats

Todas las comunicaciones en RoboSats están encriptadas con PGP. La aplicación del cliente es completamente transparente y ofrece una manera fácil de copiar y exportar las claves PGP.

## Verifica la privacidad de tu comunicación

Puedes garantizar la confidencialidad de tus datos sensibles verificando la implementación del estándar PGP en RoboSats. Cualquier implementación de PGP de terceros que te permita importar claves y mensajes puede usarse para verificar el chat de RoboSats. En esta pequeña guía, usaremos la herramienta de línea de comandos [GnuPG](https://gnupg.org/).

### Importar claves en GnuPG
#### Importar tu clave privada encriptada
Cada avatar de robot tiene una clave pública y una clave privada encriptada. Podemos importar la clave privada a GPG, primero la copiamos desde RoboSats:

<div align="center">
    <img src="/assets/images/sensitive-data-PGP-guide/copy-private-key.png" width="550"/>
</div>

Luego la importamos en GnuPG con el siguiente comando:

```
echo "<pega_tu_clave_privada_encriptada>" | gpg --import
```


Se verá así:

<div align="center">
    <img src="/assets/images/sensitive-data-PGP-guide/gpg-1.png" width="450"/>
</div>

Se te pedirá que ingreses la contraseña de la clave privada. Usamos nuestro *token* de robot **supersecreto** para desencriptarlo, tú eres el único que conoce el *token* del robot.

<div align="center">
    <img src="/assets/images/sensitive-data-PGP-guide/gpg-2.png" width="350"/>
</div>

Si tu token es el correcto, habrás importado la clave privada para la comunicación.
<div align="center">
    <img src="/assets/images/sensitive-data-PGP-guide/gpg-3.png" width="650"/>
</div>
Podemos ver cómo la aplicación frontal llamó a esta clave `"RoboSats ID<hash>"`. Este es el ID del robot, el segundo hash SHA256 de nuestro *token* secreto, y se usó originalmente para generar de manera determinista el apodo y la imagen de avatar del robot ([aprende más](/docs/es/private/#generación-de-avatares-de-robot)).

#### Importar la clave pública de tu compañero
Solo necesitamos repetir los pasos anteriores para importar la clave pública de nuestro compañero.

```
echo "<pega_la_clave_publica_de_tu_companero>" | gpg --import
```

<div align="center">
    <img src="/assets/images/sensitive-data-PGP-guide/gpg-4.png" width="650"/>
</div>

Estamos listos. Hemos importado nuestra clave privada encriptada y la clave pública de nuestro compañero en GPG. Hasta ahora, todo parece estar bien.

### Desencriptar y verificar mensajes con GnuPG
#### Desencriptar mensaje
Ahora intentemos leer uno de los mensajes encriptados que nuestro compañero nos envió y veamos si se pueden desencriptar con nuestra clave privada y están correctamente firmados por él.

<div align="center">
    <img src="/assets/images/sensitive-data-PGP-guide/chat-1.png" width="320"/>
</div>

Haciendo clic en el icono del "ojo", podemos ver el mensaje PGP ASCII en bruto. Podemos hacer clic en el botón de copiar para llevarlo a GnuPG.

<div align="center">
    <img src="/assets/images/sensitive-data-PGP-guide/chat-2.png" width="320"/>
</div>

Todo lo que queda es desencriptar el mensaje PGP de nuestro compañero usando nuestra clave privada. Es muy probable que GnuPG nos pida nuevamente nuestro *token* para desencriptar nuestra clave privada.

```
echo "<pega_el_mensaje_de_tu_companero>" | gpg --decrypt
```

#### Verificación del mensaje encriptado

<div align="center">
    <img src="/assets/images/sensitive-data-PGP-guide/gpg-5.png" width="650"/>
</div>

¡Voilà! Aquí está. Podemos estar seguros de que:
1. El **mensaje encriptado dice** "¡Es tan genial que RoboSats tenga una forma tan transparente de verificar tu comunicación encriptada!" (Marcado en rojo)
2. El mensaje solo puede ser desencriptado por 2 claves privadas: la nuestra y la de nuestro compañero. **¡Nadie más puede leerlo!** (marcado en azul)
3. El mensaje **fue firmado por nuestro compañero**, debe ser él. Nadie se ha infiltrado en este chat pretendiendo ser tu compañero. (marcado en verde)

Dado que los mensajes son firmados por los robots que llevan el registro, nuestro *token* de robot es muy útil en caso de una disputa. Si tu compañero intenta engañarte y luego miente al personal encargado de resolver la disputa, ¡puedes demostrarlo! Es útil exportar el registro completo del chat como Json (haz clic en el botón de exportación) o, al menos, conservar tu *token* de robot. Con eso, puedes proporcionar evidencia excelente de que dijo algo diferente en el chat privado contigo.

La aplicación frontal de RoboSats que se ejecuta en tu navegador realiza la tarea de encriptar, desencriptar y verificar cada mensaje. Pero en este tutorial lo hemos verificado de manera independiente y funciona como se espera: hemos verificado que **solo la persona con acceso al token del robot puede leer (desencriptar) y firmar mensajes** durante una transacción de RoboSats.

**Consejo profesional:** Para verificar de manera independiente que tu token es absolutamente secreto y nunca se envía a un tercero, necesitarás ejecutar un sniffer de paquetes de solicitudes HTTP. También puedes verificar por ti mismo el [código fuente del frontend](https://github.com/RoboSats/robosats/tree/main/frontend/src).
{: .notice--secondary}

## Legado: ¿Por qué se necesita la encriptación?

Inicialmente, RoboSats no tenía una configuración de encriptación PGP incorporada. Por lo tanto, los usuarios tenían que hacerlo manualmente para asegurar que sus comunicaciones fueran privadas. A continuación, se presenta un documento antiguo para aprender cómo encriptar tu comunicación usando OpenKeychain en Android. Sin embargo, la misma herramienta también se puede usar para verificar el canal de encriptación incorporado. ¿Quién sabe? Tal vez quieras encriptar tus mensajes dos veces. Entonces, esta es tu guía.

Dado que RoboSats funciona a través de la red TOR, todas las comunicaciones están cifradas de extremo a extremo. Esto ayuda a prevenir que los datos en tránsito sean leídos o manipulados por ataques de intermediarios. Además, el protocolo TOR asegura que el usuario está conectado al nombre de dominio en la barra de direcciones del navegador, en este caso, la dirección oficial de RoboSats en TOR (robosatsy56bwqn56qyadmcxkx767hnabg4mihxlmgyt6if5gnuxvzad.onion). Sin embargo, en RoboSats v0.1.0, los datos se transferían en texto plano a través del front-end y el back-end de la aplicación. Este comportamiento permitía la posibilidad de que un sniffer malintencionado en la computadora de cualquiera de las partes o incluso en el servidor de RoboSats en la capa de abstracción de la aplicación capturara datos sensibles intercambiados sobre información de pago en moneda fiduciaria. Esto representaría un ataque a la privacidad del propietario de los datos. Incluso si el chat de RoboSats estuviera completamente encriptado en cada paso, aún así no debes confiar en que los datos sensibles estén encriptados (ver la guía de verificación anterior). La mejor práctica para evitar este problema era usar encriptación asimétrica durante el intercambio de datos sensibles; esta guía muestra un método que garantiza la confidencialidad de los datos sensibles utilizando el estándar PGP.

### Aplicaciones PGP

#### Android
OpenKeychain es una aplicación de Android de código abierto que te permite crear y gestionar pares de claves criptográficas y firmar y/o encriptar/desencriptar texto y archivos. OpenKeychain se basa en el bien establecido estándar OpenPGP, haciendo que la encriptación sea compatible entre dispositivos y sistemas. La aplicación OpenKeychain se puede encontrar en [[F-droid.org]](https://f-droid.org/packages/org.sufficientlysecure.keychain/) o en la tienda Google Play [[Enlace]](https://play.google.com/store/apps/details?id=org.sufficientlysecure.keychain).

<div align="center">
    <img src="/assets/images/sensitive-data-PGP-guide_es/OpenKeychain-logo.png" width="150"/>
</div>

#### iOS
PGPro es una aplicación de iOS de código abierto que te permite crear y gestionar pares de claves criptográficas y firmar y/o encriptar/desencriptar texto y archivos. PGPro se basa en ObjectivePGP, que es compatible con OpenPGP. Puede encontrarse en su sitio web [[Enlace]](https://pgpro.app/) o en la tienda de aplicaciones de Apple [[Enlace]](https://apps.apple.com/us/app/pgpro/id1481696997).

<div align="center">
    <img src="/assets/images/sensitive-data-PGP-guide_es/OpenKeychain-logo.png" width="150"/>
</div>

#### Otros
Para obtener una lista de software compatible con Windows, Mac OS y otros sistemas operativos, consulta [openpgp.org/software/](https://openpgp.org/software/). Dado que el concepto es el mismo, este método se puede replicar utilizando cualquier otra aplicación.

### Esquema de encriptación.

En la mayoría de los casos, la información sensible que queremos proteger es la información de pago en moneda fiduciaria del vendedor, es decir, el número de teléfono, la cuenta de PayPal, etc. Por lo tanto, la imagen a continuación muestra el esquema de encriptación que garantiza que la información de pago del vendedor solo pueda ser leída por el comprador.

<div align="center">
    <img src="/assets/images/sensitive-data-PGP-guide_es/encrypted-communication-schema_es.png" width="900"/>
</div>

El proceso de intercambio de datos se ha dividido en 3 pasos sencillos:

- Creación de pares de claves por parte del comprador.

- Compartir la clave pública del comprador con el vendedor.

- Intercambio de datos encriptados.

### Guía paso a paso.

#### Creación de pares de claves por parte del comprador.

El primer paso para garantizar la confidencialidad de los datos es crear un par de claves pública/privada. A continuación, se muestran los pasos para crear un par de claves en la aplicación OpenKeychain; este procedimiento solo necesita hacerlo el comprador. Este paso solo necesita hacerse una vez, no es necesario repetirlo cuando los compradores deseen comprar de nuevo, ya que en una transacción futura ya tendrán el par de claves.

<br/>

<div align="center">
    <img src="/assets/images/sensitive-data-PGP-guide_es/PGP-keys-creation-steps_es.png" width="900"/>
</div>

<br/>

#### Compartir la clave pública del comprador con el vendedor.

Ahora el comprador tiene dos claves, la clave privada debe conocerla únicamente su propietario (en este caso específico, el comprador, quien también la ha creado), y la clave pública puede ser conocida por cualquier otra persona (el vendedor). El vendedor necesita la clave pública del comprador para cifrar los datos sensibles, por lo que el comprador debe enviar el texto plano que representa la clave pública. Los pasos a continuación muestran cómo compartir el texto plano que representa la clave pública, así como cómo el vendedor la agrega a su aplicación OpenKeychain para usarla más tarde.

<br/>

<div align="center">
    <img src="/assets/images/sensitive-data-PGP-guide_es/pub-key-sharing-steps_es.png" width="900"/>
</div>

<br/>

La clave debe copiarse, incluyendo el encabezado `(-----BEGIN PGP PUBLIC KEY BLOCK-----)` y el pie de página `(-----END PGP PUBLIC KEY BLOCK-----)` para el correcto funcionamiento de la aplicación.

### Intercambio de datos cifrados.

Una vez que el vendedor tiene la clave pública del comprador, se puede aplicar el esquema de cifrado mostrado anteriormente. Los siguientes pasos describen el proceso de intercambio de datos cifrados.

<br/>

<div align="center">
    <img src="/assets/images/sensitive-data-PGP-guide_es/encrypted-data-sharing-steps_es.png" width="900"/>
</div>

<br/>

Los datos cifrados deben copiarse incluyendo el encabezado `(-----BEGIN PGP MESSAGE-----)` y el pie de página `(-----END PGP MESSAGE-----)` para el funcionamiento correcto de la aplicación. Si el comprador visualiza correctamente en la app los datos del vendedor significa que el intercambio ha sido exitoso y la confidencialidad de los datos está asegurada ya que la única clave que puede descifrarlos es la clave privada del comprador.

Si quieres leer un tutorial sobre cómo usar OpenKeychain para uso general, consulta [As Easy as P,G,P](https://diverter.hostyourown.tools/as-easy-as-pgp/)

{% include improve_es %}
