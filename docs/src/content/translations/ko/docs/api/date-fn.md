---
source: af294e4ed659
title: date()
lede: 연-월-일 순 날짜 문자열, 연·월·일 숫자, 필드 객체 또는 오늘 날짜로부터 CalendarDate를 생성합니다.
---

## 달력 날짜 읽기

:::entry
### `date()` :kind[function]

```js signature
date(input, options?): CalendarDate
date(input, zone?): CalendarDate
date(year, month, day): CalendarDate
```

연-월-일 순 날짜 문자열, 1부터 시작하는 세 정수, 필드 객체, 기존 날짜 또는 타임스탬프로부터 [`CalendarDate`](/api/calendar-date/)를 생성합니다. 2월 30일처럼 존재하지 않는 날짜는 3월로 넘어가지 않고 `RangeError`를 던집니다.

```js title="create.js"
import { date, datetime } from 'native-dates';

const fromIso = date('2026-11-16');
const fromSlashes = date('2026/11/6');
const fromNumbers = date(2026, 11, 16);
const fromFields = date({ year: 2026, month: 11, day: 16 });
const fromMoment = date(datetime('2026-11-17T02:00:00Z', 'America/Los_Angeles'));

fromSlashes.toString(); // '2026-11-06'
fromMoment.toString(); // '2026-11-16'
```

**매개변수**

```params
- name: input
  type: CalendarDateInput | number
  required: true
  description: "ISO 날짜 문자열, 필드 객체, 기존 날짜·타임스탬프 또는 4자리 연도(`year`)."
- name: options
  type: Zone | ReadOptions | number
  description: "타임스탬프나 비정형 문자열을 읽을 때의 시간대·옵션 객체 또는 1부터 12까지의 월(`month`)."
  options:
    - name: zone
      type: Zone
      description: "시점 문자열, `DateTime` 또는 `Date`에서 달력 날짜를 판별할 때 사용할 시간대."
    - name: locale
      type: Locale
      description: "반환된 `CalendarDate`와 이 값에서 파생되는 모든 값에 유지할 BCP 47 로케일 태그."
    - name: loose
      type: boolean
      default: 'false'
      description: "`@native-dates/plugins/loose`와 함께 비정형 날짜 문자열을 파싱하고 읽을 수 없으면 `null`을 반환하는 옵션."
    - name: dayFirst
      type: boolean
      description: "느슨한 모드에서 `'07.09.2026'` 같은 숫자 날짜의 일·월 순서를 활성 로케일 설정 대신 직접 지정하는 옵션."
- name: day
  type: number
  description: "`year`, `month`, `day`를 순서대로 전달할 때 사용하는 1~31 범위의 정수 일(`day`)."
```

**반환값**

```returns
type: CalendarDate
description: "시각이나 시간대 정보가 없는 `CalendarDate`, 또는 느슨한 모드에서 `input`을 읽을 수 없을 때 `null`."
```

ISO 타임스탬프나 기본 JavaScript `Date`를 읽을 때는 시간대를 전달해 어느 지역의 달력 날짜를 추출할지 지정하세요.

```js
date('2026-11-17T02:00:00Z', 'America/Los_Angeles').toString(); // '2026-11-16'
date('2026-11-17T02:00:00Z', 'Asia/Tokyo').toString(); // '2026-11-17'
```
:::

### 허용되는 입력

월은 0부터 시작하는 JavaScript `Date` 생성자와 달리 항상 1월을 1, 12월을 12로 씁니다. 연도와 월만 있고 일이 없는 입력은 1일로 자동 보정하지 않고 `RangeError`를 던지므로, 월 단위 값은 [`yearMonth()`](/api/year-month-fn/)를 사용하세요.

