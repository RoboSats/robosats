---
layout: single
title: Compatibilidad de wallets RoboSats
permalink: /docs/es/wallets/
toc: true
toc_sticky: true
sidebar:
  title: '<img id="side-icon-verybig" src="/assets/vector/wallet.svg"/>Wallets'
  nav: docs
src: "_pages/docs/es/03-understand/07-wallets.md"

# Icons
good: "<i style='color:#1976d2' class='fa-solid fa-square-check fa-2xl'></i>"
soso: "<i style='color:#9c27b0' class='fa fa-triangle-exclamation fa-2xl'></i>"
bad: "<i style='color:#ef5350' class='fa-solid fa-xmark fa-3x'></i>"
phone: "<i class='fa-solid fa-mobile-screen fa-xl'></i>"
laptop: "<i class='fa-solid fa-laptop fa-xl'></i>"
cli: "<i class='fa-solid fa-terminal fa-xl'></i>"
laptop_phone: "<i class='fa-solid fa-laptop-mobile fa-xl'></i>"
remote: "<i class='fa-solid fa-house fa-xl'></i>"
thumbsup: "<i style='color:#1976d2' class='fa-solid fa-thumbs-up fa-2xl'></i>"
thumbsdown: "<i style='color:#9c27b0' class='fa-solid fa-thumbs-down fa-2xl'></i>"
unclear: "<i style='color:#ff9800' class='fa-solid fa-question fa-2xl'></i>"
bitcoin: "<i class='fa-solid fa-bitcoin-sign'></i>"
---
Esta es una compilación no exhaustiva basada en la experiencia pasada de los usuarios. No hemos probado todas las wallets, si pruebas una wallet que aún no está cubierta, [informa aquí](https://github.com/Robosats/robosats/issues/44).

| Wallet | Versión | Dispositivo | UX<sup>1</sup> | Fianzas<sup>2</sup> | Pagos<sup>3</sup> | Comp<sup>4</sup> | Total<sup>5</sup> |
|:---|:---|:--:|:--:|:--:|:--:|:--:|:--:|
|[Alby](#alby-extensión-de-navegador)|[v1.14.2](https://github.com/getAlby/lightning-browser-extension)|{{page.laptop}}|{{page.good}}|{{page.good}}|{{page.good}}|{{page.good}} |{{page.thumbsup}}|
|[Blink](#blink-móvil-antiguo-bitcoin-beach-wallet)|[2.2.73](https://www.blink.sv/)|{{page.phone}}|{{page.good}}|{{page.good}}|{{page.good}}|{{page.good}} |{{page.thumbsup}}|
|[Blixt](#blixt-androidios-backend-ligero-lnd-en-el-dispositivo)|[v0.4.1](https://github.com/hsjoberg/blixt-wallet)|{{page.phone}}|{{page.soso}}|{{page.good}}|{{page.good}}|{{page.good}}|{{page.thumbsup}}|
|[Blue](#bluewallet-móvil)|[1.4.4](https://bluewallet.io/)|{{page.phone}}|{{page.good}}|{{page.unclear}}|{{page.unclear}}|{{page.good}}|{{page.unclear}}|
|[Breez](#breez-móvil)|[0.16](https://breez.technology/mobile/)|{{page.phone}}|{{page.good}}|{{page.good}}|{{page.good}}|{{page.good}}|{{page.thumbsup}}|
|[Cash App](#cash-app-móvil)|[4.7](https://cash.app/)|{{page.phone}}|{{page.good}}|{{page.good}}|{{page.good}}|{{page.good}} |{{page.thumbsup}}|
|[Core Lightning](#core-lightning--cln-cli-interface)|[v0.11.1](https://github.com/ElementsProject/lightning)|{{page.cli}}|{{page.good}}|{{page.good}}|{{page.good}}|{{page.good}}|{{page.thumbsup}}|
|[Electrum](#electrum-desktop)|[4.1.4](https://github.com/spesmilo/electrum)|{{page.laptop}}|{{page.good}}|{{page.good}}|{{page.good}}|{{page.good}}|{{page.thumbsup}}||
|[LND](#lnd-cli-interface)|[v0.14.2](https://github.com/LightningNetwork/lnd)|{{page.cli}}|{{page.good}}|{{page.good}}|{{page.good}}|{{page.good}}|{{page.thumbsup}}|
|[Mash](https://app.mash.com/wallet)|[Beta](https://mash.com/consumer-experience/)|{{page.laptop}}{{page.phone}}|{{page.good}}|{{page.good}}|{{page.good}}|{{page.good}} | {{page.thumbsup}}|
|[Muun](#muun-móvil)|[47.3](https://muun.com/)|{{page.phone}}|{{page.good}}|{{page.good}}|{{page.bad}}|{{page.bad}}|{{page.thumbsdown}}|
|[Phoenix](#phoenix-móvil)|[35-1.4.20](https://phoenix.acinq.co/)|{{page.phone}}|{{page.good}}|{{page.soso}}|{{page.soso}}|{{page.soso}}|{{page.unclear}}|
|[SBW](https://github.com/RoboSats/robosats/issues/44#issue-1135544303)|[2.4.27](https://github.com/btcontract/wallet/)|{{page.phone}}|{{page.good}}|{{page.good}}|{{page.good}}|{{page.good}}|{{page.thumbsup}}|
|[WoS](https://github.com/RoboSats/robosats/issues/44#issue-1135544303)|[1.15.0](https://www.walletofsatoshi.com/)|{{page.phone}}|{{page.good}}|{{page.good}}|{{page.good}}|{{page.good}}|{{page.thumbsup}}|
|[Zeus](#zeus-móvil-lnd-cln-eclair-remote-backend)|[v0.6.0-rc3](https://github.com/ZeusLN/zeus)|{{page.phone}}{{page.remote}}|{{page.soso}}|{{page.good}}|{{page.good}}|{{page.good}}|{{page.thumbsup}}|

1. **UX:** ¿Muestra claramente la wallet que hay un pago "en transito" (factura retenida)?
2. **Fianzas:** ¿Puede la wallet bloquear los invoices con tiempos de expiracioón largos necesarios para las fianzas?
3. **Pagos:** ¿Puede la wallet recibir pagos de RoboSats después de comprar Sats?
4. **Compatible:** ¿Es la wallet generalmente compatible con RoboSats?
5. **Total:** ¿Es la wallet suficientemente compatible y estable para ser usada consistentemente sin problemas?

### Alby (extensión de navegador)
Alby es una extensión de navegador compatible con el estándar WebLN. Dado que RoboSats es compatible con WebLN, la experiencia con Alby es probablemente la mejor de su clase: no tendrás que escanear los códigos QR ni generar invoices, simplemente haz clic en la ventana emergente de Alby para confirmar las acciones. Puedes conectar la extensión de Alby a la mayoría de los nodos y wallets populares, o simplemente dejar que Alby aloje una wallet de custodia para ti.

Instrucciones especiales para instalar Alby en el navegador Tor:
1. Instala la extensión de Alby desde [Firefox add-ons store](https://addons.mozilla.org/en-US/firefox/addon/alby/)
2. Clicka en la extension de Alby y sigue los pasos para configurar tu wallet.

### Blink (Móvil, antiguo Bitcoin Beach Wallet)
Funciona bien con RoboSats. Las facturas retenidas aparecen como "Pendiente" en el historial de transacciones. Los pagos a la wallet Blink funcionan según lo previsto. Wallet custodiado por Galoy que se originó en el proyecto Bitcoin Beach en El Salvador (anteriormente conocido como "Bitcoin Beach Wallet").

### Blixt (Android/iOS, backend ligero LND en el dispositivo)
La mayoría de las pruebas de desarrollo para Robosats se han realizado con Blixt. Es una de las wallets Lightning más completas que existen. Sin embargo, genera malentendidos cuando las facturas retenidas están bloqueadas, ya que muestra una rueda giratoria con el pago en tránsito. El usuario debe verificar el sitio web (robosats) para confirmar. Blixt permite múltiples HTLC pendientes, esto es necesario como vendedor ya que necesita bloquear un bono de tomador/creador y luego un fideicomiso comercial (2 HTLC concurrentes pendientes). Eventualmente, también podría mostrarse como facturas pagadas/cargadas que aún están pendientes, especialmente si el usuario fuerza el cierre de blixt y lo vuelve a abrir. Ocasionalmente pueden mostrarse como fianzas que de hecho han sido devueltas.

### Bluewallet (Móvil)
Funciona bien. Pero están teniendo problemas en el modo custodial. Las fianzas que devuelve RoboSats se cobran a los usuarios (¿entonces Bluewallet se queda con ese saldo?). Y los bonos que se reparten... ¡Blue los cobra dos veces! Más información una vez que nos respondan. EDIT: ¡Blue ha confirmado que están trabajando para resolver pronto estos errores contables!

### Breez (Móvil)
Funciona bien con RoboSats. Breez es una wallet no custodial. Así que ten en cuenta la gestión de canales y cosas así. Es una interfaz versátil y fácil de usar.

### Cash App (móvil)
Funciona bien con RoboSats. Las facturas retenidas  aparecen como "Pendientes" en el historial de transacciones. Los pagos a la wallet Cash App funcionan según lo previsto. wallet custodiada por Block, Inc, anteriormente conocido como Square, Inc, que está dirigido por Jack Dorsey.

### Core Lightning / CLN (CLI Interface)
Funciona como es esperado. El comando `lightning-cli pay <invoice>` no concluye mientras el pago está pendiente, pero puedes usar `lightning-cli paystatus <invoice>` para monitorear el estado.

### Electrum (Desktop)
La experiencia en el uso de Electrum es limitada. No parece admitir más de un HTLC pendiente (incluso si hay varios canales). No se recomienda usar esta wallet con RoboSats. Sin embargo, funciona bien si usted es un comprador, ya que solo se necesita una factura retenida para la fianza de fidelidad. El pago se muestra como pendiente con una rueda giratoria durante el tiempo de bloqueo.

### LND (CLI Interface)
Raw, muestra exactamente lo que está sucediendo y lo que sabe "IN_FLIGHT". No es fácil de usar y, por lo tanto, no se recomienda que los principiantes interactúen con Robosats. Sin embargo, todo funciona perfectamente. Si usas LNCLI regularmente, no encontrarás ningún problema para usarlo con RoboSats.

### Mash Wallet App (Mobile PWA & Desktop Web-Wallet)
En general, la wallet [Mash](https://mash.com/consumer-experience/) funciona de extremo a extremo con Robosats tanto en la venta como en la compra a través de lightning. La mayoría de los detalles relevantes de la factura en la wallet mash se muestran y son claros para los usuarios durante todo el proceso. Cuando las transacciones se completan, se abren en la aplicación móvil tanto en el lado del remitente como en el del destinatario para resaltar que las transacciones se han completado. El equipo tiene un error abierto para solucionar este problema en breve (esta nota es del 21 de agosto de 2023).

### Muun (Móvil)
Muun funciona igual de bien con las facturas retenidas que Blixt o LND. Puedes ser vendedor en RoboSats usando Muun y la experiencia de usuario será excelente. Sin embargo, para ser un comprador, debes enviar una dirección onchain donde recibir el pago, una invoice lightning no funcionará. Muun está haciendo un _ataque de desvío de tarifas_ a cualquier remitente que pague a Muun. Hay un salto obligatorio a través de un canal privado con una tarifa de +1500ppm. RoboSats estrictamente no enrutará el pago de un comprador por una pérdida neta. Dado que las tarifas de intercambio en RoboSats son del 0,2% y debe cubrir las tarifas de enrutamiento, **RoboSats nunca encontrará una ruta adecuada para un usuario de Muun**. Por el momento, RoboSats escaneará la invoice en busca de sugerencias de enrutamiento que potencialmente puedan codificar en un _ataque de desvío de tarifas_. Si se da el caso, la invoice será rechazada: envíe una dirección onchain en su lugar para un hacer un swap. Consulta [Entender > Pagos on-chain](/docs/es/on-chain-payouts/) para obtener más información sobre los intercambios on-chain. Es importante tener en cuenta que Muun tiene problemas en épocas de picos altos de comisiones on-chain. En cualquier caso, la solución para recibir a Muun es: o bien enviar una dirección on-chain o elegir un presupuesto de enrutamiento más alto después de activar el interruptor de "Opciones avanzadas".

### OBW (Móvil)
Uno de los más simples y uno de los mejores. La factura retenida muestra como "sobre la marcha", no es de custodial y puede crear sus propios canales. Compra uno a un proveedor de liquidez o utilice Hosted Channels. Es mantenido por el gran Fiatjaf y es un fork del abandonado SBW.
*Actualización 26-10-23: En este momento no tiene desarrollo ni soporte.

### Phoenix (Móvil)
Phoenix funciona muy bien como tomador de ordenes. Phoenix también funcionará bien como creador de ordenes, siempre que la configuración de la orden `duración pública` + `duración del depósito` sea inferior a 10 horas. De lo contrario, es posible que haya problemas para bloquear la fianza de creador. Si la duración total de los invoice de las fianzas/depositos supera los 450 bloques, Phoenix no permitirá que los usuarios bloqueen la fianza (`No se puede agregar htlc (...) razón = caducidad demasiado grande`).

### SBW (Móvil)
Desde la version 2.5 no soporta lightning

### Zeus (Móvil, LND, CLN, Eclair remote backend)
Es una interfaz para LND, CLN y Eclair. Funciona como es esperado. Es extremadamente engañoso con una pantalla roja completa "TIME OUT" unos segundos después de enviar el HTLC. Sin embargo, si el usuario consulta en el sitio web, el invoice se bloquea correctamente.

## <i class="fa-solid fa-code-pull-request"></i> Ayuda a mantener actualizada esta página
Hay muchas wallets y todas siguen mejorando a la velocidad de la luz. Puedes contribuir al proyecto de código abierto RoboSats probando wallets, editando [el contenido de esta página](https://github.com/Robosats/robosats/tree/main/docs/{{page.src}}) y abriendo un [Pull Request](https://github.com/Robosats/robosats/pulls)

## Información adicional

Recibir Sats a través de Lightning no es completamente privado. Consulta [Mejores Practicas > Proxy Wallets](/docs/es/proxy-wallets/) para más información sobre cómo recibir Sats de forma privada.

Si tienes problemas para recibir fondos en tu wallet (debido a problemas de gestión del canal, problemas de enrutamiento, problemas de la wallet, etc.), una solución rápida para recibir un pago rápido sería tener un segunda wallet a mano que esté bien conectado y con suficiente capacidad de canal. Podrías recibir Sats en tu segunda wallet y, una vez resueltos los problemas, enviarlos a tu wallet principal.

¡No dudes en contactar con el grupo de chat público RoboSats [SimpleX](/contribute/code/#communication-channels) para pedir consejo o ayuda en el uso de los wallets!

{% include improve_es %}
