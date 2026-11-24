---
title: Working with Temporal
lede: How Native Dates maps onto JavaScript's Temporal API and interops with raw Temporal values.
updated: 2026-11-23
---

Native Dates wraps JavaScript's built-in `Temporal` and `Intl` APIs.

Temporal provides exact calendar and time-zone primitives with explicit options objects. Native Dates wraps everyday callsites in concise methods while interoperating freely with raw Temporal instances.

## How types map to Temporal

Each core value class wraps one underlying `Temporal` type and hands it back whenever you need low-level control:

| Type | Wraps | What Native Dates adds |
|---|---|---|
| [`DateTime`](/api/date-time/) | `Temporal.ZonedDateTime` | Reads ISO instants, offsets, `Date`, and epoch numbers into one zoned type and serializes to UTC |
| [`CalendarDate`](/api/calendar-date/) | `Temporal.PlainDate` | Pairs with `at(time, zone)` and formats presets and token patterns directly |
| [`Time`](/api/time/) | `Temporal.PlainTime` | Reads 12-hour strings like `'9:30am'` alongside 24-hour ISO clock times |
| [`Duration`](/api/duration/) | `Temporal.Duration` | Parses `'1h 30m'` phrases, spills fractional units, and remembers anchors from `until()` |
| [`YearMonth`](/api/year-month/) | `Temporal.PlainYearMonth` | Built-in class for billing months and card expiries with [`monthYear()`](/api/year-month-fn/#monthyear) and `on()` |
| [`MonthDay`](/api/month-day/) | `Temporal.PlainMonthDay` | Built-in class for birthdays and recurring dates with [`dayMonth()`](/api/month-day-fn/#daymonth), `fallsOn()`, and `next()` |

Temporal leaves ranges out of its specification. Core adds [`DateRange`, `DateTimeRange`, and `TimeRange`](/api/ranges/) on top of endpoint pairs for containment, overlap, and stepping.

## Passing Temporal objects in

Every factory, arithmetic method, and comparison accepts raw `Temporal` values directly.

```js
import { date, datetime, time, yearMonth } from 'native-dates';

const instant = Temporal.Instant.from('2026-11-16T17:30:00Z');
const standup = datetime(instant, 'America/Los_Angeles');

const plainDate = Temporal.PlainDate.from('2026-11-16');
date(plainDate).plus(Temporal.Duration.from({ weeks: 2 }));

const plainTime = Temporal.PlainTime.from('09:30');
time(plainTime).format('short', 'en-US'); // '9:30 AM'

const ym = yearMonth(Temporal.PlainYearMonth.from('2026-11'));
ym.daysInMonth; // 30
```

Passing a `Temporal.ZonedDateTime` to [`datetime()`](/api/datetime-fn/) preserves its time zone unless you pass a new one. Passing an instant or plain date-time places that value into the zone you specify or your configured default.

Temporal values and strings using non-ISO calendars like Japanese or Persian convert to the same ISO day without calling `withCalendar()` first.

Comparisons and span measurements accept Temporal inputs directly too:

```js
const berlin = Temporal.ZonedDateTime.from('2026-11-16T18:30:00+01:00[Europe/Berlin]');
standup.equals(berlin); // true
```

## Unwrapping with toTemporal()

Call [`toTemporal()`](/api/date-time/#totemporal) on any value to access its underlying Temporal instance.

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

Current Chrome, Edge, Firefox, Node 26+, Deno, and Bun ship `Temporal` natively, so core includes zero polyfill code.

For Safari, older browsers, or Node 22–25, load `@native-dates/polyfill` alongside `temporal-polyfill` at startup (it also provides an `Intl.DurationFormat` fallback on Node 22–23). See [Supporting Safari and older Node](/guides/installation/#supporting-safari-and-older-node) for setup and synchronous loading options.
