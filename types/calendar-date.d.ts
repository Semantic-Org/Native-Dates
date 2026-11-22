import type { DateTime, DateTimeFields } from './date-time.js';
import type { Duration, DurationInput } from './duration.js';
import type { FormatSpec } from './helpers/format.js';
import { IS_CALENDAR_DATE } from './helpers/identity.js';
import type { DateUnit, DayOfWeek, TemporalValue, Unit } from './helpers/units.js';
import type { Locale, ReadOptions, Zone } from './helpers/zones.js';
import type { MonthDay } from './month-day.js';
import type { DateRange, DateTimeRange } from './range.js';
import type { TimeInput } from './time.js';
import type { YearMonth } from './year-month.js';

/**
 * Any input accepted by `date()`: a year-first date string such as `'2026-09-06'`, fields object,
 * calendar date, moment, native JavaScript date, or `Temporal` value.
 *
 * @see {@link https://nativedates.dev/api/date-fn/#accepted-inputs Accepted inputs}
 */
export type CalendarDateInput = CalendarDate | DateTime | Date | string | DateTimeFields | TemporalValue;

/**
 * A calendar date with no time of day and no time zone, for birthdays, due dates, holidays,
 * and values from date pickers.
 *
 * Because a calendar date is not a timestamp, May 10 stays May 10 in every time zone.
 * Clock units and numeric operators throw a `RangeError`, so call `at()` when you need a specific moment.
 *
 * @example
 * ```ts
 * import { date, today } from 'native-dates';
 *
 * const launch = date('2026-11-16');
 * const due = today().plus(2, 'weeks');
 * const kickoff = launch.at('9:30am', 'America/New_York');
 * ```
 *
 * @see {@link https://nativedates.dev/api/calendar-date/ CalendarDate Documentation}
 */
export class CalendarDate {
  /** @internal */
  readonly [IS_CALENDAR_DATE]: true;

  /**
   * Creates a new `CalendarDate` from a date string, fields object, or existing date or timestamp value.
   * Prefer `date()` or `today()` in everyday code.
   *
   * @param input - Year-first date string, fields object, `CalendarDate`, `DateTime`, `Date`, or `Temporal` value
   * @param options - Zone (for extracting a date from a timestamp) and locale options
   *
   * @see {@link https://nativedates.dev/api/calendar-date/#creating-a-calendardate Creating a CalendarDate}
   */
  constructor(input: CalendarDateInput, options?: ReadOptions);
  /**
   * Creates a new `CalendarDate` from 1-indexed year, month, and day numbers.
   *
   * @param year - Four-digit calendar year, such as 2026
   * @param month - Calendar month from 1 for January through 12 for December
   * @param day - Day of the month from 1 through 31
   *
   * @see {@link https://nativedates.dev/api/calendar-date/#creating-a-calendardate Creating a CalendarDate}
   */
  constructor(year: number, month: number, day: number);

  /** Locale-formatted calendar date, such as `'Nov 16, 2026'`. */
  readonly text: string;
  /** Calendar month from 1 for January through 12 for December. */
  readonly month: number;
  /** Day of the month from 1 through 31. */
  readonly day: number;
  /** Calendar year, such as 2026. */
  readonly year: number;
  /** ISO day of the week, from 1 for Monday through 7 for Sunday. */
  readonly dayOfWeek: number;
  /** First day of this date's weeks (1–7), following `configure()` or its active locale. */
  readonly weekStart: number;
  /** Calendar quarter from 1 through 4. */
  readonly quarter: number;
  /** Day of the year from 1 through 366. */
  readonly dayOfYear: number;
  /** ISO week number of the year from 1 through 53. */
  readonly weekOfYear: number;
  /** Number of days in this month (28–31). */
  readonly daysInMonth: number;
  /** Number of days in this year (365 or 366). */
  readonly daysInYear: number;

  /**
   * Returns true when this date's calendar year has 366 days.
   *
   * @returns `true` if this date falls in a leap year
   *
   * @see {@link https://nativedates.dev/api/calendar-date/#calendar-predicates Calendar predicates}
   */
  isLeapYear(): boolean;

  /**
   * Returns true when this date falls on a weekend day of its active locale: Saturday and
   * Sunday in most, Friday and Saturday in `'ar-SA'`, and Friday alone in `'fa-IR'`.
   *
   * @returns `true` on the locale's weekend days
   *
   * @see {@link https://nativedates.dev/api/calendar-date/#calendar-predicates Calendar predicates}
   */
  isWeekend(): boolean;

  /**
   * Returns true when this date falls outside the weekend of its active locale.
   *
   * @returns `true` on the locale's working days
   *
   * @see {@link https://nativedates.dev/api/calendar-date/#calendar-predicates Calendar predicates}
   */
  isWeekday(): boolean;

