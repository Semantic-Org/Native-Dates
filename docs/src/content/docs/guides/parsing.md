---
title: Parsing
lede: Read ISO strings, durations, ranges, and loose user input without silent guesswork.
updated: 2026-11-23
---

Core parses standard, unambiguous inputs directly into the type you ask for:

- [`datetime()`](/api/datetime-fn/) for moments in time, epoch milliseconds, and timestamps
- [`date()`](/api/date-fn/) for calendar days with no clock or time zone
- [`time()`](/api/time-fn/) for 24-hour and 12-hour times of day
- [`duration()`](/api/duration-fn/) for human unit phrases and ISO 8601 durations
- [`yearMonth()`](/api/year-month-fn/) and [`monthDay()`](/api/month-day-fn/) for billing months, card expiries, and recurring birthdays
- [`dateRange()`](/api/range-fn/#daterange), [`datetimeRange()`](/api/range-fn/#datetimerange), and [`timeRange()`](/api/range-fn/#timerange) for intervals and endpoint pairs

## ISO dates and timestamps

Pass a year-first date string, three year, month, and day numbers, or a fields object to `date()`. Year-first strings accept padded or single-digit months and days with any separator other than Latin letters or colons. Chinese, Japanese, Korean, and spaced dot dates all read directly in core.

Months run from 1 through 12. Impossible calendar dates like February 30 and ISO week or quarter strings like `'2026-W05-1'` throw an error instead of guessing.

```js
import { date } from 'native-dates';

date('2026-11-16');
date('2026/11/6');
date('2026年11月16日');
date('2026. 11. 16.');
date(2026, 11, 16);
date({ year: 2026, month: 11, day: 16 });
```

Pass ISO 8601 strings or fields objects to `datetime()`. A trailing `Z` or numeric offset identifies the exact moment, while a string without an offset reads as local time in the target zone.

```js
import { datetime } from 'native-dates';

datetime('2026-11-16T17:30:00Z', 'America/Los_Angeles'); // 9:30 AM PST
datetime('2026-11-16T09:30', 'America/Los_Angeles'); // 9:30 AM PST
datetime('2026-11-16T09:30[Europe/Berlin]'); // 9:30 AM CET
datetime({ year: 2026, month: 11, day: 16, hour: 9, minute: 30 }, 'Europe/Berlin');
```

Passing an offset timestamp to `date()` or `time()` reads its calendar day or local clock in the time zone you ask for:

```js
import { time } from 'native-dates';

date('2026-11-17T01:30:00Z', 'America/Los_Angeles'); // 2026-11-16
date('2026-11-17T01:30:00Z', 'Asia/Tokyo'); // 2026-11-17
time('2026-11-17T01:30:00Z', 'America/Los_Angeles'); // 17:30:00
```

## Clock times and durations

Pass 24-hour ISO times, hour-minute strings like `'14h30'`, 12-hour clock strings, numeric arguments, or a fields object to `time()`. A bare hour like `'14h'` still throws so durations stay unambiguous.

```js
import { time } from 'native-dates';

time('09:30');
time('14h30');
time('9:30am');
time('5:15 PM');
time(17, 15, 30);
time({ hour: 9, minute: 30 });
```

Pass plain-English unit phrases, ISO 8601 duration strings, a count and unit, or a fields object to `duration()`.

```js
import { duration } from 'native-dates';

duration('1h 30m');
duration('2 weeks and 3 days');
duration('PT90M');
duration(90, 'minutes');
duration({ hours: 1, minutes: 30 });
```

## Partial dates and ranges

Pass ISO year-month strings to [`yearMonth()`](/api/year-month-fn/), or read card expiries where the month leads with [`monthYear()`](/api/year-month-fn/#monthyear):

```js
import { dayMonth, monthDay, monthYear, yearMonth } from 'native-dates';

yearMonth('2026-11');
monthYear('11/28'); // YearMonth(2028-11)

monthDay('10/17');
dayMonth('17/10'); // MonthDay(10-17)
```

Recurring dates without a year work the same way through [`monthDay()`](/api/month-day-fn/) and [`dayMonth()`](/api/month-day-fn/#daymonth). For spans, [range factories](/api/range-fn/) read two endpoints or a single interval string:

```js
import { dateRange, timeRange } from 'native-dates';

dateRange('2026-11-01/2026-11-07');
timeRange('9am - 5pm');
```

## Epoch timestamps, Date, and Temporal

Epoch milliseconds, native JavaScript dates, and [Temporal](/guides/temporal/) objects pass straight into `datetime()`.

Passing a bare number to a date factory throws as ambiguous. Convert epoch milliseconds to a moment in a zone first, then read its calendar day.

```js
import { date, datetime } from 'native-dates';

const fromEpoch = datetime(1794850200000, 'UTC');
const fromJSDate = datetime(new Date('2026-11-16T17:30:00Z'));
const localDay = date(new Date('2026-11-16T17:30:00Z'), 'America/Los_Angeles');
```

## Why ambiguous strings throw

While a four-digit year at the front has only one reading, `'03/05/2026'` means March 5 in the United States and May 3 across Europe and Latin America. Core refuses ambiguous numeric strings rather than guessing the wrong month in production.

:::warning[Missing values never default to now]
Passing an empty value to any factory throws instead of returning the current date, so a missing API field never masquerades as today. Call [`now()`](/api/datetime-fn/#now) or [`today()`](/api/date-fn/#today) when you want the current clock.
:::

## User input with the loose plugin

When parsing free-form text from user inputs, CSV exports, or RFC 2822 headers, import [`@native-dates/plugins/loose`](/plugins/loose/) and pass `{ loose: true }`. Loose mode reads dates and clock times the way the active locale writes them, including localized month names, day-period words, dotted clocks, and non-ASCII digits.

```js
import '@native-dates/plugins/loose';
import { date, datetime, monthDay, time, yearMonth } from 'native-dates';

date('Nov 16, 2026', { loose: true }); // 2026-11-16
date('16 de noviembre de 2026', { loose: true, locale: 'es' }); // 2026-11-16
datetime('Mon, 16 Nov 2026 17:30:00 GMT', { loose: true });
time('오후 2:30', { loose: true, locale: 'ko' }); // 14:30:00
yearMonth('Nov 2026', { loose: true }); // 2026-11
monthDay('17 février', { loose: true, locale: 'fr' }); // 02-17
```

Numeric slash and dot dates follow the active locale's order. Pass `dayFirst` per call or set it in [app configuration](/api/configure/) when an input uses a different order than the active locale.

```js
date('03/05/2026', { loose: true, locale: 'en-US' }); // 2026-03-05
date('03/05/2026', { loose: true, locale: 'fr' }); // 2026-05-03
date('03/05/2026', { loose: true, locale: 'en-US', dayFirst: true }); // 2026-05-03
```

Under loose parsing, unreadable inputs return `null` instead of throwing across every factory and range. Invalid option values like an unknown time zone name still throw.

```js
import { duration } from 'native-dates';

date('not a date', { loose: true }); // null
duration('soon', { loose: true }); // null
```
