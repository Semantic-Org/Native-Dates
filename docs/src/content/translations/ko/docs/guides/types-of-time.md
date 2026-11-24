---
source: 8bfe5a8d41c8
title: 날짜와 시각 타입
lede: 달력 날짜, 시각, 특정 시점, 부분 날짜, 범위, 기간 중 상황에 맞는 타입을 선택하는 방법을 안내합니다.
---

JavaScript의 내장 `Date`는 누군가의 생일이든 오전 9시 30분 알람이든 주문이 접수된 정확한 초 단위 시점이든 모든 것을 하나의 객체로 표현합니다.

Native Dates는 개념마다 별도의 타입을 제공해 실제로 다루는 구성 요소만 명확하게 담을 수 있습니다.

- **[`CalendarDate`](/api/calendar-date/)**: 2026년 5월 10일 같은 달력 날짜
- **[`Time`](/api/time/)**: 오전 9시 30분 같은 하루 중의 시각
- **[`DateTime`](/api/date-time/)**: 특정 시간대에 속한 정확한 날짜와 시각(시점)
- **[`Duration`](/api/duration/)**: 2시간이나 3주 같은 기간
- **[`YearMonth`](/api/year-month/)**와 **[`MonthDay`](/api/month-day/)**: 일 없는 연월, 또는 연도 없이 매년 반복되는 월일
- **[범위](/api/ranges/)**: 두 날짜, 두 시각, 또는 두 시점 사이의 구간

## CalendarDate

생일, 마감일, 공휴일, 날짜 선택기 값처럼 특정 초가 아니라 날짜 자체가 중요할 때 [`CalendarDate`](/api/calendar-date/)를 사용하세요.

