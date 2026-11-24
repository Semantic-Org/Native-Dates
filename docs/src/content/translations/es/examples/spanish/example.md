---
source: '53a71b3f58d3'
title: Rangos, conectores y formato día/mes en español
description: Formatea fechas, rangos contraídos y encabezados de mes en español, e interpreta fechas con barras en formato día/mes sin confusiones con el orden estadounidense.
try:
  - 'Cambia **Days** a **35** para que el rango cruce a junio y muestre `de mayo` y `de junio` en cada extremo.'
  - 'Escribe `15/08/2026` en **Typed date** para comprobar la interpretación día/mes y ver la salida **15 de agosto de 2026**.'
  - 'Escribe `32/05/2026` o `pendiente` en **Typed date** para ver cómo el modo loose devuelve `null` y muestra **Unreadable**.'
---

Configurar `'es'` (o una etiqueta regional como `'es-ES'`, `'es-MX'` o `'es-AR'`) una sola vez con `configure()` aplica las convenciones del español tanto al formateo como a la interpretación en modo loose en toda la aplicación, sin necesidad de plantillas manuales para fechas completas.

Los rangos de fechas contraen las partes compartidas mediante `range.format('long')` sin repetir el locale en cada llamada. Un intervalo dentro de mayo muestra “de mayo de 2026” una sola vez al final, mientras que al cruzar a junio despliega cada mes a ambos lados del guion.

Para encabezados de calendario, `start.yearMonth` aísla el año y el mes y devuelve directamente “mayo de 2026”.

Como el locale `'es'` usa el orden día/mes, `date(typed.value, { loose: true })` interpreta “01/05/2026” como el 1 de mayo (evitando el intercambio con el formato estadounidense mes/día) y devuelve `null` ante texto inválido.
