---
source: cd25f69b961f
title: 오류
lede: 유효하지 않은 입력이나 지원하지 않는 연산은 기계가 판독할 수 있는 오류 코드를 담은 표준 Error를 던집니다.
---

## 오류 구조

잘못된 호출은 후속 계산을 망치는 깨진 날짜 객체나 `NaN`을 반환하지 않고 즉시 실패합니다. 던져지는 모든 오류는 두 개의 추가 프로퍼티를 지닌 표준 JavaScript 오류입니다.

- **`error.code`**에는 `'invalidDate'`, `'unknownZone'`처럼 안정적인 camelCase 식별자가 담깁니다.
- **`error.at`**에는 `'2026-02-30'`처럼 문제를 일으킨 입력값이나 연산 대상이 문자열로 기록됩니다.

인자 타입이 잘못되었거나 값의 종류가 일치하지 않으면 `TypeError`를 던집니다. 존재하지 않는 날짜, 읽을 수 없는 문자열, 알 수 없는 단위나 시간대, 지원하지 않는 연산에는 `RangeError`를 던집니다.

```js title="catch.js"
import { date } from 'native-dates';

try {
  date('2026-02-30');
} catch (error) {
  error instanceof RangeError; // true
  error.code; // 'invalidDate'
  error.at; // '2026-02-30'
}
```

개발 모드에서는 `error.message` 둘째 줄에 호출을 고치는 방법을 설명하는 영어 안내 문구가 함께 출력됩니다. `NODE_ENV`가 `'production'`으로 설정된 프로덕션 빌드에서는 이 영어 안내 문구가 자동으로 제거되고 오류 코드와 문제 입력값만 유지되므로, 코드에서 오류를 분기할 때는 메시지 문자열 대신 `error.code`와 `error.at`을 확인하세요.

## 신뢰할 수 없는 입력 처리

실패 유형별로 사용자 지정 검증 메시지를 띄우려면 `error.code`를 검사하고, 예상하지 못한 오류는 다시 던지세요.

```js
import { datetime } from 'native-dates';

function parseTimestamp(raw, zone) {
  try {
    return datetime(raw, zone);
  } catch (error) {
    if (error.code === 'invalidDateTime') {
      return null;
    }
    throw error;
  }
}

parseTimestamp('not-a-date', 'UTC'); // null
```

사용자가 입력한 폼 필드, 쿼리 파라미터, CSV 셀처럼 읽을 수 없는 텍스트에 `null`을 반환해야 한다면 [`@native-dates/plugins/loose`](/plugins/loose/)를 가져와 느슨한 모드를 켜세요.

```js
import { date, duration } from 'native-dates';
import '@native-dates/plugins/loose';

date('2026-02-30', { loose: true }); // null
duration('whenever', { loose: true }); // null
```

:::tip[느슨한 모드에서의 데이터 오류와 코드 오류]
느슨한 모드는 입력값 자체를 읽을 수 없을 때만 `null`을 반환합니다. 알 수 없는 시간대나 시작보다 끝이 앞선 범위처럼 호출 옵션에 문제가 있는 경우에는 버그를 바로 찾을 수 있도록 그대로 예외를 던집니다.
:::

## TypeError 코드

`TypeError`는 필수 입력이 누락되었거나, JavaScript 타입이 잘못되었거나, 기대한 날짜·시각 개념과 다른 종류의 값이 전달되었음을 뜻합니다.

| 코드 | 발생 위치 | 원인 |
|---|---|---|
| `missingDateTime` | `datetime()`, `DateTime` | 입력이 `null` 또는 `undefined`인 경우. |
| `missingDate` | `date()`, `CalendarDate` | 입력이 `null` 또는 `undefined`인 경우. |
| `missingTime` | `time()`, `Time` | 입력이 `null` 또는 `undefined`인 경우. |
| `missingYearMonth` | `yearMonth()`, `monthYear()`, `YearMonth` | 입력이 `null` 또는 `undefined`인 경우. |
| `missingMonthDay` | `monthDay()`, `dayMonth()`, `MonthDay` | 입력이 `null` 또는 `undefined`인 경우. |
| `invalidDateTime` | `datetime()`, `DateTime` | 입력이 불리언 등 지원하지 않는 타입인 경우. |
| `invalidDate` | `date()`, `CalendarDate` | 입력이 숫자 하나뿐이거나 지원하지 않는 타입인 경우. |
| `invalidTime` | `time()`, `Time` | 입력이 지원하지 않는 타입인 경우. |
| `invalidYearMonth` | `yearMonth()`, `monthYear()`, `YearMonth` | 입력이 숫자 하나뿐이거나 지원하지 않는 타입인 경우. |
| `invalidMonthDay` | `monthDay()`, `dayMonth()`, `MonthDay` | 입력이 숫자 하나뿐이거나 지원하지 않는 타입인 경우. |
| `invalidDuration` | `duration()`, `Duration`, `plus()`, `minus()` | 입력이 `null`, `undefined`, 지원하지 않는 타입이거나, 이미 단위가 포함된 기간에 단위 인자를 함께 전달한 경우. |
| `unsupportedCalendar` | `yearMonth()`, `monthDay()`, `YearMonth`, `MonthDay` | 입력이 ISO 역법이 아닌 `Temporal.PlainYearMonth` 또는 `PlainMonthDay`인 경우. |
| `invalidPoint` | `compare()`, `earliest()`, `latest()` | 값이 `DateTime`, `CalendarDate`, `Time`, `YearMonth`, `Date`, 유닉스 에포크 타임스탬프, Temporal 시점·날짜, 파싱 가능한 문자열 중 어느 것도 아닌 경우. |
| `conflictingKinds` | `compare()`, `earliest()`, `latest()` | `CalendarDate`와 `DateTime`처럼 서로 다른 종류의 값을 비교한 경우. |
| `invalidRange` | `mergeRanges()` | [`@native-dates/plugins/ranges`](/plugins/ranges/)가 로드된 상태에서 이터러블이 아닌 값이나 범위 인스턴스가 아닌 항목을 전달한 경우. |
| `conflictingRanges` | `DateRange`, `DateTimeRange`, `TimeRange`, `subtract()`, `union()`, `mergeRanges()` | 한 종류의 범위를 다른 종류의 범위 클래스 생성자, 팩토리 함수 또는 집합 연산에 전달한 경우. |

