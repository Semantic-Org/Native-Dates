import type { CalendarDate, CalendarDateInput } from './calendar-date.js';
import type { FormatSpec } from './helpers/format.js';
import { IS_MONTH_DAY } from './helpers/identity.js';
import type { TemporalPlainMonthDay } from './helpers/units.js';
import type { Locale, ReadOptions, Zone } from './helpers/zones.js';

/**
 * Singular month and day fields accepted when creating a `MonthDay`.
 *
 * @see {@link https://nativedates.dev/api/month-day-fn/#monthday monthDay}
 */
export interface MonthDayFields {
  /** Calendar month from 1 for January through 12 for December. */
  month: number;
  /** Day of the month from 1 through 31. */
  day: number;
}

/**
 * Any input accepted by the month-day factories: a `MonthDay`, ISO `'10-17'` string,
 * numeric pair string, fields object, `Temporal.PlainMonthDay`, or any date or timestamp input with its year dropped.
 *
 * @see {@link https://nativedates.dev/api/month-day-fn/#accepted-inputs Accepted inputs}
 */
export type MonthDayInput = MonthDay | MonthDayFields | TemporalPlainMonthDay | CalendarDateInput;

/**
 * Options accepted as the second argument to `monthDay()` and `new MonthDay()`.
 *
 * @see {@link https://nativedates.dev/api/month-day-fn/#monthday monthDay}
 */
export interface MonthDayOptions extends ReadOptions {
  /**
   * Read slash, dot, or single-digit dash strings such as `'17/10'` day-first, matching `dayMonth()`.
   * Two-digit ISO strings with a hyphen (`'10-17'`) always read month-first so JSON values round-trip cleanly.
   *
   * @default false
   */
  dayFirst?: boolean;
}

/**
 * Format specification accepted by `MonthDay.prototype.format()`: any preset, custom format name,
 * `Intl.DateTimeFormatOptions` object, or token pattern, printing only the month and day.
 *
 * @see {@link https://nativedates.dev/api/month-day/#format format}
 */
export type MonthDayFormat = FormatSpec;

/**
 * A recurring calendar month and day with no year, for birthdays, anniversaries, and annual holidays.
 *
 * February 29 is preserved and resolves to February 28 in common years when calling `in()` or `fallsOn()`.
 * Because an annual date repeats every year rather than representing a single calendar date,
 * ordering methods like `isBefore()` do not apply.
 *
 * @example
 * ```ts
 * import { dayMonth, monthDay } from 'native-dates';
 *
 * const birthday = monthDay(10, 17);
 * birthday.in(2027).toString(); // '2027-10-17'
 *
 * const leapDay = dayMonth('29/02');
 * leapDay.fallsOn('2027-02-28'); // true
 * ```
 *
 * @see {@link https://nativedates.dev/api/month-day/ MonthDay Documentation}
 */
export class MonthDay {
  /** @internal */
  readonly [IS_MONTH_DAY]: true;

  /**
   * Creates a new `MonthDay` from a month-first string, fields object, or existing date value.
   * Prefer `monthDay()` or `dayMonth()` in everyday code.
   *
   * @param input - Month-day string, fields object, `MonthDay`, or date/timestamp value
   * @param options - Time zone or `MonthDayOptions` including `dayFirst` and `locale`
   *
   * @see {@link https://nativedates.dev/api/month-day/#creating-a-monthday Creating a MonthDay}
   */
  constructor(input: MonthDayInput, options?: Zone | MonthDayOptions);
  /**
   * Creates a new `MonthDay` from 1-indexed month and day numbers.
   *
   * @param month - Calendar month from 1 for January through 12 for December
   * @param day - Day of the month from 1 through 31
   *
   * @see {@link https://nativedates.dev/api/month-day/#creating-a-monthday Creating a MonthDay}
   */
  constructor(month: number | string, day: number | string);

  /** Locale-formatted month and day, such as `'Oct 17'`. */
  readonly text: string;
  /** Calendar month from 1 for January through 12 for December. */
  readonly month: number;
  /** Day of the month from 1 through 31. */
  readonly day: number;

  /**
   * Places this month and day in a calendar year and returns a `CalendarDate`.
   * February 29 lands on February 28 in common years that have no leap day.
   *
   * @param year - Whole calendar year, such as 2027
   * @returns The `CalendarDate` this month-day falls on in `year`
   *
   * @example
   * ```ts
   * monthDay(10, 17).in(2027).toString(); // '2027-10-17'
   * monthDay(2, 29).in(2027).toString(); // '2027-02-28'
   * monthDay(2, 29).in(2028).toString(); // '2028-02-29'
   * ```
   *
   * @see {@link https://nativedates.dev/api/month-day/#in in}
   */
  in(year: number | string): CalendarDate;

