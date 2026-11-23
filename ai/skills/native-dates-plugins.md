---
name: native-dates-plugins
description: "Companion guide for @native-dates/plugins (zones, loose, legacy-date), @native-dates/polyfill, and authoring custom native-dates prototype plugins. Use whenever code parses localized, non-ISO, or slash/dot dates and times ('06/11/2026', '17 octobre 2026', '오후 2:30', non-ASCII digits, { loose: true, dayFirst }), resolves city names ('Berlin', 'Beijing', 'Mumbai') or locale-aware timezone abbreviations ('CST', 'IST', 'EST', 'PT', zoneAliases), shims legacy Date.prototype getters (getFullYear, getMonth, getDay), polyfills Temporal on Safari, older browsers, or Node <26, or extends native-dates class prototypes."
metadata:
  title: Plugins, Loose Parsing, Zone Aliases, and Polyfill for native-dates
  keywords: "@native-dates/plugins, @native-dates/polyfill, temporal-polyfill, zones, loose, legacy-date, dayFirst, zoneAliases, timezones, getFullYear, getTimezoneOffset, sideEffects, missingPlugin"
  audience: usage
  type: skill
---

# Plugins, Loose Parsing, Zone Aliases, and Polyfill for native-dates

> **Skill:** `native-dates-plugins`
> **Purpose:** Guide to `@native-dates/plugins/{zones,loose,legacy-date}`, `@native-dates/polyfill`, and custom prototype plugins

Each `@native-dates/plugins/*` subpath mutates `native-dates` hooks or prototypes once process-wide when imported (with no per-instance scoping or unload), and `@native-dates/polyfill` installs `temporal-polyfill` only when `globalThis.Temporal` is absent. Point factories (`datetime`, `date`, `time`, `monthDay`, `dayMonth`, `yearMonth`, `monthYear`) take `(input, zoneOrOpts?)`, `duration` takes `(input, unitOrOpts?)`, range factories (`dateRange`, `datetimeRange`, `timeRange`) take `(start, end, zoneOrOpts?)` or `(intervalString, zoneOrOpts?)` where `zoneOrOpts` is a bare `zone` string or `{ zone, locale, loose, dayFirst }`, and `now(zone?)`, `today(zone?)`, `dt.in(zone)`, and `d.at(time?, zone?)` take a bare `zone` string.

**Golden rule: Import plugin subpaths once at startup without `.use()`, pass `{ loose: true }` per call, and remember `{ loose: true }` returns `null` for unreadable data while still throwing on bad options (and `invalidRange` when `end < start`).**

---

## What You'd Get Wrong

**1. `@native-dates/plugins` has no root barrel and no `.use()` or `.extend()` method.** Importing a subpath (`import '@native-dates/plugins/loose'` or `import { timezones } from '@native-dates/plugins/zones'`) registers it realm-wide and merges its TypeScript types. Using `{ loose: true }`, `dayFirst`, or `zoneAliases` before importing its plugin throws `RangeError` (`code: 'missingPlugin'`).

```js
// ❌ WRONG - no root export and no dayjs.extend() / .use() registration
import { loose, zones } from '@native-dates/plugins';
datetime.extend(loose);

// ✅ RIGHT - subpath imports self-register once for the whole JS realm
import '@native-dates/plugins/loose';
import '@native-dates/plugins/zones';
import { datetime } from 'native-dates';

datetime('Nov 16, 2026 9:30am', { zone: 'Berlin', loose: true });
```

**2. Strict core parsing always runs first; `{ loose: true }` is per-call only, follows the active locale's numeric order (`dayFirst` is an override), and still throws on bad caller options.** `configure({ loose: true })` throws `unknownSetting`, and `configure({ dayFirst: true })` only affects calls that also pass `{ loose: true }` (pass `dayFirst: null` to follow the locale again). Loose mode reads localized month names, AM/PM words, and day-month order from `Intl`, folds digits of any script (`'١٦‏/١١‏/٢٠٢٦'`, fullwidth), and skips connecting words/ordinals/leading weekdays across `date()`, `datetime()`, `time()`, `yearMonth()`, and `monthDay()` (`monthDay`/`dayMonth` keep numeric order from their name). Under `{ loose: true }`, unreadable inputs, rolled-forward `'Feb 30, 2026'`, 2-digit years beside month names, hours `> 12` beside PM, bare clocks passed to `datetime()`, unknown uppercase zone codes (`'14:30 XYZ'`), and bare `'14h'` return `null` (`T | null`, never *now*), whereas bad options (`zone: 'Mars/Olympus'`, `locale: '123'`) and reversed `DateRange`/`DateTimeRange` bounds (`end < start`, `invalidRange`) still throw.

