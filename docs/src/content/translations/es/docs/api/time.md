---
source: "3e14665094ab"
title: Time
lede: Una hora del día sin fecha de calendario ni zona horaria.
---

## Crear un Time

Interpreta cadenas de reloj de 12 o 24 horas, pasa números de hora y minuto o convierte un valor existente con [`time()`](/api/time-fn/). Las instancias son inmutables, así que todo método que modifica un valor devuelve una instancia nueva.

```js title="create.js"
import { time } from 'native-dates';

const morning = time('9:30am');
const evening = time('17:30');
const alarm = time(6, 45);
```

Obtén la hora del día local de cualquier [`DateTime`](/api/date-time/) mediante su propiedad `time`:

```js
import { datetime, now } from 'native-dates';

const standup = datetime('2026-11-16T09:30', 'America/Los_Angeles');
standup.time.toString(); // '09:30:00'
const currentClock = now().time;
```

## Propiedades

Las propiedades leen los campos de reloj de 24 horas, desde las horas hasta los nanosegundos.

| Propiedad | Tipo | Descripción |
|---|---|---|
| `text` | `string` | Hora del día formateada según el locale, como `'9:30 AM'`. |
| `hour`, `minute`, `second` | `number` | Campos de reloj en formato de 24 horas (0–23, 0–59, 0–59). |
| `millisecond`, `microsecond`, `nanosecond` | `number` | Campos de reloj por debajo del segundo (0–999). |

## Combinación y campos

Sitúa una hora del día sobre una fecha de calendario, o reemplaza campos individuales del reloj.

:::entry
### `on()` :kind[method]

```js signature
t.on(date, zone?): DateTime
```