## RangeError 코드

`RangeError`는 값을 파싱할 수 없거나, 유효 범위를 벗어났거나, 지원하지 않는 단위·시간대·연산을 요청했음을 뜻합니다.

### 파싱과 값

| 코드 | 발생 위치 | 원인 |
|---|---|---|
| `invalidDateTime` | `datetime()`, `DateTime` | 문자열을 날짜와 시각으로 파싱할 수 없거나, 필드에 2월 30일처럼 범위를 벗어난 값이 포함된 경우. |
| `invalidDate` | `date()`, `CalendarDate` | 문자열을 날짜로 파싱할 수 없거나, 숫자가 정수가 아니거나, 필드가 범위를 벗어난 경우. |
| `missingDay` | `date()`, `CalendarDate` | 숫자 `(year, month)` 호출에서 `day` 인자를 생략한 경우. |
| `invalidTime` | `time()`, `Time` | 문자열을 시각으로 파싱할 수 없거나, 12시간제 시(hour)가 1~12 범위를 벗어났거나, 시각 필드가 범위를 벗어난 경우. |
| `invalidYearMonth` | `yearMonth()`, `monthYear()`, `YearMonth` | 문자열을 연월로 파싱할 수 없거나, 숫자가 정수가 아니거나, 월이 1~12 범위를 벗어난 경우. |
| `invalidMonthDay` | `monthDay()`, `dayMonth()`, `MonthDay` | 문자열을 월일로 파싱할 수 없거나, `equals()`에 순서가 모호한 구분자 문자열을 전달했거나, 필드가 범위를 벗어난 경우. |
| `invalidYear` | `MonthDay.in()` | `in()`에 전달한 연도가 정수가 아니거나 Temporal이 지원하는 연도 범위를 벗어난 경우. |
| `invalidDay` | `YearMonth.on()` | `on()`에 전달한 일(day)이 1~31 범위의 정수가 아닌 경우. |
| `invalidDuration` | `duration()`, `Duration` | 비어 있거나 파싱할 수 없는 영어 기간 표현, 잘못된 ISO 8601 기간 문자열, 또는 범위를 벗어난 기간 필드인 경우. |
| `invalidNumber` | `datetime()`, `duration()`, 단위 헬퍼 | 숫자 입력이 `NaN`, `Infinity`, `-Infinity`거나 유효하지 않은 `Date` 인스턴스인 경우. |
| `conflictingSigns` | `duration()`, `Duration`, `minus()` | `'1h -30m'`이나 기준 날짜 없이 일(day)에서 시간(hour)을 빼는 경우처럼 부호가 다른 단위를 환산할 수 없는 경우. |
| `invalidFraction` | `duration()`, `months()`, `times()` | 소수가 포함된 월이나 나노초를 고정된 하위 단위로 변환할 수 없는 경우. |

### 단위, 시간대, 포맷

