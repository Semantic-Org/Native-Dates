import type { DateRange, DateTimeRange, TimeRange } from 'native-dates';

declare module 'native-dates' {
  interface DateRange {
    /**
     * Removes the inclusive days of `other` from this `DateRange`, returning 0, 1, or 2 remaining ranges.
     * Preserves `this.locale()` on every returned range.
     *
     * @param other - `DateRange` or interval string to subtract
     * @returns Ordered array of remaining `DateRange` spans
     * @throws {TypeError} When `other` is a range of a different kind (`conflictingRanges`)
     *
     * @example
     * ```ts
     * import '@native-dates/plugins/ranges';
     * import { dateRange } from 'native-dates';
     *
     * dateRange('2026-11-01', '2026-11-10').subtract('2026-11-04/2026-11-06').map(String);
     * // ['2026-11-01/2026-11-03', '2026-11-07/2026-11-10']
     * ```
     *
     * @see {@link https://nativedates.dev/plugins/ranges/#subtract subtract}
     */
    subtract(other: DateRange | string): DateRange[];

    /**
     * Merges this `DateRange` with an overlapping or directly adjacent `DateRange` (no gap day between them),
     * returning `null` when a gap separates the two spans.
     *
     * @param other - `DateRange` or interval string to unite with
     * @returns Combined `DateRange` preserving `this.locale()`, or `null` when disjoint with a gap
     * @throws {TypeError} When `other` is a range of a different kind (`conflictingRanges`)
     *
     * @example
     * ```ts
     * import '@native-dates/plugins/ranges';
     * import { dateRange } from 'native-dates';
     *
     * dateRange('2026-11-01', '2026-11-05').union('2026-11-06/2026-11-10')?.toString();
     * // '2026-11-01/2026-11-10'
     * ```
     *
     * @see {@link https://nativedates.dev/plugins/ranges/#union union}
     */
    union(other: DateRange | string): DateRange | null;
  }

  interface DateTimeRange {
    /**
     * Removes the half-open span of `other` from this `DateTimeRange`, returning 0, 1, or 2 remaining ranges.
     * Returns `[]` when this range is empty and preserves `this.start.zone` and `this.locale()`.
     *
     * @param other - `DateTimeRange` or interval string to subtract
     * @returns Ordered array of remaining `DateTimeRange` spans
     * @throws {TypeError} When `other` is a range of a different kind (`conflictingRanges`)
     *
     * @example
     * ```ts
     * import '@native-dates/plugins/ranges';
     * import { datetimeRange } from 'native-dates';
     *
     * const day = datetimeRange('2026-11-01T09:00', '2026-11-01T17:00', 'America/New_York');
     * day.subtract('2026-11-01T12:00/2026-11-01T13:00').length; // 2
     * ```
     *
     * @see {@link https://nativedates.dev/plugins/ranges/#subtract subtract}
     */
    subtract(other: DateTimeRange | string): DateTimeRange[];

    /**
     * Merges this `DateTimeRange` with an overlapping or back-to-back `DateTimeRange`,
     * returning `null` when a gap separates them. Empty ranges act as the identity element.
     *
     * @param other - `DateTimeRange` or interval string to unite with
     * @returns Combined `DateTimeRange` in `this.start.zone` and `this.locale()`, or `null` when disjoint
     * @throws {TypeError} When `other` is a range of a different kind (`conflictingRanges`)
     *
     * @example
     * ```ts
     * import '@native-dates/plugins/ranges';
     * import { datetimeRange } from 'native-dates';
     *
     * const first = datetimeRange('2026-11-01T09:00', '2026-11-01T10:00', 'UTC');
     * first.union('2026-11-01T10:00/2026-11-01T11:30')?.duration.total('minutes'); // 150
     * ```
     *
     * @see {@link https://nativedates.dev/plugins/ranges/#union union}
     */
    union(other: DateTimeRange | string): DateTimeRange | null;
  }

