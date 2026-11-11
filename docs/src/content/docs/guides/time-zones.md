---
title: Time zones
lede: A datetime is one exact moment and a zone to read it in. Change the zone and the moment stays put, while the platform works out every offset and daylight change.
updated: 2026-11-10
---

## A zone is a view

`in()` reads the same moment in another zone. The moment doesn’t change, so the two values are equal.

```js title="standup.js" {4}
import { date } from 'native-dates';

const standup = date('2026-11-16').at('9:30am', 'America/Los_Angeles');
const berlin = standup.in('Europe/Berlin');

berlin.text; // 'Nov 16, 2026, 6:30 PM GMT+1'
berlin.equals(standup); // true
```

:::note[Stored in UTC]
`toString()` and `toJSON()` print the instant in UTC. Two clients that store the same moment store the same string, whatever zone each one reads it in.
:::

## Name a zone

| Zone | Written as |
|---|---|
| An IANA name | `'America/New_York'` |
| A fixed offset | `'+05:30'` |
| UTC | `'UTC'` |

### Where a datetime gets its zone

A zone you pass wins. A `Z` or an offset in the string fixes the moment and never becomes the zone, because the offset a database prints is not where your user is.

| You write | Zone |
|---|---|
| `datetime('2026-11-16T09:30', 'America/Los_Angeles')` | `America/Los_Angeles` |
| `datetime('2026-11-16T09:30[Europe/Berlin]')` | `Europe/Berlin` |
| `datetime('2026-11-16T17:30Z')` | The default zone |
| `now()` | The default zone |

The default zone is the machine’s until you set one.

```js
import { configure } from 'native-dates';

configure({ zone: 'Europe/Berlin' });
```

## Daylight saving

Adding days keeps the wall clock. Adding hours counts hours. On the night New York’s clocks spring forward, the two differ.

```js {4,5}
import { datetime } from 'native-dates';

const saturday = datetime('2026-03-07T09:00', 'America/New_York');
saturday.plus(1, 'day').text; // 'Mar 8, 2026, 9:00 AM EDT'
saturday.plus(24, 'hours').text; // 'Mar 8, 2026, 10:00 AM EDT'
```

`hoursInDay` is `23`, `24` or `25`, so a day’s length is never assumed.

:::warning[A time the clock skips]
New York has no 2:30 AM on March 8, 2026: the clock goes from 2:00 to 3:00. Asking for it gives the moment an hour later, `3:30 AM EDT`.
:::

## Plan a meeting in three steps

:::steps
1. **Start from the day**

   A meeting is on a calendar day, so start with a date. It has no clock and no zone to get wrong.

   ```js
   const day = date('2026-11-16');
   ```

2. **Give it a time and a place**

   `at()` takes the time and the zone it happens in, and returns the moment.

   ```js
   const standup = day.at('9:30am', 'America/Los_Angeles');
   ```

3. **Read it where each person is**

   ```js
   standup.in('Europe/Berlin').format('time'); // '6:30 PM'
   standup.in('Asia/Tokyo').format('time'); // '2:30 AM'
   ```
:::

:::tip[Cities and abbreviations]
Import `@native-dates/plugins/zones` and a zone also answers to a city, `'Berlin'`, or an abbreviation, `'PT'`.
:::

## Next

- [Installation](/guides/installation/): the package, the plugins and where it runs.
- [`DateTime` reference](/api/date-time/): every property and method.
- [A meeting across zones](/examples/meeting-planner/): this page as a running app.
