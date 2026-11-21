import type { Zone } from 'native-dates';

/**
 * Mutable base abbreviation lookup table mapping common time zone abbreviations such as `'PT'`
 * and `'CET'` to daylight-observing IANA zone identifiers.
 *
 * Abbreviations that differ by country, like `'IST'` and `'CST'`, are not listed here. They follow the
 * active locale (`'CST'` is `'Asia/Shanghai'` in `'zh-CN'` and `'America/Chicago'` in `'en-US'`), and an
 * entry added at application startup (`timezones.IST = 'Asia/Jerusalem'`) fixes one reading for every
 * locale. Full IANA names always pass through unchanged.
 *
 * @example
 * ```ts
 * import { timezones } from '@native-dates/plugins/zones';
 *
 * timezones.JST; // 'Asia/Tokyo'
 * timezones.IST = 'Asia/Jerusalem';
 * ```
 *
 * @see {@link https://nativedates.dev/plugins/zones/#common-abbreviations Common abbreviations}
 */
export const timezones: Record<string, string>;

declare module 'native-dates' {
  interface Settings {
    /**
     * Custom shorthand names mapped to time zones on top of city names and abbreviations.
     * Alias keys match without case or accent sensitivity, a `null` target removes that alias,
     * and passing `zoneAliases: null` clears all custom aliases.
     *
     * @example
     * ```ts
     * import '@native-dates/plugins/zones';
     * import { configure, datetime } from 'native-dates';
     *
     * configure({ zoneAliases: { hq: 'Europe/Berlin' } });
     * datetime('2026-11-16T09:30Z', 'hq').zone; // 'Europe/Berlin'
     * ```
     *
     * @see {@link https://nativedates.dev/plugins/zones/#configure configure}
     */
    zoneAliases?: Record<string, Zone | null> | null;
  }
}
