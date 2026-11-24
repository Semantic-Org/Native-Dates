---
source: 09d43cd55ced
title: YearMonth
lede: 청구 주기, 카드 만료일, 월 선택기 등을 위해 일 정보 없이 연과 월만 다루는 값.
---

## YearMonth 생성

[`yearMonth()`](/api/year-month-fn/)로 ISO 문자열, 연·월 숫자, 기존 날짜에서 인스턴스를 생성하거나, [`monthYear()`](/api/year-month-fn/#monthyear)로 월-연 순의 카드 만료일 문자열을 파싱합니다. 모든 인스턴스는 불변이므로 원본 값을 변경하지 않고, 값을 바꾸는 메서드마다 새 인스턴스를 반환합니다.

```js title="create.js"
import { monthYear, yearMonth } from 'native-dates';

const billing = yearMonth('2026-11');
const quarterEnd = yearMonth(2026, 12);
const expiry = monthYear('11/26');
```

임의의 [달력 날짜](/api/calendar-date/)나 [시점](/api/date-time/)에서 `yearMonth` 프로퍼티로 연월을 바로 읽거나, 체인 안에서 `as('yearMonth')`로 변환할 수도 있습니다.

```js
import { date, datetime, today } from 'native-dates';

date('2026-11-16').yearMonth.toString(); // '2026-11'
datetime('2026-11-01T02:00:00Z', 'America/Los_Angeles').as('yearMonth').toString(); // '2026-10'
const currentMonth = today().yearMonth;
```

## 프로퍼티

프로퍼티는 ISO 연·월과 해당 월의 달력 경계를 읽습니다.

| 프로퍼티 | 타입 | 설명 |
|---|---|---|
| `text` | `string` | 로케일에 맞춰 포맷한 연월(예: `'Nov 2026'`). |
| `year`, `month` | `number` | 연도와 1부터 시작하는 월(1–12). |
| `quarter` | `number` | 분기(1–4). |
| `daysInMonth`, `daysInYear` | `number` | 해당 월의 일수(28–31)와 해당 연도의 일수(365 또는 366). |
| `start`, `end` | [`CalendarDate`](/api/calendar-date/) | 해당 월의 첫날과 마지막 날. |
| `YearMonth.century` | `number` | [`monthYear()`](/api/year-month-fn/#monthyear)에서 두 자리 연도에 더하는 기준 세기. 기본값은 `2000`. |

## 연산과 필드

월·분기·연 단위로 앞뒤로 이동하거나, 필드를 교체하거나, 해당 월의 특정 일을 지정합니다.

:::note[월과 연 단위만 지원]
연월에는 일 정보가 없으므로 월보다 작은 단위를 전달하면 `RangeError`를 던집니다. 주나 일 단위 계산이 필요하면 먼저 [`on()`](#on)으로 일을 지정하세요.
:::

:::entry
### `plus()` :kind[method]

```js signature
ym.plus(amount, unit?): YearMonth
ym.add(amount, unit?): YearMonth
```

연·분기·월 단위로 앞으로 이동한 새 `YearMonth`를 반환합니다. `add()`를 별칭으로 사용할 수 있습니다.

**매개변수**

```params
- name: amount
  type: DurationInput
  required: true
  description: "`unit`과 함께 쓰는 수량, `Duration` 인스턴스, ISO 8601·영어 기간 문자열, 또는 필드 객체."
- name: unit
  type: Unit
  description: "`amount`가 숫자일 때 사용하는 월·분기·연 영어 단위명."
```

**반환값**

```returns
type: YearMonth
description: "달력에서 앞으로 이동한 새 `YearMonth`."
```

```js
const billing = yearMonth('2026-11');

billing.plus(3, 'months').toString(); // '2027-02'
billing.plus('1 year').toString(); // '2027-11'
```
:::

:::entry
### `minus()` :kind[method]

```js signature
ym.minus(amount, unit?): YearMonth
ym.subtract(amount, unit?): YearMonth
```

연·분기·월 단위로 뒤로 이동한 새 인스턴스를 반환합니다. [`plus()`](#plus)와 동일한 입력을 받으며 `subtract()`를 별칭으로 사용할 수 있습니다.

**매개변수**

```params
- name: amount
  type: DurationInput
  required: true
  description: "`unit`과 함께 쓰는 수량, `Duration` 인스턴스, ISO 8601·영어 기간 문자열, 또는 필드 객체."
- name: unit
  type: Unit
  description: "`amount`가 숫자일 때 사용하는 월·분기·연 영어 단위명."
```

**반환값**

```returns
type: YearMonth
description: "달력에서 뒤로 이동한 새 `YearMonth`."
```

```js
yearMonth('2026-11').minus(1, 'year').toString(); // '2025-11'
```
:::

:::entry
### `set()` :kind[method]

```js signature
ym.set(fields): YearMonth
ym.set(unit, value): YearMonth
```

연, 월, 또는 둘 다 바꾼 새 `YearMonth`를 반환합니다. 범위를 벗어난 월이나 월보다 작은 단위는 `RangeError`를 던집니다.

**매개변수**

```params
- name: fields
  type: Partial<YearMonthFields> | Unit
  required: true
  description: "`year` 또는 `month` 필드를 담은 객체, 또는 영어 단위명 하나."
- name: value
  type: number
  description: "영어 단위명을 전달할 때 설정할 정수 값."
```

**반환값**

```returns
type: YearMonth
description: "달력 필드가 갱신된 새 `YearMonth`."
```

```js
const billing = yearMonth('2026-11');

billing.set('month', 2).toString(); // '2026-02'
billing.set({ year: 2028, month: 2 }).daysInMonth; // 29
```
:::

:::entry
### `on()` :kind[method]

```js signature
ym.on(day): CalendarDate
```

이 월에 1부터 31 사이의 정수 일을 지정해 [`CalendarDate`](/api/calendar-date/)를 반환합니다. 2월이나 4월처럼 짧은 달에 31을 전달하면 해당 월의 말일로 보정되며, 1–31 범위를 벗어난 숫자는 `RangeError`를 던집니다.

**매개변수**

```params
- name: day
  type: number | string
  required: true
  description: "1부터 31 사이의 정수 일."
```

**반환값**

```returns
type: CalendarDate
description: "해당 월의 지정된 날짜를 나타내는 `CalendarDate`."
```

```js
yearMonth('2026-11').on(15).toString(); // '2026-11-15'
yearMonth('2026-02').on(31).toString(); // '2026-02-28'
yearMonth('2028-02').on(31).toString(); // '2028-02-29'
```
:::

## 비교와 포함 여부

연월을 시간순으로 비교하거나 특정 날짜가 이 월에 속하는지 확인합니다. `<` 같은 관계 연산자는 예외를 던지며, 배열은 [`compare()`](/api/compare/)나 [경계 헬퍼 함수](/api/compare/#earliest)로 깔끔하게 정렬·비교할 수 있습니다.

:::entry
### `compare()` :kind[method]

```js signature
ym.compare(other): -1 | 0 | 1
```

정렬에 사용할 수 있도록 이 연월과 다른 연월의 순서를 비교해 음수, 0, 또는 양수를 반환합니다. 전체 날짜나 타임스탬프를 전달하면 해당 날짜가 속한 연월과 비교합니다.

**매개변수**

```params
- name: other
  type: YearMonthInput
  required: true
  description: "다른 `YearMonth` 또는 `yearMonth()`가 허용하는 입력값."
```

**반환값**

```returns
type: -1 | 0 | 1
description: "더 이르면 `-1`, 같으면 `0`, 더 늦으면 `1`."
```

```js
yearMonth('2026-05').compare('2026-11'); // -1
yearMonth('2026-11').compare('2026-11-16'); // 0
```
:::

:::entry
### `equals()` :kind[method]

```js signature
ym.equals(other): boolean
```

두 값이 같은 연과 월을 나타내면 `true`를 반환합니다.

```js
yearMonth('2026-11').equals(yearMonth(2026, 11)); // true
```
:::

:::entry
### `isBefore()` :kind[method]

```js signature
ym.isBefore(other): boolean
```

이 연월이 다른 연월보다 이르면 `true`를 반환합니다.

```js
yearMonth('2026-10').isBefore('2026-11'); // true
```
:::

:::entry
### `isAfter()` :kind[method]

```js signature
ym.isAfter(other): boolean
```

이 연월이 다른 연월보다 늦으면 `true`를 반환합니다.

```js
yearMonth('2026-12').isAfter('2026-11'); // true
```
:::

:::entry
### `contains()` :kind[method]

```js signature
ym.contains(day): boolean
ym.includes(day): boolean
```

주어진 달력 날짜나 타임스탬프가 이 연월에 속하면 `true`를 반환합니다. `includes()`를 별칭으로 사용할 수 있습니다.

**매개변수**

```params
- name: day
  type: CalendarDateInput
  required: true
  description: "날짜 문자열, `CalendarDate`, `DateTime`, 필드 객체, 또는 `Date`."
```

**반환값**

```returns
type: boolean
description: "`day`가 이 월에 속하면 `true`."
```

```js
const nov = yearMonth('2026-11');

nov.contains('2026-11-16'); // true
nov.contains('2026-12-01'); // false
```
:::

:::entry
### `isPast()` :kind[method]

```js signature
ym.isPast(zone?): boolean
```

지정한 시간대 또는 기본 시간대의 오늘이 속한 월보다 이 월 전체가 앞서면 `true`를 반환합니다.

```js
yearMonth('2020-01').isPast('UTC'); // true
```
:::

:::entry
### `isFuture()` :kind[method]

```js signature
ym.isFuture(zone?): boolean
```

지정한 시간대 또는 기본 시간대의 오늘이 속한 월보다 이 월이 뒤에 있으면 `true`를 반환합니다.

```js
yearMonth('2099-01').isFuture('UTC'); // true
```
:::

:::entry
### `isLeapYear()` :kind[method]

```js signature
ym.isLeapYear(): boolean
```

이 월이 속한 연도가 366일인 윤년이면 `true`를 반환합니다.

```js
yearMonth('2028-02').isLeapYear(); // true
yearMonth('2026-02').isLeapYear(); // false
```
:::

## 기간 측정

:::entry
### `until()` :kind[method]

```js signature
ym.until(other): Duration
ym.until(other, unit): number
```

이 월에서 다른 월까지의 기간을 측정하며, 대상이 더 이르면 음수 기간을 반환합니다. 반환된 [`Duration`](/api/duration/)은 이 월의 시작일을 기준 시점으로 기억하므로 월·연 기간을 어떤 단위로도 환산할 수 있습니다.

**매개변수**

```params
- name: other
  type: YearMonthInput
  required: true
  description: "측정 대상이 되는 끝 연월."
- name: unit
  type: Unit
  description: "총 기간을 부동소수점 숫자로 반환할 영어 단위명."
```

**반환값**

```returns
type: Duration | number
description: "연과 월로 이루어진 `Duration`, 또는 `unit`을 지정한 경우 숫자."
```

```js
const start = yearMonth('2026-03');

start.until('2027-06').toString(); // 'P1Y3M'
start.until('2027-06', 'months'); // 15
```
:::

:::entry
### `since()` :kind[method]

```js signature
ym.since(other): Duration
ym.since(other, unit): number
```

더 이른 연월부터 이 연월까지 경과한 기간을 측정합니다. 영어 단위명을 전달하면 총 기간을 숫자로 반환합니다.

```js
yearMonth('2026-11').since('2026-05', 'months'); // 6
```
:::

## 포맷과 변환

:::entry
### `format()` :kind[method]

```js signature
ym.format(spec?, locale?): string
```

프리셋 이름, `Intl` 옵션 객체, 또는 `'MM/YY'` 같은 내장 토큰 패턴으로 연월을 포맷합니다. 공용 옵션 객체에 포함된 일·시각·시간대 키는 자동으로 제외됩니다.

표준 프리셋과 현지화 프리셋은 연과 월만 출력하며, [`configure()`](/api/configure/)에 등록한 사용자 지정 포맷도 그대로 동작합니다. 전체 프리셋과 토큰 표는 [포맷](/guides/formatting/)에서 확인하세요.

**매개변수**

```params
- name: spec
  type: FormatSpec
  default: "'medium'"
  description: "`'medium'`이나 `'long'` 같은 프리셋 이름, `Intl` 옵션 객체, 또는 토큰 패턴."
- name: locale
  type: Locale
  description: "이번 호출에서만 인스턴스 로케일이나 기본 로케일을 덮어쓸 BCP 47 로케일 태그."
```

**반환값**

```returns
type: string
description: "포맷된 연월 문자열."
```

```js
const nov = yearMonth('2026-11');

nov.format('short', 'en-US'); // '11/2026'
nov.format('medium', 'en-US'); // 'Nov 2026'
nov.format('long', 'en-US'); // 'November 2026'
nov.format('L', 'en-US'); // '11/2026'
nov.format('MM/YY'); // '11/26'
```
:::

:::entry
### `locale()` :kind[method]

```js signature
ym.locale(): Locale | undefined
ym.locale(tag): YearMonth
```

이 연월에 지정된 로케일을 읽거나, 텍스트 미리보기·프리셋·파생 값 전반에 다른 로케일을 적용한 복사본을 반환합니다. 빈 태그나 `null`을 전달하면 로케일 지정을 해제하며, [`lang()`](#lang)을 별칭으로 사용할 수 있습니다.

**매개변수**

```params
- name: tag
  type: Locale | null | undefined
  description: "적용할 BCP 47 로케일 태그. 기존 태그를 해제하려면 `null`을 전달합니다."
```

**반환값**

```returns
type: YearMonth | Locale | undefined
description: "인수 없이 호출하면 활성 로케일 태그, 인수를 전달하면 `tag`를 적용한 새 `YearMonth`."
```

```js
const may = yearMonth('2026-05').locale('ru');

may.locale(); // 'ru'
may.format('long'); // 'май 2026 г.'
may.on(1).format('long'); // '1 мая 2026 г.'
```
:::

:::entry
### `lang()` :kind[method]

```js signature
ym.lang(): Locale | undefined
ym.lang(tag): YearMonth
```

이 연월의 BCP 47 로케일 태그를 읽거나 지정하는 [`locale()`](#locale)의 단축 별칭입니다.
:::

:::entry
### `as()` :kind[method]

```js signature
ym.as('yearMonth'): YearMonth
```

범용 변환 체인에서 `'yearMonth'`를 요청하면 이 인스턴스를 그대로 반환하고, 다른 타입을 요청하면 `RangeError`를 던집니다.
:::

:::entry
### `toString()` :kind[method]

```js signature
ym.toString(): string
ym.toJSON(): string
```

HTML 월 입력 필드 형식과 일치하는 ISO 8601 연월 문자열을 반환합니다. `toJSON()`도 JSON 직렬화를 위해 동일한 문자열을 반환합니다.

**반환값**

```returns
type: string
description: "ISO 8601 연월 문자열(예: `'2026-11'`)."
```

```js
yearMonth(2026, 11).toString(); // '2026-11'
JSON.stringify({ billing: yearMonth(2026, 11) }); // '{"billing":"2026-11"}'
```
:::

:::entry
### `toTemporal()` :kind[method]

```js signature
ym.toTemporal(): Temporal.PlainYearMonth
```

내부의 `Temporal.PlainYearMonth` 인스턴스를 반환합니다.
:::

:::entry
### `valueOf()` :kind[method]

```js signature
ym.valueOf(): never
```

숫자 연산자가 연월을 숫자로 암묵적 변환하지 않도록 `RangeError`를 던집니다. 알 수 없는 값의 타입을 좁히려면 [`isYearMonth()`](/api/kind-of/#isyearmonth)나 [`kindOf()`](/api/kind-of/)를 사용하세요.
:::
