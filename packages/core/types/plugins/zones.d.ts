import type { Plugin, Zone } from '../inputs.js';

/** Base abbreviation table, editable at app boot (`timezones.IST = 'Asia/Jerusalem'`) */
export const timezones: Record<string, string>;

export interface ZonesOptions {
  aliases?: Record<string, Zone>;
  zoneAliases?: Record<string, Zone>;
}

declare const zones: Plugin & ((options?: ZonesOptions | Record<string, Zone>) => Plugin);
export default zones;

declare module '../helpers/zones.js' {
  interface Settings {
    /** Names a zone answers to, on top of cities and abbreviations: `{ hq: 'Europe/Berlin' }` */
    zoneAliases?: Record<string, Zone>;
  }
}
