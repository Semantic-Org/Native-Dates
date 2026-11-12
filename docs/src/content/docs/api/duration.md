---
title: Duration
kind: class
lede: A length of time across calendar and clock units.
import: import { Duration } from 'native-dates'
size: core
updated: 2026-11-12
---

## Creating a Duration

Parse phrases and ISO 8601 strings with [`duration()`](/api/duration-fn/), call unit helpers like [`hours()`](/api/duration-fn/), or measure the span between two dates or times. Instances are immutable, so every method returns a new value.

```js title="create.js"
import { date, days, duration, hours } from 'native-dates';

const breakTime = duration('1h 30m');
const trial = days(14);
const timeout = hours(1.5);
const quarter = date('2026-01-01').until('2026-04-01');
```

:::note[Fields stay as written]
Creating a duration from 90 minutes keeps `minutes` at `90` rather than converting to 1 hour and 30 minutes. Calendar days also stay separate from hours across daylight saving changes until you call `balance()`.
:::

## Properties

Properties reflect the unit counts stored on the duration.

| Property | Type | Description |
|---|---|---|
| `text` | `string` | Locale-formatted duration in long style, such as `'1 hour, 30 minutes'`. |
| `years`, `months`, `weeks`, `days` | `number` | Signed calendar unit counts stored on this duration. |
| `hours`, `minutes`, `seconds` | `number` | Signed clock unit counts. |
| `milliseconds`, `microseconds`, `nanoseconds` | `number` | Signed sub-second unit counts. |
| `sign` | `number` | Overall direction of the duration: `1`, `0`, or `-1`. |
| `anchor` | `TemporalValue` | Starting point recorded by `until()` or `since()`, or `undefined` on standalone durations. |

## Arithmetic and sign

Combine durations, scale them by a factor, or flip their sign. All non-zero fields in a duration must share the same sign.

:::entry
### `plus()` :kind[method]

```js signature
dur.plus(other, unit?): Duration
dur.add(other, unit?): Duration
```

Adds another duration and returns a new `Duration`. Calendar units add field-by-field while clock units combine cleanly, and `add()` is an alias.

**Parameters**

```params
- name: other
  type: DurationInput
  required: true
  description: Count paired with `unit`, `Duration` instance, duration string, fields object, or milliseconds.
- name: unit
  type: Unit
  description: Unit name when `other` is a number, such as `'minutes'` or `'days'`.
```

**Returns**

```returns
type: Duration
description: A new combined `Duration`.
```

```js
hours(2).plus(30, 'minutes').toString(); // 'PT2H30M'
days(1).plus('6h').toString(); // 'P1DT6H'
```
:::

:::entry
### `minus()` :kind[method]

```js signature
dur.minus(other, unit?): Duration
dur.subtract(other, unit?): Duration
dur.remove(other, unit?): Duration
```

