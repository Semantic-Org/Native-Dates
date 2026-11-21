---
title: Dates and times in Japanese
lede: Format imperial eras and parenthesized weekdays in Japanese apps while normalizing fullwidth input and aligning week starts.
updated: 2026-11-21
---

Beyond general [Internationalization](/guides/internationalization/), Japanese apps balance imperial era transitions and parenthesized weekdays with fullwidth IME input and Sunday week starts.

## Imperial eras and first years

Pass `'ja-u-ca-japanese'` to format official imperial dates. Era transitions, first-year 元年 labels, and single-letter short codes switch automatically:

```js
import { date } from 'native-dates';

date('2019-04-30').format('long', 'ja-u-ca-japanese');
// '平成31年4月30日' (Heisei 31, Apr 30)
date('2019-05-01').format('long', 'ja-u-ca-japanese');
// '令和元年5月1日' (Reiwa year 1, May 1)
date('2026-11-16').format('short', 'ja-u-ca-japanese'); // 'R8/11/16' (Reiwa 8)
date('2026-11-16').format('llll', 'ja-u-ca-japanese');
// '令和8年11月16日(月)' (Reiwa 8, Mon)
```

Token templates like `'YYYY年M月D日'` and the year property always read Gregorian years, even with an imperial locale attached, so use presets or options objects for eras:

```js
const reiwa = date('2026-11-16').locale('ja-u-ca-japanese');

reiwa.year; // 2026
reiwa.format('long'); // '令和8年11月16日' (Reiwa 8)
reiwa.format('YYYY年M月D日'); // '2026年11月16日' (Gregorian 2026)
```

`YearMonth` lacks a day and formats with the era active on day 1. For mid-month transitions like January 1989, pick a day with `on()` first:

```js
import { yearMonth } from 'native-dates';

const jan1989 = yearMonth('1989-01');
jan1989.format('long', 'ja-u-ca-japanese'); // '昭和64年1月' (Showa 64, Jan)
jan1989.on(8).format('long', 'ja-u-ca-japanese');
// '平成元年1月8日' (Heisei year 1, Jan 8)
```

## Parenthesized weekdays and 12-hour time

Standard Japanese presets differ in their separators and weekday styles:

| Preset | Output | Style and typical use |
|---|---|---|
| `'medium'` | `'2026/11/16'` | Compact slash notation for tables and form fields. |
| `'long'` | `'2026年11月16日'` | Standard kanji year-month-day date with no weekday. |
| `'full'` | `'2026年11月16日月曜日'` | Appends the full weekday like Monday `月曜日` with no spaces or parentheses. |
| `'llll'` | `'2026年11月16日(月)'` | Common UI style with single-kanji Monday `月` in halfwidth parentheses. |

`'ddd'` returns a bare weekday kanji like Monday 月 for custom fullwidth brackets. `'MMMM'` and `'Do'` already include 月 and 日, so use numeric tokens beside literal kanji to avoid 11月月 duplicates:

```js
import { date } from 'native-dates';

const day = date('2026-11-16').locale('ja-JP');
day.format('YYYY年M月D日（ddd）');
// '2026年11月16日（月）' (Mon in fullwidth parens)
day.format('MMMMDo(ddd)'); // '11月16日(月)' (Nov 16, Mon)
day.format({ month: 'long', day: 'numeric', weekday: 'short' }); // '11月16日(月)'
```

Time defaults to 24-hour notation. Pass `hour12: true` to format midnight and noon as 0-based 午前0時 and 午後0時 per Japanese convention, whereas `'Ah:mm'` counts from 1 to 12:

```js
import { datetime } from 'native-dates';

const midnight = datetime('2026-11-16T00:30', 'Asia/Tokyo').locale('ja-JP');
midnight.format('time'); // '0:30'
midnight.format({ hour: 'numeric', minute: '2-digit', hour12: true });
// '午前0:30' (0:30 AM)
midnight.format('Ah:mm'); // '午前12:30' (12:30 AM)
```

## Slash notation and parsing Japanese input

Year-first slash and dot strings from Japanese CSVs and business apps parse directly in core without plugins:

