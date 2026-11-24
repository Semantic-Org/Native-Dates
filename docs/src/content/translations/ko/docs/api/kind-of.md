---
source: fbe00d55cb93
title: kindOf()
lede: 서로 다른 realm과 중복 번들 환경에서도 native-dates 값의 종류를 식별하고 타입을 좁힙니다.
---

## 값의 종류 읽기

:::entry
### `kindOf()` :kind[function]

```js signature
kindOf(value):
  | 'datetime' | 'date' | 'time' | 'duration'
  | 'yearMonth' | 'monthDay'
  | 'dateRange' | 'datetimeRange' | 'timeRange'
  | undefined
```

값이 속한 타입을 나타내는 문자열 태그를 반환하며, 기본 JavaScript `Date`, 문자열, 숫자, 일반 객체에는 `undefined`를 반환합니다. 시점, 달력 날짜, 시각, 기간, [연월](/api/year-month/)·[월일](/api/month-day/), [범위](/api/ranges/) 값을 모두 식별합니다.

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

**매개변수**

```params
- name: value
  type: unknown
  required: true
  description: "종류를 검사할 임의의 값."
```

**반환값**

```returns
type: "'datetime' | 'date' | 'time' | 'duration' | 'yearMonth' | 'monthDay' | 'dateRange' | 'datetimeRange' | 'timeRange' | undefined"
description: "값의 종류를 나타내는 문자열 태그, 또는 이 라이브러리의 인스턴스가 아닐 때 `undefined`."
```
:::

## 타입 가드

타입 가드는 프로토타입 동일성이 아니라 전역 심볼 브랜드를 검사하므로 서로 다른 realm과 중복 번들에서도 안정적으로 동작합니다.

:::entry
### `isDateTime()` :kind[guard]

```js signature
isDateTime(value): value is DateTime
```

값이 [`DateTime`](/api/date-time/) 인스턴스이면 `true`를 반환하며 TypeScript에서 타입을 좁힙니다.

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

값이 [`CalendarDate`](/api/calendar-date/) 인스턴스이면 `true`를 반환하며 TypeScript에서 타입을 좁힙니다.

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

값이 [`Time`](/api/time/) 인스턴스이면 `true`를 반환하며 TypeScript에서 타입을 좁힙니다.

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

값이 [`Duration`](/api/duration/) 인스턴스이면 `true`를 반환하며 TypeScript에서 타입을 좁힙니다.

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

값이 [`YearMonth`](/api/year-month/) 인스턴스이면 `true`를 반환하며 TypeScript에서 타입을 좁힙니다.

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

값이 [`MonthDay`](/api/month-day/) 인스턴스이면 `true`를 반환하며 TypeScript에서 타입을 좁힙니다.

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

값이 [`DateRange`](/api/ranges/#daterange) 인스턴스이면 `true`를 반환하며 TypeScript에서 타입을 좁힙니다.

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

값이 [`DateTimeRange`](/api/ranges/#datetimerange) 인스턴스이면 `true`를 반환하며 TypeScript에서 타입을 좁힙니다.

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

값이 [`TimeRange`](/api/ranges/#timerange) 인스턴스이면 `true`를 반환하며 TypeScript에서 타입을 좁힙니다.

```js
import { isTimeRange, timeRange } from 'native-dates';

isTimeRange(timeRange('9:00am', '5:00pm')); // true
```
:::

## Realm 간 instanceof와 브랜드 심볼

표준 JavaScript `instanceof` 검사는 iframe 경계나 중복 번들 사본 사이에서 실패합니다. 이 라이브러리의 모든 클래스는 전역 레지스트리 심볼 기반으로 `[Symbol.hasInstance]`를 구현하므로 `instanceof`와 타입 가드 함수 모두 realm 경계를 넘어 동작합니다.

사용자 지정 직렬화기, 테스트 매처 또는 `IS_RANGE`로 모든 범위 종류를 한꺼번에 판별하는 범용 헬퍼를 작성할 때는 패키지에서 내보내는 브랜드 심볼을 직접 읽을 수도 있습니다.

```js
import { DateTime, IS_DATE_TIME, IS_RANGE, now, timeRange } from 'native-dates';

const current = now();
current instanceof DateTime; // true
Boolean(current[IS_DATE_TIME]); // true

const shift = timeRange('9am', '5pm');
Boolean(shift[IS_RANGE]); // true
```

| 상수 | 전역 심볼 키 | 일치 대상 |
|---|---|---|
| `IS_DATE_TIME` | `Symbol.for('native-dates/DateTime')` | 모든 `DateTime` 인스턴스와 일치합니다. |
| `IS_CALENDAR_DATE` | `Symbol.for('native-dates/CalendarDate')` | 모든 `CalendarDate` 인스턴스와 일치합니다. |
| `IS_TIME` | `Symbol.for('native-dates/Time')` | 모든 `Time` 인스턴스와 일치합니다. |
| `IS_DURATION` | `Symbol.for('native-dates/Duration')` | 모든 `Duration` 인스턴스와 일치합니다. |
| `IS_YEAR_MONTH` | `Symbol.for('native-dates/YearMonth')` | `YearMonth` 인스턴스와 일치합니다. |
| `IS_MONTH_DAY` | `Symbol.for('native-dates/MonthDay')` | `MonthDay` 인스턴스와 일치합니다. |
| `IS_RANGE` | `Symbol.for('native-dates/Range')` | `DateRange`, `DateTimeRange`, `TimeRange` 인스턴스와 일치합니다. |
| `IS_DATE_RANGE` | `Symbol.for('native-dates/DateRange')` | `DateRange` 인스턴스와 일치합니다. |
| `IS_DATE_TIME_RANGE` | `Symbol.for('native-dates/DateTimeRange')` | `DateTimeRange` 인스턴스와 일치합니다. |
| `IS_TIME_RANGE` | `Symbol.for('native-dates/TimeRange')` | `TimeRange` 인스턴스와 일치합니다. |
