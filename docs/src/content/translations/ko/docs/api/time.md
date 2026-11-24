---
source: 3e14665094ab
title: Time
lede: 달력 날짜와 시간대 정보가 없는 하루 중의 시각.
---

## Time 생성

[`time()`](/api/time-fn/)으로 12시간제·24시간제 시각 문자열을 파싱하거나, 시·분 숫자를 전달하거나, 기존 값을 변환해 인스턴스를 생성합니다. 모든 인스턴스는 불변이므로 원본 값을 변경하지 않고, 값을 바꾸는 메서드마다 새 인스턴스를 반환합니다.

```js title="create.js"
import { time } from 'native-dates';

const morning = time('9:30am');
const evening = time('17:30');
const alarm = time(6, 45);
```

임의의 [`DateTime`](/api/date-time/)에서 `time` 프로퍼티로 현지 시각을 바로 읽을 수도 있습니다.

```js
import { datetime, now } from 'native-dates';

const standup = datetime('2026-11-16T09:30', 'America/Los_Angeles');
standup.time.toString(); // '09:30:00'
const currentClock = now().time;
```

## 프로퍼티

프로퍼티는 시부터 나노초까지 24시간제 시각 필드를 읽습니다.

| 프로퍼티 | 타입 | 설명 |
|---|---|---|
| `text` | `string` | 로케일에 맞춰 포맷한 시각(예: `'9:30 AM'`). |
| `hour`, `minute`, `second` | `number` | 24시간제 시각 필드(0–23, 0–59, 0–59). |
| `millisecond`, `microsecond`, `nanosecond` | `number` | 초 미만 시각 필드(0–999). |

## 결합과 필드

시각을 달력 날짜와 결합해 시점을 만들거나 개별 시각 필드를 바꿉니다.

:::entry
### `on()` :kind[method]

```js signature
t.on(date, zone?): DateTime
```

