---
layout: single
title: "Traduce RoboSats"
permalink: /contribute/es/languages/
sidebar:
  title: '<img id="side-icon-verybig" src="/assets/vector/language.svg"/>Traducción'
  nav: contribute
toc: true
toc_sticky: true
src: "_pages/es/contribute/02-languages.md"
---

RoboSats es una forma de cambiar bitcoin por **cualquier moneda del mundo**. Por ello, muchos usuarios sólo encontrarán útil esta herramienta si está disponible en un idioma que entiendan. Traducir RoboSats a un nuevo idioma es una de las contribuciones más valiosas al proyecto. Pone la plataforma a disposición de nuevos públicos, aumenta el alcance de esta genial herramienta de libertad y, en consecuencia, incrementa la liquidez de la cartera de pedidos para que aún más usuarios apilen Sats en privado.

No hay mucho texto en RoboSats; sin embargo, podría ser mejor dividir el trabajo con otro contribuyente. Puedes ponerte en contacto con las [comunidades RoboSats](https://learn.robosats.org/contribute/es/code/#canales-de-comunicación) y encontrar usuarios dispuestos a dividir la tarea.

## Cómo contribuir con una nueva traducción

Simplemente crea un nuevo archivo de traducción en `frontend/static/locales` [enlace a GitHub](https://github.com/RoboSats/robosats/tree/main/frontend/static/locales). En `locales` hay un único archivo con un diccionario json para cada idioma. Para crear una nueva traducción, simplemente copia `es.json` (el texto maestro) en un nuevo archivo con el nombre del idioma [código ISO 639 de dos caracteres](https://www.loc.gov/standards/iso639-2/php/English_list.php).

## Directrices

El diccionario `.json` de cada idioma contiene pares de claves y valores con el siguiente formato {"clave1": "valor1", "clave2": "valor2", ...}. La mayoría de las claves son frases literales en inglés. Simplemente hay que traducirlas a la derecha, por ejemplo, para traducir el botón `Make Order` al español, se editaría el fichero json para que tuviera este aspecto `{... "Make Order": "Crear Orden",...}`.

### 1. **No todas las teclas son frases explícitas.**
Algunas claves no son la sentencia en inglés, sino un nombre de variable. Por ejemplo, "phone_unsafe_alert". En este caso, debes echar un vistazo al valor originalmente en `en.json`.

### 2. **El diccionario de idioma está dividido en 9 secciones.**
La primera clave de cada sección es una referencia y no es necesario traducirla. Por ejemplo, la segunda sección comienza con la clave:valor `"USER GENERATION PAGE - UserGenPage.js": "Landing Page and User Generation"`. No es necesario traducirlo; es sólo información para que el traductor entienda en qué parte de la aplicación va a trabajar.

### 3. **Intenta mantener una longitud similar a la de la frase original.**
En la mayoría de los casos no pasa nada si la traducción es más corta. Sin embargo, las traducciones con un mayor número de caracteres pueden romper la interfaz de usuario. No siempre es posible ceñirse a la longitud de la frase en inglés. En esos casos, es posible que haya que modificar la interfaz de usuario. Póngase en contacto con la persona responsable de dicho cambio.

### 4. **Algunas frases contienen variables.**
Por ejemplo, {{currencyCode}}. Insertará el código de moneda donde se encuentre la variable. Por ejemplo, `"Paga 30 {{currencyCode}}"` se renderizará como "Paga 30 USD".

### 5. **Algunas frases contienen etiquetas HTML.**
Estas etiquetas suelen ser hipervínculos. Por ejemplo, en `{"phone_unsafe_alert": "Use <1>Tor Browser</1> y visite el sitio <3>Onion</3>."}` el texto hijo de <1> (Tor Browser) enlazará con el sitio web Tor Download, y los hijos de <3> enlazarán con el sitio RoboSats Onion.

### 6. **Es mejor traducir de arriba a abajo del archivo .json**.
Algunos textos son de alta prioridad, otros de baja prioridad. Es probable que algunas claves cambien pronto o que no sean tan relevantes para el usuario de la aplicación. Los archivos de traducción se ordenan de arriba a abajo por la prioridad de la traducción.

### 7. **Usa un corrector ortográfico.**
Sí, por favor! 😉

### 8. **Entiende el contexto; ¿dónde se mostrará esta cadena?**
Las traducciones literales pueden no funcionar bien en algunos idiomas. Mientras que en inglés la redacción es siempre similar independientemente de la posición en la interfaz de usuario, en algunos idiomas puede ser muy diferente si estás traduciendo un botón (el usuario está realizando una acción) o si simplemente estás traduciendo un tooltip. Podría ser inteligente traducir las cadenas mientras se mira la aplicación. Sin embargo, muchas cadenas sólo pueden encontrarse mientras se opera. El sitio testnet RoboSats es genial para este uso. Puedes explorar toda la app simplemente interactuando con ella usando una wallet testnet Lightning. Sin embargo, si no puedes encontrar dónde se muestra una cadena, puede ser más rápido simplemente escribir un mensaje en el [grupo SimpleX](https://simplex.chat/contact#/?v=1-2&smp=smp%3A%2F%2F0YuTwO05YJWS8rkjn9eLJDjQhFKvIYd8d4xG8X1blIU%3D%40smp8.simplex.im%2FyEX_vdhWew_FkovCQC3mRYRWZB1j_cBq%23%2F%3Fv%3D1-2%26dh%3DMCowBQYDK2VuAyEAnrf9Jw3Ajdp4EQw71kqA64VgsIIzw8YNn68WjF09jFY%253D%26srv%3Dbeccx4yfxxbvyhqypaavemqurytl6hozr47wfc7uuecacjqdvwpw2xid.onion&data=%7B%22type%22%3A%22group%22%2C%22groupLinkId%22%3A%22hWnMVPnJl-KT3-virDk0JA%3D%3D%22%7D).

### 9. **¡Felicítate a ti mismo!**
En serio. ¡Es tan impresionante que estés ayudando a construir herramientas de libertad!

{% include improve_es %}
