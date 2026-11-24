# @native-dates/plugins

Opt-in plugins for `native-dates`, each activated by importing its subpath:

- `@native-dates/plugins/zones`: City names (`'Berlin'`) and abbreviations (`'PT'`) with custom `configure({ zoneAliases })`
- `@native-dates/plugins/loose`: `{ loose: true, dayFirst }` fallback parser that returns `null` on unreadable input
- `@native-dates/plugins/ranges`: Range set operations (`subtract()`, `union()`, and `mergeRanges()`) across `DateRange`, `DateTimeRange`, and `TimeRange`
- `@native-dates/plugins/legacy-date`: Legacy `Date.prototype` getters and `set*` immutability guards on `DateTime`
