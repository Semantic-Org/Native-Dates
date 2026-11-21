---
title: Dates and times in Korean
lede: Parse spaced dotted dates and handle Korean weekdays, Monday workweeks, time zones, and lunar holidays.
updated: 2026-11-21
---

Once a locale is set via [Internationalization](/guides/internationalization/), Korean apps still handle spaced dotted dates, parenthesized weekdays, Monday workweeks, and lunar holidays.

## Dotted dates and Korean strings

Korean orthography formats default dates with spaces and a trailing period like `'2026. 11. 16.'`. Core reads compact dotted dates, while spaced strings throw:

```js
import { date } from 'native-dates';

date('2026.11.16').locale('ko-KR').text; // '2026. 11. 16.'
date('2026. 11. 16.'); // RangeError [invalidDate]
```

Import [the loose plugin](/plugins/loose/) and pass `{ loose: true }` to read four-digit dotted dates and 24-hour timestamps from portals or bank statements:

```js
import '@native-dates/plugins/loose';
import { date, datetime } from 'native-dates';

date('2026. 11. 16.', { loose: true }); // 2026-11-16
datetime('2026. 11. 16. 14:30', { zone: 'Asia/Seoul', loose: true });
// 2026-11-16T05:30:00.000Z
```

Two-digit years can misread as month-day-year, and Hangul dates return `null` across every type, so extract numeric fields with a regex first:

```js
date('2026년 11월 16일', { loose: true }); // null — Nov 16, 2026 in Hangul
date('12.11.26', { loose: true }); // 2026-12-11 — misread as M.D.Y

const [, y, m, d] = '2026년 11월 16일'.match(/(\d+)년\s*(\d+)월\s*(\d+)일/);
date(Number(y), Number(m), Number(d)); // 2026-11-16
```

| Input | Result | Handling |
|---|---|---|
| `'2026-11-16'`, `'2026.11.16'` | Parsed in core | Pass directly with no plugin. |
| `'2026. 11. 16.'`, `'2026. 11. 16. 14:30'` | Parsed in loose mode | Import the loose plugin and pass `{ loose: true }`. |
| `'26. 5. 5.'`, `'12.11.26'` | `null` or month-first misread | Expand to a four-digit year or pass numeric arguments. |
| `'2026년 11월 16일'`, `'오후 2:30'` | `null` | Extract digits with a regex for Hangul dates or PM times. |

## Parenthesized weekdays and AM/PM order

The full preset prints unparenthesized weekday names, whereas `'llll'` and short weekday options add single-character weekdays in parentheses and join ranges with a tilde:

```js
import { date } from 'native-dates';

const holiday = date('2026-05-05').locale('ko-KR');
holiday.format('llll'); // '2026년 5월 5일 (화)' — May 5, 2026 (Tue)
holiday.format({ month: 'long', day: 'numeric', weekday: 'short' });
// '5월 5일 (화)'

const week = date('2026-11-16').to('2026-11-20');
week.format({ month: 'long', day: 'numeric', weekday: 'short' }, 'ko-KR');
// '11월 16일 (월)~20일 (금)' — Mon–Fri
```

Hangul passes through token patterns without brackets. Because `MMM` and `Do` already include month and day units, omit trailing suffixes and use `ddd` for weekdays:

```js
import { datetime } from 'native-dates';

const slot = datetime('2026-05-05T14:05:00', 'Asia/Seoul').locale('ko-KR');
slot.format('YYYY. MM. DD. (ddd)'); // '2026. 05. 05. (화)' — Tue
slot.format('YYYY년 M월 D일 A h시 m분'); // '2026년 5월 5일 오후 2시 5분' — 2:05 PM
slot.format('MMM Do (dd)'); // '5월 5일 (화)' — May 5 (Tue)
```

Korean places 오전 and 오후 for AM and PM before the hour as `'A h:mm'`, while `'ko-KR-u-hc-h23'` switches 12-hour presets to 24-hour time:

```js
slot.format('medium'); // '2026. 5. 5. 오후 2:05' — 2:05 PM
slot.format('medium', 'ko-KR-u-hc-h23'); // '2026. 5. 5. 14:05'
```

