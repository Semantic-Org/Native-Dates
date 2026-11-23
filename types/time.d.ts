import type { CalendarDateInput } from './calendar-date.js';
import type { DateTime, DateTimeFields } from './date-time.js';
import type { Duration, DurationInput } from './duration.js';
import type { FormatSpec } from './helpers/format.js';
import { IS_TIME } from './helpers/identity.js';
import type {
  TemporalInstant,
  TemporalPlainDateTime,
  TemporalPlainTime,
  TemporalZonedDateTime,
  TimeUnit,
} from './helpers/units.js';
import type { Locale, ReadOptions, Zone } from './helpers/zones.js';
import type { TimeRange } from './range.js';

/**
 * Singular clock fields accepted when creating or updating a `Time`.
 *
 * @see {@link https://nativedates.dev/api/time/#set set}
 */
export type TimeFields = Pick<
  DateTimeFields,
  'hour' | 'minute' | 'second' | 'millisecond' | 'microsecond' | 'nanosecond'
>;

/**
 * Any input accepted by `time()`: a 12-hour or 24-hour clock string such as `'9:30am'`,
 * clock fields object, time of day, moment, native JavaScript date, or `Temporal` clock or instant value.
 *
 * @see {@link https://nativedates.dev/api/time-fn/#accepted-inputs Accepted inputs}
 */
export type TimeInput =
  | Time
  | DateTime
  | Date
  | string
  | TimeFields
  | TemporalPlainTime
  | TemporalPlainDateTime
  | TemporalZonedDateTime
  | TemporalInstant;

/**
 * A time of day with no calendar date and no time zone, for store hours, schedules, and daily alarms.
 *
 * Clock arithmetic wraps cleanly around the 24-hour day at midnight. Calendar units such as days
 * and numeric operators throw a `RangeError`, so call `on()` when you need a specific moment.
 *
 * @example
 * ```ts
 * import { time } from 'native-dates';
 *
 * const opens = time('9:00am');
 * const closes = opens.plus(8, 'hours');
 * closes.format('short', 'en-US'); // '5:00 PM'
 * ```
 *
 * @see {@link https://nativedates.dev/api/time/ Time Documentation}
 */
export class Time {
  /** @internal */
  readonly [IS_TIME]: true;

  /**
   * Creates a new `Time` from a clock string, fields object, or existing time or timestamp value.
   * Prefer the `time()` factory in everyday code.
   *
   * @param input - 12-hour or 24-hour clock string, fields object, `Time`, `DateTime`, `Date`, or `Temporal` value
   * @param options - Zone (when reading from a timestamp) and locale options
   *
   * @see {@link https://nativedates.dev/api/time/#creating-a-time Creating a Time}
   */
  constructor(input: TimeInput, options?: ReadOptions);
  /**
   * Creates a new `Time` from whole-number 24-hour clock parts.
   *
   * @param hour - 24-hour clock hour from 0 through 23
   * @param minute - Clock minute from 0 through 59
   * @param second - Clock second from 0 through 59
   *
   * @see {@link https://nativedates.dev/api/time/#creating-a-time Creating a Time}
   */
  constructor(hour: number, minute?: number, second?: number);

  /** Locale-formatted time of day, such as `'5:30 PM'`. */
  readonly text: string;
  /** 24-hour clock hour from 0 through 23. */
  readonly hour: number;
  /** Clock minute from 0 through 59. */
  readonly minute: number;
  /** Clock second from 0 through 59. */
  readonly second: number;
  /** Millisecond field from 0 through 999. */
  readonly millisecond: number;
  /** Microsecond field from 0 through 999. */
  readonly microsecond: number;
  /** Nanosecond field from 0 through 999. */
  readonly nanosecond: number;

  /**
   * Moves forward on the 24-hour clock and returns a new `Time`, wrapping past midnight when needed.
   * Calendar units such as days and weeks throw a `RangeError`.
   *
   * @param amount - Numeric count paired with `unit`, `Duration`, phrase, fields object, or milliseconds
   * @param unit - Clock unit name when `amount` is a number, such as `'hours'` or `'minutes'`
   * @returns A new `Time` wrapped to the 24-hour clock
   *
   * @example
   * ```ts
   * time('9:00am').plus(90, 'minutes').toString(); // '10:30:00'
   * time('23:00').plus('2h').toString(); // '01:00:00'
   * ```
   *
   * @see {@link https://nativedates.dev/api/time/#plus plus}
   */
  plus(amount: DurationInput, unit?: TimeUnit): Time;

