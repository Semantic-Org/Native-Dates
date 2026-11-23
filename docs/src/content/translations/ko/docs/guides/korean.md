---
source: c035ad557cf5
reviewed: false
title: 한국어
lede: 한국어 마침표 날짜를 파싱하고 요일과 음력 명절을 포맷합니다.
---

[현지화](/guides/localization/)에서 `'ko-KR'`을 설정하면 한국어 날짜 형식이 적용됩니다. 기본 프리셋은 `'2026. 11. 16.'`처럼 공백과 끝 마침표를 찍고 시각 앞에 *오전*·*오후*를 둡니다.

## 마침표 날짜와 한국어 문자열

공백과 끝 마침표가 있는 한국어 마침표 날짜와 한글 단위 문자열은 플러그인 없이 코어에서 바로 파싱됩니다.

```js
import { date, datetime, yearMonth } from 'native-dates';

date('2026. 11. 16.').toString(); // '2026-11-16'
date('2026년 11월 16일').toString(); // '2026-11-16'
datetime('2026. 11. 16. 14:30', 'Asia/Seoul').toString(); // '2026-11-16T05:30:00.000Z'
yearMonth('2026년 11월').toString(); // '2026-11'
```

두 자리 연도 우선 단축 날짜, *오전*·*오후* 시각, 한글 월·일 표기를 읽으려면 한국어 로케일과 함께 [느슨한 파싱 플러그인](/plugins/loose/)을 불러오세요.

```js
import '@native-dates/plugins/loose';
import { date, monthDay, time } from 'native-dates';

date('26. 5. 5.', { loose: true, locale: 'ko' })?.toString(); // '2026-05-05'
date('12.11.26', { loose: true, locale: 'ko' })?.toString(); // '2012-11-26'
time('오후 2:30', { loose: true, locale: 'ko' })?.toString(); // '14:30:00'
monthDay('11월 16일', { loose: true })?.toString(); // '11-16'
```

두 자리 연도를 읽을 때는 항상 `locale: 'ko'`를 넘기세요. 미국 영어 런타임에서는 `'12.11.26'`이 2026년 12월 11일로 해석됩니다.

| 입력 문자열 | 파싱 결과 | 권장 처리 방식 |
|---|---|---|
| `'2026. 11. 16.'`, `'2026년 11월 16일'` | 코어에서 바로 파싱 | 플러그인 없이 그대로 전달합니다. |
| `'26. 5. 5.'`, `'12.11.26'`, `'오후 2:30'` | 느슨한 모드에서 파싱 | 느슨한 파싱 플러그인을 불러와 `{ loose: true, locale: 'ko' }`를 넘깁니다. |

## 괄호 요일과 오전·오후 어순

`'full'` 프리셋은 전체 요일명을 적지만 `'llll'` 프리셋과 짧은 요일 옵션은 한 글자 괄호 요일을 붙이고 기간을 물결표로 잇습니다.

```js
import { date, dateRange } from 'native-dates';

const holiday = date('2026-05-05').locale('ko-KR');

holiday.format('llll'); // '2026년 5월 5일 (화)'
holiday.format({ month: 'long', day: 'numeric', weekday: 'short' });
// '5월 5일 (화)'

const week = dateRange('2026-11-16', '2026-11-20');
week.format({ month: 'long', day: 'numeric', weekday: 'short' }, 'ko-KR');
// '11월 16일 (월)~20일 (금)'
```

패턴 안의 한글은 대괄호 없이 출력됩니다. 짧은 월과 서수 일 토큰은 이미 *월*·*일* 단위를 포함하므로 접미어를 빼고 요일은 `'ddd'` 토큰을 쓰세요.

```js
import { datetime } from 'native-dates';

const slot = datetime('2026-05-05T14:05:00', 'Asia/Seoul').locale('ko-KR');

slot.format('YYYY. MM. DD. (ddd)'); // '2026. 05. 05. (화)'
slot.format('YYYY년 M월 D일 A h시 m분'); // '2026년 5월 5일 오후 2시 5분'
slot.format('MMM Do (dd)'); // '5월 5일 (화)'
```

