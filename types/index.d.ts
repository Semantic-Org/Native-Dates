/**
 * A Temporal value. Temporal's own declarations ship with newer TypeScript libs and with the polyfills,
 * so the values this library hands back from `toTemporal()` are typed loosely until they are everywhere
 */
export type TemporalValue = any;

/** A unit name, singular or plural, or an abbreviation like `h`, `min`, `d`, `mo` */
export type Unit =
  | 'year'
  | 'years'
  | 'quarter'
  | 'quarters'
  | 'month'
  | 'months'
  | 'week'
  | 'weeks'
  | 'day'
  | 'days'
  | 'hour'
  | 'hours'
  | 'minute'
  | 'minutes'
  | 'second'
  | 'seconds'
  | 'millisecond'
  | 'milliseconds'
  | 'microsecond'
  | 'microseconds'
  | 'nanosecond'
  | 'nanoseconds'
  | (string & {});

/** A unit a calendar date can start, end or step by */
export type DateUnit = 'year' | 'quarter' | 'month' | 'week' | 'day' | (string & {});

/** A weekday by name (`'monday'`, `'Fri'`) or ISO number, 1 for monday through 7 for sunday */
export type Weekday =
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'
  | 'sunday'
  | 1
  | 2
  | 3
  | 4
  | 5
  | 6
  | 7
  | (string & {});

/**
 * An IANA zone (`'America/New_York'`), a fixed offset (`'+05:30'`), or `'UTC'`. With `@native-dates/plugins/zones`,
 * also cities (`'Berlin'`, `'los angeles'`), abbreviations (`'PT'`, `'CET'`), and `zoneAliases`
 */
export type Zone = string;

/** The options form of a factory's second argument */
export interface ReadOptions {
  /** The zone to read the value in (default: the configured zone, else the machine's) */
  zone?: Zone;
}

/** Duration fields, plural, as Temporal spells them */
export interface DurationFields {
  years?: number;
  months?: number;
  weeks?: number;
  days?: number;
  hours?: number;
  minutes?: number;
  seconds?: number;
  milliseconds?: number;
  microseconds?: number;
  nanoseconds?: number;
}

/**
 * Anything that reads as a duration: a `Duration`, a `Temporal.Duration`, a fields object, a phrase like
 * `'1h 30m'` or `'2 weeks and 3 days'`, an ISO string like `'PT1H30M'`, or a number of milliseconds
 */
export type DurationInput = Duration | DurationFields | string | number | TemporalValue;

/** Calendar fields for a datetime or date, singular, as Temporal's `with()` spells them */
export interface DateTimeFields {
  year?: number;
  month?: number;
  day?: number;
  hour?: number;
  minute?: number;
  second?: number;
  millisecond?: number;
  microsecond?: number;
  nanosecond?: number;
}

/**
 * Anything that reads as a datetime: an ISO string, a `Date`, epoch milliseconds, a fields object, a
 * `DateTime`, a `CalendarDate` (its midnight in the zone), or a Temporal value
 */
export type DateTimeInput = DateTime | CalendarDate | Date | number | string | DateTimeFields | TemporalValue;

/** Anything that reads as a calendar date: `'2026-09-06'`, a fields object, a `DateTime`, a `Date`, or a Temporal value */
export type CalendarDateInput = CalendarDate | DateTime | Date | string | DateTimeFields | TemporalValue;

/** Anything that reads as a time of day: `'09:00'`, `'5:30pm'`, a fields object, a `DateTime`, a `Date`, or a Temporal value */
export type TimeInput = Time | DateTime | Date | string | DateTimeFields | TemporalValue;

/**
 * How to format: a preset (`'short'`, `'medium'`, `'long'`, `'full'`, `'month'`, and for a datetime
 * `'date'`, `'time'` or `'text'`), an `Intl.DateTimeFormat` options bag, or a token pattern with `@native-dates/plugins/tokens`
 */
export type FormatSpec =
  | 'short'
  | 'medium'
  | 'long'
  | 'full'
  | 'month'
  | 'date'
  | 'time'
  | 'text'
  | Intl.DateTimeFormatOptions
  | (string & {});

/** A BCP 47 locale tag, overriding the configured locale for one call */
export type Locale = string;

