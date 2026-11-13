import type { CalendarDate, CalendarDateInput, FormatSpec, Locale, ReadOptions, TemporalValue, Zone } from './index.js';

/** A month and a day, singular, as Temporal's `with()` spells them */
export interface MonthDayFields {
  month: number;
  day: number;
}

/**
 * Anything that reads as a month-day: `'10-17'`, `'10/17'`, a fields object, a `MonthDay`, or anything a
 * date reads (`'1990-10-17'`, a `CalendarDate`, a `DateTime`, a `Date`) with its year dropped
 */
export type MonthDayInput = MonthDay | MonthDayFields | CalendarDateInput;

/** The options form of `monthDay()`'s second argument */
export interface MonthDayOptions extends ReadOptions {
  /**
   * Read `'17/10'`, `'17.10'` or `'17-5'` day first, the order `dayMonth()` reads. The word decides
   * it, never `configure()`. ISO's `'10-17'`, two digits a side across a dash, is month first either
   * way, so what `toJSON()` writes reads back
   */
  dayFirst?: boolean;
}

/** Any preset or `Intl.DateTimeFormat` options bag a date formats with, read for its month and day */
export type MonthDayFormat = FormatSpec;

/**
 * A month and a day with no year: a birthday, an anniversary, a holiday. Feb 29 falls on Feb 28 in a
 * year without one.
 */
export class MonthDay {
  constructor(input: MonthDayInput, options?: Zone | MonthDayOptions);
  constructor(month: number | string, day: number | string);

  /** The presets `format()` reads by name, open to more: `'short'` `10/17`, `'medium'` `Oct 17`, `'long'` `October 17` */
  static presets: Record<string, Intl.DateTimeFormatOptions>;

  /** The value in the configured locale's common form, `'Oct 17'`, what `format()` prints */
  readonly text: string;
  readonly month: number;
  readonly day: number;

  /** The date this falls on in a year. Feb 29 falls on Feb 28 in a year without one */
  in(year: number | string): CalendarDate;
  /** The occurrence strictly after a day, the day itself never counting. What `date.next(monthDay)` asks */
  after(day: CalendarDateInput): CalendarDate;
  /** The occurrence strictly before a day. What `date.previous(monthDay)` asks */
  before(day: CalendarDateInput): CalendarDate;
  /** The occurrence coming up, counted from today or from a day: `birthday.next()` */
  next(day?: CalendarDateInput): CalendarDate;
  /** The most recent occurrence, counted from today or from a day */
  previous(day?: CalendarDateInput): CalendarDate;
  as(kind: 'monthDay'): MonthDay;

  /**
   * The same month and day. A date reads as the month and day it is, so two birthdays are equal or not
   * whichever one asks. Text as people write it, `'05/10'`, refuses, since it has an order only under
   * `monthDay()` or `dayMonth()`: ISO `'10-17'` reads
   */
  equals(other: MonthDayInput): boolean;
  /**
   * Whether a date is this month-day's occurrence in the date's own year, so Feb 29 falls on
   * Feb 28, 2027 and not on Feb 28, 2028
   */
  fallsOn(day: CalendarDateInput): boolean;
  /** Whether it falls on today. Today depends on where you stand, so these take the zone to judge from */
  isToday(zone?: Zone): boolean;
  isTomorrow(zone?: Zone): boolean;
  isYesterday(zone?: Zone): boolean;

  /**
   * Prints the month and the day and nothing else, so any preset name or options bag that formats a
   * date formats this too. A locale whose calendar keeps other months (Hebrew, Persian, Islamic)
   * prints the Gregorian ones
   */
  format(spec?: MonthDayFormat, locale?: Locale): string;
  /** ISO 8601, `'10-17'` */
  toString(): string;
  toJSON(): string;
  toTemporal(): TemporalValue;
  /** Throws. A month-day is not a point on the number line */
  valueOf(): never;
}

/**
 * Reads `'10-17'`, `'10/17'` or `'10.17'` month first, two numbers, a fields object, or anything a date
 * reads with its year dropped. A missing value refuses, `today().monthDay` reads the current one.
 * With `{ loose: true }` it also reads a month by its English name and a day, `'Oct 17'` or
 * `'17th October'`, and gives null for what it cannot read. It never puts text to `Date`, which makes
 * up the parts text leaves out: a date written loosely is
 * `date(text, { loose: true })?.monthDay`, and an instant is `datetime(text, zone).monthDay`
 */
export function monthDay(input: unknown, options: MonthDayOptions & { loose: true; }): MonthDay | null;
export function monthDay(input: MonthDayInput, options?: Zone | MonthDayOptions): MonthDay;
export function monthDay(month: number | string, day: number | string): MonthDay;

/**
 * The same value read day first, the order most of the world writes it: `dayMonth('17/10')` is
 * `monthDay('10/17')`. ISO's `'10-17'`, two digits a side across a dash, is month first under both
 */
export function dayMonth(input: unknown, options: MonthDayOptions & { loose: true; }): MonthDay | null;
export function dayMonth(input: MonthDayInput, options?: Zone | MonthDayOptions): MonthDay;
export function dayMonth(day: number | string, month: number | string): MonthDay;

export function isMonthDay(value: unknown): value is MonthDay;
