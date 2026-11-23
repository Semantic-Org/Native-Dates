import type { CalendarDate } from './calendar-date.js';
import type { Duration, DurationInput } from './duration.js';
import type { FormatSpec } from './helpers/format.js';
import { IS_DATE_TIME } from './helpers/identity.js';
import type {
  DateTimeFieldUnit,
  DayOfWeek,
  RoundUnit,
  TemporalInstant,
  TemporalPlainDate,
  TemporalPlainDateTime,
  TemporalZonedDateTime,
  Unit,
} from './helpers/units.js';
import type { Locale, ReadOptions, Zone } from './helpers/zones.js';
import type { MonthDay } from './month-day.js';
import type { DateTimeRange } from './range.js';
import type { Time, TimeInput } from './time.js';
import type { YearMonth } from './year-month.js';

/**
 * Singular calendar and clock fields accepted when creating or updating a `DateTime` or `CalendarDate`.
 *
 * @see {@link https://nativedates.dev/api/date-time/#set set}
 */
export interface DateTimeFields {
  /** Calendar year, such as 2026. */
  year?: number;
  /** Calendar month from 1 for January through 12 for December. */
  month?: number;
  /** Day of the month from 1 through 31. */
  day?: number;
  /** 24-hour clock hour from 0 through 23. */
  hour?: number;
  /** Clock minute from 0 through 59. */
  minute?: number;
  /** Clock second from 0 through 59. */
  second?: number;
  /** Millisecond from 0 through 999. */
  millisecond?: number;
  /** Microsecond from 0 through 999. */
  microsecond?: number;
  /** Nanosecond from 0 through 999. */
  nanosecond?: number;
}

/**
 * Any input accepted by `datetime()`: an ISO string, epoch millisecond number, native `Date`,
 * fields object, calendar date, moment, or `Temporal` value.
 *
 * @see {@link https://nativedates.dev/api/datetime-fn/#accepted-inputs Accepted inputs}
 */
export type DateTimeInput =
  | DateTime
  | CalendarDate
  | Date
  | number
  | string
  | DateTimeFields
  | TemporalZonedDateTime
  | TemporalInstant
  | TemporalPlainDateTime
  | TemporalPlainDate;

/**
 * A specific moment in time viewed in a time zone, for timestamps, meetings, and deadlines.
 *
 * Instances are immutable: every method that updates fields, shifts the zone, or steps through
 * time returns a new `DateTime`. Calling `toString()` or `toJSON()` serializes the instant in UTC.
 *
 * @example
 * ```ts
 * import { date, datetime, now } from 'native-dates';
 *
 * const standup = date('2026-11-16').at('9:30am', 'America/Los_Angeles');
 * standup.in('Europe/Berlin').hour; // 18
 *
 * const current = now();
 * const parsed = datetime('2026-11-16T17:30:00Z', 'America/New_York');
 * ```
 *
 * @see {@link https://nativedates.dev/api/date-time/ DateTime Documentation}
 */
export class DateTime {
  /** @internal */
  readonly [IS_DATE_TIME]: true;

  /**
   * Creates a new `DateTime` viewed in the given or configured time zone.
   * Prefer the `datetime()` factory or `now()` in everyday code.
   *
   * @param input - ISO string, epoch milliseconds, `Date`, `CalendarDate`, fields object, or `Temporal` value
   * @param zone - Time zone to view the moment in, defaulting to the configured zone
   *
   * @see {@link https://nativedates.dev/api/date-time/#creating-a-datetime Creating a DateTime}
   */
  constructor(input: DateTimeInput, zone?: Zone);
  /**
   * Creates a new `DateTime` with options such as `zone` and `locale`.
   *
   * @param input - ISO string, epoch milliseconds, `Date`, `CalendarDate`, fields object, or `Temporal` value
   * @param options - Zone and locale options for reading the value
   *
   * @see {@link https://nativedates.dev/api/date-time/#creating-a-datetime Creating a DateTime}
   */
  constructor(input: DateTimeInput, options?: ReadOptions);

  /** Locale-formatted date, time, and short zone name, such as `'Nov 16, 2026, 9:30 AM PST'`. */
  readonly text: string;
  /** Calendar month in this time zone, from 1 for January through 12 for December. */
  readonly month: number;
  /** Day of the month in this time zone, from 1 through 31. */
  readonly day: number;
  /** Calendar year in this time zone, such as 2026. */
  readonly year: number;
  /** ISO day of the week in this time zone, from 1 for Monday through 7 for Sunday. */
  readonly dayOfWeek: number;
  /** First day of this moment's weeks (1–7), following `configure()` or its active locale. */
  readonly weekStart: number;
  /** 24-hour clock hour in this time zone, from 0 through 23. */
  readonly hour: number;
  /** Clock minute in this time zone, from 0 through 59. */
  readonly minute: number;
  /** Clock second in this time zone, from 0 through 59. */
  readonly second: number;
  /** Millisecond field, from 0 through 999. */
  readonly millisecond: number;
  /** Microsecond field, from 0 through 999. */
  readonly microsecond: number;
  /** Nanosecond field, from 0 through 999. */
  readonly nanosecond: number;
  /** Canonical IANA zone ID or fixed UTC offset, such as `'America/Los_Angeles'` or `'UTC'`. */
  readonly zone: string;
  /** Active UTC offset at this instant, such as `'-08:00'` or `'+05:30'`. */
  readonly offset: string;
  /** Whole seconds since the Unix epoch in UTC, rounded down. */
  readonly epochSeconds: number;
  /** Milliseconds since the Unix epoch in UTC, matching `Date.now()`. */
  readonly epochMilliseconds: number;
  /** Exact nanoseconds since the Unix epoch in UTC as a `bigint`. */
  readonly epochNanoseconds: bigint;
  /** Calendar quarter in this time zone, from 1 through 4. */
  readonly quarter: number;
  /** Day of the year in this time zone, from 1 through 366. */
  readonly dayOfYear: number;
  /** ISO week number of the year, from 1 through 53. */
  readonly weekOfYear: number;
  /** Number of days in the current local month (28–31). */
  readonly daysInMonth: number;
  /** Number of days in the current local year (365 or 366). */
  readonly daysInYear: number;
  /** Length of the local calendar day in hours (`23`, `24`, or 25 across daylight saving transitions). */
  readonly hoursInDay: number;

