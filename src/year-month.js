import { isObject, isPlainObject, isString } from './helpers/utils.js';

import { CalendarDate, today } from './calendar-date.js';
import { isDevelopment } from './helpers/environment.js';
import {
  guard,
  loosely,
  parseLooseParts,
  readAs,
  refuse,
  refuseType,
  requireLoose,
  unreadable,
} from './helpers/errors.js';
import { fieldsFrom, temporalDurationOf } from './helpers/fields.js';
import { epochOf, partFormatter, partOptions } from './helpers/format.js';
import { IS_YEAR_MONTH } from './helpers/identity.js';
import { opensOnDate, wholeParts } from './helpers/parts.js';
import { formatTokens } from './helpers/tokens.js';
import {
  alias,
  inspect,
  isCount,
  isDigits,
  isPlainDate,
  localeOf,
  plural,
  singularKeys,
  unit,
  units,
  withParts,
} from './helpers/units.js';
import { cachedText, zoneId } from './helpers/zones.js';

/*
  a calendar year and month with no day (Temporal.PlainYearMonth), such as a billing period or card expiry.
  Arithmetic accepts only months, quarters, and years, and .on(day) clamps overflow days like 31 to the month's end
*/

const noDay = /^([+-]\d{6}|\d{4})[^\dA-Za-z:]{1,2}(\d{1,2})(?:[^\0-\u2fff]|\.)?$/;
const monthFirst = /^(\d{1,2})\s*[-/.]\s*(\d{2}|\d{4})$/;

const presets = {
  // 4-digit year so '11/2026' isn't misread as Nov 26 alongside MonthDay
  short: Object.freeze({ year: 'numeric', month: 'numeric' }),
  medium: Object.freeze({ year: 'numeric', month: 'short' }),
  long: Object.freeze({ year: 'numeric', month: 'long' }),
  full: Object.freeze({ year: 'numeric', month: 'long' }),
};

const smaller = units.slice(2);

export class YearMonth {
  // brand year month
  get [IS_YEAR_MONTH]() {
    return true;
  }
  static [Symbol.hasInstance](value) {
    return !!value?.[IS_YEAR_MONTH];
  }

  // base century added to two-digit years in monthYear('11/26')
  static century = 2000;

  #plain;
  #locale;

  // yearMonth(2026, 11), yearMonth(input, zone), or yearMonth(input, { zone, loose })
  constructor(input, monthOrOptions) {
    this.#locale = localeOf(monthOrOptions, input);
    this.#plain = YearMonth.#read(input, monthOrOptions);
    this.month = this.#plain.month;
    this.year = this.#plain.year;
    Object.freeze(this);
  }