/**
 * An exact moment with a zone to read it in. One type for timestamps, appointments and deadlines.
 * The zone is a view: `toString()` and `toJSON()` print the instant in UTC.
 */
export class DateTime {
  constructor(input: DateTimeInput, zone?: Zone);
  constructor(input: DateTimeInput, options?: ReadOptions);

  /** The value in the configured locale's common form, `'Sep 6, 2026, 2:30 PM EDT'`, what `format('text')` prints */
  readonly text: string;
  readonly month: number;
  readonly day: number;
  readonly year: number;
  /** ISO, 1 for monday through 7 for sunday */
  readonly weekday: number;
  readonly hour: number;
  readonly minute: number;
  readonly second: number;
  readonly millisecond: number;
  readonly microsecond: number;
  readonly nanosecond: number;
  /** The canonical zone id */
  readonly zone: string;
  /** The UTC offset in effect, `'+05:30'` */
  readonly offset: string;
  /** Epoch milliseconds */
  readonly epoch: number;
  /** The exact instant as epoch nanoseconds, the key two datetimes a nanosecond apart still tell apart on */
  readonly epochNanoseconds: bigint;
  readonly quarter: number;
  readonly dayOfYear: number;
  /** ISO week number */
  readonly weekOfYear: number;
  readonly daysInMonth: number;
  readonly daysInYear: number;
  /** 23, 24 or 25 across a daylight saving change */
  readonly hoursInDay: number;
  isLeapYear(): boolean;
  isWeekend(): boolean;
  isWeekday(): boolean;
  /** The calendar date in this zone */
  readonly date: CalendarDate;
  /** The time of day in this zone */
  readonly time: Time;

  /** Adding days keeps the wall clock across a daylight saving change, adding hours counts hours */
  plus(amount: DurationInput, unit?: Unit): DateTime;
  /** Alias for `plus` */
  add(amount: DurationInput, unit?: Unit): DateTime;
  minus(amount: DurationInput, unit?: Unit): DateTime;
  /** Alias for `minus` */
  subtract(amount: DurationInput, unit?: Unit): DateTime;
  /** Alias for `minus` */
  remove(amount: DurationInput, unit?: Unit): DateTime;

  set(fields: DateTimeFields): DateTime;
  set(unit: Unit, value: number): DateTime;
  /** The same date and zone at another time of day */
  at(time: TimeInput): DateTime;
  /** The same instant read in another zone */
  in(zone: Zone): DateTime;
  /** The first instant of the unit around this value. A week starts on the configured first day, or on `firstDay` */
  startOf(unit: Unit, firstDay?: Weekday): DateTime;
  /** The last millisecond of the unit */
  endOf(unit: Unit, firstDay?: Weekday): DateTime;
  round(unit: Unit): DateTime;
  round(increment: number, unit: Unit): DateTime;
  floor(unit: Unit): DateTime;
  floor(increment: number, unit: Unit): DateTime;
  ceil(unit: Unit): DateTime;
  ceil(increment: number, unit: Unit): DateTime;
  /** The next such weekday strictly after this one, at the same time of day */
  next(weekday: Weekday): DateTime;
  previous(weekday: Weekday): DateTime;

  /** The same instant, whatever zone each side reads it in */
  equals(other: DateTimeInput): boolean;
  isBefore(other: DateTimeInput): boolean;
  isAfter(other: DateTimeInput): boolean;
  /** Same to the unit, judged in this datetime's zone */
  isSame(other: DateTimeInput, unit?: Unit, firstDay?: Weekday): boolean;
  isPast(): boolean;
  isFuture(): boolean;
  isToday(): boolean;
  isTomorrow(): boolean;
  isYesterday(): boolean;

  /** A duration balanced from years down that remembers this moment, or the whole length as a number in a unit */
  until(other: DateTimeInput): Duration;
  until(other: DateTimeInput, unit: Unit): number;
  since(other: DateTimeInput): Duration;
  since(other: DateTimeInput, unit: Unit): number;