한국어는 오전·오후를 시각 앞에 두며, 24시간제가 필요하면 `'ko-KR-u-hc-h23'` 태그를 넘깁니다.

```js
slot.format('medium'); // '2026. 5. 5. 오후 2:05'
slot.format('medium', 'ko-KR-u-hc-h23'); // '2026. 5. 5. 14:05'
```

## 한국 표준시와 시간대 별칭

코어는 `'Asia/Seoul'`과 고정 오프셋을 받으며, [시간대 플러그인](/plugins/zones/)을 불러오면 느슨한 문자열 안의 인라인 약어를 포함해 KST, Busan 같은 국내 도시와 한글 명칭을 별도 설정 없이 바로 해석합니다.

```js
import '@native-dates/plugins/loose';
import '@native-dates/plugins/zones';
import { datetime } from 'native-dates';

datetime('2026-11-16T14:30', 'KST').zone; // 'Asia/Seoul'
datetime('2026-11-16T14:30', '서울').zone; // 'Asia/Seoul'
datetime('2026-11-16T14:30', 'Busan').zone; // 'Asia/Seoul'
datetime('2026. 11. 16. 14:30 KST', { loose: true, zone: 'UTC' })?.toString();
// '2026-11-16T05:30:00.000Z'
```

짧은 시간대는 GMT+9로 찍히고 한글 명칭은 `'zzz'` 토큰으로 출력합니다. UTC 서버는 오전 8시 59분까지 전날에 머무르므로 `today()`에 서울 시간대를 명시하세요.

```js
import { datetime, today } from 'native-dates';

const meeting = datetime('2026-11-16T05:30:00Z', 'Asia/Seoul').locale('ko-KR');

meeting.text; // '2026년 11월 16일 오후 2:30 GMT+9'
meeting.format('A h:mm zzz'); // '오후 2:30 한국 표준시'
today('Asia/Seoul');
```

## 일요일 달력과 월요일 주간 기준

`'ko-KR'` 로케일은 벽걸이 달력처럼 일요일에 한 주를 시작하지만 업무 일정과 정산, ISO `weekOfYear` 주차는 월요일부터 셉니다.

```js
import { date, weekdayNames } from 'native-dates';

const sun = date('2026-11-15').locale('ko-KR');

sun.weekStart; // 7
sun.startOf('week').toString(); // '2026-11-15'
sun.weekOfYear; // 46
weekdayNames('short', undefined, 'ko-KR');
// ['일', '월', '화', '수', '목', '금', '토']
weekdayNames('short', 'monday', 'ko-KR');
// ['월', '화', '수', '목', '금', '토', '일']
```

호출마다 `'monday'`를 넘기거나 [설정](/api/configure/)에 시작 요일을 고정하고, 인스턴스에는 `'ko-KR-u-fw-mon'` 태그를 쓰세요.

```js
const wed = date('2026-11-18').locale('ko-KR-u-fw-mon');

wed.weekStart; // 1
wed.startOf('week').toString(); // '2026-11-16'
```

## 상대 날짜와 음력 명절

달력 날짜는 오늘 앞뒤 이틀까지 *그저께*와 *모레*를 반환하지만, `DateTime`은 0초일 때만 *지금*을 쓰고 나머지는 숫자와 단위로 표시합니다.

```js
import { date, datetime } from 'native-dates';

const day = date('2026-11-16').locale('ko-KR');
day.minus(2, 'days').from(day); // '그저께'
day.plus(2, 'days').from(day); // '모레'

const moment = datetime('2026-11-16T12:00', 'Asia/Seoul').locale('ko-KR');
moment.minus(2, 'days').from(moment); // '2일 전'
```

설날·추석이나 음력 생일에는 `'ko-KR-u-ca-dangi'` 태그를 넘깁니다. 짧은 프리셋은 연도 대신 1~60 육십갑자 순번을 찍으므로 `'long'` 프리셋이나 월·일 옵션을 쓰세요.

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
