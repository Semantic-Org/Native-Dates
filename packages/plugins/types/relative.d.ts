import type { CalendarDateInput, DateTimeInput, Locale } from 'native-dates';

export function relativeSeconds(seconds: number, locale?: Locale): string;
export function relativeDays(days: number, locale?: Locale): string;

declare module 'native-dates' {
  interface DateTime {
    /** `'3 hours ago'`, `'in 2 days'`, `'yesterday'`, measured against now unless told otherwise */
    formatRelative(to?: DateTimeInput, locale?: Locale): string;
  }

  interface CalendarDate {
    /** `'yesterday'`, `'in 3 weeks'`, `'last month'`, measured against today unless told otherwise */
    formatRelative(to?: CalendarDateInput, locale?: Locale): string;
  }
}
