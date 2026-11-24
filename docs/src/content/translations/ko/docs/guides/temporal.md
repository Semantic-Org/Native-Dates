---
source: f19636049929
title: Temporal과 함께 쓰기
lede: Native Dates가 JavaScript Temporal API와 어떻게 대응되며 원본 Temporal 값과 상호 운용되는지 안내합니다.
---

Native Dates는 JavaScript 내장 `Temporal`과 `Intl` API를 감싸 동작합니다.

`Temporal`은 명시적인 옵션 객체와 함께 정확한 달력 및 시간대 기본 타입을 제공합니다. Native Dates는 일상적인 호출 코드를 간결한 메서드로 감싸면서도 원본 `Temporal` 인스턴스와 자유롭게 상호 운용됩니다.

## Temporal 타입과의 대응

각 핵심 값 클래스는 기반 `Temporal` 타입 하나를 감싸며, 저수준 제어가 필요할 때 언제든 원본 객체를 꺼낼 수 있습니다.

| 타입 | 기반 타입 | Native Dates가 더하는 기능 |
|---|---|---|
| [`DateTime`](/api/date-time/) | `Temporal.ZonedDateTime` | ISO 시점, 오프셋, `Date`, 유닉스 에포크 숫자를 하나의 시간대 포함 타입으로 읽고 UTC로 직렬화 |
| [`CalendarDate`](/api/calendar-date/) | `Temporal.PlainDate` | `at(time, zone)`으로 시각·시간대와 결합하고 프리셋과 토큰 패턴으로 바로 포맷 |
| [`Time`](/api/time/) | `Temporal.PlainTime` | 24시간제 ISO 시각뿐만 아니라 `'9:30am'` 같은 12시간제 문자열도 파싱 |
| [`Duration`](/api/duration/) | `Temporal.Duration` | `'1h 30m'` 같은 영어 기간 표현을 파싱하고, 소수 단위를 하위 단위로 넘기며, `until()`의 기준점 유지 |
| [`YearMonth`](/api/year-month/) | `Temporal.PlainYearMonth` | 결제 월과 카드 만료일용 내장 클래스로 [`monthYear()`](/api/year-month-fn/#monthyear)와 `on()` 제공 |
| [`MonthDay`](/api/month-day/) | `Temporal.PlainMonthDay` | 생일과 반복 기념일용 내장 클래스로 [`dayMonth()`](/api/month-day-fn/#daymonth), `fallsOn()`, `next()` 제공 |

`Temporal` 명세에는 범위 타입이 빠져 있습니다. 코어에는 시작과 끝 쌍을 기반으로 포함 여부 확인, 겹침 판정, 순회를 지원하는 [`DateRange`, `DateTimeRange`, `TimeRange`](/api/ranges/)가 포함되어 있습니다.

## Temporal 객체 직접 전달

모든 팩토리 함수, 산술 메서드, 비교 메서드는 원본 `Temporal` 값을 그대로 입력받습니다.

```js
import { date, datetime, time, yearMonth } from 'native-dates';

const instant = Temporal.Instant.from('2026-11-16T17:30:00Z');
const standup = datetime(instant, 'America/Los_Angeles');

const plainDate = Temporal.PlainDate.from('2026-11-16');
date(plainDate).plus(Temporal.Duration.from({ weeks: 2 }));

const plainTime = Temporal.PlainTime.from('09:30');
time(plainTime).format('short', 'en-US'); // '9:30 AM'

const ym = yearMonth(Temporal.PlainYearMonth.from('2026-11'));
ym.daysInMonth; // 30
```

[`datetime()`](/api/datetime-fn/)에 `Temporal.ZonedDateTime`을 전달하면 새 시간대를 따로 지정하지 않는 한 기존 시간대가 유지됩니다. `Temporal.Instant`나 시간대 없는 날짜·시각을 전달하면 지정한 시간대 또는 설정된 기본 시간대 기준으로 변환됩니다.

일본 연호력이나 페르시아력 같은 비ISO 달력 체계를 쓰는 `Temporal` 값과 문자열도 `withCalendar()`를 먼저 호출할 필요 없이 동일한 ISO 날짜로 자동 변환됩니다.

비교와 간격 계산에도 `Temporal` 객체를 바로 전달할 수 있습니다.

```js
const berlin = Temporal.ZonedDateTime.from('2026-11-16T18:30:00+01:00[Europe/Berlin]');
standup.equals(berlin); // true
```

## toTemporal()로 원본 객체 꺼내기

기반 `Temporal` 인스턴스에 접근하려면 어떤 값에서든 [`toTemporal()`](/api/date-time/#totemporal)을 호출하세요.

`Temporal` 객체를 직접 요구하는 서드파티 라이브러리를 호출하거나 비ISO 달력 체계를 다룰 때 유용합니다.

```js
import { date } from 'native-dates';

const d = date('2026-11-16');
const plain = d.toTemporal(); // Temporal.PlainDate

const japanese = plain.withCalendar('japanese');
japanese.era; // 'reiwa'
japanese.eraYear; // 8
```

:::note[복사 없는 언래핑]
각 인스턴스는 내부에 실제 `Temporal` 객체를 보관하므로 `toTemporal()`은 다시 파싱하거나 복사본을 할당하지 않고 해당 객체를 그대로 반환합니다.
:::

## 구버전 런타임 폴리필 설정

최신 Chrome, Edge, Firefox, Node 26+, Deno, Bun은 `Temporal`을 기본 내장하므로 코어에는 폴리필 코드가 전혀 포함되어 있지 않습니다.

Safari, 구버전 브라우저, Node 24–25 환경에서는 앱 시작 시 `@native-dates/polyfill`과 `temporal-polyfill`을 함께 불러오세요. 자세한 설정과 동기 로딩 방식은 [Safari 및 구버전 Node 지원](/guides/installation/#supporting-safari-and-older-node)을 참고하세요.
