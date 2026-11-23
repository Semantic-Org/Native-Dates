---
title: loose
kind: plugin
lede: Opt-in locale-aware parsing and `null` returns for untrusted text from forms, CSVs, and legacy feeds.
import: import '@native-dates/plugins/loose'
size: loose
updated: 2026-11-23
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

Loose mode reads back the dates and clock times `Intl` prints for the active locale. Month names, AM/PM and part-of-day phrases, and numeric day-month order come from the runtime, and digits from any script fold automatically.

The active locale follows the same order as formatting: the locale option, then [`configure()`](/api/configure/), then the runtime default.

```js locale="en-US" label="English"
import '@native-dates/plugins/loose';
import { configure, date, datetime, time } from 'native-dates';

configure({ locale: 'en-US' });

date('06/11/2026', { loose: true })?.toString(); // '2026-06-11'
date('September 6, 2026', { loose: true })?.toString(); // '2026-09-06'
time('9:10 in the evening', { loose: true })?.toString(); // '21:10:00'
datetime('Sep 6, 2026, 5:30 PM', {
  loose: true,
  zone: 'America/New_York',
})?.hour; // 17
```

```js locale="fr" label="Français"
import '@native-dates/plugins/loose';
import { configure, date, datetime, monthDay } from 'native-dates';

configure({ locale: 'fr' });

date('06/11/2026', { loose: true })?.toString(); // '2026-11-06'
date('1er mai 2026', { loose: true })?.toString(); // '2026-05-01'
monthDay('1er mai', { loose: true })?.toString(); // '05-01'
datetime('16 novembre 2026 à 14:30', {
  loose: true,
  zone: 'Europe/Paris',
})?.hour; // 14
```

```js locale="es" label="Español"
import '@native-dates/plugins/loose';
import { configure, date, datetime, time } from 'native-dates';

configure({ locale: 'es' });

date('06/11/2026', { loose: true })?.toString(); // '2026-11-06'
date('16 de noviembre de 2026', { loose: true })?.toString(); // '2026-11-16'
time('9:10 de la noche', { loose: true })?.toString(); // '21:10:00'
datetime('16 nov 2026, 14:30', {
  loose: true,
  zone: 'Europe/Madrid',
})?.hour; // 14
```

```js locale="pt-BR" label="Português"
import '@native-dates/plugins/loose';
import { configure, date, datetime, time } from 'native-dates';

configure({ locale: 'pt-BR' });

date('06/11/2026', { loose: true })?.toString(); // '2026-11-06'
date('16 de novembro de 2026', { loose: true })?.toString(); // '2026-11-16'
time('9:10 da noite', { loose: true })?.toString(); // '21:10:00'
datetime('16 de novembro de 2026 às 14:30', {
  loose: true,
  zone: 'America/Sao_Paulo',
})?.hour; // 14
```

```js locale="zh-CN" label="中文"
import '@native-dates/plugins/loose';
import { configure, date, datetime, time } from 'native-dates';

configure({ locale: 'zh-CN' });

date('2026/11/16', { loose: true })?.toString(); // '2026-11-16'
date('2026年11月16日', { loose: true })?.toString(); // '2026-11-16'
time('晚上9:10', { loose: true })?.toString(); // '21:10:00'
datetime('2026年11月16日 下午2:30', {
  loose: true,
  zone: 'Asia/Shanghai',
})?.hour; // 14
```

```js locale="ja" label="日本語"
import '@native-dates/plugins/loose';
import { configure, date, datetime, time } from 'native-dates';

configure({ locale: 'ja' });

date('2026/11/16', { loose: true })?.toString(); // '2026-11-16'
date('2026年11月16日', { loose: true })?.toString(); // '2026-11-16'
time('午後2:30', { loose: true })?.toString(); // '14:30:00'
datetime('2026年11月16日 14:30', {
  loose: true,
  zone: 'Asia/Tokyo',
})?.hour; // 14
```

```js locale="ko" label="한국어"
import '@native-dates/plugins/loose';
import { configure, date, datetime, time } from 'native-dates';

configure({ locale: 'ko' });

date('26. 5. 5.', { loose: true })?.toString(); // '2026-05-05'
date('2026년 11월 16일', { loose: true })?.toString(); // '2026-11-16'
time('오후 2:30', { loose: true })?.toString(); // '14:30:00'
datetime('2026년 11월 16일 오후 2:30', {
  loose: true,
  zone: 'Asia/Seoul',
})?.hour; // 14
```

```js locale="ru" label="Русский"
import '@native-dates/plugins/loose';
import { configure, date, datetime, time } from 'native-dates';

configure({ locale: 'ru' });

date('16.11.2026', { loose: true })?.toString(); // '2026-11-16'
date('16 ноября 2026 г.', { loose: true })?.toString(); // '2026-11-16'
time('9:10 вечера', { loose: true })?.toString(); // '21:10:00'
datetime('16 нояб. 2026 г., 14:30', {
  loose: true,
  zone: 'Europe/Moscow',
})?.hour; // 14
```

