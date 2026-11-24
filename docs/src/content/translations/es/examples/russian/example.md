---
source: '08b594522a33'
title: Casos de meses y plurales en ruso
description: Formatea meses rusos independientes en nominativo, fechas completas en genitivo, rangos de fechas contraídos y duraciones con plurales de tres formas.
try:
  - 'Compara las dos primeras filas para ver cómo `YearMonth` imprime `май` en nominativo mientras la fecha completa se declina al genitivo `1 мая`.'
  - 'Haz clic en **1**, **2**, **5**, **11** y **21** para ver cómo `days()` alterna entre `день`, `дня` y `дней`, incluida la excepción del 11 al 14 en `11`.'
  - 'Elige una fecha de marzo o agosto para observar cómo cambian las terminaciones de otros meses rusos entre encabezados y fechas completas.'
---

Llamar a `configure({ locale: 'ru' })` una sola vez aplica los casos de los meses y las declinaciones plurales del ruso en toda la aplicación. Leer `day.yearMonth.text` selecciona el mes independiente en nominativo para encabezados, mientras que las fechas completas cambian automáticamente al caso genitivo.

Los rangos de fechas contraen el mes y el año compartidos alrededor de un guion. Leer `span.text` mantiene el mes compartido en genitivo y produce `1–5 мая 2026 г.` sin plantillas manuales.

Las duraciones aplican las reglas de tres plurales del ruso directamente en `days(total).text`. Las cantidades terminadas en uno como veintiuno devuelven el singular `день`, mientras que los números del once al catorce toman el genitivo plural.
