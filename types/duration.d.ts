import { IS_DURATION } from './helpers/identity.js';
import type { TemporalDuration, TemporalPlainDate, TemporalZonedDateTime, Unit } from './helpers/units.js';
import type { Locale } from './helpers/zones.js';

/**
 * Plural calendar and clock unit counts accepted by `duration()` and returned by `toFields()`.
 * All nonzero fields in a duration must share the same sign.
 *
 * @see {@link https://nativedates.dev/api/duration/#tofields toFields}
 */
export interface DurationFields {
  /** Signed calendar year count. */
  years?: number;
  /** Signed calendar month count. */
  months?: number;
  /** Signed calendar week count. */
  weeks?: number;
  /** Signed calendar day count. */
  days?: number;
  /** Signed hour count. */
  hours?: number;
  /** Signed minute count. */
  minutes?: number;
  /** Signed second count. */
  seconds?: number;
  /** Signed millisecond count. */
  milliseconds?: number;
  /** Signed microsecond count. */
  microseconds?: number;
  /** Signed nanosecond count. */
  nanoseconds?: number;
}

/**
 * Any input accepted by `duration()`: a duration instance, fields object, phrase such as
 * `'1h 30m'`, ISO 8601 duration string, millisecond number, or `Temporal` duration.
 *
 * @see {@link https://nativedates.dev/api/duration-fn/#accepted-inputs Accepted inputs}
 */
export type DurationInput = Duration | DurationFields | string | number | TemporalDuration;

/**
 * A length of time across calendar and clock units.
 *
 * Fields stay as written until you call `balance()`, keeping 90 minutes at 90 rather than converting
 * to 1 hour and 30 minutes. Durations produced by `until()` or `since()` remember their starting point
 * so months and years can be totaled in any unit.
 *
 * @example
 * ```ts
 * import { date, days, duration, hours } from 'native-dates';
 *
 * const call = hours(1.5);
 * const turnaround = duration('2 weeks, 3 days');
 * const quarter = date('2026-01-01').until('2026-04-01');
 * quarter.total('days'); // 90
 * ```
 *
 * @see {@link https://nativedates.dev/api/duration/ Duration Documentation}
 */
export class Duration {
  /** @internal */
  readonly [IS_DURATION]: true;

  /**
   * Creates a new `Duration` from a phrase, ISO string, fields object, millisecond number,
   * or numeric count paired with `unit`. Prefer `duration()` or unit helpers in everyday code.
   *
   * @param input - Numeric count paired with `unit`, phrase, ISO 8601 string, fields object, or milliseconds
   * @param unit - Unit name when `input` is a numeric count, such as `'minutes'` or `'days'`
   *
   * @see {@link https://nativedates.dev/api/duration/#creating-a-duration Creating a Duration}
   */
  constructor(input: DurationInput, unit?: Unit);

  /** Locale-formatted duration in `'long'` style, such as `'1 hour, 30 minutes'`. */
  readonly text: string;
  /** Signed calendar years stored on this duration. */
  readonly years: number;
  /** Signed calendar months stored on this duration. */
  readonly months: number;
  /** Signed calendar weeks stored on this duration. */
  readonly weeks: number;
  /** Signed calendar days stored on this duration. */
  readonly days: number;
  /** Signed hours stored on this duration. */
  readonly hours: number;
  /** Signed minutes stored on this duration. */
  readonly minutes: number;
  /** Signed seconds stored on this duration. */
  readonly seconds: number;
  /** Signed milliseconds stored on this duration. */
  readonly milliseconds: number;
  /** Signed microseconds stored on this duration. */
  readonly microseconds: number;
  /** Signed nanoseconds stored on this duration. */
  readonly nanoseconds: number;
  /** Overall direction of the duration: `1` for positive, `0` for zero, or `-1` for negative. */
  readonly sign: -1 | 0 | 1;

  /**
   * Returns true when every unit field on this duration is zero.
   *
   * @returns `true` if the duration has zero length
   *
   * @see {@link https://nativedates.dev/api/duration/#sign-predicates Sign predicates}
   */
  isZero(): boolean;

