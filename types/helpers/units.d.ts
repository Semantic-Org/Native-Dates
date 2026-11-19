/**
 * Underlying `Temporal` object returned by `toTemporal()` or accepted by factories.
 * Typed broadly so projects compile whether or not `Temporal` ambient declarations are loaded.
 *
 * @see {@link https://nativedates.dev/guides/temporal/ Working with Temporal}
 */
export type TemporalValue = any;

/**
 * Calendar or clock unit name in singular, plural, or common shorthand form,
 * such as `'days'`, `'hour'`, or `'min'`.
 *
 * @see {@link https://nativedates.dev/guides/date-math/ Date math}
 */
export type Unit =
  | 'year'
  | 'years'
  | 'quarter'
  | 'quarters'
  | 'month'
  | 'months'
  | 'week'
  | 'weeks'
  | 'day'
  | 'days'
  | 'hour'
  | 'hours'
  | 'minute'
  | 'minutes'
  | 'second'
  | 'seconds'
  | 'millisecond'
  | 'milliseconds'
  | 'microsecond'
  | 'microseconds'
  | 'nanosecond'
  | 'nanoseconds'
  | (string & {});

/**
 * Calendar unit name from `'year'` down to `'day'`, accepted by `CalendarDate` boundary and comparison methods.
 *
 * @see {@link https://nativedates.dev/api/calendar-date/ CalendarDate}
 */
export type DateUnit = 'year' | 'quarter' | 'month' | 'week' | 'day' | (string & {});

/**
 * Day of the week as a case-insensitive name or prefix such as `'monday'` or `'Fri'`,
 * an ISO number from 1 for Monday through 7 for Sunday, or 0 for Sunday as `Date.prototype.getDay()` counts it.
 *
 * @see {@link https://nativedates.dev/api/configure/#dayofweek dayOfWeek}
 */
export type DayOfWeek =
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'
  | 'sunday'
  | 0
  | 1
  | 2
  | 3
  | 4
  | 5
  | 6
  | 7
  | (string & {});

/**
 * Converts a weekday name, three-letter prefix, or ISO number into an integer
 * from 1 for Monday through 7 for Sunday. Throws a `RangeError` for unrecognized inputs.
 *
 * @param day - Weekday name such as `'monday'`, prefix such as `'Fri'`, or integer from 1 to 7
 * @returns ISO day of the week from 1 for Monday through 7 for Sunday
 *
 * @example
 * ```ts
 * import { dayOfWeek } from 'native-dates';
 *
 * dayOfWeek('monday'); // 1
 * dayOfWeek('Fri'); // 5
 * dayOfWeek('sunday'); // 7
 * dayOfWeek(3); // 3
 * ```
 *
 * @see {@link https://nativedates.dev/api/configure/#dayofweek dayOfWeek}
 */
export function dayOfWeek(day: DayOfWeek): number;