```js
// ❌ WRONG - omitting { loose: true } after configure({ dayFirst: true }), or assuming bare '14h' parses as time
configure({ dayFirst: true });
date('16/11/2026'); // RangeError [invalidDate] — { loose: true } was omitted!
time('14h', { loose: true }); // null — bare '14h' stays a duration

// ✅ RIGHT - pass { loose: true } per call; locale drives numeric order, month names, AM/PM, and digits
configure({ dayFirst: null });
date('06/11/2026', { loose: true, locale: 'fr' }); // CalendarDate(2026-11-06)
date('17 octobre 2026', { loose: true, locale: 'fr' }); // CalendarDate(2026-10-17)
time('오후 2:30', { loose: true, locale: 'ko' }); // Time(14:30:00)
date(undefined, { loose: true }); // null (never defaults to today/now)
```

**3. `@native-dates/plugins/zones` resolves `zone` parameters, `[Zone]` suffixes, AND zone abbreviations after a clock inside `loose` strings, with shipped major cities and locale-read shared abbreviations.** With `zones` loaded, `'EST'`/`'MST'`/`'HST'` map to DST-observing `'America/New_York'`/`'America/Denver'`/`'Pacific/Honolulu'` (pass `'-05:00'` for a fixed offset), 76 non-IANA cities (`'Beijing'`, `'Mumbai'`, `'Osaka'`, `'San Francisco'`, `'Munich'`, `'Москва'`, `'東京'`, `'서울'`, `'北京'`) and 16 regional codes (`'MSK'`, `'ART'`, `'COT'`, `'CLT'`, `'WIB'`, `'PHT'`, `'ICT'`, `'GST'`, `'SAST'`, `'EAT'`, `'WAT'`, `'HNE'`/`'HAE'`) resolve out of the box, and shared names (`'CST'`, `'IST'`, `'PST'`, `'BST'`, `'AST'`, `'ACT'`, `'AMT'`, `'San Juan'`) follow the active locale's region (`'CST'` is `'Asia/Shanghai'` in `'zh-CN'`, `'America/Chicago'` in `'en-US'`). Inside loose text (`'2026-11-16 14:30 CST'` with `locale: 'zh-CN'`), the zone abbreviation after the clock resolves through the same rules.

**4. `legacy-date` attaches only to `DateTime.prototype`, evaluates local `Date` getters in `dt.zone` (not the host OS timezone), and throws `immutable` on setters.** `CalendarDate` and `Time` get no `Date` methods. On `DateTime`, `dt.getHours()` and `dt.getDay()` (`0`–`6`) read in `dt.zone` even on a UTC server, `dt.getMonth()` returns `0`–`11` (`dt.month` stays `1`–`12`), and all `set*`/`setUTC*` mutators throw `RangeError` (`code: 'immutable'`).

```js
import '@native-dates/plugins/legacy-date';
import { datetime } from 'native-dates';

const tokyo = datetime('2026-11-16T00:30:00Z', 'Asia/Tokyo');
tokyo.getHours(); // 9 (09:30 in Tokyo, regardless of server OS timezone)
tokyo.getMonth(); // 10 (0-indexed; tokyo.month is 11)
tokyo.setHours(12); // RangeError [immutable] — use tokyo.set('hour', 12)
```

**5. Node `<26` (Node 20/22/24 LTS) and Safari require both `@native-dates/polyfill` AND `"temporal-polyfill": ">=0.3.0"` in your app's `dependencies`.** Bundlers statically resolve `import('temporal-polyfill')`, so omitting `"temporal-polyfill"` from `package.json` breaks builds even when targeting Chrome. Use `'@native-dates/polyfill/sync'` in CommonJS, build targets without top-level `await`, or when sibling static imports call `today()`/`now()` at module top level.

---

## @native-dates/plugins/zones

