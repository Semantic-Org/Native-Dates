---
title: Plugins, Loose Parsing, Zone Aliases, and Polyfill for native-dates
description: Companion guide for @native-dates/plugins (zones, loose, legacy-date), @native-dates/polyfill, and authoring custom native-dates plugins. Use whenever code parses non-ISO or slash dates ('11/06/2026', 'Oct 17, 2026', { loose: true, dayFirst }), resolves city names ('Berlin', 'Tokyo') or timezone abbreviations ('EST', 'PT', 'CET', zoneAliases), shims legacy Date.prototype getters (getFullYear, getMonth, getDay), polyfills Temporal for Safari/older browsers, or extends native-dates prototypes.
keywords: ["@native-dates/plugins", "@native-dates/polyfill", "temporal-polyfill", zones, loose, legacy-date, dayFirst, zoneAliases, timezones, getFullYear, getTimezoneOffset, sideEffects, missingPlugin]
audience: usage
skill: native-dates-plugins
type: skill
---

# Plugins, Loose Parsing, Zone Aliases, and Polyfill for native-dates

> **Skill:** `native-dates-plugins`
> **Purpose:** Guide to `@native-dates/plugins/{zones,loose,legacy-date}`, `@native-dates/polyfill`, and custom plugin authoring

Optional conveniences that add lookup tables, `Date.parse` fallbacks, or legacy shims live in `@native-dates/plugins` so core `native-dates` stays ~14 kB Brotli with zero dependencies. Each plugin is a side-effect subpath module that installs its hooks or prototype methods once at import time, and `@native-dates/polyfill` conditionally loads `temporal-polyfill` only on runtimes missing `globalThis.Temporal`.

**Golden rule: Import plugins as bare subpaths (`import '@native-dates/plugins/loose'`) at startup with no `.use()` call, and remember `{ loose: true }` returns `null` only for malformed input data while still throwing on invalid caller options like a bad `zone` or `locale`.**

---

## What You'd Get Wrong

**1. `@native-dates/plugins` has no root export and no `.use()` or `.extend()` registration.** Plugins self-attach when their subpath is imported; forgetting the import before passing `{ loose: true }`, `dayFirst`, or `zoneAliases` throws `RangeError` with `code: 'missingPlugin'`.

```js
// ❌ WRONG - no root barrel and no dayjs.extend() / .use() call
import { loose, zones } from '@native-dates/plugins';
datetime.extend(loose);

// ✅ RIGHT - bare subpath imports register hooks once process-wide (and merge TypeScript declarations)
import '@native-dates/plugins/loose';
import '@native-dates/plugins/zones';
import { date, datetime } from 'native-dates';

datetime('Nov 16, 2026 9:30am', { zone: 'Berlin', loose: true });
```

**2. `{ loose: true }` returns `null` for unreadable input data, NOT for invalid caller configuration.** Passing an unknown `zone` or `locale` alongside `{ loose: true }` still throws `unknownZone` or `unknownLocale` so programmer typos are never masked as empty user input.

```js
// ❌ WRONG assumption - expecting { loose: true } to swallow a bad zone option
datetime('2026-11-16', { zone: 'Mars/Olympus', loose: true }); // throws RangeError [unknownZone]

// ✅ RIGHT - { loose: true } turns malformed input strings/numbers into null (and rejects rolled-forward 'Feb 30')
date('not a date', { loose: true }); // null
date('Feb 30, 2026', { loose: true }); // null (Date.parse rollover into March is caught and rejected)
```

**3. Bare IANA `'EST'`, `'MST'`, and `'HST'` behave differently once `@native-dates/plugins/zones` is imported.** Without the plugin, `Temporal` treats `'EST'` as a legacy fixed `-05:00` zone with no daylight saving time. `@native-dates/plugins/zones` maps `'EST'`, `'EDT'`, `'ET'`, and `'Eastern'` to `'America/New_York'` (`'MST'` -> `'America/Denver'`, `'PST'`/`'PT'` -> `'America/Los_Angeles'`) so summer dates observe DST. Use `'-05:00'` when you genuinely want a fixed year-round offset.

**4. `legacy-date` reads local `Date` getters in `dt.zone`, not the host machine's OS timezone, and throws `immutable` on setters.** Calling `dt.getHours()` or `dt.getDay()` returns the hour and `0`–`6` weekday in `dt.zone` regardless of the server's timezone, while `dt.getMonth()` returns `0`–`11` to match `Date.prototype.getMonth()` (unlike `dt.month`, which stays `1`–`12`).

