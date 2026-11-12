---
title: relative
kind: plugin
lede: Human-readable relative phrases like `'3 hours ago'`, `'yesterday'`, and `'in 2 weeks'` via `Intl.RelativeTimeFormat`.
import: import '@native-dates/plugins/relative'
size: relative
updated: 2026-11-12
---

## Relative formatting

Import the plugin once to add [`formatRelative()`](#formatrelative) to core moments and calendar dates. Phrases come from `Intl.RelativeTimeFormat` with natural wording enabled, producing yesterday, today, and tomorrow alongside counted units.

```js title="relative.js"
import '@native-dates/plugins/relative';
import { date, datetime, now, today } from 'native-dates';

now().minus(3, 'hours').formatRelative(); // '3 hours ago'
today().plus(1, 'day').formatRelative(); // 'tomorrow'

const deployed = datetime('2026-09-07T13:00Z');
deployed.formatRelative('2026-09-07T14:00Z', 'en-US'); // '1 hour ago'
```

## Unit thresholds

`formatRelative()` selects the largest unit that fits the distance between the receiver and its reference point, then rounds to the nearest whole count.

On a [`DateTime`](/api/date-time/), distance is measured in exact elapsed seconds from seconds up through years:

| Elapsed distance | Unit | Phrasing |
|---|---|---|
| Under 45 seconds | `'second'` | Natural `'now'` at zero, otherwise counted seconds such as `'30 seconds ago'`. |
| 45 seconds to 44 minutes | `'minute'` | Rounded minutes, such as `'1 minute ago'` or `'in 20 minutes'`. |
| 45 minutes to 21 hours | `'hour'` | Rounded hours, such as `'3 hours ago'` or `'in 8 hours'`. |
| 22 hours to 25 days | `'day'` | Natural `'yesterday'` and `'tomorrow'` at one day, otherwise counted days. |
| 26 days to 319 days | `'month'` | Natural `'last month'` and `'next month'` at one month, otherwise counted months. |
| 320 days and above | `'year'` | Natural `'last year'` and `'next year'` at one year, otherwise counted years. |

On a [`CalendarDate`](/api/calendar-date/), distance is counted in whole calendar days and includes a week tier between days and months:

| Calendar distance | Unit | Phrasing |
|---|---|---|
| 0 to 6 days | `'day'` | Natural `'today'`, `'yesterday'`, and `'tomorrow'`, or counted days up to six. |
| 7 to 25 days | `'week'` | Natural `'last week'` and `'next week'`, or rounded weeks. |
| 26 to 319 days | `'month'` | Natural `'last month'` and `'next month'`, or rounded months. |
| 320 days and above | `'year'` | Natural `'last year'` and `'next year'`, or rounded years. |

## Methods and helpers

:::entry
### `formatRelative()` :kind[method]

```js signature
dt.formatRelative(to?, locale?): string
d.formatRelative(to?, locale?): string
```

Formats the distance from a reference point to this value. Omitting the reference compares a moment against `now()` in its own zone and a calendar date against `today()`.

**Parameters**

```params
- name: to
  type: DateTimeInput | CalendarDateInput
  description: Reference moment or date to measure from, defaulting to now or today.
- name: locale
  type: string
  description: BCP 47 locale tag overriding the configured default for this call.
```

**Returns**

```returns
type: string
description: Localized relative time phrase.
```

```js
const anchor = '2026-09-07';

date('2026-09-06').formatRelative(anchor, 'en-US'); // 'yesterday'
date('2026-09-07').formatRelative(anchor, 'en-US'); // 'today'
date('2026-09-08').formatRelative(anchor, 'en-US'); // 'tomorrow'
date('2026-09-21').formatRelative(anchor, 'en-US'); // 'in 2 weeks'
date('2026-09-06').formatRelative(anchor, 'de'); // 'gestern'
```
:::

:::entry
### `relativeSeconds()` :kind[function]

```js signature
relativeSeconds(seconds, locale?): string
relativeDays(days, locale?): string
```

Standalone helpers exported when formatting a precomputed offset in seconds or calendar days. Negative numbers read in the past and positive numbers read in the future.

**Parameters**

```params
- name: seconds
  type: number
  required: true
  description: Signed offset in seconds for `relativeSeconds()`, or whole days for `relativeDays()`.
- name: locale
  type: string
  description: BCP 47 locale tag overriding the configured default.
```

**Returns**

```returns
type: string
description: Localized relative time phrase using the same thresholds as `formatRelative()`.
```

```js
import { relativeDays, relativeSeconds } from '@native-dates/plugins/relative';

relativeSeconds(-120, 'en-US'); // '2 minutes ago'
relativeDays(14, 'en-US'); // 'in 2 weeks'
```
:::
