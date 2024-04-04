---
layout: single
title: Prima sobre el Mercado
permalink: /docs/es/premium/
toc: true
toc_sticky: true
sidebar:
  title: '<img id="side-icon-verybig" src="/assets/vector/percent.svg"/>Prima'
  nav: docs
src: "_pages/docs/es/03-understand/03-premium.md"
---

La prima asociada con su orden de par a par es la diferencia de precio que existe por encima o por debajo de la tarifa actual de bitcoin-fiat que se encuentra en sus intercambios centralizados típicos.

Al navegar por el libro de ordenes, el precio de intercambio de bitcoin de los ordenes en vivo se ajusta automáticamente para incluir la prima correspondiente de la orden.

En la parte inferior de la interfaz de robosats se encuentra la prima de precio durante las últimas 24 horas, generalmente alrededor de +5%, y es de esperar en un entorno privado entre pares.

¡Elige una prima competitiva e incentiva a otros robots para que brinden liquidez al mercado con sus bitcoins y fiat anónimos!

## **Elegir una prima**

Crea una orden, luego ingresa la "Prima sobre el mercado (%)", que puede ser un valor de porcentaje positivo, negativo o cero. De forma predeterminada, la prima del pedido tiene un precio relativo a la tarifa de mercado de bitcoin-fiat.

O, en lugar de la configuración predeterminada, los creadores de la orden pueden seleccionar el método fijo de precios explícito eligiendo una cantidad exacta de satoshis para intercambiar por la cantidad fiat dada.

Al seleccionar una prima, ten en cuenta los métodos de pago y el monto que hayas elegido; estos, junto con su prima deseada, competirán con otras órdenes en vivo para incentivar y atraer a los robots tomadores de la orden. Experimenta con diferentes primas para encontrar la que mejor se adapte a tus ordenes específicas.

Si compras bitcoin, entonces una prima más alta aumenta las posibilidades de que un vendedor tome la orden; o, si vendes bitcoin, entonces una prima más alta disminuye las posibilidades de que un comprador tome la orden. Como creador de ordenes, se muestra cómo se compara la prima de tu orden con el resto de ordenes activas de la misma moneda.

Resumiendo:
* Prima **Positiva**: opera BTC a un sobreprecio con respecto al precio promedio en los intercambios centralizados.
* Prima **Negativa**: opera BTC con un descuento con respecto al precio promedio en los intercambios centralizados.
* Prima **cero**: opera BTC sin diferencia de precio con respecto al precio promedio en los intercambios centralizados.
* Método de fijación de precios **relativo**: deja que la prima de precio se mueva con precio de mercado de bitcoin-fiat.
* Método de fijación de precios **explícito**: establezca una prima de precio utilizando una cantidad fija de satoshis.
* **Clasificación de prima**: indica cómo se clasifica la prima de su pedido respecto al resto de órdenes públicas con la misma moneda, desde 0 % (prima más baja) hasta 100 % (prima más alta).

Al realizar la orden, debajo del botón "Crear orden", verás un resumen en texto con la descripción tu orden. Por ejemplo, comprar bitcoin por $100 con una prima de +5,00% en relación con el precio de mercado sería: "Crear orden de compra de BTC por 100 USD con una prima del 5%".

Si se comete un error al seleccionar una prima, o el pedido no se toma dentro de tu preferencia de tiempo, entonces el pedido se puede cancelar fácilmente para hacer uno nuevo.

Ten en cuenta que el valor porcentual está limitado a dos decimales. Además, formatea los valores decimales usando "." (punto) y no "," (coma) como separador decimal.

## **¿Por qué tener primas?**

Naturalmente, muchos robots quieren comprar bitcoins pero muy pocos quieren vender; como consecuencia, existe una gran demanda de intercambio de bitcoins de forma privada. Las primas son simplemente el subproducto de esa relación de oferta y demanda en un mercado anónimo de par a par.

Por lo tanto, los compradores deben ser realistas y ajustar sus primas en consecuencia; de hecho, los vendedores que intercambian bitcoins por fiat generalmente buscarán una prima porque están proporcionando liquidez con sus bitcoins. Sin embargo, dependiendo de las condiciones del mercado, la prima puede volverse cero o negativa.

La privacidad es valiosa tanto para el comprador como para el vendedor y siempre vale la pena, ya sea por el tiempo, el esfuerzo o el riesgo; como tal, los usuarios pueden esperar una prima adicional con sus transacciones.

## **Información Adicional**

La prima relativa hace referencia a los tipos de cambio actuales de las API públicas, específicamente los precios de blockchain.io y yadio.io. Luego se calcula el precio medio de bitcoin en la moneda seleccionada y se muestra como la tarifa de mercado que sigue su prima.

La prima de 24 horas que se muestra en robosats está determinada por la mediana ponderada, no por la media, de los pedidos exitosos en las últimas 24 horas. Este método de cálculo es más resistente a los valores atípicos y más representativo del consenso del mercado entre pares. En otras palabras, el usuario debe ver este valor como la prima que aproximadamente puede esperar pagar por una orden.
