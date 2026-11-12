---
title: configure()
kind: function
lede: Read or update process-wide defaults for time zone, locale, week start, and plugins.
import: import { configure } from 'native-dates'
size: core
updated: 2026-11-12
---

## Global defaults

:::entry
### `configure()` :kind[function]

```js signature
configure(settings?): ActiveSettings
```

Updates one or more process-wide defaults and returns a snapshot of the active configuration. Calling it with no arguments reads the current settings without changing them.

Omitted properties keep their current values. Pass `null` for the time zone or locale to restore the runtime's local defaults.

```js title="setup.js"
import { configure, date, datetime } from 'native-dates';

configure({
  zone: 'Europe/Berlin',
  locale: 'de-DE',
  weekStart: 'sunday',
});

datetime('2026-11-16T17:30:00Z').zone; // 'Europe/Berlin'
date('2026-11-18').startOf('week').toString(); // '2026-11-15'
configure().weekStart; // 7

// Reset back to the runtime time zone, runtime locale, and Monday
configure({ zone: null, locale: null, weekStart: 'monday' });
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
      description: Default BCP 47 locale tag for `format()` and `text`. Pass `null` to reset to the runtime's locale.
    - name: weekStart
      type: Weekday
      default: '1'
      description: First day of the week for week boundaries, from 1 for Monday through 7 for Sunday.
    - name: dayFirst
      type: boolean
      default: 'false'
      description: "Read ambiguous numeric dates such as `'07.09.2026'` day-first with `@native-dates/plugins/loose`."
    - name: zoneAliases
      type: Record<string, Zone>
      description: "Custom names mapped to valid zones, merged into active aliases with `@native-dates/plugins/zones`."
```

**Returns**

```returns
type: "{ zone, locale, weekStart, dayFirst, zoneAliases }"
description: A shallow copy of the active settings after applying any updates.
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
Global configuration updates shared state across the entire JavaScript process. Set defaults once when your server boots, and pass each user's time zone or locale directly to factories and `format()` inside request handlers.
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
