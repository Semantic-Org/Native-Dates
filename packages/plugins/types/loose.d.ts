import type {
  CalendarDate,
  CalendarDateInput,
  DateRange,
  DateTime,
  DateTimeInput,
  DateTimeRange,
  Duration,
  DurationInput,
  Locale,
  ReadOptions,
  TemporalValue,
  Time,
  TimeInput,
  TimeRange,
  Zone,
} from 'native-dates';

/**
 * Parses an informal date-time string with `Date.parse`, rejecting rolled-forward calendar days.
 * @internal
 */
export function looseZoned(text: string, zone?: Zone, dayFirst?: boolean): TemporalValue | undefined;

declare module 'native-dates' {
  interface ReadOptions {
    /**
     * Fall back to engine `Date` parsing (or localized `Intl` month names on partial dates)
     * and return `null` instead of throwing when input data cannot be read.
     *
     * @default false
     * @see {@link https://nativedates.dev/plugins/loose/#factory-options Factory options}
     */
    loose?: boolean;

    /**
     * Interpret ambiguous numeric dates such as `'07.09.2026'` day-first in loose mode.
     * Defaults to `configure().dayFirst`, or `false` (month-first).
     *
     * @see {@link https://nativedates.dev/plugins/loose/#day-first-numeric-dates Day-first numeric dates}
     */
    dayFirst?: boolean;
  }

  interface Settings {
    /**
     * Default numeric date order for loose calls that do not specify `dayFirst` explicitly.
     * When `true`, `'07.09.2026'` reads as September 7 rather than July 9.
     *
     * @default false
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
    dayFirst?: boolean;
  }

  /**
   * Parses untrusted or informal timestamp input in loose mode, returning `null` instead of throwing
   * when `input` cannot be read or rolls over an impossible day like February 30.
   *
   * @param input - Untrusted string, timestamp, or unknown value
   * @param options - Options with `loose: true` and optional `zone`, `locale`, and `dayFirst`
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
  export function datetime(input: unknown, options: ReadOptions & { loose: true; }): DateTime | null;

  /**
   * Parses untrusted or informal date input in loose mode, returning `null` instead of throwing
   * when `input` cannot be read or represents an impossible date like February 30.
   *
   * @param input - Untrusted string, date, or unknown value
   * @param options - Options with `loose: true` and optional `zone`, `locale`, and `dayFirst`
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
  export function date(input: unknown, options: ReadOptions & { loose: true; }): CalendarDate | null;

  /**
   * Parses untrusted or informal time input in loose mode, returning `null` instead of throwing
   * when `input` cannot be read.
   *
   * @param input - Untrusted string, time, or unknown value
   * @param options - Options with `loose: true` and optional `zone`, `locale`, and `dayFirst`
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
  export function time(input: unknown, options: ReadOptions & { loose: true; }): Time | null;

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
  export function duration(input: unknown, options: { loose: true; locale?: Locale; }): Duration | null;

  type Loose = ReadOptions & { loose: true; };

  /**
   * Parses a `DateRange` from endpoints in loose mode, returning `null` if either endpoint is unreadable
   * or if the end date precedes the start date.
   *
   * @param start - Start calendar date input
   * @param end - Inclusive end date or calendar duration length
   * @param options - Options with `loose: true` and optional `zone`, `locale`, and `dayFirst`
   * @returns Parsed `DateRange`, or `null` when unreadable
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
    start: CalendarDateInput,
    end: CalendarDateInput | DurationInput,
    options: Loose,
  ): DateRange | null;
  /**
   * Parses a `DateRange` from an interval string in loose mode, returning `null` when unreadable.
   *
   * @param interval - Interval string such as `'Sep 1, 2026 to Sep 7, 2026'`
   * @param options - Options with `loose: true` and optional `zone`, `locale`, and `dayFirst`
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
   * @param options - Options with `loose: true` and optional `zone`, `locale`, and `dayFirst`
   * @returns Parsed `DateTimeRange`, or `null` when unreadable
   *
   * @see {@link https://nativedates.dev/plugins/loose/#datetime datetimeRange}
   */
  export function datetimeRange(
    start: DateTimeInput,
    end: DateTimeInput | DurationInput,
    options: Loose,
  ): DateTimeRange | null;
  /**
   * Parses a `DateTimeRange` from an interval string in loose mode, returning `null` when unreadable.
   *
   * @param interval - Interval string
   * @param options - Options with `loose: true` and optional `zone`, `locale`, and `dayFirst`
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
   * @param options - Options with `loose: true` and optional `zone`, `locale`, and `dayFirst`
   * @returns Parsed `TimeRange`, or `null` when unreadable
   *
   * @see {@link https://nativedates.dev/plugins/loose/#datetime timeRange}
   */
  export function timeRange(start: TimeInput, end: TimeInput | DurationInput, options: Loose): TimeRange | null;
  /**
   * Parses a `TimeRange` from an interval string in loose mode, returning `null` when unreadable.
   *
   * @param interval - Interval string
   * @param options - Options with `loose: true` and optional `zone`, `locale`, and `dayFirst`
   * @returns Parsed `TimeRange`, or `null` when unreadable
   *
   * @see {@link https://nativedates.dev/plugins/loose/#datetime timeRange}
   */
  export function timeRange(interval: string, options: Loose): TimeRange | null;
}
