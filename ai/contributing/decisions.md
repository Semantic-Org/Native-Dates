# Decisions

> Generated from [`decisions/package.md`](decisions/package.md) by `npm run ai:index` and checked by `npm run ai`. Do not edit by hand. Read [`decisions/README.md`](decisions/README.md) before adding or reopening an entry (features and bug fixes do not belong here, and repo process calls belong in [`decisions/project.md`](decisions/project.md)).

## By Topic

Active package decisions grouped by area, newest first.

### Zones, Offsets, and Serialization

- **D2:** `DateTime` serializes to ISO 8601 UTC rather than Temporal's bracketed `[Zone]` string (2026-11-05) [L11-L15](decisions/package.md#d2-datetime-serializes-to-iso-8601-utc-rather-than-temporals-bracketed-zone-string-2026-11-05)
  - Reopen: RFC 9557 bracketed zone strings gain broad database and parser support and callers request round-tripping `.zone` through JSON.
- **D1:** Trailing `Z` and numeric offsets in `datetime()` set the instant, not `.zone` (2026-11-05) [L5-L9](decisions/package.md#d1-trailing-z-and-numeric-offsets-in-datetime-set-the-instant-not-zone-2026-11-05)
  - Reopen: downstream bug reports show callers passing `Z` strings expecting `.hour` and `.zone` to default to `'UTC'`.

### Ranges

- **D16:** Ranges accept `.for()` for durations alongside `.to()`, and only `CalendarDate` has `.through()` (2026-11-17) [L95-L99](decisions/package.md#d16-ranges-accept-for-for-durations-alongside-to-and-only-calendardate-has-through-2026-11-17)
  - Reopen: callers pass endpoints to `.for()` expecting runtime rejection, or expect `.through()` on `DateTime` with inclusive end semantics.
- **D5:** `DateRange` includes its end date while `DateTimeRange` and `TimeRange` are half-open (2026-11-12) [L29-L33](decisions/package.md#d5-daterange-includes-its-end-date-while-datetimerange-and-timerange-are-half-open-2026-11-12)
  - Reopen: bug reports show callers frequently off by one day when converting between `DateRange` and `DateTimeRange`.

### Durations

- **D15:** `Duration` uses `balance()` without a `normalize()` alias, and `total(unit)` instead of `in(unit)` (2026-11-17) [L89-L93](decisions/package.md#d15-duration-uses-balance-without-a-normalize-alias-and-totalunit-instead-of-inunit-2026-11-17)
  - Reopen: cold-reader studies or user issues show callers repeatedly reaching for `duration.in(unit)` or `duration.normalize()`.

### Arithmetic, Boundaries, and Weekdays

- **D17:** Adjacent unit boundaries use `startOfNext()` and `startOfPrevious()` instead of overloading `next()` and `previous()` (2026-11-19) [L101-L105](decisions/package.md#d17-adjacent-unit-boundaries-use-startofnext-and-startofprevious-instead-of-overloading-next-and-previous-2026-11-19)
  - Reopen: callers consistently try unit names in `next()` and `previous()`, or expect numeric weekdays in `startOfNext()`.
- **D14:** Numeric day of the week is `dayOfWeek` (`1`-`7`) while token `d` keeps Moment's `0`-`6` (2026-11-17) [L83-L87](decisions/package.md#d14-numeric-day-of-the-week-is-dayofweek-1-7-while-token-d-keeps-moments-0-6-2026-11-17)
  - Reopen: callers hit bugs from `format('d')` returning `0` on Sunday while `.dayOfWeek` and `format('E')` return `7`.
- **D7:** Default week boundaries follow the locale while `weekOfYear` stays ISO Monday (2026-11-14) [L41-L45](decisions/package.md#d7-default-week-boundaries-follow-the-locale-while-weekofyear-stays-iso-monday-2026-11-14)
  - Reopen: server code accidentally partitions stored weekly aggregates differently across requests carrying different `.locale()` tags.

### Formatting, Tokens, and Locales

- **D11:** Custom `weekdayNames`, `ordinals`, and named `formats` live in `configure()` instead of locale plugins (2026-11-16) [L65-L69](decisions/package.md#d11-custom-weekdaynames-ordinals-and-named-formats-live-in-configure-instead-of-locale-plugins-2026-11-16)
  - Reopen: multiple downstream apps duplicate the same locale ordinal or `dd` overrides and warrant a shared community table.
- **D8:** Format tokens output ASCII digits and Gregorian years while presets localize the calendar (2026-11-14) [L47-L51](decisions/package.md#d8-format-tokens-output-ascii-digits-and-gregorian-years-while-presets-localize-the-calendar-2026-11-14)
  - Reopen: native speakers request an opt-in localized-numeral token mode or non-Gregorian partial dates.
- **D6:** `.locale()` attaches a formatting locale to values without affecting equality or JSON (2026-11-14) [L35-L39](decisions/package.md#d6-locale-attaches-a-formatting-locale-to-values-without-affecting-equality-or-json-2026-11-14)
  - Reopen: callers hit assertion bugs because two `.equals()` values in different locales have different `.text` own properties under deep-object equality.

### Parsing, Inputs, and Comparisons

- **D12:** Core parses unambiguous non-ISO inputs and refuses inputs with two readings (2026-11-16) [L71-L75](decisions/package.md#d12-core-parses-unambiguous-non-iso-inputs-and-refuses-inputs-with-two-readings-2026-11-16)
  - Reopen: a non-ISO form accepted in core misparses real input, or callers repeatedly hit one of the remaining refusals where an explicit option could disambiguate.

### Nouns, Instances, and Epoch

- **D13:** Unix timestamp properties include their unit (`epochSeconds`, `epochMilliseconds`, `epochNanoseconds`) with no bare `.epoch` (2026-11-17) [L77-L81](decisions/package.md#d13-unix-timestamp-properties-include-their-unit-epochseconds-epochmilliseconds-epochnanoseconds-with-no-bare-epoch-2026-11-17)
  - Reopen: migration feedback shows omitting `.epoch` causes widespread friction without preventing real seconds-vs-milliseconds bugs.
- **D3:** Instances freeze on construction with `text` as an eager own property (2026-11-05) [L17-L21](decisions/package.md#d3-instances-freeze-on-construction-with-text-as-an-eager-own-property-2026-11-05)
  - Reopen: benchmark profiles in `bench/` show eager `text` construction dominating hot arithmetic or `range.points()` loops.

### Plugins, Errors, and Dependencies

- **D10:** Error explanations use inline `isDevelopment` checks, and `{ loose: true }` still throws on bad options (2026-11-16) [L59-L63](decisions/package.md#d10-error-explanations-use-inline-isdevelopment-checks-and--loose-true--still-throws-on-bad-options-2026-11-16)
  - Reopen: callers building dynamic zone or format inputs from untrusted user text need a non-throwing validation helper.
- **D9:** Core has zero runtime dependencies and trims forked `@semantic-ui/utils` helpers to used branches (2026-11-16) [L53-L57](decisions/package.md#d9-core-has-zero-runtime-dependencies-and-trims-forked-semantic-uiutils-helpers-to-used-branches-2026-11-16)
  - Reopen: `@semantic-ui/utils` publishes tree-shakeable single-branch entrypoints with zero unreached bytes and consumers favor cross-package deduplication over zero dependencies.
- **D4:** Plugins attach on subpath import instead of requiring `use()` or `extend()` (2026-11-08) [L23-L27](decisions/package.md#d4-plugins-attach-on-subpath-import-instead-of-requiring-use-or-extend-2026-11-08)
  - Reopen: a standard bundler configuration tree-shakes an imported `@native-dates/plugins/*` module despite `"sideEffects": ["./src/*.js"]`.

## Chronological

Every package decision (`D1`..`Dn`) in file order.

- **D1:** Trailing `Z` and numeric offsets in `datetime()` set the instant, not `.zone` (2026-11-05) [L5-L9](decisions/package.md#d1-trailing-z-and-numeric-offsets-in-datetime-set-the-instant-not-zone-2026-11-05)
  - Reopen: downstream bug reports show callers passing `Z` strings expecting `.hour` and `.zone` to default to `'UTC'`.
- **D2:** `DateTime` serializes to ISO 8601 UTC rather than Temporal's bracketed `[Zone]` string (2026-11-05) [L11-L15](decisions/package.md#d2-datetime-serializes-to-iso-8601-utc-rather-than-temporals-bracketed-zone-string-2026-11-05)
  - Reopen: RFC 9557 bracketed zone strings gain broad database and parser support and callers request round-tripping `.zone` through JSON.
- **D3:** Instances freeze on construction with `text` as an eager own property (2026-11-05) [L17-L21](decisions/package.md#d3-instances-freeze-on-construction-with-text-as-an-eager-own-property-2026-11-05)
  - Reopen: benchmark profiles in `bench/` show eager `text` construction dominating hot arithmetic or `range.points()` loops.
- **D4:** Plugins attach on subpath import instead of requiring `use()` or `extend()` (2026-11-08) [L23-L27](decisions/package.md#d4-plugins-attach-on-subpath-import-instead-of-requiring-use-or-extend-2026-11-08)
  - Reopen: a standard bundler configuration tree-shakes an imported `@native-dates/plugins/*` module despite `"sideEffects": ["./src/*.js"]`.
- **D5:** `DateRange` includes its end date while `DateTimeRange` and `TimeRange` are half-open (2026-11-12) [L29-L33](decisions/package.md#d5-daterange-includes-its-end-date-while-datetimerange-and-timerange-are-half-open-2026-11-12)
  - Reopen: bug reports show callers frequently off by one day when converting between `DateRange` and `DateTimeRange`.
- **D6:** `.locale()` attaches a formatting locale to values without affecting equality or JSON (2026-11-14) [L35-L39](decisions/package.md#d6-locale-attaches-a-formatting-locale-to-values-without-affecting-equality-or-json-2026-11-14)
  - Reopen: callers hit assertion bugs because two `.equals()` values in different locales have different `.text` own properties under deep-object equality.
- **D7:** Default week boundaries follow the locale while `weekOfYear` stays ISO Monday (2026-11-14) [L41-L45](decisions/package.md#d7-default-week-boundaries-follow-the-locale-while-weekofyear-stays-iso-monday-2026-11-14)
  - Reopen: server code accidentally partitions stored weekly aggregates differently across requests carrying different `.locale()` tags.
- **D8:** Format tokens output ASCII digits and Gregorian years while presets localize the calendar (2026-11-14) [L47-L51](decisions/package.md#d8-format-tokens-output-ascii-digits-and-gregorian-years-while-presets-localize-the-calendar-2026-11-14)
  - Reopen: native speakers request an opt-in localized-numeral token mode or non-Gregorian partial dates.
- **D9:** Core has zero runtime dependencies and trims forked `@semantic-ui/utils` helpers to used branches (2026-11-16) [L53-L57](decisions/package.md#d9-core-has-zero-runtime-dependencies-and-trims-forked-semantic-uiutils-helpers-to-used-branches-2026-11-16)
  - Reopen: `@semantic-ui/utils` publishes tree-shakeable single-branch entrypoints with zero unreached bytes and consumers favor cross-package deduplication over zero dependencies.
- **D10:** Error explanations use inline `isDevelopment` checks, and `{ loose: true }` still throws on bad options (2026-11-16) [L59-L63](decisions/package.md#d10-error-explanations-use-inline-isdevelopment-checks-and--loose-true--still-throws-on-bad-options-2026-11-16)
  - Reopen: callers building dynamic zone or format inputs from untrusted user text need a non-throwing validation helper.
- **D11:** Custom `weekdayNames`, `ordinals`, and named `formats` live in `configure()` instead of locale plugins (2026-11-16) [L65-L69](decisions/package.md#d11-custom-weekdaynames-ordinals-and-named-formats-live-in-configure-instead-of-locale-plugins-2026-11-16)
  - Reopen: multiple downstream apps duplicate the same locale ordinal or `dd` overrides and warrant a shared community table.
- **D12:** Core parses unambiguous non-ISO inputs and refuses inputs with two readings (2026-11-16) [L71-L75](decisions/package.md#d12-core-parses-unambiguous-non-iso-inputs-and-refuses-inputs-with-two-readings-2026-11-16)
  - Reopen: a non-ISO form accepted in core misparses real input, or callers repeatedly hit one of the remaining refusals where an explicit option could disambiguate.
- **D13:** Unix timestamp properties include their unit (`epochSeconds`, `epochMilliseconds`, `epochNanoseconds`) with no bare `.epoch` (2026-11-17) [L77-L81](decisions/package.md#d13-unix-timestamp-properties-include-their-unit-epochseconds-epochmilliseconds-epochnanoseconds-with-no-bare-epoch-2026-11-17)
  - Reopen: migration feedback shows omitting `.epoch` causes widespread friction without preventing real seconds-vs-milliseconds bugs.
- **D14:** Numeric day of the week is `dayOfWeek` (`1`-`7`) while token `d` keeps Moment's `0`-`6` (2026-11-17) [L83-L87](decisions/package.md#d14-numeric-day-of-the-week-is-dayofweek-1-7-while-token-d-keeps-moments-0-6-2026-11-17)
  - Reopen: callers hit bugs from `format('d')` returning `0` on Sunday while `.dayOfWeek` and `format('E')` return `7`.
- **D15:** `Duration` uses `balance()` without a `normalize()` alias, and `total(unit)` instead of `in(unit)` (2026-11-17) [L89-L93](decisions/package.md#d15-duration-uses-balance-without-a-normalize-alias-and-totalunit-instead-of-inunit-2026-11-17)
  - Reopen: cold-reader studies or user issues show callers repeatedly reaching for `duration.in(unit)` or `duration.normalize()`.
- **D16:** Ranges accept `.for()` for durations alongside `.to()`, and only `CalendarDate` has `.through()` (2026-11-17) [L95-L99](decisions/package.md#d16-ranges-accept-for-for-durations-alongside-to-and-only-calendardate-has-through-2026-11-17)
  - Reopen: callers pass endpoints to `.for()` expecting runtime rejection, or expect `.through()` on `DateTime` with inclusive end semantics.
- **D17:** Adjacent unit boundaries use `startOfNext()` and `startOfPrevious()` instead of overloading `next()` and `previous()` (2026-11-19) [L101-L105](decisions/package.md#d17-adjacent-unit-boundaries-use-startofnext-and-startofprevious-instead-of-overloading-next-and-previous-2026-11-19)
  - Reopen: callers consistently try unit names in `next()` and `previous()`, or expect numeric weekdays in `startOfNext()`.
