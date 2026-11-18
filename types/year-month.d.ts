import type { CalendarDate, CalendarDateInput } from './calendar-date.js';
import type { Duration, DurationInput } from './duration.js';
import type { FormatSpec } from './helpers/format.js';
import type { TemporalValue, Unit } from './helpers/units.js';
import type { Locale, ReadOptions, Zone } from './helpers/zones.js';

/** A year and a month, singular, as Temporal's `with()` spells them */
export interface YearMonthFields {
  year: number;
  month: number;
}

/**
 * Anything that reads as a year-month: `'2026-11'`, a fields object, a `YearMonth`, or anything a date
 * reads (`'2026-11-16'`, a `CalendarDate`, a `DateTime`, a `Date`) with its day dropped
 */
export type YearMonthInput = YearMonth | YearMonthFields | CalendarDateInput;

/** Any preset or `Intl.DateTimeFormat` options bag a date formats with, read for its year and month */
export type YearMonthFormat = FormatSpec;

/**
 * A year and a month with no day: a billing period, a card's expiry, what a month picker holds. It
 * counts in months and years, and hands over any one of its days as a date.
 * @see {@link https://nativedates.dev/api/year-month/ YearMonth Documentation}
 */
export class YearMonth {
  constructor(input: YearMonthInput, options?: Zone | ReadOptions);
  constructor(year: number | string, month: number | string);

  /** The century a two-digit year is read in by `monthYear()` (default: 2000) */
  static century: number;

  /** The value in the configured locale's common form, `'Nov 2026'`, what `format()` prints */
  readonly text: string;
  readonly month: number;
  readonly year: number;
  readonly quarter: number;
  readonly daysInMonth: number;
  readonly daysInYear: number;
  /** @see {@link https://nativedates.dev/api/year-month/#isleapyear isLeapYear} */
  isLeapYear(): boolean;
  /** The first day of the month */
  readonly start: CalendarDate;
  /** The last day of the month, the 28th, 29th, 30th or 31st */
  readonly end: CalendarDate;

  /**
   * Adds years, months or quarters. A smaller unit refuses
   * @see {@link https://nativedates.dev/api/year-month/#plus plus}
   */
  plus(amount: DurationInput, unit?: Unit): YearMonth;
  /** Alias for `plus` */
  add(amount: DurationInput, unit?: Unit): YearMonth;
  /** @see {@link https://nativedates.dev/api/year-month/#minus minus} */
  minus(amount: DurationInput, unit?: Unit): YearMonth;
  /** Alias for `minus` */
  subtract(amount: DurationInput, unit?: Unit): YearMonth;

  /** @see {@link https://nativedates.dev/api/year-month/#set set} */
  set(fields: Partial<YearMonthFields>): YearMonth;
  set(unit: Unit, value: number): YearMonth;
  /**
   * The date of one of its days. The 31st is the last day of a month without one, and a day past 31 refuses
   * @see {@link https://nativedates.dev/api/year-month/#on on}
   */
  on(day: number | string): CalendarDate;

  /**
   * -1, 0 or 1, a sort comparator. A date reads as the month it falls in
   * @see {@link https://nativedates.dev/api/year-month/#compare compare}
   */
  compare(other: YearMonthInput): number;
  /** @see {@link https://nativedates.dev/api/year-month/#equals equals} */
  equals(other: YearMonthInput): boolean;
  /** @see {@link https://nativedates.dev/api/year-month/#isbefore isBefore} */
  isBefore(other: YearMonthInput): boolean;
  /** @see {@link https://nativedates.dev/api/year-month/#isafter isAfter} */
  isAfter(other: YearMonthInput): boolean;
  /**
   * Whether a day falls in this month
   * @see {@link https://nativedates.dev/api/year-month/#contains contains}
   */
  contains(day: CalendarDateInput): boolean;
  /** Alias for `contains` */
  includes(day: CalendarDateInput): boolean;
  /**
   * Past once its last day is, and future until its first, judged from the zone
   * @see {@link https://nativedates.dev/api/year-month/#ispast isPast}
   */
  isPast(zone?: Zone): boolean;
  /** @see {@link https://nativedates.dev/api/year-month/#isfuture isFuture} */
  isFuture(zone?: Zone): boolean;

