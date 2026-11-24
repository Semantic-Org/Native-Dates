---
source: '1c05d3e2b330'
title: Puntos ordinales, intervalos y semanas del calendario en alemán
description: Formatea fechas en alemán con puntos ordinales y sustantivos en mayúscula, contrae intervalos de días y calcula semanas del calendario ISO al cambiar de año.
try:
  - 'Haz clic en **2027-01-01** para comprobar que el viernes 1 de enero sigue perteneciendo a la semana `KW 53` del año semanal ISO anterior.'
  - 'Elige **2027-01-04** en **Date** para ver cómo el primer lunes de enero inicia la semana `KW 1`.'
  - 'Cambia **Days** a **35** en **2026-05-01** para ver que `range.format(''long'')` conserva los puntos ordinales entre mayo y junio.'
---

Llamar a `configure({ locale: 'de' })` una sola vez aplica las mayúsculas y los puntos ordinales del alemán en todos los valores. Al llamar a `start.format('full')` se obtiene “Freitag, 1. Mai 2026” con la coma y el punto en su sitio.

Los rangos de fechas conservan el punto ordinal en ambos números de día mediante `range.format('long')`. Un intervalo de cuatro días en mayo produce “1.–5. Mai 2026” sin perder el punto tras el día inicial.

Las fechas numéricas cotidianas en Alemania, Austria y Suiza separan día, mes y año con puntos. Leer `start.text` devuelve “01.05.2026” con ceros iniciales directamente desde `Intl`.

Los calendarios laborales en países de habla alemana numeran las semanas según la Kalenderwoche ISO, abreviada “KW”. Para el 1 de enero de 2027, `format('W')` devuelve `'53'` (que el ejemplo muestra con el prefijo “KW ” como “KW 53”), porque la semana ISO 1 comienza el 4 de enero.
