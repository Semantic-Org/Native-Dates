import type { TemporalValue, Unit } from './helpers/units.js';
import type { Locale } from './helpers/zones.js';

/** Duration fields, plural, as Temporal spells them */
export interface DurationFields {
  years?: number;
  months?: number;
  weeks?: number;
  days?: number;
  hours?: number;
  minutes?: number;
  seconds?: number;
  milliseconds?: number;
  microseconds?: number;
  nanoseconds?: number;
}

/**
 * Anything that reads as a duration: a `Duration`, a `Temporal.Duration`, a fields object, a phrase like
 * `'1h 30m'` or `'2 weeks and 3 days'`, an ISO string like `'PT1H30M'`, or a number of milliseconds
 */
export type DurationInput = Duration | DurationFields | string | number | TemporalValue;

/**
 * A length of time. Fields stay as written until balanced, and a duration measured with `until()` or
 * `since()` remembers where it started, so months and years can total in any unit.
 * @see {@link https://nativedates.dev/api/duration/ Duration Documentation}
 */
export class Duration {
  constructor(input: DurationInput, unit?: Unit);

  /** The length in the configured locale's common form, `'1 hour, 30 minutes'`, what `format('long')` prints */
  readonly text: string;
  readonly years: number;
  readonly months: number;
  readonly weeks: number;
  readonly days: number;
  readonly hours: number;
  readonly minutes: number;
  readonly seconds: number;
  readonly milliseconds: number;
  readonly microseconds: number;
  readonly nanoseconds: number;
  /** 1, 0 or -1 */
  readonly sign: number;
  isZero(): boolean;
  isNegative(): boolean;
  /** The point this duration was measured from, when it came from `until()` or `since()` */
  readonly anchor: TemporalValue | undefined;

  /**
   * The nonzero fields as a plain object
   * @see {@link https://nativedates.dev/api/duration/#tofields toFields}
   */
  toFields(): DurationFields;

  /** @see {@link https://nativedates.dev/api/duration/#plus plus} */
  plus(other: DurationInput, unit?: Unit): Duration;
  /** Alias for `plus` */
  add(other: DurationInput, unit?: Unit): Duration;
  /** @see {@link https://nativedates.dev/api/duration/#minus minus} */
  minus(other: DurationInput, unit?: Unit): Duration;
  /** Alias for `minus` */
  subtract(other: DurationInput, unit?: Unit): Duration;

  /** @see {@link https://nativedates.dev/api/duration/#times times} */
  times(factor: number): Duration;
  /** @see {@link https://nativedates.dev/api/duration/#negated negated} */
  negated(): Duration;
  /** @see {@link https://nativedates.dev/api/duration/#abs abs} */
  abs(): Duration;
  /**
   * Carry overflow upward. A length stops at hours, an anchored duration at days, an explicit unit is taken as given
   * @see {@link https://nativedates.dev/api/duration/#balance balance}
   */
  balance(largest?: Unit): Duration;
  /**
   * Rounds to the nearest whole unit
   * @see {@link https://nativedates.dev/api/duration/#round round}
   */
  round(smallest: Unit): Duration;

  /**
   * The whole duration in one unit, fractional. Years and months total into each other, and need the anchor for anything smaller
   * @see {@link https://nativedates.dev/api/duration/#total total}
   */
  total(unit: Unit): number;
  /**
   * Alias of `total`
   * @see {@link https://nativedates.dev/api/duration/#as as}
   */
  as(unit: Unit): number;
  /**
   * -1, 0 or 1 by length
   * @see {@link https://nativedates.dev/api/duration/#compare compare}
   */
  compare(other: DurationInput): number;
  /** @see {@link https://nativedates.dev/api/duration/#equals equals} */
  equals(other: DurationInput): boolean;

  /**
   * Words in the locale: `'2 hours, 30 minutes'`, `'2 hr, 30 min'`, `'2h 30m'`, `'2:30:00'`
   * @see {@link https://nativedates.dev/api/duration/#format format}
   */
  format(style?: 'long' | 'short' | 'narrow' | 'digital', locale?: Locale): string;
  /**
   * The locale this value is written in, when one was set on it or on the value it came from
   * @see {@link https://nativedates.dev/api/duration/#locale locale}
   */
  locale(): Locale | undefined;
  /**
   * The same value written in another locale, which every value made from it keeps. An unset tag clears it
   * @see {@link https://nativedates.dev/api/duration/#locale locale}
   */
  locale(tag: Locale | null | undefined): this;
  /**
   * Alias for `locale`
   * @see {@link https://nativedates.dev/api/duration/#lang lang}
   */
  lang(): Locale | undefined;
  lang(tag: Locale | null | undefined): this;
  /**
   * ISO 8601, `'PT1H30M'`
   * @see {@link https://nativedates.dev/api/duration/#tostring toString}
   */
  toString(): string;
  toJSON(): string;
  /** @see {@link https://nativedates.dev/api/duration/#totemporal toTemporal} */
  toTemporal(): TemporalValue;
  /**
   * The whole length in milliseconds, months and years only when anchored
   * @see {@link https://nativedates.dev/api/duration/#tomilliseconds toMilliseconds}
   */
  toMilliseconds(): number;
  /** @see {@link https://nativedates.dev/api/duration/#valueof valueOf} */
  valueOf(): number;
}

/**
 * Reads a phrase, an ISO string, a fields object, or a number with a unit. A bare number is milliseconds
 * @see {@link https://nativedates.dev/api/duration-fn/#duration duration}
 */
export function duration(input: DurationInput, unit?: Unit): Duration;
export function duration(input: DurationInput, options: { locale?: Locale; }): Duration;

/** @see {@link https://nativedates.dev/api/duration-fn/#years years} */
export function years(count: number | string): Duration;
/** @see {@link https://nativedates.dev/api/duration-fn/#months months} */
export function months(count: number | string): Duration;
/** @see {@link https://nativedates.dev/api/duration-fn/#weeks weeks} */
export function weeks(count: number | string): Duration;
/** @see {@link https://nativedates.dev/api/duration-fn/#days days} */
export function days(count: number | string): Duration;
/** @see {@link https://nativedates.dev/api/duration-fn/#hours hours} */
export function hours(count: number | string): Duration;
/** @see {@link https://nativedates.dev/api/duration-fn/#minutes minutes} */
export function minutes(count: number | string): Duration;
/** @see {@link https://nativedates.dev/api/duration-fn/#seconds seconds} */
export function seconds(count: number | string): Duration;
/** @see {@link https://nativedates.dev/api/duration-fn/#milliseconds milliseconds} */
export function milliseconds(count: number | string): Duration;

/** @see {@link https://nativedates.dev/api/kind-of/#isduration isDuration} */
export function isDuration(value: unknown): value is Duration;
