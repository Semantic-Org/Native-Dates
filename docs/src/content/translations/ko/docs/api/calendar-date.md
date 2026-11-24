---
source: df57e2243cc3
title: CalendarDate
lede: 시각과 시간대 정보가 없는 달력 날짜.
---

## CalendarDate 생성

[`date()`](/api/date-fn/)에 ISO 문자열, 연·월·일 숫자, 또는 기존 값을 전달해 인스턴스를 생성하거나, [`today()`](/api/date-fn/#today)로 오늘 날짜를 읽습니다. [`tomorrow()`](/api/date-fn/#tomorrow)와 [`yesterday()`](/api/date-fn/#yesterday) 헬퍼도 같은 방식으로 동작하며, 모든 메서드는 원본 값을 변경하지 않는 불변 인스턴스를 반환합니다.

```js title="create.js"
import { date, today, tomorrow } from 'native-dates';

const birthday = date('2026-05-10');
const launch = date(2026, 11, 16);
const current = today();
const nextDay = tomorrow('America/New_York');
```

달력 날짜에는 시각과 시간대가 없으므로 5월 10일은 사용자가 어느 지역에 있든 똑같이 5월 10일로 유지됩니다. 임의의 [`DateTime`](/api/date-time/)에서 현지 달력 날짜를 바로 읽을 수도 있습니다.

```js
import { datetime } from 'native-dates';

const flight = datetime('2026-11-16T23:30:00Z', 'Asia/Tokyo');
flight.date.toString(); // '2026-11-17'
```

## 프로퍼티

프로퍼티는 ISO 달력 필드를 직접 읽습니다.

| 프로퍼티 | 타입 | 설명 |
|---|---|---|
| `text` | `string` | 로케일에 맞춰 포맷한 달력 날짜(예: `'Nov 16, 2026'`). |
| `year`, `month`, `day` | `number` | 달력 연도, 월(1–12), 일(1–31). |
| `yearMonth` | [`YearMonth`](/api/year-month/) | 일을 제외한 달력 연월. |
| `monthDay` | [`MonthDay`](/api/month-day/) | 연도를 제외한 달력 월일. |
| `dayOfWeek` | `number` | ISO 요일 번호(월요일 1부터 일요일 7까지). |
| `weekStart` | `number` | [`configure()`](/api/configure/) 설정 또는 인스턴스 로케일을 따르는 주 시작 요일 번호(1–7). |
| `quarter` | `number` | 달력 분기(1–4). |
| `weekOfYear`, `dayOfYear` | `number` | ISO 주차(1–53)와 연중 몇 번째 날(1–366). |
| `daysInMonth`, `daysInYear` | `number` | 현재 월의 일수(28–31)와 연도의 일수(365 또는 366). |

## 결합과 필드

특정 시간대의 시각을 결합해 시점을 만들거나 개별 달력 필드를 바꿉니다.

:::entry
### `at()` :kind[method]

```js signature
d.at(time?, zone?): DateTime
```

이 달력 날짜에 특정 시간대의 시각을 결합해 [`DateTime`](/api/date-time/)을 반환합니다. 시각을 생략하면 하루의 시작인 자정(`00:00`)을 기본값으로 사용합니다.

**매개변수**

```params
- name: time
  type: TimeInput
  default: "'00:00'"
  description: "`'9:30am'` 같은 시각 문자열, `Time` 인스턴스, 필드 객체, 또는 `Date`."
- name: zone
  type: Zone
  description: "IANA 시간대 이름, 고정 UTC 오프셋, 또는 `'UTC'`. 생략하면 설정된 기본 시간대를 사용합니다."
```

**반환값**

```returns
type: DateTime
description: "`zone`에서 이 날짜의 `time` 시각을 나타내는 새 `DateTime`."
```

```js
const day = date('2026-11-16');

day.at('9:30am', 'America/Los_Angeles').toString(); // '2026-11-16T17:30:00.000Z'
day.at(undefined, 'UTC').toString(); // '2026-11-16T00:00:00.000Z'
```
:::

:::entry
### `set()` :kind[method]

```js signature
d.set(fields): CalendarDate
d.set(unit, value): CalendarDate
```

하나 이상의 달력 필드를 바꾼 새 `CalendarDate`를 반환합니다. 2월 30일처럼 존재하지 않는 날짜는 다음 달로 넘어가는 대신 `RangeError`를 던집니다. `day` 없이 `month`나 `year`만 변경할 때 일자가 대상 월의 말일을 넘으면 말일로 보정합니다.

**매개변수**

```params
- name: fields
  type: DateTimeFields | DateUnit
  required: true
  description: "`year`, `month`, `day` 필드를 담은 객체, 또는 영어 달력 단위명 하나."
- name: value
  type: number
  description: "지정한 `unit`에 설정할 정수 값."
```

**반환값**

```returns
type: CalendarDate
description: "달력 필드가 갱신된 새 `CalendarDate`."
```

```js
const due = date('2026-11-16');

due.set('day', 1).toString(); // '2026-11-01'
due.set({ month: 12, day: 31 }).toString(); // '2026-12-31'
```
:::

## 연산과 경계 이동

달력 단위로 날짜를 이동하거나, 단위 경계로 맞추거나, 가까운 요일로 건너뜁니다. 달력 날짜에는 시각이 없으므로 시·분 같은 시각 단위를 전달하면 `RangeError`를 던집니다.

:::note[말일로 보정]
월이나 연을 더할 때 대상 월에 없는 일자가 나오면 다음 달로 넘어가지 않고 해당 월의 말일로 보정합니다. 예를 들어 1월 31일에 1개월을 더하면 평년은 2월 28일, 윤년은 2월 29일이 됩니다.
:::

:::entry
### `plus()` :kind[method]

```js signature
d.plus(amount, unit?): CalendarDate
d.add(amount, unit?): CalendarDate
```

연·분기·월·주·일 단위로 앞으로 이동한 새 `CalendarDate`를 반환합니다. `add()` 별칭도 사용할 수 있습니다.

**매개변수**

```params
- name: amount
  type: DurationInput
  required: true
  description: "`unit`과 함께 쓰는 숫자, `Duration` 인스턴스, 영어 기간 문자열, 또는 필드 객체."
- name: unit
  type: DateUnit
  description: "`amount`가 숫자일 때 사용하는 영어 달력 단위명(예: `'days'`, `'months'`)."
```

**반환값**

```returns
type: CalendarDate
description: "달력에서 앞으로 이동한 새 `CalendarDate`."
```

```js
const billing = date('2026-01-31');

billing.plus(1, 'month').toString(); // '2026-02-28'
billing.plus('2 weeks').toString(); // '2026-02-14'
```
:::

:::entry
### `minus()` :kind[method]

```js signature
d.minus(amount, unit?): CalendarDate
d.subtract(amount, unit?): CalendarDate
```

달력 기간만큼 뒤로 이동합니다. [`plus()`](#plus)와 동일한 입력을 받으며 `subtract()` 별칭도 제공합니다.

**매개변수**

```params
- name: amount
  type: DurationInput
  required: true
  description: "`unit`과 함께 쓰는 숫자, `Duration` 인스턴스, 영어 기간 문자열, 또는 필드 객체."
- name: unit
  type: DateUnit
  description: "`amount`가 숫자일 때 사용하는 영어 달력 단위명."
```

**반환값**

```returns
type: CalendarDate
description: "달력에서 뒤로 이동한 새 `CalendarDate`."
```

```js
const launch = date('2026-03-01');

launch.minus(1, 'day').toString(); // '2026-02-28'
launch.minus({ weeks: 2, days: 1 }).toString(); // '2026-02-14'
```
:::

:::entry
### `startOf()` :kind[method]

```js signature
d.startOf(unit, firstDay?): CalendarDate
```

이 날짜가 속한 달력 단위의 첫날을 반환합니다. 주 경계는 `firstDay`, [`configure()`](/api/configure/)의 `weekStart`, 또는 이 날짜에 설정된 로케일 순서로 결정됩니다.

**매개변수**

```params
- name: unit
  type: DateUnit
  required: true
  description: "`'year'`부터 `'day'`까지의 영어 달력 단위명."
- name: firstDay
  type: DayOfWeek
  description: "주 단위로 맞출 때 주의 첫 요일을 지정하는 영어 요일명 또는 ISO 요일 번호(예: `'sunday'`, `7`)."
```

**반환값**

```returns
type: CalendarDate
description: "`unit`의 첫 달력 날짜."
```

```js
const wed = date('2026-11-18', { locale: 'en-US' });

wed.startOf('month').toString(); // '2026-11-01'
wed.startOf('quarter').toString(); // '2026-10-01'
wed.startOf('week').toString(); // '2026-11-15'
wed.startOf('week', 'monday').toString(); // '2026-11-16'
```
:::

:::entry
### `endOf()` :kind[method]

```js signature
d.endOf(unit, firstDay?): CalendarDate
```

이 날짜가 속한 달력 단위의 마지막 날을 반환합니다.

**매개변수**

```params
- name: unit
  type: DateUnit
  required: true
  description: "`'year'`부터 `'day'`까지의 영어 달력 단위명."
- name: firstDay
  type: DayOfWeek
  description: "`unit`이 `'week'`일 때 주의 첫 요일을 지정하는 영어 요일명 또는 ISO 요일 번호."
```

**반환값**

```returns
type: CalendarDate
description: "`unit`의 마지막 달력 날짜."
```

```js
date('2026-02-10').endOf('month').toString(); // '2026-02-28'
date('2028-02-10').endOf('month').toString(); // '2028-02-29'
```
:::

:::entry
### `startOfNext()` :kind[method]

```js signature
d.startOfNext(unit, firstDay?): CalendarDate
```

이 날짜가 속한 달력 단위 바로 다음 단위의 첫날을 반환합니다. 결과는 항상 이 날짜보다 뒤 날짜이므로 12월 1일에서 다음 달을 구하면 1월 1일이 됩니다.

단위명 대신 영어 요일명을 전달하면 해당 요일의 다음 날짜를 반환하며, 이는 [`next()`](#next)와 같은 날짜입니다.

**매개변수**

```params
- name: unit
  type: DateUnit | Exclude<DayOfWeek, number>
  required: true
  description: "`'year'`부터 `'day'`까지의 영어 달력 단위명, 또는 `'wednesday'` 같은 영어 요일명."
- name: firstDay
  type: DayOfWeek
  description: "`unit`이 `'week'`일 때 주의 첫 요일을 지정하는 영어 요일명 또는 ISO 요일 번호."
```

**반환값**

```returns
type: CalendarDate
description: "다음 `unit`의 첫 달력 날짜, 또는 다음 지정 요일의 날짜."
```

```js
const mon = date('2026-11-16', { locale: 'en-US' });

mon.startOfNext('month').toString(); // '2026-12-01'
mon.startOfNext('quarter').toString(); // '2027-01-01'
mon.startOfNext('week').toString(); // '2026-11-22'
mon.startOfNext('wednesday').toString(); // '2026-11-18'
```
:::

:::entry
### `startOfPrevious()` :kind[method]

```js signature
d.startOfPrevious(unit, firstDay?): CalendarDate
```

이 날짜가 속한 달력 단위 바로 이전 단위의 첫날을 반환합니다. 단위명 대신 영어 요일명을 전달하면 [`previous()`](#previous)와 마찬가지로 해당 요일의 직전 날짜를 반환합니다.

**매개변수**

```params
- name: unit
  type: DateUnit | Exclude<DayOfWeek, number>
  required: true
  description: "`'year'`부터 `'day'`까지의 영어 달력 단위명, 또는 `'wednesday'` 같은 영어 요일명."
- name: firstDay
  type: DayOfWeek
  description: "`unit`이 `'week'`일 때 주의 첫 요일을 지정하는 영어 요일명 또는 ISO 요일 번호."
```

**반환값**

```returns
type: CalendarDate
description: "이전 `unit`의 첫 달력 날짜, 또는 이전 지정 요일의 날짜."
```

```js
const mon = date('2026-11-16');

mon.startOfPrevious('month').toString(); // '2026-10-01'
mon.startOfPrevious('year').toString(); // '2025-01-01'
mon.startOfPrevious('wednesday').toString(); // '2026-11-11'
```
:::

:::entry
### `next()` :kind[method]

```js signature
d.next(target): CalendarDate
```

이 날짜 이후에서 다음으로 돌아오는 지정 요일이나 [`MonthDay`](/api/month-day/)로 이동합니다. 이미 해당 요일이나 연례 날짜에 있다면 그다음 차례로 넘어갑니다.

**매개변수**

```params
- name: target
  type: DayOfWeek | MonthDay
  required: true
  description: "`'friday'` 같은 영어 요일명, 1부터 7까지의 ISO 요일 번호, 또는 매년 반복되는 `MonthDay`."
```

**반환값**

```returns
type: CalendarDate
description: "다음 일치 날짜를 나타내는 새 `CalendarDate`."
```

```js
import { date, monthDay } from 'native-dates';

const mon = date('2026-11-16');

mon.next('friday').toString(); // '2026-11-20'
mon.next('monday').toString(); // '2026-11-23'
mon.next(monthDay('12-25')).toString(); // '2026-12-25'
```
:::

:::entry
### `previous()` :kind[method]

```js signature
d.previous(target): CalendarDate
```

이 날짜 이전에서 가장 가까운 지정 요일이나 [`MonthDay`](/api/month-day/)로 되돌아갑니다. 이미 해당 요일이나 연례 날짜에 있다면 그 직전 차례로 이동합니다.

**매개변수**

```params
- name: target
  type: DayOfWeek | MonthDay
  required: true
  description: "영어 요일명, 3글자 영어 약어, 1부터 7까지의 ISO 요일 번호, 또는 매년 반복되는 `MonthDay`."
```

**반환값**

```returns
type: CalendarDate
description: "이전 일치 날짜를 나타내는 새 `CalendarDate`."
```

```js
date('2026-11-16').previous('friday').toString(); // '2026-11-13'
date('2026-11-16').previous(monthDay('10-31')).toString(); // '2026-10-31'
```
:::

## 날짜 비교

달력 날짜끼리 직접 비교하거나 [`date()`](/api/date-fn/)가 허용하는 모든 입력값을 전달해 비교할 수 있습니다.

:::warning[숫자 비교 연산자를 사용하지 마세요]
달력 날짜는 타임스탬프가 아니므로 밀리초로 자동 변환되지 않고 숫자 연산자에서 `RangeError`를 던집니다. 날짜를 비교할 때는 [`isBefore()`](#isbefore) 같은 메서드를 쓰고, 배열을 정렬할 때는 [`compare()`](/api/compare/)를 사용하세요.
:::

:::entry
### `equals()` :kind[method]

```js signature
d.equals(other): boolean
```

두 값이 같은 연·월·일을 나타내면 `true`를 반환합니다.

**매개변수**

```params
- name: other
  type: CalendarDateInput
  required: true
  description: "다른 `CalendarDate` 또는 `date()`가 허용하는 입력값."
```

**반환값**

```returns
type: boolean
description: "두 값이 같은 달력 날짜를 나타내면 `true`."
```

```js
const due = date('2026-11-16');

due.equals('2026-11-16'); // true
due.equals(date(2026, 11, 16)); // true
```
:::

:::entry
### `isBefore()` :kind[method]

```js signature
d.isBefore(other): boolean
```

이 날짜가 달력상 다른 날짜보다 이르면 `true`를 반환합니다.

```js
date('2026-11-15').isBefore('2026-11-16'); // true
```
:::

:::entry
### `isAfter()` :kind[method]

```js signature
d.isAfter(other): boolean
```

이 날짜가 달력상 다른 날짜보다 늦으면 `true`를 반환합니다.

```js
date('2026-11-17').isAfter('2026-11-16'); // true
```
:::

:::entry
### `isSame()` :kind[method]

```js signature
d.isSame(other, unit?, firstDay?): boolean
```

다른 날짜가 같은 월이나 같은 주처럼 동일한 달력 단위에 속하는지 확인합니다. 단위를 생략하고 `isSame()`을 호출하면 정확히 같은 날짜인지 검사합니다.

**매개변수**

```params
- name: other
  type: CalendarDateInput
  required: true
  description: "비교할 대상 날짜."
- name: unit
  type: DateUnit
  description: "비교할 영어 달력 단위명(`'year'`부터 `'day'`까지)."
- name: firstDay
  type: DayOfWeek
  description: "`unit`이 `'week'`일 때 주의 첫 요일을 지정하는 영어 요일명 또는 ISO 요일 번호."
```

**반환값**

```returns
type: boolean
description: "두 날짜가 같은 `unit`에 속하면 `true`."
```

```js
const wed = date('2026-09-09', { locale: 'en-US' });

wed.isSame('2026-09-30', 'month'); // true
wed.isSame('2026-09-06', 'week'); // true
wed.isSame('2026-09-06', 'week', 'monday'); // false
```
:::

### 달력 판별 메서드

오늘이 어느 날인지는 위치에 따라 달라지므로 상대 날짜 판별 메서드는 선택적 시간대 인수를 받습니다. 생략하면 [`configure()`](/api/configure/)의 기본 시간대를 사용합니다.

| 메서드 | 타입 | 설명 |
|---|---|---|
| `isToday(zone?)`, `isTomorrow(zone?)`, `isYesterday(zone?)` | `boolean` | 지정한 시간대 또는 기본 시간대에서 오늘·내일·어제와 일치하는지 여부. |
| `isPast(zone?)`, `isFuture(zone?)` | `boolean` | 지정한 시간대 또는 기본 시간대에서 오늘보다 과거인지 또는 미래인지 여부. |
| `isWeekday()`, `isWeekend()` | `boolean` | 활성 로케일 기준 평일·주말 여부(예: `en-US`는 토·일, `ar-SA`는 금·토). |
| `isLeapYear()` | `boolean` | 이 날짜의 연도가 366일(윤년)인지 여부. |

## 기간과 범위 측정

:::entry
### `until()` :kind[method]

```js signature
d.until(other): Duration
d.until(other, unit): number
```

이 날짜부터 다른 날짜까지의 달력 기간을 측정하며, 대상이 더 이르면 음수 기간을 반환합니다. 반환되는 [`Duration`](/api/duration/)은 시작 날짜를 기억하므로 월과 연 단위의 총 기간도 정확하게 합산할 수 있습니다.

**매개변수**

```params
- name: other
  type: CalendarDateInput
  required: true
  description: "측정 대상이 되는 끝 날짜."
- name: unit
  type: Unit
  description: "총 기간을 부동소수점 숫자로 환산할 영어 단위명."
```

**반환값**

```returns
type: Duration | number
description: "일 단위로 계산된 `Duration`, 또는 `unit`을 지정한 경우 총 기간 숫자."
```

```js
const start = date('2026-01-01');

start.until('2027-04-05').toString(); // 'P459D'
start.until('2027-04-05').balance('year').toString(); // 'P1Y3M4D'
start.until('2027-04-05', 'days'); // 459
start.until('2026-07-01').total('months'); // 6
```
:::

:::entry
### `since()` :kind[method]

```js signature
d.since(other): Duration
d.since(other, unit): number
```

이전 날짜부터 이 날짜까지 경과한 달력 기간을 측정합니다. 영어 단위명을 전달하면 전체 기간을 숫자로 반환합니다.

```js
date('2026-11-16').since('2026-11-02', 'weeks'); // 2
```
:::

:::entry
### `to()` :kind[method]

```js signature
d.to(end): DateRange
d.to(count, unit): DateRange
d.through(end): DateRange
d.through(count, unit): DateRange
d.for(length): DateRange
d.for(count, unit): DateRange
```

이 날짜에서 시작해 종료 날짜 또는 지정한 기간만큼 이어지는 양 끝 포함 [`DateRange`](/api/ranges/#daterange)를 생성합니다. 시작일과 종료일이 모두 포함됩니다. `through()` 별칭도 사용할 수 있으며, 기간을 명시적으로 전달하려면 `for()`를 사용하세요(`for()`는 종료 날짜나 단위 없는 숫자를 거부합니다).

**매개변수**

```params
- name: end
  type: CalendarDateInput | DurationInput | number
  required: true
  description: "포함할 마지막 날짜, 달력 기간, 또는 `unit`과 함께 쓰는 숫자 `count`."
- name: unit
  type: DateUnit
  description: "첫 번째 인수가 숫자일 때 사용하는 영어 달력 단위명(예: `'days'`, `'weeks'`)."
```

**반환값**

```returns
type: DateRange
description: "이 날짜에서 시작하는 양 끝 포함 `DateRange`."
```

```js
date('2026-11-01').to('2026-11-07').duration.days; // 7
date('2026-11-01').for(7, 'days').toString(); // '2026-11-01/2026-11-07'
```
:::

:::entry
### `range()` :kind[method]

```js signature
d.range(unit, firstDay?): DateRange
```

이 날짜가 속한 달력 단위의 첫날부터 마지막 날까지 모든 날짜를 포함하는 양 끝 포함 [`DateRange`](/api/ranges/#daterange)를 반환합니다.

**매개변수**

```params
- name: unit
  type: DateUnit
  required: true
  description: "`'year'`부터 `'day'`까지의 영어 달력 단위명."
- name: firstDay
  type: DayOfWeek
  description: "`unit`이 `'week'`일 때 주의 첫 요일을 지정하는 영어 요일명 또는 ISO 요일 번호."
```

**반환값**

```returns
type: DateRange
description: "`unit`의 시작일부터 종료일까지를 포함하는 양 끝 포함 `DateRange`."
```

```js
date('2026-02-10').range('month').toString(); // '2026-02-01/2026-02-28'
date('2026-11-18', { locale: 'en-US' }).range('week').toString(); // '2026-11-15/2026-11-21'
date('2026-11-18').range('week', 'monday').toString(); // '2026-11-16/2026-11-22'
```
:::

:::entry
### `every()` :kind[method]

```js signature
d.every(step, zone?): DateTime[]
d.every(count, unit, zone?): DateTime[]
```

지정한 시간대 또는 기본 시간대에서 자정부터 양수 간격으로 이 달력 하루를 순회하며 [`DateTime`](/api/date-time/) 시점 배열을 반환합니다. 서머타임 전환일에는 시간 단위 시점이 자동으로 23개 또는 25개 생성됩니다.

**매개변수**

```params
- name: step
  type: Unit | DurationInput | number
  required: true
  description: "`'hour'` 같은 영어 단위명, `'30m'` 같은 영어 기간 문자열·`Duration`, 또는 `unit`과 함께 쓰는 숫자."
- name: unit
  type: Unit
  description: "첫 번째 인수가 숫자일 때 사용하는 영어 단위명."
- name: zone
  type: Zone
  description: "하루의 경계를 결정할 시간대. 생략하면 설정된 기본 시간대를 사용합니다."
```

**반환값**

```returns
type: DateTime[]
description: "`zone`에서 이 달력 하루 동안 생성된 `DateTime` 시점 배열."
```

```js
const slots = date('2026-11-16').every(6, 'hours', 'UTC');

slots.length; // 4
slots[1].toString(); // '2026-11-16T06:00:00.000Z'
```
:::

:::entry
### `split()` :kind[method]

```js signature
d.split(step, zone?): DateTimeRange[]
d.split(count, unit, zone?): DateTimeRange[]
d.splitBy(step, zone?): DateTimeRange[]
d.splitBy(count, unit, zone?): DateTimeRange[]
```

지정한 시간대 또는 기본 시간대에서 이 달력 하루를 연속된 반개방 [`DateTimeRange`](/api/ranges/#datetimerange) 구간들로 나눕니다. `splitBy()` 별칭도 제공합니다.

**매개변수**

```params
- name: step
  type: Unit | DurationInput | number
  required: true
  description: "영어 단위명, 영어 기간 문자열·`Duration`, 또는 `unit`과 함께 쓰는 숫자."
- name: unit
  type: Unit
  description: "첫 번째 인수가 숫자일 때 사용하는 영어 단위명."
- name: zone
  type: Zone
  description: "하루의 경계를 결정할 시간대. 생략하면 설정된 기본 시간대를 사용합니다."
```

**반환값**

```returns
type: DateTimeRange[]
description: "`zone`에서 이 하루를 빈틈없이 나누는 연속 반개방 `DateTimeRange` 배열."
```

```js
const halves = date('2026-11-16').split(12, 'hours', 'UTC');

halves.map(String);
// ['2026-11-16T00:00:00.000Z/2026-11-16T12:00:00.000Z', '2026-11-16T12:00:00.000Z/2026-11-17T00:00:00.000Z']
```
:::

## 포맷과 변환

:::entry
### `format()` :kind[method]

```js signature
d.format(spec?, locale?): string
```

내장 프리셋, [`configure()`](/api/configure/)에 등록한 사용자 지정 포맷 이름, 옵션 객체, 또는 토큰 패턴으로 날짜를 포맷합니다.

`'L'`부터 `'LLLL'`까지의 현지화 프리셋이 기본 내장되어 있으며, 옵션 객체에 포함된 시각·시간대 키는 자동으로 무시됩니다. 전체 프리셋과 토큰 목록은 [포맷](/guides/formatting/)에서 확인하세요.

**매개변수**

```params
- name: spec
  type: FormatSpec
  default: "'medium'"
  description: "내장 또는 사용자 지정 포맷 이름, `Intl` 옵션 객체, 또는 토큰 패턴."
- name: locale
  type: string
  description: "이번 호출에서만 인스턴스 로케일이나 기본 로케일을 덮어쓸 BCP 47 로케일 태그."
```

**반환값**

```returns
type: string
description: "포맷된 날짜 문자열."
```

```js
const day = date('2026-11-16');

day.format('short', 'en-US'); // '11/16/26'
day.format('medium', 'en-US'); // 'Nov 16, 2026'
day.format('long', 'en-US'); // 'November 16, 2026'
day.format('full', 'en-US'); // 'Monday, November 16, 2026'
day.format('L', 'en-US'); // '11/16/2026'
day.format('YYYY-MM-DD'); // '2026-11-16'
day.format('ddd, MMM D', 'en-US'); // 'Mon, Nov 16'
day.format({ weekday: 'long' }, 'en-US'); // 'Monday'
```
:::

:::entry
### `from()` :kind[method]

```js signature
d.from(other?, locale?): string
d.formatRelative(other?, locale?): string
```

다른 날짜와 이 날짜 사이의 날짜 차이를 `Intl.RelativeTimeFormat`으로 포맷해 `'yesterday'`나 `'in 3 weeks'` 같은 현지화 표현을 반환합니다.

첫 번째 인수를 생략하면 [`today()`](/api/date-fn/#today)와 비교하며, [`formatRelative()`](#formatrelative)를 별칭으로 사용할 수 있습니다. 7일 미만 차이는 로케일에 맞는 자연어 표현(예: 영어 `'yesterday'`·`'today'`·`'tomorrow'`, 한국어 `ko-KR`에서는 ‘그저께’·‘어제’·‘오늘’·‘내일’·‘모레’)을 사용하고, 주·월·년 단위는 숫자로 표기합니다.

**매개변수**

```params
- name: other
  type: CalendarDateInput
  description: "비교 기준 달력 날짜. 생략하면 활성 시간대의 `today()`를 기본값으로 사용합니다."
- name: locale
  type: Locale
  description: "이번 호출에서만 인스턴스 로케일이나 기본 로케일을 덮어쓸 BCP 47 로케일 태그."
```

**반환값**

```returns
type: string
description: "현지화된 상대 날짜 표현 문자열."
```

```js
const anchor = date('2026-11-16');

date('2026-11-15').from(anchor, 'en-US'); // 'yesterday'
date('2026-11-16').from(anchor, 'en-US'); // 'today'
date('2026-11-17').from(anchor, 'en-US'); // 'tomorrow'
date('2026-11-30').from(anchor, 'en-US'); // 'in 2 weeks'
date('2026-11-15').from(anchor, 'de'); // 'gestern'
```
:::

:::entry
### `fromNow()` :kind[method]

```js signature
d.fromNow(locale?): string
```

오늘로부터 이 날짜가 얼마나 떨어져 있는지 현지화 표현으로 포맷합니다. 기준 날짜 없이 [`from()`](#from)을 호출하는 것과 같습니다.

**매개변수**

```params
- name: locale
  type: Locale
  description: "이번 호출에서만 인스턴스 로케일이나 기본 로케일을 덮어쓸 BCP 47 로케일 태그."
```

**반환값**

```returns
type: string
description: "오늘 기준의 현지화된 상대 날짜 표현 문자열."
```

```js
today().minus(1, 'day').fromNow('en-US'); // 'yesterday'
today().plus(3, 'days').fromNow('en-US'); // 'in 3 days'
```
:::

:::entry
### `formatRelative()` :kind[method]

```js signature
d.formatRelative(other?, locale?): string
```

[`from()`](#from)의 별칭으로, `other`(생략 시 오늘) 기준의 날짜 차이를 현지화 표현으로 포맷합니다.
:::

:::entry
### `locale()` :kind[method]

```js signature
d.locale(): Locale | undefined
d.locale(tag): CalendarDate
```

이 날짜에 지정된 로케일을 읽거나, 프리셋·주 경계·파생 값 전반에 다른 로케일을 적용한 복사본을 반환합니다. 밑줄 표기 태그와 `Accept-Language` 헤더는 자동으로 정규화되며, 빈 태그나 `null`을 전달하면 로케일 지정을 해제합니다. [`lang()`](#lang)을 별칭으로 사용할 수 있습니다.

**매개변수**

```params
- name: tag
  type: Locale | null | undefined
  description: "적용할 로케일 태그, 태그 배열, 또는 `Accept-Language` 헤더. 기존 로케일을 해제하려면 `null`을 전달합니다."
```

**반환값**

```returns
type: CalendarDate | Locale | undefined
description: "인수 없이 호출하면 활성 로케일 태그, 인수를 전달하면 `tag`를 적용한 새 `CalendarDate`."
```

```js
const trip = date('2026-05-15').locale('fr-FR');

trip.locale(); // 'fr-FR'
trip.format('long'); // '15 mai 2026'
trip.to('2026-05-19').format('long'); // '15–19 mai 2026'
```
:::

:::entry
### `lang()` :kind[method]

```js signature
d.lang(): Locale | undefined
d.lang(tag): CalendarDate
```

이 날짜의 BCP 47 로케일 태그를 읽거나 지정하는 [`locale()`](#locale)의 단축 별칭입니다.
:::

:::entry
### `as()` :kind[method]

```js signature
d.as('date'): CalendarDate
d.as('datetime', zone?): DateTime
d.as('yearMonth'): YearMonth
d.as('monthDay'): MonthDay
```

메서드 체인 안에서 이 날짜를 [`YearMonth`](/api/year-month/)나 [`MonthDay`](/api/month-day/) 등 다른 타입으로 변환합니다. 시점(`'datetime'`)으로 변환하면 지정한 시간대 또는 기본 시간대에서 이 날짜의 시작인 자정 시점을 반환합니다.

**매개변수**

```params
- name: kind
  type: "'date' | 'datetime' | 'yearMonth' | 'monthDay'"
  required: true
  description: "이 달력 날짜를 변환할 대상 타입 이름."
- name: zone
  type: Zone
  description: "`'datetime'`으로 변환할 때 사용할 시간대. 생략하면 설정된 기본 시간대를 사용합니다."
```

**반환값**

```returns
type: CalendarDate | DateTime | YearMonth | MonthDay
description: "변환된 값."
```

```js
const due = date('2026-11-16');

due.as('datetime', 'UTC').toString(); // '2026-11-16T00:00:00.000Z'
due.as('yearMonth').toString(); // '2026-11'
due.as('monthDay').toString(); // '11-16'
```
:::

:::entry
### `toString()` :kind[method]

```js signature
d.toString(): string
d.toJSON(): string
```

날짜를 ISO 8601 `YYYY-MM-DD` 문자열로 반환합니다. `toJSON()`도 `JSON.stringify()`를 위해 동일한 문자열을 반환합니다.

**반환값**

```returns
type: string
description: "ISO 8601 날짜 문자열(예: `'2026-11-16'`)."
```

```js
const due = date('2026-11-16');

due.toString(); // '2026-11-16'
JSON.stringify({ due }); // '{"due":"2026-11-16"}'
```
:::

:::entry
### `toJSDate()` :kind[method]

```js signature
d.toJSDate(zone?): Date
```

지정한 시간대 또는 기본 시간대에서 이 날짜의 자정을 나타내는 네이티브 JavaScript `Date` 인스턴스를 반환합니다.
:::

:::entry
### `toTemporal()` :kind[method]

```js signature
d.toTemporal(): Temporal.PlainDate
```

내부의 `Temporal.PlainDate` 인스턴스를 반환합니다.
:::

:::entry
### `valueOf()` :kind[method]

```js signature
d.valueOf(): never
```

숫자 연산자가 달력 날짜를 숫자로 암묵적 변환하지 않도록 `RangeError`를 던집니다.
:::