  /**
   * Alias for `plus()` that moves forward on the 24-hour clock.
   *
   * @param amount - Numeric count paired with `unit`, `Duration`, phrase, fields object, or milliseconds
   * @param unit - Clock unit name when `amount` is a number
   * @returns A new `Time` wrapped to the 24-hour clock
   *
   * @see {@link https://nativedates.dev/api/time/#plus plus}
   */
  add(amount: DurationInput, unit?: TimeUnit): Time;

  /**
   * Moves backward on the 24-hour clock and returns a new `Time`, wrapping before midnight when needed.
   *
   * @param amount - Numeric count paired with `unit`, `Duration`, phrase, fields object, or milliseconds
   * @param unit - Clock unit name when `amount` is a number, such as `'hours'` or `'minutes'`
   * @returns A new `Time` wrapped to the 24-hour clock
   *
   * @example
   * ```ts
   * time('00:30').minus(45, 'minutes').toString(); // '23:45:00'
   * ```
   *
   * @see {@link https://nativedates.dev/api/time/#minus minus}
   */
  minus(amount: DurationInput, unit?: TimeUnit): Time;

  /**
   * Alias for `minus()` that moves backward on the 24-hour clock.
   *
   * @param amount - Numeric count paired with `unit`, `Duration`, phrase, fields object, or milliseconds
   * @param unit - Clock unit name when `amount` is a number
   * @returns A new `Time` wrapped to the 24-hour clock
   *
   * @see {@link https://nativedates.dev/api/time/#minus minus}
   */
  subtract(amount: DurationInput, unit?: TimeUnit): Time;

  /**
   * Returns a new `Time` with one or more clock fields replaced.
   * Out-of-range values such as minute `75` throw a `RangeError`.
   *
   * @param fields - Object of clock fields to replace
   * @returns A new `Time` with updated clock fields
   *
   * @example
   * ```ts
   * const reminder = time('9:30am');
   * reminder.set({ hour: 17, minute: 0 }).toString(); // '17:00:00'
   * reminder.set('minute', 45).toString(); // '09:45:00'
   * ```
   *
   * @see {@link https://nativedates.dev/api/time/#set set}
   */
  set(fields: TimeFields): Time;
  /**
   * Returns a new `Time` with a single clock field replaced.
   *
   * @param unit - Clock field name, such as `'hour'` or `'minute'`
   * @param value - Whole-number value for `unit`
   * @returns A new `Time` with the updated field
   *
   * @see {@link https://nativedates.dev/api/time/#set set}
   */
  set(unit: TimeUnit, value: number): Time;

  /**
   * Zeros out all clock fields smaller than `unit`.
   *
   * @param unit - Clock unit from `'hour'` down to `'nanosecond'`
   * @returns A new `Time` at the start of `unit`
   *
   * @example
   * ```ts
   * time('14:37:22').startOf('hour').toString(); // '14:00:00'
   * ```
   *
   * @see {@link https://nativedates.dev/api/time/#startof startOf}
   */
  startOf(unit: TimeUnit): Time;

  /**
   * Moves to the final millisecond of the given clock unit.
   *
   * @param unit - Clock unit from `'hour'` down to `'nanosecond'`
   * @returns A new `Time` at the last millisecond of `unit`
   *
   * @example
   * ```ts
   * time('14:37:22').endOf('hour').toString(); // '14:59:59.999'
   * ```
   *
   * @see {@link https://nativedates.dev/api/time/#endof endOf}
   */
  endOf(unit: TimeUnit): Time;

