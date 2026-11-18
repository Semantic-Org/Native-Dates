import type { DayOfWeek, Locale } from './index.js';

/**
 * The weekday names in the locale, starting on the locale's first day or on `firstDay`. `'narrow'` is the
 * shortest form, what the `dd` token prints: `Mo` in English, `月` in Japanese
 */
export function weekdayNames(style?: 'short' | 'long' | 'narrow', firstDay?: DayOfWeek, locale?: Locale): string[];
/** The twelve month names in the locale */
export function monthNames(style?: 'short' | 'long', locale?: Locale): string[];
export function formatTokens(
  subject: Record<string, unknown>,
  kind: string,
  pattern: string,
  locale?: Locale,
): string;
