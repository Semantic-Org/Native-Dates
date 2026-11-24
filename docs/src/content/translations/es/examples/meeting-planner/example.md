---
source: 'a1acc3289f74'
title: Una reunión entre zonas horarias
description: Elige una hora de reunión para mañana en tu zona local y consulta ese mismo instante en ciudades de todo el mundo.
try:
  - 'Fija la hora de inicio en **23:00** para ver cómo Tokio y Calcuta pasan al día siguiente.'
  - 'Cambia la barra de vista previa a otra zona horaria para programar la reunión desde esa ciudad.'
  - 'Añade `''Australia/Sydney''` a `CITIES` en `cities.js` para sumar otra ciudad al listado.'
---

Para programar la reunión se parte de `tomorrow().at(input.value)`, que combina el día de calendario de mañana con la hora elegida. Ese único instante alimenta toda la lista sin cálculos manuales de desplazamientos UTC.

Para cada ciudad, `meeting.in(zone)` muestra el mismo instante en esa zona horaria IANA y `format('time')` imprime su reloj local.

Comparar `there.date` con la fecha del anfitrión detecta cuándo una ciudad cruzó la medianoche. La fila muestra el nombre del día de la semana solo cuando el día difiere.
