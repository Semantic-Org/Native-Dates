# 1.0 Launch Tasks

What is left before `native-dates` tags 1.0, written 2026-11-14 after ranges, token patterns, `MonthDay` and `YearMonth` moved into core. Work the sections in order: sections 1 and 2 decide the surface and what it prints, and everything after them tests, documents or measures the result.

Sizes on 2026-11-16 (`npm run size`, Brotli): 13.72 kB for all of `native-dates`, 12.33 kB for `import { now }`, 15.47 kB with the four plugins (`zones`, `loose`, `weekdays`, `legacy-date`) on top.

## How to decide

Three rules the maintainer set while this list was drawn up. They outrank habit.

- **The golden rule.** Ask what you would want if someone shipped this library into your project, as a developer tired on a Tuesday afternoon. Not what Temporal does, and not what the docs say.
- **A second spelling is welcome** when it costs next to nothing and is not ambiguous (`monthDay` and `dayMonth`, `zz` beside `z`).
- **A guard has to earn its bytes.** Fix what prints a wrong answer. A rare input that already fails loudly can stay as it is.

## 1. Decisions that 1.0 makes permanent

- [ ] **`native-dates/helpers/*` is a public entry.** The exports map serves every file in `src/helpers/` because the plugins import from it. Either say in writing that the path is unstable, or narrow it to what the four plugins use (`environment`, `errors`, `tokens`, `zones`).
- [x] **Error codes** use the six condition words of the sync repo (`missing`, `unknown`, `invalid`, `unsupported`, `duplicate`, `conflicting`), and every explanation was rewritten in its register and reviewed. All of them fold out of a production build. Still open for a read: the `invalid*` codes are thrown as a `TypeError` in some places and a `RangeError` in others.
- [x] **Relative time** is in core as `from(other)` and `fromNow()`, the words moment and day.js use, with `formatRelative()` kept as a second spelling. It cost 0.29 kB of floor, the size the plugin was.
- [ ] **Names worth one last read.** `monthDay.in(2027)` beside `datetime.in(zone)`. `after()` and `before()` beside `next()` and `previous()`. `as()` reaches five kinds where `kindOf()` reports more, so there is no `as('dateRange')`.

### Decided: a locale rides on the value

`value.locale('es')`, with `lang()` as a second spelling, returns the same value written in Spanish, and everything made from it stays Spanish: arithmetic, `.date` and `.time`, ranges, durations from `until()`, month-days and year-months. `locale()` with no argument reads it back. A factory takes it too, `date(input, { locale })`.

- It is how a value is written and nothing else. Equality, order and JSON ignore it, and it has no tie to the zone.
- `format(spec, locale)` still wins for one call, then the value's own, then `configure({ locale })`, then the runtime's.
- When two values meet, the one the method was called on keeps its locale: `spanish.to(german)` is Spanish.
- One thing it does beyond writing: it sets where a week starts, below.

Cost: 0.32 kB with the fixes from its review.

Left as the contract does not say, for a decision if anyone asks:

- A value with no locale takes one from the value it is combined with in some places and not others: `time('18:00').on(frenchDate)` is French, `hours(1).plus(spanishDuration)` is not Spanish.
- `text` is in the value's locale, so two values that are `equals()` can differ under a deep-equality assertion.
- A range written by a token pattern prints each end in its own locale.

### Decided: one of each across the organization

`@semantic-ui/utils` is a runtime dependency, for coded errors (`createErrors`), type guards, the timezone table and `each()`. Two copies of one thing drift, so a helper stays local only where sharing costs bytes: `cached` in `helpers/intl.js`, `isDevelopment` alone in `helpers/environment.js` (an import beside it stops explanations folding out, 2.2 kB), and the `Intl` duration formatting.

### Decided: `text` is a plain property

`Duration.text` is built when the duration is made and stays an own property, never a getter, so it shows in a console and in a spread. The cost is one `Intl.DurationFormat` call for each duration, measured loosely at 14 microseconds on Node, and accepted.

### Decided: a week starts where the locale starts it

