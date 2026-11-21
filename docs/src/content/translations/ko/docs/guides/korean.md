---
source: '936b04732f5e'
reviewed: false
title: 한국어 날짜와 시간
lede: 공백과 마침표가 붙은 날짜를 파싱하고, 한국어 괄호 요일과 월요일 주간 기준, 시간대, 음력 명절을 다룹니다.
---

[국제화](/guides/internationalization/)로 로케일을 설정한 뒤에도 한국어 앱에서는 마침표 날짜, 괄호 요일, 월요일 주간 기준, 음력 명절을 맞춰야 합니다.

## 마침표 날짜와 한국어 문자열

한글 맞춤법 기본 날짜는 `'2026. 11. 16.'`처럼 공백과 끝 마침표가 붙습니다. 코어는 공백 없는 점 표기만 읽고 공백 문자열은 거부합니다.

```js
import { date } from 'native-dates';

date('2026.11.16').locale('ko-KR').text; // '2026. 11. 16.'
date('2026. 11. 16.'); // RangeError [invalidDate]
```

포털이나 명세서의 네 자리 연도 마침표 날짜와 24시간제 시각은 [느슨한 파싱 플러그인](/plugins/loose/)과 `{ loose: true }` 옵션으로 읽습니다.

```js
import '@native-dates/plugins/loose';
import { date, datetime } from 'native-dates';

date('2026. 11. 16.', { loose: true }); // 2026-11-16
datetime('2026. 11. 16. 14:30', { zone: 'Asia/Seoul', loose: true });
// 2026-11-16T05:30:00.000Z
```

두 자리 연도는 월·일·연 순서로 오인될 수 있고 한글 날짜는 모든 타입에서 `null` 값을 반환하므로 정규식으로 숫자를 먼저 추출하세요.

```js
date('2026년 11월 16일', { loose: true }); // null
date('12.11.26', { loose: true }); // 2026-12-11

const [, y, m, d] = '2026년 11월 16일'.match(/(\d+)년\s*(\d+)월\s*(\d+)일/);
date(Number(y), Number(m), Number(d)); // 2026-11-16
```

| 입력 문자열 | 파싱 결과 | 권장 처리 방식 |
|---|---|---|
| `'2026-11-16'`, `'2026.11.16'` | 코어에서 바로 파싱 | 플러그인 없이 그대로 전달합니다. |
| `'2026. 11. 16.'`, `'2026. 11. 16. 14:30'` | 느슨한 파싱에서 성공 | 느슨한 파싱 플러그인을 불러와 `{ loose: true }` 옵션을 켭니다. |
| `'26. 5. 5.'`, `'12.11.26'` | `null` 반환 또는 월·일·연 오인 | 네 자리 연도로 넓히거나 숫자 인자로 분리해 넘깁니다. |
| `'2026년 11월 16일'`, `'오후 2:30'` | `null` 반환 | 정규식으로 숫자 필드를 추출해 생성자에 전달합니다. |

## 괄호 요일과 오전·오후 어순

기본 전체 프리셋은 괄호 없이 요일을 적지만 `'llll'` 프리셋과 짧은 요일 옵션은 한 글자 괄호 요일을 붙이고 기간을 물결표로 잇습니다.

```js
import { date } from 'native-dates';

const holiday = date('2026-05-05').locale('ko-KR');
holiday.format('llll'); // '2026년 5월 5일 (화)'
holiday.format({ month: 'long', day: 'numeric', weekday: 'short' });
// '5월 5일 (화)'

const week = date('2026-11-16').to('2026-11-20');
week.format({ month: 'long', day: 'numeric', weekday: 'short' }, 'ko-KR');
// '11월 16일 (월)~20일 (금)'
```

패턴 안의 한글은 대괄호 없이 출력됩니다. `MMM` 및 `Do` 토큰은 월·일 단위를 포함하므로 접미어를 빼고 요일은 `ddd` 토큰을 쓰세요.

```js
import { datetime } from 'native-dates';

const slot = datetime('2026-05-05T14:05:00', 'Asia/Seoul').locale('ko-KR');
slot.format('YYYY. MM. DD. (ddd)'); // '2026. 05. 05. (화)'
slot.format('YYYY년 M월 D일 A h시 m분'); // '2026년 5월 5일 오후 2시 5분'
slot.format('MMM Do (dd)'); // '5월 5일 (화)'
```

한국어는 오전·오후를 `'A h:mm'` 순서로 시각 앞에 두며, 24시간제가 필요하면 `'ko-KR-u-hc-h23'` 태그를 넘깁니다.

