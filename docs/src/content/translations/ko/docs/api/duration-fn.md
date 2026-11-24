---
source: 6f9a2cfc4ed9
title: duration()
lede: 영어 기간 표현, ISO 8601 기간 문자열, 수량과 영어 단위 또는 단위 헬퍼로 Duration을 생성합니다.
---

## 기간 생성

:::entry
### `duration()` :kind[function]

```js signature
duration(input, unit?): Duration
duration(input, options?): Duration
```

수량과 영어 단위 문자열, 영어 기간 표현, ISO 8601 기간 문자열, 필드 객체 또는 밀리초로 [`Duration`](/api/duration/)을 생성합니다. [`balance()`](/api/duration/#balance)를 호출하기 전까지는 입력한 필드가 그대로 유지되므로, 90분은 1시간 30분으로 자동 환산되지 않고 90분 그대로 남습니다.

```js title="lengths.js"
import { duration } from 'native-dates';

const phrase = duration('1h 30m');
const words = duration('2 weeks and 3 days');
const iso = duration('PT1H30M');
const count = duration(90, 'minutes');
const spilled = duration(1.5, 'days');
const fields = duration({ hours: 1, minutes: 30 });
const ms = duration(1500);

spilled.days; // 1
spilled.hours; // 12
ms.seconds; // 0
ms.milliseconds; // 1500
```

**매개변수**

```params
- name: input
  type: DurationInput
  required: true
  description: "`unit`과 함께 전달하는 숫자, 영어 기간 표현, ISO 8601 문자열, 필드 객체, `Duration` 또는 밀리초."
- name: unitOrOptions
  type: "Unit | { locale?: Locale, loose?: boolean }"
  description: "`input`이 숫자 수량일 때의 영어 단위 문자열 또는 옵션 객체."
  options:
    - name: locale
      type: Locale
      description: "반환된 `Duration`과 이 값에서 파생되는 모든 값에 유지할 BCP 47 로케일 태그."
    - name: loose
      type: boolean
      default: 'false'
      description: "`@native-dates/plugins/loose`와 함께 읽을 수 없는 입력에 `null`을 반환하는 옵션."
```

**반환값**

```returns
type: Duration
description: "입력한 필드를 그대로 유지하는 `Duration`, 또는 느슨한 모드에서 `input`을 읽을 수 없을 때 `null`."
```

[`@native-dates/plugins/loose`](/plugins/loose/)를 가져오면 느슨한 모드에서 사용자가 입력한 문자열을 기간으로 파싱할 수 없을 때 예외를 던지지 않고 `null`을 반환합니다.

```js
import { duration } from 'native-dates';
import '@native-dates/plugins/loose';

duration('45 mins', { loose: true })?.minutes; // 45
duration('soon', { loose: true }); // null
```
:::

### 허용되는 입력

| 입력 | 예시 | 읽기 방식 |
|---|---|---|
| 수량과 영어 단위 | `duration(90, 'minutes')`, `duration(1.5, 'days')` | 숫자나 숫자 문자열에 영어 단위 문자열을 결합하며, 소수부는 다음 하위 단위로 넘깁니다. |
| 영어 기간 표현 | `'1h 30m'`, `'2 weeks and 3 days'`, `'-15m'` | 공백, 쉼표 또는 `and`로 구분된 수량과 영어 전체 단위명·약어를 읽습니다. |
| ISO 8601 문자열 | `'PT1H30M'`, `'P2W3D'` | 표준 ISO 8601 기간 문자열을 파싱합니다. |
| 필드 객체 | `{ hours: 1, minutes: 30 }` | 0이 아닌 모든 필드의 부호가 같은 단수·복수형 영어 단위 키를 읽습니다. |
| 밀리초 | `duration(1500)`, `duration(0)` | 단위 없이 전달된 숫자나 숫자 문자열을 밀리초로 해석합니다. |
| Duration 또는 Temporal | `hours(2)`, `Temporal.Duration` | 기존 `Duration`은 그대로 반환하고 `Temporal.Duration`은 감싸서 반환합니다. |

:::note[소수 단위와 단일 부호]
소수 수량은 정확한 하위 단위로 넘어가므로 `duration(1.5, 'days')`는 1일 12시간이 됩니다. 월은 일수가 일정하지 않기 때문에 소수가 포함된 월은 `RangeError`를 던지며, `'1h -30m'`처럼 부호가 섞인 표현도 마찬가지로 `RangeError`를 던집니다.
:::

## 단위 헬퍼

단위 헬퍼는 계산 메서드나 식 안에서 자연스럽게 읽히는 단일 단위 기간을 만듭니다. 각 헬퍼는 양수·음수 숫자 또는 숫자 문자열을 받습니다.

```js
import { days, hours, minutes, today } from 'native-dates';

const reminder = today().plus(days(3)).at('9:00am');
const block = hours(1).plus(minutes(30));

block.format('short', 'en-US'); // '1 hr, 30 min'
```

:::entry
### `years()` :kind[function]

```js signature
years(count): Duration
```

지정한 연수만큼의 기간을 생성하며, 소수 연수는 월 단위로 넘깁니다.
:::

:::entry
### `months()` :kind[function]

```js signature
months(count): Duration
```

정수 개월 수만큼의 기간을 생성합니다.
:::

:::entry
### `weeks()` :kind[function]

```js signature
weeks(count): Duration
```

지정한 주 수만큼의 기간을 생성하며, 소수부는 일 단위로 넘깁니다.
:::

:::entry
### `days()` :kind[function]

```js signature
days(count): Duration
```

지정한 일수만큼의 기간을 생성하며, 소수부는 시간 단위로 넘깁니다.
:::

:::entry
### `hours()` :kind[function]

```js signature
hours(count): Duration
```

지정한 시간만큼의 기간을 생성하며, 소수부는 분 단위로 넘깁니다.
:::

:::entry
### `minutes()` :kind[function]

```js signature
minutes(count): Duration
```

지정한 분만큼의 기간을 생성하며, 소수부는 초 단위로 넘깁니다.
:::

:::entry
### `seconds()` :kind[function]

```js signature
seconds(count): Duration
```

지정한 초만큼의 기간을 생성하며, 소수부는 밀리초 단위로 넘깁니다.
:::

:::entry
### `milliseconds()` :kind[function]

```js signature
milliseconds(count): Duration
```

지정한 밀리초만큼의 기간을 생성하며, 소수부는 마이크로초와 나노초 단위까지 넘깁니다.
:::
