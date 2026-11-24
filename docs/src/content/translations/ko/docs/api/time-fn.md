---
source: bb49ea92ac08
title: time()
lede: 12시간제·24시간제 시각 문자열, 숫자, 필드 객체 또는 타임스탬프로 Time을 생성합니다.
---

## 시각 읽기

:::entry
### `time()` :kind[function]

```js signature
time(input, options?): Time
time(input, zone?): Time
time(hour, minute?, second?): Time
```

시각 문자열, 정수 시각 요소, 필드 객체 또는 타임스탬프로 [`Time`](/api/time/)을 생성합니다. `null`·`undefined`처럼 입력이 누락되거나 인자를 생략하면 현재 시각으로 대체하지 않고 `TypeError`를 던집니다.

```js title="clock.js"
import { datetime, time } from 'native-dates';

const morning = time('9am');
const closing = time('5:30pm');
const iso = time('17:30:00');
const fromNumbers = time(9, 30);
const fromFields = time({ hour: 17, minute: 30, millisecond: 250 });
const fromInstant = time('2026-11-16T17:30:00Z', 'America/New_York');
const fromMoment = time(datetime('2026-11-16T17:30:00Z'), 'Europe/Berlin');
const fromTemporal = time(Temporal.PlainTime.from('08:15'));

closing.toString(); // '17:30:00'
fromInstant.toString(); // '12:30:00'
fromMoment.toString(); // '18:30:00'
```

**매개변수**

```params
- name: input
  type: TimeInput | number
  required: true
  description: "시각 문자열, 필드 객체, 기존 시각·타임스탬프 또는 0~23 범위의 24시간제 시(`hour`)."
- name: options
  type: Zone | ReadOptions | number
  description: "타임스탬프나 비정형 문자열을 읽을 때의 시간대·옵션 객체 또는 0~59 범위의 분(`minute`)."
  options:
    - name: zone
      type: Zone
      description: "시점 문자열, `DateTime` 또는 `Date`에서 하루 중 시각을 추출할 때 사용할 시간대."
    - name: locale
      type: Locale
      description: "반환된 `Time`과 이 값에서 파생되는 모든 값에 유지할 BCP 47 로케일 태그."
    - name: loose
      type: boolean
      default: 'false'
      description: "`@native-dates/plugins/loose`와 함께 비정형 날짜·시각 문자열을 읽고 파싱할 수 없으면 `null`을 반환하는 옵션."
    - name: dayFirst
      type: boolean
      description: "느슨한 모드에서 날짜와 시각이 함께 있는 문자열을 파싱할 때 활성 로케일의 숫자 날짜 순서를 덮어쓰는 옵션."
- name: second
  type: number
  description: "숫자 인자로 전달하는 0~59 범위의 정수 초(`second`). 초 미만 자릿수는 문자열이나 필드 객체로 지정합니다."
```

**반환값**

```returns
type: Time
description: "하루 중 시각을 나타내는 `Time`, 또는 느슨한 모드에서 `input`을 읽을 수 없을 때 `null`."
```

[loose 플러그인](/plugins/loose/)을 불러오면 느슨한 모드에서 현지화된 오전·오후 표기가 포함된 시각 문자열, 마침표로 시와 분을 구분하는 로케일의 시각 표기, 비정형 타임스탬프 문자열을 파싱하며 읽을 수 없는 입력에는 `null`을 반환합니다.

```js
import { time } from 'native-dates';
import '@native-dates/plugins/loose';

time('오후 2:30', { loose: true, locale: 'ko' })?.toString(); // '14:30:00'
time('14.30', { loose: true, locale: 'fi' })?.toString(); // '14:30:00'
time('Mon, 16 Nov 2026 17:30:00 GMT', {
  zone: 'America/New_York',
  loose: true,
})?.toString(); // '12:30:00'
time('whenever', { loose: true }); // null
```
:::

## 허용되는 입력

12시간제 문자열은 1부터 12까지의 시(hour) 뒤에 AM 또는 PM을 붙인 형식을 허용합니다. 자정은 12 AM, 정오는 12 PM입니다.

| 입력 | 예시 | 읽기 방식 |
|---|---|---|
| 12시간제 시각 문자열 | `'9am'`, `'5:30pm'`, `'12:15 a.m.'` | 1~12시와 `am`·`pm` 표기, 선택적 분·초·소수부를 읽습니다. |
| 24시간제 시각 문자열 | `'09:00'`, `'14h30'`, `'17:30:15.250'` | 시와 분 사이에 콜론이나 `h`를 쓰는 24시간제 문자열을 나노초 정밀도까지 읽습니다. |
| ISO 시점 문자열 | `'2026-11-16T17:30:00Z'` | 지정한 시간대 또는 설정된 기본 시간대에서 해당 시점의 현지 시각을 읽습니다. |
| 시각 숫자 | `time(9)`, `time(9, 30)`, `time(17, 30, 15)` | 시(hour)와 선택적 분(minute)·초(second)를 정수로 받습니다. |
| 필드 객체 | `{ hour: 9, minute: 30, millisecond: 250 }` | 단수·복수형 시각 필드를 읽으며 범위를 벗어난 숫자는 거부합니다. |
| [DateTime](/api/date-time/) 또는 Temporal | `time(dt, 'Asia/Tokyo')`, `Temporal.PlainTime` | 하루 중 시각을 추출하며, 시점 값에 시간대를 전달하면 해당 시간대로 변환합니다. |
| JavaScript Date | `time(jsDate, 'America/New_York')` | 지정한 시간대 또는 설정된 기본 시간대에서 해당 시점의 시각을 읽습니다. |

:::tip[현재 시각 읽기]
원하는 시간대의 현재 시각은 `now('Europe/Berlin').time`처럼 [`now()`](/api/datetime-fn/#now)에서 읽을 수 있습니다.
:::
