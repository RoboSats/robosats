---
layout: single
title: Deposito de fianza
permalink: /docs/es/escrow/
toc: true
toc_sticky: true
sidebar:
  title: '<img id="side-icon-verybig" src="/assets/vector/money-bill-transfer.svg"/>Deposito de fianza'
  nav: docs
src: "_pages/docs/es/03-understand/05-trade-escrow.md"
---

Cuando se vende bitcoin, se utiliza un deposito de fianza para proteger al comprador contra fraudes o impagos. la fianza actúa como una garantía de seguridad, aprovechando las [facturas de retención](https://github.com/lightningnetwork/lnd/pull/2022) de Lightning para una transacción sin confianza entre robots.

El tiempo asignado para presentar (bloquear) un deposito de fianza es determinado por el creador del pedido. El temporizador de vencimiento de la fianza predetermina a tres horas; sin embargo, esto se puede personalizar para variar entre una y ocho horas.

Si el vendedor no bloquea el deposito de fianza dentro del límite de tiempo dado en el pedido, entonces el vendedor pierde su fianza de fidelidad. Consulta [Entender > Fianzas](/docs/es/bonds/) para obtener información adicional sobre las fianzas de fidelidad. Además, si se abre una disputa, los satoshis en la fianza se liberan al ganador de la disputa.

Asegúrate de utilizar una wallet Lightning que funcione bien con RoboSats, consulta [Entender > Wallets](/docs/es/wallets/) para obtener información adicional.

*Nota: El término "vendedor" se refiere a la venta de bitcoin, mientras que "comprador" se refiere a la compra de bitcoin.*

## **Qué es una Factura de Retención**

Las facturas de retención de Lightning, también conocidas como facturas retenidas, son un tipo de factura que "bloquea" fondos en tu billetera y luego "desbloquea" esos fondos según el estado de la factura, según lo determine el receptor. En algunas wallets, la interfaz de usuario describe este tipo de pago como un pago "en tránsito" o "congelado".

A diferencia de los pagos típicos de Lightning que se bloquean y liquidan inmediatamente cuando llega el pago, una factura de retención solo bloquea el pago pero aún no lo liquida. A partir de este momento, el remitente no puede revocar su pago y, por lo tanto, los fondos están bloqueados en tu billetera pero aún no han salido de ella. El receptor elige si liquida (completa) o desbloquea (cancela) el HTLC y la factura.

En la práctica, la factura de retención de fianza está bloqueada hacia el nodo coordinador experimental de RoboSats. Esto significa que la factura se cobra exactamente cuando el vendedor hace clic en "Confirmar Fiat Recibido" y luego se paga la factura al comprador. Durante el tiempo que lleva liquidar el pago de Lightning al comprador, RoboSats tiene los fondos mientras intenta realizar repetidamente el pago al comprador.

Este método es, en este momento, el enfoque más seguro para asegurar que los compañeros cumplan con su parte del trato, ya que aún no se ha demostrado prácticamente una factura de retención directa entre el vendedor y el comprador con wallets convencionales.

## **Cómo Presentar un deposito de fianza**

Primero, consulta [Entender > Wallets](/docs/es/wallets/) para conocer las wallet Lightning compatibles que facilitarán el uso de RoboSats. Dependiendo de la wallet, los fondos bloqueados pueden mostrarse como un pago en tránsito, congelado o incluso como si fallara. ¡Revisa la lista de compatibilidad de la wallet!

Lee la guía relevante según si estás creando o tomando un pedido para vender bitcoin:

-   Creador: Selecciona "Hacer Pedido" y modifica las condiciones del pedido a tu gusto. El pedido se puede personalizar para requerir un "Tiempo de Espera de Depósito de fianza" (temporizador de vencimiento) diferente al predeterminado de tres horas, variando entre una y ocho horas. Cuando tu pedido en vivo sea tomado y el tomador haya presentado su fianza de fidelidad, usa el código QR que se muestra en la "Caja de Contratos" con tu billetera Lightning para bloquear la cantidad indicada de satoshis como garantía. *Nota: Los fondos de fianza se liberan al comprador una vez que seleccionas "Confirmar Fiat Recibido", lo que resuelve el pedido. Solo confirma después de que el fiat haya llegado a tu cuenta.*
-   Tomador: Navega por el libro de pedidos y encuentra un pedido de tu agrado. Simplemente selecciona la opción "Tomar Pedido" y bloquea tu fianza de fidelidad. Inmediatamente después de enviar la fianza, usa el siguiente código QR que se encuentra en la "Caja de Contratos" con tu billetera Lightning para bloquear la cantidad indicada de satoshis como garantía. *Nota: Los fondos de fianza se liberan al comprador una vez que seleccionas "Confirmar Fiat Recibido", lo que resuelve el pedido. Solo confirma después de que el fiat haya llegado a tu cuenta.*

Tan pronto como el tomador del pedido bloquea su fianza, el comprador y el vendedor deben presentar la factura de pago y el deposito de fianza, respectivamente, dentro del límite de tiempo dado.

De forma predeterminada, el temporizador de vencimiento es de tres horas; sin embargo, como creador del pedido, puedes personalizar el temporizador para que varíe entre una y ocho horas. En otras palabras, modifica el tiempo permitido para bloquear los fondos de fianza y proporcionar la factura de pago. Tal vez quieras una transacción rápida y establecer el temporizador a un máximo de una hora en lugar de tres horas.

Si bloqueas los fondos de fianza antes de que el comprador haya proporcionado la factura de pago, deberás esperar para chatear con tu par hasta después de que hayan proporcionado la factura.

Si no bloqueas los fondos de fianza en absoluto, entonces el pedido expirará y el vendedor perderá su fianza. La mitad de la fianza perdida se destina al robot honesto como compensación por el tiempo perdido. Del mismo modo, si el comprador no proporciona la factura de pago dentro del límite de tiempo establecido, el comprador pierde su fianza.

Después de que se bloquea el deposito de fianza, el pedido no se puede cancelar excepto si tanto el creador como el tomador están de acuerdo en cancelarlo de manera colaborativa. Además, después de que el vendedor confirma que se recibió el fiat, el pedido ya no se puede cancelar de manera colaborativa. El pedido puede completarse con éxito o entrar en una disputa.

## **Cómo y Cuándo se Libera la fianza**

El deposito de fianza siempre se libera a su legítimo propietario según el estado del comercio o, si es necesario, el resultado de la disputa. Hay dos escenarios que hacen que el deposito de fianza se libere:

-   Completar un comercio exitoso (el vendedor confirma que se recibió el fiat)
-   Abrir una disputa si el comercio no tuvo éxito (el vendedor no confirmó intencionalmente que se recibió el fiat)

Los escenarios anteriores se expanden en detalle adicional a continuación.

Una vez que se coordina el método de pago en fiat con el comprador, el vendedor hace clic en "Confirmar Fiat Recibido" para finalizar el comercio, lo que libera los fondos de fianza al comprador. El vendedor solo debe confirmar que se recibió el fiat *después* de que aparezca en su posesión.

Si nunca recibiste el pago en fiat del comprador, no hagas clic en "Confirmar Fiat Recibido" y, en su lugar, abre una disputa para que el personal de RoboSats la revise. Intentar hacer trampa al no confirmar intencionalmente que se recibió el fiat resulta en que se abra automáticamente una disputa en nombre del comprador.

El robot tramposo correrá el riesgo de perder esa disputa y, consecuentemente, perderá su fianza. La totalidad de la fianza bloqueada se libera y se recompensa al robot honesto.

¡No olvides tu pedido! Si tu par envió el fiat y el temporizador del pedido expira antes de que confirmes que se recibió el fiat, correrás el riesgo de perder la siguiente disputa, lo que a su vez hará que pierdas tu fianza. ¡Asegúrate de recordar tu pedido y respalda el token único de tu robot!

Debido a los límites de tiempo involucrados en el proceso del pedido, se recomienda utilizar métodos de pago en fiat instantáneos para evitar exceder el temporizador de vencimiento. Consulta [Mejores Prácticas > Métodos de Pago](/docs/es/payment-methods/) para obtener información adicional.

Aunque sea una ventana de tiempo muy pequeña (aproximadamente un segundo), el deposito de fianza podría perderse permanentemente si RoboSats se cerrara o desapareciera repentinamente entre el momento en que el vendedor confirma que se recibió el fiat y el momento en que la wallet Lightning del comprador registra los fondos de fianza liberados. Utiliza una wallet Lightning bien conectada con suficiente liquidez entrante para ayudar a evitar fallas en el enrutamiento y, por ende, minimizar cualquier ventana de oportunidad de este tipo.

## **Información Adicional**

Algunas wallets Lightning tienen dificultades para reconocer la factura de retención de Lightning como un bloqueo de fondos. Como vendedor, es necesario utilizar una wallet que permita múltiples HTLC pendientes, ya que deberás bloquear fondos para una fianza y luego un fideicomiso.

Si surgen problemas, comunícate con el grupo de Telegram de RoboSats; pero ten cuidado con los estafadores que pueden contactarte directamente e impersonar al personal de RoboSats. El personal de RoboSats nunca se comunicará directamente contigo primero. Consulta [Contribuir > Código > Canales de Comunicación](/contribute/code/#communication-channels) para conocer los grupos de Telegram disponibles.

{% include improve_es %}
