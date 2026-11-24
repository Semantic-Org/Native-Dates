---
source: 5365132bf9e2
title: Moment에서 전환하기
lede: Moment와 moment-timezone에서 벗어나 번들 tzdata 없이 내장 토큰을 지원하는 불변 날짜 값으로 이전합니다.
---

Moment와 `moment-timezone`은 오랜 기간 JavaScript 날짜 처리를 책임졌지만, 원본을 변경하는 가변 객체, 0부터 시작하는 월 번호, 무거운 시간대 번들이라는 부담이 따랐습니다.

Native Dates로 이전하면 방어적 복사 코드와 번들 비대화를 없애면서도 큰 저장소를 모듈 단위로 차근차근 전환할 수 있습니다.

## 모든 값의 불변성

Moment에서는 일수를 더하거나 월초로 이동하면 해당 인스턴스 자체가 변경됩니다. 공유된 날짜를 헬퍼 함수에 넘길 때 먼저 복사하지 않으면 호출자 쪽 상태가 예기치 않게 망가질 수 있습니다.

Native Dates의 모든 값은 불변입니다. [`plus()`](/api/date-time/#plus)나 [`in()`](/api/date-time/#in) 같은 메서드는 항상 새 인스턴스를 반환하고 원본 값을 변경하지 않습니다.

```js
import { date } from 'native-dates';

const start = date('2026-11-16');
const deadline = start.plus(7, 'days');

start.toString(); // '2026-11-16'
deadline.toString(); // '2026-11-23'
```

:::tip[방어적 clone 호출 제거]
마이그레이션 과정에서 `.clone()` 호출은 모두 지워도 됩니다. 불변 방식의 덧셈·뺄셈 별칭(`add()`, `subtract()`)도 포함되어 있어 기존 날짜 계산 호출부도 그대로 동작합니다.
:::

## 전용 타입과 1부터 시작하는 월 번호

Moment는 모든 개념을 단일 클래스에 담고 월을 0~11로 매겨 10이 11월을 뜻합니다. Native Dates에서는 `month`가 1부터 12까지 값을 갖는 일반 프로퍼티입니다.

달력 날짜에는 [`date()`](/api/date-fn/), 시간대가 있는 시점에는 [`datetime()`](/api/datetime-fn/)을 사용하고, [시각](/api/time-fn/), [결제 월](/api/year-month-fn/), [반복 생일](/api/month-day-fn/)에도 각각의 코어 팩토리 함수를 선택하세요.

```js
import { date, datetime, monthDay, yearMonth } from 'native-dates';

const invoiceDate = date(2026, 11, 16);
invoiceDate.month; // 11 (11월)

const sentAt = datetime('2026-11-16T17:30:00Z', 'America/New_York');
sentAt.hour; // 12

const billing = yearMonth('2026-11');
const birthday = monthDay('10/17');
```

## 번들 시간대 데이터 제거

`moment-timezone`은 IANA 시간대 데이터베이스 복사본을 브라우저 번들에 직접 실어 보냅니다.

Native Dates 코어는 런타임의 `Temporal`과 `Intl` 엔진에서 시간대 규칙을 바로 읽습니다. 모든 IANA 시간대가 별도 설정 없이 동작하며, [`@native-dates/plugins/zones`](/plugins/zones/)를 불러오면 `'Berlin'`이나 `'Pacific Time'` 같은 영어 도시명·약어와 `'서울'`, `'東京'`, `'北京'`, `'москва'` 같은 내장 현지어 별칭도 조회할 수 있습니다.

```js
import { datetime } from 'native-dates';

const kickoff = datetime('2026-11-16T09:30', 'America/Los_Angeles');

kickoff.in('Europe/London').format('short', 'en-GB'); // '16/11/2026, 17:30'
kickoff.in('Asia/Tokyo').format('short', 'en-US'); // '11/17/26, 2:30 AM'
```

## 코어에 내장된 토큰, 프리셋, 범위

Moment 호환 [토큰 패턴](/guides/formatting/#token-patterns), `'LT'`부터 `'llll'`까지의 현지화 프리셋, 상대 표현, [범위](/api/ranges/) 기능이 플러그인 없이 코어에서 바로 동작합니다.

```js
import { dateRange, datetime } from 'native-dates';

const kickoff = datetime('2026-11-16T09:30', 'America/Los_Angeles');
kickoff.format('YYYY-MM-DD HH:mm'); // '2026-11-16 09:30'
kickoff.format('LLL', 'en-US'); // 'November 16, 2026 at 9:30 AM'
kickoff.from('2026-11-16T07:30-08:00', 'en-US'); // 'in 2 hours'

const quarter = dateRange('2026-10-01', '2026-12-31');
quarter.contains('2026-11-16'); // true
quarter.overlaps(dateRange('2026-12-15', '2027-01-15')); // true
```

## 기능 대조표

| Moment | Native Dates | 비고 |
|---|---|---|
| `moment()` | `now()` 또는 `today()` | 정확한 시점(날짜와 시각)과 달력 날짜를 명확히 구분 |
| `moment.tz(str, zone)` | `datetime(str, zone)` | 번들 tzdata 없이 코어에 기본 내장 |
| `m.clone().add(7, 'days')` | `d.plus(7, 'days')` | 항상 불변이며 `add()` 별칭도 지원 |
| `m.tz('Europe/Berlin')` | `dt.in('Europe/Berlin')` | 같은 시점을 다른 시간대로 변환 |
| `m.month()`, `m.date()` | `d.month`, `d.day` | 1부터 12까지 월 번호를 쓰는 일반 프로퍼티 |
| `m.day()`, `m.isoWeekday()` | `d.dayOfWeek` | 월요일 1~일요일 7의 ISO 기준(토큰 `'E'`는 1~7, `'d'`는 0~6) |
| `m.unix()`, `m.valueOf()` | `dt.epochSeconds`, `dt.epochMilliseconds` | 1970년 유닉스 에포크 이후 경과 단위를 이름으로 명시 |
| `b.diff(a, 'hours', true)` | `a.until(b, 'hours')` | 요청한 단위의 소수 포함 전체 차이 반환 |
| `moment.duration(2, 'h')` | `hours(2)` 또는 `duration('2h')` | 코어 내장 기간 헬퍼(영어 기간 표현 지원) |
| `m.format('LLL')` | `dt.format('LLL')` | 로케일 파일 없이 `'LT'`~`'llll'` 현지화 프리셋 지원 |
| `m.format('YYYY-MM-DD HH:mm')` | `dt.format('YYYY-MM-DD HH:mm')` | [토큰 패턴](/guides/formatting/#token-patterns) |
| `m.isBetween(a, b)` | `dateRange(a, b).contains(d)` | `to()`, `for()`, `overlaps()`를 갖춘 [범위](/api/ranges/) 타입 |
| `m.fromNow()`, `m.from(other)` | `dt.fromNow()`, `dt.from(other)` | [상대 표현](/guides/formatting/#relative-phrases) |
| 비ISO 문자열 파싱 | `{ loose: true }` | 로케일 기반·비정형 문자열 파싱은 [`@native-dates/plugins/loose`](/plugins/loose/) 로드 |

## 점진적 마이그레이션

규모가 큰 코드베이스를 PR 하나로 한 번에 전환하기는 어렵습니다. 아직 네이티브 JavaScript `Date`를 기대하는 경계에서는 [`toJSDate()`](/api/date-time/#tojsdate)를 호출하고, 반대로 들어오는 `Date` 값은 [`datetime()`](/api/datetime-fn/)에 전달해 변환하세요.

```js
import { datetime } from 'native-dates';

const sentAt = datetime('2026-11-16T17:30:00Z', 'America/New_York');
const legacy = sentAt.toJSDate();
const restored = datetime(legacy, 'America/New_York');
```

하위 헬퍼 코드가 값에서 `getFullYear()` 같은 레거시 게터를 직접 호출한다면 [`legacy-date`](/plugins/legacy-date/) 플러그인을 import하세요.

게터 메서드는 해당 값의 시간대 기준으로 필드를 읽으며, 드롭인 호환성을 위해 0부터 시작하는 월 번호를 유지합니다. 인스턴스를 변경하는 세터는 즉시 예외를 던지므로 코드에 숨어 있는 직접 수정 로직을 테스트 단계에서 바로 발견할 수 있습니다.

```js
import '@native-dates/plugins/legacy-date';
import { datetime } from 'native-dates';

const dt = datetime('2026-11-16T09:30', 'America/Los_Angeles');

dt.getFullYear(); // 2026
dt.getMonth(); // 10 (Date.prototype.getMonth()와 동일)
dt.getHours(); // 9 (America/Los_Angeles 기준)
```