  /**
   * Returns true when the local calendar year in this time zone has 366 days.
   *
   * @returns `true` if the local year is a leap year
   *
   * @see {@link https://nativedates.dev/api/date-time/#calendar-predicates Calendar predicates}
   */
  isLeapYear(): boolean;

  /**
   * Returns true when this moment falls on a weekend day of its active locale in its time zone: Saturday and
   * Sunday in most, Friday and Saturday in `'ar-SA'`, and Friday alone in `'fa-IR'`.
   *
   * @returns `true` on the locale's weekend days
   *
   * @see {@link https://nativedates.dev/api/date-time/#calendar-predicates Calendar predicates}
   */
  isWeekend(): boolean;

  /**
   * Returns true when this moment falls outside the weekend of its active locale in its time zone.
   *
   * @returns `true` on the locale's working days
   *
   * @see {@link https://nativedates.dev/api/date-time/#calendar-predicates Calendar predicates}
   */
  isWeekday(): boolean;

  /** Calendar date in this time zone. */
  readonly date: CalendarDate;
  /** Time of day in this time zone. */
  readonly time: Time;

  /**
   * Converts this moment to a `CalendarDate` in its active time zone inside a method chain.
   *
   * @param kind - Target kind `'date'`
   * @returns Local `CalendarDate` in this moment's time zone
   *
   * @example
   * ```ts
   * const standup = datetime('2026-11-16T09:30', 'America/Los_Angeles');
   * standup.in('Asia/Tokyo').as('date').toString(); // '2026-11-17'
   * standup.in('Asia/Tokyo').as('time').toString(); // '02:30:00'
   * ```
   *
   * @see {@link https://nativedates.dev/api/date-time/#as as}
   */
  as(kind: 'date'): CalendarDate;
  /**
   * Converts this moment to a `Time` in its active time zone inside a method chain.
   *
   * @param kind - Target kind `'time'`
   * @returns Local `Time` in this moment's time zone
   *
   * @see {@link https://nativedates.dev/api/date-time/#as as}
   */
  as(kind: 'time'): Time;
  /**
   * Returns this `DateTime` unchanged when `'datetime'` is requested in generic chains.
   *
   * @param kind - Target kind `'datetime'`
   * @returns This `DateTime` instance
   *
   * @see {@link https://nativedates.dev/api/date-time/#as as}
   */
  as(kind: 'datetime'): DateTime;
  /**
   * Extracts the recurring `MonthDay` in this moment's active time zone.
   *
   * @param kind - Target kind `'monthDay'`
   * @returns Local `MonthDay` with the year dropped
   *
   * @see {@link https://nativedates.dev/api/date-time/#as as}
   */
  as(kind: 'monthDay'): MonthDay;
  /**
   * Extracts the `YearMonth` in this moment's active time zone.
   *
   * @param kind - Target kind `'yearMonth'`
   * @returns Local `YearMonth` with the day dropped
   *
   * @see {@link https://nativedates.dev/api/date-time/#as as}
   */
  as(kind: 'yearMonth'): YearMonth;

  /** Calendar month and day in this time zone, with the year dropped. */
  readonly monthDay: MonthDay;
  /** Calendar year and month in this time zone, with the day dropped. */
  readonly yearMonth: YearMonth;

  /**
   * Moves forward by a duration and returns a new `DateTime` in the same time zone.
   *
   * Adding calendar units such as days or months keeps the same local time of day across
   * daylight saving transitions. Adding hours, minutes, or seconds counts exact elapsed time.
   *
   * @param amount - Numeric count paired with `unit`, `Duration`, phrase, ISO string, fields object, or milliseconds
   * @param unit - Unit name when `amount` is a number, such as `'days'` or `'hours'`
   * @returns A new `DateTime` in the same time zone
   *
   * @example
   * ```ts
   * // Spring-forward weekend in New York (March 8 has 23 hours)
   * const sat = datetime('2026-03-07T09:00', 'America/New_York');
   * sat.plus(1, 'day').hour; // 9
   * sat.plus(24, 'hours').hour; // 10
   * sat.plus('1h 30m').format('time', 'en-US'); // '10:30 AM'
   * ```
   *
   * @see {@link https://nativedates.dev/api/date-time/#plus plus}
   */
  plus(amount: DurationInput, unit?: Unit): DateTime;

  /**
   * Alias for `plus()` that moves forward by a duration in the same time zone.
   *
   * @param amount - Numeric count paired with `unit`, `Duration`, phrase, ISO string, fields object, or milliseconds
   * @param unit - Unit name when `amount` is a number, such as `'days'` or `'hours'`
   * @returns A new `DateTime` in the same time zone
   *
   * @see {@link https://nativedates.dev/api/date-time/#plus plus}
   */
  add(amount: DurationInput, unit?: Unit): DateTime;

