import type { CalendarDate, DateTime, Duration, ReadOptions, TemporalValue, Time, Zone } from 'native-dates';

export function looseZoned(text: string, zone?: Zone, dayFirst?: boolean): TemporalValue | undefined;

declare module 'native-dates' {
  interface ReadOptions {
    /** Read whatever this engine's `Date` reads, and return null instead of throwing for unreadable input */
    loose?: boolean;
    /** Read a numeric date like `07.09.2026` day first (default: configured `dayFirst`, else month first) */
    dayFirst?: boolean;
  }

  interface Settings {
    /** Read a loose numeric date day first, `07.09.2026` as the 7th of September */
    dayFirst?: boolean;
  }

  export function datetime(input: unknown, options: ReadOptions & { loose: true; }): DateTime | null;
  export function date(input: unknown, options: ReadOptions & { loose: true; }): CalendarDate | null;
  export function time(input: unknown, options: ReadOptions & { loose: true; }): Time | null;
  export function duration(input: unknown, options: { loose: true; }): Duration | null;
}
