---
source: 2eb400c31ff1
title: 저장과 전송
lede: JSON API, 데이터베이스, HTML 입력 요소 전반에서 날짜, 시각, 범위를 깔끔하게 직렬화합니다.
---

모든 타입은 문자열로 변환하거나 `JSON.stringify()`에 전달할 때 표준 ISO 8601 문자열로 직렬화됩니다. 이렇게 만든 문자열은 반대편에서 대응하는 팩토리 함수로 바로 다시 읽어 들일 수 있습니다.

## JSON과 전송 형식

별도의 replacer 함수나 래퍼 객체 없이 값을 `JSON.stringify()`에 그대로 전달하세요.

```js
import { date, duration, time } from 'native-dates';

const standup = date('2026-11-16').at('9:30am', 'America/Los_Angeles');

JSON.stringify({
  startsAt: standup,
  dueOn: date('2026-11-16'),
  opensAt: time('9:30am'),
  length: duration('1h 30m'),
});
// '{"startsAt":"2026-11-16T17:30:00.000Z","dueOn":"2026-11-16","opensAt":"09:30:00","length":"PT1H30M"}'
```

| 타입 | 전송 출력 | 대표적인 페이로드 필드 |
|---|---|---|
| [`DateTime`](/api/date-time/) | `'2026-11-16T17:30:00.000Z'` | 감사 타임스탬프, 항공편 출발 시점, 회의 시점 |
| [`CalendarDate`](/api/calendar-date/) | `'2026-11-16'` | 마감일, 공휴일, 숙박 날짜 |
| [`Time`](/api/time/) | `'09:30:00'` | 매장 영업시간, 매일 알림 시각 |
| [`Duration`](/api/duration/) | `'PT1H30M'` | 타임아웃, SLA, 과금 기간, 타이머 |
| [`YearMonth`](/api/year-month/) | `'2026-11'` | 청구 월, 카드 만료일, 월 입력 값 |
| [`MonthDay`](/api/month-day/) | `'10-17'` | 출생 연도 없는 생일, 연간 기념일 |
| [범위](/api/ranges/) | `'2026-11-01/2026-11-07'` | 예약 구간, 스프린트, ISO 8601 슬래시 구간 |

외부 API, 캐시 키, 정수 컬럼이 숫자를 요구한다면 유닉스 에포크(1970년) 이후 경과한 값을 원하는 단위로 읽으세요. 시스템마다 초 단위와 밀리초 단위가 다르므로 각 프로퍼티 이름에 단위가 명확히 표시되어 있습니다.

```js
standup.toString(); // '2026-11-16T17:30:00.000Z'
standup.epochSeconds; // 1794850200
standup.epochMilliseconds; // 1794850200000
duration('1h 30m').toMilliseconds(); // 5400000
```

## 코드로 다시 복원하기

JSON 응답, 데이터베이스 행, URL 파라미터를 읽을 때는 각 전송 문자열을 대응하는 팩토리 함수에 그대로 전달하세요.

```js
import { date, dateRange, datetime, duration, time, yearMonth } from 'native-dates';

const startsAt = datetime('2026-11-16T17:30:00.000Z', 'America/Los_Angeles');
const dueOn = date('2026-11-16');
const opensAt = time('09:30:00');
const length = duration('PT1H30M');
const billing = yearMonth('2026-11');
const window = dateRange('2026-11-01/2026-11-07');
```

모든 `DateTime`은 UTC로 직렬화되므로 같은 사건을 기록한 두 클라이언트가 동일한 문자열을 생성합니다. 이 문자열을 다시 읽을 때 시간대를 전달하면 실제 시점은 그대로 유지한 채 원하는 지역 기준으로 조회할 수 있습니다.

## 미래 일정과 반복 일정

주문 영수증이나 서버 로그 같은 과거 사건은 UTC 타임스탬프 하나만으로 충분합니다. 반면 사람이 예약한 미래 일정은 타임스탬프와 함께 IANA `zone`을 나란히 저장해야 합니다.

```js
import { date, datetime } from 'native-dates';

const standup = date('2026-11-16').at('9:30am', 'America/Los_Angeles');
const row = {
  startsAt: standup.toString(),
  zone: standup.zone, // 'America/Los_Angeles'
};

const nextWeek = datetime(row.startsAt, row.zone).plus(1, 'week');
nextWeek.hour; // 9
```

시간대를 함께 보관하면 주나 월을 더할 때 서머타임 전환을 가로질러도 현지 오전 9시 30분 시각이 그대로 유지됩니다. 나중에 해당 지역의 시간대 법률이 바뀌더라도 최신 규칙을 자동으로 반영합니다.

:::tip[오프셋 대신 IANA 시간대 이름을 저장하세요]
`'-08:00'` 같은 오프셋은 로스앤젤레스의 겨울철 기준만 나타냅니다. 미래 날짜 계산이 현지 서머타임 전환을 따라야 한다면 반드시 `zone`을 저장하세요.
:::

## 데이터베이스 컬럼

애플리케이션 코드와 같은 타입 경계를 데이터베이스에서도 지키려면 값의 성격에 맞는 SQL 컬럼 타입을 선택하세요.

| 타입 | SQL 컬럼 | 적합한 이유 |
|---|---|---|
| `DateTime` | `timestamptz` 또는 `bigint` | 모호함 없이 정확한 UTC 시점을 저장합니다 |
| `CalendarDate` | `date` | 자정 시간대 밀림 없이 `YYYY-MM-DD`만 저장합니다 |
| `Time` | `time` | 가짜 날짜를 붙이지 않고 `HH:MM:SS`만 저장합니다 |
| `Duration` | `interval` 또는 `text` | 구조화된 간격이나 ISO 8601 `PT` 문자열을 저장합니다 |

실제 시점을 저장할 때 시간대 정보가 없는 일반 SQL `timestamp` 컬럼은 피하세요. 데이터베이스 드라이버가 해당 값을 서버의 로컬 시간대로 임의 재해석하는 경우가 많습니다.

## HTML 입력 요소와 URL

네이티브 HTML 날짜, 월, 시각 입력 요소는 코어 타입이 생성하는 ISO 문자열을 그대로 읽고 씁니다. URL 쿼리 파라미터에도 같은 간결한 형식을 사용할 수 있습니다.

```js
import { date, time, yearMonth } from 'native-dates';

// <input type="date" value="2026-11-16">
const due = date('2026-11-16');
due.toString(); // '2026-11-16'

// <input type="month" value="2026-11">
const billing = yearMonth('2026-11');
billing.toString(); // '2026-11'

// <input type="time" value="09:30">
const opens = time('09:30');
opens.toString().slice(0, 5); // '09:30'

const params = new URLSearchParams({ from: due.toString() });
params.toString(); // 'from=2026-11-16'
```

날짜 입력 값을 [`date()`](/api/date-fn/)로 읽으면 서반구 시간대에서 UTC 자정이 하루 전날로 밀려 버리는 고질적인 `new Date('2026-11-16')` 버그도 피할 수 있습니다.
