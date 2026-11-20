---
title: Plugins, Loose Parsing, Zone Aliases, and Polyfill for native-dates
description: "Companion guide for @native-dates/plugins (zones, loose, legacy-date), @native-dates/polyfill, and authoring custom native-dates prototype plugins. Use whenever code parses non-ISO or slash/dot dates ('11/06/2026', '16.11.2026', 'Oct 17, 2026', { loose: true, dayFirst }), resolves IANA city names ('Berlin', 'Los Angeles') or timezone abbreviations ('EST', 'PT', 'CET', zoneAliases), shims legacy Date.prototype getters (getFullYear, getMonth, getDay), polyfills Temporal on Safari, older browsers, or Node <26, or extends native-dates class prototypes."
keywords: ["@native-dates/plugins", "@native-dates/polyfill", "temporal-polyfill", zones, loose, legacy-date, dayFirst, zoneAliases, timezones, getFullYear, getTimezoneOffset, sideEffects, missingPlugin]
audience: usage
skill: native-dates-plugins
type: skill
---

# Plugins, Loose Parsing, Zone Aliases, and Polyfill for native-dates

> **Skill:** `native-dates-plugins`
> **Purpose:** Guide to `@native-dates/plugins/{zones,loose,legacy-date}`, `@native-dates/polyfill`, and custom prototype plugins

Each `@native-dates/plugins/*` subpath mutates `native-dates` hooks or prototypes once process-wide when imported (with no per-instance scoping or unload), and `@native-dates/polyfill` installs `temporal-polyfill` only when `globalThis.Temporal` is absent.

**Golden rule: Import plugin subpaths once at startup without `.use()`, pass `{ loose: true }` per call, and treat `{ loose: true }` as returning `null` for unreadable data while still throwing on bad options.**

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

**2. Strict core parsing always runs first; `{ loose: true }` is per-call only, defaults `'06/11/2026'` to US month-first (`June 11`), and still throws on bad caller options.** `configure({ loose: true })` throws `unknownSetting`, and `configure({ dayFirst: true })` only affects calls that also pass `{ loose: true }`. Under `{ loose: true }`, `null`, `undefined`, `""`, `NaN`, `'16/11/2026'` (without `dayFirst`), rolled-forward `'Feb 30, 2026'`, and non-English month names in `date()`/`datetime()` all return `null` (`T | null` in TypeScript, never *now*), whereas bad options (`zone: 'Mars/Olympus'`, `locale: '123'`) still throw `unknownZone` or `unknownLocale`.

```js
// ❌ WRONG - omitting { loose: true } after configure({ dayFirst: true }), or assuming French date() works
configure({ dayFirst: true });
date('16/11/2026'); // RangeError [invalidDate] — { loose: true } was omitted!
date('17 octobre 2026', { loose: true, locale: 'fr' }); // null — date()/datetime() month names are English-only

// ✅ RIGHT - pass { loose: true } per call; slash, dot, and hyphen numeric strings honor dayFirst
date('16.11.2026', { loose: true }); // CalendarDate(2026-11-16) because dayFirst is configured
date(undefined, { loose: true }); // null (never defaults to today/now)
monthDay('17 octobre', { loose: true, locale: 'fr' }); // MonthDay(10-17) — partials DO match Intl locales
```

**3. `@native-dates/plugins/zones` maps `'EST'`/`'MST'`/`'HST'` to DST-observing zones and resolves IANA leaf cities, NOT arbitrary world cities.** Without `zones`, `Temporal` treats `'EST'` as fixed `-05:00`; with `zones`, `'EST'`/`'EDT'`/`'ET'` map to `'America/New_York'` (pass `'-05:00'` for a fixed offset). City lookup indexes `Intl.supportedValuesOf('timeZone')` leaf names and tzdb links, so `'Berlin'`, `'Los Angeles'`, and `'Ho Chi Minh'` resolve, while non-IANA cities like `'San Francisco'`, `'Munich'`, or `'Mumbai'` throw `unknownZone` unless mapped via `configure({ zoneAliases })`.