  /**
   * Returns true when this duration represents a negative span.
   *
   * @returns `true` if `sign` is `-1`
   *
   * @see {@link https://nativedates.dev/api/duration/#sign-predicates Sign predicates}
   */
  isNegative(): boolean;

  /** Starting point recorded by `until()` or `since()`, or `undefined` on standalone durations. */
  readonly anchor: TemporalZonedDateTime | TemporalPlainDate | undefined;

  /**
   * Returns a plain object containing only the nonzero plural unit fields on this duration.
   *
   * @returns Object of nonzero plural duration fields
   *
   * @example
   * ```ts
   * duration('1h 30m').toFields(); // { hours: 1, minutes: 30 }
   * ```
   *
   * @see {@link https://nativedates.dev/api/duration/#tofields toFields}
   */
  toFields(): DurationFields;

  /**
   * Adds another duration and returns a new `Duration`.
   *
   * @param other - Numeric count paired with `unit`, `Duration`, phrase, fields object, or milliseconds
   * @param unit - Unit name when `other` is a number, such as `'minutes'` or `'days'`
   * @returns A new combined `Duration`
   *
   * @example
   * ```ts
   * hours(2).plus(30, 'minutes').toString(); // 'PT2H30M'
   * days(1).plus('6h').toString(); // 'P1DT6H'
   * ```
   *
   * @see {@link https://nativedates.dev/api/duration/#plus plus}
   */
  plus(other: DurationInput, unit?: Unit): Duration;

  /**
   * Alias for `plus()` that adds another duration.
   *
   * @param other - Numeric count paired with `unit`, `Duration`, phrase, fields object, or milliseconds
   * @param unit - Unit name when `other` is a number
   * @returns A new combined `Duration`
   *
   * @see {@link https://nativedates.dev/api/duration/#plus plus}
   */
  add(other: DurationInput, unit?: Unit): Duration;

  /**
   * Subtracts another duration, borrowing across years and months or weeks and days when needed.
   * Incompatible opposite-sign pairs such as days minus hours throw a `RangeError`.
   *
   * @param other - Numeric count paired with `unit`, `Duration`, phrase, fields object, or milliseconds
   * @param unit - Unit name when `other` is a number
   * @returns A new `Duration` with `other` subtracted
   *
   * @example
   * ```ts
   * hours(2).minus('30m').toString(); // 'PT1H30M'
   * years(1).minus(months(1)).toString(); // 'P11M'
   * ```
   *
   * @see {@link https://nativedates.dev/api/duration/#minus minus}
   */
  minus(other: DurationInput, unit?: Unit): Duration;

  /**
   * Alias for `minus()` that subtracts another duration.
   *
   * @param other - Numeric count paired with `unit`, `Duration`, phrase, fields object, or milliseconds
   * @param unit - Unit name when `other` is a number
   * @returns A new `Duration` with `other` subtracted
   *
   * @see {@link https://nativedates.dev/api/duration/#minus minus}
   */
  subtract(other: DurationInput, unit?: Unit): Duration;

  /**
   * Multiplies every field by `factor`, spilling fractional results into smaller exact units.
   *
   * @param factor - Multiplier to scale the duration by, including fractional or negative numbers
   * @returns A new scaled `Duration`
   *
   * @example
   * ```ts
   * hours(1).times(1.5).toString(); // 'PT1H30M'
   * ```
   *
   * @see {@link https://nativedates.dev/api/duration/#times times}
   */
  times(factor: number): Duration;

  /**
   * Reverses the sign of every field in the duration.
   *
   * @returns A new `Duration` with inverted sign
   *
   * @example
   * ```ts
   * hours(2).negated().toString(); // '-PT2H'
   * ```
   *
   * @see {@link https://nativedates.dev/api/duration/#negated negated}
   */
  negated(): Duration;

  /**
   * Returns a copy of this duration with all fields made positive.
   *
   * @returns A non-negative `Duration`
   *
   * @example
   * ```ts
   * duration('-1h 30m').abs().toString(); // 'PT1H30M'
   * ```
   *
   * @see {@link https://nativedates.dev/api/duration/#abs abs}
   */
  abs(): Duration;

