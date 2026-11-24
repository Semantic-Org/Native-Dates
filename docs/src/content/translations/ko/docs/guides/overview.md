---
source: c85157f664b2
title: 개요
lede: 브라우저 내장 Temporal과 Intl API를 바탕으로 만든 읽기 쉬운 불변 날짜·시각 라이브러리입니다.
---

최신 JavaScript 엔진은 달력과 시간대 계산을 담당하는 `Temporal`과 현지화 포맷을 맡는 `Intl`을 기본 내장하고 있습니다. Native Dates는 이러한 내장 API를 읽기 쉬운 자연어 형태로 감싸며 런타임 의존성이 전혀 없습니다.

```js
import { date, now, today } from 'native-dates';

const due = today().plus(2, 'weeks');
const standup = date('2026-11-16')
  .at('9:30am', 'America/Los_Angeles')
  .in('Europe/Berlin');
```

런타임 자체에 IANA 시간대 데이터베이스와 로케일 규칙이 들어 있으므로 별도의 시간대나 로케일 테이블을 번들에 포함하지 않고도 모든 지역과 언어를 지원합니다.

## 역할에 따라 나뉜 타입

JavaScript의 내장 `Date`는 공휴일이든 영업 시작 시각이든 데이터베이스 타임스탬프든 하나의 객체로 처리합니다. Native Dates는 개념마다 전용 타입을 제공해 각 값에 꼭 필요한 필드만 담도록 설계했습니다.

- [`CalendarDate`](/api/calendar-date/): 시간대의 영향을 받지 않는 2026년 5월 10일 같은 달력 날짜
- [`Time`](/api/time/): 자정을 넘기면 자연스럽게 순환하는 오전 9시 30분 같은 시각
- [`DateTime`](/api/date-time/): 특정 시간대와 결합된 정확한 날짜와 시각(시점)
- [`Duration`](/api/duration/): 90분이나 2주 같은 기간
- [`YearMonth`](/api/year-month/)와 [`MonthDay`](/api/month-day/): 청구 월, 카드 만료일, 매년 돌아오는 생일
- [범위](/api/ranges/): 두 날짜, 두 시각, 또는 두 시점 사이의 구간

두 값 사이의 간격 계산, 범위 생성, 현지화된 프리셋이나 토큰 패턴을 이용한 포맷 모두 별도 설정 없이 바로 동작합니다.

```js
import { dateRange, datetime, monthDay, now, timeRange, yearMonth } from 'native-dates';

const deadline = datetime('2027-01-01T00:00:00Z');
now().until(deadline).format('long');

const sprint = dateRange('2026-11-02', '2026-11-15');
const shift = timeRange('9:00am', '5:00pm');
sprint.contains('2026-11-10'); // true
shift.duration.hours; // 8

const billing = yearMonth('2026-11');
const birthday = monthDay('10/17');
```

이어서 [날짜와 시각 타입](/guides/types-of-time/)에서 상황에 맞는 타입을 고르고 서로 변환하는 방법을 확인해 보세요.

## 불변 값

모든 인스턴스는 불변입니다. [`plus()`](/api/date-time/#plus)나 [`in()`](/api/date-time/#in) 같은 메서드를 호출하면 항상 새 값을 반환하며 원본 값을 변경하지 않습니다.

따라서 헬퍼 함수나 UI 컴포넌트에 날짜를 전달해도 호출 측 상태가 의도치 않게 바뀌지 않습니다.

```js
const original = date('2026-11-16').at('9:30am', 'America/Los_Angeles');
const moved = original.plus(1, 'hour');

original.text; // 'Nov 16, 2026, 9:30 AM PST'
moved.text; // 'Nov 16, 2026, 10:30 AM PST'
```

모든 값에는 현재 활성 로케일로 읽기 쉽게 포맷된 `.text` 게터가 있으며, 커스텀 `util.inspect` 출력을 지원해 Node에서 `console.log()`로 출력할 때 간결한 한 줄 미리 보기를 표시합니다.

```js
import { time } from 'native-dates';

date('2026-05-10').text; // 'May 10, 2026'
time('9:30am').text; // '9:30 AM'
```

:::tip[값 비교하기]
메서드가 항상 새 인스턴스를 반환하므로 `===` 연산자는 값의 동등성이 아니라 객체 참조를 비교합니다. 두 인스턴스가 같은 날짜, 시각, 또는 시점을 가리키는지 확인하려면 [`equals()`](/api/date-time/#equals)를 호출하세요.
:::

## 코어와 플러그인

코어 [`native-dates`](/guides/installation/) 패키지는 값 생성, 시간대, 달력 계산, 부분 날짜, 범위, 기간, 상대 표현, 현지화 프리셋, 토큰 패턴을 모두 제공합니다.

영어 도시명 및 약어 조회, 느슨한 파싱, 기존 `Date` 호환 메서드를 지원하는 선택적 플러그인은 [`@native-dates/plugins`](/plugins/)의 개별 서브패스 모듈로 제공됩니다. 플러그인을 추가하거나 앱 전역 기본값을 설정하려면 [커스터마이징](/guides/customization/#adding-plugins)을 참고하세요.

이제 [설치](/guides/installation/)로 이동해 프로젝트에 패키지를 추가하고 Safari 지원이 필요하다면 폴리필을 설정해 보세요.
