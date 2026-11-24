---
source: "62b87452c7ee"
title: DateTime
lede: Un instante concreto en el tiempo, visto en una zona horaria.
---

## Crear un DateTime

Crea una instancia a partir de un valor existente con [`datetime()`](/api/datetime-fn/), lee la fecha y hora actuales con [`now()`](/api/datetime-fn/#now) o combina una fecha de calendario con una hora del día mediante [`at()`](/api/calendar-date/#at). Las instancias son inmutables, así que todo método que modifica un valor devuelve una instancia nueva.

```js title="create.js"
import { date, datetime, now } from 'native-dates';

const fromUtc = datetime('2026-11-16T17:30:00Z', 'America/Los_Angeles');
const standup = date('2026-11-16').at('9:30am', 'America/Los_Angeles');
const current = now();
```

Pasa una zona horaria para ver el instante en esa zona, u omítela para usar la zona predeterminada de [`configure()`](/api/configure/):

```js
const event = datetime('2026-11-16T17:30:00Z', 'America/New_York');
event.zone; // 'America/New_York'
event.hour; // 12
```

:::note[Los desplazamientos fijan el instante, no la zona]
Una `Z` final o un desplazamiento numérico en la cadena de entrada identifica cuándo ocurrió el instante, mientras que la instancia adopta la zona horaria que pasas o tu zona predeterminada. Pasa `'UTC'` como zona cuando quieras campos y aritmética de fechas en UTC.
:::

## Propiedades

Las propiedades leen la fecha y hora en la zona horaria de la instancia.

| Propiedad | Tipo | Descripción |
|---|---|---|
| `text` | `string` | Fecha, hora y nombre corto de la zona formateados según el locale, como `'Nov 16, 2026, 9:30 AM PST'`. |
| `year`, `month`, `day` | `number` | Año del calendario, mes (1–12) y día del mes (1–31). |
| `hour`, `minute`, `second` | `number` | Campos de reloj en formato de 24 horas (0–23, 0–59, 0–59). |
| `millisecond`, `microsecond`, `nanosecond` | `number` | Campos de reloj por debajo del segundo (0–999). |
| `zone` | `string` | Identificador canónico de zona IANA o desplazamiento fijo, como `'America/Los_Angeles'` o `'UTC'`. |
| `offset` | `string` | Desplazamiento UTC activo en este instante, como `'-08:00'`. |
| `epochSeconds` | `number` | Segundos enteros desde la época Unix, redondeados hacia abajo. |
| `epochMilliseconds` | `number` | Milisegundos desde la época Unix. |
| `epochNanoseconds` | `bigint` | Nanosegundos exactos desde la época Unix. |
| `date` | [`CalendarDate`](/api/calendar-date/) | Fecha de calendario en esta zona horaria. |
| `time` | [`Time`](/api/time/) | Hora del día en esta zona horaria. |
| `yearMonth` | [`YearMonth`](/api/year-month/) | Año y mes del calendario en esta zona horaria. |
| `monthDay` | [`MonthDay`](/api/month-day/) | Mes y día del calendario en esta zona horaria. |
| `dayOfWeek` | `number` | Día ISO de la semana, del 1 (lunes) al 7 (domingo). |
| `weekStart` | `number` | Primer día de la semana para este instante (del 1 al 7), según [`configure()`](/api/configure/) o su locale. |
| `quarter` | `number` | Trimestre del calendario (1–4). |
| `weekOfYear`, `dayOfYear` | `number` | Número de semana ISO (1–53) y día del año (1–366). |
| `daysInMonth`, `daysInYear`, `hoursInDay` | `number` | Duración del mes, del año y del día de calendario local actuales. |

## Zona horaria y campos

Consulta el mismo instante en otra zona horaria o reemplaza campos individuales de calendario y de reloj.

:::entry
### `in()` :kind[method]

```js signature
dt.in(zone): DateTime
```

Devuelve un nuevo `DateTime` que representa el mismo instante en otra zona horaria. Las propiedades locales de calendario y de reloj se actualizan según la zona de destino, mientras que la marca de tiempo subyacente no cambia.

**Parámetros**

```params
- name: zone
  type: Zone
  required: true
  description: Nombre de zona horaria IANA como `'Europe/Berlin'`, desplazamiento UTC fijo o `'UTC'`.
```

**Devuelve**

```returns
type: DateTime
description: Nuevo `DateTime` en el mismo instante, visto en `zone`.
```

```js
const standup = datetime('2026-11-16T09:30', 'America/Los_Angeles');
const berlin = standup.in('Europe/Berlin');

berlin.hour; // 18
berlin.equals(standup); // true
```
:::

:::entry
### `at()` :kind[method]

```js signature
dt.at(time): DateTime
```

Devuelve un nuevo `DateTime` en el mismo día y la misma zona horaria, cambiando solo la hora del día.

**Parámetros**

```params
- name: time
  type: TimeInput
  required: true
  description: Cadena de hora como `'9:30am'`, instancia de `Time`, objeto de campos o `Date`.
```

**Devuelve**

```returns
type: DateTime
description: Nuevo `DateTime` en la misma fecha con la hora `time`.
```

```js
const morning = datetime('2026-11-16T09:30', 'America/Los_Angeles');
const wrapUp = morning.at('5:00pm');

wrapUp.hour; // 17
```
:::

:::entry
### `set()` :kind[method]

```js signature
dt.set(fields): DateTime
dt.set(unit, value): DateTime
```

Devuelve un nuevo `DateTime` con uno o más campos de calendario o de reloj reemplazados en la zona horaria actual. Las fechas fuera de rango, como el 30 de febrero, lanzan un `RangeError` en lugar de avanzar al mes siguiente. Si actualizas `month` o `year` sin indicar `day` y el día excede los días del mes de destino, se ajusta al límite del mes.

**Parámetros**

```params
- name: fields
  type: DateTimeFields | Unit
  required: true
  description: Objeto de campos de calendario o reloj, o nombre de una sola unidad en inglés al pasar `value`.
- name: value
  type: number
  description: Número entero para la unidad `unit`.
```

**Devuelve**

```returns
type: DateTime
description: Nuevo `DateTime` en la misma zona horaria con los campos actualizados.
```

```js
const cutoff = datetime('2026-11-16T09:30', 'America/New_York');

cutoff.set('hour', 17);
cutoff.set({ month: 12, day: 1, hour: 0, minute: 0 });
```
:::

## Aritmética y redondeo

Sumar días, semanas, meses o años conserva la misma hora del día aunque ocurra un cambio de horario de verano. Sumar horas, minutos o segundos cuenta el tiempo exacto transcurrido.

:::entry
### `plus()` :kind[method]

```js signature
dt.plus(amount, unit?): DateTime
dt.add(amount, unit?): DateTime
```

Avanza una duración y devuelve un nuevo `DateTime` en la misma zona horaria. También tiene el alias `add()`.

**Parámetros**

```params
- name: amount
  type: DurationInput
  required: true
  description: Cantidad junto con `unit`, instancia de `Duration`, cadena de duración en inglés, cadena ISO de duración, objeto de campos o milisegundos.
- name: unit
  type: Unit
  description: Nombre de unidad en inglés cuando `amount` es un número, como `'days'` o `'hours'`.
```

**Devuelve**

```returns
type: DateTime
description: Nuevo `DateTime` en la misma zona horaria.
```

```js
// Fin de semana del cambio al horario de verano en Nueva York (el 8 de marzo tiene 23 horas)
const sat = datetime('2026-03-07T09:00', 'America/New_York');

sat.plus(1, 'day').hour; // 9
sat.plus(24, 'hours').hour; // 10
sat.plus('1h 30m').format('time', 'en-US'); // '10:30 AM'
```
:::

:::entry
### `minus()` :kind[method]

```js signature
dt.minus(amount, unit?): DateTime
dt.subtract(amount, unit?): DateTime
```

Retrocede una duración en la misma zona horaria. Acepta las mismas entradas que [`plus()`](#plus) y también tiene el alias `subtract()`.

**Parámetros**

```params
- name: amount
  type: DurationInput
  required: true
  description: Cantidad numérica junto con `unit`, instancia de `Duration`, frase de duración en inglés, duración ISO u objeto de campos.
- name: unit
  type: Unit
  description: Nombre de unidad en inglés cuando `amount` es un número.
```

**Devuelve**

```returns
type: DateTime
description: Nuevo `DateTime` en la misma zona horaria.
```

```js
const deadline = datetime('2026-11-16T17:00', 'America/New_York');

deadline.minus(48, 'hours');
deadline.minus({ weeks: 1, days: 2 });
```
:::

:::entry
### `startOf()` :kind[method]

```js signature
dt.startOf(unit, firstDay?): DateTime
```

Retrocede al inicio de una unidad de calendario o de reloj en esta zona horaria. Los límites de semana comienzan en `firstDay`, en el `weekStart` de [`configure()`](/api/configure/) o según el locale activo de este instante.

**Parámetros**

```params
- name: unit
  type: Unit
  required: true
  description: Unidad de calendario o de reloj en inglés, desde `'year'` hasta `'millisecond'`.
- name: firstDay
  type: DayOfWeek
  description: Primer día de la semana cuando `unit` es `'week'`, como el nombre en inglés `'sunday'` o `7`.
```

**Devuelve**

```returns
type: DateTime
description: Nuevo `DateTime` al inicio de `unit`.
```

```js
const wed = datetime('2026-11-18T14:45:12', 'America/New_York').locale('en-US');

wed.startOf('day').format('time'); // '12:00 AM'
wed.startOf('week').day; // 15
wed.startOf('week', 'monday').day; // 16
```
:::

:::entry
### `endOf()` :kind[method]

```js signature
dt.endOf(unit, firstDay?): DateTime
```

Avanza hasta el último milisegundo de una unidad de calendario o de reloj en esta zona horaria.

**Parámetros**

```params
- name: unit
  type: Unit
  required: true
  description: Unidad de calendario o de reloj en inglés, desde `'year'` hasta `'nanosecond'`.
- name: firstDay
  type: DayOfWeek
  description: Primer día de la semana cuando `unit` es `'week'`.
```

**Devuelve**

```returns
type: DateTime
description: Nuevo `DateTime` en el último milisegundo de `unit`.
```

```js
const nov = datetime('2026-11-18T14:45', 'UTC');

nov.endOf('month').toString(); // '2026-11-30T23:59:59.999Z'
```
:::

:::entry
### `startOfNext()` :kind[method]

```js signature
dt.startOfNext(unit, firstDay?): DateTime
```

Avanza hasta el inicio de la unidad de calendario o de reloj siguiente a la que contiene este instante, en esta zona horaria. El resultado siempre es posterior, por lo que desde la medianoche el día siguiente comienza en la próxima medianoche.

Pasa el nombre de un día de la semana en inglés en lugar de una unidad para obtener el inicio del próximo día con ese nombre. Llamar a [`next()`](#next) encuentra el mismo día conservando la hora del día.

**Parámetros**

```params
- name: unit
  type: Unit | Exclude<DayOfWeek, number>
  required: true
  description: Unidad de calendario o de reloj en inglés desde `'year'` hasta `'nanosecond'`, o nombre de día de la semana en inglés como `'wednesday'`.
- name: firstDay
  type: DayOfWeek
  description: Primer día de la semana cuando `unit` es `'week'`.
```

**Devuelve**

```returns
type: DateTime
description: Nuevo `DateTime` al inicio de la siguiente `unit`, o del próximo día de la semana indicado.
```

```js
const standup = datetime('2026-11-16T09:30', 'America/New_York');

standup.startOfNext('month').text; // 'Dec 1, 2026, 12:00 AM EST'
standup.startOfNext('hour').text; // 'Nov 16, 2026, 10:00 AM EST'
standup.startOfNext('wednesday').text; // 'Nov 18, 2026, 12:00 AM EST'
standup.next('wednesday').text; // 'Nov 18, 2026, 9:30 AM EST'
```
:::

:::entry
### `startOfPrevious()` :kind[method]

```js signature
dt.startOfPrevious(unit, firstDay?): DateTime
```

Retrocede al inicio de la unidad de calendario o de reloj anterior a la que contiene este instante, en esta zona horaria. Pasar el nombre de un día de la semana en inglés en lugar de una unidad devuelve el inicio del día anterior con ese nombre, mientras que [`previous()`](#previous) conserva la hora del día.

**Parámetros**

```params
- name: unit
  type: Unit | Exclude<DayOfWeek, number>
  required: true
  description: Unidad de calendario o de reloj en inglés desde `'year'` hasta `'nanosecond'`, o nombre de día de la semana en inglés como `'wednesday'`.
- name: firstDay
  type: DayOfWeek
  description: Primer día de la semana cuando `unit` es `'week'`.
```

**Devuelve**

```returns
type: DateTime
description: Nuevo `DateTime` al inicio de la `unit` anterior, o del día de la semana anterior indicado.
```

```js
const standup = datetime('2026-11-16T09:30', 'America/New_York');

standup.startOfPrevious('day').text; // 'Nov 15, 2026, 12:00 AM EST'
standup.startOfPrevious('month').text; // 'Oct 1, 2026, 12:00 AM EDT'
standup.startOfPrevious('wednesday').text; // 'Nov 11, 2026, 12:00 AM EST'
```
:::

:::entry
### `next()` :kind[method]

```js signature
dt.next(target): DateTime
```

Avanza al siguiente día de la semana o [`MonthDay`](/api/month-day/) indicado conservando la misma hora del día. Si ya cae en ese día de la semana o en esa fecha anual, avanza hasta la próxima coincidencia.

**Parámetros**

```params
- name: target
  type: DayOfWeek | MonthDay
  required: true
  description: Nombre de día de la semana en inglés como `'friday'`, número ISO del 1 al 7 o `MonthDay` recurrente.
```

**Devuelve**

```returns
type: DateTime
description: Nuevo `DateTime` en la siguiente fecha coincidente con la misma hora local.
```

```js
import { datetime, monthDay } from 'native-dates';

const mon = datetime('2026-11-16T09:30', 'America/Los_Angeles');

mon.next('friday').day; // 20
mon.next('monday').day; // 23
mon.next(monthDay('12-25')).month; // 12
```
:::

:::entry
### `previous()` :kind[method]

```js signature
dt.previous(target): DateTime
```

Retrocede a la última ocurrencia del día de la semana o [`MonthDay`](/api/month-day/) indicado antes de esta fecha, conservando la misma hora del día.

**Parámetros**

```params
- name: target
  type: DayOfWeek | MonthDay
  required: true
  description: Nombre de día de la semana en inglés, prefijo inglés de tres letras, número ISO del 1 al 7 o `MonthDay` recurrente.
```

**Devuelve**

```returns
type: DateTime
description: Nuevo `DateTime` en la fecha coincidente anterior con la misma hora local.
```

```js
const mon = datetime('2026-11-16T09:30', 'America/Los_Angeles');

mon.previous('friday').day; // 13
mon.previous(monthDay('10-31')).month; // 10
```
:::

:::entry
### `round()` :kind[method]

```js signature
dt.round(unit): DateTime
dt.round(increment, unit): DateTime
```

Redondea a la unidad o incremento más cercano; en caso de empate en el punto medio, redondea hacia arriba.

**Parámetros**

```params
- name: increment
  type: number | Unit
  required: true
  description: Incremento que divide de forma exacta la unidad superior, o unidad de destino cuando se redondea a `1`.
- name: unit
  type: Unit
  description: Unidad de redondeo en inglés, desde `'day'` hasta `'nanosecond'`.
```

**Devuelve**

```returns
type: DateTime
description: Nuevo `DateTime` redondeado en la misma zona horaria.
```

```js
const stamp = datetime('2026-11-16T09:23:40', 'UTC');

stamp.round('hour').toString(); // '2026-11-16T09:00:00.000Z'
stamp.round(15, 'minutes').toString(); // '2026-11-16T09:30:00.000Z'
```
:::

:::entry
### `floor()` :kind[method]

```js signature
dt.floor(unit): DateTime
dt.floor(increment, unit): DateTime
```

Redondea hacia abajo hasta el inicio de una unidad o de un incremento. Acepta los mismos argumentos que [`round()`](#round).

```js
datetime('2026-11-16T09:29:00Z').floor(15, 'minutes').toString(); // '2026-11-16T09:15:00.000Z'
```
:::

:::entry
### `ceil()` :kind[method]

```js signature
dt.ceil(unit): DateTime
dt.ceil(increment, unit): DateTime
```

Redondea hacia arriba hasta la siguiente unidad o el siguiente incremento. Acepta los mismos argumentos que [`round()`](#round).

```js
datetime('2026-11-16T09:01:00Z').ceil(15, 'minutes').toString(); // '2026-11-16T09:15:00.000Z'
```
:::

## Comparar instantes

Las comparaciones evalúan cuándo ocurrió cada instante, incluso si los dos valores usan zonas horarias distintas.

:::warning[Comparar con ===]
El operador `===` de JavaScript comprueba si dos variables apuntan al mismo objeto en memoria. Llama a [`equals()`](#equals) para comprobar si dos instancias de `DateTime` representan el mismo instante.
:::

:::entry
### `equals()` :kind[method]

```js signature
dt.equals(other): boolean
```

Devuelve `true` cuando ambos valores representan exactamente el mismo instante, sin importar sus zonas horarias.

**Parámetros**

```params
- name: other
  type: DateTimeInput
  required: true
  description: Otro `DateTime` o cualquier entrada aceptada por `datetime()`.
```

**Devuelve**

```returns
type: boolean
description: '`true` si ambos valores apuntan al mismo instante.'
```

```js
const ny = datetime('2026-11-16T12:00', 'America/New_York');
const utc = datetime('2026-11-16T17:00Z', 'UTC');

ny.equals(utc); // true
```
:::

:::entry
### `isBefore()` :kind[method]

```js signature
dt.isBefore(other): boolean
```

Devuelve `true` si este instante es anterior al otro.

```js
datetime('2026-11-16T16:59Z').isBefore('2026-11-16T17:00Z'); // true
```
:::

:::entry
### `isAfter()` :kind[method]

```js signature
dt.isAfter(other): boolean
```

Devuelve `true` si este instante es posterior al otro.

```js
datetime('2026-11-16T17:01Z').isAfter('2026-11-16T17:00Z'); // true
```
:::

:::entry
### `isSame()` :kind[method]

```js signature
dt.isSame(other, unit?, firstDay?): boolean
```

Comprueba si otro instante pertenece a la misma unidad de calendario o de reloj al evaluar ambos en la zona horaria de esta instancia. Llamar a `isSame()` sin unidad comprueba igualdad exacta de instante.

**Parámetros**

```params
- name: other
  type: DateTimeInput
  required: true
  description: Instante con el que comparar, visto en la zona horaria de esta instancia.
- name: unit
  type: Unit
  description: Unidad de calendario o de reloj en inglés para comparar, como `'day'` o `'month'`.
- name: firstDay
  type: DayOfWeek
  description: Primer día de la semana cuando `unit` es `'week'`.
```

**Devuelve**

```returns
type: boolean
description: '`true` cuando ambos instantes caen en la misma `unit` en esta zona horaria.'
```

```js
const la = datetime('2026-11-16T09:30', 'America/Los_Angeles');
const lateUtc = datetime('2026-11-17T02:00Z', 'UTC');

la.isSame(lateUtc, 'day'); // true (16 de noviembre a las 18:00 en Los Ángeles)
lateUtc.isSame(la, 'day'); // false (17 de noviembre frente a 16 de noviembre en UTC)
```
:::

### Predicados de calendario

Comprobaciones sin argumentos evaluadas en la zona horaria de la instancia:

| Método | Tipo | Descripción |
|---|---|---|
| `isPast()`, `isFuture()` | `boolean` | Si este instante es anterior o posterior al momento actual. |
| `isToday()`, `isTomorrow()`, `isYesterday()` | `boolean` | Si la fecha de calendario local coincide con hoy, mañana o ayer en esta zona. |
| `isWeekday()`, `isWeekend()` | `boolean` | Día laborable frente a fin de semana en el locale activo, como sábado y domingo en `en-US` o viernes y sábado en `ar-SA`. |
| `isLeapYear()` | `boolean` | Si el año local es bisiesto. |

## Medir el tiempo

:::entry
### `until()` :kind[method]

```js signature
dt.until(other): Duration
dt.until(other, unit): number
```

Mide el tiempo desde este instante hasta otro y devuelve una duración negativa si el destino es anterior. Pasa un nombre de unidad en inglés para obtener la duración total como un solo número en lugar de un [`Duration`](/api/duration/).

**Parámetros**

```params
- name: other
  type: DateTimeInput
  required: true
  description: Instante de destino hasta el cual medir.
- name: unit
  type: Unit
  description: Unidad en inglés en la que devolver la duración total como número de punto flotante.
```

**Devuelve**

```returns
type: Duration | number
description: Instancia de `Duration` en días y unidades de reloj, o número cuando se indica `unit`.
```

```js
const doors = datetime('2026-11-16T08:00', 'America/Los_Angeles');
const standup = datetime('2026-11-16T09:30', 'America/Los_Angeles');

doors.until(standup).format('long', 'en-US'); // '1 hour, 30 minutes'
doors.until(standup, 'hours'); // 1.5
```
:::

:::entry
### `since()` :kind[method]

```js signature
dt.since(other): Duration
dt.since(other, unit): number
```

Mide el tiempo transcurrido desde un instante anterior. Pasa un nombre de unidad en inglés para obtener el total como un número.

```js
const standup = datetime('2026-11-16T09:30', 'America/Los_Angeles');

standup.since('2026-11-16T08:00', 'minutes'); // 90
```
:::

:::entry
### `to()` :kind[method]

```js signature
dt.to(end): DateTimeRange
dt.to(count, unit): DateTimeRange
dt.for(length): DateTimeRange
dt.for(count, unit): DateTimeRange
```

Crea un [`DateTimeRange`](/api/ranges/#datetimerange) semiabierto que empieza en este instante y llega hasta el instante final o hasta completar la duración indicada (sin incluir el límite superior). Lanza un `RangeError` si el final es anterior al inicio. Usa `for()` para pasar una duración explícita (rechaza instantes finales y números sin unidad).

**Parámetros**

```params
- name: end
  type: DateTimeInput | DurationInput | number
  required: true
  description: Instante final de destino, duración o cantidad numérica `count` junto con `unit`.
- name: unit
  type: Unit
  description: Nombre de unidad en inglés cuando el primer argumento es una cantidad numérica, como `'hours'` o `'days'`.
```

**Devuelve**

```returns
type: DateTimeRange
description: '`DateTimeRange` semiabierto en la zona horaria de esta instancia.'
```

```js
const standup = datetime('2026-11-16T09:30', 'America/Los_Angeles');

standup.to('2026-11-16T10:00').duration.minutes; // 30
standup.for(2, 'hours').end.hour; // 11
```
:::

:::entry
### `range()` :kind[method]

```js signature
dt.range(unit, firstDay?): DateTimeRange
```

Devuelve el [`DateTimeRange`](/api/ranges/#datetimerange) semiabierto de la unidad de calendario o de reloj que contiene este instante, desde su inicio hasta el inicio de la siguiente unidad (sin incluirlo).

**Parámetros**

```params
- name: unit
  type: Unit
  required: true
  description: Unidad de calendario o de reloj en inglés, desde `'year'` hasta `'nanosecond'`.
- name: firstDay
  type: DayOfWeek
  description: Primer día de la semana cuando `unit` es `'week'`.
```

**Devuelve**

```returns
type: DateTimeRange
description: '`DateTimeRange` semiabierto que abarca `unit` en esta zona horaria.'
```

```js
const event = datetime('2026-11-16T14:45', 'UTC');

event.range('day').toString();
// '2026-11-16T00:00:00.000Z/2026-11-17T00:00:00.000Z'
```
:::

## Formateo y conversión

:::entry
### `format()` :kind[method]

```js signature
dt.format(spec?, locale?): string
```

Formatea la fecha y hora en su zona activa mediante presets integrados, nombres personalizados de [`configure()`](/api/configure/), objetos de opciones de `Intl` o patrones de tokens.

Incluye presets localizados desde `'LT'` hasta `'llll'`, junto con `[corchetes]` para texto literal. Consulta [Formateo](/guides/formatting/) para ver la referencia completa de presets y tokens.

**Parámetros**

```params
- name: spec
  type: FormatSpec
  default: "'medium'"
  description: Nombre de formato integrado o configurado, objeto de opciones de `Intl` o patrón de tokens.
- name: locale
  type: string
  description: Etiqueta de locale BCP 47 que sobrescribe el locale de este instante o el configurado solo para esta llamada.
```

**Devuelve**

```returns
type: string
description: Cadena formateada en la zona horaria de la instancia.
```

```js
const standup = datetime('2026-11-16T09:30', 'America/Los_Angeles');

standup.format('medium', 'en-US'); // 'Nov 16, 2026, 9:30 AM'
standup.format('full', 'en-US'); // 'Monday, November 16, 2026 at 9:30 AM'
standup.format('LLL', 'en-US'); // 'November 16, 2026 at 9:30 AM'
standup.format('text', 'en-US'); // 'Nov 16, 2026, 9:30 AM PST'
standup.format('YYYY-MM-DD HH:mm'); // '2026-11-16 09:30'
standup.format('MMM D [at] h:mm a', 'en-US'); // 'Nov 16 at 9:30 am'
standup.format(
  { weekday: 'short', hour: '2-digit', minute: '2-digit' },
  'de-DE',
); // 'Mo., 09:30'
```
:::

:::entry
### `from()` :kind[method]

```js signature
dt.from(other?, locale?): string
dt.formatRelative(other?, locale?): string
```

Formatea el tiempo relativo desde otro instante hasta este como una frase localizada mediante `Intl.RelativeTimeFormat`, como `'hace 3 horas'` o `'dentro de 2 días'`.

Si omites el primer argumento, se compara con el instante actual; [`formatRelative()`](#formatrelative) funciona como alias. Cero segundos devuelve “ahora” (`'now'` en inglés), mientras que los días, meses y años usan valores numéricos en lugar de palabras de calendario como “ayer”.

**Parámetros**

```params
- name: other
  type: DateTimeInput
  description: Instante de referencia desde el cual medir, interpretado en la zona horaria de esta instancia si no incluye zona; por defecto usa el instante actual.
- name: locale
  type: Locale
  description: Etiqueta de locale BCP 47 que sobrescribe el locale de este instante o el configurado solo para esta llamada.
```

**Devuelve**

```returns
type: string
description: Frase de tiempo relativo localizada.
```

```js
const anchor = datetime('2026-11-16T12:00', 'UTC');

anchor.from(anchor, 'en-US'); // 'now'
anchor.minus(3, 'hours').from(anchor, 'en-US'); // '3 hours ago'
anchor.minus(23, 'hours').from(anchor, 'en-US'); // '1 day ago'
anchor.plus(45, 'minutes').from(anchor, 'en-US'); // 'in 1 hour'
anchor.minus(3, 'hours').from(anchor, 'es'); // 'hace 3 horas'
```
:::

:::entry
### `fromNow()` :kind[method]

```js signature
dt.fromNow(locale?): string
```

Formatea la distancia entre este instante y el momento actual como una frase localizada; equivale a llamar a [`from()`](#from) sin instante de referencia.

**Parámetros**

```params
- name: locale
  type: Locale
  description: Etiqueta de locale BCP 47 que sobrescribe el locale de este instante o el configurado solo para esta llamada.
```

**Devuelve**

```returns
type: string
description: Frase de tiempo relativo localizada medida desde ahora.
```

```js
now().minus(5, 'minutes').fromNow('en-US'); // '5 minutes ago'
now().plus(2, 'hours').fromNow('en-US'); // 'in 2 hours'
```
:::

:::entry
### `formatRelative()` :kind[method]

```js signature
dt.formatRelative(other?, locale?): string
```

Alias de [`from()`](#from) que formatea como frase localizada la distancia transcurrida desde `other`, o desde ahora si se omite.
:::

:::entry
### `locale()` :kind[method]

```js signature
dt.locale(): Locale | undefined
dt.locale(tag): DateTime
```

Lee el locale asociado a este instante o devuelve una copia con otro locale para presets, límites de semana y valores derivados. Las etiquetas con guion bajo y las cabeceras `Accept-Language` se normalizan automáticamente, una etiqueta vacía lo borra y [`lang()`](#lang) funciona como alias.

**Parámetros**

```params
- name: tag
  type: Locale | null | undefined
  description: Etiqueta de locale, arreglo de etiquetas o cabecera `Accept-Language` para propagar, o `null` para borrarla.
```

**Devuelve**

```returns
type: DateTime | Locale | undefined
description: Etiqueta activa cuando se llama sin argumentos, o nuevo `DateTime` con `tag`.
```

```js
const standup = datetime('2026-11-16T09:30', 'Europe/Berlin').locale('es-ES');

standup.locale(); // 'es-ES'
standup.plus(1, 'week').date.format('long'); // '23 de noviembre de 2026'
standup.locale(null).locale(); // undefined
```
:::

:::entry
### `lang()` :kind[method]

```js signature
dt.lang(): Locale | undefined
dt.lang(tag): DateTime
```

Alias abreviado de [`locale()`](#locale) que lee o asocia una etiqueta de locale BCP 47 a este instante.
:::

:::entry
### `as()` :kind[method]

```js signature
dt.as('datetime'): DateTime
dt.as('date'): CalendarDate
dt.as('time'): Time
dt.as('yearMonth'): YearMonth
dt.as('monthDay'): MonthDay
```

Convierte este instante a otro tipo dentro de una cadena de métodos sin interrumpirla para acceder a una propiedad, incluidos los valores [`YearMonth`](/api/year-month/) y [`MonthDay`](/api/month-day/) en su zona horaria activa.

**Parámetros**

```params
- name: kind
  type: "'datetime' | 'date' | 'time' | 'yearMonth' | 'monthDay'"
  required: true
  description: Tipo de destino al que convertir este instante en su zona horaria activa.
```

**Devuelve**

```returns
type: DateTime | CalendarDate | Time | YearMonth | MonthDay
description: Valor convertido en la zona horaria de esta instancia.
```

```js
const standup = datetime('2026-11-16T09:30', 'America/Los_Angeles');

standup.in('Asia/Tokyo').as('date').toString(); // '2026-11-17'
standup.in('Asia/Tokyo').as('time').toString(); // '02:30:00'
standup.as('yearMonth').toString(); // '2026-11'
standup.as('monthDay').toString(); // '11-16'
```
:::

:::entry
### `toString()` :kind[method]

```js signature
dt.toString(): string
dt.toJSON(): string
```

Devuelve el instante como cadena ISO 8601 en UTC, apta para bases de datos, URL y envío por red. `toJSON()` devuelve la misma cadena para `JSON.stringify()`.

**Devuelve**

```returns
type: string
description: Marca de tiempo ISO 8601 en UTC, como `'2026-11-16T17:30:00.000Z'`.
```

```js
const standup = datetime('2026-11-16T09:30', 'America/Los_Angeles');

standup.toString(); // '2026-11-16T17:30:00.000Z'
JSON.stringify({ standup }); // '{"standup":"2026-11-16T17:30:00.000Z"}'
```
:::

:::entry
### `toJSDate()` :kind[method]

```js signature
dt.toJSDate(): Date
```

Devuelve un `Date` nativo de JavaScript correspondiente al mismo instante.
:::

:::entry
### `toTemporal()` :kind[method]

```js signature
dt.toTemporal(): Temporal.ZonedDateTime
```

Devuelve la instancia subyacente de `Temporal.ZonedDateTime`.
:::

:::entry
### `valueOf()` :kind[method]

```js signature
dt.valueOf(): number
```

Devuelve los milisegundos desde la época Unix para que dos valores `DateTime` puedan restarse o compararse con operadores numéricos.
:::
