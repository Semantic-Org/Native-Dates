---
title: parse
kind: plugin
lede: "Strict, deterministic format-mask parsing (`{ format: 'DDMMYYYY' }`) across every point and range factory."
import: import '@native-dates/plugins/parse'
size: parse
updated: 2026-11-24
---

## Deterministic format parsing

Core parses strict ISO 8601 strings by default, and [`@native-dates/plugins/loose`](/plugins/loose/) reads informal human-written text heuristically. Importing `@native-dates/plugins/parse` adds a `{ format }` option to every point and range factory so fixed-schema CSV columns, bank exports, and server logs parse deterministically using the same token vocabulary as [`format()`](/guides/formatting/).

```js title="parse.js"
import '@native-dates/plugins/parse';
import { date, datetime, monthDay, time, yearMonth } from 'native-dates';

date('24112026', { format: 'DDMMYYYY' }).toString(); // '2026-11-24'
datetime('24/Nov/2026:12:40:01 -0500', {
  format: 'DD/MMM/YYYY:HH:mm:ss ZZ',
  zone: 'America/New_York',
  locale: 'en-US',
}).toString(); // '2026-11-24T17:40:01.000Z'
time('1430', { format: 'HHmm' }).toString(); // '14:30:00'
yearMonth('11/2026', { format: 'MM/YYYY' }).toString(); // '2026-11'
monthDay('29/02', { format: 'DD/MM' }).toString(); // '02-29'
```

## Factory options

Pass `{ format }` to `date()`, `datetime()`, `time()`, `yearMonth()`, `monthDay()`, `dateRange()`, `datetimeRange()`, `timeRange()`, or their class constructors.

- **Exact matching:** Literal characters are case-sensitive, fixed-width tokens (`MM`, `DD`, `YYYY`, `HH`, `mm`, `ss`) require exact digit counts, and trailing text is rejected.
- **Strict validation:** Impossible dates (`'30022026'`), mismatched weekdays (`'Mon 2026-11-24'`), and conflicting duplicate tokens throw `invalidDate` / `invalidDateTime` instead of rolling forward.
- **Named formats:** Patterns registered in [`configure({ formats })`](/api/configure/) work for both formatting and parsing.

```js title="named-and-ranges.js"
import '@native-dates/plugins/parse';
import { configure, date, dateRange } from 'native-dates';

configure({ formats: { bank: 'DDMMYYYY' } });

date('24112026', { format: 'bank' }).toString(); // '2026-11-24'
dateRange('24112026', '30112026', { format: 'bank' }).toString();
// '2026-11-24/2026-11-30'
```

## ISO week and ordinal dates

Patterns support ISO ordinal day-of-year tokens (`DDD`, `DDDD`) and ISO week tokens (`W`, `WW`, `E`, `d`, `dd`, `ddd`, `dddd`), validating leap years and 52- vs. 53-week years strictly:

```js title="iso-week-and-ordinal.js"
import '@native-dates/plugins/parse';
import { date } from 'native-dates';

date('2026-328', { format: 'YYYY-DDDD' }).toString(); // '2026-11-24'
date('2026-W48-2', { format: 'YYYY-[W]WW-E' }).toString(); // '2026-11-24'
```

## Combining with loose and zones

- With [`@native-dates/plugins/loose`](/plugins/loose/), adding `{ loose: true }` returns `null` when input data does not match the format mask, while invalid format patterns (`unknownFormat`) and unsupported tokens (`unsupportedToken`) still throw.
- With [`@native-dates/plugins/zones`](/plugins/zones/), `z` / `zz` tokens resolve city names and regional abbreviations such as `'JST'` or `'PT'` through the same zone lookup as `{ zone }`.

```js title="combined.js"
import '@native-dates/plugins/parse';
import '@native-dates/plugins/loose';
import '@native-dates/plugins/zones';
import { date, datetime } from 'native-dates';

date('not-a-date', { format: 'DDMMYYYY', loose: true }); // null
datetime('24 Nov 2026 15:45 JST', {
  format: 'DD MMM YYYY HH:mm z',
  locale: 'en-US',
}).zone; // 'Asia/Tokyo'
```
