---
source: "fbe00d55cb93"
title: kindOf()
lede: Identifica y acota el tipo de los valores de native-dates entre contextos de ejecución y copias de paquetes.
---

## Leer el tipo de un valor

:::entry
### `kindOf()` :kind[function]

```js signature
kindOf(value):
  | 'datetime' | 'date' | 'time' | 'duration'
  | 'yearMonth' | 'monthDay'
  | 'dateRange' | 'datetimeRange' | 'timeRange'
  | undefined
```

Devuelve una etiqueta de texto que indica a qué tipo pertenece un valor, o `undefined` para valores simples de JavaScript como fechas nativas, cadenas, números y objetos. Identifica instantes, fechas, horas, duraciones, valores de [año y mes](/api/year-month/) y de [mes y día](/api/month-day/), y [rangos](/api/ranges/).

```js title="inspect.js"
import { date, dateRange, hours, kindOf, monthDay, now, time, yearMonth } from 'native-dates';

kindOf(now()); // 'datetime'
kindOf(date('2026-11-16')); // 'date'
kindOf(time('9:30am')); // 'time'
kindOf(hours(2)); // 'duration'
kindOf(yearMonth('2026-11')); // 'yearMonth'
kindOf(monthDay('10/17')); // 'monthDay'
kindOf(dateRange('2026-11-01', '2026-11-07')); // 'dateRange'
kindOf(new Date()); // undefined
```

**Parámetros**

```params
- name: value
  type: unknown
  required: true
  description: Cualquier valor que se quiera inspeccionar.
```

**Devuelve**

```returns
type: "'datetime' | 'date' | 'time' | 'duration' | 'yearMonth' | 'monthDay' | 'dateRange' | 'datetimeRange' | 'timeRange' | undefined"
description: Etiqueta de texto con el tipo del valor, o `undefined` cuando `value` no proviene de esta biblioteca.
```
:::

## Guardias de tipo

Las guardias de tipo comprueban marcas basadas en símbolos globales en lugar de la identidad del prototipo, así que funcionan de forma fiable entre distintos contextos de ejecución y copias duplicadas del paquete.

:::entry
### `isDateTime()` :kind[guard]

```js signature
isDateTime(value): value is DateTime
```

Devuelve `true` cuando el valor es una instancia de [`DateTime`](/api/date-time/) y acota su tipo en TypeScript.

```js
import { datetime, isDateTime } from 'native-dates';

const stamp = datetime('2026-11-16T17:30:00Z');
isDateTime(stamp); // true
isDateTime('2026-11-16T17:30:00Z'); // false
```
:::

:::entry
### `isCalendarDate()` :kind[guard]

```js signature
isCalendarDate(value): value is CalendarDate
```

Devuelve `true` cuando el valor es una instancia de [`CalendarDate`](/api/calendar-date/) y acota su tipo en TypeScript.

```js
import { date, isCalendarDate } from 'native-dates';

isCalendarDate(date('2026-11-16')); // true
isCalendarDate(new Date()); // false
```
:::

:::entry
### `isTime()` :kind[guard]

```js signature
isTime(value): value is Time
```

Devuelve `true` cuando el valor es una instancia de [`Time`](/api/time/) y acota su tipo en TypeScript.

```js
import { isTime, time } from 'native-dates';

isTime(time('9:30am')); // true
```
:::

:::entry
### `isDuration()` :kind[guard]

```js signature
isDuration(value): value is Duration
```

Devuelve `true` cuando el valor es una instancia de [`Duration`](/api/duration/) y acota su tipo en TypeScript.

```js
import { hours, isDuration } from 'native-dates';

isDuration(hours(2)); // true
```
:::

:::entry
### `isYearMonth()` :kind[guard]

```js signature
isYearMonth(value): value is YearMonth
```

Devuelve `true` cuando el valor es una instancia de [`YearMonth`](/api/year-month/) y acota su tipo en TypeScript.

```js
import { isYearMonth, yearMonth } from 'native-dates';

isYearMonth(yearMonth('2026-11')); // true
```
:::

