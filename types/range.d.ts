import type { CalendarDate, CalendarDateInput } from './calendar-date.js';
import type { DateTime, DateTimeInput } from './date-time.js';
import type { Duration, DurationInput } from './duration.js';
import type { FormatSpec } from './helpers/format.js';
import { IS_DATE_RANGE, IS_DATE_TIME_RANGE, IS_RANGE, IS_TIME_RANGE } from './helpers/identity.js';
import type { Unit } from './helpers/units.js';
import type { Locale, ReadOptions, Zone } from './helpers/zones.js';
import type { Time, TimeInput } from './time.js';

// keeps BaseRange out of the module's exports, which a declaration file would otherwise add
export {};

declare abstract class BaseRange<Point, Input> {
  /** @internal */
  readonly [IS_RANGE]: true;

  /** Locale-formatted range string, such as `'Sep 1 – 7, 2026'`. */
  readonly text: string;
  /** Starting point of the range. */
  readonly start: Point;
  /** Ending point of the range (inclusive on `DateRange`, exclusive on `DateTimeRange` and `TimeRange`). */
  readonly end: Point;
  /** Discriminant tag naming which kind of points this range holds. */
  readonly kind: 'date' | 'datetime' | 'time';

  /**
   * Returns true when a moment or clock range has identical `start` and `end` points.
   * Always returns false on a `DateRange` because a single calendar date spans one full day.
   *
   * @returns `true` if the range spans zero time
   *
   * @example
   * ```ts
   * timeRange('09:00', '09:00').isEmpty(); // true
   * dateRange('2026-09-01', '2026-09-01').isEmpty(); // false
   * ```
   *
   * @see {@link https://nativedates.dev/api/ranges/#isempty isEmpty}
   */
  isEmpty(): boolean;

  /** Full length of the range anchored at `start`, counting the last day on `DateRange` and wrapping overnight on `TimeRange`. */
  readonly duration: Duration;

  /**
   * Returns the range's `Duration` when `'duration'` is requested inside a method chain.
   *
   * @param kind - Target kind `'duration'`
   * @returns Full `Duration` of the range
   *
   * @example
   * ```ts
   * dateRange('2026-09-01', '2026-09-07').as('duration').days; // 7
   * ```
   *
   * @see {@link https://nativedates.dev/api/ranges/#as as}
   */
  as(kind: 'duration'): Duration;

  /**
   * Checks whether a point or another range of the same kind lies inside this range.
   * Date ranges include `end`, moment and clock ranges exclude it, and overnight clock ranges
   * match times on either side of midnight.
   *
   * @param value - Point input or range of the same kind
   * @returns `true` when `value` falls inside this range
   *
   * @example
   * ```ts
   * dateRange('2026-09-01', '2026-09-07').contains('2026-09-07'); // true
   * timeRange('22:00', '06:00').contains('02:15'); // true
   * timeRange('22:00', '06:00').contains('06:00'); // false
   * ```
   *
   * @see {@link https://nativedates.dev/api/ranges/#contains contains}
   */
  contains(value: Input | this): boolean;

  /**
   * Alias for `contains()` that checks whether `value` lies inside this range.
   *
   * @param value - Point input or range of the same kind
   * @returns `true` when `value` falls inside this range
   *
   * @see {@link https://nativedates.dev/api/ranges/#contains contains}
   */
  includes(value: Input | this): boolean;

  /**
   * Returns true when two ranges of the same kind share at least one day or instant.
   * Back-to-back `DateTimeRange` or `TimeRange` slots where the first ends at the second's start do not overlap.
   *
   * @param other - Range instance or interval string of the same kind
   * @returns `true` when both ranges share time
   *
   * @example
   * ```ts
   * timeRange('09:00', '10:00').overlaps(timeRange('10:00', '11:00')); // false
   * dateRange('2026-09-01', '2026-09-05').overlaps('2026-09-05/2026-09-10'); // true
   * ```
   *
   * @see {@link https://nativedates.dev/api/ranges/#overlaps overlaps}
   */
  overlaps(other: this | string): boolean;

