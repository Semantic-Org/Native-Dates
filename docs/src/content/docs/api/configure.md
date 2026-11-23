---
title: configure()
kind: function
lede: Read or update process-wide defaults for time zone, locale, week start, formats, token names, and plugins.
import: import { configure, dayOfWeek } from 'native-dates'
size: core
updated: 2026-11-23
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
      description: Default locale tag, tag list, or `Accept-Language` header for formatting, week boundaries, weekends, and plugins. Pass `null` or `''` to reset to the runtime's locale.
    - name: weekStart
      type: DayOfWeek | null
      description: First day of the week for week boundaries and `weekdayNames()`, from 1 for Monday through 7 for Sunday. Unset or `null` follows the active locale.
    - name: weekdayNames
      type: "Record<Locale, { narrow?, short?, long? }> | null"
      description: "Custom weekday labels keyed by language, width (`narrow`, `short`, or `long`), and day name. Regional tags layer over their base language, and an empty value restores runtime names."
    - name: ordinals
      type: "Record<Locale, (day: number) => string | number> | null"
      description: "Custom `Do` day-of-month formatter keyed by language tag. Pass `null` to restore built-in English suffixes and locale day markers."
    - name: formats
      type: "Record<string, string | Intl.DateTimeFormatOptions> | null"
      description: "Reusable custom formats passed to `format(name)`, where each value is a token pattern or `Intl` options object. Custom names take precedence over built-in presets, and `null` clears them."
    - name: dayFirst
      type: boolean | null
      description: "Default numeric date order for loose calls that omit per-call `dayFirst` and `locale`. Unset or `null` follows the active locale."
    - name: zoneAliases
      type: Record<string, Zone | null> | null
      description: "Custom names mapped to zones with `@native-dates/plugins/zones`. Pass `null` for a key or the whole map to clear aliases."
```

**Returns**

```returns
type: "{ zone, locale, weekStart, dayFirst, zoneAliases, weekdayNames, ordinals, formats }"
description: A shallow copy of the active settings after applying updates. Unset keys return `undefined`.
```

The `weekdayNames` and `ordinals` settings change what token patterns and [`weekdayNames()`](/api/month-names/#weekdaynames) print, without plugins:

```js
import { configure, date, weekdayNames } from 'native-dates';

configure({
  weekdayNames: { lv: { narrow: { fri: 'Pk', sun: 'Sv' } } },
  ordinals: { fr: (day) => (day === 1 ? '1er' : day) },
});

date('2026-11-01').format('Do MMMM', 'fr'); // '1er novembre'
weekdayNames('narrow', 'monday', 'lv'); // ['P', 'O', 'T', 'C', 'Pk', 'S', 'Sv']

configure({ weekdayNames: null, ordinals: null });
```

Named formats give an app its own presets on every type that formats a date or time:

```js
import { configure, date, datetime } from 'native-dates';

configure({
  formats: {
    invoice: 'YYYY-MM-DD',
    receipt: { weekday: 'long', month: 'long', day: 'numeric' },
  },
});

date('2026-11-06').format('invoice'); // '2026-11-06'
datetime('2026-11-06T09:05', 'Europe/Berlin').format('receipt'); // 'Friday, November 6'

configure({ formats: null });
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

configure({ dayFirst: null });
```
:::

:::warning[Configure once at startup on servers]
Global configuration updates shared state across the entire JavaScript process. Set defaults once when your server boots, and attach each user's zone and [`locale()`](/api/date-time/#locale) to the value inside request handlers. See [Localization](/guides/localization/).
:::

## Day of week helper

Turn the name of a day into its number, using the same ISO numbering as the rest of the library.

:::entry
### `dayOfWeek()` :kind[function]

```js signature
dayOfWeek(day): number
```

Converts a weekday name, three-letter prefix, or ISO number into an integer from 1 for Monday through 7 for Sunday. Unrecognized names or numbers outside that range throw a `RangeError`.

**Parameters**

```params
- name: day
  type: DayOfWeek
  required: true
  description: Weekday name such as `'monday'`, case-insensitive prefix such as `'Fri'`, or integer from 1 to 7.
```

**Returns**

```returns
type: number
description: Day of the week from 1 for Monday through 7 for Sunday.
```

```js
import { dayOfWeek } from 'native-dates';

dayOfWeek('monday'); // 1
dayOfWeek('Fri'); // 5
dayOfWeek('sunday'); // 7
dayOfWeek(3); // 3
```
:::