Named `import { timezones } from '@native-dates/plugins/zones'` registers the plugin automatically without a second bare import:

```js
import { timezones } from '@native-dates/plugins/zones';
import { configure, datetime } from 'native-dates';

timezones.IST = 'Asia/Jerusalem'; // override default 'Asia/Kolkata'
configure({ zoneAliases: { hq: 'Berlin', sf: 'America/Los_Angeles' } }); // merges & eagerly resolves targets!

datetime('2026-11-16T09:30', 'HQ').zone; // 'Europe/Berlin' (case/space/underscore/accent-insensitive)
datetime('2026-11-16T09:30', 'são_paulo').zone; // 'America/Sao_Paulo'
```

| Precedence (1 = highest) | Exhaustive set / lookup source | Override / behavior |
|---|---|---|
| 1. `configure({ zoneAliases })` | App-defined `{ hq: 'Berlin', sf: 'America/Los_Angeles' }` | Merges across calls and runs after `locale` and before `zone` in `configure({ locale, zoneAliases, zone })`; validates targets eagerly (`unknownZone` if invalid); `{ hq: null }` deletes one key, `zoneAliases: null` clears all |
| 2. Exported `timezones` (all 20 keys) | `ET`, `CT`, `MT`, `PT`, `AKT`, `HT`, `AT`, `UK`, `WET`, `CET`, `ECT`, `EET`, `IRST` (`Asia/Tehran`), `AET`, `AWT`, `NZT`, `BRT`, `INST`, `JST`, `SGT` | Mutable map; assigning `timezones.IST = 'Asia/Jerusalem'` pins one reading across every locale |
| 3. Built-in & locale-read abbreviations | Fixed: `EST`/`EDT`/`Eastern`, `CDT`/`Central`, `MST`/`MDT`/`Mountain`, `PDT`/`Pacific`, `AKST`/`AKDT`/`Alaska`, `HST`/`Hawaii`, `HNE`/`HAE`, `ART`, `COT`, `CLT`, `FNT`, `CEST`, `MSK`/`мск`, `WAT`, `EAT`, `SAST`, `GST`, `PKT`, `ICT`, `WIB`, `PHT`, `JST`, `KST`, `AEST`/`AEDT`, `NZST`/`NZDT`, `SGT`, `HKT`, `GMT`, `Z`. Locale-read (default first): `CST` (Chicago / `zh-CN` Shanghai / `zh-TW` Taipei / `es-CU` Havana), `IST` (Kolkata / `en-IE` Dublin / `he` Jerusalem), `PST` (LA / `fil`/`en-PH` Manila), `BST` (London / `bn` Dhaka), `AST` (Halifax / `ar-SA` Riyadh), `ACT` (Adelaide / `pt-BR` Rio Branco), `AMT` (Manaus / `hy` Yerevan) | Maps to DST-observing IANA zones (`GMT` & `Z` -> `'UTC'`); locale-read entries check the value's locale, `{ locale }`, `configure({ locale })`, or runtime default; override via `zoneAliases` or `timezones` |
| 4. IANA IDs, shipped cities & tzdb links | Any `Intl.supportedValuesOf('timeZone')` ID/leaf, `<Region>/<City>` tzdb link, plus 76 shipped city aliases (`Beijing`/`北京`, `Osaka`/`東京`, `Busan`/`서울`, `Mumbai`/`New Delhi`, `Brasília`/`Rio de Janeiro`, `Munich`, `Geneva`, `NYC`, `San Francisco`, `Makkah`, `Москва`, locale-read `San Juan`) | Case-, accent-, space-, hyphen-, and underscore-insensitive |

---

## @native-dates/plugins/loose

Every factory tries its strict core parser first (`'2026/11/06'`, `'2026年11月16日'`, `'14h30'`, `'5:30 PM'`, and `'2h 30m'` already succeed in core, so `dayFirst` never disturbs 4-digit year-first strings). When strict parsing fails and `{ loose: true }` is set (`T | null` in TypeScript):

