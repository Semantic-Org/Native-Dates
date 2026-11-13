---
title: Time
kind: class
lede: A time of day with no calendar date and no time zone.
import: import { Time } from 'native-dates'
size: core
updated: 2026-11-12
---

## Creating a Time

Parse 12-hour or 24-hour clock strings, pass hour and minute numbers, or convert an existing value with [`time()`](/api/time-fn/). Instances are immutable, so every method that changes a value returns a new one.

```js title="create.js"
import { time } from 'native-dates';

const morning = time('9:30am');
const evening = time('17:30');
const alarm = time(6, 45);
```

Read the local time of day off any [`DateTime`](/api/date-time/) through its `time` property:

```js
import { datetime, now } from 'native-dates';

const standup = datetime('2026-11-16T09:30', 'America/Los_Angeles');
standup.time.toString(); // '09:30:00'
const currentClock = now().time;
```

## Properties

Properties read the 24-hour clock fields from hours down to nanoseconds.

| Property | Type | Description |
|---|---|---|
| `text` | `string` | Locale-formatted time of day, such as `'9:30 AM'`. |
| `hour`, `minute`, `second` | `number` | 24-hour clock fields (0–23, 0–59, 0–59). |
| `millisecond`, `microsecond`, `nanosecond` | `number` | Sub-second clock fields (0–999). |

## Combining and fields

Place a time of day onto a calendar date, or replace individual clock fields.

:::entry
### `on()` :kind[method]

```js signature
t.on(date, zone?): DateTime
```