이 시각을 특정 시간대의 달력 날짜와 결합해 [`DateTime`](/api/date-time/)을 반환합니다. [`CalendarDate`](/api/calendar-date/)에서 [`at()`](/api/calendar-date/#at)을 호출하는 것과 대칭되는 메서드입니다.

**매개변수**

```params
- name: date
  type: CalendarDateInput
  required: true
  description: "ISO 날짜 문자열, `CalendarDate`, `DateTime`, 필드 객체, 또는 `Date`."
- name: zone
  type: Zone
  description: "IANA 시간대 이름, 고정 UTC 오프셋, 또는 `'UTC'`. 생략하면 설정된 기본 시간대를 사용합니다."
```

**반환값**

```returns
type: DateTime
description: "`zone`에서 `date` 날짜의 이 시각을 나타내는 새 `DateTime`."
```

```js
const opens = time('9:30am');

opens.on('2026-11-16', 'America/New_York').toString(); // '2026-11-16T14:30:00.000Z'
```
:::

:::entry
### `set()` :kind[method]

```js signature
t.set(fields): Time
t.set(unit, value): Time
```

하나 이상의 시각 필드를 바꾼 새 `Time`을 반환합니다. 분에 75를 넣는 것처럼 허용 범위를 벗어난 값은 `RangeError`를 던집니다.

**매개변수**

```params
- name: fields
  type: DateTimeFields | Unit
  required: true
  description: "시각 필드 객체, 또는 `value`와 함께 전달하는 영어 단위명 하나."
- name: value
  type: number
  description: "지정한 `unit`에 설정할 정수 값."
```

**반환값**

```returns
type: Time
description: "시각 필드가 갱신된 새 `Time`."
```

```js
const reminder = time('9:30am');

reminder.set('minute', 45).toString(); // '09:45:00'
reminder.set({ hour: 17, minute: 0 }).toString(); // '17:00:00'
```
:::

## 연산과 반올림·올림·내림

시각 단위를 더하거나 빼고, 단위 경계로 이동하거나 지정한 간격에 맞춰 반올림·올림·내림합니다. 시각에는 달력 날짜가 없으므로 일·주 같은 달력 단위를 전달하면 `RangeError`를 던집니다.

:::note[자정 기준 순환]
시각 연산은 24시간 시계판처럼 자정을 기준으로 순환하므로 `23:00`에 2시간을 더하면 `01:00`을 반환합니다. 자정을 넘길 때 달력 날짜도 함께 바뀌어야 한다면 먼저 [`on()`](#on)으로 날짜와 결합하세요.
:::

:::entry
### `plus()` :kind[method]

```js signature
t.plus(amount, unit?): Time
t.add(amount, unit?): Time
```

24시간 시계 기준으로 앞으로 이동한 새 `Time`을 반환하며, 자정을 넘기면 `00:00`부터 순환합니다. `add()` 별칭도 사용할 수 있습니다.

**매개변수**

```params
- name: amount
  type: DurationInput
  required: true
  description: "`unit`과 함께 쓰는 숫자, `Duration` 인스턴스, 영어 기간 문자열, 필드 객체, 또는 밀리초."
- name: unit
  type: Unit
  description: "`amount`가 숫자일 때 사용하는 영어 시각 단위명(예: `'hours'`, `'minutes'`)."
```

**반환값**

```returns
type: Time
description: "24시간 시계 범위로 순환된 새 `Time`."
```

```js
time('9:00am').plus(90, 'minutes').toString(); // '10:30:00'
time('23:00').plus('2h').toString(); // '01:00:00'
```
:::

:::entry
### `minus()` :kind[method]

```js signature
t.minus(amount, unit?): Time
t.subtract(amount, unit?): Time
```

24시간 시계 기준으로 뒤로 이동하며, 자정 이전으로 넘어가면 `23:59` 쪽으로 순환합니다. [`plus()`](#plus)와 동일한 입력을 받으며 `subtract()` 별칭도 제공합니다.

**매개변수**

```params
- name: amount
  type: DurationInput
  required: true
  description: "`unit`과 함께 쓰는 숫자, `Duration` 인스턴스, 영어 기간 문자열, 필드 객체, 또는 밀리초."
- name: unit
  type: Unit
  description: "`amount`가 숫자일 때 사용하는 영어 시각 단위명."
```

**반환값**

```returns
type: Time
description: "24시간 시계 범위로 순환된 새 `Time`."
```

```js
time('00:30').minus(45, 'minutes').toString(); // '23:45:00'
```
:::

:::entry
### `startOf()` :kind[method]

```js signature
t.startOf(unit): Time
```

지정한 단위보다 작은 시각 필드를 모두 `0`으로 초기화합니다.

**매개변수**

```params
- name: unit
  type: Unit
  required: true
  description: "`'hour'`부터 `'nanosecond'`까지의 영어 시각 단위명."
```

**반환값**

```returns
type: Time
description: "`unit`의 시작 시각을 나타내는 새 `Time`."
```

```js
time('14:37:22').startOf('hour').toString(); // '14:00:00'
```
:::

:::entry
### `endOf()` :kind[method]

```js signature
t.endOf(unit): Time
```

지정한 시각 단위의 마지막 밀리초로 이동합니다.

**매개변수**

```params
- name: unit
  type: Unit
  required: true
  description: "`'hour'`부터 `'nanosecond'`까지의 영어 시각 단위명."
```

**반환값**

```returns
type: Time
description: "`unit`의 마지막 밀리초를 나타내는 새 `Time`."
```

```js
time('14:37:22').endOf('hour').toString(); // '14:59:59.999'
```
:::

:::entry
### `startOfNext()` :kind[method]

```js signature
t.startOfNext(unit): Time
```

이 시각이 속한 시각 단위 바로 다음 단위의 시작 시각으로 이동하며, 자정을 기준으로 순환합니다. 항상 다음 단위로 넘어가므로 `14:00:00`에서 `startOfNext('hour')`를 호출하면 `15:00:00`을 반환합니다.

**매개변수**

```params
- name: unit
  type: Unit
  required: true
  description: "`'hour'`부터 `'nanosecond'`까지의 영어 시각 단위명."
```

**반환값**

```returns
type: Time
description: "다음 `unit`의 시작 시각을 나타내는 새 `Time`."
```

```js
time('14:37:22').startOfNext('hour').toString(); // '15:00:00'
time('23:37:22').startOfNext('hour').toString(); // '00:00:00'
```
:::

:::entry
### `startOfPrevious()` :kind[method]

```js signature
t.startOfPrevious(unit): Time
```

이 시각이 속한 시각 단위 바로 이전 단위의 시작 시각으로 이동하며, 자정을 기준으로 순환합니다.

**매개변수**

```params
- name: unit
  type: Unit
  required: true
  description: "`'hour'`부터 `'nanosecond'`까지의 영어 시각 단위명."
```

**반환값**

```returns
type: Time
description: "이전 `unit`의 시작 시각을 나타내는 새 `Time`."
```

```js
time('14:37:22').startOfPrevious('hour').toString(); // '13:00:00'
time('00:15:00').startOfPrevious('hour').toString(); // '23:00:00'
```
:::

:::entry
### `round()` :kind[method]

```js signature
t.round(unit): Time
t.round(increment, unit): Time
```

가장 가까운 시각 단위나 지정한 간격으로 반올림하며, 정중앙 값은 올림 처리합니다.

**매개변수**

```params
- name: increment
  type: number | Unit
  required: true
  description: "상위 단위의 약수인 간격 값, 또는 간격이 `1`일 때의 영어 단위명."
- name: unit
  type: Unit
  description: "단위 맞춤 대상 영어 시각 단위명(`'hour'`부터 `'nanosecond'`까지)."
```

**반환값**

```returns
type: Time
description: "반올림된 새 `Time`."
```

```js
const checkin = time('14:36:00');

checkin.round('hour').toString(); // '15:00:00'
checkin.round(15, 'minutes').toString(); // '14:30:00'
```
:::

:::entry
### `floor()` :kind[method]

```js signature
t.floor(unit): Time
t.floor(increment, unit): Time
```

지정한 시각 단위나 간격의 시작 지점으로 내림합니다. [`round()`](#round)와 동일한 인수를 받습니다.

```js
time('14:29').floor(15, 'minutes').toString(); // '14:15:00'
```
:::

:::entry
### `ceil()` :kind[method]

```js signature
t.ceil(unit): Time
t.ceil(increment, unit): Time
```

다음 시각 단위나 간격의 경계로 올림합니다. [`round()`](#round)와 동일한 인수를 받습니다.

```js
time('14:01').ceil(15, 'minutes').toString(); // '14:15:00'
```
:::

## 시각 비교

비교는 하루 안에서 자정(`00:00`)부터 하루 끝(`23:59:59.999999999`)까지의 순서를 기준으로 합니다. `<` 같은 관계 연산자는 `RangeError`를 던지므로 메서드나 [`compare()`](/api/compare/)로 비교하세요.

:::entry
### `equals()` :kind[method]

```js signature
t.equals(other): boolean
```

두 값이 정확히 같은 시각을 나타내면 `true`를 반환합니다.

**매개변수**

```params
- name: other
  type: TimeInput
  required: true
  description: "다른 `Time` 또는 `time()`이 허용하는 입력값."
```

**반환값**

```returns
type: boolean
description: "두 값이 나노초까지 일치하면 `true`."
```

```js
time('5:30pm').equals('17:30'); // true
```
:::

:::entry
### `isBefore()` :kind[method]

```js signature
t.isBefore(other): boolean
```

이 시각이 하루 안에서 다른 시각보다 이르면 `true`를 반환합니다.

```js
time('9:00am').isBefore('5:00pm'); // true
```
:::

:::entry
### `isAfter()` :kind[method]

```js signature
t.isAfter(other): boolean
```

이 시각이 하루 안에서 다른 시각보다 늦으면 `true`를 반환합니다.

```js
time('5:00pm').isAfter('9:00am'); // true
```
:::

:::entry
### `isSame()` :kind[method]

```js signature
t.isSame(other, unit?): boolean
```

다른 시각이 같은 시나 같은 분처럼 동일한 시각 단위에 속하는지 확인합니다. 단위를 생략하고 `isSame()`을 호출하면 정확히 같은 시각인지 검사합니다.

**매개변수**

```params
- name: other
  type: TimeInput
  required: true
  description: "비교할 대상 시각."
- name: unit
  type: Unit
  description: "비교할 영어 시각 단위명(예: `'hour'`, `'minute'`)."
```

**반환값**

```returns
type: boolean
description: "두 시각이 같은 `unit`에 속하면 `true`."
```

```js
time('9:05am').isSame('9:45am', 'hour'); // true
time('9:05am').isSame('10:05am', 'hour'); // false
```
:::

## 기간과 범위 측정

:::entry
### `until()` :kind[method]

```js signature
t.until(other): Duration
t.until(other, unit): number
```

같은 하루 안에서 이 시각부터 다른 시각까지의 부호 있는 기간을 측정하며, 대상이 더 이르면 음수 기간을 반환합니다. 영어 단위명을 전달하면 총 기간을 숫자로 반환합니다.

**매개변수**

```params
- name: other
  type: TimeInput
  required: true
  description: "측정 대상이 되는 끝 시각."
- name: unit
  type: Unit
  description: "총 기간을 부동소수점 숫자로 환산할 영어 시각 단위명."
```

**반환값**

```returns
type: Duration | number
description: "시 단위까지 정리된 `Duration`, 또는 `unit`을 지정한 경우 총 기간 숫자."
```

```js
const opens = time('9:00am');
const closes = time('5:30pm');

opens.until(closes).format('long', 'en-US'); // '8 hours, 30 minutes'
opens.until(closes, 'hours'); // 8.5
time('22:00').until('02:00', 'hours'); // -20
```
:::

:::entry
### `since()` :kind[method]

```js signature
t.since(other): Duration
t.since(other, unit): number
```

같은 하루 안에서 더 이른 시각부터 이 시각까지 경과한 기간을 측정합니다. 영어 단위명을 전달하면 전체 기간을 숫자로 반환합니다.

```js
time('5:00pm').since('9:00am', 'hours'); // 8
```
:::

:::entry
### `to()` :kind[method]

```js signature
t.to(end): TimeRange
t.to(count, unit): TimeRange
t.for(length): TimeRange
t.for(count, unit): TimeRange
```

이 시각에서 시작해 대상 시각 또는 지정한 기간이 끝나는 시각까지(상한 제외)를 나타내는 반개방 [`TimeRange`](/api/ranges/#timerange)를 생성합니다. 끝 시각이 시작 시각보다 이르면 자정을 걸쳐 이어지는 구간으로 처리합니다. 기간을 명시적으로 전달하려면 `for()`를 사용하세요(`for()`는 끝 시각이나 단위 없는 숫자를 거부합니다).

**매개변수**

```params
- name: end
  type: TimeInput | DurationInput | number
  required: true
  description: "상한으로 제외되는 종료 시각, 시각 단위 기간, 또는 `unit`과 함께 쓰는 숫자 `count`."
- name: unit
  type: Unit
  description: "첫 번째 인수가 숫자일 때 사용하는 영어 시각 단위명(예: `'hours'`, `'minutes'`)."
```

**반환값**

```returns
type: TimeRange
description: "이 시각에서 시작하는 반개방 `TimeRange`."
```

```js
time('9:00am').to('5:00pm').duration.hours; // 8
time('9:00am').for(90, 'minutes').end.toString(); // '10:30:00'
time('22:00').to('06:00').duration.hours; // 8
```
:::

## 포맷과 변환

:::entry
### `format()` :kind[method]

```js signature
t.format(spec?, locale?): string
```

내장 프리셋, [`configure()`](/api/configure/)에 등록한 사용자 지정 포맷 이름, 옵션 객체, 또는 토큰 패턴으로 시각을 포맷합니다.

`'LT'`와 `'LTS'` 현지화 프리셋이 기본 내장되어 있으며, 옵션 객체에 포함된 날짜·시간대 키는 자동으로 무시됩니다. 전체 프리셋과 토큰 목록은 [포맷](/guides/formatting/)에서 확인하세요.

**매개변수**

```params
- name: spec
  type: FormatSpec
  default: "'short'"
  description: "내장 또는 사용자 지정 포맷 이름, `Intl` 옵션 객체, 또는 토큰 패턴."
- name: locale
  type: string
  description: "이번 호출에서만 인스턴스 로케일이나 기본 로케일을 덮어쓸 BCP 47 로케일 태그."
```

**반환값**

```returns
type: string
description: "포맷된 시각 문자열."
```

```js
const afternoon = time('17:30:15');

afternoon.format('short', 'en-US'); // '5:30 PM'
afternoon.format('LTS', 'en-US'); // '5:30:15 PM'
afternoon.format('HH:mm:ss'); // '17:30:15'
afternoon.format('h:mm a'); // '5:30 pm'
afternoon.format({ hour12: false }, 'en-US'); // '17:30'
```
:::

:::entry
### `locale()` :kind[method]

```js signature
t.locale(): Locale | undefined
t.locale(tag): Time
```

이 시각에 지정된 로케일을 읽거나, 텍스트 미리보기·프리셋·파생 값 전반에 다른 로케일을 적용한 복사본을 반환합니다. 빈 태그나 `null`을 전달하면 로케일 지정을 해제하며, [`lang()`](#lang)을 별칭으로 사용할 수 있습니다.

**매개변수**

```params
- name: tag
  type: Locale | null | undefined
  description: "적용할 BCP 47 로케일 태그. 기존 태그를 해제하려면 `null`을 전달합니다."
```

**반환값**

```returns
type: Time | Locale | undefined
description: "인수 없이 호출하면 활성 로케일 태그, 인수를 전달하면 `tag`를 적용한 새 `Time`."
```

```js
const closing = time('17:30').locale('ko-KR');

closing.locale(); // 'ko-KR'
closing.text; // '오후 5:30'
closing.on('2026-05-01', 'Asia/Seoul').locale(); // 'ko-KR'
```
:::

:::entry
### `lang()` :kind[method]

```js signature
t.lang(): Locale | undefined
t.lang(tag): Time
```

이 시각의 BCP 47 로케일 태그를 읽거나 지정하는 [`locale()`](#locale)의 단축 별칭입니다.
:::

:::entry
### `toString()` :kind[method]

```js signature
t.toString(): string
t.toJSON(): string
```

24시간제 ISO 8601 시각 문자열을 반환하며, 초 미만 자릿수는 0이 아닐 때만 3자리씩 묶어 출력합니다. `toJSON()`도 `JSON.stringify()`를 위해 동일한 문자열을 반환합니다.

**반환값**

```returns
type: string
description: "ISO 8601 시각 문자열(예: `'17:30:00'`, `'17:30:15.250'`)."
```

```js
time('5:30pm').toString(); // '17:30:00'
time('17:30:15.25').toString(); // '17:30:15.250'
JSON.stringify({ opens: time('9am') }); // '{"opens":"09:00:00"}'
```
:::

:::entry
### `as()` :kind[method]

```js signature
t.as('time'): Time
```

공통 변환 체인에서 `'time'`을 요청하면 이 `Time`을 그대로 반환하고, 다른 타입을 요청하면 `RangeError`를 던집니다.
:::

:::entry
### `toTemporal()` :kind[method]

```js signature
t.toTemporal(): Temporal.PlainTime
```

내부의 `Temporal.PlainTime` 인스턴스를 반환합니다.
:::

:::entry
### `valueOf()` :kind[method]

```js signature
t.valueOf(): never
```

숫자 연산자가 시각을 숫자로 암묵적 변환하지 않도록 `RangeError`를 던집니다.
:::
