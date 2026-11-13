---
title: Overview
lede: Readable, immutable dates and times built on the browser's Temporal and Intl APIs.
updated: 2026-11-12
---

Modern JavaScript engines include `Temporal` for calendar and time-zone math alongside `Intl` for localized formatting. Native Dates wraps those built-in APIs in plain English with zero runtime dependencies.

```js
import { date, now, today } from 'native-dates';

const due = today().plus(2, 'weeks');
const standup = date('2026-11-16')
  .at('9:30am', 'America/Los_Angeles')
  .in('Europe/Berlin');
```

Because the runtime already carries the IANA time-zone database and locale rules, every region and language works out of the box. Your bundle never downloads extra zone or locale tables.

## Separate types for separate jobs

JavaScript's built-in `Date` uses one object whether you mean a holiday, an opening hour, or a database timestamp. Native Dates gives each concept its own type so values only carry the fields that make sense for them:

- [`CalendarDate`](/api/calendar-date/) for a calendar day like May 10, 2026, unaffected by time zones
- [`Time`](/api/time/) for a time of day like 9:30 AM, wrapping cleanly at midnight
- [`DateTime`](/api/date-time/) for a specific moment paired with a time zone
- [`Duration`](/api/duration/) for a length of time like 90 minutes or 2 weeks
- [`YearMonth`](/api/year-month/) and [`MonthDay`](/api/month-day/) for billing periods, card expiries, and recurring birthdays
- [Ranges](/api/ranges/) for spans between two dates, times, or moments

Measuring gaps, building ranges, and formatting with localized presets or token patterns all work out of the box:

```js
import { date, datetime, monthDay, now, yearMonth } from 'native-dates';

const deadline = datetime('2027-01-01T00:00:00Z');
now().until(deadline).format('long');

const sprint = date('2026-11-02').to(2, 'weeks');
sprint.contains('2026-11-10'); // true
sprint.start.format('YYYY-MM-DD'); // '2026-11-02'

const billing = yearMonth('2026-11');
const birthday = monthDay('10/17');
```

Read [Types of time](/guides/types-of-time/) next to see how to pick between them and move from one to another.

## Immutable values

Every instance is immutable. Calling methods like `plus()` or `in()` always returns a new value and leaves the original untouched.

Passing a date into a helper or UI component can never mutate caller state behind your back:

```js
const original = date('2026-11-16').at('9:30am', 'America/Los_Angeles');
const moved = original.plus(1, 'hour');

original.text; // 'Nov 16, 2026, 9:30 AM PST'
moved.text; // 'Nov 16, 2026, 10:30 AM PST'
```

Every value also includes a `.text` property with a human-readable summary. Logging an instance in Node or browser DevTools shows what it means right away without clicking getters:

```js
import { time } from 'native-dates';

date('2026-05-10').text; // 'May 10, 2026'
time('9:30am').text; // '9:30 AM'
```

:::tip[Comparing values]
Because methods return new instances, `===` checks object references rather than value equality. Call `equals()` to check whether two instances represent the same date, time, or moment.
:::

## Lean core and opt-in plugins

The core [`native-dates`](/guides/installation/) package stays small. It covers creation, time zones, calendar math, partial dates, ranges, durations, localized presets, and token patterns.

Optional additions like relative phrases, city and abbreviation lookups, loose parsing, and legacy `Date` methods live in [`@native-dates/plugins`](/plugins/) as individual subpath imports:

```js
import '@native-dates/plugins/relative';
import '@native-dates/plugins/zones';
import { datetime, today } from 'native-dates';

today().minus(3, 'days').formatRelative(); // '3 days ago'
datetime('2026-11-16T09:30', 'Berlin').zone; // 'Europe/Berlin'
```

Head to [Installation](/guides/installation/) to install the package, support older runtimes, and configure app-wide defaults.
