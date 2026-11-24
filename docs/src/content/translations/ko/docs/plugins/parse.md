---
source: 8dc73060ce55
title: parse
lede: format 옵션의 토큰 패턴으로 고정 형식의 날짜와 시각 문자열을 엄격하게 파싱합니다.
---

## 포맷 패턴으로 파싱하기

코어는 기본적으로 엄격한 ISO 8601 문자열만 파싱하고, [`@native-dates/plugins/loose`](/plugins/loose/)는 활성 로케일 기준으로 자유 형식 텍스트를 읽어 들입니다. 이 플러그인을 가져오면 은행 내보내기 파일이나 서버 로그처럼 형식이 고정된 문자열을 파싱하는 `{ format }` 옵션이 추가됩니다.

```js title="parse.js"
import '@native-dates/plugins/parse';
import { date, datetime, monthDay, time, yearMonth } from 'native-dates';

date('24112026', { format: 'DDMMYYYY' }).toString(); // '2026-11-24'
datetime('24/Nov/2026:12:40:01 -0500', {
  format: 'DD/MMM/YYYY:HH:mm:ss ZZ',
  zone: 'America/New_York',
  locale: 'en-US',
}).toString(); // '2026-11-24T17:40:01.000Z'
time('1430', { format: 'HHmm' }).toString(); // '14:30:00'
yearMonth('11/2026', { format: 'MM/YYYY' }).toString(); // '2026-11'
monthDay('29/02', { format: 'DD/MM' }).toString(); // '02-29'
```