[`today()`](/api/date-fn/#today)나 [`date()`](/api/date-fn/)로 생성합니다.

```js
import { date, today } from 'native-dates';

const birthday = date('2026-05-10');
const due = today().plus(2, 'weeks');

birthday.month; // 5
birthday.day; // 10
```

달력 날짜에는 시각이나 시간대가 없으므로 사용자가 어느 지역에 있든 5월 10일은 언제나 5월 10일로 유지됩니다.

## Time

매장 영업시간이나 매일 울리는 알림처럼 특정 날짜에 묶이지 않은 하루 중의 시각에는 [`Time`](/api/time/)을 사용하세요.

```js
import { time } from 'native-dates';

const opens = time('9:00am');
const closes = opens.plus(8, 'hours');

closes.hour; // 17
closes.format('short', 'en-US'); // '5:00 PM'
```

넘어갈 날짜가 없으므로 자정을 넘겨 시간을 더해도 24시간 시계 기준으로 깔끔하게 순환합니다.

## DateTime

회의 일정, 항공편 출발 시점, 데이터베이스 타임스탬프처럼 실제 타임라인 위의 한 시점을 다룰 때 [`DateTime`](/api/date-time/)을 사용하세요.

[`now()`](/api/datetime-fn/#now)나 [`datetime()`](/api/datetime-fn/)으로 생성하거나, 달력 날짜에 시각을 붙여 만들 수 있습니다.

```js
import { date, datetime, now } from 'native-dates';

const current = now();
const created = datetime('2026-11-16T17:30:00Z');
const standup = date('2026-11-16').at('9:30am', 'America/Los_Angeles');
```

각 `DateTime`은 어떤 일이 발생하는 정확한 시점과 이를 바라보는 시간대를 함께 지닙니다. [`in()`](/api/date-time/#in)을 호출하면 같은 시점을 다른 도시의 시간대로 확인할 수 있습니다.

```js
standup.in('Europe/Berlin').format('time', 'en-US'); // '6:30 PM'
```

## Duration

어떤 일이 얼마나 오래 이어지는지 표현할 때 [`Duration`](/api/duration/)을 사용하세요. [`hours()`](/api/duration-fn/#hours) 같은 단위 헬퍼로 만들거나 [`duration()`](/api/duration-fn/)에 영어 단위 문자열을 전달해 생성할 수 있습니다.

```js
import { days, duration, hours } from 'native-dates';

const call = hours(1.5);
const trial = days(14);
const turnaround = duration('2 weeks, 3 days');
```

두 값 사이의 간격을 측정할 때도 `Duration`이 반환됩니다.

```js
const opens = time('9:00am');
const lunch = time('12:30pm');

opens.until(lunch).format('long', 'en-US'); // '3 hours, 30 minutes'
```

## YearMonth

청구 월, 카드 만료일, 월 입력 필드처럼 일(day) 없이 연도와 월만 있는 값에는 [`YearMonth`](/guides/months-and-days/#billing-months-and-card-expiries)를 사용하세요.

```js
import { monthYear, yearMonth } from 'native-dates';

const billing = yearMonth('2026-11');
const expiry = monthYear('11/28');

billing.daysInMonth; // 30
billing.on(15); // 2026-11-15를 나타내는 CalendarDate
```

`YearMonth`는 월과 연 단위로 계산하며, [`on()`](/api/year-month/#on)을 호출해 해당 월의 원하는 날짜를 `CalendarDate`로 꺼낼 수 있습니다.

## MonthDay

생일이나 매년 돌아오는 기념일처럼 연도 없이 반복되는 날짜에는 [`MonthDay`](/guides/months-and-days/#birthdays-and-annual-holidays)를 사용하세요.

```js
import { monthDay } from 'native-dates';

const birthday = monthDay('10/17');

birthday.in(2026); // 2026-10-17을 나타내는 CalendarDate
birthday.fallsOn('2026-10-17'); // true
```

[`fallsOn()`](/api/month-day/#fallson)이나 [`in()`](/api/month-day/#in)을 호출하면 윤년이 아닌 해의 2월 29일은 자동으로 2월 28일로 맞춰집니다.

## 범위

두 날짜, 두 시각, 또는 두 시점 사이의 구간에는 [범위](/guides/ranges/)를 사용하세요. [`dateRange()`](/api/range-fn/#daterange), [`timeRange()`](/api/range-fn/#timerange), [`datetimeRange()`](/api/range-fn/#datetimerange)로 바로 생성할 수 있습니다.

```js
import { dateRange, timeRange } from 'native-dates';

const sprint = dateRange('2026-11-02', '2026-11-15');
const shift = timeRange('9:00am', '5:00pm');

sprint.contains('2026-11-10'); // true
shift.duration.hours; // 8
```

날짜 범위(`DateRange`)는 마지막 날을 포함하는 양 끝 포함 구간이며, 시점 범위(`DateTimeRange`)와 시각 범위(`TimeRange`)는 연속된 구간이 겹치지 않도록 끝 경계를 제외하는 반개방 구간입니다.

## 타입 간 이동

구성 요소를 더하거나 덜어내면 타입 사이를 자연스럽게 오갈 수 있습니다. 달력 날짜에 [`at()`](/api/calendar-date/#at)으로 시각을 붙이면 `DateTime` 시점이 되고, 기존 값에서 [`for()`](/api/ranges/#to)나 [`to()`](/api/ranges/#to)를 호출하면 범위를 만들 수 있습니다.

```js
const reminder = today().plus(1, 'day').at('9:00am');
const upcoming = today().for(2, 'weeks');
```

반대로 `DateTime`이나 `CalendarDate`에서 하위 구성 요소 프로퍼티를 바로 읽거나, 메서드 체인 중간에 [`as()`](/api/date-time/#as)를 호출할 수도 있습니다.

```js
reminder.date; // 내일을 나타내는 CalendarDate
reminder.time; // 09:00:00을 나타내는 Time
reminder.yearMonth; // YearMonth
reminder.monthDay; // MonthDay
reminder.in('Asia/Tokyo').as('time'); // 도쿄 기준 Time
```

:::tip[DateTime과 CalendarDate 중 무엇을 쓸까요?]
시간대가 바뀔 때 사용자에게 보이는 값도 달라져야 하는지 생각해 보세요. 로스앤젤레스의 오전 9시 30분 회의는 베를린에서 오후 6시 30분이므로 `DateTime`에서 다룹니다. 반면 5월 10일 생일은 전 세계 어디서나 5월 10일이므로 `CalendarDate`에 두는 것이 적절합니다.
:::
