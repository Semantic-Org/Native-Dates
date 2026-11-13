import type {
  CalendarDate,
  CalendarDateInput,
  DateTime,
  DateTimeInput,
  DateUnit,
  Duration,
  DurationInput,
  FormatSpec,
  Locale,
  ReadOptions,
  Time,
  TimeInput,
  Unit,
  Weekday,
  Zone,
} from './index.js';

declare abstract class BaseRange<Point, Input> {
  /** The span in the configured locale's common form, `'Sep 1 – 7, 2026'` */
  readonly text: string;
  readonly start: Point;
  readonly end: Point;
  readonly kind: 'date' | 'datetime' | 'time';
  isEmpty(): boolean;
  /** The whole length, anchored at the start. A date range counts its last day */
  readonly duration: Duration;
  /** The call spelling of `.duration` */
  as(kind: 'duration'): Duration;

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