| 코드 | 발생 위치 | 원인 |
|---|---|---|
| `unknownUnit` | 연산, 경계, 단위 맞춤, `set()`, `duration()` | 인식할 수 없는 영어 단위명 또는 약어인 경우. |
| `unknownDayOfWeek` | `dayOfWeek()`, `next()`, `previous()`, 주 경계, `configure()` | 인식할 수 없는 영어 요일명이거나 요일 번호가 1~7 범위를 벗어난 경우. |
| `unknownSetting` | `configure()` | `configure()`에 전달한 설정 키를 인식할 수 없는 경우. |
| `unknownWidth` | `configure()` | `weekdayNames` 항목에 `narrow`, `short`, `long` 외의 너비가 지정되었거나 너비가 누락된 경우. |
| `unknownZone` | 팩토리 함수, `in()`, `configure()` | 알 수 없는 IANA 시간대 ID, 문자열이 아닌 시간대, 또는 형식이 잘못된 UTC 오프셋인 경우. |
| `invalidZoneAliases` | `configure()` | `zoneAliases`가 일반 객체도 `null`도 아닌 경우. |
| `unknownLocale` | `locale()`, 팩토리 함수, `format()`, `monthNames()`, `weekdayNames()`, `configure()` | 로케일 태그, 태그 목록 또는 `Accept-Language` 헤더에 유효하지 않은 로케일 태그가 포함된 경우. |
| `unknownFormat` | `format()`, `monthNames()`, `weekdayNames()` | 유효하지 않은 포맷 지정·`Intl` 옵션, 지원하지 않는 기간·레이블 스타일, 또는 `[대괄호]` 바깥에 인식할 수 없거나 붙어 있는 토큰이 있는 경우. |
| `unsupportedToken` | `format()` | `CalendarDate`에 `HH`를 쓰거나 `Time`에 `YYYY`를 쓰는 등 해당 값에 없는 필드가 토큰 패턴에 포함된 경우. |
| `unknownKind` | `as()`, `DateRange.count()` | 호출 대상이 지원하지 않는 변환·집계 종류인 경우. |

### 연산과 측정

| 코드 | 발생 위치 | 원인 |
|---|---|---|
| `unsupportedUnit` | `CalendarDate`, `Time`, `YearMonth` | `CalendarDate`에 시각 단위, `Time`에 달력 단위, `YearMonth`에 월보다 작은 단위를 사용한 경우. |
| `cannotAdd` | `plus()`, `add()` | 덧셈 결과가 Temporal이 표현할 수 있는 날짜 범위를 초과한 경우. |
| `cannotSubtract` | `minus()`, `subtract()` | 뺄셈 결과가 Temporal이 표현할 수 있는 날짜 범위를 초과한 경우. |
| `cannotSet` | `set()` | 필드 값이 소수이거나 해당 달력 월 또는 시각 단위의 유효 범위를 벗어난 경우. |
| `cannotRound` | `round()`, `floor()`, `ceil()`, `Time.startOf()`, `Time.startOfNext()`, `Time.startOfPrevious()` | 지원하지 않는 반올림·올림·내림 단위이거나, 간격(step)이 상위 단위를 정확히 나누지 못하는 경우. |
| `missingAnchor` | `Duration.balance()`, `total()`, `compare()` | 기준 날짜가 없는 기간에서 월이나 연을 주·일·시각 단위로 변환하려면 달력 시작 날짜가 필요한 경우. |
| `cannotBalance` | `Duration.balance()` | 기간 단위 균형 조정이 범위를 초과하거나 Temporal 단위 맞춤에 실패한 경우. |
| `cannotTotal` | `Duration.total()`, `until()`, `since()` | 전체 길이 계산이 범위를 초과하거나 지원하지 않는 단위를 사용한 경우. |
| `missingPoints` | `earliest()`, `latest()` | 인자 없이 호출했거나 빈 배열을 전달한 경우. |
| `unsupportedComparison` | `CalendarDate`, `Time`, `YearMonth`, `MonthDay`, 범위 | 유닉스 에포크 숫자가 없는 타입에 `valueOf()`, 단항 `+`, `-`, `<`, `>` 같은 숫자 강제 변환을 시도한 경우. |

### 범위

| 코드 | 발생 위치 | 원인 |
|---|---|---|
| `invalidRange` | `DateRange`, `DateTimeRange`, `to()` | 범위의 `end`가 `start`보다 앞선 경우. |
| `invalidStep` | `every()`, `split()` | `every()`나 `split()`에 전달한 간격 기간이 0이거나 음수인 경우. |
| `unsupportedIntersection` | `TimeRange.intersection()` | 자정을 걸치는 두 시각 범위가 두 개의 분리된 구간에서 겹치는 경우. |
| `unsupportedUnion` | `TimeRange.union()`, `mergeRanges()` | 시각 범위의 합이 24시간 전체를 덮어 단일 `TimeRange`로 표현할 수 없는 경우. |
| `unsupportedZone` | `TimeRange.in()` | 시간대에 배치할 달력 날짜가 없는 `TimeRange`에서 `in()`을 호출한 경우. |

### 플러그인

| 코드 | 발생 위치 | 원인 |
|---|---|---|
| `missingPlugin` | 팩토리 함수, `configure()` | 해당 플러그인을 가져오기 전에 `loose`, `dayFirst`, `format` 또는 `zoneAliases`를 사용한 경우. |
| `missingTemporal` | 팩토리 함수, 클래스 생성자, `configure({ zone })` | `globalThis.Temporal`이 없고 `@native-dates/polyfill`도 로드되지 않은 경우 던지는 개발 모드 전용 안내 오류(프로덕션 빌드에서는 이 검사가 제거되어 런타임 기본 `ReferenceError`를 던집니다). |
| `immutable` | `DateTime` 레거시 세터 | [`@native-dates/plugins/legacy-date`](/plugins/legacy-date/)가 로드된 상태에서 `setHours()`처럼 인스턴스를 변경하는 `Date` 세터를 호출한 경우. |