  /**
   * The months to another year-month as a duration of years and months, or the length as a number in a unit
   * @see {@link https://nativedates.dev/api/year-month/#until until}
   */
  until(other: YearMonthInput): Duration;
  until(other: YearMonthInput, unit: Unit): number;
  /** @see {@link https://nativedates.dev/api/year-month/#since since} */
  since(other: YearMonthInput): Duration;
  since(other: YearMonthInput, unit: Unit): number;
  /** @see {@link https://nativedates.dev/api/year-month/#as as} */
  as(kind: 'yearMonth'): YearMonth;

  /**
   * Prints the year and the month and nothing else, in the Gregorian calendar whatever the locale's
   * own, so any preset name or options bag that formats a date formats this too
   * @see {@link https://nativedates.dev/api/year-month/#format format}
   */
  format(spec?: YearMonthFormat, locale?: Locale): string;
  /**
   * The locale this value is written in, when one was set on it or on the value it came from
   * @see {@link https://nativedates.dev/api/year-month/#locale locale}
   */
  locale(): Locale | undefined;
  /**
   * The same value written in another locale, which every value made from it keeps. An unset tag clears it
   * @see {@link https://nativedates.dev/api/year-month/#locale locale}
   */
  locale(tag: Locale | null | undefined): this;
  /**
   * Alias for `locale`
   * @see {@link https://nativedates.dev/api/year-month/#lang lang}
   */
  lang(): Locale | undefined;
  lang(tag: Locale | null | undefined): this;
  /**
   * ISO 8601, `'2026-11'`
   * @see {@link https://nativedates.dev/api/year-month/#tostring toString}
   */
  toString(): string;
  toJSON(): string;
  /** @see {@link https://nativedates.dev/api/year-month/#totemporal toTemporal} */
  toTemporal(): TemporalValue;
  /**
   * Throws. A year-month is not a point on the number line
   * @see {@link https://nativedates.dev/api/year-month/#valueof valueOf}
   */
  valueOf(): never;
}

/**
 * Reads `'2026-11'`, two numbers, a fields object, or anything a date reads with its day dropped. A
 * missing value refuses, `today().yearMonth` reads the current one. With `{ loose: true }` it also
 * reads a month by its name and a year, in English or the configured locale, `'Nov 2026'`, and gives null for what it cannot read.
 * It never puts text to `Date`, which makes up the parts text leaves out: a date written loosely is
 * `date(text, { loose: true })?.yearMonth`
 * @see {@link https://nativedates.dev/api/year-month-fn/#yearmonth yearMonth}
 */
export function yearMonth(input: unknown, options: ReadOptions & { loose: true; }): YearMonth | null;
export function yearMonth(input: YearMonthInput, options?: Zone | ReadOptions): YearMonth;
export function yearMonth(year: number | string, month: number | string): YearMonth;

/**
 * The same value read month first, the order a card prints it: `monthYear('11/26')` is
 * `yearMonth('2026-11')`. A two-digit year reads in `YearMonth.century`. ISO's `'2026-11'` is year
 * first under both
 * @see {@link https://nativedates.dev/api/year-month-fn/#monthyear monthYear}
 */
export function monthYear(input: unknown, options: ReadOptions & { loose: true; }): YearMonth | null;
export function monthYear(input: YearMonthInput, options?: Zone | ReadOptions): YearMonth;
export function monthYear(month: number | string, year: number | string): YearMonth;

/** @see {@link https://nativedates.dev/api/kind-of/#isyearmonth isYearMonth} */
export function isYearMonth(value: unknown): value is YearMonth;