**4. `legacy-date` attaches only to `DateTime.prototype`, evaluates local `Date` getters in `dt.zone` (not the host OS timezone), and throws `immutable` on setters.** `CalendarDate` and `Time` get no `Date` methods. On `DateTime`, `dt.getHours()` and `dt.getDay()` (`0`–`6`) read in `dt.zone` even on a UTC server, `dt.getMonth()` returns `0`–`11` (`dt.month` stays `1`–`12`), and all `set*`/`setUTC*` mutators throw `RangeError` (`code: 'immutable'`).

```js
import '@native-dates/plugins/legacy-date';
import { datetime } from 'native-dates';

const tokyo = datetime('2026-11-16T00:30:00Z', 'Asia/Tokyo');
tokyo.getHours(); // 9 (09:30 in Tokyo, regardless of server OS timezone)
tokyo.getMonth(); // 10 (0-indexed; tokyo.month is 11)
tokyo.setHours(12); // RangeError [immutable] — use tokyo.set('hour', 12)
```

**5. Node `<26` (Node 20/22/24 LTS) and Safari require both `@native-dates/polyfill` AND `"temporal-polyfill": ">=0.3.0"` in your app's `dependencies`.** Bundlers statically resolve `import('temporal-polyfill')`, so omitting `"temporal-polyfill"` from `package.json` breaks builds even when targeting Chrome. Use `'@native-dates/polyfill/sync'` in CommonJS or build targets without top-level `await`.

---

## @native-dates/plugins/zones

Resolves IANA leaf cities, tzdb links, timezone abbreviations, and custom `zoneAliases` anywhere a `zone` parameter or `[Zone]` suffix is accepted (`datetime`, `date`, `time`, `now`, `today`, `in`, `at`, `configure`). Named `import { timezones } from '@native-dates/plugins/zones'` registers the plugin automatically without a second bare import.

```js
import { timezones } from '@native-dates/plugins/zones';
import { configure, datetime } from 'native-dates';

timezones.IST = 'Asia/Jerusalem'; // override default 'Asia/Kolkata'
configure({ zoneAliases: { hq: 'Berlin', sf: 'America/Los_Angeles' } }); // merges & eagerly resolves targets!

datetime('2026-11-16T09:30', 'HQ').zone; // 'Europe/Berlin' (case/space/underscore/accent-insensitive)
datetime('2026-11-16T09:30', 'são_paulo').zone; // 'America/Sao_Paulo'
```

| Precedence (1 = highest) | Source & examples | Override / behavior |
|---|---|---|
| 1. `configure({ zoneAliases })` | `{ hq: 'Berlin', sf: 'America/Los_Angeles' }` | Merges across calls; validates/resolves targets eagerly (`unknownZone` if invalid); `{ hq: null }` deletes one key, `zoneAliases: null` clears all |
| 2. Exported `timezones` object | `ET`, `CT`, `MT`, `PT`, `AKT`, `HT`, `AT`, `UK`, `WET`, `CET`, `ECT`, `EET`, `IRST`, `AET`, `ACT`, `AWT`, `NZT`, `BRT`, `IST` (`Asia/Kolkata`), `INST`, `JST`, `SGT` | Mutable map for ambiguous regional codes (`timezones.IST = '...'`) |
| 3. Built-in abbreviations | `EST`/`EDT`/`Eastern`, `CST`/`CDT`/`Central`, `MST`/`MDT`/`Mountain`, `PST`/`PDT`/`Pacific`, `AKST`/`AKDT`/`Alaska`, `HST`/`Hawaii`, `BST`, `CEST`, `KST`, `AEST`/`AEDT`, `NZST`/`NZDT`, `HKT`, `GMT`, `Z` | Maps to DST-observing IANA zones (`GMT` & `Z` -> `'UTC'`); override via `zoneAliases` |
| 4. IANA IDs, leaf cities & tzdb links | `'los angeles'`, `'buenos aires'`, `'ho chi minh'`, `'europe/paris'` | Case/accent/separator-insensitive against `Intl.supportedValuesOf('timeZone')` and `Temporal` `<Region>/<City>` links |