  static #read(input, monthOrOptions) {
    if (isCount(input) && isCount(monthOrOptions)) {
      return YearMonth.#fromFields({ year: input, month: monthOrOptions });
    }
    const settings = isPlainObject(monthOrOptions)
      ? monthOrOptions
      : isString(monthOrOptions)
      ? { zone: monthOrOptions }
      : {};
    if (settings.zone !== undefined) {
      zoneId(settings.zone);
    }
    if (settings.loose) {
      requireLoose('loose');
    }
    if (input === undefined || input === null) {
      return refuseType('missingYearMonth', String(input), {
        explanation: isDevelopment
          ? 'a year-month value is required. Use `today().yearMonth` for the current year and month'
          : 0,
      });
    }
    if (!isString(input) && !isObject(input)) {
      return refuseType('invalidYearMonth', String(input), {
        explanation: isDevelopment
          ? "expected an ISO string like '2026-11', `(year, month)` numbers, a `{ year, month }` object, a `CalendarDate`, a `Date`, or a `Temporal` value"
          : 0,
      });
    }
    if (input instanceof YearMonth) {
      return input.toTemporal();
    }
    if (input instanceof Temporal.PlainYearMonth) {
      return input.calendarId === 'iso8601' ? input : refuseType('unsupportedCalendar', String(input), {
        explanation: isDevelopment
          ? "a `YearMonth` only stores dates in the ISO 8601 calendar. Pass `input.toPlainDate({ day: 1 })` to convert a specific day's month, or use `.on(day)` before formatting an ISO year-month in another calendar"
          : 0,
      });
    }
    if (isString(input)) {
      const text = input.trim();
      const yearFirst = noDay.exec(text);
      if (yearFirst) {
        const [, year, month] = yearFirst;
        return guard(
          () => Temporal.PlainYearMonth.from(`${year}-${month.padStart(2, '0')}`),
          'invalidYearMonth',
          input,
          // put isDevelopment first so minifiers dead-code-eliminate the range test too
          isDevelopment && (month < 1 || month > 12) ? "month must be between 01 and 12, such as '2026-11'" : 0,
        );
      }
      // avoid Date.parse() on partial strings: V8 silently fills in a default day or year (2001)
      if (!opensOnDate(text)) {
        const named = settings.loose && parseLooseParts(text, settings);
        return named?.year
          ? YearMonth.#fromFields({ year: named.year, month: named.month }, input)
          : refuse('invalidYearMonth', input, {
            explanation: isDevelopment
              ? "expected a year-month string like '2026-11' or '2026/11', or an ISO date like '2026-11-16'. Use `monthYear('11/26')` for month-first strings, or pass `{ loose: true }` with '@native-dates/plugins/loose' for month names like 'Nov 2026'"
              : 0,
          });
      }
    }
    if (isPlainObject(input)) {
      const fields = singularKeys(input);
      if (!('day' in fields)) {
        return YearMonth.#fromFields(fields, input);
      }
    }
    const plain = isPlainDate(input)
      ? input
      : (input instanceof CalendarDate
        ? input
        : new CalendarDate(input, { zone: settings.zone, locale: settings.locale })).toTemporal();
    return plain.withCalendar('iso8601').toPlainYearMonth();
  }

  static #fromFields(fields, at = fields) {
    return guard(
      () => Temporal.PlainYearMonth.from(wholeParts(fields, ['year', 'month']), { overflow: 'reject' }),
      'invalidYearMonth',
      at,
    );
  }

  /*******************************
              Reads
  *******************************/

  get quarter() {
    return Math.ceil(this.#plain.month / 3);
  }
  get daysInMonth() {
    return this.#plain.daysInMonth;
  }
  get daysInYear() {
    return this.#plain.daysInYear;
  }
  isLeapYear() {
    return this.#plain.inLeapYear;
  }
  get start() {
    return this.on(1);
  }
  get end() {
    return this.on(this.daysInMonth);
  }

  /*******************************
            Arithmetic
  *******************************/

  plus(amount, name) {
    return this.#next(
      guard(() => this.#plain.add(YearMonth.#monthFields(amount, name)), 'cannotAdd', `${amount} ${name ?? ''}`),
    );
  }

  minus(amount, name) {
    return this.#next(
      guard(
        () => this.#plain.subtract(YearMonth.#monthFields(amount, name)),
        'cannotSubtract',
        `${amount} ${name ?? ''}`,
      ),
    );
  }

  static #monthFields(amount, name) {
    const fields = fieldsFrom(amount, name);
    const found = smaller.find((part) => fields[plural(part)]);
    YearMonth.#refuseSmaller(found && plural(found));
    return temporalDurationOf(fields);
  }

  // Temporal.PlainYearMonth.add({ days: 5 }) silently drops sub-month remainders, so reject units below month
  static #refuseSmaller(name) {
    if (name) {
      refuse('unsupportedUnit', name, {
        explanation: isDevelopment
          ? 'a `YearMonth` has no day or clock fields, so it only accepts months or years. Choose a day first with `.on(15)` to work with smaller units'
          : 0,
      });
    }
  }

  set(fields, value) {
    const changes = isString(fields) ? { [unit(fields)]: value } : singularKeys(fields);
    YearMonth.#refuseSmaller(smaller.find((part) => part in changes));
    return this.#next(guard(() => withParts(this.#plain, changes), 'cannotSet', changes));
  }

  on(day) {
    const count = isDigits(day) ? Number(day) : day;
    if (!Number.isInteger(count) || count < 1 || count > 31) {
      refuse('invalidDay', `${this}-${day}`, {
        explanation: isDevelopment ? "expected an integer day from 1 to 31, such as `yearMonth('2026-11').on(15)`" : 0,
      });
    }
    return new CalendarDate(this.#plain.toPlainDate({ day: count }), { locale: this.#locale });
  }

  /*******************************
            Comparison
  *******************************/

  // coerces CalendarDate and DateTime to their year-month (top-level compare() rejects mixed kinds first)
  compare(other) {
    const rival = other instanceof YearMonth ? other : new YearMonth(other);
    return Temporal.PlainYearMonth.compare(this.#plain, rival.toTemporal());
  }

  equals(other) {
    return this.compare(other) === 0;
  }

  isBefore(other) {
    return this.compare(other) < 0;
  }

  isAfter(other) {
    return this.compare(other) > 0;
  }

  // parse through CalendarDate first so contains('2026-11') rejects a dayless year-month string
  contains(day) {
    return this.equals(new CalendarDate(day));
  }

  isPast(zone) {
    return this.isBefore(today(zone));
  }

  isFuture(zone) {
    return this.isAfter(today(zone));
  }

  /*******************************
             Measure
  *******************************/

  // CalendarDate.until() counts in days, so rebalance the span between month starts up to years
  until(other, name) {
    const rival = other instanceof YearMonth ? other : new YearMonth(other);
    const span = this.start.until(rival.start).balance('year');
    return name === undefined ? span : span.total(name);
  }

  since(other, name) {
    return new YearMonth(other, { locale: this.#locale }).until(this, name);
  }

  as(kind) {
    return readAs(kind, { yearMonth: () => this });
  }

  #next(plain) {
    return new YearMonth(plain, { locale: this.#locale });
  }

  /*******************************
              Output
  *******************************/

  locale(...tag) {
    return tag.length ? new YearMonth(this.#plain, { locale: tag[0] }) : this.#locale;
  }

  get text() {
    return cachedText(this);
  }

  format(spec, locale = this.#locale) {
    const options = partOptions(spec, ['year', 'month', 'era'], presets);
    return options
      ? partFormatter(options, locale).format(epochOf('date', { year: this.year, month: this.month, day: 1 }))
      : formatTokens(this, 'year-month', spec, locale);
  }

  toString() {
    return this.#plain.toString();
  }

  toJSON() {
    return this.#plain.toString();
  }

  toTemporal() {
    return this.#plain;
  }

  valueOf() {
    return refuse('unsupportedComparison', String(this), {
      explanation: isDevelopment
        ? 'a `YearMonth` cannot be converted to a number for `<`, `>`, or `-`. Compare values with `isBefore()`, `isAfter()`, or `equals()`, or measure the difference with `until()`'
        : 0,
    });
  }

  // '+' sends hint 'default', which would call valueOf() and throw without this
  [Symbol.toPrimitive](hint) {
    return hint === 'number' ? this.valueOf() : this.toString();
  }

  [inspect]() {
    return `YearMonth(${this.#plain})`;
  }
}

alias(YearMonth, { add: 'plus', subtract: 'minus', lang: 'locale', includes: 'contains' });

const unread = new Set([...unreadable.point, 'invalidYearMonth', 'missingYearMonth', 'unsupportedCalendar']);

export const yearMonth = (input, monthOrOptions) => {
  const build = () =>
    input instanceof YearMonth && monthOrOptions === undefined ? input : new YearMonth(input, monthOrOptions);
  return isPlainObject(monthOrOptions) && monthOrOptions.loose ? loosely(build, unread) : build();
};

export const monthYear = (input, yearOrOptions) => {
  if (isCount(input) && isCount(yearOrOptions)) {
    return yearMonth(inCentury(yearOrOptions), input);
  }
  const parts = isString(input) && monthFirst.exec(input.trim());
  return parts
    ? yearMonth({ year: inCentury(parts[2]), month: parts[1] }, yearOrOptions)
    : yearMonth(input, yearOrOptions);
};

// expand 1- or 2-digit positive years ('26' -> 2026) while keeping 4-digit '0043' and negative '-43' literal
const inCentury = (year) => {
  const count = Number(year);
  return count >= 0 && count < 100 && String(year).trim().length <= 2 ? YearMonth.century + count : count;
};

export const isYearMonth = (value) => value instanceof YearMonth;