  /**
   * Moves forward by years, quarters, months, weeks, or days and returns a new `CalendarDate`.
   * Adding months or years clamps to the final valid day of the target month, and clock units throw a `RangeError`.
   *
   * @param amount - Numeric count paired with `unit`, `Duration`, duration phrase, or fields object
   * @param unit - Calendar unit name when `amount` is a number, such as `'days'` or `'months'`
   * @returns A new `CalendarDate` shifted forward on the calendar
   *
   * @example
   * ```ts
   * const billing = date('2026-01-31');
   * billing.plus(1, 'month').toString(); // '2026-02-28'
   * billing.plus('2 weeks').toString(); // '2026-02-14'
   * ```
   *
   * @see {@link https://nativedates.dev/api/calendar-date/#plus plus}
   */
  plus(amount: DurationInput, unit?: Unit): CalendarDate;

  /**
   * Alias for `plus()` that moves forward by a calendar duration.
   *
   * @param amount - Numeric count paired with `unit`, `Duration`, duration phrase, or fields object
   * @param unit - Calendar unit name when `amount` is a number
   * @returns A new `CalendarDate` shifted forward on the calendar
   *
   * @see {@link https://nativedates.dev/api/calendar-date/#plus plus}
   */
  add(amount: DurationInput, unit?: Unit): CalendarDate;

  /**
   * Moves backward by years, quarters, months, weeks, or days and returns a new `CalendarDate`.
   *
   * @param amount - Numeric count paired with `unit`, `Duration`, duration phrase, or fields object
   * @param unit - Calendar unit name when `amount` is a number
   * @returns A new `CalendarDate` shifted backward on the calendar
   *
   * @example
   * ```ts
   * date('2026-03-01').minus(1, 'day').toString(); // '2026-02-28'
   * ```
   *
   * @see {@link https://nativedates.dev/api/calendar-date/#minus minus}
   */
  minus(amount: DurationInput, unit?: Unit): CalendarDate;

  /**
   * Alias for `minus()` that moves backward by a calendar duration.
   *
   * @param amount - Numeric count paired with `unit`, `Duration`, duration phrase, or fields object
   * @param unit - Calendar unit name when `amount` is a number
   * @returns A new `CalendarDate` shifted backward on the calendar
   *
   * @see {@link https://nativedates.dev/api/calendar-date/#minus minus}
   */
  subtract(amount: DurationInput, unit?: Unit): CalendarDate;

  /**
   * Returns a new `CalendarDate` with one or more calendar fields replaced.
   * Out-of-range dates such as February 30 throw a `RangeError` instead of rolling into March.
   * Updating `month` or `year` without `day` clamps an overflowing day to the end of the target month.
   *
   * @param fields - Object with `year`, `month`, or `day` values to replace
   * @returns A new `CalendarDate` with updated calendar fields
   *
   * @example
   * ```ts
   * const due = date('2026-11-16');
   * due.set({ month: 12, day: 31 }).toString(); // '2026-12-31'
   * due.set('day', 1).toString(); // '2026-11-01'
   * ```
   *
   * @see {@link https://nativedates.dev/api/calendar-date/#set set}
   */
  set(fields: Pick<DateTimeFields, 'year' | 'month' | 'day'>): CalendarDate;
  /**
   * Returns a new `CalendarDate` with a single calendar field replaced.
   *
   * @param unit - Calendar field name (`'year'`, `'month'`, or `'day'`)
   * @param value - Whole-number value for `unit`
   * @returns A new `CalendarDate` with the updated field
   *
   * @see {@link https://nativedates.dev/api/calendar-date/#set set}
   */
  set(unit: Unit, value: number): CalendarDate;

  /**
   * Returns the first day of the calendar unit containing this date.
   * Week boundaries start on `firstDay`, the configured `weekStart`, or this date's active locale.
   *
   * @param unit - Calendar unit from `'year'` down to `'day'`
   * @param firstDay - First day of the week when `unit` is `'week'`, such as `'sunday'` or 7
   * @returns The first `CalendarDate` of `unit`
   *
   * @example
   * ```ts
   * const wed = date('2026-11-18', { locale: 'en-US' });
   * wed.startOf('month').toString(); // '2026-11-01'
   * wed.startOf('week').toString(); // '2026-11-15'
   * wed.startOf('week', 'monday').toString(); // '2026-11-16'
   * ```
   *
   * @see {@link https://nativedates.dev/api/calendar-date/#startof startOf}
   */
  startOf(unit: DateUnit, firstDay?: DayOfWeek): CalendarDate;

  /**
   * Returns the final day of the calendar unit containing this date.
   *
   * @param unit - Calendar unit from `'year'` down to `'day'`
   * @param firstDay - First day of the week when `unit` is `'week'`
   * @returns The last `CalendarDate` of `unit`
   *
   * @example
   * ```ts
   * date('2026-02-10').endOf('month').toString(); // '2026-02-28'
   * date('2028-02-10').endOf('month').toString(); // '2028-02-29'
   * ```
   *
   * @see {@link https://nativedates.dev/api/calendar-date/#endof endOf}
   */
  endOf(unit: DateUnit, firstDay?: DayOfWeek): CalendarDate;

