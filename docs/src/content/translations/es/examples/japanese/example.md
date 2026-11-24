---
source: 'c0cdbd2ef3c9'
title: Eras japonesas, fechas y turnos
description: Formatea eras imperiales japonesas con gannen en el primer año, fechas en kanji sin ceros iniciales y turnos nocturnos que cruzan la medianoche.
try:
  - 'Haz clic en **平成最後の日** y **令和初日** para ver cómo la transición al 1 de mayo de 2019 pasa de `平成31年4月30日` a `令和元年5月1日`.'
  - 'Elige **2026-05-01** para ver cómo el calendario imperial avanza a `令和8年` sin ceros iniciales en mes ni día.'
  - 'Edita las horas del turno cruzando la medianoche y observa que `timeRange()` conserva un rango puramente horario con el guion ondulado `～` usado en Japón.'
---

Llamar a `configure({ locale: 'ja' })` una sola vez aplica el japonés en cada vista previa de texto y cada preset de formato. Los presets estándar combinan números sin ceros iniciales con contadores en kanji, y `day.yearMonth` omite el contador de día para encabezados mensuales.

Los rangos de fechas y los valores nocturnos de `timeRange()` leen automáticamente ese mismo locale configurado. Ambos unen sus extremos con el guion ondulado japonés sin inyectar fechas de calendario artificiales al cruzar la medianoche.

Pasa una etiqueta de locale solo cuando necesites cambiar de calendario. Con `'ja-u-ca-japanese'` se formatea en el calendario imperial japonés y se imprime `元年` en el primer año de cada era.
