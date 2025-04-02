---
layout: single
title: Buenas prácticas Fiat
permalink: /docs/es/payment-methods/
toc: true
toc_sticky: true
sidebar:
  title: '<img id="side-icon-verybig" src="/assets/vector/hand-peace.svg"/>Buenas prácticas Fiat'
  nav: docs
src: "_pages/docs/es/01-best-practices/02-payment-methods.md"
---

Actualmente, no hay restricciones en el método de pago fiat. Puedes pagar con cualquier método que tanto tú como tu contraparte acordéis. Esto incluye el método de mayor riesgo, como PayPal, Venmo y Cash. Sin embargo, se recomienda el método de pago con menor riesgo. Puedes conocer más detalles sobre las características y diferencias de cada método de pago fiat en <a href = "https://bisq.wiki/Payment_methods#Payment_method_guides">Bisq wiki</a >. Las pautas de Bisq se aplican como pautas predeterminadas en RoboSats.

## Recomendación general

Esta recomendación se crea como una mejor práctica para operar en la plataforma RoboSats. Estas mejores prácticas es muy recomendable que ambos pares las sigan para garantizar el éxito del intercambio y evitar disputas innecesarias.

Nota: Esta guía es una modificación de las reglas de intercambio de   <a href="https://bisq.wiki/Trading_rules">Bisq</a> y ajustada de acuerdo a las diferencias de funcionamiento de cada plataforma.

### Para ambos comprador y vendedor de bitcoin

  1. Asegúrate de revisar la seccion <a href="https://github.com/Reckless-Satoshi/robosats/blob/main/docs/_pages/tutorials/read/how-to-use_es.md">Cómo usar </a>antes de empezar a intercambiar.<br>
  2. Indica el acuerdo claramente para evitar malentendidos.<br>
  3. El método de pago fiat debería poder enviar y recibir instantáneamente porque la factura retenida tiene un tiempo de expiración de 24 horas.<br>
Si el temporizador llega al vencimiento, podría desencadenar una disputa y podría conducir a una pérdida de la fianza.<br>
  4. Después de que el tomador haya tomado la orden, ambas partes deben estar listas para pasar al siguiente paso antes de que expire el tiempo.<br>
  5. Ten en cuenta que nadie puede leer el chat entre tu y tu contraparte.

### Para el comprador de bitcoin

  1. Asegúrate de que la cuenta/dirección de destino de envío fiat sea correcta.<br>
  2. Asegúrate de conservar el comprobante de envío fiat, como el recibo de la transacción.<br>
  3. Haz click en el botón "Confirmar fiat enviado" después de enviar con éxito el fiat fuera de tu cuenta.<br>

### Para el comprador de bitcoin

  1. Confirma si el cantidad final de fiat recibido es correcta.<br>
  2. Haz click en "Confirmar fiat recibido" una vez que estés 100 % seguro de que el dinero fiat se haya depositado correctamente en tu cuenta.<br>
  3. Si estás de acuerdo con el comprador en usar una plataforma de alto riesgo, necesitarás precauciones especiales para evitar la devolución de cargo (más información en el apartado de cada metodo de pago).<br>
  4. Protégete de las estafas de triangulación. A continuación, se presenta una explicación resumida del problema y se proponen estrategias para que los vendedores reduzcan su riesgo de exposición.

El fraude por triangulación consiste en que un estafador actúa como intermediario entre la víctima y el vendedor:

• El estafador ofrece productos o servicios en redes sociales u otras plataformas.  
• Cuando la víctima contacta al estafador, éste le pide un pago por adelantado (antes de recibir el producto).  
• Simultáneamente, el estafador publica una oferta de compra en RoboSats por el monto equivalente al pago que espera recibir. Por ejemplo, si dice estar vendiendo una cámara de fotos (que la víctima nunca va a recibir) y le pone un precio de 1000€, creará o tomará una oferta de compra de sats por ese mismo valor.  
• El estafador le da a la víctima los datos de pago del vendedor de RoboSats (su IBAN, por ejemplo) de forma que la persona que compra la camara envía los 1000€ y el vendedor de sats los recibe sin saber nada de lo que está pasando por detrás.  
• Tras confirmar la recepción del dinero, el vendedor libera los sats hacia el estafador.  
• Finalmente, el estafador desaparece habiendo conseguido sats gratis, sin entregar el producto o servicio prometido, y el vendedor podría verse implicado en una reclamación por estafa porque sus datos bancarios podrían asociarse al engaño sufrido por la víctima.

