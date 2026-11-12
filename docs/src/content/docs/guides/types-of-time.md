---
title: Types of time
lede: Pick the right type for a calendar day, a time of day, a specific moment, or a length of time.
updated: 2026-11-12
---

JavaScript's built-in `Date` uses one object for everything, whether you mean someone's birthday, a 9:30 AM alarm, or the exact second an order was placed.

Each concept gets its own type so you only work with the parts you actually have:

- **`CalendarDate`** for a day on the calendar, like May 10, 2026
- **`Time`** for a time of day, like 9:30 AM
- **`DateTime`** for a specific moment in a time zone
- **`Duration`** for a length of time, like 2 hours or 3 weeks

## CalendarDate

Use [`CalendarDate`](/api/calendar-date/) when something happens on a day rather than at a specific second: birthdays, due dates, holidays, or values from a date picker.

Create one with `today()` or `date()`:

```js
import { date, today } from 'native-dates';

const birthday = date('2026-05-10');
const due = today().plus(2, 'weeks');

birthday.month; // 5
birthday.day; // 10
```

Because a `CalendarDate` has no clock or time zone, May 10 stays May 10 for every user regardless of where they live.

## Time

Use [`Time`](/api/time/) for a time of day that isn't tied to one specific date, such as store opening hours or a daily reminder.

```js
import { time } from 'native-dates';

const opens = time('9:00am');
const closes = opens.plus(8, 'hours');

closes.hour; // 17
closes.format('short'); // '5:00 PM'
```

Adding hours past midnight wraps around the 24-hour clock cleanly, since there is no date to advance.

## DateTime

Use [`DateTime`](/api/date-time/) when something happens at a real point in time: a meeting, a flight departure, or a timestamp from your database.

Create one with `now()` or `datetime()`, or attach a time to a calendar date:

```js
import { date, datetime, now } from 'native-dates';

const current = now();
const created = datetime('2026-11-16T17:30:00Z');
const standup = date('2026-11-16').at('9:30am', 'America/Los_Angeles');
```

A `DateTime` knows both when something happens and which time zone you're viewing it in. Call `in()` to see that same moment in another city:

```js
standup.in('Europe/Berlin').format('time'); // '6:30 PM'
```

## Duration

Use [`Duration`](/api/duration/) for how long something lasts. Create one with unit helpers like `hours()` or pass a phrase to `duration()`:

```js
import { days, duration, hours } from 'native-dates';

const call = hours(1.5);
const trial = days(14);
const turnaround = duration('2 weeks, 3 days');
```

Measuring the gap between two values returns a `Duration` too:

```js
const opens = time('9:00am');
const lunch = time('12:30pm');

opens.until(lunch).format('long'); // '3 hours, 30 minutes'
```

## Moving between them

These types connect directly when you add or drop parts. Attach a time to a `CalendarDate` with `at()` to get a `DateTime`:

```js
const reminder = today().plus(1, 'day').at('9:00am');
```

Going the other way, read the date or time off any `DateTime`, or call `as()` to convert inside a method chain:

```js
reminder.date; // CalendarDate for tomorrow
reminder.time; // Time for 09:00:00
reminder.in('Asia/Tokyo').as('time'); // Time in Tokyo
```

## Partial dates and ranges

When a value deliberately omits a year or day, or spans between two endpoints, import the matching plugin instead of inventing placeholder fields:

- [`YearMonth`](/plugins/year-month/) for a billing period or card expiry like November 2026
- [`MonthDay`](/plugins/month-day/) for a recurring birthday or annual holiday like October 17
- [Ranges](/plugins/ranges/) for a span between two dates, times, or moments

```js
import { monthDay } from '@native-dates/plugins/month-day';
import '@native-dates/plugins/ranges';
import { yearMonth } from '@native-dates/plugins/year-month';

const billing = yearMonth('2026-11');
const birthday = monthDay('10/17');
const sprint = today().to(2, 'weeks');
```

:::tip[DateTime or CalendarDate?]
Ask whether changing time zones should change what the user sees. A 9:30 AM call in Los Angeles is 6:30 PM in Berlin, so it belongs in `DateTime`. A birthday on May 10 is still May 10 everywhere, so it belongs in `CalendarDate`.
:::
