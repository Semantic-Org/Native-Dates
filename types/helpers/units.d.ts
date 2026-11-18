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

/** A day of the week by name (`'monday'`, `'Fri'`) or ISO number, 1 for monday through 7 for sunday */
export type DayOfWeek =
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
 * The number of a day of the week from its name, `dayOfWeek('sunday')` is 7, a number passing through
 * @see {@link https://nativedates.dev/api/configure/#dayofweek dayOfWeek}
 */
export function dayOfWeek(day: DayOfWeek): number;