Algunas estrategias que te pueden ser útiles:
   - Guarda el historial de chats y operaciones realizadas en la plataforma así como cualquier evidencia que te pueda ser útil más adelante si se investigan disputas o hay denuncias.

   - Solicita a los compradores que incluyan en el pago un asunto o mensaje que dificulte el engaño que intenta realizar el estafador. Por ejemplo, “Al realizar este pago, reconozco que no tendré derecho a reclamación posterior” podría ser efectivo, ya que nadie que esté comprando un articulo de segunda mano se sentirá cómodo enviando dinero en esas condiciones. puedes usar el mensaje que quieras mientras no implique una violación de las políticas de la entidad que gestiona el pago (muchas no aceptan transacciones relacionadas con BTC).
   - Asegúrate de que esta declaración sea clara, explícita y esté vinculada al monto exacto de la transacción.


## Método de pago de riesgo medio-bajo

### Cheques regalo de Amazon
Los cheques regalo de Amazon son uno de los métodos de pago más privados en RoboSats. Tienden a ser rápidos y convenientes, pero los fondos deben gastarse en Amazon.

Es importante no compartir el código del cheque regalo directamente en el chat, ya que esto podría generar disputas difíciles de resolver en caso de fraude. Como vendedor, **no aceptes un código de cheque regalo en el chat**. En su lugar, el vendedor debe proporcionar un correo electrónico en el chat. El comprador debe comprar un nuevo cheque regalo explícitamente para el intercambio y enviarla a la dirección de correo electrónico del vendedor. De esta forma el vendedor sabe que es el único que tiene acceso al código canjeable. Este enfoque también genera evidencia verificable de que el cheque regalo se compró para el intercambio en RoboSats en caso de disputa.

En caso de que el comprador tenga un código de cheque regalo de Amazon, primero deberá aplicar el código a su propia cuenta. Luego comprar un nuevo cheque regalo de Amazon para el correo electrónico del vendedor utilizando el saldo de la cuenta.

