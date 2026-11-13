---
title: Formatting
lede: Format dates, times, ranges, and durations with Intl presets, locale tags, token patterns, and relative phrases.
updated: 2026-11-12
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

Pass a BCP 47 locale tag as the second argument to format a single call in another language. To change the default across your app, call [`configure()`](/api/configure/) at startup:

```js
import { configure, datetime } from 'native-dates';

const standup = datetime('2026-11-16T09:30', 'Europe/Berlin');
standup.format('long', 'de-DE'); // '16. November 2026 um 09:30'
standup.format('long', 'ja-JP'); // '2026年11月16日 9:30'

configure({ locale: 'en-GB' });
```

When none of the presets fit your layout, pass an options object directly to the underlying formatter:

```js
import { date } from 'native-dates';

const day = date('2026-11-16');

day.format({ weekday: 'long' }, 'en-US'); // 'Monday'
day.format({ month: 'short', day: 'numeric' }, 'en-US'); // 'Nov 16'
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

Month and weekday names inside token patterns come from `Intl` in your active or requested locale.

| Token | Example | Output |
|---|---|---|
| `YYYY` | `'2026'` | Four-digit year, signed for negative years. |
| `YY` | `'26'` | Two-digit year. |
| `Q` | `'4'` | Calendar quarter from 1 through 4. |
| `M`, `MM` | `'11'`, `'05'` | Month number, unpadded or zero-padded to two digits. |
| `MMM`, `MMMM` | `'Nov'`, `'November'` | Localized short or full month name. |
| `D`, `DD` | `'5'`, `'05'` | Day of the month, unpadded or zero-padded. |
| `Do` | `'16th'` | Day of the month with an English ordinal suffix. |
| `DDD`, `DDDD` | `'320'`, `'045'` | Day of the year, unpadded or zero-padded to three digits. |
| `d` | `'1'` | Day of the week from 0 to 6, starting on Sunday at 0. |
| `dd`, `ddd`, `dddd` | `'Mo'`, `'Mon'`, `'Monday'` | Localized two-letter, short, or full weekday name. |
| `W`, `WW` | `'47'`, `'05'` | ISO week of the year, unpadded or zero-padded. |
| `H`, `HH` | `'9'`, `'09'` | Hour on the 24-hour clock, unpadded or zero-padded. |
| `h`, `hh` | `'9'`, `'09'` | Hour on the 12-hour clock from 1 through 12. |
| `m`, `mm` | `'5'`, `'05'` | Minute, unpadded or zero-padded. |
| `s`, `ss` | `'8'`, `'08'` | Second, unpadded or zero-padded. |
| `S`, `SS`, `SSS` | `'4'`, `'42'`, `'420'` | Tenths, hundredths, or milliseconds. |
| `A`, `a` | `'AM'`, `'am'` | Uppercase or lowercase meridiem marker. |
| `Z`, `ZZ` | `'-08:00'`, `'-0800'` | UTC offset with or without a colon. |
| `z`, `zz` | `'PST'` | Localized short time zone name. |
| `zzz`, `zzzz` | `'Pacific Standard Time'` | Localized full time zone name. |
| `X` | `'1794850200'` | Unix timestamp in whole seconds. |
| `x` | `'1794850200000'` | Unix timestamp in milliseconds. |
| `[text]` | `'[at]'` | Escaped literal text copied straight to the output. |

Unrecognized letters outside square brackets throw an `unknownFormat` error so a misspelled preset fails right away instead of printing raw letters. Only `'T'` passes through unescaped for ISO timestamps.

Asking for a field a type does not carry throws a `noField` error instead of inventing midnight. Formatting clock tokens like `'HH:mm'` on a calendar date fails immediately.

Core also exports [`monthNames()`](/api/month-names/) and its weekday counterpart for building localized calendar headers and month dropdowns:

```js
import { monthNames, weekdayNames } from 'native-dates';

monthNames('short', 'en-US'); // ['Jan', 'Feb', 'Mar', ...]
weekdayNames('short', 'monday', 'en-US'); // ['Mon', 'Tue', 'Wed', ...]
```

## Formatting ranges

Every [range](/api/ranges/) formats presets and options through `Intl`, collapsing shared month or year parts automatically. Passing a token pattern formats both endpoints across `' – '`:

```js
import { date } from 'native-dates';

const week = date('2026-09-01').to('2026-09-07');

week.format('medium', 'en-US'); // 'Sep 1 – 7, 2026'
week.format('YYYY-MM-DD'); // '2026-09-01 – 2026-09-07'
```

## Relative phrases

Import [`@native-dates/plugins/relative`](/plugins/relative/) to add `formatRelative()` to dates and moments. It turns elapsed distances into natural phrases such as "3 hours ago" or "yesterday":

```js
import '@native-dates/plugins/relative';
import { date, datetime } from 'native-dates';

const anchor = datetime('2026-11-16T12:00', 'UTC');
anchor.minus(3, 'hours').formatRelative(anchor, 'en-US'); // '3 hours ago'
anchor.plus(45, 'minutes').formatRelative(anchor, 'en-US'); // 'in 1 hour'

const currentDay = date('2026-11-16');
currentDay.minus(1, 'day').formatRelative(currentDay, 'en-US'); // 'yesterday'
currentDay.plus(2, 'days').formatRelative(currentDay, 'en-US'); // 'in 2 days'
```

Omit the first argument to compare against the current moment or today's date automatically. See [Parsing](/guides/parsing/) next for reading incoming strings and external values back into code.
