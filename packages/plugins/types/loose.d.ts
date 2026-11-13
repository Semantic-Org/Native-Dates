import type {
  CalendarDate,
  CalendarDateInput,
  DateRange,
  DateTime,
  DateTimeInput,
  DateTimeRange,
  Duration,
  DurationInput,
  ReadOptions,
  TemporalValue,
  Time,
  TimeInput,
  TimeRange,
  Zone,
} from 'native-dates';

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

  type Loose = ReadOptions & { loose: true; };

  export function dateRange(
    start: CalendarDateInput,
    end: CalendarDateInput | DurationInput,
    options: Loose,
  ): DateRange | null;
  export function dateRange(interval: string, options: Loose): DateRange | null;
  export function datetimeRange(
    start: DateTimeInput,
    end: DateTimeInput | DurationInput,
    options: Loose,
  ): DateTimeRange | null;
  export function datetimeRange(interval: string, options: Loose): DateTimeRange | null;
  export function timeRange(start: TimeInput, end: TimeInput | DurationInput, options: Loose): TimeRange | null;
  export function timeRange(interval: string, options: Loose): TimeRange | null;
}
