import type { CalendarDate } from './calendar-date.js';
import type { Duration, DurationInput } from './duration.js';
import type { FormatSpec } from './helpers/format.js';
import type { DayOfWeek, TemporalValue, Unit } from './helpers/units.js';
import type { Locale, ReadOptions, Zone } from './helpers/zones.js';
import type { MonthDay } from './month-day.js';
import type { DateTimeRange } from './range.js';
import type { Time, TimeInput } from './time.js';
import type { YearMonth } from './year-month.js';

/** Calendar fields for a datetime or date, singular, as Temporal's `with()` spells them */
export interface DateTimeFields {
  year?: number;
  month?: number;
  day?: number;
  hour?: number;
  minute?: number;
  second?: number;
  millisecond?: number;
  microsecond?: number;
  nanosecond?: number;
}

/**
 * Anything that reads as a datetime: an ISO string, a `Date`, epoch milliseconds, a fields object, a
 * `DateTime`, a `CalendarDate` (its midnight in the zone), or a Temporal value
 */
export type DateTimeInput = DateTime | CalendarDate | Date | number | string | DateTimeFields | TemporalValue;

/**
 * An exact moment with a zone to read it in. One type for timestamps, appointments and deadlines.
 * The zone is a view: `toString()` and `toJSON()` print the instant in UTC.
 * @see {@link https://nativedates.dev/api/date-time/ DateTime Documentation}
 */
export class DateTime {
  constructor(input: DateTimeInput, zone?: Zone);
  constructor(input: DateTimeInput, options?: ReadOptions);

  /** The value in the configured locale's common form, `'Sep 6, 2026, 2:30 PM EDT'`, what `format('text')` prints */
  readonly text: string;
  readonly month: number;
  readonly day: number;
  readonly year: number;
  /** ISO, 1 for monday through 7 for sunday */
  readonly dayOfWeek: number;
  /** The day this value's weeks start on, 1 for monday through 7 for sunday: the configured `weekStart`, else its locale's own */
  readonly weekStart: number;
  readonly hour: number;
  readonly minute: number;
  readonly second: number;
  readonly millisecond: number;
  readonly microsecond: number;
  readonly nanosecond: number;
  /** The canonical zone id */
  readonly zone: string;
  /** The UTC offset in effect, `'+05:30'` */
  readonly offset: string;
  /** Whole seconds since the start of 1970 in UTC, rounded down: what a JWT or a Unix API takes */
  readonly epochSeconds: number;
  /** Milliseconds since the start of 1970 in UTC: what `Date.now()` and `new Date(ms)` use */
  readonly epochMilliseconds: number;
  /** The exact instant as epoch nanoseconds, the key two datetimes a nanosecond apart still tell apart on */
  readonly epochNanoseconds: bigint;
  readonly quarter: number;
  readonly dayOfYear: number;
  /** ISO week number */
  readonly weekOfYear: number;
  readonly daysInMonth: number;
  readonly daysInYear: number;
  /** 23, 24 or 25 across a daylight saving change */
  readonly hoursInDay: number;
  isLeapYear(): boolean;
  isWeekend(): boolean;
  isWeekday(): boolean;
  /** The calendar date in this zone */
  readonly date: CalendarDate;
  /** The time of day in this zone */
  readonly time: Time;
  /**
   * This datetime as a date or a time, the call spelling of `.date` and `.time`
   * @see {@link https://nativedates.dev/api/date-time/#as as}
   */
  as(kind: 'date'): CalendarDate;
  as(kind: 'time'): Time;
  as(kind: 'datetime'): DateTime;
  as(kind: 'monthDay'): MonthDay;
  as(kind: 'yearMonth'): YearMonth;
  /** The month and day in this zone, the year dropped */
  readonly monthDay: MonthDay;
  /** The year and month in this zone, the day dropped */
  readonly yearMonth: YearMonth;

