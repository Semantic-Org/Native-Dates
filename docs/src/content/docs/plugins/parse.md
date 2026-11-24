---
title: parse
kind: plugin
lede: Parse fixed-layout date and time strings strictly using token patterns with `{ format }`.
import: import '@native-dates/plugins/parse'
size: parse
updated: 2026-11-24
---

## Parsing with a format pattern

Core parses strict ISO 8601 strings by default, while [`@native-dates/plugins/loose`](/plugins/loose/) reads free-form text in the active locale. Importing this plugin adds a `{ format }` option for fixed-layout strings such as bank exports and server logs.

```js title="parse.js"
import '@native-dates/plugins/parse';
import { date, datetime, monthDay, time, yearMonth } from 'native-dates';

date('24112026', { format: 'DDMMYYYY' }).toString(); // '2026-11-24'
datetime('24/Nov/2026:12:40:01 -0500', {
  format: 'DD/MMM/YYYY:HH:mm:ss ZZ',
  zone: 'America/New_York',
  locale: 'en-US',
}).toString(); // '2026-11-24T17:40:01.000Z'
time('1430', { format: 'HHmm' }).toString(); // '14:30:00'
yearMonth('11/2026', { format: 'MM/YYYY' }).toString(); // '2026-11'
monthDay('29/02', { format: 'DD/MM' }).toString(); // '02-29'
```

