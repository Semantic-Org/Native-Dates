---
source: "fbe00d55cb93"
title: kindOf()
lede: 跨 Realm 与多份打包副本识别并收窄 native-dates 值的类型。
---

## 读取值的类型标签

:::entry
### `kindOf()` :kind[function]

```js signature
kindOf(value):
  | 'datetime' | 'date' | 'time' | 'duration'
  | 'yearMonth' | 'monthDay'
  | 'dateRange' | 'datetimeRange' | 'timeRange'
  | undefined
```

返回标明值所属类型的字符串标签；对于原生 `Date`、字符串、数字和普通对象等 JavaScript 值则返回 `undefined`。可识别具体时刻、日历日期、时钟时间、时长、[年月](/api/year-month/)、[月日](/api/month-day/)以及[范围](/api/ranges/)。

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

**参数**

```params
- name: value
  type: unknown
  required: true
  description: 要检查的任意值。
```

**返回值**

```returns
type: "'datetime' | 'date' | 'time' | 'duration' | 'yearMonth' | 'monthDay' | 'dateRange' | 'datetimeRange' | 'timeRange' | undefined"
description: "表示值类型的字符串标签；当 `value` 不属于本库时返回 `undefined`。"
```
:::

## 类型守卫

类型守卫通过全局符号标识而非原型链来判断类型，因此在跨 Realm 和多份打包副本场景下同样可靠。

:::entry
### `isDateTime()` :kind[guard]

```js signature
isDateTime(value): value is DateTime
```

当值为 [`DateTime`](/api/date-time/) 实例时返回 `true`，并在 TypeScript 中收窄其类型。

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

当值为 [`CalendarDate`](/api/calendar-date/) 实例时返回 `true`，并在 TypeScript 中收窄其类型。

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

当值为 [`Time`](/api/time/) 实例时返回 `true`，并在 TypeScript 中收窄其类型。

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

当值为 [`Duration`](/api/duration/) 实例时返回 `true`，并在 TypeScript 中收窄其类型。

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

当值为 [`YearMonth`](/api/year-month/) 实例时返回 `true`，并在 TypeScript 中收窄其类型。

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

当值为 [`MonthDay`](/api/month-day/) 实例时返回 `true`，并在 TypeScript 中收窄其类型。

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

当值为 [`DateRange`](/api/ranges/#daterange) 实例时返回 `true`，并在 TypeScript 中收窄其类型。

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

当值为 [`DateTimeRange`](/api/ranges/#datetimerange) 实例时返回 `true`，并在 TypeScript 中收窄其类型。

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

当值为 [`TimeRange`](/api/ranges/#timerange) 实例时返回 `true`，并在 TypeScript 中收窄其类型。

```js
import { isTimeRange, timeRange } from 'native-dates';

isTimeRange(timeRange('9:00am', '5:00pm')); // true
```
:::

## 跨 Realm 的 instanceof 与符号标识

标准的 JavaScript `instanceof` 检查在跨越 iframe 边界或存在重复打包副本时会失效。本库中的每个类都基于全局符号注册表实现了 `[Symbol.hasInstance]`，因此 `instanceof` 与各类型守卫函数均可跨 Realm 正常工作。

编写自定义序列化器、测试匹配器，或需要通过 `IS_RANGE` 匹配任意范围类型的通用辅助函数时，也可以直接读取导出的符号标识：

```js
import { DateTime, IS_DATE_TIME, IS_RANGE, now, timeRange } from 'native-dates';

const current = now();
current instanceof DateTime; // true
Boolean(current[IS_DATE_TIME]); // true

const shift = timeRange('9am', '5pm');
Boolean(shift[IS_RANGE]); // true
```

| 常量 | 全局符号键 | 匹配类型 |
|---|---|---|
| `IS_DATE_TIME` | `Symbol.for('native-dates/DateTime')` | 匹配任意 `DateTime` 实例。 |
| `IS_CALENDAR_DATE` | `Symbol.for('native-dates/CalendarDate')` | 匹配任意 `CalendarDate` 实例。 |
| `IS_TIME` | `Symbol.for('native-dates/Time')` | 匹配任意 `Time` 实例。 |
| `IS_DURATION` | `Symbol.for('native-dates/Duration')` | 匹配任意 `Duration` 实例。 |
| `IS_YEAR_MONTH` | `Symbol.for('native-dates/YearMonth')` | 匹配 `YearMonth` 实例。 |
| `IS_MONTH_DAY` | `Symbol.for('native-dates/MonthDay')` | 匹配 `MonthDay` 实例。 |
| `IS_RANGE` | `Symbol.for('native-dates/Range')` | 匹配 `DateRange`、`DateTimeRange` 与 `TimeRange` 实例。 |
| `IS_DATE_RANGE` | `Symbol.for('native-dates/DateRange')` | 匹配 `DateRange` 实例。 |
| `IS_DATE_TIME_RANGE` | `Symbol.for('native-dates/DateTimeRange')` | 匹配 `DateTimeRange` 实例。 |
| `IS_TIME_RANGE` | `Symbol.for('native-dates/TimeRange')` | 匹配 `TimeRange` 实例。 |
