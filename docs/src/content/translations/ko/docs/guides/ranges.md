---
source: 8e9d9ff9bd0c
title: 범위
lede: 두 날짜, 두 시각, 두 시점 사이의 구간을 다루며 겹침 검사부터 구간 포맷까지 처리합니다.
---

[범위](/api/ranges/)는 호텔 숙박 일정, 영업시간, 예약된 회의처럼 시작과 끝이 있는 구간을 표현합니다. 타입마다 전용 범위 클래스가 분리되어 있으므로 달력 날짜 범위는 날짜 그대로 유지되고, 시각 범위에 가짜 날짜가 끼어들지 않습니다.

## 범위 생성

[`dateRange()`](/api/range-fn/), [`timeRange()`](/api/range-fn/#timerange), [`datetimeRange()`](/api/range-fn/#datetimerange)로 범위를 바로 만들 수 있습니다. 각 팩토리 함수는 시작과 끝 두 값, 시작 값과 기간(또는 영어 기간 표현), 또는 하나의 구간 문자열을 모두 받습니다.

```js
import { dateRange, datetimeRange, timeRange } from 'native-dates';

const sprint = dateRange('2026-05-01', '2 weeks');
const trip = dateRange('2026-09-01', '2026-09-07');
const hours = timeRange('9am - 5pm');
const meeting = datetimeRange('2026-09-01T09:00', '90m', 'America/New_York');
```

이미 `CalendarDate`, `Time`, `DateTime` 인스턴스가 있다면 [`for()`](/api/ranges/#to), [`to()`](/api/ranges/#to), [`range()`](/api/ranges/#range)를 바로 체이닝해 범위를 만들 수 있습니다.

```js
import { today } from 'native-dates';

const upcoming = today().for(2, 'weeks');
const thisMonth = today().range('month');
```

## 양 끝 포함 날짜 범위와 반개방 시각·시점 범위

9월 1일부터 9월 7일까지는 총 7일을 뜻하므로 날짜 범위(`DateRange`)는 마지막 날을 포함하는 양 끝 포함 구간입니다. 반면 시점 범위(`DateTimeRange`)와 시각 범위(`TimeRange`)는 연속된 일정이 서로 충돌하지 않도록 끝 경계를 제외하는 반개방 구간(`[start, end)`)으로 동작합니다.

```js
import { dateRange, timeRange } from 'native-dates';

dateRange('2026-09-01', '2026-09-07').duration.days; // 7

const first = timeRange('9:00am', '10:00am');
const second = timeRange('10:00am', '11:00am');
first.overlaps(second); // false
```

시각 범위의 끝 시각이 시작 시각보다 이르면 자정을 가로질러 이어지므로 야간 근무나 심야 영업시간도 그대로 표현할 수 있습니다.

```js
const nightShift = timeRange('22:00', '06:00');

nightShift.contains('02:30'); // true
nightShift.duration.hours; // 8
```

## 포함 여부와 겹침 검사

특정 값이나 하위 범위가 구간 안에 들어가는지는 [`contains()`](/api/ranges/#contains)로 확인하고, 두 범위가 겹치는지 여부와 교집합 구간은 [`overlaps()`](/api/ranges/#overlaps)와 [`intersection()`](/api/ranges/#intersection)으로 구합니다.

```js
import { dateRange } from 'native-dates';

const booking = dateRange('2026-11-10', '2026-11-18');
const holiday = dateRange('2026-11-15', '2026-11-22');

booking.contains('2026-11-14'); // true
booking.overlaps(holiday); // true
booking.intersection(holiday).toString(); // '2026-11-15/2026-11-18'
```

두 범위가 겹치지 않으면 `intersection()`은 `null`을 반환합니다.

## 구간 순회, 일수 계산, 분할

[`every()`](/api/ranges/#every)를 호출하면 지정한 간격으로 범위를 순회하며 각 날짜, 시각, 시점을 배열로 모을 수 있습니다. 날짜 범위에서는 [`count()`](/api/ranges/#count)로 전체 일수, 평일, 주말, 또는 영어 요일명(복수형)으로 지정한 특정 요일의 일수를 바로 셉니다.

```js
import { dateRange } from 'native-dates';

const sprint = dateRange('2026-05-01', '2 weeks');

sprint.every('week').map(String); // ['2026-05-01', '2026-05-08']
sprint.count(); // 14
sprint.count('weekdays'); // 10
sprint.count('mondays'); // 2
```

개별 지점이 아니라 근무 시간을 예약 슬롯으로 나누거나 스프린트를 주 단위 구간으로 쪼개는 것처럼 하위 범위 목록이 필요하면 [`split()`](/api/ranges/#split)을 호출하세요.

```js
import { timeRange } from 'native-dates';

const morning = timeRange('9:00am', '12:00pm');
const slots = morning.split(30, 'minutes');

slots.length; // 6
slots[0].toString(); // '09:00:00/09:30:00'
```

## 포맷과 직렬화

프리셋으로 범위를 포맷하면 런타임의 로케일 규칙에 따라 공통된 월과 연도가 자동으로 축약됩니다. 양 끝점을 명시된 형식으로 출력하려면 토큰 패턴을 전달하세요.

```js
import { dateRange, timeRange } from 'native-dates';

const week = dateRange('2026-09-01', '2026-09-07');

week.format('medium', 'en-US'); // 'Sep 1 – 7, 2026'
week.format('YYYY-MM-DD'); // '2026-09-01 – 2026-09-07'
timeRange('9:00am', '5:00pm').format('short', 'en-US'); // '9:00 AM – 5:00 PM'
```

모든 범위는 `.duration`으로 전체 기간을 제공하며 [`toString()`](/api/ranges/#tostring)으로 ISO 8601 구간 문자열을 출력합니다. 이 문자열을 같은 팩토리 함수에 다시 전달하면 원래 범위가 그대로 복원됩니다.

```js
const raw = week.toString(); // '2026-09-01/2026-09-07'
dateRange(raw).equals(week); // true
```
