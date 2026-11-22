# Architecture: Core, Plugins, Polyfill, and Skills

> status: active (2026-11-21). Core (`native-dates`), `@native-dates/core`, `@native-dates/plugins`, `@native-dates/polyfill`, `ai/skills/`, and `docs/` are live. Automated browser benchmarks in `bench/` and documentation translations are tracked in [`plan/roadmap.md`](../plan/roadmap.md).

## Workspace Packages and Directories

| Path | Package | Contents |
|---|---|---|
| `src/` | `native-dates` | Core date library: `index.js` barrel, one noun class per file (`range.js` holds `Range` and its three subclasses), and category-grouped utilities in `helpers/` |
| `types/` | | Hand-authored TypeScript declarations mirroring `src/`. Their doc comments power editor hover/autocomplete (`@see` links follow [`types.md`](../standards/types.md)) |
| `ai/skills/` | `native-dates` | Agent skills (`native-dates.md`, `native-dates-plugins.md`), published in `package.json` `"files"` and served via `/skills/<skill>.md`, `/llms.txt`, and `/llms-full.txt` ([`ai-author-context.md`](../standards/ai-author-context.md)) |
| `ai/contributing/` | private | Internal design decisions, bundle budget, project roadmap, upstream standards, and contributor workflows |
| `packages/core/` | `@native-dates/core` | Thin scoped re-export of `native-dates` |
| `packages/plugins/` | `@native-dates/plugins` | Opt-in side-effect plugins (`zones`, `loose`, `legacy-date`) in `src/`, with module-augmentation declarations in `types/` |
| `packages/polyfill/` | `@native-dates/polyfill` | Conditional `temporal-polyfill` loader that dynamically imports the polyfill only when `globalThis.Temporal` is absent |
| `docs/` | private | Astro documentation site (`nativedates.dev`, see [`docs/README.md`](../../../docs/README.md)) |
| `tools/` | private | Static gates (`gates/{ai,budget,prose,errors,comments}.js`), CI bundle size reporter (`ci/bundle/`), git hooks (`hooks/`), and `size.js` |

How `src/` is laid out and how a class is structured follow [`folders-and-filenames.md`](../standards/legibility/folders-and-filenames.md), [`code-structures.md`](../standards/legibility/code-structures.md), and [`coding-standards.md`](../standards/coding-standards.md).

## Core Nouns

`Temporal` exposes classes across instants, zoned and plain moments, dates, times, partial dates, durations, and calendars (`Instant`, `ZonedDateTime`, `PlainDateTime`, `PlainDate`, `PlainTime`, `PlainYearMonth`, `PlainMonthDay`, `Duration`, `Calendar`). Core provides one noun per value kind and adds ranges, which `Temporal` omits:

| Noun | Factory | Wraps | Key Invariant |
|---|---|---|---|
| `DateTime` | `datetime()`, `now()` | `Temporal.ZonedDateTime` | Exact instant + a zone to read it in. `Z` or an offset in an input string fixes the instant only, never the zone, so DST math uses the real zone. `toString()` and `toJSON()` serialize to UTC. |
| `CalendarDate` | `date()`, `today()`, `tomorrow()`, `yesterday()` | `Temporal.PlainDate` | Calendar day with no clock and no zone. Refuses clock units (`hours`, `minutes`) and numeric coercion (`<`, `-`). |
| `Time` | `time()` | `Temporal.PlainTime` | Time of day (`'9am'`, `'17:30'`), wraps at midnight, refuses calendar units (`days`, `months`) and numeric coercion. |
| `Duration` | `duration()`, `hours()`..`years()` | `Temporal.Duration` | Keeps fields as written until `.balance()`. Remembers `#anchor` when produced by `.until()` / `.since()` so months and years can `.total()` and `.compare()`. |
| `MonthDay` | `monthDay()`, `dayMonth()` | `Temporal.PlainMonthDay` | Month and day with no year. Feb 29 falls on Feb 28 in a non-leap year. Has no linear order, comparing only via `equals()` and `fallsOn()` / `isOn()`. Reached via `.monthDay` or `as('monthDay')`. |
| `YearMonth` | `yearMonth()`, `monthYear()` | `Temporal.PlainYearMonth` | Year and month with no day. Counts in months and years and refuses smaller units. Reached via `.yearMonth` or `as('yearMonth')`. |
| `DateRange`, `DateTimeRange`, `TimeRange` | `dateRange()`, `datetimeRange()`, `timeRange()`, `.to()`, `.for()`, `.range()` | Two points of one kind | Not a `Temporal` type. A date range includes its last day, a datetime or time range excludes its end, and a time range may cross midnight. |

Every instance freezes on construction and defines `text` first among its own enumerable properties so logging a value in DevTools or Node leads with its human-readable form without clicking getters.

## Core vs. Plugins

Core holds what nearly every caller needs:

