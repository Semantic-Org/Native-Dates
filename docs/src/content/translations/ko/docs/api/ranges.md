---
source: 556537c8ff45
title: 범위
lede: 포함 여부, 겹침 판별, 단위별 순회를 지원하는 두 날짜·시점·시각 사이의 구간.
---

## 범위 클래스

[범위 팩토리 함수](/api/range-fn/)(`dateRange()`, `datetimeRange()`, `timeRange()`)로 범위를 직접 생성하거나, 기존 지점에서 [`to()`](#to), [`for()`](#to), [`range()`](#range)를 체이닝해 생성합니다. 모든 범위 인스턴스는 불변입니다.

:::note[양 끝 포함 날짜 범위 vs 반개방 시점·시각 범위]
달력 날짜 범위는 9월 1일부터 9월 7일까지가 7일 전체를 뜻하므로 마지막 날을 포함합니다. 반면 시점 범위와 시각 범위는 연속된 구간이 겹치지 않고 맞물리도록 끝 지점을 제외하는 반개방 구간을 사용합니다.
:::

:::entry
### `DateRange` :kind[class]

```js signature
new DateRange(start, end, options?)
new DateRange(interval, options?)
```

두 [달력 날짜](/api/calendar-date/) 사이를 나타내며 양 끝 날짜를 모두 포함합니다. 종료 날짜가 시작 날짜보다 이르면 `RangeError`를 던집니다.

```js title="ranges.js"
import { dateRange } from 'native-dates';

const trip = dateRange('2026-09-01', '2026-09-07');
const week = dateRange('2026-09-01', '7 days');

trip.duration.days; // 7
week.toString(); // '2026-09-01/2026-09-07'
```
:::

:::entry
### `DateTimeRange` :kind[class]

```js signature
new DateTimeRange(start, end, options?)
new DateTimeRange(interval, options?)
```

두 [시점](/api/date-time/) 사이를 나타내며 시작 시점은 포함하고 끝 시점은 제외합니다. 끝 입력에 명시적인 시간대가 없으면 시작 시점의 시간대로 해석하며, 끝 시점이 시작 시점보다 이르면 `RangeError`를 던집니다.

```js
import { datetimeRange } from 'native-dates';

const block = datetimeRange('2026-09-01T09:00', '2026-09-01T10:30', 'America/New_York');
const standup = datetimeRange('2026-09-01T09:00', '30m', 'America/New_York');

standup.duration.minutes; // 30
block.end.hour; // 10
```
:::

:::entry
### `TimeRange` :kind[class]

```js signature
new TimeRange(start, end, options?)
new TimeRange(interval, options?)
```

두 [시각](/api/time/) 사이를 나타내며 시작 시각은 포함하고 끝 시각은 제외합니다. 끝 시각이 시작 시각보다 이르면 자정을 넘어 이어지는 야간 구간으로 처리합니다.

```js
import { timeRange } from 'native-dates';

const dayShift = timeRange('9:00am', '5:00pm');
const nightShift = timeRange('22:00', '06:00');

dayShift.duration.hours; // 8
nightShift.duration.hours; // 8
```
:::

## 프로퍼티

모든 범위는 포맷된 레이블, 타입이 지정된 양 끝 지점, 종류 태그, 측정된 기간을 제공합니다.

| 프로퍼티 | 타입 | 설명 |
|---|---|---|
| `text` | `string` | 로케일에 맞춰 포맷한 범위 문자열(예: `'Sep 1 – 7, 2026'`). |
| `start`, `end` | `CalendarDate \| DateTime \| Time` | 범위 클래스에 대응하는 시작 지점과 끝 지점. |
| `kind` | `'date' \| 'datetime' \| 'time'` | 범위가 담고 있는 지점의 종류를 나타내는 태그. |
| `duration` | [`Duration`](/api/duration/) | `start`를 기준으로 측정한 전체 길이. 날짜 범위는 마지막 날까지 포함하고, 야간 시각 범위는 자정을 넘어 계산합니다. |

## 기준 지점에서 범위 생성

:::entry
### `to()` :kind[method]

```js signature
d.to(end, unit?): DateRange
d.through(end, unit?): DateRange
d.for(length, unit?): DateRange
dt.to(end, unit?): DateTimeRange
dt.for(length, unit?): DateTimeRange
t.to(end, unit?): TimeRange
t.for(length, unit?): TimeRange
```

이 지점에서 끝 지점까지 또는 지정한 기간만큼 이어지는 범위를 생성합니다. [달력 날짜](/api/calendar-date/)에서는 양 끝을 모두 포함하므로 7일 길이를 지정하면 시작일로부터 6일 뒤의 날짜가 끝 날짜가 됩니다.

명시적인 기간 길이로 범위를 만들 때는 `for()`를 사용하세요(`for()`는 끝 지점이나 단위 없는 숫자를 거부합니다). 달력 날짜는 마지막 날을 포함하므로 `to()`의 별칭으로 `through()`도 제공합니다.

**매개변수**

```params
- name: end
  type: Point | DurationInput | number
  required: true
  description: "같은 종류의 끝 지점, `Duration`·ISO 8601·영어 기간 문자열 같은 기간 입력값, 또는 `unit`과 함께 쓰는 숫자 `count`."
- name: unit
  type: Unit
  description: "첫 번째 인수가 숫자일 때 사용하는 영어 단위명."
```

**반환값**

```returns
type: DateRange | DateTimeRange | TimeRange
description: "호출 대상의 종류에 맞는 범위 인스턴스."
```

```js
import { date, datetime, time } from 'native-dates';

date('2026-09-01').for(7, 'days').toString(); // '2026-09-01/2026-09-07'
datetime('2026-09-01T09:00Z', 'UTC').for(90, 'minutes').toString(); // '2026-09-01T09:00:00.000Z/2026-09-01T10:30:00.000Z'
time('9:00am').to('5:00pm').toString(); // '09:00:00/17:00:00'
```
:::

:::entry
### `range()` :kind[method]

```js signature
d.range(unit, firstDay?): DateRange
dt.range(unit, firstDay?): DateTimeRange
```

날짜나 시점을 감싸는 달력 단위 또는 시각 단위 전체의 범위를 반환합니다. 날짜 범위는 해당 단위의 첫날부터 마지막 날까지를, 시점 범위는 해당 단위의 시작부터 다음 단위의 시작까지(상한 제외)를 나타냅니다.

**매개변수**

```params
- name: unit
  type: Unit
  required: true
  description: "`'week'`, `'month'`, `'day'`처럼 대상을 감싸는 영어 단위명."
- name: firstDay
  type: DayOfWeek
  description: "`unit`이 `'week'`일 때 주의 시작 요일로 사용할 영어 요일명. `configure()`와 활성 로케일 설정을 덮어씁니다."
```

**반환값**

```returns
type: DateRange | DateTimeRange
description: "`unit` 전체를 감싸는 범위."
```

```js
import { date, datetime } from 'native-dates';

date('2026-11-18', { locale: 'en-US' }).range('week').toString(); // '2026-11-15/2026-11-21'
date('2026-11-18').range('week', 'monday').toString(); // '2026-11-16/2026-11-22'
date('2026-02-10').range('month').toString(); // '2026-02-01/2026-02-28'
datetime('2026-11-16T14:20Z', 'UTC').range('hour').toString(); // '2026-11-16T14:00:00.000Z/2026-11-16T15:00:00.000Z'
```
:::

## 포함 여부와 겹침

:::entry
### `contains()` :kind[method]

```js signature
range.contains(value): boolean
range.includes(value): boolean
```

같은 종류의 지점이나 다른 범위가 이 범위 안에 들어오는지 확인합니다. 날짜 범위는 `end`를 포함하고 시점·시각 범위는 `end`를 제외하며, 야간 시각 범위는 자정 앞뒤의 시각을 모두 포함합니다. `includes()`를 별칭으로 사용할 수 있습니다.

**매개변수**

```params
- name: value
  type: Point | Range
  required: true
  description: "같은 종류의 지점 입력값 또는 범위."
```

**반환값**

```returns
type: boolean
description: "`value`가 이 범위 안에 속하면 `true`."
```

```js
const stay = dateRange('2026-09-01', '2026-09-07');
stay.contains('2026-09-07'); // true

const night = timeRange('22:00', '06:00');
night.contains('23:30'); // true
night.contains('02:15'); // true
night.contains('06:00'); // false
```
:::

:::entry
### `overlaps()` :kind[method]

```js signature
range.overlaps(other): boolean
```

같은 종류의 두 범위가 하루 이상 또는 한 시점 이상을 공유하면 `true`를 반환합니다. 앞 구간의 끝과 뒤 구간의 시작이 맞닿은 연속 시점·시각 범위는 겹치지 않는 것으로 판별합니다.

**매개변수**

```params
- name: other
  type: Range | string
  required: true
  description: "같은 종류의 범위 인스턴스 또는 ISO 구간 문자열."
```

**반환값**

```returns
type: boolean
description: "두 범위가 겹치는 구간이 있으면 `true`."
```

```js
const firstSlot = timeRange('09:00', '10:00');
const nextSlot = timeRange('10:00', '11:00');

firstSlot.overlaps(nextSlot); // false
dateRange('2026-09-01', '2026-09-05').overlaps('2026-09-05/2026-09-10'); // true
```
:::

:::entry
### `intersection()` :kind[method]

```js signature
range.intersection(other): Range | null
```

두 범위가 공유하는 구간만 담은 새 범위를 반환하며, 겹치지 않으면 `null`을 반환합니다. 두 야간 시각 범위가 서로 떨어진 두 조각으로 교차하는 경우에는 `RangeError`를 던집니다.

**매개변수**

```params
- name: other
  type: Range | string
  required: true
  description: "같은 종류의 범위 인스턴스 또는 ISO 구간 문자열."
```

**반환값**

```returns
type: DateRange | DateTimeRange | TimeRange | null
description: "겹치는 구간을 담은 같은 종류의 범위, 또는 겹치지 않으면 `null`."
```

```js
const a = dateRange('2026-09-01', '2026-09-10');
const b = dateRange('2026-09-05', '2026-09-15');

a.intersection(b)?.toString(); // '2026-09-05/2026-09-10'
a.intersection('2026-09-20/2026-09-25'); // null
```
:::

:::entry
### `equals()` :kind[method]

```js signature
range.equals(other): boolean
```

두 범위의 시작 지점과 끝 지점이 모두 같으면 `true`를 반환합니다. 범위 배열은 [`compare()`](/api/compare/)로 시간순 정렬할 수도 있습니다.

```js
dateRange('2026-09-01', '2026-09-07').equals('2026-09-01/2026-09-07'); // true
```
:::

:::entry
### `isEmpty()` :kind[method]

```js signature
range.isEmpty(): boolean
```

시점 범위나 시각 범위의 시작 지점과 끝 지점이 동일하면 `true`를 반환합니다. [`DateRange`](#daterange)는 단일 날짜도 하루 전체를 차지하므로 항상 `false`를 반환합니다.

```js
timeRange('09:00', '09:00').isEmpty(); // true
dateRange('2026-09-01', '2026-09-01').isEmpty(); // false
```
:::

## 순회, 분할, 시간대 변환

:::entry
### `every()` :kind[method]

```js signature
range.every(step): Point[]
range.every(count, unit): Point[]
```

`start`에서 양수 단위나 기간 간격으로 나아가며 범위 안에 속하는 모든 지점을 반환합니다. 직전 결과에 덧셈을 누적하지 않고 시작 지점에서 배수만큼 계산하므로, 1월 31일부터 월 단위로 순회하면 각 달의 말일에 정확히 맞춰집니다.

**매개변수**

```params
- name: step
  type: Unit | DurationInput | number
  required: true
  description: "`'day'` 같은 영어 단위명, `Duration`·ISO 8601·영어 기간 문자열 같은 기간 입력값, 또는 `unit`과 함께 쓰는 숫자 `count`."
- name: unit
  type: Unit
  description: "`step`이 숫자일 때 사용하는 영어 단위명."
```

**반환값**

```returns
type: Array<CalendarDate | DateTime | Time>
description: "범위 안에 속하는 지점의 순서 있는 배열."
```

```js
dateRange('2026-01-31', '2026-04-30').every('month').map(String);
// ['2026-01-31', '2026-02-28', '2026-03-31', '2026-04-30']

timeRange('22:00', '02:00').every(1, 'hour').map(String);
// ['22:00:00', '23:00:00', '00:00:00', '01:00:00']
```
:::

:::entry
### `count()` :kind[method]

```js signature
dateRange.count(kind?): number
```

중간 날짜 인스턴스를 생성하지 않고 [`DateRange`](#daterange) 안의 달력 일수를 셉니다. `'days'`(기본값), `'weekdays'`, `'weekends'`, 또는 `'mondays'` 같은 영어 요일명을 전달할 수 있으며, `'weekdays'`와 `'weekends'`는 활성 로케일의 주말 기준을 따릅니다.

**매개변수**

```params
- name: kind
  type: string
  default: "'days'"
  description: "`'days'`, `'weekdays'`, `'weekends'`, 또는 `'mondays'` 같은 영어 요일명."
```

**반환값**

```returns
type: number
description: "범위 안에서 조건에 해당하는 달력 일수."
```

```js
const sprint = dateRange('2026-05-01', '2 weeks');

sprint.count(); // 14
sprint.count('weekdays'); // 10
sprint.count('weekends'); // 4
sprint.count('mondays'); // 2
```
:::

:::entry
### `split()` :kind[method]

```js signature
range.split(step): Range[]
range.split(count, unit): Range[]
range.splitBy(step): Range[]
range.splitBy(count, unit): Range[]
```

범위를 지정한 간격의 연속된 하위 범위로 분할하며, 마지막 조각은 원래 범위의 끝에 맞춰 보정합니다. [`every()`](#every)와 동일한 간격 인수를 받으며, `splitBy()`를 별칭으로 사용할 수 있습니다.

```js
dateRange('2026-09-01', '2026-09-10').split(4, 'days').map(String);
// ['2026-09-01/2026-09-04', '2026-09-05/2026-09-08', '2026-09-09/2026-09-10']
```
:::

:::entry
### `in()` :kind[method]

```js signature
dateRange.in(zone?): DateTimeRange
dtRange.in(zone): DateTimeRange
```

[`DateRange`](#daterange)를 시작일 자정부터 종료일 다음 날 자정(상한 제외)까지를 나타내는 반개방 [`DateTimeRange`](#datetimerange)로 변환하므로, 타임스탬프 조회 조건의 경계와 정확히 일치합니다. 시점 범위에서 호출하면 시작과 끝 두 시점을 모두 대상 시간대로 변환합니다.

시각 범위에는 달력 날짜가 없으므로 `in()`을 호출하면 `RangeError`를 던집니다.

**매개변수**

```params
- name: zone
  type: Zone
  description: "대상 IANA 시간대, 고정 UTC 오프셋, 또는 `'UTC'`. `DateRange`에서 생략하면 설정된 기본 시간대를 사용합니다."
```

**반환값**

```returns
type: DateTimeRange
description: "`zone` 기준의 반개방 시점 범위."
```

```js
dateRange('2026-09-01', '2026-09-03').in('UTC').toString();
// '2026-09-01T00:00:00.000Z/2026-09-04T00:00:00.000Z'
```
:::

## 포맷과 변환

:::entry
### `format()` :kind[method]

```js signature
range.format(spec?, locale?): string
```

프리셋과 옵션 객체에는 현지화된 `Intl` 범위 포맷을 적용해 공통된 날짜나 월을 자동으로 축약합니다. 토큰 패턴은 양 끝 지점을 각각 포맷한 뒤 `' – '`로 이어 붙입니다.

[`configure()`](/api/configure/)에 등록한 사용자 지정 포맷도 그대로 동작합니다. 프리셋과 토큰의 자세한 내용은 [포맷](/guides/formatting/)에서 확인하세요.

**매개변수**

```params
- name: spec
  type: FormatSpec
  description: "프리셋 이름, `Intl.DateTimeFormatOptions` 객체, 또는 토큰 패턴."
- name: locale
  type: Locale
  description: "이번 호출에서만 인스턴스 로케일이나 기본 로케일을 덮어쓸 BCP 47 로케일 태그."
```

**반환값**

```returns
type: string
description: "포맷된 범위 문자열."
```

```js
const trip = dateRange('2026-09-01', '2026-09-07');

trip.format('medium', 'en-US'); // 'Sep 1 – 7, 2026'
trip.format('YYYY-MM-DD'); // '2026-09-01 – 2026-09-07'
timeRange('22:00', '06:00').format('HH:mm'); // '22:00 – 06:00'
```
:::

:::entry
### `locale()` :kind[method]

```js signature
range.locale(): Locale | undefined
range.locale(tag): Range
```

이 범위에 지정된 로케일을 읽거나, 텍스트 미리보기·프리셋·양 끝 지점·하위 범위 전반에 다른 로케일을 적용한 복사본을 반환합니다. 빈 태그나 `null`을 전달하면 로케일 지정을 해제하며, [`lang()`](#lang)을 별칭으로 사용할 수 있습니다.

**매개변수**

```params
- name: tag
  type: Locale | null | undefined
  description: "적용할 BCP 47 로케일 태그. 기존 태그를 해제하려면 `null`을 전달합니다."
```

**반환값**

```returns
type: Range | Locale | undefined
description: "인수 없이 호출하면 활성 로케일 태그, 인수를 전달하면 `tag`를 적용한 같은 종류의 새 범위."
```

```js
const stay = dateRange('2026-09-01', '2026-09-07').locale('de-DE');

stay.locale(); // 'de-DE'
stay.format('medium'); // '01.–07.09.2026'
stay.duration.text; // '7 Tage'
```
:::

:::entry
### `lang()` :kind[method]

```js signature
range.lang(): Locale | undefined
range.lang(tag): Range
```

이 범위의 BCP 47 로케일 태그를 읽거나 지정하는 [`locale()`](#locale)의 단축 별칭입니다.
:::

:::entry
### `as()` :kind[method]

```js signature
range.as('duration'): Duration
```

메서드 체인에서 `'duration'`을 요청하면 이 범위의 기간을 반환하고, 다른 타입을 요청하면 `RangeError`를 던집니다.

```js
dateRange('2026-09-01', '2026-09-07').as('duration').days; // 7
```
:::

:::entry
### `toString()` :kind[method]

```js signature
range.toString(): string
range.toJSON(): string
```

ISO 8601 구간 문자열 `'start/end'`를 반환하며, 이 문자열은 [범위 팩토리 함수](/api/range-fn/)에서 바로 다시 파싱할 수 있습니다. `toJSON()`도 JSON 직렬화를 위해 동일한 문자열을 반환합니다.

```js
dateRange('2026-09-01', '2026-09-07').toString(); // '2026-09-01/2026-09-07'
timeRange('9am', '5pm').toJSON(); // '09:00:00/17:00:00'
```
:::

:::entry
### `valueOf()` :kind[method]

```js signature
range.valueOf(): never
```

숫자 연산자가 범위를 숫자로 암묵적 변환하지 않도록 `RangeError`를 던집니다.

런타임에 타입을 알 수 없는 값을 좁히려면 [`kindOf()`](/api/kind-of/)나 패키지가 제공하는 [범위 타입 가드 함수](/api/kind-of/#type-guards)를 사용하세요.

```js
import { dateRange, isDateRange, isDateTimeRange, isTimeRange } from 'native-dates';

const stay = dateRange('2026-09-01', '2026-09-07');
isDateRange(stay); // true
isDateTimeRange(stay); // false
isTimeRange(stay); // false
```
:::