  interface TimeRange {
    /**
     * Removes the half-open clock window of `other` from this `TimeRange`, handling overnight ranges
     * that wrap across midnight and returning 0, 1, or 2 remaining ranges.
     *
     * @param other - `TimeRange` or interval string to subtract
     * @returns Ordered array of remaining `TimeRange` spans preserving `this.locale()`
     * @throws {TypeError} When `other` is a range of a different kind (`conflictingRanges`)
     *
     * @example
     * ```ts
     * import '@native-dates/plugins/ranges';
     * import { timeRange } from 'native-dates';
     *
     * timeRange('22:00', '06:00').subtract('23:00 - 02:00').map(String);
     * // ['22:00:00/23:00:00', '02:00:00/06:00:00']
     * ```
     *
     * @see {@link https://nativedates.dev/plugins/ranges/#subtract subtract}
     */
    subtract(other: TimeRange | string): TimeRange[];

    /**
     * Merges this `TimeRange` with an overlapping or directly adjacent `TimeRange`, including
     * overnight spans across midnight, returning `null` when a gap separates them.
     *
     * @param other - `TimeRange` or interval string to unite with
     * @returns Combined `TimeRange` preserving `this.locale()`, or `null` when disjoint
     * @throws {TypeError} When `other` is a range of a different kind (`conflictingRanges`)
     * @throws {RangeError} When the combined clock coverage spans all 24 hours (`unsupportedUnion`)
     *
     * @example
     * ```ts
     * import '@native-dates/plugins/ranges';
     * import { timeRange } from 'native-dates';
     *
     * timeRange('22:00', '06:00').union('06:00 - 08:00')?.toString(); // '22:00:00/08:00:00'
     * ```
     *
     * @see {@link https://nativedates.dev/plugins/ranges/#union union}
     */
    union(other: TimeRange | string): TimeRange | null;
  }
}

/**
 * Sorts and coalesces an iterable of `DateRange` values into minimal sorted non-overlapping ranges,
 * combining overlapping and adjacent date spans.
 *
 * @param ranges - Iterable of `DateRange` instances
 * @returns Minimal sorted array of disjoint `DateRange` spans
 * @throws {TypeError} When `ranges` is not an iterable, contains a non-range item (`invalidRange`), or mixes range kinds (`conflictingRanges`)
 *
 * @example
 * ```ts
 * import { mergeRanges } from '@native-dates/plugins/ranges';
 * import { dateRange } from 'native-dates';
 *
 * mergeRanges([
 *   dateRange('2026-11-10', '2026-11-12'),
 *   dateRange('2026-11-01', '2026-11-05'),
 *   dateRange('2026-11-06', '2026-11-08'),
 * ]).map(String);
 * // ['2026-11-01/2026-11-08', '2026-11-10/2026-11-12']
 * ```
 *
 * @see {@link https://nativedates.dev/plugins/ranges/#mergeranges mergeRanges}
 */
export function mergeRanges(ranges: Iterable<DateRange>): DateRange[];
/**
 * Sorts and coalesces an iterable of `DateTimeRange` values into minimal sorted non-overlapping ranges,
 * dropping empty spans and merging overlapping or back-to-back blocks.
 *
 * @param ranges - Iterable of `DateTimeRange` instances
 * @returns Minimal sorted array of disjoint non-empty `DateTimeRange` spans
 * @throws {TypeError} When `ranges` is not an iterable, contains a non-range item (`invalidRange`), or mixes range kinds (`conflictingRanges`)
 *
 * @see {@link https://nativedates.dev/plugins/ranges/#mergeranges mergeRanges}
 */
export function mergeRanges(ranges: Iterable<DateTimeRange>): DateTimeRange[];
/**
 * Sorts and coalesces an iterable of `TimeRange` values into minimal sorted non-overlapping ranges,
 * dropping empty spans and stitching overnight windows across midnight.
 *
 * @param ranges - Iterable of `TimeRange` instances
 * @returns Minimal sorted array of disjoint non-empty `TimeRange` spans
 * @throws {TypeError} When `ranges` is not an iterable, contains a non-range item (`invalidRange`), or mixes range kinds (`conflictingRanges`)
 * @throws {RangeError} When the combined clock coverage spans all 24 hours (`unsupportedUnion`)
 *
 * @see {@link https://nativedates.dev/plugins/ranges/#mergeranges mergeRanges}
 */
export function mergeRanges(ranges: Iterable<TimeRange>): TimeRange[];
