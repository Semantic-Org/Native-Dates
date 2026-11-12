---
title: kindOf()
kind: function
lede: Identify and narrow native-dates values across realms and bundle copies.
import: import { kindOf, isDateTime } from 'native-dates'
size: core
updated: 2026-11-12
---

## Reading a value's kind

:::entry
### `kindOf()` :kind[function]

```js signature
kindOf(value):
  | 'datetime' | 'date' | 'time' | 'duration'
  | 'dateRange' | 'datetimeRange' | 'timeRange'
  | undefined
```

Returns a string tag naming which type a value belongs to, or `undefined` for plain JavaScript values such as native dates, strings, numbers, and objects. Also identifies range instances when [`@native-dates/plugins/ranges`](/plugins/ranges/) is loaded.

```js title="inspect.js"
import { date, hours, kindOf, now, time } from 'native-dates';
import { dateRange } from '@native-dates/plugins/ranges';

kindOf(now()); // 'datetime'
kindOf(date('2026-11-16')); // 'date'
kindOf(time('9:30am')); // 'time'
kindOf(hours(2)); // 'duration'
kindOf(dateRange('2026-11-01', '2026-11-07')); // 'dateRange'
kindOf(new Date()); // undefined
```

**Parameters**

```params
- name: value
  type: unknown
  required: true
  description: Any value to inspect.
```

**Returns**

```returns
type: "'datetime' | 'date' | 'time' | 'duration' | 'dateRange' | 'datetimeRange' | 'timeRange' | undefined"
description: String tag for the value's kind, or `undefined` when `value` is not from this library.
```
:::

## Type guards

Type guards check global symbol brands rather than prototype identity. Guards for range types are exported by [`@native-dates/plugins/ranges`](/plugins/ranges/).

:::entry
### `isDateTime()` :kind[guard]

```js signature
isDateTime(value): value is DateTime
```

Returns true when the value is a [`DateTime`](/api/date-time/) instance, narrowing its type in TypeScript.

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

Returns true when the value is a [`CalendarDate`](/api/calendar-date/) instance, narrowing its type in TypeScript.

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

Returns true when the value is a [`Time`](/api/time/) instance, narrowing its type in TypeScript.

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

Returns true when the value is a [`Duration`](/api/duration/) instance, narrowing its type in TypeScript.

```js
import { hours, isDuration } from 'native-dates';

isDuration(hours(2)); // true
```
:::

## Cross-realm instanceof and brands

Standard JavaScript `instanceof` checks fail across iframe boundaries and duplicate bundled copies. Every class here implements `[Symbol.hasInstance]` over a global registry symbol, so both `instanceof` and the guard functions work across realms.

You can also read the exported brand symbols directly when writing custom serializers, test matchers, or generic helpers that detect ranges without importing the ranges plugin:

```js
import { DateTime, IS_DATE_TIME, IS_RANGE, now } from 'native-dates';
import { timeRange } from '@native-dates/plugins/ranges';

const current = now();
current instanceof DateTime; // true
Boolean(current[IS_DATE_TIME]); // true

const shift = timeRange('9am', '5pm');
Boolean(shift[IS_RANGE]); // true
```

| Constant | Global symbol key | Matches |
|---|---|---|
| `IS_DATE_TIME` | `Symbol.for('native-dates/DateTime')` | Matches any DateTime instance. |
| `IS_CALENDAR_DATE` | `Symbol.for('native-dates/CalendarDate')` | Matches any CalendarDate instance. |
| `IS_TIME` | `Symbol.for('native-dates/Time')` | Matches any Time instance. |
| `IS_DURATION` | `Symbol.for('native-dates/Duration')` | Matches any Duration instance. |
| `IS_RANGE` | `Symbol.for('native-dates/Range')` | Matches DateRange, DateTimeRange, and TimeRange instances. |
| `IS_DATE_RANGE` | `Symbol.for('native-dates/DateRange')` | Matches DateRange instances. |
| `IS_DATE_TIME_RANGE` | `Symbol.for('native-dates/DateTimeRange')` | Matches DateTimeRange instances. |
| `IS_TIME_RANGE` | `Symbol.for('native-dates/TimeRange')` | Matches TimeRange instances. |
