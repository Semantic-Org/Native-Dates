---
source: "a03fe5ee9f3b"
title: compare()
lede: Ordena y elige valores extremos entre fechas, instantes, horas, duraciones y rangos.
---

## Ordenar y comparar

:::entry
### `compare()` :kind[function]

```js signature
compare(a, b): -1 | 0 | 1
```

Ordena dos valores del mismo tipo para usar con `Array.prototype.sort()` y devuelve un número negativo, cero o positivo. Funciona con instantes, marcas de tiempo Unix, fechas de calendario, horas del día, duraciones, [valores de año y mes](/api/year-month/) y [rangos](/api/ranges/).

Cualquiera de los argumentos también puede ser una cadena ISO, un `Date` nativo de JavaScript o una marca de tiempo en milisegundos Unix. Al comparar un número con una hora del día, el número se interpreta como la hora del reloj; comparar tipos distintos lanza un `TypeError`.

```js title="sort.js"
import { compare, date, datetime, hours, minutes } from 'native-dates';

const dates = [date('2026-12-01'), date('2026-05-10'), date('2026-08-20')];
dates.sort(compare).map(String); // ['2026-05-10', '2026-08-20', '2026-12-01']

const moments = [
  datetime('2026-11-16T18:00', 'Europe/Berlin'),
  datetime('2026-11-16T08:00', 'America/Los_Angeles'),
];
moments.sort(compare)[0].zone; // 'America/Los_Angeles'

compare(1794840000000, datetime('2026-11-16T18:00Z')); // -1

const spans = [hours(2), minutes(45), minutes(90)].sort(compare);
spans[0].minutes; // 45
```

**Parámetros**

```params
- name: a
  type: Point | Duration | YearMonth | Range
  required: true
  description: Primer valor tipado, cadena ISO, `Date` o marca de tiempo en milisegundos Unix para comparar.
- name: b
  type: Point | Duration | YearMonth | Range
  required: true
  description: Segundo valor del mismo tipo, o una entrada sin procesar compatible con `a`.
```

**Devuelve**

```returns
type: -1 | 0 | 1
description: "Valor `-1` si el primero es anterior, `0` si son iguales y `1` si es posterior."
```

Los rangos del mismo tipo se ordenan primero por su inicio y desempatan por su final:

```js
import { compare, dateRange } from 'native-dates';

const windows = [
  dateRange('2026-11-10', '2026-11-20'),
  dateRange('2026-11-10', '2026-11-14'),
  dateRange('2026-11-01', '2026-11-05'),
];

windows.sort(compare).map(String);
// ['2026-11-01/2026-11-05', '2026-11-10/2026-11-14', '2026-11-10/2026-11-20']
```
:::

:::note[Comparar instantes entre zonas horarias]
`compare()` ordena los valores [`DateTime`](/api/date-time/) por su instante exacto y no por la hora local del reloj. Una reunión a las 9:00 AM en Nueva York queda antes que una reunión a las 8:00 AM del mismo día en Los Ángeles.
:::

## Elegir valores extremos

Encuentra el valor mínimo o máximo entre un conjunto de fechas, instantes, horas del día o valores [`YearMonth`](/api/year-month/). Ambas funciones aceptan argumentos individuales o un único array no vacío.

:::entry
### `earliest()` :kind[function]

```js signature
earliest(...points): DateTime | CalendarDate | Time | YearMonth
earliest(points): DateTime | CalendarDate | Time | YearMonth
```

Devuelve el valor más temprano entre uno o más argumentos o un array no vacío del mismo tipo, y convierte objetos `Date` nativos o milisegundos Unix en un [`DateTime`](/api/date-time/). Pasar un array vacío lanza un `RangeError`.

**Parámetros**

```params
- name: points
  type: Point[] | YearMonth[]
  required: true
  description: Una o más fechas, instantes, marcas de tiempo Unix, horas del día o valores de año y mes del mismo tipo.
```

**Devuelve**

```returns
type: DateTime | CalendarDate | Time | YearMonth
description: Valor que aparece primero. Ante instantes iguales, se conserva el elemento anterior en la lista.
```

```js
import { date, earliest, time } from 'native-dates';

earliest(date('2026-11-20'), date('2026-11-04'), date('2026-11-16')).toString(); // '2026-11-04'
earliest([time('5:30pm'), time('9:00am'), time('12:15pm')]).toString(); // '09:00:00'
earliest(1794850200000, 1794840000000).epochMilliseconds; // 1794840000000
```
:::

:::entry
### `latest()` :kind[function]

```js signature
latest(...points): DateTime | CalendarDate | Time | YearMonth
latest(points): DateTime | CalendarDate | Time | YearMonth
```

Devuelve el valor más tardío entre uno o más argumentos o un array no vacío del mismo tipo. Pasar un array vacío lanza un `RangeError`.

**Parámetros**

```params
- name: points
  type: Point[] | YearMonth[]
  required: true
  description: Una o más fechas, instantes, horas del día o valores de año y mes del mismo tipo.
```

**Devuelve**

```returns
type: DateTime | CalendarDate | Time | YearMonth
description: Valor que aparece último. Ante instantes iguales, se conserva el elemento anterior en la lista.
```

Combina [`earliest()`](#earliest) y `latest()` para acotar un valor entre dos límites:

```js
import { date, earliest, latest } from 'native-dates';

const minDate = date('2026-11-01');
const maxDate = date('2026-11-30');
const picked = date('2026-12-12');

const clamped = earliest(maxDate, latest(minDate, picked));
clamped.toString(); // '2026-11-30'
```
:::
