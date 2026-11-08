import type { Zone } from '../inputs.js';

/** Base abbreviation table, editable at app boot (`timezones.IST = 'Asia/Jerusalem'`) */
export const timezones: Record<string, string>;

declare module '../helpers/zones.js' {
  interface Settings {
    /** Names a zone answers to, on top of cities and abbreviations: `{ hq: 'Europe/Berlin' }` */
    zoneAliases?: Record<string, Zone>;
  }
}
