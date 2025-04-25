---
layout: single
title: Robot Avatars
permalink: /docs/es/robots/
toc: true
toc_sticky: true
sidebar:
  title: '<img id="side-icon-verybig" src="/assets/vector/robot.svg"/>Robots'
  nav: docs
src: "_pages/docs/es/03-understand/02-robots.md"
---

Identificate como un robot con su token privado correspondiente. ¡Usa esta identidad anónima para comenzar a hacer y recibir ordenes con RoboSats! No se recomienda usar el mismo robot dos veces ya que esto degrada la privacidad del usuario final.

Cada nueva visita a la página web del sitio de RoboSats presentará al usuario final un avatar de robot y un nombre de usuario generados de forma automática y aleatoria para proporcionar privacidad por defecto al usuario final.

Por lo tanto, asegúrate de **almacenar de forma segura el token privado** asociado con ese avatar específico. Sin el token, no podrás acceder ni volver a generar ese avatar único.

¡Recuerda ser conciso pero cortés cuando chatees con tus pares robots!

## **¿Por qué la privacidad?**

Dar prioridad a la privacidad absoluta del usuario final proporciona el mayor grado de protección. Los datos de los usuarios son especialmente propicios a ser explotados por piratas informáticos y ciberdelincuentes; Para evitar tales escenarios en primer lugar, RoboSats no recopila ningún dato del usuario.

Las plataformas que recopilan información personal presentan un riesgo real para el usuario. Las filtraciones de datos en la última década han filtrado informacion sensible de miles de millones de usuarios combinando piratería y seguridad deficiente de las plataformas.

La privacidad es extremadamente importante para RoboSats; sin embargo, tus transacciones en RoboSats son tan privadas como tu las realices. Los usuarios deben tener cuidado de utilizar métodos que preserven la privacidad al interactuar con RoboSats y sus pares robots. Consulte [Inicio rápido > Acceso](/docs/es/access/) para obtener información adicional.

## **Reutilización del robot: no recomendado**

Se recomienda encarecidamente generar un nuevo robot aleatorio después de cada operación para mejorar la privacidad. La reutilización de robots puede potencialmente exponer la información del usuario, ya que se pueden vincular varios pedidos a un solo avatar.

El token único asociado con cada avatar no está destinado a la reutilización del robot; más bien, está destinado a actuar como una contraseña para acceder a pedidos en curso y resolver disputas activas. Guarda este token de forma segura o correras el riesgo de no volver a acceder a ese avatar de robot en particular.

Recuperar un robot es fácil: simplemente reemplaza el token generado aleatoriamente con tu token respaldado y selecciona "Generar robot" para recuperar el perfil de tu robot.

Si bien es posible que nos encariñemos con nuestra identidad de robot único durante el breve tiempo en que se realiza o toma una orden, es mejor pasar a un nuevo avatar. ¡Piensa en todos los buenos momentos que tendrás haciendo y tomando ordenes con nuevas identidades de robot!

Como se indicó, la reutilización de robots es desaconsejable y, en última instancia, puede convertirse en un detrimento para la privacidad del usuario final.

## **Proceso de construcción de robots**

RoboSats hace referencia al código fuente de RoboHash.org como una forma rápida de generar nuevos avatares para un sitio web. Su robot se "construye" a partir de un token único, una cadena aleatoria de caracteres (ZD3I7XH...), donde solo esos caracteres en su orden exacto pueden generar ese avatar de robot exacto.

Se genera automáticamente un token para el usuario cada vez que se accede a la página web de RoboSats. Los usuarios pueden volver a generar tantos tokens aleatorios como deseen, lo cual se recomienda encarecidamente después de cada transacción. Como nota, puedes ingresar un token de entropía suficiente creada por ti mismo en lugar de confiar en RoboSats. Debido a que solo tu conoces el token, es aconsejable hacer una copia de seguridad del token de forma segura.

En el fondo, la creación de tokens en la página de inicio de RoboSats es el proceso de generar y cifrar tu clave privada PGP con tu token en el lado del cliente de la app. El usuario solicita al nodo RoboSats un avatar y un apodo generados a partir del token cifrado y le devuelve la identidad del robot correspondiente. Vea el gráfico a continuación:

![Generación de identidades de RoboSats](https://learn.robosats.org/assets/images/private/usergen-pipeline.png)

## **Comunicándose con sus pares robots**

Su identidad puede estar oculta por una identidad de robot, pero eso no es excusa para ser un compañero difícil durante los intercambios. ¡Otros robots también tienen robo-sentimientos! Se conciso y respetuoso al conversar con tus pares; esto hará que la experiencia en RoboSats sea más fácil y fluida. Nunca compartas más información de la que sea absolutamente necesaria para completar el intercambio.

Todas las comunicaciones en RoboSats están encriptadas con PGP. Los mensajes de chat cifrados entre pares están firmados por cada robot, lo que demuestra que nadie interceptó el chat y es útil para resolver disputas. Consulta [Buenas prácticas > Cifrado PGP](https://learn.robosats.org/docs/pgp-encryption/es/) para obtener información adicional.
