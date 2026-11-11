import type { CalendarDate, CalendarDateInput, Locale, ReadOptions, TemporalValue, Zone } from 'native-dates';

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
  /** Read `'17/10'` day first, the order `dayMonth()` reads. The word decides it, never `configure()` */
  dayFirst?: boolean;
}

/** A preset (`'short'`, `'medium'`, `'long'`) or an `Intl.DateTimeFormat` options bag of month and day */
export type MonthDayFormat = 'short' | 'medium' | 'long' | Intl.DateTimeFormatOptions | (string & {});

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

  /**
   * Against a date, whether that date is this month-day's occurrence in its year, so Feb 29 answers to
   * Feb 28, 2027. Against another month-day, the same month and day
   */
  equals(other: MonthDayInput): boolean;
  /** Today depends on where you stand, so these take the zone to judge from */
  isToday(zone?: Zone): boolean;
  isTomorrow(zone?: Zone): boolean;
  isYesterday(zone?: Zone): boolean;

  /** A format that asks for a year, an era or a weekday refuses, since a month-day has none */
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
 * reads with its year dropped. A missing value refuses, `today().monthDay` reads the current one
 */
export function monthDay(input: unknown, options: MonthDayOptions & { loose: true; }): MonthDay | null;
export function monthDay(input: MonthDayInput, options?: Zone | MonthDayOptions): MonthDay;
export function monthDay(month: number | string, day: number | string): MonthDay;

/** The same value read day first, the order most of the world writes it: `dayMonth('17/10')` is `monthDay('10/17')` */
export function dayMonth(input: unknown, options: MonthDayOptions & { loose: true; }): MonthDay | null;
export function dayMonth(input: MonthDayInput, options?: Zone | MonthDayOptions): MonthDay;
export function dayMonth(day: number | string, month: number | string): MonthDay;

export function isMonthDay(value: unknown): value is MonthDay;

declare module 'native-dates' {
  interface DateTime {
    /** The month and day in this zone, the year dropped */
    readonly monthDay: MonthDay;
    /** The next occurrence of a month-day strictly after this one, at the same time of day */
    next(monthDay: MonthDay): DateTime;
    previous(monthDay: MonthDay): DateTime;
  }

  interface CalendarDate {
    /** The month and day, the year dropped */
    readonly monthDay: MonthDay;
    /** The next occurrence of a month-day strictly after this date */
    next(monthDay: MonthDay): CalendarDate;
    previous(monthDay: MonthDay): CalendarDate;
  }

  export function kindOf(value: MonthDay): 'monthDay';
}