  /**
   * Adding days keeps the wall clock across a daylight saving change, adding hours counts hours
   * @see {@link https://nativedates.dev/api/date-time/#plus plus}
   */
  plus(amount: DurationInput, unit?: Unit): DateTime;
  /** Alias for `plus` */
  add(amount: DurationInput, unit?: Unit): DateTime;
  /** @see {@link https://nativedates.dev/api/date-time/#minus minus} */
  minus(amount: DurationInput, unit?: Unit): DateTime;
  /** Alias for `minus` */
  subtract(amount: DurationInput, unit?: Unit): DateTime;

  /** @see {@link https://nativedates.dev/api/date-time/#set set} */
  set(fields: DateTimeFields): DateTime;
  set(unit: Unit, value: number): DateTime;
  /**
   * The same date and zone at another time of day
   * @see {@link https://nativedates.dev/api/date-time/#at at}
   */
  at(time: TimeInput): DateTime;
  /**
   * The same instant read in another zone
   * @see {@link https://nativedates.dev/api/date-time/#in in}
   */
  in(zone: Zone): DateTime;
  /**
   * The first instant of the unit around this value. A week starts on the configured first day, or on `firstDay`
   * @see {@link https://nativedates.dev/api/date-time/#startof startOf}
   */
  startOf(unit: Unit, firstDay?: DayOfWeek): DateTime;
  /**
   * The last millisecond of the unit
   * @see {@link https://nativedates.dev/api/date-time/#endof endOf}
   */
  endOf(unit: Unit, firstDay?: DayOfWeek): DateTime;
  /** @see {@link https://nativedates.dev/api/date-time/#round round} */
  round(unit: Unit): DateTime;
  round(increment: number, unit: Unit): DateTime;
  /** @see {@link https://nativedates.dev/api/date-time/#floor floor} */
  floor(unit: Unit): DateTime;
  floor(increment: number, unit: Unit): DateTime;
  /** @see {@link https://nativedates.dev/api/date-time/#ceil ceil} */
  ceil(unit: Unit): DateTime;
  ceil(increment: number, unit: Unit): DateTime;
  /**
   * The next such day of the week strictly after this one, at the same time of day
   * @see {@link https://nativedates.dev/api/date-time/#next next}
   */
  next(dayOfWeek: DayOfWeek): DateTime;
  /** @see {@link https://nativedates.dev/api/date-time/#previous previous} */
  previous(dayOfWeek: DayOfWeek): DateTime;
  /**
   * The next occurrence of a month-day strictly after this one, at the same time of day
   * @see {@link https://nativedates.dev/api/date-time/#next next}
   */
  next(monthDay: MonthDay): DateTime;
  previous(monthDay: MonthDay): DateTime;

  /**
   * A range from this moment until another, the end excluded
   * @see {@link https://nativedates.dev/api/date-time/#to to}
   */
  to(end: DateTimeInput | DurationInput): DateTimeRange;
  to(count: number, unit: Unit): DateTimeRange;
  /** A range that starts at this moment and runs for a length, the end excluded: `meeting.for(90, 'minutes')`. The same as `to` given a length */
  for(length: DurationInput): DateTimeRange;
  for(count: number, unit: Unit): DateTimeRange;
  /**
   * The unit containing this moment as a half-open range, its start until the next start
   * @see {@link https://nativedates.dev/api/date-time/#range range}
   */
  range(unit: Unit, firstDay?: DayOfWeek): DateTimeRange;

  /**
   * The same instant, whatever zone each side reads it in
   * @see {@link https://nativedates.dev/api/date-time/#equals equals}
   */
  equals(other: DateTimeInput): boolean;
  /** @see {@link https://nativedates.dev/api/date-time/#isbefore isBefore} */
  isBefore(other: DateTimeInput): boolean;
  /** @see {@link https://nativedates.dev/api/date-time/#isafter isAfter} */
  isAfter(other: DateTimeInput): boolean;
  /**
   * Same to the unit, judged in this datetime's zone
   * @see {@link https://nativedates.dev/api/date-time/#issame isSame}
   */
  isSame(other: DateTimeInput, unit?: Unit, firstDay?: DayOfWeek): boolean;
  isPast(): boolean;
  isFuture(): boolean;
  isToday(): boolean;
  isTomorrow(): boolean;
  isYesterday(): boolean;