- **`datetime()` and `date()` pipeline:**
  1. **Normalize & zone abbreviation:** NFKC-folds fullwidth characters, strips Unicode direction marks, folds non-ASCII decimal digits (`٠-٩`, `۰-۹`, `०-९`), and extracts a zone abbreviation after the clock (`'14:30 CST'`, `'14:30 мск'`), resolving it through `zoneId(name, locale)` (unknown uppercase codes like `'14:30 XYZ'` reject to `null`).
  2. **Engine `Date.parse` + locale parser:** English month names and machine formats (RFC 2822, asctime, numeric dates reordered by locale or `dayFirst`—including year-first 2-digit years in `'ko'`) go through `Date.parse` with a day-28 rollover check (`'Feb 30, 2026'` -> `null`). Non-English month names, localized AM/PM words, and connecting words/ordinals/weekdays are read directly from `Intl` in the active locale (`{ locale }` -> `configure({ locale })` -> runtime default).
  3. **Zone & instant placement:** Unzoned strings keep their written wall clock in `zone`. Strings with `Z`, numeric offsets, or a resolved inline zone abbreviation fix that instant and convert to `zone`.
- **`time()`:** Core reads `'14h30'` and `'5:30 PM'`; `{ loose: true }` also reads localized AM/PM clocks (`time('오후 2:30', { loose: true, locale: 'ko' })` -> `14:30:00`) and extracts `.toPlainTime()` from full date-time strings, returning `null` when unreadable.
- **`monthDay()`, `dayMonth()`, `yearMonth()`, `monthYear()`:** Matches English month names first (`'Mar 17'` stays March under `'fi'`), then localized `Intl` month names with connecting words and ordinals (`'1er mai'`, `'16 del agosto'`, `'ноябрь 2026 г.'`). Numeric pairs in `monthDay()` and `dayMonth()` always use the order in their name rather than the locale's order (`monthDay('7 / 9', { loose: true, locale: 'fr' })` -> `'07-09'`).
- **`duration()`:** Core parses `'2h 30m'` and `'90 mins'`; `{ loose: true }` returns `null` on unreadable text, `unknownUnit` (`'5 lightyears'`), `conflictingSigns`, `invalidFraction`, or `NaN`.
- **`dateRange()`, `datetimeRange()`, `timeRange()`:** Forwards `{ loose: true, dayFirst, zone, locale }` to both endpoints and returns `null` if either endpoint is unreadable; valid endpoints with `end < start` on `DateRange`/`DateTimeRange` still throw `invalidRange`.

---

## @native-dates/plugins/legacy-date

Shims `Date.prototype` onto `DateTime.prototype` (`valueOf()` / `+dt` and `toJSDate()` are already in core):

- **22 shimmed reads:** Zone-local `get{FullYear,Month,Date,Day,Hours,Minutes,Seconds,Milliseconds}()` and `getTimezoneOffset()` (positive west of UTC in `this.zone`); UTC `getTime()` and `getUTC*()` (8 methods); `toISOString()` (fixed `.sssZ`); and `toLocale{,Date,Time}String(locales?, opts?)` (defaulting to `this.locale()` and `this.zone`).
- **Omitted / blocked:** `toDateString()` and `toUTCString()` are not shimmed (`dt.toJSDate().toUTCString()`); all 15 `set*`/`setUTC*` methods throw `RangeError` (`code: 'immutable'`).

---

## @native-dates/polyfill

`native-dates` reads `globalThis.Temporal` lazily at call time (`"temporal-polyfill": ">=0.3.0"` required in `dependencies`):

| Entrypoint | Mechanism | When to use |
|---|---|---|
| `import '@native-dates/polyfill'` | `if (!globalThis.Temporal) await import('temporal-polyfill')` | ESM browser entrypoints (0 B downloaded on Chrome/Firefox/Edge; dynamic chunk on Safari) & async ESM on Node `<26` |
| `import '@native-dates/polyfill/sync'` | Sync `import { Temporal } from 'temporal-polyfill'` + `if (!globalThis.Temporal)` | CommonJS, test setups, targets without top-level `await`, or when sibling static imports call `today()`/`now()` during module evaluation |

---

## Authoring Custom Plugins

Parser and zone hooks (`native-dates/helpers/*`) are private to `@native-dates/plugins` without semver guarantees. Third-party plugins extend the 9 exported class prototypes (`DateTime`, `CalendarDate`, `Time`, `Duration`, `MonthDay`, `YearMonth`, `DateRange`, `DateTimeRange`, `TimeRange`):

