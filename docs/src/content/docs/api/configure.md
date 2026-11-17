---
title: configure()
kind: function
lede: Read or update process-wide defaults for time zone, locale, week start, token names, and plugins.
import: import { configure } from 'native-dates'
size: core
updated: 2026-11-16
---

## Global defaults

:::entry
### `configure()` :kind[function]

```js signature
configure(settings?): ActiveSettings
```

Updates one or more process-wide defaults and returns a snapshot of the active configuration. Calling it with no arguments reads the current settings without changing them.

Omitted properties keep their current values. Pass `null` for any setting to restore the runtime and built-in defaults.

```js title="setup.js"
import { configure, date, datetime } from 'native-dates';

configure({
  zone: 'Europe/Berlin',
  locale: 'de-DE',
});

datetime('2026-11-16T17:30:00Z').zone; // 'Europe/Berlin'
date('2026-11-18').startOf('week').toString(); // '2026-11-16'
configure().weekStart; // undefined

configure({ weekStart: 'sunday' });
date('2026-11-18').startOf('week').toString(); // '2026-11-15'
configure().weekStart; // 7

// reset back to the runtime zone, runtime locale, and locale week start
configure({ zone: null, locale: null, weekStart: null });
```

**Parameters**

```params
- name: settings
  type: Settings
  description: Process-wide defaults to update. Omitted keys stay unchanged.
  options:
    - name: zone
      type: Zone | null
      description: Default time zone for factories and `now()`. Pass `null` to reset to the runtime's local zone.
    - name: locale
      type: Locale | null
      description: Default BCP 47 locale tag for formatting and week boundaries. Pass `null` to reset to the runtime's locale.
    - name: weekStart
      type: Weekday | null
      description: First day of the week for week boundaries and `weekdayNames()`, from 1 for Monday through 7 for Sunday. Unset or `null` follows the active locale.
    - name: weekdays
      type: "Record<Locale, { narrow?, short?, long? }> | null"
      description: "Custom weekday labels keyed by language, width (`narrow`, `short`, or `long`), and day name. Regional tags layer over their base language, and an empty value restores runtime names."
    - name: ordinals
      type: "Record<Locale, (day: number) => string | number> | null"
      description: "Custom `Do` day-of-month formatter keyed by language tag. Pass `null` to restore built-in English suffixes and locale day markers."
    - name: dayFirst
      type: boolean
      default: 'false'
      description: "Read ambiguous numeric dates such as `'07.09.2026'` day-first with `@native-dates/plugins/loose`."
    - name: zoneAliases
      type: Record<string, Zone | null> | null
      description: "Custom names mapped to zones with `@native-dates/plugins/zones`. Pass `null` for a key or the whole map to clear aliases."
```

**Returns**

```returns
type: "{ zone, locale, weekStart, dayFirst, zoneAliases, weekdays, ordinals }"
description: A shallow copy of the active settings after applying updates. Unset keys return `undefined`.
```

Custom `weekdays` and `ordinals` customize token patterns and [`weekdayNames()`](/api/month-names/#weekdaynames) without plugins:

```js
import { configure, date, weekdayNames } from 'native-dates';

configure({
  weekdays: { lv: { narrow: { fri: 'Pk', sun: 'Sv' } } },
  ordinals: { fr: (day) => (day === 1 ? '1er' : day) },
});

date('2026-11-01').format('Do MMMM', 'fr'); // '1er novembre'
weekdayNames('narrow', 'monday', 'lv'); // ['P', 'O', 'T', 'C', 'Pk', 'S', 'Sv']

configure({ weekdays: null, ordinals: null });
```

Plugins extend `configure()` with their own options once imported. Setting a plugin option before importing its plugin throws a `RangeError`:

```js
import { configure, date, now } from 'native-dates';
import '@native-dates/plugins/loose';
import '@native-dates/plugins/zones';

configure({
  dayFirst: true,
  zoneAliases: { hq: 'Europe/Berlin' },
});

date('07.09.2026', { loose: true })?.toString(); // '2026-09-07'
now('hq').zone; // 'Europe/Berlin'

configure({ dayFirst: false });
```
:::

:::warning[Configure once at startup on servers]
Global configuration updates shared state across the entire JavaScript process. Set defaults once when your server boots, and attach each user's zone and [`locale()`](/api/date-time/#locale) to the value inside request handlers. See [Internationalization](/guides/internationalization/).
:::

## Weekday helper

Check or normalize weekday names and numbers using the same ISO convention used across the library.

:::entry
### `weekday()` :kind[function]

```js signature
weekday(day): number
```

Converts a weekday name, three-letter prefix, or ISO number into an integer from 1 for Monday through 7 for Sunday. Unrecognized names or numbers outside that range throw a `RangeError`.

**Parameters**

```params
- name: day
  type: Weekday
  required: true
  description: Weekday name such as `'monday'`, case-insensitive prefix such as `'Fri'`, or integer from 1 to 7.
```

**Returns**

```returns
type: number
description: ISO weekday number from 1 for Monday through 7 for Sunday.
```

```js
import { weekday } from 'native-dates';

weekday('monday'); // 1
weekday('Fri'); // 5
weekday('sunday'); // 7
weekday(3); // 3
```
:::
