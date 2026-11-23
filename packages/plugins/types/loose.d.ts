import type {
  CalendarDate,
  CalendarDateInput,
  DateRange,
  DateTime,
  DateTimeInput,
  DateTimeRange,
  Disambiguation,
  Duration,
  DurationInput,
  Locale,
  MonthDay,
  MonthDayInput,
  MonthDayOptions,
  ReadOptions,
  TemporalZonedDateTime,
  Time,
  TimeInput,
  TimeRange,
  YearMonth,
  YearMonthInput,
  Zone,
} from 'native-dates';

/**
 * Parses an informal date-time string with `Date.parse`, or with the active locale's month names,
 * AM/PM words, digits, and day-month order from `Intl`, rejecting impossible calendar days.
 * `timeOnly` also accepts a clock time with no date.
 * @internal
 */
export function looseZoned(
  text: string,
  options?: {
    zone?: Zone;
    dayFirst?: boolean;
    locale?: Locale;
    timeOnly?: boolean;
    disambiguation?: Disambiguation;
  },
): TemporalZonedDateTime | undefined;

/**
 * Parses the year, month, and day named by an informal partial date (`'16 de enero'`, `'ноябрь 2026 г.'`).
 * @internal
 */
export function looseParts(
  text: string,
  options?: { dayFirst?: boolean; locale?: Locale; },
): { year?: string; month?: number | string; day?: string; } | undefined;

declare module 'native-dates' {
  interface ReadOptions {
    /**
     * Read informal input the way the active locale writes it, taking month names, AM/PM words,
     * and day-month order from `Intl` and digits from any script, then fall back to engine `Date`
     * parsing for machine formats. Returns `null` instead of throwing when input data cannot be read.
     *
     * @default false
     * @see {@link https://nativedates.dev/plugins/loose/#factory-options Factory options}
     */
    loose?: boolean;

    /**
     * Interpret ambiguous numeric dates such as `'07.09.2026'` day-first in loose mode.
     * Precedence: per-call `dayFirst` > per-call `locale` > `configure().dayFirst` > `configure().locale` > runtime locale.
     *
     * @see {@link https://nativedates.dev/plugins/loose/#day-first-numeric-dates Day-first numeric dates}
     */
    dayFirst?: boolean;
  }

  interface Settings {
    /**
     * Default numeric date order for loose calls that specify neither `dayFirst` nor `locale` per call,
     * overriding the configured or runtime default locale. When `true`, `'07.09.2026'` reads as September 7
     * rather than July 9. Pass `null` to follow the locale again.
     *
     * @default undefined
     * @example
     * ```ts
     * import '@native-dates/plugins/loose';
     * import { configure, date } from 'native-dates';
     *
     * configure({ dayFirst: true });
     * date('07.09.2026', { loose: true })?.toString(); // '2026-09-07'
     * ```
     *
     * @see {@link https://nativedates.dev/plugins/loose/#configure configure}
     */
    dayFirst?: boolean | null;
  }

  /**
   * Parses untrusted or informal timestamp input in loose mode, returning `null` instead of throwing
   * when `input` cannot be read or rolls over an impossible day like February 30.
   *
   * @param input - Untrusted string, timestamp, or unknown value
   * @param options - Options with `loose: true` and optional `zone`, `locale`, `disambiguation`, and `dayFirst`
   * @returns Parsed `DateTime` in the target zone, or `null` when unreadable
   *
   * @example
   * ```ts
   * import '@native-dates/plugins/loose';
   * import { datetime } from 'native-dates';
   *
   * datetime('Sat, 06 Sep 2026 14:30:00 GMT', { loose: true })?.toString(); // '2026-09-06T14:30:00.000Z'
   * datetime('TBD', { loose: true }); // null
   * ```
   *
   * @see {@link https://nativedates.dev/plugins/loose/#datetime datetime}
   */
  export function datetime(input: DateTimeInput, options: ReadOptions & { loose: false; }): DateTime;
  export function datetime(input: unknown, options: ReadOptions & { loose: boolean; }): DateTime | null;

