---
title: monthNames()
kind: function
lede: Return localized month and weekday label arrays for calendar headers and menus.
import: import { monthNames, weekdayNames } from 'native-dates'
size: core
updated: 2026-11-12
---

## Calendar labels

Both helpers read from cached `Intl` tables in core and return a fresh array on every call. Callers can map, slice, or reverse the returned list freely without mutating shared state.

:::entry
### `monthNames()` :kind[function]

```js signature
monthNames(style?, locale?): string[]
```

Returns an array of 12 localized Gregorian month names from January through December. Defaults to full names in the configured locale.

**Parameters**

```params
- name: style
  type: "'long' | 'short'"
  default: "'long'"
  description: Full month names like `'January'` or abbreviated names like `'Jan'`.
- name: locale
  type: Locale
  description: BCP 47 locale tag overriding the configured default.
```

**Returns**

```returns
type: string[]
description: Twelve month labels ordered from index `0` for January through `11` for December.
```

```js title="months.js"
import { monthNames } from 'native-dates';

monthNames('short', 'en-US');
// ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

monthNames('long', 'fr-FR').slice(0, 3);
// ['janvier', 'février', 'mars']
```
:::

:::entry
### `weekdayNames()` :kind[function]

```js signature
weekdayNames(style?, firstDay?, locale?): string[]
```

Returns an array of 7 localized weekday labels rotated to begin on `firstDay`, or on the configured week start from [`configure()`](/api/configure/).

Week boundaries in `startOf('week')` and week ranges follow the same first-day rule, so calendar headers always match week grids.

**Parameters**

```params
- name: style
  type: "'short' | 'long'"
  default: "'short'"
  description: Abbreviated weekday labels like `'Mon'` or full names like `'Monday'`.
- name: firstDay
  type: Weekday
  description: Starting weekday name or ISO number from 1 for Monday through 7 for Sunday.
- name: locale
  type: Locale
  description: BCP 47 locale tag overriding the configured default.
```

**Returns**

```returns
type: string[]
description: Seven weekday labels starting on `firstDay` or the configured `weekStart`.
```

```js
import { date, weekdayNames } from 'native-dates';

weekdayNames('short', 'monday', 'en-US');
// ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

weekdayNames('short', 'sunday', 'en-US');
// ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const daysInGrid = date('2026-11-18').range('week', 'sunday').points('day');
daysInGrid[0].format({ weekday: 'short' }, 'en-US'); // 'Sun'
```
:::
