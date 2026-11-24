---
source: 'b2f722c41282'
title: Mayúsculas, rangos y relojes regionales en francés
description: Formatea fechas en francés sin coma tras el día de la semana, compara los separadores de reloj de 24 horas entre París y Quebec y contrae intervalos de varios días.
try:
  - 'Cambia **Time** a **14:45** para comparar `14:45` en `fr` frente a `14 h 45` en `fr-CA`.'
  - 'Cambia **Days** a **20** para que el rango contraído cruce a junio y pase de `15–19 mai 2026` a mostrar ambos nombres de mes.'
  - 'Elige otro día en **Date** para ver cómo el día de la semana en minúscula precede directamente al número del día sin coma.'
---

Llamar a `configure({ locale: 'fr' })` una sola vez aplica las mayúsculas y la puntuación del francés en todos los valores. Al llamar a `start.format('full')` se obtiene “vendredi 15 mai 2026” en minúscula y sin coma después del día de la semana.

Combinar la fecha con una hora en `Europe/Paris` inserta la preposición acentuada “à” antes del reloj de 24 horas. Con el francés configurado, `paris.format('long')` separa horas y minutos con dos puntos como “09:30”.

Adjunta `.locale('fr-CA')` a un instante en Montreal cuando necesites comparar convenciones regionales. La tipografía de Quebec escribe “09 h 30” con un marcador “h” separado por espacios en lugar de dos puntos.

Al leer `range.text`, el mes y el año compartidos aparecen una sola vez (“15–19 mai 2026”), y ambos meses se despliegan automáticamente cuando el rango cruza el fin de mes.
