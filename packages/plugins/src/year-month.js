import { CalendarDate, DateTime, IS_YEAR_MONTH, today } from 'native-dates';
import { guard, loosely, readAs, refuse, refuseType, unreadable } from 'native-dates/helpers/errors';
import { fieldsFrom, temporalDurationOf } from 'native-dates/helpers/fields';
import { epochOf } from 'native-dates/helpers/format';
import { isDevelopment, isObject, isPlainObject, isString } from 'native-dates/helpers/types';
import {
  inspect,
  isCount,
  isDigits,
  plural,
  singularKeys,
  unit,
  units,
  wholeNumbers,
  withParts,
} from 'native-dates/helpers/units';
import { zoneId } from 'native-dates/helpers/zones';

import { partFormatter, partOptions } from './helpers/format.js';
import { opensOnDate } from './helpers/parts.js';

/*
  a year and a month with no day: a billing period, a card's expiry, what a month picker holds. it
  counts in months and years, and hands over any one of its days as a date
*/

// '2026-11', what <input type="month"> writes
const noDay = /^[+-]?\d{4,6}-\d{2}$/;

// a month and a year in the order a card prints them, '11/26' or '11/2026'
const monthFirst = /^(\d{1,2})[-/.](\d{2}|\d{4})$/;

// the units below a month, which a year-month has no room for
const smaller = units.slice(2);

export class YearMonth {
  // brand year month
  get [IS_YEAR_MONTH]() {
    return true;
  }
  static [Symbol.hasInstance](value) {
    return !!value?.[IS_YEAR_MONTH];
  }

  static presets = {
    short: Object.freeze({ year: '2-digit', month: 'numeric' }),
    medium: Object.freeze({ year: 'numeric', month: 'short' }),
    long: Object.freeze({ year: 'numeric', month: 'long' }),
    full: Object.freeze({ year: 'numeric', month: 'long' }),
  };

  // the century a two-digit year is read in: monthYear('11/26') is November 2026
  static century = 2000;

  #plain;

  // yearMonth(2026, 11), yearMonth(input, zone), or yearMonth(input, { zone, loose })
  constructor(input, monthOrOptions) {
    this.#plain = YearMonth.#read(input, monthOrOptions);
    // the parts are own properties, so a value prints them in a console without a click. the text is
    // keyed first so a preview leads with it, and filled once the parts it reads are in
    this.text = undefined;
    this.month = this.#plain.month;
    this.year = this.#plain.year;
    this.text = this.format();
    Object.freeze(this);
  }

