---
title: DateTime
kind: class
lede: A specific moment in time, viewed in a time zone.
import: import { DateTime } from 'native-dates'
size: core
updated: 2026-11-12
---

## Creating a DateTime

Create an instance from an existing value with [`datetime()`](/api/datetime-fn/), read the current time with [`now()`](/api/datetime-fn/#now), or combine a calendar date with a time using [`at()`](/api/calendar-date/#at). Instances are immutable, so every method that changes a value returns a new one.

```js title="create.js"
import { date, datetime, now } from 'native-dates';

const fromUtc = datetime('2026-11-16T17:30:00Z', 'America/Los_Angeles');
const standup = date('2026-11-16').at('9:30am', 'America/Los_Angeles');
const current = now();
```

Pass a time zone to view the instant in that zone, or omit it to use the default from [`configure()`](/api/configure/):

```js
const event = datetime('2026-11-16T17:30:00Z', 'America/New_York');
event.zone; // 'America/New_York'
event.hour; // 12
```

:::note[Offsets set the moment, not the zone]
A trailing `Z` or numeric offset in an input string identifies when the moment happened, while the instance uses the zone you pass or your configured default. Pass `'UTC'` as the zone when you want UTC fields and date math.
:::

## Properties

Properties read the date and time in the instance's time zone.

| Property | Type | Description |
|---|---|---|
| `text` | `string` | Locale-formatted date, time, and short zone name, such as `'Nov 16, 2026, 9:30 AM PST'`. |
| `year`, `month`, `day` | `number` | Calendar year, month (1–12), and day of month (1–31). |
| `hour`, `minute`, `second` | `number` | 24-hour clock fields (0–23, 0–59, 0–59). |
| `millisecond`, `microsecond`, `nanosecond` | `number` | Sub-second clock fields (0–999). |
| `zone` | `string` | Canonical IANA zone ID or fixed offset, such as `'America/Los_Angeles'` or `'UTC'`. |
| `offset` | `string` | Active UTC offset at this instant, such as `'-08:00'`. |
| `epoch` | `number` | Milliseconds since the Unix epoch. |
| `epochNanoseconds` | `bigint` | Exact nanoseconds since the Unix epoch. |
| `date` | `CalendarDate` | Calendar date in this time zone. |
| `time` | `Time` | Time of day in this time zone. |
| `weekday` | `number` | ISO day of the week, from 1 for Monday through 7 for Sunday. |
| `quarter` | `number` | Calendar quarter (1–4). |
| `weekOfYear`, `dayOfYear` | `number` | ISO week number (1–53) and day of the year (1–366). |
| `daysInMonth`, `daysInYear`, `hoursInDay` | `number` | Length of the current month, year, and local calendar day. |

## Time zone and fields

View the same moment in another zone or replace individual calendar and clock fields.

:::entry
### `in()` :kind[method]

```js signature
dt.in(zone): DateTime
```

Returns a new `DateTime` representing the same instant in another time zone. Local calendar and clock properties update to match the target zone, while the underlying timestamp stays the same.

**Parameters**

```params
- name: zone
  type: Zone
  required: true
  description: IANA time zone name such as `'Europe/Berlin'`, fixed UTC offset, or `'UTC'`.
```

**Returns**

```returns
type: DateTime
description: A new `DateTime` at the same instant viewed in `zone`.
```

```js
const standup = datetime('2026-11-16T09:30', 'America/Los_Angeles');
const berlin = standup.in('Europe/Berlin');

berlin.hour; // 18
berlin.equals(standup); // true
```
:::

:::entry
### `at()` :kind[method]

```js signature
dt.at(time): DateTime
```

Returns a new `DateTime` on the same day and in the same time zone, with the time of day replaced.

**Parameters**

```params
- name: time
  type: TimeInput
  required: true
  description: Time string such as `'9:30am'`, `Time` instance, fields object, or `Date`.
```

**Returns**

```returns
type: DateTime
description: A new `DateTime` on the same date at `time`.
```

```js
const morning = datetime('2026-11-16T09:30', 'America/Los_Angeles');
const wrapUp = morning.at('5:00pm');

wrapUp.hour; // 17
```
:::

:::entry
### `set()` :kind[method]

```js signature
dt.set(fields): DateTime
dt.set(unit, value): DateTime
```

Returns a new `DateTime` with one or more calendar or clock fields replaced in the current time zone. Out-of-range dates such as February 30 throw a `RangeError` instead of rolling into the next month.

**Parameters**

```params
- name: fields
  type: DateTimeFields | Unit
  required: true
  description: Object of calendar or clock fields, or a single unit name when passing `value`.
- name: value
  type: number
  description: Whole-number value for the given `unit`.
```

**Returns**

```returns
type: DateTime
description: A new `DateTime` in the same time zone with updated fields.
```

```js
const cutoff = datetime('2026-11-16T09:30', 'America/New_York');

cutoff.set('hour', 17);
cutoff.set({ month: 12, day: 1, hour: 0, minute: 0 });
```
:::

## Arithmetic and rounding

Adding days, weeks, months, or years keeps the same time of day across daylight saving changes. Adding hours, minutes, or seconds counts exact elapsed time.

:::entry
### `plus()` :kind[method]

```js signature
dt.plus(amount, unit?): DateTime
dt.add(amount, unit?): DateTime
```

Moves forward by a duration and returns a new `DateTime` in the same time zone. Also aliased as `add()`.

**Parameters**

```params
- name: amount
  type: DurationInput
  required: true
  description: Count paired with `unit`, `Duration` instance, duration string, fields object, or milliseconds.
- name: unit
  type: Unit
  description: Unit name when `amount` is a number, such as `'days'` or `'hours'`.
```

**Returns**

```returns
type: DateTime
description: A new `DateTime` in the same time zone.
```

```js
// Spring-forward weekend in New York (March 8 has 23 hours)
const sat = datetime('2026-03-07T09:00', 'America/New_York');

sat.plus(1, 'day').hour; // 9
sat.plus(24, 'hours').hour; // 10
sat.plus('1h 30m').format('time', 'en-US'); // '10:30 AM'
```
:::

:::entry
### `minus()` :kind[method]

```js signature
dt.minus(amount, unit?): DateTime
dt.subtract(amount, unit?): DateTime
dt.remove(amount, unit?): DateTime
```

Moves backward by a duration in the same time zone. Accepts the same inputs as [`plus()`](#plus), and is also aliased as `subtract()` and `remove()`.

**Parameters**

```params
- name: amount
  type: DurationInput
  required: true
  description: A numeric count paired with `unit`, a `Duration`, a phrase, an ISO duration, or a fields object.
- name: unit
  type: Unit
  description: Unit name when `amount` is a number.
```

**Returns**

```returns
type: DateTime
description: A new `DateTime` in the same time zone.
```

```js
const deadline = datetime('2026-11-16T17:00', 'America/New_York');

deadline.minus(48, 'hours');
deadline.minus({ weeks: 1, days: 2 });
```
:::

:::entry
### `startOf()` :kind[method]

```js signature
dt.startOf(unit, firstDay?): DateTime
```

Moves back to the start of a calendar or clock unit in this time zone. Week boundaries begin on Monday unless configured otherwise or overridden with `firstDay`.

**Parameters**

```params
- name: unit
  type: Unit
  required: true
  description: Calendar or clock unit from `'year'` down to `'millisecond'`.
- name: firstDay
  type: Weekday
  description: First day of the week when rounding to a week, such as `'sunday'` or `7`.
```

**Returns**

```returns
type: DateTime
description: A new `DateTime` at the start of `unit`.
```

```js
const wed = datetime('2026-11-18T14:45:12', 'America/New_York');

wed.startOf('day').format('time', 'en-US'); // '12:00 AM'
wed.startOf('week').day; // 16
wed.startOf('week', 'sunday').day; // 15
```
:::

:::entry
### `endOf()` :kind[method]

```js signature
dt.endOf(unit, firstDay?): DateTime
```

Moves to the final millisecond of a calendar or clock unit in this time zone.

**Parameters**

```params
- name: unit
  type: Unit
  required: true
  description: Calendar or clock unit from `'year'` down to `'nanosecond'`.
- name: firstDay
  type: Weekday
  description: First day of the week when `unit` is `'week'`.
```

**Returns**

```returns
type: DateTime
description: A new `DateTime` at the last millisecond of `unit`.
```

```js
const nov = datetime('2026-11-18T14:45', 'UTC');

nov.endOf('month').toString(); // '2026-11-30T23:59:59.999Z'
```
:::

:::entry
### `next()` :kind[method]

```js signature
dt.next(weekday): DateTime
```

Moves forward to the next given weekday at the same time of day. If it is already that weekday, it advances a full week.

**Parameters**

```params
- name: weekday
  type: Weekday
  required: true
  description: Weekday name such as `'friday'`, three-letter prefix, or ISO number (1–7).
```

**Returns**

```returns
type: DateTime
description: A new `DateTime` 1 to 7 days later at the same local time.
```

```js
const mon = datetime('2026-11-16T09:30', 'America/Los_Angeles');

mon.next('friday').day; // 20
mon.next('monday').day; // 23
```
:::

:::entry
### `previous()` :kind[method]

```js signature
dt.previous(weekday): DateTime
```

Moves back to the most recent given weekday before this date, keeping the same time of day.

**Parameters**

```params
- name: weekday
  type: Weekday
  required: true
  description: Weekday name, three-letter prefix, or ISO number (1–7).
```

**Returns**

```returns
type: DateTime
description: A new `DateTime` 1 to 7 days earlier at the same local time.
```

```js
const mon = datetime('2026-11-16T09:30', 'America/Los_Angeles');

mon.previous('friday').day; // 13
```
:::

:::entry
### `round()` :kind[method]

```js signature
dt.round(unit): DateTime
dt.round(increment, unit): DateTime
```

Rounds to the nearest unit or step increment, with half-way ties rounding up.

**Parameters**

```params
- name: increment
  type: number | Unit
  required: true
  description: Step size that divides evenly into the next unit, or the target `unit` when rounding to `1`.
- name: unit
  type: Unit
  description: Unit to round, from `'day'` down to `'nanosecond'`.
```

**Returns**

```returns
type: DateTime
description: A new rounded `DateTime` in the same time zone.
```

```js
const stamp = datetime('2026-11-16T09:23:40', 'UTC');

stamp.round('hour').toString(); // '2026-11-16T09:00:00.000Z'
stamp.round(15, 'minutes').toString(); // '2026-11-16T09:30:00.000Z'
```
:::

:::entry
### `floor()` :kind[method]

```js signature
dt.floor(unit): DateTime
dt.floor(increment, unit): DateTime
```

Rounds down to the start of a unit or step increment. Accepts the same arguments as [`round()`](#round).

```js
datetime('2026-11-16T09:29:00Z').floor(15, 'minutes').toString(); // '2026-11-16T09:15:00.000Z'
```
:::

:::entry
### `ceil()` :kind[method]

```js signature
dt.ceil(unit): DateTime
dt.ceil(increment, unit): DateTime
```

Rounds up to the next unit or step increment. Accepts the same arguments as [`round()`](#round).

```js
datetime('2026-11-16T09:01:00Z').ceil(15, 'minutes').toString(); // '2026-11-16T09:15:00.000Z'
```
:::

## Comparing moments

Comparisons check when each moment happened, even if the two values use different time zones.

:::warning[Comparing with ===]
JavaScript's `===` operator checks whether two variables point to the same object in memory. Call `equals()` to check whether two `DateTime` instances represent the same moment.
:::

:::entry
### `equals()` :kind[method]

```js signature
dt.equals(other): boolean
```

Returns `true` when both values represent the exact same instant, regardless of their time zones.

**Parameters**

```params
- name: other
  type: DateTimeInput
  required: true
  description: Another `DateTime` or any input accepted by `datetime()`.
```

**Returns**

```returns
type: boolean
description: '`true` if both values point to the same instant.'
```

```js
const ny = datetime('2026-11-16T12:00', 'America/New_York');
const utc = datetime('2026-11-16T17:00Z', 'UTC');

ny.equals(utc); // true
```
:::

:::entry
### `isBefore()` :kind[method]

```js signature
dt.isBefore(other): boolean
```

Returns `true` if this moment is earlier than the other.

```js
datetime('2026-11-16T16:59Z').isBefore('2026-11-16T17:00Z'); // true
```
:::

:::entry
### `isAfter()` :kind[method]

```js signature
dt.isAfter(other): boolean
```

Returns `true` if this moment is later than the other.

```js
datetime('2026-11-16T17:01Z').isAfter('2026-11-16T17:00Z'); // true
```
:::

:::entry
### `isSame()` :kind[method]

```js signature
dt.isSame(other, unit?, firstDay?): boolean
```

Checks whether another moment falls in the same calendar or clock unit when both are viewed in this instance's time zone. Calling `isSame()` without a unit checks exact instant equality.

**Parameters**

```params
- name: other
  type: DateTimeInput
  required: true
  description: Moment to compare against, viewed in this instance's time zone.
- name: unit
  type: Unit
  description: Calendar or clock unit to compare, such as `'day'` or `'month'`.
- name: firstDay
  type: Weekday
  description: First day of the week when `unit` is `'week'`.
```

**Returns**

```returns
type: boolean
description: '`true` when both moments fall in the same `unit` in this time zone.'
```

```js
const la = datetime('2026-11-16T09:30', 'America/Los_Angeles');
const lateUtc = datetime('2026-11-17T02:00Z', 'UTC');

la.isSame(lateUtc, 'day'); // true (6:00 PM Nov 16 in Los Angeles)
lateUtc.isSame(la, 'day'); // false (Nov 17 vs Nov 16 in UTC)
```
:::

### Calendar predicates

Zero-argument checks evaluated in the instance's time zone:

| Method | Type | Description |
|---|---|---|
| `isPast()`, `isFuture()` | `boolean` | Whether this instant is strictly before or after the current time. |
| `isToday()`, `isTomorrow()`, `isYesterday()` | `boolean` | Whether the local calendar date matches today, tomorrow, or yesterday in this zone. |
| `isWeekday()`, `isWeekend()` | `boolean` | Monday through Friday vs. Saturday and Sunday. |
| `isLeapYear()` | `boolean` | Whether the local year is a leap year. |

## Measuring time

:::entry
### `until()` :kind[method]

```js signature
dt.until(other): Duration
dt.until(other, unit): number
```

Measures the time from this moment to another, returning a negative span when the target is earlier. Pass a unit name to get the total length as a single number instead of a `Duration`.

**Parameters**

```params
- name: other
  type: DateTimeInput
  required: true
  description: Target moment to measure toward.
- name: unit
  type: Unit
  description: Unit to return the total length in as a floating-point number.
```

**Returns**

```returns
type: Duration | number
description: A `Duration` balanced up to years, or a number when `unit` is given.
```

```js
const doors = datetime('2026-11-16T08:00', 'America/Los_Angeles');
const standup = datetime('2026-11-16T09:30', 'America/Los_Angeles');

doors.until(standup).format('long', 'en-US'); // '1 hour, 30 minutes'
doors.until(standup, 'hours'); // 1.5
```
:::

:::entry
### `since()` :kind[method]

```js signature
dt.since(other): Duration
dt.since(other, unit): number
```

Measures the time elapsed since an earlier moment. Pass a unit name to get the total as a number.

```js
const standup = datetime('2026-11-16T09:30', 'America/Los_Angeles');

standup.since('2026-11-16T08:00', 'minutes'); // 90
```
:::

## Formatting and conversion

:::entry
### `format()` :kind[method]

```js signature
dt.format(spec?, locale?): string
```

Formats the date and time in its active zone using `Intl.DateTimeFormat`. Accepts a preset style, an `Intl` options object, or a token string when [`@native-dates/plugins/tokens`](/plugins/tokens/) is loaded.

**Parameters**

```params
- name: spec
  type: FormatSpec
  default: "'medium'"
  description: Preset style such as `'medium'` or `'date'`, `Intl.DateTimeFormatOptions` object, or token pattern.
- name: locale
  type: string
  description: BCP 47 locale tag overriding the configured default for this call.
```

**Returns**

```returns
type: string
description: Formatted string in the instance's time zone.
```

```js
const standup = datetime('2026-11-16T09:30', 'America/Los_Angeles');

standup.format('medium', 'en-US'); // 'Nov 16, 2026, 9:30 AM'
standup.format('full', 'en-US'); // 'Monday, November 16, 2026 at 9:30 AM'
standup.format('date', 'en-US'); // 'Nov 16, 2026'
standup.format('time', 'en-US'); // '9:30 AM'
standup.format('month', 'en-US'); // 'November 2026'
standup.format('text', 'en-US'); // 'Nov 16, 2026, 9:30 AM PST'
standup.format({ weekday: 'short', hour: '2-digit', minute: '2-digit' }, 'de-DE'); // 'Mo., 09:30'
```
:::

:::entry
### `toString()` :kind[method]

```js signature
dt.toString(): string
dt.toJSON(): string
```

Returns the instant as a UTC ISO 8601 string, suitable for databases, URLs, and network payloads. `toJSON()` returns the same string for `JSON.stringify()`.

**Returns**

```returns
type: string
description: UTC ISO 8601 timestamp, such as `'2026-11-16T17:30:00.000Z'`.
```

```js
const standup = datetime('2026-11-16T09:30', 'America/Los_Angeles');

standup.toString(); // '2026-11-16T17:30:00.000Z'
JSON.stringify({ standup }); // '{"standup":"2026-11-16T17:30:00.000Z"}'
```
:::

:::entry
### `toJSDate()` :kind[method]

```js signature
dt.toJSDate(): Date
```

Returns a native JavaScript `Date` for the same instant.
:::

:::entry
### `toTemporal()` :kind[method]

```js signature
dt.toTemporal(): Temporal.ZonedDateTime
```

Returns the underlying `Temporal.ZonedDateTime` instance.
:::

:::entry
### `valueOf()` :kind[method]

```js signature
dt.valueOf(): number
```

Returns epoch milliseconds so two `DateTime` values can be subtracted or compared with numeric operators.
:::
