---
source: "556537c8ff45"
title: Rangos
lede: Intervalos entre dos fechas, instantes u horas del día, con comprobación de inclusión, solapamiento e iteración por pasos.
---

## Clases de rango

Crea rangos directamente con las [funciones de creación de rangos](/api/range-fn/) (`dateRange()`, `datetimeRange()`, `timeRange()`), o encadena [`to()`](#to), [`for()`](#to) y [`range()`](#range) a partir de un punto existente. Toda instancia de rango es inmutable.

:::note[Fechas inclusivas frente a rangos horarios semiabiertos]
Los rangos de fechas de calendario incluyen su último día, porque del 1 al 7 de septiembre abarca los siete días completos. Los rangos de fechas y horas y los rangos de horas son intervalos semiabiertos (`[start, end)`): incluyen el inicio y excluyen el final, de modo que dos franjas consecutivas encajan sin solaparse.
:::

:::entry
### `DateRange` :kind[class]

```js signature
new DateRange(start, end, options?)
new DateRange(interval, options?)
```

Abarca dos [fechas de calendario](/api/calendar-date/) e incluye ambos extremos. Pasar una fecha final anterior a la fecha inicial lanza un `RangeError`.

```js title="ranges.js"
import { dateRange } from 'native-dates';

const trip = dateRange('2026-09-01', '2026-09-07');
const week = dateRange('2026-09-01', '7 days');

trip.duration.days; // 7
week.toString(); // '2026-09-01/2026-09-07'
```
:::

:::entry
### `DateTimeRange` :kind[class]

```js signature
new DateTimeRange(start, end, options?)
new DateTimeRange(interval, options?)
```

Abarca dos [instantes](/api/date-time/) en un intervalo semiabierto que incluye el inicio y excluye el final (`[start, end)`). Si la entrada final no incluye una zona horaria explícita, se interpreta en la zona horaria del instante inicial; si el final es anterior al inicio, se lanza un `RangeError`.

```js
import { datetimeRange } from 'native-dates';

const block = datetimeRange('2026-09-01T09:00', '2026-09-01T10:30', 'America/New_York');
const standup = datetimeRange('2026-09-01T09:00', '30m', 'America/New_York');

standup.duration.minutes; // 30
block.end.hour; // 10
```
:::

:::entry
### `TimeRange` :kind[class]

```js signature
new TimeRange(start, end, options?)
new TimeRange(interval, options?)
```

Abarca dos [horas del día](/api/time/) en un intervalo semiabierto que incluye el inicio y excluye el final (`[start, end)`). Cuando la hora final es anterior en el reloj a la hora inicial, el rango cruza la medianoche para modelar horarios nocturnos.

```js
import { timeRange } from 'native-dates';

const dayShift = timeRange('9:00am', '5:00pm');
const nightShift = timeRange('22:00', '06:00');

dayShift.duration.hours; // 8
nightShift.duration.hours; // 8
```
:::

## Propiedades

Cada rango expone su texto formateado, sus extremos tipados, su tipo y su duración.

| Propiedad | Tipo | Descripción |
|---|---|---|
| `text` | `string` | Cadena de rango formateada según el locale, como `'Sep 1 – 7, 2026'`. |
| `start`, `end` | `CalendarDate \| DateTime \| Time` | Puntos inicial y final acordes con la clase de rango. |
| `kind` | `'date' \| 'datetime' \| 'time'` | Etiqueta que indica qué tipo de puntos contiene el rango. |
| `duration` | [`Duration`](/api/duration/) | Duración completa con referencia en `start`, contando el último día en rangos de fechas y cruzando la medianoche en rangos de horas nocturnos. |

## Construir rangos a partir de puntos

:::entry
### `to()` :kind[method]

```js signature
d.to(end, unit?): DateRange
d.through(end, unit?): DateRange
d.for(length, unit?): DateRange
dt.to(end, unit?): DateTimeRange
dt.for(length, unit?): DateTimeRange
t.to(end, unit?): TimeRange
t.for(length, unit?): TimeRange
```

Construye un rango desde este punto hasta un punto final o a lo largo de una duración. En una [fecha de calendario](/api/calendar-date/), pasar una duración de 7 días sitúa el final seis días después del día inicial porque ambos extremos quedan incluidos.

Usa `for()` para construir un rango a partir de una duración explícita (rechaza puntos finales y números sin unidad). Una fecha de calendario también ofrece `through()` como alias de `to()`, ya que su rango incluye el último día.

**Parámetros**

```params
- name: end
  type: Point | DurationInput | number
  required: true
  description: Punto final del mismo tipo, entrada de duración (instancia, frase en inglés o ISO 8601) o cantidad numérica `count` acompañada de `unit`.
- name: unit
  type: Unit
  description: Nombre de la unidad en inglés cuando el primer argumento es una cantidad numérica.
```

**Devuelve**

```returns
type: DateRange | DateTimeRange | TimeRange
description: Rango del mismo tipo que el valor sobre el que se llama.
```

```js
import { date, datetime, time } from 'native-dates';

date('2026-09-01').for(7, 'days').toString(); // '2026-09-01/2026-09-07'
datetime('2026-09-01T09:00Z', 'UTC').for(90, 'minutes').toString(); // '2026-09-01T09:00:00.000Z/2026-09-01T10:30:00.000Z'
time('9:00am').to('5:00pm').toString(); // '09:00:00/17:00:00'
```
:::

:::entry
### `range()` :kind[method]

```js signature
d.range(unit, firstDay?): DateRange
dt.range(unit, firstDay?): DateTimeRange
```

Devuelve la unidad completa de calendario o de reloj que contiene una fecha o un instante. Los rangos de fechas abarcan desde el primer hasta el último día de la unidad (ambos incluidos), mientras que los rangos de fechas y horas forman un intervalo semiabierto `[start, nextStart)` desde el inicio de la unidad hasta el inicio de la unidad siguiente (extremo superior exclusivo).

**Parámetros**

```params
- name: unit
  type: Unit
  required: true
  description: Unidad contenedora en inglés, como `'week'`, `'month'` o `'day'`.
- name: firstDay
  type: DayOfWeek
  description: Primer día de la semana (nombre de día en inglés, como `'monday'`) cuando `unit` es `'week'`; sobrescribe `configure()` y el locale activo.
```

**Devuelve**

```returns
type: DateRange | DateTimeRange
description: Rango contenedor correspondiente a `unit`.
```

```js
import { date, datetime } from 'native-dates';

date('2026-11-18', { locale: 'en-US' }).range('week').toString(); // '2026-11-15/2026-11-21'
date('2026-11-18').range('week', 'monday').toString(); // '2026-11-16/2026-11-22'
date('2026-02-10').range('month').toString(); // '2026-02-01/2026-02-28'
datetime('2026-11-16T14:20Z', 'UTC').range('hour').toString(); // '2026-11-16T14:00:00.000Z/2026-11-16T15:00:00.000Z'
```
:::

## Inclusión y solapamiento

:::entry
### `contains()` :kind[method]

```js signature
range.contains(value): boolean
range.includes(value): boolean
```

Comprueba si un punto u otro rango del mismo tipo queda dentro de este rango. Los rangos de fechas incluyen `end`, los rangos de fechas y horas y los rangos de horas lo excluyen (`[start, end)`), y los rangos de horas nocturnos coinciden con horas a ambos lados de la medianoche. También dispone del alias `includes()`.

**Parámetros**

```params
- name: value
  type: Point | Range
  required: true
  description: Entrada de punto o rango del mismo tipo.
```

**Devuelve**

```returns
type: boolean
description: "`true` si `value` queda dentro de este rango."
```

```js
const stay = dateRange('2026-09-01', '2026-09-07');
stay.contains('2026-09-07'); // true

const night = timeRange('22:00', '06:00');
night.contains('23:30'); // true
night.contains('02:15'); // true
night.contains('06:00'); // false
```
:::

:::entry
### `overlaps()` :kind[method]

```js signature
range.overlaps(other): boolean
```

Devuelve `true` cuando dos rangos del mismo tipo comparten al menos un día o un instante. Dos franjas consecutivas de fechas y horas o de horas donde la primera termina justo cuando empieza la segunda no se solapan.

**Parámetros**

```params
- name: other
  type: Range | string
  required: true
  description: Instancia de rango o cadena de intervalo del mismo tipo.
```

**Devuelve**

```returns
type: boolean
description: "`true` si ambos rangos tienen tiempo en común."
```

```js
const firstSlot = timeRange('09:00', '10:00');
const nextSlot = timeRange('10:00', '11:00');

firstSlot.overlaps(nextSlot); // false
dateRange('2026-09-01', '2026-09-05').overlaps('2026-09-05/2026-09-10'); // true
```
:::

:::entry
### `intersection()` :kind[method]

```js signature
range.intersection(other): Range | null
```

Devuelve un nuevo rango que cubre únicamente el tramo compartido por ambos rangos, o `null` cuando son disjuntos. Dos rangos de horas nocturnos que se cruzan en dos tramos separados lanzan un `RangeError`.

**Parámetros**

```params
- name: other
  type: Range | string
  required: true
  description: Instancia de rango o cadena de intervalo del mismo tipo.
```

**Devuelve**

```returns
type: DateRange | DateTimeRange | TimeRange | null
description: Rango solapado del mismo tipo, o `null` cuando son disjuntos.
```

```js
const a = dateRange('2026-09-01', '2026-09-10');
const b = dateRange('2026-09-05', '2026-09-15');

a.intersection(b)?.toString(); // '2026-09-05/2026-09-10'
a.intersection('2026-09-20/2026-09-25'); // null
```
:::

:::entry
### `equals()` :kind[method]

```js signature
range.equals(other): boolean
```

Devuelve `true` cuando ambos rangos tienen puntos inicial y final iguales. Los arrays de rangos también se ordenan cronológicamente con [`compare()`](/api/compare/).

```js
dateRange('2026-09-01', '2026-09-07').equals('2026-09-01/2026-09-07'); // true
```
:::

:::entry
### `isEmpty()` :kind[method]

```js signature
range.isEmpty(): boolean
```

Devuelve `true` cuando un rango de fechas y horas o un rango de horas tiene puntos inicial y final idénticos. En un [`DateRange`](#daterange) siempre devuelve `false`, porque una sola fecha de calendario abarca un día completo.

```js
timeRange('09:00', '09:00').isEmpty(); // true
dateRange('2026-09-01', '2026-09-01').isEmpty(); // false
```
:::

## Iteración por pasos, división y zonas horarias

:::entry
### `every()` :kind[method]

```js signature
range.every(step): Point[]
range.every(count, unit): Point[]
```

Avanza desde `start` en incrementos positivos de una unidad o duración y devuelve todos los puntos que caen dentro del rango. Cada paso se calcula a partir del punto inicial en lugar de encadenar sumas sucesivas, de modo que avanzar por meses desde el 31 de enero cae en el último día de cada mes.

**Parámetros**

```params
- name: step
  type: Unit | DurationInput | number
  required: true
  description: Nombre de unidad en inglés como `'day'`, entrada de duración (instancia, frase en inglés o ISO 8601) o cantidad numérica `count` acompañada de `unit`.
- name: unit
  type: Unit
  description: Nombre de la unidad en inglés cuando `step` es un número.
```

**Devuelve**

```returns
type: Array<CalendarDate | DateTime | Time>
description: Array ordenado de puntos dentro del rango.
```

```js
dateRange('2026-01-31', '2026-04-30').every('month').map(String);
// ['2026-01-31', '2026-02-28', '2026-03-31', '2026-04-30']

timeRange('22:00', '02:00').every(1, 'hour').map(String);
// ['22:00:00', '23:00:00', '00:00:00', '01:00:00']
```
:::

:::entry
### `count()` :kind[method]

```js signature
dateRange.count(kind?): number
```

Cuenta los días de calendario dentro de un [`DateRange`](#daterange) sin crear instancias intermedias de fechas. Pasa `'days'` (valor predeterminado), `'weekdays'`, `'weekends'` o un nombre de día de la semana en inglés como `'mondays'`. Tanto `'weekdays'` como `'weekends'` siguen los días de fin de semana del locale activo.

**Parámetros**

```params
- name: kind
  type: string
  default: "'days'"
  description: "'days', 'weekdays', 'weekends' o un nombre de día de la semana en inglés, como 'mondays'."
```

**Devuelve**

```returns
type: number
description: Cantidad de días de calendario coincidentes en el rango.
```

```js
const sprint = dateRange('2026-05-01', '2 weeks');

sprint.count(); // 14
sprint.count('weekdays'); // 10
sprint.count('weekends'); // 4
sprint.count('mondays'); // 2
```
:::

:::entry
### `split()` :kind[method]

```js signature
range.split(step): Range[]
range.split(count, unit): Range[]
range.splitBy(step): Range[]
range.splitBy(count, unit): Range[]
```

Divide el rango en subrangos contiguos del tamaño de paso indicado y ajusta el último tramo al límite final del rango. Acepta los mismos argumentos de paso que [`every()`](#every) y cuenta además con el alias `splitBy()`.

```js
dateRange('2026-09-01', '2026-09-10').split(4, 'days').map(String);
// ['2026-09-01/2026-09-04', '2026-09-05/2026-09-08', '2026-09-09/2026-09-10']
```
:::

:::entry
### `in()` :kind[method]

```js signature
dateRange.in(zone?): DateTimeRange
dtRange.in(zone): DateTimeRange
```

Convierte un [`DateRange`](#daterange) en un [`DateTimeRange`](#datetimerange) semiabierto desde la medianoche del día inicial hasta la medianoche del día siguiente al último (extremo superior exclusivo), coincidiendo con los límites de consulta sobre marcas de tiempo. En un rango de fechas y horas, traslada ambos extremos a la zona horaria de destino.

Llamar a `in()` en un rango de horas lanza un `RangeError` porque las horas del día no tienen fecha de calendario.

**Parámetros**

```params
- name: zone
  type: Zone
  description: Zona horaria IANA de destino, desplazamiento UTC fijo o `'UTC'`; en `DateRange` usa por defecto la zona configurada.
```

**Devuelve**

```returns
type: DateTimeRange
description: Rango de fechas y horas semiabierto en `zone`.
```

```js
dateRange('2026-09-01', '2026-09-03').in('UTC').toString();
// '2026-09-01T00:00:00.000Z/2026-09-04T00:00:00.000Z'
```
:::

## Formateo y conversión

:::entry
### `format()` :kind[method]

```js signature
range.format(spec?, locale?): string
```

Formatea el rango con el formato localizado de rangos de `Intl` para presets y objetos de opciones, compactando automáticamente las fechas o los meses compartidos para omitir partes repetidas. Los patrones de tokens formatean cada extremo por separado y los unen con `' – '`.

Los formatos personalizados registrados en [`configure()`](/api/configure/) también funcionan aquí. Consulta [Formateo](/guides/formatting/) para ver los detalles de presets y tokens.

**Parámetros**

```params
- name: spec
  type: FormatSpec
  description: Nombre de preset, objeto `Intl.DateTimeFormatOptions` o patrón de tokens.
- name: locale
  type: Locale
  description: Etiqueta de locale BCP 47 que sobrescribe, solo para esta llamada, el locale de este rango o el configurado globalmente.
```

**Devuelve**

```returns
type: string
description: Cadena de rango formateada.
```

```js
const trip = dateRange('2026-09-01', '2026-09-07');

trip.format('medium', 'en-US'); // 'Sep 1 – 7, 2026'
trip.format('YYYY-MM-DD'); // '2026-09-01 – 2026-09-07'
timeRange('22:00', '06:00').format('HH:mm'); // '22:00 – 06:00'
```
:::

:::entry
### `locale()` :kind[method]

```js signature
range.locale(): Locale | undefined
range.locale(tag): Range
```

Lee el locale asociado a este rango o devuelve una copia formateada con otro locale en vistas previas de texto, presets, extremos y subrangos. Pasar una etiqueta vacía borra el locale asociado, y [`lang()`](#lang) funciona como alias.

**Parámetros**

```params
- name: tag
  type: Locale | null | undefined
  description: Etiqueta de locale BCP 47 que se conservará, o `null` para borrar una etiqueta existente.
```

**Devuelve**

```returns
type: Range | Locale | undefined
description: Etiqueta activa cuando se llama sin argumentos, o nuevo rango del mismo tipo con `tag`.
```

```js
const stay = dateRange('2026-09-01', '2026-09-07').locale('de-DE');

stay.locale(); // 'de-DE'
stay.format('medium'); // '01.–07.09.2026'
stay.duration.text; // '7 Tage'
```
:::

:::entry
### `lang()` :kind[method]

```js signature
range.lang(): Locale | undefined
range.lang(tag): Range
```

Alias abreviado de [`locale()`](#locale) que lee o asocia una etiqueta de locale BCP 47 en este rango.
:::

:::entry
### `as()` :kind[method]

```js signature
range.as('duration'): Duration
```

Devuelve la duración del rango cuando se solicita `'duration'` en cadenas de métodos, y lanza un `RangeError` para otros tipos.

```js
dateRange('2026-09-01', '2026-09-07').as('duration').days; // 7
```
:::

:::entry
### `toString()` :kind[method]

```js signature
range.toString(): string
range.toJSON(): string
```

Devuelve la cadena de intervalo ISO 8601 `'start/end'`, que puede interpretarse de nuevo directamente con las [funciones de creación de rangos](/api/range-fn/). `toJSON()` devuelve la misma cadena para serialización JSON.

```js
dateRange('2026-09-01', '2026-09-07').toString(); // '2026-09-01/2026-09-07'
timeRange('9am', '5pm').toJSON(); // '09:00:00/17:00:00'
```
:::

:::entry
### `valueOf()` :kind[method]

```js signature
range.valueOf(): never
```

Lanza un `RangeError` para que los operadores numéricos nunca conviertan un rango en número.

Comprueba el tipo de valores desconocidos en tiempo de ejecución con [`kindOf()`](/api/kind-of/) o las [guardias de tipo de rangos](/api/kind-of/#type-guards) exportadas:

```js
import { dateRange, isDateRange, isDateTimeRange, isTimeRange } from 'native-dates';

const stay = dateRange('2026-09-01', '2026-09-07');
isDateRange(stay); // true
isDateTimeRange(stay); // false
isTimeRange(stay); // false
```
:::
