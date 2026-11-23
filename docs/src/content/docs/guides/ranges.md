---
title: Ranges
lede: Work with spans between two dates, times, or moments, from overlap checks to formatted intervals.
updated: 2026-11-22
---

A [range](/api/ranges/) models a span with a start and an end, such as a hotel booking, opening hours, or a scheduled meeting. Each time type gets its own range class so calendar days stay calendar days and clock spans never pick up a fake date.

## Creating ranges

Create a range directly with [`dateRange()`](/api/range-fn/), [`timeRange()`](/api/range-fn/#timerange), or [`datetimeRange()`](/api/range-fn/#datetimerange). Each factory accepts two endpoints, a start and a duration, or a single interval string:

```js
import { dateRange, datetimeRange, timeRange } from 'native-dates';

const sprint = dateRange('2026-05-01', '2 weeks');
const trip = dateRange('2026-09-01', '2026-09-07');
const hours = timeRange('9am - 5pm');
const meeting = datetimeRange('2026-09-01T09:00', '90m', 'America/New_York');
```

When you already hold a typed date, time, or moment, chain `for()`, `to()`, or `range()` off it directly:

```js
import { today } from 'native-dates';

const upcoming = today().for(2, 'weeks');
const thisMonth = today().range('month');
```

## Inclusive dates and half-open clocks

Calendar date ranges include their final day, because September 1 through September 7 means all seven days. Moment and clock ranges exclude their end boundary so back-to-back slots never collide:

```js
import { dateRange, timeRange } from 'native-dates';

dateRange('2026-09-01', '2026-09-07').duration.days; // 7

const first = timeRange('9:00am', '10:00am');
const second = timeRange('10:00am', '11:00am');
first.overlaps(second); // false
```

When a clock range ends earlier than it starts, it wraps across midnight to cover overnight shifts or late-night venues:

```js
const nightShift = timeRange('22:00', '06:00');

nightShift.contains('02:30'); // true
nightShift.duration.hours; // 8
```

## Containment and overlap

Check whether a point or sub-range falls inside a span with `contains()`, or test two ranges against each other with `overlaps()` and `intersection()`:

```js
import { dateRange } from 'native-dates';

const booking = dateRange('2026-11-10', '2026-11-18');
const holiday = dateRange('2026-11-15', '2026-11-22');

booking.contains('2026-11-14'); // true
booking.overlaps(holiday); // true
booking.intersection(holiday).toString(); // '2026-11-15/2026-11-18'
```

`intersection()` returns `null` when two ranges do not overlap. That makes it easy to branch on availability or scheduling conflicts.

## Walking, counting, and splitting spans

Call `every()` to step across a range and collect each date, time, or moment along the way. On a date range, call `count()` to count days, weekdays, weekends, or a specific weekday directly:

```js
import { dateRange } from 'native-dates';

const sprint = dateRange('2026-05-01', '2 weeks');

sprint.every('week').map(String); // ['2026-05-01', '2026-05-08']
sprint.count(); // 14
sprint.count('weekdays'); // 10
sprint.count('mondays'); // 2
```

Call `split()` when you want sub-ranges instead of individual points, such as dividing a shift into booking slots or a sprint into weekly buckets:

```js
import { timeRange } from 'native-dates';

const morning = timeRange('9:00am', '12:00pm');
const slots = morning.split(30, 'minutes');

slots.length; // 6
slots[0].toString(); // '09:00:00/09:30:00'
```

## Formatting and serializing

Formatting a range with a preset collapses shared months and years automatically through the runtime's locale rules. Pass a token pattern to format both endpoints explicitly:

```js
import { dateRange, timeRange } from 'native-dates';

const week = dateRange('2026-09-01', '2026-09-07');

week.format('medium', 'en-US'); // 'Sep 1 – 7, 2026'
week.format('YYYY-MM-DD'); // '2026-09-01 – 2026-09-07'
timeRange('9:00am', '5:00pm').format('short', 'en-US'); // '9:00 AM – 5:00 PM'
```

Every range exposes its length on `.duration` and writes an ISO 8601 interval string with `toString()`. Passing that string back to the same factory restores the range:

```js
const raw = week.toString(); // '2026-09-01/2026-09-07'
dateRange(raw).equals(week); // true
```
