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

// cascade fractional units downward (1.5 days -> 1d 12h). Months vary in length so they are omitted
// and rejected below, and toFixed(9) strips IEEE-754 float residue so 0.1h doesn't leak stray nanoseconds
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
          ? 'months and nanoseconds must be whole numbers because months vary in length and nanoseconds are the smallest unit. Use whole months, or specify days instead'
          : 0,
      });
    }
    // round sub-nanosecond remainders to the nearest nanosecond
    spill(fields, next[0], Number((fraction * next[1]).toFixed(next[0] === 'nanosecond' ? 0 : 9)));
  }
  return fields;
};

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

const parseWords = (text) => {
  const phrase = text.trim().replace(/,|\band\b/gi, ' ');
  if (!phrase) {
    refuse('invalidDuration', text, {
      explanation: isDevelopment ? 'duration string cannot be empty. Use `duration(0)` for a zero-length duration' : 0,
    });
  }
  // bare numeric string like '1500' defaults to milliseconds, matching duration(1500)
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
  // '-1h 30m' negates every unit, whereas '-1h +30m' keeps explicit signs so oneSign() rejects it
  const negateAll = found[0]?.[0] === '-' && found.slice(1).every(([sign]) => sign === '');
  const fields = {};
  each(found, ([sign, amount, name]) => {
    spill(fields, name, negateAll || sign === '-' ? -amount : amount);
  });
  return fields;
};

// ISO years are always 12 months, so months carry into years without a calendar anchor
export const carriedMonths = (years = 0, months = 0) => {
  const whole = years * 12 + months;
  const [carried, left] = [Math.trunc(whole / 12), whole % 12];
  return { ...(carried && { years: carried }), ...(left && { months: left }) };
};

const twoSigns = (fields) => new Set(Object.values(fields).filter(Boolean).map(Math.sign)).size > 1;

const oneSign = (fields, at) => {
  if (twoSigns(fields)) {
    refuse('conflictingSigns', at, {
      explanation: isDevelopment
        ? "all units in a duration must have the same sign. Chain `.plus()` and `.minus()` on a date or time instead, such as `start.plus(1, 'hour').minus(30, 'minutes')`"
        : 0,
    });
  }
  return fields;
};

export const fieldsFrom = (input, name) => {
  if (isNumber(input)) {
    return spill({}, name === undefined ? 'millisecond' : unit(name), input);
  }
  // accept numeric strings from form inputs or query params when paired with a unit, e.g. ('30', 'days')
  if (isString(input) && isDigits(input) && name !== undefined) {
    return spill({}, unit(name), Number(input));
  }
  if (name !== undefined && input != null) {
    refuseType('invalidDuration', `${isPlainObject(input) ? JSON.stringify(input) : input} ${name}`, {
      explanation: isDevelopment
        ? "cannot pass a separate unit when the first argument already includes units. Pass a number with a unit like `duration(90, 'minutes')`, or a duration phrase alone like `duration('2h')`"
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

// sum calendar units field-wise so 25h never folds into a day (which would shift deadlines across DST),
// while sub-day clock units combine through Temporal so 2h minus 30m resolves to 1h 30m
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
  const written = JSON.stringify(fields);
  // borrow across fixed-ratio ISO pairs (1y = 12mo, 1w = 7d) when signs conflict. Days vs hours and
  // months vs days depend on DST or month length so they fall through to oneSign() and throw
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

// Temporal.Duration.from({}) throws RangeError, so construct a zero duration directly when empty
export const temporalDurationOf = (fields) => {
  if (!Object.keys(fields).length) {
    return new Temporal.Duration();
  }
  try {
    return Temporal.Duration.from(fields);
  }
  catch (error) {
    if (error?.code) {
      throw error;
    }
    return refuse('invalidDuration', JSON.stringify(fields), {
      explanation: error.message.replace(/^Temporal error: /, ''),
    });
  }
};

export const temporalDurationFrom = (input, name) => temporalDurationOf(fieldsFrom(input, name));

// plural keys ({ hours: 2 }) distinguish a duration bag from a point's singular fields ({ hour: 2 })
export const isDurationFields = (value) =>
  isPlainObject(value) && Object.keys(value).length > 0 && Object.keys(value).every((key) => fieldNames.includes(key));