  /**
   * Returns the first day of the calendar unit after the one containing this date.
   * The result is always later than this date, so from December 1 the next month starts on January 1.
   * A weekday name in place of a unit returns the next day with that name, as `next()` does.
   *
   * @param unit - Calendar unit from `'year'` down to `'day'`, or a weekday name such as `'wednesday'`
   * @param firstDay - First day of the week when `unit` is `'week'`, such as `'sunday'` or 7
   * @returns The first `CalendarDate` of the next `unit`, or the next given weekday
   *
   * @example
   * ```ts
   * const mon = date('2026-11-16', { locale: 'en-US' });
   * mon.startOfNext('month').toString(); // '2026-12-01'
   * mon.startOfNext('quarter').toString(); // '2027-01-01'
   * mon.startOfNext('week').toString(); // '2026-11-22'
   * mon.startOfNext('wednesday').toString(); // '2026-11-18'
   * ```
   *
   * @see {@link https://nativedates.dev/api/calendar-date/#startofnext startOfNext}
   */
  startOfNext(unit: DateUnit | Exclude<DayOfWeek, number>, firstDay?: DayOfWeek): CalendarDate;

  /**
   * Returns the first day of the calendar unit before the one containing this date.
   * A weekday name in place of a unit returns the most recent day with that name, as `previous()` does.
   *
   * @param unit - Calendar unit from `'year'` down to `'day'`, or a weekday name such as `'wednesday'`
   * @param firstDay - First day of the week when `unit` is `'week'`, such as `'sunday'` or 7
   * @returns The first `CalendarDate` of the previous `unit`, or the previous given weekday
   *
   * @example
   * ```ts
   * const mon = date('2026-11-16');
   * mon.startOfPrevious('month').toString(); // '2026-10-01'
   * mon.startOfPrevious('year').toString(); // '2025-01-01'
   * mon.startOfPrevious('wednesday').toString(); // '2026-11-11'
   * ```
   *
   * @see {@link https://nativedates.dev/api/calendar-date/#startofprevious startOfPrevious}
   */
  startOfPrevious(unit: DateUnit | Exclude<DayOfWeek, number>, firstDay?: DayOfWeek): CalendarDate;

  /**
   * Moves forward to the next given weekday after this date.
   * When already on that weekday, advances seven days to the following occurrence.
   *
   * @param dayOfWeek - Weekday name such as `'friday'`, three-letter prefix, or ISO number (1–7)
   * @returns A new `CalendarDate` on the next matching weekday
   *
   * @example
   * ```ts
   * const mon = date('2026-11-16');
   * mon.next('friday').toString(); // '2026-11-20'
   * mon.next('monday').toString(); // '2026-11-23'
   * ```
   *
   * @see {@link https://nativedates.dev/api/calendar-date/#next next}
   */
  next(dayOfWeek: DayOfWeek): CalendarDate;

  /**
   * Moves back to the most recent given weekday before this date.
   *
   * @param dayOfWeek - Weekday name such as `'friday'`, three-letter prefix, or ISO number (1–7)
   * @returns A new `CalendarDate` on the previous matching weekday
   *
   * @example
   * ```ts
   * date('2026-11-16').previous('friday').toString(); // '2026-11-13'
   * ```
   *
   * @see {@link https://nativedates.dev/api/calendar-date/#previous previous}
   */
  previous(dayOfWeek: DayOfWeek): CalendarDate;

  /**
   * Moves forward to the next occurrence of a recurring `MonthDay` strictly after this date.
   *
   * @param monthDay - Recurring annual month and day, such as `monthDay(12, 25)`
   * @returns A new `CalendarDate` on the next occurrence
   *
   * @see {@link https://nativedates.dev/api/calendar-date/#next next}
   */
  next(monthDay: MonthDay): CalendarDate;

  /**
   * Moves back to the most recent occurrence of a recurring `MonthDay` strictly before this date.
   *
   * @param monthDay - Recurring annual month and day, such as `monthDay(10, 31)`
   * @returns A new `CalendarDate` on the previous occurrence
   *
   * @see {@link https://nativedates.dev/api/calendar-date/#previous previous}
   */
  previous(monthDay: MonthDay): CalendarDate;

  /**
   * Creates an inclusive `DateRange` starting on this date and running through `end`
   * or across a calendar duration. Both start and end days are included.
   *
   * @param end - Final date to include, or a calendar duration length
   * @returns An inclusive `DateRange` starting on this date
   *
   * @example
   * ```ts
   * date('2026-11-01').to('2026-11-07').duration.days; // 7
   * ```
   *
   * @see {@link https://nativedates.dev/api/calendar-date/#to to}
   */
  to(end: CalendarDateInput | DurationInput): DateRange;
  /**
   * Creates an inclusive `DateRange` starting on this date and spanning `count` of `unit`.
   *
   * @param count - Positive span count
   * @param unit - Calendar unit name for `count`, such as `'days'` or `'weeks'`
   * @returns An inclusive `DateRange` starting on this date
   *
   * @see {@link https://nativedates.dev/api/calendar-date/#to to}
   */
  to(count: number, unit: Unit): DateRange;