  /**
   * Returns the next occurrence after a required reference date.
   * When `day` already falls on this month and day, advances to the following year.
   *
   * @param day - Reference date to step forward past
   * @returns First `CalendarDate` occurrence after `day`
   *
   * @example
   * ```ts
   * monthDay(2, 29).after('2026-03-01').toString(); // '2027-02-28'
   * ```
   *
   * @see {@link https://nativedates.dev/api/month-day/#after after}
   */
  after(day: CalendarDateInput): CalendarDate;

  /**
   * Returns the most recent occurrence before a required reference date.
   * When `day` already falls on this month and day, steps back to the previous year.
   *
   * @param day - Reference date to step backward from
   * @returns Most recent `CalendarDate` occurrence before `day`
   *
   * @example
   * ```ts
   * monthDay(10, 17).before('2026-10-01').toString(); // '2025-10-17'
   * ```
   *
   * @see {@link https://nativedates.dev/api/month-day/#before before}
   */
  before(day: CalendarDateInput): CalendarDate;

  /**
   * Returns the next occurrence after `day`, defaulting to `today()`.
   * When `day` already falls on this month and day, advances to the following year.
   *
   * @param day - Starting date to count forward from, defaulting to `today()`
   * @returns Upcoming `CalendarDate` after `day`
   *
   * @example
   * ```ts
   * const birthday = monthDay(10, 17);
   * birthday.next('2026-05-01').toString(); // '2026-10-17'
   * birthday.next('2026-10-17').toString(); // '2027-10-17'
   * ```
   *
   * @see {@link https://nativedates.dev/api/month-day/#next next}
   */
  next(day?: CalendarDateInput): CalendarDate;

  /**
   * Returns the most recent occurrence before `day`, defaulting to `today()`.
   * When `day` already falls on this month and day, steps back to the previous year.
   *
   * @param day - Reference date to count backward from, defaulting to `today()`
   * @returns Most recent `CalendarDate` before `day`
   *
   * @example
   * ```ts
   * monthDay(10, 17).previous('2026-10-17').toString(); // '2025-10-17'
   * ```
   *
   * @see {@link https://nativedates.dev/api/month-day/#previous previous}
   */
  previous(day?: CalendarDateInput): CalendarDate;

  /**
   * Alias for `previous()` that returns the most recent occurrence before `day`, defaulting to `today()`.
   *
   * @param day - Reference date to count backward from, defaulting to `today()`
   * @returns Most recent `CalendarDate` before `day`
   *
   * @see {@link https://nativedates.dev/api/month-day/#previous previous}
   */
  last(day?: CalendarDateInput): CalendarDate;

  /**
   * Returns this `MonthDay` unchanged when `'monthDay'` is requested in generic conversion chains.
   *
   * @param kind - Target kind `'monthDay'`
   * @returns This `MonthDay` instance
   *
   * @see {@link https://nativedates.dev/api/month-day/#as as}
   */
  as(kind: 'monthDay'): MonthDay;

  /**
   * Returns `true` when both values have the exact same month and day numbers,
   * extracting the month and day when given a full date or timestamp.
   * Slash, dot, and non-two-digit hyphen strings such as `'10/17'`, `'05/10'`, or `'5-6'`
   * throw a `RangeError` (`invalidMonthDay`).
   *
   * @param other - Another `MonthDay`, ISO `'10-17'` string, fields object, or date value
   * @returns `true` if both values have the exact same month and day numbers
   *
   * @example
   * ```ts
   * const birthday = monthDay(10, 17);
   * birthday.equals('10-17'); // true
   * birthday.equals('1990-10-17'); // true
   * monthDay(2, 29).equals('2027-02-28'); // false
   * ```
   *
   * @see {@link https://nativedates.dev/api/month-day/#equals equals}
   */
  equals(other: MonthDayInput): boolean;

  /**
   * Returns true when `day` is this month-day's occurrence in `day`'s own calendar year.
   * In a common year, February 29 falls on February 28, whereas in a leap year it falls only on February 29.
   *
   * @param day - Date string, `CalendarDate`, `DateTime`, fields object, or `Date`
   * @returns `true` when `day` matches this month-day's observance in that year
   *
   * @example
   * ```ts
   * const leapDay = monthDay(2, 29);
   * leapDay.fallsOn('2027-02-28'); // true
   * leapDay.fallsOn('2028-02-28'); // false
   * leapDay.fallsOn('2028-02-29'); // true
   * ```
   *
   * @see {@link https://nativedates.dev/api/month-day/#fallson fallsOn}
   */
  fallsOn(day: CalendarDateInput): boolean;

