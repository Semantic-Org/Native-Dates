# Decisions

> Generated from [`decisions/package.md`](decisions/package.md) by `npm run ai:index` and checked by `npm run ai`. Do not edit by hand. Read [`decisions/README.md`](decisions/README.md) before adding or reopening an entry (features and bug fixes do not belong here, and repo process calls belong in [`decisions/project.md`](decisions/project.md)).

## By Topic

Active package decisions grouped by area, newest first.

### Zones, Offsets, and Serialization

- **D22:** `@native-dates/plugins/zones` maps non-IANA city names and resolves shared abbreviations by locale (2026-11-22) [L131-L135](decisions/package.md#d22-native-datespluginszones-maps-non-iana-city-names-and-resolves-shared-abbreviations-by-locale-2026-11-22)
  - Reopen: city requests keep expanding the alias table without a clear boundary, or users report locale-driven lookup misreading foreign-country abbreviations.
- **D21:** Time zone abbreviations inside `{ loose: true }` strings resolve like `{ zone }` rather than `Date.parse()` (2026-11-22) [L125-L129](decisions/package.md#d21-time-zone-abbreviations-inside--loose-true--strings-resolve-like--zone--rather-than-dateparse-2026-11-22)
  - Reopen: users parsing RFC 2822 email or HTTP headers report bugs from `'EST'` or `'PST'` observing daylight time while `@native-dates/plugins/zones` is loaded.
- **D2:** `DateTime` serializes to ISO 8601 UTC rather than Temporal's bracketed `[Zone]` string (2026-11-05) [L11-L15](decisions/package.md#d2-datetime-serializes-to-iso-8601-utc-rather-than-temporals-bracketed-zone-string-2026-11-05)
  - Reopen: RFC 9557 bracketed zone strings gain broad parser and database support and users ask to round-trip `.zone` through JSON.
- **D1:** Trailing `Z` and numeric offsets in `datetime()` set the instant, not `.zone` (2026-11-05) [L5-L9](decisions/package.md#d1-trailing-z-and-numeric-offsets-in-datetime-set-the-instant-not-zone-2026-11-05)
  - Reopen: developers report expecting `datetime('...Z')` or offset strings to keep `.zone` and `.hour` in `'UTC'` or that offset rather than converting to the active zone.

### Ranges

- **D16:** Ranges accept `.for()` for durations alongside `.to()`, and only `CalendarDate` has `.through()` (2026-11-17) [L95-L99](decisions/package.md#d16-ranges-accept-for-for-durations-alongside-to-and-only-calendardate-has-through-2026-11-17)
  - Reopen: users report confusion from `.for()` accepting endpoints as an alias of `.to()`, or ask for inclusive `.through()` on `DateTime`.
- **D5:** `DateRange` includes its end date while `DateTimeRange` and `TimeRange` are half-open (2026-11-12) [L29-L33](decisions/package.md#d5-daterange-includes-its-end-date-while-datetimerange-and-timerange-are-half-open-2026-11-12)
  - Reopen: bug reports show frequent off-by-one errors when converting between inclusive `DateRange` and half-open `DateTimeRange` bounds.

### Durations

- **D15:** `Duration` uses `balance()` without a `normalize()` alias, and `total(unit)` instead of `in(unit)` (2026-11-17) [L89-L93](decisions/package.md#d15-duration-uses-balance-without-a-normalize-alias-and-totalunit-instead-of-inunit-2026-11-17)
  - Reopen: cold-reader studies or user issues show developers repeatedly reaching for `duration.in(unit)` or `duration.normalize()`.

### Arithmetic, Boundaries, and Weekdays

- **D19:** `isWeekend()` and `isWeekday()` follow the locale (2026-11-22) [L113-L117](decisions/package.md#d19-isweekend-and-isweekday-follow-the-locale-2026-11-22)
  - Reopen: bug reports show `.locale()` unexpectedly changing `isWeekend()`, `isWeekday()`, or `count('weekdays')`, or users ask for a `configure()` weekend override.
- **D17:** Adjacent unit boundaries use `startOfNext()` and `startOfPrevious()` instead of overloading `next()` and `previous()` (2026-11-19) [L101-L105](decisions/package.md#d17-adjacent-unit-boundaries-use-startofnext-and-startofprevious-instead-of-overloading-next-and-previous-2026-11-19)
  - Reopen: cold-reader studies or user issues show developers trying unit names in `next()` and `previous()`, or passing numeric weekdays to `startOfNext()`.
- **D14:** Numeric day of the week is `dayOfWeek` (`1`-`7`) while token `d` keeps Moment's `0`-`6` (2026-11-17) [L83-L87](decisions/package.md#d14-numeric-day-of-the-week-is-dayofweek-1-7-while-token-d-keeps-moments-0-6-2026-11-17)
  - Reopen: bug reports show developers mixing up `format('d')` (`0` on Sunday) with `.dayOfWeek` and `format('E')` (`7` on Sunday).
- **D7:** Default week boundaries follow the locale while `weekOfYear` stays ISO Monday (2026-11-14) [L41-L45](decisions/package.md#d7-default-week-boundaries-follow-the-locale-while-weekofyear-stays-iso-monday-2026-11-14)
  - Reopen: bug reports show `startOf('week')` shifting unexpectedly across host or instance locales when `weekStart` is unset, or users ask for localized week-of-year numbering alongside ISO `weekOfYear`.

### Formatting, Tokens, and Locales

- **D11:** Custom `weekdayNames`, `ordinals`, and named `formats` live in `configure()` instead of locale plugins (2026-11-16) [L65-L69](decisions/package.md#d11-custom-weekdaynames-ordinals-and-named-formats-live-in-configure-instead-of-locale-plugins-2026-11-16)
  - Reopen: recurring issues or PRs repeat the same language's `Do` ordinal or `dd` overrides, warranting an opt-in locale pack.
- **D8:** Format tokens output ASCII digits and Gregorian years while presets localize the calendar (2026-11-14) [L47-L51](decisions/package.md#d8-format-tokens-output-ascii-digits-and-gregorian-years-while-presets-localize-the-calendar-2026-11-14)
  - Reopen: speakers of non-Gregorian or non-ASCII-numeral locales ask for an opt-in localized token mode or non-Gregorian partial dates.
- **D6:** `.locale()` attaches a locale to instances without affecting equality or JSON (2026-11-14) [L35-L39](decisions/package.md#d6-locale-attaches-a-locale-to-instances-without-affecting-equality-or-json-2026-11-14)
  - Reopen: users report deep-equality test failures (such as Vitest or Jest `toEqual()`) when comparing `.equals()` instances across locales because their `.text` own properties differ.

### Parsing, Inputs, and Comparisons

- **D20:** Loose parsing follows the locale while `monthDay()` and `dayMonth()` keep function-name order (2026-11-22) [L119-L123](decisions/package.md#d20-loose-parsing-follows-the-locale-while-monthday-and-daymonth-keep-function-name-order-2026-11-22)
  - Reopen: speakers report a locale's `Intl` short date order diverging from typed input, or unconfigured host locales cause inconsistent `{ loose: true }` results across environments.
- **D12:** Core accepts unambiguous non-ISO inputs and refuses inputs with two readings (2026-11-16) [L71-L75](decisions/package.md#d12-core-accepts-unambiguous-non-iso-inputs-and-refuses-inputs-with-two-readings-2026-11-16)
  - Reopen: an accepted non-ISO form misreads real user input, or recurring issues hit one of these refusals where an explicit option could disambiguate it.

### Nouns, Instances, and Epoch

- **D13:** Unix timestamp properties include their unit (`epochSeconds`, `epochMilliseconds`, `epochNanoseconds`) with no bare `.epoch` (2026-11-17) [L77-L81](decisions/package.md#d13-unix-timestamp-properties-include-their-unit-epochseconds-epochmilliseconds-epochnanoseconds-with-no-bare-epoch-2026-11-17)
  - Reopen: migration feedback or user issues show omitting `.epoch` causing widespread friction.
- **D3:** Instances freeze on construction with `text` as an eager own property (2026-11-05) [L17-L21](decisions/package.md#d3-instances-freeze-on-construction-with-text-as-an-eager-own-property-2026-11-05)
  - Reopen: profiles in `bench/` or user performance reports show eager `text` formatting dominating hot arithmetic or `range.every()` loops.

### Plugins, Errors, and Dependencies

- **D18:** `native-dates/helpers/*` stays open for official plugins without semver guarantees (2026-11-20) [L107-L111](decisions/package.md#d18-native-dateshelpers-stays-open-for-official-plugins-without-semver-guarantees-2026-11-20)
  - Reopen: external packages depend on `native-dates/helpers/*` directly and report breakage across minor releases.
- **D10:** Error explanations use inline `isDevelopment` checks, and `{ loose: true }` still throws on bad options (2026-11-16) [L59-L63](decisions/package.md#d10-error-explanations-use-inline-isdevelopment-checks-and--loose-true--still-throws-on-bad-options-2026-11-16)
  - Reopen: users ask for a non-throwing way to validate untrusted zone or locale strings, or mainstream production builds fail to strip `isDevelopment` prose.
- **D9:** Core has zero runtime dependencies and trims forked `@semantic-ui/utils` helpers to used branches (2026-11-16) [L53-L57](decisions/package.md#d9-core-has-zero-runtime-dependencies-and-trims-forked-semantic-uiutils-helpers-to-used-branches-2026-11-16)
  - Reopen: `@semantic-ui/utils` ships tree-shakeable entrypoints with zero dead bytes and Semantic UI bundle savings outweigh zero-dependency installs.
- **D4:** Plugins attach on subpath import instead of requiring `use()` or `extend()` (2026-11-08) [L23-L27](decisions/package.md#d4-plugins-attach-on-subpath-import-instead-of-requiring-use-or-extend-2026-11-08)
  - Reopen: reports show a mainstream bundler tree-shaking bare `@native-dates/plugins/*` imports despite `"sideEffects": ["./src/*.js"]`.

## Chronological

Every package decision (`D1`..`Dn`) in file order.

- **D1:** Trailing `Z` and numeric offsets in `datetime()` set the instant, not `.zone` (2026-11-05) [L5-L9](decisions/package.md#d1-trailing-z-and-numeric-offsets-in-datetime-set-the-instant-not-zone-2026-11-05)
  - Reopen: developers report expecting `datetime('...Z')` or offset strings to keep `.zone` and `.hour` in `'UTC'` or that offset rather than converting to the active zone.
- **D2:** `DateTime` serializes to ISO 8601 UTC rather than Temporal's bracketed `[Zone]` string (2026-11-05) [L11-L15](decisions/package.md#d2-datetime-serializes-to-iso-8601-utc-rather-than-temporals-bracketed-zone-string-2026-11-05)
  - Reopen: RFC 9557 bracketed zone strings gain broad parser and database support and users ask to round-trip `.zone` through JSON.
- **D3:** Instances freeze on construction with `text` as an eager own property (2026-11-05) [L17-L21](decisions/package.md#d3-instances-freeze-on-construction-with-text-as-an-eager-own-property-2026-11-05)
  - Reopen: profiles in `bench/` or user performance reports show eager `text` formatting dominating hot arithmetic or `range.every()` loops.
- **D4:** Plugins attach on subpath import instead of requiring `use()` or `extend()` (2026-11-08) [L23-L27](decisions/package.md#d4-plugins-attach-on-subpath-import-instead-of-requiring-use-or-extend-2026-11-08)
  - Reopen: reports show a mainstream bundler tree-shaking bare `@native-dates/plugins/*` imports despite `"sideEffects": ["./src/*.js"]`.
- **D5:** `DateRange` includes its end date while `DateTimeRange` and `TimeRange` are half-open (2026-11-12) [L29-L33](decisions/package.md#d5-daterange-includes-its-end-date-while-datetimerange-and-timerange-are-half-open-2026-11-12)
  - Reopen: bug reports show frequent off-by-one errors when converting between inclusive `DateRange` and half-open `DateTimeRange` bounds.
- **D6:** `.locale()` attaches a locale to instances without affecting equality or JSON (2026-11-14) [L35-L39](decisions/package.md#d6-locale-attaches-a-locale-to-instances-without-affecting-equality-or-json-2026-11-14)
  - Reopen: users report deep-equality test failures (such as Vitest or Jest `toEqual()`) when comparing `.equals()` instances across locales because their `.text` own properties differ.
- **D7:** Default week boundaries follow the locale while `weekOfYear` stays ISO Monday (2026-11-14) [L41-L45](decisions/package.md#d7-default-week-boundaries-follow-the-locale-while-weekofyear-stays-iso-monday-2026-11-14)
  - Reopen: bug reports show `startOf('week')` shifting unexpectedly across host or instance locales when `weekStart` is unset, or users ask for localized week-of-year numbering alongside ISO `weekOfYear`.
- **D8:** Format tokens output ASCII digits and Gregorian years while presets localize the calendar (2026-11-14) [L47-L51](decisions/package.md#d8-format-tokens-output-ascii-digits-and-gregorian-years-while-presets-localize-the-calendar-2026-11-14)
  - Reopen: speakers of non-Gregorian or non-ASCII-numeral locales ask for an opt-in localized token mode or non-Gregorian partial dates.
- **D9:** Core has zero runtime dependencies and trims forked `@semantic-ui/utils` helpers to used branches (2026-11-16) [L53-L57](decisions/package.md#d9-core-has-zero-runtime-dependencies-and-trims-forked-semantic-uiutils-helpers-to-used-branches-2026-11-16)
  - Reopen: `@semantic-ui/utils` ships tree-shakeable entrypoints with zero dead bytes and Semantic UI bundle savings outweigh zero-dependency installs.
- **D10:** Error explanations use inline `isDevelopment` checks, and `{ loose: true }` still throws on bad options (2026-11-16) [L59-L63](decisions/package.md#d10-error-explanations-use-inline-isdevelopment-checks-and--loose-true--still-throws-on-bad-options-2026-11-16)
  - Reopen: users ask for a non-throwing way to validate untrusted zone or locale strings, or mainstream production builds fail to strip `isDevelopment` prose.
- **D11:** Custom `weekdayNames`, `ordinals`, and named `formats` live in `configure()` instead of locale plugins (2026-11-16) [L65-L69](decisions/package.md#d11-custom-weekdaynames-ordinals-and-named-formats-live-in-configure-instead-of-locale-plugins-2026-11-16)
  - Reopen: recurring issues or PRs repeat the same language's `Do` ordinal or `dd` overrides, warranting an opt-in locale pack.
- **D12:** Core accepts unambiguous non-ISO inputs and refuses inputs with two readings (2026-11-16) [L71-L75](decisions/package.md#d12-core-accepts-unambiguous-non-iso-inputs-and-refuses-inputs-with-two-readings-2026-11-16)
  - Reopen: an accepted non-ISO form misreads real user input, or recurring issues hit one of these refusals where an explicit option could disambiguate it.
- **D13:** Unix timestamp properties include their unit (`epochSeconds`, `epochMilliseconds`, `epochNanoseconds`) with no bare `.epoch` (2026-11-17) [L77-L81](decisions/package.md#d13-unix-timestamp-properties-include-their-unit-epochseconds-epochmilliseconds-epochnanoseconds-with-no-bare-epoch-2026-11-17)
  - Reopen: migration feedback or user issues show omitting `.epoch` causing widespread friction.
- **D14:** Numeric day of the week is `dayOfWeek` (`1`-`7`) while token `d` keeps Moment's `0`-`6` (2026-11-17) [L83-L87](decisions/package.md#d14-numeric-day-of-the-week-is-dayofweek-1-7-while-token-d-keeps-moments-0-6-2026-11-17)
  - Reopen: bug reports show developers mixing up `format('d')` (`0` on Sunday) with `.dayOfWeek` and `format('E')` (`7` on Sunday).
- **D15:** `Duration` uses `balance()` without a `normalize()` alias, and `total(unit)` instead of `in(unit)` (2026-11-17) [L89-L93](decisions/package.md#d15-duration-uses-balance-without-a-normalize-alias-and-totalunit-instead-of-inunit-2026-11-17)
  - Reopen: cold-reader studies or user issues show developers repeatedly reaching for `duration.in(unit)` or `duration.normalize()`.
- **D16:** Ranges accept `.for()` for durations alongside `.to()`, and only `CalendarDate` has `.through()` (2026-11-17) [L95-L99](decisions/package.md#d16-ranges-accept-for-for-durations-alongside-to-and-only-calendardate-has-through-2026-11-17)
  - Reopen: users report confusion from `.for()` accepting endpoints as an alias of `.to()`, or ask for inclusive `.through()` on `DateTime`.
- **D17:** Adjacent unit boundaries use `startOfNext()` and `startOfPrevious()` instead of overloading `next()` and `previous()` (2026-11-19) [L101-L105](decisions/package.md#d17-adjacent-unit-boundaries-use-startofnext-and-startofprevious-instead-of-overloading-next-and-previous-2026-11-19)
  - Reopen: cold-reader studies or user issues show developers trying unit names in `next()` and `previous()`, or passing numeric weekdays to `startOfNext()`.
- **D18:** `native-dates/helpers/*` stays open for official plugins without semver guarantees (2026-11-20) [L107-L111](decisions/package.md#d18-native-dateshelpers-stays-open-for-official-plugins-without-semver-guarantees-2026-11-20)
  - Reopen: external packages depend on `native-dates/helpers/*` directly and report breakage across minor releases.
- **D19:** `isWeekend()` and `isWeekday()` follow the locale (2026-11-22) [L113-L117](decisions/package.md#d19-isweekend-and-isweekday-follow-the-locale-2026-11-22)
  - Reopen: bug reports show `.locale()` unexpectedly changing `isWeekend()`, `isWeekday()`, or `count('weekdays')`, or users ask for a `configure()` weekend override.
- **D20:** Loose parsing follows the locale while `monthDay()` and `dayMonth()` keep function-name order (2026-11-22) [L119-L123](decisions/package.md#d20-loose-parsing-follows-the-locale-while-monthday-and-daymonth-keep-function-name-order-2026-11-22)
  - Reopen: speakers report a locale's `Intl` short date order diverging from typed input, or unconfigured host locales cause inconsistent `{ loose: true }` results across environments.
- **D21:** Time zone abbreviations inside `{ loose: true }` strings resolve like `{ zone }` rather than `Date.parse()` (2026-11-22) [L125-L129](decisions/package.md#d21-time-zone-abbreviations-inside--loose-true--strings-resolve-like--zone--rather-than-dateparse-2026-11-22)
  - Reopen: users parsing RFC 2822 email or HTTP headers report bugs from `'EST'` or `'PST'` observing daylight time while `@native-dates/plugins/zones` is loaded.
- **D22:** `@native-dates/plugins/zones` maps non-IANA city names and resolves shared abbreviations by locale (2026-11-22) [L131-L135](decisions/package.md#d22-native-datespluginszones-maps-non-iana-city-names-and-resolves-shared-abbreviations-by-locale-2026-11-22)
  - Reopen: city requests keep expanding the alias table without a clear boundary, or users report locale-driven lookup misreading foreign-country abbreviations.
