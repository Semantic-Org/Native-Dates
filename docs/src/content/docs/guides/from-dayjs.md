---
title: Coming from Day.js
lede: Replace dayjs() wrappers and plugin chains with dedicated date types, 1-indexed months, built-in ranges, and zero-setup time zones.
updated: 2026-11-12
---

Day.js wraps a JavaScript date in a single `dayjs()` object and adds time zones, UTC, ranges, and durations through plugins. Moving here keeps the lightweight, immutable style while giving calendar days, clock times, moments, partial dates, ranges, and durations their own types in core.

## Pick date() or datetime()

In Day.js, both a birthday and an API timestamp go through `dayjs()`.

Here, calendar days use [`date()`](/api/date-fn/) or [`today()`](/api/date-fn/#today), while [billing months](/api/year-month-fn/) and [recurring birthdays](/api/month-day-fn/) have dedicated partial-date factories in core.

Real moments in time use [`datetime()`](/api/datetime-fn/) or `now()`:

```js
import { date, datetime, monthDay, now, today, yearMonth } from 'native-dates';

const current = now(); // replaces dayjs() for a timestamp
const due = today().plus(2, 'weeks'); // replaces dayjs().add(2, 'week') for a day
const created = datetime('2026-11-16T17:30:00Z');
const birthday = date('2026-05-10');
const billing = yearMonth('2026-11');
const recurring = monthDay('05-10');
```

Standard addition and subtraction names work as aliases if your codebase already calls them. Passing an empty value to a factory throws instead of silently returning the current time, catching missing API fields early.

## Months start at 1

Day.js inherits zero-indexed months where January is 0 and `.date()` reads the day of the month. Here, calendar fields are plain properties and months run from 1 through 12.

```js
import { date } from 'native-dates';

const d = date('2026-11-16');

d.year; // 2026
d.month; // 11, November
d.day; // 16
d.weekday; // 1, Monday
```

:::warning[Check month and weekday numbers]
Day.js numbers months from 0 to 11 and starts weekdays on Sunday at 0. Here, `month` runs from 1 through 12, and `weekday` runs from 1 on Monday through 7 on Sunday.
:::

## Time zones, durations, and ranges built in

Day.js requires separate plugins before you can convert across cities, build durations, or check whether a date falls inside a window. Core includes IANA time zones, [durations](/api/duration/), and [ranges](/api/ranges/) with zero setup.

```js
import { date, dateRange, datetime, duration, hours } from 'native-dates';

const standup = datetime('2026-11-16T09:30', 'America/Los_Angeles');
const berlin = standup.in('Europe/Berlin'); // replaces .tz('Europe/Berlin')

const span = duration('1h 30m').plus(hours(0.5));
span.total('minutes'); // 120

const november = date('2026-11-01').to('2026-11-30');
november.contains('2026-11-16'); // true
dateRange('2026-11-01', '2026-11-15').overlaps(november); // true
```

Instead of passing bracket inclusivity strings to `isBetween()`, date ranges include both calendar endpoints and moment or time ranges exclude their end boundary automatically.

## Presets and token patterns

Core supports `Intl` presets, Day.js localized format names, and custom [token patterns](/guides/formatting/#token-patterns) directly on `format()` with zero locale files or plugins:

```js
import { datetime } from 'native-dates';

const dt = datetime('2026-11-16T17:30:00Z', 'America/New_York');

dt.format('medium', 'en-US'); // 'Nov 16, 2026, 12:30 PM'
dt.format('LLL', 'en-US'); // 'November 16, 2026 at 12:30 PM'
dt.format('YYYY-MM-DD HH:mm'); // '2026-11-16 12:30'
```

## Opt-in plugins

Only relative phrases, non-ISO text parsing, city and abbreviation lookups, and legacy date getters live in [`@native-dates/plugins`](/plugins/). Import each subpath once with no global registration call needed:

```js
import '@native-dates/plugins/loose';
import '@native-dates/plugins/relative';
import { date, today } from 'native-dates';

today().minus(3, 'days').formatRelative(); // '3 days ago'
date('Nov 16, 2026', { loose: true }); // CalendarDate(2026-11-16)
```

## Side-by-side reference

| Day.js | Native Dates | Notes |
|---|---|---|
| `dayjs()` | `now()` or `today()` | Choose an exact moment or a calendar day |
| `d.month()`, `d.date()` | `d.month`, `d.day` | Plain properties with months from 1 to 12 |
| `d.add(2, 'day')` | `d.plus(2, 'days')` | `add()` and `subtract()` aliases also work |
| `dayjs.tz(x, zone)` | `datetime(x, zone)` | Built into core with no `timezone` plugin |
| `d.tz(zone)` | `dt.in(zone)` | Views the same moment in another IANA zone |
| `dayjs.utc(x)` | `datetime(x, 'UTC')` | Built into core with no `utc` plugin |
| `b.diff(a, 'day', true)` | `a.until(b, 'days')` | Fractional total in the requested unit |
| `dayjs.duration(90, 'm')` | `minutes(90)` or `duration('90m')` | Built into core with no `duration` plugin |
| `d.format('LLL')` | `dt.format('LLL')` | Localized presets from `'LT'` to `'llll'` in core |
| `d.format('YYYY-MM-DD HH:mm')` | `dt.format('YYYY-MM-DD HH:mm')` | [Token patterns](/guides/formatting/#token-patterns) built directly into core |
| `d.isBetween(a, b)` | `dateRange(a, b).contains(d)` | [Ranges](/api/ranges/) built into core with `to()` and `overlaps()` |
| `d.fromNow()`, `d.toNow()` | `d.formatRelative()` | Provided by [`@native-dates/plugins/relative`](/plugins/relative/) |
| `customParseFormat` | `{ loose: true }` | Provided by [`@native-dates/plugins/loose`](/plugins/loose/) |
