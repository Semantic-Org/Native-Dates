---
source: '6fd6b6ec1692'
title: Abierto ahora
description: Comprueba si distintos establecimientos en varias zonas horarias están abiertos a cualquier hora, incluidos horarios nocturnos que cruzan la medianoche.
try:
  - 'Elige `Asia/Tokyo` en la barra de vista previa y fija la hora en **01:00** para ver cómo el bar de ramen sigue abierto pasada la medianoche.'
  - 'Cambia la barra de vista previa a `Europe/London` o `America/Los_Angeles` para ver cómo cambia la misma hora en el resto del mundo.'
  - 'Añade un establecimiento con horario nocturno como `22:00` a `04:00` en `PLACES` dentro de `app.js`.'
---

Cada establecimiento define su horario con `timeRange(open, close)` en su propio reloj local. Cuando la hora de cierre es anterior a la de apertura, el rango cruza la medianoche automáticamente.

Para cualquier hora elegida, `today().at(input.value)` construye el instante e `in(place.zone)` lo convierte al reloj local del establecimiento.

Comprobar `hours.contains(local.time)` responde si está abierto o no, sin casos especiales para turnos nocturnos ni cálculos manuales en UTC.
