---
title: Formatting
lede: Format dates, times, ranges, and durations with Intl presets, locale tags, token patterns, and relative phrases.
updated: 2026-11-20
---

Native Dates uses the platform's built-in `Intl` formatters and caches them automatically. You get localized output across languages and regions without adding locale files to your bundle.

## Quick output with text and presets

Every instance has a `.text` property formatted in your active locale, which is handy for templates, logs, and console debugging. Calling `format()` with no arguments uses each type's default preset:

```js
import { date, datetime, duration, time } from 'native-dates';

const standup = datetime('2026-11-16T09:30', 'America/Los_Angeles');
standup.text; // 'Nov 16, 2026, 9:30 AM PST'
standup.format(); // 'Nov 16, 2026, 9:30 AM'

date('2026-11-16').text; // 'Nov 16, 2026'
time('9:30am').text; // '9:30 AM'
duration('1h 30m').text; // '1 hour, 30 minutes'
```

Pass a preset name to `format()` to choose how much detail to display:

| Preset | Example | Supported types and output |
|---|---|---|
| `'short'` | `'5/4/26, 9:30 AM'` | Numeric date or short clock across dates, times, partial dates, and durations. |
| `'medium'` | `'May 4, 2026, 9:30 AM'` | Abbreviated month on dates and moments, or clock with seconds on `Time`. |
| `'long'` | `'May 4, 2026 at 9:30 AM'` | Full month name, clock with seconds on `Time`, or spelled-out units on `Duration`. |
| `'full'` | `'Monday, May 4, 2026 at 9:30 AM'` | Full weekday and month on dates and moments, or full month on partial dates. |
| `'date'` | `'May 4, 2026'` | Date portion on `DateTime` and `CalendarDate`. |
| `'time'` | `'9:30 AM'` | Short clock time on `DateTime` and `Time`. |
| `'month'` | `'May 2026'` | Full month name and year on `DateTime`, `CalendarDate`, and `YearMonth`. |
| `'text'` | `'May 4, 2026, 9:30 AM PDT'` | Date, time, and short zone name on `DateTime`, or each type's own fields elsewhere. |

Core also accepts the localized preset names used in Moment and Day.js:

| Preset | Example | Localized fields |
|---|---|---|
| `'LT'`, `'LTS'` | `'9:30 AM'`, `'9:30:00 AM'` | Short clock time, or clock time with seconds. |
| `'L'`, `'l'` | `'05/04/2026'`, `'5/4/2026'` | Numeric year, month, and day, padded or unpadded. |
| `'LL'`, `'ll'` | `'May 4, 2026'` | Long or abbreviated month name with day and year. |
| `'LLL'`, `'lll'` | `'May 4, 2026 at 9:30 AM'` | Long or abbreviated date paired with short clock time. |
| `'LLLL'`, `'llll'` | `'Monday, May 4, 2026 at 9:30 AM'` | Full or abbreviated weekday, date, and short clock time. |

Dates, times, [year-months](/api/year-month/), and [month-days](/api/month-day/) accept every preset above and keep only the fields they carry. [Durations](/api/duration/) also support compact and digital styles:

```js
import { date, duration, time, yearMonth } from 'native-dates';

date('2026-11-16').format('full', 'en-US'); // 'Monday, November 16, 2026'
yearMonth('2026-11').format('LL', 'en-US'); // 'November 2026'
time('9:30:15am').format('LTS', 'en-US'); // '9:30:15 AM'

const span = duration({ hours: 2, minutes: 15 });
span.format('narrow', 'en-US'); // '2h 15m'
span.format('digital', 'en-US'); // '2:15:00'
```

## Locales and Intl options

