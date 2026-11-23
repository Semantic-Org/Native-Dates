---
title: monthNames()
kind: function
lede: Return localized month and weekday label arrays for calendar headers and menus.
import: import { monthNames, weekdayNames } from 'native-dates'
size: core
updated: 2026-11-16
---

## Calendar labels

Both helpers read from cached `Intl` tables in core and return a fresh array on every call. Callers can map, slice, or reverse the returned list freely without mutating shared state.

:::entry
### `monthNames()` :kind[function]

```js signature
monthNames(style?, locale?): string[]
```

Returns an array of 12 localized Gregorian month names from January through December. Defaults to full names in the [configured locale](/api/configure/).

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

Returns an array of 7 localized weekday labels rotated to begin on `firstDay`, the configured `weekStart` from [app settings](/api/configure/), or the active locale's first day of the week.

Week boundaries in [`startOf('week')`](/api/calendar-date/#startof) and week ranges follow the same first-day rule, so calendar headers always match week grids. Custom weekday labels set in [`configure()`](/api/configure/) apply here too.

**Parameters**

```params
- name: style
  type: "'short' | 'long' | 'narrow'"
  default: "'short'"
  description: "Abbreviated labels like `'Mon'`, full names like `'Monday'`, or compact two-letter and single-letter headers like `'Mo'`."
- name: firstDay
  type: DayOfWeek
  description: Starting weekday name or ISO number from 1 for Monday through 7 for Sunday.
- name: locale
  type: Locale
  description: BCP 47 locale tag overriding the configured default.
```

**Returns**

```returns
type: string[]
description: Seven weekday labels starting on `firstDay`, the configured `weekStart`, or the locale's first day.
```

```js
import { date, weekdayNames } from 'native-dates';

weekdayNames('short', undefined, 'en-US');
// ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

weekdayNames('narrow', undefined, 'en-US');
// ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

weekdayNames('narrow', undefined, 'pt-BR');
// ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']

weekdayNames('short', 'monday', 'en-US');
// ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

const daysInGrid = date('2026-11-18', { locale: 'en-US' }).range('week').every('day');
daysInGrid[0].format({ weekday: 'short' }); // 'Sun'
```
:::