```js
slot.format('medium'); // '2026. 5. 5. 오후 2:05'
slot.format('medium', 'ko-KR-u-hc-h23'); // '2026. 5. 5. 14:05'
```

## 한국 표준시와 시간대 별칭

코어는 `'Asia/Seoul'`만 허용합니다. [시간대 플러그인](/plugins/zones/)을 불러오면 KST와 서울, 사용자 `zoneAliases`를 해석하며 시간대는 문자열 밖에서 별도 인자로 넘깁니다.

```js
import '@native-dates/plugins/zones';
import { configure, datetime } from 'native-dates';

configure({ zoneAliases: { busan: 'Asia/Seoul', 서울: 'Asia/Seoul' } });
datetime('2026-11-16T14:30', 'KST').zone; // 'Asia/Seoul'
datetime('2026-11-16T14:30', '서울').zone; // 'Asia/Seoul'
```

짧은 시간대는 GMT+9로 찍히고 한글 명칭은 `zzz` 토큰으로 출력합니다. UTC 서버는 오전 8시 59분까지 전날에 머무르므로 서울 시간대를 명시하세요.

```js
import { datetime, today } from 'native-dates';

const meeting = datetime('2026-11-16T05:30:00Z', 'Asia/Seoul').locale('ko-KR');
meeting.text; // '2026년 11월 16일 오후 2:30 GMT+9'
meeting.format('A h:mm zzz'); // '오후 2:30 한국 표준시'
today('Asia/Seoul'); // 한국 기준 오늘 날짜
```

## 일요일 달력과 월요일 주간 기준

`'ko-KR'` 로케일은 벽걸이 달력처럼 일요일에 한 주를 시작하지만 업무 일정과 정산, ISO `weekOfYear` 주차는 월요일 기준이라 일요일에 어긋납니다.

```js
import { date, weekdayNames } from 'native-dates';

const sun = date('2026-11-15').locale('ko-KR');
sun.weekStart; // 7
sun.startOf('week').toString(); // '2026-11-15'
sun.weekOfYear; // 46, 다음 날 월요일부터 47주차
weekdayNames('short', undefined, 'ko-KR');
// ['일', '월', '화', '수', '목', '금', '토']
weekdayNames('short', 'monday', 'ko-KR');
// ['월', '화', '수', '목', '금', '토', '일']
```

호출마다 월요일을 넘기거나 [앱 설정](/api/configure/)에 시작 요일을 고정하고, 인스턴스에는 `'ko-KR-u-fw-mon'` 태그를 쓰세요.

```js
const wed = date('2026-11-18').locale('ko-KR-u-fw-mon');
wed.weekStart; // 1
wed.startOf('week').toString(); // '2026-11-16'
```

## 상대 날짜와 음력 명절

달력 날짜는 오늘 앞뒤 이틀까지 고유어를 반환하지만, 시각 타입은 0초일 때만 지금을 쓰고 나머지는 숫자와 단위로 표시합니다.

```js
import { date, datetime } from 'native-dates';

const day = date('2026-11-16').locale('ko-KR');
day.minus(2, 'days').from(day); // '그저께' — 어제, 오늘, 내일도 고유어로 반환
day.plus(2, 'days').from(day); // '모레'

const moment = datetime('2026-11-16T12:00', 'Asia/Seoul').locale('ko-KR');
moment.minus(2, 'days').from(moment); // '2일 전'
```

설날·추석이나 음력 생일에는 `'ko-KR-u-ca-dangi'` 태그를 넘깁니다. 짧은 프리셋은 연도 대신 1~60 육십갑자 순번을 찍으므로 긴 프리셋이나 월·일 옵션을 쓰세요.

```js
const chuseok = date('2026-09-25');
const leapDay = date('2025-07-25');

chuseok.format('long', 'ko-KR-u-ca-dangi'); // '병오년 8월 15일'
chuseok.format({ month: 'long', day: 'numeric' }, 'ko-KR-u-ca-dangi'); // '8월 15일'
leapDay.format('long', 'ko-KR-u-ca-dangi'); // '을사년 윤6월 1일'
```

:::tip[음력 반복 기념일 다루기]
`MonthDay` 및 `YearMonth` 타입은 양력 기준에 고정되어 음력 태그를 넘겨도 양력 월·일을 출력합니다. 음력 생일과 명절은 해당 연도의 양력 `CalendarDate`에서 포맷하세요.
:::
