---
source: 1ff5dd8e887b
title: 한국어
lede: 한국어 마침표·한글 날짜 파싱, 괄호 요일 포맷, UTC 서버 날짜 경계와 음력 표기를 다룹니다.
---

[현지화](/guides/localization/) 안내에 따라 `'ko-KR'`을 설정하면 한국어 날짜·시각 형식이 적용됩니다. 기본 프리셋은 `'2026. 11. 16.'`처럼 공백과 끝 마침표가 붙는 표기를 쓰며, 12시간제 시각은 ‘오전’·‘오후’를 앞에 둡니다.

## 마침표 날짜와 한글 문자열 파싱

`'2026. 11. 16.'`처럼 4자리 연도가 있는 마침표 날짜와 `'2026년 11월 16일'` 같은 한글 단위 문자열은 플러그인 없이 코어에서 바로 파싱됩니다.

```js
import { date, datetime, yearMonth } from 'native-dates';

date('2026. 11. 16.').toString(); // '2026-11-16'
date('2026년 11월 16일').toString(); // '2026-11-16'
datetime('2026. 11. 16. 14:30', 'Asia/Seoul').toString(); // '2026-11-16T05:30:00.000Z'
yearMonth('2026년 11월').toString(); // '2026-11'
```

두 자리 연도 단축 날짜(`'26. 5. 5.'`, `'12.11.26'`), ‘오전’·‘오후’ 시각, 연도 없는 한글 월·일 표기를 읽으려면 [`loose` 플러그인](/plugins/loose/)을 불러와 느슨한 모드에서 파싱하세요.

```js
import '@native-dates/plugins/loose';
import { date, monthDay, time } from 'native-dates';

date('26. 5. 5.', { loose: true, locale: 'ko' })?.toString(); // '2026-05-05'
date('12.11.26', { loose: true, locale: 'ko' })?.toString(); // '2012-11-26'
time('오후 2:30', { loose: true, locale: 'ko' })?.toString(); // '14:30:00'
monthDay('11월 16일', { loose: true })?.toString(); // '11-16'
```

두 자리 연도를 파싱할 때는 반드시 `locale: 'ko'`를 함께 전달하세요. 기본 미국 영어 런타임에서는 `'12.11.26'`이 2012년 11월 26일이 아니라 2026년 12월 11일로 해석됩니다.

| 입력 문자열 | 파싱 경계 | 권장 처리 방식 |
|---|---|---|
| `'2026. 11. 16.'`, `'2026년 11월 16일'` | 코어에서 바로 파싱 | 플러그인 없이 바로 전달 |
| `'26. 5. 5.'`, `'12.11.26'`, `'오후 2:30'` | 느슨한 모드에서 파싱 | `loose` 플러그인 로드 후 `{ loose: true, locale: 'ko' }` 전달 |

## 괄호 요일과 12·24시간제 전환

`'full'` 프리셋은 전체 요일명(‘화요일’)을 출력하지만, `'llll'` 프리셋과 `weekday: 'short'` 옵션은 한 글자 괄호 요일을 붙입니다. 범위 포맷에서는 같은 달의 월 표기를 축약하고 물결표(`~`)로 잇습니다.

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

토큰 패턴 안의 한글은 대괄호 없이 그대로 출력됩니다. `MMM`과 `Do` 토큰은 이미 ‘월’과 ‘일’을 포함하므로 뒤에 단위를 중복해 적지 말고, 한 글자 요일은 `'ddd'`나 `'dd'` 토큰을 쓰세요.

```js
import { datetime } from 'native-dates';

const slot = datetime('2026-05-05T14:05:00', 'Asia/Seoul').locale('ko-KR');

slot.format('YYYY. MM. DD. (ddd)'); // '2026. 05. 05. (화)'
slot.format('YYYY년 M월 D일 A h시 m분'); // '2026년 5월 5일 오후 2시 5분'
slot.format('MMM Do (dd)'); // '5월 5일 (화)'
```

기본 12시간제 프리셋을 24시간제로 전환하려면 `'ko-KR-u-hc-h23'` 태그를 전달하세요.

```js
slot.format('medium'); // '2026. 5. 5. 오후 2:05'
slot.format('medium', 'ko-KR-u-hc-h23'); // '2026. 5. 5. 14:05'
```

