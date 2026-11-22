---
title: Korean
lede: Parse dotted Korean dates and format weekdays and lunar holidays.
updated: 2026-11-21
---

Pass `'ko-KR'` through [Localization](/guides/localization/) to format dates in Korean. Korean presets print spaced dots with a trailing period like `'2026. 11. 16.'` and place *오전* or *오후* before the hour.

## Dotted dates and Korean strings

Compact year-first dot strings parse directly in core, while Korean presets add standard spaces and a trailing dot:

```js
import { date } from 'native-dates';

date('2026.11.16').locale('ko-KR').text; // '2026. 11. 16.'
date('2026.1.5').toString(); // '2026-01-05'
```

Import [the loose plugin](/plugins/loose/) and enable loose mode to read spaced dotted dates and timestamps from Korean portals or bank statements:

```js
import '@native-dates/plugins/loose';
import { date, datetime } from 'native-dates';

date('2026. 11. 16.', { loose: true })?.toString(); // '2026-11-16'
datetime('2026. 11. 16. 14:30', { zone: 'Asia/Seoul', loose: true })?.toString();
// '2026-11-16T05:30:00.000Z'
```

Avoid two-digit years in dotted inputs: `'12.11.26'` collides with month-day-year order, so pass four-digit years or separate year, month, and day numbers:

| Input | Result | Handling |
|---|---|---|
| `'2026-11-16'`, `'2026.11.16'` | Parsed in core | Pass directly with no plugin. |
| `'2026. 11. 16.'`, `'2026. 11. 16. 14:30'` | Parsed in loose mode | Import the loose plugin and pass `{ loose: true }`. |
| `'26. 5. 5.'`, `'12.11.26'` | Ambiguous year | Expand to a four-digit year or pass numeric `(year, month, day)` arguments. |

## Parenthesized weekdays and AM/PM order

The `'full'` preset prints full weekday names like *화요일* for Tuesday. `'llll'` and short weekday options put single-character weekdays in parentheses and join ranges with a tilde:

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

Hangul passes through token patterns without brackets. Short month and ordinal day tokens already include *월* and *일*, and `'ddd'` formats the single-character weekday:

```js
import { datetime } from 'native-dates';

const slot = datetime('2026-05-05T14:05:00', 'Asia/Seoul').locale('ko-KR');

slot.format('YYYY. MM. DD. (ddd)'); // '2026. 05. 05. (화)'
slot.format('YYYY년 M월 D일 A h시 m분'); // '2026년 5월 5일 오후 2시 5분'
slot.format('MMM Do (dd)'); // '5월 5일 (화)'
```

Korean places *오전* for AM and *오후* for PM before the hour. Pass `'ko-KR-u-hc-h23'` to switch 12-hour presets to 24-hour time:

```js
slot.format('medium'); // '2026. 5. 5. 오후 2:05'
slot.format('medium', 'ko-KR-u-hc-h23'); // '2026. 5. 5. 14:05'
```

## Korea Standard Time and zone aliases

Core accepts `'Asia/Seoul'` and fixed offsets. Import [the zones plugin](/plugins/zones/) to resolve `'KST'` and custom aliases for domestic cities or Hangul names:

```js
import '@native-dates/plugins/zones';
import { configure, datetime } from 'native-dates';

configure({ zoneAliases: { busan: 'Asia/Seoul', 서울: 'Asia/Seoul' } });

datetime('2026-11-16T14:30', 'KST').zone; // 'Asia/Seoul'
datetime('2026-11-16T14:30', '서울').zone; // 'Asia/Seoul'
```

Short Korean zones print GMT+9, while `'zzz'` outputs the full Korean name *한국 표준시*. Because UTC servers stay on yesterday until 8:59 AM in Korea, pass Seoul to `today()`:

```js
import { datetime, today } from 'native-dates';

const meeting = datetime('2026-11-16T05:30:00Z', 'Asia/Seoul').locale('ko-KR');

meeting.text; // '2026년 11월 16일 오후 2:30 GMT+9'
meeting.format('A h:mm zzz'); // '오후 2:30 한국 표준시'
today('Asia/Seoul');
```

## Sunday calendars and Monday workweeks

Locale `'ko-KR'` starts weeks on Sunday like wall calendars. Korean workweeks, settlements, and ISO `weekOfYear` count from Monday:

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

Pass `'monday'` per call, pin the start day in [configuration](/api/configure/), or use `'ko-KR-u-fw-mon'` to carry Korean text with Monday weeks:

```js
const wed = date('2026-11-18').locale('ko-KR-u-fw-mon');

wed.weekStart; // 1
wed.startOf('week').toString(); // '2026-11-16'
```

## Relative dates and lunar holidays

Korean calendar dates return *그저께* for two days ago and *모레* for two days ahead. `DateTime` returns *지금* at zero seconds and counted units otherwise:

```js
import { date, datetime } from 'native-dates';

const day = date('2026-11-16').locale('ko-KR');
day.minus(2, 'days').from(day); // '그저께'
day.plus(2, 'days').from(day); // '모레'

const moment = datetime('2026-11-16T12:00', 'Asia/Seoul').locale('ko-KR');
moment.minus(2, 'days').from(moment); // '2일 전'
```

Pass `'ko-KR-u-ca-dangi'` for Seollal, Chuseok, and lunar birthdays, including leap months like *윤6월*. Short presets print the 1–60 cycle number instead of a year, so prefer `'long'` or month-day options:

```js
const chuseok = date('2026-09-25');
const leapDay = date('2025-07-25');

chuseok.format('long', 'ko-KR-u-ca-dangi'); // '병오년 8월 15일'
chuseok.format({ month: 'long', day: 'numeric' }, 'ko-KR-u-ca-dangi'); // '8월 15일'
leapDay.format('long', 'ko-KR-u-ca-dangi'); // '을사년 윤6월 1일'
```

:::tip[Formatting recurring lunar dates]
`MonthDay` and `YearMonth` stay Gregorian even when passed a lunar locale tag. Format lunar birthdays and holidays from that year's Gregorian `CalendarDate` instead.
:::
