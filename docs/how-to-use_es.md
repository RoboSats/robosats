# Tutorial RoboSats (v0.1.0)

Uno de los puntos en los que se centra RoboSats es la facilidad de uso. La plataforma es totalmente autoexplicativa, por lo que se podría decir que no es necesario un tutorial. Sin embargo, este tutorial te ayudara a sentirse más cómodo. Después de todo, los exchanges p2p de bitcoin intimidan muchísimo. ¡Sin miedo! RoboSats es super fácil y con este tutorial serás todo un experto :D

Este documento contiene dos compraventas completas: 1) como comprador y tomador de una order; 2) como vendedor y creador de la orden. Ya que la plataforma explica todo en los menus, voy a dedicar algunas lineas por todo el documento para dar trucos y consejos para que te mantengas seguro y anónimo.

## Generación de avatar en la página principal
RoboSats ayuda a los usuarios a preservar su privacidad generando una nueva identidad (avatar) para cada compraventa. ¡Generar una identidad es muy fácil!
<div align="center">
<img src="images/how-to-use/homepage-1.png" width="370" />
</div>

Tal cual abres la web por primera vez, te recibe con un robot avatar que es único y tuyo. El robot se genera deterministicamente desde el token que ves justo debajo. Este token es todo lo que necesitarás para recuperar tu robot en el futuro, así que **asegurate de hacer una copia de seguridad del token**

Los tokens se crean con entropia de tu propio navegador, se envian al servidor y el servidor responde con tu avatar. Si no confias en la entropía de tu navegador, puedes crear tu propio token random de la forma que tu prefieras. *Los tokens con baja entropia no son validos.*

La verdad es que no estoy muy contento con mi avatar "HomelessCash" :D Así que simplemente clicko en el icono del dado para generar un token nuevo (o lo introduzco con el teclado) y le doy a "Generate avatar" para crear uno nuevo.
 
<div align="center">
<img src="images/how-to-use/homepage-2.png" width="370" />
</div>

Ah, "JoyfulPain", este es mucho mejor! :) 
Tu navegador recodará el token durante un tiempo, así que si te olvida copiarlo, puedes abir tu perfil abajo a la izquierda y copiar el token. Pero si refrescas la web o cierras el navegador, el token se pierde de la memoria para siempre!
 
<div align="center">
<img src="images/how-to-use/homepage-3.png" width="370" />
</div>

Lo más seguro es escribirlo en papel... pero es bastante aburrido! La mayor parte de las veces basta con copiarlo al portapapeles y pegarlo en otro sitio seguro. ** Si tu navegador se congela, la bateria de tu teléfono se acaba, si pierdes la conexión mientras compras-vendes... vas  necesitar el token para autentificarte otra vez y continuar!**

## Trade

En RoboSats puedes crear tus propias ordenes o tomar las ordenes creadas por otros. Para crear tu orden, solo clicka en "Create Order". Para tomar una orden existente, clicka en View Book¨ así puedes explorar todas las ordenes que ya existen.

### Exploring the Order Book

Clickamos en "View book" para echar un vistazo a las ordenes que ya existen en el libro.

<div align="center">
<img src="images/how-to-use/book-desktop.png"/>
</div>

En el navegador de escritorio, de un solo vistado puedes ver toda la información importante y decidir que orden prefieres tomar. Por defecto, el libro te va a enseñar todos (ANY) los tipos de ordenes (de compra y de venta) y todas (ANY) las monedas fiat. Usa los menus desplegables de arriba para seleccionar tus preferencias.

<div align="center">
<img src="images/how-to-use/book-phone.png" width="370" />
</div>

En el teléfono, no todas las columnas son visibles de primeras. Por ejmemplo los nicks, el tipo de orden, el metodo de pago y la tasa de cambio están ocultos. Puedes clickar en cualquier columna y seleccionar "Show columns" para marcar que columnas hacer visible.