  /**
   * Creates an inclusive `DateRange` starting on this date and lasting for `length`.
   * Spanning 3 days from the 6th covers the 6th, 7th, and 8th.
   *
   * @param length - Calendar `Duration`, phrase such as `'7 days'`, ISO duration, or fields object
   * @returns An inclusive `DateRange` starting on this date
   *
   * @example
   * ```ts
   * date('2026-11-01').for(7, 'days').toString(); // '2026-11-01/2026-11-07'
   * ```
   *
   * @see {@link https://nativedates.dev/api/calendar-date/#to to}
   */
  for(length: DurationInput): DateRange;
  /**
   * Creates an inclusive `DateRange` starting on this date and lasting for `count` of `unit`.
   *
   * @param count - Positive span count
   * @param unit - Calendar unit name for `count`, such as `'days'` or `'weeks'`
   * @returns An inclusive `DateRange` starting on this date
   *
   * @example
   * ```ts
   * date('2026-11-01').for(7, 'days').toString(); // '2026-11-01/2026-11-07'
   * ```
   *
   * @see {@link https://nativedates.dev/api/calendar-date/#to to}
   */
  for(count: number, unit: Unit): DateRange;

  /**
   * Alias for `to()` emphasizing that a `DateRange` includes its final day.
   *
   * @param end - Final date to include, or a calendar duration length
   * @returns An inclusive `DateRange` starting on this date
   *
   * @see {@link https://nativedates.dev/api/calendar-date/#to to}
   */
  through(end: CalendarDateInput | DurationInput): DateRange;
  /**
   * Alias for `to()` creating an inclusive `DateRange` across `count` calendar units.
   *
   * @param count - Positive span count
   * @param unit - Calendar unit name for `count`, such as `'days'` or `'weeks'`
   * @returns An inclusive `DateRange` starting on this date
   *
   * @see {@link https://nativedates.dev/api/calendar-date/#to to}
   */
  through(count: number, unit: Unit): DateRange;

  /**
   * Returns an inclusive `DateRange` covering every day of the calendar unit containing this date,
   * from its first day through its last.
   *
   * @param unit - Enclosing calendar unit from `'year'` down to `'day'`
   * @param firstDay - First day of the week when `unit` is `'week'`
   * @returns An inclusive `DateRange` spanning `unit`
   *
   * @example
   * ```ts
   * date('2026-02-10').range('month').toString(); // '2026-02-01/2026-02-28'
   * ```
   *
   * @see {@link https://nativedates.dev/api/calendar-date/#range range}
   */
  range(unit: DateUnit, firstDay?: DayOfWeek): DateRange;

  /**
   * Walks across this calendar day by `step` in the given or configured time zone,
   * returning an array of `DateTime` moments starting at midnight.
   *
   * @param step - Unit name such as `'hour'` or duration such as `'30m'`
   * @param zone - Time zone for the day's boundaries, defaulting to the configured zone
   * @returns Ordered `DateTime` moments across this day in `zone`
   *
   * @example
   * ```ts
   * const slots = date('2026-11-16').points(6, 'hours', 'UTC');
   * slots.length; // 4
   * slots[1].toString(); // '2026-11-16T06:00:00.000Z'
   * ```
   *
   * @see {@link https://nativedates.dev/api/calendar-date/#points points}
   */
  points(step: Unit | DurationInput, zone?: Zone): DateTime[];
  /**
   * Walks across this calendar day by `count` of `unit` in the given or configured time zone.
   *
   * @param count - Positive step count
   * @param unit - Step unit name, such as `'hours'` or `'minutes'`
   * @param zone - Time zone for the day's boundaries, defaulting to the configured zone
   * @returns Ordered `DateTime` moments across this day in `zone`
   *
   * @see {@link https://nativedates.dev/api/calendar-date/#points points}
   */
  points(count: number | string, unit: Unit, zone?: Zone): DateTime[];

  /**
   * Divides this calendar day into contiguous half-open `DateTimeRange` slices in `zone`.
   *
   * @param step - Unit name such as `'hour'` or duration such as `'30m'`
   * @param zone - Time zone for the day's boundaries, defaulting to the configured zone
   * @returns Contiguous `DateTimeRange` slices covering this day in `zone`
   *
   * @example
   * ```ts
   * date('2026-11-16').split(12, 'hours', 'UTC').map(String);
   * // ['2026-11-16T00:00:00.000Z/2026-11-16T12:00:00.000Z', '2026-11-16T12:00:00.000Z/2026-11-17T00:00:00.000Z']
   * ```
   *
   * @see {@link https://nativedates.dev/api/calendar-date/#split split}
   */
  split(step: Unit | DurationInput, zone?: Zone): DateTimeRange[];
  /**
   * Divides this calendar day into contiguous half-open `DateTimeRange` slices of `count` `unit`s.
   *
   * @param count - Positive step count
   * @param unit - Step unit name, such as `'hours'` or `'minutes'`
   * @param zone - Time zone for the day's boundaries, defaulting to the configured zone
   * @returns Contiguous `DateTimeRange` slices covering this day in `zone`
   *
   * @see {@link https://nativedates.dev/api/calendar-date/#split split}
   */
  split(count: number | string, unit: Unit, zone?: Zone): DateTimeRange[];