  /**
   * Moves forward to the start of the clock unit after the one containing this time, wrapping at midnight.
   * Always advances into the next unit, so from `14:00:00` the next hour starts at `15:00:00`.
   *
   * @param unit - Clock unit from `'hour'` down to `'nanosecond'`
   * @returns A new `Time` at the start of the next `unit`
   *
   * @example
   * ```ts
   * time('14:37:22').startOfNext('hour').toString(); // '15:00:00'
   * time('23:37:22').startOfNext('hour').toString(); // '00:00:00'
   * ```
   *
   * @see {@link https://nativedates.dev/api/time/#startofnext startOfNext}
   */
  startOfNext(unit: TimeUnit): Time;

  /**
   * Moves back to the start of the clock unit before the one containing this time, wrapping at midnight.
   *
   * @param unit - Clock unit from `'hour'` down to `'nanosecond'`
   * @returns A new `Time` at the start of the previous `unit`
   *
   * @example
   * ```ts
   * time('14:37:22').startOfPrevious('hour').toString(); // '13:00:00'
   * time('00:15:00').startOfPrevious('hour').toString(); // '23:00:00'
   * ```
   *
   * @see {@link https://nativedates.dev/api/time/#startofprevious startOfPrevious}
   */
  startOfPrevious(unit: TimeUnit): Time;

  /**
   * Rounds to the nearest clock unit, with half-way ties rounding up.
   *
   * @param unit - Clock unit to round to, from `'hour'` down to `'nanosecond'`
   * @returns A new rounded `Time`
   *
   * @example
   * ```ts
   * const checkin = time('14:36:00');
   * checkin.round('hour').toString(); // '15:00:00'
   * checkin.round(15, 'minutes').toString(); // '14:30:00'
   * ```
   *
   * @see {@link https://nativedates.dev/api/time/#round round}
   */
  round(unit: TimeUnit): Time;
  /**
   * Rounds to the nearest step increment of `unit`, with half-way ties rounding up.
   *
   * @param increment - Step size that divides evenly into the next larger unit
   * @param unit - Clock unit to round, from `'hour'` down to `'nanosecond'`
   * @returns A new rounded `Time`
   *
   * @see {@link https://nativedates.dev/api/time/#round round}
   */
  round(increment: number, unit: TimeUnit): Time;

  /**
   * Rounds down to the start of a clock unit.
   *
   * @param unit - Clock unit to round down to, from `'hour'` down to `'nanosecond'`
   * @returns A new `Time` rounded down
   *
   * @example
   * ```ts
   * time('14:29').floor(15, 'minutes').toString(); // '14:15:00'
   * ```
   *
   * @see {@link https://nativedates.dev/api/time/#floor floor}
   */
  floor(unit: TimeUnit): Time;
  /**
   * Rounds down to the start of a step increment of `unit`.
   *
   * @param increment - Step size that divides evenly into the next larger unit
   * @param unit - Clock unit to round down, from `'hour'` down to `'nanosecond'`
   * @returns A new `Time` rounded down
   *
   * @see {@link https://nativedates.dev/api/time/#floor floor}
   */
  floor(increment: number, unit: TimeUnit): Time;

  /**
   * Rounds up to the next clock unit boundary.
   *
   * @param unit - Clock unit to round up to, from `'hour'` down to `'nanosecond'`
   * @returns A new `Time` rounded up
   *
   * @example
   * ```ts
   * time('14:01').ceil(15, 'minutes').toString(); // '14:15:00'
   * ```
   *
   * @see {@link https://nativedates.dev/api/time/#ceil ceil}
   */
  ceil(unit: TimeUnit): Time;
  /**
   * Rounds up to the next step increment of `unit`.
   *
   * @param increment - Step size that divides evenly into the next larger unit
   * @param unit - Clock unit to round up, from `'hour'` down to `'nanosecond'`
   * @returns A new `Time` rounded up
   *
   * @see {@link https://nativedates.dev/api/time/#ceil ceil}
   */
  ceil(increment: number, unit: TimeUnit): Time;

  /**
   * Returns true when both values represent the exact same time of day.
   *
   * @param other - Another `Time` or any input accepted by `time()`
   * @returns `true` if both values match to the nanosecond
   *
   * @example
   * ```ts
   * time('5:30pm').equals('17:30'); // true
   * ```
   *
   * @see {@link https://nativedates.dev/api/time/#equals equals}
   */
  equals(other: TimeInput): boolean;