  // a value with a day in it reads as a date and loses the day. one without reads as a year-month
  static #read(input, monthOrOptions) {
    if (isCount(input) && isCount(monthOrOptions)) {
      return YearMonth.#fromFields({ year: Number(input), month: Number(monthOrOptions) });
    }
    const settings = isPlainObject(monthOrOptions)
      ? monthOrOptions
      : isString(monthOrOptions)
      ? { zone: monthOrOptions }
      : {};
    // the zone resolves first so a bad one throws even when the input turns out unreadable
    if (settings.zone !== undefined) {
      zoneId(settings.zone);
    }
    if (input === undefined || input === null) {
      return refuseType('notAYearMonth', String(input), {
        explanation: isDevelopment
          ? 'today().yearMonth is the current one. a missing value is refused so an absent field never silently becomes this month'
          : 0,
      });
    }
    if (!isString(input) && !isObject(input)) {
      return refuseType('notAYearMonth', String(input), {
        explanation: isDevelopment
          ? "a year-month is '2026-11', two numbers, a fields object, a date, or a Temporal value"
          : 0,
      });
    }
    if (input instanceof YearMonth) {
      return input.toTemporal();
    }
    if (input instanceof Temporal.PlainYearMonth) {
      return input.calendarId === 'iso8601' ? input : refuseType('notAYearMonth', String(input), {
        explanation: isDevelopment ? 'a year-month is read in the ISO calendar' : 0,
      });
    }
    if (isString(input)) {
      if (noDay.test(input.trim())) {
        return guard(
          () => Temporal.PlainYearMonth.from(input.trim()),
          'unreadableYearMonth',
          input,
          isDevelopment ? "months run 01 through 12: '2026-11'" : 0,
        );
      }
      // text that opens on a whole date is a date, and so is whatever Date reads when loose
      if (!opensOnDate(input) && !settings.loose) {
        return refuse('unreadableYearMonth', input, {
          explanation: isDevelopment
            ? "a year-month is '2026-11', or a date like '2026-11-16' with its day dropped. plugins/loose adds { loose: true } for what Date reads"
            : 0,
        });
      }
    }
    if (isPlainObject(input)) {
      const fields = singularKeys(input);
      if (!('day' in fields)) {
        return YearMonth.#fromFields(fields, JSON.stringify(input));
      }
    }
    // anything else is whatever a date reads, a date's own refusals included
    const day = input instanceof CalendarDate
      ? input
      : new CalendarDate(input, settings.loose ? settings : { zone: settings.zone });
    return day.toTemporal().withCalendar('iso8601').toPlainYearMonth();
  }

  static #fromFields(fields, at = JSON.stringify(fields)) {
    return guard(
      () => {
        if (!wholeNumbers(Object.values(fields))) {
          throw new RangeError('a year-month reads whole numbers');
        }
        return Temporal.PlainYearMonth.from(fields, { overflow: 'reject' });
      },
      'unreadableYearMonth',
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
  // the first and the last day, the two a range of this month runs between
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
    return new YearMonth(
      guard(() => this.#plain.add(YearMonth.#monthFields(amount, name)), 'cannotAdd', `${amount} ${name ?? ''}`),
    );
  }

  minus(amount, name) {
    return new YearMonth(
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

  // Temporal folds days added to a year-month into whole months and drops the rest, so a unit smaller
  // than a month is refused before it gets there, the way a date refuses hours
  static #refuseSmaller(name) {
    if (name) {
      refuse('notAYearMonthUnit', name, {
        explanation: isDevelopment
          ? 'a year-month counts in months and years. pick a day first for anything smaller: yearMonth.on(15)'
          : 0,
      });
    }
  }

  set(fields, value) {
    const changes = isString(fields) ? { [unit(fields)]: value } : singularKeys(fields);
    YearMonth.#refuseSmaller(smaller.find((part) => part in changes));
    return new YearMonth(
      guard(() => withParts(this.#plain, changes), 'cannotSet', JSON.stringify(changes)),
    );
  }

  // the date of one of its days. the 31st is the last day of a month without one, as Temporal places it
  on(day) {
    const count = isDigits(day) ? Number(day) : day;
    if (!Number.isInteger(count) || count < 1 || count > 31) {
      refuse('unreadableDate', `${this}-${day}`, {
        explanation: isDevelopment ? 'a day is a whole number from 1 through 31: yearMonth.on(15)' : 0,
      });
    }
    return new CalendarDate(this.#plain.toPlainDate({ day: count }));
  }

  /*******************************
            Comparison
  *******************************/

  // a sort comparator. a date beside a year-month reads as the month it falls in
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

  // whether a day falls in this month
  contains(day) {
    return this.equals(new CalendarDate(day));
  }

  // past once its last day is, and future until its first. this month depends on where you stand,
  // so these take the zone to judge from
  isPast(zone) {
    return this.isBefore(today(zone));
  }

  isFuture(zone) {
    return this.isAfter(today(zone));
  }

  /*******************************
             Measure
  *******************************/

  // the months from this one to another, as a duration that remembers where it started. with a
  // unit, the total as a number
  until(other, name) {
    const rival = other instanceof YearMonth ? other : new YearMonth(other);
    return this.start.until(rival.start, name);
  }

  since(other, name) {
    const rival = other instanceof YearMonth ? other : new YearMonth(other);
    return rival.until(this, name);
  }

  as(kind) {
    return readAs(kind, { yearMonth: () => this });
  }

  /*******************************
              Output
  *******************************/

  format(spec = 'medium', locale) {
    const options = partOptions(spec, ['year', 'month'], YearMonth.presets);
    return partFormatter(options, locale).format(epochOf('date', { year: this.year, month: this.month, day: 1 }));
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
    return refuse('notANumber', String(this), {
      explanation: isDevelopment
        ? 'a year-month is not a point on the number line. compare with isBefore, isAfter or equals, or measure with until'
        : 0,
    });
  }

  // + gives the string, while < and - still refuse through valueOf
  [Symbol.toPrimitive](hint) {
    return hint === 'number' ? this.valueOf() : this.toString();
  }

  [inspect]() {
    return `YearMonth(${this.#plain})`;
  }
}

YearMonth.prototype.add = YearMonth.prototype.plus;
YearMonth.prototype.subtract = YearMonth.prototype.minus;
YearMonth.prototype.remove = YearMonth.prototype.minus;

const unread = new Set([...unreadable.point, 'unreadableYearMonth', 'notAYearMonth']);

// with { loose: true } (via plugins/loose) an unreadable input is null, never a throw
export const yearMonth = (input, monthOrOptions) => {
  const build = () =>
    input instanceof YearMonth && monthOrOptions === undefined ? input : new YearMonth(input, monthOrOptions);
  return isPlainObject(monthOrOptions) && monthOrOptions.loose ? loosely(build, unread) : build();
};

// the same value read month first, the order a card prints it: monthYear('11/26') is
// yearMonth('2026-11'). ISO's '2026-11' is year first under both words
export const monthYear = (input, yearOrOptions) => {
  const century = (year) => (Number(year) < 100 ? YearMonth.century + Number(year) : year);
  if (isCount(input) && isCount(yearOrOptions)) {
    return yearMonth(century(yearOrOptions), input);
  }
  const parts = isString(input) && monthFirst.exec(input.trim());
  const build = () => (parts ? new YearMonth(century(parts[2]), parts[1]) : new YearMonth(input, yearOrOptions));
  return isPlainObject(yearOrOptions) && yearOrOptions.loose ? loosely(build, unread) : build();
};

export const isYearMonth = (value) => value instanceof YearMonth;

// a date and a datetime hand over their year-month, the way a datetime hands over its date, by the
// property or by as('yearMonth')
for (const Kind of [CalendarDate, DateTime]) {
  Object.defineProperty(Kind.prototype, 'yearMonth', {
    configurable: true,
    get() {
      return new YearMonth(this);
    },
  });
  const as = Kind.prototype.as;
  Kind.prototype.as = function(kind, zone) {
    return kind === 'yearMonth' ? this.yearMonth : as.call(this, kind, zone);
  };
}
