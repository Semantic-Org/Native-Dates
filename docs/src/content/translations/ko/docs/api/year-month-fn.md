---
source: 91937c1bc2c8
title: yearMonth()
lede: ISO 연-월 문자열, 카드 만료일, 숫자 또는 날짜를 읽어 YearMonth를 생성합니다.
---

## 연월 읽기

:::entry
### `yearMonth()` :kind[function]

```js signature
yearMonth(input, options?): YearMonth
yearMonth(input, zone?): YearMonth
yearMonth(year, month): YearMonth
```

연-월 순 문자열, 연도와 1부터 시작하는 월 숫자, 필드 객체, 또는 날짜·타임스탬프(일은 제외)로부터 [`YearMonth`](/api/year-month/)를 생성합니다. 입력이 누락되면 이번 달로 대체하지 않고 `TypeError`를 던집니다.

```js title="billing.js"
import { datetime, yearMonth } from 'native-dates';

const fromIso = yearMonth('2026-11');
const fromNumbers = yearMonth(2026, 11);
const fromFields = yearMonth({ year: 2026, month: 11 });
const fromDate = yearMonth('2026-11-16');
const fromInstant = yearMonth(datetime('2026-11-01T02:00:00Z'), 'America/Los_Angeles');

fromNumbers.toString(); // '2026-11'
fromInstant.toString(); // '2026-10'
```

**매개변수**

```params
- name: input
  type: YearMonthInput | number | string
  required: true
  description: "ISO 연-월 문자열, 필드 객체, 날짜·타임스탬프 또는 달력 연도(`year`)."
- name: options
  type: Zone | ReadOptions | number | string
  description: "타임스탬프나 비정형 문자열을 읽을 때의 시간대·옵션 객체 또는 1부터 12까지의 월(`month`)."
  options:
    - name: zone
      type: Zone
      description: "시점 문자열, `DateTime` 또는 `Date`에서 달력 월을 판별할 때 사용할 시간대."
    - name: locale
      type: Locale
      description: "반환된 `YearMonth`와 이 값에서 파생되는 모든 값에 유지할 BCP 47 로케일 태그."
    - name: loose
      type: boolean
      default: 'false'
      description: "`@native-dates/plugins/loose`와 함께 `'février 2026'` 같은 영어·현지화 월명을 읽고 파싱할 수 없으면 `null`을 반환하는 옵션."
```

**반환값**

```returns
type: YearMonth
description: "일(day) 정보가 없는 `YearMonth`, 또는 느슨한 모드에서 `input`을 읽을 수 없을 때 `null`."
```

[loose 플러그인](/plugins/loose/)을 불러오면 느슨한 모드에서 4자리 연도와 함께 쓰인 영어 또는 활성 `locale`의 월명을 파싱하고, 읽을 수 없는 문자열에는 `null`을 반환합니다.

```js
import { yearMonth } from 'native-dates';
import '@native-dates/plugins/loose';

yearMonth('Nov 2026', { loose: true })?.toString(); // '2026-11'
yearMonth('février 2026', { loose: true, locale: 'fr' })?.toString(); // '2026-02'
yearMonth('not-a-month', { loose: true }); // null
```
:::

:::entry
### `monthYear()` :kind[function]

```js signature
monthYear(input, options?): YearMonth
monthYear(month, year): YearMonth
```

`'11/26'`처럼 결제 카드에 인쇄된 월-연 순 문자열과 숫자를 읽습니다. 0부터 99까지의 두 자리 연도는 기본값이 2000인 [`YearMonth.century`](/api/year-month/#properties)에 더해 해석합니다.

`'2026-11'` 같은 ISO 문자열은 두 함수 모두에서 연-월 순으로 읽히므로 직렬화된 값은 항상 안전하게 왕복 변환됩니다.

**매개변수**

```params
- name: input
  type: YearMonthInput | number | string
  required: true
  description: "`'11/26'` 같은 카드 만료일 문자열, 임의의 `YearMonthInput` 또는 1부터 12까지의 월(`month`)."
- name: options
  type: Zone | ReadOptions | number | string
  description: "시간대, `locale`을 포함한 읽기 옵션 또는 두 숫자를 전달할 때의 2자리·4자리 연도(`year`)."
```

**반환값**

```returns
type: YearMonth
description: "생성된 `YearMonth`, 또는 느슨한 모드에서 `input`을 읽을 수 없을 때 `null`."
```

```js
import { monthYear } from 'native-dates';

monthYear('11/26').toString(); // '2026-11'
monthYear('05/2028').toString(); // '2028-05'
monthYear(11, 26).toString(); // '2026-11'
monthYear('2026-11').toString(); // '2026-11'
```
:::

## 허용되는 입력

월은 숫자, 문자열, 필드 객체 모두에서 1월(`1`)부터 12월(`12`)까지로 표기합니다.

| 입력 | 예시 | 읽기 방식 |
|---|---|---|
| 연-월 순 문자열 | `'2026-11'`, `'2026/11'`, `'2026年11月'` | 라틴 문자와 콜론을 제외한 모든 구분자로 연결된 4자리 연도와 1~2자리 월을 읽습니다. |
| 카드 만료일 문자열 | `monthYear('11/26')`, `monthYear('11.2026')` | `/`, `-`, `.` 구분자에서 월을 먼저 읽고 2자리 연도는 `YearMonth.century`로 확장합니다. |
| 두 개의 숫자 | `yearMonth(2026, 11)`, `monthYear(11, 26)` | 연-월 순 또는 월-연 순으로 두 정수를 받습니다. |
| 필드 객체 | `{ year: 2026, month: 11 }` | 1부터 시작하는 달력 필드를 읽으며 1~12 범위를 벗어난 월은 거부합니다. |
| 날짜 또는 타임스탬프 | `'2026-11-16'`, `datetime(...)`, `new Date()` | 지정한 시간대 또는 설정된 기본 시간대에서 달력 월을 추출하고 일은 버립니다. |
| 월명 문자열(느슨한 모드) | `'Nov 2026'`, `'février 2026'` | 느슨한 모드에서 4자리 연도와 함께 쓰인 영어 또는 활성 로케일의 월명을 읽습니다. |
| Temporal 값 | `Temporal.PlainYearMonth`, `Temporal.PlainDate` | ISO 8601 Temporal 값을 그대로 감싸서 반환합니다. |

:::tip[이번 달 읽기]
원하는 시간대의 현재 달력 월은 `today('Asia/Tokyo').yearMonth`처럼 [`today()`](/api/date-fn/#today)에서 읽을 수 있습니다.
:::
