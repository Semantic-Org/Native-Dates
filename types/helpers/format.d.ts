/**
 * Format specification accepted by `format()` across dates, moments, times, partial dates, and ranges.
 *
 * Accepts built-in and localized preset names, custom format names from `configure()`,
 * `Intl.DateTimeFormatOptions` objects, or token patterns like `'YYYY-MM-DD HH:mm'`.
 * Wrap literal words inside token patterns in square brackets.
 *
 * @example
 * ```ts
 * import { datetime } from 'native-dates';
 *
 * const standup = datetime('2026-11-16T09:30', 'America/Los_Angeles');
 * standup.format('medium', 'en-US'); // 'Nov 16, 2026, 9:30 AM'
 * standup.format('MMM D [at] h:mm a', 'en-US'); // 'Nov 16 at 9:30 am'
 * standup.format({ weekday: 'short', hour: '2-digit', minute: '2-digit' }, 'de-DE'); // 'Mo., 09:30'
 * ```
 *
 * @see {@link https://nativedates.dev/guides/formatting/ Formatting}
 */
export type FormatSpec =
  | 'short'
  | 'medium'
  | 'long'
  | 'full'
  | 'month'
  | 'date'
  | 'time'
  | 'text'
  | 'LT'
  | 'LTS'
  | 'L'
  | 'l'
  | 'LL'
  | 'll'
  | 'LLL'
  | 'lll'
  | 'LLLL'
  | 'llll'
  | Intl.DateTimeFormatOptions
  | (string & {});