## Korea Standard Time and zone aliases

Core accepts only `'Asia/Seoul'`. Import [the zones plugin](/plugins/zones/) to resolve KST, Seoul, and custom `zoneAliases`, passing the zone separately rather than inside strings:

```js
import '@native-dates/plugins/zones';
import { configure, datetime } from 'native-dates';

configure({ zoneAliases: { busan: 'Asia/Seoul', 서울: 'Asia/Seoul' } });
datetime('2026-11-16T14:30', 'KST').zone; // 'Asia/Seoul'
datetime('2026-11-16T14:30', '서울').zone; // 'Asia/Seoul' — Seoul in Hangul
```

Short Korean zones print GMT+9, while `zzz` outputs the Korean name. Because UTC servers stay on yesterday until 8:59 AM in Korea, specify Seoul explicitly:

```js
import { datetime, today } from 'native-dates';

const meeting = datetime('2026-11-16T05:30:00Z', 'Asia/Seoul').locale('ko-KR');
meeting.text; // '2026년 11월 16일 오후 2:30 GMT+9' — Nov 16, 2:30 PM
meeting.format('A h:mm zzz'); // '오후 2:30 한국 표준시' — Korea Standard Time
today('Asia/Seoul'); // today's date in Korea
```

## Sunday calendars and Monday workweeks

Locale `'ko-KR'` starts weeks on Sunday like wall calendars, whereas Korean workweeks, settlements, and ISO `weekOfYear` count from Monday, leaving Sunday out of sync:

```js
import { date, weekdayNames } from 'native-dates';

const sun = date('2026-11-15').locale('ko-KR');
sun.weekStart; // 7
sun.startOf('week').toString(); // '2026-11-15'
sun.weekOfYear; // 46 — ISO week 47 starts Monday
weekdayNames('short', undefined, 'ko-KR');
// ['일', '월', '화', '수', '목', '금', '토'] — Sun..Sat
weekdayNames('short', 'monday', 'ko-KR');
// ['월', '화', '수', '목', '금', '토', '일'] — Mon..Sun
```

Pass Monday per call, pin the week start in [app configuration](/api/configure/), or use `'ko-KR-u-fw-mon'` to carry Korean text with Monday weeks:

```js
const wed = date('2026-11-18').locale('ko-KR-u-fw-mon');
wed.weekStart; // 1
wed.startOf('week').toString(); // '2026-11-16'
```

## Relative dates and lunar holidays

Korean calendar dates name two days either side of today, whereas moments return 지금 for now at zero seconds and counted units otherwise:

```js
import { date, datetime } from 'native-dates';

const day = date('2026-11-16').locale('ko-KR');
day.minus(2, 'days').from(day); // '그저께' — 2 days ago; 어제/오늘/내일 for -1/0/+1
day.plus(2, 'days').from(day); // '모레' — day after tomorrow

const moment = datetime('2026-11-16T12:00', 'Asia/Seoul').locale('ko-KR');
moment.minus(2, 'days').from(moment); // '2일 전' — 2 days ago
```

Pass `'ko-KR-u-ca-dangi'` for Seollal or Chuseok and lunar birthdays. Short presets print the 1–60 cycle index instead of a year, so prefer the long preset or month-day options:

```js
const chuseok = date('2026-09-25');
const leapDay = date('2025-07-25');

chuseok.format('long', 'ko-KR-u-ca-dangi'); // '병오년 8월 15일' — lunar 8/15
chuseok.format({ month: 'long', day: 'numeric' }, 'ko-KR-u-ca-dangi');
// '8월 15일' — month 8, day 15
leapDay.format('long', 'ko-KR-u-ca-dangi'); // '을사년 윤6월 1일' — leap month 6/1
```

:::tip[Formatting recurring lunar dates]
`MonthDay` and `YearMonth` stay Gregorian even when passed a lunar locale tag. Format lunar birthdays and holidays from that year's Gregorian `CalendarDate` instead.
:::
