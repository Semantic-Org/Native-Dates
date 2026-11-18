import type { CalendarDate } from '../calendar-date.js';
import type { DateTime } from '../date-time.js';
import type { Duration } from '../duration.js';
import type { DateRange, DateTimeRange, TimeRange } from '../range.js';
import type { Time } from '../time.js';
import type { YearMonth, YearMonthInput } from '../year-month.js';

/** A datetime, a date or a time, a string that reads as one, or epoch milliseconds */
export type Point = DateTime | CalendarDate | Time | Date | string | number;

export interface RangeMap {
  date: DateRange;
  datetime: DateTimeRange;
  time: TimeRange;
}

export type Range = RangeMap[keyof RangeMap];

/**
 * A sort comparator over points of one kind, durations, or ranges of one kind. A raw value reads as the first's kind
 * @see {@link https://nativedates.dev/api/compare/#compare compare}
 */
export function compare(a: Point | Duration | Range, b: Point | Duration | Range): -1 | 0 | 1;
export function compare(a: YearMonth, b: YearMonthInput): -1 | 0 | 1;

/**
 * The point that comes first, from several arguments or one array
 * @see {@link https://nativedates.dev/api/compare/#earliest earliest}
 */
export function earliest(...months: YearMonth[] | [YearMonth[]]): YearMonth;
export function earliest<T extends Point>(
  ...points: T[] | [T[]]
): T extends string ? DateTime | CalendarDate | Time : T extends number | Date ? DateTime : T;
/**
 * The point that comes last, from several arguments or one array
 * @see {@link https://nativedates.dev/api/compare/#latest latest}
 */
export function latest(...months: YearMonth[] | [YearMonth[]]): YearMonth;
export function latest<T extends Point>(
  ...points: T[] | [T[]]
): T extends string ? DateTime | CalendarDate | Time : T extends number | Date ? DateTime : T;

/**
 * The kind of a value from this library, or undefined
 * @see {@link https://nativedates.dev/api/kind-of/#kindof kindOf}
 */
export function kindOf(
  value: unknown,
): 'datetime' | 'date' | 'time' | 'duration' | 'monthDay' | 'yearMonth' | 'dateRange' | 'datetimeRange' | 'timeRange' | undefined;
