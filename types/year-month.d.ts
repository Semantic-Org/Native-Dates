import type { CalendarDate, CalendarDateInput } from './calendar-date.js';
import type { Duration, DurationInput } from './duration.js';
import type { FormatSpec } from './helpers/format.js';
import { IS_YEAR_MONTH } from './helpers/identity.js';
import type { TemporalPlainYearMonth, Unit, YearMonthUnit } from './helpers/units.js';
import type { Locale, ReadOptions, Zone } from './helpers/zones.js';

/**
 * Singular year and month fields accepted when creating or updating a `YearMonth`.
 *
 * @see {@link https://nativedates.dev/api/year-month-fn/#yearmonth yearMonth}
 */
export interface YearMonthFields {
  /** Calendar year, such as 2026. */
  year: number;
  /** Calendar month from 1 for January through 12 for December. */
  month: number;
}

/**
 * Any input accepted by the year-month factories: a `YearMonth`, year-first string such as `'2026-11'`,
 * fields object, `Temporal.PlainYearMonth`, or any date or timestamp input with its day dropped.
 *
 * @see {@link https://nativedates.dev/api/year-month-fn/#accepted-inputs Accepted inputs}
 */
export type YearMonthInput = YearMonth | YearMonthFields | TemporalPlainYearMonth | CalendarDateInput;

/**
 * Format specification accepted by `YearMonth.prototype.format()`: any preset, custom format name,
 * `Intl.DateTimeFormatOptions` object, or token pattern, printing only the year and month.
 *
 * @see {@link https://nativedates.dev/api/year-month/#format format}
 */
export type YearMonthFormat = FormatSpec;

/**
 * A calendar year and month with no day, for billing periods, payment card expiries, and month pickers.
 *
 * Counts in months, quarters, and years, and picks any calendar day inside the month via `on()`.
 * Units smaller than a month and numeric operators throw a `RangeError`.
 *
 * @example
 * ```ts
 * import { monthYear, yearMonth } from 'native-dates';
 *
 * const billing = yearMonth('2026-11');
 * const expiry = monthYear('11/28');
 *
 * billing.daysInMonth; // 30
 * billing.on(15).toString(); // '2026-11-15'
 * ```
 *
 * @see {@link https://nativedates.dev/api/year-month/ YearMonth Documentation}
 */
export class YearMonth {
  /** @internal */
  readonly [IS_YEAR_MONTH]: true;

  /**
   * Creates a new `YearMonth` from a year-first string, fields object, or existing date value.
   * Prefer `yearMonth()` or `monthYear()` in everyday code.
   *
   * @param input - Year-month string, fields object, `YearMonth`, or date/timestamp value
   * @param options - Time zone (for timestamps) or `ReadOptions`
   *
   * @see {@link https://nativedates.dev/api/year-month/#creating-a-yearmonth Creating a YearMonth}
   */
  constructor(input: YearMonthInput, options?: Zone | ReadOptions);
  /**
   * Creates a new `YearMonth` from 1-indexed year and month numbers.
   *
   * @param year - Calendar year, such as 2026
   * @param month - Calendar month from 1 for January through 12 for December
   *
   * @see {@link https://nativedates.dev/api/year-month/#creating-a-yearmonth Creating a YearMonth}
   */
  constructor(year: number | string, month: number | string);

  /**
   * Base century added to two-digit years (0–99) in `monthYear()`.
   *
   * @default 2000
   * @see {@link https://nativedates.dev/api/year-month/#properties Properties}
   */
  static century: number;

  /** Locale-formatted month and year, such as `'Nov 2026'`. */
  readonly text: string;
  /** Calendar month from 1 for January through 12 for December. */
  readonly month: number;
  /** Calendar year, such as 2026. */
  readonly year: number;
  /** Calendar quarter from 1 through 4. */
  readonly quarter: number;
  /** Number of days in this month (28–31). */
  readonly daysInMonth: number;
  /** Number of days in this year (365 or 366). */
  readonly daysInYear: number;

  /**
   * Returns true when this month's calendar year has 366 days.
   *
   * @returns `true` if this month falls in a leap year
   *
   * @example
   * ```ts
   * yearMonth('2028-02').isLeapYear(); // true
   * yearMonth('2026-02').isLeapYear(); // false
   * ```
   *
   * @see {@link https://nativedates.dev/api/year-month/#isleapyear isLeapYear}
   */
  isLeapYear(): boolean;

