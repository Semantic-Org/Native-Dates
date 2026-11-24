---
source: '8e121fa04579'
title: Cuadrícula mensual
description: Construye una cuadrícula mensual navegable a partir de un YearMonth usando límites de semana según el locale e iteración sobre DateRange.
try:
  - 'Avanza y retrocede por los meses y luego haz clic en **Today** para volver al mes actual.'
  - 'Llama a `configure({ locale: ''de-DE'' })` en `app.js` para cambiar la cuadrícula a semanas que comienzan el lunes.'
  - 'Aplica estilos a los días laborables con `day.isWeekday()` o avanza un año completo con `current.plus(1, ''year'')`.'
---

El estado del calendario es un único valor `yearMonth(today())`. Moverse entre meses requiere solo una llamada a `minus()` o `plus()`.

Para rellenar las celdas iniciales y finales de la cuadrícula, `startOf('week')` y `endOf('week')` expanden los límites del mes según el primer día de la semana del locale activo.

Llamar a `every('day')` sobre ese rango devuelve cada celda del día en orden, donde `day.isToday()` y `day.isWeekend()` controlan directamente las clases de cada celda.
