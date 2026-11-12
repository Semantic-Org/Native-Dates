---
title: Coming from Day.js
lede: Replace dayjs() wrappers and plugin chains with dedicated date types, 1-indexed months, and built-in time zones.
updated: 2026-11-12
---

Day.js wraps a JavaScript date in a single `dayjs()` object and adds time zones, UTC, and durations through plugins. Moving here keeps the lightweight, immutable style while giving calendar days, clock times, moments, and durations their own types.

## Pick date() or datetime()

In Day.js, both a birthday and an API timestamp go through `dayjs()`.

Here, use [`date()`](/api/date-fn/) or [`today()`](/api/date-fn/#today) for calendar days that stay the same everywhere.

Use [`datetime()`](/api/datetime-fn/) or [`now()`](/api/datetime-fn/#now) when something happens at a real moment in time.

```js
import { date, datetime, now, today } from 'native-dates';

const current = now(); // replaces dayjs() for a timestamp
const due = today().plus(2, 'weeks'); // replaces dayjs().add(2, 'week') for a day
const created = datetime('2026-11-16T17:30:00Z');
const birthday = date('2026-05-10');
```

Both `add()` and `subtract()` work as aliases if your codebase already uses those names. Passing an empty value to a factory throws instead of silently returning the current time, catching missing API fields early.

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

## Time zones and durations built in

Day.js requires separate plugins before you can convert across cities or build durations. Core includes IANA time zones, UTC serialization, and [`Duration`](/api/duration/) math with zero setup.

```js
import { datetime, duration, hours } from 'native-dates';

const standup = datetime('2026-11-16T09:30', 'America/Los_Angeles');
const berlin = standup.in('Europe/Berlin'); // replaces .tz('Europe/Berlin')

const span = duration('1h 30m').plus(hours(0.5));
span.total('minutes'); // 120
```

## Presets vs token strings

Token strings in Day.js embed English word order unless you bundle extra locale files. Core formats through `Intl` presets such as short, medium, and long, adapting automatically to any locale.

When you want custom token patterns for fixed layouts or filenames, import [`@native-dates/plugins/tokens`](/plugins/tokens/):

```js
import '@native-dates/plugins/tokens';
import { datetime } from 'native-dates';

const dt = datetime('2026-11-16T17:30:00Z', 'America/New_York');

dt.format('medium', 'en-US'); // 'Nov 16, 2026, 12:30 PM'
dt.format('YYYY-MM-DD HH:mm'); // '2026-11-16 12:30'
```

## Relative time and ranges

Specialized features ship as opt-in subpaths under [`@native-dates/plugins`](/plugins/) with no global registration call required. Import only the capabilities your app uses.

```js
import '@native-dates/plugins/relative';
import { dateRange } from '@native-dates/plugins/ranges';
import { date, today } from 'native-dates';

today().minus(3, 'days').formatRelative(); // '3 days ago'
dateRange('2026-11-01', '2026-11-30').contains(date('2026-11-16')); // true
```

Instead of passing bracket inclusivity strings, date ranges include both calendar endpoints and datetime ranges exclude their end moment automatically.

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
| `d.format('LL')` | `d.format('long')` | Uses browser `Intl` with zero locale bundles |
| `d.format('YYYY-MM-DD')` | `d.toString()` or `tokens` | ISO strings are built in, or load [`tokens`](/plugins/tokens/) |
| `d.fromNow()` | `d.formatRelative()` | Provided by [`@native-dates/plugins/relative`](/plugins/relative/) |
| `d.isBetween(a, b)` | `dateRange(a, b).contains(d)` | Provided by [`@native-dates/plugins/ranges`](/plugins/ranges/) |
| `customParseFormat` | `{ loose: true }` | Provided by [`@native-dates/plugins/loose`](/plugins/loose/) |