  /**
   * Returns true if this time is earlier in the day than `other`.
   *
   * @param other - Time to compare against
   * @returns `true` when earlier in the day than `other`
   *
   * @example
   * ```ts
   * time('9:00am').isBefore('5:00pm'); // true
   * ```
   *
   * @see {@link https://nativedates.dev/api/time/#isbefore isBefore}
   */
  isBefore(other: TimeInput): boolean;

  /**
   * Returns true if this time is later in the day than `other`.
   *
   * @param other - Time to compare against
   * @returns `true` when later in the day than `other`
   *
   * @example
   * ```ts
   * time('5:00pm').isAfter('9:00am'); // true
   * ```
   *
   * @see {@link https://nativedates.dev/api/time/#isafter isAfter}
   */
  isAfter(other: TimeInput): boolean;

  /**
   * Checks whether `other` falls within the same clock unit, such as the same hour or minute.
   * Calling without `unit` checks exact equality.
   *
   * @param other - Time to compare against
   * @param unit - Clock unit to compare, such as `'hour'` or `'minute'`
   * @returns `true` when both times share the same `unit`
   *
   * @example
   * ```ts
   * time('9:05am').isSame('9:45am', 'hour'); // true
   * ```
   *
   * @see {@link https://nativedates.dev/api/time/#issame isSame}
   */
  isSame(other: TimeInput, unit?: TimeUnit): boolean;

  /**
   * Measures the signed time from this time to `other` within the same day as a `Duration`
   * balanced up to hours, returning a negative duration when `other` is earlier.
   *
   * @param other - Target time to measure toward
   * @returns A signed `Duration` within the day
   *
   * @example
   * ```ts
   * const opens = time('9:00am');
   * opens.until('5:30pm').format('long', 'en-US'); // '8 hours, 30 minutes'
   * opens.until('5:30pm', 'hours'); // 8.5
   * ```
   *
   * @see {@link https://nativedates.dev/api/time/#until until}
   */
  until(other: TimeInput): Duration;
  /**
   * Measures the signed time from this time to `other` within the same day as a count in `unit`.
   *
   * @param other - Target time to measure toward
   * @param unit - Clock unit to express the total length in, such as `'hours'` or `'minutes'`
   * @returns Signed total length in `unit`
   *
   * @see {@link https://nativedates.dev/api/time/#until until}
   */
  until(other: TimeInput, unit: TimeUnit): number;

  /**
   * Measures the time elapsed since an earlier time on the same day as a `Duration`.
   *
   * @param other - Earlier time to measure from
   * @returns A signed `Duration` from `other` to this time
   *
   * @example
   * ```ts
   * time('5:00pm').since('9:00am', 'hours'); // 8
   * ```
   *
   * @see {@link https://nativedates.dev/api/time/#since since}
   */
  since(other: TimeInput): Duration;
  /**
   * Measures the time elapsed since `other` on the same day as a floating-point count in `unit`.
   *
   * @param other - Earlier time to measure from
   * @param unit - Clock unit to express the elapsed length in, such as `'hours'` or `'minutes'`
   * @returns Signed elapsed length in `unit`
   *
   * @see {@link https://nativedates.dev/api/time/#since since}
   */
  since(other: TimeInput, unit: TimeUnit): number;

  /**
   * Places this time of day onto a calendar date in a time zone and returns a `DateTime`.
   * Mirrors calling `date.at(time, options)`.
   *
   * @param day - Date string, `CalendarDate`, `DateTime`, fields object, or `Date`
   * @param options - Time zone name or `ReadOptions` (including `zone`, `locale`, and `disambiguation`)
   * @returns A new `DateTime` on `day` at this time in the resolved time zone
   *
   * @example
   * ```ts
   * time('9:30am').on('2026-11-16', 'America/New_York').toString(); // '2026-11-16T14:30:00.000Z'
   * ```
   *
   * @see {@link https://nativedates.dev/api/time/#on on}
   */
  on(day: CalendarDateInput, options?: Zone | ReadOptions): DateTime;

