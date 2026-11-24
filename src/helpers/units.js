import { each, isDate, isNumber, isObject, isPlainObject, isString } from './utils.js';

import { isDevelopment } from './environment.js';
import { fail, refuse } from './errors.js';
import {
  IS_CALENDAR_DATE,
  IS_DATE_TIME,
  IS_DURATION,
  IS_MONTH_DAY,
  IS_RANGE,
  IS_TIME,
  IS_YEAR_MONTH,
} from './identity.js';
import { checkedLocale, zoneId } from './zones.js';

export const inspect = Symbol.for('nodejs.util.inspect.custom');

const spellings = {
  __proto__: null,
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
export const timeUnits = units.slice(4);

export const isDigits = (value) => isString(value) && /^\s*[-+]?\d+(?:\.\d+)?\s*$/.test(value);

export const isCount = (value) => isNumber(value) || isDigits(value);

// preserve uppercase 'M' as month before lowercasing ('m' is minute, matching Moment and Day.js)
export const unit = (input) => {
  const key = input === 'M' ? 'month' : isString(input) ? input.trim().toLowerCase() : '';
  return spellings[key] || refuse('unknownUnit', String(input), {
    explanation: isDevelopment
      ? `expected a time unit in [${
        units.join(', ')
      }, quarter]. Singular, plural, and shorthand names like 'd', 'h', and 'min' are all accepted`
      : 0,
  });
};

export const plural = (name) => `${name}s`;

const weekdays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

// returns ISO 1-7 for weekday names/prefixes only (never numbers, so startOfNext(2, 'months') rejects 2 as unknownUnit)
export const weekdayNamed = (input) => {
  const key = isString(input) ? input.trim().toLowerCase() : '';
  return key.length > 2 ? weekdays.findIndex((name) => name.startsWith(key)) + 1 : 0;
};

// canonical range is ISO 1-7 (7 = Sunday), accepting 0 only as grace for Date.prototype.getDay()
export const dayOfWeek = (input) => {
  if (isNumber(input) && Number.isInteger(input) && input >= 0 && input <= 7) {
    return input || 7;
  }
  return weekdayNamed(input) || refuse('unknownDayOfWeek', String(input), {
    explanation: isDevelopment
      ? spellings[input === 'M' ? 'month' : isString(input) ? input.trim().toLowerCase() : '']
        ? `'${input}' is a unit, not a weekday (expected [${
          weekdays.join(', ')
        }] or 1 to 7). To step by a supported unit instead of a weekday, use \`.plus(1, unit)\` / \`.minus(1, unit)\` or \`.startOfNext(unit)\` / \`.startOfPrevious(unit)\``
        : `expected a weekday in [${
          weekdays.join(', ')
        }] (or 3-letter shorthand like 'mon'), or a day of the week as a number from 1 (Monday) to 7 (Sunday)`
      : 0,
  });
};

export const isZonedDateTime = (value) => value instanceof Temporal.ZonedDateTime;
export const isInstant = (value) => value instanceof Temporal.Instant;
export const isUnzoned = (value) => isDate(value) || isInstant(value) || isString(value);

// true only when text includes both a clock time and an offset or bracketed zone, pinning an exact instant
export const hasTime = /[Tt ]\d{1,2}(?::?\d{2})?/;
export const hasOffset = /(?:[zZ]|[+-]\d{2}(?::?\d{2})?)$/;
export const hasZoneName = /\[[^[\]]+\]$/;
export const namesInstant = (text) => {
  const trimmed = text.trim();
  return hasTime.test(trimmed) && (hasOffset.test(trimmed) || hasZoneName.test(trimmed));
};
export const isPlainDate = (value) => value instanceof Temporal.PlainDate;
export const isPlainDateTime = (value) => value instanceof Temporal.PlainDateTime;
export const isPlainTime = (value) =>
  (isDevelopment && typeof Temporal === 'undefined' && zoneId()) || value instanceof Temporal.PlainTime;
export const isTemporalDuration = (value) =>
  (isDevelopment && typeof Temporal === 'undefined' && zoneId()) || value instanceof Temporal.Duration;

export const pad = (value, width = 2) => String(Math.abs(value)).padStart(width, '0');

// Temporal.PlainDate/PlainTime.from() silently truncates floats (9.5 -> 9) before range checking
export const wholeNumbers = (values) => values.every((value) => !isNumber(value) || Number.isInteger(value));

export const withParts = (temporal, changes) => {
  if (!wholeNumbers(Object.values(changes))) {
    fail(isDevelopment ? 'each value passed to `set()` must be a whole number' : '');
  }
  if (Object.keys(changes).some((key) => !(key in temporal))) {
    fail(isDevelopment ? 'one or more fields cannot be set on this value' : '');
  }
  // validate passed fields against day 1 so explicit out-of-range values reject while an unchanged day clamps to month-end
  temporal.with({ day: 1, ...changes }, { overflow: 'reject' });
  return temporal.with(changes);
};

export const singularKeys = (fields) => {
  const out = {};
  each(fields, (value, key) => {
    const name = unit(key);
    if (value !== undefined) {
      out[name] = value;
    }
  });
  return out;
};

export const quarterStart = (month) => Math.floor((month - 1) / 3) * 3 + 1;

// endOf() steps back 1ms to match Date and now() precision, dropping to 1ns only for sub-millisecond units
export const endPrecision = (name) =>
  name === 'microsecond' || name === 'nanosecond' ? { nanoseconds: 1 } : { milliseconds: 1 };

export const stepOf = (name) => (name === 'quarter' ? { months: 3 } : { [plural(name)]: 1 });

// share prototype method references directly so aliases add near-zero bundle bytes
export const alias = (Class, names) => {
  each(names, (method, word) => {
    Class.prototype[word] = Class.prototype[method];
  });
};

// check brand before calling .locale() so plain field bags with a `locale` key aren't invoked as methods
const nouns = [IS_DATE_TIME, IS_CALENDAR_DATE, IS_TIME, IS_DURATION, IS_MONTH_DAY, IS_YEAR_MONTH, IS_RANGE];
export const localeOf = (options, input) => {
  if (
    (isDevelopment && typeof Temporal === 'undefined' && zoneId())
    || (isPlainObject(options) && Object.hasOwn(options, 'locale') && options.locale !== undefined)
  ) {
    return checkedLocale(options.locale);
  }
  return isObject(input) && input.locale && nouns.some((brand) => input[brand]) ? input.locale() : undefined;
};

const noOptions = Object.freeze({});
export const zoneOptions = (
  value,
) => (value === undefined ? noOptions : isPlainObject(value) ? value : { zone: value });

export const isPlainRead = (settings) =>
  settings.zone === undefined && !settings.loose && settings.dayFirst === undefined
  && settings.disambiguation === undefined && settings.format === undefined;

// disambiguate every('hour', zone) from every(30, 'minutes', zone)
export const stepArguments = (step, [second, third]) =>
  isNumber(step) || isDigits(step) ? [second, third] : [undefined, second];