```js
import '@native-dates/plugins/legacy-date';
import { datetime } from 'native-dates';

const tokyo = datetime('2026-11-16T00:30:00Z', 'Asia/Tokyo');
tokyo.getHours(); // 9 (09:30 in Tokyo, even on a UTC server)
tokyo.getMonth(); // 10 (0-indexed legacy shim; tokyo.month is still 11)
tokyo.setHours(12); // throws RangeError [immutable] — use tokyo.set('hour', 12) instead
```

**5. `@native-dates/polyfill` uses top-level `await` on its default entry.** Default `import '@native-dates/polyfill'` dynamically imports `temporal-polyfill` only when `!globalThis.Temporal` so modern browsers download 0 polyfill bytes. In CommonJS or bundler targets that disallow top-level `await`, import `'@native-dates/polyfill/sync'` instead, and list `temporal-polyfill` (`>=0.3.0`) in your app's `dependencies`.

---

## @native-dates/plugins/zones

Resolves city names, common timezone abbreviations, case/diacritic variations, IANA tzdb link names, and custom `zoneAliases` anywhere a `zone` is accepted (`datetime`, `now`, `today`, `in`, `at`, `configure`).

```js
import '@native-dates/plugins/zones';
import { timezones } from '@native-dates/plugins/zones';
import { configure, datetime } from 'native-dates';

datetime('2026-11-16T09:30', 'Berlin').zone; // 'Europe/Berlin'
datetime('2026-11-16T09:30', 'são_paulo').zone; // 'America/Sao_Paulo'
datetime('2026-11-16T09:30', 'PT').zone; // 'America/Los_Angeles'

configure({ zoneAliases: { hq: 'Europe/Berlin', warehouse: 'America/Chicago' } });
datetime('2026-11-16T09:30', 'hq').zone; // 'Europe/Berlin'
```

| Resolution layer | Examples | Notes |
|---|---|---|
| `configure({ zoneAliases })` | `{ hq: 'Europe/Berlin' }` | Highest precedence; pass `{ hq: null }` to delete one alias or `zoneAliases: null` to clear all |
| Exported `timezones` map | `ET`, `CT`, `MT`, `PT`, `UK`, `CET`, `IST` (`Asia/Kolkata`), `JST`, `AET`, `BRT`, `NZT`, `SGT` | Mutable object (`timezones.IST = 'Asia/Jerusalem'`) for ambiguous regional codes |
| Built-in abbreviations | `EST`/`EDT`/`Eastern`, `CST`/`CDT`, `MST`/`MDT`, `PST`/`PDT`/`Pacific`, `BST`, `CEST`, `GMT`, `Z` | Maps to full DST-observing IANA zones (`GMT` and `Z` -> `'UTC'`) |
| Runtime IANA & city lookup | `'los angeles'`, `'buenos aires'`, `'ho chi minh'`, `'europe/paris'` | Case-, underscore-, and accent-insensitive against `Intl.supportedValuesOf('timeZone')` and `Temporal` |

---

## @native-dates/plugins/loose

Enables `{ loose: true }` and `dayFirst` on `datetime()`, `date()`, `time()`, `duration()`, `monthDay()`, `dayMonth()`, `yearMonth()`, `monthYear()`, `dateRange()`, `datetimeRange()`, `timeRange()`, and `configure({ dayFirst })`.

```js
import '@native-dates/plugins/loose';
import { configure, date, datetime, monthDay, yearMonth } from 'native-dates';

date('11/06/2026', { loose: true }); // CalendarDate(2026-11-06) — US month-first default
date('06/11/2026', { loose: true, dayFirst: true }); // CalendarDate(2026-11-06) — European day-first
datetime('Sep 6, 2026 9:30 PM EDT', { loose: true, zone: 'America/New_York' });
monthDay('17 octobre', { loose: true, locale: 'fr' }); // MonthDay(10-17)
yearMonth('noviembre de 2026', { loose: true, locale: 'es' }); // YearMonth(2026-11)
date('', { loose: true }); // null
```

| Input / Option | Behavior under `{ loose: true }` |
|---|---|
| Numeric slash/dot/dash `'06/11/2026'` | Month-first by default; set `{ dayFirst: true }` per call or `configure({ dayFirst: true })` globally for `DD/MM/YYYY` |
| Rolled-forward calendar dates (`'Feb 30, 2026'`, `'11/31/2026'`) | Caught and returned as `null` instead of letting `Date.parse` silently roll into the next month |
| Named months in `monthDay` / `yearMonth` | Matches English first (so `'Mar 17'` stays March even under `'fi'`), then `Intl` month names in `{ locale }` or `configure({ locale })` |
| Unreadable strings, `null`, `undefined`, `NaN` | Returns `null` (`TypeScript` return type widens to `T \| null` when `{ loose: true }` is passed) |
| Two-digit ISO `'10-17'` in `dayMonth()` | Always stays month-first (`October 17`) so ISO `toJSON()` strings round-trip, whereas `'17/10'` reads day-first |