  /** A preset ('short', 'medium', 'long', 'full', 'date', 'time', 'month', 'text') or an Intl options bag */
  format(spec?: FormatSpec, locale?: Locale): string;
  /** The instant in UTC, `'2026-09-06T14:30:00.000Z'` */
  toString(): string;
  toJSON(): string;
  toJSDate(): Date;
  toTemporal(): TemporalValue;
  /** Epoch milliseconds, so datetimes sort and subtract with `<` and `-` */
  valueOf(): number;
}

/**
 * Reads an ISO string (`'2026-09-06T14:30Z'`, `'2026-09-06T14:30'` as a wall clock in the zone,
 * `'2026-09-06'` as midnight), a Date, epoch milliseconds, a fields object, a date, or a Temporal value.
 * A missing value refuses, `now()` reads the current moment
 */
export function datetime(input: DateTimeInput, zone?: Zone): DateTime;
export function datetime(input: DateTimeInput, options?: ReadOptions): DateTime;

/** The current moment at millisecond precision, in the zone or the configured default */
export function now(zone?: Zone): DateTime;
/** `now(zone).startOf('day')`, the bound a query for today writes */
export function startOfToday(zone?: Zone): DateTime;
/** `now(zone).endOf('day')`, the last millisecond of today */
export function endOfToday(zone?: Zone): DateTime;

export function isDateTime(value: unknown): value is DateTime;

/**
 * A calendar date with no time and no zone: a due date, a birthday, a booking night. It is not a
 * moment, so it never shifts when read from another zone.
 */
export class CalendarDate {
  constructor(input: CalendarDateInput, options?: ReadOptions);
  constructor(year: number, month: number, day: number);

  /** The day in the configured locale's common form, `'Sep 6, 2026'`, what `format()` prints */
  readonly text: string;
  readonly month: number;
  readonly day: number;
  readonly year: number;
  /** ISO, 1 for monday through 7 for sunday */
  readonly weekday: number;
  readonly quarter: number;
  readonly dayOfYear: number;
  /** ISO week number */
  readonly weekOfYear: number;
  readonly daysInMonth: number;
  readonly daysInYear: number;
  isLeapYear(): boolean;
  isWeekend(): boolean;
  isWeekday(): boolean;

  /** Adds years, months, weeks or days. A clock unit refuses */
  plus(amount: DurationInput, unit?: Unit): CalendarDate;
  /** Alias for `plus` */
  add(amount: DurationInput, unit?: Unit): CalendarDate;
  minus(amount: DurationInput, unit?: Unit): CalendarDate;
  /** Alias for `minus` */
  subtract(amount: DurationInput, unit?: Unit): CalendarDate;
  /** Alias for `minus` */
  remove(amount: DurationInput, unit?: Unit): CalendarDate;

  set(fields: Pick<DateTimeFields, 'year' | 'month' | 'day'>): CalendarDate;
  set(unit: Unit, value: number): CalendarDate;
  /** The first day of the unit around this value. A week starts on the configured first day, or on `firstDay` */
  startOf(unit: DateUnit, firstDay?: Weekday): CalendarDate;
  /** The last day of the unit, so `endOf('month')` is the 28th, 30th or 31st */
  endOf(unit: DateUnit, firstDay?: Weekday): CalendarDate;
  /** The next such weekday strictly after this one */
  next(weekday: Weekday): CalendarDate;
  previous(weekday: Weekday): CalendarDate;

  equals(other: CalendarDateInput): boolean;
  isBefore(other: CalendarDateInput): boolean;
  isAfter(other: CalendarDateInput): boolean;
  isSame(other: CalendarDateInput, unit?: DateUnit, firstDay?: Weekday): boolean;
  /** Today depends on where you stand, so these take the zone to judge from */
  isPast(zone?: Zone): boolean;
  isFuture(zone?: Zone): boolean;
  isToday(zone?: Zone): boolean;
  isTomorrow(zone?: Zone): boolean;
  isYesterday(zone?: Zone): boolean;

  /** A duration balanced from years down that remembers this date, or the whole length as a number in a unit */
  until(other: CalendarDateInput): Duration;
  until(other: CalendarDateInput, unit: Unit): number;
  since(other: CalendarDateInput): Duration;
  since(other: CalendarDateInput, unit: Unit): number;
  /** This date at a time of day in a zone, the moment an appointment happens. No time means midnight */
  at(time?: TimeInput, zone?: Zone): DateTime;

