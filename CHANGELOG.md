# Changelog

Note: To simplify versioning all subpackages like the polyfill and plugins are published in lockstep with `native-dates`.

## v1.0.0 (2026-11-24)

This is the initial release of `native-dates`.

This library is intended to beat all popular open source JS date libraries in performance and legibility while relying on `Temporal` and `Intl` to do the heavy lifting--all without any runtime dependencies.

### Packages

- `native-dates` (alias `@native-dates/core`): provides (`DateTime`, `CalendarDate`, `Time`, `Duration`, `YearMonth`, `MonthDay`, `DateRange`, `DateTimeRange`, `TimeRange`) primitives for use when managing time
- `@native-dates/plugins` — plugins for the optional parts you might not need, zone/city aliases (`zones`), parsing a variety of stringified versions of dates (`loose`), and legacy `Date` getters (`legacy-date`)
- `@native-dates/polyfill` — conditional `temporal-polyfill` loader for Safari and Node 24–25 with 0 bytes shipped if not needed
