---
source: 62b87452c7ee
title: DateTime
lede: 특정 시간대 기준으로 표현한 한 시점의 날짜와 시각.
---

## DateTime 생성

[`datetime()`](/api/datetime-fn/)으로 기존 값에서 인스턴스를 생성하거나, [`now()`](/api/datetime-fn/#now)로 현재 시점을 읽거나, [`at()`](/api/calendar-date/#at)으로 달력 날짜와 시각을 결합해 만듭니다. 모든 인스턴스는 불변이므로 원본 값을 변경하지 않고, 값을 바꾸는 메서드마다 새 인스턴스를 반환합니다.

```js title="create.js"
import { date, datetime, now } from 'native-dates';

const fromUtc = datetime('2026-11-16T17:30:00Z', 'America/Los_Angeles');
const standup = date('2026-11-16').at('9:30am', 'America/Los_Angeles');
const current = now();
```

시간대를 전달하면 해당 시간대 기준으로 시점을 표현하며, 생략하면 [`configure()`](/api/configure/)에 설정된 기본 시간대를 사용합니다.

```js
const event = datetime('2026-11-16T17:30:00Z', 'America/New_York');
event.zone; // 'America/New_York'
event.hour; // 12
```

:::note[오프셋은 시간대가 아니라 시점을 지정합니다]
입력 문자열 끝의 `Z`나 숫자 오프셋은 해당 시점이 언제인지를 결정하며, 생성된 인스턴스는 인수로 전달한 시간대나 설정된 기본 시간대를 따릅니다. UTC 기준의 필드와 날짜 계산이 필요하면 시간대로 `'UTC'`를 전달하세요.
:::

## 프로퍼티

프로퍼티는 인스턴스의 시간대 기준으로 날짜와 시각을 읽습니다.

| 프로퍼티 | 타입 | 설명 |
|---|---|---|
| `text` | `string` | 로케일에 맞춰 포맷한 날짜, 시각, 짧은 시간대 이름(예: `'Nov 16, 2026, 9:30 AM PST'`). |
| `year`, `month`, `day` | `number` | 달력 연도, 월(1–12), 일(1–31). |
| `hour`, `minute`, `second` | `number` | 24시간제 시각 필드(0–23, 0–59, 0–59). |
| `millisecond`, `microsecond`, `nanosecond` | `number` | 초 미만 시각 필드(0–999). |
| `zone` | `string` | 정규화된 IANA 시간대 ID 또는 고정 UTC 오프셋(예: `'America/Los_Angeles'`, `'UTC'`). |
| `offset` | `string` | 이 시점에 적용되는 UTC 오프셋(예: `'-08:00'`). |
| `epochSeconds` | `number` | 유닉스 에포크 이후 경과한 정수 초(`Math.floor` 방식 내림). |
| `epochMilliseconds` | `number` | 유닉스 에포크 이후 경과한 밀리초. |
| `epochNanoseconds` | `bigint` | 유닉스 에포크 이후 경과한 정확한 나노초. |
| `date` | [`CalendarDate`](/api/calendar-date/) | 이 시간대 기준의 달력 날짜. |
| `time` | [`Time`](/api/time/) | 이 시간대 기준의 하루 중 시각. |
| `yearMonth` | [`YearMonth`](/api/year-month/) | 이 시간대 기준의 연월. |
| `monthDay` | [`MonthDay`](/api/month-day/) | 이 시간대 기준의 월일. |
| `dayOfWeek` | `number` | ISO 요일 번호(월요일 1부터 일요일 7까지). |
| `weekStart` | `number` | [`configure()`](/api/configure/) 설정 또는 인스턴스 로케일을 따르는 주 시작 요일 번호(1–7). |
| `quarter` | `number` | 달력 분기(1–4). |
| `weekOfYear`, `dayOfYear` | `number` | ISO 주차(1–53)와 연중 몇 번째 날(1–366). |
| `daysInMonth`, `daysInYear`, `hoursInDay` | `number` | 현재 월의 일수, 연도의 일수, 현지 달력 하루의 시간 수. |

## 시간대와 필드

같은 시점을 다른 시간대로 변환하거나 개별 달력·시각 필드를 바꿉니다.

:::entry
### `in()` :kind[method]

```js signature
dt.in(zone): DateTime
```

같은 시점을 다른 시간대 기준으로 나타내는 새 `DateTime`을 반환합니다. 현지 달력·시각 프로퍼티는 대상 시간대에 맞춰 바뀌지만, 내부 타임스탬프는 그대로 유지됩니다.

**매개변수**

```params
- name: zone
  type: Zone
  required: true
  description: "`'Europe/Berlin'` 같은 IANA 시간대 이름, 고정 UTC 오프셋, 또는 `'UTC'`."
```

**반환값**

```returns
type: DateTime
description: "`zone` 기준으로 표현한 동일 시점의 새 `DateTime`."
```

```js
const standup = datetime('2026-11-16T09:30', 'America/Los_Angeles');
const berlin = standup.in('Europe/Berlin');

berlin.hour; // 18
berlin.equals(standup); // true
```
:::

:::entry
### `at()` :kind[method]

```js signature
dt.at(time): DateTime
```

같은 날짜와 같은 시간대를 유지한 채 시각만 바꾼 새 `DateTime`을 반환합니다.

**매개변수**

```params
- name: time
  type: TimeInput
  required: true
  description: "`'9:30am'` 같은 시각 문자열, `Time` 인스턴스, 필드 객체, 또는 `Date`."
```

**반환값**

```returns
type: DateTime
description: "같은 날짜에서 시각을 `time`으로 바꾼 새 `DateTime`."
```

```js
const morning = datetime('2026-11-16T09:30', 'America/Los_Angeles');
const wrapUp = morning.at('5:00pm');

wrapUp.hour; // 17
```
:::

:::entry
### `set()` :kind[method]

```js signature
dt.set(fields): DateTime
dt.set(unit, value): DateTime
```

현재 시간대에서 하나 이상의 달력 또는 시각 필드를 바꾼 새 `DateTime`을 반환합니다. 2월 30일처럼 존재하지 않는 날짜는 다음 달로 넘어가는 대신 `RangeError`를 던집니다. `day` 없이 `month`나 `year`만 변경할 때 일자가 대상 월의 말일을 넘으면 말일로 보정합니다.

**매개변수**

```params
- name: fields
  type: DateTimeFields | Unit
  required: true
  description: "달력 또는 시각 필드 객체, 또는 `value`와 함께 전달하는 영어 단위명 하나."
- name: value
  type: number
  description: "지정한 `unit`에 설정할 정수 값."
```

**반환값**

```returns
type: DateTime
description: "같은 시간대에서 필드가 갱신된 새 `DateTime`."
```

```js
const cutoff = datetime('2026-11-16T09:30', 'America/New_York');

cutoff.set('hour', 17);
cutoff.set({ month: 12, day: 1, hour: 0, minute: 0 });
```
:::

## 연산과 반올림·올림·내림

일·주·월·년을 더하면 서머타임 전환일을 지나도 같은 시각을 유지합니다. 시·분·초를 더하면 실제로 경과한 시간을 정확히 계산합니다.

:::entry
### `plus()` :kind[method]

```js signature
dt.plus(amount, unit?): DateTime
dt.add(amount, unit?): DateTime
```

지정한 기간만큼 앞으로 이동한 새 `DateTime`을 같은 시간대로 반환합니다. `add()` 별칭도 사용할 수 있습니다.

**매개변수**

```params
- name: amount
  type: DurationInput
  required: true
  description: "`unit`과 함께 쓰는 숫자, `Duration` 인스턴스, 영어 기간 문자열, 필드 객체, 또는 밀리초."
- name: unit
  type: Unit
  description: "`amount`가 숫자일 때 사용하는 영어 단위명(예: `'days'`, `'hours'`)."
```

**반환값**

```returns
type: DateTime
description: "같은 시간대의 새 `DateTime`."
```

```js
// 뉴욕 서머타임 시작 주말(3월 8일은 23시간)
const sat = datetime('2026-03-07T09:00', 'America/New_York');

sat.plus(1, 'day').hour; // 9
sat.plus(24, 'hours').hour; // 10
sat.plus('1h 30m').format('time', 'en-US'); // '10:30 AM'
```
:::

:::entry
### `minus()` :kind[method]

```js signature
dt.minus(amount, unit?): DateTime
dt.subtract(amount, unit?): DateTime
```

같은 시간대에서 지정한 기간만큼 뒤로 이동합니다. [`plus()`](#plus)와 동일한 입력을 받으며 `subtract()` 별칭도 제공합니다.

**매개변수**

```params
- name: amount
  type: DurationInput
  required: true
  description: "`unit`과 함께 쓰는 숫자, `Duration` 인스턴스, 영어 기간 문자열, ISO 기간 문자열, 또는 필드 객체."
- name: unit
  type: Unit
  description: "`amount`가 숫자일 때 사용하는 영어 단위명."
```

**반환값**

```returns
type: DateTime
description: "같은 시간대의 새 `DateTime`."
```

```js
const deadline = datetime('2026-11-16T17:00', 'America/New_York');

deadline.minus(48, 'hours');
deadline.minus({ weeks: 1, days: 2 });
```
:::

:::entry
### `startOf()` :kind[method]

```js signature
dt.startOf(unit, firstDay?): DateTime
```

이 시간대에서 지정한 달력 또는 시각 단위의 시작 시점으로 이동합니다. 주 경계는 `firstDay`, [`configure()`](/api/configure/)의 `weekStart`, 또는 이 시점에 설정된 로케일 순서로 결정됩니다.

**매개변수**

```params
- name: unit
  type: Unit
  required: true
  description: "`'year'`부터 `'millisecond'`까지의 영어 달력·시각 단위명."
- name: firstDay
  type: DayOfWeek
  description: "주 단위로 맞출 때 주의 첫 요일을 지정하는 영어 요일명 또는 ISO 요일 번호(예: `'sunday'`, `7`)."
```

**반환값**

```returns
type: DateTime
description: "`unit`의 시작 시점을 나타내는 새 `DateTime`."
```

```js
const wed = datetime('2026-11-18T14:45:12', 'America/New_York').locale('en-US');

wed.startOf('day').format('time'); // '12:00 AM'
wed.startOf('week').day; // 15
wed.startOf('week', 'monday').day; // 16
```
:::

:::entry
### `endOf()` :kind[method]

```js signature
dt.endOf(unit, firstDay?): DateTime
```

이 시간대에서 지정한 달력 또는 시각 단위의 마지막 밀리초로 이동합니다.

**매개변수**

```params
- name: unit
  type: Unit
  required: true
  description: "`'year'`부터 `'nanosecond'`까지의 영어 달력·시각 단위명."
- name: firstDay
  type: DayOfWeek
  description: "`unit`이 `'week'`일 때 주의 첫 요일을 지정하는 영어 요일명 또는 ISO 요일 번호."
```

**반환값**

```returns
type: DateTime
description: "`unit`의 마지막 밀리초를 나타내는 새 `DateTime`."
```

```js
const nov = datetime('2026-11-18T14:45', 'UTC');

nov.endOf('month').toString(); // '2026-11-30T23:59:59.999Z'
```
:::

:::entry
### `startOfNext()` :kind[method]

```js signature
dt.startOfNext(unit, firstDay?): DateTime
```

이 시간대에서 이 시점이 속한 달력 또는 시각 단위 바로 다음 단위의 시작 시점으로 이동합니다. 결과는 항상 이 시점보다 뒤 시점이므로 자정에서 다음 날을 구하면 다음 자정이 됩니다.

단위명 대신 영어 요일명을 전달하면 해당 요일의 다음 날짜 시작 시점(자정)을 반환합니다. 같은 날짜를 찾으면서 이 시점의 시각을 유지하려면 [`next()`](#next)를 호출하세요.

**매개변수**

```params
- name: unit
  type: Unit | Exclude<DayOfWeek, number>
  required: true
  description: "`'year'`부터 `'nanosecond'`까지의 영어 단위명, 또는 `'wednesday'` 같은 영어 요일명."
- name: firstDay
  type: DayOfWeek
  description: "`unit`이 `'week'`일 때 주의 첫 요일을 지정하는 영어 요일명 또는 ISO 요일 번호."
```

**반환값**

```returns
type: DateTime
description: "다음 `unit` 또는 다음 지정 요일의 시작 시점을 나타내는 새 `DateTime`."
```

```js
const standup = datetime('2026-11-16T09:30', 'America/New_York');

standup.startOfNext('month').text; // 'Dec 1, 2026, 12:00 AM EST'
standup.startOfNext('hour').text; // 'Nov 16, 2026, 10:00 AM EST'
standup.startOfNext('wednesday').text; // 'Nov 18, 2026, 12:00 AM EST'
standup.next('wednesday').text; // 'Nov 18, 2026, 9:30 AM EST'
```
:::

:::entry
### `startOfPrevious()` :kind[method]

```js signature
dt.startOfPrevious(unit, firstDay?): DateTime
```

이 시간대에서 이 시점이 속한 달력 또는 시각 단위 바로 이전 단위의 시작 시점으로 이동합니다. 단위명 대신 영어 요일명을 전달하면 해당 요일의 이전 날짜 시작 시점(자정)을 반환하며, 이 시점의 시각을 유지하려면 [`previous()`](#previous)를 사용합니다.

**매개변수**

```params
- name: unit
  type: Unit | Exclude<DayOfWeek, number>
  required: true
  description: "`'year'`부터 `'nanosecond'`까지의 영어 단위명, 또는 `'wednesday'` 같은 영어 요일명."
- name: firstDay
  type: DayOfWeek
  description: "`unit`이 `'week'`일 때 주의 첫 요일을 지정하는 영어 요일명 또는 ISO 요일 번호."
```

**반환값**

```returns
type: DateTime
description: "이전 `unit` 또는 이전 지정 요일의 시작 시점을 나타내는 새 `DateTime`."
```

```js
const standup = datetime('2026-11-16T09:30', 'America/New_York');

standup.startOfPrevious('day').text; // 'Nov 15, 2026, 12:00 AM EST'
standup.startOfPrevious('month').text; // 'Oct 1, 2026, 12:00 AM EDT'
standup.startOfPrevious('wednesday').text; // 'Nov 11, 2026, 12:00 AM EST'
```
:::

:::entry
### `next()` :kind[method]

```js signature
dt.next(target): DateTime
```

같은 시각을 유지한 채 다음으로 돌아오는 지정 요일이나 [`MonthDay`](/api/month-day/)로 이동합니다. 이미 해당 요일이나 연례 날짜에 있다면 그다음 차례로 넘어갑니다.

**매개변수**

```params
- name: target
  type: DayOfWeek | MonthDay
  required: true
  description: "`'friday'` 같은 영어 요일명, 1부터 7까지의 ISO 요일 번호, 또는 매년 반복되는 `MonthDay`."
```

**반환값**

```returns
type: DateTime
description: "같은 현지 시각으로 다음 일치 날짜에 맞춘 새 `DateTime`."
```

```js
import { datetime, monthDay } from 'native-dates';

const mon = datetime('2026-11-16T09:30', 'America/Los_Angeles');

mon.next('friday').day; // 20
mon.next('monday').day; // 23
mon.next(monthDay('12-25')).month; // 12
```
:::

:::entry
### `previous()` :kind[method]

```js signature
dt.previous(target): DateTime
```

같은 시각을 유지한 채 이 날짜 이전에서 가장 가까운 지정 요일이나 [`MonthDay`](/api/month-day/)로 되돌아갑니다.

**매개변수**

```params
- name: target
  type: DayOfWeek | MonthDay
  required: true
  description: "영어 요일명, 3글자 영어 약어, 1부터 7까지의 ISO 요일 번호, 또는 매년 반복되는 `MonthDay`."
```

**반환값**

```returns
type: DateTime
description: "같은 현지 시각으로 이전 일치 날짜에 맞춘 새 `DateTime`."
```

```js
const mon = datetime('2026-11-16T09:30', 'America/Los_Angeles');

mon.previous('friday').day; // 13
mon.previous(monthDay('10-31')).month; // 10
```
:::

:::entry
### `round()` :kind[method]

```js signature
dt.round(unit): DateTime
dt.round(increment, unit): DateTime
```

가장 가까운 단위나 지정한 간격으로 반올림하며, 정중앙 값은 올림 처리합니다.

**매개변수**

```params
- name: increment
  type: number | Unit
  required: true
  description: "상위 단위의 약수인 간격 값, 또는 간격이 `1`일 때의 영어 단위명."
- name: unit
  type: Unit
  description: "단위 맞춤 대상 영어 단위명(`'day'`부터 `'nanosecond'`까지)."
```

**반환값**

```returns
type: DateTime
description: "같은 시간대에서 반올림된 새 `DateTime`."
```

```js
const stamp = datetime('2026-11-16T09:23:40', 'UTC');

stamp.round('hour').toString(); // '2026-11-16T09:00:00.000Z'
stamp.round(15, 'minutes').toString(); // '2026-11-16T09:30:00.000Z'
```
:::

:::entry
### `floor()` :kind[method]

```js signature
dt.floor(unit): DateTime
dt.floor(increment, unit): DateTime
```

지정한 단위나 간격의 시작 지점으로 내림합니다. [`round()`](#round)와 동일한 인수를 받습니다.

```js
datetime('2026-11-16T09:29:00Z').floor(15, 'minutes').toString(); // '2026-11-16T09:15:00.000Z'
```
:::

:::entry
### `ceil()` :kind[method]

```js signature
dt.ceil(unit): DateTime
dt.ceil(increment, unit): DateTime
```

다음 단위나 간격의 경계로 올림합니다. [`round()`](#round)와 동일한 인수를 받습니다.

```js
datetime('2026-11-16T09:01:00Z').ceil(15, 'minutes').toString(); // '2026-11-16T09:15:00.000Z'
```
:::

## 시점 비교

두 값이 서로 다른 시간대에 있더라도 각 시점이 실제로 언제 발생했는지를 기준으로 비교합니다.

:::warning[=== 연산자로 비교하지 마세요]
JavaScript의 `===` 연산자는 두 변수가 메모리상 같은 객체를 가리키는지만 검사합니다. 두 `DateTime` 인스턴스가 같은 시점을 나타내는지 확인하려면 [`equals()`](#equals)를 호출하세요.
:::

:::entry
### `equals()` :kind[method]

```js signature
dt.equals(other): boolean
```

시간대와 관계없이 두 값이 정확히 같은 시점을 가리키면 `true`를 반환합니다.

**매개변수**

```params
- name: other
  type: DateTimeInput
  required: true
  description: "다른 `DateTime` 또는 `datetime()`이 허용하는 입력값."
```

**반환값**

```returns
type: boolean
description: "두 값이 같은 시점을 가리키면 `true`."
```

```js
const ny = datetime('2026-11-16T12:00', 'America/New_York');
const utc = datetime('2026-11-16T17:00Z', 'UTC');

ny.equals(utc); // true
```
:::

:::entry
### `isBefore()` :kind[method]

```js signature
dt.isBefore(other): boolean
```

이 시점이 다른 시점보다 이르면 `true`를 반환합니다.

```js
datetime('2026-11-16T16:59Z').isBefore('2026-11-16T17:00Z'); // true
```
:::

:::entry
### `isAfter()` :kind[method]

```js signature
dt.isAfter(other): boolean
```

이 시점이 다른 시점보다 늦으면 `true`를 반환합니다.

```js
datetime('2026-11-16T17:01Z').isAfter('2026-11-16T17:00Z'); // true
```
:::

:::entry
### `isSame()` :kind[method]

```js signature
dt.isSame(other, unit?, firstDay?): boolean
```

두 시점을 이 인스턴스의 시간대 기준으로 보았을 때 같은 달력 또는 시각 단위에 속하는지 확인합니다. 단위를 생략하고 `isSame()`을 호출하면 정확히 같은 시점인지 검사합니다.

**매개변수**

```params
- name: other
  type: DateTimeInput
  required: true
  description: "이 인스턴스의 시간대 기준으로 비교할 대상 시점."
- name: unit
  type: Unit
  description: "비교할 영어 달력·시각 단위명(예: `'day'`, `'month'`)."
- name: firstDay
  type: DayOfWeek
  description: "`unit`이 `'week'`일 때 주의 첫 요일을 지정하는 영어 요일명 또는 ISO 요일 번호."
```

**반환값**

```returns
type: boolean
description: "이 시간대에서 두 시점이 같은 `unit`에 속하면 `true`."
```

```js
const la = datetime('2026-11-16T09:30', 'America/Los_Angeles');
const lateUtc = datetime('2026-11-17T02:00Z', 'UTC');

la.isSame(lateUtc, 'day'); // true (로스앤젤레스 기준 11월 16일 오후 6:00)
lateUtc.isSame(la, 'day'); // false (UTC 기준 11월 17일과 11월 16일)
```
:::

### 달력 판별 메서드

인수 없이 호출하며 인스턴스의 시간대 기준으로 평가합니다.

| 메서드 | 타입 | 설명 |
|---|---|---|
| `isPast()`, `isFuture()` | `boolean` | 이 시점이 현재 시점보다 과거인지 또는 미래인지 여부. |
| `isToday()`, `isTomorrow()`, `isYesterday()` | `boolean` | 현지 달력 날짜가 이 시간대의 오늘·내일·어제와 일치하는지 여부. |
| `isWeekday()`, `isWeekend()` | `boolean` | 활성 로케일 기준 평일·주말 여부(예: `en-US`는 토·일, `ar-SA`는 금·토). |
| `isLeapYear()` | `boolean` | 현지 연도가 윤년인지 여부. |

## 기간과 범위 측정

:::entry
### `until()` :kind[method]

```js signature
dt.until(other): Duration
dt.until(other, unit): number
```

이 시점부터 다른 시점까지의 기간을 측정하며, 대상이 더 이르면 음수 기간을 반환합니다. 영어 단위명을 전달하면 [`Duration`](/api/duration/) 대신 총 기간을 단일 숫자로 반환합니다.

**매개변수**

```params
- name: other
  type: DateTimeInput
  required: true
  description: "측정 대상이 되는 끝 시점."
- name: unit
  type: Unit
  description: "총 기간을 부동소수점 숫자로 환산할 영어 단위명."
```

**반환값**

```returns
type: Duration | number
description: "일과 시각 단위로 계산된 `Duration`, 또는 `unit`을 지정한 경우 총 기간 숫자."
```

```js
const doors = datetime('2026-11-16T08:00', 'America/Los_Angeles');
const standup = datetime('2026-11-16T09:30', 'America/Los_Angeles');

doors.until(standup).format('long', 'en-US'); // '1 hour, 30 minutes'
doors.until(standup, 'hours'); // 1.5
```
:::

:::entry
### `since()` :kind[method]

```js signature
dt.since(other): Duration
dt.since(other, unit): number
```

이전 시점부터 이 시점까지 경과한 기간을 측정합니다. 영어 단위명을 전달하면 전체 기간을 숫자로 반환합니다.

```js
const standup = datetime('2026-11-16T09:30', 'America/Los_Angeles');

standup.since('2026-11-16T08:00', 'minutes'); // 90
```
:::

:::entry
### `to()` :kind[method]

```js signature
dt.to(end): DateTimeRange
dt.to(count, unit): DateTimeRange
dt.for(length): DateTimeRange
dt.for(count, unit): DateTimeRange
```

이 시점에서 시작해 대상 시점 또는 지정한 기간이 끝나는 시점까지(상한 제외)를 나타내는 반개방 [`DateTimeRange`](/api/ranges/#datetimerange)를 생성합니다. 끝 시점이 시작 시점보다 이르면 `RangeError`를 던집니다. 기간을 명시적으로 전달하려면 `for()`를 사용하세요(`for()`는 끝 시점이나 단위 없는 숫자를 거부합니다).

**매개변수**

```params
- name: end
  type: DateTimeInput | DurationInput | number
  required: true
  description: "상한으로 제외되는 끝 시점, 기간, 또는 `unit`과 함께 쓰는 숫자 `count`."
- name: unit
  type: Unit
  description: "첫 번째 인수가 숫자일 때 사용하는 영어 단위명(예: `'hours'`, `'days'`)."
```

**반환값**

```returns
type: DateTimeRange
description: "이 인스턴스의 시간대 기준 반개방 `DateTimeRange`."
```

```js
const standup = datetime('2026-11-16T09:30', 'America/Los_Angeles');

standup.to('2026-11-16T10:00').duration.minutes; // 30
standup.for(2, 'hours').end.hour; // 11
```
:::

:::entry
### `range()` :kind[method]

```js signature
dt.range(unit, firstDay?): DateTimeRange
```

이 시점이 속한 달력 또는 시각 단위의 시작 시점부터 다음 단위의 시작 시점까지(상한 제외, `[start, nextStart)`)를 나타내는 반개방 [`DateTimeRange`](/api/ranges/#datetimerange)를 반환합니다.

**매개변수**

```params
- name: unit
  type: Unit
  required: true
  description: "`'year'`부터 `'nanosecond'`까지의 영어 달력·시각 단위명."
- name: firstDay
  type: DayOfWeek
  description: "`unit`이 `'week'`일 때 주의 첫 요일을 지정하는 영어 요일명 또는 ISO 요일 번호."
```

**반환값**

```returns
type: DateTimeRange
description: "이 시간대에서 `unit` 전체 구간에 해당하는 반개방 `DateTimeRange`."
```

```js
const event = datetime('2026-11-16T14:45', 'UTC');

event.range('day').toString();
// '2026-11-16T00:00:00.000Z/2026-11-17T00:00:00.000Z'
```
:::

## 포맷과 변환

:::entry
### `format()` :kind[method]

```js signature
dt.format(spec?, locale?): string
```

내장 프리셋, [`configure()`](/api/configure/)에 등록한 사용자 지정 포맷 이름, `Intl` 옵션 객체, 또는 토큰 패턴으로 활성 시간대의 날짜와 시각을 포맷합니다.

`'LT'`부터 `'llll'`까지의 현지화 프리셋이 기본 내장되어 있으며, 리터럴 텍스트는 `[대괄호]`로 감쌀 수 있습니다. 전체 프리셋과 토큰 목록은 [포맷](/guides/formatting/)에서 확인하세요.

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
description: "인스턴스의 시간대 기준으로 포맷된 문자열."
```

```js
const standup = datetime('2026-11-16T09:30', 'America/Los_Angeles');

standup.format('medium', 'en-US'); // 'Nov 16, 2026, 9:30 AM'
standup.format('full', 'en-US'); // 'Monday, November 16, 2026 at 9:30 AM'
standup.format('LLL', 'en-US'); // 'November 16, 2026 at 9:30 AM'
standup.format('text', 'en-US'); // 'Nov 16, 2026, 9:30 AM PST'
standup.format('YYYY-MM-DD HH:mm'); // '2026-11-16 09:30'
standup.format('MMM D [at] h:mm a', 'en-US'); // 'Nov 16 at 9:30 am'
standup.format(
  { weekday: 'short', hour: '2-digit', minute: '2-digit' },
  'de-DE',
); // 'Mo., 09:30'
```
:::

:::entry
### `from()` :kind[method]

```js signature
dt.from(other?, locale?): string
dt.formatRelative(other?, locale?): string
```

다른 시점과 이 시점 사이의 시간 차이를 `Intl.RelativeTimeFormat`으로 포맷해 `'3 hours ago'`나 `'in 2 days'` 같은 현지화 표현을 반환합니다.

첫 번째 인수를 생략하면 현재 시점을 기준으로 비교하며, [`formatRelative()`](#formatrelative)를 별칭으로 사용할 수 있습니다. 차이가 0초이면 로케일에 맞춰 `'now'`(한국어에서는 ‘지금’)처럼 출력하고, 일·월·년 단위는 ‘어제’ 같은 달력 단어 대신 숫자로 표기합니다.

**매개변수**

```params
- name: other
  type: DateTimeInput
  description: "비교 기준 시점. 시간대가 없는 입력은 이 인스턴스의 시간대로 해석하며, 생략하면 현재 시점을 기본값으로 사용합니다."
- name: locale
  type: Locale
  description: "이번 호출에서만 인스턴스 로케일이나 기본 로케일을 덮어쓸 BCP 47 로케일 태그."
```

**반환값**

```returns
type: string
description: "현지화된 상대 시간 표현 문자열."
```

```js
const anchor = datetime('2026-11-16T12:00', 'UTC');

anchor.from(anchor, 'en-US'); // 'now'
anchor.minus(3, 'hours').from(anchor, 'en-US'); // '3 hours ago'
anchor.minus(23, 'hours').from(anchor, 'en-US'); // '1 day ago'
anchor.plus(45, 'minutes').from(anchor, 'en-US'); // 'in 1 hour'
anchor.minus(3, 'hours').from(anchor, 'es'); // 'hace 3 horas'
```
:::

:::entry
### `fromNow()` :kind[method]

```js signature
dt.fromNow(locale?): string
```

현재 시점으로부터 이 시점이 얼마나 떨어져 있는지 현지화 표현으로 포맷합니다. 기준 시점 없이 [`from()`](#from)을 호출하는 것과 같습니다.

**매개변수**

```params
- name: locale
  type: Locale
  description: "이번 호출에서만 인스턴스 로케일이나 기본 로케일을 덮어쓸 BCP 47 로케일 태그."
```

**반환값**

```returns
type: string
description: "현재 시점 기준의 현지화된 상대 시간 표현 문자열."
```

```js
now().minus(5, 'minutes').fromNow('en-US'); // '5 minutes ago'
now().plus(2, 'hours').fromNow('en-US'); // 'in 2 hours'
```
:::

:::entry
### `formatRelative()` :kind[method]

```js signature
dt.formatRelative(other?, locale?): string
```

[`from()`](#from)의 별칭으로, `other`(생략 시 현재 시점)에서 경과한 시간을 현지화 표현으로 포맷합니다.
:::

:::entry
### `locale()` :kind[method]

```js signature
dt.locale(): Locale | undefined
dt.locale(tag): DateTime
```

이 시점에 지정된 로케일을 읽거나, 프리셋·주 경계·파생 값 전반에 다른 로케일을 적용한 복사본을 반환합니다. 밑줄 표기 태그와 `Accept-Language` 헤더는 자동으로 정규화되며, 빈 태그나 `null`을 전달하면 로케일 지정을 해제합니다. [`lang()`](#lang)을 별칭으로 사용할 수 있습니다.

**매개변수**

```params
- name: tag
  type: Locale | null | undefined
  description: "적용할 로케일 태그, 태그 배열, 또는 `Accept-Language` 헤더. 기존 로케일을 해제하려면 `null`을 전달합니다."
```

**반환값**

```returns
type: DateTime | Locale | undefined
description: "인수 없이 호출하면 활성 로케일 태그, 인수를 전달하면 `tag`를 적용한 새 `DateTime`."
```

```js
const standup = datetime('2026-11-16T09:30', 'Europe/Berlin').locale('es-ES');

standup.locale(); // 'es-ES'
standup.plus(1, 'week').date.format('long'); // '23 de noviembre de 2026'
standup.locale(null).locale(); // undefined
```
:::

:::entry
### `lang()` :kind[method]

```js signature
dt.lang(): Locale | undefined
dt.lang(tag): DateTime
```

이 시점의 BCP 47 로케일 태그를 읽거나 지정하는 [`locale()`](#locale)의 단축 별칭입니다.
:::

:::entry
### `as()` :kind[method]

```js signature
dt.as('datetime'): DateTime
dt.as('date'): CalendarDate
dt.as('time'): Time
dt.as('yearMonth'): YearMonth
dt.as('monthDay'): MonthDay
```

프로퍼티 접근으로 흐름을 끊지 않고 메서드 체인 안에서 이 시점을 다른 타입으로 변환합니다. 활성 시간대 기준의 [`YearMonth`](/api/year-month/)와 [`MonthDay`](/api/month-day/) 변환도 지원합니다.

**매개변수**

```params
- name: kind
  type: "'datetime' | 'date' | 'time' | 'yearMonth' | 'monthDay'"
  required: true
  description: "활성 시간대 기준으로 변환할 대상 타입 이름."
```

**반환값**

```returns
type: DateTime | CalendarDate | Time | YearMonth | MonthDay
description: "이 인스턴스의 시간대 기준으로 변환된 값."
```

```js
const standup = datetime('2026-11-16T09:30', 'America/Los_Angeles');

standup.in('Asia/Tokyo').as('date').toString(); // '2026-11-17'
standup.in('Asia/Tokyo').as('time').toString(); // '02:30:00'
standup.as('yearMonth').toString(); // '2026-11'
standup.as('monthDay').toString(); // '11-16'
```
:::

:::entry
### `toString()` :kind[method]

```js signature
dt.toString(): string
dt.toJSON(): string
```

데이터베이스, URL, 네트워크 페이로드에 바로 쓸 수 있는 UTC ISO 8601 문자열로 시점을 반환합니다. `toJSON()`도 `JSON.stringify()`를 위해 동일한 문자열을 반환합니다.

**반환값**

```returns
type: string
description: "UTC ISO 8601 타임스탬프 문자열(예: `'2026-11-16T17:30:00.000Z'`)."
```

```js
const standup = datetime('2026-11-16T09:30', 'America/Los_Angeles');

standup.toString(); // '2026-11-16T17:30:00.000Z'
JSON.stringify({ standup }); // '{"standup":"2026-11-16T17:30:00.000Z"}'
```
:::

:::entry
### `toJSDate()` :kind[method]

```js signature
dt.toJSDate(): Date
```

같은 시점을 나타내는 네이티브 JavaScript `Date` 인스턴스를 반환합니다.
:::

:::entry
### `toTemporal()` :kind[method]

```js signature
dt.toTemporal(): Temporal.ZonedDateTime
```

내부의 `Temporal.ZonedDateTime` 인스턴스를 반환합니다.
:::

:::entry
### `valueOf()` :kind[method]

```js signature
dt.valueOf(): number
```

유닉스 에포크 밀리초를 반환하므로 두 `DateTime` 값을 숫자 연산자로 빼거나 비교할 수 있습니다.
:::
