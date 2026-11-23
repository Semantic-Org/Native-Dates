/**
 * Structural shape of a `Temporal.ZonedDateTime` when `ESNext.Temporal` ambient types are not loaded.
 *
 * @see {@link https://nativedates.dev/guides/temporal/ Working with Temporal}
 */
export interface TemporalZonedDateTimeLike {
  readonly [Symbol.toStringTag]: 'Temporal.ZonedDateTime';
  readonly epochNanoseconds: bigint;
  readonly epochMilliseconds: number;
  readonly timeZoneId: string;
  readonly calendarId: string;
  readonly year: number;
  readonly month: number;
  readonly day: number;
  readonly hour: number;
  readonly minute: number;
  readonly second: number;
  readonly millisecond: number;
  readonly microsecond: number;
  readonly nanosecond: number;
  readonly offset: string;
  equals(other: unknown): boolean;
  toString(options?: object): string;
}

/**
 * Structural shape of a `Temporal.Instant` when `ESNext.Temporal` ambient types are not loaded.
 */
export interface TemporalInstantLike {
  readonly [Symbol.toStringTag]: 'Temporal.Instant';
  readonly epochNanoseconds: bigint;
  readonly epochMilliseconds: number;
  equals(other: unknown): boolean;
  toString(options?: object): string;
}

/**
 * Structural shape of a `Temporal.PlainDateTime` when `ESNext.Temporal` ambient types are not loaded.
 */
export interface TemporalPlainDateTimeLike {
  readonly [Symbol.toStringTag]: 'Temporal.PlainDateTime';
  readonly calendarId: string;
  readonly year: number;
  readonly month: number;
  readonly day: number;
  readonly hour: number;
  readonly minute: number;
  readonly second: number;
  readonly millisecond: number;
  readonly microsecond: number;
  readonly nanosecond: number;
  equals(other: unknown): boolean;
  toString(options?: object): string;
}

/**
 * Structural shape of a `Temporal.PlainDate` when `ESNext.Temporal` ambient types are not loaded.
 */
export interface TemporalPlainDateLike {
  readonly [Symbol.toStringTag]: 'Temporal.PlainDate';
  readonly calendarId: string;
  readonly year: number;
  readonly month: number;
  readonly day: number;
  readonly dayOfWeek: number;
  readonly dayOfYear: number;
  readonly daysInMonth: number;
  readonly daysInYear: number;
  readonly inLeapYear: boolean;
  equals(other: unknown): boolean;
  toString(options?: object): string;
}

/**
 * Structural shape of a `Temporal.PlainTime` when `ESNext.Temporal` ambient types are not loaded.
 */
export interface TemporalPlainTimeLike {
  readonly [Symbol.toStringTag]: 'Temporal.PlainTime';
  readonly hour: number;
  readonly minute: number;
  readonly second: number;
  readonly millisecond: number;
  readonly microsecond: number;
  readonly nanosecond: number;
  equals(other: unknown): boolean;
  toString(options?: object): string;
}

/**
 * Structural shape of a `Temporal.PlainYearMonth` when `ESNext.Temporal` ambient types are not loaded.
 */
export interface TemporalPlainYearMonthLike {
  readonly [Symbol.toStringTag]: 'Temporal.PlainYearMonth';
  readonly calendarId: string;
  readonly year: number;
  readonly month: number;
  readonly daysInMonth: number;
  readonly daysInYear: number;
  readonly inLeapYear: boolean;
  equals(other: unknown): boolean;
  toString(options?: object): string;
}

/**
 * Structural shape of a `Temporal.PlainMonthDay` when `ESNext.Temporal` ambient types are not loaded.
 */
export interface TemporalPlainMonthDayLike {
  readonly [Symbol.toStringTag]: 'Temporal.PlainMonthDay';
  readonly calendarId: string;
  readonly monthCode: string;
  readonly day: number;
  equals(other: unknown): boolean;
  toString(options?: object): string;
}

/**
 * Structural shape of a `Temporal.Duration` when `ESNext.Temporal` ambient types are not loaded.
 */