  /** First calendar day of this month (`YYYY-MM-01`). */
  readonly start: CalendarDate;
  /** Last calendar day of this month, from the 28th through the 31st. */
  readonly end: CalendarDate;

  /**
   * Moves forward by years, quarters, or months and returns a new `YearMonth`.
   * Units smaller than a month throw a `RangeError`.
   *
   * @param amount - Numeric count paired with `unit`, `Duration`, phrase, or fields object
   * @param unit - Month, quarter, or year unit name when `amount` is a number
   * @returns A new `YearMonth` shifted forward on the calendar
   *
   * @example
   * ```ts
   * const billing = yearMonth('2026-11');
   * billing.plus(3, 'months').toString(); // '2027-02'
   * billing.plus('1 year').toString(); // '2027-11'
   * ```
   *
   * @see {@link https://nativedates.dev/api/year-month/#plus plus}
   */
  plus(amount: DurationInput, unit?: YearMonthUnit): YearMonth;

  /**
   * Alias for `plus()` that moves forward by years, quarters, or months.
   *
   * @param amount - Numeric count paired with `unit`, `Duration`, phrase, or fields object
   * @param unit - Month, quarter, or year unit name when `amount` is a number
   * @returns A new `YearMonth` shifted forward on the calendar
   *
   * @see {@link https://nativedates.dev/api/year-month/#plus plus}
   */
  add(amount: DurationInput, unit?: YearMonthUnit): YearMonth;

  /**
   * Moves backward by years, quarters, or months and returns a new `YearMonth`.
   *
   * @param amount - Numeric count paired with `unit`, `Duration`, phrase, or fields object
   * @param unit - Month, quarter, or year unit name when `amount` is a number
   * @returns A new `YearMonth` shifted backward on the calendar
   *
   * @example
   * ```ts
   * yearMonth('2026-11').minus(1, 'year').toString(); // '2025-11'
   * ```
   *
   * @see {@link https://nativedates.dev/api/year-month/#minus minus}
   */
  minus(amount: DurationInput, unit?: YearMonthUnit): YearMonth;

  /**
   * Alias for `minus()` that moves backward by years, quarters, or months.
   *
   * @param amount - Numeric count paired with `unit`, `Duration`, phrase, or fields object
   * @param unit - Month, quarter, or year unit name when `amount` is a number
   * @returns A new `YearMonth` shifted backward on the calendar
   *
   * @see {@link https://nativedates.dev/api/year-month/#minus minus}
   */
  subtract(amount: DurationInput, unit?: YearMonthUnit): YearMonth;

  /**
   * Returns a new `YearMonth` with the year, month, or both replaced.
   * Out-of-range months and units smaller than a month throw a `RangeError`.
   *
   * @param fields - Object with `year` or `month` values to replace
   * @returns A new `YearMonth` with updated calendar fields
   *
   * @example
   * ```ts
   * const billing = yearMonth('2026-11');
   * billing.set('month', 2).toString(); // '2026-02'
   * billing.set({ year: 2028, month: 2 }).daysInMonth; // 29
   * ```
   *
   * @see {@link https://nativedates.dev/api/year-month/#set set}
   */
  set(fields: Partial<YearMonthFields>): YearMonth;
  /**
   * Returns a new `YearMonth` with a single field (`'year'` or `'month'`) replaced.
   *
   * @param unit - Field name (`'year'` or `'month'`)
   * @param value - Whole-number value for `unit`
   * @returns A new `YearMonth` with the updated field
   *
   * @see {@link https://nativedates.dev/api/year-month/#set set}
   */
  set(
    unit: 'year' | 'years' | 'y' | 'yr' | 'yrs' | 'month' | 'months' | 'M' | 'mo' | 'mos',
    value: number,
  ): YearMonth;

  /**
   * Places a whole day number from 1 through 31 in this month and returns a `CalendarDate`.
   * Day 31 clamps to the final day of shorter months such as February or April,
   * while numbers outside 1 through 31 throw a `RangeError`.
   *
   * @param day - Whole day of the month from 1 through 31
   * @returns The `CalendarDate` for that day of the month
   *
   * @example
   * ```ts
   * yearMonth('2026-11').on(15).toString(); // '2026-11-15'
   * yearMonth('2026-02').on(31).toString(); // '2026-02-28'
   * ```
   *
   * @see {@link https://nativedates.dev/api/year-month/#on on}
   */
  on(day: number | string): CalendarDate;

