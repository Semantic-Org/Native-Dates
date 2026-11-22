import type { DayOfWeek } from './units.js';

/**
 * Time zone identifier: an IANA zone name such as `'America/New_York'`, a fixed UTC offset
 * such as `'+05:30'`, or `'UTC'`.
 *
 * When `@native-dates/plugins/zones` is imported, also accepts city names, common abbreviations,
 * and custom `zoneAliases`.
 *
 * @see {@link https://nativedates.dev/guides/time-zones/ Time zones}
 */
export type Zone = string;

/**
 * BCP 47 locale tag such as `'en-US'` or `'de-DE'`, underscore tag, `Accept-Language` header,
 * or list of tags in order of preference such as `navigator.languages`.
 *
 * @see {@link https://nativedates.dev/guides/localization/ Localization}
 */
export type Locale = string | readonly string[];

/**
 * Options accepted as the second argument when reading values in factory functions.
 *
 * @see {@link https://nativedates.dev/guides/parsing/ Parsing}
 */
export interface ReadOptions {
  /**
   * Time zone used to view instants or interpret local date and time inputs.
   * Defaults to the configured `zone`, or the runtime's local time zone.
   */
  zone?: Zone;

  /**
   * BCP 47 locale tag carried on the returned value and every value derived from it.
   * Defaults to the configured `locale`, or the runtime's default locale.
   */
  locale?: Locale;
}

/**
 * Process-wide default settings accepted by `configure()`.
 * Omitted keys stay unchanged, and passing `null` for a key restores its built-in default.
 *
 * @see {@link https://nativedates.dev/api/configure/#configure configure}
 */
export interface Settings {
  /**
   * Default time zone used by factories and `now()` when no explicit zone is passed.
   * Pass `null` to reset to the runtime's local time zone.
   */
  zone?: Zone | null;

  /**
   * Default locale for formatting and week boundaries when a value carries no locale of its own.
   * Pass `null` or `''` to reset to the runtime's default locale.
   */
  locale?: Locale | null;

  /**
   * First day of the week for week boundaries and `weekdayNames()`.
   * When unset or `null`, follows the active locale (Sunday in the US, Monday in most of Europe).
   */
  weekStart?: DayOfWeek | null;

  /**
   * Custom weekday labels keyed by language tag, width (narrow, short, or long), and three-letter day name.
   * Regional tags inherit from their base language, and `null` restores runtime labels.
   *
   * @example
   * ```ts
   * configure({
   *   weekdayNames: { lv: { narrow: { fri: 'Pk', sun: 'Sv' } } },
   * });
   * ```
   */
  weekdayNames?: Record<string, Partial<Record<'narrow' | 'short' | 'long', Record<string, string>>>> | null;

  /**
   * Custom formatter for the `Do` day-of-month token, keyed by language tag.
   * Pass `null` to restore built-in English suffixes and locale day markers.
   *
   * @example
   * ```ts
   * configure({
   *   ordinals: { fr: (day) => (day === 1 ? '1er' : day) },
   * });
   * ```
   */
  ordinals?: Record<string, (day: number) => string | number> | null;

  /**
   * Named formats reusable across `format(name)` calls on dates, moments, times, partial dates, and ranges.
   * Checked before built-in presets so an app can customize names like `'short'`. Pass `null` to clear all custom formats.
   *
   * @example
   * ```ts
   * configure({
   *   formats: {
   *     invoice: 'YYYY-MM-DD',
   *     receipt: { dateStyle: 'long' },
   *   },
   * });
   * ```
   */
  formats?: Record<string, string | Intl.DateTimeFormatOptions> | null;
}

/**
 * Snapshot of the active process-wide configuration returned by `configure()`.
 *
 * @see {@link https://nativedates.dev/api/configure/#configure configure}
 */
export interface ActiveSettings {
  /** Active default IANA time zone or offset, or `undefined` when using the runtime's local zone. */
  zone: string | undefined;
  /** Active default locale, a tag or a list of tags, or `undefined` when using the runtime's default locale. */
  locale: Locale | undefined;
  /** Active ISO week-start number (1–7), or `undefined` when following the locale. */
  weekStart: number | undefined;
  /** Whether loose numeric dates default to day-first order (`false` unless set with `@native-dates/plugins/loose`). */
  dayFirst: boolean;
  /** Active custom zone alias map registered via `@native-dates/plugins/zones`. */
  zoneAliases: Record<string, string>;
  /** Custom weekday label overrides, if configured. */
  weekdayNames?: Settings['weekdayNames'];
  /** Custom `Do` ordinal formatters by language, if configured. */
  ordinals?: Settings['ordinals'];
  /** Custom named format definitions, if configured. */
  formats?: Settings['formats'];
}

/**
 * Updates one or more process-wide defaults and returns a snapshot of the active settings.
 * Call with no arguments to inspect the current configuration without changing it.
 *
 * Set global defaults once at application startup. On servers handling multiple users,
 * attach each user's time zone and `.locale()` to individual values inside request handlers.
 *
 * @param settings - Process-wide defaults to update, leaving omitted keys unchanged
 * @returns A shallow copy of the active settings after applying any updates
 * @throws {RangeError} When an unrecognized setting key (`unknownSetting`), time zone (`unknownZone`), locale (`unknownLocale`), weekday (`unknownDayOfWeek`), width (`unknownWidth`), or unimported plugin option (`missingPlugin`) is passed
 *
 * @example
 * ```ts
 * import { configure } from 'native-dates';
 *
 * configure({
 *   zone: 'Europe/Berlin',
 *   locale: 'de-DE',
 *   formats: { invoice: 'YYYY-MM-DD' },
 * });
 *
 * configure().zone; // 'Europe/Berlin'
 * configure({ zone: null, locale: null, formats: null });
 * ```
 *
 * @see {@link https://nativedates.dev/api/configure/#configure configure}
 */
export function configure(settings?: Settings): ActiveSettings;