  /**
   * Moves backward by a duration and returns a new `DateTime` in the same time zone.
   *
   * @param amount - Numeric count paired with `unit`, `Duration`, phrase, ISO string, fields object, or milliseconds
   * @param unit - Unit name when `amount` is a number, such as `'days'` or `'hours'`
   * @returns A new `DateTime` in the same time zone
   *
   * @example
   * ```ts
   * const deadline = datetime('2026-11-16T17:00', 'America/New_York');
   * deadline.minus(48, 'hours').day; // 14
   * deadline.minus({ weeks: 1, days: 2 }).day; // 7
   * ```
   *
   * @see {@link https://nativedates.dev/api/date-time/#minus minus}
   */
  minus(amount: DurationInput, unit?: Unit): DateTime;

  /**
   * Alias for `minus()` that moves backward by a duration in the same time zone.
   *
   * @param amount - Numeric count paired with `unit`, `Duration`, phrase, ISO string, fields object, or milliseconds
   * @param unit - Unit name when `amount` is a number, such as `'days'` or `'hours'`
   * @returns A new `DateTime` in the same time zone
   *
   * @see {@link https://nativedates.dev/api/date-time/#minus minus}
   */
  subtract(amount: DurationInput, unit?: Unit): DateTime;

  /**
   * Returns a new `DateTime` with one or more local calendar or clock fields replaced.
   * Out-of-range dates such as February 30 throw a `RangeError` instead of rolling into the next month.
   * Updating `month` or `year` without `day` clamps an overflowing day to the end of the target month.
   *
   * @param fields - Calendar or clock fields to replace in the current time zone
   * @returns A new `DateTime` in the same time zone with updated fields
   *
   * @example
   * ```ts
   * const cutoff = datetime('2026-11-16T09:30', 'America/New_York');
   * cutoff.set({ month: 12, day: 1, hour: 0, minute: 0 });
   * cutoff.set('hour', 17);
   * ```
   *
   * @see {@link https://nativedates.dev/api/date-time/#set set}
   */
  set(fields: DateTimeFields): DateTime;
  /**
   * Returns a new `DateTime` with a single calendar or clock field replaced.
   *
   * @param unit - Field unit name to replace, such as `'hour'` or `'day'`
   * @param value - Whole-number value for `unit`
   * @returns A new `DateTime` in the same time zone with the updated field
   *
   * @example
   * ```ts
   * datetime('2026-11-16T09:30', 'UTC').set('hour', 17).hour; // 17
   * ```
   *
   * @see {@link https://nativedates.dev/api/date-time/#set set}
   */
  set(unit: DateTimeFieldUnit, value: number): DateTime;

  /**
   * Returns a new `DateTime` on the same local date and time zone with the time of day replaced.
   *
   * @param time - Time string such as `'5:00pm'`, `Time` instance, fields object, or `Date`
   * @param options - Optional `disambiguation` and `locale` options
   * @returns A new `DateTime` on the same date and time zone at `time`
   *
   * @example
   * ```ts
   * const morning = datetime('2026-11-16T09:30', 'America/Los_Angeles');
   * morning.at('5:00pm').hour; // 17
   * ```
   *
   * @see {@link https://nativedates.dev/api/date-time/#at at}
   */
  at(time: TimeInput, options?: Omit<ReadOptions, 'zone'>): DateTime;

  /**
   * Returns a new `DateTime` representing the exact same moment viewed in another time zone.
   * Local calendar and clock properties update to match `zone` while the timestamp stays identical.
   *
   * @param zone - Target IANA time zone name, fixed UTC offset, or `'UTC'`
   * @returns A new `DateTime` at the same instant viewed in `zone`
   *
   * @example
   * ```ts
   * const standup = datetime('2026-11-16T09:30', 'America/Los_Angeles');
   * const berlin = standup.in('Europe/Berlin');
   * berlin.hour; // 18
   * berlin.equals(standup); // true
   * ```
   *
   * @see {@link https://nativedates.dev/api/date-time/#in in}
   */
  in(zone: Zone): DateTime;

  /**
   * Moves back to the start of a calendar or clock unit in this time zone.
   * Week boundaries start on `firstDay`, the configured `weekStart`, or this moment's active locale.
   *
   * @param unit - Calendar or clock unit from `'year'` down to `'millisecond'`
   * @param firstDay - First day of the week when `unit` is `'week'`, such as `'sunday'` or 7
   * @returns A new `DateTime` at the start of `unit`
   *
   * @example
   * ```ts
   * const wed = datetime('2026-11-18T14:45:12', 'America/New_York').locale('en-US');
   * wed.startOf('day').format('time'); // '12:00 AM'
   * wed.startOf('week').day; // 15
   * wed.startOf('week', 'monday').day; // 16
   * ```
   *
   * @see {@link https://nativedates.dev/api/date-time/#startof startOf}
   */
  startOf(unit: Unit, firstDay?: DayOfWeek): DateTime;

