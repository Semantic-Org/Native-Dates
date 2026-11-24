---
source: "68d49ce6b3ea"
title: monthNames()
lede: Devuelve arrays localizados con los nombres de meses y días de la semana para encabezados de calendarios y menús.
---

## Etiquetas de calendario

Ambas funciones leen las tablas de `Intl` almacenadas en caché y devuelven un array nuevo en cada llamada. Puedes transformar, recortar o invertir la lista libremente sin mutar estado compartido.

:::entry
### `monthNames()` :kind[function]

```js signature
monthNames(style?, locale?): string[]
```

Devuelve un array con los 12 nombres localizados de los meses gregorianos de enero a diciembre. De forma predeterminada devuelve nombres completos en el [locale configurado](/api/configure/).

**Parámetros**

```params
- name: style
  type: "'long' | 'short'"
  default: "'long'"
  description: Nombres completos de mes como `'January'` o abreviados como `'Jan'`.
- name: locale
  type: Locale
  description: Etiqueta de locale BCP 47 que reemplaza el valor predeterminado configurado.
```

**Devuelve**

```returns
type: string[]
description: Doce etiquetas de mes ordenadas desde el índice `0` (enero) hasta el `11` (diciembre).
```

```js title="months.js"
import { monthNames } from 'native-dates';

monthNames('short', 'en-US');
// ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

monthNames('long', 'fr-FR').slice(0, 3);
// ['janvier', 'février', 'mars']
```
:::

:::entry
### `weekdayNames()` :kind[function]

```js signature
weekdayNames(style?, firstDay?, locale?): string[]
```

Devuelve un array con las 7 etiquetas localizadas de los días de la semana rotadas para empezar en `firstDay`, en el `weekStart` de la [configuración global](/api/configure/) o en el primer día de la semana del locale activo.

Los límites de semana de [`startOf('week')`](/api/calendar-date/#startof) y los rangos semanales aplican la misma regla de primer día, así que los encabezados del calendario siempre coinciden con las cuadrículas semanales. También se reflejan aquí las etiquetas personalizadas definidas con [`configure()`](/api/configure/).

**Parámetros**

```params
- name: style
  type: "'short' | 'long' | 'narrow'"
  default: "'short'"
  description: "Etiquetas abreviadas como `'Mon'`, nombres completos como `'Monday'` o encabezados compactos de una o dos letras como `'Mo'`."
- name: firstDay
  type: DayOfWeek
  description: Nombre de día de la semana en inglés o número ISO del 1 (lunes) al 7 (domingo) con el que empieza la lista.
- name: locale
  type: Locale
  description: Etiqueta de locale BCP 47 que reemplaza el valor predeterminado configurado.
```

**Devuelve**

```returns
type: string[]
description: Siete etiquetas de días de la semana que comienzan en `firstDay`, en el `weekStart` configurado o en el primer día del locale.
```

```js
import { date, weekdayNames } from 'native-dates';

weekdayNames('short', undefined, 'en-US');
// ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

weekdayNames('narrow', undefined, 'en-US');
// ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

weekdayNames('narrow', undefined, 'pt-BR');
// ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']

weekdayNames('short', 'monday', 'en-US');
// ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

const daysInGrid = date('2026-11-18', { locale: 'en-US' }).range('week').every('day');
daysInGrid[0].format({ weekday: 'short' }); // 'Sun'
```
:::