  format(spec?: FormatSpec, locale?: Locale): string;
  /** ISO 8601, `'2026-09-06'` */
  toString(): string;
  toJSON(): string;
  /** Midnight of this date in the zone, as a JS Date */
  toJSDate(zone?: Zone): Date;
  toTemporal(): TemporalValue;
  /** Throws. A date is not a point on the number line */
  valueOf(): never;
}

/**
 * Reads `'2026-09-06'`, three numbers, a fields object, a datetime (its date in its zone), a Date (its
 * date in the zone), or a Temporal value. A wall-clock string keeps its day. A missing day refuses:
 * two numbers are a year and a month, which `@native-dates/plugins/year-month` reads as a `YearMonth`
 */
export function date(input: CalendarDateInput, options?: ReadOptions): CalendarDate;
export function date(year: number, month: number, day: number): CalendarDate;
export function date(input: CalendarDateInput, zone: Zone): CalendarDate;

export function today(zone?: Zone): CalendarDate;
export function tomorrow(zone?: Zone): CalendarDate;
export function yesterday(zone?: Zone): CalendarDate;

export function isCalendarDate(value: unknown): value is CalendarDate;

/**
 * A time of day with no date: opening hours, a daily reminder. Arithmetic wraps at midnight.
 */
export class Time {
  constructor(input: TimeInput, options?: ReadOptions);
  constructor(hour: number, minute?: number, second?: number);

  /** The clock in the configured locale's common form, `'5:30 PM'`, what `format()` prints */
  readonly text: string;
  readonly hour: number;
  readonly minute: number;
  readonly second: number;
  readonly millisecond: number;
  readonly microsecond: number;
  readonly nanosecond: number;

  plus(amount: DurationInput, unit?: Unit): Time;
  /** Alias for `plus` */
  add(amount: DurationInput, unit?: Unit): Time;
  minus(amount: DurationInput, unit?: Unit): Time;
  /** Alias for `minus` */
  subtract(amount: DurationInput, unit?: Unit): Time;
  /** Alias for `minus` */
  remove(amount: DurationInput, unit?: Unit): Time;

  set(fields: Partial<Record<'hour' | 'minute' | 'second' | 'millisecond', number>>): Time;
  set(unit: Unit, value: number): Time;
  startOf(unit: Unit): Time;
  endOf(unit: Unit): Time;
  round(unit: Unit): Time;
  round(increment: number, unit: Unit): Time;
  floor(unit: Unit): Time;
  floor(increment: number, unit: Unit): Time;
  ceil(unit: Unit): Time;
  ceil(increment: number, unit: Unit): Time;

  equals(other: TimeInput): boolean;
  isBefore(other: TimeInput): boolean;
  isAfter(other: TimeInput): boolean;
  isSame(other: TimeInput, unit?: Unit): boolean;

  /** The signed length until another time within the day, or that length as a number in a unit */
  until(other: TimeInput): Duration;
  until(other: TimeInput, unit: Unit): number;
  since(other: TimeInput): Duration;
  since(other: TimeInput, unit: Unit): number;
  /** This time on a date in a zone, the mirror of `date.at(time, zone)` */
  on(day: CalendarDateInput, zone?: Zone): DateTime;

  format(spec?: FormatSpec, locale?: Locale): string;
  /** ISO 8601, `'17:30:00'` */
  toString(): string;
  toJSON(): string;
  toTemporal(): TemporalValue;
  /** Throws. A time of day is not a point on the number line */
  valueOf(): never;
}

/** Reads `'09:00'`, `'5:30pm'`, `'17:30:15.250'`, numbers, a fields object, a datetime or a Date */
export function time(input: TimeInput, options?: ReadOptions): Time;
export function time(hour: number, minute?: number, second?: number): Time;
export function time(input: TimeInput, zone: Zone): Time;

export function isTime(value: unknown): value is Time;

/**
 * A length of time. Fields stay as written until balanced, and a duration measured with `until()` or
 * `since()` remembers where it started, so months and years can total in any unit.
 */
export class Duration {
  constructor(input: DurationInput, unit?: Unit);