  /**
   * Returns a new range covering only the span shared by both ranges, or `null` when disjoint.
   *
   * @param other - Range instance or interval string of the same kind
   * @returns Overlapping range of the same kind, or `null` when disjoint
   *
   * @example
   * ```ts
   * const a = dateRange('2026-09-01', '2026-09-10');
   * a.intersection('2026-09-05/2026-09-15')?.toString(); // '2026-09-05/2026-09-10'
   * a.intersection('2026-09-20/2026-09-25'); // null
   * ```
   *
   * @see {@link https://nativedates.dev/api/ranges/#intersection intersection}
   */
  intersection(other: this | string): this | null;

  /**
   * Returns true when both ranges have equal `start` and `end` points.
   *
   * @param other - Range instance or interval string of the same kind
   * @returns `true` if both ranges span the same endpoints
   *
   * @example
   * ```ts
   * dateRange('2026-09-01', '2026-09-07').equals('2026-09-01/2026-09-07'); // true
   * ```
   *
   * @see {@link https://nativedates.dev/api/ranges/#equals equals}
   */
  equals(other: this | string): boolean;

  /**
   * Walks forward from `start` by a positive unit or duration and returns every point inside the range.
   * Steps count from `start` rather than chaining additions, so monthly steps from January 31
   * land on each month's final day.
   *
   * @param step - Unit name such as `'day'` or duration input such as `'30m'`
   * @returns Ordered array of points inside the range
   *
   * @example
   * ```ts
   * dateRange('2026-01-31', '2026-04-30').points('month').map(String);
   * // ['2026-01-31', '2026-02-28', '2026-03-31', '2026-04-30']
   * ```
   *
   * @see {@link https://nativedates.dev/api/ranges/#points points}
   */
  points(step: Unit | DurationInput): Point[];
  /**
   * Walks forward from `start` by `count` of `unit` and returns every point inside the range.
   *
   * @param count - Positive step count
   * @param unit - Step unit name, such as `'days'` or `'hours'`
   * @returns Ordered array of points inside the range
   *
   * @see {@link https://nativedates.dev/api/ranges/#points points}
   */
  points(count: number | string, unit: Unit): Point[];

  /**
   * Divides the range into contiguous sub-ranges of `step`, clamping the final chunk to `end`.
   *
   * @param step - Unit name or duration step
   * @returns Contiguous sub-ranges covering this range
   *
   * @example
   * ```ts
   * dateRange('2026-09-01', '2026-09-10').split(4, 'days').map(String);
   * // ['2026-09-01/2026-09-04', '2026-09-05/2026-09-08', '2026-09-09/2026-09-10']
   * ```
   *
   * @see {@link https://nativedates.dev/api/ranges/#split split}
   */
  split(step: Unit | DurationInput): this[];
  /**
   * Divides the range into contiguous sub-ranges of `count` `unit`s, clamping the final chunk to `end`.
   *
   * @param count - Positive step count
   * @param unit - Step unit name, such as `'days'` or `'minutes'`
   * @returns Contiguous sub-ranges covering this range
   *
   * @example
   * ```ts
   * dateRange('2026-09-01', '2026-09-10').split(4, 'days').length; // 3
   * ```
   *
   * @see {@link https://nativedates.dev/api/ranges/#split split}
   */
  split(count: number | string, unit: Unit): this[];

  /**
   * Alias for `split()` that divides the range into contiguous sub-ranges of `step`.
   *
   * @param step - Unit name or duration step
   * @returns Contiguous sub-ranges covering this range
   *
   * @see {@link https://nativedates.dev/api/ranges/#split split}
   */
  splitBy(step: Unit | DurationInput): this[];
  /**
   * Alias for `split()` that divides the range into contiguous sub-ranges of `count` `unit`s.
   *
   * @param count - Positive step count
   * @param unit - Step unit name
   * @returns Contiguous sub-ranges covering this range
   *
   * @see {@link https://nativedates.dev/api/ranges/#split split}
   */
  splitBy(count: number | string, unit: Unit): this[];

