# 1.0 Launch Tasks

What is left before `native-dates` tags 1.0, written 2026-11-14 after ranges, token patterns, `MonthDay` and `YearMonth` moved into core. Work the sections in order: section 1 decides the surface, and everything after it tests, documents or measures that surface.

Sizes when this was written (`npm run size`, Brotli): 12.13 kB for everything in `native-dates`, 10.69 kB for `import { now }`, four plugins on top (`relative`, `zones`, `loose`, `legacy-date`).

## How to decide

Three rules the maintainer set while this list was drawn up. They outrank habit.

- **The golden rule.** Ask what you would want if someone shipped this library into your project, as a developer tired on a Tuesday afternoon. Not what Temporal does, and not what the docs say.
- **A second spelling is welcome** when it costs next to nothing and is not ambiguous (`monthDay` and `dayMonth`, `zz` beside `z`).
- **A guard has to earn its bytes.** Fix what prints a wrong answer. A rare input that already fails loudly can stay as it is.

## 1. Decisions that 1.0 makes permanent

- [ ] **`native-dates/helpers/*` is a public entry.** The exports map serves every file in `src/helpers/` because the plugins import from it. Either say in writing that the path is unstable, or narrow it to what the four plugins use (`errors`, `intl`, `zones`, `types`).
- [ ] **Error codes.** Apps will route on `error.code`, so the codes freeze at 1.0. Read all of them once for naming. The reference is the sync repo: `../sync/ai/skills/author-error-messages.md` for the register and the six condition words (`missing`, `unknown`, `invalid`, `unsupported`, `duplicate`, `conflicting`), and `../sync/ai/reference/error-corpus.md` for worked lines. Take the register and the vocabulary. Leave whatever in it adds production bytes, since explanations here already fold out when `isDevelopment` is false and nothing more should ship.
- [ ] **Relative time.** `formatRelative()` is a plugin at about 0.3 kB, and the cohort calls it `fromNow()` and `from()`. Decide the name, and whether it belongs in core by the same test that brought tokens in.
- [ ] **Names worth one last read.** `monthDay.in(2027)` beside `datetime.in(zone)`. `after()` and `before()` beside `next()` and `previous()`. `as()` reaches five kinds where `kindOf()` reports more, so there is no `as('dateRange')`.

## 2. Tests

The repo has had no tests on purpose, so nothing pinned the API while it moved. Once section 1 is settled that reason is gone, and this is the largest piece of work left.

- [ ] Write the suite against the settled surface, through the public factories and methods only.
- [ ] Cover what was fixed by hand this month, since each was a real report: formatting a date or a time with a datetime's options, `date(datetime, zone)`, ISO strings with `Z`, loose rollover in every written shape, duration anchors, token patterns with a stray letter, a time range across midnight in a locale that is not English.
- [ ] Run the same suite on `temporal-polyfill` and on a minified bundle, the two places behaviour could differ from source.

## 3. Unverified

Everything so far ran on Node 26 with native Temporal and was bundled with esbuild.

- [ ] **Browsers.** Chrome and Firefox on native Temporal, Safari through `@native-dates/polyfill`.
- [ ] **Bundlers.** One small app each on Vite, Rollup and webpack, checking the size and that nothing is dropped.
- [ ] **Types in a consumer project** under both `nodenext` and `bundler` resolution, and through the `@native-dates/core` alias. The type files re-export each other with `.js` specifiers.
- [ ] **Performance.** No benchmark exists. Measure parsing, arithmetic and formatting in a loop against Day.js before someone else does.

## 4. Release mechanics

- [ ] **Versions.** All four packages say `0.0.6`. Nobody depends on the published ones, so there is nothing to migrate, but core, plugins, polyfill and the `@native-dates/core` alias need one number and matching peer ranges.
- [ ] **Docs.** The site has to say 12 kB and four plugins everywhere, and show one import for ranges, tokens and the two date nouns. The root README is written by the maintainer by hand.
- [ ] **When the polyfill is needed.** Node 26 is the first Node with Temporal and `engines` says so. The install page has to say plainly which browsers need `@native-dates/polyfill`.
- [ ] **`configure()` on a server.** Zone and locale defaults are process-wide, which suits a browser and is a trap for a server answering many users. The docs should say to pass them per call there.

## Left as they are, on purpose

Known, weighed, and not worth their bytes or their churn. Reopen one only with a report from a user.

- `monthDay(10, 17).format({ dateStyle: 'bogus' })` throws a plain `TypeError`. It is a mistyped option that already fails loudly.
- Loose parsing tells a rolled-forward day from a real one by a rule of thumb for month names, and `'Mar 1 29'` style two-digit years are read by asking the engine again. Both are rare and both fail toward `null`.
- `src/range.js` holds the shared `Range` and its three kinds in one file.
- Tokens the cohort has and nobody asked for: `k`, `w`, `GGGG`, `Mo`, more than three `S`.
- An unknown kind passed to `as()` lists the kinds that noun reaches, and no others.

## Done since the move into core

- A time range across midnight joins its ends the way the locale does. Japanese printed a stray 分 and Korean lost its `~`.
- `engines` requires Node 26.
- The docs playground loads the polyfill in its hidden setup, so an example runs in a browser without Temporal and says nothing about it in its own code.
- Nothing sits above the class in `src/range.js`. Its tables and helpers are statics on `Range`.
