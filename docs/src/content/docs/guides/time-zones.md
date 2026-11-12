---
title: Time zones
lede: Pair every moment with an IANA time zone, view the same instant anywhere in the world, and step cleanly across daylight saving transitions.
updated: 2026-11-12
---

A [`DateTime`](/api/date-time/) pairs two things: when a moment happens and which time zone you read it in. Changing the zone gives you another view of the same moment, while the platform handles every UTC offset and daylight transition.

## Pairing a moment with a zone

Pass an IANA zone name like `'America/New_York'`, `'UTC'`, or a fixed offset when creating a moment:

```js
import { date, datetime } from 'native-dates';

const standup = date('2026-11-16').at('9:30am', 'America/Los_Angeles');
const eastCoast = datetime('2026-11-16T12:30', 'America/New_York');
const audit = datetime('2026-11-16T17:30:00Z', 'UTC');

standup.zone; // 'America/Los_Angeles'
standup.offset; // '-08:00'
```

When you omit the zone, moments use your configured default and fall back to the runtime's local zone.

Set an app-wide default once at startup with [`configure()`](/api/configure/):

```js
import { configure, now } from 'native-dates';

configure({ zone: 'Europe/Berlin' });
now().zone; // 'Europe/Berlin'
```

## Viewing the same moment elsewhere

Call `in()` to view the same moment in another city. Local calendar and clock properties update to match the target zone, while the underlying timestamp stays identical:

```js
import { date } from 'native-dates';

const standup = date('2026-11-16').at('9:30am', 'America/Los_Angeles');
const berlin = standup.in('Europe/Berlin');
const tokyo = standup.in('Asia/Tokyo');

berlin.format('time', 'en-US'); // '6:30 PM'
tokyo.day; // 17
berlin.equals(standup); // true
```

## Offsets fix the moment, not the zone

Strings from databases and APIs often end with `Z` or a numeric offset. That suffix fixes when the moment occurred, while the new `DateTime` still uses the zone you asked for:

```js
import { datetime } from 'native-dates';

const created = datetime('2026-03-07T14:00:00Z', 'America/New_York');
const berlin = datetime('2026-03-07T16:00:00+02:00', 'Europe/Berlin');

created.zone; // 'America/New_York'
created.hour; // 9
berlin.hour; // 15
```

Keeping the real IANA zone matters as soon as you add days or months across a daylight change.

A fixed offset never shifts with the seasons, whereas an IANA zone knows every local transition rule.

:::note[Working in UTC]
Pass `'UTC'` as the zone when you want properties and calendar math evaluated in UTC. Serialization methods like `toString()` always write UTC strings regardless of the viewing zone. See [Storing and sending](/guides/storing-and-sending/).
:::

## Daylight saving transitions

Calendar units and clock units behave differently when clocks shift. On March 8, 2026, New York springs forward from 2:00 AM to 3:00 AM, making that Sunday 23 hours long.

Adding 1 day keeps the 9:00 AM local appointment time. Adding 24 hours counts 24 elapsed hours instead:

```js
import { datetime } from 'native-dates';

const saturday = datetime('2026-03-07T09:00', 'America/New_York');

saturday.plus(1, 'day').text; // 'Mar 8, 2026, 9:00 AM EDT'
saturday.plus(24, 'hours').text; // 'Mar 8, 2026, 10:00 AM EDT'
saturday.plus(1, 'day').hoursInDay; // 23
```

:::warning[Times skipped by spring-forward]
When clocks jump from 2:00 AM to 3:00 AM, local times like 2:30 AM never happen in that zone. Asking for a skipped local time moves forward cleanly by the length of the gap instead of throwing.
:::

```js
const skipped = datetime('2026-03-08T02:30', 'America/New_York');
skipped.text; // 'Mar 8, 2026, 3:30 AM EDT'
```

## City names and abbreviations

Core accepts canonical IANA names, `'UTC'`, and fixed offsets. Import [`@native-dates/plugins/zones`](/plugins/zones/) when you also want to look up city names, common abbreviations, and custom aliases:

```js
import '@native-dates/plugins/zones';
import { configure, datetime } from 'native-dates';

datetime('2026-11-16T09:30', 'los angeles').zone; // 'America/Los_Angeles'
datetime('2026-11-16T09:30', 'PT').zone; // 'America/Los_Angeles'
datetime('2026-11-16T09:30', 'Berlin').zone; // 'Europe/Berlin'

configure({ zoneAliases: { hq: 'Europe/Berlin' } });
datetime('2026-11-16T09:30', 'hq').zone; // 'Europe/Berlin'
```
