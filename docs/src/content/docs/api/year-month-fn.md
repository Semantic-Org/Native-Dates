---
title: yearMonth()
kind: function
lede: Read an ISO year-month string, card expiry, numbers, or date into a YearMonth.
import: import { yearMonth, monthYear } from 'native-dates'
size: core
updated: 2026-11-12
---

## Reading year-months

:::entry
### `yearMonth()` :kind[function]

```js signature
yearMonth(input, options?): YearMonth
yearMonth(input, zone?): YearMonth
yearMonth(year, month): YearMonth
```

Creates a [`YearMonth`](/api/year-month/) from an ISO year-month string, year and 1-indexed month numbers, a fields object, or any date or timestamp with its day dropped. Missing inputs throw a type error instead of defaulting to the current month.

```js title="billing.js"
import { datetime, yearMonth } from 'native-dates';

const fromIso = yearMonth('2026-11');
const fromNumbers = yearMonth(2026, 11);
const fromFields = yearMonth({ year: 2026, month: 11 });
const fromDate = yearMonth('2026-11-16');
const fromInstant = yearMonth(datetime('2026-11-01T02:00:00Z'), 'America/Los_Angeles');

fromNumbers.toString(); // '2026-11'
fromInstant.toString(); // '2026-10'
```

**Parameters**

```params
- name: input
  type: YearMonthInput | number | string
  required: true
  description: ISO year-month string, fields object, date or timestamp, or calendar `year`.
- name: options
  type: Zone | ReadOptions | number | string
  description: Time zone or options object when reading a timestamp or loose string, or 1-indexed `month` from 1 to 12.
  options:
    - name: zone
      type: Zone
      description: Time zone used to determine the calendar month of an instant string, `DateTime`, or `Date`.
    - name: loose
      type: boolean
      default: 'false'
      description: "Read English month names like `'Nov 2026'` and return `null` on unreadable input with `@native-dates/plugins/loose`."
```

**Returns**

```returns
type: YearMonth
description: "A `YearMonth` with no day, or `null` when loose mode cannot read `input`."
```

When the [loose plugin](/plugins/loose/) is loaded, loose mode parses English month names beside a four-digit year and returns `null` on unreadable strings:

```js
import { yearMonth } from 'native-dates';
import '@native-dates/plugins/loose';

yearMonth('Nov 2026', { loose: true })?.toString(); // '2026-11'
yearMonth('2026 November', { loose: true })?.toString(); // '2026-11'
yearMonth('not-a-month', { loose: true }); // null
```
:::

:::entry
### `monthYear()` :kind[function]

```js signature
monthYear(input, options?): YearMonth
monthYear(month, year): YearMonth
```

Reads month-first strings and numbers in the order printed on payment cards, such as `'11/26'`. Two-digit years from 0 through 99 are added to `YearMonth.century`, which defaults to 2000.

ISO strings written as `'2026-11'` still read year-first under both functions, so serialized values always round-trip cleanly.

**Parameters**

```params
- name: input
  type: YearMonthInput | number | string
  required: true
  description: Card-expiry string like `'11/26'`, any `YearMonthInput`, or 1-indexed `month` from 1 to 12.
- name: options
  type: Zone | ReadOptions | number | string
  description: Time zone or options object, or two-digit or four-digit `year` when `input` is the month.
```

**Returns**

```returns
type: YearMonth
description: "A `YearMonth`, or `null` when loose mode cannot read `input`."
```

```js
import { monthYear } from 'native-dates';

monthYear('11/26').toString(); // '2026-11'
monthYear('05/2028').toString(); // '2028-05'
monthYear(11, 26).toString(); // '2026-11'
monthYear('2026-11').toString(); // '2026-11'
```
:::

## Accepted inputs

Months run from 1 for January through 12 for December across numbers, strings, and fields objects.

| Input | Example | How it reads |
|---|---|---|
| ISO year-month string | `'2026-11'` | Reads the 4-digit year and 2-digit month directly, matching HTML month inputs. |
| Card expiry string | `monthYear('11/26')`, `monthYear('11.2026')` | Reads month first across `/`, `-`, or `.` and expands 2-digit years with `YearMonth.century`. |
| Two numbers | `yearMonth(2026, 11)`, `monthYear(11, 26)` | Takes whole numbers in year-then-month or month-then-year order. |
| Fields object | `{ year: 2026, month: 11 }` | Reads 1-indexed calendar fields and rejects months outside 1 through 12. |
| Date or timestamp | `'2026-11-16'`, `datetime(...)`, `new Date()` | Extracts the calendar month in the given zone or configured default and drops the day. |
| Loose month name | `'Nov 2026'`, `'2026 November'` | Reads English short or full month names with a 4-digit year in loose mode. |
| Temporal value | `Temporal.PlainYearMonth`, `Temporal.PlainDate` | Wraps ISO 8601 Temporal values directly. |

:::tip[Reading the current month]
Read the active calendar month in any time zone via [`today()`](/api/date-fn/#today), such as `today('Asia/Tokyo').yearMonth`.
:::
