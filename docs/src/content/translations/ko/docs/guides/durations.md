---
source: d8be401b7194
title: 기간
lede: 단위 헬퍼나 영어 기간 표현으로 기간을 만들고, 두 값 사이의 간격을 측정하거나 포맷합니다.
---

[`Duration`](/api/duration/)은 90분이나 2주 같은 기간을 나타냅니다. 날짜 계산에 쓰려고 직접 만들 수도 있고, 두 값 사이의 간격을 측정한 결과로 얻을 수도 있습니다.

## Duration 생성

[`hours()`](/api/duration-fn/#hours) 같은 단위 헬퍼를 사용하거나, [`duration()`](/api/duration-fn/)에 영어 단위 문자열, ISO 8601 문자열, 또는 필드 객체를 전달해 기간을 생성하세요.

```js
import { days, duration, hours } from 'native-dates';

const call = hours(1.5);
const trial = days(14);
const turnaround = duration('2 weeks, 3 days');
const iso = duration('PT1H30M');
const window = duration({ hours: 2, minutes: 45 });
```

인스턴스에서 각 단위 값을 바로 읽을 수 있습니다. 소수점 입력은 자동으로 바로 아래 작은 단위로 넘어가며, 정수 입력은 작성한 단위 그대로 유지됩니다.

```js
call.hours; // 1
call.minutes; // 30

const ninety = duration(90, 'minutes');
ninety.hours; // 0
ninety.minutes; // 90
```

## 두 값 사이의 간격 측정

두 날짜, 두 시각, 두 [`YearMonth`](/api/year-month/), 또는 두 시점에서 [`until()`](/api/date-time/#until)이나 [`since()`](/api/date-time/#since)를 호출해 두 값 사이의 기간을 측정할 수 있습니다.

```js
import { datetime } from 'native-dates';

const opened = datetime('2026-11-16T08:00', 'America/Los_Angeles');
const resolved = datetime('2026-11-16T10:30', 'America/Los_Angeles');

const elapsed = opened.until(resolved);
elapsed.hours; // 2
elapsed.minutes; // 30
```

계산이나 진행률 표시줄처럼 숫자 하나만 필요하면 두 번째 인수로 원하는 단위를 전달하세요.

```js
opened.until(resolved, 'hours'); // 2.5
resolved.since(opened, 'minutes'); // 150
```

모든 [범위](/api/ranges/) 역시 `.duration` 프로퍼티로 기간을 바로 제공합니다.

```js
import { dateRange, timeRange } from 'native-dates';

dateRange('2026-11-01', '2026-11-07').duration.days; // 7
timeRange('9:00am', '5:30pm').duration.hours; // 8
```

## 단위 정리와 합산

별도로 요청하지 않는 한 기간 값은 입력한 단위 그대로 유지됩니다. 넘치는 값을 상위 단위로 묶어 정리하려면 [`balance()`](/api/duration/#balance)를 호출하세요.

```js
import { hours, minutes, months } from 'native-dates';

minutes(90).balance().toFields(); // { hours: 1, minutes: 30 }
months(18).balance().toFields(); // { years: 1, months: 6 }
hours(36).balance('day').toFields(); // { days: 1, hours: 12 }
```

인수를 생략하면 단독 `Duration`은 월을 연으로, 시각 단위는 시간까지만 묶어 정리합니다. 서머타임 전환으로 하루 길이가 달라질 수 있으므로 일(day) 단위는 건드리지 않습니다.

고정 24시간 기준의 일이나 7일 기준의 주가 필요하면 `'day'`나 `'week'`를 명시적으로 전달하세요.

기간 전체를 하나의 단위 기준 부동소수점 숫자로 합산하려면 [`total()`](/api/duration/#total)이나 별칭 [`as()`](/api/duration/#as)를 호출합니다.

```js
import { duration } from 'native-dates';

const shift = duration('7h 30m');

shift.total('hours'); // 7.5
shift.as('minutes'); // 450
```

:::note[월과 연 단위의 합산]
연과 월은 1년 12개월 기준으로 서로 바로 합산하고 정리할 수 있습니다. 반면 일과 월 사이의 변환에는 기준 달력 날짜가 필요하며, `until()`과 `since()`로 얻은 기간은 이 기준 날짜를 자동으로 기억합니다.
:::

```js
import { date, months } from 'native-dates';

months(18).total('years'); // 1.5

const span = date('2026-01-15').until('2026-04-15');
span.total('months'); // 3
span.total('days'); // 90
```

## 기간 포맷

모든 인스턴스의 `.text`는 현지화된 긴 형식(`'long'`)을 반환합니다. 풀어쓴 형식, 축약 형식, 간결한 형식, 디지털 시계 형식이 필요하면 [`format()`](/api/duration/#format)에 프리셋 스타일을 전달하세요.

```js
import { duration } from 'native-dates';

const flight = duration({ hours: 2, minutes: 30 });

flight.text; // '2 hours, 30 minutes'
flight.format('long', 'en-US'); // '2 hours, 30 minutes'
flight.format('short', 'en-US'); // '2 hr, 30 min'
flight.format('narrow', 'en-US'); // '2h 30m'
flight.format('digital', 'en-US'); // '2:30:00'
```

단위 표기를 다른 언어로 바꾸려면 두 번째 인수로 로케일 태그를 전달하고, API 페이로드용 ISO 8601 문자열이 필요하면 [`toString()`](/api/duration/#tostring)을 호출하세요.