  /**
   * Creates a half-open `TimeRange` from this time until `end` (excluding `end`), or across a duration.
   * An end time earlier on the clock wraps overnight across midnight.
   *
   * @param end - Closing time or clock duration length
   * @returns A half-open `TimeRange` starting at this time
   *
   * @example
   * ```ts
   * time('9:00am').to('5:00pm').duration.hours; // 8
   * time('22:00').to('06:00').duration.hours; // 8
   * ```
   *
   * @see {@link https://nativedates.dev/api/time/#to to}
   */
  to(end: TimeInput | DurationInput): TimeRange;
  /**
   * Creates a half-open `TimeRange` starting at this time and lasting for `count` of `unit`.
   *
   * @param count - Positive span count
   * @param unit - Clock unit name for `count`, such as `'hours'` or `'minutes'`
   * @returns A half-open `TimeRange` starting at this time
   *
   * @see {@link https://nativedates.dev/api/time/#to to}
   */
  to(count: number, unit: TimeUnit): TimeRange;

  /**
   * Creates a half-open `TimeRange` starting at this time and lasting for `length`.
   *
   * @param length - Clock `Duration`, phrase such as `'90m'`, ISO duration, or units object
   * @returns A half-open `TimeRange` starting at this time
   *
   * @example
   * ```ts
   * time('9:00am').for(90, 'minutes').end.toString(); // '10:30:00'
   * ```
   *
   * @see {@link https://nativedates.dev/api/time/#to to}
   */
  for(length: Exclude<DurationInput, number>): TimeRange;
  /**
   * Creates a half-open `TimeRange` starting at this time and lasting for `count` of `unit`.
   *
   * @param count - Positive span count
   * @param unit - Clock unit name for `count`, such as `'hours'` or `'minutes'`
   * @returns A half-open `TimeRange` starting at this time
   *
   * @example
   * ```ts
   * time('9:00am').for(90, 'minutes').end.toString(); // '10:30:00'
   * ```
   *
   * @see {@link https://nativedates.dev/api/time/#to to}
   */
  for(count: number, unit: TimeUnit): TimeRange;

  /**
   * Returns this `Time` unchanged when `'time'` is requested in generic conversion chains.
   *
   * @param kind - Target kind `'time'`
   * @returns This `Time` instance
   *
   * @see {@link https://nativedates.dev/api/time/#as as}
   */
  as(kind: 'time'): Time;

  /**
   * Formats the time of day using built-in presets, custom names from `configure()`,
   * `Intl.DateTimeFormatOptions` objects, or token patterns.
   *
   * @param spec - Preset name (default `'short'`), custom format name, `Intl` options bag, or token pattern
   * @param locale - BCP 47 locale tag overriding this time's or the configured locale for one call
   * @returns Formatted time string
   *
   * @example
   * ```ts
   * const afternoon = time('17:30:15');
   * afternoon.format('short', 'en-US'); // '5:30 PM'
   * afternoon.format('LTS', 'en-US'); // '5:30:15 PM'
   * afternoon.format('HH:mm:ss'); // '17:30:15'
   * ```
   *
   * @see {@link https://nativedates.dev/api/time/#format format}
   */
  format(spec?: FormatSpec, locale?: Locale): string;

  /**
   * Reads the BCP 47 locale tag carried on this time, or `undefined` when none was set.
   *
   * @returns Active locale tag carried on this value, or `undefined`
   *
   * @see {@link https://nativedates.dev/api/time/#locale locale}
   */
  locale(): Locale | undefined;
  /**
   * Returns a copy of this time carrying `tag` for formatting and derived values.
   * Passing an empty tag or `null` clears the carried locale.
   *
   * @param tag - BCP 47 locale tag to carry forward, or `null` to clear it
   * @returns A new `Time` carrying `tag`
   *
   * @example
   * ```ts
   * time('17:30').locale('ko-KR').text; // '오후 5:30'
   * ```
   *
   * @see {@link https://nativedates.dev/api/time/#locale locale}
   */
  locale(tag: Locale | null | undefined): this;

