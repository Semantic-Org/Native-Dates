# `@native-dates/core`

Temporal, spoken plainly. Zero dependencies, frozen values with `text`-first console previews, and opt-in subpath plugins so every app ships only what it uses.

```js
import { today } from '@native-dates/core';
import '@native-dates/core/plugins/ranges';
import '@native-dates/core/plugins/tokens';

const call = today().plus(2, 'days').at('9:30am', 'America/Los_Angeles');
call.in('Europe/Berlin').format('dddd h:mm a');
```

## Plugins

- `@native-dates/core/plugins/ranges` — `DateRange`, `DateTimeRange`, `TimeRange`, `.to()`, `.range()`, `.points()`, `.split()`
- `@native-dates/core/plugins/tokens` — `YYYY-MM-DD HH:mm` token formatting, `monthNames()`, `weekdayNames()`
- `@native-dates/core/plugins/relative` — `.formatRelative()` via `Intl.RelativeTimeFormat`
- `@native-dates/core/plugins/zones` — City names (`'Berlin'`), abbreviations (`'PT'`), and `configure({ zoneAliases })`
- `@native-dates/core/plugins/loose` — `{ loose: true, dayFirst }` `Date.parse` fallback returning `null` on unreadable input
- `@native-dates/core/plugins/legacy-date` — `Date.prototype` getters (`getFullYear`, `getUTC*`, `toISOString`, `toLocale*`) and `set*` immutability guards on `DateTime`