<div align="center">
<img src="images/how-to-use/book-show-columns.png" width="230" />
</div>

Otro truco es tocar durante medio segundo, o hacer un pequeño arrastre con el dedo:
 - Sobre el avatar: puedes ver el nick del robot y su estado de actividad.
 - Sobre la cantidad: puedes ver si el creador está vendiendo o comprando satoshis.
 - Sobre la moneda: puedes ver cuales son los metodos de pago aceptados.
 - Sobre la prima: puedes ver cual es la tasa de cambio.

Ejemplo de toque/arrastre sobre las monedas:

<div align="center">
<img src="images/how-to-use/book-tap-1.png" width="370" />
</div>

Ejemplo de toque/arrastre sobre las primas:

<div align="center">
<img src="images/how-to-use/book-tap-2.png" width="370" />
</div>

Directamente puedes entrar a ver la pagina con la información completa de la orden:

<div align="center">
<img src="images/how-to-use/order-page-1.png" width="370" />
</div>

Todas las ordenes públicas tienen un tiempo de expiración. Por defecto, en RoboSats v0.1.0 las ordenes estarán publicas durante 6 horas, y si nadie las toma desaparecerán.

### Walktrough-1: Taking an order as a buyer

Cuando hayas decidido que orden tomar, simplemente dale al boton "Take Order". Vas a ver por primera vez la caja del contrato. Todo lo que hay que hacer a partir de ahora es seguir las ordenes de esta pestaña hasta que hayas completado la compraventa. 

Lo primero será bloquear un pequeño deposito de fidelidad, así el vendedor sabrá que eres de confiar y estás comprometido. los satoshis de este depósito se van a quedar congelados en tu billetera. Si intentas estafar, o cancelas unilateralmente, penderás los satoshis de este depósito. Si sigues las normas, estos satoshis se desploquearán en tu billetera en cuanto termines.

<div align="center">
<img src="images/how-to-use/contract-box-1.png" width="370" />
</div>

