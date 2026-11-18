import type { DayOfWeek } from './units.js';
import type { Locale } from './zones.js';

/**
 * Returns a fresh 7-element array of localized weekday labels, rotated to start on `firstDay`,
 * the configured `weekStart`, or the active locale's first day of the week.
 *
 * @param style - Label width: `'short'` (default, `'Mon'`), `'long'` (`'Monday'`), or `'narrow'` (`'Mo'`, `'月'`)
 * @param firstDay - Starting day of the week, overriding `configure()` and the locale
 * @param locale - BCP 47 locale tag overriding the configured default
 * @returns Seven localized weekday labels starting on the resolved first day of the week
 *
 * @example
 * ```ts
 * import { weekdayNames } from 'native-dates';
 *
 * weekdayNames('short', undefined, 'en-US'); // ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
 * weekdayNames('narrow', 'monday', 'en-US'); // ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']
 * ```
 *
 * @see {@link https://nativedates.dev/api/month-names/#weekdaynames weekdayNames}
 */
export function weekdayNames(style?: 'short' | 'long' | 'narrow', firstDay?: DayOfWeek, locale?: Locale): string[];

/**
 * Returns a fresh 12-element array of localized Gregorian month names from January through December.
 *
 * @param style - Label width: `'long'` (default, `'January'`) or `'short'` (`'Jan'`)
 * @param locale - BCP 47 locale tag overriding the configured default
 * @returns Twelve month labels ordered from index `0` (January) through 11 (December)
 *
 * @example
 * ```ts
 * import { monthNames } from 'native-dates';
 *
 * monthNames('short', 'en-US').slice(0, 3); // ['Jan', 'Feb', 'Mar']
 * monthNames('long', 'fr-FR').slice(0, 3); // ['janvier', 'février', 'mars']
 * ```
 *
 * @see {@link https://nativedates.dev/api/month-names/#monthnames monthNames}
 */
export function monthNames(style?: 'short' | 'long', locale?: Locale): string[];

/**
 * Formats a subject's calendar and clock fields against a token pattern.
 * @internal
 */
export function formatTokens(
  subject: Record<string, unknown>,
  kind: string,
  pattern: string,
  locale?: Locale,
): string;
