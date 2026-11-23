import type { CalendarDate } from '../calendar-date.js';
import type { DateTime } from '../date-time.js';
import type { Duration } from '../duration.js';
import type { DateRange, DateTimeRange, TimeRange } from '../range.js';
import type { Time } from '../time.js';
import type { YearMonth, YearMonthInput } from '../year-month.js';

/**
 * Ordered point value accepted by `compare()` and boundary helpers: a moment, calendar date,
 * time of day, native `Date`, ISO string, or epoch millisecond timestamp.
 *
 * @see {@link https://nativedates.dev/api/compare/ compare}
 */
export type Point = DateTime | CalendarDate | Time | Date | string | number;

/**
 * Maps each range `kind` tag to its concrete range class.
 *
 * @see {@link https://nativedates.dev/api/ranges/ Ranges}
 */
export interface RangeMap {
  /** Inclusive calendar date range. */
  date: DateRange;
  /** Half-open zoned moment range. */
  datetime: DateTimeRange;
  /** Half-open time-of-day range. */
  time: TimeRange;
}

/**
 * Union of the concrete range classes: `DateRange`, `DateTimeRange`, and `TimeRange`.
 *
 * @see {@link https://nativedates.dev/api/ranges/ Ranges}
 */
export type Range = RangeMap[keyof RangeMap];

/**
 * Orders two points, durations, or ranges of the same kind for `Array.prototype.sort()`.
 *
 * `DateTime` values compare by exact instant regardless of time zone, durations compare by total length,
 * and ranges sort by start point first and end point second. Comparing mismatched kinds throws a `TypeError`.
 *
 * @param a - First point, duration, or range (or a raw string, `Date`, or epoch millisecond number)
 * @param b - Second value of the same kind, or a raw input matching `a`
 * @returns `-1` when `a` comes earlier or is shorter, `0` when equal, or 1 when later or longer
 *
 * @example
 * ```ts
 * import { compare, date, hours, minutes } from 'native-dates';
 *
 * [date('2026-12-01'), date('2026-05-10')].sort(compare).map(String); // ['2026-05-10', '2026-12-01']
 * [hours(2), minutes(45)].sort(compare)[0].minutes; // 45
 * ```
 *
 * @see {@link https://nativedates.dev/api/compare/#compare compare}
 */
export function compare(a: Point | Duration | Range, b: Point | Duration | Range): -1 | 0 | 1;
/**
 * Orders two `YearMonth` values chronologically for `Array.prototype.sort()`.
 *
 * @param a - First `YearMonth` to compare
 * @param b - Second `YearMonth` or any input accepted by `yearMonth()`
 * @returns `-1` when `a` is earlier, `0` when equal, or 1 when later
 *
 * @see {@link https://nativedates.dev/api/compare/#compare compare}
 */
export function compare(a: YearMonth, b: YearMonthInput): -1 | 0 | 1;

/**
 * Returns the earliest `YearMonth` from one or more arguments or a non-empty array.
 * Throws a `RangeError` when given an empty list.
 *
 * @param months - One or more `YearMonth` values, or a non-empty array of them
 * @returns The `YearMonth` that comes first chronologically
 *
 * @see {@link https://nativedates.dev/api/compare/#earliest earliest}
 */
export function earliest(first: YearMonth, ...rest: YearMonthInput[]): YearMonth;
export function earliest(months: readonly [YearMonth, ...YearMonthInput[]] | readonly YearMonth[]): YearMonth;
/**
 * Returns the earliest point from one or more arguments or a non-empty array of the same kind.
 * Raw `Date` and epoch millisecond inputs return a `DateTime`. Throws a `RangeError` when given an empty list.
 *
 * @param points - One or more dates, moments, epoch timestamps, or clock times of the same kind
 * @returns The value that comes first, keeping the earlier list item on ties
 *
 * @example
 * ```ts
 * import { date, earliest, time } from 'native-dates';
 *
 * earliest(date('2026-11-20'), date('2026-11-04'), date('2026-11-16')).toString(); // '2026-11-04'
 * earliest([time('5:30pm'), time('9:00am')]).toString(); // '09:00:00'
 * ```
 *
 * @see {@link https://nativedates.dev/api/compare/#earliest earliest}
 */
export function earliest<T extends Point>(
  ...points: T[] | [T[]]
): T extends string ? DateTime | CalendarDate | Time : T extends number | Date ? DateTime : T;

/**
 * Returns the latest `YearMonth` from one or more arguments or a non-empty array.
 * Throws a `RangeError` when given an empty list.
 *
 * @param months - One or more `YearMonth` values, or a non-empty array of them
 * @returns The `YearMonth` that comes last chronologically
 *
 * @see {@link https://nativedates.dev/api/compare/#latest latest}
 */
export function latest(first: YearMonth, ...rest: YearMonthInput[]): YearMonth;
export function latest(months: readonly [YearMonth, ...YearMonthInput[]] | readonly YearMonth[]): YearMonth;
/**
 * Returns the latest point from one or more arguments or a non-empty array of the same kind.
 * Raw `Date` and epoch millisecond inputs return a `DateTime`. Throws a `RangeError` when given an empty list.
 *
 * @param points - One or more dates, moments, epoch timestamps, or clock times of the same kind
 * @returns The value that comes last, keeping the earlier list item on ties
 *
 * @example
 * ```ts
 * import { date, earliest, latest } from 'native-dates';
 *
 * const clamped = earliest(date('2026-11-30'), latest(date('2026-11-01'), date('2026-12-12')));
 * clamped.toString(); // '2026-11-30'
 * ```
 *
 * @see {@link https://nativedates.dev/api/compare/#latest latest}
 */
export function latest<T extends Point>(
  ...points: T[] | [T[]]
): T extends string ? DateTime | CalendarDate | Time : T extends number | Date ? DateTime : T;

/**
 * Returns a string tag naming which type `value` belongs to, or `undefined`
 * for plain JavaScript values such as native `Date` objects, strings, numbers, and plain objects.
 *
 * Works reliably across iframe boundaries and duplicate bundled copies via global symbol brands.
 *
 * @param value - Any value to inspect
 * @returns The value's kind tag, or `undefined` if it is not from this library
 *
 * @example
 * ```ts
 * import { date, hours, kindOf, now } from 'native-dates';
 *
 * kindOf(now()); // 'datetime'
 * kindOf(date('2026-11-16')); // 'date'
 * kindOf(hours(2)); // 'duration'
 * kindOf(new Date()); // undefined
 * ```
 *
 * @see {@link https://nativedates.dev/api/kind-of/#kindof kindOf}
 */
export function kindOf(
  value: unknown,
): 'datetime' | 'date' | 'time' | 'duration' | 'monthDay' | 'yearMonth' | 'dateRange' | 'datetimeRange' | 'timeRange' | undefined;