export interface TemporalDurationLike {
  readonly [Symbol.toStringTag]: 'Temporal.Duration';
  readonly years: number;
  readonly months: number;
  readonly weeks: number;
  readonly days: number;
  readonly hours: number;
  readonly minutes: number;
  readonly seconds: number;
  readonly milliseconds: number;
  readonly microseconds: number;
  readonly nanoseconds: number;
  readonly sign: -1 | 0 | 1;
  readonly blank: boolean;
  toString(options?: object): string;
}

type TemporalOf<K extends string, Fallback> = typeof globalThis extends {
  Temporal: Record<K, { prototype: infer Instance; }>;
} ? Instance
  : Fallback;

/** Native `Temporal.ZonedDateTime` when loaded in `lib`, or its structural shape otherwise. */
export type TemporalZonedDateTime = TemporalOf<'ZonedDateTime', TemporalZonedDateTimeLike>;
/** Native `Temporal.Instant` when loaded in `lib`, or its structural shape otherwise. */
export type TemporalInstant = TemporalOf<'Instant', TemporalInstantLike>;
/** Native `Temporal.PlainDateTime` when loaded in `lib`, or its structural shape otherwise. */
export type TemporalPlainDateTime = TemporalOf<'PlainDateTime', TemporalPlainDateTimeLike>;
/** Native `Temporal.PlainDate` when loaded in `lib`, or its structural shape otherwise. */
export type TemporalPlainDate = TemporalOf<'PlainDate', TemporalPlainDateLike>;
/** Native `Temporal.PlainTime` when loaded in `lib`, or its structural shape otherwise. */
export type TemporalPlainTime = TemporalOf<'PlainTime', TemporalPlainTimeLike>;
/** Native `Temporal.PlainYearMonth` when loaded in `lib`, or its structural shape otherwise. */
export type TemporalPlainYearMonth = TemporalOf<'PlainYearMonth', TemporalPlainYearMonthLike>;
/** Native `Temporal.PlainMonthDay` when loaded in `lib`, or its structural shape otherwise. */
export type TemporalPlainMonthDay = TemporalOf<'PlainMonthDay', TemporalPlainMonthDayLike>;
/** Native `Temporal.Duration` when loaded in `lib`, or its structural shape otherwise. */
export type TemporalDuration = TemporalOf<'Duration', TemporalDurationLike>;

/**
 * Underlying `Temporal` object returned by `toTemporal()` or accepted by factories.
 * Resolves to native `Temporal.*` classes when `ESNext.Temporal` is in `lib`, and to strict structural
 * interfaces otherwise without widening inputs to `any`.
 *
 * @see {@link https://nativedates.dev/guides/temporal/ Working with Temporal}
 */
export type TemporalValue =
  | TemporalZonedDateTime
  | TemporalInstant
  | TemporalPlainDateTime
  | TemporalPlainDate
  | TemporalPlainTime
  | TemporalPlainYearMonth
  | TemporalPlainMonthDay
  | TemporalDuration;

/**
 * Year, quarter, or month unit name accepted by `YearMonth` arithmetic.
 *
 * @see {@link https://nativedates.dev/api/year-month/ YearMonth}
 */
export type YearMonthUnit =
  | 'year'
  | 'years'
  | 'y'
  | 'yr'
  | 'yrs'
  | 'quarter'
  | 'quarters'
  | 'q'
  | 'Q'
  | 'qtr'
  | 'month'
  | 'months'
  | 'M'
  | 'mo'
  | 'mos';

/**
 * Calendar field name (`'year'`, `'month'`, or `'day'`) accepted by `CalendarDate.prototype.set()`.
 */
export type CalendarFieldUnit =
  | 'year'
  | 'years'
  | 'y'
  | 'yr'
  | 'yrs'
  | 'month'
  | 'months'
  | 'M'
  | 'mo'
  | 'mos'
  | 'day'
  | 'days'
  | 'd';