  /**
   * Carries overflow from smaller units into larger ones.
   * By default, standalone durations roll clock units up to hours and months into years,
   * while anchored durations from `until()` or `since()` balance up to days.
   *
   * @param largest - Largest target unit to roll values up into, such as `'hour'`, `'day'`, or `'week'`
   * @returns A new balanced `Duration`
   * @throws {RangeError} When balancing an anchored duration or one with sub-month units to `'quarter'`
   *
   * @example
   * ```ts
   * minutes(150).balance().toString(); // 'PT2H30M'
   * months(18).balance().toString(); // 'P1Y6M'
   * duration('36h').balance('day').toString(); // 'P1DT12H'
   * ```
   *
   * @see {@link https://nativedates.dev/api/duration/#balance balance}
   */
  balance(largest?: Unit): Duration;

  /**
   * Rounds the duration to the nearest whole `smallest` unit, with half-way ties rounding away from zero.
   * `'quarter'` is not a valid rounding target.
   *
   * @param smallest - Smallest unit to keep after rounding, such as `'minute'` or `'hour'`
   * @returns A new rounded `Duration`
   *
   * @example
   * ```ts
   * minutes(90).round('hour').toString(); // 'PT2H'
   * ```
   *
   * @see {@link https://nativedates.dev/api/duration/#round round}
   */
  round(smallest: Exclude<Unit, 'quarter' | 'quarters' | 'q' | 'Q' | 'qtr'>): Duration;

  /**
   * Returns the entire length of the duration as a single floating-point number in `unit`.
   * A starting point from `until()` or `since()` is required in both directions: converting months or years
   * to smaller units, or totaling fixed units (weeks, days, or clock units) into `'month'`, `'quarter'`, or `'year'`.
   *
   * @param unit - Target unit to express the total length in, such as `'hours'` or `'days'`
   * @returns Total length in `unit`, including any fractional part
   *
   * @example
   * ```ts
   * minutes(90).total('hours'); // 1.5
   * months(18).total('years'); // 1.5
   * ```
   *
   * @see {@link https://nativedates.dev/api/duration/#total total}
   */
  total(unit: Unit): number;

  /**
   * Chain-friendly alias for `total()` that returns the entire length as a number in `unit`.
   *
   * @param unit - Target unit to express the total length in, such as `'hours'` or `'days'`
   * @returns Total length in `unit`, including any fractional part
   *
   * @example
   * ```ts
   * hours(36).as('days'); // 1.5
   * ```
   *
   * @see {@link https://nativedates.dev/api/duration/#as as}
   */
  as(unit: Unit): number;

  /**
   * Orders this duration against `other` by total length for `Array.prototype.sort()`.
   *
   * @param other - Duration to compare against
   * @returns `-1` when shorter, `0` when equal, or `1` when longer
   *
   * @example
   * ```ts
   * hours(1).compare(minutes(90)); // -1
   * ```
   *
   * @see {@link https://nativedates.dev/api/duration/#compare compare}
   */
  compare(other: DurationInput): -1 | 0 | 1;

  /**
   * Returns true when both durations represent the same total length, so `hours(1)` equals `minutes(60)`.
   *
   * @param other - Another `Duration` or any input accepted by `duration()`
   * @returns `true` if both durations have equal total length
   *
   * @example
   * ```ts
   * hours(1).equals(minutes(60)); // true
   * years(1).equals(months(12)); // true
   * ```
   *
   * @see {@link https://nativedates.dev/api/duration/#equals equals}
   */
  equals(other: DurationInput): boolean;

  /**
   * Formats the duration in the active locale via `Intl.DurationFormat`.
   *
   * @param style - Display style: `'long'` (default), `'short'`, `'narrow'`, or `'digital'`
   * @param locale - BCP 47 locale tag overriding this duration's or the configured locale for one call
   * @returns Locale-formatted duration string
   *
   * @example
   * ```ts
   * const span = duration('2h 30m');
   * span.format('long', 'en-US'); // '2 hours, 30 minutes'
   * span.format('short', 'en-US'); // '2 hr, 30 min'
   * span.format('narrow', 'en-US'); // '2h 30m'
   * span.format('digital', 'en-US'); // '2:30:00'
   * ```
   *
   * @see {@link https://nativedates.dev/api/duration/#format format}
   */
  format(style?: 'long' | 'short' | 'narrow' | 'digital', locale?: Locale): string;

