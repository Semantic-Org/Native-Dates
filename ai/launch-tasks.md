# 1.0 Launch Tasks

What is left before `native-dates` tags 1.0, written 2026-11-14 after ranges, token patterns, `MonthDay` and `YearMonth` moved into core. Work the sections in order: sections 1 and 2 decide the surface and what it prints, and everything after them tests, documents or measures the result.

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

## 2. Locale sweep

The docs will carry examples for each language, and may show a homepage section only to a reader who has picked that language. Those pages put every English-shaped corner on display, so find them first. The method that found the last two bugs is cheap: print one value in twenty locales and read the column.

- [ ] **Sweep every output path across locales**: each preset on each noun, ranges of each kind, durations in each style, `text`, and token patterns. Include a right-to-left locale, one with its own digits, and one with its own calendar.
- [ ] **Token `Do` prints English.** `format('Do', 'de')` gives `17th`. This is wrong output, so fix it if `Intl` can supply the ordinal cheaply, and otherwise decide what `Do` means outside English.
- [ ] **Tokens `a` and `A` always print `am` and `pm`.** The presets print the locale's own. Same call as `Do`.
- [ ] **Token `dd` is the first two letters of the short weekday name**, which is right in English and arbitrary elsewhere.
- [ ] **Week start does not follow the locale.** It is Monday unless `configure({ weekStart })` says otherwise, so a calendar grid in a locale that starts on Sunday or Saturday is wrong by default. The platform knows each locale's first day.
- [ ] **Loose parsing reads month names in English only.** `monthDay('17 octobre', { loose: true })` is `null`. Decide whether that is a gap or the meaning of loose.
- [ ] **Calendars.** A Persian or Hebrew locale prints a full date in its own calendar, while `MonthDay` and `YearMonth` always print Gregorian months. That was chosen, and the example for such a language should show it on purpose.

For the examples themselves: lead with presets and options bags, where the library is strongest in every locale, before token patterns.

### Sweep results, 2026-11-14

Twenty-four locales, every output path: presets on each noun, the `L` names, month-days, year-months, ranges of each kind, durations, relative phrases, token patterns and the name tables. Presets, ranges, durations and relative phrases read correctly everywhere, since `Intl` writes them. Everything wrong was in token patterns.

Fixed, at 0.22 kB for all four:

- **Month names in a Persian locale came from the Persian calendar** while the numbers beside them were Gregorian, so November 6 printed as the 6th of Aban. Token month names and `monthNames()` are Gregorian now.
- **A month beside a day takes the form the language uses there**: `6 ноября` and `6 listopada`, where the month alone stays `ноябрь` and `listopad`. Russian, Polish, Czech, Croatian, Finnish, Greek and Catalan were checked.
- **`a` and `A` print the locale's own**: `午後`, `오후`, `م`, where they printed `pm` everywhere.
- **`Do` prints a plain number outside English**, where it printed `6th` inside German and Japanese text.

Open, each a decision more than a bug:

- [ ] **Week start.** `Intl.Locale` reports each locale's first day (Sunday for `en-US`, `ja`, `pt-BR` and `he`, Saturday for `fa`, Monday for most of Europe). The library says Monday unless configured, so `startOf('week')`, `range('week')` and `weekdayNames()` are wrong by default for those readers. Following the locale changes what `today().startOf('week')` returns in the US.
- [ ] **`dd`** is two letters cut from the short weekday name. In Arabic that is the article, `ال`, for every day of the week. `Intl` has a narrow form (`F`, `金`) that is right everywhere and one letter in English.
- [ ] **`YearMonth` short is `11/26`**, a two-digit year, which reads as November 26th in most of these locales and as year 26 month 11 in Japanese. A four-digit year would not be mistaken for a day.
- [ ] **A Persian reader sees two calendars.** Dates print in the Persian calendar (`۱۵ آبان ۱۴۰۵`) and a month-day prints Gregorian (`۶ نوامبر`). Chosen, and the Persian page should say so.
- [ ] **A time range across midnight is written a little differently from one that is not** in locales whose range form adds a word: German `09:00–17:00 Uhr` against `22:00–06:00`, Japanese `9時00分～17時00分` against `22:00～6:00`.
- [ ] **Token patterns print ASCII digits** in locales with their own (`ar-EG`, `fa`), where presets print the locale's. Right for `YYYY-MM-DD`, arguable for `D MMMM`.

## 3. Tests

The repo has had no tests on purpose, so nothing pinned the API while it moved. Once sections 1 and 2 are settled that reason is gone, and this is the largest piece of work left.

- [ ] Write the suite against the settled surface, through the public factories and methods only.
- [ ] Cover what was fixed by hand this month, since each was a real report: formatting a date or a time with a datetime's options, `date(datetime, zone)`, ISO strings with `Z`, loose rollover in every written shape, duration anchors, token patterns with a stray letter, a time range across midnight in a locale that is not English.
- [ ] Run the same suite on `temporal-polyfill` and on a minified bundle, the two places behaviour could differ from source.

## 4. Unverified

Everything so far ran on Node 26 with native Temporal and was bundled with esbuild.

- [ ] **Browsers.** Chrome and Firefox on native Temporal, Safari through `@native-dates/polyfill`.
- [ ] **Bundlers.** One small app each on Vite, Rollup and webpack, checking the size and that nothing is dropped.
- [ ] **Types in a consumer project** under both `nodenext` and `bundler` resolution, and through the `@native-dates/core` alias. The type files re-export each other with `.js` specifiers.
- [ ] **Performance.** No benchmark exists. Measure parsing, arithmetic and formatting in a loop against Day.js before someone else does.

## 5. Release mechanics

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
