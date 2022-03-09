# Tutorial RoboSats (v0.1.0)

Uno de los puntos en los que se centra RoboSats es la facilidad de uso. La plataforma es totalmente autoexplicativa, por lo que se podría decir que no es necesario un tutorial. Sin embargo, este tutorial te ayudará a sentirse más cómodo. Después de todo, las plataformas p2p de bitcoin intimidan muchísimo. ¡Sin miedo! RoboSats es superfácil y con este tutorial serás todo un experto :D

Este documento contiene dos compraventas completas: 1) como comprador y tomador de una orden; 2) como vendedor y creador de la orden. Ya que la plataforma explica todo en los menús, voy a dedicar algunas líneas por todo el documento para dar trucos y consejos para que te mantengas seguro y anónimo.

## Generación de avatar en la página principal
RoboSats ayuda a los usuarios a preservar su privacidad generando una nueva identidad (avatar) para cada compraventa. ¡Generar una identidad es muy fácil!
<div align="center">
<img src="images/how-to-use/homepage-1.png" width="370" />
</div>

Tal cual abres la web por primera vez, te recibe con un robot avatar que es único y tuyo. El robot se genera determinísticamente desde el token que ves justo debajo. Este token es todo lo que necesitarás para recuperar tu robot en el futuro, así que **asegúrate de hacer una copia de seguridad del token**

Los tókenes se crean con entropía de tu propio navegador, se envían al servidor y este te responde con tu avatar. Si no confías en la entropía de tu navegador, puedes generar tu propio token random de la forma que tú prefieras. *Los tókenes con baja entropía no son válidos.*

La verdad es que no estoy muy contento con mi avatar "HomelessCash" :D Así que simplemente pulso en el icono del dado para generar un token nuevo (o lo introduzco con el teclado) y le doy a "Generate avatar" para crear uno nuevo.

<div align="center">
<img src="images/how-to-use/homepage-2.png" width="370" />
</div>

Ah, "JoyfulPain", este es mucho mejor! :)
Tu navegador recordará el token durante un tiempo, así que si se te olvida copiarlo, puedes abrir tu perfil abajo a la izquierda y copiar el token. Pero si refrescas la web o cierras el navegador, ¡el token se pierde de la memoria para siempre!

<div align="center">
<img src="images/how-to-use/homepage-3.png" width="370" />
</div>

Lo más seguro es escribirlo en papel... pero es bastante trabajo. Basta con copiarlo al portapapeles y pegarlo en otro sitio seguro. **Si tu navegador se congela, la batería de tu teléfono se acaba, si pierdes la conexión mientras compras-vendes... ¡Vas a necesitar el token para autentificarte otra vez y continuar!**

### Recuperando un robot
Para recuperar un robot desde un token guardado previamente, simplemente reemplaza el token en la caja de texto y presiona "Generate Robot". La web te saludará con el mensaje "We found your Robot avatar. Welcome back!"

## Intercambio

En RoboSats puedes crear tus propias órdenes o tomar las órdenes creadas por otros. Para crear tu orden, solo pulsa en "Create Order". Para tomar una orden existente, pulsa en "View Book" así puedes explorar todas las órdenes que ya existen.

### Explorando el libro de órdenes

Pulsamos en "View book" para echar un vistazo a las órdenes que ya existen en el libro.

<div align="center">
<img src="images/how-to-use/book-desktop.png"/>
</div>

En el navegador de escritorio, de un solo vistazo puedes ver toda la información importante y decidir que orden prefieres tomar. Por defecto, el libro te va a enseñar todos (ANY) los tipos de órdenes y todas (ANY) las monedas fiat. Usa los menús desplegables de arriba para seleccionar tus preferencias.

<div align="center">
<img src="images/how-to-use/book-phone.png" width="370" />
</div>

En el teléfono, no todas las columnas son visibles de primeras. Por ejemplo los nicks, el tipo de orden, el método de pago y la tasa de cambio están ocultos. Puedes pulsar en cualquier columna y seleccionar "Show columns" para marcar que columnas hacer visible.

<div align="center">
<img src="images/how-to-use/book-show-columns.png" width="230" />
</div>

