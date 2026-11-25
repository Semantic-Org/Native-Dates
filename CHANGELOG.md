# Changelog

Note: To simplify versioning all subpackages like the polyfill and plugins are published in lockstep with `native-dates`.

## v1.1.1 (2026-11-25)

### Bug Fixes

- **plugins:** Parse Hour-Only Meridiems Beside Colon Offsets in Loose Plugin ([#137](https://github.com/Semantic-Org/Native-Dates/pull/137))
- Measure Anchored Sub-Unit Totals Across Repeated DST Hours ([#136](https://github.com/Semantic-Org/Native-Dates/pull/136))
- **plugins:** Parse hour-only meridiems in loose plugin ([#135](https://github.com/Semantic-Org/Native-Dates/pull/135))

## v1.1.0 (2026-11-24)

### Features

- **setup:** Move agent setup CLI into standalone `@native-dates/setup` package (`npx @native-dates/setup@latest`); `native-dates` and `@native-dates/core` no longer ship a `bin` ([#126](https://github.com/Semantic-Org/Native-Dates/pull/126))
- **core, plugins:** Add Format-Pattern Parsing Plugin ([#119](https://github.com/Semantic-Org/Native-Dates/pull/119))
- Make DateRange Iterable by Day ([#120](https://github.com/Semantic-Org/Native-Dates/pull/120))
- **core, plugins:** Add Range Set Operations Plugin ([#122](https://github.com/Semantic-Org/Native-Dates/pull/122))
- **polyfill:** Polyfill Intl.DurationFormat for Node 20 and 22 ([#124](https://github.com/Semantic-Org/Native-Dates/pull/124))
- Add Development Hint When Temporal Is Missing ([#123](https://github.com/Semantic-Org/Native-Dates/pull/123))

### Bug Fixes

- **plugins, polyfill:** Fix Pre-Release Parse, Polyfill, and Docs Sync Edge Cases ([#131](https://github.com/Semantic-Org/Native-Dates/pull/131))
- **plugins:** Make Parse Plugin Compatible With Node 20/22 and Fix Edge Cases ([#130](https://github.com/Semantic-Org/Native-Dates/pull/130))
- Measure Fractional Days Accurately Across Repeated DST Hours ([#128](https://github.com/Semantic-Org/Native-Dates/pull/128))
- Diagnose invalid bracketed timezone strings in datetime() error prose ([#117](https://github.com/Semantic-Org/Native-Dates/pull/117))
- Accept Lowercase ISO Time Separators ([#118](https://github.com/Semantic-Org/Native-Dates/pull/118))

### Agent Skills

- **skills:** Clarify set() Clamping and Out-of-Range Behavior in Core Skill ([#116](https://github.com/Semantic-Org/Native-Dates/pull/116))

## v1.0.0 (2026-11-24)

This is the initial release of `native-dates`.

This library is intended to beat all popular open source JS date libraries in performance and legibility while relying on `Temporal` and `Intl` to do the heavy lifting--all without any runtime dependencies.

### Packages

- `native-dates` (alias `@native-dates/core`): provides (`DateTime`, `CalendarDate`, `Time`, `Duration`, `YearMonth`, `MonthDay`, `DateRange`, `DateTimeRange`, `TimeRange`) primitives for use when managing time
- `@native-dates/plugins` — plugins for the optional parts you might not need, zone/city aliases (`zones`), parsing a variety of stringified versions of dates (`loose`), and legacy `Date` getters (`legacy-date`)
- `@native-dates/polyfill` — conditional `temporal-polyfill` loader for Safari and Node 24–25 with 0 bytes shipped if not needed
