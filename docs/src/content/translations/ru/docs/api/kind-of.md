---
source: fbe00d55cb93
title: kindOf()
lede: Определение и сужение типов значений native-dates между областями выполнения и копиями бандла.
---

## Определение вида значения

:::entry
### `kindOf()` :kind[function]

```js signature
kindOf(value):
  | 'datetime' | 'date' | 'time' | 'duration'
  | 'yearMonth' | 'monthDay'
  | 'dateRange' | 'datetimeRange' | 'timeRange'
  | undefined
```

Возвращает строковый тег с названием типа, к которому относится значение, или `undefined` для обычных значений JavaScript вроде нативных `Date`, строк, чисел и объектов. Распознаёт моменты времени, календарные даты, время суток, длительности, значения [года и месяца](/api/year-month/) и [месяца и дня](/api/month-day/), а также [диапазоны](/api/ranges/).

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

**Параметры**

```params
- name: value
  type: unknown
  required: true
  description: Любое значение для проверки.
```

**Возвращает**

```returns
type: "'datetime' | 'date' | 'time' | 'duration' | 'yearMonth' | 'monthDay' | 'dateRange' | 'datetimeRange' | 'timeRange' | undefined"
description: Строковый тег вида значения или `undefined`, если `value` создано не этой библиотекой.
```
:::

## Защитники типов

Защитники типов проверяют глобальные символьные метки вместо совпадения прототипов, поэтому надёжно работают между областями выполнения и дублирующимися копиями бандла.

:::entry
### `isDateTime()` :kind[guard]

```js signature
isDateTime(value): value is DateTime
```

Возвращает `true`, если значение — экземпляр [`DateTime`](/api/date-time/), сужая его тип в TypeScript.

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

Возвращает `true`, если значение — экземпляр [`CalendarDate`](/api/calendar-date/), сужая его тип в TypeScript.

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

Возвращает `true`, если значение — экземпляр [`Time`](/api/time/), сужая его тип в TypeScript.

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

Возвращает `true`, если значение — экземпляр [`Duration`](/api/duration/), сужая его тип в TypeScript.

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

Возвращает `true`, если значение — экземпляр [`YearMonth`](/api/year-month/), сужая его тип в TypeScript.

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

Возвращает `true`, если значение — экземпляр [`MonthDay`](/api/month-day/), сужая его тип в TypeScript.

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

Возвращает `true`, если значение — экземпляр [`DateRange`](/api/ranges/#daterange), сужая его тип в TypeScript.

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

Возвращает `true`, если значение — экземпляр [`DateTimeRange`](/api/ranges/#datetimerange), сужая его тип в TypeScript.

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

Возвращает `true`, если значение — экземпляр [`TimeRange`](/api/ranges/#timerange), сужая его тип в TypeScript.

```js
import { isTimeRange, timeRange } from 'native-dates';

isTimeRange(timeRange('9:00am', '5:00pm')); // true
```
:::

## Межконтекстный instanceof и символьные метки

Стандартная проверка `instanceof` в JavaScript перестаёт работать через границы `iframe` и между дублирующимися копиями бандла. Каждый класс библиотеки реализует `[Symbol.hasInstance]` через глобальный реестр символов, поэтому и `instanceof`, и защитники типов работают между областями выполнения.

Экспортированные символьные метки можно читать напрямую при написании собственных сериализаторов, матчеров для тестов или универсальных вспомогательных функций, принимающих любой диапазон через `IS_RANGE`:

```js
import { DateTime, IS_DATE_TIME, IS_RANGE, now, timeRange } from 'native-dates';

const current = now();
current instanceof DateTime; // true
Boolean(current[IS_DATE_TIME]); // true

const shift = timeRange('9am', '5pm');
Boolean(shift[IS_RANGE]); // true
```

| Константа | Ключ глобального символа | Соответствует |
|---|---|---|
| `IS_DATE_TIME` | `Symbol.for('native-dates/DateTime')` | Любому экземпляру DateTime. |
| `IS_CALENDAR_DATE` | `Symbol.for('native-dates/CalendarDate')` | Любому экземпляру CalendarDate. |
| `IS_TIME` | `Symbol.for('native-dates/Time')` | Любому экземпляру Time. |
| `IS_DURATION` | `Symbol.for('native-dates/Duration')` | Любому экземпляру Duration. |
| `IS_YEAR_MONTH` | `Symbol.for('native-dates/YearMonth')` | Экземплярам YearMonth. |
| `IS_MONTH_DAY` | `Symbol.for('native-dates/MonthDay')` | Экземплярам MonthDay. |
| `IS_RANGE` | `Symbol.for('native-dates/Range')` | Экземплярам DateRange, DateTimeRange и TimeRange. |
| `IS_DATE_RANGE` | `Symbol.for('native-dates/DateRange')` | Экземплярам DateRange. |
| `IS_DATE_TIME_RANGE` | `Symbol.for('native-dates/DateTimeRange')` | Экземплярам DateTimeRange. |
| `IS_TIME_RANGE` | `Symbol.for('native-dates/TimeRange')` | Экземплярам TimeRange. |
