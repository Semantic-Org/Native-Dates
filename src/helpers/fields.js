import { each, isNumber, isPlainObject, isString } from './utils.js';

import { isDevelopment } from './environment.js';
import { guard, refuse, refuseType } from './errors.js';
import { IS_DURATION } from './identity.js';
import { isDigits, isTemporalDuration, plural, unit } from './units.js';

export const fieldNames = [
  'years',
  'months',
  'weeks',
  'days',
  'hours',
  'minutes',
  'seconds',
  'milliseconds',
  'microseconds',
  'nanoseconds',
];

// a fractional quantity spills into the next unit down: 1.5 days is a day and 12 hours. a month has no
// next unit, so a fraction of one is refused rather than guessed
const spillsInto = {
  year: ['month', 12],
  week: ['day', 7],
  day: ['hour', 24],
  hour: ['minute', 60],
  minute: ['second', 60],
  second: ['millisecond', 1000],
  millisecond: ['microsecond', 1000],
  microsecond: ['nanosecond', 1000],
};

export const spill = (fields, name, value) => {
  if (name === 'quarter') {
    return spill(fields, 'month', value * 3);
  }
  if (!Number.isFinite(value)) {
    refuse('invalidNumber', `${value} ${name}`, {
      explanation: isDevelopment ? 'duration amounts must be finite numbers' : 0,
    });
  }
  const whole = Math.trunc(value);
  const fraction = Number((value - whole).toFixed(9));
  fields[plural(name)] = (fields[plural(name)] ?? 0) + whole;
  if (fraction) {
    const next = spillsInto[name];
    if (!next) {
      refuse('invalidFraction', `${value} ${name}`, {
        explanation: isDevelopment
          ? 'months and nanoseconds must be whole numbers because months vary in length and nanoseconds are the smallest unit. use whole months, or specify days instead'
          : 0,
      });
    }
    spill(fields, next[0], Number((fraction * next[1]).toFixed(9)));
  }
  return fields;
};

// the nonzero fields of a Temporal.Duration as a plain object
export const fieldsOf = (temporal) => {
  const fields = {};
  each(fieldNames, (field) => {
    if (temporal[field]) {
      fields[field] = temporal[field];
    }
  });
  return fields;
};

const quantity = /([-+]?)(\d+(?:\.\d+)?)\s*([a-zµ]+)/gi;

// '1h 30m', '2 weeks and 3 days', '90 minutes', '1500' (milliseconds).
// a leading minus with the rest unsigned negates the whole phrase, the way a person means '-1h 30m',
// and a sign on each quantity is taken as written
const parseWords = (text) => {
  const phrase = text.trim().replace(/,|\band\b/gi, ' ');
  if (!phrase) {
    refuse('invalidDuration', text, {
      explanation: isDevelopment ? 'duration string cannot be empty. use `duration(0)` for a zero-length duration' : 0,
    });
  }
  if (/^-?\d+(\.\d+)?$/.test(phrase)) {
    return spill({}, 'millisecond', Number(phrase));
  }
  const found = [];
  const rest = phrase.replace(quantity, (_, sign, amount, name) => {
    found.push([sign, Number(amount), unit(name)]);
    return '';
  });
  if (rest.trim()) {
    refuse('invalidDuration', text, {
      explanation: isDevelopment
        ? "expected numbers with units like '1h 30m' or '2 weeks 3 days', or an ISO 8601 duration like 'PT1H30M'"
        : 0,
    });
  }
  const negateAll = found[0]?.[0] === '-' && found.slice(1).every(([sign]) => sign === '');
  const fields = {};
  each(found, ([sign, amount, name]) => {
    spill(fields, name, negateAll || sign === '-' ? -amount : amount);
  });
  return fields;
};

// a year is twelve months in the ISO calendar, so months carry into years with nothing to anchor them
export const carriedMonths = (years = 0, months = 0) => {
  const whole = years * 12 + months;
  const [carried, left] = [Math.trunc(whole / 12), whole % 12];
  return { ...(carried && { years: carried }), ...(left && { months: left }) };
};

const twoSigns = (fields) => new Set(Object.values(fields).filter(Boolean).map(Math.sign)).size > 1;

// a duration has one sign. '1h -30m' has no meaning until it is subtracted from a point
const oneSign = (fields, at) => {
  if (twoSigns(fields)) {
    refuse('conflictingSigns', at, {
      explanation: isDevelopment
        ? "all units in a duration must have the same sign. chain `.plus()` and `.minus()` on a date or time instead, such as `start.plus(1, 'hour').minus(30, 'minutes')`"
        : 0,
    });
  }
  return fields;
};