Otro truco es tocar durante medio segundo, o hacer un pequeño arrastre con el dedo:
- Sobre el avatar: puedes ver el nick del robot y su estado de actividad.
- Sobre la cantidad: puedes ver si el creador está vendiendo o comprando satoshis.
- Sobre la moneda: puedes ver cuáles son los métodos de pago aceptados.
- Sobre la prima: puedes ver cuál es la tasa de cambio.

Ejemplo de toque/arrastre sobre las monedas:

<div align="center">
<img src="images/how-to-use/book-tap-1.png" width="370" />
</div>

Ejemplo de toque/arrastre sobre las primas:

<div align="center">
<img src="images/how-to-use/book-tap-2.png" width="370" />
</div>

Directamente, puedes entrar a ver la página con la información completa de la orden:

<div align="center">
<img src="images/how-to-use/order-page-1.png" width="370" />
</div>

Todas las órdenes públicas tienen un tiempo de expiración. Por defecto, en RoboSats versión 0.1.0 las órdenes estarán públicas durante 6 horas, y si nadie las toma desaparecerán.

### Walktrough-1: Tomando una orden como comprador

Cuando hayas decidido que orden tomar, simplemente dale al botón "Take Order". Vas a ver por primera vez la caja del contrato. Todo lo que hay que hacer a partir de ahora es seguir las órdenes de esta pestaña hasta que hayas completado la compraventa.

Lo primero será bloquear una pequeña fianza de fidelidad, así el vendedor sabrá que eres de confiar y estás comprometido. Los satoshis de este depósito se van a quedar congelados en tu billetera. Si intentas estafar o cancelas unilateralmente, perderás los satoshis de este depósito. Si sigues las normas, estos satoshis se desbloquearán en tu billetera en cuanto termines.

<div align="center">
<img src="images/how-to-use/contract-box-1.png" width="370" />
</div>

