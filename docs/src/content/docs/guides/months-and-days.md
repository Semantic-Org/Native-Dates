---
title: Months and days
lede: Store a month without a day, or a recurring birthday without a year.
updated: 2026-11-22
---

In plain JavaScript, storing a card expiry means sticking a fake 1st on the end. Storing a birthday without a birth year means picking a dummy leap year like 2000. [`YearMonth`](/api/year-month/) and [`MonthDay`](/api/month-day/) store just the parts that actually exist.

## Billing months and card expiries

Use [`yearMonth()`](/api/year-month-fn/) for ISO strings or year-and-month numbers, and [`monthYear()`](/api/year-month-fn/#monthyear) for card expiries like 11/28:

```js
import { monthYear, yearMonth } from 'native-dates';

const billing = yearMonth('2026-11');
const expiry = monthYear('11/28');

billing.daysInMonth; // 30
billing.quarter; // 4
expiry.isPast('UTC'); // false
```

Check whether a date falls inside a month with [`contains()`](/api/year-month/#contains), step forward by months or quarters with [`plus()`](/api/year-month/#plus), and pick a specific day with [`on()`](/api/year-month/#on):

```js
billing.contains('2026-11-16'); // true
billing.plus(3, 'months').toString(); // '2027-02'
yearMonth('2026-02').on(31).toString(); // '2026-02-28'
yearMonth('2028-02').on(31).toString(); // '2028-02-29'
```

Day 31 lands on the last day of shorter months automatically, including February 29 in leap years.

## Birthdays and annual holidays

Use [`monthDay()`](/api/month-day-fn/) for month-first strings and [`dayMonth()`](/api/month-day-fn/#daymonth) for day-first strings. The function name sets the order, so 05/10 means the same thing everywhere:

```js
import { dayMonth, monthDay } from 'native-dates';

const birthday = monthDay('10/17');
const european = dayMonth('17/10');

birthday.equals(european); // true
birthday.in(2027).toString(); // '2027-10-17'
```

Find the next or most recent occurrence from today or any reference date with [`next()`](/api/month-day/#next) and [`previous()`](/api/month-day/#previous):

```js
birthday.next('2026-05-01').toString(); // '2026-10-17'
birthday.next('2026-10-17').toString(); // '2027-10-17'
birthday.previous('2026-10-17').toString(); // '2025-10-17'
```

February 29 shifts to February 28 in non-leap years. Call [`fallsOn()`](/api/month-day/#fallson) to check whether a given date matches:

```js
const leapDay = monthDay(2, 29);

leapDay.in(2027).toString(); // '2027-02-28'
leapDay.fallsOn('2027-02-28'); // true
leapDay.fallsOn('2028-02-28'); // false
leapDay.fallsOn('2028-02-29'); // true
```

## Moving between months, days, and full dates

Read `.yearMonth` or `.monthDay` off any date or moment, or call [`as()`](/api/date-time/#as) mid-chain:

```js
import { date, datetime } from 'native-dates';

const invoice = date('2026-11-16');
invoice.yearMonth.toString(); // '2026-11'
invoice.monthDay.toString(); // '11-16'

datetime('2026-11-01T02:00:00Z', 'America/Los_Angeles').as('yearMonth').toString();
// '2026-10'
```

Going the other way, call `on()` with a day on a month or [`in()`](/api/month-day/#in) with a year on a birthday to get a full calendar date.

## Formatting and storing

Both types format through `.text` and [`format()`](/api/year-month/#format), and turn into ISO strings with [`toString()`](/api/year-month/#tostring):

```js
import { monthDay, yearMonth } from 'native-dates';

yearMonth('2026-11').format('long', 'en-US'); // 'November 2026'
yearMonth('2026-05').format('long', 'ru'); // 'май 2026 г.'
monthDay('10-17').format('long', 'en-US'); // 'October 17'

yearMonth('2026-11').toString(); // '2026-11'
monthDay('10/17').toString(); // '10-17'
```

Strings like 2026-11 and 10-17 store cleanly in a database or URL and parse straight back through `yearMonth()` and `monthDay()`.