// every shape a duration can be written as, as plural Temporal fields
export const fieldsFrom = (input, name) => {
  if (isNumber(input)) {
    return spill({}, name === undefined ? 'millisecond' : unit(name), input);
  }
  // a count from a form or a query string is text, and '30' beside 'days' is thirty days
  if (isString(input) && isDigits(input) && name !== undefined) {
    return spill({}, unit(name), Number(input));
  }
  if (name !== undefined && input != null) {
    refuseType('invalidDuration', `${isPlainObject(input) ? JSON.stringify(input) : input} ${name}`, {
      explanation: isDevelopment
        ? "cannot pass a separate unit when the first argument already includes units. pass a number with a unit like `duration(90, 'minutes')`, or a duration phrase alone like `duration('2h')`"
        : 0,
    });
  }
  if (input?.[IS_DURATION]) {
    return input.toFields();
  }
  if (isTemporalDuration(input)) {
    return fieldsOf(input);
  }
  if (isString(input)) {
    return /^[-+]?P/i.test(input.trim())
      ? fieldsOf(guard(() => Temporal.Duration.from(input.trim()), 'invalidDuration', input))
      : oneSign(parseWords(input), input);
  }
  if (isPlainObject(input)) {
    const fields = {};
    each(input, (value, key) => {
      spill(fields, unit(key), value);
    });
    return oneSign(fields, JSON.stringify(input));
  }
  return refuseType('invalidDuration', String(input), {
    explanation: isDevelopment
      ? "expected a number and unit like `duration(2, 'hours')`, milliseconds, a phrase like '2h 30m', an ISO string like 'PT2H30M', or a units object like `{ hours: 2 }`"
      : 0,
  });
};

export const clockFields = (fields) => {
  const clock = {};
  each(fieldNames.slice(4), (field) => {
    if (fields[field]) {
      clock[field] = fields[field];
    }
  });
  return clock;
};

// years, months, weeks and days stay field-wise: they are calendar units, and folding 25 hours into a
// day would move a deadline across a daylight saving change. hours and below combine through Temporal
// so a subtraction balances to one sign: 2h minus 30m is 1h 30m
export const addFields = (a, b, sign, anchor) => {
  const fields = {};
  each(['years', 'months', 'weeks', 'days'], (field) => {
    const sum = (a[field] ?? 0) + sign * (b[field] ?? 0);
    if (sum) {
      fields[field] = sum;
    }
  });
  const clockA = temporalDurationOf(clockFields(a));
  const clockB = temporalDurationOf(clockFields(b));
  Object.assign(fields, fieldsOf(sign > 0 ? clockA.add(clockB) : clockA.subtract(clockB)));
  // a refusal names the fields as they were written, before anything was broken down
  const written = JSON.stringify(fields);
  // a subtraction can leave two signs, a year less a month. a year is always twelve months and a
  // week always seven days, so the larger of a pair that disagrees is broken into the smaller: 11
  // months, 6 days. a pair that agrees stays as written. a day is not always twenty four hours, so
  // a day less an hour still has no answer, nor months less days, and an anchored length is left
  // to its anchor
  if (!anchor) {
    const { years = 0, months = 0, weeks = 0, days = 0 } = fields;
    if (years * months < 0) {
      delete fields.years;
      delete fields.months;
      Object.assign(fields, carriedMonths(years, months));
    }
    if (weeks * days < 0) {
      delete fields.weeks;
      fields.days = weeks * 7 + days;
    }
  }
  return oneSign(fields, written);
};

// Temporal refuses an empty fields object, and a zero duration has no nonzero field to offer it
export const temporalDurationOf = (fields) =>
  Object.keys(fields).length
    ? guard(() => Temporal.Duration.from(fields), 'invalidDuration', JSON.stringify(fields))
    : new Temporal.Duration();

export const temporalDurationFrom = (input, name) => temporalDurationOf(fieldsFrom(input, name));

// plural keys are how Temporal writes a length, singular keys how it writes a point, so { hours: 2 }
// is two hours where { hour: 2 } is two o'clock
export const isDurationFields = (value) =>
  isPlainObject(value) && Object.keys(value).length > 0 && Object.keys(value).every((key) => fieldNames.includes(key));
