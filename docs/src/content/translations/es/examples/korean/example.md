---
source: '1545d0094bfd'
title: Espaciado y rangos contraídos en coreano
description: Formatea fechas en coreano con espaciado tras los contadores en hangul, rangos de fechas contraídos y períodos del día antepuestos a la hora.
try:
  - 'Haz clic en **+35 days** o escribe `35` en el campo **Span** para ver cómo aparece `6월` en la fecha final al cruzar a junio.'
  - 'Haz clic en **+4 days** para ver cómo `format()` contrae el año y el mes compartidos en `2026년 5월 1일~5일`.'
  - 'Cambia **Time** a **09:30** para que el período del día en coreano pase de `오후` a `오전` antes de la hora.'
---

A diferencia del chino y el japonés, la ortografía del coreano exige un espacio después de cada contador de año, mes y día. Llamar a `configure({ locale: 'ko' })` una sola vez aplica ese espaciado en cada propiedad `.text` y cada llamada a `format()`.

Al llamar a `range.format('long')` se contraen el año y el mes compartidos alrededor de una virgulilla, conservando `일` en ambos números de día. Al cruzar a otro mes, el contador del mes final reaparece automáticamente.

Los relojes de 12 horas colocan el marcador coreano de mañana o tarde antes de la hora. Leer `day.yearMonth.text` formatea encabezados mensuales limpios sin contador de día al final.
