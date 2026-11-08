import type { CalendarDate } from '../calendar-date.js';
import type { DateTime } from '../date-time.js';
import type { Duration } from '../duration.js';
import type { ReadOptions, TemporalValue, Zone } from '../inputs.js';
import type { Time } from '../time.js';

export function looseZoned(text: string, zone?: Zone, dayFirst?: boolean): TemporalValue | undefined;

declare module '../inputs.js' {
  interface ReadOptions {
    /** Read whatever this engine's `Date` reads, and return null instead of throwing for unreadable input */
    loose?: boolean;
    /** Read a numeric date like `07.09.2026` day first (default: configured `dayFirst`, else month first) */
    dayFirst?: boolean;
  }
}

declare module '../helpers/zones.js' {
  interface Settings {
    /** Read a loose numeric date day first, `07.09.2026` as the 7th of September */
    dayFirst?: boolean;
  }
}

declare module '../date-time.js' {
  export function datetime(input: unknown, options: ReadOptions & { loose: true; }): DateTime | null;
}

declare module '../calendar-date.js' {
  export function date(input: unknown, options: ReadOptions & { loose: true; }): CalendarDate | null;
}

declare module '../time.js' {
  export function time(input: unknown, options: ReadOptions & { loose: true; }): Time | null;
}

declare module '../duration.js' {
  export function duration(input: unknown, options: { loose: true; }): Duration | null;
}
