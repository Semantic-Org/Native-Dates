---
source: 05899a15dfff
title: Duration
lede: 달력 단위와 시각 단위를 아우르는 기간.
---

## Duration 생성

[`duration()`](/api/duration-fn/)으로 영어 기간 표현이나 ISO 8601 문자열을 파싱하거나, [`hours()`](/api/duration-fn/#hours) 같은 단위 헬퍼 함수를 호출하거나, 두 날짜 또는 시각 사이의 간격을 측정해 인스턴스를 생성합니다. 모든 인스턴스는 불변이므로 원본 값을 변경하지 않고, 값을 바꾸는 메서드마다 새 인스턴스를 반환합니다.

```js title="create.js"
import { date, days, duration, hours } from 'native-dates';

const breakTime = duration('1h 30m');
const trial = days(14);
const timeout = hours(1.5);
const quarter = date('2026-01-01').until('2026-04-01');
```

:::note[입력한 필드를 그대로 유지]
90분으로 기간을 생성해도 1시간 30분으로 자동 변환되지 않고 `minutes`가 `90`으로 유지됩니다. 달력의 일 단위 역시 서머타임 전환 시 길이가 달라질 수 있으므로 [`balance()`](#balance)를 호출하기 전까지는 시간 단위와 분리해 보관합니다.
:::

## 프로퍼티

프로퍼티는 기간 인스턴스에 저장된 각 단위별 수치를 읽습니다.

| 프로퍼티 | 타입 | 설명 |
|---|---|---|
| `text` | `string` | 로케일에 맞춰 긴 형식으로 포맷한 기간(예: `'1 hour, 30 minutes'`). |
| `years`, `months`, `weeks`, `days` | `number` | 저장된 부호 있는 달력 단위 수치. |
| `hours`, `minutes`, `seconds` | `number` | 부호 있는 시각 단위 수치. |
| `milliseconds`, `microseconds`, `nanoseconds` | `number` | 부호 있는 초 미만 단위 수치. |
| `sign` | `number` | 기간의 전체 방향(`1`, `0`, 또는 `-1`). |
| `anchor` | `TemporalValue` | [`until()`](/api/date-time/#until)이나 [`since()`](/api/date-time/#since)로 측정할 때 기록된 기준 시점. 독립적으로 생성한 기간에서는 `undefined`. |

## 연산과 부호

기간을 더하거나 빼고, 배수로 늘리거나 줄이며, 부호를 반전합니다. 하나의 기간 안에서 0이 아닌 모든 필드는 같은 부호를 가져야 합니다.

:::entry
### `plus()` :kind[method]

```js signature
dur.plus(other, unit?): Duration
dur.add(other, unit?): Duration
```

다른 기간을 더해 새 `Duration`을 반환합니다. 달력 단위는 필드별로 더해지고 시각 단위는 자동으로 합쳐지며, `add()`를 별칭으로 사용할 수 있습니다.

**매개변수**

```params
- name: other
  type: DurationInput
  required: true
  description: "`unit`과 함께 쓰는 수량, `Duration` 인스턴스, ISO 8601·영어 기간 문자열, 필드 객체, 또는 밀리초."
- name: unit
  type: Unit
  description: "`other`가 숫자일 때 사용하는 영어 단위명(예: `'minutes'`, `'days'`)."
```

**반환값**

```returns
type: Duration
description: "두 기간을 합한 새 `Duration`."
```

```js
hours(2).plus(30, 'minutes').toString(); // 'PT2H30M'
days(1).plus('6h').toString(); // 'P1DT6H'
```
:::

:::entry
### `minus()` :kind[method]

```js signature
dur.minus(other, unit?): Duration
dur.subtract(other, unit?): Duration
```

다른 기간을 빼며, 필요하면 연·월 사이 또는 주·일 사이에서 단위를 빌려 계산합니다. 일에서 시간을 빼는 것처럼 서로 호환되지 않는 반대 부호 조합은 `RangeError`를 던지며, `subtract()`를 별칭으로 사용할 수 있습니다.

**매개변수**

```params
- name: other
  type: DurationInput
  required: true
  description: "`unit`과 함께 쓰는 수량, `Duration` 인스턴스, ISO 8601·영어 기간 문자열, 필드 객체, 또는 밀리초."
- name: unit
  type: Unit
  description: "`other`가 숫자일 때 사용하는 영어 단위명."
```

**반환값**

```returns
type: Duration
description: "`other`를 뺀 새 `Duration`."
```

```js
import { months, weeks, years } from 'native-dates';

hours(2).minus('30m').toString(); // 'PT1H30M'
years(1).minus(months(1)).toString(); // 'P11M'
weeks(1).minus(days(1)).toString(); // 'P6D'
```
:::

:::entry
### `times()` :kind[method]

```js signature
dur.times(factor): Duration
```

모든 필드에 지정한 배수를 곱하며, 소수 부분은 하위 단위로 내려 계산합니다.

**매개변수**

```params
- name: factor
  type: number
  required: true
  description: "기간에 곱할 배수. 소수나 음수도 허용합니다."
```

**반환값**

```returns
type: Duration
description: "배수를 적용한 새 `Duration`."
```

```js
hours(1).times(1.5).toString(); // 'PT1H30M'
days(1).times(3).toString(); // 'P3D'
```
:::

:::entry
### `abs()` :kind[method]

```js signature
dur.abs(): Duration
```

모든 필드를 양수로 바꾼 복사본을 반환합니다.

```js
duration('-1h 30m').abs().toString(); // 'PT1H30M'
```
:::

:::entry
### `negated()` :kind[method]

```js signature
dur.negated(): Duration
```

기간의 모든 필드 부호를 반대로 뒤집은 새 인스턴스를 반환합니다.

```js
hours(2).negated().toString(); // '-PT2H'
```
:::

## 단위 정리, 반올림, 합계

하위 단위를 상위 단위로 올려 정리하거나, 원하는 정밀도로 반올림하거나, 전체 기간을 하나의 숫자로 환산합니다.

:::warning[월과 연을 일 단위로 변환할 때]
월과 연만으로 이루어진 기간은 1년 = 12개월 기준으로 서로 단위를 정리하거나 합산·비교할 수 있습니다. 하지만 달력 월마다 일수가 다르므로 주·일·시각 단위로 변환하려면 [`until()`](/api/calendar-date/#until)이나 [`since()`](/api/calendar-date/#since)로 기록된 기준 날짜가 필요합니다.
:::

:::entry
### `balance()` :kind[method]

```js signature
dur.balance(largestUnit?): Duration
```

하위 단위의 초과분을 상위 단위로 올려 정리합니다. 기본적으로 독립적으로 생성한 기간은 시각 단위를 시간 단위까지, 월을 연 단위까지 올리며, 두 지점 사이에서 측정한 기간은 더 큰 단위를 지정하지 않으면 일 단위까지 정리합니다.

**매개변수**

```params
- name: largestUnit
  type: Unit
  description: "값을 올려 정리할 가장 큰 영어 단위명(예: `'hour'`, `'day'`, `'week'`)."
```

**반환값**

```returns
type: Duration
description: "단위가 정리된 새 `Duration`."
```

```js
import { minutes, months } from 'native-dates';

minutes(150).balance().toString(); // 'PT2H30M'
months(18).balance().toString(); // 'P1Y6M'
duration('36h').balance('day').toString(); // 'P1DT12H'
duration('10d').balance('week').toString(); // 'P1W3D'
```
:::

:::entry
### `total()` :kind[method]

```js signature
dur.total(unit): number
dur.as(unit): number
```

기간 전체의 길이를 지정한 단위의 단일 부동소수점 숫자로 반환합니다. 메서드 체이닝에 자연스럽게 쓸 수 있는 [`as()`](#as) 별칭도 제공합니다.

**매개변수**

```params
- name: unit
  type: Unit
  required: true
  description: "전체 길이를 환산할 영어 단위명(예: `'hours'`, `'days'`)."
```

**반환값**

```returns
type: number
description: "소수 부분을 포함한 `unit` 기준 전체 길이."
```

```js
import { months } from 'native-dates';

minutes(90).total('hours'); // 1.5
months(18).total('years'); // 1.5
date('2026-01-01').until('2026-04-01').total('days'); // 90
```
:::

:::entry
### `as()` :kind[method]

```js signature
dur.as(unit): number
```

기간을 지정한 영어 단위의 숫자로 변환하는 [`total()`](#total)의 체이닝용 별칭입니다.

```js
hours(36).as('days'); // 1.5
date('2026-11-01').until('2026-11-16').as('days'); // 15
```
:::

:::entry
### `round()` :kind[method]

```js signature
dur.round(smallestUnit): Duration
```

기간을 가장 가까운 정수 단위로 반올림하며, 정확히 중간값이면 0에서 먼 쪽으로 반올림합니다.

**매개변수**

```params
- name: smallestUnit
  type: Unit
  required: true
  description: "반올림 후 남길 가장 작은 영어 단위명(예: `'minute'`, `'hour'`)."
```

**반환값**

```returns
type: Duration
description: "반올림된 새 `Duration`."
```

```js
minutes(90).round('hour').toString(); // 'PT2H'
duration('1h 20m').round('hour').toString(); // 'PT1H'
```
:::

## 기간 비교

저장된 필드 형태가 아니라 전체 길이를 기준으로 비교하므로 60분과 1시간은 같은 기간으로 취급합니다.

:::entry
### `equals()` :kind[method]

```js signature
dur.equals(other): boolean
```

두 기간의 전체 길이가 같으면 `true`를 반환합니다.

**매개변수**

```params
- name: other
  type: DurationInput
  required: true
  description: "다른 `Duration`, 또는 ISO 8601·영어 기간 문자열 등 `duration()`이 허용하는 입력값."
```

**반환값**

```returns
type: boolean
description: "두 기간의 전체 길이가 같으면 `true`."
```

```js
import { months, years } from 'native-dates';

hours(1).equals(minutes(60)); // true
years(1).equals(months(12)); // true
```
:::

:::entry
### `compare()` :kind[method]

```js signature
dur.compare(other): number
```

정렬에 사용할 수 있도록 전체 길이를 기준으로 이 기간과 다른 기간의 순서를 비교합니다.

**매개변수**

```params
- name: other
  type: DurationInput
  required: true
  description: "비교 대상 `Duration`, 또는 ISO 8601·영어 기간 문자열 등 `duration()`이 허용하는 입력값."
```

**반환값**

```returns
type: number
description: "더 짧으면 `-1`, 같으면 `0`, 더 길면 `1`."
```

```js
hours(1).compare(minutes(90)); // -1
date('2026-01-01').until('2026-02-01').compare(days(31)); // 0
```
:::

### 부호 판별 메서드

기간이 0인지 또는 음수인지 확인하는 인수 없는 판별 메서드입니다.

| 메서드 | 타입 | 설명 |
|---|---|---|
| `isZero()` | `boolean` | 기간의 모든 단위가 0인지 여부. |
| `isNegative()` | `boolean` | 기간이 음수인지 여부. |

## 포맷과 변환

:::entry
### `format()` :kind[method]

```js signature
dur.format(style?, locale?): string
```

`Intl.DurationFormat`을 사용해 활성 로케일에 맞춰 기간을 포맷합니다. 시각 단위의 초과분은 시간 단위까지 자동으로 올려 정리하며, 더 큰 단위가 있으면 초 미만 필드는 표시하지 않습니다.

**매개변수**

```params
- name: style
  type: "'long' | 'short' | 'narrow' | 'digital'"
  default: "'long'"
  description: "단위 표기 스타일. `'digital'`을 지정하면 콜론으로 구분된 타이머 형식으로 출력합니다."
- name: locale
  type: string
  description: "이번 호출에서만 인스턴스 로케일이나 기본 로케일을 덮어쓸 BCP 47 로케일 태그."
```

**반환값**

```returns
type: string
description: "로케일에 맞춰 포맷된 기간 문자열."
```

```js
const span = duration('2h 30m');

span.format('long', 'en-US'); // '2 hours, 30 minutes'
span.format('short', 'en-US'); // '2 hr, 30 min'
span.format('narrow', 'en-US'); // '2h 30m'
span.format('digital', 'en-US'); // '2:30:00'
```
:::

:::entry
### `locale()` :kind[method]

```js signature
dur.locale(): Locale | undefined
dur.locale(tag): Duration
```

이 기간에 지정된 로케일을 읽거나, 텍스트 미리보기·프리셋·연산 체인 전반에 다른 로케일을 적용한 복사본을 반환합니다. 빈 태그나 `null`을 전달하면 로케일 지정을 해제하며, [`lang()`](#lang)을 별칭으로 사용할 수 있습니다.

**매개변수**

```params
- name: tag
  type: Locale | null | undefined
  description: "적용할 BCP 47 로케일 태그. 기존 태그를 해제하려면 `null`을 전달합니다."
```

**반환값**

```returns
type: Duration | Locale | undefined
description: "인수 없이 호출하면 활성 로케일 태그, 인수를 전달하면 `tag`를 적용한 새 `Duration`."
```

```js
import { days } from 'native-dates';

const wait = days(2).locale('ar');

wait.locale(); // 'ar'
wait.text; // 'يومان'
```
:::

:::entry
### `lang()` :kind[method]

```js signature
dur.lang(): Locale | undefined
dur.lang(tag): Duration
```

이 기간의 BCP 47 로케일 태그를 읽거나 지정하는 [`locale()`](#locale)의 단축 별칭입니다.
:::

:::entry
### `toFields()` :kind[method]

```js signature
dur.toFields(): DurationFields
```

이 기간에서 0이 아닌 복수형 단위 필드만 담은 일반 객체를 반환합니다.

```js
duration('1h 30m').toFields(); // { hours: 1, minutes: 30 }
```
:::

:::entry
### `toString()` :kind[method]

```js signature
dur.toString(): string
dur.toJSON(): string
```

ISO 8601 기간 문자열을 반환합니다. `toJSON()`도 `JSON.stringify()`를 위해 동일한 문자열을 반환합니다.

**반환값**

```returns
type: string
description: "ISO 8601 기간 문자열(예: `'PT1H30M'`)."
```

```js
const ttl = duration('1h 30m');

ttl.toString(); // 'PT1H30M'
JSON.stringify({ ttl }); // '{"ttl":"PT1H30M"}'
```
:::

:::entry
### `toMilliseconds()` :kind[method]

```js signature
dur.toMilliseconds(): number
```

전체 길이를 밀리초 단위 숫자로 반환합니다. 기준 시점이 없는 월·연 단위 기간은 `RangeError`를 던집니다.

```js
hours(2).toMilliseconds(); // 7200000
```
:::

:::entry
### `toTemporal()` :kind[method]

```js signature
dur.toTemporal(): Temporal.Duration
```

내부의 `Temporal.Duration` 인스턴스를 반환합니다.
:::

:::entry
### `valueOf()` :kind[method]

```js signature
dur.valueOf(): number
```

고정 길이 기간이나 기준 시점이 있는 기간을 타이머나 숫자 비교 연산자에 바로 쓸 수 있도록 총 밀리초를 반환합니다.
:::
