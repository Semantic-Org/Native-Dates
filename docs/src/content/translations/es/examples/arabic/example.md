---
source: '7cf50337d2e5'
title: Plurales árabes, numerales y fechas islámicas
description: Formatea duraciones con las seis formas plurales del árabe, sistemas de numerales orientales y occidentales, nombres regionales de meses y fechas del calendario islámico Umm al-Qura.
try:
  - 'Haz clic en **1**, **2**, **5**, **11** y **100** para recorrer las formas árabes de singular, dual `يومان`, plural, acusativo y centena.'
  - 'Compara `ar-EG` y `ar-MA` en la misma fecha para ver los dígitos arábigos orientales junto a los occidentales y los nombres de meses marroquíes.'
  - 'Elige distintas fechas para ver cómo `ar-SA-u-ca-islamic-umalqura` convierte fechas ISO al calendario islámico Umm al-Qura.'
---

Llamar a `configure({ locale: 'ar-EG' })` una sola vez activa los plurales del árabe y los dígitos arábigos orientales en todos los valores. Al leer `days(2).text` se obtiene la forma dual del sustantivo, sin ningún dígito.

Adjunta `.locale('ar-MA')` cuando un valor y los rangos derivados de él deban usar dígitos occidentales y nombres de meses marroquíes mientras el resto de la aplicación conserva el locale predeterminado.

Pasar `'ar-SA-u-ca-islamic-umalqura'` convierte cualquier fecha civil al calendario islámico Umm al-Qura de Arabia Saudita, mientras `day.monthDay` mantiene una referencia gregoriana a su lado.

Cuando incrustes texto en árabe dentro de una página de izquierda a derecha, envuelve cada valor formateado en `<bdi>` para que los dígitos y los guiones de rango conserven el orden de derecha a izquierda.