```js
import { date, datetime, yearMonth } from 'native-dates';

date('2026/11/16'); // CalendarDate(2026-11-16)
date('2026/1/5'); // CalendarDate(2026-01-05)
datetime('2026/11/16 9:30', 'Asia/Tokyo'); // 2026-11-16T00:30:00.000Z
yearMonth('2026/11'); // YearMonth(2026-11)
```

Kanji dates, era strings, and unconfirmed fullwidth IME digits throw in core, and the [loose plugin](/plugins/loose/) returns `null`.

Normalize fullwidth input to halfwidth with NFKC first, and convert split era fields to Gregorian through `Temporal.PlainDate`:

```js
import '@native-dates/plugins/loose';
import { date } from 'native-dates';

date('２０２６／１１／１６'.normalize('NFKC')); // CalendarDate(2026-11-16)
date('2026年11月16日', { loose: true }); // null

const reiwaInput = Temporal.PlainDate.from({
  calendar: 'japanese', era: 'reiwa', eraYear: 8, month: 11, day: 16,
}).withCalendar('iso8601');
date(reiwaInput).toString(); // '2026-11-16'
```

## Japanese time zones and start of the week

Core accepts `'Asia/Tokyo'` and fixed offsets, while the [zones plugin](/plugins/zones/) adds JST. Because IANA lists only Tokyo for Japan, alias regional cities like Osaka or Fukuoka to avoid `unknownZone`:

```js
import '@native-dates/plugins/zones';
import { configure, datetime } from 'native-dates';

datetime('2026-11-16T09:30', 'JST').zone; // 'Asia/Tokyo'
configure({ zoneAliases: { osaka: 'Asia/Tokyo', fukuoka: 'Asia/Tokyo' } });
datetime('2026-11-16T09:30', 'osaka').zone; // 'Asia/Tokyo'
configure({ zoneAliases: null });
```

Japanese locales start weeks on Sunday like wall calendars, so pass `'monday'` or pin `weekStart` for Monday business schedules:

```js
import { date, weekdayNames } from 'native-dates';

const wed = date('2026-11-18').locale('ja-JP');
wed.weekStart; // 7 (Sunday)
wed.startOf('week').toString(); // '2026-11-15'
wed.startOf('week', 'monday').toString(); // '2026-11-16'
weekdayNames('short', undefined, 'ja-JP');
// ['日', '月', '火', '水', '木', '金', '土'] (Sun to Sat)
weekdayNames('short', 'monday', 'ja-JP');
// ['月', '火', '水', '木', '金', '土', '日'] (Mon to Sun)
```

## Fullwidth tildes in ranges and relative expressions

Range presets join slash dates or kanji times with a fullwidth tilde. Pass a token template to `format()` when both ends need kanji dates and weekdays:

```js
import { date, time } from 'native-dates';

const span = date('2026-11-16').to('2026-11-20').locale('ja-JP');
span.format('long'); // '2026/11/16～2026/11/20'
span.format('M月D日(ddd)');
// '11月16日(月) – 11月20日(金)' (Nov 16 Mon to Nov 20 Fri)
time('09:00').to('17:30').format('short', 'ja-JP');
// '9時00分～17時30分' (9:00 to 17:30)
```

`CalendarDate` returns natural words from 一昨日 to 明後日 for two days back or ahead, while `DateTime` outputs numbers and units so hour offsets never misread as days:

```js
import { date, datetime, duration } from 'native-dates';

const baseDate = date('2026-11-16').locale('ja-JP');
baseDate.minus(2, 'days').from(baseDate); // '一昨日' (day before yesterday)
baseDate.plus(2, 'days').from(baseDate); // '明後日' (day after tomorrow)

const baseTime = datetime('2026-11-16T12:00', 'Asia/Tokyo').locale('ja-JP');
baseTime.minus(1, 'day').from(baseTime); // '1 日前' (1 day ago)
duration({ hours: 2, minutes: 30 }).format('long', 'ja-JP');
// '2 時間 30 分' (2 hr 30 min)
```

:::tip[Spaces and fullwidth tilde code points]
Japanese relative and duration strings place halfwidth spaces around numbers per standard engine data. Range presets emit the U+FF5E fullwidth tilde rather than the U+301C wave dash, so check the code point in assertions.
:::
