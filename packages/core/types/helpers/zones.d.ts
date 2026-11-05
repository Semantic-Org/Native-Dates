import type { Locale, Plugin, Weekday, Zone } from '../inputs.js';

export interface Settings {
  /** Plugins to install before applying settings */
  plugins?: (Plugin<any> | { default: Plugin<any>; })[];
  /** The default zone every factory reads in. Null resets to the machine's zone */
  zone?: Zone | null;
  /** The default locale for formatting. Null resets to the runtime's */
  locale?: Locale | null;
  /** The first day of the week for `startOf('week')` (default: monday) */
  weekStart?: Weekday;
}

/** Sets package-wide defaults once at app boot. Returns the settings in effect */
export function configure(settings?: Settings): {
  zone: string | undefined;
  locale: string | undefined;
  weekStart: number;
  dayFirst: boolean;
  zoneAliases: Record<string, string>;
};