  /**
   * Moves to the final millisecond of a calendar or clock unit in this time zone.
   * For timestamp query bounds, prefer `range(unit)` so the end boundary is exclusive.
   *
   * @param unit - Calendar or clock unit from `'year'` down to `'nanosecond'`
   * @param firstDay - First day of the week when `unit` is `'week'`
   * @returns A new `DateTime` at the last millisecond of `unit`
   *
   * @example
   * ```ts
   * datetime('2026-11-18T14:45', 'UTC').endOf('month').toString(); // '2026-11-30T23:59:59.999Z'
   * ```
   *
   * @see {@link https://nativedates.dev/api/date-time/#endof endOf}
   */
  endOf(unit: Unit, firstDay?: DayOfWeek): DateTime;

  /**
   * Moves forward to the start of the calendar or clock unit after the one containing this moment, in this time zone.
   * The result is always later than this moment, so from midnight the next day starts at the following midnight.
   * A weekday name in place of a unit returns the start of the next day with that name, whereas `next()` keeps the time of day.
   *
   * @param unit - Calendar or clock unit from `'year'` down to `'nanosecond'`, or a weekday name such as `'wednesday'`
   * @param firstDay - First day of the week when `unit` is `'week'`, such as `'sunday'` or 7
   * @returns A new `DateTime` at the start of the next `unit`, or of the next given weekday
   *
   * @example
   * ```ts
   * const standup = datetime('2026-11-16T09:30', 'America/New_York');
   * standup.startOfNext('month').toString(); // '2026-12-01T05:00:00.000Z'
   * standup.startOfNext('hour').hour; // 10
   * standup.startOfNext('wednesday').toString(); // '2026-11-18T05:00:00.000Z'
   * ```
   *
   * @see {@link https://nativedates.dev/api/date-time/#startofnext startOfNext}
   */
  startOfNext(unit: Unit | Exclude<DayOfWeek, number>, firstDay?: DayOfWeek): DateTime;

  /**
   * Moves back to the start of the calendar or clock unit before the one containing this moment, in this time zone.
   * A weekday name in place of a unit returns the start of the previous day with that name, whereas `previous()` keeps the time of day.
   *
   * @param unit - Calendar or clock unit from `'year'` down to `'nanosecond'`, or a weekday name such as `'wednesday'`
   * @param firstDay - First day of the week when `unit` is `'week'`, such as `'sunday'` or 7
   * @returns A new `DateTime` at the start of the previous `unit`, or of the previous given weekday
   *
   * @example
   * ```ts
   * const standup = datetime('2026-11-16T09:30', 'America/New_York');
   * standup.startOfPrevious('day').toString(); // '2026-11-15T05:00:00.000Z'
   * standup.startOfPrevious('hour').hour; // 8
   * standup.startOfPrevious('wednesday').toString(); // '2026-11-11T05:00:00.000Z'
   * ```
   *
   * @see {@link https://nativedates.dev/api/date-time/#startofprevious startOfPrevious}
   */
  startOfPrevious(unit: Unit | Exclude<DayOfWeek, number>, firstDay?: DayOfWeek): DateTime;

  /**
   * Rounds to the nearest calendar day or clock unit, with half-way ties rounding up.
   *
   * @param unit - Unit to round to, from `'day'` down to `'nanosecond'`
   * @returns A new rounded `DateTime` in the same time zone
   *
   * @example
   * ```ts
   * const stamp = datetime('2026-11-16T09:23:40', 'UTC');
   * stamp.round('hour').toString(); // '2026-11-16T09:00:00.000Z'
   * stamp.round(15, 'minutes').toString(); // '2026-11-16T09:30:00.000Z'
   * ```
   *
   * @see {@link https://nativedates.dev/api/date-time/#round round}
   */
  round(unit: RoundUnit): DateTime;
  /**
   * Rounds to the nearest step increment of `unit`, with half-way ties rounding up.
   *
   * @param increment - Step size that divides evenly into the next larger unit
   * @param unit - Unit to round, from `'day'` down to `'nanosecond'`
   * @returns A new rounded `DateTime` in the same time zone
   *
   * @example
   * ```ts
   * datetime('2026-11-16T09:23:40', 'UTC').round(15, 'minutes').toString(); // '2026-11-16T09:30:00.000Z'
   * ```
   *
   * @see {@link https://nativedates.dev/api/date-time/#round round}
   */
  round(increment: number, unit: RoundUnit): DateTime;

  /**
   * Rounds down to the start of a calendar day or clock unit.
   *
   * @param unit - Unit to round down to, from `'day'` down to `'nanosecond'`
   * @returns A new `DateTime` rounded down in the same time zone
   *
   * @example
   * ```ts
   * datetime('2026-11-16T09:29:00Z').floor(15, 'minutes').toString(); // '2026-11-16T09:15:00.000Z'
   * ```
   *
   * @see {@link https://nativedates.dev/api/date-time/#floor floor}
   */
  floor(unit: RoundUnit): DateTime;
  /**
   * Rounds down to the start of a step increment of `unit`.
   *
   * @param increment - Step size that divides evenly into the next larger unit
   * @param unit - Unit to round down, from `'day'` down to `'nanosecond'`
   * @returns A new `DateTime` rounded down in the same time zone
   *
   * @see {@link https://nativedates.dev/api/date-time/#floor floor}
   */
  floor(increment: number, unit: RoundUnit): DateTime;

