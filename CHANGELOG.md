# Changelog

All notable releases of `native-dates`, `@native-dates/core`, `@native-dates/plugins`, and `@native-dates/polyfill` are published in lockstep.

## v1.0.0 (2026-11-23)

Initial stable release of `native-dates`: immutable dates, times, time zones, durations, year-months, month-days, and ranges built directly on `Temporal` and `Intl` with zero runtime dependencies.

### Packages

- `native-dates` (and scoped alias `@native-dates/core`) — core classes (`DateTime`, `CalendarDate`, `Time`, `Duration`, `YearMonth`, `MonthDay`, `DateRange`, `DateTimeRange`, `TimeRange`), natural-language phrases, `Intl` formatting, relative time, `Accept-Language` locale handling, and the `npx native-dates` agent setup CLI
- `@native-dates/plugins` — opt-in subpath plugins for city and abbreviation time zones (`zones`), lenient localized parsing (`loose`), and legacy `Date` getters (`legacy-date`)
- `@native-dates/polyfill` — conditional `temporal-polyfill` loader for Safari and Node 24–25
