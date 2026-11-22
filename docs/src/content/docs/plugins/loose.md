---
title: loose
kind: plugin
lede: Opt-in locale-aware parsing and `null` returns for untrusted text from forms, CSVs, and legacy feeds.
import: import '@native-dates/plugins/loose'
size: loose
updated: 2026-11-22
---

## Opt-in loose parsing

Every factory parses strict ISO 8601 strings by default and throws on malformed input. Importing this plugin enables `{ loose: true }` for untrusted user text, CSV columns, and legacy headers.

```js title="loose.js"
import '@native-dates/plugins/loose';
import { date, datetime, duration, time } from 'native-dates';

date('September 6, 2026', { loose: true })?.toString(); // '2026-09-06'
datetime('Sat, 06 Sep 2026 14:30:00 GMT', { loose: true })?.toString();
// '2026-09-06T14:30:00.000Z'
time('September 6, 2026 5:30 PM', { loose: true })?.toString(); // '17:30:00'
duration('2h', { loose: true })?.toString(); // 'PT2H'
```

Strict parsing stays the default wherever you omit loose mode. Importing the plugin never alters existing calls across your codebase.

## Reading in the active locale

Loose mode reads dates and clock times the way the active locale writes them. Month names, AM/PM words, and day-month order come from the runtime's `Intl` data, and digits from any script are folded automatically.

The active locale follows the same order as formatting: the locale option, then [`configure()`](/api/configure/), then the runtime default.

```js
import '@native-dates/plugins/loose';
import { date, datetime, time } from 'native-dates';

date('06/11/2026', { loose: true, locale: 'fr' })?.toString(); // '2026-11-06'
date('06/11/2026', { loose: true, locale: 'en-US' })?.toString(); // '2026-06-11'
date('16 de noviembre de 2026', { loose: true, locale: 'es' })?.toString(); // '2026-11-16'
date('1er mai 2026', { loose: true, locale: 'fr' })?.toString(); // '2026-05-01'
date('١٦‏/١١‏/٢٠٢٦', { loose: true, locale: 'ar-EG' })?.toString(); // '2026-11-16'
time('오후 2:30', { loose: true, locale: 'ko' })?.toString(); // '14:30:00'
datetime('16 de novembro de 2026 às 14:30', {
  loose: true,
  locale: 'pt-BR',
  zone: 'America/Sao_Paulo',
})?.hour; // 14
```

Year-first locales like Korean read two-digit years at the start, so `'26. 5. 5.'` reads as May 5, 2026 in Korean. Connecting words, ordinals, and leading weekday names are skipped across full dates and partial dates alike.

## Returning null on bad data

With loose mode enabled, unreadable strings, empty fields, missing values, and impossible calendar dates like February 30 return `null` instead of throwing. Form handlers and import scripts can check the result directly without wrapping every field in a try block.

```js
const submitted = date('TBD', { loose: true }); // null
const rolled = date('2026-02-30', { loose: true }); // null
const missing = datetime(undefined, { loose: true }); // null
```

Range and partial-date factories for [ranges](/api/ranges/), [`YearMonth`](/api/year-month/), and [`MonthDay`](/api/month-day/) accept the same option:

```js
import { dateRange, monthDay, yearMonth } from 'native-dates';

dateRange('Sep 1 2026', 'Sep 7 2026', { loose: true })?.toString(); // '2026-09-01/2026-09-07'
yearMonth('ноябрь 2026 г.', { loose: true, locale: 'ru' })?.toString(); // '2026-11'
monthDay('1er mai', { loose: true, locale: 'fr' })?.toString(); // '05-01'
dateRange('TBD', '2026-09-07', { loose: true }); // null
```

A few inputs still return `null` in loose mode. Two-digit years beside a month name, hours past 12 beside PM, and bare clocks passed to `datetime()` are rejected. Unknown uppercase zone codes and bare hours like `'14h'` return null as well.

:::note[Bad data returns null, bad options still throw]
Loose mode only handles unreadable input data. Passing an unknown time zone like `'Mars/Olympus'` is a mistake in application code rather than user input, so it still throws immediately.
:::