- **Cross-realm identity:** `kindOf(v)` returns `'datetime' | 'date' | 'time' | 'duration' | 'monthDay' | 'yearMonth' | 'dateRange' | 'datetimeRange' | 'timeRange' | undefined`. Exported predicates are `isDateTime`, `isCalendarDate`, `isTime`, `isDuration`, `isMonthDay`, `isYearMonth`, `isDateRange`, `isDateTimeRange`, and `isTimeRange` (there is no `isRange` function — use `Boolean(v?.[IS_RANGE])`). All 10 `IS_*` exports (`IS_DATE_TIME`, `IS_CALENDAR_DATE`, `IS_TIME`, `IS_DURATION`, `IS_MONTH_DAY`, `IS_YEAR_MONTH`, `IS_RANGE`, `IS_DATE_RANGE`, `IS_DATE_TIME_RANGE`, `IS_TIME_RANGE`) are `Symbol.for` **property keys**, never callable functions.
- **Immutability & packaging:** Instances are frozen (`this.date`, `this.time`, `this.zone` are getters; `this.locale()` is a 0-arg getter / 1-arg clone method). Return new instances, list entry files in `"sideEffects": ["./index.js"]`, and put `"native-dates"` in `"peerDependencies"`.

```ts
// my-business-days-plugin/index.ts
import { CalendarDate, DateTime, IS_CALENDAR_DATE, kindOf } from 'native-dates';

declare module 'native-dates' {
  interface CalendarDate {
    nextBusinessDay(): CalendarDate;
  }
  interface DateTime {
    nextBusinessDay(): DateTime;
  }
}

CalendarDate.prototype.nextBusinessDay = function nextBusinessDay() {
  const step = this.dayOfWeek === 5 ? 3 : this.dayOfWeek === 6 ? 2 : 1;
  return this.plus(step, 'days');
};

DateTime.prototype.nextBusinessDay = function nextBusinessDay() {
  return this.date.nextBusinessDay().at(this.time, this.zone).locale(this.locale());
};

export const isSupportedPoint = (v: unknown) => Boolean((v as any)?.[IS_CALENDAR_DATE]) || kindOf(v) === 'datetime';
```

---

## Quick Reference

| Cross-plugin / boundary scenario | What happens | Recommended pattern |
|---|---|---|
| Untrusted `rawStart`, `rawEnd`, and `rawZone` in `dateRange` | `loose` turns bad strings into `null`, while bad `rawZone` throws `unknownZone` and `end < start` throws `invalidRange` | Catch `err?.code === 'unknownZone' \|\| err?.code === 'invalidRange'` |
| Sibling `import './config.js'` calls `today()` at top level on Node 22 / Safari | Static sibling imports evaluate before default polyfill's top-level `await` settles | Import `'@native-dates/polyfill/sync'` first at entrypoint |
| Single-call `configure({ zoneAliases: { hq: 'Berlin' }, zone: 'hq' })` | `zoneAliases` merges and resolves before `zone` is set | Safe in one `configure()` call; `{ hq: null }` deletes one alias |

```js
import '@native-dates/polyfill/sync';
import { timezones } from '@native-dates/plugins/zones';
import '@native-dates/plugins/loose';
import { configure, dateRange } from 'native-dates';

timezones.IST = 'Asia/Jerusalem';
configure({ dayFirst: true, zoneAliases: { hq: 'Berlin' }, zone: 'hq' });

export function parseCsvWindow(rawStart, rawEnd, rawZone) {
  try {
    return dateRange(rawStart, rawEnd, { zone: rawZone, loose: true }); // DateRange | null
  } catch (err) {
    if (err?.code === 'unknownZone' || err?.code === 'invalidRange') { return null; }
    throw err;
  }
}
```

**Golden rule: Import plugin subpaths once at startup without `.use()`, pass `{ loose: true }` per call, and remember `{ loose: true }` returns `null` for unreadable data while still throwing on bad options (and `invalidRange` when `end < start`).**

---

## Related Skills

| Skill | Use when... |
|---|---|
| `native-dates` | Core classes (`DateTime`, `CalendarDate`, `Time`, `Duration`, `MonthDay`, `YearMonth`, ranges), DST-safe arithmetic, `round()`, `format()` presets and tokens, `.locale()`, `weekStart`, `compare()`, and error codes |