Set a default once with [`configure()`](/api/configure/), attach a language to a value with [`locale()`](/api/date-time/#locale), or pass a tag to a single format call. Read [Internationalization](/guides/internationalization/) for guidance on client apps versus multi-user servers:

```js
import { configure, datetime } from 'native-dates';

const standup = datetime('2026-11-16T09:30', 'Europe/Berlin');
standup.locale('de-DE').plus(1, 'week').format('long'); // '23. November 2026 um 09:30'
standup.format('long', 'ja-JP'); // '2026年11月16日 9:30'

configure({ locale: 'en-GB' });
configure({ locale: null });
```

When none of the presets fit your layout, pass an options object directly to the underlying formatter:

```js
import { date } from 'native-dates';

const day = date('2026-11-16');

day.format({ weekday: 'long' }, 'en-US'); // 'Monday'
day.format({ month: 'short', day: 'numeric' }, 'en-US'); // 'Nov 16'
```

Because each type carries only its own fields, presets adapt to local grammar, plurals, scripts, and calendars without locale files. See the [language examples](/examples/) to check specific edge cases in your target language:

```js
import { date, days, yearMonth } from 'native-dates';

date('2019-05-01').format('long', 'ja-u-ca-japanese'); // '令和元年5月1日'
yearMonth('2026-05').format('long', 'ru'); // 'май 2026 г.'
date('2026-05-01').format('long', 'ru'); // '1 мая 2026 г.'
days(2).format('long', 'ar'); // 'يومان'
```

:::tip[Human display vs wire strings]
Reserve `format()` for text shown to people. When storing values or sending them over the network, call `toString()` or serialize to JSON so payloads stay in stable ISO 8601 format. See [Storing and sending](/guides/storing-and-sending/).
:::

## Token patterns

When you need a fixed layout, pass a token pattern directly to `format()` with no plugins required. Wrap literal words in square brackets so they are copied as written:

```js
import { datetime, monthDay, yearMonth } from 'native-dates';

const standup = datetime('2026-11-16T09:30', 'America/Los_Angeles');

standup.format('YYYY-MM-DD HH:mm'); // '2026-11-16 09:30'
standup.format('YYYY-MM-DDTHH:mmZ'); // '2026-11-16T09:30-08:00'
standup.format('dddd, MMM D [at] h:mm A', 'en-US'); // 'Monday, Nov 16 at 9:30 AM'
yearMonth('2026-11').format('MMM YYYY', 'en-US'); // 'Nov 2026'
monthDay('11-16').format('MMMM Do', 'en-US'); // 'November 16th'
```

Month and weekday names inside token patterns come from `Intl` in the active locale. Digits and years stay in Western ISO form so patterns like `'YYYY-MM-DD'` stay machine-readable everywhere.

| Token | Example | Output |
|---|---|---|
| `YYYY` | `'2026'` | Four-digit year, signed for negative years. |
| `YY` | `'26'` | Two-digit year. |
| `Q` | `'4'` | Calendar quarter from 1 through 4. |
| `M`, `MM` | `'11'`, `'05'` | Month number, unpadded or zero-padded to two digits. |
| `MMM`, `MMMM` | `'Nov'`, `'November'` | Localized Gregorian month name, inflected automatically right after a day token. |
| `D`, `DD` | `'5'`, `'05'` | Day of the month, unpadded or zero-padded. |
| `Do` | `'16th'` | Day of the month with English ordinals, the locale's day marker like `'6.'` or `'6日'`, or custom [`ordinals`](/api/configure/). |
| `DDD`, `DDDD` | `'320'`, `'045'` | Day of the year, unpadded or zero-padded to three digits. |
| `E` | `'7'` | ISO day of the week from 1 on Monday through 7 on Sunday, matching `.dayOfWeek`. |
| `d` | `'0'` | Day of the week from 0 on Sunday through 6 on Saturday. |
| `dd`, `ddd`, `dddd` | `'Mo'`, `'Mon'`, `'Monday'` | Localized shortest, abbreviated, or full weekday name, customizable via [`weekdayNames`](/api/configure/). |
| `W`, `WW` | `'47'`, `'05'` | ISO week of the year, unpadded or zero-padded. |
| `H`, `HH` | `'9'`, `'09'` | Hour on the 24-hour clock, unpadded or zero-padded. |
| `h`, `hh` | `'9'`, `'09'` | Hour on the 12-hour clock from 1 through 12. |
| `m`, `mm` | `'5'`, `'05'` | Minute, unpadded or zero-padded. |
| `s`, `ss` | `'8'`, `'08'` | Second, unpadded or zero-padded. |
| `S`, `SS`, `SSS` | `'4'`, `'42'`, `'420'` | Tenths, hundredths, or milliseconds. |
| `A`, `a` | `'AM'`, `'am'` | Uppercase or lowercase `'AM'` and `'PM'` in English, or the locale's own day period like `'午後'` or `'م'`. |
| `Z`, `ZZ` | `'-08:00'`, `'-0800'` | UTC offset with or without a colon. |
| `z`, `zz` | `'PST'` | Localized short time zone name. |
| `zzz`, `zzzz` | `'Pacific Standard Time'` | Localized full time zone name. |
| `X` | `'1794850200'` | Unix timestamp in whole seconds. |
| `x` | `'1794850200000'` | Unix timestamp in milliseconds. |
| `[text]` | `'[at]'` | Escaped literal text copied straight to the output. |

Unrecognized letters outside square brackets throw an `unknownFormat` error so a misspelled preset fails right away instead of printing raw letters. Only `'T'` passes through unescaped for ISO timestamps.

Asking for a field a type does not carry throws an `unsupportedToken` error instead of inventing midnight. Formatting clock tokens like `'HH:mm'` on a calendar date fails immediately.

Core also exports [`monthNames()`](/api/month-names/) and its weekday counterpart for building localized calendar headers and month dropdowns:

```js
import { monthNames, weekdayNames } from 'native-dates';

monthNames('short', 'en-US'); // ['Jan', 'Feb', 'Mar', ...]
weekdayNames('short', undefined, 'en-US'); // ['Sun', 'Mon', 'Tue', ...]
weekdayNames('narrow', 'monday', 'en-US'); // ['Mo', 'Tu', 'We', ...]
```

## Naming your own formats

Register reusable format names in [`configure()`](/api/configure/) when your app uses the same date or time layout in multiple places. Each named format can be a token pattern or an `Intl` options object:

```js
import { configure, date } from 'native-dates';

configure({
  formats: {
    invoice: 'YYYY-MM-DD',
    receipt: { dateStyle: 'long' },
  },
});

date('2026-11-06').format('invoice'); // '2026-11-06'
date('2026-11-06').format('receipt'); // 'November 6, 2026'
date('2026-11-06').to('2026-11-20').format('invoice'); // '2026-11-06 – 2026-11-20'

configure({ formats: null });
```

Named formats take precedence over built-in presets, so registering `'short'` overrides that preset across the app. Custom named formats apply to dates, times, partial dates, and ranges, while durations use only their built-in styles.

## Formatting ranges

Every [range](/api/ranges/) formats presets and options through `Intl`, collapsing shared month or year parts automatically. Passing a token pattern formats both endpoints separated by `' – '`:

```js
import { date } from 'native-dates';

const week = date('2026-09-01').to('2026-09-07');

week.format('medium', 'en-US'); // 'Sep 1 – 7, 2026'
week.format('YYYY-MM-DD'); // '2026-09-01 – 2026-09-07'
```

## Relative phrases

Moments and calendar dates include [`from()`](/api/date-time/#from) and [`fromNow()`](/api/date-time/#fromnow) directly in core, with `formatRelative()` as an alias. Phrases are localized automatically through the runtime's relative time formatter:

```js
import { date, datetime, now, today } from 'native-dates';

now().minus(5, 'minutes').fromNow('en-US'); // '5 minutes ago'
today().plus(1, 'day').fromNow('en-US'); // 'tomorrow'

const anchor = datetime('2026-11-16T12:00', 'UTC');
anchor.minus(3, 'hours').from(anchor, 'en-US'); // '3 hours ago'
anchor.minus(23, 'hours').from(anchor, 'en-US'); // '1 day ago'

const currentDay = date('2026-11-16');
currentDay.minus(1, 'day').from(currentDay, 'en-US'); // 'yesterday'
currentDay.plus(14, 'days').from(currentDay, 'en-US'); // 'in 2 weeks'
```

Calendar dates measure whole days, so `from()` and `fromNow()` say yesterday, today, and tomorrow within seven days. Moments measure elapsed clock time and stick to numeric counts past `'now'`, since 23 hours ago can still fall on the same calendar day.

See [Parsing](/guides/parsing/) next for reading incoming strings and external values back into code.
