---
title: zones
kind: plugin
lede: Resolve city names, regional abbreviations, locale-aware zone codes, and custom aliases anywhere a zone is accepted.
import: import '@native-dates/plugins/zones'
size: zones
updated: 2026-11-22
---

## Resolving cities and abbreviations

Core accepts full IANA identifiers, fixed UTC offsets, and `'UTC'`. Importing this plugin extends every zone parameter across the library to accept human city names, common abbreviations, and custom aliases.

```js title="zones.js"
import '@native-dates/plugins/zones';
import { date, datetime, today } from 'native-dates';

const standup = datetime('2026-11-16T09:30', 'PT');

standup.zone; // 'America/Los_Angeles'
standup.in('Berlin').hour; // 18
date('2026-11-16').at('9:00am', 'Beijing').zone; // 'Asia/Shanghai'
today('JST').toString(); // current date in Asia/Tokyo
```

Every spelling normalizes to its canonical IANA identifier on the resulting instance. Comparing zones or serializing values stays consistent regardless of how the zone was typed.

## City names

Any city in the runtime's time zone database resolves regardless of letter case, accents, spaces, or underscores. Major cities whose zone IANA files under another name also work out of the box, including local-script spellings.

```js
const moment = datetime('2026-11-03T17:30Z');

moment.in('los angeles').zone; // 'America/Los_Angeles'
moment.in('Mumbai').zone; // 'Asia/Kolkata'
moment.in('Rio de Janeiro').zone; // 'America/Sao_Paulo'
moment.in('東京').zone; // 'Asia/Tokyo'
moment.in('Москва').zone; // 'Europe/Moscow'
```

Built-in city aliases cover major hubs such as NYC, San Francisco, Beijing, Mumbai, Munich, and Osaka. Unrecognized names still throw an `unknownZone` error rather than falling back to the local system clock.

## Abbreviations that follow the locale

Some abbreviations mean different zones in different countries. When a name is shared, the plugin checks the active locale's region first and falls back to the primary reading elsewhere.

```js
const call = datetime('2026-11-16T09:30Z');

call.locale('en-US').in('CST').zone; // 'America/Chicago'
call.locale('zh-CN').in('CST').zone; // 'Asia/Shanghai'
call.locale('he-IL').in('IST').zone; // 'Asia/Jerusalem'
```

The locale comes from the value itself, the `{ locale }` option, [`configure()`](/api/configure/), or the runtime default.

| Name | Default and regional readings |
|---|---|
| `CST` | `'America/Chicago'` by default; `'Asia/Shanghai'` in `zh` and `zh-CN`; `'Asia/Taipei'` in `zh-TW`; `'America/Havana'` in `es-CU`. |
| `IST` | `'Asia/Kolkata'` by default; `'Europe/Dublin'` in `en-IE`; `'Asia/Jerusalem'` in `he`. |
| `PST` | `'America/Los_Angeles'` by default; `'Asia/Manila'` in `fil` and `en-PH`. |
| `BST` | `'Europe/London'` by default; `'Asia/Dhaka'` in `bn`. |
| `AST` | `'America/Halifax'` by default; `'Asia/Riyadh'` in `ar-SA`. |
| `ACT` | `'Australia/Adelaide'` by default; `'America/Rio_Branco'` in `pt-BR`. |
| `AMT` | `'America/Manaus'` by default; `'Asia/Yerevan'` in `hy`. |
| `San Juan` | `'America/Argentina/San_Juan'` by default; `'America/Puerto_Rico'` in `es-PR`. |

## Common abbreviations

Abbreviations and regional names map to the primary daylight-observing IANA zone for that region.

| Abbreviations | Canonical zone | Region |
|---|---|---|
| `PT`, `PST`, `PDT`, `Pacific` | `'America/Los_Angeles'` | Pacific Time in North America (`PST` follows locale). |
| `MT`, `MST`, `MDT`, `Mountain` | `'America/Denver'` | Mountain Time in North America. |
| `CT`, `CST`, `CDT`, `Central` | `'America/Chicago'` | Central Time in North America (`CST` follows locale). |
| `ET`, `EST`, `EDT`, `Eastern` | `'America/New_York'` | Eastern Time in North America. |
| `HNE`, `HAE` | `'America/Toronto'` | French-Canadian Eastern Time. |
| `AKT`, `AKST`, `AKDT`, `Alaska` | `'America/Anchorage'` | Alaska Time. |
| `HT`, `HST`, `Hawaii` | `'Pacific/Honolulu'` | Hawaii Time. |
| `AT`, `AST` | `'America/Halifax'` | Atlantic Time (`AST` follows locale). |
| `BRT`, `FNT` | `'America/Sao_Paulo'`, `'America/Noronha'` | Brasília and Fernando de Noronha Time. |
| `ART`, `COT`, `CLT` | `'America/Argentina/Buenos_Aires'`, `'America/Bogota'`, `'America/Santiago'` | Argentina, Colombia, and Chile Time. |
| `GMT`, `Z` | `'UTC'` | Coordinated Universal Time. |
| `UK`, `WET`, `BST` | `'Europe/London'` | United Kingdom and Western Europe (`BST` follows locale). |
| `CET`, `CEST`, `ECT` | `'Europe/Paris'` | Central European Time. |
| `EET` | `'Europe/Helsinki'` | Eastern European Time. |
| `MSK`, `мск` | `'Europe/Moscow'` | Moscow Standard Time. |
| `WAT`, `EAT`, `SAST` | `'Africa/Lagos'`, `'Africa/Nairobi'`, `'Africa/Johannesburg'` | West, East, and South Africa Time. |
| `GST`, `IRST`, `PKT` | `'Asia/Dubai'`, `'Asia/Tehran'`, `'Asia/Karachi'` | Gulf, Iran, and Pakistan Time. |
| `IST`, `INST` | `'Asia/Kolkata'` | India Standard Time (`IST` follows locale). |
| `ICT`, `WIB`, `PHT` | `'Asia/Bangkok'`, `'Asia/Jakarta'`, `'Asia/Manila'` | Indochina, Western Indonesia, and Philippine Time. |
| `JST`, `KST` | `'Asia/Tokyo'`, `'Asia/Seoul'` | Japan and Korea Standard Time. |
| `SGT`, `HKT` | `'Asia/Singapore'`, `'Asia/Hong_Kong'` | Singapore and Hong Kong Time. |
| `AET`, `AEST`, `AEDT` | `'Australia/Sydney'` | Australian Eastern Time. |
| `ACT`, `AWT` | `'Australia/Adelaide'`, `'Australia/Perth'` | Australian Central and Western Time (`ACT` follows locale). |
| `NZT`, `NZST`, `NZDT` | `'Pacific/Auckland'` | New Zealand Time. |

:::note[Abbreviations observe daylight saving time]
In raw IANA data, bare EST is a fixed five-hour offset that never springs forward in March. This plugin maps Pacific and Eastern abbreviations to `'America/Los_Angeles'` and `'America/New_York'` so daylight saving math stays accurate. Pass a numeric offset like `'-08:00'` when you want a fixed offset year-round.
:::

## Custom aliases

Register shorthand names for offices, teams, or fixed abbreviation overrides once at startup with [`configure()`](/api/configure/). Custom aliases take precedence over locale-based resolution.

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

The plugin also exports its mutable `timezones` lookup map when inspecting or pinning base abbreviations directly at boot. Setting an entry like `timezones.IST = 'Asia/Jerusalem'` overrides locale-based resolution for every locale:

```js
import { timezones } from '@native-dates/plugins/zones';

timezones.JST; // 'Asia/Tokyo'
```