  /**
   * Rounds up to the next calendar day or clock unit boundary.
   *
   * @param unit - Unit to round up to, from `'day'` down to `'nanosecond'`
   * @returns A new `DateTime` rounded up in the same time zone
   *
   * @example
   * ```ts
   * datetime('2026-11-16T09:01:00Z').ceil(15, 'minutes').toString(); // '2026-11-16T09:15:00.000Z'
   * ```
   *
   * @see {@link https://nativedates.dev/api/date-time/#ceil ceil}
   */
  ceil(unit: RoundUnit): DateTime;
  /**
   * Rounds up to the next step increment of `unit`.
   *
   * @param increment - Step size that divides evenly into the next larger unit
   * @param unit - Unit to round up, from `'day'` down to `'nanosecond'`
   * @returns A new `DateTime` rounded up in the same time zone
   *
   * @see {@link https://nativedates.dev/api/date-time/#ceil ceil}
   */
  ceil(increment: number, unit: RoundUnit): DateTime;

  /**
   * Moves forward to the next given weekday at the same time of day.
   * When already on that weekday, advances a full week to the following occurrence.
   *
   * @param dayOfWeek - Weekday name such as `'friday'`, three-letter prefix, or ISO number (1–7)
   * @returns A new `DateTime` on the next matching weekday at the same local time
   *
   * @example
   * ```ts
   * const mon = datetime('2026-11-16T09:30', 'America/Los_Angeles');
   * mon.next('friday').day; // 20
   * mon.next('monday').day; // 23
   * ```
   *
   * @see {@link https://nativedates.dev/api/date-time/#next next}
   */
  next(dayOfWeek: DayOfWeek): DateTime;

  /**
   * Moves back to the most recent given weekday before this date at the same time of day.
   *
   * @param dayOfWeek - Weekday name such as `'friday'`, three-letter prefix, or ISO number (1–7)
   * @returns A new `DateTime` on the previous matching weekday at the same local time
   *
   * @example
   * ```ts
   * datetime('2026-11-16T09:30', 'America/Los_Angeles').previous('friday').day; // 13
   * ```
   *
   * @see {@link https://nativedates.dev/api/date-time/#previous previous}
   */
  previous(dayOfWeek: DayOfWeek): DateTime;

  /**
   * Moves forward to the next occurrence of a recurring `MonthDay` after this date at the same time of day.
   *
   * @param monthDay - Recurring annual month and day, such as `monthDay(12, 25)`
   * @returns A new `DateTime` on the next occurrence at the same local time
   *
   * @see {@link https://nativedates.dev/api/date-time/#next next}
   */
  next(monthDay: MonthDay): DateTime;

  /**
   * Moves back to the most recent occurrence of a recurring `MonthDay` before this date at the same time of day.
   *
   * @param monthDay - Recurring annual month and day, such as `monthDay(10, 31)`
   * @returns A new `DateTime` on the previous occurrence at the same local time
   *
   * @see {@link https://nativedates.dev/api/date-time/#previous previous}
   */
  previous(monthDay: MonthDay): DateTime;

  /**
   * Creates a half-open `DateTimeRange` starting at this moment and ending before `end`
   * or across a duration. Throws a `RangeError` if the end is earlier than the start.
   *
   * @param end - Target end moment or duration length
   * @returns A half-open `DateTimeRange` in this moment's time zone
   *
   * @example
   * ```ts
   * const standup = datetime('2026-11-16T09:30', 'America/Los_Angeles');
   * standup.to('2026-11-16T10:00').duration.minutes; // 30
   * ```
   *
   * @see {@link https://nativedates.dev/api/date-time/#to to}
   */
  to(end: DateTimeInput | DurationInput): DateTimeRange;
  /**
   * Creates a half-open `DateTimeRange` starting at this moment and running for `count` of `unit`.
   *
   * @param count - Positive span count
   * @param unit - Unit name for `count`, such as `'minutes'` or `'hours'`
   * @returns A half-open `DateTimeRange` in this moment's time zone
   *
   * @see {@link https://nativedates.dev/api/date-time/#to to}
   */
  to(count: number, unit: Unit): DateTimeRange;

  /**
   * Creates a half-open `DateTimeRange` starting at this moment and lasting for `length`.
   *
   * @param length - Duration instance, phrase such as `'90m'`, ISO duration, or units object
   * @returns A half-open `DateTimeRange` in this moment's time zone
   *
   * @example
   * ```ts
   * const standup = datetime('2026-11-16T09:30', 'America/Los_Angeles');
   * standup.for(90, 'minutes').end.hour; // 11
   * ```
   *
   * @see {@link https://nativedates.dev/api/date-time/#to to}
   */
  for(length: Exclude<DurationInput, number>): DateTimeRange;
  /**
   * Creates a half-open `DateTimeRange` starting at this moment and lasting for `count` of `unit`.
   *
   * @param count - Positive span count
   * @param unit - Unit name for `count`, such as `'minutes'` or `'hours'`
   * @returns A half-open `DateTimeRange` in this moment's time zone
   *
   * @example
   * ```ts
   * datetime('2026-11-16T09:30', 'America/Los_Angeles').for(90, 'minutes').end.hour; // 11
   * ```
   *
   * @see {@link https://nativedates.dev/api/date-time/#to to}
   */
  for(count: number, unit: Unit): DateTimeRange;

  /**
   * Returns the half-open `DateTimeRange` for the calendar or clock unit containing this moment,
   * running from the start of `unit` until the start of the next unit.
   *
   * @param unit - Enclosing calendar or clock unit from `'year'` down to `'nanosecond'`
   * @param firstDay - First day of the week when `unit` is `'week'`
   * @returns A half-open `DateTimeRange` spanning `unit` in this time zone
   *
   * @example
   * ```ts
   * datetime('2026-11-16T14:45', 'UTC').range('day').toString();
   * // '2026-11-16T00:00:00.000Z/2026-11-17T00:00:00.000Z'
   * ```
   *
   * @see {@link https://nativedates.dev/api/date-time/#range range}
   */
  range(unit: Unit, firstDay?: DayOfWeek): DateTimeRange;