---

## @native-dates/plugins/loose

When strict core parsing fails and `{ loose: true }` is passed, factories fall back as follows (`T | null` in TypeScript):

- **`datetime()` and `date()` (`Date.parse` fallback):**
  - Accepts English month names (`'Oct 17, 2026'`) and numeric slash/dot/hyphen dates (`'11/06/2026'`, `'06.11.2026'`, `'06-11-2026'`, 2-digit years `'11/06/26'` -> `2026`). Without `dayFirst: true`, `'16/11/2026'` returns `null` (never auto-flips `16 > 12`).
  - Catches `Date.parse` calendar rollovers (`'Feb 30, 2026'`, `'11/31/2026'` -> `null`), as well as `null`, `undefined`, `""`, `NaN`, `{}` (`-> null`).
  - **Zone handling:** Unzoned strings keep their written wall clock in `zone` (defaulting to `configure({ zone })` or system local IANA zone). Inline zone tokens inside strings rely strictly on native `Date.parse` (`Z`, numeric `+02:00`, `GMT`/`UTC`, US `EST`/`EDT`/`CST`/`CDT`/`MST`/`MDT`/`PST`/`PDT`) to fix the instant and convert to `zone` — inline tokens do **not** consult `zones` plugin `timezones` or `zoneAliases` (`'Nov 16, 2026 9am IST'` or `'... HQ'`; pass `{ zone: 'IST' }` as an option instead).
- **`time()`:** Extracts `.toPlainTime()` from any loose date-time string (`time('Nov 16, 2026 5:30 PM', { loose: true })` -> `17:30:00`), or returns `null`.
- **`monthDay()`, `dayMonth()`, `yearMonth()`, `monthYear()`:** Matches English month names first (`'Mar 17'` stays March under `'fi'`), then localized `Intl` month names in `{ locale }` or `configure({ locale })`. Two-digit ISO `'10-17'` with a hyphen stays month-first even in `dayMonth('10-17')`, whereas `'17/10'` reads day-first.
- **`duration()`:** Core already parses `'2h 30m'` and `'90 mins'`; `{ loose: true }` returns `null` on unreadable text, `unknownUnit` (`'5 lightyears'`), `conflictingSigns`, `invalidFraction`, or `NaN`.
- **`dateRange()`, `datetimeRange()`, `timeRange()`:** Forwards `{ loose: true, dayFirst, zone, locale }` to both endpoints and returns `null` if either endpoint is unreadable; valid endpoints with `end < start` on `DateRange`/`DateTimeRange` still throw `invalidRange`.

---

## @native-dates/plugins/legacy-date

Attaches `Date.prototype` shims to `DateTime.prototype` only (`valueOf()` / `+dt` and `toJSDate()` already exist in core):

- **Shimmed reads (22):** Zone-local `get{FullYear,Month,Date,Day,Hours,Minutes,Seconds,Milliseconds}()` and `getTimezoneOffset()` (minutes positive west of UTC in `this.zone`); UTC `getTime()` and `getUTC*()` (8 methods); `toISOString()` (fixed `.sssZ`); and `toLocale{,Date,Time}String(locales?, opts?)` (defaulting to `this.locale()` and `this.zone`).
- **Not shimmed / blocked:** `toDateString()` and `toUTCString()` are omitted (use `dt.toJSDate().toUTCString()`); all 15 `set*` and `setUTC*` methods throw `RangeError` (`code: 'immutable'`).

---

## @native-dates/polyfill

`native-dates` reads `globalThis.Temporal` lazily at call time; import the polyfill at entrypoint startup before calling factories (with `"temporal-polyfill": ">=0.3.0"` installed):