  /**
   * Alias for `split()` that divides this calendar day into contiguous `DateTimeRange` slices.
   *
   * @param step - Unit name or duration step
   * @param zone - Time zone for the day's boundaries, defaulting to the configured zone
   * @returns Contiguous `DateTimeRange` slices covering this day in `zone`
   *
   * @see {@link https://nativedates.dev/api/calendar-date/#split split}
   */
  splitBy(step: Unit | DurationInput, zone?: Zone): DateTimeRange[];
  /**
   * Alias for `split()` that divides this day into slices of `count` `unit`s.
   *
   * @param count - Positive step count
   * @param unit - Step unit name, such as `'hours'` or `'minutes'`
   * @param zone - Time zone for the day's boundaries, defaulting to the configured zone
   * @returns Contiguous `DateTimeRange` slices covering this day in `zone`
   *
   * @see {@link https://nativedates.dev/api/calendar-date/#split split}
   */
  splitBy(count: number | string, unit: Unit, zone?: Zone): DateTimeRange[];

  /**
   * Returns true when both values represent the same calendar year, month, and day.
   *
   * @param other - Another `CalendarDate` or any input accepted by `date()`
   * @returns `true` if both values represent the same calendar day
   *
   * @example
   * ```ts
   * date('2026-11-16').equals(date(2026, 11, 16)); // true
   * ```
   *
   * @see {@link https://nativedates.dev/api/calendar-date/#equals equals}
   */
  equals(other: CalendarDateInput): boolean;

  /**
   * Returns true if this date is earlier on the calendar than `other`.
   *
   * @param other - Date to compare against
   * @returns `true` when this date comes before `other`
   *
   * @example
   * ```ts
   * date('2026-11-15').isBefore('2026-11-16'); // true
   * ```
   *
   * @see {@link https://nativedates.dev/api/calendar-date/#isbefore isBefore}
   */
  isBefore(other: CalendarDateInput): boolean;

  /**
   * Returns true if this date is later on the calendar than `other`.
   *
   * @param other - Date to compare against
   * @returns `true` when this date comes after `other`
   *
   * @example
   * ```ts
   * date('2026-11-17').isAfter('2026-11-16'); // true
   * ```
   *
   * @see {@link https://nativedates.dev/api/calendar-date/#isafter isAfter}
   */
  isAfter(other: CalendarDateInput): boolean;

  /**
   * Checks whether `other` falls in the same calendar unit, such as the same month or week.
   * Calling without `unit` checks whether both values are the exact same day.
   *
   * @param other - Date to compare against
   * @param unit - Calendar unit to compare, from `'year'` down to `'day'`
   * @param firstDay - First day of the week when `unit` is `'week'`
   * @returns `true` when both dates fall in the same `unit`
   *
   * @example
   * ```ts
   * const wed = date('2026-09-09', { locale: 'en-US' });
   * wed.isSame('2026-09-30', 'month'); // true
   * wed.isSame('2026-09-06', 'week'); // true
   * ```
   *
   * @see {@link https://nativedates.dev/api/calendar-date/#issame isSame}
   */
  isSame(other: CalendarDateInput, unit?: DateUnit, firstDay?: DayOfWeek): boolean;

  /**
   * Returns true when this date is earlier than today in the given or configured time zone.
   *
   * @param zone - Time zone used to determine today's date
   * @returns `true` if earlier than today in `zone`
   *
   * @see {@link https://nativedates.dev/api/calendar-date/#calendar-predicates Calendar predicates}
   */
  isPast(zone?: Zone): boolean;

  /**
   * Returns true when this date is later than today in the given or configured time zone.
   *
   * @param zone - Time zone used to determine today's date
   * @returns `true` if later than today in `zone`
   *
   * @see {@link https://nativedates.dev/api/calendar-date/#calendar-predicates Calendar predicates}
   */
  isFuture(zone?: Zone): boolean;

  /**
   * Returns true when this date matches today's calendar date in the given or configured time zone.
   *
   * @param zone - Time zone used to determine today's date
   * @returns `true` if equal to `today(zone)`
   *
   * @see {@link https://nativedates.dev/api/calendar-date/#calendar-predicates Calendar predicates}
   */
  isToday(zone?: Zone): boolean;

  /**
   * Returns true when this date matches tomorrow's calendar date in the given or configured time zone.
   *
   * @param zone - Time zone used to determine tomorrow's date
   * @returns `true` if equal to `tomorrow(zone)`
   *
   * @see {@link https://nativedates.dev/api/calendar-date/#calendar-predicates Calendar predicates}
   */
  isTomorrow(zone?: Zone): boolean;

  /**
   * Returns true when this date matches yesterday's calendar date in the given or configured time zone.
   *
   * @param zone - Time zone used to determine yesterday's date
   * @returns `true` if equal to `yesterday(zone)`
   *
   * @see {@link https://nativedates.dev/api/calendar-date/#calendar-predicates Calendar predicates}
   */
  isYesterday(zone?: Zone): boolean;

