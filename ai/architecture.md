# Architecture — Core and Plugins

## What This Repo Ships

`@native-dates/core` wraps the browser's `Temporal` and `Intl` APIs in plain-English nouns and verbs with zero runtime dependencies. Like `nav-router` and `day.js`, the core stays lean and opt-in subpath plugins (`@native-dates/core/plugins/*`) add specialized capabilities without making every app ship them.

## The Four Core Nouns

Temporal exposes nine classes (`Instant`, `ZonedDateTime`, `PlainDateTime`, `PlainDate`, `PlainTime`, `PlainYearMonth`, `PlainMonthDay`, `Duration`, `Calendar`). Core collapses them into the four things application code actually talks about:

| Noun | Factory | Wraps | Key Invariant |
|---|---|---|---|
| `DateTime` | `datetime()`, `now()` | `Temporal.ZonedDateTime` | Exact instant + a zone to read it in. `Z` or an offset in an input string fixes the instant only, never the zone, so DST math uses the real zone. `toString()` / `toJSON()` serialize to UTC. |
| `CalendarDate` | `date()`, `today()`, `tomorrow()`, `yesterday()` | `Temporal.PlainDate` | Calendar day with no clock and no zone. Refuses clock units (`hours`, `minutes`) and numeric coercion (`<`, `-`). |
| `Time` | `time()` | `Temporal.PlainTime` | Wall clock (`'9am'`, `'17:30'`), wraps at midnight, refuses calendar units (`days`, `months`) and numeric coercion. |
| `Duration` | `duration()`, `hours()`..`years()` | `Temporal.Duration` | Keeps fields as written until `.balance()`. Remembers `#anchor` when produced by `.until()` / `.since()` so months and years can `.total()` and `.compare()`. |

Every instance freezes on construction and sets `text` first among its own properties so logging a value in DevTools or Node leads with its human-readable form without clicking getters.

## Core vs Plugins

Core holds what nearly every caller needs:

- The four nouns (`DateTime`, `CalendarDate`, `Time`, `Duration`) and their lowercase factories (`datetime`, `date`, `time`, `duration`, `now`, `today`, `tomorrow`, `yesterday`, `hours`..`years`)
- Plain-English arithmetic (`plus`/`minus`, with zero-cost `add`/`subtract`/`remove` prototype aliases), rounding, weekday stepping (`next`/`previous`), comparisons, and `until`/`since`
- `Intl` preset formatting (`short`, `medium`, `long`, `full`, `date`, `time`, `month`, `text`) and `Intl` options bags
- Duration phrases (`'1h 30m'`, `'2 weeks and 3 days'`) and fractional unit spilling (`1.5 days` -> `1d 12h`)
- Standard IANA zones, fixed offsets, `UTC`, `configure({ zone, locale, weekStart, plugins })`, `compare`, `earliest`, `latest`, `kindOf`, and `use()`

Opt-in plugins live in `packages/core/src/plugins/` and install via `use(ranges, tokens)` or `configure({ plugins: [ranges, tokens] })`:

| Subpath | Adds | Mechanism |
|---|---|---|
| `plugins/ranges` | `DateRange`, `DateTimeRange`, `TimeRange`, `.to()`, `.range()`, `.points()`, `.split()` | Exports range classes/factories and attaches `.to()` / `.range()` onto point prototypes |
| `plugins/tokens` | `YYYY-MM-DD HH:mm` token patterns, `monthNames()`, `weekdayNames()` | Wraps `.format()` on `DateTime`, `CalendarDate`, and `Time`; calls through for presets and `Intl` bags |
| `plugins/relative` | `.formatRelative(to, locale)` on `DateTime` and `CalendarDate` | Attaches prototype methods backed by `Intl.RelativeTimeFormat` |
| `plugins/zones` | City lookup (`'Berlin'`, `'los angeles'`), abbreviations (`'PT'`, `'CET'`), `configure({ zoneAliases })` | Registers fallback zone resolver and `zoneAliases` config handler in `helpers/zones.js` |
| `plugins/loose` | `{ loose: true, dayFirst }` `Date.parse` fallback and `null` on unreadable input | Supplies the loose parser and `loosely` wrapper in `helpers/errors.js` across factories and ranges |
| `plugins/legacy-date` | `Date.prototype` read methods (`getFullYear`, `getUTC*`, `toISOString`, `toLocale*`) and `set*` refusals on `DateTime` | Attaches prototype methods onto `DateTime` (`.toJSDate()` stays in core) |

## Measuring Size

Run `npm run size` (`tools/size.js`) after any change to `src/`. It bundles with `esbuild` (`minify: true`, `NODE_ENV=production` so `isDevelopment` explanations fold out) and compresses at Brotli quality 11, reporting core, each plugin (with core external), and the combined total.
