import type { DateTime, DateTimeFields } from './date-time.js';
import type { Duration, DurationInput } from './duration.js';
import type { FormatSpec } from './helpers/format.js';
import type { DateUnit, DayOfWeek, TemporalValue, Unit } from './helpers/units.js';
import type { Locale, ReadOptions, Zone } from './helpers/zones.js';
import type { MonthDay } from './month-day.js';
import type { DateRange, DateTimeRange } from './range.js';
import type { TimeInput } from './time.js';
import type { YearMonth } from './year-month.js';

/** Anything that reads as a calendar date: `'2026-09-06'`, a fields object, a `DateTime`, a `Date`, or a Temporal value */
export type CalendarDateInput = CalendarDate | DateTime | Date | string | DateTimeFields | TemporalValue;

/**
 * A calendar date with no time and no zone: a due date, a birthday, a booking night. It is not a
 * moment, so it never shifts when read from another zone.
 * @see {@link https://nativedates.dev/api/calendar-date/ CalendarDate Documentation}
 */
export class CalendarDate {
  constructor(input: CalendarDateInput, options?: ReadOptions);
  constructor(year: number, month: number, day: number);

  /** The day in the configured locale's common form, `'Sep 6, 2026'`, what `format()` prints */
  readonly text: string;
  readonly month: number;
  readonly day: number;
  readonly year: number;
  /** ISO, 1 for monday through 7 for sunday */
  readonly dayOfWeek: number;
  /** The day this value's weeks start on, 1 for monday through 7 for sunday: the configured `weekStart`, else its locale's own */
  readonly weekStart: number;
  readonly quarter: number;
  readonly dayOfYear: number;
  /** ISO week number */
  readonly weekOfYear: number;
  readonly daysInMonth: number;
  readonly daysInYear: number;
  isLeapYear(): boolean;
  isWeekend(): boolean;
  isWeekday(): boolean;

  /**
   * Adds years, months, weeks or days. A clock unit refuses
   * @see {@link https://nativedates.dev/api/calendar-date/#plus plus}
   */
  plus(amount: DurationInput, unit?: Unit): CalendarDate;
  /** Alias for `plus` */
  add(amount: DurationInput, unit?: Unit): CalendarDate;
  /** @see {@link https://nativedates.dev/api/calendar-date/#minus minus} */
  minus(amount: DurationInput, unit?: Unit): CalendarDate;
  /** Alias for `minus` */
  subtract(amount: DurationInput, unit?: Unit): CalendarDate;

  /** @see {@link https://nativedates.dev/api/calendar-date/#set set} */
  set(fields: Pick<DateTimeFields, 'year' | 'month' | 'day'>): CalendarDate;
  set(unit: Unit, value: number): CalendarDate;
  /**
   * The first day of the unit around this value. A week starts on the configured first day, or on `firstDay`
   * @see {@link https://nativedates.dev/api/calendar-date/#startof startOf}
   */
  startOf(unit: DateUnit, firstDay?: DayOfWeek): CalendarDate;
  /**
   * The last day of the unit, so `endOf('month')` is the 28th, 30th or 31st
   * @see {@link https://nativedates.dev/api/calendar-date/#endof endOf}
   */
  endOf(unit: DateUnit, firstDay?: DayOfWeek): CalendarDate;
  /**
   * The next such day of the week strictly after this one
   * @see {@link https://nativedates.dev/api/calendar-date/#next next}
   */
  next(dayOfWeek: DayOfWeek): CalendarDate;
  /** @see {@link https://nativedates.dev/api/calendar-date/#previous previous} */
  previous(dayOfWeek: DayOfWeek): CalendarDate;
  /**
   * The next occurrence of a month-day strictly after this date
   * @see {@link https://nativedates.dev/api/calendar-date/#next next}
   */
  next(monthDay: MonthDay): CalendarDate;
  previous(monthDay: MonthDay): CalendarDate;

  /**
   * A range from this date through another, both included
   * @see {@link https://nativedates.dev/api/calendar-date/#to to}
   */
  to(end: CalendarDateInput | DurationInput): DateRange;
  to(count: number, unit: Unit): DateRange;
  /** A range that starts on this date and runs for a length, its last day included: `checkIn.for(3, 'days')` from the 6th is the 6th, 7th and 8th. The same as `to` given a length */
  for(length: DurationInput): DateRange;
  for(count: number, unit: Unit): DateRange;
  /** Alias for `to`, on a date alone, since a date range runs through its last day */
  through(end: CalendarDateInput | DurationInput): DateRange;
  through(count: number, unit: Unit): DateRange;
  /**
   * Every day of the unit containing this date, first through last
   * @see {@link https://nativedates.dev/api/calendar-date/#range range}
   */
  range(unit: DateUnit, firstDay?: DayOfWeek): DateRange;
  /**
   * The day's points by a step, as datetimes in the zone
   * @see {@link https://nativedates.dev/api/calendar-date/#points points}
   */
  points(step: Unit | DurationInput, zone?: Zone): DateTime[];
  points(count: number | string, unit: Unit, zone?: Zone): DateTime[];
  /**
   * The day cut into ranges by a step, as datetime ranges in the zone
   * @see {@link https://nativedates.dev/api/calendar-date/#split split}
   */
  split(step: Unit | DurationInput, zone?: Zone): DateTimeRange[];
  split(count: number | string, unit: Unit, zone?: Zone): DateTimeRange[];
  /** Alias for `split` */
  splitBy(step: Unit | DurationInput, zone?: Zone): DateTimeRange[];
  splitBy(count: number | string, unit: Unit, zone?: Zone): DateTimeRange[];