:::entry
### `isMonthDay()` :kind[guard]

```js signature
isMonthDay(value): value is MonthDay
```

Devuelve `true` cuando el valor es una instancia de [`MonthDay`](/api/month-day/) y acota su tipo en TypeScript.

```js
import { isMonthDay, monthDay } from 'native-dates';

isMonthDay(monthDay('10-17')); // true
```
:::

:::entry
### `isDateRange()` :kind[guard]

```js signature
isDateRange(value): value is DateRange
```

Devuelve `true` cuando el valor es una instancia de [`DateRange`](/api/ranges/#daterange) y acota su tipo en TypeScript.

```js
import { dateRange, isDateRange } from 'native-dates';

isDateRange(dateRange('2026-11-01', '2026-11-07')); // true
```
:::

:::entry
### `isDateTimeRange()` :kind[guard]

```js signature
isDateTimeRange(value): value is DateTimeRange
```

Devuelve `true` cuando el valor es una instancia de [`DateTimeRange`](/api/ranges/#datetimerange) y acota su tipo en TypeScript.

```js
import { datetimeRange, isDateTimeRange } from 'native-dates';

isDateTimeRange(datetimeRange('2026-11-16T09:00Z', '2026-11-16T10:00Z')); // true
```
:::

:::entry
### `isTimeRange()` :kind[guard]

```js signature
isTimeRange(value): value is TimeRange
```

Devuelve `true` cuando el valor es una instancia de [`TimeRange`](/api/ranges/#timerange) y acota su tipo en TypeScript.

```js
import { isTimeRange, timeRange } from 'native-dates';

isTimeRange(timeRange('9:00am', '5:00pm')); // true
```
:::

## instanceof y marcas entre contextos

Las comprobaciones estándar de `instanceof` en JavaScript fallan entre iframes y copias duplicadas del paquete. Cada clase de esta biblioteca implementa `[Symbol.hasInstance]` sobre un símbolo del registro global, de modo que tanto `instanceof` como las guardias de tipo funcionan entre contextos de ejecución.

También puedes leer directamente los símbolos de marca exportados al escribir serializadores propios, comprobadores de pruebas o utilidades genéricas que acepten cualquier tipo de rango mediante `IS_RANGE`:

```js
import { DateTime, IS_DATE_TIME, IS_RANGE, now, timeRange } from 'native-dates';

const current = now();
current instanceof DateTime; // true
Boolean(current[IS_DATE_TIME]); // true

const shift = timeRange('9am', '5pm');
Boolean(shift[IS_RANGE]); // true
```

| Constante | Clave de símbolo global | Coincide con |
|---|---|---|
| `IS_DATE_TIME` | `Symbol.for('native-dates/DateTime')` | Cualquier instancia de `DateTime`. |
| `IS_CALENDAR_DATE` | `Symbol.for('native-dates/CalendarDate')` | Cualquier instancia de `CalendarDate`. |
| `IS_TIME` | `Symbol.for('native-dates/Time')` | Cualquier instancia de `Time`. |
| `IS_DURATION` | `Symbol.for('native-dates/Duration')` | Cualquier instancia de `Duration`. |
| `IS_YEAR_MONTH` | `Symbol.for('native-dates/YearMonth')` | Instancias de `YearMonth`. |
| `IS_MONTH_DAY` | `Symbol.for('native-dates/MonthDay')` | Instancias de `MonthDay`. |
| `IS_RANGE` | `Symbol.for('native-dates/Range')` | Instancias de `DateRange`, `DateTimeRange` y `TimeRange`. |
| `IS_DATE_RANGE` | `Symbol.for('native-dates/DateRange')` | Instancias de `DateRange`. |
| `IS_DATE_TIME_RANGE` | `Symbol.for('native-dates/DateTimeRange')` | Instancias de `DateTimeRange`. |
| `IS_TIME_RANGE` | `Symbol.for('native-dates/TimeRange')` | Instancias de `TimeRange`. |
