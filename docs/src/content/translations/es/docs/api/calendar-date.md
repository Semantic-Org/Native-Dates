---
source: "df57e2243cc3"
title: CalendarDate
lede: Una fecha de calendario sin hora del día ni zona horaria.
---

## Crear un CalendarDate

Crea una instancia a partir de una cadena ISO, números de año, mes y día o un valor existente con [`date()`](/api/date-fn/), o lee el día actual con [`today()`](/api/date-fn/#today). Las funciones [`tomorrow()`](/api/date-fn/#tomorrow) y [`yesterday()`](/api/date-fn/#yesterday) funcionan de la misma manera, y cada método devuelve una instancia nueva e inmutable.

```js title="create.js"
import { date, today, tomorrow } from 'native-dates';

const birthday = date('2026-05-10');
const launch = date(2026, 11, 16);
const current = today();
const nextDay = tomorrow('America/New_York');
```

Como una fecha de calendario no tiene reloj ni zona horaria, el 10 de mayo sigue siendo el 10 de mayo para cualquier persona, viva donde viva. También puedes obtener la fecha de calendario local a partir de cualquier [`DateTime`](/api/date-time/):

```js
import { datetime } from 'native-dates';

const flight = datetime('2026-11-16T23:30:00Z', 'Asia/Tokyo');
flight.date.toString(); // '2026-11-17'
```

## Propiedades

Las propiedades leen directamente los campos del calendario ISO.

| Propiedad | Tipo | Descripción |
|---|---|---|
| `text` | `string` | Fecha de calendario formateada según el locale, como `'Nov 16, 2026'`. |
| `year`, `month`, `day` | `number` | Año del calendario, mes (1–12) y día del mes (1–31). |
| `yearMonth` | [`YearMonth`](/api/year-month/) | Año y mes del calendario sin el día. |
| `monthDay` | [`MonthDay`](/api/month-day/) | Mes y día del calendario sin el año. |
| `dayOfWeek` | `number` | Día ISO de la semana, del 1 (lunes) al 7 (domingo). |
| `weekStart` | `number` | Primer día de la semana para esta fecha (del 1 al 7), según [`configure()`](/api/configure/) o su locale. |
| `quarter` | `number` | Trimestre del calendario (1–4). |
| `weekOfYear`, `dayOfYear` | `number` | Número de semana ISO (1–53) y día del año (1–366). |
| `daysInMonth`, `daysInYear` | `number` | Número de días del mes actual (28–31) y del año actual (365 o 366). |

## Combinación y campos

Asocia una hora del día en una zona horaria para crear un instante concreto, o reemplaza campos individuales del calendario.

:::entry
### `at()` :kind[method]

```js signature
d.at(time?, zone?): DateTime
```

Combina esta fecha de calendario con una hora del día en una zona horaria y devuelve un [`DateTime`](/api/date-time/). Si omites la hora, usa la medianoche al comienzo del día.

**Parámetros**

```params
- name: time
  type: TimeInput
  default: "'00:00'"
  description: Cadena de hora como `'9:30am'`, instancia de `Time`, objeto de campos o `Date`.
- name: zone
  type: Zone
  description: Nombre de zona horaria IANA, desplazamiento UTC fijo o `'UTC'`; por defecto usa la zona configurada.
```

**Devuelve**

```returns
type: DateTime
description: Nuevo `DateTime` en esta fecha a la hora `time` en `zone`.
```

```js
const day = date('2026-11-16');

day.at('9:30am', 'America/Los_Angeles').toString(); // '2026-11-16T17:30:00.000Z'
day.at(undefined, 'UTC').toString(); // '2026-11-16T00:00:00.000Z'
```
:::

:::entry
### `set()` :kind[method]

```js signature
d.set(fields): CalendarDate
d.set(unit, value): CalendarDate
```

Devuelve un nuevo `CalendarDate` con uno o más campos de calendario reemplazados. Las fechas fuera de rango, como el 30 de febrero, lanzan un `RangeError` en lugar de avanzar al mes siguiente. Si actualizas `month` o `year` sin indicar `day` y el día excede los días del mes de destino, se ajusta al límite del mes.

**Parámetros**

```params
- name: fields
  type: DateTimeFields | DateUnit
  required: true
  description: Objeto con los campos `year`, `month` o `day`, o nombre de una sola unidad en inglés.
- name: value
  type: number
  description: Número entero para la unidad `unit`.
```

**Devuelve**

```returns
type: CalendarDate
description: Nuevo `CalendarDate` con los campos de calendario actualizados.
```

```js
const due = date('2026-11-16');

due.set('day', 1).toString(); // '2026-11-01'
due.set({ month: 12, day: 31 }).toString(); // '2026-12-31'
```
:::

## Aritmética y límites

Avanza o retrocede en unidades de calendario, ajusta la fecha a los límites de un período o salta a un día de la semana cercano. Las unidades de reloj como horas y minutos lanzan un `RangeError` porque una fecha de calendario no tiene reloj.

:::note[Ajuste al límite del mes]
Al sumar meses o años, si el día excede el mes de destino se ajusta al último día válido en lugar de desbordarse al mes siguiente. Sumar un mes al 31 de enero cae en el 28 de febrero, o en el 29 de febrero si el año es bisiesto.
:::

:::entry
### `plus()` :kind[method]

```js signature
d.plus(amount, unit?): CalendarDate
d.add(amount, unit?): CalendarDate
```

Avanza años, trimestres, meses, semanas o días y devuelve un nuevo `CalendarDate`. También tiene el alias `add()`.

**Parámetros**

```params
- name: amount
  type: DurationInput
  required: true
  description: Cantidad junto con `unit`, instancia de `Duration`, cadena de duración en inglés, duración ISO u objeto de campos.
- name: unit
  type: DateUnit
  description: Nombre de unidad de calendario en inglés cuando `amount` es un número, como `'days'` o `'months'`.
```

**Devuelve**

```returns
type: CalendarDate
description: Nuevo `CalendarDate` desplazado hacia adelante en el calendario.
```

```js
const billing = date('2026-01-31');

billing.plus(1, 'month').toString(); // '2026-02-28'
billing.plus('2 weeks').toString(); // '2026-02-14'
```
:::

:::entry
### `minus()` :kind[method]

```js signature
d.minus(amount, unit?): CalendarDate
d.subtract(amount, unit?): CalendarDate
```

Retrocede una duración de calendario. Acepta las mismas entradas que [`plus()`](#plus) y también tiene el alias `subtract()`.

**Parámetros**

```params
- name: amount
  type: DurationInput
  required: true
  description: Cantidad junto con `unit`, instancia de `Duration`, cadena de duración en inglés, duración ISO u objeto de campos.
- name: unit
  type: DateUnit
  description: Nombre de unidad de calendario en inglés cuando `amount` es un número.
```

**Devuelve**

```returns
type: CalendarDate
description: Nuevo `CalendarDate` desplazado hacia atrás en el calendario.
```

```js
const launch = date('2026-03-01');

launch.minus(1, 'day').toString(); // '2026-02-28'
launch.minus({ weeks: 2, days: 1 }).toString(); // '2026-02-14'
```
:::

:::entry
### `startOf()` :kind[method]

```js signature
d.startOf(unit, firstDay?): CalendarDate
```

Devuelve el primer día de la unidad de calendario que contiene esta fecha. Los límites de semana comienzan en `firstDay`, en el `weekStart` de [`configure()`](/api/configure/) o según el locale activo de esta fecha.

**Parámetros**

```params
- name: unit
  type: DateUnit
  required: true
  description: Unidad de calendario en inglés, desde `'year'` hasta `'day'`.
- name: firstDay
  type: DayOfWeek
  description: Primer día de la semana cuando `unit` es `'week'`, como el nombre en inglés `'sunday'` o `7`.
```

**Devuelve**

```returns
type: CalendarDate
description: Primer día de calendario de `unit`.
```

```js
const wed = date('2026-11-18', { locale: 'en-US' });

wed.startOf('month').toString(); // '2026-11-01'
wed.startOf('quarter').toString(); // '2026-10-01'
wed.startOf('week').toString(); // '2026-11-15'
wed.startOf('week', 'monday').toString(); // '2026-11-16'
```
:::

:::entry
### `endOf()` :kind[method]

```js signature
d.endOf(unit, firstDay?): CalendarDate
```

Devuelve el último día de la unidad de calendario que contiene esta fecha.

**Parámetros**

```params
- name: unit
  type: DateUnit
  required: true
  description: Unidad de calendario en inglés, desde `'year'` hasta `'day'`.
- name: firstDay
  type: DayOfWeek
  description: Primer día de la semana cuando `unit` es `'week'`.
```

**Devuelve**

```returns
type: CalendarDate
description: Último día de calendario de `unit`.
```

```js
date('2026-02-10').endOf('month').toString(); // '2026-02-28'
date('2028-02-10').endOf('month').toString(); // '2028-02-29'
```
:::

:::entry
### `startOfNext()` :kind[method]

```js signature
d.startOfNext(unit, firstDay?): CalendarDate
```

Devuelve el primer día de la unidad de calendario posterior a la que contiene esta fecha. El resultado siempre es una fecha posterior, así que desde el 1 de diciembre el mes siguiente comienza el 1 de enero.

Pasa el nombre de un día de la semana en inglés en lugar de una unidad para obtener el próximo día con ese nombre, la misma fecha que devuelve [`next()`](#next).

**Parámetros**

```params
- name: unit
  type: DateUnit | Exclude<DayOfWeek, number>
  required: true
  description: Unidad de calendario en inglés desde `'year'` hasta `'day'`, o nombre de día de la semana en inglés como `'wednesday'`.
- name: firstDay
  type: DayOfWeek
  description: Primer día de la semana cuando `unit` es `'week'`.
```

**Devuelve**

```returns
type: CalendarDate
description: Primer día de calendario de la siguiente `unit`, o próximo día de la semana indicado.
```

```js
const mon = date('2026-11-16', { locale: 'en-US' });

mon.startOfNext('month').toString(); // '2026-12-01'
mon.startOfNext('quarter').toString(); // '2027-01-01'
mon.startOfNext('week').toString(); // '2026-11-22'
mon.startOfNext('wednesday').toString(); // '2026-11-18'
```
:::

:::entry
### `startOfPrevious()` :kind[method]

```js signature
d.startOfPrevious(unit, firstDay?): CalendarDate
```

Devuelve el primer día de la unidad de calendario anterior a la que contiene esta fecha. Pasar el nombre de un día de la semana en inglés en lugar de una unidad devuelve el día anterior más reciente con ese nombre, igual que [`previous()`](#previous).

**Parámetros**

```params
- name: unit
  type: DateUnit | Exclude<DayOfWeek, number>
  required: true
  description: Unidad de calendario en inglés desde `'year'` hasta `'day'`, o nombre de día de la semana en inglés como `'wednesday'`.
- name: firstDay
  type: DayOfWeek
  description: Primer día de la semana cuando `unit` es `'week'`.
```

**Devuelve**

```returns
type: CalendarDate
description: Primer día de calendario de la `unit` anterior, o día de la semana anterior indicado.
```

```js
const mon = date('2026-11-16');

mon.startOfPrevious('month').toString(); // '2026-10-01'
mon.startOfPrevious('year').toString(); // '2025-01-01'
mon.startOfPrevious('wednesday').toString(); // '2026-11-11'
```
:::

:::entry
### `next()` :kind[method]

```js signature
d.next(target): CalendarDate
```

Avanza al siguiente día de la semana o [`MonthDay`](/api/month-day/) indicado después de esta fecha. Si ya cae en ese día de la semana o en esa fecha anual, avanza hasta la próxima coincidencia.

**Parámetros**

```params
- name: target
  type: DayOfWeek | MonthDay
  required: true
  description: Nombre de día de la semana en inglés como `'friday'`, número ISO del 1 al 7 o `MonthDay` recurrente.
```

**Devuelve**

```returns
type: CalendarDate
description: Nuevo `CalendarDate` en el siguiente día coincidente.
```

```js
import { date, monthDay } from 'native-dates';

const mon = date('2026-11-16');

mon.next('friday').toString(); // '2026-11-20'
mon.next('monday').toString(); // '2026-11-23'
mon.next(monthDay('12-25')).toString(); // '2026-12-25'
```
:::

:::entry
### `previous()` :kind[method]

```js signature
d.previous(target): CalendarDate
```

Retrocede a la última ocurrencia del día de la semana o [`MonthDay`](/api/month-day/) indicado antes de esta fecha. Si ya cae en ese día de la semana o en esa fecha anual, retrocede hasta la coincidencia previa.

**Parámetros**

```params
- name: target
  type: DayOfWeek | MonthDay
  required: true
  description: Nombre de día de la semana en inglés, prefijo inglés de tres letras, número ISO del 1 al 7 o `MonthDay` recurrente.
```

**Devuelve**

```returns
type: CalendarDate
description: Nuevo `CalendarDate` en el día coincidente anterior.
```

```js
date('2026-11-16').previous('friday').toString(); // '2026-11-13'
date('2026-11-16').previous(monthDay('10-31')).toString(); // '2026-10-31'
```
:::

## Comparar fechas

Compara fechas de calendario directamente o pasa cualquier entrada aceptada por [`date()`](/api/date-fn/).

:::warning[Evita los operadores de comparación numérica]
Una fecha de calendario no es una marca de tiempo, así que los operadores numéricos lanzan un `RangeError` en lugar de convertirla a milisegundos. Compara fechas con métodos como [`isBefore()`](#isbefore), u ordena arreglos con [`compare()`](/api/compare/).
:::

:::entry
### `equals()` :kind[method]

```js signature
d.equals(other): boolean
```

Devuelve `true` cuando ambos valores representan el mismo año, mes y día del calendario.

**Parámetros**

```params
- name: other
  type: CalendarDateInput
  required: true
  description: Otro `CalendarDate` o cualquier entrada aceptada por `date()`.
```

**Devuelve**

```returns
type: boolean
description: '`true` si ambos valores representan el mismo día de calendario.'
```

```js
const due = date('2026-11-16');

due.equals('2026-11-16'); // true
due.equals(date(2026, 11, 16)); // true
```
:::

:::entry
### `isBefore()` :kind[method]

```js signature
d.isBefore(other): boolean
```

Devuelve `true` si esta fecha es anterior a la otra en el calendario.

```js
date('2026-11-15').isBefore('2026-11-16'); // true
```
:::

:::entry
### `isAfter()` :kind[method]

```js signature
d.isAfter(other): boolean
```

Devuelve `true` si esta fecha es posterior a la otra en el calendario.

```js
date('2026-11-17').isAfter('2026-11-16'); // true
```
:::

:::entry
### `isSame()` :kind[method]

```js signature
d.isSame(other, unit?, firstDay?): boolean
```

Comprueba si otra fecha cae en la misma unidad de calendario, como el mismo mes o la misma semana. Llamar a `isSame()` sin unidad comprueba si ambos valores son exactamente el mismo día.

**Parámetros**

```params
- name: other
  type: CalendarDateInput
  required: true
  description: Fecha con la que comparar.
- name: unit
  type: DateUnit
  description: Unidad de calendario en inglés para comparar, desde `'year'` hasta `'day'`.
- name: firstDay
  type: DayOfWeek
  description: Primer día de la semana cuando `unit` es `'week'`.
```

**Devuelve**

```returns
type: boolean
description: '`true` cuando ambas fechas caen en la misma `unit`.'
```

```js
const wed = date('2026-09-09', { locale: 'en-US' });

wed.isSame('2026-09-30', 'month'); // true
wed.isSame('2026-09-06', 'week'); // true
wed.isSame('2026-09-06', 'week', 'monday'); // false
```
:::

### Predicados de calendario

Las comprobaciones relativas al día aceptan una zona horaria opcional porque el día de calendario que corresponde a hoy depende de la zona desde la que se consulte. Si se omite, usan la zona predeterminada de [`configure()`](/api/configure/).

| Método | Tipo | Descripción |
|---|---|---|
| `isToday(zone?)`, `isTomorrow(zone?)`, `isYesterday(zone?)` | `boolean` | Si esta fecha coincide con hoy, mañana o ayer en la zona indicada o configurada. |
| `isPast(zone?)`, `isFuture(zone?)` | `boolean` | Si esta fecha es anterior o posterior a hoy en la zona indicada o configurada. |
| `isWeekday()`, `isWeekend()` | `boolean` | Día laborable frente a fin de semana en el locale activo, como sábado y domingo en `en-US` o viernes y sábado en `ar-SA`. |
| `isLeapYear()` | `boolean` | Si el año de esta fecha tiene 366 días. |

## Medir intervalos

:::entry
### `until()` :kind[method]

```js signature
d.until(other): Duration
d.until(other, unit): number
```

Mide el intervalo de calendario desde esta fecha hasta otra, y devuelve una duración negativa cuando el destino es anterior. El [`Duration`](/api/duration/) devuelto recuerda esta fecha de inicio para totalizar meses y años con precisión.

**Parámetros**

```params
- name: other
  type: CalendarDateInput
  required: true
  description: Fecha de destino hasta la cual medir.
- name: unit
  type: Unit
  description: Unidad en inglés en la que devolver la duración total como número de punto flotante.
```

**Devuelve**

```returns
type: Duration | number
description: Instancia de `Duration` en días, o número cuando se indica `unit`.
```

```js
const start = date('2026-01-01');

start.until('2027-04-05').toString(); // 'P459D'
start.until('2027-04-05').balance('year').toString(); // 'P1Y3M4D'
start.until('2027-04-05', 'days'); // 459
start.until('2026-07-01').total('months'); // 6
```
:::

:::entry
### `since()` :kind[method]

```js signature
d.since(other): Duration
d.since(other, unit): number
```

Mide el intervalo de calendario transcurrido desde una fecha anterior. Pasa un nombre de unidad en inglés para obtener el total como un número.

```js
date('2026-11-16').since('2026-11-02', 'weeks'); // 2
```
:::

:::entry
### `to()` :kind[method]

```js signature
d.to(end): DateRange
d.to(count, unit): DateRange
d.through(end): DateRange
d.through(count, unit): DateRange
d.for(length): DateRange
d.for(count, unit): DateRange
```

Crea un [`DateRange`](/api/ranges/#daterange) inclusivo que comienza en esta fecha y llega hasta la fecha final o la duración indicada. Incluye tanto el día inicial como el final. También tiene el alias `through()`; usa `for()` para pasar una duración explícita (rechaza fechas finales y números sin unidad).

**Parámetros**

```params
- name: end
  type: CalendarDateInput | DurationInput | number
  required: true
  description: Última fecha incluida, duración de calendario o cantidad numérica `count` junto con `unit`.
- name: unit
  type: DateUnit
  description: Nombre de unidad de calendario en inglés cuando el primer argumento es una cantidad numérica, como `'days'` o `'weeks'`.
```

**Devuelve**

```returns
type: DateRange
description: '`DateRange` inclusivo que comienza en esta fecha.'
```

```js
date('2026-11-01').to('2026-11-07').duration.days; // 7
date('2026-11-01').for(7, 'days').toString(); // '2026-11-01/2026-11-07'
```
:::

:::entry
### `range()` :kind[method]

```js signature
d.range(unit, firstDay?): DateRange
```

Devuelve un [`DateRange`](/api/ranges/#daterange) inclusivo que cubre todos los días de la unidad de calendario que contiene esta fecha, desde su primer día hasta el último.

**Parámetros**

```params
- name: unit
  type: DateUnit
  required: true
  description: Unidad de calendario en inglés, desde `'year'` hasta `'day'`.
- name: firstDay
  type: DayOfWeek
  description: Primer día de la semana cuando `unit` es `'week'`.
```

**Devuelve**

```returns
type: DateRange
description: '`DateRange` inclusivo desde el inicio hasta el final de `unit`.'
```

```js
date('2026-02-10').range('month').toString(); // '2026-02-01/2026-02-28'
date('2026-11-18', { locale: 'en-US' }).range('week').toString(); // '2026-11-15/2026-11-21'
date('2026-11-18').range('week', 'monday').toString(); // '2026-11-16/2026-11-22'
```
:::

:::entry
### `every()` :kind[method]

```js signature
d.every(step, zone?): DateTime[]
d.every(count, unit, zone?): DateTime[]
```

Recorre este día de calendario con un paso positivo en la zona horaria indicada o configurada, y devuelve un arreglo de instantes [`DateTime`](/api/date-time/) a partir de la medianoche. Las transiciones de horario de verano generan automáticamente 23 o 25 puntos horarios.

**Parámetros**

```params
- name: step
  type: Unit | DurationInput | number
  required: true
  description: Nombre de unidad en inglés como `'hour'`, duración como `'30m'` o cantidad numérica junto con `unit`.
- name: unit
  type: Unit
  description: Nombre de unidad en inglés cuando el primer argumento es una cantidad numérica.
- name: zone
  type: Zone
  description: Zona horaria para los límites del día; por defecto usa la zona configurada.
```

**Devuelve**

```returns
type: DateTime[]
description: Instantes a lo largo de este día de calendario en `zone`.
```

```js
const slots = date('2026-11-16').every(6, 'hours', 'UTC');

slots.length; // 4
slots[1].toString(); // '2026-11-16T06:00:00.000Z'
```
:::

:::entry
### `split()` :kind[method]

```js signature
d.split(step, zone?): DateTimeRange[]
d.split(count, unit, zone?): DateTimeRange[]
d.splitBy(step, zone?): DateTimeRange[]
d.splitBy(count, unit, zone?): DateTimeRange[]
```

Divide este día de calendario en intervalos [`DateTimeRange`](/api/ranges/#datetimerange) contiguos y semiabiertos en la zona horaria indicada o configurada. También tiene el alias `splitBy()`.

**Parámetros**

```params
- name: step
  type: Unit | DurationInput | number
  required: true
  description: Nombre de unidad en inglés, duración o cantidad numérica junto con `unit`.
- name: unit
  type: Unit
  description: Nombre de unidad en inglés cuando el primer argumento es una cantidad numérica.
- name: zone
  type: Zone
  description: Zona horaria para los límites del día; por defecto usa la zona configurada.
```

**Devuelve**

```returns
type: DateTimeRange[]
description: Intervalos `DateTimeRange` contiguos que cubren este día en `zone`.
```

```js
const halves = date('2026-11-16').split(12, 'hours', 'UTC');

halves.map(String);
// ['2026-11-16T00:00:00.000Z/2026-11-16T12:00:00.000Z', '2026-11-16T12:00:00.000Z/2026-11-17T00:00:00.000Z']
```
:::

## Formateo y conversión

:::entry
### `format()` :kind[method]

```js signature
d.format(spec?, locale?): string
```

Formatea la fecha mediante presets integrados, nombres personalizados de [`configure()`](/api/configure/), objetos de opciones o patrones de tokens.

Incluye presets localizados desde `'L'` hasta `'LLLL'`, y los objetos de opciones ignoran automáticamente las claves de reloj y de zona horaria. Consulta [Formateo](/guides/formatting/) para ver la referencia completa de presets y tokens.

**Parámetros**

```params
- name: spec
  type: FormatSpec
  default: "'medium'"
  description: Nombre de formato integrado o configurado, objeto de opciones de `Intl` o patrón de tokens.
- name: locale
  type: string
  description: Etiqueta de locale BCP 47 que sobrescribe el locale de esta fecha o el configurado solo para esta llamada.
```

**Devuelve**

```returns
type: string
description: Cadena de fecha formateada.
```

```js
const day = date('2026-11-16');

day.format('short', 'en-US'); // '11/16/26'
day.format('medium', 'en-US'); // 'Nov 16, 2026'
day.format('long', 'en-US'); // 'November 16, 2026'
day.format('full', 'en-US'); // 'Monday, November 16, 2026'
day.format('L', 'en-US'); // '11/16/2026'
day.format('YYYY-MM-DD'); // '2026-11-16'
day.format('ddd, MMM D', 'en-US'); // 'Mon, Nov 16'
day.format({ weekday: 'long' }, 'en-US'); // 'Monday'
```
:::

:::entry
### `from()` :kind[method]

```js signature
d.from(other?, locale?): string
d.formatRelative(other?, locale?): string
```

Formatea la distancia en el calendario desde otra fecha hasta esta como una frase localizada mediante `Intl.RelativeTimeFormat`, como `'ayer'` o `'dentro de 3 semanas'`.

Si omites el primer argumento, se compara con [`today()`](/api/date-fn/#today); [`formatRelative()`](#formatrelative) funciona como alias. Las distancias menores de siete días usan palabras naturales como ayer, hoy y mañana (y en español también anteayer y pasado mañana), mientras que las semanas, meses y años usan valores numéricos.

**Parámetros**

```params
- name: other
  type: CalendarDateInput
  description: Fecha de calendario de referencia desde la cual medir; por defecto usa `today()` en la zona activa.
- name: locale
  type: Locale
  description: Etiqueta de locale BCP 47 que sobrescribe el locale de esta fecha o el configurado solo para esta llamada.
```

**Devuelve**

```returns
type: string
description: Frase de tiempo relativo localizada.
```

```js
const anchor = date('2026-11-16');

date('2026-11-15').from(anchor, 'en-US'); // 'yesterday'
date('2026-11-16').from(anchor, 'en-US'); // 'today'
date('2026-11-17').from(anchor, 'en-US'); // 'tomorrow'
date('2026-11-30').from(anchor, 'en-US'); // 'in 2 weeks'
date('2026-11-15').from(anchor, 'de'); // 'gestern'
```
:::

:::entry
### `fromNow()` :kind[method]

```js signature
d.fromNow(locale?): string
```

Formatea la distancia entre esta fecha y hoy como una frase localizada; equivale a llamar a [`from()`](#from) sin fecha de referencia.

**Parámetros**

```params
- name: locale
  type: Locale
  description: Etiqueta de locale BCP 47 que sobrescribe el locale de esta fecha o el configurado solo para esta llamada.
```

**Devuelve**

```returns
type: string
description: Frase de tiempo relativo localizada medida desde hoy.
```

```js
today().minus(1, 'day').fromNow('en-US'); // 'yesterday'
today().plus(3, 'days').fromNow('en-US'); // 'in 3 days'
```
:::

:::entry
### `formatRelative()` :kind[method]

```js signature
d.formatRelative(other?, locale?): string
```

Alias de [`from()`](#from) que formatea como frase localizada la distancia en el calendario desde `other`, o desde hoy si se omite.
:::

:::entry
### `locale()` :kind[method]

```js signature
d.locale(): Locale | undefined
d.locale(tag): CalendarDate
```

Lee el locale asociado a esta fecha o devuelve una copia con otro locale para presets, límites de semana y valores derivados. Las etiquetas con guion bajo y las cabeceras `Accept-Language` se normalizan automáticamente, una etiqueta vacía lo borra y [`lang()`](#lang) funciona como alias.

**Parámetros**

```params
- name: tag
  type: Locale | null | undefined
  description: Etiqueta de locale, arreglo de etiquetas o cabecera `Accept-Language` para propagar, o `null` para borrarla.
```

**Devuelve**

```returns
type: CalendarDate | Locale | undefined
description: Etiqueta activa cuando se llama sin argumentos, o nuevo `CalendarDate` con `tag`.
```

```js
const trip = date('2026-05-15').locale('fr-FR');

trip.locale(); // 'fr-FR'
trip.format('long'); // '15 mai 2026'
trip.to('2026-05-19').format('long'); // '15–19 mai 2026'
```
:::

:::entry
### `lang()` :kind[method]

```js signature
d.lang(): Locale | undefined
d.lang(tag): CalendarDate
```

Alias abreviado de [`locale()`](#locale) que lee o asocia una etiqueta de locale BCP 47 a esta fecha.
:::

:::entry
### `as()` :kind[method]

```js signature
d.as('date'): CalendarDate
d.as('datetime', zone?): DateTime
d.as('yearMonth'): YearMonth
d.as('monthDay'): MonthDay
```

Convierte esta fecha a otro tipo dentro de una cadena de métodos, incluidos [`YearMonth`](/api/year-month/) y [`MonthDay`](/api/month-day/). Al convertirla a un instante devuelve la medianoche al comienzo de esta fecha en la zona horaria indicada o configurada.

**Parámetros**

```params
- name: kind
  type: "'date' | 'datetime' | 'yearMonth' | 'monthDay'"
  required: true
  description: Tipo de destino al que convertir esta fecha de calendario.
- name: zone
  type: Zone
  description: Zona horaria usada al convertir a `'datetime'`; por defecto usa la zona configurada.
```

**Devuelve**

```returns
type: CalendarDate | DateTime | YearMonth | MonthDay
description: Valor convertido.
```

```js
const due = date('2026-11-16');

due.as('datetime', 'UTC').toString(); // '2026-11-16T00:00:00.000Z'
due.as('yearMonth').toString(); // '2026-11'
due.as('monthDay').toString(); // '11-16'
```
:::

:::entry
### `toString()` :kind[method]

```js signature
d.toString(): string
d.toJSON(): string
```

Devuelve la fecha como cadena ISO 8601 `YYYY-MM-DD`. `toJSON()` devuelve la misma cadena para `JSON.stringify()`.

**Devuelve**

```returns
type: string
description: Cadena de fecha ISO 8601, como `'2026-11-16'`.
```

```js
const due = date('2026-11-16');

due.toString(); // '2026-11-16'
JSON.stringify({ due }); // '{"due":"2026-11-16"}'
```
:::

:::entry
### `toJSDate()` :kind[method]

```js signature
d.toJSDate(zone?): Date
```

Devuelve un `Date` nativo de JavaScript a la medianoche de esta fecha en la zona horaria indicada o configurada.
:::

:::entry
### `toTemporal()` :kind[method]

```js signature
d.toTemporal(): Temporal.PlainDate
```

Devuelve la instancia subyacente de `Temporal.PlainDate`.
:::

:::entry
### `valueOf()` :kind[method]

```js signature
d.valueOf(): never
```

Lanza un `RangeError` para que los operadores numéricos nunca conviertan silenciosamente una fecha de calendario en un número.
:::