  /**
   * Alias for `fallsOn()` that checks whether `day` is this month-day's occurrence in that year.
   *
   * @param day - Date string, `CalendarDate`, `DateTime`, fields object, or `Date`
   * @returns `true` when `day` matches this month-day's observance in that year
   *
   * @see {@link https://nativedates.dev/api/month-day/#fallson fallsOn}
   */
  isOn(day: CalendarDateInput): boolean;

  /**
   * Returns true when this month-day falls on today's date in the given or configured time zone.
   *
   * @param zone - Time zone used to determine today's date
   * @returns `true` if this month-day falls on `today(zone)`
   *
   * @see {@link https://nativedates.dev/api/month-day/#istoday isToday}
   */
  isToday(zone?: Zone): boolean;

  /**
   * Returns true when this month-day falls on tomorrow's date in the given or configured time zone.
   *
   * @param zone - Time zone used to determine tomorrow's date
   * @returns `true` if this month-day falls on `tomorrow(zone)`
   *
   * @see {@link https://nativedates.dev/api/month-day/#istomorrow isTomorrow}
   */
  isTomorrow(zone?: Zone): boolean;

  /**
   * Returns true when this month-day falls on yesterday's date in the given or configured time zone.
   *
   * @param zone - Time zone used to determine yesterday's date
   * @returns `true` if this month-day falls on `yesterday(zone)`
   *
   * @see {@link https://nativedates.dev/api/month-day/#isyesterday isYesterday}
   */
  isYesterday(zone?: Zone): boolean;

  /**
   * Formats the month and day in the locale's own order using presets, custom names from `configure()`,
   * `Intl.DateTimeFormatOptions` objects, or token patterns such as `'MMM Do'`.
   * Gregorian month names are always used so annual dates stay stable across calendars.
   *
   * @param spec - Preset name (default `'medium'`), custom format name, `Intl` options bag, or token pattern
   * @param locale - BCP 47 locale tag overriding this value's or the configured locale for one call
   * @returns Formatted month-and-day string
   *
   * @example
   * ```ts
   * const oct17 = monthDay(10, 17);
   * oct17.format('short', 'en-US'); // '10/17'
   * oct17.format('short', 'en-GB'); // '17/10'
   * oct17.format('long', 'en-US'); // 'October 17'
   * oct17.format('MMM Do', 'en-US'); // 'Oct 17th'
   * ```
   *
   * @see {@link https://nativedates.dev/api/month-day/#format format}
   */
  format(spec?: MonthDayFormat, locale?: Locale): string;

  /**
   * Reads the BCP 47 locale tag carried on this month-day, or `undefined` when none was set.
   *
   * @returns Active locale tag carried on this value, or `undefined`
   *
   * @see {@link https://nativedates.dev/api/month-day/#locale locale}
   */
  locale(): Locale | undefined;
  /**
   * Returns a copy of this month-day carrying `tag` for formatting and derived calendar dates.
   * Passing an empty tag or `null` clears the carried locale.
   *
   * @param tag - BCP 47 locale tag to carry forward, or `null` to clear it
   * @returns A new `MonthDay` carrying `tag`
   *
   * @example
   * ```ts
   * monthDay(5, 1).locale('ru').format('long'); // '1 мая'
   * ```
   *
   * @see {@link https://nativedates.dev/api/month-day/#locale locale}
   */
  locale(tag: Locale | null | undefined): this;

  /**
   * Alias for `locale()` that reads the locale tag carried on this month-day.
   *
   * @returns Active locale tag carried on this value, or `undefined`
   *
   * @see {@link https://nativedates.dev/api/month-day/#lang lang}
   */
  lang(): Locale | undefined;
  /**
   * Alias for `locale()` that attaches or clears a carried locale tag on this month-day.
   *
   * @param tag - BCP 47 locale tag to carry forward, or `null` to clear it
   * @returns A new `MonthDay` carrying `tag`
   *
   * @see {@link https://nativedates.dev/api/month-day/#lang lang}
   */
  lang(tag: Locale | null | undefined): this;