  /**
   * Formats the range using localized `Intl` range formatting (collapsing shared dates or months)
   * for presets and options bags, or formats each endpoint joined by `' – '` for token patterns.
   *
   * @param spec - Preset name, custom format name from `configure()`, `Intl` options bag, or token pattern
   * @param locale - BCP 47 locale tag overriding this range's or the configured locale for one call
   * @returns Formatted range string
   *
   * @example
   * ```ts
   * const trip = dateRange('2026-09-01', '2026-09-07');
   * trip.format('medium', 'en-US'); // 'Sep 1 – 7, 2026'
   * trip.format('YYYY-MM-DD'); // '2026-09-01 – 2026-09-07'
   * ```
   *
   * @see {@link https://nativedates.dev/api/ranges/#format format}
   */
  format(spec?: FormatSpec, locale?: Locale): string;

  /**
   * Reads the BCP 47 locale tag carried on this range, or `undefined` when none was set.
   *
   * @returns Active locale tag carried on this value, or `undefined`
   *
   * @see {@link https://nativedates.dev/api/ranges/#locale locale}
   */
  locale(): Locale | undefined;
  /**
   * Returns a copy of this range carrying `tag` across text previews, presets, endpoints, and sub-ranges.
   * Passing an empty tag or `null` clears the carried locale.
   *
   * @param tag - BCP 47 locale tag to carry forward, or `null` to clear it
   * @returns A new range of the same kind carrying `tag`
   *
   * @example
   * ```ts
   * dateRange('2026-09-01', '2026-09-07').locale('de-DE').format('medium'); // '01.–07.09.2026'
   * ```
   *
   * @see {@link https://nativedates.dev/api/ranges/#locale locale}
   */
  locale(tag: Locale | null | undefined): this;

  /**
   * Alias for `locale()` that reads the locale tag carried on this range.
   *
   * @returns Active locale tag carried on this value, or `undefined`
   *
   * @see {@link https://nativedates.dev/api/ranges/#lang lang}
   */
  lang(): Locale | undefined;
  /**
   * Alias for `locale()` that attaches or clears a carried locale tag on this range.
   *
   * @param tag - BCP 47 locale tag to carry forward, or `null` to clear it
   * @returns A new range of the same kind carrying `tag`
   *
   * @see {@link https://nativedates.dev/api/ranges/#lang lang}
   */
  lang(tag: Locale | null | undefined): this;

  /**
   * Returns the ISO 8601 interval string `'start/end'`, which parses back directly in the range factories.
   *
   * @returns ISO 8601 interval string such as `'2026-09-01/2026-09-07'`
   *
   * @example
   * ```ts
   * dateRange('2026-09-01', '2026-09-07').toString(); // '2026-09-01/2026-09-07'
   * ```
   *
   * @see {@link https://nativedates.dev/api/ranges/#tostring toString}
   */
  toString(): string;

  /**
   * Serializes the range as an ISO 8601 `'start/end'` interval string for `JSON.stringify()`.
   *
   * @returns ISO 8601 interval string matching `toString()`
   *
   * @see {@link https://nativedates.dev/api/ranges/#tostring toString}
   */
  toJSON(): string;

  /**
   * Throws a `RangeError` so numeric operators never coerce a range to a number.
   *
   * @see {@link https://nativedates.dev/api/ranges/#valueof valueOf}
   */
  valueOf(): never;
}

/**
 * An inclusive range between two `CalendarDate` endpoints, where September 1 through September 7
 * covers all seven days. Passing an end date earlier than `start` throws a `RangeError`.
 *
 * @example
 * ```ts
 * import { date, dateRange } from 'native-dates';
 *
 * const trip = date('2026-09-01').to('2026-09-07');
 * const sprint = dateRange('2026-11-02', '2 weeks');
 * trip.duration.days; // 7
 * ```
 *
 * @see {@link https://nativedates.dev/api/ranges/#daterange DateRange Documentation}
 */