  /**
   * Measures the calendar span from this date to `other` as a `Duration` counted in days,
   * returning a negative duration when `other` is earlier. Remembers this starting date so
   * `balance('year')` and `total('months')` can compute calendar months and years.
   *
   * @param other - Target date to measure toward
   * @returns A signed `Duration` from this date to `other`
   *
   * @example
   * ```ts
   * const start = date('2026-01-01');
   * start.until('2027-04-05').toString(); // 'P459D'
   * start.until('2027-04-05').balance('year').toString(); // 'P1Y3M4D'
   * start.until('2027-04-05', 'days'); // 459
   * ```
   *
   * @see {@link https://nativedates.dev/api/calendar-date/#until until}
   */
  until(other: CalendarDateInput): Duration;
  /**
   * Measures the calendar span from this date to `other` as a floating-point count in `unit`.
   *
   * @param other - Target date to measure toward
   * @param unit - Unit to express the total length in, such as `'days'` or `'months'`
   * @returns Signed total length in `unit`
   *
   * @example
   * ```ts
   * date('2026-01-01').until('2027-04-05', 'days'); // 459
   * ```
   *
   * @see {@link https://nativedates.dev/api/calendar-date/#until until}
   */
  until(other: CalendarDateInput, unit: Unit): number;

  /**
   * Measures the calendar span elapsed since an earlier date as a `Duration` counted in days.
   *
   * @param other - Earlier date to measure from
   * @returns A signed `Duration` from `other` to this date
   *
   * @example
   * ```ts
   * date('2026-11-16').since('2026-11-02').days; // 14
   * ```
   *
   * @see {@link https://nativedates.dev/api/calendar-date/#since since}
   */
  since(other: CalendarDateInput): Duration;
  /**
   * Measures the calendar span elapsed since `other` as a floating-point count in `unit`.
   *
   * @param other - Earlier date to measure from
   * @param unit - Unit to express the elapsed length in, such as `'days'` or `'weeks'`
   * @returns Signed elapsed length in `unit`
   *
   * @example
   * ```ts
   * date('2026-11-16').since('2026-11-02', 'weeks'); // 2
   * ```
   *
   * @see {@link https://nativedates.dev/api/calendar-date/#since since}
   */
  since(other: CalendarDateInput, unit: Unit): number;

  /**
   * Combines this calendar date with a time of day in a time zone and returns a `DateTime`.
   * Omitting `time` defaults to midnight at the start of the day.
   *
   * @param time - Time string such as `'9:30am'`, `Time` instance, fields object, or `Date`
   * @param zone - Time zone name or offset, defaulting to the configured zone
   * @returns A new `DateTime` on this date at `time` in `zone`
   *
   * @example
   * ```ts
   * date('2026-11-16').at('9:30am', 'America/Los_Angeles').toString(); // '2026-11-16T17:30:00.000Z'
   * ```
   *
   * @see {@link https://nativedates.dev/api/calendar-date/#at at}
   */
  at(time?: TimeInput, zone?: Zone): DateTime;

  /**
   * Converts this date to a `DateTime` at the start of the day in `zone` inside a method chain.
   *
   * @param kind - Target kind `'datetime'`
   * @param zone - Time zone name or offset, defaulting to the configured zone
   * @returns A `DateTime` at midnight on this date in `zone`
   *
   * @example
   * ```ts
   * date('2026-11-16').as('datetime', 'UTC').toString(); // '2026-11-16T00:00:00.000Z'
   * date('2026-11-16').as('yearMonth').toString(); // '2026-11'
   * ```
   *
   * @see {@link https://nativedates.dev/api/calendar-date/#as as}
   */
  as(kind: 'datetime', zone?: Zone): DateTime;
  /**
   * Returns this `CalendarDate` unchanged when `'date'` is requested in generic chains.
   *
   * @param kind - Target kind `'date'`
   * @returns This `CalendarDate` instance
   *
   * @see {@link https://nativedates.dev/api/calendar-date/#as as}
   */
  as(kind: 'date'): CalendarDate;
  /**
   * Extracts the recurring `MonthDay` with the year dropped.
   *
   * @param kind - Target kind `'monthDay'`
   * @returns `MonthDay` for this date's month and day
   *
   * @see {@link https://nativedates.dev/api/calendar-date/#as as}
   */
  as(kind: 'monthDay'): MonthDay;
  /**
   * Extracts the `YearMonth` with the day dropped.
   *
   * @param kind - Target kind `'yearMonth'`
   * @returns `YearMonth` for this date's year and month
   *
   * @see {@link https://nativedates.dev/api/calendar-date/#as as}
   */
  as(kind: 'yearMonth'): YearMonth;

  /** Calendar month and day with the year dropped. */
  readonly monthDay: MonthDay;
  /** Calendar year and month with the day dropped. */
  readonly yearMonth: YearMonth;

