---
source: "e011cab2c85c"
title: configure()
lede: Lee o actualiza los valores predeterminados del proceso para la zona horaria, el locale, el inicio de la semana, los formatos, los nombres de días y ordinales, y los plugins.
---

## Valores predeterminados globales

:::entry
### `configure()` :kind[function]

```js signature
configure(settings?): ActiveSettings
```

Actualiza uno o más valores predeterminados para todo el proceso y devuelve una copia de la configuración activa. Llamarla sin argumentos lee los ajustes actuales sin modificarlos.

Las propiedades omitidas conservan su valor actual. Pasa `null` en cualquier opción para restablecer los valores predeterminados del entorno o de la biblioteca.

```js title="setup.js"
import { configure, date, datetime } from 'native-dates';

configure({
  zone: 'Europe/Berlin',
  locale: 'de-DE',
});

datetime('2026-11-16T17:30:00Z').zone; // 'Europe/Berlin'
date('2026-11-18').startOf('week').toString(); // '2026-11-16'
configure().weekStart; // undefined

configure({ weekStart: 'sunday' });
date('2026-11-18').startOf('week').toString(); // '2026-11-15'
configure().weekStart; // 7

// restablece la zona horaria, el locale y el inicio de semana del entorno
configure({ zone: null, locale: null, weekStart: null });
```

**Parámetros**

```params
- name: settings
  type: Settings
  description: Valores predeterminados del proceso que se actualizan. Las claves omitidas no cambian.
  options:
    - name: zone
      type: Zone | null
      description: Zona horaria predeterminada para las funciones de fábrica y `now()`. Con `null` se restablece la zona local del entorno.
    - name: locale
      type: Locale | null
      description: Etiqueta de locale BCP 47, lista de etiquetas o encabezado `Accept-Language` predeterminado para el formateo, los límites de semana, los fines de semana y los plugins. Con `null` o `''` se restablece el locale del entorno.
    - name: weekStart
      type: DayOfWeek | null
      description: Primer día de la semana para límites semanales y `weekdayNames()`, como nombre de día en inglés o número del 1 (lunes) al 7 (domingo). Si se omite o es `null`, sigue el locale activo.
    - name: weekend
      type: readonly DayOfWeek[] | null
      description: "Días de fin de semana usados por `isWeekend()`, `isWeekday()` y `DateRange.count('weekdays' | 'weekends')`. Prevalece sobre `.locale()` de cada instancia; pasa `[]` para ningún día de fin de semana o `null` para seguir el locale."
    - name: weekdayNames
      type: "Record<Locale, { narrow?, short?, long? }> | null"
      description: "Etiquetas personalizadas de días de la semana indexadas por locale, anchura (`narrow`, `short` o `long`) y nombre de día en inglés. Las etiquetas regionales se superponen al idioma base y un valor vacío restablece los nombres del entorno."
    - name: ordinals
      type: "Record<Locale, (day: number) => string | number> | null"
      description: "Formateador personalizado para el token de día del mes `Do`, indexado por etiqueta de locale. Con `null` se restablecen los sufijos en inglés integrados y los marcadores de día de cada locale."
    - name: formats
      type: "Record<string, string | Intl.DateTimeFormatOptions> | null"
      description: "Formatos personalizados reutilizables para `format(name)`, donde cada valor es un patrón de tokens o un objeto de opciones de `Intl`. Los nombres personalizados tienen prioridad sobre los presets integrados y `null` los borra."
    - name: dayFirst
      type: boolean | null
      description: "Orden numérico de fechas predeterminado para llamadas en modo loose que omiten `dayFirst` y `locale`. Si se omite o es `null`, sigue el locale activo."
    - name: zoneAliases
      type: Record<string, Zone | null> | null
      description: "Nombres personalizados asignados a zonas horarias con `@native-dates/plugins/zones`. Con `null` en una clave o en todo el objeto se borran los alias."
```

**Devuelve**

```returns
type: "{ zone, locale, weekStart, weekend, dayFirst, zoneAliases, weekdayNames, ordinals, formats }"
description: Copia superficial de la configuración activa tras aplicar los cambios. Las claves sin configurar tienen el valor `undefined`.
```

Las opciones `weekdayNames` y `ordinals` cambian lo que muestran los patrones de tokens y [`weekdayNames()`](/api/month-names/#weekdaynames), sin necesidad de plugins:

```js
import { configure, date, weekdayNames } from 'native-dates';

configure({
  weekdayNames: { lv: { narrow: { fri: 'Pk', sun: 'Sv' } } },
  ordinals: { fr: (day) => (day === 1 ? '1er' : day) },
});

date('2026-11-01').format('Do MMMM', 'fr'); // '1er novembre'
weekdayNames('narrow', 'monday', 'lv'); // ['P', 'O', 'T', 'C', 'Pk', 'S', 'Sv']

configure({ weekdayNames: null, ordinals: null });
```

Los formatos con nombre le dan a tu aplicación sus propios presets en todos los tipos que formatean fechas u horas:

```js
import { configure, date, datetime } from 'native-dates';

configure({
  formats: {
    invoice: 'YYYY-MM-DD',
    receipt: { weekday: 'long', month: 'long', day: 'numeric' },
  },
});

date('2026-11-06').format('invoice'); // '2026-11-06'
datetime('2026-11-06T09:05', 'Europe/Berlin').format('receipt'); // 'Friday, November 6'

configure({ formats: null });
```

Los plugins amplían `configure()` con sus propias opciones en cuanto se importan. Establecer una opción de plugin antes de importarlo lanza un `RangeError`:

```js
import { configure, date, now } from 'native-dates';
import '@native-dates/plugins/loose';
import '@native-dates/plugins/zones';

configure({
  dayFirst: true,
  zoneAliases: { hq: 'Europe/Berlin' },
});

date('07.09.2026', { loose: true })?.toString(); // '2026-09-07'
now('hq').zone; // 'Europe/Berlin'

configure({ dayFirst: null });
```
:::

:::warning[Configura una sola vez al arrancar en servidores]
La configuración global modifica estado compartido en todo el proceso de JavaScript. Define los valores predeterminados una sola vez al iniciar el servidor y asocia la zona horaria y el [`locale()`](/api/date-time/#locale) de cada usuario directamente al valor dentro de cada controlador de solicitud. Consulta [Localización](/guides/localization/).
:::

## Función auxiliar de día de la semana

Convierte el nombre en inglés de un día en su número correspondiente, con la misma numeración ISO que usa el resto de la biblioteca.

:::entry
### `dayOfWeek()` :kind[function]

```js signature
dayOfWeek(day): number
```

Convierte un nombre de día de la semana en inglés, su prefijo de tres letras o un número ISO en un entero del 1 (lunes) al 7 (domingo). Los nombres no reconocidos o los números fuera de ese rango lanzan un `RangeError`.

**Parámetros**

```params
- name: day
  type: DayOfWeek
  required: true
  description: Nombre de día de la semana en inglés como `'monday'`, prefijo sin distinción de mayúsculas como `'Fri'` o entero del 1 al 7.
```

**Devuelve**

```returns
type: number
description: Día de la semana del 1 para el lunes al 7 para el domingo.
```

```js
import { dayOfWeek } from 'native-dates';

dayOfWeek('monday'); // 1
dayOfWeek('Fri'); // 5
dayOfWeek('sunday'); // 7
dayOfWeek(3); // 3
```
:::
