# @native-dates/plugins

Opt-in plugins for `native-dates`, each installed by importing its subpath:

- `@native-dates/plugins/relative` — `.formatRelative()` via `Intl.RelativeTimeFormat`
- `@native-dates/plugins/zones` — City names (`'Berlin'`), abbreviations (`'PT'`), and `configure({ zoneAliases })`
- `@native-dates/plugins/loose` — `{ loose: true, dayFirst }` `Date.parse` fallback returning `null` on unreadable input
- `@native-dates/plugins/legacy-date` — `Date.prototype` getters (`getFullYear`, `getUTC*`, `toISOString`, `toLocale*`) and `set*` immutability guards on `DateTime`
