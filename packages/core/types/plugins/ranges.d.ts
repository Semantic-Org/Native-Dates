import type { CalendarDate } from '../calendar-date.js';
import type { DateTime } from '../date-time.js';
import type { Duration } from '../duration.js';
import type {
  CalendarDateInput,
  DateTimeInput,
  DateUnit,
  DurationInput,
  FormatSpec,
  Locale,
  Plugin,
  ReadOptions,
  TimeInput,
  Unit,
  Weekday,
  Zone,
} from '../inputs.js';
import type { Time } from '../time.js';

declare abstract class BaseRange<Point, Input> {
  /** The span in the configured locale's common form, `'Sep 1 – 7, 2026'` */
  readonly text: string;
  readonly start: Point;
  readonly end: Point;
  readonly kind: 'date' | 'datetime' | 'time';
  isEmpty(): boolean;
  /** The whole length, anchored at the start. A date range counts its last day */
  readonly duration: Duration;

  contains(value: Input | this): boolean;
  overlaps(other: this | string): boolean;
  intersection(other: this | string): this | null;
  equals(other: this | string): boolean;
  points(step: Unit | DurationInput): Point[];
  points(count: number | string, unit: Unit): Point[];
  split(step: Unit | DurationInput): this[];
  split(count: number | string, unit: Unit): this[];
  format(spec?: FormatSpec, locale?: Locale): string;
  toString(): string;
  toJSON(): string;
  valueOf(): never;
}

/** Two calendar dates, both included: the 1st through the 7th is seven days */
export class DateRange extends BaseRange<CalendarDate, CalendarDateInput> {
  constructor(start: CalendarDateInput, end: CalendarDateInput | DurationInput, options?: Zone | ReadOptions);
  constructor(interval: string, options?: Zone | ReadOptions);
  /** The datetime range covering these days in a zone, midnight through the midnight after the last day */
  in(zone?: Zone): DateTimeRange;
}

/** Two moments, the end excluded: nine until ten and ten until eleven do not overlap */
export class DateTimeRange extends BaseRange<DateTime, DateTimeInput> {
  constructor(start: DateTimeInput, end: DateTimeInput | DurationInput, options?: Zone | ReadOptions);
  constructor(interval: string, options?: Zone | ReadOptions);
  /** Both ends read in another zone */
  in(zone?: Zone): DateTimeRange;
}

/** Two times of day, the end excluded: the door closes at the stroke of five */
export class TimeRange extends BaseRange<Time, TimeInput> {
  constructor(start: TimeInput, end: TimeInput | DurationInput, options?: Zone | ReadOptions);
  constructor(interval: string, options?: Zone | ReadOptions);
}

export function dateRange(
  start: CalendarDateInput,
  end: CalendarDateInput | DurationInput,
  options?: Zone | ReadOptions,
): DateRange;
export function dateRange(interval: string, options?: Zone | ReadOptions): DateRange;

export function datetimeRange(
  start: DateTimeInput,
  end: DateTimeInput | DurationInput,
  options?: Zone | ReadOptions,
): DateTimeRange;
export function datetimeRange(interval: string, options?: Zone | ReadOptions): DateTimeRange;

export function timeRange(
  start: TimeInput,
  end: TimeInput | DurationInput,
  options?: Zone | ReadOptions,
): TimeRange;
export function timeRange(interval: string, options?: Zone | ReadOptions): TimeRange;

export function isDateRange(value: unknown): value is DateRange;
export function isDateTimeRange(value: unknown): value is DateTimeRange;
export function isTimeRange(value: unknown): value is TimeRange;

declare const ranges: Plugin & (() => Plugin);
export default ranges;

declare module '../date-time.js' {
  interface DateTime {
    /** A range from this moment until another, the end excluded */
    to(end: DateTimeInput | DurationInput): DateTimeRange;
    to(count: number, unit: Unit): DateTimeRange;
    /** The unit containing this moment as a half-open range, its start until the next start */
    range(unit: Unit, firstDay?: Weekday): DateTimeRange;
  }
}

declare module '../calendar-date.js' {
  interface CalendarDate {
    /** A range from this date through another, both included */
    to(end: CalendarDateInput | DurationInput): DateRange;
    to(count: number, unit: Unit): DateRange;
    /** Every day of the unit containing this date, first through last */
    range(unit: DateUnit, firstDay?: Weekday): DateRange;
    /** The day's points by a step, as datetimes in the zone */
    points(step: Unit | DurationInput, zone?: Zone): DateTime[];
    points(count: number | string, unit: Unit, zone?: Zone): DateTime[];
    /** The day cut into ranges by a step, as datetime ranges in the zone */
    split(step: Unit | DurationInput, zone?: Zone): DateTimeRange[];
    split(count: number | string, unit: Unit, zone?: Zone): DateTimeRange[];
  }
}

declare module '../time.js' {
  interface Time {
    /** A range from this time until another, the end excluded */
    to(end: TimeInput | DurationInput): TimeRange;
    to(count: number, unit: Unit): TimeRange;
  }
}

declare module '../helpers/compare.js' {
  interface RangeMap {
    date: DateRange;
    datetime: DateTimeRange;
    time: TimeRange;
  }
}
