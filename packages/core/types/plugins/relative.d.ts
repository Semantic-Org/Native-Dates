import type { CalendarDateInput, DateTimeInput, Locale, Plugin } from '../inputs.js';

export function relativeSeconds(seconds: number, locale?: Locale): string;
export function relativeDays(days: number, locale?: Locale): string;

declare const relative: Plugin;
export default relative;

declare module '../date-time.js' {
  interface DateTime {
    /** `'3 hours ago'`, `'in 2 days'`, `'yesterday'`, measured against now unless told otherwise */
    formatRelative(to?: DateTimeInput, locale?: Locale): string;
  }
}

declare module '../calendar-date.js' {
  interface CalendarDate {
    /** `'yesterday'`, `'in 3 weeks'`, `'last month'`, measured against today unless told otherwise */
    formatRelative(to?: CalendarDateInput, locale?: Locale): string;
  }
}
