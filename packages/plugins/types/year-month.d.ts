import type {
  CalendarDate,
  CalendarDateInput,
  Duration,
  DurationInput,
  Locale,
  ReadOptions,
  TemporalValue,
  Unit,
  Zone,
} from 'native-dates';

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

/** A preset (`'short'`, `'medium'`, `'long'`) or an `Intl.DateTimeFormat` options bag of year and month */
export type YearMonthFormat = 'short' | 'medium' | 'long' | Intl.DateTimeFormatOptions | (string & {});

/**
 * A year and a month with no day: a billing period, a card's expiry, what a month picker holds. It
 * counts in months and years, and hands over any one of its days as a date.
 */
export class YearMonth {
  constructor(input: YearMonthInput, options?: Zone | ReadOptions);
  constructor(year: number | string, month: number | string);

  /** The presets `format()` reads by name, open to more: `'short'` `11/26`, `'medium'` `Nov 2026`, `'long'` `November 2026` */
  static presets: Record<string, Intl.DateTimeFormatOptions>;

  /** The value in the configured locale's common form, `'Nov 2026'`, what `format()` prints */
  readonly text: string;
  readonly month: number;
  readonly year: number;
  readonly quarter: number;
  readonly daysInMonth: number;
  readonly daysInYear: number;
  isLeapYear(): boolean;
  /** The first day of the month */
  readonly start: CalendarDate;
  /** The last day of the month, the 28th, 29th, 30th or 31st */
  readonly end: CalendarDate;

  /** Adds years, months or quarters. A smaller unit refuses */
  plus(amount: DurationInput, unit?: Unit): YearMonth;
  /** Alias for `plus` */
  add(amount: DurationInput, unit?: Unit): YearMonth;
  minus(amount: DurationInput, unit?: Unit): YearMonth;
  /** Alias for `minus` */
  subtract(amount: DurationInput, unit?: Unit): YearMonth;
  /** Alias for `minus` */
  remove(amount: DurationInput, unit?: Unit): YearMonth;

  set(fields: Partial<YearMonthFields>): YearMonth;
  set(unit: Unit, value: number): YearMonth;
  /** The date of one of its days. The 31st is the last day of a month without one, and a day past 31 refuses */
  on(day: number | string): CalendarDate;

  /** -1, 0 or 1, a sort comparator. A date reads as the month it falls in */
  compare(other: YearMonthInput): number;
  equals(other: YearMonthInput): boolean;
  isBefore(other: YearMonthInput): boolean;
  isAfter(other: YearMonthInput): boolean;
  /** Whether a day falls in this month */
  contains(day: CalendarDateInput): boolean;
  /** Past once its last day is, and future until its first, judged from the zone */
  isPast(zone?: Zone): boolean;
  isFuture(zone?: Zone): boolean;

  /** The months to another year-month as a duration of years and months, or the length as a number in a unit */
  until(other: YearMonthInput): Duration;
  until(other: YearMonthInput, unit: Unit): number;
  since(other: YearMonthInput): Duration;
  since(other: YearMonthInput, unit: Unit): number;

  /** A format that asks for a day or a weekday refuses, since a year-month has none */
  format(spec?: YearMonthFormat, locale?: Locale): string;
  /** ISO 8601, `'2026-11'` */
  toString(): string;
  toJSON(): string;
  toTemporal(): TemporalValue;
  /** Throws. A year-month is not a point on the number line */
  valueOf(): never;
}

/**
 * Reads `'2026-11'`, two numbers, a fields object, or anything a date reads with its day dropped. A
 * missing value refuses, `today().yearMonth` reads the current one
 */
export function yearMonth(input: unknown, options: ReadOptions & { loose: true; }): YearMonth | null;
export function yearMonth(input: YearMonthInput, options?: Zone | ReadOptions): YearMonth;
export function yearMonth(year: number | string, month: number | string): YearMonth;

export function isYearMonth(value: unknown): value is YearMonth;

declare module 'native-dates' {
  interface DateTime {
    /** The year and month in this zone, the day dropped */
    readonly yearMonth: YearMonth;
  }

  interface CalendarDate {
    /** The year and month, the day dropped */
    readonly yearMonth: YearMonth;
  }

  /** Two numbers name a year and a month and no day, so they read as a year-month */
  export function date(year: number, month: number): YearMonth;
  export function kindOf(value: YearMonth): 'yearMonth';
  export function compare(a: YearMonth, b: YearMonthInput): -1 | 0 | 1;
}
