import type { CalendarDateInput } from './calendar-date.js';
import type { DateTime, DateTimeFields } from './date-time.js';
import type { Duration, DurationInput } from './duration.js';
import type { FormatSpec } from './helpers/format.js';
import type { TemporalValue, Unit } from './helpers/units.js';
import type { Locale, ReadOptions, Zone } from './helpers/zones.js';
import type { TimeRange } from './range.js';

/** Anything that reads as a time of day: `'09:00'`, `'5:30pm'`, a fields object, a `DateTime`, a `Date`, or a Temporal value */
export type TimeInput = Time | DateTime | Date | string | DateTimeFields | TemporalValue;

/**
 * A time of day with no date: opening hours, a daily reminder. Arithmetic wraps at midnight.
 */
export class Time {
  constructor(input: TimeInput, options?: ReadOptions);
  constructor(hour: number, minute?: number, second?: number);

  /** The clock in the configured locale's common form, `'5:30 PM'`, what `format()` prints */
  readonly text: string;
  readonly hour: number;
  readonly minute: number;
  readonly second: number;
  readonly millisecond: number;
  readonly microsecond: number;
  readonly nanosecond: number;

  plus(amount: DurationInput, unit?: Unit): Time;
  /** Alias for `plus` */
  add(amount: DurationInput, unit?: Unit): Time;
  minus(amount: DurationInput, unit?: Unit): Time;
  /** Alias for `minus` */
  subtract(amount: DurationInput, unit?: Unit): Time;

  set(fields: Partial<Record<'hour' | 'minute' | 'second' | 'millisecond', number>>): Time;
  set(unit: Unit, value: number): Time;
  startOf(unit: Unit): Time;
  endOf(unit: Unit): Time;
  round(unit: Unit): Time;
  round(increment: number, unit: Unit): Time;
  floor(unit: Unit): Time;
  floor(increment: number, unit: Unit): Time;
  ceil(unit: Unit): Time;
  ceil(increment: number, unit: Unit): Time;

  equals(other: TimeInput): boolean;
  isBefore(other: TimeInput): boolean;
  isAfter(other: TimeInput): boolean;
  isSame(other: TimeInput, unit?: Unit): boolean;

  /** The signed length until another time within the day, or that length as a number in a unit */
  until(other: TimeInput): Duration;
  until(other: TimeInput, unit: Unit): number;
  since(other: TimeInput): Duration;
  since(other: TimeInput, unit: Unit): number;
  /** This time on a date in a zone, the mirror of `date.at(time, zone)` */
  on(day: CalendarDateInput, zone?: Zone): DateTime;
  /** A range from this time until another, the end excluded */
  to(end: TimeInput | DurationInput): TimeRange;
  to(count: number, unit: Unit): TimeRange;
  /** A range that starts at this time and runs for a length, the end excluded: `time('9am').for(8, 'hours')`. The same as `to` given a length */
  for(length: DurationInput): TimeRange;
  for(count: number, unit: Unit): TimeRange;
  as(kind: 'time'): Time;

  format(spec?: FormatSpec, locale?: Locale): string;
  /** The locale this value is written in, when one was set on it or on the value it came from */
  locale(): Locale | undefined;
  /** The same value written in another locale, which every value made from it keeps. An unset tag clears it */
  locale(tag: Locale | null | undefined): this;
  /** Alias for `locale` */
  lang(): Locale | undefined;
  lang(tag: Locale | null | undefined): this;
  /** ISO 8601, `'17:30:00'` */
  toString(): string;
  toJSON(): string;
  toTemporal(): TemporalValue;
  /** Throws. A time of day is not a point on the number line */
  valueOf(): never;
}

/** Reads `'09:00'`, `'5:30pm'`, `'17:30:15.250'`, numbers, a fields object, a datetime or a Date */
export function time(input: TimeInput, options?: ReadOptions): Time;
export function time(hour: number, minute?: number, second?: number): Time;
export function time(input: TimeInput, zone: Zone): Time;

export function isTime(value: unknown): value is Time;
