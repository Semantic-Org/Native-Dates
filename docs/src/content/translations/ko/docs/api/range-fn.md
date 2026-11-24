---
source: 7f0f623e1e92
title: dateRange()
lede: 양 끝점, 기간 또는 구간 문자열로부터 DateRange, DateTimeRange, TimeRange를 생성합니다.
---

## 범위 생성

독립 팩토리 함수는 원시 입력, 시작·종료 쌍 또는 단일 구간 문자열로부터 [범위](/api/ranges/)를 생성합니다. 이미 생성된 날짜·시각·시점 인스턴스가 있다면 해당 인스턴스에서 [`to()`](/api/ranges/#to)나 [`range()`](/api/ranges/#range)를 바로 호출하세요.

:::entry
### `dateRange()` :kind[function]

```js signature
dateRange(start, end, options?): DateRange
dateRange(interval, options?): DateRange
```

두 달력 날짜를 양 끝 포함하는 [`DateRange`](/api/ranges/#daterange)를 생성합니다. 두 번째 인자로 `'7 days'` 같은 기간을 전달하면 전체 구간이 7일이 되도록 종료일은 시작일보다 6일 뒤로 계산됩니다.

```js title="dates.js"
import { dateRange, days } from 'native-dates';

const fromEnds = dateRange('2026-09-01', '2026-09-07');
const fromLength = dateRange('2026-09-01', days(7));
const fromInterval = dateRange('2026-09-01/2026-09-07');

fromEnds.duration.days; // 7
fromLength.toString(); // '2026-09-01/2026-09-07'
fromInterval.equals(fromEnds); // true
```

**매개변수**

```params
- name: start
  type: CalendarDateInput | string
  required: true
  description: "시작 날짜 입력, 또는 `end`를 생략했을 때의 전체 구간 문자열."
- name: end
  type: CalendarDateInput | DurationInput | ReadOptions
  description: "양 끝 포함 기준 종료 날짜, 기간 길이, 또는 `start`가 구간 문자열일 때의 옵션 객체."
- name: options
  type: Zone | ReadOptions
  description: "양 끝점을 파싱할 때 적용할 시간대 또는 읽기 옵션."
  options:
    - name: zone
      type: Zone
      description: "시점 문자열이나 `Date` 객체에서 달력 날짜를 추출할 때 사용할 시간대."
    - name: locale
      type: Locale
      description: "반환된 범위와 양 끝점에 유지할 BCP 47 로케일 태그."
    - name: loose
      type: boolean
      default: 'false'
      description: "`@native-dates/plugins/loose`와 함께 비정형 날짜 문자열을 파싱하고 읽을 수 없으면 `null`을 반환하는 옵션."
    - name: dayFirst
      type: boolean
      description: "느슨한 모드에서 활성 로케일의 숫자 날짜 순서를 덮어쓰는 옵션."
```

**반환값**

```returns
type: DateRange
description: "양 끝 포함 `DateRange`, 또는 느슨한 모드에서 끝점을 읽을 수 없을 때 `null`."
```
:::

:::entry
### `datetimeRange()` :kind[function]

```js signature
datetimeRange(start, end, options?): DateTimeRange
datetimeRange(interval, options?): DateTimeRange
```

시작 시점은 포함하고 종료 시점은 제외하는 반개방 구간(상한 제외) [`DateTimeRange`](/api/ranges/#datetimerange)를 생성합니다. 종료 입력에 명시적인 시간대가 없으면 시작 시점의 시간대로 해석합니다.

**매개변수**

```params
- name: start
  type: DateTimeInput | string
  required: true
  description: "시작 시점 입력, 또는 `end`를 생략했을 때의 구간 문자열."
- name: end
  type: DateTimeInput | DurationInput | ReadOptions
  description: "상한 제외 종료 시점, 기간 길이, 또는 구간 문자열일 때의 옵션 객체."
- name: options
  type: Zone | ReadOptions
  description: "양 끝점에 공통으로 적용할 시간대 또는 `zone`, `locale`, `loose` 등의 읽기 옵션."
```

**반환값**

```returns
type: DateTimeRange
description: "상한 제외 반개방 구간 `DateTimeRange`, 또는 느슨한 모드에서 끝점을 읽을 수 없을 때 `null`."
```

```js
import { datetimeRange } from 'native-dates';

const meeting = datetimeRange('2026-09-01T09:00', '90m', 'America/New_York');
meeting.end.format('short', 'en-US'); // '9/1/26, 10:30 AM'

const zoned = datetimeRange('2026-09-01T09:00[America/New_York]/2026-09-01T10:30[America/New_York]');
zoned.start.zone; // 'America/New_York'
```
:::

:::entry
### `timeRange()` :kind[function]

```js signature
timeRange(start, end, options?): TimeRange
timeRange(interval, options?): TimeRange
```

시작 시각은 포함하고 종료 시각은 제외하는 반개방 구간(상한 제외) [`TimeRange`](/api/ranges/#timerange)를 생성합니다. 종료 시각이 시작 시각보다 이르면 자정을 걸치는 범위가 됩니다.

**매개변수**

```params
- name: start
  type: TimeInput | string
  required: true
  description: "시작 시각 입력, 또는 `end`를 생략했을 때의 구간 문자열."
- name: end
  type: TimeInput | DurationInput | ReadOptions
  description: "상한 제외 종료 시각, 시각 단위 기간, 또는 구간 문자열일 때의 옵션 객체."
- name: options
  type: Zone | ReadOptions
  description: "타임스탬프에서 시각을 추출할 때 사용할 시간대 또는 `zone`, `locale`, `loose` 등의 읽기 옵션."
```

**반환값**

```returns
type: TimeRange
description: "상한 제외 반개방 구간 `TimeRange`, 또는 느슨한 모드에서 끝점을 읽을 수 없을 때 `null`."
```

```js
import { timeRange } from 'native-dates';

const office = timeRange('9am - 5pm');
const overnight = timeRange('22:00', '8h');

office.toString(); // '09:00:00/17:00:00'
overnight.toString(); // '22:00:00/06:00:00'
```
:::

## 구간 문자열과 느슨한 모드

단일 구간 문자열은 ISO 슬래시나 공백으로 둘러싸인 범위 구분자를 기준으로 나눕니다. 대괄호 안의 IANA 시간대 이름에 들어 있는 슬래시는 건드리지 않습니다.

| 형식 | 예시 | 읽기 방식 |
|---|---|---|
| ISO 슬래시 구간 | `'2026-09-01/2026-09-07'`, `'09:00/17:00'` | [`toString()`](/api/ranges/#tostring) 출력 형식과 동일하게 대괄호 시간대 바깥의 `/`를 기준으로 나눕니다. |
| 공백이 있는 하이픈·엔대시 | `'9am - 5pm'`, `'2026/09/01 - 2026/09/07'` | 양쪽에 공백이 있는 하이픈(`-`)이나 엔대시(`–`)를 먼저 기준으로 나누어 날짜 내부의 하이픈과 슬래시를 보존합니다. |
| 영어 `to` 구분자 | `'2026-09-01 to 2026-09-07'` | 양쪽에 공백이 있는 ` to `를 기준으로 나눕니다. |
| 시작점과 길이 | `dateRange('2026-09-01', '7d')`, `timeRange('9am', '90m')` | 두 번째 인자가 [`Duration`](/api/duration/), 기간 필드 객체 또는 영어 기간 표현이면 길이로 해석합니다. |

[loose 플러그인](/plugins/loose/)을 불러오면 느슨한 모드에서 비정형 끝점을 파싱하고, 끝점을 읽을 수 없을 때 `null`을 반환합니다.

```js
import { dateRange } from 'native-dates';
import '@native-dates/plugins/loose';

dateRange('Sep 1, 2026 to Sep 7, 2026', { loose: true })?.toString();
// '2026-09-01/2026-09-07'

dateRange('not a range', { loose: true }); // null
```