  /**
   * Parses untrusted or informal date input in loose mode, returning `null` instead of throwing
   * when `input` cannot be read or represents an impossible date like February 30.
   *
   * @param input - Untrusted string, date, or unknown value
   * @param options - Options with `loose: true` and optional `zone`, `locale`, `disambiguation`, and `dayFirst`
   * @returns Parsed `CalendarDate`, or `null` when unreadable
   *
   * @example
   * ```ts
   * import '@native-dates/plugins/loose';
   * import { date } from 'native-dates';
   *
   * date('07.09.2026', { loose: true, dayFirst: true })?.toString(); // '2026-09-07'
   * date('2026-02-30', { loose: true }); // null
   * ```
   *
   * @see {@link https://nativedates.dev/plugins/loose/#datetime date}
   */
  export function date(input: CalendarDateInput, options: ReadOptions & { loose: false; }): CalendarDate;
  export function date(input: unknown, options: ReadOptions & { loose: boolean; }): CalendarDate | null;

  /**
   * Parses untrusted or informal time input in loose mode, returning `null` instead of throwing
   * when `input` cannot be read.
   *
   * @param input - Untrusted string, time, or unknown value
   * @param options - Options with `loose: true` and optional `zone`, `locale`, `disambiguation`, and `dayFirst`
   * @returns Parsed `Time`, or `null` when unreadable
   *
   * @example
   * ```ts
   * import '@native-dates/plugins/loose';
   * import { time } from 'native-dates';
   *
   * time('September 6, 2026 5:30 PM', { loose: true })?.toString(); // '17:30:00'
   * time('whenever', { loose: true }); // null
   * ```
   *
   * @see {@link https://nativedates.dev/plugins/loose/#datetime time}
   */
  export function time(input: TimeInput, options: ReadOptions & { loose: false; }): Time;
  export function time(input: unknown, options: ReadOptions & { loose: boolean; }): Time | null;

  /**
   * Parses untrusted duration input in loose mode, returning `null` instead of throwing
   * when `input` cannot be read.
   *
   * @param input - Untrusted duration phrase, string, or unknown value
   * @param options - Options with `loose: true` and optional `locale`
   * @returns Parsed `Duration`, or `null` when unreadable
   *
   * @example
   * ```ts
   * import '@native-dates/plugins/loose';
   * import { duration } from 'native-dates';
   *
   * duration('45 mins', { loose: true })?.minutes; // 45
   * duration('soon', { loose: true }); // null
   * ```
   *
   * @see {@link https://nativedates.dev/plugins/loose/#datetime duration}
   */
  export function duration(input: DurationInput, options: { loose: false; locale?: Locale; }): Duration;
  export function duration(input: unknown, options: { loose: boolean; locale?: Locale; }): Duration | null;

  /**
   * Parses a `MonthDay` in loose mode, matching English or localized month names such as `'17 février'`
   * and returning `null` when unreadable.
   */
  export function monthDay(input: MonthDayInput, options: MonthDayOptions & { loose: false; }): MonthDay;
  export function monthDay(input: unknown, options: MonthDayOptions & { loose: boolean; }): MonthDay | null;

  /**
   * Parses a day-first `MonthDay` in loose mode, returning `null` when unreadable.
   */
  export function dayMonth(input: MonthDayInput, options: MonthDayOptions & { loose: false; }): MonthDay;
  export function dayMonth(input: unknown, options: MonthDayOptions & { loose: boolean; }): MonthDay | null;

  /**
   * Parses a `YearMonth` in loose mode, matching English or localized month names such as `'février 2026'`
   * and returning `null` when unreadable.
   */
  export function yearMonth(input: YearMonthInput, options: ReadOptions & { loose: false; }): YearMonth;
  export function yearMonth(input: unknown, options: ReadOptions & { loose: boolean; }): YearMonth | null;

  /**
   * Parses a month-first `YearMonth` in loose mode, returning `null` when unreadable.
   */
  export function monthYear(input: YearMonthInput, options: ReadOptions & { loose: false; }): YearMonth;
  export function monthYear(input: unknown, options: ReadOptions & { loose: boolean; }): YearMonth | null;

  type Strict = ReadOptions & { loose: false; };
  type Loose = ReadOptions & { loose: boolean; };

  export function dateRange(
    start: CalendarDateInput,
    end: CalendarDateInput | DurationInput,
    options: Strict,
  ): DateRange;
  export function dateRange(interval: string, options: Strict): DateRange;

