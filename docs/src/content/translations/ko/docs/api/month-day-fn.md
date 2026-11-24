---
source: e681c4b680b0
title: monthDay()
lede: 월-일 문자열, 숫자, 필드 객체 또는 날짜를 읽어 MonthDay를 생성합니다.
---

## 월일 읽기

:::entry
### `monthDay()` :kind[function]

```js signature
monthDay(input, options?): MonthDay
monthDay(input, zone?): MonthDay
monthDay(month, day): MonthDay
```

월-일 순 문자열, 1부터 시작하는 두 정수, 필드 객체 또는 기존 날짜로부터 [`MonthDay`](/api/month-day/)를 생성합니다. 윤일 생일과 기념일을 그대로 표현할 수 있도록 2월 29일도 허용합니다.

```js title="birthday.js"
import { datetime, monthDay } from 'native-dates';

const fromIso = monthDay('10-17');
const fromSlash = monthDay('10/17');
const fromNumbers = monthDay(2, 29);
const fromFields = monthDay({ month: 10, day: 17 });
const fromInstant = monthDay(datetime('2026-10-18T02:00:00Z'), 'America/Los_Angeles');

fromNumbers.toString(); // '02-29'
fromInstant.toString(); // '10-17'
```

**매개변수**

```params
- name: input
  type: MonthDayInput | number | string
  required: true
  description: "월-일 순 문자열, 필드 객체, 날짜·타임스탬프 또는 1부터 12까지의 월(`month`)."
- name: options
  type: Zone | MonthDayOptions | number | string
  description: "시간대·옵션 객체 또는 두 숫자를 전달할 때 사용하는 1~31 범위의 정수 일(`day`)."
  options:
    - name: zone
      type: Zone
      description: "시점 문자열, `DateTime` 또는 `Date`에서 월과 일을 읽을 때 사용할 시간대."
    - name: locale
      type: Locale
      description: "반환된 `MonthDay`와 이 값에서 파생되는 모든 값에 유지할 BCP 47 로케일 태그."
    - name: dayFirst
      type: boolean
      default: 'false'
      description: "슬래시, 마침표 또는 한 자리 숫자를 하이픈으로 연결한 문자열을 `dayMonth()`처럼 일-월 순으로 읽는 옵션."
    - name: loose
      type: boolean
      default: 'false'
      description: "`@native-dates/plugins/loose`와 함께 `'17 février'` 같은 영어·현지화 월명을 읽고 파싱할 수 없으면 `null`을 반환하는 옵션."
```

**반환값**

```returns
type: MonthDay
description: "연도 정보가 없는 `MonthDay`, 또는 느슨한 모드에서 `input`을 읽을 수 없을 때 `null`."
```

[loose 플러그인](/plugins/loose/)을 불러오면 느슨한 모드에서 영어 또는 활성 `locale`의 월명을 파싱하고, 읽을 수 없는 입력에는 `null`을 반환합니다.

```js
import { monthDay } from 'native-dates';
import '@native-dates/plugins/loose';

monthDay('Oct 17', { loose: true })?.toString(); // '10-17'
monthDay('17 février', { loose: true, locale: 'fr' })?.toString(); // '02-17'
monthDay('whenever', { loose: true }); // null
```
:::

:::entry
### `dayMonth()` :kind[function]

```js signature
dayMonth(input, options?): MonthDay
dayMonth(day, month): MonthDay
```

`'17/10'`처럼 전 세계 다수 지역에서 쓰는 일-월 순 문자열과 숫자를 읽습니다. 이 팩토리 함수를 호출하면 전역 설정과 무관하게 항상 일-월 순으로 읽습니다.

`'10-17'`처럼 하이픈으로 연결된 두 자리 ISO 문자열은 두 함수 모두에서 월-일 순으로 읽히므로, JSON 출력값이 어느 환경에서나 같은 날짜로 왕복 변환됩니다.

**매개변수**

```params
- name: input
  type: MonthDayInput | number | string
  required: true
  description: "`'17/10'` 같은 일-월 순 문자열, 임의의 `MonthDayInput` 또는 1~31 범위의 정수 일(`day`)."
- name: options
  type: Zone | MonthDayOptions | number | string
  description: "시간대, `locale`을 포함한 읽기 옵션 또는 두 숫자를 전달할 때 사용하는 1~12 범위의 월(`month`)."
```

**반환값**

```returns
type: MonthDay
description: "생성된 `MonthDay`, 또는 느슨한 모드에서 `input`을 읽을 수 없을 때 `null`."
```

```js
import { dayMonth } from 'native-dates';

dayMonth('17/10').toString(); // '10-17'
dayMonth('06.05').toString(); // '05-06'
dayMonth(17, 10).toString(); // '10-17'
dayMonth('10-17').toString(); // '10-17'
```
:::

## 허용되는 입력

연도가 없는 숫자 문자열은 기본 `Date` 파서에 절대 넘기지 않습니다. 평년 기본 연도가 임의로 붙거나 유효하지 않은 날짜가 다음 달로 넘어가는 문제를 원천 차단합니다.

| 입력 | 예시 | 읽기 방식 |
|---|---|---|
| ISO 월-일 문자열 | `'10-17'`, `'--10-17'` | [`monthDay()`](#monthday)와 [`dayMonth()`](#daymonth) 모두에서 두 자리 월과 일을 월-일 순으로 읽습니다. |
| 숫자 쌍 문자열 | `'10/17'`, `'17.10'`, `'5-6'` | `/`, `.`, `-` 구분자에서 `monthDay()`는 월-일 순으로, `dayMonth()`는 일-월 순으로 읽습니다. |
| 두 개의 숫자 | `monthDay(10, 17)`, `dayMonth(17, 10)` | 월-일 순 또는 일-월 순으로 두 정수를 받습니다. |
| 필드 객체 | `{ month: 10, day: 17 }` | 1부터 시작하는 필드를 읽으며 4월 31일처럼 존재하지 않는 조합은 거부합니다. |
| 날짜 또는 타임스탬프 | `'1990-10-17'`, `datetime(...)`, `new Date()` | 지정한 시간대 또는 설정된 기본 시간대에서 달력 월과 일을 추출하고 연도는 버립니다. |
| 월명 문자열(느슨한 모드) | `'Oct 17'`, `'17 février'` | 느슨한 모드에서 영어 또는 활성 로케일의 월명과 서수를 순서에 관계없이 읽습니다. |
| Temporal 값 | `Temporal.PlainMonthDay`, `Temporal.PlainDate` | ISO 8601 Temporal 값을 그대로 감싸서 반환합니다. |

:::tip[오늘의 월일 읽기]
원하는 시간대의 현재 월과 일은 `today('Europe/Berlin').monthDay`처럼 [`today()`](/api/date-fn/#today)에서 읽을 수 있습니다.
:::
