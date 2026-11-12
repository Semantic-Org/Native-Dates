---
title: Parsing
lede: Read ISO strings, clock times, duration phrases, and user input into the right type without silent guesswork.
updated: 2026-11-12
---

Core parses standard, unambiguous inputs directly into the type you ask for:

- [`datetime()`](/api/datetime-fn/) for moments in time, epoch milliseconds, and timestamps
- [`date()`](/api/date-fn/) for calendar days with no clock or time zone
- [`time()`](/api/time-fn/) for 24-hour and 12-hour times of day
- [`duration()`](/api/duration-fn/) for human unit phrases and ISO 8601 durations
- [`yearMonth()`](/plugins/year-month/) and [`monthDay()`](/plugins/month-day/) plugins for billing months, card expiries, and recurring birthdays

## ISO dates and timestamps

Pass an ISO date string, three year, month, and day numbers, or a fields object to `date()`.

Months run from 1 through 12. Impossible calendar dates like February 30 throw an error instead of rolling forward into March.

```js
import { date } from 'native-dates';

date('2026-11-16');
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

Pass 24-hour ISO times, 12-hour clock strings, numeric arguments, or a fields object to `time()`.

```js
import { time } from 'native-dates';

time('09:30');
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

## Epoch timestamps, Date, and Temporal

`datetime()` also reads epoch milliseconds, native `Date` instances, and [Temporal](/guides/temporal/) objects.

Passing a bare number to a date factory throws as ambiguous. Convert epoch milliseconds to a moment in a zone first, then read its calendar day.

```js
import { date, datetime } from 'native-dates';

const fromEpoch = datetime(1794850200000, 'UTC');
const fromJSDate = datetime(new Date('2026-11-16T17:30:00Z'));
const localDay = date(new Date('2026-11-16T17:30:00Z'), 'America/Los_Angeles');
```

## Why ambiguous strings throw

A string like `'03/05/2026'` means March 5 in the United States and May 3 across Europe and Latin America. Core refuses locale-dependent strings rather than guessing the wrong month in production.

:::warning[Missing values never default to now]
Passing an empty value to any factory throws instead of returning the current date, so a missing API field never masquerades as today. Call [`now()`](/api/datetime-fn/#now) or [`today()`](/api/date-fn/#today) when you want the current clock.
:::

## User input with the loose plugin

When parsing free-form text from user inputs, CSV exports, or RFC 2822 headers, import [`@native-dates/plugins/loose`](/plugins/loose/) and pass `{ loose: true }`.

```js
import '@native-dates/plugins/loose';
import { date, datetime } from 'native-dates';

date('Nov 16, 2026', { loose: true }); // 2026-11-16
datetime('Mon, 16 Nov 2026 17:30:00 GMT', { loose: true });
```

Numeric slash and dot dates default to month-first order. Pass `dayFirst: true` per call, or set it once at startup with [`configure()`](/api/configure/), when reading day-first dates.

```js
date('03/05/2026', { loose: true }); // 2026-03-05
date('03/05/2026', { loose: true, dayFirst: true }); // 2026-05-03
```

With `{ loose: true }`, unreadable inputs return `null` instead of throwing across every factory, keeping form validation to a simple check. Invalid option values like an unknown time zone name still throw immediately.

```js
import { duration } from 'native-dates';

date('not a date', { loose: true }); // null
duration('soon', { loose: true }); // null
```