  /**
   * Orders this year-month against `other` for `Array.prototype.sort()`.
   * Passing a full date or timestamp compares against the month it falls in.
   *
   * @param other - Another `YearMonth` or any input accepted by `yearMonth()`
   * @returns `-1` when earlier, `0` when equal, or 1 when later
   *
   * @example
   * ```ts
   * yearMonth('2026-05').compare('2026-11'); // -1
   * yearMonth('2026-11').compare('2026-11-16'); // 0
   * ```
   *
   * @see {@link https://nativedates.dev/api/year-month/#compare compare}
   */
  compare(other: YearMonthInput): number;

  /**
   * Returns true when both values represent the same calendar year and month.
   *
   * @param other - Another `YearMonth` or any input accepted by `yearMonth()`
   * @returns `true` if both values represent the same year and month
   *
   * @example
   * ```ts
   * yearMonth('2026-11').equals(yearMonth(2026, 11)); // true
   * ```
   *
   * @see {@link https://nativedates.dev/api/year-month/#equals equals}
   */
  equals(other: YearMonthInput): boolean;

  /**
   * Returns true when this year-month comes earlier than `other`.
   *
   * @param other - Year-month to compare against
   * @returns `true` when earlier than `other`
   *
   * @example
   * ```ts
   * yearMonth('2026-10').isBefore('2026-11'); // true
   * ```
   *
   * @see {@link https://nativedates.dev/api/year-month/#isbefore isBefore}
   */
  isBefore(other: YearMonthInput): boolean;

  /**
   * Returns true when this year-month comes later than `other`.
   *
   * @param other - Year-month to compare against
   * @returns `true` when later than `other`
   *
   * @example
   * ```ts
   * yearMonth('2026-12').isAfter('2026-11'); // true
   * ```
   *
   * @see {@link https://nativedates.dev/api/year-month/#isafter isAfter}
   */
  isAfter(other: YearMonthInput): boolean;

  /**
   * Returns true when the given calendar date or timestamp falls inside this year and month.
   *
   * @param day - Date string, `CalendarDate`, `DateTime`, fields object, or `Date`
   * @returns `true` when `day` falls within this month
   *
   * @example
   * ```ts
   * const nov = yearMonth('2026-11');
   * nov.contains('2026-11-16'); // true
   * nov.contains('2026-12-01'); // false
   * ```
   *
   * @see {@link https://nativedates.dev/api/year-month/#contains contains}
   */
  contains(day: CalendarDateInput): boolean;

  /**
   * Alias for `contains()` that checks whether `day` falls inside this year and month.
   *
   * @param day - Date string, `CalendarDate`, `DateTime`, fields object, or `Date`
   * @returns `true` when `day` falls within this month
   *
   * @see {@link https://nativedates.dev/api/year-month/#contains contains}
   */
  includes(day: CalendarDateInput): boolean;

  /**
   * Returns true once this entire month is earlier than today's month in the given or configured time zone.
   *
   * @param zone - Time zone used to determine today's month
   * @returns `true` when `end` is in the past
   *
   * @see {@link https://nativedates.dev/api/year-month/#ispast isPast}
   */
  isPast(zone?: Zone): boolean;

  /**
   * Returns true while this month is ahead of today's month in the given or configured time zone.
   *
   * @param zone - Time zone used to determine today's month
   * @returns `true` when `start` is in the future
   *
   * @see {@link https://nativedates.dev/api/year-month/#isfuture isFuture}
   */
  isFuture(zone?: Zone): boolean;

  /**
   * Measures the span from this month to `other` as a `Duration` of years and months,
   * returning a negative duration when `other` is earlier. Remembers the start of this month
   * so months and years can be totaled in any unit.
   *
   * @param other - Target year-month to measure toward
   * @returns A signed `Duration` of years and months
   *
   * @example
   * ```ts
   * const start = yearMonth('2026-03');
   * start.until('2027-06').toString(); // 'P1Y3M'
   * start.until('2027-06', 'months'); // 15
   * ```
   *
   * @see {@link https://nativedates.dev/api/year-month/#until until}
   */
  until(other: YearMonthInput): Duration;
  /**
   * Measures the span from this month to `other` as a floating-point count in `unit`.
   *
   * @param other - Target year-month to measure toward
   * @param unit - Unit name to express the total span in, such as `'months'` or `'days'`
   * @returns Signed total span in `unit`
   *
   * @see {@link https://nativedates.dev/api/year-month/#until until}
   */
  until(other: YearMonthInput, unit: Unit): number;

