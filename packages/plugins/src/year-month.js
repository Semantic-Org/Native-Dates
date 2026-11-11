import { CalendarDate, DateTime, IS_YEAR_MONTH, today } from 'native-dates';
import { guard, loosely, refuse, refuseType, setYearMonthExtension, unreadable } from 'native-dates/helpers/errors';
import { fieldsFrom, temporalDurationOf } from 'native-dates/helpers/fields';
import { epochOf, formatter } from 'native-dates/helpers/format';
import { isDevelopment, isNumber, isObject, isPlainObject, isString } from 'native-dates/helpers/types';
import { inspect, isDigits, singularKeys, unit, wholeNumbers, withParts } from 'native-dates/helpers/units';
import { zoneId } from 'native-dates/helpers/zones';

/*
  a year and a month with no day: a billing period, a card's expiry, what a month picker holds. it
  counts in months and years, and hands over any one of its days as a date
*/

// '2026-11', what <input type="month"> writes
const noDay = /^[+-]?\d{4,6}-\d{2}$/;

// the parts of a formatted date that only a day can answer
const dayParts = ['day', 'weekday'];

// a number, or one written as text, the way a form carries it
const isCount = (value) => isNumber(value) || isDigits(value);

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
  };

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
    if (isString(input) && noDay.test(input.trim())) {
      return guard(
        () => Temporal.PlainYearMonth.from(input.trim()),
        'unreadableYearMonth',
        input,
        isDevelopment ? "months run 01 through 12: '2026-11'" : 0,
      );
    }
    if (isPlainObject(input)) {
      const fields = singularKeys(input);
      if (!('day' in fields)) {
        return YearMonth.#fromFields(fields, JSON.stringify(input));
      }
    }
    return YearMonth.#fromDate(input, settings);
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

  // anything a date reads carries its day along. text that reads as neither is refused as a
  // year-month, where a value with a day in it was a date and keeps the date's own refusal
  static #fromDate(input, { zone, loose, dayFirst }) {
    try {
      const day = input instanceof CalendarDate
        ? input
        : new CalendarDate(input, loose ? { zone, loose, dayFirst } : { zone });
      return day.toTemporal().withCalendar('iso8601').toPlainYearMonth();
    }
    catch (error) {
      if (!isString(input) || error.code !== 'unreadableDate') {
        throw error;
      }
      return refuse('unreadableYearMonth', input, {
        explanation: isDevelopment
          ? "a year-month is '2026-11', or a date like '2026-11-16' with its day dropped. plugins/loose adds { loose: true } for what Date reads"
          : 0,
      });
    }
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
    YearMonth.#refuseSmaller(
      Object.keys(fields).find((field) => field !== 'years' && field !== 'months' && fields[field]),
    );
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
    YearMonth.#refuseSmaller(Object.keys(changes).find((part) => part !== 'year' && part !== 'month'));
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

  /*******************************
              Output
  *******************************/

  format(spec = 'medium', locale) {
    const options = isPlainObject(spec)
      ? spec
      : Object.hasOwn(YearMonth.presets, spec)
      ? YearMonth.presets[spec]
      : refuse('unknownFormat', String(spec), {
        explanation: isDevelopment
          ? "a year-month formats as 'short', 'medium' or 'long', or with an Intl options object"
          : 0,
      });
    const parts = formatter('date', options, locale)
      .formatToParts(epochOf('date', { year: this.year, month: this.month, day: 1 }));
    const missing = parts.find((part) => dayParts.includes(part.type));
    if (missing) {
      refuse('noField', `${missing.type} in ${JSON.stringify(options)}`, {
        explanation: isDevelopment
          ? 'a year-month has no day to print. pick one first: yearMonth.on(15).format(spec)'
          : 0,
      });
    }
    return parts.map((part) => part.value).join('');
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

export const isYearMonth = (value) => value instanceof YearMonth;

// a date and a datetime hand over their year-month, the way a datetime hands over its date
for (const Kind of [CalendarDate, DateTime]) {
  Object.defineProperty(Kind.prototype, 'yearMonth', {
    configurable: true,
    get() {
      return new YearMonth(this);
    },
  });
}

// date(2026, 11) names a year and a month and no day, so core hands its two numbers here
setYearMonthExtension((year, month) => new YearMonth(year, month));
