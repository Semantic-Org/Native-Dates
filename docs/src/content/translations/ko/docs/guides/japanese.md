---
source: e095c0bff2bd
title: 일본어
lede: 일본어 연호와 괄호 요일을 포맷하고 슬래시 날짜와 일요일 주 시작 규칙을 다룹니다.
---

[현지화](/guides/localization/) 안내에 따라 `'ja-JP'`를 설정하면 일본어 날짜 형식이 적용됩니다. 기본값은 서력(그레고리력) 연도이며, 필요할 때 `'ja-u-ca-japanese'`를 사용하면 프리셋이 일본 연호로 전환됩니다.

## 일본 연호와 원년 표기

`'ja-u-ca-japanese'`를 전달하면 2019년 4월 30일의 헤이세이 31년과 다음 날의 레이와 원년(‘元年’) 같은 공식 연호 날짜를 포맷합니다.

```js
import { date } from 'native-dates';

date('2019-04-30').format('long', 'ja-u-ca-japanese'); // '平成31年4月30日'
date('2019-05-01').format('long', 'ja-u-ca-japanese'); // '令和元年5月1日'
date('2026-11-16').format('short', 'ja-u-ca-japanese'); // 'R8/11/16'
date('2026-11-16').format('llll', 'ja-u-ca-japanese'); // '令和8年11月16日(月)'
```

연호 로케일이 붙어 있더라도 `'YYYY年M月D日'` 같은 토큰 패턴과 `year` 프로퍼티는 항상 서력 연도를 읽습니다. 연호 표기가 필요할 때는 프리셋이나 옵션 객체를 사용하세요.

```js
const reiwa = date('2026-11-16').locale('ja-u-ca-japanese');

reiwa.year; // 2026
reiwa.format('long'); // '令和8年11月16日'
reiwa.format('YYYY年M月D日'); // '2026年11月16日'
```