  /**
   * Alias for `locale()` that reads the locale tag carried on this time.
   *
   * @returns Active locale tag carried on this value, or `undefined`
   *
   * @see {@link https://nativedates.dev/api/time/#lang lang}
   */
  lang(): Locale | undefined;
  /**
   * Alias for `locale()` that attaches or clears a carried locale tag on this time.
   *
   * @param tag - BCP 47 locale tag to carry forward, or `null` to clear it
   * @returns A new `Time` carrying `tag`
   *
   * @see {@link https://nativedates.dev/api/time/#lang lang}
   */
  lang(tag: Locale | null | undefined): this;

  /**
   * Returns the 24-hour ISO 8601 time string, including sub-second digits only when nonzero.
   *
   * @returns ISO 8601 time string such as `'17:30:00'` or `'17:30:15.250'`
   *
   * @example
   * ```ts
   * time('5:30pm').toString(); // '17:30:00'
   * ```
   *
   * @see {@link https://nativedates.dev/api/time/#tostring toString}
   */
  toString(): string;

  /**
   * Serializes the time as a 24-hour ISO 8601 string for `JSON.stringify()`.
   *
   * @returns ISO 8601 time string matching `toString()`
   *
   * @see {@link https://nativedates.dev/api/time/#tostring toString}
   */
  toJSON(): string;

  /**
   * Returns the underlying `Temporal.PlainTime` instance.
   *
   * @returns Underlying `Temporal.PlainTime`
   *
   * @see {@link https://nativedates.dev/api/time/#totemporal toTemporal}
   */
  toTemporal(): TemporalPlainTime;

  /**
   * Throws a `RangeError` so numeric operators never coerce a time of day to a number.
   * Compare times with methods like `isBefore()`, or sort arrays with `compare()`.
   *
   * @see {@link https://nativedates.dev/api/time/#valueof valueOf}
   */
  valueOf(): never;
}

/**
 * Creates a `Time` from a 12-hour or 24-hour clock string, whole-number clock parts, a fields object,
 * or a timestamp. Missing inputs throw a `TypeError` instead of reading the live clock.
 *
 * @param input - Clock string (`'9am'`, `'17:30'`, `'14h30'`), fields object, `Time`, `DateTime`, `Date`, or `Temporal` value
 * @param options - Time zone (for timestamps) and locale options
 * @returns An immutable `Time`
 *
 * @example
 * ```ts
 * import { time } from 'native-dates';
 *
 * time('9am').toString(); // '09:00:00'
 * time('5:30pm').toString(); // '17:30:00'
 * time(9, 30).toString(); // '09:30:00'
 * time('2026-11-16T17:30:00Z', 'America/New_York').toString(); // '12:30:00'
 * ```
 *
 * @see {@link https://nativedates.dev/api/time-fn/#time time}
 */
export function time(input: TimeInput, options?: ReadOptions): Time;
/**
 * Creates a `Time` from whole-number 24-hour clock parts.
 *
 * @param hour - 24-hour clock hour from 0 through 23
 * @param minute - Clock minute from 0 through 59
 * @param second - Clock second from 0 through 59
 * @returns An immutable `Time`
 *
 * @example
 * ```ts
 * time(9, 30).toString(); // '09:30:00'
 * ```
 *
 * @see {@link https://nativedates.dev/api/time-fn/#time time}
 */
export function time(hour: number, minute?: number, second?: number): Time;
/**
 * Extracts the local `Time` of an instant string or timestamp object in `zone`.
 *
 * @param input - Time or timestamp input
 * @param zone - Time zone used to extract the local time of day
 * @returns An immutable `Time`
 *
 * @see {@link https://nativedates.dev/api/time-fn/#time time}
 */
export function time(input: TimeInput, zone: Zone): Time;

/**
 * Returns true when `value` is a `Time` instance, working across realms and duplicate bundles.
 *
 * @param value - Any value to test
 * @returns `true` if `value` is a `Time`
 *
 * @example
 * ```ts
 * import { isTime, time } from 'native-dates';
 *
 * isTime(time('9:30am')); // true
 * isTime('09:30'); // false
 * ```
 *
 * @see {@link https://nativedates.dev/api/kind-of/#istime isTime}
 */
export function isTime(value: unknown): value is Time;
