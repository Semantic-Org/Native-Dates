---
source: 450f88efed26
title: Day.js에서 전환하기
lede: dayjs() 래퍼와 플러그인 체인을 전용 날짜 타입과 내장 시간대 기능으로 대체합니다.
---

Day.js는 JavaScript `Date`를 단일 `dayjs()` 객체로 감싸고 시간대, UTC, 범위, 기간 기능을 플러그인으로 덧붙입니다. Native Dates로 전환하면 가볍고 불변인 사용감은 그대로 유지하면서도 달력 날짜, 시각, 시점, 부분 날짜, 범위, 기간을 각각의 전용 타입으로 코어에서 바로 다룰 수 있습니다.

## date()와 datetime() 구분해 쓰기

Day.js에서는 생일과 API 타임스탬프를 모두 `dayjs()`로 다룹니다.

Native Dates에서는 달력 날짜에 [`date()`](/api/date-fn/) 또는 [`today()`](/api/date-fn/#today)를 사용하며, [결제 월](/api/year-month-fn/)과 [반복 생일](/api/month-day-fn/)도 코어에 전용 부분 날짜 팩토리 함수가 마련되어 있습니다.

특정 시점(날짜와 시각)을 다룰 때는 [`datetime()`](/api/datetime-fn/) 또는 [`now()`](/api/datetime-fn/#now)를 사용합니다.

```js
import { date, datetime, monthDay, now, today, yearMonth } from 'native-dates';

const current = now(); // 타임스탬프용 dayjs() 대체
const due = today().plus(2, 'weeks'); // 달력 날짜용 dayjs().add(2, 'week') 대체
const created = datetime('2026-11-16T17:30:00Z');
const birthday = date('2026-05-10');
const billing = yearMonth('2026-11');
const recurring = monthDay('05-10');
```

기존 코드베이스에서 쓰던 덧셈·뺄셈 메서드명(`add()`, `subtract()`)도 별칭으로 그대로 동작합니다. 팩토리 함수에 빈 값을 전달하면 현재 날짜와 시각을 조용히 반환하는 대신 예외를 던지므로 누락된 API 필드를 초기에 잡아낼 수 있습니다.

## 1부터 시작하는 월 번호

Day.js는 1월을 0으로 두는 0 기반 월 번호를 물려받았고, 일자는 `.date()` 메서드로 읽습니다. Native Dates에서는 달력 필드가 일반 프로퍼티이며 월 번호는 1부터 12까지입니다.

```js
import { date } from 'native-dates';

const d = date('2026-11-16');

d.year; // 2026
d.month; // 11 (11월)
d.day; // 16
d.dayOfWeek; // 1 (월요일)
```

:::warning[월과 요일 번호 체계 확인]
Day.js는 월을 0~11로 매기고 요일은 일요일을 0으로 시작합니다. Native Dates에서는 `month`가 1~12이고, `dayOfWeek`는 월요일 1부터 일요일 7까지입니다. 토큰 패턴에서는 `'E'`가 ISO 기준 1~7을 출력하고 `'d'`는 Day.js와 같은 0~6을 유지합니다.
:::

## 기본 내장 시간대, 기간, 범위

Day.js에서는 도시 간 날짜와 시각을 변환하거나 기간을 만들고 특정 날짜가 구간 안에 포함되는지 확인하려면 별도 플러그인을 불러와야 합니다. Native Dates 코어는 추가 설정 없이 IANA 시간대, [기간](/api/duration/), [범위](/api/ranges/)를 기본 제공합니다.

```js
import { dateRange, datetime, duration, hours } from 'native-dates';

const standup = datetime('2026-11-16T09:30', 'America/Los_Angeles');
const berlin = standup.in('Europe/Berlin'); // .tz('Europe/Berlin') 대체

const span = duration('1h 30m').plus(hours(0.5));
span.total('minutes'); // 120

const november = dateRange('2026-11-01', '2026-11-30');
november.contains('2026-11-16'); // true
dateRange('2026-11-01', '2026-11-15').overlaps(november); // true
```

`isBetween()`에 경계 포함 여부를 뜻하는 괄호 문자열을 넘길 필요가 없습니다. 날짜 범위는 양 끝 날짜를 모두 포함하며, 시점 범위와 시각 범위는 끝 경계를 자동으로 제외하는 반개방 구간으로 동작합니다.

## 프리셋과 토큰 패턴

코어의 [`format()`](/api/date-time/#format)은 별도 로케일 파일이나 플러그인 없이 `Intl` 프리셋, Day.js 현지화 포맷 이름, 사용자 지정 [토큰 패턴](/guides/formatting/#token-patterns)을 모두 지원합니다.

```js
import { datetime } from 'native-dates';

const dt = datetime('2026-11-16T17:30:00Z', 'America/New_York');

dt.format('medium', 'en-US'); // 'Nov 16, 2026, 12:30 PM'
dt.format('LLL', 'en-US'); // 'November 16, 2026 at 12:30 PM'
dt.format('YYYY-MM-DD HH:mm'); // '2026-11-16 12:30'
```

## 선택형 플러그인

비ISO 텍스트 파싱, 영어 도시명(및 `'서울'`, `'東京'`, `'北京'`, `'москва'` 등 내장 현지어 별칭)과 시간대 약어 조회, 레거시 `Date` 게터만 [`@native-dates/plugins`](/plugins/)에 분리되어 있습니다. 앱 시작 시 필요한 서브패스만 한 번 import하세요.

```js
import '@native-dates/plugins/loose';
import '@native-dates/plugins/zones';
import { date, datetime } from 'native-dates';

datetime('2026-11-16T09:30', 'Berlin').zone; // 'Europe/Berlin'
date('Nov 16, 2026', { loose: true }); // CalendarDate(2026-11-16)
```

## 기능 대조표

| Day.js | Native Dates | 비고 |
|---|---|---|
| `dayjs()` | `now()` 또는 `today()` | 현재 날짜와 시각(시점)과 달력 날짜를 구분해 선택 |
| `d.month()`, `d.date()` | `d.month`, `d.day` | 1부터 12까지 월 번호를 쓰는 일반 프로퍼티 |
| `d.day()`, `d.isoWeekday()` | `d.dayOfWeek` | 월요일 1~일요일 7의 ISO 기준(토큰 `'E'`는 1~7, `'d'`는 0~6) |
| `d.unix()`, `d.valueOf()` | `dt.epochSeconds`, `dt.epochMilliseconds` | 1970년 유닉스 에포크 이후 경과 단위를 이름으로 명시 |
| `d.add(2, 'day')` | `d.plus(2, 'days')` | `add()`와 `subtract()` 별칭도 지원 |
| `dayjs.tz(x, zone)` | `datetime(x, zone)` | 코어 기본 내장(`timezone` 플러그인 불필요) |
| `d.tz(zone)` | `dt.in(zone)` | 같은 시점을 다른 IANA 시간대로 변환 |
| `dayjs.utc(x)` | `datetime(x, 'UTC')` | 코어 기본 내장(`utc` 플러그인 불필요) |
| `b.diff(a, 'day', true)` | `a.until(b, 'days')` | 요청한 단위의 소수 포함 전체 차이 반환 |
| `dayjs.duration(90, 'm')` | `minutes(90)` 또는 `duration('90m')` | 코어 기본 내장(`duration` 플러그인 불필요, 영어 기간 표현 지원) |
| `d.format('LLL')` | `dt.format('LLL')` | `'LT'`부터 `'llll'`까지 현지화 프리셋 지원 |
| `d.format('YYYY-MM-DD HH:mm')` | `dt.format('YYYY-MM-DD HH:mm')` | 코어에서 [토큰 패턴](/guides/formatting/#token-patterns) 지원 |
| `d.isBetween(a, b)` | `dateRange(a, b).contains(d)` | `to()`, `for()`, `overlaps()`를 갖춘 [범위](/api/ranges/) 타입 |
| `d.fromNow()`, `d.from(other)` | `d.fromNow()`, `d.from(other)` | 코어 기본 내장(`relativeTime` 플러그인 불필요) |
| `customParseFormat` | `{ loose: true }` | [`@native-dates/plugins/loose`](/plugins/loose/) 플러그인으로 제공 |
