import type { DateTime } from './date-time.js';
import type { Duration } from './duration.js';
import type {
  CalendarDateInput,
  DurationInput,
  FormatSpec,
  Locale,
  ReadOptions,
  TemporalValue,
  TimeInput,
  Unit,
  Zone,
} from './inputs.js';

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
  /** Alias for `minus` */
  remove(amount: DurationInput, unit?: Unit): Time;

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

  format(spec?: FormatSpec, locale?: Locale): string;
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