  /**
   * A duration balanced from years down that remembers this moment, or the whole length as a number in a unit
   * @see {@link https://nativedates.dev/api/date-time/#until until}
   */
  until(other: DateTimeInput): Duration;
  until(other: DateTimeInput, unit: Unit): number;
  /** @see {@link https://nativedates.dev/api/date-time/#since since} */
  since(other: DateTimeInput): Duration;
  since(other: DateTimeInput, unit: Unit): number;

  /**
   * A preset ('short', 'medium', 'long', 'full', 'date', 'time', 'month', 'text') or an Intl options bag
   * @see {@link https://nativedates.dev/api/date-time/#format format}
   */
  format(spec?: FormatSpec, locale?: Locale): string;
  /**
   * The locale this value is written in, when one was set on it or on the value it came from
   * @see {@link https://nativedates.dev/api/date-time/#locale locale}
   */
  locale(): Locale | undefined;
  /**
   * The same value written in another locale, which every value made from it keeps. An unset tag clears it
   * @see {@link https://nativedates.dev/api/date-time/#locale locale}
   */
  locale(tag: Locale | null | undefined): this;
  /**
   * Alias for `locale`
   * @see {@link https://nativedates.dev/api/date-time/#lang lang}
   */
  lang(): Locale | undefined;
  lang(tag: Locale | null | undefined): this;
  /**
   * How far this moment is from another, in words: `'3 hours ago'`, `'in 2 days'`. From now when no other is given
   * @see {@link https://nativedates.dev/api/date-time/#from from}
   */
  from(other?: DateTimeInput, locale?: Locale): string;
  /**
   * How far this moment is from now, in words
   * @see {@link https://nativedates.dev/api/date-time/#fromnow fromNow}
   */
  fromNow(locale?: Locale): string;
  /**
   * Alias for `from`
   * @see {@link https://nativedates.dev/api/date-time/#formatrelative formatRelative}
   */
  formatRelative(other?: DateTimeInput, locale?: Locale): string;
  /**
   * The instant in UTC, `'2026-09-06T14:30:00.000Z'`
   * @see {@link https://nativedates.dev/api/date-time/#tostring toString}
   */
  toString(): string;
  toJSON(): string;
  /** @see {@link https://nativedates.dev/api/date-time/#tojsdate toJSDate} */
  toJSDate(): Date;
  /** @see {@link https://nativedates.dev/api/date-time/#totemporal toTemporal} */
  toTemporal(): TemporalValue;
  /**
   * Epoch milliseconds, so datetimes sort and subtract with `<` and `-`
   * @see {@link https://nativedates.dev/api/date-time/#valueof valueOf}
   */
  valueOf(): number;
}

/**
 * Reads an ISO string (`'2026-09-06T14:30Z'`, `'2026-09-06T14:30'` as a wall clock in the zone,
 * `'2026-09-06'` as midnight), a Date, epoch milliseconds, a fields object, a date, or a Temporal value.
 * A missing value refuses, `now()` reads the current moment
 * @see {@link https://nativedates.dev/api/datetime-fn/#datetime datetime}
 */
export function datetime(input: DateTimeInput, zone?: Zone): DateTime;
export function datetime(input: DateTimeInput, options?: ReadOptions): DateTime;

/**
 * The current moment at millisecond precision, in the zone or the configured default
 * @see {@link https://nativedates.dev/api/datetime-fn/#now now}
 */
export function now(zone?: Zone): DateTime;
/**
 * `now(zone).startOf('day')`, the bound a query for today writes
 * @see {@link https://nativedates.dev/api/datetime-fn/#startoftoday startOfToday}
 */
export function startOfToday(zone?: Zone): DateTime;
/**
 * `now(zone).endOf('day')`, the last millisecond of today
 * @see {@link https://nativedates.dev/api/datetime-fn/#endoftoday endOfToday}
 */
export function endOfToday(zone?: Zone): DateTime;

/** @see {@link https://nativedates.dev/api/kind-of/#isdatetime isDateTime} */
export function isDateTime(value: unknown): value is DateTime;