---

## @native-dates/plugins/legacy-date

Attaches `Date.prototype` read methods onto `DateTime.prototype` for incremental migration where downstream helpers still call `Date` getters directly (note: `.toJSDate()` is already in core without this plugin).

- **Zone-aware local getters:** `getFullYear()`, `getMonth()` (`0`–`11`), `getDate()` (`1`–`31`), `getDay()` (`0`–`6`, Sunday = `0`), `getHours()`, `getMinutes()`, `getSeconds()`, `getMilliseconds()`, and `getTimezoneOffset()` (minutes positive west of UTC, matching `Date`) all evaluate in `this.zone`.
- **UTC & string getters:** `getTime()`, `getUTCFullYear()`, `getUTCMonth()`, `getUTCDate()`, `getUTCDay()`, `getUTCHours()`, `getUTCMinutes()`, `getUTCSeconds()`, `getUTCMilliseconds()`, `toISOString()` (fixed `.sssZ`), `toLocaleString(locales?, options?)`, `toLocaleDateString(...)`, `toLocaleTimeString(...)` (defaulting to `this.locale()` and `this.zone`).
- **Mutator guard:** All 15 `set*` / `setUTC*` methods (`setHours`, `setMonth`, `setTime`, ...) throw `RangeError` with `code: 'immutable'`.

---

## @native-dates/polyfill

```js
// Entrypoint of an app supporting Safari or older browsers (install temporal-polyfill >= 0.3.0):
import '@native-dates/polyfill';
import { now, today } from 'native-dates';
```

- **`@native-dates/polyfill` (default):** Checks `if (!globalThis.Temporal)` and runs `await import('temporal-polyfill')`, splitting the polyfill into an on-demand chunk skipped by Chrome, Firefox, Edge, and Node `>=26`.
- **`@native-dates/polyfill/sync`:** Synchronous import of `temporal-polyfill` for CommonJS bundles or build targets without top-level `await`.

---

## Authoring Custom Plugins

1. **Mutate `Class.prototype` purely:** Instances are frozen, so plugin methods return new instances (`this.plus(...)`, `new CalendarDate(...)`) rather than mutating `this`.
2. **Check brands, never `constructor.name`:** Use `IS_DATE_TIME`, `IS_CALENDAR_DATE`, `IS_TIME`, `IS_DURATION`, `IS_MONTH_DAY`, `IS_YEAR_MONTH`, `IS_RANGE`, or `kindOf(value)` from `'native-dates'` so checks survive realms and duplicate bundler copies.
3. **Declare `"sideEffects"` and `"peerDependencies"`:** Mark plugin entry files in `"sideEffects": ["./index.js"]` (never `"sideEffects": false`, or bundlers drop bare `import 'my-plugin'` statements) and put `"native-dates"` in `peerDependencies`.
4. **Augment TypeScript types:** Use `declare module 'native-dates' { interface CalendarDate { ... } }`.

---

## Quick Reference

```js
import '@native-dates/polyfill'; // only when targeting runtimes without native Temporal
import '@native-dates/plugins/zones';
import '@native-dates/plugins/loose';
import '@native-dates/plugins/legacy-date';
import { configure, date, datetime } from 'native-dates';

configure({
  dayFirst: true,
  zoneAliases: { office: 'Europe/London' },
});

const parsed = date(userInput, { loose: true }); // CalendarDate | null ('16/11/2026' -> 2026-11-16)
const meeting = datetime('2026-11-16T14:00', 'office'); // zone: 'Europe/London'
meeting.getHours(); // 14 (via legacy-date)
```

**Golden rule: Import plugins as bare subpaths (`import '@native-dates/plugins/loose'`) at startup with no `.use()` call, and remember `{ loose: true }` returns `null` only for malformed input data while still throwing on invalid caller options like a bad `zone` or `locale`.**

---

## Related Skills

| Skill | Use when... |
|---|---|
| `native-dates` | Core classes (`DateTime`, `CalendarDate`, `Time`, `Duration`, `MonthDay`, `YearMonth`, ranges), DST-safe arithmetic, `format()` presets and tokens, `.locale()`, `weekStart`, `compare()`, and error codes |