Strict ISO parsing stays the default wherever you omit the format option. Calling any factory with `{ format }` before importing this plugin throws a [`missingPlugin`](/api/errors/#plugins) error.

## Strict matching and named formats

Patterns use the core [token vocabulary](/guides/formatting/#token-patterns). Fixed-width tokens require exact digit counts, and literal text must match the full string case-sensitively.

Impossible dates like February 30 and mismatched weekdays throw instead of rolling forward. Repeated tokens or conflicting 12-hour and 24-hour clock fields are rejected the same way.

```js
import { configure, date, dateRange } from 'native-dates';

date('Tue 2026-11-24', { format: 'ddd YYYY-MM-DD', locale: 'en-US' }).toString();
// '2026-11-24'
date('6/9/26', { format: 'D/M/YY' }).toString(); // '2026-09-06'

configure({ formats: { bank: 'DDMMYYYY' } });
date('24112026', { format: 'bank' }).toString(); // '2026-11-24'
dateRange('24112026', '30112026', { format: 'bank' }).toString();
// '2026-11-24/2026-11-30'
configure({ formats: null });
```

Named patterns registered in [`configure()`](/api/configure/) work for both parsing and formatting. Range factories forward the format option to both endpoints, including duration lengths as the second argument.

## Localized names and ordinals

Month names, weekday names, day periods, and ordinals follow the active locale. Both standalone and inflected month forms match case-insensitively, so Russian and Greek dates parse without extra rules.

The active locale follows the same order as formatting: the per-call option, then [`configure()`](/api/configure/), then the runtime default. Pass a locale explicitly whenever input text comes from a fixed language such as English server logs.

```js
import { date, time, yearMonth } from 'native-dates';

date('November 24th, 2026', { format: 'MMMM Do, YYYY', locale: 'en-US' }).toString();
// '2026-11-24'
date('6 ноября 2026', { format: 'D MMMM YYYY', locale: 'ru' }).toString();
// '2026-11-06'
date('6. November 2026', { format: 'Do MMMM YYYY', locale: 'de' }).toString();
// '2026-11-06'
date('2026年11月6日', { format: 'YYYY[年]M[月]Do', locale: 'ja' }).toString();
// '2026-11-06'
yearMonth('février 2026', { format: 'MMMM YYYY', locale: 'fr' }).toString();
// '2026-02'
time('9:05:12.5 pm', { format: 'h:mm:ss.S a', locale: 'en-US' }).toString();
// '21:05:12.500'
```

English ordinal tokens validate the exact suffix, so `'24st'` is rejected, while custom [weekday names](/api/configure/) registered in app settings apply automatically.

## ISO week and ordinal dates

Ordinal day-of-year and ISO week patterns resolve straight to calendar dates or moments. Beside a week token, `YYYY` reads the ISO week-year rather than the calendar year written by `format()`, so `'2026-W01-1'` resolves to December 29, 2025.

Leap years and 52- or 53-week years are checked strictly, and omitting a weekday on an ISO week lands on Monday.

```js
import { date } from 'native-dates';

date('2026-328', { format: 'YYYY-DDDD' }).toString(); // '2026-11-24'
date('2026-W48-2', { format: 'YYYY-[W]WW-E' }).toString(); // '2026-11-24'
date('2026-W48', { format: 'YYYY-[W]WW' }).toString(); // '2026-11-23'
date('2026-W01-1', { format: 'YYYY-[W]WW-E' }).toString(); // '2025-12-29'
```

## Time zones and timestamps

Patterns with an offset token fix an exact instant and convert it into your target zone. Inline `z` tokens resolve IANA identifiers and, with [`@native-dates/plugins/zones`](/plugins/zones/), city names or abbreviations like JST, rather than arbitrary offset labels like GMT+2.

An inline zone stays on the result unless you pass a target zone option to convert into. If a string carries both an offset and a zone name that disagree for that instant, parsing throws.

```js
import '@native-dates/plugins/zones';
import { datetime } from 'native-dates';

datetime('24 Nov 2026 15:45 JST', {
  format: 'DD MMM YYYY HH:mm z',
  locale: 'en-US',
}).zone; // 'Asia/Tokyo'

datetime('24 Nov 2026 15:45 JST', {
  format: 'DD MMM YYYY HH:mm z',
  zone: 'UTC',
  locale: 'en-US',
}).toString(); // '2026-11-24T06:45:00.000Z'

datetime('1795542001', { format: 'X', zone: 'UTC' }).toString();
// '2026-11-24T17:40:01.000Z'
datetime('24112026', { format: 'DDMMYYYY', zone: 'America/New_York' }).toString();
// '2026-11-24T05:00:00.000Z'
```

Unix timestamps parse through `X` for whole seconds and `x` for milliseconds. Passing a date-only pattern to a [datetime factory](/api/datetime-fn/) starts at the beginning of that day in the target zone.

## Combining with loose mode

Load [`@native-dates/plugins/loose`](/plugins/loose/) alongside this plugin to return `null` instead of throwing when input text does not match the format. Missing values, numbers, impossible dates, and rejected DST transitions return null from factory functions, while existing date and time instances pass through unchanged.

```js
import '@native-dates/plugins/loose';
import { date, datetime } from 'native-dates';

date('not-a-date', { format: 'DDMMYYYY', loose: true }); // null
date('30022026', { format: 'DDMMYYYY', loose: true }); // null
datetime('08/03/2026 02:30', {
  format: 'DD/MM/YYYY HH:mm',
  zone: 'America/New_York',
  disambiguation: 'reject',
  loose: true,
}); // null
```

:::note[Bad data returns null, bad patterns still throw]
Loose mode only turns mismatched input strings into null. An empty or incomplete pattern throws [`unknownFormat`](/api/errors/#units-zones-and-formats), and a token the target type does not carry throws [`unsupportedToken`](/api/errors/#units-zones-and-formats).
:::

## Supported tokens

Tokens follow the formatting vocabulary, with leading and trailing whitespace trimmed automatically unless the pattern itself starts or ends with whitespace.

| Token | Example | Matches |
|---|---|---|
| `YYYY` | `'2026'` | Four-digit calendar year, or ISO week-year when paired with `W` or `WW`. |
| `YY` | `'26'` | Two-digit year, reading 69 through 99 as 1969–1999 and 00 through 68 as 2000–2068. |
| `M`, `MM` | `'9'`, `'09'` | Month number from 1 through 12, unpadded or zero-padded to two digits. |
| `MMM`, `MMMM` | `'Nov'`, `'November'` | Localized short or full Gregorian month name, including inflected forms. |
| `D`, `DD` | `'6'`, `'06'` | Day of the month from 1 through 31, unpadded or zero-padded to two digits. |
| `Do` | `'24th'`, `'6.'` | Day of the month with English ordinals or the active locale's day marker. |
| `DDD`, `DDDD` | `'1'`, `'328'` | ISO ordinal day of the year from 1 through 366, unpadded or zero-padded to three digits. |
| `W`, `WW` | `'5'`, `'48'` | ISO week of the year from 1 through 53, unpadded or zero-padded to two digits. |
| `E` | `'2'` | ISO day of the week from 1 for Monday through 7 for Sunday. |
| `d` | `'0'` | Day of the week from 0 for Sunday through 6 for Saturday. |
| `dd`, `ddd`, `dddd` | `'Tu'`, `'Tue'`, `'Tuesday'` | Localized shortest, abbreviated, or full weekday name. |
| `H`, `HH` | `'9'`, `'09'` | 24-hour clock hour from 0 through 23, unpadded or zero-padded to two digits. |
| `h`, `hh` | `'9'`, `'09'` | 12-hour clock hour from 1 through 12, unpadded or zero-padded to two digits. |
| `m`, `mm` | `'5'`, `'05'` | Minute from 0 through 59, unpadded or zero-padded to two digits. |
| `s`, `ss` | `'8'`, `'08'` | Second from 0 through 59, unpadded or zero-padded to two digits. |
| `S`, `SS`, `SSS` | `'5'`, `'25'`, `'250'` | Fractional seconds in tenths, hundredths, or milliseconds. |
| `A`, `a` | `'PM'`, `'pm'` | Case-insensitive AM or PM in English, or the active locale's day period. |
| `Z`, `ZZ` | `'-05:00'`, `'-0500'` | UTC offset with or without a colon, or `Z` for UTC. |
| `z`, `zz` | `'UTC'`, `'JST'` | Non-whitespace IANA zone ID, or a city or abbreviation when `@native-dates/plugins/zones` is loaded. Does not parse offset labels like `'GMT+2'`. |
| `X`, `x` | `'1795542001'` | Unix timestamp in whole seconds or milliseconds, including negative values. |
| `[text]` | `'[W]'` | Escaped literal text matched case-sensitively. Bare `T` also passes through unescaped. |

Formatting-only tokens such as quarters and long zone names cannot be parsed and throw [`unknownFormat`](/api/errors/#units-zones-and-formats). Patterns missing required fields for the target type throw the same error, while tokens the target type does not carry throw [`unsupportedToken`](/api/errors/#units-zones-and-formats).

## Factory options

:::entry
### `datetime()` :kind[function]

```js signature
datetime(input, { format, zone?, locale?, disambiguation?, loose? }): DateTime
date(input, { format, locale?, loose? }): CalendarDate
time(input, { format, locale?, loose? }): Time
yearMonth(input, { format, locale?, loose? }): YearMonth
monthYear(input, { format, locale?, loose? }): YearMonth
monthDay(input, { format, locale?, loose? }): MonthDay
dayMonth(input, { format, locale?, loose? }): MonthDay
dateRange(start, end, { format, locale?, loose? }): DateRange
datetimeRange(start, end, { format, zone?, locale?, disambiguation?, loose? }): DateTimeRange
timeRange(start, end, { format, locale?, loose? }): TimeRange
```

Parses string input against a token pattern or named format across every date, time, partial-date, and range factory. Already-parsed date, time, `Date`, and `Temporal` values pass through after the pattern is validated, while numbers are rejected.

**Parameters**

```params
- name: format
  type: string
  required: true
  description: "Token pattern such as `'DDMMYYYY'` or a named pattern registered in `configure({ formats })`."
- name: zone
  type: Zone
  description: Time zone used to interpret local date-time strings or convert offset and epoch timestamps.
- name: locale
  type: Locale
  description: BCP 47 locale tag carried on the value and used for month names, weekday names, day periods, and ordinals.
- name: disambiguation
  type: Disambiguation
  default: "'compatible'"
  description: "How to resolve DST gaps and folds on local date-time strings. `'reject'` throws `invalidDateTime`, or returns `null` with loose mode."
- name: loose
  type: boolean
  default: "false"
  description: "Requires `@native-dates/plugins/loose`. Return `null` when input does not match the format instead of throwing."
```

**Returns**

```returns
type: DateTime | CalendarDate | Time | YearMonth | MonthDay | Range
description: "Parsed instance, or `null` when `{ loose: true }` is set on a factory and the input does not match."
```

```js
date('24112026', { format: 'DDMMYYYY' }).toString(); // '2026-11-24'
yearMonth('202611', { format: 'YYYYMM' }).toString(); // '2026-11'
timeRange('0930', '1700', { format: 'HHmm' }).toString(); // '09:30:00/17:00:00'
```
:::
