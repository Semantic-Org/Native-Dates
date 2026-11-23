import { isArray, isDate, isNumber, isString } from './utils.js';

import { CalendarDate } from '../calendar-date.js';
import { DateTime } from '../date-time.js';
import { Time } from '../time.js';
import { YearMonth } from '../year-month.js';
import { isDevelopment } from './environment.js';
import { refuse, refuseType } from './errors.js';
import {
  IS_CALENDAR_DATE,
  IS_DATE_RANGE,
  IS_DATE_TIME,
  IS_DATE_TIME_RANGE,
  IS_DURATION,
  IS_MONTH_DAY,
  IS_RANGE,
  IS_TIME,
  IS_TIME_RANGE,
  IS_YEAR_MONTH,
} from './identity.js';
import { isInstant, isPlainDate, isPlainDateTime, isPlainTime, isZonedDateTime } from './units.js';

const looksLikeTime = /^\d{1,2}(?::\d{2}){0,2}(?:\.\d+)?\s*(?:[ap]\.?m\.?)?$/i;
const looksLikeDateTime = /[T ]\d|[zZ]$|\[[^\]]+\]$/;

export const point = (input) => {
  // YearMonth is ordered on the timeline too, so earliest() and latest() accept it
  if (input?.[IS_DATE_TIME] || input?.[IS_CALENDAR_DATE] || input?.[IS_TIME] || input?.[IS_YEAR_MONTH]) {
    return input;
  }
  if (isString(input)) {
    const text = input.trim();
    if (looksLikeTime.test(text)) {
      return new Time(text);
    }
    if (looksLikeDateTime.test(text)) {
      return new DateTime(text);
    }
    return new CalendarDate(text);
  }
  // bare numbers default to epoch ms when first (compare(Date.now(), dt)), whereas asKindOf() below
  // coerces a trailing number to match the leading argument (compare(time('09:00'), 9))
  if (isDate(input) || isNumber(input) || isZonedDateTime(input) || isInstant(input) || isPlainDateTime(input)) {
    return new DateTime(input);
  }
  if (isPlainDate(input)) {
    return new CalendarDate(input);
  }
  if (isPlainTime(input)) {
    return new Time(input);
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
  if (value?.[IS_DATE_RANGE]) {
    return 'dateRange';
  }
  if (value?.[IS_DATE_TIME_RANGE]) {
    return 'datetimeRange';
  }
  if (value?.[IS_TIME_RANGE]) {
    return 'timeRange';
  }
  if (value?.[IS_YEAR_MONTH]) {
    return 'yearMonth';
  }
  return undefined;
};

const sameKind = (left, right) => {
  if (kindOf(left) !== kindOf(right)) {
    refuseType('conflictingKinds', `${kindOf(left)} with ${kindOf(right)}`, {
      explanation: isDevelopment
        ? "cannot compare values of different types. Convert one side first with `.date`, `.time`, or `.at('00:00', zone)`"
        : 0,
    });
  }
};

const asKindOf = (left, value) => {
  if (kindOf(value) !== undefined) {
    return value;
  }
  const kind = kindOf(left);
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
  // YearMonth.compare() coerces CalendarDate and DateTime, so reject other branded kinds here first
  if (a?.[IS_YEAR_MONTH]) {
    if (kindOf(b) !== undefined) {
      sameKind(a, b);
    }
    return a.compare(b);
  }
  if (a?.[IS_RANGE]) {
    sameKind(a, b);
    return compare(a.start, b.start) || compare(a.end, b.end);
  }
  const left = point(a);
  const right = asKindOf(left, b);
  sameKind(left, right);
  return left.isBefore(right) ? -1 : left.isAfter(right) ? 1 : 0;
};

const pick = (values, verb, wins) => {
  const raw = values.length === 1 && isArray(values[0]) ? values[0] : values;
  if (!raw.length) {
    refuse('missingPoints', verb, { explanation: isDevelopment ? `\`${verb}()\` requires at least one value` : 0 });
  }
  const head = point(raw[0]);
  const points = raw.map((value, index) => (index === 0 ? head : asKindOf(head, value)));
  return points.reduce((best, next) => (wins(compare(next, best)) ? next : best));
};

export const earliest = (...values) => pick(values, 'earliest', (order) => order < 0);

export const latest = (...values) => pick(values, 'latest', (order) => order > 0);
