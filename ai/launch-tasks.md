# 1.0 Launch Tasks

What is left before `native-dates` tags 1.0, written 2026-11-14 after ranges, token patterns, `MonthDay` and `YearMonth` moved into core. Work the sections in order: sections 1 and 2 decide the surface and what it prints, and everything after them tests, documents or measures the result.

Sizes on 2026-11-16 (`npm run size`, Brotli): 14.21 kB for all of `native-dates`, 12.71 kB for `import { now }`, 15.66 kB with the three plugins (`zones`, `loose`, `legacy-date`) on top.

## How to decide

Three rules the maintainer set while this list was drawn up. They outrank habit.

- **The golden rule.** Ask what you would want if someone shipped this library into your project, as a developer tired on a Tuesday afternoon. Not what Temporal does, and not what the docs say.
- **A second spelling is welcome** when it costs next to nothing and is not ambiguous (`monthDay` and `dayMonth`, `zz` beside `z`).
- **A guard has to earn its bytes.** Fix what prints a wrong answer. A rare input that already fails loudly can stay as it is.

## 1. Decisions that 1.0 makes permanent

- [ ] **`native-dates/helpers/*` is a public entry.** The exports map serves every file in `src/helpers/` because the plugins import from it. Either say in writing that the path is unstable, or narrow it to what the three plugins use (`environment`, `errors`, `utils`, `zones`).
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

### Decided: zero dependencies, by forking word for word

`native-dates` installs nothing. Taking `@semantic-ui/utils` as a dependency was tried for a day and reversed: "zero dependencies" is worth more to someone choosing a date library than one copy of each helper across the organization.

- What the library used from it is forked into `src/helpers/utils.js`, under the same names: the type guards, `each()`, and the coded errors (`createErrors`, `error`, `throwError`). The timezone table is forked into the zones plugin.
- The text is identical to utils 0.18.0, branches this library never reaches included, and the comments too. An app that ships another Semantic UI package compresses the second copy away, a refusal behaves exactly as one does anywhere in the organization, and a fix upstream is a paste. Do not restyle it, trim it or rewrite it in this repo's voice. `dprint` skips the file.
- An edit to `timezones` in the zones plugin no longer reaches the table utils formats dates with.
- Bytes did not move: 13.93 kB before and after.

### Decided: `text` is a plain property

`Duration.text` is built when the duration is made and stays an own property, never a getter, so it shows in a console and in a spread. The cost is one `Intl.DurationFormat` call for each duration, measured loosely at 14 microseconds on Node, and accepted.

### Decided: a week starts where the locale starts it

`startOf('week')`, `endOf('week')`, `range('week')`, `isSame(other, 'week')` and `weekdayNames()` take the first day of the week from, in order: the argument a call passes, `configure({ weekStart })`, then the locale, which is the value's own, else the configured one, else the runtime's. The platform says which day that is: Sunday in the United States, Japan and Brazil, Saturday in Egypt and Iran, Monday in most of Europe. Where a browser cannot say, it is Monday. `configure({ weekStart: null })` goes back to following the locale.

- This changes a default: with nothing configured, a reader in the United States now gets weeks from Sunday, where every reader got Monday.
- A value's locale now moves a calculation, so `day.locale('en-US').startOf('week')` and `day.locale('de').startOf('week')` are different days. The internationalization guide still says a carried locale only affects formatting, and needs that sentence changed.
- Week numbers do not follow it. `weekOfYear` and the `W` token count ISO weeks, from Monday.

Cost: 0.07 kB.

### Decided: answer where the answer is always true

A refusal is right when there are two readings. Where there is one, the library answers. Six refusals were found by asking which error messages could have been a conversion. Four now answer, and review showed the other two have a second reading, so they still refuse:

- **A date that opens on its year reads however it was typed**: `date('2026/11/06')`, `'2026.11.06'`, `'2026-1-5'`, `datetime('2026/11/06 9:00')`, and through them `yearMonth('2026/11/16')` and `monthDay('2026/11/16')`. A four-digit year first has one reading. `'11/06/2026'` still refuses, since it has two, and so does a date with two different marks, `'2026/1.5'`. A range in one string takes them too, `dateRange('2026/11/06 - 2026/11/10')`. 0.08 kB, all of it floor.
- **A bare number standing first is epoch milliseconds**: `compare(Date.now(), deadline)`, `earliest(a, b)`, a list of timestamps sorted by `compare`. Beside a time it is still an hour, `compare(time('09:00'), 9)`, and beside a date it still refuses. A fraction of a millisecond is dropped, as `Date` drops it. 0.03 kB, none of it floor.
- **A subtraction that leaves two signs borrows where a calendar says how**: `years(1).minus(months(1))` is 11 months and `weeks(1).minus(days(1))` is 6 days, since a year is always twelve months and a week always seven days. Only the pair that disagrees is broken down, and every other field stays as written. A bare `balance()` carries months into years the same way, `months(18).balance()`. 0.12 kB, 0.11 kB of it floor.
- **A locale spelled with an underscore reads**: `'en_US'` is `en-US`, how a server, a database or Java writes it. A value keeps the tag as read, so `locale()` hands back `en-US`, and an empty tag clears it, so `locale(user.locale)` works on an empty column. About 0.07 kB, 0.05 kB of it floor.
- **An `Accept-Language` header is the loose plugin's to read.** It went into core first and grew into a small header parser with weights, which is a server's concern and not a date's, so it moved beside the other things `loose` reads leniently: 0.10 kB there, nothing in core. With the plugin imported a header reads by weight wherever a locale is taken. Without it a header refuses, and the message names the plugin.

