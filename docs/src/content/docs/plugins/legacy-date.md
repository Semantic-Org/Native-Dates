---
title: legacy-date
kind: plugin
lede: Read-only `Date.prototype` getters and formatters on `DateTime` for incremental migration.
import: import '@native-dates/plugins/legacy-date'
size: legacy-date
updated: 2026-11-12
---

## Migrating Date callers incrementally

Import the plugin once to attach read-only prototype getters onto [`DateTime`](/api/date-time/). Existing helpers, formatters, and components expecting native methods can accept a datetime directly while you migrate file by file.

```js title="legacy-date.js"
import '@native-dates/plugins/legacy-date';
import { datetime } from 'native-dates';

const moment = datetime('2026-09-06T14:30:15.250', 'America/New_York');

moment.getFullYear(); // 2026
moment.getMonth(); // 8 (September, zero-based like Date)
moment.getDate(); // 6
moment.getHours(); // 14 (in America/New_York, not the host OS zone)
moment.getUTCHours(); // 18
```

Native JavaScript dates always read local fields in the machine's operating system zone. A datetime evaluates every local getter and locale formatter in its own `zone` instead.

:::warning[Zero-based months and Sunday = 0]
Legacy getters keep native numbering so existing callers do not break silently. `getMonth()` runs 0 through 11 and `getDay()` returns 0 for Sunday, while core properties count months from 1 and weekdays from Monday.
:::

## Zone-aware and UTC getters

All standard read getters are available on every `DateTime` instance.

| Method | Return | Behavior on DateTime |
|---|---|---|
| `getTime()` | `number` | Epoch milliseconds, identical to `dt.epoch`. |
| `getFullYear()` | `number` | Four-digit calendar year in `dt.zone`. |
| `getMonth()` | `number` | Zero-based month from 0 for January through 11 for December in `dt.zone`. |
| `getDate()` | `number` | Day of the month from 1 through 31 in `dt.zone`. |
| `getDay()` | `number` | Day of the week from 0 for Sunday through 6 for Saturday in `dt.zone`. |
| `getHours()`, `getMinutes()`, `getSeconds()`, `getMilliseconds()` | `number` | Clock fields evaluated in `dt.zone`. |
| `getTimezoneOffset()` | `number` | Offset in minutes west of UTC for `dt.zone`, such as `240` for `-04:00` or `-330` for `+05:30`. |
| `getUTCFullYear()`, `getUTCMonth()`, `getUTCDate()`, `getUTCDay()` | `number` | Calendar fields in UTC using zero-based months and Sunday as 0. |
| `getUTCHours()`, `getUTCMinutes()`, `getUTCSeconds()`, `getUTCMilliseconds()` | `number` | Clock fields in UTC. |

```js
const kolkata = datetime('2026-01-06T09:00', 'Asia/Kolkata');

kolkata.getTimezoneOffset(); // -330
kolkata.getHours(); // 9
kolkata.getUTCHours(); // 3
```

## String and locale methods

Legacy string methods match native output while defaulting locale formatting to the instance's own time zone.

| Method | Return | Behavior on DateTime |
|---|---|---|
| `toISOString()` | `string` | UTC timestamp at millisecond precision, even when the instance carries finer sub-millisecond digits. |
| `toLocaleString(locales?, options?)` | `string` | Date and time formatted in `dt.zone` unless `options.timeZone` overrides it. |
| `toLocaleDateString(locales?, options?)` | `string` | Date portion formatted in `dt.zone` unless overridden in `options`. |
| `toLocaleTimeString(locales?, options?)` | `string` | Time portion formatted in `dt.zone` unless overridden in `options`. |

```js
const flight = datetime('2026-09-06T14:30:15.250', 'America/New_York');

flight.toISOString(); // '2026-09-06T18:30:15.250Z'
flight.toLocaleDateString('en-US'); // '9/6/2026'
flight.toLocaleTimeString('en-US'); // '2:30:15 PM'
flight.toLocaleTimeString('en-US', { timeZone: 'UTC' }); // '6:30:15 PM'
```

## Setters throw on mutation

Instances are immutable, so every mutating setter throws an error and directs callers to [`set()`](/api/date-time/#set) or [`plus()`](/api/date-time/#plus).

| Group | Blocked methods | Immutable replacement |
|---|---|---|
| Epoch | `setTime()` | Pass epoch milliseconds to `datetime()`. |
| Local fields | `setFullYear()`, `setMonth()`, `setDate()`, `setHours()`, `setMinutes()`, `setSeconds()`, `setMilliseconds()` | Replace fields in `dt.zone` with `dt.set()`. |
| UTC fields | `setUTCFullYear()`, `setUTCMonth()`, `setUTCDate()`, `setUTCHours()`, `setUTCMinutes()`, `setUTCSeconds()`, `setUTCMilliseconds()` | Switch to UTC first with `dt.in('UTC').set()`. |

```js
const reminder = datetime('2026-09-06T14:30Z');

try {
  reminder.setHours(9);
} catch (err) {
  err.code; // 'immutable'
}

const updated = reminder.set('hour', 9);
updated.hour; // 9
```

## When to use toJSDate instead

A datetime never spoofs `instanceof Date` or the native object tag. When passing a timestamp to a charting library, database driver, or validator that checks object identity or mutates its copy, call [`toJSDate()`](/api/date-time/#tojsdate) from core instead:

```js
const nativeDate = datetime('2026-09-06T14:30Z').toJSDate();
nativeDate instanceof Date; // true
```
