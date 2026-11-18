import { each, isNumber, isPlainObject, isString } from './utils.js';

import { isDevelopment } from './environment.js';
import { refuse } from './errors.js';
import {
  IS_CALENDAR_DATE,
  IS_DATE_TIME,
  IS_DURATION,
  IS_MONTH_DAY,
  IS_RANGE,
  IS_TIME,
  IS_YEAR_MONTH,
} from './identity.js';
import { checkedLocale } from './zones.js';

export const inspect = Symbol.for('nodejs.util.inspect.custom');

// every common unit spelling plus the calendar units duration arithmetic refuses to guess at
const spellings = {
  y: 'year',
  yr: 'year',
  yrs: 'year',
  year: 'year',
  years: 'year',
  q: 'quarter',
  qtr: 'quarter',
  quarter: 'quarter',
  quarters: 'quarter',
  mo: 'month',
  mos: 'month',
  month: 'month',
  months: 'month',
  w: 'week',
  wk: 'week',
  wks: 'week',
  week: 'week',
  weeks: 'week',
  d: 'day',
  day: 'day',
  days: 'day',
  h: 'hour',
  hr: 'hour',
  hrs: 'hour',
  hour: 'hour',
  hours: 'hour',
  m: 'minute',
  min: 'minute',
  mins: 'minute',
  minute: 'minute',
  minutes: 'minute',
  s: 'second',
  sec: 'second',
  secs: 'second',
  second: 'second',
  seconds: 'second',
  ms: 'millisecond',
  msec: 'millisecond',
  msecs: 'millisecond',
  millisecond: 'millisecond',
  milliseconds: 'millisecond',
  us: 'microsecond',
  'µs': 'microsecond',
  microsecond: 'microsecond',
  microseconds: 'microsecond',
  ns: 'nanosecond',
  nanosecond: 'nanosecond',
  nanoseconds: 'nanosecond',
};

export const units = [
  'year',
  'month',
  'week',
  'day',
  'hour',
  'minute',
  'second',
  'millisecond',
  'microsecond',
  'nanosecond',
];
export const timeUnits = ['hour', 'minute', 'second', 'millisecond', 'microsecond', 'nanosecond'];

// a number written as text, the way a form or a query string carries one
export const isDigits = (value) => isString(value) && /^\s*[-+]?\d+(?:\.\d+)?\s*$/.test(value);

// a count is a number, or one written as text
export const isCount = (value) => isNumber(value) || isDigits(value);

// day.js keeps M for month and m for minute, and token patterns do too, so the one capital is kept
export const unit = (input) => {
  const key = input === 'M' ? 'month' : isString(input) ? input.trim().toLowerCase() : '';
  const found = Object.hasOwn(spellings, key) && spellings[key];
  return found || refuse('unknownUnit', String(input), {
    explanation: isDevelopment
      ? `expected a time unit in [${
        units.join(', ')
      }, quarter]. singular, plural, and shorthand names like 'd', 'h', and 'min' are all accepted`
      : 0,
  });
};

export const plural = (name) => `${name}s`;

const weekdays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

// the number of a day of the week from its name or its number. ISO numbering, monday is 1 and
// sunday is 7
export const dayOfWeek = (input) => {
  if (isNumber(input) && Number.isInteger(input) && input >= 1 && input <= 7) {
    return input;
  }
  const key = isString(input) ? input.trim().toLowerCase().slice(0, 3) : '';
  const index = key.length === 3 ? weekdays.findIndex((name) => name.startsWith(key)) : -1;
  return index === -1
    ? refuse('unknownDayOfWeek', String(input), {
      explanation: isDevelopment
        ? `expected a weekday in [${
          weekdays.join(', ')
        }] (or 3-letter shorthand like 'mon'), or a day of the week as a number from 1 (Monday) to 7 (Sunday)`
        : 0,
    })
    : index + 1;
};

export const isZonedDateTime = (value) => value instanceof Temporal.ZonedDateTime;
export const isInstant = (value) => value instanceof Temporal.Instant;

// a string with a clock and a Z, an offset or a bracketed zone names a moment, not a wall clock
export const hasTime = /[T ]\d{1,2}(?::?\d{2})?/;
export const hasOffset = /(?:[zZ]|[+-]\d{2}(?::?\d{2})?)$/;
export const hasZoneName = /\[[^\]]+\]$/;
export const namesInstant = (text) => {
  const trimmed = text.trim();
  return hasTime.test(trimmed) && (hasOffset.test(trimmed) || hasZoneName.test(trimmed));
};
export const isPlainDate = (value) => value instanceof Temporal.PlainDate;
export const isPlainDateTime = (value) => value instanceof Temporal.PlainDateTime;
export const isPlainTime = (value) => value instanceof Temporal.PlainTime;
export const isTemporalDuration = (value) => value instanceof Temporal.Duration;

export const pad = (value, width = 2) => String(Math.abs(value)).padStart(width, '0');

// Temporal truncates 9.5 to 9 before it checks a range, so a fraction is refused before it gets there
export const wholeNumbers = (values) => values.every((value) => !isNumber(value) || Number.isInteger(value));

// set() replaces parts as strictly as a factory reads them: whole numbers, in range
export const withParts = (temporal, changes) => {
  if (!wholeNumbers(Object.values(changes))) {
    throw new RangeError(isDevelopment ? 'each value passed to `set()` must be a whole number' : '');
  }
  return temporal.with(changes, { overflow: 'reject' });
};

// singular keys, the shape Temporal's with() takes, from any spelling a caller wrote
export const singularKeys = (fields) => {
  const out = {};
  each(fields, (value, key) => {
    out[unit(key)] = value;
  });
  return out;
};

export const quarterStart = (month) => Math.floor((month - 1) / 3) * 3 + 1;

// one whole unit as duration fields
// an end is the last millisecond of its unit, the precision of Date and of now(). a unit finer than a
// millisecond ends on its last nanosecond, so the end never falls before the start
export const endPrecision = (name) =>
  name === 'microsecond' || name === 'nanosecond' ? { nanoseconds: 1 } : { milliseconds: 1 };

export const stepOf = (name) => (name === 'quarter' ? { months: 3 } : { [plural(name)]: 1 });

// the locale a new value is written in: the one its options name, or else the one carried by the
// value it is made from, so a date taken from a Spanish datetime is Spanish too
const nouns = [IS_DATE_TIME, IS_CALENDAR_DATE, IS_TIME, IS_DURATION, IS_MONTH_DAY, IS_YEAR_MONTH, IS_RANGE];
export const localeOf = (options, input) => {
  // a value from an older copy of the package carries the brand and no locale to ask for
  const tag = options?.locale ?? (nouns.some((brand) => input?.[brand]) ? input.locale?.() : undefined);
  // kept as it was read, so 'en_US' hands back en-US, a tag Intl takes
  return tag ? checkedLocale(tag) : undefined;
};

// the second argument of a factory is a zone, or an options bag { zone, loose }
export const zoneOptions = (value) => (isPlainObject(value) ? value : { zone: value });

// points('hour', zone), or points(30, 'minutes', zone): a count brings its unit before the zone
export const stepArguments = (step, [second, third]) =>
  isNumber(step) || isDigits(step) ? [second, third] : [undefined, second];