`startOf('week')`, `endOf('week')`, `range('week')`, `isSame(other, 'week')` and `weekdayNames()` take the first day of the week from, in order: the argument a call passes, `configure({ weekStart })`, then the locale, which is the value's own, else the configured one, else the runtime's. The platform says which day that is: Sunday in the United States, Japan and Brazil, Saturday in Egypt and Iran, Monday in most of Europe. Where a browser cannot say, it is Monday. `configure({ weekStart: null })` goes back to following the locale.

- This changes a default: with nothing configured, a reader in the United States now gets weeks from Sunday, where every reader got Monday.
- A value's locale now moves a calculation, so `day.locale('en-US').startOf('week')` and `day.locale('de').startOf('week')` are different days. The internationalization guide still says a carried locale only affects formatting, and needs that sentence changed.
- Week numbers do not follow it. `weekOfYear` and the `W` token count ISO weeks, from Monday.

Cost: 0.07 kB.

## 2. Locale sweep

The docs will carry examples for each language, and may show a homepage section only to a reader who has picked that language. Those pages put every English-shaped corner on display, so find them first. The method that found the last two bugs is cheap: print one value in twenty locales and read the column.

- [ ] **Sweep every output path across locales**: each preset on each noun, ranges of each kind, durations in each style, `text`, and token patterns. Include a right-to-left locale, one with its own digits, and one with its own calendar.
- [x] **Token `Do` prints English.** `format('Do', 'de')` gives `17th`. This is wrong output, so fix it if `Intl` can supply the ordinal cheaply, and otherwise decide what `Do` means outside English.
- [x] **Tokens `a` and `A` always print `am` and `pm`.** The presets print the locale's own. Same call as `Do`.
- [x] **Token `dd` is the first two letters of the short weekday name**, which is right in English and arbitrary elsewhere.
- [x] **Week start follows the locale.** See the decision above.
- [x] **Loose parsing reads month names in English only.** `monthDay('17 octobre', { loose: true })` is `null`. Decide whether that is a gap or the meaning of loose.
- [x] **Calendars.** A Persian locale prints a full date in its own calendar, while `MonthDay` and `YearMonth` always print Gregorian months. That was chosen, and the example for such a language should show it on purpose.

For the examples themselves: lead with presets and options bags, where the library is strongest in every locale, before token patterns.

### Sweep results, 2026-11-14

Twenty-four locales, every output path: presets on each noun, the `L` names, month-days, year-months, ranges of each kind, durations, relative phrases, token patterns and the name tables. Presets, ranges, durations and relative phrases read correctly everywhere, since `Intl` writes them. Everything wrong was in token patterns.

Fixed, at 0.22 kB for all four:

- **Month names in a Persian locale came from the Persian calendar** while the numbers beside them were Gregorian, so November 6 printed as the 6th of Aban. Token month names and `monthNames()` are Gregorian now.
- **A month beside a day takes the form the language uses there**: `6 ноября` and `6 listopada`, where the month alone stays `ноябрь` and `listopad`. Russian, Polish, Czech, Croatian, Finnish, Greek and Catalan were checked.
- **`a` and `A` print the locale's own**: `午後`, `오후`, `م`, where they printed `pm` everywhere.
- **`Do` prints a plain number outside English**, where it printed `6th` inside German and Japanese text.

Then three pieces of our own guessing were handed to the platform, which took 0.09 kB back off:

- **A time range across midnight is one `formatRange` call.** `Intl` formats a range whose end reads earlier on the same day, so the sample range and the joiner read off it are gone, and a night shift is written exactly as a day shift is: `22:00–06:00 Uhr`, `22時00分～6時00分`.
- **`dd` took `Intl`'s narrow form** where two letters of the short name did not tell the seven days apart. Replaced by the rule under the fourth sweep below.
- **Loose reading matches month names against `Intl`'s tables** for the configured locale as well as English, so `17 octobre`, `17. Oktober` and `17 октября` read. The typed English list is gone.

A review of that work, run across every locale ICU has, then found and fixed:

