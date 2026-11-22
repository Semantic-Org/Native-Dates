---
title: Months and days
lede: Model billing months, card expiries, and recurring annual dates without inventing a fake day or year.
updated: 2026-11-22
---

With JavaScript's `Date`, storing a credit card expiry means inventing day 1, and storing a birthday without a birth year means inventing a fake leap year like 2000. [`YearMonth`](/api/year-month/) and [`MonthDay`](/api/month-day/) represent standalone months and recurring days directly so you never carry fields you do not have.

## Billing months and card expiries

Use [`yearMonth()`](/api/year-month-fn/) for ISO strings like `'2026-11'` or `(year, month)` numbers, and [`monthYear()`](/api/year-month-fn/#monthyear) for card-expiry strings like `'11/28'`:

```js
import { monthYear, yearMonth } from 'native-dates';

const billing = yearMonth('2026-11');
const expiry = monthYear('11/28');

billing.daysInMonth; // 30
billing.quarter; // 4
expiry.isPast('UTC'); // false
```

Check whether a calendar date falls inside a month with `contains()`, step forward by months or quarters with `plus()`, and pick a concrete day with `on()`:

```js
billing.contains('2026-11-16'); // true
billing.plus(3, 'months').toString(); // '2027-02'
yearMonth('2026-02').on(31).toString(); // '2026-02-28'
yearMonth('2028-02').on(31).toString(); // '2028-02-29'
```

Day 31 clamps cleanly to the end of shorter months, which makes end-of-month billing runs straightforward without separate leap-year checks.

## Birthdays and annual holidays

Use [`monthDay()`](/api/month-day-fn/) for month-first strings like `'10/17'` or `'10-17'`, and [`dayMonth()`](/api/month-day-fn/#daymonth) for day-first strings like `'17/10'`. The function name fixes the order so `'05/10'` never depends on locale settings:

```js
import { dayMonth, monthDay } from 'native-dates';

const birthday = monthDay('10/17');
const european = dayMonth('17/10');

birthday.equals(european); // true
birthday.in(2027).toString(); // '2027-10-17'
```

Find the next or most recent occurrence relative to today or any reference date with `next()` and `previous()`:

```js
birthday.next('2026-05-01').toString(); // '2026-10-17'
birthday.next('2026-10-17').toString(); // '2027-10-17'
birthday.previous('2026-10-17').toString(); // '2025-10-17'
```

Leap-day dates resolve automatically in common years. Use `fallsOn()` when checking whether a calendar date is that year's observance:

```js
const leapDay = monthDay(2, 29);

leapDay.in(2027).toString(); // '2027-02-28'
leapDay.fallsOn('2027-02-28'); // true
leapDay.fallsOn('2028-02-28'); // false
leapDay.fallsOn('2028-02-29'); // true
```

## Moving between months, days, and full dates

Read `.yearMonth` or `.monthDay` directly off any `CalendarDate` or `DateTime`, or call `as()` mid-chain:

```js
import { date, datetime } from 'native-dates';

const invoice = date('2026-11-16');
invoice.yearMonth.toString(); // '2026-11'
invoice.monthDay.toString(); // '11-16'

datetime('2026-11-01T02:00:00Z', 'America/Los_Angeles').as('yearMonth').toString();
// '2026-10'
```

Going the other way, anchor a `YearMonth` to a day with `on()` or place a `MonthDay` in a year with `in()` to get a full `CalendarDate`.

## Formatting and storing

Both types format through the runtime's locale rules with `.text` and `format()`, and serialize to compact ISO strings with `toString()` or `JSON.stringify()`:

```js
import { monthDay, yearMonth } from 'native-dates';

yearMonth('2026-11').format('long', 'en-US'); // 'November 2026'
yearMonth('2026-05').format('long', 'ru'); // 'май 2026 г.'
monthDay('10-17').format('long', 'en-US'); // 'October 17'

yearMonth('2026-11').toString(); // '2026-11'
monthDay('10/17').toString(); // '10-17'
```

Storing `'2026-11'` or `'10-17'` in your database or URL keeps the wire format unambiguous and parses straight back through `yearMonth()` and `monthDay()`.