Subtracts another duration, throwing an error if calendar and clock fields end up with opposite signs. Accepts the same inputs as [`plus()`](#plus), and is also aliased as `subtract()` and `remove()`.

**Parameters**

```params
- name: other
  type: DurationInput
  required: true
  description: Count paired with `unit`, `Duration` instance, duration string, fields object, or milliseconds.
- name: unit
  type: Unit
  description: Unit name when `other` is a number.
```

**Returns**

```returns
type: Duration
description: A new `Duration` with `other` subtracted.
```

```js
hours(2).minus('30m').toString(); // 'PT1H30M'
```
:::

:::entry
### `times()` :kind[method]

```js signature
dur.times(factor): Duration
```

Multiplies every field by a number, spilling fractional results into smaller units.

**Parameters**

```params
- name: factor
  type: number
  required: true
  description: Multiplier to scale the duration by, including fractional or negative numbers.
```

**Returns**

```returns
type: Duration
description: A new scaled `Duration`.
```

```js
hours(1).times(1.5).toString(); // 'PT1H30M'
days(1).times(3).toString(); // 'P3D'
```
:::

:::entry
### `abs()` :kind[method]

```js signature
dur.abs(): Duration
```

Returns a copy with all fields made positive.

```js
duration('-1h 30m').abs().toString(); // 'PT1H30M'
```
:::

:::entry
### `negated()` :kind[method]

```js signature
dur.negated(): Duration
```

Reverses the sign of every field in the duration.

```js
hours(2).negated().toString(); // '-PT2H'
```
:::

## Balancing, rounding, and totals

Roll smaller units up into larger ones, round to a target precision, or express the entire span as a single number.

:::warning[Months and years need a starting date]
Standalone calendar spans like `months(1)` have no fixed day count, so converting them to days or milliseconds throws a `RangeError`. Measure between two dates with `until()` when you need exact totals across months or years.
:::

:::entry
### `balance()` :kind[method]

```js signature
dur.balance(largestUnit?): Duration
```

Carries overflow from smaller units into larger ones. By default, standalone durations balance up to hours and measured spans balance up to days, unless you pass a larger target unit.

**Parameters**

```params
- name: largestUnit
  type: Unit
  description: Largest unit to roll values up into, such as `'hour'`, `'day'`, or `'week'`.
```

**Returns**

```returns
type: Duration
description: A new balanced `Duration`.
```

```js
import { minutes } from 'native-dates';

minutes(150).balance().toString(); // 'PT2H30M'
duration('36h').balance('day').toString(); // 'P1DT12H'
duration('10d').balance('week').toString(); // 'P1W3D'
```
:::

:::entry
### `total()` :kind[method]

```js signature
dur.total(unit): number
```

Returns the entire length of the duration as a single floating-point number in the given unit.

**Parameters**

```params
- name: unit
  type: Unit
  required: true
  description: Target unit to express the total length in, such as `'hours'` or `'days'`.
```

**Returns**

```returns
type: number
description: Total length in `unit`, including any fractional part.
```

```js
minutes(90).total('hours'); // 1.5
days(14).total('weeks'); // 2
date('2026-01-01').until('2026-07-01').total('months'); // 6
```
:::

:::entry
### `round()` :kind[method]

```js signature
dur.round(smallestUnit): Duration
```

Rounds the duration to the nearest whole unit, with half-way ties rounding away from zero.

**Parameters**

```params
- name: smallestUnit
  type: Unit
  required: true
  description: Smallest unit to keep after rounding, such as `'minute'` or `'hour'`.
```

**Returns**

```returns
type: Duration
description: A new rounded `Duration`.
```

```js
minutes(90).round('hour').toString(); // 'PT2H'
duration('1h 20m').round('hour').toString(); // 'PT1H'
```
:::

## Comparing durations

Compare durations by total length rather than how their fields were written, so 60 minutes equals 1 hour.

:::entry
### `equals()` :kind[method]

```js signature
dur.equals(other): boolean
```

Returns `true` when both durations represent the same total length.

**Parameters**

```params
- name: other
  type: DurationInput
  required: true
  description: Another `Duration` or any input accepted by `duration()`.
```

**Returns**

```returns
type: boolean
description: '`true` if both durations have equal length.'
```

```js
import { months } from 'native-dates';

hours(1).equals(minutes(60)); // true
months(1).equals('P1M'); // true
```
:::

:::entry
### `compare()` :kind[method]

```js signature
dur.compare(other): number
```

Orders this duration against another by total length for sorting.

**Parameters**

```params
- name: other
  type: DurationInput
  required: true
  description: Duration to compare against.
```

**Returns**

```returns
type: number
description: '`-1` when shorter, `0` when equal, or `1` when longer.'
```

```js
hours(1).compare(minutes(90)); // -1
date('2026-01-01').until('2026-02-01').compare(days(31)); // 0
```
:::

### Sign predicates

Zero-argument checks for empty or negative spans:

| Method | Type | Description |
|---|---|---|
| `isZero()` | `boolean` | Whether every unit on the duration is zero. |
| `isNegative()` | `boolean` | Whether the duration represents a negative span. |

## Formatting and conversion

:::entry
### `format()` :kind[method]

```js signature
dur.format(style?, locale?): string
```

Formats the duration in the active locale using `Intl.DurationFormat`. Clock overflow balances up to hours automatically, and sub-second fields stay hidden whenever larger units are present.

**Parameters**

```params
- name: style
  type: "'long' | 'short' | 'narrow' | 'digital'"
  default: "'long'"
  description: Display style for unit labels, or `'digital'` for a colon-separated timer.
- name: locale
  type: string
  description: BCP 47 locale tag overriding the configured default for this call.
```

**Returns**

```returns
type: string
description: Locale-formatted duration string.
```

```js
const span = duration('2h 30m');

span.format('long', 'en-US'); // '2 hours, 30 minutes'
span.format('short', 'en-US'); // '2 hr, 30 min'
span.format('narrow', 'en-US'); // '2h 30m'
span.format('digital', 'en-US'); // '2:30:00'
```
:::

:::entry
### `toFields()` :kind[method]

```js signature
dur.toFields(): DurationFields
```

Returns a plain object containing only the non-zero plural unit fields on this duration.

```js
duration('1h 30m').toFields(); // { hours: 1, minutes: 30 }
```
:::

:::entry
### `toString()` :kind[method]

```js signature
dur.toString(): string
dur.toJSON(): string
```

Returns the ISO 8601 duration string. `toJSON()` returns the same string for `JSON.stringify()`.

**Returns**

```returns
type: string
description: ISO 8601 duration string, such as `'PT1H30M'`.
```

```js
const ttl = duration('1h 30m');

ttl.toString(); // 'PT1H30M'
JSON.stringify({ ttl }); // '{"ttl":"PT1H30M"}'
```
:::

:::entry
### `toMilliseconds()` :kind[method]

```js signature
dur.toMilliseconds(): number
```

Returns the total length in milliseconds. Unanchored month or year durations throw a `RangeError`.

```js
hours(2).toMilliseconds(); // 7200000
```
:::

:::entry
### `toTemporal()` :kind[method]

```js signature
dur.toTemporal(): Temporal.Duration
```

Returns the underlying `Temporal.Duration` instance.
:::

:::entry
### `valueOf()` :kind[method]

```js signature
dur.valueOf(): number
```

Returns total milliseconds so fixed-length or anchored durations work with timers and numeric comparison operators.
:::
