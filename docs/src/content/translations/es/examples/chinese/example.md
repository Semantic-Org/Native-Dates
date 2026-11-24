---
source: 'fabd612a3cd5'
title: Calendarios chinos y períodos del día
description: Formatea fechas gregorianas en chino, períodos del día antepuestos a la hora, meses lunares tradicionales y años de la era Minguo desde una misma entrada.
try:
  - 'Haz clic en **Lunar New Year** para ver el 17 de febrero de 2026 formateado como `2026丙午年正月初一`, con `正月` para el primer mes lunar.'
  - 'Cambia la hora de **09:30** a **14:30** para ver cómo el período del día pasa de `上午9:30` a `下午2:30` antes de los dígitos.'
  - 'Compara la fila `zh-TW-u-ca-roc`, que cuenta esa misma fecha como el año 115 del calendario Minguo.'
---

Llamar a `configure({ locale: 'zh-CN' })` una sola vez aplica los contadores y el espaciado del chino a cada fecha, hora y aniversario. Los relojes de 12 horas colocan el marcador de mañana o tarde justo antes de los dígitos de la hora.

Para días festivos civiles recurrentes y cumpleaños, `day.monthDay` omite el año y formatea etiquetas concisas de mes y día usando ese locale configurado.

Pasa una etiqueta explícita solo cuando necesites cambiar de calendario. Con `'zh-CN-u-ca-chinese'` se formatean años lunares con tronco celeste y rama terrestre (y `正月` para el primer mes), y con `'zh-TW-u-ca-roc'` se cuentan los años según el calendario Minguo mientras la fecha almacenada sigue en ISO 8601.
