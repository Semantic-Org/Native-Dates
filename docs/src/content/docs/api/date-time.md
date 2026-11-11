---
title: DateTime
kind: class
lede: An exact moment with a zone to read it in. One type for timestamps, appointments and deadlines.
import: import { DateTime } from 'native-dates'
size: core
updated: 2026-11-10
---

## Create a datetime

`datetime()` reads a value into a `DateTime`, and `now()` is the current moment. A date becomes one with `at()`.

```js title="moments.js"
import { date, datetime, now } from 'native-dates';

const sent = datetime('2026-11-16T17:30Z');
const standup = date('2026-11-16').at('9:30am', 'America/Los_Angeles');
const opened = now();
```

:::note[Frozen on creation]
A `DateTime` never changes. Every method that moves it returns a new one, so a value you hand to another function comes back as you sent it.
:::

## Properties

The parts are plain properties, with `text` first, so a datetime logged to the console reads at a glance.

| Property | Type | Description |
|---|---|---|
| `text` | `string` | The moment in the locale’s common form, `'Nov 16, 2026, 9:30 AM PST'`. |
| `year` `month` `day` | `number` | The calendar parts in its zone. `month` counts from 1. |
| `weekday` | `number` | 1 for Monday through 7 for Sunday. |
| `hour` `minute` `second` `millisecond` | `number` | The clock parts in its zone. |
| `zone` | `string` | The zone’s canonical id, `'America/Los_Angeles'`. |
| `offset` | `string` | The UTC offset in effect, `'-08:00'`. |
| `epoch` | `number` | Milliseconds since the Unix epoch. |
| `date` | `CalendarDate` | The calendar date in its zone. |
| `time` | `Time` | The time of day in its zone. |
| `hoursInDay` | `number` | 23, 24 or 25 across a daylight saving change. |

## Methods

:::entry
### `plus()` :kind[method]

```js signature
datetime.plus(amount, unit?): DateTime
```

Adds a length of time. Days keep the wall clock across a daylight saving change, and hours count hours. `add()` is the same method under another name.

**Parameters**

```params
- name: amount
  type: number | string | Duration
  required: true
  description: A count for `unit`, a phrase such as `'1h 30m'`, or a `Duration`.
- name: unit
  type: string
  description: The unit `amount` counts, singular or plural, `'day'` or `'days'`.
```

**Returns**

```returns
type: DateTime
description: A new datetime in the same zone.
```

```js
standup.plus(2, 'days');
standup.plus('1h 30m');
```
:::

:::entry
### `in()` :kind[method]

```js signature
datetime.in(zone): DateTime
```

Reads the same moment in another zone. The result `equals()` the original.

**Parameters**

```params
- name: zone
  type: string
  required: true
  description: An IANA name such as `'Europe/Berlin'`, a fixed offset such as `'+05:30'`, or `'UTC'`.
```

**Returns**

```returns
type: DateTime
description: The same instant with its parts read in `zone`.
```
:::

:::entry
### `until()` :kind[method]

```js signature
datetime.until(other, unit?): Duration | number
```

The length of time from this moment to another. With a `unit`, the whole length as one number.

**Parameters**

```params
- name: other
  type: DateTime | string | Date
  required: true
  description: Anything `datetime()` reads.
- name: unit
  type: string
  description: Return the whole length in this unit, as a number.
```

**Returns**

```returns
type: Duration | number
description: A `Duration` balanced from years down, or a number when `unit` is given.
```

```js
const doors = datetime('2026-11-16T08:00', 'America/Los_Angeles');

doors.until(standup).format(); // '1 hour, 30 minutes'
doors.until(standup, 'hours'); // 1.5
```
:::