## 한국 표준시와 UTC 서버 날짜 경계

코어는 `'Asia/Seoul'`과 고정 UTC 오프셋을 기본 지원합니다. [`zones` 플러그인](/plugins/zones/)을 불러오면 `'KST'` 약어, `'Busan'` 같은 영어 도시명, 내장 한글 별칭 `'서울'`을 별도 설정 없이 해석하며, 느슨한 모드에서는 문자열 안의 KST 약어도 함께 파싱합니다.

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

짧은 시간대 표기는 `GMT+9`로 출력되고, 전체 명칭(‘한국 표준시’)이 필요하면 `'zzz'` 토큰을 사용합니다. UTC 기준 서버에서는 한국 시각 오전 8시 59분까지 날짜가 하루 전으로 계산되므로 서버에서 [`today()`](/api/date-fn/#today)를 호출할 때는 반드시 `'Asia/Seoul'`을 명시하세요.

```js
import { datetime, today } from 'native-dates';

const meeting = datetime('2026-11-16T05:30:00Z', 'Asia/Seoul').locale('ko-KR');

meeting.text; // '2026년 11월 16일 오후 2:30 GMT+9'
meeting.format('A h:mm zzz'); // '오후 2:30 한국 표준시'
today('Asia/Seoul');
```

## 일요일 기준 달력과 월요일 업무 주차

`'ko-KR'` 로케일의 기본 `weekStart`는 일요일(`7`)이지만, 업무 주간 집계·정산·ISO `weekOfYear` 주차는 월요일(`1`)부터 셉니다. 달력 UI와 업무 집계의 주 경계가 어긋나지 않도록 용도에 맞춰 시작 요일을 확인하세요.

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

호출마다 영어 요일명 `'monday'`를 전달하거나 [`configure()`](/api/configure/)에서 전역 시작 요일을 고정할 수 있습니다. 인스턴스 단위로 한국어 표기와 월요일 시작 주간 계산을 함께 쓰려면 `'ko-KR-u-fw-mon'` 태그를 지정하세요.

```js
const wed = date('2026-11-18').locale('ko-KR-u-fw-mon');

wed.weekStart; // 1
wed.startOf('week').toString(); // '2026-11-16'
```

## 상대 날짜와 음력 표기

`CalendarDate`의 `from()`은 달력 일수를 기준으로 계산해 이틀 전후까지 ‘그저께’와 ‘모레’를 반환합니다. 반면 [`DateTime`](/api/date-time/)은 경과 초를 기준으로 계산하므로 0초일 때만 ‘지금’을 쓰고 나머지는 `'2일 전'`처럼 숫자 단위로 출력합니다.

```js
import { date, datetime } from 'native-dates';

const day = date('2026-11-16').locale('ko-KR');
day.minus(2, 'days').from(day); // '그저께'
day.plus(2, 'days').from(day); // '모레'

const moment = datetime('2026-11-16T12:00', 'Asia/Seoul').locale('ko-KR');
moment.minus(2, 'days').from(moment); // '2일 전'
```

음력 날짜와 윤달(‘윤6월’)은 `'ko-KR-u-ca-dangi'` 태그로 포맷합니다. `'short'` 프리셋은 연도 대신 육십갑자 순번(1~60)을 출력하므로 `'long'` 프리셋이나 `{ month, day }` 옵션을 사용하세요.

```js
const chuseok = date('2026-09-25');
const leapDay = date('2025-07-25');

chuseok.format('long', 'ko-KR-u-ca-dangi'); // '병오년 8월 15일'
chuseok.format({ month: 'long', day: 'numeric' }, 'ko-KR-u-ca-dangi'); // '8월 15일'
leapDay.format('long', 'ko-KR-u-ca-dangi'); // '을사년 윤6월 1일'
```

:::tip[음력 반복 기념일 포맷 시 주의사항]
[`MonthDay`](/api/month-day/)와 [`YearMonth`](/api/year-month/)는 음력 로케일 태그를 전달해도 양력 기준을 유지합니다. 음력 생일이나 명절을 표시할 때는 해당 연도의 양력 [`CalendarDate`](/api/calendar-date/)에서 포맷하세요.
:::
