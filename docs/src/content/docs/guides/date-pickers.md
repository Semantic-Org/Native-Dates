---
title: Date pickers and UI
lede: Connect browser inputs and date pickers to Native Dates while isolating legacy Date widgets at the UI boundary.
updated: 2026-11-24
---

Keep Native Dates values in your application state and domain logic.

Convert to ISO strings or native JavaScript dates only at the component boundary where a browser input or third-party widget expects them. That keeps timezone rules and calendar math separate from UI library quirks.

## Native HTML inputs

Native HTML date and time controls read and write standard ISO strings directly. They need no picker library and never shift a calendar day across time zones.

| Control | Writing to the input | Reading back into core |
|---|---|---|
| `<input type="date">` | `d.toString()` | Pass non-empty strings to [`date()`](/api/date-fn/) for a zone-free calendar day. |
| `<input type="time">` | `t.format('HH:mm')`, or `t.toString()` with `step="1"` | Pass `value` to [`time()`](/api/time-fn/) for a zone-free time of day. |
| `<input type="month">` | `ym.toString()` | Pass `value` to [`yearMonth()`](/api/year-month-fn/) for a billing period or card expiry. |
| `<input type="datetime-local">` | `dt.format('YYYY-MM-DDTHH:mm')` | Pass `value` and a zone to [`datetime()`](/api/datetime-fn/) for a specific moment. |

Bind your state to the input value and bounds, then parse the changed string back into its matching factory:

```js
import { date, time, today, yearMonth } from 'native-dates';

const due = date('2026-11-16');
const opens = time('9:30am');
const billing = yearMonth('2026-11');

// <input type="date" value={due.toString()} min={today().toString()}>
due.toString(); // '2026-11-16'

// <input type="time" value={opens.format('HH:mm')}>
opens.format('HH:mm'); // '09:30'

// <input type="month" value={billing.toString()}>
billing.toString(); // '2026-11'
```