  /**
   * Reads the BCP 47 locale tag carried on this duration, or `undefined` when none was set.
   *
   * @returns Active locale tag carried on this value, or `undefined`
   *
   * @see {@link https://nativedates.dev/api/duration/#locale locale}
   */
  locale(): Locale | undefined;
  /**
   * Returns a copy of this duration carrying `tag` for formatting and arithmetic chains.
   * Passing an empty tag or `null` clears the carried locale.
   *
   * @param tag - BCP 47 locale tag to carry forward, or `null` to clear it
   * @returns A new `Duration` carrying `tag`
   *
   * @example
   * ```ts
   * days(2).locale('de').text; // '2 Tage'
   * ```
   *
   * @see {@link https://nativedates.dev/api/duration/#locale locale}
   */
  locale(tag: Locale | null | undefined): this;

  /**
   * Alias for `locale()` that reads the locale tag carried on this duration.
   *
   * @returns Active locale tag carried on this value, or `undefined`
   *
   * @see {@link https://nativedates.dev/api/duration/#lang lang}
   */
  lang(): Locale | undefined;
  /**
   * Alias for `locale()` that attaches or clears a carried locale tag on this duration.
   *
   * @param tag - BCP 47 locale tag to carry forward, or `null` to clear it
   * @returns A new `Duration` carrying `tag`
   *
   * @see {@link https://nativedates.dev/api/duration/#lang lang}
   */
  lang(tag: Locale | null | undefined): this;

  /**
   * Returns the ISO 8601 duration string.
   *
   * @returns ISO 8601 duration string such as `'PT1H30M'`
   *
   * @example
   * ```ts
   * duration('1h 30m').toString(); // 'PT1H30M'
   * ```
   *
   * @see {@link https://nativedates.dev/api/duration/#tostring toString}
   */
  toString(): string;

  /**
   * Serializes the duration as an ISO 8601 string for `JSON.stringify()`.
   *
   * @returns ISO 8601 duration string matching `toString()`
   *
   * @see {@link https://nativedates.dev/api/duration/#tostring toString}
   */
  toJSON(): string;

  /**
   * Returns the underlying `Temporal.Duration` instance.
   *
   * @returns Underlying `Temporal.Duration`
   *
   * @see {@link https://nativedates.dev/api/duration/#totemporal toTemporal}
   */
  toTemporal(): TemporalDuration;

  /**
   * Returns the total length in milliseconds. Unanchored month or year durations throw a `RangeError`.
   *
   * @returns Total duration length in milliseconds
   *
   * @example
   * ```ts
   * hours(2).toMilliseconds(); // 7200000
   * ```
   *
   * @see {@link https://nativedates.dev/api/duration/#tomilliseconds toMilliseconds}
   */
  toMilliseconds(): number;

  /**
   * Returns total milliseconds so fixed-length or anchored durations work with timers and `<` or `-`.
   *
   * @returns Total duration length in milliseconds
   *
   * @see {@link https://nativedates.dev/api/duration/#valueof valueOf}
   */
  valueOf(): number;
}

/**
 * Creates a `Duration` from a count and unit, plain-English phrase, ISO 8601 string, fields object,
 * or millisecond number. Fields stay as written until balanced, and fractional units spill into smaller exact units.
 *
 * @param input - Numeric count paired with `unit`, phrase (`'1h 30m'`), ISO string (`'PT1H30M'`), fields object, or milliseconds
 * @param unit - Unit name when `input` is a numeric count, such as `'minutes'` or `'days'`
 * @returns An immutable `Duration`
 *
 * @example
 * ```ts
 * import { duration } from 'native-dates';
 *
 * duration('1h 30m').toString(); // 'PT1H30M'
 * duration(90, 'minutes').minutes; // 90
 * duration(1.5, 'days').toString(); // 'P1DT12H'
 * duration(1500).milliseconds; // 1500
 * ```
 *
 * @see {@link https://nativedates.dev/api/duration-fn/#duration duration}
 */
