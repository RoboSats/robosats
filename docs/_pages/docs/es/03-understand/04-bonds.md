---
layout: single
title: Maker and Taker Bonds
permalink: /docs/es/bonds/
toc: true
toc_sticky: true
sidebar:
  title: '<img id="side-icon-verybig" src="/assets/vector/ticket-simple.svg"/>Bonds'
  nav: docs
src: "_pages/docs/es/03-understand/04-bonds.md"
---

La **fianza de fidelidad** es un pequeño depósito que el usuario "bloquea" y que se desbloqueará después de que se complete la transacción; sin embargo, los usuarios pueden perder su fianza si no cumplen con las obligaciones del contrato.

El **proceso de comercio de RoboSats** utiliza fianzas de fidelidad para incentivar tanto al creador de la orden como al tomador a seguir las reglas y no engañar a su compañero robot. Más específicamente, las fianzas son [facturas bloqueadas](https://github.com/lightningnetwork/lnd/pull/2022) utilizando la Red Lightning; ¡es la tecnología que hace posible RoboSats!
Consulte [Comprender > Custodia de operaciones > ¿Qué es una factura retenida?](/docs/es/escrow/#qué-es-una-factura-de-retención) para comprender cómo funcionan en la práctica las facturas de retención.

Por defecto, la fianza es del 3% del monto total de la transacción. Alternativamente, los creadores de órdenes pueden personalizar este monto desde un 2% hasta un 15%. Fianzas más grandes significan más "compromiso" necesario para comerciar.

La fianza no sale de tu billetera Lightning, pero ten en cuenta que algunas wallets funcionan mejor con RoboSats que otras debido a la naturaleza del mecanismo de factura bloqueada de Lightning. Consulta [Entender > Wallets](/docs/es/wallets/) para obtener información adicional.

*Nota: La opción que permite a los "Tomadores sin fianza" está en desarrollo pero no está disponible por el momento.*

## **Cómo bloquear una fianza**

Primero, consulta [Entender > Wallets](/docs/es/wallets/) para encontrar wallets Lightning compatibles que facilitarán el uso de RoboSats. Dependiendo de la wallet, la factura puede mostrarse como un pago en tránsito, congelado o incluso como si estuviera fallando. ¡Consulta la lista de compatibilidad de wallets!

Lee la guía correspondiente según si estás creando o tomando la orden:

* **Creador (Maker)**: Selecciona "Crear orden" y modifica las condiciones de la orden a tu gusto. La orden se puede personalizar para requerir una fianza diferente al 3% predeterminado del monto total de la transacción, variando desde un 2% hasta un 15%. Una vez completado, confirma con "Crear orden" y luego utiliza el siguiente código QR que se encuentra en el "Cuadro de contrato" con tu billetera Lightning para bloquear la cantidad indicada de satoshis para tu fianza. Siempre puedes cancelar la orden no tomada mientras esté activa y la fianza se desbloqueará automáticamente; sin embargo, si intentas cancelar la orden después de que sea tomada, perderás tu fianza. *Nota: Prepárate con tu billetera de antemano porque el cuadro de orden expira en diez minutos.*

* **Tomador (Taker)**: Explora el libro de órdenes y encuentra una orden a tu gusto. Simplemente selecciona la opción "Tomar orden" y luego utiliza el siguiente código QR que se encuentra en el "Cuadro de contrato" con tu billetera Lightning para bloquear la cantidad indicada de satoshis para tu fianza. *Nota: Prepárate con tu billetera de antemano porque el cuadro de orden expira en cuatro minutos. Si no procedes, la orden tomada vuelve a ser pública.*

Después de que se completa la transacción y ambos robots están satisfechos, las fianzas del creador y el tomador se desbloquean. Técnicamente, la fianza bloqueada nunca salió de tu billetera; pero ten cuidado, si no sigues las obligaciones del contrato intentando engañar o cancelando unilateralmente, perderás tu fianza de fidelidad.

Tu billetera puede tardar un tiempo en mostrar los fondos como desbloqueados en el saldo de tu cuenta. Algunas wallets tienen dificultades para reconocer la factura bloqueada de Lightning como una retención temporal de tus fondos.

Si el problema persiste, ponte en contacto con el grupo de Telegram de RoboSats; pero ten cuidado con los estafadores que pueden contactarte directamente e hacerse pasar por el personal de RoboSats. El personal de RoboSats nunca se pondrá en contacto contigo primero. Consulta [Contribuir > Código > Canales de comunicación](/contribute/code/#communication-channels) para conocer los grupos de Telegram disponibles.

## **Perder tu fianza**

Básicamente, hay cinco condiciones que provocan que un usuario pierda su fianza:

* Engañar o decepcionar a tu par (y perder la disputa de la orden)

* Cancelar unilateralmente la orden sin la colaboración de tu par

* No presentar la factura de pago como comprador de bitcoin dentro del límite de tiempo dado

* No presentar la fianza de la transacción como vendedor de bitcoin dentro del límite de tiempo dado

* No confirmar que se recibió el fiat como vendedor de bitcoin

Las condiciones anteriores se detallan más a continuación.

Si el límite de tiempo para presentar la factura (comprador) o bloquear el fideicomiso (vendedor) se agota, la orden caducará y el robot que no cumplió con su parte del trato perderá la fianza. La mitad de la fianza perdida va al robot honesto como compensación por el tiempo perdido. Ganar como recompensa la fianza de tu contraparte es algo que solo ocurre en casos excepcionales y mayormente depende del criterio de tu coordinador para tu caso concreto. Las únicas situaciones en las que la mitad de la fianza de la contraparte se gana como recompensa es en aquellos casos en los que no se completa el depósito del intercambio (paso 2 para el vendedor), no se aporta una factura lightning para recibirlos (paso 2 para el comprador) o no se escribe absolutamente nada una vez abierto el chat. Por norma general, en RoboSats no se podrá ganar la fianza de la contraparte y siempre será criterio del coordinador hacer una excepción. En casos de negligencia clara o intento activo de estafa, cada coordinador investigará el caso concreto y podrá estimar el porcentaje de la fianza con la que recompensa a la contraparte. 

Ten presente tu orden porque una vez que un robot la toma y bloquea su fianza de fidelidad, podrías perder tu fianza si el tiempo se agota. ¡Asegúrate de recordar tu orden y respalda el token de tu robot!

Si recibiste fiat pero no haces clic en "Confirmar recepción de fiat" en tu extremo, corres el riesgo de perder tu fianza, ya que se abre automáticamente una disputa y el personal de RoboSats entenderá que no has seguido las reglas del contrato.

Debido a los límites de tiempo involucrados en el proceso de orden, se recomienda utilizar métodos de pago instantáneo en fiat que ayuden a reducir las posibilidades de perder tu fianza. Consulta [Mejores prácticas > Métodos de pago](/docs/es/payment-methods/) para obtener información adicional.

No se recomienda abrir una disputa solo para cancelar una orden porque uno de los dos comerciantes perderá su fianza de fidelidad, el otro no ganará nada y todos perderéis más tiempo. Únicamente abre disputa en casos de sospecha de estafa o si la otra parte no sigue las reglas. En casos excepcionales, podría ser que ninguno perdiera la fianza o que ambos lo hicieran. Esto quedan a discreción del personal de RoboSats.

Como nota al margen, si RoboSats desaparece repentinamente o se cierra, las fianzas se desbloquean automáticamente ya que técnicamente nunca salieron de tu billetera.

## **¿No tienes bitcoin para las fianzas?**

Debido a que las fianzas requieren una factura bloqueada de Lightning, ¿qué puedes hacer si no tienes bitcoin desde el principio? Aunque la fianza suele ser solo del 3% de tu monto total de transacción, esto presenta una barrera real para usar RoboSats por primera vez si no tienes satoshis acumulados .

Actualmente, los tomadores sin fianza no están disponibles; sin embargo, ¡ten en cuenta que esto está en desarrollo! Los tomadores sin fianza presentan un mayor riesgo para el creador de la orden, ya que el tomador no tiene nada en juego. Puede ser razonable esperar primas más altas en órdenes que permiten tomadores sin fianza.

Hay una gran cantidad de aplicaciones y servicios disponibles donde se pueden ganar pequeñas cantidades de bitcoin. RoboSats no respalda una aplicación específica, pero los usuarios han informado éxito con aplicaciones como [Stacker News](https://stacker.news/), [Fountain](https://www.fountain.fm/), [Carrot](https://www.earncarrot.com/), [THNDR](https://www.thndr.games/), etc.

Dado que la fianza es una retención temporal de tus fondos, incluso podrías pedir prestados satoshis a un amigo solo para la fianza de fidelidad. Después de que la fianza se desbloquea de una transacción exitosa, ¡simplemente devuelve los fondos a tu amigo!

{% include improve_es %}
