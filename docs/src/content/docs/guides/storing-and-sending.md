---
title: Storing and sending
lede: Serialize dates, times, timestamps, and durations cleanly across JSON APIs, SQL columns, URLs, and HTML inputs.
updated: 2026-11-12
---

Every type serializes to a standard ISO 8601 string when converted to text or passed to `JSON.stringify()`. Those strings read straight back into each matching factory on the other side.

## JSON and wire formats

Pass values directly into `JSON.stringify()` without custom replacers or wrapper objects:

```js
import { date, duration, time } from 'native-dates';

const standup = date('2026-11-16').at('9:30am', 'America/Los_Angeles');

JSON.stringify({
  startsAt: standup,
  dueOn: date('2026-11-16'),
  opensAt: time('9:30am'),
  length: duration('1h 30m'),
});
// '{"startsAt":"2026-11-16T17:30:00.000Z","dueOn":"2026-11-16","opensAt":"09:30:00","length":"PT1H30M"}'
```

| Type | Wire output | Typical payload field |
|---|---|---|
| [`DateTime`](/api/date-time/) | `'2026-11-16T17:30:00.000Z'` | Audit timestamps, flight departures, and meeting instants |
| [`CalendarDate`](/api/calendar-date/) | `'2026-11-16'` | Birthdays, due dates, holidays, and booking nights |
| [`Time`](/api/time/) | `'09:30:00'` | Store opening hours and daily reminder times |
| [`Duration`](/api/duration/) | `'PT1H30M'` | Timeouts, SLAs, billing spans, and timers |

When an external API, cache key, or integer column expects a number, read `epoch` on a moment or `toMilliseconds()` on a duration:

```js
standup.toString(); // '2026-11-16T17:30:00.000Z'
standup.epoch; // 1794850200000
duration('1h 30m').toMilliseconds(); // 5400000
```

## Round-tripping back into code

Feed each wire string back into its matching factory when reading JSON responses, database rows, or URL parameters:

```js
import { date, datetime, duration, time } from 'native-dates';

const startsAt = datetime('2026-11-16T17:30:00.000Z', 'America/Los_Angeles');
const dueOn = date('2026-11-16');
const opensAt = time('09:30:00');
const length = duration('PT1H30M');
```

Every `DateTime` serializes to UTC so two clients recording the same event produce identical strings. Passing a time zone when reading that string back views the exact UTC moment locally without shifting when it happened.

## Future and recurring events

For past events like order receipts or server logs, a UTC timestamp alone is complete. Future events scheduled by a person need the IANA `zone` stored alongside the timestamp.

```js
import { date, datetime } from 'native-dates';

const standup = date('2026-11-16').at('9:30am', 'America/Los_Angeles');
const row = {
  startsAt: standup.toString(),
  zone: standup.zone, // 'America/Los_Angeles'
};

const nextWeek = datetime(row.startsAt, row.zone).plus(1, 'week');
nextWeek.hour; // 9
```

With the zone preserved, adding weeks or months keeps the local 9:30 AM clock time across daylight saving transitions. It also picks up any future changes lawmakers make to local time rules.

:::tip[Store IANA names, not offsets]
An offset like `'-08:00'` only describes winter in Los Angeles. Store `zone` whenever future calendar math must follow local daylight saving shifts.
:::

## Database columns

Match your SQL column type to the value you have so the database enforces the same boundaries your application code does.

| Type | SQL column | Why it fits |
|---|---|---|
| `DateTime` | `timestamptz` or `bigint` | Stores an exact UTC instant with no ambiguity |
| `CalendarDate` | `date` | Stores `YYYY-MM-DD` without midnight timezone shifts |
| `Time` | `time` | Stores `HH:MM:SS` without inventing a dummy date |
| `Duration` | `interval` or `text` | Stores structured intervals or ISO 8601 `PT` strings |

Avoid bare SQL `timestamp` columns without time zone for real moments. Database drivers often reinterpret bare timestamps in the server's local zone.

## HTML inputs and URLs

Native `<input type="date">` and `<input type="time">` controls read and write the exact ISO strings that dates and times produce. URL search parameters carry the same compact format.

```js
import { date, time } from 'native-dates';

// <input type="date" value="2026-11-16">
const due = date('2026-11-16');
due.toString(); // '2026-11-16'

// <input type="time" value="09:30">
const opens = time('09:30');
opens.toString().slice(0, 5); // '09:30'

const params = new URLSearchParams({ from: due.toString() });
params.toString(); // 'from=2026-11-16'
```

Reading date inputs with `date()` also avoids the classic `new Date('2026-11-16')` bug, where UTC midnight shifts back a day in Western Hemisphere zones.
