import type { CalendarDate, CalendarDateInput } from './calendar-date.js';
import type { DateTime, DateTimeInput } from './date-time.js';
import type { Duration, DurationInput } from './duration.js';
import type { FormatSpec } from './helpers/format.js';
import type { Unit } from './helpers/units.js';
import type { Locale, ReadOptions, Zone } from './helpers/zones.js';
import type { Time, TimeInput } from './time.js';

// keeps BaseRange out of the module's exports, which a declaration file would otherwise add
export {};

declare abstract class BaseRange<Point, Input> {
  /** The span in the configured locale's common form, `'Sep 1 – 7, 2026'` */
  readonly text: string;
  readonly start: Point;
  readonly end: Point;
  readonly kind: 'date' | 'datetime' | 'time';
  /** @see {@link https://nativedates.dev/api/ranges/#isempty isEmpty} */
  isEmpty(): boolean;
  /** The whole length, anchored at the start. A date range counts its last day */
  readonly duration: Duration;
  /**
   * The call spelling of `.duration`
   * @see {@link https://nativedates.dev/api/ranges/#as as}
   */
  as(kind: 'duration'): Duration;

  /** @see {@link https://nativedates.dev/api/ranges/#contains contains} */
  contains(value: Input | this): boolean;
  /** Alias for `contains` */
  includes(value: Input | this): boolean;
  /** @see {@link https://nativedates.dev/api/ranges/#overlaps overlaps} */
  overlaps(other: this | string): boolean;
  /** @see {@link https://nativedates.dev/api/ranges/#intersection intersection} */
  intersection(other: this | string): this | null;
  /** @see {@link https://nativedates.dev/api/ranges/#equals equals} */
  equals(other: this | string): boolean;
  /** @see {@link https://nativedates.dev/api/ranges/#points points} */
  points(step: Unit | DurationInput): Point[];
  points(count: number | string, unit: Unit): Point[];
  /** @see {@link https://nativedates.dev/api/ranges/#split split} */
  split(step: Unit | DurationInput): this[];
  split(count: number | string, unit: Unit): this[];
  /** Alias for `split` */
  splitBy(step: Unit | DurationInput): this[];
  splitBy(count: number | string, unit: Unit): this[];
  /** @see {@link https://nativedates.dev/api/ranges/#format format} */
  format(spec?: FormatSpec, locale?: Locale): string;
  /**
   * The locale this value is written in, when one was set on it or on the value it came from
   * @see {@link https://nativedates.dev/api/ranges/#locale locale}
   */
  locale(): Locale | undefined;
  /**
   * The same value written in another locale, which every value made from it keeps. An unset tag clears it
   * @see {@link https://nativedates.dev/api/ranges/#locale locale}
   */
  locale(tag: Locale | null | undefined): this;
  /**
   * Alias for `locale`
   * @see {@link https://nativedates.dev/api/ranges/#lang lang}
   */
  lang(): Locale | undefined;
  lang(tag: Locale | null | undefined): this;
  /** @see {@link https://nativedates.dev/api/ranges/#tostring toString} */
  toString(): string;
  toJSON(): string;
  /** @see {@link https://nativedates.dev/api/ranges/#valueof valueOf} */
  valueOf(): never;
}

/**
 * Two calendar dates, both included: the 1st through the 7th is seven days
 * @see {@link https://nativedates.dev/api/ranges/#daterange DateRange Documentation}
 */
export class DateRange extends BaseRange<CalendarDate, CalendarDateInput> {
  constructor(start: CalendarDateInput, end: CalendarDateInput | DurationInput, options?: Zone | ReadOptions);
  constructor(interval: string, options?: Zone | ReadOptions);
  /**
   * The datetime range covering these days in a zone, midnight through the midnight after the last day
   * @see {@link https://nativedates.dev/api/ranges/#in in}
   */
  in(zone?: Zone): DateTimeRange;
}

/**
 * Two moments, the end excluded: nine until ten and ten until eleven do not overlap
 * @see {@link https://nativedates.dev/api/ranges/#datetimerange DateTimeRange Documentation}
 */
export class DateTimeRange extends BaseRange<DateTime, DateTimeInput> {
  constructor(start: DateTimeInput, end: DateTimeInput | DurationInput, options?: Zone | ReadOptions);
  constructor(interval: string, options?: Zone | ReadOptions);
  /**
   * Both ends read in another zone
   * @see {@link https://nativedates.dev/api/ranges/#in in}
   */
  in(zone?: Zone): DateTimeRange;
}

/**
 * Two times of day, the end excluded: the door closes at the stroke of five
 * @see {@link https://nativedates.dev/api/ranges/#timerange TimeRange Documentation}
 */
export class TimeRange extends BaseRange<Time, TimeInput> {
  constructor(start: TimeInput, end: TimeInput | DurationInput, options?: Zone | ReadOptions);
  constructor(interval: string, options?: Zone | ReadOptions);
}

/** @see {@link https://nativedates.dev/api/range-fn/#daterange dateRange} */
export function dateRange(
  start: CalendarDateInput,
  end: CalendarDateInput | DurationInput,
  options?: Zone | ReadOptions,
): DateRange;
export function dateRange(interval: string, options?: Zone | ReadOptions): DateRange;

/** @see {@link https://nativedates.dev/api/range-fn/#datetimerange datetimeRange} */
export function datetimeRange(
  start: DateTimeInput,
  end: DateTimeInput | DurationInput,
  options?: Zone | ReadOptions,
): DateTimeRange;
export function datetimeRange(interval: string, options?: Zone | ReadOptions): DateTimeRange;

/** @see {@link https://nativedates.dev/api/range-fn/#timerange timeRange} */
export function timeRange(
  start: TimeInput,
  end: TimeInput | DurationInput,
  options?: Zone | ReadOptions,
): TimeRange;
export function timeRange(interval: string, options?: Zone | ReadOptions): TimeRange;

/** @see {@link https://nativedates.dev/api/kind-of/#isdaterange isDateRange} */
export function isDateRange(value: unknown): value is DateRange;
/** @see {@link https://nativedates.dev/api/kind-of/#isdatetimerange isDateTimeRange} */
export function isDateTimeRange(value: unknown): value is DateTimeRange;
/** @see {@link https://nativedates.dev/api/kind-of/#istimerange isTimeRange} */
export function isTimeRange(value: unknown): value is TimeRange;