  /**
   * Formats the date using built-in presets, custom names from `configure()`,
   * `Intl.DateTimeFormatOptions` objects, or token patterns.
   *
   * @param spec - Preset name (default `'medium'`), custom format name, `Intl` options bag, or token pattern
   * @param locale - BCP 47 locale tag overriding this date's or the configured locale for one call
   * @returns Formatted date string
   *
   * @example
   * ```ts
   * const day = date('2026-11-16');
   * day.format('medium', 'en-US'); // 'Nov 16, 2026'
   * day.format('long', 'en-US'); // 'November 16, 2026'
   * day.format('YYYY-MM-DD'); // '2026-11-16'
   * day.format({ weekday: 'long' }, 'en-US'); // 'Monday'
   * ```
   *
   * @see {@link https://nativedates.dev/api/calendar-date/#format format}
   */
  format(spec?: FormatSpec, locale?: Locale): string;

  /**
   * Reads the BCP 47 locale tag carried on this date, or `undefined` when none was set.
   *
   * @returns Active locale tag carried on this value, or `undefined`
   *
   * @see {@link https://nativedates.dev/api/calendar-date/#locale locale}
   */
  locale(): Locale | undefined;
  /**
   * Returns a copy of this date carrying `tag` for formatting, week boundaries, and derived values.
   * Passing an empty tag or `null` clears the carried locale.
   *
   * @param tag - BCP 47 locale tag or `Accept-Language` header to carry forward, or `null` to clear it
   * @returns A new `CalendarDate` carrying `tag`
   *
   * @example
   * ```ts
   * date('2026-11-16').locale('fr-FR').format('long'); // '16 novembre 2026'
   * ```
   *
   * @see {@link https://nativedates.dev/api/calendar-date/#locale locale}
   */
  locale(tag: Locale | null | undefined): this;

  /**
   * Alias for `locale()` that reads the locale tag carried on this date.
   *
   * @returns Active locale tag carried on this value, or `undefined`
   *
   * @see {@link https://nativedates.dev/api/calendar-date/#lang lang}
   */
  lang(): Locale | undefined;
  /**
   * Alias for `locale()` that attaches or clears a carried locale tag on this date.
   *
   * @param tag - BCP 47 locale tag to carry forward, or `null` to clear it
   * @returns A new `CalendarDate` carrying `tag`
   *
   * @see {@link https://nativedates.dev/api/calendar-date/#lang lang}
   */
  lang(tag: Locale | null | undefined): this;

  /**
   * Formats the calendar distance from another date (or today when omitted) as a localized phrase
   * such as `'yesterday'` or `'in 2 weeks'`.
   *
   * @param other - Reference calendar date to measure from, defaulting to `today()`
   * @param locale - BCP 47 locale tag overriding this date's or the configured locale for one call
   * @returns Localized relative phrase
   *
   * @example
   * ```ts
   * const anchor = date('2026-11-16');
   * date('2026-11-15').from(anchor, 'en-US'); // 'yesterday'
   * date('2026-11-30').from(anchor, 'en-US'); // 'in 2 weeks'
   * ```
   *
   * @see {@link https://nativedates.dev/api/calendar-date/#from from}
   */
  from(other?: CalendarDateInput, locale?: Locale): string;

  /**
   * Formats how far this date is from today as a localized phrase.
   *
   * @param locale - BCP 47 locale tag overriding this date's or the configured locale for one call
   * @returns Localized relative phrase measured from today
   *
   * @example
   * ```ts
   * today().minus(1, 'day').fromNow('en-US'); // 'yesterday'
   * ```
   *
   * @see {@link https://nativedates.dev/api/calendar-date/#fromnow fromNow}
   */
  fromNow(locale?: Locale): string;

  /**
   * Alias for `from()` that formats the calendar distance from `other` (or today) as a localized phrase.
   *
   * @param other - Reference calendar date to measure from, defaulting to `today()`
   * @param locale - BCP 47 locale tag overriding this date's or the configured locale for one call
   * @returns Localized relative phrase
   *
   * @see {@link https://nativedates.dev/api/calendar-date/#formatrelative formatRelative}
   */
  formatRelative(other?: CalendarDateInput, locale?: Locale): string;

  /**
   * Returns the ISO 8601 calendar date string `'YYYY-MM-DD'`.
   *
   * @returns ISO 8601 date string such as `'2026-11-16'`
   *
   * @example
   * ```ts
   * date(2026, 11, 16).toString(); // '2026-11-16'
   * ```
   *
   * @see {@link https://nativedates.dev/api/calendar-date/#tostring toString}
   */
  toString(): string;

  /**
   * Serializes the date as an ISO 8601 `'YYYY-MM-DD'` string for `JSON.stringify()`.
   *
   * @returns ISO 8601 date string matching `toString()`
   *
   * @see {@link https://nativedates.dev/api/calendar-date/#tostring toString}
   */
  toJSON(): string;

  /**
   * Returns a native JavaScript `Date` at midnight on this date in the given or configured time zone.
   *
   * @param zone - Time zone for midnight, defaulting to the configured zone
   * @returns A `Date` instance at the start of this day in `zone`
   *
   * @see {@link https://nativedates.dev/api/calendar-date/#tojsdate toJSDate}
   */
  toJSDate(zone?: Zone): Date;

