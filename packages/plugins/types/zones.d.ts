import type { Zone } from 'native-dates';

/** Base abbreviation table, editable at app boot (`timezones.IST = 'Asia/Jerusalem'`) */
export const timezones: Record<string, string>;

declare module 'native-dates' {
  interface Settings {
    /**
     * Names a zone answers to, on top of cities and abbreviations: `{ hq: 'Europe/Berlin' }`. A `null` target
     * removes that name, and `null` removes them all
     */
    zoneAliases?: Record<string, Zone | null> | null;
  }
}