  /**
   * Measures the span elapsed since an earlier year-month as a `Duration` of years and months.
   *
   * @param other - Earlier year-month to measure from
   * @returns A signed `Duration` from `other` to this month
   *
   * @example
   * ```ts
   * yearMonth('2026-11').since('2026-05', 'months'); // 6
   * ```
   *
   * @see {@link https://nativedates.dev/api/year-month/#since since}
   */
  since(other: YearMonthInput): Duration;
  /**
   * Measures the span elapsed since `other` as a floating-point count in `unit`.
   *
   * @param other - Earlier year-month to measure from
   * @param unit - Unit name to express the elapsed span in, such as `'months'` or `'years'`
   * @returns Signed elapsed span in `unit`
   *
   * @see {@link https://nativedates.dev/api/year-month/#since since}
   */
  since(other: YearMonthInput, unit: Unit): number;

  /**
   * Returns this `YearMonth` unchanged when `'yearMonth'` is requested in generic conversion chains.
   *
   * @param kind - Target kind `'yearMonth'`
   * @returns This `YearMonth` instance
   *
   * @see {@link https://nativedates.dev/api/year-month/#as as}
   */
  as(kind: 'yearMonth'): YearMonth;

  /**
   * Formats the year and month using presets, custom names from `configure()`,
   * `Intl.DateTimeFormatOptions` objects, or token patterns such as `'MM/YY'`.
   *
   * @param spec - Preset name (default `'medium'`), custom format name, `Intl` options bag, or token pattern
   * @param locale - BCP 47 locale tag overriding this month's or the configured locale for one call
   * @returns Formatted month-and-year string
   *
   * @example
   * ```ts
   * const nov = yearMonth('2026-11');
   * nov.format('short', 'en-US'); // '11/2026'
   * nov.format('long', 'en-US'); // 'November 2026'
   * nov.format('MM/YY'); // '11/26'
   * ```
   *
   * @see {@link https://nativedates.dev/api/year-month/#format format}
   */
  format(spec?: YearMonthFormat, locale?: Locale): string;

  /**
   * Reads the BCP 47 locale tag carried on this month, or `undefined` when none was set.
   *
   * @returns Active locale tag carried on this value, or `undefined`
   *
   * @see {@link https://nativedates.dev/api/year-month/#locale locale}
   */
  locale(): Locale | undefined;
  /**
   * Returns a copy of this month carrying `tag` for formatting and derived calendar dates.
   * Passing an empty tag or `null` clears the carried locale.
   *
   * @param tag - BCP 47 locale tag to carry forward, or `null` to clear it
   * @returns A new `YearMonth` carrying `tag`
   *
   * @example
   * ```ts
   * yearMonth('2026-05').locale('ru').format('long'); // 'май 2026 г.'
   * ```
   *
   * @see {@link https://nativedates.dev/api/year-month/#locale locale}
   */
  locale(tag: Locale | null | undefined): this;

  /**
   * Alias for `locale()` that reads the locale tag carried on this month.
   *
   * @returns Active locale tag carried on this value, or `undefined`
   *
   * @see {@link https://nativedates.dev/api/year-month/#lang lang}
   */
  lang(): Locale | undefined;
  /**
   * Alias for `locale()` that attaches or clears a carried locale tag on this month.
   *
   * @param tag - BCP 47 locale tag to carry forward, or `null` to clear it
   * @returns A new `YearMonth` carrying `tag`
   *
   * @see {@link https://nativedates.dev/api/year-month/#lang lang}
   */
  lang(tag: Locale | null | undefined): this;

  /**
   * Returns the ISO 8601 year-month string `'YYYY-MM'`, matching HTML `<input type="month">` values.
   *
   * @returns ISO 8601 year-month string such as `'2026-11'`
   *
   * @example
   * ```ts
   * yearMonth(2026, 11).toString(); // '2026-11'
   * ```
   *
   * @see {@link https://nativedates.dev/api/year-month/#tostring toString}
   */
  toString(): string;

