---
source: "fbe00d55cb93"
title: kindOf()
lede: Identifique e refine tipos de valores do native-dates entre contextos de execução e cópias de bundle.
---

## Identificar o tipo de um valor

:::entry
### `kindOf()` :kind[function]

```js signature
kindOf(value):
  | 'datetime' | 'date' | 'time' | 'duration'
  | 'yearMonth' | 'monthDay'
  | 'dateRange' | 'datetimeRange' | 'timeRange'
  | undefined
```

Retorna uma string indicando a qual tipo o valor pertence, ou `undefined` para valores comuns do JavaScript como datas nativas, strings, números e objetos. Identifica instantes, datas, horários, durações, valores de [ano e mês](/api/year-month/) e [mês e dia](/api/month-day/) e [intervalos](/api/ranges/).

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

**Parâmetros**

```params
- name: value
  type: unknown
  required: true
  description: Qualquer valor a inspecionar.
```

**Retorno**

```returns
type: "'datetime' | 'date' | 'time' | 'duration' | 'yearMonth' | 'monthDay' | 'dateRange' | 'datetimeRange' | 'timeRange' | undefined"
description: Tag de string correspondente ao tipo do valor, ou `undefined` quando `value` não pertence a esta biblioteca.
```
:::

## Type guards

Os type guards verificam símbolos globais de marcação (brands) em vez da identidade do protótipo, funcionando com segurança entre iframes, realms e cópias duplicadas do bundle.

:::entry
### `isDateTime()` :kind[guard]

```js signature
isDateTime(value): value is DateTime
```

Retorna `true` quando o valor é uma instância de [`DateTime`](/api/date-time/), refinando o tipo no TypeScript.

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

Retorna `true` quando o valor é uma instância de [`CalendarDate`](/api/calendar-date/), refinando o tipo no TypeScript.

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

Retorna `true` quando o valor é uma instância de [`Time`](/api/time/), refinando o tipo no TypeScript.

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

Retorna `true` quando o valor é uma instância de [`Duration`](/api/duration/), refinando o tipo no TypeScript.

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

Retorna `true` quando o valor é uma instância de [`YearMonth`](/api/year-month/), refinando o tipo no TypeScript.

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

Retorna `true` quando o valor é uma instância de [`MonthDay`](/api/month-day/), refinando o tipo no TypeScript.

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

Retorna `true` quando o valor é uma instância de [`DateRange`](/api/ranges/#daterange), refinando o tipo no TypeScript.

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

Retorna `true` quando o valor é uma instância de [`DateTimeRange`](/api/ranges/#datetimerange), refinando o tipo no TypeScript.

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

Retorna `true` quando o valor é uma instância de [`TimeRange`](/api/ranges/#timerange), refinando o tipo no TypeScript.

```js
import { isTimeRange, timeRange } from 'native-dates';

isTimeRange(timeRange('9:00am', '5:00pm')); // true
```
:::

## instanceof entre contextos e símbolos de marcação

Verificações padrão com `instanceof` do JavaScript falham entre iframes e cópias duplicadas em bundles. Todas as classes da biblioteca implementam `[Symbol.hasInstance]` sobre um símbolo no registro global, de modo que tanto `instanceof` quanto os type guards funcionam entre contextos de execução.

Você também pode ler diretamente os símbolos de marcação exportados ao escrever serializadores personalizados, matchers de teste ou auxiliares genéricos que aceitam qualquer tipo de intervalo usando `IS_RANGE`:

```js
import { DateTime, IS_DATE_TIME, IS_RANGE, now, timeRange } from 'native-dates';

const current = now();
current instanceof DateTime; // true
Boolean(current[IS_DATE_TIME]); // true

const shift = timeRange('9am', '5pm');
Boolean(shift[IS_RANGE]); // true
```

| Constante | Chave do símbolo global | Corresponde a |
|---|---|---|
| `IS_DATE_TIME` | `Symbol.for('native-dates/DateTime')` | Qualquer instância de `DateTime`. |
| `IS_CALENDAR_DATE` | `Symbol.for('native-dates/CalendarDate')` | Qualquer instância de `CalendarDate`. |
| `IS_TIME` | `Symbol.for('native-dates/Time')` | Qualquer instância de `Time`. |
| `IS_DURATION` | `Symbol.for('native-dates/Duration')` | Qualquer instância de `Duration`. |
| `IS_YEAR_MONTH` | `Symbol.for('native-dates/YearMonth')` | Instâncias de `YearMonth`. |
| `IS_MONTH_DAY` | `Symbol.for('native-dates/MonthDay')` | Instâncias de `MonthDay`. |
| `IS_RANGE` | `Symbol.for('native-dates/Range')` | Instâncias de `DateRange`, `DateTimeRange` e `TimeRange`. |
| `IS_DATE_RANGE` | `Symbol.for('native-dates/DateRange')` | Instâncias de `DateRange`. |
| `IS_DATE_TIME_RANGE` | `Symbol.for('native-dates/DateTimeRange')` | Instâncias de `DateTimeRange`. |
| `IS_TIME_RANGE` | `Symbol.for('native-dates/TimeRange')` | Instâncias de `TimeRange`. |