Escanea o copia el recibo lightning con tu wallet. Puede que te muestre que el pago está en tránsito, puede que se congele, o incluso puede que parezca que tu wallet no responde. La unica forma de saber si tu deposito se ha bloqueado es confirmar en la web de RoboSats (tu wallet casi seguro no te lo va a decir! puedes mirar esta [lista de compabilidad de wallets](https://github.com/Reckless-Satoshi/robosats/issues/44) para más detalles)

<div align="center">
<img src="images/how-to-use/contract-box-2.png"  width="370" />
</div>

Tan pronto como tu deposito haya sido bloqueado, la aplicación te pedirá que envies el recibo al que enviar los satoshis que estás comprando. Genera un recibo en tu wallet con la candiad exacta y dale a "submit".

<div align="center">
<img src="images/how-to-use/contract-box-3.png"  width="370" />
</div>

Mientras envías tu factura de pago, se le pide al vendedor que bloquee la factura del depósito de garantía. Si eres más rápido que él, tendrás que esperar. De lo contrario, ya podrías chatear con él.

Hay un límite de tiempo de 30 minutos para enviar la factura (comprador) y bloquear el depósito de garantía (vendedor). Si se agota el tiempo, la orden caducará y el robot (la parte) que no cumplió con las obligaciones del contrato perderá la fianza. Este mecanismo ayuda a evitar que se haga spam con pedidos falsos así como la pérdida de tiempo de las contrapartes y ataques DDOS en el libro de pedidos.

<div align="center">
<img src="images/how-to-use/contract-box-4.png"  width="370" />
</div>

Tan pronto como el vendedor bloquea los satoshis, es seguro enviar el pago en fiat (EUR, ARS, VES, USD, …).
Como comprador, tendrás que pedirle al vendedor los detalles para enviar el pago fiat. Recuerda compartir únicamente la información necesaria para no comprometer tu privacidad. Ten en cuenta que en la versión 0.1.0 de RoboSats este chat no tiene memoria, por lo que la conversación se perderá si actualiza el navegador.
 
<div align="center">
<img src="images/how-to-use/contract-box-5.png"  width="370" />
</div>

¡En cuanto hayas enviado el pago fiat, debes clicar el botón "Confirm fiat sent"! Después de eso, el vendedor deberá confirmar que recibió tu pago. Tan pronto como lo confirme, la operación habrá finalizado y recibirás los sats en tu billetera Lightning. Es posible que veas el mensaje “"sending satoshis to buyer" (enviando satoshis al comprador), pero generalmente es tan rápido que simplemente verás esta pantalla (“Trade finished!”). ¡Disfruta de tus sats!

<div align="center">
<img src="images/how-to-use/contract-box-6.png"  width="370" />
</div>

¡Se agradece mucho si calificas la plataforma y/o dejas comentarios o sugerencias en nuestro grupo de Telegram o Github Issues!

### Walktrough-2: Crear una orden como vendedor

Puede ocurrir que no haya órdenes activas para compra o venta en la moneda que deseas. En el ejemplo del pantallazo de abajo, no hay órdenes para VENDER bitcoin por GBP.
 
<div align="center">
<img src="images/how-to-use/book-no-orders.png"  width="370" />
</div>

Puedes crear una orden que se adapte a tus condiciones. ¡Pero ten en cuenta que es preferible publicar una orden que otros estén dispuestos tomar! 
 
<div align="center">
<img src="images/how-to-use/maker-page.png"  width="370" />
</div>

Al crear una orden, solo se te pide especificar la moneda, el tipo de orden (compra/venta) y el monto. Sin embargo, es una buena práctica especificar los métodos de pago que permites. También puede ser útil establecer una prima/descuento para que tu pedido se tome más rápido. Recuerda que, como vendedor, puedes incentivar a los compradores a tomar tu orden al reducir la prima. Sin embargo, si hay demasiados compradores, puedes aumentar la prima para obtener un mayor margen de beneficio. Como alternativa, puedes establecer una cantidad fija de Satoshis.

*Límites: en la versión 0.1.0 de Robosats una orden no puede ser inferior a 10.000 Satoshis. Para evitar fallos de enrutamiento no puede ser mayor a 500.000 Satoshis. Este límite se incrementará en el futuro.*

<div align="center">
<img src="images/how-to-use/contract-box-7.png"  width="370" />
</div>

Debes copiar o escanear la factura con tu billetera Lightning para bloquear tu fianza de fidelidad como creador. Al bloquear esta fianza, los compradores perciben que eres de fiar y se comprometen a seguir con el intercambio. En tu billetera puede mostrarse como un pago en tránsito, congelarse o incluso aparentemente romper tu billetera. Siempre debes verificar en la web de RoboSats si el depósito ha sido bloqueado (¡tu billetera probablemente no te lo dirá! Comprueba la [lista de compatibilidad de billeteras](https://github.com/Reckless-Satoshi/robosats/issues/44))

<div align="center">
<img src="images/how-to-use/contract-box-8.png"  width="370" />
</div>

Tu orden permanecerá publicada durante 6 horas. Puedes comprobar cuánto tiempo le queda consultando la pestaña "Order". Se puede cancelar en cualquier momento sin penalización antes de que otro robot tome tu orden. Mantén abierta la pestaña del contrato para recibir notificaciones [con este sonido](https://github.com/Reckless-Satoshi/robosats/raw/main/frontend/static/assets/sounds/taker-found.mp3). Es aconsejable hacer esto en un ordenador o portátil con el volumen encendido para enterarte cuando alguien tome tu orden porque puede transcurrir bastante tiempo. ¡Quizás incluso olvides que tienes publicada una orden!  *Nota: Si no estás pendiente de tu orden y un robot la toma y bloquea su fianza de fidelidad, corres el riesgo de perder la fianza de fidelidad que depositaste por no cumplir con los siguientes pasos del contrato.*

En la pestaña del contrato también puedes ver cuántas órdenes hay publicadas para la misma moneda. También puedes en qué posición (en porcentaje) se sitúa la prima de tu oferta con respecto a las demás publicadas con la misma moneda.

<div align="center">
<img src="images/how-to-use/contract-box-9.png"  width="370" />
</div>

¡Viva, alguien tomó tu orden! El comprador tiene 4 minutos para bloquear una fianza de fidelidad. Si no lo hace tu orden se publicará de nuevo automáticamente.

<div align="center">
<img src="images/how-to-use/contract-box-10.png"  width="370" />
</div>

En cuanto el comprador bloquee su fianza tendrás que bloquear un depósito como garantía. Esta es una “lightning hold invoice” que quedará congelada en tu billetera. Se liberará una vez confirmes que has recibido el pago en fiat o si hay una disputa con el comprador.

<div align="center">
<img src="images/how-to-use/contract-box-11.png"  width="370" />
</div>

Una vez que bloquees el depósito de garantía y el comprador envíe la factura de pago será seguro enviar el pago fiat. Comparte con el comprador la información mínima necesaria para recibir el pago. Recuerda que en la versión 0.1.0 de RoboSats este chat no tiene memoria, por lo que la conversación se perderá si actualiza el navegador.

<div align="center">
<img src="images/how-to-use/contract-box-12.png"  width="370" />
</div>

¡El comprador acaba de confirmar que hizo su parte! Te toca verificar que has recibido el fiat en tu cuenta.

<div align="center">
<img src="images/how-to-use/contract-box-13.png"  width="370" />
</div>

Al confirmar que recibiste el pago, se cobrará el depósito y se enviará al comprador. Por favor, ¡asegúrate al 100% de que has recibido el pago!

<div align="center">
<img src="images/how-to-use/contract-box-14.png"  width="370" />
</div>

¡¡Terminado!! :D

** ESTA TRADUCCIÓN ESTÁ INCOMPLETA **

## Collaborative cancellation

After the trade escrow has been posted and before the buyer confirms he sent the fiat it is possible to cancel the order. It might just happen that you both do not have a common way to send and receive fiat after all. You can agree to tap on the "Collaborative cancel" button. After the "Fiat sent" button is pressed by the buyer, the only way to cancel an order is by opening a dispute and involving the staff. 

<div align="center">
<img src="images/how-to-use/contract-box-15.png"  width="370" />
</div>

This is totally not recommended, one of the two traders would lose his fidelity bond except in exceptional cases (up to the discretion of the staff)

## Disputes

Misunderstandings happen. But also, there might be people willing to try to scam others. In this case *MakeshiftSource875* thought he could get away by not confirming he received the fiat, as if he was going to be able to keep the satoshis. 

<div align="center">
<img src="images/how-to-use/contract-box-16.png"  width="370" />
</div>

This is in fact not possible, as a dispute will be automatically open at expiration. However, if you know something fishy is going on, you should open a dispute.

<div align="center">
<img src="images/how-to-use/contract-box-17.png"  width="370" />
</div>

In RoboSats v0.1.0 the dispute pipeline is not fully implemented in the web. Therefore, most contact and resolution has to happen through alternative methods. Be sure to send a contact method to the staff. You will have to write down full statement of facts, remember that the staff cannot read your private chat to judge about what happened. It is useful to send images/screenshots. For maximum privacy, these can be encrypted via PGP key and uploaded into any anonymous file sharing system.

<div align="center">
<img src="images/how-to-use/contract-box-18.png"  width="370" />
</div>

Once the staff has resolved the dispute, the final order status will display the resolution. Make sure to check on the contact method provided to the staff. If you are a dispute winner, the staff will ask you again for a lightning network invoice to send the payout+bond (Your old invoice is probably expired!)

<div align="center">
<img src="images/how-to-use/contract-box-19.png"  width="370" />
</div>
