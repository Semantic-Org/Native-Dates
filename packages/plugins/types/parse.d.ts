import type {
  Disambiguation,
  Locale,
  TemporalPlainDate,
  TemporalPlainMonthDay,
  TemporalPlainTime,
  TemporalPlainYearMonth,
  TemporalZonedDateTime,
  Zone,
} from 'native-dates';

type ParseKind = 'datetime' | 'date' | 'time' | 'yearMonth' | 'monthDay';

/**
 * Parses a string strictly against a token format pattern (`'DDMMYYYY'`, `'DD/MMM/YYYY:HH:mm:ss ZZ'`,
 * `'YYYY-[W]WW-E'`, `'YYYY-DDDD'`) into the underlying Temporal value for `kind`.
 * @internal
 */
export function parseFormatted(
  kind: ParseKind,
  input: unknown,
  options?: {
    format?: string;
    zone?: Zone;
    locale?: Locale;
    disambiguation?: Disambiguation;
  },
): TemporalZonedDateTime | TemporalPlainDate | TemporalPlainTime | TemporalPlainYearMonth | TemporalPlainMonthDay;

declare module 'native-dates' {
  interface ReadOptions {
    /**
     * Strictly parse string input against a token format pattern (such as `'DDMMYYYY'`,
     * `'DD/MMM/YYYY:HH:mm:ss ZZ'`, `'YYYY-[W]WW-E'`, or `'YYYY-DDDD'`) or a named pattern
     * registered in `configure({ formats })`. Passes already-parsed date and time instances
     * through after validating the pattern, while rejecting non-matching text, numbers,
     * impossible calendar dates, and mismatched weekdays.
     *
     * @example
     * ```ts
     * import '@native-dates/plugins/parse';
     * import { date, datetime } from 'native-dates';
     *
     * date('24112026', { format: 'DDMMYYYY' }).toString(); // '2026-11-24'
     * datetime('24/Nov/2026:12:40:01 -0500', {
     *   format: 'DD/MMM/YYYY:HH:mm:ss ZZ',
     *   zone: 'America/New_York',
     * }).toString(); // '2026-11-24T17:40:01.000Z'
     * ```
     *
     * @see {@link https://nativedates.dev/plugins/parse/#factory-options Factory options}
     */
    format?: string;
  }
}
