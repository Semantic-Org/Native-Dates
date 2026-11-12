---
title: duration()
kind: function
lede: Create a Duration from a human phrase, an ISO 8601 duration, a count and unit, or unit helpers.
import: import { duration, hours } from 'native-dates'
size: core
updated: 2026-11-12
---

## Creating durations

:::entry
### `duration()` :kind[function]

```js signature
duration(input, unit?): Duration
duration(input, options?): Duration
```

Creates a [`Duration`](/api/duration/) from a count and unit, a plain-English phrase, an ISO 8601 duration string, a fields object, or milliseconds. Fields stay as written until you call [`balance()`](/api/duration/#balance), so 90 minutes stays 90 minutes rather than converting to an hour and a half.

```js title="lengths.js"
import { duration } from 'native-dates';

const phrase = duration('1h 30m');
const words = duration('2 weeks and 3 days');
const iso = duration('PT1H30M');
const count = duration(90, 'minutes');
const spilled = duration(1.5, 'days');
const fields = duration({ hours: 1, minutes: 30 });
const ms = duration(1500);

spilled.days; // 1
spilled.hours; // 12
ms.seconds; // 0
ms.milliseconds; // 1500
```

**Parameters**

```params
- name: input
  type: DurationInput
  required: true
  description: Number paired with `unit`, duration phrase, ISO 8601 string, fields object, `Duration`, or milliseconds.
- name: unitOrOptions
  type: "Unit | { loose?: boolean }"
  description: "Unit name when `input` is a numeric count, or loose options with `@native-dates/plugins/loose`."
```

**Returns**

```returns
type: Duration
description: "A `Duration` keeping the written fields, or `null` when loose mode cannot read `input`."
```

With [`@native-dates/plugins/loose`](/plugins/loose/) imported, loose mode returns `null` instead of throwing when user-entered text cannot be parsed as a length:

```js
import { duration } from 'native-dates';
import '@native-dates/plugins/loose';

duration('45 mins', { loose: true })?.minutes; // 45
duration('soon', { loose: true }); // null
```
:::

### Accepted inputs

| Input | Example | How it reads |
|---|---|---|
| Count and unit | `duration(90, 'minutes')`, `duration(1.5, 'days')` | Pairs a number or numeric string with a unit, spilling fractions into the next smaller unit. |
| Human phrase | `'1h 30m'`, `'2 weeks and 3 days'`, `'-15m'` | Reads space, comma, or `and`-separated quantities with full unit names or abbreviations. |
| ISO 8601 string | `'PT1H30M'`, `'P2W3D'` | Parses standard ISO 8601 duration strings. |
| Fields object | `{ hours: 1, minutes: 30 }` | Reads singular or plural unit keys where all non-zero fields share one sign. |
| Milliseconds | `duration(1500)`, `duration(0)` | Treats a bare number or numeric string with no unit as milliseconds. |
| Duration or Temporal | `hours(2)`, `Temporal.Duration` | Returns an existing `Duration` unchanged or wraps a `Temporal.Duration`. |

:::note[Fractional units and single signs]
Fractional counts spill into smaller exact units, so `duration(1.5, 'days')` becomes 1 day and 12 hours. Because months have no fixed day count, fractional months throw a `RangeError`, as do mixed-sign phrases like `'1h -30m'`.
:::

## Unit helpers

Unit helpers build single-unit durations that read naturally inside arithmetic calls and expressions. Each helper accepts a positive or negative number, or a numeric string.

```js
import { days, hours, minutes, today } from 'native-dates';

const reminder = today().plus(days(3)).at('9:00am');
const block = hours(1).plus(minutes(30));

block.format('short', 'en-US'); // '1 hr, 30 min'
```

:::entry
### `years()` :kind[function]

```js signature
years(count): Duration
```

Creates a duration for the given number of years, spilling fractional years into months.
:::

:::entry
### `months()` :kind[function]

```js signature
months(count): Duration
```

Creates a duration for a whole number of calendar months.
:::

:::entry
### `weeks()` :kind[function]

```js signature
weeks(count): Duration
```

Creates a duration for the given number of weeks, spilling fractions into days.
:::

:::entry
### `days()` :kind[function]

```js signature
days(count): Duration
```

Creates a duration for the given number of calendar days, spilling fractions into hours.
:::

:::entry
### `hours()` :kind[function]

```js signature
hours(count): Duration
```

Creates a duration for the given number of hours, spilling fractions into minutes.
:::

:::entry
### `minutes()` :kind[function]

```js signature
minutes(count): Duration
```

Creates a duration for the given number of minutes, spilling fractions into seconds.
:::

:::entry
### `seconds()` :kind[function]

```js signature
seconds(count): Duration
```

Creates a duration for the given number of seconds, spilling fractions into milliseconds.
:::

:::entry
### `milliseconds()` :kind[function]

```js signature
milliseconds(count): Duration
```

Creates a duration for the given number of milliseconds, spilling fractions down to microseconds and nanoseconds.
:::