  /** @see {@link https://nativedates.dev/api/calendar-date/#equals equals} */
  equals(other: CalendarDateInput): boolean;
  /** @see {@link https://nativedates.dev/api/calendar-date/#isbefore isBefore} */
  isBefore(other: CalendarDateInput): boolean;
  /** @see {@link https://nativedates.dev/api/calendar-date/#isafter isAfter} */
  isAfter(other: CalendarDateInput): boolean;
  /** @see {@link https://nativedates.dev/api/calendar-date/#issame isSame} */
  isSame(other: CalendarDateInput, unit?: DateUnit, firstDay?: DayOfWeek): boolean;
  /** Today depends on where you stand, so these take the zone to judge from */
  isPast(zone?: Zone): boolean;
  isFuture(zone?: Zone): boolean;
  isToday(zone?: Zone): boolean;
  isTomorrow(zone?: Zone): boolean;
  isYesterday(zone?: Zone): boolean;

  /**
   * A duration balanced from years down that remembers this date, or the whole length as a number in a unit
   * @see {@link https://nativedates.dev/api/calendar-date/#until until}
   */
  until(other: CalendarDateInput): Duration;
  until(other: CalendarDateInput, unit: Unit): number;
  /** @see {@link https://nativedates.dev/api/calendar-date/#since since} */
  since(other: CalendarDateInput): Duration;
  since(other: CalendarDateInput, unit: Unit): number;
  /**
   * This date at a time of day in a zone, the moment an appointment happens. No time means midnight
   * @see {@link https://nativedates.dev/api/calendar-date/#at at}
   */
  at(time?: TimeInput, zone?: Zone): DateTime;
  /**
   * This date as a datetime, its midnight in the zone
   * @see {@link https://nativedates.dev/api/calendar-date/#as as}
   */
  as(kind: 'datetime', zone?: Zone): DateTime;
  as(kind: 'date'): CalendarDate;
  as(kind: 'monthDay'): MonthDay;
  as(kind: 'yearMonth'): YearMonth;
  /** The month and day, the year dropped */
  readonly monthDay: MonthDay;
  /** The year and month, the day dropped */
  readonly yearMonth: YearMonth;

  /** @see {@link https://nativedates.dev/api/calendar-date/#format format} */
  format(spec?: FormatSpec, locale?: Locale): string;
  /**
   * The locale this value is written in, when one was set on it or on the value it came from
   * @see {@link https://nativedates.dev/api/calendar-date/#locale locale}
   */
  locale(): Locale | undefined;
  /**
   * The same value written in another locale, which every value made from it keeps. An unset tag clears it
   * @see {@link https://nativedates.dev/api/calendar-date/#locale locale}
   */
  locale(tag: Locale | null | undefined): this;
  /**
   * Alias for `locale`
   * @see {@link https://nativedates.dev/api/calendar-date/#lang lang}
   */
  lang(): Locale | undefined;
  lang(tag: Locale | null | undefined): this;
  /**
   * How far this day is from another, in words: `'yesterday'`, `'in 3 weeks'`. From today when no other is given
   * @see {@link https://nativedates.dev/api/calendar-date/#from from}
   */
  from(other?: CalendarDateInput, locale?: Locale): string;
  /**
   * How far this day is from today, in words
   * @see {@link https://nativedates.dev/api/calendar-date/#fromnow fromNow}
   */
  fromNow(locale?: Locale): string;
  /**
   * Alias for `from`
   * @see {@link https://nativedates.dev/api/calendar-date/#formatrelative formatRelative}
   */
  formatRelative(other?: CalendarDateInput, locale?: Locale): string;
  /**
   * ISO 8601, `'2026-09-06'`
   * @see {@link https://nativedates.dev/api/calendar-date/#tostring toString}
   */
  toString(): string;
  toJSON(): string;
  /**
   * Midnight of this date in the zone, as a JS Date
   * @see {@link https://nativedates.dev/api/calendar-date/#tojsdate toJSDate}
   */
  toJSDate(zone?: Zone): Date;
  /** @see {@link https://nativedates.dev/api/calendar-date/#totemporal toTemporal} */
  toTemporal(): TemporalValue;
  /**
   * Throws. A date is not a point on the number line
   * @see {@link https://nativedates.dev/api/calendar-date/#valueof valueOf}
   */
  valueOf(): never;
}

/**
 * Reads `'2026-09-06'`, three numbers, a fields object, a datetime (its date in its zone), a Date (its
 * date in the zone), or a Temporal value. A wall-clock string keeps its day. A missing day refuses:
 * a year and a month alone are `yearMonth(2026, 11)`
 * @see {@link https://nativedates.dev/api/date-fn/#date date}
 */
export function date(input: CalendarDateInput, options?: ReadOptions): CalendarDate;
export function date(year: number, month: number, day: number): CalendarDate;
export function date(input: CalendarDateInput, zone: Zone): CalendarDate;

/** @see {@link https://nativedates.dev/api/date-fn/#today today} */
export function today(zone?: Zone): CalendarDate;
/** @see {@link https://nativedates.dev/api/date-fn/#tomorrow tomorrow} */
export function tomorrow(zone?: Zone): CalendarDate;
/** @see {@link https://nativedates.dev/api/date-fn/#yesterday yesterday} */
export function yesterday(zone?: Zone): CalendarDate;

/** @see {@link https://nativedates.dev/api/kind-of/#iscalendardate isCalendarDate} */
export function isCalendarDate(value: unknown): value is CalendarDate;
