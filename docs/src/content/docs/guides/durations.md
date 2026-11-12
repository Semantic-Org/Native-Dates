---
title: Durations
lede: Create lengths of time from unit helpers or plain phrases, measure spans between dates, and convert or format totals.
updated: 2026-11-12
---

A [`Duration`](/api/duration/) represents a length of time, such as 90 minutes or 2 weeks. You can create one directly for date math, or get one back when measuring between two values.

## Creating a Duration

Create a length of time with unit helpers like `hours()`, or pass a phrase, an ISO 8601 string, or a fields object to [`duration()`](/api/duration-fn/):

```js
import { days, duration, hours } from 'native-dates';

const call = hours(1.5);
const trial = days(14);
const turnaround = duration('2 weeks, 3 days');
const iso = duration('PT1H30M');
const window = duration({ hours: 2, minutes: 45 });
```

Read unit counts directly off the instance. Fractional inputs spill into the next smaller unit automatically, while whole numbers stay in the unit you wrote:

```js
call.hours; // 1
call.minutes; // 30

const ninety = duration(90, 'minutes');
ninety.hours; // 0
ninety.minutes; // 90
```

## Measuring between two values

Call `until()` or `since()` on two dates, times, or moments to measure the span between them:

```js
import { datetime } from 'native-dates';

const opened = datetime('2026-11-16T08:00', 'America/Los_Angeles');
const resolved = datetime('2026-11-16T10:30', 'America/Los_Angeles');

const elapsed = opened.until(resolved);
elapsed.hours; // 2
elapsed.minutes; // 30
```

When you only need a single number for calculations or progress bars, pass the target unit as a second argument:

```js
opened.until(resolved, 'hours'); // 2.5
resolved.since(opened, 'minutes'); // 150
```

## Balancing and totaling units

Values stay in the units you gave them until you ask otherwise. Call `balance()` when you want overflow carried into larger units:

```js
import { hours, minutes } from 'native-dates';

minutes(90).balance().toFields(); // { hours: 1, minutes: 30 }
hours(36).balance('day').toFields(); // { days: 1, hours: 12 }
```

Without an argument, standalone durations balance clock units up to hours rather than assuming every calendar day has 24 hours.

Pass `'day'` or `'week'` when you want fixed 24-hour days or 7-day weeks.

Call `total()` or its chain-friendly alias `as()` to collapse the entire span into a single floating-point number in one unit:

```js
import { duration } from 'native-dates';

const shift = duration('7h 30m');

shift.total('hours'); // 7.5
shift.as('minutes'); // 450
```

:::note[Totals in months and years]
Months and years vary in length, so sixty standalone days cannot convert to months without a calendar date. Spans returned by `until()` and `since()` remember where they started, so month and year totals work directly.
:::

```js
import { date } from 'native-dates';

const span = date('2026-01-15').until('2026-04-15');

span.total('months'); // 3
span.total('days'); // 90
```

## Formatting durations

Every instance sets `.text` to its localized long form. Call `format()` with a preset style for spelled-out, abbreviated, compact, or digital output:

```js
import { duration } from 'native-dates';

const flight = duration({ hours: 2, minutes: 30 });

flight.text; // '2 hours, 30 minutes'
flight.format('long', 'en-US'); // '2 hours, 30 minutes'
flight.format('short', 'en-US'); // '2 hr, 30 min'
flight.format('narrow', 'en-US'); // '2h 30m'
flight.format('digital', 'en-US'); // '2:30:00'
```

Pass a locale tag as the second argument to translate unit labels, or call `toString()` when you need an ISO 8601 string for an API payload.
