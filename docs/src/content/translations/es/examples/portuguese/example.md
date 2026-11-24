---
source: 'fdb2094e7273'
title: Crasis, rangos y fechas día/mes en portugués
description: Formatea instantes en portugués de Brasil con días de la semana con guion y la crasis “às” antes de la hora, contrae rangos de fechas e interpreta entradas en formato día/mes.
try:
  - 'Elige **2026-05-17** en **Date** para pasar de **sexta-feira** (con guion) a **domingo** (en una sola palabra) conservando `às` antes de la hora.'
  - 'Cambia **Days** a **20** para que el rango pase de mayo a junio e imprima tanto `de maio` como `de junho`.'
  - 'Edita **Typed date** con `25/12/2026` o `em breve` para comparar la interpretación día/mes frente a una entrada **Unreadable**.'
---

Configurar `'pt-BR'` una sola vez con `configure()` aplica en todas partes el formateo del portugués de Brasil y la interpretación en modo loose con el día primero. Al formatear un instante con zona horaria se conservan los días de la semana con guion como “sexta-feira”, los meses en minúscula y la crasis “às” antes de la hora.

Los rangos de varios días contraen el mes y el año compartidos mediante `range.format('long')`. Un intervalo dentro de mayo imprime “de maio de 2026” una sola vez al final en lugar de repetirlo en ambos días.

Leer `start.yearMonth` aísla el mes de facturación o de calendario y conserva la preposición “de” en “maio de 2026”.

Como `'pt-BR'` escribe las fechas con el día primero, `date(typed.value, { loose: true })` interpreta “08/05/2026” como el 8 de mayo y devuelve `null` cuando el texto no es válido.