[`YearMonth`](/api/year-month/)는 일(day) 정보가 없으므로 해당 월 1일 기준의 연호로 포맷합니다. 쇼와 64년에서 헤이세이 원년으로 바뀐 1989년 1월처럼 월 중간에 연호가 전환된 경우에는 먼저 [`on()`](/api/year-month/#on)으로 일자를 지정하세요.

```js
import { yearMonth } from 'native-dates';

const jan1989 = yearMonth('1989-01');

jan1989.format('long', 'ja-u-ca-japanese'); // '昭和64年1月'
jan1989.on(8).format('long', 'ja-u-ca-japanese'); // '平成元年1月8日'
```

## 괄호 요일과 12시간제 시각

표준 일본어 프리셋은 구분자와 요일 표기 방식이 서로 다릅니다.

| 프리셋 | 출력 | 형식과 주 용도 |
|---|---|---|
| `'medium'` | `'2026/11/16'` | 표나 폼 입력란에 적합한 간결한 슬래시 표기 |
| `'long'` | `'2026年11月16日'` | 요일 없는 표준 한자 연-월-일 표기 |
| `'full'` | `'2026年11月16日月曜日'` | 공백이나 괄호 없이 전체 요일명(‘月曜日’)을 이어 붙임 |
| `'llll'` | `'2026年11月16日(月)'` | 반각 괄호 안에 한 글자 요일(‘月’)을 넣는 일반적인 UI 표기 |

`'ddd'` 토큰은 ‘月’처럼 괄호 없는 한 글자 요일을 반환하므로 전각 괄호로 직접 감쌀 수 있습니다. 긴 월명(`MMMM`)과 서수 일(`Do`) 토큰은 이미 ‘月’과 ‘日’을 포함하므로, 리터럴 한자와 조합할 때는 숫자 월·일 토큰을 함께 쓰세요.

```js
import { date } from 'native-dates';

const day = date('2026-11-16').locale('ja-JP');

day.format('YYYY年M月D日（ddd）'); // '2026年11月16日（月）'
day.format('MMMMDo(ddd)'); // '11月16日(月)'
day.format({ month: 'long', day: 'numeric', weekday: 'short' }); // '11月16日(月)'
```

시각은 기본적으로 24시간제를 사용합니다. 일본식 0시 기준의 ‘午前0:30’·‘午後0:30’이 필요하면 `hour12: true` 옵션을 전달하고, 1~12시 체계가 필요하면 `'Ah:mm'` 패턴을 쓰세요.

```js
import { datetime } from 'native-dates';

const midnight = datetime('2026-11-16T00:30', 'Asia/Tokyo').locale('ja-JP');

midnight.format('time'); // '0:30'
midnight.format({ hour: 'numeric', minute: '2-digit', hour12: true }); // '午前0:30'
midnight.format('Ah:mm'); // '午前12:30'
```

## 슬래시 표기와 일본어 입력 파싱

일본어 CSV나 폼에서 자주 쓰이는 한자 연-월-일 순 날짜, 슬래시, 마침표 표기는 플러그인 없이 코어에서 바로 파싱됩니다.

```js
import { date, datetime, yearMonth } from 'native-dates';

date('2026年11月16日').toString(); // '2026-11-16'
date('2026/1/5').toString(); // '2026-01-05'
datetime('2026年11月16日 9:30', 'Asia/Tokyo').toString(); // '2026-11-16T00:30:00.000Z'
yearMonth('2026年11月').toString(); // '2026-11'
```

[`loose` 플러그인](/plugins/loose/)을 불러오면 전각 숫자와 문장부호, ‘午前’ / ‘午後’ 시각, 한자 월·일 표기를 별도 정규화 없이 바로 파싱합니다.

```js
import '@native-dates/plugins/loose';
import { date, monthDay, time } from 'native-dates';

date('２０２６／１１／１６', { loose: true })?.toString(); // '2026-11-16'
time('午後2:30', { loose: true, locale: 'ja' })?.toString(); // '14:30:00'
monthDay('11月16日', { loose: true })?.toString(); // '11-16'
```

`'令和8年11月16日'` 같은 연호 문자열은 구조화된 입력이 필요합니다. 폼에서 연호와 연도를 따로 입력받는 경우 달력을 먼저 변환할 필요 없이 일본 역법의 `Temporal.PlainDate`를 [`date()`](/api/date-fn/)에 그대로 전달하세요.

```js
const reiwaInput = Temporal.PlainDate.from({
  calendar: 'japanese',
  era: 'reiwa',
  eraYear: 8,
  month: 11,
  day: 16,
});

date(reiwaInput).toString(); // '2026-11-16'
```

## 시간대와 주 시작 요일

코어는 `'Asia/Tokyo'`와 고정 UTC 오프셋을 지원합니다. [`zones` 플러그인](/plugins/zones/)을 불러오면 `'JST'` 약어, `'Osaka'` 같은 일본 주요 영어 도시명, 내장 현지어 별칭 `'東京'`를 별도 설정 없이 바로 해석합니다.

```js
import '@native-dates/plugins/zones';
import { datetime } from 'native-dates';

datetime('2026-11-16T09:30', 'JST').zone; // 'Asia/Tokyo'
datetime('2026-11-16T09:30', 'Osaka').zone; // 'Asia/Tokyo'
datetime('2026-11-16T09:30', '東京').zone; // 'Asia/Tokyo'
```

일본어 로케일은 벽걸이 달력처럼 일요일에 한 주를 시작합니다. 월요일 시작 업무 일정을 구성할 때는 영어 요일명 `'monday'`를 전달하거나 `weekStart`를 고정하세요.

```js
import { date, weekdayNames } from 'native-dates';

const wed = date('2026-11-18').locale('ja-JP');

wed.weekStart; // 7
wed.startOf('week').toString(); // '2026-11-15'
wed.startOf('week', 'monday').toString(); // '2026-11-16'
weekdayNames('short', undefined, 'ja-JP');
// ['日', '月', '火', '水', '木', '金', '土']
weekdayNames('short', 'monday', 'ja-JP');
// ['月', '火', '水', '木', '金', '土', '日']
```

## 범위와 상대 표현

범위 프리셋은 슬래시 날짜나 한자 시각을 전각 물결표로 잇습니다. 양쪽 끝에 한자 날짜와 요일을 모두 표시하려면 [`format()`](/api/ranges/#format)에 토큰 패턴을 전달하세요.

```js
import { dateRange, timeRange } from 'native-dates';

const span = dateRange('2026-11-16', '2026-11-20').locale('ja-JP');

span.format('long'); // '2026/11/16～2026/11/20'
span.format('M月D日(ddd)'); // '11月16日(月) – 11月20日(金)'
timeRange('09:00', '17:30').format('short', 'ja-JP'); // '9時00分～17時30分'
```

[`CalendarDate`](/api/calendar-date/)는 이틀 전 ‘一昨日’부터 이틀 후 ‘明後日’까지 자연스러운 상대 날짜 표현을 반환합니다. [`DateTime`](/api/date-time/)은 항상 숫자 단위로 출력하므로 시간 차이가 달력 일수로 오해되지 않습니다.

```js
import { date, datetime, duration } from 'native-dates';

const baseDate = date('2026-11-16').locale('ja-JP');
baseDate.minus(2, 'days').from(baseDate); // '一昨日'
baseDate.plus(2, 'days').from(baseDate); // '明後日'

const baseTime = datetime('2026-11-16T12:00', 'Asia/Tokyo').locale('ja-JP');
baseTime.minus(1, 'day').from(baseTime); // '1 日前'
duration({ hours: 2, minutes: 30 }).format('long', 'ja-JP'); // '2 時間 30 分'
```

:::tip[공백과 전각 물결표 코드 포인트]
일본어 상대 표현과 기간 문자열은 표준 엔진 데이터에 따라 숫자 앞뒤에 반각 공백을 넣습니다. 범위 프리셋은 파도표(`U+301C`)가 아니라 전각 물결표(`U+FF5E`)를 출력하므로 테스트 단언문에서 코드 포인트를 확인하세요.
:::