  /**
   * Returns the two-digit ISO month-day string `'MM-DD'`, which round-trips month-first under
   * both `monthDay()` and `dayMonth()`.
   *
   * @returns ISO month-day string such as `'10-17'`
   *
   * @example
   * ```ts
   * monthDay(5, 6).toString(); // '05-06'
   * ```
   *
   * @see {@link https://nativedates.dev/api/month-day/#tostring toString}
   */
  toString(): string;

  /**
   * Serializes the month-day as a two-digit ISO `'MM-DD'` string for `JSON.stringify()`.
   *
   * @returns ISO month-day string matching `toString()`
   *
   * @see {@link https://nativedates.dev/api/month-day/#tostring toString}
   */
  toJSON(): string;

  /**
   * Returns the underlying `Temporal.PlainMonthDay` instance.
   *
   * @returns Underlying `Temporal.PlainMonthDay`
   *
   * @see {@link https://nativedates.dev/api/month-day/#totemporal toTemporal}
   */
  toTemporal(): TemporalPlainMonthDay;

  /**
   * Throws a `RangeError` so numeric operators never coerce a month-day to a number.
   *
   * @see {@link https://nativedates.dev/api/month-day/#valueof valueOf}
   */
  valueOf(): never;
}

/**
 * Creates a `MonthDay` from a month-first string such as `'10-17'` or `'10/17'`, fields object,
 * or any date or timestamp input with its year dropped. February 29 is accepted for leap-day dates.
 *
 * @param input - Month-first string, fields object, `MonthDay`, or date/timestamp value
 * @param options - Time zone (for timestamps) or `MonthDayOptions`
 * @returns An immutable `MonthDay`
 *
 * @example
 * ```ts
 * import { monthDay } from 'native-dates';
 *
 * monthDay('10-17').toString(); // '10-17'
 * monthDay('10/17').toString(); // '10-17'
 * monthDay(2, 29).toString(); // '02-29'
 * ```
 *
 * @see {@link https://nativedates.dev/api/month-day-fn/#monthday monthDay}
 */
export function monthDay(input: MonthDayInput, options?: Zone | MonthDayOptions): MonthDay;
/**
 * Creates a `MonthDay` from 1-indexed month and day numbers.
 *
 * @param month - Calendar month from 1 for January through 12 for December
 * @param day - Day of the month from 1 through 31
 * @returns An immutable `MonthDay`
 *
 * @example
 * ```ts
 * monthDay(10, 17).toString(); // '10-17'
 * ```
 *
 * @see {@link https://nativedates.dev/api/month-day-fn/#monthday monthDay}
 */
export function monthDay(month: number | string, day: number | string): MonthDay;

/**
 * Reads day-first strings such as `'17/10'` into a `MonthDay` regardless of global settings.
 * Two-digit ISO strings with a hyphen (`'10-17'`) still read month-first so JSON output round-trips cleanly.
 *
 * @param input - Day-first string, fields object, `MonthDay`, or date/timestamp value
 * @param options - Time zone (for timestamps) or `ReadOptions`
 * @returns An immutable `MonthDay`
 *
 * @example
 * ```ts
 * import { dayMonth } from 'native-dates';
 *
 * dayMonth('17/10').toString(); // '10-17'
 * dayMonth(17, 10).toString(); // '10-17'
 * dayMonth('10-17').toString(); // '10-17'
 * ```
 *
 * @see {@link https://nativedates.dev/api/month-day-fn/#daymonth dayMonth}
 */
export function dayMonth(input: MonthDayInput, options?: Zone | ReadOptions): MonthDay;
/**
 * Creates a `MonthDay` from whole-number day and month arguments in day-first order.
 *
 * @param day - Day of the month from 1 through 31
 * @param month - Calendar month from 1 for January through 12 for December
 * @returns An immutable `MonthDay`
 *
 * @see {@link https://nativedates.dev/api/month-day-fn/#daymonth dayMonth}
 */
export function dayMonth(day: number | string, month: number | string): MonthDay;

/**
 * Returns true when `value` is a `MonthDay` instance, working across realms and duplicate bundles.
 *
 * @param value - Any value to test
 * @returns `true` if `value` is a `MonthDay`
 *
 * @example
 * ```ts
 * import { isMonthDay, monthDay } from 'native-dates';
 *
 * isMonthDay(monthDay('10-17')); // true
 * isMonthDay('10-17'); // false
 * ```
 *
 * @see {@link https://nativedates.dev/api/kind-of/#ismonthday isMonthDay}
 */
export function isMonthDay(value: unknown): value is MonthDay;