Encuentra más detalles en [Pautas de Bisq para cheques regalo Amazon](https://bisq.wiki/Amazon_eGift_card)

### Interac e-Transfer
En Canadá, [Interac e-Transfer](https://www.interac.ca/en/consumers/support/faq-consumers/) es un método de pago popular y ampliamente aceptado utilizado para enviar pagos de una cuenta bancaria a otra, utilizando solo un correo electrónico registrado (o número de teléfono). Se considera que las transferencias electrónicas tienen un bajo riesgo de contracargos; sin embargo, los contracargos probablemente sigan siendo posibles en casos raros. Las transferencias electrónicas pueden ser iniciadas tanto por el remitente al enviar un pago al correo electrónico del destinatario, como por el receptor al enviar una solicitud de pago al correo electrónico del remitente.

### Wise
[Wise](https://wise.com/) (anteriormente TransferWise) es un transmisor de dinero internacional regulado en 175 países y 50 monedas. Es conocido por sus tarifas relativamente bajas para transferir dinero entre países y monedas. Los contracargos siguen siendo un riesgo, pero probablemente sean poco comunes. Los usuarios pueden transferir dinero entre cuentas de Wise utilizando una dirección de correo electrónico de manera similar a cómo funcionan las e-Transferencias; o en Canadá, los usuarios pueden solicitar e-Transferencias estándar directamente desde sus cuentas de Wise.


## Método de pago de alto riesgo

En esta sección se analiza la mejor práctica para los usuarios que intentan realizar transacciones con un método de pago con un alto riesgo de perder fondos.

### Revolut 
**Intercambio de @revtag:** Al realizar un pago a través de Revolut, es esencial que tanto el comprador como el vendedor intercambien su @revtag en el chat. Este @revtag se puede verificar en el historial de pagos de la aplicación, lo que facilita la confirmación de los pagos.

**Formato del enlace de pago:** Los enlaces de pago de Revolut siguen este formato: https://revolut.me/p/XXXXX. Tenga en cuenta que estos enlaces no contienen información de dirección del destinatario.

**Riesgos en disputas:** En caso de una disputa, la ausencia de referencias de dirección del destinatario puede dar lugar a fraudes. Tanto el comprador como el vendedor podrían actuar de manera deshonesta, ya que el enlace de pago podría ser canjeado por un tercero desconocido que coluda con cualquiera de las partes.

**Solicitud del @revtag:** Para mitigar estos riesgos, es crucial que ambas partes (comprador y vendedor) soliciten y proporcionen su @revtag al realizar un pago. Esto asegura que cada parte tenga un registro claro y verificable de la transacción.

   **Enlace del @revtag:** El @revtag también se puede recibir como un enlace, que se verá así: https://revolut.me/@revtag. Asegúrese de compartir y verificar este enlace para mayor seguridad.

  **Nota importante:** Recuerde que tanto el comprador como el vendedor tienen derecho a solicitar el @revtag de su contraparte en cualquier momento. Esto es esencial para garantizar la transparencia y la seguridad en la transacción.

### Paypal
Paypal es uno de los métodos de pago fiat más utilizados. Sin embargo, con la <a href="https://www.paypal.com/us/webapps/mpp/ua/buyer-protection">política de protección del comprador de Paypal</a>, el comprador puede realizar una acción fraudulenta creando una solicitud de reembolso en Paypal una vez finalizado el intercambio. De esta manera quedándose con el fiat y con el bitcoin.

Este fraude se puede prevenir acordando con el comprador que envíe dinero utilizando la opción "enviar dinero a un amigo o familiar". Esto hará que el comprador se convierta en el responsable de la tarifa de transacción y será menos probable que solicite un reembolso.

### Para el vendedor
Si eres un vendedor y tu contraparte acordó usar "enviar dinero a un amigo o familiar", pero tu contraparte usó la opción "enviar dinero por bienes o servicios", debes devolver el pago fiat y pedirle a su compañero que lo envíe con un método acordado. Si insisten en romper el acuerdo, puedes pedirle que finalice voluntariamente el intercambio o que finalice el intercambio comenzando una disputa.

### Para el comprador
Si eres un comprador y necesitas usar "enviar dinero a un amigo o familiar" para pagar dinero fiat a tu par, puedes elegir el tipo de pago especificado siguiendo estos pasos.

#### PayPal Desktop
En PayPal Desktop, se encuentra debajo de la lista desplegable de divisas, debería estar etiquetado como "Enviar a un amigo".
Si está etiquetado de otra manera, deberás hacer clic en "Cambiar" a la derecha para cambiar el tipo de pago.
<div align="center">
<img src="/assets/images/fiat-payment-methods/PayPal-main-desktop.png" width="370"/>
</div>
A continuación, selecciona "Enviar a un amigo" en la página de selección del tipo de pago.
<div align="center">
<img src="/assets/images/fiat-payment-methods/PayPal-choose-desktop.png" width="370"/>
</div>

#### PayPal movil
En PayPal móvil, se ubica debajo del método de pago (en este caso es VISA), debe estar etiquetado como “Amigos o Familiares”.
Si está etiquetado de otra manera, deberás presionar la pestaña ">" a la derecha para cambiar el tipo de pago.
<div align="center">
<img src="/assets/images/fiat-payment-methods/PayPal-main-phone.png" width="230"/>
</div>
A continuación, selecciona "Enviar a un amigo" en la página de selección del tipo de pago.
<div align="center">
<img src="/assets/images/fiat-payment-methods/PayPal-choose-phone.png" width="230"/>
</div>

{% include improve_es %}
