import { isArray, isDate, isNumber, isString } from './utils.js';

import { CalendarDate } from '../calendar-date.js';
import { DateTime } from '../date-time.js';
import { Time } from '../time.js';
import { YearMonth } from '../year-month.js';
import { isDevelopment } from './environment.js';
import { refuse, refuseType } from './errors.js';
import {
  IS_CALENDAR_DATE,
  IS_DATE_TIME,
  IS_DURATION,
  IS_MONTH_DAY,
  IS_RANGE,
  IS_TIME,
  IS_YEAR_MONTH,
} from './identity.js';
import { isInstant, isPlainDate, isPlainDateTime, isPlainTime, isZonedDateTime } from './units.js';

const looksLikeTime = /^\d{1,2}(?::\d{2}){0,2}(?:\.\d+)?\s*(?:[ap]\.?m\.?)?$/i;
const looksLikeDateTime = /[Tt ]\d|[zZ]$|\[[^\]]+\]$/;

export const point = (input) => {
  // YearMonth is ordered on the timeline too, so earliest() and latest() accept it
  if (input?.[IS_DATE_TIME] || input?.[IS_CALENDAR_DATE] || input?.[IS_TIME] || input?.[IS_YEAR_MONTH]) {
    return input;
  }
  if (isString(input) ? looksLikeTime.test(input.trim()) : isPlainTime(input)) {
    return new Time(input);
  }
  // bare numbers default to epoch ms when first (compare(Date.now(), dt)), whereas asKindOf() below
  // coerces a trailing number to match the leading argument (compare(time('09:00'), 9))
  if (
    isString(input)
      ? looksLikeDateTime.test(input.trim())
      : isDate(input) || isNumber(input) || isZonedDateTime(input) || isInstant(input) || isPlainDateTime(input)
  ) {
    return new DateTime(input);
  }
  if (isString(input) || isPlainDate(input)) {
    return new CalendarDate(input);
  }
  if (input instanceof Temporal.PlainYearMonth) {
    return new YearMonth(input);
  }
  return refuseType('invalidPoint', String(input), {
    explanation: isDevelopment
      ? 'expected a `DateTime`, `CalendarDate`, `Time`, `Date`, epoch milliseconds, or ISO string'
      : 0,
  });
};

export const kindOf = (value) => {
  if (value?.[IS_DATE_TIME]) {
    return 'datetime';
  }
  if (value?.[IS_CALENDAR_DATE]) {
    return 'date';
  }
  if (value?.[IS_TIME]) {
    return 'time';
  }
  if (value?.[IS_DURATION]) {
    return 'duration';
  }
  if (value?.[IS_MONTH_DAY]) {
    return 'monthDay';
  }
  if (value?.[IS_RANGE]) {
    return `${value.kind}Range`;
  }
  if (value?.[IS_YEAR_MONTH]) {
    return 'yearMonth';
  }
  return undefined;
};

const sameKind = (leftKind, rightKind) => {
  if (leftKind !== rightKind) {
    refuseType('conflictingKinds', `${leftKind} with ${rightKind}`, {
      explanation: isDevelopment
        ? "cannot compare values of different types. Convert one side first with `.date`, `.time`, or `.at('00:00', zone)`"
        : 0,
    });
  }
};

const asKindOf = (left, value) => {
  const rightKind = kindOf(value);
  const kind = kindOf(left);
  if (rightKind) {
    sameKind(kind, rightKind);
    return value;
  }
  if (kind === 'datetime') {
    // parse wall-clock strings in left's zone rather than the default zone
    return new DateTime(value, left.zone);
  }
  if (kind === 'yearMonth') {
    return new YearMonth(value);
  }
  return kind === 'date' ? new CalendarDate(value) : new Time(value);
};

export const compare = (a, b) => {
  if (a?.[IS_DURATION]) {
    return a.compare(b);
  }
  if (a?.[IS_RANGE]) {
    sameKind(kindOf(a), kindOf(b));
    return compare(a.start, b.start) || compare(a.end, b.end);
  }
  const left = point(a);
  const right = asKindOf(left, b);
  return left.isBefore(right) ? -1 : left.isAfter(right) ? 1 : 0;
};

const pick = (values, verb, dir) => {
  const raw = values.length === 1 && isArray(values[0]) ? values[0] : values;
  if (!raw.length) {
    refuse('missingPoints', verb, { explanation: isDevelopment ? `\`${verb}()\` requires at least one value` : 0 });
  }
  const head = point(raw[0]);
  const points = raw.map((value, index) => (index === 0 ? head : asKindOf(head, value)));
  return points.reduce((best, next) => (compare(next, best) === dir ? next : best));
};

export const earliest = (...values) => pick(values, 'earliest', -1);

export const latest = (...values) => pick(values, 'latest', 1);
