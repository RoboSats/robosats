---
layout: single
title: "La red Lightning"
permalink: /docs/es/lightning/
toc: true
toc_sticky: true
sidebar:
  title: '<img id="side-icon-verybig" src="/assets/vector/bolt.svg"/>Red Lightning'
  nav: docs
src: "_pages/docs/es/00-quick-start/01-lightning.md"
---

La Red Lightning, o simplemente LN, es una red de micropagos fuera de la cadena (capa dos) que ofrece bajos costos y pagos instantáneos. RoboSats aprovecha las ventajas de realizar transacciones fuera de la cadena para brindar a los usuarios una experiencia rápida y económica. ¡Hay muchos recursos excelentes disponibles para aprender más sobre cómo funciona la Red Lightning! Consulta ["Mastering the Lightning Network"](https://github.com/lnbook/lnbook) como uno de esos recursos destacados.

RoboSats es experimental y, como tal, actualmente es respaldado por un [nodo coordinador experimental](https://amboss.space/node/{{site.robosats.node_id}}). La próxima [actualización de federación](https://github.com/RoboSats/robosats/pull/601) permite que cualquiera se convierta en un nodo coordinador y apoye la federación de RoboSats, creando así un libro de pedidos descentralizado pero unificado compuesto por miembros de la federación compitiendo entre sí para atraer a los comerciantes.

## **Usando de la Red Lightning**

Un requisito previo para usar LN es una wallet. Se recomienda encarecidamente utilizar una wallet no custodial y de código abierto donde solo tú tengas las claves. las wallet custodiales y cerradas pueden recopilar información sobre tus transacciones, información de la cuenta y posiblemente otros metadatos. Además, recuerda que cualquier fondo mantenido en LN no se considera almacenamiento en frío, sino que está en una wallet "caliente" conectada a Internet. Para usar RoboSats, se recomienda utilizar una wallet que sea compatible con [facturas de retención de Lightning](/docs/es/escrow/#qué-es-una-factura-de-retención), consulta [Entender > Wallets](/docs/es/wallets/) para obtener una lista no exhaustiva de la compatibilidad de las wallet LN.

Al utilizar Lightning, los pagos se realizan mediante facturas. El receptor de Sats proporciona una factura al remitente de Sats, a menudo en forma de un código QR, solicitando al remitente que pague la cantidad específica de Sats solicitada por la factura. La factura comienza con el prefijo "lnbc" y se puede decodificar para inspeccionar su contenido, como la cantidad de Sats enviados, el ID del nodo al que se enviaron los Sats, cualquier descripción proporcionada, etc.

La Red Lightning, tal y como está, no es completamente privada. Los usuarios deben tener cuidado de no revelar información sensible al enviar y recibir pagos en LN. No confíes en una wallet codigo cerrado y custodial para respetar tu información; puedes obtener un mayor grado de privacidad si usas una wallet no custodial. Además, consulta [Mejores Prácticas > Wallets Proxy](/docs/es/proxy-wallets/) para obtener más información sobre preocupaciones de privacidad al recibir Sats a través de LN.

## **"Travesuras" en la Red Lightning**

Aunque es poco frecuente, puede suceder que algún nodo de enrutamiento intermedio se desconecte o que la transacción quede "atascada" al intentar un pago. Informalmente conocidos como "travesuras" en la Red Lightning, problemas como este se deben a las limitaciones actuales de LN. Se resuelven por sí mismos después de unas horas o como máximo un par de días.

Al comprar bitcoin (recibir Sats en LN), la factura que proporcionas puede fallar en el enrutamiento y requerir muchos intentos. RoboSats intenta enviar los Sats tres veces y, si falla, solicitará una nueva factura para intentarlo nuevamente. ¡Repite este proceso hasta que se envíe! Durante este tiempo, tus fondos se consideran seguros.

En caso de tal escenario, realiza una copia de seguridad segura del token privado de tu robot y verifica periódicamente el pago de tu pedido. Si el problema persiste, no dudes en comunicarte con el [grupo de soporte de SimpleX](/contribute/code/#communication-channels) para que el personal de RoboSats pueda investigar.


{% include wip_es %}
