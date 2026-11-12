---
title: Working with Temporal
lede: How Native Dates maps onto JavaScript's Temporal API, accepts raw Temporal objects, and runs on older engines.
updated: 2026-11-12
---

Native Dates is a thin, ergonomic layer over JavaScript's built-in `Temporal` and Intl APIs.

Temporal provides exact calendar and time-zone primitives with explicit option bags. Native Dates wraps everyday callsites in concise methods while interoperating freely with raw Temporal instances.

## How types map to Temporal

Each class wraps one underlying `Temporal` type and hands it back whenever you need low-level control:

| Type | Wraps | What Native Dates adds |
|---|---|---|
| [`DateTime`](/api/date-time/) | `Temporal.ZonedDateTime` | Reads ISO instants, offsets, `Date`, and epoch numbers into one zoned type and serializes to UTC |
| [`CalendarDate`](/api/calendar-date/) | `Temporal.PlainDate` | Pairs with `at(time, zone)` and formats locale presets directly through `Intl` |
| [`Time`](/api/time/) | `Temporal.PlainTime` | Reads 12-hour strings like `'9:30am'` alongside 24-hour ISO clock times |
| [`Duration`](/api/duration/) | `Temporal.Duration` | Parses `'1h 30m'` phrases, spills fractional units, and remembers anchors from `until()` |
| [`YearMonth`](/plugins/year-month/) | `Temporal.PlainYearMonth` | Opt-in plugin for billing months and card expiries with `monthYear()` and `on()` |
| [`MonthDay`](/plugins/month-day/) | `Temporal.PlainMonthDay` | Opt-in plugin for birthdays and recurring dates with `dayMonth()`, `fallsOn()`, and `next()` |

## Passing Temporal objects in

Every factory, arithmetic method, and comparison accepts raw `Temporal` values directly without manual conversion steps.

```js
import { date, datetime, time } from 'native-dates';

const instant = Temporal.Instant.from('2026-11-16T17:30:00Z');
const standup = datetime(instant, 'America/Los_Angeles');

const plainDate = Temporal.PlainDate.from('2026-11-16');
date(plainDate).plus(Temporal.Duration.from({ weeks: 2 }));

const plainTime = Temporal.PlainTime.from('09:30');
time(plainTime).format('short', 'en-US'); // '9:30 AM'
```

Passing a `Temporal.ZonedDateTime` to [`datetime()`](/api/datetime-fn/) preserves its time zone unless you pass a new one. Passing an instant or plain date-time places that value into the zone you specify or your configured default.

Comparisons and span measurements accept Temporal inputs directly too:

```js
const berlin = Temporal.ZonedDateTime.from('2026-11-16T18:30:00+01:00[Europe/Berlin]');
standup.equals(berlin); // true
```

## Unwrapping with toTemporal()

Call `toTemporal()` on any value to access its underlying Temporal instance.

Use it when calling third-party libraries that expect Temporal objects or working with non-ISO calendar systems.

```js
import { date } from 'native-dates';

const d = date('2026-11-16');
const plain = d.toTemporal(); // Temporal.PlainDate

const japanese = plain.withCalendar('japanese');
japanese.era; // 'reiwa'
japanese.eraYear; // 8
```

:::note[Zero-copy unwrapping]
Each instance holds a real Temporal object internally, so `toTemporal()` returns that object directly without reparsing or allocating a copy.
:::

## Polyfilling older runtimes

Modern browsers and current Node releases ship Temporal natively, so core includes zero polyfill code in its bundle.

If your application supports older browsers or Node versions without native support, install `@native-dates/polyfill` alongside `temporal-polyfill`:

```sh
npm install @native-dates/polyfill temporal-polyfill
```

Import `@native-dates/polyfill` once at your application entry point before importing from Native Dates:

```js
import '@native-dates/polyfill';
import { today } from 'native-dates';

today().plus(1, 'week');
```

The default entry checks `globalThis.Temporal` first and dynamically imports the polyfill only when needed, so modern browsers skip downloading it. In environments without top-level await, import `'@native-dates/polyfill/sync'` instead.
