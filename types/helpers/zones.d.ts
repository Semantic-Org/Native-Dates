import type { DayOfWeek } from './units.js';

/**
 * An IANA zone (`'America/New_York'`), a fixed offset (`'+05:30'`), or `'UTC'`. With `@native-dates/plugins/zones`,
 * also cities (`'Berlin'`, `'los angeles'`), abbreviations (`'PT'`, `'CET'`), and `zoneAliases`
 */
export type Zone = string;

/** The options form of a factory's second argument */
export interface ReadOptions {
  /** The zone to read the value in (default: the configured zone, else the machine's) */
  zone?: Zone;
  /** The locale the value is written in (default: the configured locale, else the runtime's) */
  locale?: Locale;
}

/** A BCP 47 locale tag, overriding the configured locale for one call */
export type Locale = string;

export interface Settings {
  /** The default zone every factory reads in. Null resets to the machine's zone */
  zone?: Zone | null;
  /** The default locale for formatting. Null resets to the runtime's */
  locale?: Locale | null;
  /**
   * The first day of the week for `startOf('week')`, `range('week')` and `weekdayNames()`. Unset, it is the
   * locale's own: sunday in the United States, monday in most of Europe. Null goes back to following the locale
   */
  weekStart?: DayOfWeek | null;
  /**
   * Weekday names written your own way, by language, then width, then day: `{ lv: { narrow: { fri: 'Pk', sun: 'Sv' } } }`.
   * `narrow` is what the `dd` token prints, `short` is `ddd`, `long` is `dddd`, and `weekdayNames()` follows. A regional
   * tag reads its language's names with its own laid over them. Null goes back to the runtime's names
   */
  weekdayNames?: Record<Locale, Partial<Record<'narrow' | 'short' | 'long', Record<string, string>>>> | null;
  /**
   * What the `Do` token writes for a day of the month, by language: `{ fr: (day) => (day === 1 ? '1er' : day) }`.
   * Null goes back to the built-in English suffixes and the mark the runtime writes after a day
   */
  ordinals?: Record<Locale, (day: number) => string | number> | null;
  /**
   * Formats an app names once and asks for everywhere: `{ invoice: 'YYYY-MM-DD', receipt: { dateStyle: 'long' } }`,
   * then `value.format('invoice')`. Each is a token pattern or an `Intl.DateTimeFormat` options bag, and prints
   * on a datetime, a date, a time, a month-day, a year-month and a range. A name is asked before the built-in
   * presets, so an app can give `'short'` its own meaning. Null takes them all away
   */
  formats?: Record<string, string | Intl.DateTimeFormatOptions> | null;
}

/** Sets package-wide defaults once at app boot. Returns the settings in effect */
export function configure(settings?: Settings): {
  zone: string | undefined;
  locale: string | undefined;
  weekStart: number | undefined;
  dayFirst: boolean;
  zoneAliases: Record<string, string>;
  weekdayNames?: Settings['weekdayNames'];
  ordinals?: Settings['ordinals'];
  formats?: Settings['formats'];
};