| 입력 | 예시 | 읽기 방식 |
|---|---|---|
| 연-월-일 순 날짜 문자열 | `'2026-11-16'`, `'2026/11/6'`, `'2026年11月16日'` | 라틴 문자와 콜론을 제외한 모든 구분자로 연결된 4자리 연도, 월, 일을 읽습니다. |
| 현지 날짜·시각 문자열 | `'2026-11-16T09:30'` | 달력 날짜만 유지하고 시각은 버립니다. |
| ISO 시점 문자열 | `'2026-11-17T02:00:00Z'` | 지정한 시간대 또는 설정된 기본 시간대에서 해당 시점의 달력 날짜를 읽습니다. |
| 연·월·일 숫자 | `date(2026, 11, 16)` | 1월(`1`)부터 12월(`12`)까지를 기준으로 연·월·일 세 정수를 받습니다. |
| 필드 객체 | `{ year: 2026, month: 11, day: 16 }` | 1부터 시작하는 달력 필드를 읽으며 존재하지 않는 날짜는 거부합니다. |
| [DateTime](/api/date-time/) | `date(dt, 'Asia/Tokyo')` | 지정한 시간대, 생략 시 `dt.zone` 기준의 달력 날짜를 추출합니다. |
| JavaScript Date | `date(jsDate, 'America/Los_Angeles')` | 지정한 시간대 또는 설정된 기본 시간대에서 해당 타임스탬프의 달력 날짜를 읽습니다. |
| Temporal 값 | `Temporal.PlainDate`, `Temporal.Instant` | 모든 역법의 `PlainDate`는 동일한 ISO 날짜로 읽고, 시점 값은 대상 시간대로 변환합니다. |

:::note[타임스탬프의 날짜는 시간대에 따라 다릅니다]
끝에 `Z`나 UTC 오프셋이 붙은 ISO 문자열은 지역에 따라 서로 다른 달력 날짜에 걸칠 수 있는 시점입니다. 서버에서 사용자의 달력 날짜를 추출할 때는 시간대를 명시적으로 전달하세요.
:::

## 상대 달력 날짜

오늘 날짜는 지구상 위치에 따라 다릅니다. 아래 헬퍼는 모두 선택적 시간대를 받으며, 생략하면 [설정된 기본값](/api/configure/)을 사용합니다.

:::entry
### `today()` :kind[function]

```js signature
today(zone?): CalendarDate
```

지정한 시간대 또는 설정된 기본 시간대의 오늘 달력 날짜를 반환합니다. 미주 지역이 늦은 저녁일 때 아시아와 오세아니아는 이미 자정을 넘어 다음 날입니다.

**매개변수**

```params
- name: zone
  type: Zone
  description: "오늘의 달력 날짜를 읽을 시간대(예: `'Asia/Tokyo'`, `'America/Los_Angeles'`)."
```

**반환값**

```returns
type: CalendarDate
description: "`zone` 기준 오늘의 `CalendarDate`."
```

```js
import { datetime, today } from 'native-dates';

const inLosAngeles = today('America/Los_Angeles');
const inTokyo = today('Asia/Tokyo');

// 11월 17일 02:00 UTC 기준 로스앤젤레스는 아직 11월 16일이고 도쿄는 11월 17일입니다
const moment = '2026-11-17T02:00:00Z';
datetime(moment, 'America/Los_Angeles').date.toString(); // '2026-11-16'
datetime(moment, 'Asia/Tokyo').date.toString(); // '2026-11-17'
```
:::

:::entry
### `tomorrow()` :kind[function]

```js signature
tomorrow(zone?): CalendarDate
```

지정한 시간대에서 [`today(zone)`](#today)보다 하루 뒤인 내일의 달력 날짜를 반환합니다.

**매개변수**

```params
- name: zone
  type: Zone
  description: "오늘에서 하루를 더할 기준 시간대."
```

**반환값**

```returns
type: CalendarDate
description: "`zone` 기준 내일의 `CalendarDate`."
```

```js
import { tomorrow } from 'native-dates';

const nextDay = tomorrow();
const londonTomorrow = tomorrow('Europe/London');
```
:::

:::entry
### `yesterday()` :kind[function]

```js signature
yesterday(zone?): CalendarDate
```

지정한 시간대에서 [`today(zone)`](#today)보다 하루 앞선 어제의 달력 날짜를 반환합니다.

**매개변수**

```params
- name: zone
  type: Zone
  description: "오늘에서 하루를 뺄 기준 시간대."
```

**반환값**

```returns
type: CalendarDate
description: "`zone` 기준 어제의 `CalendarDate`."
```

```js
import { yesterday } from 'native-dates';

const priorDay = yesterday();
const londonYesterday = yesterday('Europe/London');
```
:::