Combina esta hora del día con una fecha de calendario en una zona horaria y devuelve un [`DateTime`](/api/date-time/). Es la operación simétrica de llamar a [`at()`](/api/calendar-date/#at) en un [`CalendarDate`](/api/calendar-date/).

**Parámetros**

```params
- name: date
  type: CalendarDateInput
  required: true
  description: Cadena de fecha ISO, `CalendarDate`, `DateTime`, objeto de campos o `Date`.
- name: zone
  type: Zone
  description: Nombre de zona horaria IANA, desplazamiento UTC fijo o `'UTC'`; por defecto usa la zona configurada.
```

**Devuelve**

```returns
type: DateTime
description: Nuevo `DateTime` en la fecha `date` a esta hora en `zone`.
```

```js
const opens = time('9:30am');

opens.on('2026-11-16', 'America/New_York').toString(); // '2026-11-16T14:30:00.000Z'
```
:::

:::entry
### `set()` :kind[method]

```js signature
t.set(fields): Time
t.set(unit, value): Time
```

Devuelve un nuevo `Time` con uno o más campos de reloj reemplazados. Los valores fuera de rango, como el minuto 75, lanzan un `RangeError`.

**Parámetros**

```params
- name: fields
  type: DateTimeFields | Unit
  required: true
  description: Objeto de campos de reloj, o nombre de una sola unidad en inglés al pasar `value`.
- name: value
  type: number
  description: Número entero para la unidad `unit`.
```

**Devuelve**

```returns
type: Time
description: Nuevo `Time` con los campos de reloj actualizados.
```

```js
const reminder = time('9:30am');

reminder.set('minute', 45).toString(); // '09:45:00'
reminder.set({ hour: 17, minute: 0 }).toString(); // '17:00:00'
```
:::

## Aritmética y redondeo

Suma o resta unidades de reloj, ajusta la hora a los límites de una unidad o redondéala a un incremento. Las unidades de calendario como días y semanas lanzan un `RangeError` porque una hora del día no tiene fecha.

:::note[Vuelta al pasar la medianoche]
La aritmética de reloj es cíclica en un intervalo de 24 horas, así que sumar 2 horas a las 23:00 devuelve la 01:00. Combina primero la hora con una fecha mediante [`on()`](#on) cuando cruzar la medianoche deba cambiar de día.
:::

:::entry
### `plus()` :kind[method]

```js signature
t.plus(amount, unit?): Time
t.add(amount, unit?): Time
```

Avanza en el reloj de 24 horas y devuelve un nuevo `Time`, dando la vuelta tras la medianoche cuando es necesario. También tiene el alias `add()`.

**Parámetros**

```params
- name: amount
  type: DurationInput
  required: true
  description: Cantidad junto con `unit`, instancia de `Duration`, cadena de duración en inglés, duración ISO, objeto de campos o milisegundos.
- name: unit
  type: Unit
  description: Nombre de unidad de reloj en inglés cuando `amount` es un número, como `'hours'` o `'minutes'`.
```

**Devuelve**

```returns
type: Time
description: Nuevo `Time` ajustado al ciclo de 24 horas.
```

```js
time('9:00am').plus(90, 'minutes').toString(); // '10:30:00'
time('23:00').plus('2h').toString(); // '01:00:00'
```
:::

:::entry
### `minus()` :kind[method]

```js signature
t.minus(amount, unit?): Time
t.subtract(amount, unit?): Time
```

Retrocede en el reloj de 24 horas, dando la vuelta antes de la medianoche cuando es necesario. Acepta las mismas entradas que [`plus()`](#plus) y también tiene el alias `subtract()`.

**Parámetros**

```params
- name: amount
  type: DurationInput
  required: true
  description: Cantidad junto con `unit`, instancia de `Duration`, cadena de duración en inglés, duración ISO, objeto de campos o milisegundos.
- name: unit
  type: Unit
  description: Nombre de unidad de reloj en inglés cuando `amount` es un número.
```

**Devuelve**

```returns
type: Time
description: Nuevo `Time` ajustado al ciclo de 24 horas.
```

```js
time('00:30').minus(45, 'minutes').toString(); // '23:45:00'
```
:::

:::entry
### `startOf()` :kind[method]

```js signature
t.startOf(unit): Time
```

Pone a cero todos los campos de reloj menores que la unidad indicada.

**Parámetros**

```params
- name: unit
  type: Unit
  required: true
  description: Unidad de reloj en inglés, desde `'hour'` hasta `'nanosecond'`.
```

**Devuelve**

```returns
type: Time
description: Nuevo `Time` al inicio de `unit`.
```

```js
time('14:37:22').startOf('hour').toString(); // '14:00:00'
```
:::

:::entry
### `endOf()` :kind[method]

```js signature
t.endOf(unit): Time
```

Avanza hasta el último milisegundo de la unidad de reloj indicada.

**Parámetros**

```params
- name: unit
  type: Unit
  required: true
  description: Unidad de reloj en inglés, desde `'hour'` hasta `'nanosecond'`.
```

**Devuelve**

```returns
type: Time
description: Nuevo `Time` en el último milisegundo de `unit`.
```

```js
time('14:37:22').endOf('hour').toString(); // '14:59:59.999'
```
:::

:::entry
### `startOfNext()` :kind[method]

```js signature
t.startOfNext(unit): Time
```

Avanza hasta el inicio de la unidad de reloj posterior a la que contiene esta hora, dando la vuelta al pasar la medianoche. Siempre avanza a la unidad siguiente, así que llamar a `startOfNext('hour')` sobre `14:00:00` devuelve `15:00:00`.

**Parámetros**

```params
- name: unit
  type: Unit
  required: true
  description: Unidad de reloj en inglés, desde `'hour'` hasta `'nanosecond'`.
```

**Devuelve**

```returns
type: Time
description: Nuevo `Time` al inicio de la siguiente `unit`.
```

```js
time('14:37:22').startOfNext('hour').toString(); // '15:00:00'
time('23:37:22').startOfNext('hour').toString(); // '00:00:00'
```
:::

:::entry
### `startOfPrevious()` :kind[method]

```js signature
t.startOfPrevious(unit): Time
```

Retrocede al inicio de la unidad de reloj anterior a la que contiene esta hora, dando la vuelta al cruzar la medianoche.

**Parámetros**

```params
- name: unit
  type: Unit
  required: true
  description: Unidad de reloj en inglés, desde `'hour'` hasta `'nanosecond'`.
```

**Devuelve**

```returns
type: Time
description: Nuevo `Time` al inicio de la `unit` anterior.
```

```js
time('14:37:22').startOfPrevious('hour').toString(); // '13:00:00'
time('00:15:00').startOfPrevious('hour').toString(); // '23:00:00'
```
:::

:::entry
### `round()` :kind[method]

```js signature
t.round(unit): Time
t.round(increment, unit): Time
```

Redondea a la unidad de reloj o incremento más cercano; en caso de empate en el punto medio, redondea hacia arriba.

**Parámetros**

```params
- name: increment
  type: number | Unit
  required: true
  description: Incremento que divide de forma exacta la unidad superior, o unidad de destino cuando se redondea a `1`.
- name: unit
  type: Unit
  description: Unidad de reloj de redondeo en inglés, desde `'hour'` hasta `'nanosecond'`.
```

**Devuelve**

```returns
type: Time
description: Nuevo `Time` redondeado.
```

```js
const checkin = time('14:36:00');

checkin.round('hour').toString(); // '15:00:00'
checkin.round(15, 'minutes').toString(); // '14:30:00'
```
:::

:::entry
### `floor()` :kind[method]

```js signature
t.floor(unit): Time
t.floor(increment, unit): Time
```

Redondea hacia abajo hasta el inicio de una unidad de reloj o de un incremento. Acepta los mismos argumentos que [`round()`](#round).

```js
time('14:29').floor(15, 'minutes').toString(); // '14:15:00'
```
:::

:::entry
### `ceil()` :kind[method]

```js signature
t.ceil(unit): Time
t.ceil(increment, unit): Time
```

Redondea hacia arriba hasta la siguiente unidad de reloj o el siguiente incremento. Acepta los mismos argumentos que [`round()`](#round).

```js
time('14:01').ceil(15, 'minutes').toString(); // '14:15:00'
```
:::

## Comparar horas

Las comparaciones ordenan las horas dentro de un mismo día, desde la medianoche hasta el final del día. Los operadores relacionales como `<` lanzan un `RangeError`, así que compara valores con métodos o con [`compare()`](/api/compare/).

:::entry
### `equals()` :kind[method]

```js signature
t.equals(other): boolean
```

Devuelve `true` cuando ambos valores representan exactamente la misma hora del día.

**Parámetros**

```params
- name: other
  type: TimeInput
  required: true
  description: Otro `Time` o cualquier entrada aceptada por `time()`.
```

**Devuelve**

```returns
type: boolean
description: '`true` si ambos valores coinciden hasta el nanosegundo.'
```

```js
time('5:30pm').equals('17:30'); // true
```
:::

:::entry
### `isBefore()` :kind[method]

```js signature
t.isBefore(other): boolean
```

Devuelve `true` si esta hora es más temprana en el día que la otra.

```js
time('9:00am').isBefore('5:00pm'); // true
```
:::

:::entry
### `isAfter()` :kind[method]

```js signature
t.isAfter(other): boolean
```

Devuelve `true` si esta hora es posterior en el día a la otra.

```js
time('5:00pm').isAfter('9:00am'); // true
```
:::

:::entry
### `isSame()` :kind[method]

```js signature
t.isSame(other, unit?): boolean
```

Comprueba si otra hora cae dentro de la misma unidad de reloj, como la misma hora o el mismo minuto. Llamar a `isSame()` sin unidad comprueba igualdad exacta.

**Parámetros**

```params
- name: other
  type: TimeInput
  required: true
  description: Hora con la que comparar.
- name: unit
  type: Unit
  description: Unidad de reloj en inglés para comparar, como `'hour'` o `'minute'`.
```

**Devuelve**

```returns
type: boolean
description: '`true` cuando ambas horas comparten la misma `unit`.'
```

```js
time('9:05am').isSame('9:45am', 'hour'); // true
time('9:05am').isSame('10:05am', 'hour'); // false
```
:::

## Medir intervalos

:::entry
### `until()` :kind[method]

```js signature
t.until(other): Duration
t.until(other, unit): number
```

Mide el tiempo con signo desde esta hora hasta otra dentro del mismo día, y devuelve una duración negativa cuando la hora de destino es anterior. Pasa un nombre de unidad en inglés para obtener la duración total como un número.

**Parámetros**

```params
- name: other
  type: TimeInput
  required: true
  description: Hora de destino hasta la cual medir.
- name: unit
  type: Unit
  description: Unidad de reloj en inglés en la que devolver la duración total como número de punto flotante.
```

**Devuelve**

```returns
type: Duration | number
description: Instancia de `Duration` equilibrada hasta horas, o número cuando se indica `unit`.
```

```js
const opens = time('9:00am');
const closes = time('5:30pm');

opens.until(closes).format('long', 'en-US'); // '8 hours, 30 minutes'
opens.until(closes, 'hours'); // 8.5
time('22:00').until('02:00', 'hours'); // -20
```
:::

:::entry
### `since()` :kind[method]

```js signature
t.since(other): Duration
t.since(other, unit): number
```

Mide el tiempo transcurrido desde una hora anterior dentro del mismo día. Pasa un nombre de unidad en inglés para obtener el total como un número.

```js
time('5:00pm').since('9:00am', 'hours'); // 8
```
:::

:::entry
### `to()` :kind[method]

```js signature
t.to(end): TimeRange
t.to(count, unit): TimeRange
t.for(length): TimeRange
t.for(count, unit): TimeRange
```

Crea un [`TimeRange`](/api/ranges/#timerange) semiabierto desde esta hora hasta la hora final o hasta completar la duración indicada (sin incluir el límite superior). Si la hora final es más temprana que la inicial, el rango cruza la medianoche. Usa `for()` para pasar una duración explícita (rechaza horas finales y números sin unidad).

**Parámetros**

```params
- name: end
  type: TimeInput | DurationInput | number
  required: true
  description: Hora final, duración de reloj o cantidad numérica `count` junto con `unit`.
- name: unit
  type: Unit
  description: Nombre de unidad de reloj en inglés cuando el primer argumento es una cantidad numérica, como `'hours'` o `'minutes'`.
```

**Devuelve**

```returns
type: TimeRange
description: '`TimeRange` semiabierto que comienza en esta hora.'
```

```js
time('9:00am').to('5:00pm').duration.hours; // 8
time('9:00am').for(90, 'minutes').end.toString(); // '10:30:00'
time('22:00').to('06:00').duration.hours; // 8
```
:::

## Formateo y conversión

:::entry
### `format()` :kind[method]

```js signature
t.format(spec?, locale?): string
```

Formatea la hora del día mediante presets integrados, nombres personalizados de [`configure()`](/api/configure/), objetos de opciones o patrones de tokens.

Incluye los presets localizados `'LT'` y `'LTS'`, y los objetos de opciones ignoran automáticamente las claves de fecha y de zona horaria. Consulta [Formateo](/guides/formatting/) para ver la referencia completa de presets y tokens.

**Parámetros**

```params
- name: spec
  type: FormatSpec
  default: "'short'"
  description: Nombre de formato integrado o configurado, objeto de opciones de `Intl` o patrón de tokens.
- name: locale
  type: string
  description: Etiqueta de locale BCP 47 que sobrescribe el locale de esta hora o el configurado solo para esta llamada.
```

**Devuelve**

```returns
type: string
description: Cadena de hora formateada.
```

```js
const afternoon = time('17:30:15');

afternoon.format('short', 'en-US'); // '5:30 PM'
afternoon.format('LTS', 'en-US'); // '5:30:15 PM'
afternoon.format('HH:mm:ss'); // '17:30:15'
afternoon.format('h:mm a'); // '5:30 pm'
afternoon.format({ hour12: false }, 'en-US'); // '17:30'
```
:::

:::entry
### `locale()` :kind[method]

```js signature
t.locale(): Locale | undefined
t.locale(tag): Time
```

Lee el locale asociado a esta hora o devuelve una copia formateada en otro locale para vistas previas de texto, presets y valores derivados. Pasar una etiqueta vacía borra el locale asociado, y [`lang()`](#lang) funciona como alias.

**Parámetros**

```params
- name: tag
  type: Locale | null | undefined
  description: Etiqueta de locale BCP 47 para propagar, o `null` para borrar una etiqueta existente.
```

**Devuelve**

```returns
type: Time | Locale | undefined
description: Etiqueta activa cuando se llama sin argumentos, o nuevo `Time` con `tag`.
```

```js
const closing = time('17:30').locale('ko-KR');

closing.locale(); // 'ko-KR'
closing.text; // '오후 5:30'
closing.on('2026-05-01', 'Asia/Seoul').locale(); // 'ko-KR'
```
:::

:::entry
### `lang()` :kind[method]

```js signature
t.lang(): Locale | undefined
t.lang(tag): Time
```

Alias abreviado de [`locale()`](#locale) que lee o asocia una etiqueta de locale BCP 47 a esta hora.
:::

:::entry
### `toString()` :kind[method]

```js signature
t.toString(): string
t.toJSON(): string
```

Devuelve la cadena de hora ISO 8601 en formato de 24 horas, mostrando las fracciones de segundo en grupos de tres dígitos solo cuando son distintas de cero. `toJSON()` devuelve la misma cadena para `JSON.stringify()`.

**Devuelve**

```returns
type: string
description: Cadena de hora ISO 8601, como `'17:30:00'` o `'17:30:15.250'`.
```

```js
time('5:30pm').toString(); // '17:30:00'
time('17:30:15.25').toString(); // '17:30:15.250'
JSON.stringify({ opens: time('9am') }); // '{"opens":"09:00:00"}'
```
:::

:::entry
### `as()` :kind[method]

```js signature
t.as('time'): Time
```

Devuelve este `Time` cuando se solicita `'time'` en cadenas genéricas de conversión, y lanza un `RangeError` para otros tipos.
:::

:::entry
### `toTemporal()` :kind[method]

```js signature
t.toTemporal(): Temporal.PlainTime
```

Devuelve la instancia subyacente de `Temporal.PlainTime`.
:::

:::entry
### `valueOf()` :kind[method]

```js signature
t.valueOf(): never
```

Lanza un `RangeError` para que los operadores numéricos nunca conviertan silenciosamente una hora del día en un número.
:::
