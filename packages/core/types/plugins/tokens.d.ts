import type { Locale, Weekday } from '../inputs.js';

/** The weekday names in the locale, starting on the configured first day or on `firstDay` */
export function weekdayNames(style?: 'short' | 'long', firstDay?: Weekday, locale?: Locale): string[];
/** The twelve month names in the locale */
export function monthNames(style?: 'short' | 'long', locale?: Locale): string[];
export function formatTokens(
  subject: Record<string, unknown>,
  kind: 'datetime' | 'date' | 'time',
  pattern: string,
  locale?: Locale,
): string;