| Entrypoint | Mechanism | Target environments |
|---|---|---|
| `import '@native-dates/polyfill'` | `if (!globalThis.Temporal) await import('temporal-polyfill')` | ESM browsers (0 B downloaded on Chrome/Firefox/Edge; dynamic chunk on Safari) & ESM on Node `<26` |
| `import '@native-dates/polyfill/sync'` | Sync `import { Temporal } from 'temporal-polyfill'` + `if (!globalThis.Temporal)` | CommonJS bundles, test setups, or bundler targets disallowing top-level `await` |

---

## Authoring Custom Plugins

Parser and zone hooks (`native-dates/helpers/*`) are private to `@native-dates/plugins` without semver guarantees. Third-party plugins extend the 9 exported class prototypes (`DateTime`, `CalendarDate`, `Time`, `Duration`, `MonthDay`, `YearMonth`, `DateRange`, `DateTimeRange`, `TimeRange`):

- **Cross-realm identity:** `kindOf(v)` returns `'datetime' | 'date' | 'time' | 'duration' | 'monthDay' | 'yearMonth' | 'dateRange' | 'datetimeRange' | 'timeRange' | undefined`. Exported `Symbol.for` keys (`IS_DATE_TIME`, `IS_CALENDAR_DATE`, `IS_TIME`, `IS_DURATION`, `IS_MONTH_DAY`, `IS_YEAR_MONTH`, `IS_RANGE`, `IS_DATE_RANGE`, `IS_DATE_TIME_RANGE`, `IS_TIME_RANGE`) are **property keys** (`Boolean(v?.[IS_CALENDAR_DATE])`, never called as functions), alongside predicate functions `isDateTime(v)`, `isCalendarDate(v)`, etc.
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

| Untrusted / edge-case situation | Outcome | Idiom |
|---|---|---|
| Untrusted `rawText` AND untrusted `zoneName` | `loose` returns `null` for `rawText`, but throws `unknownZone` on `zoneName` | Wrap in `try/catch` checking `err?.code === 'unknownZone'` |
| Non-IANA city (`'San Francisco'`, `'Mumbai'`) | Throws `unknownZone` | Register `configure({ zoneAliases: { sf: 'America/Los_Angeles', mumbai: 'Asia/Kolkata' } })` |
| Non-US inline zone in string (`'Nov 16 9am IST'`) | `Date.parse` returns `null` (doesn't read `timezones`) | Strip or pass zone separately: `datetime('Nov 16, 2026 9am', { zone: 'IST', loose: true })` |
| `16/11/2026` without `dayFirst: true` | Returns `null` under `{ loose: true }` | Pass `{ loose: true, dayFirst: true }` (or `configure({ dayFirst: true })` + `{ loose: true }`) |
| Fixed `-05:00` year-round after importing `zones` | `'EST'` now observes EDT in summer | Pass explicit offset string `'-05:00'` instead of `'EST'` |

```js
import '@native-dates/polyfill/sync';
import { timezones } from '@native-dates/plugins/zones';
import '@native-dates/plugins/loose';
import { configure, datetime } from 'native-dates';

timezones.IST = 'Asia/Jerusalem';
configure({ dayFirst: true, zoneAliases: { sf: 'America/Los_Angeles' } });

export function parseCsvTimestamp(rawText, rawZone) {
  try {
    return datetime(rawText, { zone: rawZone, loose: true }); // DateTime | null (null if rawText is null/""/invalid)
  } catch (err) {
    if (err?.code === 'unknownZone') { return null; }
    throw err;
  }
}
```

**Golden rule: Import plugin subpaths once at startup without `.use()`, pass `{ loose: true }` per call, and treat `{ loose: true }` as returning `null` for unreadable data while still throwing on bad options.**

---

## Related Skills

| Skill | Use when... |
|---|---|
| `native-dates` | Core classes (`DateTime`, `CalendarDate`, `Time`, `Duration`, `MonthDay`, `YearMonth`, ranges), DST-safe arithmetic, `round()`, `format()` presets and tokens, `.locale()`, `weekStart`, `compare()`, and error codes |
