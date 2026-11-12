# @native-dates/plugins

Opt-in plugins for `native-dates`, each installed by importing its subpath:

- `@native-dates/plugins/year-month` — `YearMonth`, `yearMonth('2026-11')`, `monthYear('11/26')`, and `.yearMonth`
- `@native-dates/plugins/ranges` — `DateRange`, `DateTimeRange`, `TimeRange`, `.to()`, `.range()`, `.points()`, `.split()`
- `@native-dates/plugins/month-day` — `MonthDay`, `monthDay('10/17')`, `dayMonth('17/10')`, `.monthDay`, and `.next()` / `.previous()` to a month-day
- `@native-dates/plugins/tokens` — `YYYY-MM-DD HH:mm` token formatting, `monthNames()`, `weekdayNames()`
- `@native-dates/plugins/relative` — `.formatRelative()` via `Intl.RelativeTimeFormat`
- `@native-dates/plugins/zones` — City names (`'Berlin'`), abbreviations (`'PT'`), and `configure({ zoneAliases })`
- `@native-dates/plugins/loose` — `{ loose: true, dayFirst }` `Date.parse` fallback returning `null` on unreadable input
- `@native-dates/plugins/legacy-date` — `Date.prototype` getters (`getFullYear`, `getUTC*`, `toISOString`, `toLocale*`) and `set*` immutability guards on `DateTime`