`format` 옵션을 생략한 호출은 그대로 엄격한 ISO 파싱을 유지합니다. 이 플러그인을 가져오기 전에 `{ format }` 옵션으로 팩토리 함수를 호출하면 [`missingPlugin`](/api/errors/#plugins) 오류를 던집니다.

## 엄격한 일치와 이름 붙인 포맷

패턴에는 코어의 [토큰 목록](/guides/formatting/#token-patterns)을 그대로 사용합니다. 자릿수가 고정된 토큰은 정확한 자릿수를 맞춰야 하며, 일반 텍스트는 대소문자까지 전체 문자열과 정확히 일치해야 합니다.

2월 30일처럼 존재하지 않는 날짜나 요일이 맞지 않는 입력은 다음 날짜로 넘기지 않고 예외를 던집니다. 중복된 토큰이나 서로 충돌하는 12시간제·24시간제 시각 필드도 마찬가지로 거부합니다.

```js
import { configure, date, dateRange } from 'native-dates';

date('Tue 2026-11-24', { format: 'ddd YYYY-MM-DD', locale: 'en-US' }).toString();
// '2026-11-24'
date('6/9/26', { format: 'D/M/YY' }).toString(); // '2026-09-06'

configure({ formats: { bank: 'DDMMYYYY' } });
date('24112026', { format: 'bank' }).toString(); // '2026-11-24'
dateRange('24112026', '30112026', { format: 'bank' }).toString();
// '2026-11-24/2026-11-30'
configure({ formats: null });
```

[`configure()`](/api/configure/)에 등록한 이름 붙인 패턴은 파싱과 포맷 양쪽에서 모두 동작합니다. 범위 팩토리 함수는 양 끝 지점에 `format` 옵션을 그대로 전달하며, 두 번째 인수로 기간 길이를 넘겨도 함께 동작합니다.

## 현지화된 이름과 서수

월명, 요일명, 오전·오후 표기, 서수는 활성 로케일을 따릅니다. 단독형과 문맥 격변화형 월명 모두 대소문자를 구분하지 않고 일치하므로 러시아어나 그리스어 날짜도 추가 규칙 없이 파싱할 수 있습니다.

활성 로케일은 포맷과 같은 우선순위를 따릅니다. 호출 시 전달한 `locale` 옵션, [`configure()`](/api/configure/) 설정, 런타임 기본값 순으로 결정됩니다. 영어 서버 로그처럼 고정된 언어로 된 입력을 파싱할 때는 `locale`을 명시적으로 전달하세요.

```js
import { date, time, yearMonth } from 'native-dates';

date('November 24th, 2026', { format: 'MMMM Do, YYYY', locale: 'en-US' }).toString();
// '2026-11-24'
date('6 ноября 2026', { format: 'D MMMM YYYY', locale: 'ru' }).toString();
// '2026-11-06'
date('6. November 2026', { format: 'Do MMMM YYYY', locale: 'de' }).toString();
// '2026-11-06'
date('2026年11月6日', { format: 'YYYY[年]M[月]Do', locale: 'ja' }).toString();
// '2026-11-06'
yearMonth('février 2026', { format: 'MMMM YYYY', locale: 'fr' }).toString();
// '2026-02'
time('9:05:12.5 pm', { format: 'h:mm:ss.S a', locale: 'en-US' }).toString();
// '21:05:12.500'
```

영어 서수 토큰은 접미사까지 정확히 검증하므로 `'24st'`는 거부되며, 앱 설정에 등록한 사용자 정의 [요일명](/api/configure/)은 자동으로 적용됩니다.

## ISO 주차와 연중 일수 날짜

연중 일수와 ISO 주차 패턴은 달력 날짜나 시점으로 바로 해석됩니다. 주차 토큰과 함께 쓰인 `YYYY`는 `format()`이 출력하는 달력 연도가 아니라 ISO 주차 연도를 읽으므로 `'2026-W01-1'`은 2025년 12월 29일로 해석됩니다.

윤년과 52주·53주 연도를 엄격하게 검사하며, ISO 주차에서 요일을 생략하면 월요일로 지정됩니다.

```js
import { date } from 'native-dates';

date('2026-328', { format: 'YYYY-DDDD' }).toString(); // '2026-11-24'
date('2026-W48-2', { format: 'YYYY-[W]WW-E' }).toString(); // '2026-11-24'
date('2026-W48', { format: 'YYYY-[W]WW' }).toString(); // '2026-11-23'
date('2026-W01-1', { format: 'YYYY-[W]WW-E' }).toString(); // '2025-12-29'
```

## 시간대와 타임스탬프

오프셋 토큰이 포함된 패턴은 정확한 시점을 확정한 뒤 대상 시간대로 변환합니다. 문자열 안의 `z` 토큰은 IANA 식별자를 해석하며, [`@native-dates/plugins/zones`](/plugins/zones/)가 함께 로드되어 있으면 영어 도시명(및 `'서울'`, `'東京'`, `'北京'`, `'москва'` 등 내장 현지어 별칭)이나 `JST` 같은 약어도 인식합니다. 다만 `GMT+2` 같은 임의의 오프셋 레이블은 해석하지 않습니다.

변환할 대상 `zone` 옵션을 따로 전달하지 않으면 문자열에 적힌 시간대가 결과에 그대로 유지됩니다. 하나의 문자열에 오프셋과 시간대 이름이 함께 들어 있는데 해당 시점에서 서로 일치하지 않으면 예외를 던집니다.

```js
import '@native-dates/plugins/zones';
import { datetime } from 'native-dates';

datetime('24 Nov 2026 15:45 JST', {
  format: 'DD MMM YYYY HH:mm z',
  locale: 'en-US',
}).zone; // 'Asia/Tokyo'

datetime('24 Nov 2026 15:45 JST', {
  format: 'DD MMM YYYY HH:mm z',
  zone: 'UTC',
  locale: 'en-US',
}).toString(); // '2026-11-24T06:45:00.000Z'

datetime('1795542001', { format: 'X', zone: 'UTC' }).toString();
// '2026-11-24T17:40:01.000Z'
datetime('24112026', { format: 'DDMMYYYY', zone: 'America/New_York' }).toString();
// '2026-11-24T05:00:00.000Z'
```

유닉스 타임스탬프는 정수 초 단위인 `X`와 밀리초 단위인 `x`로 파싱합니다. [시점 팩토리 함수](/api/datetime-fn/)에 날짜 토큰만 있는 패턴을 전달하면 대상 시간대 기준 그날의 시작 시각으로 생성됩니다.

## 느슨한 모드와 함께 쓰기

이 플러그인과 함께 [`@native-dates/plugins/loose`](/plugins/loose/)를 로드하면 입력 문자열이 포맷과 일치하지 않을 때 예외를 던지는 대신 `null`을 반환할 수 있습니다. 누락된 값, 숫자, 존재하지 않는 날짜, 거부된 서머타임 전환 시각은 팩토리 함수에서 `null`을 반환하며, 이미 생성된 날짜·시각 인스턴스는 그대로 통과합니다.

```js
import '@native-dates/plugins/loose';
import { date, datetime } from 'native-dates';

date('not-a-date', { format: 'DDMMYYYY', loose: true }); // null
date('30022026', { format: 'DDMMYYYY', loose: true }); // null
datetime('08/03/2026 02:30', {
  format: 'DD/MM/YYYY HH:mm',
  zone: 'America/New_York',
  disambiguation: 'reject',
  loose: true,
}); // null
```

:::note[잘못된 데이터는 null을 반환하지만, 잘못된 패턴은 여전히 예외를 던집니다]
느슨한 모드는 포맷과 맞지 않는 입력 문자열만 `null`로 바꿉니다. 비어 있거나 필수 필드가 빠진 패턴은 [`unknownFormat`](/api/errors/#units-zones-and-formats) 오류를 던지고, 대상 타입에 없는 토큰을 쓰면 [`unsupportedToken`](/api/errors/#units-zones-and-formats) 오류를 던집니다.
:::

## 지원 토큰

토큰은 포맷 토큰 목록과 동일한 규칙을 따르며, 패턴 자체가 공백으로 시작하거나 끝나지 않는 한 입력 문자열 앞뒤의 공백은 자동으로 제거됩니다.

| 토큰 | 예시 | 일치 대상 |
|---|---|---|
| `YYYY` | `'2026'` | 네 자리 달력 연도, 또는 `W`·`WW`와 함께 쓰일 때 ISO 주차 연도. |
| `YY` | `'26'` | 두 자리 연도. 69~99는 1969~1999년으로, 00~68은 2000~2068년으로 해석. |
| `M`, `MM` | `'9'`, `'09'` | 1부터 12까지의 월 숫자(앞자리 0 미채움 또는 두 자리 0 채움). |
| `MMM`, `MMMM` | `'Nov'`, `'November'` | 현지화된 약식 또는 전체 그레고리력 월명(격변화형 포함). |
| `D`, `DD` | `'6'`, `'06'` | 1부터 31까지의 일 숫자(앞자리 0 미채움 또는 두 자리 0 채움). |
| `Do` | `'24th'`, `'6.'` | 영어 서수 또는 활성 로케일의 일 표기가 붙은 일. |
| `DDD`, `DDDD` | `'1'`, `'328'` | 1부터 366까지의 ISO 연중 일수(앞자리 0 미채움 또는 세 자리 0 채움). |
| `W`, `WW` | `'5'`, `'48'` | 1부터 53까지의 ISO 연도별 주차(앞자리 0 미채움 또는 두 자리 0 채움). |
| `E` | `'2'` | 월요일(1)부터 일요일(7)까지의 ISO 요일 번호. |
| `d` | `'0'` | 일요일(0)부터 토요일(6)까지의 요일 번호. |
| `dd`, `ddd`, `dddd` | `'Tu'`, `'Tue'`, `'Tuesday'` | 현지화된 최단, 약식, 전체 요일명. |
| `H`, `HH` | `'9'`, `'09'` | 0부터 23까지의 24시간제 시(앞자리 0 미채움 또는 두 자리 0 채움). |
| `h`, `hh` | `'9'`, `'09'` | 1부터 12까지의 12시간제 시(앞자리 0 미채움 또는 두 자리 0 채움). |
| `m`, `mm` | `'5'`, `'05'` | 0부터 59까지의 분(앞자리 0 미채움 또는 두 자리 0 채움). |
| `s`, `ss` | `'8'`, `'08'` | 0부터 59까지의 초(앞자리 0 미채움 또는 두 자리 0 채움). |
| `S`, `SS`, `SSS` | `'5'`, `'25'`, `'250'` | 0.1초, 0.01초, 밀리초 단위의 소수 초. |
| `A`, `a` | `'PM'`, `'pm'` | 대소문자를 구분하지 않는 영어 AM·PM, 또는 활성 로케일의 오전·오후 표기. |
| `Z`, `ZZ` | `'-05:00'`, `'-0500'` | 콜론 포함 또는 미포함 UTC 오프셋, 또는 UTC를 뜻하는 `Z`. |
| `z`, `zz` | `'UTC'`, `'JST'` | 공백 없는 IANA 시간대 ID, 또는 `@native-dates/plugins/zones` 로드 시 영어 도시명(및 내장 현지어 별칭)·약어. `'GMT+2'` 같은 오프셋 레이블은 파싱하지 않음. |
| `X`, `x` | `'1795542001'` | 음수를 포함한 정수 초 또는 밀리초 단위의 유닉스 타임스탬프. |
| `[text]` | `'[W]'` | 대소문자를 구분해 일치시키는 이스케이프 리터럴 텍스트. 단독 `T`는 이스케이프 없이 통과. |

분기나 전체 시간대 이름 같은 포맷 전용 토큰은 파싱할 수 없어 [`unknownFormat`](/api/errors/#units-zones-and-formats) 오류를 던집니다. 대상 타입의 필수 필드가 빠진 패턴도 같은 오류를 던지며, 대상 타입에 없는 필드의 토큰은 [`unsupportedToken`](/api/errors/#units-zones-and-formats) 오류를 던집니다.

## 팩토리 함수 옵션

:::entry
### `datetime()` :kind[function]

```js signature
datetime(input, { format, zone?, locale?, disambiguation?, loose? }): DateTime
date(input, { format, locale?, loose? }): CalendarDate
time(input, { format, locale?, loose? }): Time
yearMonth(input, { format, locale?, loose? }): YearMonth
monthYear(input, { format, locale?, loose? }): YearMonth
monthDay(input, { format, locale?, loose? }): MonthDay
dayMonth(input, { format, locale?, loose? }): MonthDay
dateRange(start, end, { format, locale?, loose? }): DateRange
datetimeRange(start, end, { format, zone?, locale?, disambiguation?, loose? }): DateTimeRange
timeRange(start, end, { format, locale?, loose? }): TimeRange
```

모든 날짜, 시각, 부분 날짜, 범위 팩토리 함수에서 문자열 입력을 토큰 패턴이나 이름 붙인 포맷에 맞춰 파싱합니다. 이미 파싱된 날짜·시각 인스턴스, `Date`, `Temporal` 값은 패턴 검증 후 그대로 통과하며, 숫자 입력은 거부합니다.

**매개변수**

```params
- name: format
  type: string
  required: true
  description: "토큰 패턴(예: `'DDMMYYYY'`) 또는 `configure({ formats })`에 등록한 이름 붙인 패턴."
- name: zone
  type: Zone
  description: "로컬 날짜와 시각 문자열을 해석하거나 오프셋·에포크 타임스탬프를 변환할 시간대."
- name: locale
  type: Locale
  description: "반환값에 유지되며 월명, 요일명, 오전·오후 표기, 서수 해석에 사용되는 BCP 47 로케일 태그."
- name: disambiguation
  type: Disambiguation
  default: "'compatible'"
  description: "로컬 날짜와 시각 문자열의 모호한 시각(서머타임 누락·중복 시각) 처리 방식. `'reject'`는 `invalidDateTime` 오류를 던지며, 느슨한 모드에서는 `null`을 반환합니다."
- name: loose
  type: boolean
  default: "false"
  description: "`@native-dates/plugins/loose` 필요. 입력이 포맷과 일치하지 않을 때 예외 대신 `null`을 반환하는 옵션."
```

**반환값**

```returns
type: DateTime | CalendarDate | Time | YearMonth | MonthDay | Range
description: "파싱된 인스턴스, 또는 팩토리 함수에서 `{ loose: true }`를 지정했고 입력이 일치하지 않을 때 `null`."
```

```js
date('24112026', { format: 'DDMMYYYY' }).toString(); // '2026-11-24'
yearMonth('202611', { format: 'YYYYMM' }).toString(); // '2026-11'
timeRange('0930', '1700', { format: 'HHmm' }).toString(); // '09:30:00/17:00:00'
```
:::
