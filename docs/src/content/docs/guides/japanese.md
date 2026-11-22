---
title: Japanese
lede: Format imperial eras and parenthesized weekdays in Japanese while handling slash dates and Sunday week starts.
updated: 2026-11-22
---

Pass `'ja-JP'` through [Localization](/guides/localization/) to format dates in Japanese. Gregorian years stay the default while `'ja-u-ca-japanese'` switches presets to imperial eras on demand.

## Imperial eras and first years

Pass `'ja-u-ca-japanese'` to format official imperial dates, such as Heisei 31 on April 30, 2019 and Reiwa first year *元年* the next day:

```js
import { date } from 'native-dates';

date('2019-04-30').format('long', 'ja-u-ca-japanese'); // '平成31年4月30日'
date('2019-05-01').format('long', 'ja-u-ca-japanese'); // '令和元年5月1日'
date('2026-11-16').format('short', 'ja-u-ca-japanese'); // 'R8/11/16'
date('2026-11-16').format('llll', 'ja-u-ca-japanese'); // '令和8年11月16日(月)'
```

Token templates like `'YYYY年M月D日'` and the `year` property always read Gregorian years, even with an imperial locale attached. Use presets or options objects when you want era names:

```js
const reiwa = date('2026-11-16').locale('ja-u-ca-japanese');

reiwa.year; // 2026
reiwa.format('long'); // '令和8年11月16日'
reiwa.format('YYYY年M月D日'); // '2026年11月16日'
```

`YearMonth` has no day and formats with the era active on day 1. For mid-month transitions like January 1989 from Showa 64 to Heisei 1, pick a day with `on()` first:

```js
import { yearMonth } from 'native-dates';

const jan1989 = yearMonth('1989-01');

jan1989.format('long', 'ja-u-ca-japanese'); // '昭和64年1月'
jan1989.on(8).format('long', 'ja-u-ca-japanese'); // '平成元年1月8日'
```

## Parenthesized weekdays and 12-hour time

Standard Japanese presets differ in their separators and weekday styles:

| Preset | Output | Style and typical use |
|---|---|---|
| `'medium'` | `'2026/11/16'` | Compact slash notation for tables and form fields. |
| `'long'` | `'2026年11月16日'` | Standard kanji year-month-day date with no weekday. |
| `'full'` | `'2026年11月16日月曜日'` | Appends the full weekday like Monday *月曜日* with no spaces or parentheses. |
| `'llll'` | `'2026年11月16日(月)'` | Common UI style with single-kanji Monday *月* in halfwidth parentheses. |

Token `'ddd'` returns a bare weekday kanji like *月* so you can wrap it in fullwidth parentheses. Long month and ordinal day tokens already append *月* and *日*, so pair numeric month and day tokens with literal kanji:

```js
import { date } from 'native-dates';

const day = date('2026-11-16').locale('ja-JP');

day.format('YYYY年M月D日（ddd）'); // '2026年11月16日（月）'
day.format('MMMMDo(ddd)'); // '11月16日(月)'
day.format({ month: 'long', day: 'numeric', weekday: 'short' }); // '11月16日(月)'
```

Time defaults to 24-hour notation. Pass `hour12: true` for Japanese 0-based *午前0:30* and *午後0:30*, or use `'Ah:mm'` to count from 1 to 12:

```js
import { datetime } from 'native-dates';

const midnight = datetime('2026-11-16T00:30', 'Asia/Tokyo').locale('ja-JP');

midnight.format('time'); // '0:30'
midnight.format({ hour: 'numeric', minute: '2-digit', hour12: true }); // '午前0:30'
midnight.format('Ah:mm'); // '午前12:30'
```

## Slash notation and Japanese input

Kanji year-first dates, slashes, and dots from Japanese CSVs and forms parse directly in core without plugins:

```js
import { date, datetime, yearMonth } from 'native-dates';

date('2026年11月16日').toString(); // '2026-11-16'
date('2026/1/5').toString(); // '2026-01-05'
datetime('2026年11月16日 9:30', 'Asia/Tokyo').toString(); // '2026-11-16T00:30:00.000Z'
yearMonth('2026年11月').toString(); // '2026-11'
```

With [the loose plugin](/plugins/loose/), fullwidth digits and punctuation, *午前* / *午後* clocks, and kanji month-days read without manual normalization:

```js
import '@native-dates/plugins/loose';
import { date, monthDay, time } from 'native-dates';

date('２０２６／１１／１６', { loose: true })?.toString(); // '2026-11-16'
time('午後2:30', { loose: true, locale: 'ja' })?.toString(); // '14:30:00'
monthDay('11月16日', { loose: true })?.toString(); // '11-16'
```

Era strings like `'令和8年11月16日'` still need structured input. When a form collects era and year separately, pass a Japanese `Temporal.PlainDate` straight to `date()` without converting calendars first:

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

## Time zones and start of the week

Core accepts `'Asia/Tokyo'` and fixed offsets. With [the zones plugin](/plugins/zones/), `'JST'`, `'東京'`, and major Japanese cities like Osaka, Kyoto, and Fukuoka resolve out of the box:

```js
import '@native-dates/plugins/zones';
import { datetime } from 'native-dates';

datetime('2026-11-16T09:30', 'JST').zone; // 'Asia/Tokyo'
datetime('2026-11-16T09:30', 'Osaka').zone; // 'Asia/Tokyo'
datetime('2026-11-16T09:30', '東京').zone; // 'Asia/Tokyo'
```

Japanese locales start weeks on Sunday like wall calendars. Pass `'monday'` or pin `weekStart` when building Monday-first business schedules:

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

## Ranges and relative expressions

Range presets join slash dates or kanji times with a fullwidth tilde. Pass a token template to `format()` when both ends need kanji dates and weekdays:

```js
import { dateRange, timeRange } from 'native-dates';

const span = dateRange('2026-11-16', '2026-11-20').locale('ja-JP');

span.format('long'); // '2026/11/16～2026/11/20'
span.format('M月D日(ddd)'); // '11月16日(月) – 11月20日(金)'
timeRange('09:00', '17:30').format('short', 'ja-JP'); // '9時00分～17時30分'
```

`CalendarDate` returns natural words out to *一昨日* for two days ago and *明後日* for two days ahead. `DateTime` always outputs counted units so hour differences never misread as calendar days:

```js
import { date, datetime, duration } from 'native-dates';

const baseDate = date('2026-11-16').locale('ja-JP');
baseDate.minus(2, 'days').from(baseDate); // '一昨日'
baseDate.plus(2, 'days').from(baseDate); // '明後日'

const baseTime = datetime('2026-11-16T12:00', 'Asia/Tokyo').locale('ja-JP');
baseTime.minus(1, 'day').from(baseTime); // '1 日前'
duration({ hours: 2, minutes: 30 }).format('long', 'ja-JP'); // '2 時間 30 分'
```

:::tip[Spaces and fullwidth tilde code points]
Japanese relative and duration strings place halfwidth spaces around numbers per standard engine data. Range presets emit the `U+FF5E` fullwidth tilde rather than the `U+301C` wave dash, so check the code point in assertions.
:::