Escanea o copia la factura lightning con tu billetera. Puede que te muestre que el pago está en tránsito, puede que se congele, o incluso puede que parezca que tu billetera no responde. La única forma de saber si tu fianza se ha bloqueado es confirmar en la web de RoboSats (¡Tu billetera casi seguro no te lo va a decir! Puedes mirar esta [lista de compatibilidad de billeteras](https://github.com/Reckless-Satoshi/robosats/issues/44) para más detalles)

<div align="center">
<img src="images/how-to-use/contract-box-2.png" width="370" />
</div>

Tan pronto como tu fianza haya sido bloqueada, la aplicación te pedirá que envíes la factura a la que enviar los satoshis que estás comprando. Genera una factura en tu billetera con la candiad exacta y dale a "submit".

<div align="center">
<img src="images/how-to-use/contract-box-3.png" width="370" />
</div>

Mientras envías tu factura de pago, se le pide al vendedor que bloquee el depósito de garantía. Si eres más rápido que él, tendrás que esperar. Si él es más rápido, saltaras directamente al chat con él.

Hay un límite de tiempo de 3 horas para enviar la factura (comprador) y bloquear el depósito de garantía (vendedor). Si se agota el tiempo, la orden caducará y el robot (la parte) que no cumplió con las obligaciones del contrato perderá la fianza. Este mecanismo ayuda a evitar que se haga spam con órdenes falsas, que te hagan perder el tiempo y que atacantes bloqueen el libro de órdenes mediante DDOS.

<div align="center">
<img src="images/how-to-use/contract-box-4.png" width="370" />
</div>

Tan pronto como el vendedor bloquea los satoshis, es seguro enviar el pago en fiat (EUR, ARS, VES, USD, …).
Como comprador, tendrás que pedirle al vendedor los detalles para enviar el pago fiat. Recuerda compartir únicamente la información necesaria para no comprometer tu privacidad. Ten en cuenta que en la versión 0.1.0 de RoboSats este chat no tiene memoria, por lo que la conversación se perderá si refrescas el navegador.

<div align="center">
<img src="images/how-to-use/contract-box-5.png" width="370" />
</div>

Hay un limite de tiempo de 4 horas para completar el intercambio de fiat. Si el tiempo se acaba, la orden expirará y se abrirá una disputa automáticamente. Para evitar que la orden expire, **usa siempre metodos de pago fiat instantáneos**. Por ejemplo, enviar dinero por correo ordinario es tan lento que siempre desencadenará una disputa en la versión 0.1.0, en versiones futuras un tiempo de expiración mayor será posible.

¡En cuanto hayas enviado el pago fiat, debes clicar el botón "Confirm fiat sent"! Después de eso, el vendedor deberá confirmar que recibió tu pago. Tan pronto como lo confirme, la operación habrá finalizado y recibirás los sats en tu billetera lightning. Es posible que veas el mensaje "sending satoshis to buyer" (enviando satoshis al comprador), pero generalmente es tan rápido que simplemente verás esta pantalla (“Trade finished!”). ¡Disfruta de tus sats!

<div align="center">
<img src="images/how-to-use/contract-box-6.png" width="370" />
</div>

Se agradece mucho si calificas la plataforma y/o dejas comentarios o sugerencias en nuestro grupo de Telegram o Github Issues.

### Walktrough-2: Crear una orden como vendedor

Puede ocurrir que no haya órdenes activas para compra o venta en la moneda que deseas. En el ejemplo del pantallazo de abajo, no hay órdenes para VENDER bitcoin por GBP.

<div align="center">
<img src="images/how-to-use/book-no-orders.png" width="370" />
</div>

Puedes crear una orden que se adapte a tus condiciones. Pero ten en cuenta que es preferible publicar una orden que otros estén dispuestos tomar.

<div align="center">
<img src="images/how-to-use/maker-page.png" width="370" />
</div>

Al crear una orden, solo es requerido especificar la moneda, el tipo de orden (compra/venta) y el monto. Sin embargo, es una buena práctica especificar los métodos de pago que permites. También puede ser útil establecer una prima/descuento para que tu orden sea más interesante para los tomadores. Recuerda que, como vendedor, puedes incentivar a los compradores a tomar tu orden al reducir la prima. Sin embargo, si hay demasiados compradores, puedes aumentar la prima para obtener un mayor margen de beneficio. Como alternativa, puedes establecer una cantidad fija de Satoshis.

*Límites: en la versión 0.1.0 de Robosats una orden no puede ser inferior a 10.000 Satoshis. Para evitar fallos de enrutamiento no puede ser mayor a 500.000 Satoshis. Este límite se incrementará en el futuro.*

<div align="center">
<img src="images/how-to-use/contract-box-7.png" width="370" />
</div>

Debes copiar o escanear la factura con tu billetera lightning para bloquear tu fianza de fidelidad como creador. Al bloquear esta fianza, los compradores perciben que eres de fiar y se comprometen a seguir con el intercambio. En tu billetera puede mostrarse como un pago en tránsito, congelarse o incluso aparentemente romper tu billetera. Siempre debes verificar en la web de RoboSats si el depósito ha sido bloqueado (¡tu billetera probablemente no te lo dirá! Comprueba la [lista de compatibilidad de billeteras](https://github.com/Reckless-Satoshi/robosats/issues/44))

<div align="center">
<img src="images/how-to-use/contract-box-8.png" width="370" />
</div>

Tu orden permanecerá publicada durante 6 horas. Puedes comprobar cuánto tiempo le queda consultando la pestaña "Order". Se puede cancelar en cualquier momento sin penalización antes de que otro robot tome tu orden. Mantén abierta la pestaña del contrato para recibir notificaciones [con este sonido](https://github.com/Reckless-Satoshi/robosats/raw/main/frontend/static/assets/sounds/taker-found.mp3). Es aconsejable hacer esto en un ordenador o portátil con el volumen encendido para enterarte cuando alguien tome tu orden porque puede transcurrir bastante tiempo. ¡Quizás incluso olvides que tienes publicada una orden! También puedes activar las notificaciones de telegram. Simplemente pulsa en "Enable Telegram Notifications" y presiona "Start" en la conversación con el bot de RoboSats. Te llegará un mensaje de bienvenida y cuando alguien tome la orden te avisará con un mensaje. 

*Nota: Si no estás pendiente de tu orden y un robot la toma y bloquea su fianza, corres el riesgo de perder tu fianza por no cumplir con los siguientes pasos del contrato.*

En la pestaña del contrato también puedes ver cuántas órdenes hay publicadas para la misma moneda. También puedes en qué posición (en porcentaje) se sitúa la prima de tu oferta con respecto a las demás publicadas con la misma moneda.

<div align="center">
<img src="images/how-to-use/contract-box-9.png" width="370" />
</div>

¡Viva, alguien tomó tu orden! El comprador tiene 4 minutos para bloquear una fianza de fidelidad. Si no lo hace tu orden se publicará de nuevo automáticamente.

<div align="center">
<img src="images/how-to-use/contract-box-10.png" width="370" />
</div>

En cuanto el comprador bloquee su fianza tendrás que bloquear un depósito de garantía. Este es una “lightning hold invoice” que quedará congelada en tu billetera. Se liberará una vez confirmes que has recibido el pago en fiat o si hay una disputa con el comprador.

<div align="center">
<img src="images/how-to-use/contract-box-11.png" width="370" />
</div>

Una vez que bloquees el depósito de garantía y el comprador envíe la factura de pago será seguro enviar el pago fiat. Comparte con el comprador la información mínima necesaria para recibir el pago. Recuerda que en la versión 0.1.0 de RoboSats este chat no tiene memoria, por lo que la conversación se perderá si actualiza el navegador.

<div align="center">
<img src="images/how-to-use/contract-box-12.png" width="370" />
</div>

El comprador acaba de confirmar que te envió el dinero fiat. Ahora te toca verificar que lo has recibido en tu cuenta.

<div align="center">
<img src="images/how-to-use/contract-box-13.png" width="370" />
</div>

Al confirmar que recibiste el pago, se cobrará el depósito de garantía y se enviará al comprador. Por favor, **¡asegúrate al 100% de que has recibido el pago antes de confirmar!**

<div align="center">
<img src="images/how-to-use/contract-box-14.png" width="370" />
</div>

¡¡Terminado!! :D

## Cancelación colaborativa

Después de que el depósito de garantía haya sido bloqueado y antes de que el comprador confirme que ha enviado el dinero fiat, es posible cancelar la orden colaborativamente. Quién sabe, quizá no tenéis una forma común de enviar y recibir dinero fiat. Si acordáis hacer la cancelación colaborativa, solo tenéis que pulsar en el botón "Collaborative cancel".

<div align="center">
<img src="images/how-to-use/contract-box-15.png" width="370" />
</div>

Si el comprador ya ha pulsado "Fiat sent", no es posible cancelar la orden. La única forma de pararla es abriendo una disputa e involucrando al personal de RoboSats. Esto está totalmente desaconsejado porque uno de los dos puede perder el depósito de garantía.

## Disputas

Los malentendidos, como hemos visto arriba, pueden ocurrir. Pero ten en cuenta, que quizá no sea un simple malentendido, quizá al otro lado haya una persona que trata de estafarte. En este caso,*MakeshiftSource875* se cree que puede quedarse con todo (el dinero fiat y el bitcoin) si no confirma que ha recibido el pago.

<div align="center">
<img src="images/how-to-use/contract-box-16.png" width="370" />
</div>

De hecho, esto no es posible, ya que RoboSats abrirá una disputa automáticamente si la orden expira sin haber confirmado el pago. Sin embargo, si ves que algo raro está pasando, lo mejor es que abras una disputa tu mismo directamente.

<div align="center">
<img src="images/how-to-use/contract-box-17.png" width="370" />
</div>

En RoboSats versión 0.1.0 el sistema de disputas no está totalmente incorporado en la web. Por lo tanto, la mayor parte de la resolución tiene que darse por otras vías. Asegúrate de enviar un método de contacto con tu disputa (usuario de Telegram, email temporal... como prefieras). Al abrir la disputa tendrás que escribir un parte completo con todos los detalles de lo que pasó. Ten en cuenta que el personal de RoboSats no puede leer tu conversación en el chat para juzgar. También es útil si envías imágenes/pantallazos. Para mantener tu privacidad, los puedes encriptar con la llave PGP del personal y subirlas a algún sistema de compartir archivos anónimo.

<div align="center">
<img src="images/how-to-use/contract-box-18.png" width="370" />
</div>

Una vez el personal haya resuelto tu disputa, podrás ver la resolución de la misma en el estado de la orden. Recuerda revisar el método de contacto que proporcionaste. Si ganaste la disputa, el personal te pedirá una factura lightning para enviarte los satoshis.

<div align="center">
<img src="images/how-to-use/contract-box-19.png" width="370" />
</div>