/**
 * Calendar unit name from `'year'` down to `'day'` in singular, plural, or shorthand form.
 *
 * @see {@link https://nativedates.dev/api/calendar-date/ CalendarDate}
 */
export type DateUnit = YearMonthUnit | 'week' | 'weeks' | 'w' | 'wk' | 'wks' | 'day' | 'days' | 'd';

/**
 * Clock unit name from `'hour'` down to `'nanosecond'` in singular, plural, or shorthand form.
 *
 * @see {@link https://nativedates.dev/api/time/ Time}
 */
export type TimeUnit =
  | 'hour'
  | 'hours'
  | 'h'
  | 'hr'
  | 'hrs'
  | 'minute'
  | 'minutes'
  | 'm'
  | 'min'
  | 'mins'
  | 'second'
  | 'seconds'
  | 's'
  | 'sec'
  | 'secs'
  | 'millisecond'
  | 'milliseconds'
  | 'ms'
  | 'msec'
  | 'msecs'
  | 'microsecond'
  | 'microseconds'
  | 'us'
  | 'µs'
  | 'nanosecond'
  | 'nanoseconds'
  | 'ns';

/**
 * Calendar or clock field name accepted by `DateTime.prototype.set()`.
 */
export type DateTimeFieldUnit = CalendarFieldUnit | TimeUnit;

/**
 * Unit name from `'day'` down to `'nanosecond'` accepted by `DateTime` rounding methods.
 */
export type RoundUnit = 'day' | 'days' | 'd' | TimeUnit;

/**
 * Calendar or clock unit name in singular, plural, or common shorthand form,
 * such as `'days'`, `'hour'`, or `'min'`.
 *
 * @see {@link https://nativedates.dev/guides/date-math/ Date math}
 */
export type Unit = DateUnit | TimeUnit;

type WeekdayName =
  | 'mon'
  | 'mond'
  | 'monda'
  | 'monday'
  | 'tue'
  | 'tues'
  | 'tuesd'
  | 'tuesda'
  | 'tuesday'
  | 'wed'
  | 'wedn'
  | 'wedne'
  | 'wednes'
  | 'wednesd'
  | 'wednesda'
  | 'wednesday'
  | 'thu'
  | 'thur'
  | 'thurs'
  | 'thursd'
  | 'thursda'
  | 'thursday'
  | 'fri'
  | 'frid'
  | 'frida'
  | 'friday'
  | 'sat'
  | 'satu'
  | 'satur'
  | 'saturd'
  | 'saturda'
  | 'saturday'
  | 'sun'
  | 'sund'
  | 'sunda'
  | 'sunday';

/**
 * Day of the week as a full name or three-letter prefix such as `'monday'` or `'Fri'`,
 * or an ISO number from 1 for Monday through 7 for Sunday (`0` is also accepted as grace
 * for `Date.prototype.getDay()` callers, not as preferred input).
 *
 * @see {@link https://nativedates.dev/api/configure/#dayofweek dayOfWeek}
 */
export type DayOfWeek =
  | WeekdayName
  | Capitalize<WeekdayName>
  | Uppercase<WeekdayName>
  | 0
  | 1
  | 2
  | 3
  | 4
  | 5
  | 6
  | 7;

/**
 * Converts a weekday name, three-letter prefix, or ISO number into an integer
 * from 1 for Monday through 7 for Sunday. Throws a `RangeError` for unrecognized inputs.
 *
 * @param day - Weekday name such as `'monday'`, prefix such as `'Fri'`, or integer from 1 to 7
 * @returns ISO day of the week from 1 for Monday through 7 for Sunday
 *
 * @example
 * ```ts
 * import { dayOfWeek } from 'native-dates';
 *
 * dayOfWeek('monday'); // 1
 * dayOfWeek('Fri'); // 5
 * dayOfWeek('sunday'); // 7
 * dayOfWeek(3); // 3
 * ```
 *
 * @see {@link https://nativedates.dev/api/configure/#dayofweek dayOfWeek}
 */
export function dayOfWeek(day: DayOfWeek): number;