- **A month took its beside-a-day form whenever the pattern had a `D` anywhere.** It takes it only straight after a day now, moment's rule, and not when text is bracketed onto it, so the stock Finnish `D. MMMM[ta]` no longer doubles its ending.
- **`Do` outside English writes what the locale writes after a day in a date**: `6.` in German, Danish, Finnish, Czech and Hungarian, `6日` in Japanese.
- **`a` and `A` keep the locale's own case** outside English.
- **Loose month names**: English is tried first, so `Mar 17` is March in a Finnish locale and not `marraskuu`. Names with combining marks read (`17 अक्टूबर`, `17 ตุลาคม`), as do `17 de octubre`, `noviembre de 2026` and shortened names like `5 mrt`.
- **A list of locales** passed as an array built a new formatter on every call.
- **A range that runs backwards needs no fallback.** An engine from before 2022 refuses one, and no browser the library runs on is that old: Safari 27 on the polyfill was checked on a phone and formats it.

A fourth pass, after asking readers of the languages and a review across every locale ICU has, cost 0.14 kB (0.09 kB of floor):

- **Greek names a month alone in the nominative.** `format('MMMM YYYY', 'el')` is `Νοέμβριος 2026`, `6 Νοεμβρίου 2026` keeps the genitive beside its day, and `monthNames('long', 'el')` is twelve nominatives. Greek is the one locale where `Intl` hands back the genitive for a month alone, so it is the one special case.
- **`dd` in core serves every widely written language with no import.** Two letters in a script with capitals, where the seven differ and the long name holds each (`Mo`, `lu`, `пн`, `Δε`, Welsh `Ll` from `Dydd Llun`), keeping a short name the locale already writes in two letters with its dot dropped (Polish `pt`, Catalan `dl`). Otherwise `Intl`'s narrow form, the letters a calendar in the language heads its columns with: `月`, `一`, `จ`, `सो`, `د`, Portuguese `S T Q Q S S D`, Turkish `P S Ç P C C P`, Indonesian `S S R K J S M`, Hungarian `H K Sz Cs P Sz V`. Where the narrow form is not the language's own, English letters in Urdu, Swahili and Pashto or digits in Azerbaijani, the short name stands whole (20 B).
- **The plugin is for the long tail, never for a common language.** A language most readers of the docs could be writing in is core's to get right, since nobody should need an import for Brazil. `@native-dates/plugins/weekdays` (0.41 kB) lays Moment's rows over `dd` for eleven less widely used languages whose narrow form is not what a reader writes: Azerbaijani, Armenian, Javanese, Khmer, Latvian, Māori, Burmese, Occitan, Pashto, Swahili, Yoruba. Its table is exported, so an app can set a row for any language, a common one included (`weekdays.tr = 'Pt Sa Ça Pe Cu Ct Pz'`).
- **The hook is general.** A plugin registers a lookup with `setNamesExtension` in `helpers/tokens.js`, and whatever it returns for a language is laid over the names read from `Intl`. Anything else `Intl` has no form for can ride it.
- **`weekdayNames('narrow')`** returns the table `dd` prints.
- **Loose month names read in the locale a call passes**: `monthDay('17 octobre', { loose: true, locale: 'fr' })`, where only `configure({ locale })` counted, which a server answering many readers cannot use.

Decided, and closed unless a reader reports otherwise:

- **A token pattern is literal.** Month and weekday names follow the locale and nothing else does: Western digits, the Gregorian year (`6 พฤศจิกายน 2026`), and ` – ` between the ends of a range. `YYYY-MM-DD` has to stay machine-readable in every locale, and a preset is the way to ask for what the locale writes.
- **A Persian reader sees two calendars.** Dates print in the Persian calendar (`۱۵ آبان ۱۴۰۵`) and a month-day or year-month prints Gregorian (`۶ نوامبر`), since a Gregorian birthday falls on a different Persian date each year. The Persian page should show it on purpose. Hebrew and Arabic locales print Gregorian dates by default.

Open, each a decision more than a bug:

- [x] **`YearMonth` short prints four digits of the year**, `11/2026`, where `11/26` read as November 26th beside a month-day and as year 26 in Japanese. It follows the locale's calendar and any calendar asked for in the tag, so Thai is `11/2569`. A card form asks for `format('MM/YY')`, which is `11/26` everywhere.
- [ ] **`dd` without a row.** Languages Moment has no table for print the narrow form with or without the plugin: Tigrinya, Somali, Hausa, Malagasy, Yiddish. A row from a native reader is one line in the plugin.
- [ ] **Loose reading cannot read back everything the library prints**: `17 באוקטובר`, `۱۷ اکتبر`, `10月17日`, `ноябрь 2026 г.`. It also takes `14 jui` as June in French, where it could as well be July.
- [ ] **A time range of nearly a day reads as an hour backwards in English**: `time('10:00').to('09:00')` prints `10:00 – 9:00 AM`.