  /**
   * Returns true when both values represent the exact same instant, regardless of time zone.
   *
   * @param other - Another `DateTime` or any input accepted by `datetime()`
   * @returns `true` if both values point to the same instant
   *
   * @example
   * ```ts
   * const ny = datetime('2026-11-16T12:00', 'America/New_York');
   * ny.equals(datetime('2026-11-16T17:00Z', 'UTC')); // true
   * ```
   *
   * @see {@link https://nativedates.dev/api/date-time/#equals equals}
   */
  equals(other: DateTimeInput): boolean;

  /**
   * Returns true if this moment is earlier than `other`.
   *
   * @param other - Moment to compare against
   * @returns `true` when this moment comes before `other`
   *
   * @example
   * ```ts
   * datetime('2026-11-16T16:59Z').isBefore('2026-11-16T17:00Z'); // true
   * ```
   *
   * @see {@link https://nativedates.dev/api/date-time/#isbefore isBefore}
   */
  isBefore(other: DateTimeInput): boolean;

  /**
   * Returns true if this moment is later than `other`.
   *
   * @param other - Moment to compare against
   * @returns `true` when this moment comes after `other`
   *
   * @example
   * ```ts
   * datetime('2026-11-16T17:01Z').isAfter('2026-11-16T17:00Z'); // true
   * ```
   *
   * @see {@link https://nativedates.dev/api/date-time/#isafter isAfter}
   */
  isAfter(other: DateTimeInput): boolean;

  /**
   * Checks whether `other` falls in the same calendar or clock unit when both moments are viewed
   * in this instance's time zone. Calling without `unit` checks exact instant equality.
   *
   * @param other - Moment to compare against, viewed in this instance's time zone
   * @param unit - Calendar or clock unit to compare, such as `'day'` or `'month'`
   * @param firstDay - First day of the week when `unit` is `'week'`
   * @returns `true` when both moments share the same `unit` in this time zone
   *
   * @example
   * ```ts
   * const la = datetime('2026-11-16T09:30', 'America/Los_Angeles');
   * la.isSame('2026-11-17T02:00Z', 'day'); // true (6:00 PM Nov 16 in Los Angeles)
   * ```
   *
   * @see {@link https://nativedates.dev/api/date-time/#issame isSame}
   */
  isSame(other: DateTimeInput, unit?: Unit, firstDay?: DayOfWeek): boolean;

  /**
   * Returns true if this instant is earlier than the current time.
   *
   * @returns `true` when in the past
   *
   * @see {@link https://nativedates.dev/api/date-time/#calendar-predicates Calendar predicates}
   */
  isPast(): boolean;

  /**
   * Returns true if this instant is later than the current time.
   *
   * @returns `true` when in the future
   *
   * @see {@link https://nativedates.dev/api/date-time/#calendar-predicates Calendar predicates}
   */
  isFuture(): boolean;

  /**
   * Returns true if the local calendar date matches today in this moment's time zone.
   *
   * @returns `true` when on today's local date
   *
   * @see {@link https://nativedates.dev/api/date-time/#calendar-predicates Calendar predicates}
   */
  isToday(): boolean;

  /**
   * Returns true if the local calendar date matches tomorrow in this moment's time zone.
   *
   * @returns `true` when on tomorrow's local date
   *
   * @see {@link https://nativedates.dev/api/date-time/#calendar-predicates Calendar predicates}
   */
  isTomorrow(): boolean;

  /**
   * Returns true if the local calendar date matches yesterday in this moment's time zone.
   *
   * @returns `true` when on yesterday's local date
   *
   * @see {@link https://nativedates.dev/api/date-time/#calendar-predicates Calendar predicates}
   */
  isYesterday(): boolean;

  /**
   * Measures the span from this moment to `other` as a `Duration` counted in days and clock units,
   * returning a negative duration when `other` is earlier. Remembers this starting moment
   * so `balance('year')` and `total('months')` can compute calendar months and years.
   *
   * @param other - Target moment to measure toward
   * @returns A signed `Duration` from this moment to `other`
   *
   * @example
   * ```ts
   * const doors = datetime('2026-11-16T08:00', 'America/Los_Angeles');
   * const standup = datetime('2026-11-16T09:30', 'America/Los_Angeles');
   * doors.until(standup).format('long', 'en-US'); // '1 hour, 30 minutes'
   * doors.until(standup, 'hours'); // 1.5
   * ```
   *
   * @see {@link https://nativedates.dev/api/date-time/#until until}
   */
  until(other: DateTimeInput): Duration;
  /**
   * Measures the span from this moment to `other` as a floating-point count in `unit`.
   *
   * @param other - Target moment to measure toward
   * @param unit - Unit to express the total length in, such as `'hours'` or `'minutes'`
   * @returns Signed total length in `unit`
   *
   * @example
   * ```ts
   * datetime('2026-11-16T08:00', 'UTC').until('2026-11-16T09:30Z', 'hours'); // 1.5
   * ```
   *
   * @see {@link https://nativedates.dev/api/date-time/#until until}
   */
  until(other: DateTimeInput, unit: Unit): number;

