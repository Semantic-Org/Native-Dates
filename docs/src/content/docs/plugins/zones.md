---
title: zones
kind: plugin
lede: Resolve city names, common time zone abbreviations, and custom aliases anywhere a zone is accepted.
import: import '@native-dates/plugins/zones'
size: zones
updated: 2026-11-12
---

## Resolving cities and abbreviations

Core accepts full IANA identifiers, fixed UTC offsets, and `'UTC'`. Importing this plugin extends every zone parameter across the library to accept human city names, common abbreviations, and custom aliases.

```js title="zones.js"
import '@native-dates/plugins/zones';
import { date, datetime, today } from 'native-dates';

const standup = datetime('2026-11-16T09:30', 'PT');

standup.zone; // 'America/Los_Angeles'
standup.in('Berlin').hour; // 18
date('2026-11-16').at('9:00am', 'São Paulo').zone; // 'America/Sao_Paulo'
today('JST').toString(); // current date in Asia/Tokyo
```

Every spelling normalizes to its canonical IANA identifier on the resulting instance. Comparing zones or serializing values stays consistent regardless of how the zone was typed.

## City names

Any city in the runtime's time zone database resolves regardless of letter case, accents, spaces, or underscores. Full IANA paths also match loosely when typed in lowercase or with spaces.

```js
const moment = datetime('2026-11-03T17:30Z');

moment.in('los angeles').zone; // 'America/Los_Angeles'
moment.in('sao paulo').zone; // 'America/Sao_Paulo'
moment.in('mexico city').zone; // 'America/Mexico_City'
moment.in('ho chi minh').zone; // 'Asia/Ho_Chi_Minh'
moment.in('america/new york').zone; // 'America/New_York'
```

Unrecognized names still throw an `'unknownZone'` error rather than falling back to the local system clock.

## Common abbreviations

Abbreviations and regional names map to the primary daylight-observing IANA zone for that region.

| Abbreviations | Canonical zone | Region |
|---|---|---|
| `PT`, `PST`, `PDT`, `Pacific` | `'America/Los_Angeles'` | Pacific Time in North America. |
| `MT`, `MST`, `MDT`, `Mountain` | `'America/Denver'` | Mountain Time in North America. |
| `CT`, `CST`, `CDT`, `Central` | `'America/Chicago'` | Central Time in North America. |
| `ET`, `EST`, `EDT`, `Eastern` | `'America/New_York'` | Eastern Time in North America. |
| `AKT`, `AKST`, `AKDT`, `Alaska` | `'America/Anchorage'` | Alaska Time. |
| `HT`, `HST`, `Hawaii` | `'Pacific/Honolulu'` | Hawaii Time. |
| `AT` | `'America/Halifax'` | Atlantic Time in Canada. |
| `GMT`, `Z` | `'UTC'` | Coordinated Universal Time. |
| `UK`, `WET`, `BST` | `'Europe/London'` | United Kingdom and Western European Time. |
| `CET`, `CEST`, `ECT` | `'Europe/Paris'` | Central European Time. |
| `EET` | `'Europe/Helsinki'` | Eastern European Time. |
| `IRST` | `'Europe/Dublin'` | Ireland Time. |
| `IST`, `INST` | `'Asia/Kolkata'` | India Standard Time by default. |
| `JST`, `KST` | `'Asia/Tokyo'`, `'Asia/Seoul'` | Japan and Korea Standard Time. |
| `SGT`, `HKT` | `'Asia/Singapore'`, `'Asia/Hong_Kong'` | Singapore and Hong Kong Time. |
| `AET`, `AEST`, `AEDT` | `'Australia/Sydney'` | Australian Eastern Time. |
| `ACT`, `AWT` | `'Australia/Adelaide'`, `'Australia/Perth'` | Australian Central and Western Time. |
| `NZT`, `NZST`, `NZDT` | `'Pacific/Auckland'` | New Zealand Time. |
| `BRT` | `'America/Sao_Paulo'` | Brasília Time. |

:::note[Abbreviations observe daylight saving time]
In raw IANA data, bare EST is a fixed five-hour offset that never springs forward in March. This plugin maps Pacific and Eastern abbreviations to `'America/Los_Angeles'` and `'America/New_York'` so daylight saving math stays accurate. Pass a numeric offset like `'-08:00'` when you want a fixed offset year-round.
:::

## Custom aliases

Register shorthand names for offices, regions, or ambiguous abbreviations once at startup with [`configure()`](/api/configure/).

:::entry
### `configure()` :kind[function]

```js signature
configure({ zoneAliases }): Settings
```

Adds or removes custom zone names in the global settings table. Alias keys match without case or accent sensitivity, and targets can be full IANA names, cities, or abbreviations. Set a key to `null` to delete one alias, or pass `zoneAliases: null` to clear them all.

**Parameters**

```params
- name: zoneAliases
  type: Record<string, Zone | null> | null
  description: "Map of custom names to valid zones or `null`, or `null` to clear every custom alias."
```

**Returns**

```returns
type: Settings
description: Snapshot of the active configuration with canonicalized alias targets.
```

```js
import { configure } from 'native-dates';

configure({
  zoneAliases: {
    hq: 'Berlin',
    west: 'PT',
    ist: 'Asia/Jerusalem',
  },
});

datetime('2026-11-16T09:30', 'west').in('hq').zone; // 'Europe/Berlin'
datetime('2026-11-16T09:30Z', 'IST').zone; // 'Asia/Jerusalem'

configure({ zoneAliases: null });
```
:::

The plugin also exports its mutable `timezones` lookup map when inspecting or adjusting base abbreviations directly at boot:

```js
import { timezones } from '@native-dates/plugins/zones';

timezones.JST; // 'Asia/Tokyo'
```