## 3. Tests

The repo has had no tests on purpose, so nothing pinned the API while it moved. Once sections 1 and 2 are settled that reason is gone, and this is the largest piece of work left.

- [ ] Write the suite against the settled surface, through the public factories and methods only.
- [ ] Cover what was fixed by hand this month, since each was a real report: formatting a date or a time with a datetime's options, `date(datetime, zone)`, ISO strings with `Z`, loose rollover in every written shape, duration anchors, token patterns with a stray letter, a time range across midnight in a locale that is not English.
- [ ] Run the same suite on `temporal-polyfill` and on a minified bundle, the two places behaviour could differ from source.

## 4. Unverified

Everything so far ran on Node 26 with native Temporal and was bundled with esbuild.

- [ ] **Browsers.** Chrome and Firefox on native Temporal. Safari through `@native-dates/polyfill` was checked on 2026-11-14, Safari 27.2 on iOS, which has no Temporal of its own: ranges, token patterns, durations, month-days and year-months all printed correctly. The docs playground in Safari is still to check.
- [ ] **Bundlers.** One small app each on Vite, Rollup and webpack, checking the size and that nothing is dropped.
- [ ] **Types in a consumer project** under both `nodenext` and `bundler` resolution, and through the `@native-dates/core` alias. The type files re-export each other with `.js` specifiers.
- [ ] **Performance.** No benchmark is in the repo. The tachometer and bundle-size setup from `../next` is being ported, and is the standard: scratch timings in Node are a loose signal only. Measure parsing, arithmetic and formatting against Day.js once it lands.

## 5. Release mechanics

- [ ] **Versions.** All four packages say `0.0.6`. Nobody depends on the published ones, so there is nothing to migrate, but core, plugins, polyfill and the `@native-dates/core` alias need one number and matching peer ranges.
- [ ] **Docs.** The site has to say 13 kB and four plugins everywhere, and show one import for ranges, tokens and the two date nouns. The root README is written by the maintainer by hand.
- [ ] **`@see` links in the type files.** An editor shows a declaration's doc comment in autocomplete and on hover, so each public class, factory and method in `types/*.d.ts` and `packages/plugins/types/*.d.ts` gets a doc comment ending in a `@see {@link ...}` to its page on the live site, `https://nativedates.dev`, never the staging domain. None has one today. The conventions are in `../next/ai/skills/contributing/types.md`: the URL is the docs page's path (`docs/src/content/docs/api/calendar-date.md` is `https://nativedates.dev/api/calendar-date/`, with the trailing slash the site serves), a method links to its heading's anchor, and internal types are marked `@internal` and get no link. Do this after the docs pages for ranges, month-days and year-months have settled, since the links follow those paths, and check every anchor against the built page.
- [ ] **When the polyfill is needed.** Node 26 is the first Node with Temporal and `engines` says so. The install page has to say plainly which browsers need `@native-dates/polyfill`.
- [ ] **Locales on a server.** `configure({ locale })` is process-wide, which suits a browser and is a trap for a server answering many users. A value now carries its own: `datetime(row.at, zone).locale(request.locale)` sets it once, and every value made from it keeps it. The docs should teach that for servers, and `configure()` for an app with one reader.

## When the polyfill is dropped

Safari is the last browser without Temporal. Once it ships, `@native-dates/polyfill` has nothing left to do, and these go with it.

- [ ] **The polyfill in the docs playground**: the hidden import in `docs/src/lib/examples.js`, its two import map entries, and the bundling step in `docs/scripts/sync-sandbox.mjs`.
- [ ] **The epoch stand-ins for dates and times.** `epochOf()` turns a date or a time into a UTC timestamp so `Intl` can print it on any engine, and `ownOptions()` strips the parts that stand-in would leak. `Intl` takes a Temporal date or time directly and does both itself, but only where Temporal is native, since the polyfill loader does not patch `Intl`.
- [ ] **`@native-dates/polyfill` itself**, and the install page's note on which browsers need it.

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
