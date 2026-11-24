---
source: "fbe00d55cb93"
title: kindOf()
lede: レルムや重複バンドルをまたいで、native-dates の値を判別し型を絞り込みます。
---

## 値の種類の判別

:::entry
### `kindOf()` :kind[function]

```js signature
kindOf(value):
  | 'datetime' | 'date' | 'time' | 'duration'
  | 'yearMonth' | 'monthDay'
  | 'dateRange' | 'datetimeRange' | 'timeRange'
  | undefined
```

値が属する型を表す文字列タグを返します。標準の `Date`、文字列、数値、オブジェクトなどプレーンな JavaScript 値には `undefined` を返します。日時、日付、時刻、期間、[年月](/api/year-month/)、[月日](/api/month-day/)、および[範囲](/api/ranges/)を判別できます。

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

**引数**

```params
- name: value
  type: unknown
  required: true
  description: 検査対象の任意の値。
```

**戻り値**

```returns
type: "'datetime' | 'date' | 'time' | 'duration' | 'yearMonth' | 'monthDay' | 'dateRange' | 'datetimeRange' | 'timeRange' | undefined"
description: "値の種類を表す文字列タグ。`value` がこのライブラリの値でない場合は `undefined`。"
```
:::

## 型ガード

各型ガードはプロトタイプの一致ではなくグローバルなブランドシンボルを検査するため、レルムをまたいだりバンドルが重複したりしても確実に動作します。

:::entry
### `isDateTime()` :kind[guard]

```js signature
isDateTime(value): value is DateTime
```

値が [`DateTime`](/api/date-time/) のインスタンスであれば `true` を返し、TypeScript の型を絞り込みます。

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

値が [`CalendarDate`](/api/calendar-date/) のインスタンスであれば `true` を返し、TypeScript の型を絞り込みます。

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

値が [`Time`](/api/time/) のインスタンスであれば `true` を返し、TypeScript の型を絞り込みます。

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

値が [`Duration`](/api/duration/) のインスタンスであれば `true` を返し、TypeScript の型を絞り込みます。

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

値が [`YearMonth`](/api/year-month/) のインスタンスであれば `true` を返し、TypeScript の型を絞り込みます。

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

値が [`MonthDay`](/api/month-day/) のインスタンスであれば `true` を返し、TypeScript の型を絞り込みます。

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

値が [`DateRange`](/api/ranges/#daterange) のインスタンスであれば `true` を返し、TypeScript の型を絞り込みます。

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

値が [`DateTimeRange`](/api/ranges/#datetimerange) のインスタンスであれば `true` を返し、TypeScript の型を絞り込みます。

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

値が [`TimeRange`](/api/ranges/#timerange) のインスタンスであれば `true` を返し、TypeScript の型を絞り込みます。

```js
import { isTimeRange, timeRange } from 'native-dates';

isTimeRange(timeRange('9:00am', '5:00pm')); // true
```
:::

## レルムをまたぐ instanceof とブランドシンボル

JavaScript 標準の `instanceof` チェックは、iframe の境界や重複してバンドルされたコピーをまたぐと失敗します。このライブラリの全クラスはグローバルレジストリのシンボルを使って `[Symbol.hasInstance]` を実装しているため、`instanceof` と型ガード関数のどちらもレルムをまたいで動作します。

カスタムシリアライザーやテストマッチャー、`IS_RANGE` で任意の範囲型を一括判定する汎用ヘルパーを書く際には、エクスポートされたブランドシンボルを直接参照できます。

```js
import { DateTime, IS_DATE_TIME, IS_RANGE, now, timeRange } from 'native-dates';

const current = now();
current instanceof DateTime; // true
Boolean(current[IS_DATE_TIME]); // true

const shift = timeRange('9am', '5pm');
Boolean(shift[IS_RANGE]); // true
```

| 定数 | グローバルシンボルキー | 一致対象 |
|---|---|---|
| `IS_DATE_TIME` | `Symbol.for('native-dates/DateTime')` | すべての `DateTime` インスタンスに一致します。 |
| `IS_CALENDAR_DATE` | `Symbol.for('native-dates/CalendarDate')` | すべての `CalendarDate` インスタンスに一致します。 |
| `IS_TIME` | `Symbol.for('native-dates/Time')` | すべての `Time` インスタンスに一致します。 |
| `IS_DURATION` | `Symbol.for('native-dates/Duration')` | すべての `Duration` インスタンスに一致します。 |
| `IS_YEAR_MONTH` | `Symbol.for('native-dates/YearMonth')` | `YearMonth` インスタンスに一致します。 |
| `IS_MONTH_DAY` | `Symbol.for('native-dates/MonthDay')` | `MonthDay` インスタンスに一致します。 |
| `IS_RANGE` | `Symbol.for('native-dates/Range')` | `DateRange`、`DateTimeRange`、`TimeRange` のインスタンスに一致します。 |
| `IS_DATE_RANGE` | `Symbol.for('native-dates/DateRange')` | `DateRange` インスタンスに一致します。 |
| `IS_DATE_TIME_RANGE` | `Symbol.for('native-dates/DateTimeRange')` | `DateTimeRange` インスタンスに一致します。 |
| `IS_TIME_RANGE` | `Symbol.for('native-dates/TimeRange')` | `TimeRange` インスタンスに一致します。 |
