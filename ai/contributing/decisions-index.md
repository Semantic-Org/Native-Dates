# Decisions Index

> Generated from [`decisions.md`](decisions.md) by `npm run ai:index` and checked by `npm run ai`. Do not edit by hand.

## By Topic

Active decisions grouped by area, newest first.

### Zones, Offsets, and Serialization

- [L27](decisions.md#datetime-serializes-to-iso-8601-utc-rather-than-temporals-bracketed-zone-string-2026-11-05) · `DateTime` serializes to ISO 8601 UTC rather than Temporal's bracketed `[Zone]` string (2026-11-05)
  - Reopen: RFC 9557 bracketed zone strings gain broad database and parser support and callers request round-tripping `.zone` through JSON.
- [L21](decisions.md#trailing-z-and-numeric-offsets-in-datetime-set-the-instant-not-zone-2026-11-05) · Trailing `Z` and numeric offsets in `datetime()` set the instant, not `.zone` (2026-11-05)
  - Reopen: downstream bug reports show callers passing `Z` strings expecting `.hour` and `.zone` to default to `'UTC'`.

### Ranges

- [L111](decisions.md#ranges-accept-for-for-durations-alongside-to-and-only-calendardate-has-through-2026-11-17) · Ranges accept `.for()` for durations alongside `.to()`, and only `CalendarDate` has `.through()` (2026-11-17)
  - Reopen: callers pass endpoints to `.for()` expecting runtime rejection, or expect `.through()` on `DateTime` with inclusive end semantics.
- [L45](decisions.md#daterange-includes-its-end-date-while-datetimerange-and-timerange-are-half-open-2026-11-12) · `DateRange` includes its end date while `DateTimeRange` and `TimeRange` are half-open (2026-11-12)
  - Reopen: bug reports show callers frequently off by one day when converting between `DateRange` and `DateTimeRange`.

### Durations

- [L105](decisions.md#duration-uses-balance-without-a-normalize-alias-and-totalunit-instead-of-inunit-2026-11-17) · `Duration` uses `balance()` without a `normalize()` alias, and `total(unit)` instead of `in(unit)` (2026-11-17)
  - Reopen: cold-reader studies or user issues show callers repeatedly reaching for `duration.in(unit)` or `duration.normalize()`.

### Arithmetic, Boundaries, and Weekdays

- [L117](decisions.md#adjacent-unit-boundaries-use-startofnext-and-startofprevious-instead-of-overloading-next-and-previous-2026-11-19) · Adjacent unit boundaries use `startOfNext()` and `startOfPrevious()` instead of overloading `next()` and `previous()` (2026-11-19)
  - Reopen: callers consistently try unit names in `next()` and `previous()`, or expect numeric weekdays in `startOfNext()`.
- [L99](decisions.md#numeric-day-of-the-week-is-dayofweek-1-7-while-token-d-keeps-moments-0-6-2026-11-17) · Numeric day of the week is `dayOfWeek` (`1`-`7`) while token `d` keeps Moment's `0`-`6` (2026-11-17)
  - Reopen: callers hit bugs from `format('d')` returning `0` on Sunday while `.dayOfWeek` and `format('E')` return `7`.
- [L57](decisions.md#default-week-boundaries-follow-the-locale-while-weekofyear-stays-iso-monday-2026-11-14) · Default week boundaries follow the locale while `weekOfYear` stays ISO Monday (2026-11-14)
  - Reopen: server code accidentally partitions stored weekly aggregates differently across requests carrying different `.locale()` tags.

### Formatting, Tokens, and Locales

- [L81](decisions.md#custom-weekdaynames-ordinals-and-named-formats-live-in-configure-instead-of-locale-plugins-2026-11-16) · Custom `weekdayNames`, `ordinals`, and named `formats` live in `configure()` instead of locale plugins (2026-11-16)
  - Reopen: multiple downstream apps duplicate the same locale ordinal or `dd` overrides and warrant a shared community table.
- [L63](decisions.md#format-tokens-output-ascii-digits-and-gregorian-years-while-presets-localize-the-calendar-2026-11-14) · Format tokens output ASCII digits and Gregorian years while presets localize the calendar (2026-11-14)
  - Reopen: native speakers request an opt-in localized-numeral token mode or non-Gregorian partial dates.
- [L51](decisions.md#locale-attaches-a-formatting-locale-to-values-without-affecting-equality-or-json-2026-11-14) · `.locale()` attaches a formatting locale to values without affecting equality or JSON (2026-11-14)
  - Reopen: callers hit assertion bugs because two `.equals()` values in different locales have different `.text` own properties under deep-object equality.

### Parsing, Inputs, and Comparisons

- [L87](decisions.md#core-parses-unambiguous-non-iso-inputs-and-refuses-inputs-with-two-readings-2026-11-16) · Core parses unambiguous non-ISO inputs and refuses inputs with two readings (2026-11-16)
  - Reopen: a non-ISO form accepted in core misparses real input, or callers repeatedly hit one of the remaining refusals where an explicit option could disambiguate.

### Nouns, Instances, and Epoch

- [L93](decisions.md#unix-timestamp-properties-include-their-unit-epochseconds-epochmilliseconds-epochnanoseconds-with-no-bare-epoch-2026-11-17) · Unix timestamp properties include their unit (`epochSeconds`, `epochMilliseconds`, `epochNanoseconds`) with no bare `.epoch` (2026-11-17)
  - Reopen: migration feedback shows omitting `.epoch` causes widespread friction without preventing real seconds-vs-milliseconds bugs.
- [L33](decisions.md#instances-freeze-on-construction-with-text-as-an-eager-own-property-2026-11-05) · Instances freeze on construction with `text` as an eager own property (2026-11-05)
  - Reopen: benchmark profiles in `bench/` show eager `text` construction dominating hot arithmetic or `range.points()` loops.

### Plugins, Errors, and Dependencies

- [L75](decisions.md#error-explanations-use-inline-isdevelopment-checks-and--loose-true--still-throws-on-bad-options-2026-11-16) · Error explanations use inline `isDevelopment` checks, and `{ loose: true }` still throws on bad options (2026-11-16)
  - Reopen: callers building dynamic zone or format inputs from untrusted user text need a non-throwing validation helper.
- [L69](decisions.md#core-has-zero-runtime-dependencies-and-trims-forked-semantic-uiutils-helpers-to-used-branches-2026-11-16) · Core has zero runtime dependencies and trims forked `@semantic-ui/utils` helpers to used branches (2026-11-16)
  - Reopen: `@semantic-ui/utils` publishes tree-shakeable single-branch entrypoints with zero unreached bytes and consumers favor cross-package deduplication over zero dependencies.
- [L39](decisions.md#plugins-attach-on-subpath-import-instead-of-requiring-use-or-extend-2026-11-08) · Plugins attach on subpath import instead of requiring `use()` or `extend()` (2026-11-08)
  - Reopen: a standard bundler configuration tree-shakes an imported `@native-dates/plugins/*` module despite `"sideEffects": ["./src/*.js"]`.

## Chronological

Every entry in file order.

- [L21](decisions.md#trailing-z-and-numeric-offsets-in-datetime-set-the-instant-not-zone-2026-11-05) · Trailing `Z` and numeric offsets in `datetime()` set the instant, not `.zone` (2026-11-05)
  - Reopen: downstream bug reports show callers passing `Z` strings expecting `.hour` and `.zone` to default to `'UTC'`.
- [L27](decisions.md#datetime-serializes-to-iso-8601-utc-rather-than-temporals-bracketed-zone-string-2026-11-05) · `DateTime` serializes to ISO 8601 UTC rather than Temporal's bracketed `[Zone]` string (2026-11-05)
  - Reopen: RFC 9557 bracketed zone strings gain broad database and parser support and callers request round-tripping `.zone` through JSON.
- [L33](decisions.md#instances-freeze-on-construction-with-text-as-an-eager-own-property-2026-11-05) · Instances freeze on construction with `text` as an eager own property (2026-11-05)
  - Reopen: benchmark profiles in `bench/` show eager `text` construction dominating hot arithmetic or `range.points()` loops.
- [L39](decisions.md#plugins-attach-on-subpath-import-instead-of-requiring-use-or-extend-2026-11-08) · Plugins attach on subpath import instead of requiring `use()` or `extend()` (2026-11-08)
  - Reopen: a standard bundler configuration tree-shakes an imported `@native-dates/plugins/*` module despite `"sideEffects": ["./src/*.js"]`.
- [L45](decisions.md#daterange-includes-its-end-date-while-datetimerange-and-timerange-are-half-open-2026-11-12) · `DateRange` includes its end date while `DateTimeRange` and `TimeRange` are half-open (2026-11-12)
  - Reopen: bug reports show callers frequently off by one day when converting between `DateRange` and `DateTimeRange`.
- [L51](decisions.md#locale-attaches-a-formatting-locale-to-values-without-affecting-equality-or-json-2026-11-14) · `.locale()` attaches a formatting locale to values without affecting equality or JSON (2026-11-14)
  - Reopen: callers hit assertion bugs because two `.equals()` values in different locales have different `.text` own properties under deep-object equality.
- [L57](decisions.md#default-week-boundaries-follow-the-locale-while-weekofyear-stays-iso-monday-2026-11-14) · Default week boundaries follow the locale while `weekOfYear` stays ISO Monday (2026-11-14)
  - Reopen: server code accidentally partitions stored weekly aggregates differently across requests carrying different `.locale()` tags.
- [L63](decisions.md#format-tokens-output-ascii-digits-and-gregorian-years-while-presets-localize-the-calendar-2026-11-14) · Format tokens output ASCII digits and Gregorian years while presets localize the calendar (2026-11-14)
  - Reopen: native speakers request an opt-in localized-numeral token mode or non-Gregorian partial dates.
- [L69](decisions.md#core-has-zero-runtime-dependencies-and-trims-forked-semantic-uiutils-helpers-to-used-branches-2026-11-16) · Core has zero runtime dependencies and trims forked `@semantic-ui/utils` helpers to used branches (2026-11-16)
  - Reopen: `@semantic-ui/utils` publishes tree-shakeable single-branch entrypoints with zero unreached bytes and consumers favor cross-package deduplication over zero dependencies.
- [L75](decisions.md#error-explanations-use-inline-isdevelopment-checks-and--loose-true--still-throws-on-bad-options-2026-11-16) · Error explanations use inline `isDevelopment` checks, and `{ loose: true }` still throws on bad options (2026-11-16)
  - Reopen: callers building dynamic zone or format inputs from untrusted user text need a non-throwing validation helper.
- [L81](decisions.md#custom-weekdaynames-ordinals-and-named-formats-live-in-configure-instead-of-locale-plugins-2026-11-16) · Custom `weekdayNames`, `ordinals`, and named `formats` live in `configure()` instead of locale plugins (2026-11-16)
  - Reopen: multiple downstream apps duplicate the same locale ordinal or `dd` overrides and warrant a shared community table.
- [L87](decisions.md#core-parses-unambiguous-non-iso-inputs-and-refuses-inputs-with-two-readings-2026-11-16) · Core parses unambiguous non-ISO inputs and refuses inputs with two readings (2026-11-16)
  - Reopen: a non-ISO form accepted in core misparses real input, or callers repeatedly hit one of the remaining refusals where an explicit option could disambiguate.
- [L93](decisions.md#unix-timestamp-properties-include-their-unit-epochseconds-epochmilliseconds-epochnanoseconds-with-no-bare-epoch-2026-11-17) · Unix timestamp properties include their unit (`epochSeconds`, `epochMilliseconds`, `epochNanoseconds`) with no bare `.epoch` (2026-11-17)
  - Reopen: migration feedback shows omitting `.epoch` causes widespread friction without preventing real seconds-vs-milliseconds bugs.
- [L99](decisions.md#numeric-day-of-the-week-is-dayofweek-1-7-while-token-d-keeps-moments-0-6-2026-11-17) · Numeric day of the week is `dayOfWeek` (`1`-`7`) while token `d` keeps Moment's `0`-`6` (2026-11-17)
  - Reopen: callers hit bugs from `format('d')` returning `0` on Sunday while `.dayOfWeek` and `format('E')` return `7`.
- [L105](decisions.md#duration-uses-balance-without-a-normalize-alias-and-totalunit-instead-of-inunit-2026-11-17) · `Duration` uses `balance()` without a `normalize()` alias, and `total(unit)` instead of `in(unit)` (2026-11-17)
  - Reopen: cold-reader studies or user issues show callers repeatedly reaching for `duration.in(unit)` or `duration.normalize()`.
- [L111](decisions.md#ranges-accept-for-for-durations-alongside-to-and-only-calendardate-has-through-2026-11-17) · Ranges accept `.for()` for durations alongside `.to()`, and only `CalendarDate` has `.through()` (2026-11-17)
  - Reopen: callers pass endpoints to `.for()` expecting runtime rejection, or expect `.through()` on `DateTime` with inclusive end semantics.
- [L117](decisions.md#adjacent-unit-boundaries-use-startofnext-and-startofprevious-instead-of-overloading-next-and-previous-2026-11-19) · Adjacent unit boundaries use `startOfNext()` and `startOfPrevious()` instead of overloading `next()` and `previous()` (2026-11-19)
  - Reopen: callers consistently try unit names in `next()` and `previous()`, or expect numeric weekdays in `startOfNext()`.
