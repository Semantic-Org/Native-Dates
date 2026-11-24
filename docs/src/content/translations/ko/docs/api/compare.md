---
source: a03fe5ee9f3b
title: compare()
lede: 날짜, 시점, 시각, 기간, 범위 값을 정렬하고 최솟값과 최댓값을 구합니다.
---

## 정렬과 순서 비교

:::entry
### `compare()` :kind[function]

```js signature
compare(a, b): -1 | 0 | 1
```

같은 종류의 두 값을 `Array.prototype.sort()`에 맞게 비교해 음수, 0, 양수를 반환합니다. 시점, 유닉스 에포크 타임스탬프, 달력 날짜, 시각, 기간, [연월](/api/year-month/), [범위](/api/ranges/) 모두에 사용할 수 있습니다.

두 인자 중 어느 쪽이든 원시 ISO 문자열, 기본 JavaScript `Date` 또는 유닉스 에포크 밀리초 타임스탬프를 전달할 수 있습니다. 시각(`Time`)과 비교할 때 숫자는 시(hour)로 해석되며, 서로 다른 종류의 값을 비교하면 `TypeError`를 던집니다.

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

**매개변수**

```params
- name: a
  type: Point | Duration | YearMonth | Range
  required: true
  description: "비교할 첫 번째 타입 인스턴스, ISO 문자열, `Date` 또는 유닉스 에포크 밀리초 타임스탬프."
- name: b
  type: Point | Duration | YearMonth | Range
  required: true
  description: "같은 종류의 두 번째 값 또는 `a`와 호환되는 원시 입력."
```

**반환값**

```returns
type: -1 | 0 | 1
description: "첫 번째 값이 더 빠르면 `-1`, 같으면 `0`, 더 늦으면 `1`."
```

같은 종류의 범위는 시작점을 먼저 비교하고, 시작점이 같으면 종료점으로 순서를 정합니다.

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

:::note[서로 다른 시간대의 시점 비교]
`compare()`는 [`DateTime`](/api/date-time/)을 현지 시계 숫자가 아니라 실제 절대 시점으로 비교합니다. 같은 날 뉴욕의 오전 9시 회의가 로스앤젤레스의 오전 8시 회의보다 먼저 정렬됩니다.
:::

## 경계값 선택

여러 달력 날짜, 시점, 시각 또는 [`YearMonth`](/api/year-month/) 값 중에서 최솟값이나 최댓값을 구합니다. 두 헬퍼 모두 가변 인자나 비어 있지 않은 배열 하나를 받습니다.

:::entry
### `earliest()` :kind[function]

```js signature
earliest(...points): DateTime | CalendarDate | Time | YearMonth
earliest(points): DateTime | CalendarDate | Time | YearMonth
```

하나 이상의 인자 또는 같은 종류의 비어 있지 않은 배열에서 가장 이른 값을 반환하며, 기본 JavaScript `Date` 객체나 유닉스 에포크 밀리초 입력은 [`DateTime`](/api/date-time/)으로 변환합니다. 빈 배열을 전달하면 `RangeError`를 던집니다.

**매개변수**

```params
- name: points
  type: Point[] | YearMonth[]
  required: true
  description: "같은 종류의 달력 날짜, 시점, 유닉스 에포크 타임스탬프, 시각 또는 연월 하나 이상."
```

**반환값**

```returns
type: DateTime | CalendarDate | Time | YearMonth
description: "가장 앞선 값. 같은 시점이 여러 개면 목록에서 먼저 나온 항목을 유지합니다."
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

하나 이상의 인자 또는 같은 종류의 비어 있지 않은 배열에서 가장 늦은 값을 반환합니다. 빈 배열을 전달하면 `RangeError`를 던집니다.

**매개변수**

```params
- name: points
  type: Point[] | YearMonth[]
  required: true
  description: "같은 종류의 달력 날짜, 시점, 시각 또는 연월 하나 이상."
```

**반환값**

```returns
type: DateTime | CalendarDate | Time | YearMonth
description: "가장 늦은 값. 같은 시점이 여러 개면 목록에서 먼저 나온 항목을 유지합니다."
```

[`earliest()`](#earliest)와 `latest()`를 조합하면 두 경계 밖의 값을 범위 끝으로 보정할 수 있습니다.

```js
import { date, earliest, latest } from 'native-dates';

const minDate = date('2026-11-01');
const maxDate = date('2026-11-30');
const picked = date('2026-12-12');

const clamped = earliest(maxDate, latest(minDate, picked));
clamped.toString(); // '2026-11-30'
```
:::
