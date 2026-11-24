---
source: 436c0292465a
title: MonthDay
lede: 생일, 기념일, 매년 돌아오는 공휴일 등을 위해 연도 없이 월과 일만 다루는 값.
---

## MonthDay 생성

[`monthDay()`](/api/month-day-fn/)로 월-일 순 입력에서 인스턴스를 생성하거나, [`dayMonth()`](/api/month-day-fn/#daymonth)로 일-월 순 입력에서 생성합니다. 모든 인스턴스는 불변이므로 원본 값을 변경하지 않으며, 값을 변환하거나 이동하는 메서드마다 새 인스턴스를 반환합니다.

```js title="create.js"
import { dayMonth, monthDay } from 'native-dates';

const birthday = monthDay(10, 17);
const fromIso = monthDay('10-17');
const european = dayMonth('17/10');
```

임의의 [달력 날짜](/api/calendar-date/)나 [시점](/api/date-time/)에서 `monthDay` 프로퍼티로 월일을 바로 읽거나, 체인 안에서 `as('monthDay')`로 변환할 수도 있습니다.

```js
import { date, datetime, today } from 'native-dates';

date('1990-10-17').monthDay.toString(); // '10-17'
datetime('2026-10-18T02:00:00Z', 'America/Los_Angeles').as('monthDay').toString(); // '10-17'
const currentMonthDay = today().monthDay;
```

## 프로퍼티

프로퍼티는 1부터 시작하는 월과 일을 읽습니다.

| 프로퍼티 | 타입 | 설명 |
|---|---|---|
| `text` | `string` | 로케일에 맞춰 포맷한 월일(예: `'Oct 17'`). |
| `month`, `day` | `number` | 1부터 12 사이의 월과 1부터 31 사이의 일. |

## 연도 지정과 앞뒤 날짜 이동

매년 반복되는 월일에 연도를 결합해 구체적인 날짜를 얻거나, 기준 날짜를 중심으로 앞뒤에 있는 가장 가까운 해당 날짜로 이동합니다.

:::entry
### `in()` :kind[method]

```js signature
md.in(year): CalendarDate
```

이 월일에 연도를 결합해 [`CalendarDate`](/api/calendar-date/)를 반환합니다. 2월 29일은 윤일이 없는 평년에서 2월 28일로 보정됩니다.

**매개변수**

```params
- name: year
  type: number | string
  required: true
  description: "`2027` 같은 정수 연도."
```

**반환값**

```returns
type: CalendarDate
description: "지정한 `year`에서 이 월일이 해당하는 `CalendarDate`."
```

```js
const birthday = monthDay(10, 17);
const leapDay = monthDay(2, 29);

birthday.in(2027).toString(); // '2027-10-17'
leapDay.in(2027).toString(); // '2027-02-28'
leapDay.in(2028).toString(); // '2028-02-29'
```
:::

:::entry
### `next()` :kind[method]

```js signature
md.next(day?): CalendarDate
```

기준 날짜 이후에 돌아오는 다음 날짜를 반환하며, 기준 날짜를 생략하면 [`today()`](/api/date-fn/#today)를 기본값으로 사용합니다. 기준 날짜 자체가 이미 이 월일이면 다음 해의 날짜로 넘어갑니다.

달력 날짜와 시점에서도 [`d.next(md)`](/api/calendar-date/#next)와 [`dt.next(md)`](/api/date-time/#next)처럼 `MonthDay`를 직접 전달할 수 있습니다.

**매개변수**

```params
- name: day
  type: CalendarDateInput
  default: today()
  description: "앞으로 탐색을 시작할 기준 날짜."
```

**반환값**

```returns
type: CalendarDate
description: "`day` 이후에 처음 돌아오는 `CalendarDate`."
```

```js
import { date, monthDay } from 'native-dates';

const birthday = monthDay(10, 17);

birthday.next('2026-05-01').toString(); // '2026-10-17'
birthday.next('2026-10-17').toString(); // '2027-10-17'
date('2026-11-16').next(birthday).toString(); // '2027-10-17'
```
:::

:::entry
### `previous()` :kind[method]

```js signature
md.previous(day?): CalendarDate
md.last(day?): CalendarDate
```

기준 날짜 이전에 지나간 가장 최근 날짜를 반환하며, 기준 날짜를 생략하면 [`today()`](/api/date-fn/#today)를 기본값으로 사용합니다. 달력 날짜와 시점에서도 `previous()`에 `MonthDay`를 직접 전달할 수 있으며, `last()`를 별칭으로 사용할 수 있습니다.

**매개변수**

```params
- name: day
  type: CalendarDateInput
  default: today()
  description: "뒤로 탐색을 시작할 기준 날짜."
```

**반환값**

```returns
type: CalendarDate
description: "`day` 이전의 가장 최근 `CalendarDate`."
```

```js
import { date, monthDay } from 'native-dates';

const birthday = monthDay(10, 17);

birthday.previous('2026-10-17').toString(); // '2025-10-17'
date('2026-11-16').previous(birthday).toString(); // '2026-10-17'
```
:::

:::entry
### `after()` :kind[method]

```js signature
md.after(day): CalendarDate
```

전달한 기준 날짜 이후에 돌아오는 다음 날짜를 반환합니다. 기준 날짜가 필수이며 오늘을 기본값으로 쓰지 않는다는 점만 빼면 [`next()`](#next)와 동일하게 동작합니다.

**매개변수**

```params
- name: day
  type: CalendarDateInput
  required: true
  description: "이후 날짜를 찾을 기준 날짜."
```

**반환값**

```returns
type: CalendarDate
description: "`day` 이후에 처음 돌아오는 `CalendarDate`."
```

```js
monthDay(2, 29).after('2026-03-01').toString(); // '2027-02-28'
```
:::

:::entry
### `before()` :kind[method]

```js signature
md.before(day): CalendarDate
```

전달한 기준 날짜 이전에 지나간 가장 최근 날짜를 반환합니다. 기준 날짜가 필수이며 오늘을 기본값으로 쓰지 않는다는 점만 빼면 [`previous()`](#previous)와 동일하게 동작합니다.

```js
monthDay(10, 17).before('2026-10-01').toString(); // '2025-10-17'
```
:::

## 일치와 동등성

월일은 단일 날짜가 아니라 매년 반복되는 날짜이므로 `isBefore()` 같은 전후 순서 비교 메서드는 제공하지 않습니다.

:::tip[equals와 fallsOn 선택 기준]
특정 달력 날짜가 그해에 이 월일이 돌아오는 날인지 확인하려면 [`fallsOn()`](#fallson)을 사용하세요. 2월 29일은 평년에 2월 28일로 처리됩니다. 두 값의 월과 일 숫자가 정확히 같은지 비교할 때만 [`equals()`](#equals)를 사용하세요.
:::

:::entry
### `fallsOn()` :kind[method]

```js signature
md.fallsOn(day): boolean
md.isOn(day): boolean
```

주어진 날짜가 그해에서 이 월일이 해당하는 날짜이면 `true`를 반환합니다. 2월 29일은 평년에서는 2월 28일에 해당하고, 윤년에서는 2월 29일에만 해당합니다. `isOn()`을 별칭으로 사용할 수 있습니다.

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
description: "`day`가 해당 연도에서 이 월일이 돌아오는 날짜이면 `true`."
```

```js
const leapDay = monthDay(2, 29);

leapDay.fallsOn('2027-02-28'); // true
leapDay.fallsOn('2028-02-28'); // false
leapDay.fallsOn('2028-02-29'); // true
```
:::

:::entry
### `equals()` :kind[method]

```js signature
md.equals(other): boolean
```

두 값의 월과 일 숫자가 정확히 같으면 `true`를 반환하며, 전체 날짜나 타임스탬프를 전달하면 월과 일만 추출해 비교합니다.

`'05/10'`처럼 순서가 모호한 슬래시·점 구분 문자열은 `RangeError`를 던집니다. 비교하기 전에 [월-일 순 또는 일-월 순 팩토리 함수](/api/month-day-fn/)로 먼저 파싱하세요.

**매개변수**

```params
- name: other
  type: MonthDayInput
  required: true
  description: "다른 `MonthDay`, ISO `'10-17'` 문자열, 필드 객체, 또는 날짜 값."
```

**반환값**

```returns
type: boolean
description: "두 값의 월과 일이 정확히 같으면 `true`."
```

```js
const birthday = monthDay(10, 17);

birthday.equals('10-17'); // true
birthday.equals('1990-10-17'); // true
monthDay(2, 29).equals('2027-02-28'); // false
```
:::

:::entry
### `isToday()` :kind[method]

```js signature
md.isToday(zone?): boolean
```

지정한 시간대 또는 기본 시간대의 오늘 날짜가 이 월일에 해당하면 `true`를 반환합니다.

```js
import { today } from 'native-dates';

today('UTC').monthDay.isToday('UTC'); // true
```
:::

:::entry
### `isTomorrow()` :kind[method]

```js signature
md.isTomorrow(zone?): boolean
```

지정한 시간대 또는 기본 시간대의 내일 날짜가 이 월일에 해당하면 `true`를 반환합니다.

```js
import { tomorrow } from 'native-dates';

tomorrow('UTC').monthDay.isTomorrow('UTC'); // true
```
:::

:::entry
### `isYesterday()` :kind[method]

```js signature
md.isYesterday(zone?): boolean
```

지정한 시간대 또는 기본 시간대의 어제 날짜가 이 월일에 해당하면 `true`를 반환합니다.

```js
import { yesterday } from 'native-dates';

yesterday('UTC').monthDay.isYesterday('UTC'); // true
```
:::

## 포맷과 변환

:::entry
### `format()` :kind[method]

```js signature
md.format(spec?, locale?): string
```

로케일 고유의 순서나 `'MMM Do'` 같은 내장 토큰 패턴으로 월일을 포맷합니다. 공용 옵션 객체에 포함된 연·시각·시간대 키는 자동으로 무시됩니다.

[`configure()`](/api/configure/)에 등록한 사용자 지정 포맷도 그대로 동작하며, 비그레고리력 로케일에서도 매년 반복되는 날짜가 흔들리지 않도록 그레고리력 월 이름을 출력합니다. 전체 프리셋과 토큰 옵션은 [포맷](/guides/formatting/)에서 확인하세요.

**매개변수**

```params
- name: spec
  type: FormatSpec
  default: "'medium'"
  description: "`'short'`나 `'long'` 같은 프리셋 이름, `Intl` 옵션 객체, 또는 토큰 패턴."
- name: locale
  type: Locale
  description: "이번 호출에서만 인스턴스 로케일이나 기본 로케일을 덮어쓸 BCP 47 로케일 태그."
```

**반환값**

```returns
type: string
description: "포맷된 월일 문자열."
```

```js
const oct17 = monthDay(10, 17);

oct17.format('short', 'en-US'); // '10/17'
oct17.format('short', 'en-GB'); // '17/10'
oct17.format('medium', 'en-US'); // 'Oct 17'
oct17.format('long', 'en-US'); // 'October 17'
oct17.format('MMM Do', 'en-US'); // 'Oct 17th'
```
:::

:::entry
### `locale()` :kind[method]

```js signature
md.locale(): Locale | undefined
md.locale(tag): MonthDay
```

이 월일에 지정된 로케일을 읽거나, 텍스트 미리보기·프리셋·파생 날짜 전반에 다른 로케일을 적용한 복사본을 반환합니다. 빈 태그나 `null`을 전달하면 로케일 지정을 해제하며, [`lang()`](#lang)을 별칭으로 사용할 수 있습니다.

**매개변수**

```params
- name: tag
  type: Locale | null | undefined
  description: "적용할 BCP 47 로케일 태그. 기존 태그를 해제하려면 `null`을 전달합니다."
```

**반환값**

```returns
type: MonthDay | Locale | undefined
description: "인수 없이 호출하면 활성 로케일 태그, 인수를 전달하면 `tag`를 적용한 새 `MonthDay`."
```

```js
const labourDay = monthDay(5, 1).locale('ru');

labourDay.locale(); // 'ru'
labourDay.format('long'); // '1 мая'
labourDay.in(2026).format('long'); // '1 мая 2026 г.'
```
:::

:::entry
### `lang()` :kind[method]

```js signature
md.lang(): Locale | undefined
md.lang(tag): MonthDay
```

이 월일의 BCP 47 로케일 태그를 읽거나 지정하는 [`locale()`](#locale)의 단축 별칭입니다.
:::

:::entry
### `as()` :kind[method]

```js signature
md.as('monthDay'): MonthDay
```

범용 변환 체인에서 `'monthDay'`를 요청하면 이 인스턴스를 그대로 반환하고, 다른 타입을 요청하면 `RangeError`를 던집니다.
:::

:::entry
### `toString()` :kind[method]

```js signature
md.toString(): string
md.toJSON(): string
```

두 자리 ISO 월일 문자열 `'MM-DD'`를 반환하며, 이 형식은 두 [월일 팩토리 함수](/api/month-day-fn/) 모두에서 월-일 순으로 그대로 다시 파싱됩니다. `toJSON()`도 JSON 직렬화를 위해 동일한 문자열을 반환합니다.

**반환값**

```returns
type: string
description: "ISO 월일 문자열(예: `'10-17'`)."
```

```js
monthDay(5, 6).toString(); // '05-06'
JSON.stringify({ birthday: monthDay(10, 17) }); // '{"birthday":"10-17"}'
```
:::

:::entry
### `toTemporal()` :kind[method]

```js signature
md.toTemporal(): Temporal.PlainMonthDay
```

내부의 `Temporal.PlainMonthDay` 인스턴스를 반환합니다.
:::

:::entry
### `valueOf()` :kind[method]

```js signature
md.valueOf(): never
```

숫자 연산자가 월일을 숫자로 암묵적 변환하지 않도록 `RangeError`를 던집니다. 알 수 없는 값의 타입을 좁히려면 [`isMonthDay()`](/api/kind-of/#ismonthday)나 [`kindOf()`](/api/kind-of/)를 사용하세요.
:::