Combines this time of day with a calendar date in a time zone and returns a [`DateTime`](/api/date-time/). Mirrors calling [`at()`](/api/calendar-date/#at) on a `CalendarDate`.

**Parameters**

```params
- name: date
  type: CalendarDateInput
  required: true
  description: ISO date string, `CalendarDate`, `DateTime`, fields object, or `Date`.
- name: zone
  type: Zone
  description: IANA time zone name, fixed UTC offset, or `'UTC'`. Defaults to the configured zone.
```

**Returns**

```returns
type: DateTime
description: A new `DateTime` on `date` at this time in `zone`.
```

```js
const opens = time('9:30am');

opens.on('2026-11-16', 'America/New_York').toString(); // '2026-11-16T14:30:00.000Z'
```
:::

:::entry
### `set()` :kind[method]

```js signature
t.set(fields): Time
t.set(unit, value): Time
```

Returns a new `Time` with one or more clock fields replaced. Out-of-range values such as minute 75 throw a `RangeError`.

**Parameters**

```params
- name: fields
  type: DateTimeFields | Unit
  required: true
  description: Object of clock fields, or a single unit name when passing `value`.
- name: value
  type: number
  description: Whole-number value for the given `unit`.
```

**Returns**

```returns
type: Time
description: A new `Time` with updated clock fields.
```

```js
const reminder = time('9:30am');

reminder.set('minute', 45).toString(); // '09:45:00'
reminder.set({ hour: 17, minute: 0 }).toString(); // '17:00:00'
```
:::

## Arithmetic and rounding

Add or subtract clock units, snap to unit boundaries, or round to a step increment. Calendar units such as days and weeks throw a `RangeError` because a time of day has no date.

:::note[Wrapping around midnight]
Clock arithmetic wraps around the 24-hour day like a clock face, so adding 2 hours to 23:00 returns 01:00. Combine the time with a date using `on()` first when crossing midnight should advance the calendar day.
:::

:::entry
### `plus()` :kind[method]

```js signature
t.plus(amount, unit?): Time
t.add(amount, unit?): Time
```

Moves forward on the 24-hour clock and returns a new `Time`, wrapping past midnight when needed. Also aliased as `add()`.

**Parameters**

```params
- name: amount
  type: DurationInput
  required: true
  description: Count paired with `unit`, `Duration` instance, duration string, fields object, or milliseconds.
- name: unit
  type: Unit
  description: Clock unit name when `amount` is a number, such as `'hours'` or `'minutes'`.
```

**Returns**

```returns
type: Time
description: A new `Time` wrapped to the 24-hour clock.
```

```js
time('9:00am').plus(90, 'minutes').toString(); // '10:30:00'
time('23:00').plus('2h').toString(); // '01:00:00'
```
:::

:::entry
### `minus()` :kind[method]

```js signature
t.minus(amount, unit?): Time
t.subtract(amount, unit?): Time
t.remove(amount, unit?): Time
```

Moves backward on the 24-hour clock, wrapping before midnight when needed. Accepts the same inputs as [`plus()`](#plus), and is also aliased as `subtract()` and `remove()`.

**Parameters**

```params
- name: amount
  type: DurationInput
  required: true
  description: Count paired with `unit`, `Duration` instance, duration string, fields object, or milliseconds.
- name: unit
  type: Unit
  description: Clock unit name when `amount` is a number.
```

**Returns**

```returns
type: Time
description: A new `Time` wrapped to the 24-hour clock.
```

```js
time('00:30').minus(45, 'minutes').toString(); // '23:45:00'
```
:::

:::entry
### `startOf()` :kind[method]

```js signature
t.startOf(unit): Time
```

Zeros out all clock fields smaller than the given unit.

**Parameters**

```params
- name: unit
  type: Unit
  required: true
  description: Clock unit from `'hour'` down to `'nanosecond'`.
```

**Returns**

```returns
type: Time
description: A new `Time` at the start of `unit`.
```

```js
time('14:37:22').startOf('hour').toString(); // '14:00:00'
```
:::

:::entry
### `endOf()` :kind[method]

```js signature
t.endOf(unit): Time
```

Moves to the final millisecond of the given clock unit.

**Parameters**

```params
- name: unit
  type: Unit
  required: true
  description: Clock unit from `'hour'` down to `'nanosecond'`.
```

**Returns**

```returns
type: Time
description: A new `Time` at the last millisecond of `unit`.
```

```js
time('14:37:22').endOf('hour').toString(); // '14:59:59.999'
```
:::

:::entry
### `round()` :kind[method]

```js signature
t.round(unit): Time
t.round(increment, unit): Time
```

Rounds to the nearest clock unit or step increment, with half-way ties rounding up.

**Parameters**

```params
- name: increment
  type: number | Unit
  required: true
  description: Step size that divides evenly into the next unit, or the target `unit` when rounding to `1`.
- name: unit
  type: Unit
  description: Clock unit to round, from `'hour'` down to `'nanosecond'`.
```

**Returns**

```returns
type: Time
description: A new rounded `Time`.
```

```js
const checkin = time('14:36:00');

checkin.round('hour').toString(); // '15:00:00'
checkin.round(15, 'minutes').toString(); // '14:30:00'
```
:::

:::entry
### `floor()` :kind[method]

```js signature
t.floor(unit): Time
t.floor(increment, unit): Time
```

Rounds down to the start of a clock unit or step increment. Accepts the same arguments as [`round()`](#round).

```js
time('14:29').floor(15, 'minutes').toString(); // '14:15:00'
```
:::

:::entry
### `ceil()` :kind[method]

```js signature
t.ceil(unit): Time
t.ceil(increment, unit): Time
```

Rounds up to the next clock unit or step increment. Accepts the same arguments as [`round()`](#round).

```js
time('14:01').ceil(15, 'minutes').toString(); // '14:15:00'
```
:::

## Comparing times

Comparisons order times within a single day from midnight through the end of the day. Relational operators like `<` throw a `RangeError`, so compare values with methods or [`compare()`](/api/compare/).

:::entry
### `equals()` :kind[method]

```js signature
t.equals(other): boolean
```

Returns `true` when both values represent the exact same time of day.

**Parameters**

```params
- name: other
  type: TimeInput
  required: true
  description: Another `Time` or any input accepted by `time()`.
```

**Returns**

```returns
type: boolean
description: '`true` if both values match to the nanosecond.'
```

```js
time('5:30pm').equals('17:30'); // true
```
:::

:::entry
### `isBefore()` :kind[method]

```js signature
t.isBefore(other): boolean
```

Returns `true` if this time is earlier in the day than the other.

```js
time('9:00am').isBefore('5:00pm'); // true
```
:::

:::entry
### `isAfter()` :kind[method]

```js signature
t.isAfter(other): boolean
```

Returns `true` if this time is later in the day than the other.

```js
time('5:00pm').isAfter('9:00am'); // true
```
:::

:::entry
### `isSame()` :kind[method]

```js signature
t.isSame(other, unit?): boolean
```

Checks whether another time falls within the same clock unit, such as the same hour or minute. Calling `isSame()` without a unit checks exact equality.

**Parameters**

```params
- name: other
  type: TimeInput
  required: true
  description: Time to compare against.
- name: unit
  type: Unit
  description: Clock unit to compare, such as `'hour'` or `'minute'`.
```

**Returns**

```returns
type: boolean
description: '`true` when both times share the same `unit`.'
```

```js
time('9:05am').isSame('9:45am', 'hour'); // true
time('9:05am').isSame('10:05am', 'hour'); // false
```
:::

## Measuring spans

:::entry
### `until()` :kind[method]

```js signature
t.until(other): Duration
t.until(other, unit): number
```

Measures the signed time from this time to another within the same day, returning a negative span when the target is earlier. Pass a unit name to get the total length as a number.

**Parameters**

```params
- name: other
  type: TimeInput
  required: true
  description: Target time to measure toward.
- name: unit
  type: Unit
  description: Clock unit to return the total length in as a floating-point number.
```

**Returns**

```returns
type: Duration | number
description: A `Duration` balanced up to hours, or a number when `unit` is given.
```

```js
const opens = time('9:00am');
const closes = time('5:30pm');

opens.until(closes).format('long', 'en-US'); // '8 hours, 30 minutes'
opens.until(closes, 'hours'); // 8.5
time('22:00').until('02:00', 'hours'); // -20
```
:::

:::entry
### `since()` :kind[method]

```js signature
t.since(other): Duration
t.since(other, unit): number
```

Measures the time elapsed since an earlier time on the same day. Pass a unit name to get the total as a number.

```js
time('5:00pm').since('9:00am', 'hours'); // 8
```
:::

:::entry
### `to()` :kind[method]

```js signature
t.to(end): TimeRange
t.to(count, unit): TimeRange
```

Creates a half-open [`TimeRange`](/api/ranges/) from this time until the target time or elapsed duration. An end earlier than the start wraps overnight across midnight.

**Parameters**

```params
- name: end
  type: TimeInput | DurationInput | number
  required: true
  description: Closing time, clock duration, or numeric `count` paired with `unit`.
- name: unit
  type: Unit
  description: Clock unit name when the first argument is a numeric count, such as `'hours'` or `'minutes'`.
```

**Returns**

```returns
type: TimeRange
description: A half-open `TimeRange` starting at this time.
```

```js
time('9:00am').to('5:00pm').duration.hours; // 8
time('9:00am').to(90, 'minutes').end.toString(); // '10:30:00'
time('22:00').to('06:00').duration.hours; // 8
```
:::

## Formatting and conversion

:::entry
### `format()` :kind[method]

```js signature
t.format(spec?, locale?): string
```

Formats the time of day using named presets, `'LT'` and `'LTS'` localized presets, options objects, or token patterns.

Options objects ignore date and zone keys, so one shared options object can format moments, dates, and times alike. See [Formatting](/guides/formatting/) for the full preset and token reference.

**Parameters**

```params
- name: spec
  type: FormatSpec
  default: "'short'"
  description: Preset name such as `'short'` or `'LTS'`, `Intl` options object, or token pattern.
- name: locale
  type: string
  description: BCP 47 locale tag overriding the configured default for this call.
```

**Returns**

```returns
type: string
description: Formatted time string.
```

```js
const afternoon = time('17:30:15');

afternoon.format('short', 'en-US'); // '5:30 PM'
afternoon.format('LTS', 'en-US'); // '5:30:15 PM'
afternoon.format('HH:mm:ss'); // '17:30:15'
afternoon.format('h:mm a'); // '5:30 pm'
afternoon.format({ hour12: false }, 'en-US'); // '17:30'
```
:::

:::entry
### `toString()` :kind[method]

```js signature
t.toString(): string
t.toJSON(): string
```

Returns the 24-hour ISO 8601 time string, printing sub-second digits in groups of three only when nonzero. `toJSON()` returns the same string for `JSON.stringify()`.

**Returns**

```returns
type: string
description: ISO 8601 time string, such as `'17:30:00'` or `'17:30:15.250'`.
```

```js
time('5:30pm').toString(); // '17:30:00'
time('17:30:15.25').toString(); // '17:30:15.250'
JSON.stringify({ opens: time('9am') }); // '{"opens":"09:00:00"}'
```
:::

:::entry
### `as()` :kind[method]

```js signature
t.as('time'): Time
```

Returns this `Time` when `'time'` is requested in generic conversion chains, throwing a `RangeError` for other kinds.
:::

:::entry
### `toTemporal()` :kind[method]

```js signature
t.toTemporal(): Temporal.PlainTime
```

Returns the underlying `Temporal.PlainTime` instance.
:::

:::entry
### `valueOf()` :kind[method]

```js signature
t.valueOf(): never
```

Throws a `RangeError` so numeric operators never silently coerce a time of day to a number.
:::