  /**
   * Serializes the year-month as an ISO 8601 `'YYYY-MM'` string for `JSON.stringify()`.
   *
   * @returns ISO 8601 year-month string matching `toString()`
   *
   * @see {@link https://nativedates.dev/api/year-month/#tostring toString}
   */
  toJSON(): string;

  /**
   * Returns the underlying `Temporal.PlainYearMonth` instance.
   *
   * @returns Underlying `Temporal.PlainYearMonth`
   *
   * @see {@link https://nativedates.dev/api/year-month/#totemporal toTemporal}
   */
  toTemporal(): TemporalPlainYearMonth;

  /**
   * Throws a `RangeError` so numeric operators never coerce a year-month to a number.
   * Compare year-months with methods like `isBefore()`, or sort arrays with `compare()`.
   *
   * @see {@link https://nativedates.dev/api/year-month/#valueof valueOf}
   */
  valueOf(): never;
}

/**
 * Creates a `YearMonth` from a year-first string such as `'2026-11'`, fields object,
 * or any date or timestamp input with its day dropped. Missing inputs throw a `TypeError`.
 *
 * @param input - Year-first string, fields object, `YearMonth`, or date/timestamp value
 * @param options - Time zone (for timestamps) or `ReadOptions`
 * @returns An immutable `YearMonth`
 *
 * @example
 * ```ts
 * import { yearMonth } from 'native-dates';
 *
 * yearMonth('2026-11').toString(); // '2026-11'
 * yearMonth(2026, 11).toString(); // '2026-11'
 * yearMonth('2026-11-16').toString(); // '2026-11'
 * ```
 *
 * @see {@link https://nativedates.dev/api/year-month-fn/#yearmonth yearMonth}
 */
export function yearMonth(input: YearMonthInput, options?: Zone | ReadOptions): YearMonth;
/**
 * Creates a `YearMonth` from whole-number year and 1-indexed month arguments.
 *
 * @param year - Calendar year, such as 2026
 * @param month - Calendar month from 1 for January through 12 for December
 * @returns An immutable `YearMonth`
 *
 * @example
 * ```ts
 * yearMonth(2026, 11).toString(); // '2026-11'
 * ```
 *
 * @see {@link https://nativedates.dev/api/year-month-fn/#yearmonth yearMonth}
 */
export function yearMonth(year: number | string, month: number | string): YearMonth;

/**
 * Reads month-first card-expiry strings such as `'11/26'` into a `YearMonth`.
 * Two-digit years are added to `YearMonth.century`, while four-digit ISO strings
 * still read year-first so serialized values round-trip cleanly.
 *
 * @param input - Card-expiry string, fields object, `YearMonth`, or date/timestamp value
 * @param options - Time zone (for timestamps) or `ReadOptions`
 * @returns An immutable `YearMonth`
 *
 * @example
 * ```ts
 * import { monthYear } from 'native-dates';
 *
 * monthYear('11/26').toString(); // '2026-11'
 * monthYear('05/2028').toString(); // '2028-05'
 * monthYear(11, 26).toString(); // '2026-11'
 * ```
 *
 * @see {@link https://nativedates.dev/api/year-month-fn/#monthyear monthYear}
 */
export function monthYear(input: YearMonthInput, options?: Zone | ReadOptions): YearMonth;
/**
 * Creates a `YearMonth` from 1-indexed month and two-digit or four-digit year arguments.
 *
 * @param month - Calendar month from 1 for January through 12 for December
 * @param year - Two-digit (0–99) or four-digit calendar year
 * @returns An immutable `YearMonth`
 *
 * @see {@link https://nativedates.dev/api/year-month-fn/#monthyear monthYear}
 */
export function monthYear(month: number | string, year: number | string): YearMonth;

/**
 * Returns true when `value` is a `YearMonth` instance, working across realms and duplicate bundles.
 *
 * @param value - Any value to test
 * @returns `true` if `value` is a `YearMonth`
 *
 * @example
 * ```ts
 * import { isYearMonth, yearMonth } from 'native-dates';
 *
 * isYearMonth(yearMonth('2026-11')); // true
 * isYearMonth('2026-11'); // false
 * ```
 *
 * @see {@link https://nativedates.dev/api/kind-of/#isyearmonth isYearMonth}
 */
export function isYearMonth(value: unknown): value is YearMonth;
