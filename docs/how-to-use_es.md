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

Tan pronto como tu deposito haya sido bloqueado, la aplication te pedirá que envies el recibo al que enviar los satoshis que estás comprando. Genera un recibo en tu wallet con la candiad exacta y dale a "submit".

<div align="center">
<img src="images/how-to-use/contract-box-3.png"  width="370" />
</div>

** ESTA TRADUCCIÓN ESTÁ INCOMPLETA **

While you are submitting your payout invoice, the seller is asked to lock the trade escrow hold invoice. If you are faster than him, you would have to wait. Otherwise, you would already be able to chat with him. 

There is a time limit of 30 minutes to submit the invoice (buyer) and lock the trade escrow (seller). If the time runs out, the order will expire and the robot who did not follow with the contract obligations will lose the bond. This is a mechanism that helps prevent fake order spamming, wasting time of counterparts and DDOSing the order book.

<div align="center">
<img src="images/how-to-use/contract-box-4.png"  width="370" />
</div>

As soon as the seller locks the satoshis, it is safe to send the fiat currency! As a buyer, you will have to ask the seller for the details to send fiat. Remember to only share the information needed about yourself to not compromise your privacy. Remember, in RoboSats v0.1.0 this chat is memoryless, so the conversation will be lost if you refresh the browser.
 
<div align="center">
<img src="images/how-to-use/contract-box-5.png"  width="370" />
</div>

As soon as you have sent the fiat, you should tap on "Confirm fiat sent" button! After that, the seller will have to confirm the fiat was received. As soon as he confirms the trade is finished and you will be paid out to your lightning wallet. You might see that it is "sending satoshis to buyer" but usually it is so fast you will simply see this screen. Enjoy your sats!

<div align="center">
<img src="images/how-to-use/contract-box-6.png"  width="370" />
</div>

Rating the platform and leaving tips for improvement in our Telegram group or Github Issues is super appreciated!

### Walktrough-2: Making an order as a seller

It might happen that there are no active orders for the positioning and currency you want. In this case, there is no orders to SELL bitcoin for GBP.
 
<div align="center">
<img src="images/how-to-use/book-no-orders.png"  width="370" />
</div>

We can create the order exactly has we want it. But mind that you need to publish an order that others want to take too! 
 
<div align="center">
<img src="images/how-to-use/maker-page.png"  width="370" />
</div>

In the maker page you are only required to enter the currency, order type (buy/sell) and amount. However, it is best practice to specify the payment methods you allow. It might be also helpful to set a premium/discount for your order to be taken faster. Remember that as a seller you can incentivze buyers to take your order by lowering the premium. If there are too many buyers, however, you can increase the premium to have a trading profit. Alternatively, you can set a fixed amount of Satoshis.

*Limits: in Robosats v0.1.0 an order cannot be smaller than 10.000 Satoshis. It cannot be larger than 500.000 Satoshis in order to avoid lightning routing failures. This limit will be increased in the future.*

<div align="center">
<img src="images/how-to-use/contract-box-7.png"  width="370" />
</div>

You have to copy or scan the invoice with your lightning wallet in order to lock your fidelity maker bond. By locking this bond, the takers know you can be trusted and are committed to follow with this trade. In your wallet it might show as a payment that is on transit, freeze or even seemingly break your wallet. You should always check on the RoboSats website whether the bond has been locked (your wallet will probably not tell you! Check [wallet compatibility list](https://github.com/Reckless-Satoshi/robosats/issues/44))

<div align="center">
<img src="images/how-to-use/contract-box-8.png"  width="370" />
</div>

Your order will be public for 6 hours. You can check the time left to expiration by checking the "Order" tab. It can be canceled at any time without penalty before it is taken by another robot. Keep the contract tab open to be notified [with this sound](https://github.com/Reckless-Satoshi/robosats/raw/main/frontend/static/assets/sounds/taker-found.mp3). It might be best to do this on a desktop computer and turn on the volume, so you do not miss when your order is taken. It might take long! Maybe you even forget! *Note: If you forget your order and a robot takes it and locks his fidelity bond, you risk losing your own fidelity bond by not fulfilling the next contract steps.*

In the contract tab you can also see how many other orders are public for the same currency. You can also see how well does your premium ranks among all other orders for the same currency.

<div align="center">
<img src="images/how-to-use/contract-box-9.png"  width="370" />
</div>

Hurray, someone took the order! They have 4 minutes to lock a taker fidelity bond, if they do not proceed, your order will be made public again automatically.

<div align="center">
<img src="images/how-to-use/contract-box-10.png"  width="370" />
</div>

As soon as the taker locks the bond, you will have to lock the trade escrow. This is a lightning hold invoice and will also freeze in your wallet. It will be released only when you confirm you received the fiat payment or if there is a dispute between you and the taker.

<div align="center">
<img src="images/how-to-use/contract-box-11.png"  width="370" />
</div>

Once you lock the trade escrow and the buyer submit the payout invoice it is safe to send fiat! Share with the buyer the minimal information needed to send you fiat. Remember, in RoboSats v0.1.0 this chat is memoryless, so the conversation will be lost if you refresh the browser.

<div align="center">
<img src="images/how-to-use/contract-box-12.png"  width="370" />
</div>

The buyer has just confirmed he did his part! Now check until the fiat is in your account.

<div align="center">
<img src="images/how-to-use/contract-box-13.png"  width="370" />
</div>

By confirming that you received the fiat, the escrow will be charged and sent to the buyer. So only do this once you are 100% sure the fiat is with you!

<div align="center">
<img src="images/how-to-use/contract-box-14.png"  width="370" />
</div>

All done!! :D

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
