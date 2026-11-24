---
source: ec38498f1427
title: 날짜 계산
lede: 원본 값을 변경하지 않고 기간을 더하거나 빼고, 달력 경계에 맞추며, 요일이나 범위 단위로 이동합니다.
---

Native Dates의 모든 날짜, 시각, 시점은 불변입니다. 값을 이동하거나 단위에 맞추는 메서드는 항상 새 인스턴스를 반환하며 원본 값을 변경하지 않습니다.

## 덧셈과 뺄셈

[`plus()`](/api/date-time/#plus)나 [`minus()`](/api/date-time/#minus)를 호출해 앞뒤로 이동할 수 있습니다.

```js
import { date } from 'native-dates';

const created = date('2026-11-16');
const due = created.plus(2, 'weeks');

created.toString(); // '2026-11-16'
due.toString(); // '2026-11-30'
```

두 메서드 모두 수량과 단위, 영어 기간 표현, 필드 객체, 또는 [`Duration`](/api/duration/) 인스턴스를 받습니다. 별칭인 [`add()`](/api/date-time/#plus)와 [`subtract()`](/api/date-time/#minus)도 동일하게 동작합니다.

```js
import { datetime, hours } from 'native-dates';

const kickoff = datetime('2026-11-16T09:00', 'America/New_York');

kickoff.plus(2, 'weeks');
kickoff.plus('1h 30m');
kickoff.plus({ days: 2, hours: 4 });
kickoff.minus(hours(3));
```

:::tip[단위는 타입과 일치해야 합니다]
달력 날짜(`CalendarDate`)는 시각 정보가 없으므로 시간(`hours`) 같은 시각 단위를 거부합니다. 반대로 시각(`Time`)은 자정을 기준으로 순환하므로 일(`days`) 같은 달력 단위를 거부합니다. 두 영역을 모두 넘나드는 계산이 필요하면 먼저 [`at()`](/api/calendar-date/#at)으로 결합하세요.
:::

## 월말과 서머타임

월이나 연을 더할 때 대상 월에 해당 일자가 없으면 다음 달로 넘어가는 대신 말일로 보정됩니다. 예를 들어 1월 31일에 1개월을 더하면 평년에는 2월 28일, 윤년에는 2월 29일이 됩니다.

```js
import { date } from 'native-dates';

date('2026-01-31').plus(1, 'month').toString(); // '2026-02-28'
date('2028-01-31').plus(1, 'month').toString(); // '2028-02-29'
```

[`DateTime`](/api/date-time/)에서 서머타임 전환을 가로지를 때, 달력 단위는 현지 시각을 유지하는 반면 시각 단위는 실제로 경과한 시간과 분을 정확히 셉니다.

```js
import { datetime } from 'native-dates';

const saturday = datetime('2026-03-07T09:00', 'America/New_York');

saturday.plus(1, 'day').text; // 'Mar 8, 2026, 9:00 AM EDT'
saturday.plus(24, 'hours').text; // 'Mar 8, 2026, 10:00 AM EDT'
```

서머타임 시작과 종료 시점의 동작은 [시간대](/guides/time-zones/)에서 자세히 살펴볼 수 있습니다.

## 단위 경계에 맞추기

[`startOf()`](/api/date-time/#startof)와 [`endOf()`](/api/date-time/#endof)를 호출하면 연, 분기, 월, 주, 일, 또는 시각 단위의 시작이나 끝으로 맞출 수 있습니다.

달력 날짜에서 월의 끝은 해당 월의 마지막 날이며, `DateTime` 시점에서 단위의 끝은 마지막 밀리초입니다.

```js
import { date, datetime } from 'native-dates';

const midMonth = date('2026-11-18');
midMonth.startOf('month').toString(); // '2026-11-01'
midMonth.endOf('month').toString(); // '2026-11-30'

const stamp = datetime('2026-11-18T14:20', 'UTC');
stamp.endOf('day').toString(); // '2026-11-18T23:59:59.999Z'
```

주의 시작 요일은 활성 로케일의 기준을 따릅니다(예: `'en-US'`는 일요일, `'de-DE'`는 월요일). 한 번만 덮어쓰려면 두 번째 인수로 영어 요일명을 전달하고, 앱 전체에 고정하려면 [`configure()`](/api/configure/)를 사용하세요.

```js
const wednesday = date('2026-11-18');

wednesday.locale('en-US').startOf('week').toString(); // '2026-11-15'
wednesday.locale('de-DE').startOf('week').toString(); // '2026-11-16'
wednesday.startOf('week', 'monday').toString(); // '2026-11-16'
```

[`startOfNext()`](/api/date-time/#startofnext)나 [`startOfPrevious()`](/api/date-time/#startofprevious)를 호출하면 다음 단위 또는 이전 단위의 시작점으로 이동합니다. 두 메서드 모두 항상 인접한 단위로 넘어가므로 12월 1일에 `startOfNext('month')`를 호출하면 1월 1일을 반환합니다.

```js
const invoiced = date('2026-11-16');

invoiced.startOfNext('month').toString(); // '2026-12-01'
invoiced.startOfNext('quarter').toString(); // '2027-01-01'
invoiced.startOfPrevious('month').toString(); // '2026-10-01'
```

## 시각 단위 맞춤

`DateTime` 시점이나 `Time` 시각에서 [`round()`](/api/date-time/#round)를 호출하면 가장 가까운 단위나 간격으로 반올림할 수 있으며, `floor()`로 내림하거나 `ceil()`로 올림할 수도 있습니다.

```js
import { time } from 'native-dates';

const logged = time('9:23am');

logged.round('hour').format('short', 'en-US'); // '9:00 AM'
logged.round(15, 'minutes').format('short', 'en-US'); // '9:30 AM'
logged.floor(15, 'minutes').format('short', 'en-US'); // '9:15 AM'
logged.ceil(15, 'minutes').format('short', 'en-US'); // '9:30 AM'
```

5분, 10분, 15분, 30분 같은 간격 값은 상위 단위로 나누어떨어지는 값이어야 합니다.

## 요일이나 반복 날짜로 이동

날짜나 시점에서 [`next()`](/api/calendar-date/#next) 또는 [`previous()`](/api/calendar-date/#previous)에 영어 요일명을 전달하면 다가오는 요일이나 직전 요일로 이동합니다. 이미 해당 요일인 경우에는 정확히 7일을 이동합니다.

```js
import { date } from 'native-dates';

const monday = date('2026-11-16');

monday.next('friday').toString(); // '2026-11-20'
monday.next('monday').toString(); // '2026-11-23'
monday.previous('friday').toString(); // '2026-11-13'
```

[`MonthDay`](/api/month-day/)를 전달하면 생일이나 연간 기념일의 다음 또는 직전 날짜로 바로 이동할 수 있습니다.

```js
import { monthDay } from 'native-dates';

const birthday = monthDay('10/17');
monday.next(birthday).toString(); // '2027-10-17'
```

`DateTime` 시점에서 `next()`는 기존 시각을 유지합니다. 대신 해당 요일의 시작 시각(자정)이 필요하면 `startOfNext()`에 영어 요일명을 전달하세요.

```js
import { datetime } from 'native-dates';

const standup = datetime('2026-11-16T09:30', 'America/New_York');

standup.next('wednesday').text; // 'Nov 18, 2026, 9:30 AM EST'
standup.startOfNext('wednesday').text; // 'Nov 18, 2026, 12:00 AM EST'
```

## 범위 생성과 순회

[`dateRange()`](/api/range-fn/#daterange)로 [범위](/guides/ranges/)를 만들거나 기존 값에서 [`for()`](/api/ranges/#to)와 [`to()`](/api/ranges/#to)를 체이닝하세요. 만든 범위는 일정 간격으로 순회하거나 더 작은 하위 범위로 나눌 수 있습니다.

```js
import { dateRange } from 'native-dates';

const sprint = dateRange('2026-11-02', '2 weeks');

sprint.end.toString(); // '2026-11-15'
sprint.every('week').map(String); // ['2026-11-02', '2026-11-09']
sprint.split(1, 'week').length; // 2
```
