---
source: "af294e4ed659"
title: date()
lede: Crea una CalendarDate a partir de una cadena con el año primero, tres números, un objeto de campos o el día actual.
---

## Leer fechas de calendario

:::entry
### `date()` :kind[function]

```js signature
date(input, options?): CalendarDate
date(input, zone?): CalendarDate
date(year, month, day): CalendarDate
```

Crea una [`CalendarDate`](/api/calendar-date/) a partir de una cadena con el año primero, tres números con los meses del 1 al 12, un objeto de campos, o una fecha o marca de tiempo existente. Las fechas imposibles, como el 30 de febrero, lanzan un `RangeError` en lugar de avanzar a marzo.

```js title="create.js"
import { date, datetime } from 'native-dates';

const fromIso = date('2026-11-16');
const fromSlashes = date('2026/11/6');
const fromNumbers = date(2026, 11, 16);
const fromFields = date({ year: 2026, month: 11, day: 16 });
const fromMoment = date(datetime('2026-11-17T02:00:00Z', 'America/Los_Angeles'));

fromSlashes.toString(); // '2026-11-06'
fromMoment.toString(); // '2026-11-16'
```

**Parámetros**

```params
- name: input
  type: CalendarDateInput | number
  required: true
  description: Cadena de fecha ISO, objeto de campos, fecha o marca de tiempo existente, o el año de 4 dígitos (`year`).
- name: options
  type: Zone | ReadOptions | number
  description: Zona horaria u objeto de opciones al leer una marca de tiempo o una cadena en modo loose, o el mes (`month`) del 1 al 12.
  options:
    - name: zone
      type: Zone
      description: Zona horaria usada para determinar el día del calendario de una cadena de instante, un `DateTime` o un `Date`.
    - name: locale
      type: Locale
      description: Etiqueta de locale BCP 47 asociada a la `CalendarDate` devuelta y a cualquier valor derivado de ella.
    - name: loose
      type: boolean
      default: 'false'
      description: "Lectura de cadenas de fecha informales con `@native-dates/plugins/loose`; devuelve `null` si la entrada no se puede interpretar."
    - name: dayFirst
      type: boolean
      description: "Anulación del orden numérico de fechas del locale activo para cadenas como `'07.09.2026'` en modo loose."
- name: day
  type: number
  description: Día del mes del 1 al 31 cuando se pasan `year`, `month` y `day`.
```

**Devuelve**

```returns
type: CalendarDate
description: "Instancia `CalendarDate` sin reloj ni zona horaria, o `null` si el modo loose no logra interpretar `input`."
```

Al leer una marca de tiempo ISO o un `Date` nativo de JavaScript, pasa una zona horaria para indicar qué día del calendario extraer según la ubicación:

```js
date('2026-11-17T02:00:00Z', 'America/Los_Angeles').toString(); // '2026-11-16'
date('2026-11-17T02:00:00Z', 'Asia/Tokyo').toString(); // '2026-11-17'
```
:::

### Entradas aceptadas

Los meses siempre van del 1 para enero al 12 para diciembre, a diferencia del constructor `Date` de JavaScript, que empieza en cero. Las entradas que tienen año y mes pero no día lanzan un `RangeError` en lugar de inventar el primero de mes; usa [`yearMonth()`](/api/year-month-fn/) para valores mensuales.

| Entrada | Ejemplo | Cómo se interpreta |
|---|---|---|
| Cadena con el año primero | `'2026-11-16'`, `'2026/11/6'`, `'2026年11月16日'` | Lee un año de 4 dígitos, el mes y el día con cualquier separador que no sea una letra latina ni dos puntos. |
| Cadena local de fecha y hora | `'2026-11-16T09:30'` | Conserva la fecha de calendario y descarta la hora del día. |
| Cadena ISO de instante | `'2026-11-17T02:00:00Z'` | Obtiene el día del calendario de ese instante en la zona indicada o en la predeterminada. |
| Año, mes y día | `date(2026, 11, 16)` | Acepta tres números enteros con `1` para enero y `12` para diciembre. |
| Objeto de campos | `{ year: 2026, month: 11, day: 16 }` | Lee campos de calendario con meses del 1 al 12 y rechaza fechas imposibles. |
| [DateTime](/api/date-time/) | `date(dt, 'Asia/Tokyo')` | Extrae la fecha de calendario en la zona indicada, o en `dt.zone` si se omite. |
| `Date` de JavaScript | `date(jsDate, 'America/Los_Angeles')` | Obtiene el día del calendario de esa marca de tiempo en la zona indicada o en la predeterminada. |
| Valor de Temporal | `Temporal.PlainDate`, `Temporal.Instant` | Lee fechas simples en cualquier calendario como el mismo día ISO y desplaza los instantes a la zona de destino. |

:::note[Las marcas de tiempo dependen de la zona horaria]
Una cadena ISO terminada en `Z` o con desplazamiento UTC señala un instante que puede caer en dos días distintos según el lugar del mundo. Pasa siempre una zona explícita al extraer la fecha de calendario de un usuario desde un servidor.
:::

## Días de calendario relativos

La fecha de hoy depende del lugar del mundo desde donde la consultes. Cada función auxiliar acepta una zona horaria opcional y usa tu [valor predeterminado configurado](/api/configure/) si la omites.

:::entry
### `today()` :kind[function]

```js signature
today(zone?): CalendarDate
```

Devuelve la fecha de calendario de hoy en la zona horaria indicada o en la zona predeterminada. Cuando cae la noche en América, en Asia y Oceanía ya pasó la medianoche y empezó el día siguiente.

**Parámetros**

```params
- name: zone
  type: Zone
  description: Zona horaria cuya fecha de calendario actual se quiere leer, como `'Asia/Tokyo'` o `'America/Los_Angeles'`.
```

**Devuelve**

```returns
type: CalendarDate
description: Instancia `CalendarDate` de hoy en `zone`.
```

```js
import { datetime, today } from 'native-dates';

const inLosAngeles = today('America/Los_Angeles');
const inTokyo = today('Asia/Tokyo');

// A las 02:00 UTC del 17 de noviembre, en Los Ángeles todavía es 16 de noviembre mientras en Tokio ya es 17
const moment = '2026-11-17T02:00:00Z';
datetime(moment, 'America/Los_Angeles').date.toString(); // '2026-11-16'
datetime(moment, 'Asia/Tokyo').date.toString(); // '2026-11-17'
```
:::

:::entry
### `tomorrow()` :kind[function]

```js signature
tomorrow(zone?): CalendarDate
```

Devuelve la fecha de calendario de mañana en la zona horaria indicada, un día después de [`today(zone)`](#today).

**Parámetros**

```params
- name: zone
  type: Zone
  description: Zona horaria en la que se avanza un día a partir de hoy.
```

**Devuelve**

```returns
type: CalendarDate
description: Instancia `CalendarDate` de mañana en `zone`.
```

```js
import { tomorrow } from 'native-dates';

const nextDay = tomorrow();
const londonTomorrow = tomorrow('Europe/London');
```
:::

:::entry
### `yesterday()` :kind[function]

```js signature
yesterday(zone?): CalendarDate
```

Devuelve la fecha de calendario de ayer en la zona horaria indicada, un día antes de [`today(zone)`](#today).

**Parámetros**

```params
- name: zone
  type: Zone
  description: Zona horaria en la que se retrocede un día a partir de hoy.
```

**Devuelve**

```returns
type: CalendarDate
description: Instancia `CalendarDate` de ayer en `zone`.
```

```js
import { yesterday } from 'native-dates';

const priorDay = yesterday();
const londonYesterday = yesterday('Europe/London');
```
:::