export class DateRange extends BaseRange<CalendarDate, CalendarDateInput> {
  /** @internal */
  readonly [IS_DATE_RANGE]: true;
  /** Discriminant tag `'date'` identifying a calendar date range. */
  readonly kind: 'date';

  /**
   * Creates an inclusive `DateRange` from a start date and an inclusive end date or calendar duration.
   *
   * @param start - Start calendar date input
   * @param end - Inclusive end date or calendar duration length
   * @param options - Time zone or `ReadOptions` used when parsing endpoints
   *
   * @see {@link https://nativedates.dev/api/ranges/#daterange DateRange}
   */
  constructor(start: CalendarDateInput, end: CalendarDateInput | DurationInput, options?: Zone | ReadOptions);
  /**
   * Creates an inclusive `DateRange` from an interval string (`'2026-09-01/2026-09-07'`).
   *
   * @param interval - Interval string joined by `/`, ` - `, ` – `, or ` to `
   * @param options - Time zone or `ReadOptions` used when parsing endpoints
   *
   * @see {@link https://nativedates.dev/api/ranges/#daterange DateRange}
   */
  constructor(interval: string, options?: Zone | ReadOptions);

  /**
   * Converts this `DateRange` into a half-open `DateTimeRange` from midnight on the start day
   * until midnight after the final day in `zone`, matching timestamp query bounds.
   *
   * @param zone - Target time zone, defaulting to the configured zone
   * @returns Half-open `DateTimeRange` covering every instant of these days in `zone`
   *
   * @example
   * ```ts
   * dateRange('2026-09-01', '2026-09-03').in('UTC').toString();
   * // '2026-09-01T00:00:00.000Z/2026-09-04T00:00:00.000Z'
   * ```
   *
   * @see {@link https://nativedates.dev/api/ranges/#in in}
   */
  in(zone?: Zone): DateTimeRange;
}

/**
 * A half-open range between two `DateTime` moments that includes `start` and excludes `end`,
 * so back-to-back slots such as 9:00–10:00 and 10:00–11:00 meet without overlapping.
 *
 * @example
 * ```ts
 * import { datetime, datetimeRange } from 'native-dates';
 *
 * const standup = datetime('2026-09-01T09:00', 'America/New_York').for('30m');
 * const block = datetimeRange('2026-09-01T09:00', '2026-09-01T10:30', 'America/New_York');
 * standup.duration.minutes; // 30
 * ```
 *
 * @see {@link https://nativedates.dev/api/ranges/#datetimerange DateTimeRange Documentation}
 */
export class DateTimeRange extends BaseRange<DateTime, DateTimeInput> {
  /** @internal */
  readonly [IS_DATE_TIME_RANGE]: true;
  /** Discriminant tag `'datetime'` identifying a zoned moment range. */
  readonly kind: 'datetime';

  /**
   * Creates a half-open `DateTimeRange` starting at `start` and ending before `end` or across a duration.
   *
   * @param start - Start moment input
   * @param end - Exclusive end moment (read in `start`'s zone when unzoned) or duration length
   * @param options - Time zone or `ReadOptions` for both endpoints
   *
   * @see {@link https://nativedates.dev/api/ranges/#datetimerange DateTimeRange}
   */
  constructor(start: DateTimeInput, end: DateTimeInput | DurationInput, options?: Zone | ReadOptions);
  /**
   * Creates a half-open `DateTimeRange` from an interval string.
   *
   * @param interval - Interval string joined by `/`, ` - `, ` – `, or ` to `
   * @param options - Time zone or `ReadOptions` for both endpoints
   *
   * @see {@link https://nativedates.dev/api/ranges/#datetimerange DateTimeRange}
   */
  constructor(interval: string, options?: Zone | ReadOptions);

