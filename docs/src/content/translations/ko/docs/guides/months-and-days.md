---
source: 6291509fd7f2
title: 연월과 월일
lede: 일자 없는 연월이나 연도 없이 매년 반복되는 월일을 가짜 값 없이 그대로 저장합니다.
---

일반 JavaScript에서 카드 만료일을 저장하려면 끝에 가짜 1일을 붙여야 하고, 출생 연도 없는 생일을 저장하려면 2000년 같은 임시 윤년을 억지로 골라야 합니다. [`YearMonth`](/api/year-month/)와 [`MonthDay`](/api/month-day/)는 실제로 존재하는 구성 요소만 정확히 담습니다.

## 청구 월과 카드 만료일

ISO 문자열이나 연·월 숫자에는 [`yearMonth()`](/api/year-month-fn/)를, `11/28` 같은 카드 만료일에는 [`monthYear()`](/api/year-month-fn/#monthyear)를 사용하세요.

```js
import { monthYear, yearMonth } from 'native-dates';

const billing = yearMonth('2026-11');
const expiry = monthYear('11/28');

billing.daysInMonth; // 30
billing.quarter; // 4
expiry.isPast('UTC'); // false
```

[`contains()`](/api/year-month/#contains)로 특정 날짜가 해당 월에 속하는지 확인하고, [`plus()`](/api/year-month/#plus)로 월이나 분기 단위로 이동하며, [`on()`](/api/year-month/#on)으로 특정 일을 선택할 수 있습니다.

```js
billing.contains('2026-11-16'); // true
billing.plus(3, 'months').toString(); // '2027-02'
yearMonth('2026-02').on(31).toString(); // '2026-02-28'
yearMonth('2028-02').on(31).toString(); // '2028-02-29'
```

31일을 지정하면 날짜 수가 적은 달에서는 자동으로 말일로 보정되며, 윤년 2월에는 2월 29일이 됩니다.

## 생일과 연간 기념일

월-일 순 문자열에는 [`monthDay()`](/api/month-day-fn/)를, 일-월 순 문자열에는 [`dayMonth()`](/api/month-day-fn/#daymonth)를 사용하세요. 함수 이름 자체가 순서를 결정하므로 `05/10`이 어느 환경에서나 똑같이 해석됩니다.

```js
import { dayMonth, monthDay } from 'native-dates';

const birthday = monthDay('10/17');
const european = dayMonth('17/10');

birthday.equals(european); // true
birthday.in(2027).toString(); // '2027-10-17'
```

[`next()`](/api/month-day/#next)와 [`previous()`](/api/month-day/#previous)를 호출하면 오늘이나 지정한 기준 날짜로부터 다음 또는 직전 해당 날짜를 찾을 수 있습니다.

```js
birthday.next('2026-05-01').toString(); // '2026-10-17'
birthday.next('2026-10-17').toString(); // '2027-10-17'
birthday.previous('2026-10-17').toString(); // '2025-10-17'
```

2월 29일은 평년에 자동으로 2월 28일로 맞춰집니다. 특정 날짜가 일치하는지 확인하려면 [`fallsOn()`](/api/month-day/#fallson)을 호출하세요.

```js
const leapDay = monthDay(2, 29);

leapDay.in(2027).toString(); // '2027-02-28'
leapDay.fallsOn('2027-02-28'); // true
leapDay.fallsOn('2028-02-28'); // false
leapDay.fallsOn('2028-02-29'); // true
```

## 연월, 월일, 전체 날짜 간 변환

날짜나 시점에서 `.yearMonth`나 `.monthDay`를 바로 읽거나, 체인 도중에 [`as()`](/api/date-time/#as)를 호출할 수 있습니다.

```js
import { date, datetime } from 'native-dates';

const invoice = date('2026-11-16');
invoice.yearMonth.toString(); // '2026-11'
invoice.monthDay.toString(); // '11-16'

datetime('2026-11-01T02:00:00Z', 'America/Los_Angeles').as('yearMonth').toString();
// '2026-10'
```

반대로 `YearMonth`에서 `on()`으로 일을 지정하거나 `MonthDay`에서 [`in()`](/api/month-day/#in)으로 연도를 지정하면 완전한 `CalendarDate`를 얻을 수 있습니다.

## 포맷과 저장

두 타입 모두 `.text`와 [`format()`](/api/year-month/#format)으로 현지화 포맷을 지원하며, [`toString()`](/api/year-month/#tostring)으로 ISO 문자열을 생성합니다.

```js
import { monthDay, yearMonth } from 'native-dates';

yearMonth('2026-11').format('long', 'en-US'); // 'November 2026'
yearMonth('2026-05').format('long', 'ru'); // 'май 2026 г.'
monthDay('10-17').format('long', 'en-US'); // 'October 17'

yearMonth('2026-11').toString(); // '2026-11'
monthDay('10/17').toString(); // '10-17'
```

`2026-11`이나 `10-17` 같은 문자열은 데이터베이스나 URL에 깔끔하게 저장할 수 있고, `yearMonth()`와 `monthDay()`로 바로 다시 파싱할 수 있습니다.
