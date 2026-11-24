---
source: '3c5dbea3c614'
title: Duraciones escritas
description: Interpreta expresiones de duración en inglés y cadenas ISO 8601 desde un campo de texto para mostrarlas con palabras, en horas totales y en formato de intercambio.
try:
  - 'Escribe la expresión de duración en inglés `90 minutes` para verla formateada con palabras, con un total de `1.5` horas y serializada como `PT90M`.'
  - 'Prueba expresiones de duración en inglés como `2 weeks and 3 days` o cadenas ISO 8601 como `PT45M` en el mismo campo.'
  - 'Escribe `soon` para ver cómo el mensaje de error señala qué falló y sugiere ejemplos válidos.'
---

Al pasar texto del usuario a `duration()`, la función interpreta expresiones de duración en inglés y cadenas ISO 8601 en un único valor estructurado.

A partir de ahí, `format()` expresa la duración con palabras y `total('hours')` la convierte en un único número decimal. La interpolación como cadena produce el formato estándar ISO 8601 listo para una base de datos o una API.

Las entradas ilegibles lanzan un error cuyo `error.message` identifica el valor inválido y muestra ejemplos válidos en inglés e ISO 8601 directamente en la página.