  /**
   * Returns the underlying `Temporal.PlainDate` instance.
   *
   * @returns Underlying `Temporal.PlainDate`
   *
   * @see {@link https://nativedates.dev/api/calendar-date/#totemporal toTemporal}
   */
  toTemporal(): TemporalValue;

  /**
   * Throws a `RangeError` so numeric operators never coerce a calendar date to milliseconds.
   * Compare dates with methods like `isBefore()`, or sort arrays with `compare()`.
   *
   * @see {@link https://nativedates.dev/api/calendar-date/#valueof valueOf}
   */
  valueOf(): never;
}

/**
 * Creates a `CalendarDate` from a year-first date string, three 1-indexed numbers, a fields object,
 * or an existing date or timestamp.
 *
 * Impossible dates such as February 30 throw a `RangeError`, and inputs without a day throw instead
 * of inventing the first of the month. Use `yearMonth()` for year-and-month values.
 *
 * @param input - Year-first date string (`'2026-11-16'`, `'2026/11/16'`, `'2026年11月16日'`), fields object, `DateTime`, `Date`, or `Temporal` value
 * @param options - Time zone (for timestamps) and locale options
 * @returns An immutable `CalendarDate`
 *
 * @example
 * ```ts
 * import { date } from 'native-dates';
 *
 * date('2026-11-16');
 * date(2026, 11, 16);
 * date('2026-11-17T02:00:00Z', 'America/Los_Angeles').toString(); // '2026-11-16'
 * ```
 *
 * @see {@link https://nativedates.dev/api/date-fn/#date date}
 */
export function date(input: CalendarDateInput, options?: ReadOptions): CalendarDate;
/**
 * Creates a `CalendarDate` from 1-indexed year, month, and day numbers.
 *
 * @param year - Four-digit calendar year, such as 2026
 * @param month - Calendar month from 1 for January through 12 for December
 * @param day - Day of the month from 1 through 31
 * @returns An immutable `CalendarDate`
 *
 * @example
 * ```ts
 * date(2026, 11, 16).toString(); // '2026-11-16'
 * ```
 *
 * @see {@link https://nativedates.dev/api/date-fn/#date date}
 */
export function date(year: number, month: number, day: number): CalendarDate;
/**
 * Extracts the `CalendarDate` of an instant string or timestamp object in `zone`.
 *
 * @param input - Date or timestamp input
 * @param zone - Time zone used to determine the calendar day
 * @returns An immutable `CalendarDate`
 *
 * @see {@link https://nativedates.dev/api/date-fn/#date date}
 */
export function date(input: CalendarDateInput, zone: Zone): CalendarDate;

/**
 * Returns today's calendar date in the given or configured time zone.
 *
 * @param zone - Time zone whose current calendar date to read, such as `'Asia/Tokyo'`
 * @returns Today's `CalendarDate` in `zone`
 *
 * @example
 * ```ts
 * import { today } from 'native-dates';
 *
 * const due = today().plus(2, 'weeks');
 * const inTokyo = today('Asia/Tokyo');
 * ```
 *
 * @see {@link https://nativedates.dev/api/date-fn/#today today}
 */
export function today(zone?: Zone): CalendarDate;

/**
 * Returns tomorrow's calendar date in the given or configured time zone, one day after `today(zone)`.
 *
 * @param zone - Time zone whose calendar to advance from today
 * @returns Tomorrow's `CalendarDate` in `zone`
 *
 * @example
 * ```ts
 * import { tomorrow } from 'native-dates';
 *
 * const reminder = tomorrow('Europe/London').at('9:00am', 'Europe/London');
 * ```
 *
 * @see {@link https://nativedates.dev/api/date-fn/#tomorrow tomorrow}
 */
export function tomorrow(zone?: Zone): CalendarDate;

/**
 * Returns yesterday's calendar date in the given or configured time zone, one day before `today(zone)`.
 *
 * @param zone - Time zone whose calendar to step back from today
 * @returns Yesterday's `CalendarDate` in `zone`
 *
 * @example
 * ```ts
 * import { yesterday } from 'native-dates';
 *
 * const prior = yesterday('America/New_York');
 * ```
 *
 * @see {@link https://nativedates.dev/api/date-fn/#yesterday yesterday}
 */
export function yesterday(zone?: Zone): CalendarDate;

/**
 * Returns true when `value` is a `CalendarDate` instance, working across realms and duplicate bundles.
 *
 * @param value - Any value to test
 * @returns `true` if `value` is a `CalendarDate`
 *
 * @example
 * ```ts
 * import { date, isCalendarDate } from 'native-dates';
 *
 * isCalendarDate(date('2026-11-16')); // true
 * isCalendarDate(new Date()); // false
 * ```
 *
 * @see {@link https://nativedates.dev/api/kind-of/#iscalendardate isCalendarDate}
 */
export function isCalendarDate(value: unknown): value is CalendarDate;