- Core nouns (`DateTime`, `CalendarDate`, `Time`, `Duration`, `MonthDay`, `YearMonth`, and the three ranges) and their lowercase factories (`datetime`, `date`, `time`, `duration`, `now`, `today`, `tomorrow`, `yesterday`, `hours`..`years`, `monthDay`, `dayMonth`, `yearMonth`, `monthYear`, `dateRange`, `datetimeRange`, `timeRange`)
- Natural-language arithmetic (`plus`/`minus`, with zero-cost `add`/`subtract` prototype aliases), rounding, weekday stepping (`next`/`previous`), comparisons, and `until`/`since`
- `Intl` preset formatting (`short`, `medium`, `long`, `full`, `date`, `time`, `month`, `text`), `Intl` options bags, custom named formats via `configure({ formats })`, and token patterns (`YYYY-MM-DD HH:mm`) with `monthNames()` and `weekdayNames()`
- Relative phrases (`fromNow()`, `from(other)`: `'3 hours ago'`, `'in 2 days'`, `'yesterday'`) via `Intl.RelativeTimeFormat`
- Ranges from any point (`.to()`, `.for()`, `.through()`, `.range()`, `.every()`, `.count()`, `.split()`, `.splitBy()`) with `contains`/`includes`, `overlaps`, and `intersection`
- Duration phrases (`'1h 30m'`, `'2 weeks and 3 days'`) and fractional unit spilling (`1.5 days` -> `1d 12h`)
- Standard IANA zones, fixed offsets, `UTC`, per-value `.locale()`, `configure({ zone, locale, weekStart, formats, weekdayNames, ordinals })`, `compare`, `earliest`, `latest`, `dayOfWeek`, and `kindOf`

Opt-in plugins live in `packages/plugins/src/` (`@native-dates/plugins`, `"sideEffects": ["./src/*.js"]`). Importing a plugin subpath installs its prototype methods and hooks once at module load without setup calls:

| Subpath | Adds | Mechanism |
|---|---|---|
| `@native-dates/plugins/zones` | City lookup (`'Berlin'`, `'los angeles'`), abbreviations (`'PT'`, `'CET'`), `configure({ zoneAliases })` | Registers fallback zone resolver in `helpers/zones.js` |
| `@native-dates/plugins/loose` | `{ loose: true, dayFirst }` `Date.parse` fallback and `null` on unreadable input | Supplies the loose parser and `loosely` wrapper in `helpers/errors.js` across factories and ranges |
| `@native-dates/plugins/legacy-date` | `Date.prototype` read methods (`getFullYear`, `getUTC*`, `toISOString`, `toLocale*`) and `set*` refusals on `DateTime` | Attaches prototype methods onto `DateTime` (`.toJSDate()` stays in core) |

## Invariants

- **Zero runtime dependencies.** `native-dates` installs nothing and declares `"sideEffects": false` in `package.json` (`@native-dates/plugins` allowlists `"./src/*.js"`). When a helper from `@semantic-ui/utils` is needed (`each`, `createErrors`, type guards, `isDevelopment`), look up its canonical signature in [`utility-functions.md`](../standards/utility-functions.md) and copy only the minimal branches `native-dates` reaches into `src/helpers/utils.js` or `src/helpers/environment.js`. Measuring a verbatim copy of `@semantic-ui/utils` saved apps already shipping utils 61 B while costing standalone consumers 300 B.
- **Structured, stripped errors.** Every refusal routes through `refuse()` or `refuseType()` in `src/helpers/errors.js` (`dates refused [code] at`), following [`errors-and-logs.md`](../standards/legibility/errors-and-logs.md). Explanations are gated behind `isDevelopment` (`process.env.NODE_ENV !== 'production'`) so diagnostic prose strips out of production bundles. Any legitimate user-facing runtime prose must be explicitly allowlisted under `prose:` in [`budget.md`](../budget.md).
- **Package-name imports across workspaces.** Plugins import `native-dates` (and `native-dates/helpers/*`) by package name rather than relative filesystem paths so bundlers deduplicate core to one module instance.
- **`@native-dates/core` contains no logic of its own**; it re-exports `native-dates` for scoped-import consistency.

## Testing and Static Gates

- `npm run check`: Runs `npm test`, `npm run ai`, and `npm run size`.
- `npm test`: Vitest across `test/`, `packages/*/test/`, and `tools/`. Package tests import public package names and assert errors by `error.code` and `error.at`.
- `npm run types`: `tsc --noEmit` (under both NodeNext and `bundler` resolution) over `test/types.ts` against hand-authored `.d.ts` declarations.
- `npm run errors`: `tools/gates/errors.js` checking `. Capital` splits, punctuation, structured error helpers, and error code vocabulary.
- `npm run comments`: `tools/gates/comments.js` checking comment ratios, run length, word overlap, and banned process jargon.
- `npm run ai`: `tools/gates/ai.js` checking Markdown links, `#heading` anchors, GFM tables, `ai/` paths, and `AGENTS.md` symlinks.
- `npm run size`: `tools/gates/budget.js` over the rows of `tools/size.js`.

## Bundle Size Measurement

Run `npm run size` (`tools/gates/budget.js` over `tools/size.js`) after any edit to `src/` or `packages/`. It bundles realistic consumer imports with `esbuild` (`minify: true`, `NODE_ENV="production"`) and compresses at Brotli quality 11, reporting `import { now }`, `native-dates (full)`, each plugin's marginal cost over core, and `core + all plugins`, while verifying that dev explanations exist in development builds and fold out of production builds. The docs site imports the same `tools/size.js` helpers at build time so documented byte counts never drift, and [`tools/ci/bundle/README.md`](../../../tools/ci/bundle/README.md) documents the pull request check and sticky comment pipeline.
