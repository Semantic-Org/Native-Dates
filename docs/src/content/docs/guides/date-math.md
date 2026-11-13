---
title: Date math
lede: Add and subtract durations, snap to calendar boundaries, round clock times, and step across weekdays or ranges without mutating values.
updated: 2026-11-12
---

Every date, time, and moment in Native Dates is immutable. Methods that shift or round a value always return a new instance and leave the original untouched.

## Adding and subtracting

Call `plus()` or `minus()` to move forward or backward in time:

```js
import { date } from 'native-dates';

const created = date('2026-11-16');
const due = created.plus(2, 'weeks');

created.toString(); // '2026-11-16'
due.toString(); // '2026-11-30'
```

Both methods accept a count and unit, a readable phrase, a fields object, or a [`Duration`](/api/duration/) instance. Standard `add()` and `subtract()` names work as aliases too:

```js
import { datetime, hours } from 'native-dates';

const kickoff = datetime('2026-11-16T09:00', 'America/New_York');

kickoff.plus(2, 'weeks');
kickoff.plus('1h 30m');
kickoff.plus({ days: 2, hours: 4 });
kickoff.minus(hours(3));
```

:::tip[Units must match the type]
A calendar date rejects clock units like hours because it has no time of day. A clock time rejects calendar units like days because it wraps at midnight. Combine them with `at()` first when your math crosses both.
:::

## Month ends and daylight saving

Adding months or years clamps to the last valid day of the target month rather than spilling into the next month. Adding a month to January 31 lands on February 28, or February 29 in a leap year:

```js
import { date } from 'native-dates';

date('2026-01-31').plus(1, 'month').toString(); // '2026-02-28'
date('2028-01-31').plus(1, 'month').toString(); // '2028-02-29'
```

On a [`DateTime`](/api/date-time/), calendar units preserve the local time of day across daylight saving changes. Clock units count exact elapsed hours and minutes instead:

```js
import { datetime } from 'native-dates';

const saturday = datetime('2026-03-07T09:00', 'America/New_York');

saturday.plus(1, 'day').text; // 'Mar 8, 2026, 9:00 AM EDT'
saturday.plus(24, 'hours').text; // 'Mar 8, 2026, 10:00 AM EDT'
```

See [Time zones](/guides/time-zones/) for a closer look at spring-forward and fall-back transitions.

## Snapping to unit boundaries

Call `startOf()` and `endOf()` to snap to the start or end of a year, quarter, month, week, day, or clock unit.

On a calendar date, the end of a month is its final day. On a moment, the end of a unit is its final millisecond:

```js
import { date, datetime } from 'native-dates';

const midMonth = date('2026-11-18');
midMonth.startOf('month').toString(); // '2026-11-01'
midMonth.endOf('month').toString(); // '2026-11-30'

const stamp = datetime('2026-11-18T14:20', 'UTC');
stamp.endOf('day').toString(); // '2026-11-18T23:59:59.999Z'
```

Weeks start on Monday by default. Pass a weekday as the second argument for one call, or set a global default with [`configure()`](/api/configure/):

```js
const wednesday = date('2026-11-18');

wednesday.startOf('week').toString(); // '2026-11-16'
wednesday.startOf('week', 'sunday').toString(); // '2026-11-15'
```

## Rounding clock times

Call `round()` on a moment or time to snap to the nearest unit or a step increment, or round in one direction:

```js
import { time } from 'native-dates';

const logged = time('9:23am');

logged.round('hour').format('short', 'en-US'); // '9:00 AM'
logged.round(15, 'minutes').format('short', 'en-US'); // '9:30 AM'
logged.floor(15, 'minutes').format('short', 'en-US'); // '9:15 AM'
logged.ceil(15, 'minutes').format('short', 'en-US'); // '9:30 AM'
```

Step increments such as 5, 10, 15, or 30 minutes must divide evenly into the next larger unit.

## Stepping by weekday or recurring date

Call `next()` or `previous()` on a date or moment to step to an upcoming or recent weekday. If it already falls on that weekday, it moves a full seven days:

```js
import { date } from 'native-dates';

const monday = date('2026-11-16');

monday.next('friday').toString(); // '2026-11-20'
monday.next('monday').toString(); // '2026-11-23'
monday.previous('friday').toString(); // '2026-11-13'
```

Pass a [`MonthDay`](/api/month-day/) to step directly to the upcoming or prior occurrence of a birthday or annual holiday:

```js
import { monthDay } from 'native-dates';

const birthday = monthDay('10/17');
monday.next(birthday).toString(); // '2027-10-17'
```

## Building and stepping ranges

Call `to()` on any date, time, or moment to build a [range](/api/ranges/). Walk across its steps with `points()`, or divide it into smaller sub-ranges:

```js
const sprint = date('2026-11-02').to(2, 'weeks');

sprint.end.toString(); // '2026-11-15'
sprint.points('week').map(String); // ['2026-11-02', '2026-11-09']
sprint.split(1, 'week').length; // 2
```
