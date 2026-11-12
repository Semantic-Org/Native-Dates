---
title: Coming from Moment
lede: Move off Moment and moment-timezone to immutable values, zero bundled timezone data, and incremental Date interop.
updated: 2026-11-12
---

Moment and `moment-timezone` carried JavaScript date handling for years, at the cost of mutable objects, zero-indexed months, and heavy timezone bundles.

Migrating removes defensive clones and bundle bloat while letting you update large repositories one module at a time.

## Every value is immutable

Adding days or shifting to the start of a month in Moment mutates that instance in place. Passing a shared date into a helper can silently corrupt the caller's state unless everyone remembers to clone first.

Every value here is immutable. Methods like `plus()` and `in()` always return a fresh instance and leave the original untouched.

```js
import { date } from 'native-dates';

const start = date('2026-11-16');
const deadline = start.plus(7, 'days');

start.toString(); // '2026-11-16'
deadline.toString(); // '2026-11-23'
```

:::tip[Drop defensive clone calls]
You can delete every `.clone()` call during migration. Immutable addition and subtraction aliases are included too, so existing arithmetic callsites keep working.
:::

## Dedicated types and 1-indexed months

Moment wraps every concept in one class and numbers months from 0 to 11, where month 10 means November. Here, `month` is a plain property running from 1 through 12.

Pick [`date()`](/api/date-fn/) for calendar days without a clock, [`datetime()`](/api/datetime-fn/) for moments in a time zone, and [`time()`](/api/time-fn/) for daily clock times.

```js
import { date, datetime } from 'native-dates';

const invoiceDate = date(2026, 11, 16);
invoiceDate.month; // 11, November

const sentAt = datetime('2026-11-16T17:30:00Z', 'America/New_York');
sentAt.hour; // 12
```

## Zero bundled timezone data

`moment-timezone` ships its own copy of the IANA database to the browser.

Core reads time zone rules directly from the runtime's Temporal and Intl engines. Every IANA zone works out of the box with zero timezone data in your bundle.

```js
import { datetime } from 'native-dates';

const kickoff = datetime('2026-11-16T09:30', 'America/Los_Angeles');

kickoff.in('Europe/London').format('short', 'en-GB'); // '16/11/2026, 17:30'
kickoff.in('Asia/Tokyo').format('short', 'en-US'); // '11/17/26, 2:30 AM'
```

## Side-by-side reference

| Moment | Native Dates | Notes |
|---|---|---|
| `moment()` | `now()` or `today()` | Explicit moment vs calendar day |
| `moment.tz(str, zone)` | `datetime(str, zone)` | Built into core with zero bundled tzdata |
| `m.clone().add(7, 'days')` | `d.plus(7, 'days')` | Always immutable, and `add()` alias works too |
| `m.tz('Europe/Berlin')` | `dt.in('Europe/Berlin')` | Views the same moment in another zone |
| `m.month()`, `m.date()` | `d.month`, `d.day` | Plain properties with months from 1 to 12 |
| `b.diff(a, 'hours', true)` | `a.until(b, 'hours')` | Fractional total in the requested unit |
| `moment.duration(2, 'h')` | `hours(2)` or `duration('2h')` | Built into core |
| `m.format('LLL')` | `dt.format('long')` | Locale-aware `Intl` presets with zero locale files |
| `m.format('YYYY-MM-DD HH:mm')` | `dt.format('YYYY-MM-DD HH:mm')` | Load [`@native-dates/plugins/tokens`](/plugins/tokens/) for custom patterns |
| `m.fromNow()` | `dt.formatRelative()` | Load [`@native-dates/plugins/relative`](/plugins/relative/) for relative strings |

## Migrating incrementally

Large codebases rarely convert in a single pull request. Call `toJSDate()` at boundaries that still expect a native JavaScript date, and pass dates straight back into [`datetime()`](/api/datetime-fn/) on the way in.

```js
import { datetime } from 'native-dates';

const sentAt = datetime('2026-11-16T17:30:00Z', 'America/New_York');
const legacy = sentAt.toJSDate();
const restored = datetime(legacy, 'America/New_York');
```

When downstream helpers still call legacy getters like `getFullYear()` directly on values, import the [`legacy-date`](/plugins/legacy-date/) plugin.

Read methods answer in the value's own time zone while keeping zero-indexed months for drop-in compatibility. Mutating setters throw immediately so hidden in-place edits surface in tests.

```js
import '@native-dates/plugins/legacy-date';
import { datetime } from 'native-dates';

const dt = datetime('2026-11-16T09:30', 'America/Los_Angeles');

dt.getFullYear(); // 2026
dt.getMonth(); // 10, matching Date.prototype.getMonth()
dt.getHours(); // 9, in America/Los_Angeles
```