```js locale="ar-EG" label="العربية"
import '@native-dates/plugins/loose';
import { configure, date, datetime, time } from 'native-dates';

configure({ locale: 'ar-EG' });

date('١٦‏/١١‏/٢٠٢٦', { loose: true })?.toString(); // '2026-11-16'
date('١٦ نوفمبر ٢٠٢٦', { loose: true })?.toString(); // '2026-11-16'
time('٢:٣٠ م', { loose: true })?.toString(); // '14:30:00'
datetime('١٦ نوفمبر ٢٠٢٦، ٢:٣٠ م', {
  loose: true,
  zone: 'Africa/Cairo',
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

Incomplete dates missing a year or day return `null` in date and datetime factories instead of inventing a default. Use a partial-date factory when only a month and year or month and day are present.

Two-digit years beside a non-English month name, ambiguous month abbreviations, hours past 12 beside AM or PM, and bare clocks passed to `datetime()` are rejected. Unknown uppercase zone codes and bare hours like `'14h'` return null as well.

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

## Regional clock and month rules

Dotted clocks like `'14.30'` parse only in locales whose clock uses a dot, such as Finnish and Danish, and return `null` elsewhere. Dotted seconds parse after a date, while standalone three-part dotted strings stay dates.

Part-of-day phrases like English *in the evening* and Korean *밤* shift 12-hour clocks while leaving 24-hour times untouched. Date-to-time connectors are never read as AM or PM, so Welsh *am*, meaning "at", keeps 14:30 intact while English `'AM 12:30'` reads as midnight.

Inflected and affixed month forms written in full dates parse automatically, including Hebrew and Basque. Shortened month names must match a single month, so French *juil* parses as July while *jui* returns `null`.

```js label="Dotted clocks"
datetime('16.11.2026 klo 14.30.15', {
  loose: true,
  locale: 'fi',
  zone: 'UTC',
})?.toString(); // '2026-11-16T14:30:15.000Z'
time('14.30', { loose: true, locale: 'fi' })?.toString(); // '14:30:00'
time('14.30', { loose: true, locale: 'de' }); // null
time('14.30.15', { loose: true, locale: 'fi' }); // null
```

```js label="Day periods"
time('밤 11:30', { loose: true, locale: 'ko' })?.toString(); // '23:30:00'
time('밤 1:30', { loose: true, locale: 'ko' })?.toString(); // '01:30:00'
time('14:30 nachmittags', { loose: true, locale: 'de' })?.toString(); // '14:30:00'
```

```js label="Connectors"
time('am 14:30', { loose: true, locale: 'cy' })?.toString(); // '14:30:00'
time('am 12:30', { loose: true, locale: 'cy' })?.toString(); // '12:30:00'
time('AM 12:30', { loose: true, locale: 'en-US' })?.toString(); // '00:30:00'
```

```js label="Month forms"
date('2026(e)ko azaroaren 16(a)', {
  loose: true,
  locale: 'eu',
})?.toString(); // '2026-11-16'
date('6 juil 2026', { loose: true, locale: 'fr' })?.toString(); // '2026-07-06'
date('6 jui 2026', { loose: true, locale: 'fr' }); // null
```

## Factory options

:::entry
### `datetime()` :kind[function]

```js signature
datetime(input, { loose: true, zone?, locale?, dayFirst?, disambiguation? }): DateTime | null
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
  description: BCP 47 locale tag carried on the value and used for month names, day-period words, clock style, and date order.
- name: disambiguation
  type: Disambiguation
  default: "'compatible'"
  description: "How to resolve DST gaps and folds on local date-time strings. `'reject'` returns `null` in loose mode."
```

**Returns**

```returns
type: DateTime | CalendarDate | Time | Duration | YearMonth | MonthDay | Range | null
description: Parsed instance, or `null` when `input` cannot be read.
```

```js
date('Sept 6, 2026', { loose: true })?.toString(); // '2026-09-06'
date('2026-09', { loose: true }); // null
yearMonth('2026-09', { loose: true })?.toString(); // '2026-09'
```
:::

:::entry
### `configure()` :kind[function]

```js signature
configure({ dayFirst }): Settings
```

Overrides the default numeric date order for loose calls that specify neither `dayFirst` nor `locale` per call. Unset by default so loose mode follows the active locale.

**Parameters**

```params
- name: dayFirst
  type: boolean | null
  description: "Pin loose numeric dates to day-first (`true`) or month-first (`false`), or pass `null` to follow the active locale."
```
:::
