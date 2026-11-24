---
source: '78385378fc10'
title: Cuenta regresiva para un lanzamiento
description: Cuenta en vivo el tiempo restante hasta el viernes a las 17:00 y muestra la duración en estilos completo, compacto y digital.
try:
  - 'Observa cómo avanza cada segundo mientras `now().until(launch)` vuelve a calcular la duración restante.'
  - 'Cambia `''friday''` por `''monday''` en `app.js` para mover el día de lanzamiento (los nombres de día se pasan en inglés).'
  - 'Elige `Asia/Tokyo` en la barra de vista previa, donde el viernes a las 17:00 llega varias horas antes.'
---

El instante objetivo se construye con `today().next('friday').at('5pm')`. Esta expresión avanza hasta el próximo viernes y fija el reloj local a las cinco de la tarde.

Cada segundo, `now().until(launch)` mide la duración restante en días, horas, minutos y segundos. Llamar a `round('second')` recorta los milisegundos para que el contador en vivo avance con limpieza.

Por último, `format()` muestra esa misma duración con palabras junto a sus estilos compacto y de temporizador digital, sin dividir manualmente por milisegundos.