  /**
   * Returns a new `DateTimeRange` with both endpoints viewed in `zone`.
   *
   * @param zone - Target IANA time zone, fixed offset, or `'UTC'`
   * @returns Half-open `DateTimeRange` in `zone`
   *
   * @example
   * ```ts
   * datetimeRange('2026-09-01T09:00Z', '2026-09-01T10:00Z').in('America/New_York').start.hour; // 5
   * ```
   *
   * @see {@link https://nativedates.dev/api/ranges/#in in}
   */
  in(zone?: Zone): DateTimeRange;
}

/**
 * A half-open range between two `Time` values that includes `start` and excludes `end`.
 * When the closing time is earlier on the clock than the start time, the range wraps overnight across midnight.
 *
 * @example
 * ```ts
 * import { time, timeRange } from 'native-dates';
 *
 * const dayShift = time('9:00am').to('5:00pm');
 * const nightShift = timeRange('22:00', '06:00');
 * nightShift.duration.hours; // 8
 * ```
 *
 * @see {@link https://nativedates.dev/api/ranges/#timerange TimeRange Documentation}
 */
export class TimeRange extends BaseRange<Time, TimeInput> {
  /** @internal */
  readonly [IS_TIME_RANGE]: true;
  /** Discriminant tag `'time'` identifying a time-of-day range. */
  readonly kind: 'time';

  /**
   * Creates a half-open `TimeRange` starting at `start` and ending before `end` or across a duration.
   *
   * @param start - Start clock time input
   * @param end - Exclusive closing time or clock duration length
   * @param options - Time zone (for timestamp inputs) or `ReadOptions`
   *
   * @see {@link https://nativedates.dev/api/ranges/#timerange TimeRange}
   */
  constructor(start: TimeInput, end: TimeInput | DurationInput, options?: Zone | ReadOptions);
  /**
   * Creates a half-open `TimeRange` from an interval string (`'9am - 5pm'`, `'09:00/17:00'`).
   *
   * @param interval - Interval string joined by `/`, ` - `, ` – `, or ` to `
   * @param options - Time zone (for timestamp inputs) or `ReadOptions`
   *
   * @see {@link https://nativedates.dev/api/ranges/#timerange TimeRange}
   */
  constructor(interval: string, options?: Zone | ReadOptions);
}

/**
 * Creates an inclusive `DateRange` from a start date and an inclusive end date or calendar duration.
 *
 * @param start - Start calendar date input
 * @param end - Inclusive end date or calendar duration length (such as `'7 days'`)
 * @param options - Time zone or `ReadOptions` used when parsing endpoints
 * @returns An inclusive `DateRange`
 *
 * @example
 * ```ts
 * import { dateRange, days } from 'native-dates';
 *
 * dateRange('2026-09-01', '2026-09-07').duration.days; // 7
 * dateRange('2026-09-01', days(7)).toString(); // '2026-09-01/2026-09-07'
 * dateRange('2026-09-01/2026-09-07').duration.days; // 7
 * ```
 *
 * @see {@link https://nativedates.dev/api/range-fn/#daterange dateRange}
 */
export function dateRange(
  start: CalendarDateInput,
  end: CalendarDateInput | DurationInput,
  options?: Zone | ReadOptions,
): DateRange;
/**
 * Creates an inclusive `DateRange` from a single interval string (`'2026-09-01/2026-09-07'`).
 *
 * @param interval - Interval string joined by `/`, ` - `, ` – `, or ` to `
 * @param options - Time zone or `ReadOptions` used when parsing endpoints
 * @returns An inclusive `DateRange`
 *
 * @see {@link https://nativedates.dev/api/range-fn/#daterange dateRange}
 */
export function dateRange(interval: string, options?: Zone | ReadOptions): DateRange;

/**
 * Creates a half-open `DateTimeRange` that includes `start` and excludes `end`.
 *
 * @param start - Start moment input
 * @param end - Exclusive end moment (read in `start`'s zone when unzoned) or duration length
 * @param options - Time zone or `ReadOptions` for both endpoints
 * @returns A half-open `DateTimeRange`
 *
 * @example
 * ```ts
 * import { datetimeRange } from 'native-dates';
 *
 * const meeting = datetimeRange('2026-09-01T09:00', '90m', 'America/New_York');
 * meeting.end.hour; // 10
 * meeting.end.minute; // 30
 * ```
 *
 * @see {@link https://nativedates.dev/api/range-fn/#datetimerange datetimeRange}
 */