  /**
   * Measures the span elapsed since an earlier moment as a `Duration` counted in days and clock units.
   *
   * @param other - Earlier moment to measure from
   * @returns A signed `Duration` from `other` to this moment
   *
   * @example
   * ```ts
   * datetime('2026-11-16T09:30', 'America/Los_Angeles').since('2026-11-16T08:00').minutes; // 30
   * ```
   *
   * @see {@link https://nativedates.dev/api/date-time/#since since}
   */
  since(other: DateTimeInput): Duration;
  /**
   * Measures the span elapsed since `other` as a floating-point count in `unit`.
   *
   * @param other - Earlier moment to measure from
   * @param unit - Unit to express the elapsed length in, such as `'minutes'` or `'days'`
   * @returns Signed elapsed length in `unit`
   *
   * @example
   * ```ts
   * datetime('2026-11-16T09:30', 'America/Los_Angeles').since('2026-11-16T08:00', 'minutes'); // 90
   * ```
   *
   * @see {@link https://nativedates.dev/api/date-time/#since since}
   */
  since(other: DateTimeInput, unit: Unit): number;

  /**
   * Formats the date and time in its active zone using built-in presets, custom names from
   * `configure()`, `Intl.DateTimeFormatOptions` objects, or token patterns.
   *
   * @param spec - Preset name (default `'medium'`), custom format name, `Intl` options bag, or token pattern
   * @param locale - BCP 47 locale tag overriding this moment's or the configured locale for one call
   * @returns Formatted string in this moment's time zone
   *
   * @example
   * ```ts
   * const standup = datetime('2026-11-16T09:30', 'America/Los_Angeles');
   * standup.format('medium', 'en-US'); // 'Nov 16, 2026, 9:30 AM'
   * standup.format('text', 'en-US'); // 'Nov 16, 2026, 9:30 AM PST'
   * standup.format('YYYY-MM-DD HH:mm'); // '2026-11-16 09:30'
   * standup.format({ weekday: 'short', hour: '2-digit', minute: '2-digit' }, 'de-DE'); // 'Mo., 09:30'
   * ```
   *
   * @see {@link https://nativedates.dev/api/date-time/#format format}
   */
  format(spec?: FormatSpec, locale?: Locale): string;

  /**
   * Reads the BCP 47 locale tag carried on this moment, or `undefined` when none was set.
   *
   * @returns Active locale tag carried on this value, or `undefined`
   *
   * @see {@link https://nativedates.dev/api/date-time/#locale locale}
   */
  locale(): Locale | undefined;
  /**
   * Returns a copy of this moment carrying `tag` for formatting, week boundaries, and derived values.
   * Passing an empty tag or `null` clears the carried locale.
   *
   * @param tag - BCP 47 locale tag or `Accept-Language` header to carry forward, or `null` to clear it
   * @returns A new `DateTime` carrying `tag`
   *
   * @example
   * ```ts
   * const standup = datetime('2026-11-16T09:30', 'Europe/Berlin').locale('es-ES');
   * standup.plus(1, 'week').date.format('long'); // '23 de noviembre de 2026'
   * ```
   *
   * @see {@link https://nativedates.dev/api/date-time/#locale locale}
   */
  locale(tag: Locale | null | undefined): this;

  /**
   * Alias for `locale()` that reads the locale tag carried on this moment.
   *
   * @returns Active locale tag carried on this value, or `undefined`
   *
   * @see {@link https://nativedates.dev/api/date-time/#lang lang}
   */
  lang(): Locale | undefined;
  /**
   * Alias for `locale()` that attaches or clears a carried locale tag on this moment.
   *
   * @param tag - BCP 47 locale tag to carry forward, or `null` to clear it
   * @returns A new `DateTime` carrying `tag`
   *
   * @see {@link https://nativedates.dev/api/date-time/#lang lang}
   */
  lang(tag: Locale | null | undefined): this;

  /**
   * Formats the elapsed distance from `other` (or the current moment when omitted) as a localized
   * phrase such as `'3 hours ago'` or `'in 2 days'`.
   *
   * @param other - Reference moment to measure from, defaulting to the current moment
   * @param locale - BCP 47 locale tag overriding this moment's or the configured locale for one call
   * @returns Localized relative phrase
   *
   * @example
   * ```ts
   * const anchor = datetime('2026-11-16T12:00', 'UTC');
   * anchor.minus(3, 'hours').from(anchor, 'en-US'); // '3 hours ago'
   * anchor.plus(45, 'minutes').from(anchor, 'en-US'); // 'in 1 hour'
   * ```
   *
   * @see {@link https://nativedates.dev/api/date-time/#from from}
   */
  from(other?: DateTimeInput, locale?: Locale): string;

  /**
   * Formats how far this moment is from right now as a localized phrase.
   *
   * @param locale - BCP 47 locale tag overriding this moment's or the configured locale for one call
   * @returns Localized relative phrase measured from now
   *
   * @example
   * ```ts
   * now().minus(5, 'minutes').fromNow('en-US'); // '5 minutes ago'
   * ```
   *
   * @see {@link https://nativedates.dev/api/date-time/#fromnow fromNow}
   */
  fromNow(locale?: Locale): string;

  /**
   * Alias for `from()` that formats the elapsed distance from `other` (or now) as a localized phrase.
   *
   * @param other - Reference moment to measure from, defaulting to the current moment
   * @param locale - BCP 47 locale tag overriding this moment's or the configured locale for one call
   * @returns Localized relative phrase
   *
   * @see {@link https://nativedates.dev/api/date-time/#formatrelative formatRelative}
   */
  formatRelative(other?: DateTimeInput, locale?: Locale): string;

