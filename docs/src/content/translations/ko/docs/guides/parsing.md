---
source: c532ba117dba
title: 파싱
lede: 임의 추측 없이 ISO 문자열, 기간, 범위, 느슨한 사용자 입력을 정확하게 읽어 들입니다.
---

코어는 모호하지 않은 표준 입력을 요청한 타입으로 바로 파싱합니다.

- [`datetime()`](/api/datetime-fn/): 타임라인상의 시점, 에포크 밀리초, 타임스탬프
- [`date()`](/api/date-fn/): 시각이나 시간대가 없는 달력 날짜
- [`time()`](/api/time-fn/): 24시간제 및 12시간제 시각
- [`duration()`](/api/duration-fn/): 영어 단위 문자열과 ISO 8601 기간
- [`yearMonth()`](/api/year-month-fn/)와 [`monthDay()`](/api/month-day-fn/): 청구 월, 카드 만료일, 매년 반복되는 생일
- [`dateRange()`](/api/range-fn/#daterange), [`datetimeRange()`](/api/range-fn/#datetimerange), [`timeRange()`](/api/range-fn/#timerange): 구간 문자열과 시작·끝 쌍

## ISO 날짜와 타임스탬프

`date()`에는 연-월-일 순 날짜 문자열, 연·월·일 세 개의 숫자, 또는 필드 객체를 전달할 수 있습니다. 연-월-일 순 문자열은 한 자리 월·일과 0 채움 형식을 모두 허용하며, 라틴 문자나 콜론을 제외한 모든 구분자를 인식합니다. 중국어, 일본어, 한국어, 공백이 포함된 마침표 날짜도 코어에서 바로 읽습니다.

월은 1부터 12까지의 번호를 사용합니다. 2월 30일처럼 존재하지 않는 달력 날짜나 `'2026-W05-1'` 같은 ISO 주차·분기 문자열은 임의로 추측하지 않고 오류를 던집니다.

```js
import { date } from 'native-dates';

date('2026-11-16');
date('2026/11/6');
date('2026年11月16日');
date('2026. 11. 16.');
date(2026, 11, 16);
date({ year: 2026, month: 11, day: 16 });
```

`datetime()`에는 ISO 8601 문자열이나 필드 객체를 전달하세요. 끝에 `Z`나 숫자 오프셋이 있으면 정확한 시점을 지정하고, 오프셋이 없는 문자열은 대상 시간대의 현지 시각으로 해석합니다.

```js
import { datetime } from 'native-dates';

datetime('2026-11-16T17:30:00Z', 'America/Los_Angeles'); // 9:30 AM PST
datetime('2026-11-16T09:30', 'America/Los_Angeles'); // 9:30 AM PST
datetime('2026-11-16T09:30[Europe/Berlin]'); // 9:30 AM CET
datetime({ year: 2026, month: 11, day: 16, hour: 9, minute: 30 }, 'Europe/Berlin');
```

오프셋이 포함된 타임스탬프를 `date()`나 `time()`에 전달하면 지정한 시간대 기준으로 해당 달력 날짜나 현지 시각을 추출합니다.

```js
import { time } from 'native-dates';

date('2026-11-17T01:30:00Z', 'America/Los_Angeles'); // 2026-11-16
date('2026-11-17T01:30:00Z', 'Asia/Tokyo'); // 2026-11-17
time('2026-11-17T01:30:00Z', 'America/Los_Angeles'); // 17:30:00
```

## 시각과 기간

`time()`에는 24시간제 ISO 시각, `'14h30'` 같은 시·분 표기, 12시간제 시각 문자열, 숫자 인수, 또는 필드 객체를 전달합니다. 기간 표기와 혼동되지 않도록 `'14h'`처럼 시 단위만 단독으로 적은 문자열은 오류를 던집니다.

```js
import { time } from 'native-dates';

time('09:30');
time('14h30');
time('9:30am');
time('5:15 PM');
time(17, 15, 30);
time({ hour: 9, minute: 30 });
```

`duration()`에는 영어 단위 문자열, ISO 8601 기간 문자열, 수량과 단위, 또는 필드 객체를 전달하세요.

```js
import { duration } from 'native-dates';

duration('1h 30m');
duration('2 weeks and 3 days');
duration('PT90M');
duration(90, 'minutes');
duration({ hours: 1, minutes: 30 });
```

## 부분 날짜와 범위

ISO 연-월 문자열은 [`yearMonth()`](/api/year-month-fn/)로, 월이 먼저 오는 카드 만료일은 [`monthYear()`](/api/year-month-fn/#monthyear)로 파싱합니다.

```js
import { dayMonth, monthDay, monthYear, yearMonth } from 'native-dates';

yearMonth('2026-11');
monthYear('11/28'); // YearMonth(2028-11)

monthDay('10/17');
dayMonth('17/10'); // MonthDay(10-17)
```

연도 없이 반복되는 날짜도 같은 방식으로 [`monthDay()`](/api/month-day-fn/)와 [`dayMonth()`](/api/month-day-fn/#daymonth)로 파싱합니다. 구간을 읽을 때는 [범위 팩토리 함수](/api/range-fn/)에 시작·끝 두 값이나 단일 구간 문자열을 전달하세요.

```js
import { dateRange, timeRange } from 'native-dates';

dateRange('2026-11-01/2026-11-07');
timeRange('9am - 5pm');
```

## 에포크 타임스탬프, Date, Temporal

유닉스 에포크 밀리초, 네이티브 JavaScript `Date`, [Temporal](/guides/temporal/) 객체는 `datetime()`에 바로 전달할 수 있습니다.

단독 숫자를 `date()` 팩토리 함수에 바로 넘기면 어느 시간대의 날짜인지 모호하므로 오류를 던집니다. 먼저 에포크 밀리초를 특정 시간대의 `DateTime` 시점으로 변환한 뒤 달력 날짜를 꺼내세요.

```js
import { date, datetime } from 'native-dates';

const fromEpoch = datetime(1794850200000, 'UTC');
const fromJSDate = datetime(new Date('2026-11-16T17:30:00Z'));
const localDay = date(new Date('2026-11-16T17:30:00Z'), 'America/Los_Angeles');
```

## 모호한 문자열에서 오류를 던지는 이유

네 자리 연도가 맨 앞에 오는 형식은 해석이 단 하나뿐이지만, `'03/05/2026'`은 미국에서 3월 5일이고 유럽과 라틴아메리카에서는 5월 3일입니다. 코어는 운영 환경에서 잘못된 월을 추측하는 대신 모호한 숫자 문자열을 거부합니다.

:::warning[빈 값은 현재 시점이나 오늘 날짜로 대체되지 않습니다]
어느 팩토리 함수든 빈 값을 넘기면 현재 날짜를 반환하는 대신 오류를 던집니다. 덕분에 누락된 API 필드가 조용히 오늘 날짜로 둔갑하는 버그를 막을 수 있습니다. 현재 시점이나 오늘 날짜가 필요하면 [`now()`](/api/datetime-fn/#now)나 [`today()`](/api/date-fn/#today)를 직접 호출하세요.
:::

## loose 플러그인으로 사용자 입력 파싱하기

사용자 직접 입력, CSV 내보내기 파일, RFC 2822 헤더처럼 자유 형식 텍스트를 파싱해야 한다면 [`@native-dates/plugins/loose`](/plugins/loose/)를 불러오고 `{ loose: true }`를 전달하세요. 느슨한 모드(`loose` 모드)는 현지화된 월명, 오전·오후 표기, 마침표 시각, 비ASCII 숫자까지 활성 로케일의 표기 방식대로 날짜와 시각을 읽어 들입니다.

```js
import '@native-dates/plugins/loose';
import { date, datetime, monthDay, time, yearMonth } from 'native-dates';

date('Nov 16, 2026', { loose: true }); // 2026-11-16
date('16 de noviembre de 2026', { loose: true, locale: 'es' }); // 2026-11-16
datetime('Mon, 16 Nov 2026 17:30:00 GMT', { loose: true });
time('오후 2:30', { loose: true, locale: 'ko' }); // 14:30:00
yearMonth('Nov 2026', { loose: true }); // 2026-11
monthDay('17 février', { loose: true, locale: 'fr' }); // 02-17
```

슬래시나 마침표로 구분된 숫자 날짜는 활성 로케일의 순서를 따릅니다. 입력 데이터의 순서가 활성 로케일과 다르다면 호출마다 `dayFirst`를 전달하거나 [`configure()`](/api/configure/)에서 전역으로 지정하세요.

```js
date('03/05/2026', { loose: true, locale: 'en-US' }); // 2026-03-05
date('03/05/2026', { loose: true, locale: 'fr' }); // 2026-05-03
date('03/05/2026', { loose: true, locale: 'en-US', dayFirst: true }); // 2026-05-03
```

느슨한 모드에서는 모든 팩토리 함수와 범위에서 읽을 수 없는 입력이 들어와도 오류를 던지지 않고 `null`을 반환합니다. 다만 알 수 없는 시간대 이름 같은 잘못된 옵션 값은 여전히 오류를 던집니다.

```js
import { duration } from 'native-dates';

date('not a date', { loose: true }); // null
duration('soon', { loose: true }); // null
```