export function datetimeRange(
  start: DateTimeInput,
  end: DateTimeInput | DurationInput,
  options?: Zone | ReadOptions,
): DateTimeRange;
/**
 * Creates a half-open `DateTimeRange` from a single interval string.
 *
 * @param interval - Interval string joined by `/`, ` - `, ` – `, or ` to `
 * @param options - Time zone or `ReadOptions` for both endpoints
 * @returns A half-open `DateTimeRange`
 *
 * @see {@link https://nativedates.dev/api/range-fn/#datetimerange datetimeRange}
 */
export function datetimeRange(interval: string, options?: Zone | ReadOptions): DateTimeRange;

/**
 * Creates a half-open `TimeRange` between two times of day, wrapping across midnight when `end` is earlier.
 *
 * @param start - Start clock time input
 * @param end - Exclusive closing time or clock duration length
 * @param options - Time zone (for timestamp inputs) or `ReadOptions`
 * @returns A half-open `TimeRange`
 *
 * @example
 * ```ts
 * import { timeRange } from 'native-dates';
 *
 * timeRange('9am - 5pm').toString(); // '09:00:00/17:00:00'
 * timeRange('22:00', '8h').toString(); // '22:00:00/06:00:00'
 * ```
 *
 * @see {@link https://nativedates.dev/api/range-fn/#timerange timeRange}
 */
export function timeRange(
  start: TimeInput,
  end: TimeInput | DurationInput,
  options?: Zone | ReadOptions,
): TimeRange;
/**
 * Creates a half-open `TimeRange` from a single interval string (`'9am - 5pm'`, `'09:00/17:00'`).
 *
 * @param interval - Interval string joined by `/`, ` - `, ` – `, or ` to `
 * @param options - Time zone (for timestamp inputs) or `ReadOptions`
 * @returns A half-open `TimeRange`
 *
 * @see {@link https://nativedates.dev/api/range-fn/#timerange timeRange}
 */
export function timeRange(interval: string, options?: Zone | ReadOptions): TimeRange;

/**
 * Returns true when `value` is a `DateRange` instance, working across realms and duplicate bundles.
 *
 * @param value - Any value to test
 * @returns `true` if `value` is a `DateRange`
 *
 * @example
 * ```ts
 * import { dateRange, isDateRange } from 'native-dates';
 *
 * isDateRange(dateRange('2026-11-01', '2026-11-07')); // true
 * ```
 *
 * @see {@link https://nativedates.dev/api/kind-of/#isdaterange isDateRange}
 */
export function isDateRange(value: unknown): value is DateRange;

/**
 * Returns true when `value` is a `DateTimeRange` instance, working across realms and duplicate bundles.
 *
 * @param value - Any value to test
 * @returns `true` if `value` is a `DateTimeRange`
 *
 * @example
 * ```ts
 * import { datetimeRange, isDateTimeRange } from 'native-dates';
 *
 * isDateTimeRange(datetimeRange('2026-11-16T09:00Z', '2026-11-16T10:00Z')); // true
 * ```
 *
 * @see {@link https://nativedates.dev/api/kind-of/#isdatetimerange isDateTimeRange}
 */
export function isDateTimeRange(value: unknown): value is DateTimeRange;

/**
 * Returns true when `value` is a `TimeRange` instance, working across realms and duplicate bundles.
 *
 * @param value - Any value to test
 * @returns `true` if `value` is a `TimeRange`
 *
 * @example
 * ```ts
 * import { isTimeRange, timeRange } from 'native-dates';
 *
 * isTimeRange(timeRange('9:00am', '5:00pm')); // true
 * ```
 *
 * @see {@link https://nativedates.dev/api/kind-of/#istimerange isTimeRange}
 */
export function isTimeRange(value: unknown): value is TimeRange;