  /**
   * Serializes the instant as a UTC ISO 8601 string, suitable for databases, URLs, and API payloads.
   *
   * @returns UTC ISO 8601 timestamp such as `'2026-11-16T17:30:00.000Z'`
   *
   * @example
   * ```ts
   * datetime('2026-11-16T09:30', 'America/Los_Angeles').toString(); // '2026-11-16T17:30:00.000Z'
   * ```
   *
   * @see {@link https://nativedates.dev/api/date-time/#tostring toString}
   */
  toString(): string;

  /**
   * Serializes the instant as a UTC ISO 8601 string for `JSON.stringify()`.
   *
   * @returns UTC ISO 8601 timestamp matching `toString()`
   *
   * @see {@link https://nativedates.dev/api/date-time/#tostring toString}
   */
  toJSON(): string;

  /**
   * Returns a native JavaScript `Date` for the same instant.
   *
   * @returns A `Date` instance at `this.epochMilliseconds`
   *
   * @see {@link https://nativedates.dev/api/date-time/#tojsdate toJSDate}
   */
  toJSDate(): Date;

  /**
   * Returns the underlying `Temporal.ZonedDateTime` instance.
   *
   * @returns Underlying `Temporal.ZonedDateTime`
   *
   * @see {@link https://nativedates.dev/api/date-time/#totemporal toTemporal}
   */
  toTemporal(): TemporalZonedDateTime;

  /**
   * Returns epoch milliseconds so `DateTime` instances can be compared or subtracted with `<` and `-`.
   *
   * @returns Milliseconds since the Unix epoch
   *
   * @see {@link https://nativedates.dev/api/date-time/#valueof valueOf}
   */
  valueOf(): number;
}

/**
 * Reads a string, timestamp, fields object, or calendar date into a `DateTime` viewed in a time zone.
 *
 * Strings with a trailing `Z` or numeric offset fix the exact moment and view it in `zone`, while
 * unzoned date-time strings read directly in that zone. Missing values throw an error, so call `now()`
 * when you want the live clock.
 *
 * @param input - Timestamp, string, `Date`, `CalendarDate`, fields object, or `Temporal` value
 * @param zone - Time zone to view the moment in, defaulting to `configure()` or the local zone
 * @returns An immutable `DateTime` in the resolved time zone
 *
 * @example
 * ```ts
 * import { datetime } from 'native-dates';
 *
 * datetime('2026-11-16T17:30:00Z', 'America/Los_Angeles').hour; // 9
 * datetime('2026-11-16 09:30', 'Europe/Berlin').toString(); // '2026-11-16T08:30:00.000Z'
 * ```
 *
 * @see {@link https://nativedates.dev/api/datetime-fn/#datetime datetime}
 */
export function datetime(input: DateTimeInput, zone?: Zone): DateTime;
/**
 * Reads an input into a `DateTime` with options such as `zone` and `locale`.
 *
 * @param input - Timestamp, string, `Date`, `CalendarDate`, fields object, or `Temporal` value
 * @param options - Zone and locale options for reading the moment
 * @returns An immutable `DateTime` in the resolved time zone
 *
 * @see {@link https://nativedates.dev/api/datetime-fn/#datetime datetime}
 */
export function datetime(input: DateTimeInput, options?: ReadOptions): DateTime;

/**
 * Returns the current moment at millisecond precision in the given or configured time zone.
 *
 * @param zone - Time zone to view the current moment in, such as `'Asia/Tokyo'` or `'UTC'`
 * @returns A `DateTime` for the current millisecond in `zone`
 *
 * @example
 * ```ts
 * import { now } from 'native-dates';
 *
 * const local = now();
 * const utc = now('UTC');
 * ```
 *
 * @see {@link https://nativedates.dev/api/datetime-fn/#now now}
 */
export function now(zone?: Zone): DateTime;

/**
 * Returns the start of today (`00:00:00.000`) in the given or configured time zone.
 *
 * @param zone - Time zone whose current day to measure
 * @returns A `DateTime` at the start of today in `zone`
 *
 * @example
 * ```ts
 * import { startOfToday } from 'native-dates';
 *
 * startOfToday('America/New_York').hour; // 0
 * ```
 *
 * @see {@link https://nativedates.dev/api/datetime-fn/#startoftoday startOfToday}
 */
export function startOfToday(zone?: Zone): DateTime;

/**
 * Returns the final millisecond of today (`23:59:59.999`) in the given or configured time zone.
 *
 * @param zone - Time zone whose current day to measure
 * @returns A `DateTime` at the end of today in `zone`
 *
 * @example
 * ```ts
 * import { endOfToday } from 'native-dates';
 *
 * endOfToday('America/New_York').millisecond; // 999
 * ```
 *
 * @see {@link https://nativedates.dev/api/datetime-fn/#endoftoday endOfToday}
 */
export function endOfToday(zone?: Zone): DateTime;

/**
 * Returns true when `value` is a `DateTime` instance, working across realms and duplicate bundles.
 *
 * @param value - Any value to test
 * @returns `true` if `value` is a `DateTime`
 *
 * @example
 * ```ts
 * import { datetime, isDateTime } from 'native-dates';
 *
 * isDateTime(datetime('2026-11-16T17:30:00Z')); // true
 * isDateTime(new Date()); // false
 * ```
 *
 * @see {@link https://nativedates.dev/api/kind-of/#isdatetime isDateTime}
 */
export function isDateTime(value: unknown): value is DateTime;