When a form collects a day and a time of day in separate inputs, keep each control bound to its own type. Join them with [`at()`](/api/calendar-date/#at) when creating a moment:

```js
const rawDate = '2026-11-16';
const rawTime = '09:30';

const day = rawDate ? date(rawDate) : null;
const clock = rawTime ? time(rawTime) : null;
const startsAt = day && clock ? day.at(clock, 'America/Los_Angeles') : null;

startsAt?.toString(); // '2026-11-16T17:30:00.000Z'
```

:::warning[Guard empty inputs before parsing]
Clearing an HTML input emits an empty string, and typing into a text-backed picker can emit an invalid `Date`. Check for empty or `NaN` values before calling a factory, because core throws instead of defaulting to today.
:::

## React Day Picker

React Day Picker uses native JavaScript dates at local midnight to represent selected days. Keep a [`CalendarDate`](/api/calendar-date/) in state and convert at the props boundary:

```jsx
import { useState } from 'react';
import { DayPicker } from 'react-day-picker';
import { date, today } from 'native-dates';

function DueDateField() {
  const [due, setDue] = useState(() => date('2026-11-16'));

  return (
    <DayPicker
      mode="single"
      selected={due?.toJSDate()}
      disabled={{ before: today().toJSDate() }}
      onSelect={(picked) => setDue(picked ? date(picked) : null)}
    />
  );
}
```

For range selection, wrap the conversion in two small helpers and store a [`DateRange`](/api/ranges/). While a user is mid-selection, the end date may be undefined or match the start, so falling back to `picked.to ?? picked.from` keeps the range valid:

```js
import { date, dateRange } from 'native-dates';

function toPickerRange(range) {
  if (!range) return undefined;
  return { from: range.start.toJSDate(), to: range.end.toJSDate() };
}

function fromPickerRange(picked) {
  if (!picked?.from) return null;
  return dateRange(date(picked.from), date(picked.to ?? picked.from));
}

const stay = dateRange('2026-11-16', '2026-11-20');
const pickerValue = toPickerRange(stay);
const restored = fromPickerRange(pickerValue);

restored.count('days'); // 5
restored.toString(); // '2026-11-16/2026-11-20'
```

By default, [`toJSDate()`](/api/calendar-date/#tojsdate) and `date()` follow the browser's time zone. If your app overrides the default zone with [`configure()`](/api/configure/), pass the browser's active zone to both calls so the calendar grid stays aligned:

```js
const host = Intl.DateTimeFormat().resolvedOptions().timeZone;
const pickerDate = due.toJSDate(host);
const picked = date(pickerDate, host);
```

## MUI X and Date-based pickers

With `AdapterDateFns`, MUI X Date Pickers pass native JavaScript dates through value and change props. Keep that adapter inside `LocalizationProvider` and one thin wrapper component so legacy dates stay out of application state.

Text-backed pickers fire change handlers on every keystroke, passing an invalid `Date` while the user is still typing. Check `Number.isNaN()` before converting:

```jsx
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { date, today } from 'native-dates';

function CalendarDatePicker({ value, onChange, ...props }) {
  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <DatePicker
        {...props}
        value={value ? value.toJSDate() : null}
        minDate={today().toJSDate()}
        onChange={(next) => {
          if (!next || Number.isNaN(next.getTime())) {
            onChange(null);
            return;
          }
          onChange(date(next));
        }}
      />
    </LocalizationProvider>
  );
}
```

Use the same boundary helper for a datetime picker, passing an explicit IANA zone into [`datetime()`](/api/datetime-fn/) so the returned moment stays anchored:

```js
import { datetime } from 'native-dates';

function fromPickerMoment(next, zone) {
  if (!next || Number.isNaN(next.getTime())) return null;
  return datetime(next, zone);
}

const meeting = fromPickerMoment(new Date('2026-11-16T17:30:00Z'), 'America/Los_Angeles');
meeting.format('short', 'en-US'); // '11/16/26, 9:30 AM'
```

## Forms and schema validation

Form tools like React Hook Form and Zod work cleanly when fields stay strings during editing. Parse them into typed values during schema validation.

For strict ISO controls, transform each string inside your schema and run domain checks directly on the parsed types:

```js
import { z } from 'zod';
import { date } from 'native-dates';

const isoDate = z.string().transform((raw, ctx) => {
  try {
    return date(raw);
  } catch {
    ctx.addIssue({ code: 'custom', message: 'Enter a valid YYYY-MM-DD date' });
    return z.NEVER;
  }
});

const bookingSchema = z
  .object({ checkIn: isoDate, checkOut: isoDate })
  .refine(({ checkIn, checkOut }) => checkOut.isAfter(checkIn), {
    message: 'Check-out must come after check-in',
    path: ['checkOut'],
  });
```

When users type informal dates like Nov 16, 2026 into a text box, load the [loose plugin](/plugins/loose/) and pass `{ loose: true }`. Unreadable strings return `null` instead of throwing, removing the need for an error block:

```js
import '@native-dates/plugins/loose';
import { date, isCalendarDate } from 'native-dates';

function parseTypedDate(raw, locale = 'en-US') {
  const parsed = date(raw, { loose: true, locale });
  return isCalendarDate(parsed) ? parsed : null;
}

parseTypedDate('Nov 16, 2026')?.toString(); // '2026-11-16'
parseTypedDate('not a date'); // null
```

Type guards like [`isCalendarDate()`](/api/kind-of/) and `isDateTime()` also plug directly into custom schema rules when validating already-parsed state.

## Charts, tables, and read-only Date views

Charts and data tables often read timestamps through native getters like `getTime()` and `getHours()`.

Import the [legacy-date plugin](/plugins/legacy-date/) once at startup to attach those read-only getters onto [`DateTime`](/api/date-time/). Local getters evaluate in the instance's own zone rather than the host machine's zone, while mutating setters throw:

```js
import '@native-dates/plugins/legacy-date';
import { compare, datetime } from 'native-dates';

const rows = [
  { id: 'b', createdAt: datetime('2026-11-16T18:00:00Z', 'America/New_York') },
  { id: 'a', createdAt: datetime('2026-11-16T14:30:00Z', 'America/New_York') },
];

// Pass DateTime values to read-only Date accessors
rows[0].createdAt.getHours(); // 13
rows[0].createdAt.getTime(); // 1794852000000

// Sort rows by any single core type
const sorted = [...rows].sort((a, b) => compare(a.createdAt, b.createdAt));
sorted[0].id; // 'a'
```

Call [`compare()`](/api/compare/) inside your table's sort comparator for any column holding one kind, such as all dates or all moments. Mixing different kinds in one comparison throws an error.

:::tip[When a widget checks instanceof Date]
The legacy-date plugin extends `DateTime` only and never spoofs native date identity. If a chart or table checks object identity or mutates values in place, pass `dt.toJSDate()` or `dt.epochMilliseconds` at the series boundary instead.
:::

## Submitting to APIs and databases

Once form values are parsed at the UI edge, pass them straight into `JSON.stringify()` with no manual conversion. See [Storing and sending](/guides/storing-and-sending/) for ISO wire formats and round-tripping JSON or database rows back into factories.