## Time zones on loose strings

Strings carrying a UTC marker or numeric offset identify a specific moment and convert it into your target or configured zone. Strings without an offset keep the exact date and time written in the text and place them directly in your target zone.

```js
datetime('Sat, 06 Sep 2026 14:30:00 GMT', {
  loose: true,
  zone: 'America/New_York',
})?.hour; // 10

datetime('September 6, 2026 5:30 PM', {
  loose: true,
  zone: 'America/Los_Angeles',
})?.hour; // 17
```

A zone abbreviation after a clock time resolves using the same rules as the zone option. Load [`@native-dates/plugins/zones`](/plugins/zones/) to read abbreviations beyond UTC, GMT, and standard IANA IDs, including locale-specific codes like CST under Chinese locales.

## Day-first numeric dates

Numeric dates written with slashes, dots, or hyphens follow the active locale's order automatically. Pass `dayFirst` per call or set it in [`configure()`](/api/configure/) when an input uses a different order than the active locale.

```js
import { configure } from 'native-dates';

date('07.09.2026', { loose: true, locale: 'en-US' })?.toString(); // '2026-07-09'
date('07.09.2026', { loose: true, locale: 'de-DE' })?.toString(); // '2026-09-07'
date('07.09.2026', { loose: true, locale: 'en-US', dayFirst: true })?.toString(); // '2026-09-07'

configure({ dayFirst: true });
date('7/9/26', { loose: true })?.toString(); // '2026-09-07'
date('07.09.2026', { loose: true, dayFirst: false })?.toString(); // '2026-07-09'
configure({ dayFirst: null });
```

Pass `dayFirst: null` to `configure()` to follow the active locale again. Partial date factories like [`monthDay()`](/api/month-day-fn/) always read numeric pairs in the order their name states, regardless of locale.

## Factory options

:::entry
### `datetime()` :kind[function]

```js signature
datetime(input, { loose: true, zone?, locale?, dayFirst? }): DateTime | null
date(input, { loose: true, zone?, locale?, dayFirst? }): CalendarDate | null
time(input, { loose: true, zone?, locale?, dayFirst? }): Time | null
duration(input, { loose: true, locale? }): Duration | null
yearMonth(input, { loose: true, zone?, locale? }): YearMonth | null
monthDay(input, { loose: true, zone?, locale?, dayFirst? }): MonthDay | null
dateRange(start, end, { loose: true, zone?, locale?, dayFirst? }): DateRange | null
```

Extends every factory with locale-aware fallback parsing and `null` returns on unreadable input. Calling class constructors like `new DateTime()` with `{ loose: true }` enables fallback parsing while still throwing if the input cannot be read.

**Parameters**

```params
- name: loose
  type: boolean
  default: "false"
  description: "Read informal text in the active locale, fall back to engine `Date` parsing for machine formats, and return `null` when unreadable."
- name: dayFirst
  type: boolean
  description: "Override the active locale's numeric date order for strings like `'07.09.2026'`."
- name: zone
  type: Zone
  description: Time zone used to interpret local date-time strings or view instants.
- name: locale
  type: Locale
  description: BCP 47 locale tag carried on the value and used for month names, AM/PM words, and numeric date order.
```

**Returns**

```returns
type: DateTime | CalendarDate | Time | Duration | YearMonth | MonthDay | Range | null
description: Parsed instance, or `null` when `input` cannot be read.
```

```js
const parsed = date('2026-09', { loose: true });
parsed?.toString(); // '2026-09-01'
```
:::

:::entry
### `configure()` :kind[function]

```js signature
configure({ dayFirst }): Settings
```

Overrides the numeric date order for all loose calls that do not specify `dayFirst` explicitly. Unset by default so loose mode follows the active locale.

**Parameters**

```params
- name: dayFirst
  type: boolean | null
  description: "Pin loose numeric dates to day-first (`true`) or month-first (`false`), or pass `null` to follow the active locale."
```
:::