Still refusing, each with two readings:

- **`days(1).minus(hours(1))`.** A day is a calendar day here and not 24 hours. Across a clock change, `plus(days(1).minus(hours(1)))` and `plus(days(1)).minus(hours(1))` land an hour apart, so there is no one answer, and the refusal already says to chain.
- **`compare(date, datetime)`.** By the day, a date ties with every moment on it and a mixed list cannot be sorted. As midnight, it disagrees with `isBefore()`. The refusal names both conversions.

Cost: 0.28 kB, 0.25 kB of it floor. Not taken, from the same list: zone spellings like `'UTC+2'`, `time('0930')`, `duration('1:30:00')`, `dateRange(datetimeRange)`.

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

A fourth pass, after asking readers of the languages and a review across every locale ICU has, cost 0.36 kB (0.24 kB of floor), more than half of it the door below:

- **Greek names a month alone in the nominative.** `format('MMMM YYYY', 'el')` is `Νοέμβριος 2026`, `6 Νοεμβρίου 2026` keeps the genitive beside its day, and `monthNames('long', 'el')` is twelve nominatives. Greek is the one locale where `Intl` hands back the genitive for a month alone, so it is the one special case.
- **`dd` in core serves every widely written language with no import.** Two letters in a script with capitals, where the seven differ and the long name holds each (`Mo`, `lu`, `пн`, `Δε`, Welsh `Ll` from `Dydd Llun`), keeping a short name the locale already writes in two letters with its dot dropped (Polish `pt`, Catalan `dl`). Otherwise `Intl`'s narrow form, the letters a calendar in the language heads its columns with: `月`, `一`, `จ`, `सो`, `د`, Portuguese `S T Q Q S S D`, Turkish `P S Ç P C C P`, Indonesian `S S R K J S M`, Hungarian `H K Sz Cs P Sz V`. Where the narrow form is not the language's own, English letters in Urdu, Swahili and Pashto or digits in Azerbaijani, the short name stands whole (20 B).
- **`weekdayNames('narrow')`** returns the table `dd` prints.
- **Loose month names read in the locale a call passes**: `monthDay('17 octobre', { loose: true, locale: 'fr' })`, where only `configure({ locale })` counted, which a server answering many readers cannot use.

### Decided: what `Intl` has not settled is the app's to write

`dd` and `Do` are the only two tokens `Intl` has no field for. Core prints the best it can read off the platform and does not carry tables or per-language rules of its own: if `Intl` prints `1 novembre` for French, a French `1er` is not ours to hard-code and charge every reader for. The app writes it, in `configure()`, under plain nouns:

```js
configure({
  weekdays: { lv: { narrow: { fri: 'Pk', sun: 'Sv' } } },
  ordinals: { fr: (day) => (day === 1 ? '1er' : day) },
});
```

- Weekdays are keyed by language, then width (`narrow` is `dd`, `short` is `ddd`, `long` is `dddd`), then day name. Day names and not positions, since Moment's tables start on Sunday and ours on Monday, and a row off by one shifts every weekday in an app.
- A regional tag reads its language's entry with its own laid over it, tags match in any case (`pt-br`, as Moment spells it), and `null` goes back to the platform.
- A width left out or misspelled, or a day that is not one, refuses at `configure()` and not at the first format.
- It replaced a `weekdays` plugin that held Moment's rows for ten less widely used languages. Applied evenly, the test that took Portuguese out of it (single letters that repeat are what that language's calendars print) took out all but two rows, and a fourth plugin named `weekdays` made a reader wonder whether weekdays need a plugin.
- Months are not in it. `Intl` has every month name, so that would be taste, and it can be added without breaking anyone.

Cost: 0.22 kB, 0.15 kB of it floor.

Decided, and closed unless a reader reports otherwise:

- **A token pattern is literal.** Month and weekday names follow the locale and nothing else does: Western digits, the Gregorian year (`6 พฤศจิกายน 2026`), and ` – ` between the ends of a range. `YYYY-MM-DD` has to stay machine-readable in every locale, and a preset is the way to ask for what the locale writes.
- **A Persian reader sees two calendars.** Dates print in the Persian calendar (`۱۵ آبان ۱۴۰۵`) and a month-day or year-month prints Gregorian (`۶ نوامبر`), since a Gregorian birthday falls on a different Persian date each year. The Persian page should show it on purpose. Hebrew and Arabic locales print Gregorian dates by default.

Open, each a decision more than a bug:

- [x] **`YearMonth` short prints four digits of the year**, `11/2026`, where `11/26` read as November 26th beside a month-day and as year 26 in Japanese. It follows the locale's calendar and any calendar asked for in the tag, so Thai is `11/2569`. A card form asks for `format('MM/YY')`, which is `11/26` everywhere.
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
- [ ] **Docs.** The site has to say 13 kB and three plugins everywhere, and show one import for ranges, tokens and the two date nouns. The root README is written by the maintainer by hand.
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
