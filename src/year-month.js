import { isObject, isPlainObject, isString } from './helpers/utils.js';

import { CalendarDate, today } from './calendar-date.js';
import { isDevelopment } from './helpers/environment.js';
import { guard, loosely, readAs, refuse, refuseType, requireLoose, unreadable } from './helpers/errors.js';
import { fieldsFrom, temporalDurationOf } from './helpers/fields.js';
import { epochOf, partFormatter, partOptions } from './helpers/format.js';
import { IS_YEAR_MONTH } from './helpers/identity.js';
import { monthNamed, opensOnDate, wholeParts } from './helpers/parts.js';
import { formatTokens } from './helpers/tokens.js';
import {
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
import { zoneId } from './helpers/zones.js';

/*
  a year and a month with no day: a billing period, a card's expiry, what a month picker holds. it
  counts in months and years, and hands over any one of its days as a date
*/

// '2026-11', '2026/11', '2026.11', or '2026-5': a four-digit (or signed six-digit) year first
const noDay = /^([+-]\d{6}|\d{4})[-/.](\d{1,2})$/;

// a month and a year in the order a card prints them, '11/26' or '11/2026'
const monthFirst = /^(\d{1,2})[-/.](\d{2}|\d{4})$/;

// a month by its name and a year, in either order: 'Nov 2026', '2026 November', 'novembre 2026'
const nameAndYear = /^(?:([\p{L}\p{M}]{3,})\.?,?\s+(?:de\s+)?(\d{4})|(\d{4})\s+([\p{L}\p{M}]{3,})\.?)$/iu;

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
    // four digits, since 11/26 reads as a day beside a month
    short: Object.freeze({ year: 'numeric', month: 'numeric' }),
    medium: Object.freeze({ year: 'numeric', month: 'short' }),
    long: Object.freeze({ year: 'numeric', month: 'long' }),
    full: Object.freeze({ year: 'numeric', month: 'long' }),
  };

  // the century a two-digit year is read in: monthYear('11/26') is November 2026
  static century = 2000;

  #plain;
  #locale;

  // yearMonth(2026, 11), yearMonth(input, zone), or yearMonth(input, { zone, loose })
  constructor(input, monthOrOptions) {
    this.#plain = YearMonth.#read(input, monthOrOptions);
    this.#locale = localeOf(monthOrOptions, input);
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
      return YearMonth.#fromFields({ year: input, month: monthOrOptions });
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
    if (settings.loose) {
      requireLoose('loose');
    }
    if (input === undefined || input === null) {
      return refuseType('missingYearMonth', String(input), {
        explanation: isDevelopment
          ? 'a year-month value is required. use `today().yearMonth` for the current year and month'
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
          ? "a `YearMonth` only stores dates in the ISO 8601 calendar. pass `input.toPlainDate({ day: 1 })` to convert a specific day's month, or use `.on(day)` before formatting an ISO year-month in another calendar"
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
          // isDevelopment leads, so a production build folds the whole line away, test and all
          isDevelopment && (month < 1 || month > 12) ? "month must be between 01 and 12, such as '2026-11'" : 0,
        );
      }
      // text that opens on a whole date is a date. no other text is ever put to Date, which makes up
      // the parts text leaves out: 2001 for a missing year, January for a missing month. when loose,
      // a year-month is also a month by name and a year
      if (!opensOnDate(text)) {
        const named = settings.loose ? nameAndYear.exec(text) : null;
        const month = named && monthNamed(named[1] ?? named[4], settings.locale);
        return month
          ? YearMonth.#fromFields({ year: named[2] ?? named[3], month }, input)
          : refuse('invalidYearMonth', input, {
            explanation: isDevelopment
              ? "expected a year-month string like '2026-11' or '2026/11', or an ISO date like '2026-11-16'. use `monthYear('11/26')` for month-first strings, or pass `{ loose: true }` with '@native-dates/plugins/loose' for month names like 'Nov 2026'"
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
    // anything else is whatever a date reads, a date's own refusals included. a Temporal date needs
    // no reading, and date() refuses one beside a zone
    const plain = isPlainDate(input)
      ? input
      : (input instanceof CalendarDate ? input : new CalendarDate(input, { zone: settings.zone })).toTemporal();
    return plain.withCalendar('iso8601').toPlainYearMonth();
  }

  static #fromFields(fields, at = JSON.stringify(fields)) {
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

  // Temporal folds days added to a year-month into whole months and drops the rest, so a unit smaller
  // than a month is refused before it gets there, the way a date refuses hours
  static #refuseSmaller(name) {
    if (name) {
      refuse('unsupportedUnit', name, {
        explanation: isDevelopment
          ? 'a `YearMonth` has no day or clock fields, so it only accepts months or years. choose a day first with `.on(15)` to work with smaller units'
          : 0,
      });
    }
  }

  set(fields, value) {
    const changes = isString(fields) ? { [unit(fields)]: value } : singularKeys(fields);
    YearMonth.#refuseSmaller(smaller.find((part) => part in changes));
    return this.#next(
      guard(() => withParts(this.#plain, changes), 'cannotSet', JSON.stringify(changes)),
    );
  }

  // the date of one of its days. the 31st is the last day of a month without one, as Temporal places it
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

  // the locale this value is written in, or the same value written in another. an unset tag clears it
  locale(...tag) {
    return tag.length ? new YearMonth(this.#plain, { locale: tag[0] }) : this.#locale;
  }

  format(spec = 'medium', locale = this.#locale) {
    const options = partOptions(spec, ['year', 'month', 'era'], YearMonth.presets);
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
        ? 'a `YearMonth` cannot be converted to a number for `<`, `>`, or `-`. compare values with `isBefore()`, `isAfter()`, or `equals()`, or measure the difference with `until()`'
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
YearMonth.prototype.lang = YearMonth.prototype.locale;

const unread = new Set([...unreadable.point, 'invalidYearMonth', 'missingYearMonth', 'unsupportedCalendar']);

// with { loose: true } (via plugins/loose) an unreadable input is null, never a throw
export const yearMonth = (input, monthOrOptions) => {
  const build = () =>
    input instanceof YearMonth && monthOrOptions === undefined ? input : new YearMonth(input, monthOrOptions);
  return isPlainObject(monthOrOptions) && monthOrOptions.loose ? loosely(build, unread) : build();
};

// the same value read month first, the order a card prints it: monthYear('11/26') is
// yearMonth('2026-11'). ISO's '2026-11' is year first under both words
export const monthYear = (input, yearOrOptions) => {
  if (isCount(input) && isCount(yearOrOptions)) {
    return yearMonth(inCentury(yearOrOptions), input);
  }
  const parts = isString(input) && monthFirst.exec(input.trim());
  return parts
    ? yearMonth({ year: inCentury(parts[2]), month: parts[1] }, yearOrOptions)
    : yearMonth(input, yearOrOptions);
};

// only a year written in two digits is short for one in the century: 26 is 2026, where 0043 and -43
// are the years they say
const inCentury = (year) => {
  const count = Number(year);
  return count >= 0 && count < 100 && String(year).trim().length <= 2 ? YearMonth.century + count : count;
};

export const isYearMonth = (value) => value instanceof YearMonth;
