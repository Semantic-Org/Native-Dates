---
source: 50f6c5cb4f97
title: datetime()
lede: 타임스탬프, 문자열, Date 또는 필드 객체로 DateTime을 생성하거나 현재 시점을 읽습니다.
---

## 시점 읽기

:::entry
### `datetime()` :kind[function]

```js signature
datetime(input, zone?): DateTime
datetime(input, options?): DateTime
```

문자열, 타임스탬프, 필드 객체 또는 달력 날짜를 읽어 특정 시간대 기준의 [`DateTime`](/api/date-time/)을 생성합니다. 시간대를 생략하면 [설정된 기본값](/api/configure/)이나 런타임의 현지 시간대를 사용합니다.

```js title="read.js"
import { date, datetime } from 'native-dates';

const fromUtc = datetime('2026-11-16T17:30:00Z', 'America/Los_Angeles');
const fromWall = datetime('2026-11-16 09:30', 'Europe/Berlin');
const fromZone = datetime('2026-11-16T09:30[America/New_York]');
const fromEpoch = datetime(1794850200000, 'UTC');
const fromDate = datetime(date('2026-11-16'), 'America/New_York');
```

**매개변수**

```params
- name: input
  type: DateTimeInput
  required: true
  description: "ISO 문자열, 유닉스 에포크 밀리초, `Date`, 필드 객체, 달력 날짜 또는 Temporal 값."
- name: zoneOrOptions
  type: Zone | ReadOptions
  description: "`'Europe/Berlin'`이나 `'UTC'` 같은 시간대 문자열 또는 옵션 객체."
  options:
    - name: zone
      type: Zone
      description: "시점을 해석할 시간대. `input`에 대괄호로 포함된 시간대가 있으면 덮어씁니다."
    - name: locale
      type: Locale
      description: "반환된 `DateTime`과 이 값에서 파생되는 모든 값에 유지할 BCP 47 로케일 태그."
    - name: loose
      type: boolean
      default: 'false'
      description: "`@native-dates/plugins/loose`와 함께 비정형 날짜 문자열을 파싱하고 읽을 수 없으면 `null`을 반환하는 옵션."
    - name: dayFirst
      type: boolean
      description: "느슨한 모드에서 `'07/09/2026'` 같은 숫자 날짜의 일·월 순서를 활성 로케일 설정 대신 직접 지정하는 옵션."
```

**반환값**

```returns
type: DateTime
description: "결정된 시간대 기준의 `DateTime`, 또는 느슨한 모드에서 `input`을 읽을 수 없을 때 `null`."
```

[`@native-dates/plugins/loose`](/plugins/loose/)를 가져오면 느슨한 모드에서 활성 로케일 기준의 비정형 날짜와 시각 문자열을 읽고, 기계 형식 문자열은 런타임 기본 파서로 처리하며, 읽을 수 없는 입력에는 `null`을 반환합니다.

```js
import { datetime } from 'native-dates';
import '@native-dates/plugins/loose';

datetime('Mon, 16 Nov 2026 17:30:00 GMT', { zone: 'America/New_York', loose: true });
datetime('not a timestamp', { loose: true }); // null
```
:::

### 허용되는 입력

모든 입력은 대상 시간대 기준의 불변 인스턴스로 변환됩니다.

| 입력 | 예시 | 읽기 방식 |
|---|---|---|
| 오프셋이 포함된 ISO 문자열 | `'2026-11-16T17:30:00Z'`, `'2026-11-16 12:30-05:00'` | 정확한 시점을 고정한 뒤 대상 시간대로 변환합니다. |
| 대괄호 시간대 문자열 | `'2026-11-16T09:30[America/New_York]'` | 두 번째 인자로 시간대를 덮어쓰지 않는 한 대괄호 안의 시간대를 유지합니다. |
| 현지 날짜와 시각 | `'2026-11-16T09:30'`, `'2026年11月16日 14:30'` | 연-월-일 순 날짜와 시각을 대상 시간대 기준으로 바로 읽습니다. |
| 날짜 문자열 또는 [CalendarDate](/api/calendar-date/) | `'2026-11-16'`, `date(2026, 11, 16)` | 대상 시간대에서 해당 달력 날짜의 시작 시점으로 설정합니다. |
| 밀리초 또는 Date | `1794850200000`, `new Date()` | 유닉스 타임스탬프를 대상 시간대로 변환하며, `Date`와 마찬가지로 밀리초 미만 소수는 버립니다. |
| 필드 객체 | `{ year: 2026, month: 11, day: 16, hour: 9 }` | 대상 시간대에서 1부터 시작하는 달력 필드와 시각 필드를 읽고 존재하지 않는 날짜는 거부합니다. |
| DateTime 또는 Temporal | `dt`, `Temporal.Instant`, `Temporal.ZonedDateTime` | 시간대를 명시적으로 전달하지 않으면 기존 시간대를 유지합니다. |

:::note[누락된 값은 현재 시점이 되지 않습니다]
`undefined`나 `null`처럼 누락된 값은 예외를 던지므로, 빈 데이터베이스 컬럼이 실수로 현재 시점으로 바뀌는 사고를 막습니다. 현재 시점이 필요하면 [`now()`](#now)를 호출하세요.
:::

## 현재 시점과 오늘

현재 시점을 읽거나 임의의 시간대에서 오늘 하루의 조회 경계를 만듭니다.

:::entry
### `now()` :kind[function]

```js signature
now(zone?): DateTime
```

지정한 시간대 또는 설정된 기본 시간대에서 현재 시점을 밀리초 정밀도로 반환합니다. `Date.now()`와 동일한 밀리초 정밀도를 사용하므로 JSON 페이로드로 왕복 변환해도 값이 변하지 않습니다.

**매개변수**

```params
- name: zone
  type: Zone
  description: "현재 시점을 표시할 시간대(예: `'Asia/Tokyo'`, `'UTC'`)."
```

**반환값**

```returns
type: DateTime
description: "`zone` 기준 현재 밀리초 시점의 `DateTime`."
```

```js
import { now } from 'native-dates';

const local = now();
const tokyo = now('Asia/Tokyo');
const utc = now('UTC');
```
:::

:::entry
### `startOfToday()` :kind[function]

```js signature
startOfToday(zone?): DateTime
```

지정한 시간대에서 오늘 하루가 시작하는 시점을 반환합니다. 오늘 생성된 이벤트나 레코드를 조회할 때 하한값으로 쓰기 좋습니다.

**매개변수**

```params
- name: zone
  type: Zone
  description: "오늘의 범위를 계산할 기준 시간대."
```

**반환값**

```returns
type: DateTime
description: "`zone` 기준 오늘 시작 시점의 `DateTime`."
```

```js
import { startOfToday } from 'native-dates';

const opens = startOfToday('America/New_York');
opens.hour; // 0
opens.minute; // 0
```
:::

:::entry
### `endOfToday()` :kind[function]

```js signature
endOfToday(zone?): DateTime
```

지정한 시간대에서 오늘 하루의 마지막 밀리초 시점을 반환합니다.

**매개변수**

```params
- name: zone
  type: Zone
  description: "오늘의 범위를 계산할 기준 시간대."
```

**반환값**

```returns
type: DateTime
description: "`zone` 기준 오늘 날짜의 `23:59:59.999`를 나타내는 `DateTime`."
```

```js
import { endOfToday } from 'native-dates';

const cutoff = endOfToday('America/New_York');
cutoff.hour; // 23
cutoff.millisecond; // 999
```
:::