  /**
   * Parses a `DateRange` from endpoints in loose mode, returning `null` if either endpoint is unreadable,
   * and throwing a `RangeError` (`invalidRange`) if a valid end date precedes the start date.
   *
   * @param start - Start calendar date input
   * @param end - Inclusive end date or calendar duration length
   * @param options - Options with `loose: true` and optional `zone`, `locale`, `disambiguation`, and `dayFirst`
   * @returns Parsed `DateRange`, or `null` when either endpoint is unreadable
   *
   * @example
   * ```ts
   * import '@native-dates/plugins/loose';
   * import { dateRange } from 'native-dates';
   *
   * dateRange('Sep 1 2026', 'Sep 7 2026', { loose: true })?.toString(); // '2026-09-01/2026-09-07'
   * ```
   *
   * @see {@link https://nativedates.dev/plugins/loose/#datetime dateRange}
   */
  export function dateRange(
    start: unknown,
    end: unknown,
    options: Loose,
  ): DateRange | null;
  /**
   * Parses a `DateRange` from an interval string in loose mode, returning `null` when unreadable.
   *
   * @param interval - Interval string such as `'Sep 1, 2026 to Sep 7, 2026'`
   * @param options - Options with `loose: true` and optional `zone`, `locale`, `disambiguation`, and `dayFirst`
   * @returns Parsed `DateRange`, or `null` when unreadable
   *
   * @see {@link https://nativedates.dev/plugins/loose/#datetime dateRange}
   */
  export function dateRange(interval: string, options: Loose): DateRange | null;

  /**
   * Parses a `DateTimeRange` from endpoints in loose mode, returning `null` when unreadable.
   *
   * @param start - Start moment input
   * @param end - Exclusive end moment or duration length
   * @param options - Options with `loose: true` and optional `zone`, `locale`, `disambiguation`, and `dayFirst`
   * @returns Parsed `DateTimeRange`, or `null` when unreadable
   *
   * @see {@link https://nativedates.dev/plugins/loose/#datetime datetimeRange}
   */
  export function datetimeRange(
    start: DateTimeInput,
    end: DateTimeInput | DurationInput,
    options: Strict,
  ): DateTimeRange;
  export function datetimeRange(interval: string, options: Strict): DateTimeRange;
  export function datetimeRange(
    start: unknown,
    end: unknown,
    options: Loose,
  ): DateTimeRange | null;
  /**
   * Parses a `DateTimeRange` from an interval string in loose mode, returning `null` when unreadable.
   *
   * @param interval - Interval string
   * @param options - Options with `loose: true` and optional `zone`, `locale`, `disambiguation`, and `dayFirst`
   * @returns Parsed `DateTimeRange`, or `null` when unreadable
   *
   * @see {@link https://nativedates.dev/plugins/loose/#datetime datetimeRange}
   */
  export function datetimeRange(interval: string, options: Loose): DateTimeRange | null;

  /**
   * Parses a `TimeRange` from endpoints in loose mode, returning `null` when unreadable.
   *
   * @param start - Start clock time input
   * @param end - Exclusive closing time or clock duration length
   * @param options - Options with `loose: true` and optional `zone`, `locale`, `disambiguation`, and `dayFirst`
   * @returns Parsed `TimeRange`, or `null` when unreadable
   *
   * @see {@link https://nativedates.dev/plugins/loose/#datetime timeRange}
   */
  export function timeRange(start: TimeInput, end: TimeInput | DurationInput, options: Strict): TimeRange;
  export function timeRange(interval: string, options: Strict): TimeRange;
  export function timeRange(start: unknown, end: unknown, options: Loose): TimeRange | null;
  /**
   * Parses a `TimeRange` from an interval string in loose mode, returning `null` when unreadable.
   *
   * @param interval - Interval string
   * @param options - Options with `loose: true` and optional `zone`, `locale`, `disambiguation`, and `dayFirst`
   * @returns Parsed `TimeRange`, or `null` when unreadable
   *
   * @see {@link https://nativedates.dev/plugins/loose/#datetime timeRange}
   */
  export function timeRange(interval: string, options: Loose): TimeRange | null;
}