  /** The length in the configured locale's common form, `'1 hour, 30 minutes'`, what `format('long')` prints */
  readonly text: string;
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
  /** 1, 0 or -1 */
  readonly sign: number;
  isZero(): boolean;
  isNegative(): boolean;
  /** The point this duration was measured from, when it came from `until()` or `since()` */
  readonly anchor: TemporalValue | undefined;

  /** The nonzero fields as a plain object */
  toFields(): DurationFields;

  plus(other: DurationInput, unit?: Unit): Duration;
  /** Alias for `plus` */
  add(other: DurationInput, unit?: Unit): Duration;
  minus(other: DurationInput, unit?: Unit): Duration;
  /** Alias for `minus` */
  subtract(other: DurationInput, unit?: Unit): Duration;
  /** Alias for `minus` */
  remove(other: DurationInput, unit?: Unit): Duration;

  times(factor: number): Duration;
  negated(): Duration;
  abs(): Duration;
  /** Carry overflow upward. A length stops at hours, an anchored duration at days, an explicit unit is taken as given */
  balance(largest?: Unit): Duration;
  /** Rounds to the nearest whole unit */
  round(smallest: Unit): Duration;

  /** The whole duration in one unit, fractional. Months and years need the anchor */
  total(unit: Unit): number;
  /** -1, 0 or 1 by length */
  compare(other: DurationInput): number;
  equals(other: DurationInput): boolean;

  /** Words in the locale: `'2 hours, 30 minutes'`, `'2 hr, 30 min'`, `'2h 30m'`, `'2:30:00'` */
  format(style?: 'long' | 'short' | 'narrow' | 'digital', locale?: Locale): string;
  /** ISO 8601, `'PT1H30M'` */
  toString(): string;
  toJSON(): string;
  toTemporal(): TemporalValue;
  /** The whole length in milliseconds, months and years only when anchored */
  toMilliseconds(): number;
  valueOf(): number;
}

/** Reads a phrase, an ISO string, a fields object, or a number with a unit. A bare number is milliseconds */
export function duration(input: DurationInput, unit?: Unit): Duration;

export function years(count: number | string): Duration;
export function months(count: number | string): Duration;
export function weeks(count: number | string): Duration;
export function days(count: number | string): Duration;
export function hours(count: number | string): Duration;
export function minutes(count: number | string): Duration;
export function seconds(count: number | string): Duration;
export function milliseconds(count: number | string): Duration;

export function isDuration(value: unknown): value is Duration;

/** A datetime, a date or a time, or a string that reads as one */
export type Point = DateTime | CalendarDate | Time | Date | string;

/** Augmented by `@native-dates/plugins/ranges` with `DateRange | DateTimeRange | TimeRange` */
export interface RangeMap {}

export type Range = RangeMap[keyof RangeMap];

/** A sort comparator over points of one kind, durations, or ranges of one kind. A raw value reads as the first's kind */
export function compare(a: Point | Duration | Range, b: Point | Duration | Range): -1 | 0 | 1;

/** The point that comes first, from several arguments or one array */
export function earliest<T extends Point>(
  ...points: T[] | [T[]]
): T extends string ? DateTime | CalendarDate | Time : T;
/** The point that comes last, from several arguments or one array */
export function latest<T extends Point>(...points: T[] | [T[]]): T extends string ? DateTime | CalendarDate | Time : T;

/** The kind of a value from this library, or undefined */
export function kindOf(
  value: unknown,
): 'datetime' | 'date' | 'time' | 'duration' | 'dateRange' | 'datetimeRange' | 'timeRange' | undefined;

/**
 * The brands, keyed with `Symbol.for` so a value is recognised across bundles and realms without
 * importing the class. `value[IS_DATE_TIME]` is true for a DateTime from any copy of this package.
 */
export const IS_DATE_TIME: unique symbol;
export const IS_CALENDAR_DATE: unique symbol;
export const IS_TIME: unique symbol;
export const IS_DURATION: unique symbol;
/** Every range kind */
export const IS_RANGE: unique symbol;
export const IS_DATE_RANGE: unique symbol;
export const IS_DATE_TIME_RANGE: unique symbol;
export const IS_TIME_RANGE: unique symbol;

/** The ISO number of a weekday from its name, `weekday('sunday')` is 7, a number passing through */
export function weekday(day: Weekday): number;

export interface Settings {
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
