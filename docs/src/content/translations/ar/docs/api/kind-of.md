---
source: fbe00d55cb93
title: kindOf()
lede: التعرّف على قيم native-dates وتضييق أنواعها عبر سياقات التنفيذ ونسخ الحزم المتعددة.
---

## قراءة نوع القيمة

:::entry
### `kindOf()` :kind[function]

```js signature
kindOf(value):
  | 'datetime' | 'date' | 'time' | 'duration'
  | 'yearMonth' | 'monthDay'
  | 'dateRange' | 'datetimeRange' | 'timeRange'
  | undefined
```

تُرجع وسمًا نصيًا يسمّي النوع الذي تنتمي إليه القيمة، أو `undefined` لقيم JavaScript العادية مثل كائنات `Date` الأصلية والسلاسل والأعداد والكائنات. تميّز اللحظات الزمنية والتواريخ والأوقات والمدد وقيم [السنة والشهر](/api/year-month/) و[الشهر واليوم](/api/month-day/) و[النطاقات](/api/ranges/).

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

**المعاملات**

```params
- name: value
  type: unknown
  required: true
  description: أي قيمة مطلوب فحص نوعها.
```

**القيمة المُرجَعة**

```returns
type: "'datetime' | 'date' | 'time' | 'duration' | 'yearMonth' | 'monthDay' | 'dateRange' | 'datetimeRange' | 'timeRange' | undefined"
description: وسم نصي يحدّد نوع القيمة، أو `undefined` عندما لا تنتمي `value` إلى هذه المكتبة.
```
:::

## حارسات الأنواع

تفحص حارسات الأنواع وسوم الرموز العالمية بدلًا من هوية النموذج الأولي (prototype)، فتعمل بموثوقية عبر سياقات التنفيذ ونسخ الحزم المكرّرة.

:::entry
### `isDateTime()` :kind[guard]

```js signature
isDateTime(value): value is DateTime
```

تُرجع `true` عندما تكون القيمة كائن [`DateTime`](/api/date-time/)، وتضيّق نوعها في TypeScript.

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

تُرجع `true` عندما تكون القيمة كائن [`CalendarDate`](/api/calendar-date/)، وتضيّق نوعها في TypeScript.

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

تُرجع `true` عندما تكون القيمة كائن [`Time`](/api/time/)، وتضيّق نوعها في TypeScript.

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

تُرجع `true` عندما تكون القيمة كائن [`Duration`](/api/duration/)، وتضيّق نوعها في TypeScript.

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

تُرجع `true` عندما تكون القيمة كائن [`YearMonth`](/api/year-month/)، وتضيّق نوعها في TypeScript.

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

تُرجع `true` عندما تكون القيمة كائن [`MonthDay`](/api/month-day/)، وتضيّق نوعها في TypeScript.

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

تُرجع `true` عندما تكون القيمة كائن [`DateRange`](/api/ranges/#daterange)، وتضيّق نوعها في TypeScript.

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

تُرجع `true` عندما تكون القيمة كائن [`DateTimeRange`](/api/ranges/#datetimerange)، وتضيّق نوعها في TypeScript.

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

تُرجع `true` عندما تكون القيمة كائن [`TimeRange`](/api/ranges/#timerange)، وتضيّق نوعها في TypeScript.

```js
import { isTimeRange, timeRange } from 'native-dates';

isTimeRange(timeRange('9:00am', '5:00pm')); // true
```
:::

## العامل instanceof والوسوم عبر سياقات التنفيذ

تفشل فحوصات `instanceof` القياسية في JavaScript عبر حدود `iframe` ونسخ الحزم المكرّرة. يطبّق كل صنف هنا `[Symbol.hasInstance]` فوق رمز في السجل العالمي، فيعمل كل من `instanceof` ودوال الحراسة عبر سياقات التنفيذ (realms).

يمكنك أيضًا قراءة رموز الوسوم المُصدَّرة مباشرة عند كتابة دوال تحويل نصي مخصّصة (serializers)، أو مطابقات اختبارات، أو دوال مساعدة عامة تطابق أي نوع من النطاقات عبر `IS_RANGE`:

```js
import { DateTime, IS_DATE_TIME, IS_RANGE, now, timeRange } from 'native-dates';

const current = now();
current instanceof DateTime; // true
Boolean(current[IS_DATE_TIME]); // true

const shift = timeRange('9am', '5pm');
Boolean(shift[IS_RANGE]); // true
```

| الثابت | مفتاح الرمز العالمي | ما يطابقه |
|---|---|---|
| `IS_DATE_TIME` | `Symbol.for('native-dates/DateTime')` | يطابق أي كائن `DateTime`. |
| `IS_CALENDAR_DATE` | `Symbol.for('native-dates/CalendarDate')` | يطابق أي كائن `CalendarDate`. |
| `IS_TIME` | `Symbol.for('native-dates/Time')` | يطابق أي كائن `Time`. |
| `IS_DURATION` | `Symbol.for('native-dates/Duration')` | يطابق أي كائن `Duration`. |
| `IS_YEAR_MONTH` | `Symbol.for('native-dates/YearMonth')` | يطابق كائنات `YearMonth`. |
| `IS_MONTH_DAY` | `Symbol.for('native-dates/MonthDay')` | يطابق كائنات `MonthDay`. |
| `IS_RANGE` | `Symbol.for('native-dates/Range')` | يطابق كائنات `DateRange` و`DateTimeRange` و`TimeRange`. |
| `IS_DATE_RANGE` | `Symbol.for('native-dates/DateRange')` | يطابق كائنات `DateRange`. |
| `IS_DATE_TIME_RANGE` | `Symbol.for('native-dates/DateTimeRange')` | يطابق كائنات `DateTimeRange`. |
| `IS_TIME_RANGE` | `Symbol.for('native-dates/TimeRange')` | يطابق كائنات `TimeRange`. |