export function duration(input: DurationInput, unit?: Unit): Duration;
/**
 * Creates a `Duration` carrying a `locale` tag for formatting and derived values.
 *
 * @param input - Duration phrase, ISO string, fields object, `Duration`, or milliseconds
 * @param options - Options carrying `locale`
 * @returns An immutable `Duration`
 *
 * @see {@link https://nativedates.dev/api/duration-fn/#duration duration}
 */
export function duration(input: DurationInput, options: { locale?: Locale; }): Duration;

/**
 * Creates a `Duration` for `count` years, spilling fractional years into months.
 *
 * @param count - Positive or negative year count
 * @returns A `Duration` of `count` years
 *
 * @example
 * ```ts
 * years(1.5).toString(); // 'P1Y6M'
 * ```
 *
 * @see {@link https://nativedates.dev/api/duration-fn/#years years}
 */
export function years(count: number | string): Duration;

/**
 * Creates a `Duration` for a whole number of calendar months.
 *
 * @param count - Whole-number month count
 * @returns A `Duration` of `count` months
 *
 * @example
 * ```ts
 * months(6).toString(); // 'P6M'
 * ```
 *
 * @see {@link https://nativedates.dev/api/duration-fn/#months months}
 */
export function months(count: number | string): Duration;

/**
 * Creates a `Duration` for `count` weeks, spilling fractions into days.
 *
 * @param count - Positive or negative week count
 * @returns A `Duration` of `count` weeks
 *
 * @example
 * ```ts
 * weeks(2).toString(); // 'P2W'
 * ```
 *
 * @see {@link https://nativedates.dev/api/duration-fn/#weeks weeks}
 */
export function weeks(count: number | string): Duration;

/**
 * Creates a `Duration` for `count` calendar days, spilling fractions into hours.
 *
 * @param count - Positive or negative day count
 * @returns A `Duration` of `count` days
 *
 * @example
 * ```ts
 * days(1.5).toString(); // 'P1DT12H'
 * ```
 *
 * @see {@link https://nativedates.dev/api/duration-fn/#days days}
 */
export function days(count: number | string): Duration;

/**
 * Creates a `Duration` for `count` hours, spilling fractions into minutes.
 *
 * @param count - Positive or negative hour count
 * @returns A `Duration` of `count` hours
 *
 * @example
 * ```ts
 * hours(1.5).toString(); // 'PT1H30M'
 * ```
 *
 * @see {@link https://nativedates.dev/api/duration-fn/#hours hours}
 */
export function hours(count: number | string): Duration;

/**
 * Creates a `Duration` for `count` minutes, spilling fractions into seconds.
 *
 * @param count - Positive or negative minute count
 * @returns A `Duration` of `count` minutes
 *
 * @example
 * ```ts
 * minutes(45).toString(); // 'PT45M'
 * ```
 *
 * @see {@link https://nativedates.dev/api/duration-fn/#minutes minutes}
 */
export function minutes(count: number | string): Duration;

/**
 * Creates a `Duration` for `count` seconds, spilling fractions into milliseconds.
 *
 * @param count - Positive or negative second count
 * @returns A `Duration` of `count` seconds
 *
 * @example
 * ```ts
 * seconds(30).toString(); // 'PT30S'
 * ```
 *
 * @see {@link https://nativedates.dev/api/duration-fn/#seconds seconds}
 */
export function seconds(count: number | string): Duration;

/**
 * Creates a `Duration` for `count` milliseconds, spilling fractions down to microseconds and nanoseconds.
 *
 * @param count - Positive or negative millisecond count
 * @returns A `Duration` of `count` milliseconds
 *
 * @example
 * ```ts
 * milliseconds(250).toString(); // 'PT0.25S'
 * ```
 *
 * @see {@link https://nativedates.dev/api/duration-fn/#milliseconds milliseconds}
 */
export function milliseconds(count: number | string): Duration;

/**
 * Returns true when `value` is a `Duration` instance, working across realms and duplicate bundles.
 *
 * @param value - Any value to test
 * @returns `true` if `value` is a `Duration`
 *
 * @example
 * ```ts
 * import { hours, isDuration } from 'native-dates';
 *
 * isDuration(hours(2)); // true
 * isDuration(7200000); // false
 * ```
 *
 * @see {@link https://nativedates.dev/api/kind-of/#isduration isDuration}
 */
export function isDuration(value: unknown): value is Duration;
