import { isObject, isPlainObject, isString } from '@semantic-ui/utils';

import { CalendarDate, today } from './calendar-date.js';
import { isDevelopment } from './helpers/environment.js';
import { guard, loosely, readAs, refuse, refuseType, requireLoose, unreadable } from './helpers/errors.js';
import { epochOf, partFormatter, partOptions } from './helpers/format.js';
import { IS_MONTH_DAY } from './helpers/identity.js';
import { monthNamed, opensOnDate, wholeParts } from './helpers/parts.js';
import { formatTokens } from './helpers/tokens.js';
import { inspect, isCount, isDigits, isPlainDate, localeOf, singularKeys, zoneOptions } from './helpers/units.js';
import { zoneId } from './helpers/zones.js';

/*
  a month and a day with no year: a birthday, an anniversary, a holiday. it comes around once a year,
  and Feb 29 falls on Feb 28 in a year without one, the way Temporal places it
*/

// ISO's month and day, two digits a side across a dash: '10-17'. it is month first whoever reads it,
// so what toJSON() writes reads back under either word
const isoParts = /^(\d{2})-(\d{2})$/;

// a month and a day as people write them, across a dash, a slash or a dot: '10/17', '17.10', '5-6'.
// which part leads is for the word that reads it to say
const twoParts = /^(\d{1,2})[-/.](\d{1,2})$/;

// a month by its name and a day, in either order: 'Oct 17', '17th October', '17. Oktober', '17 de octubre'
const nameAndDay =
  /^(?:([\p{L}\p{M}]{3,})\.?,?\s+(\d{1,2})(?:st|nd|rd|th|\.)?|(\d{1,2})(?:st|nd|rd|th|\.)?\s+(?:de\s+)?([\p{L}\p{M}]{3,})\.?),?$/iu;

// a leap year to stand on, so Feb 29 has a day in it. Temporal keeps 1972 for the same reason
const leapYear = 1972;

export class MonthDay {
  // brand month day
  get [IS_MONTH_DAY]() {
    return true;
  }
  static [Symbol.hasInstance](value) {
    return !!value?.[IS_MONTH_DAY];
  }

  static presets = {
    short: Object.freeze({ month: 'numeric', day: 'numeric' }),
    medium: Object.freeze({ month: 'short', day: 'numeric' }),
    long: Object.freeze({ month: 'long', day: 'numeric' }),
    full: Object.freeze({ month: 'long', day: 'numeric' }),
  };

  #plain;
  #locale;

  // monthDay(10, 17), monthDay(input, zone), or monthDay(input, { zone, loose, dayFirst })
  constructor(input, dayOrOptions) {
    this.#plain = MonthDay.#read(input, dayOrOptions);
    this.#locale = localeOf(dayOrOptions, input);
    // the parts are own properties, so a value prints them in a console without a click. the text is
    // keyed first so a preview leads with it, and filled once the parts it reads are in
    this.text = undefined;
    // Temporal names this month by its code, since a number means nothing without a year in a
    // lunisolar calendar. in the ISO calendar the code is the number
    this.month = Number(this.#plain.monthCode.slice(1));
    this.day = this.#plain.day;
    this.text = this.format();
    Object.freeze(this);
  }

  // a value with a year in it is a date, and reads as the month and day it falls on
  static #read(input, dayOrOptions) {
    if (isCount(input) && isCount(dayOrOptions)) {
      return MonthDay.#fromParts({ month: input, day: dayOrOptions });
    }
    const settings = zoneOptions(dayOrOptions);
    // the zone resolves first so a bad one throws even when the input turns out unreadable
    if (settings.zone !== undefined) {
      zoneId(settings.zone);
    }
    if (settings.loose) {
      requireLoose('loose');
    }
    if (input === undefined || input === null) {
      return refuseType('missingMonthDay', String(input), {
        explanation: isDevelopment
          ? "a month-day value is required. use `today().monthDay` for today's month and day"
          : 0,
      });
    }
    if (!isString(input) && !isObject(input)) {
      return refuseType('invalidMonthDay', String(input), {
        explanation: isDevelopment
          ? "expected a string like '10-17' or '10/17', `(month, day)` numbers, a `{ month, day }` object, a `CalendarDate`, a `Date`, or a `Temporal` value"
          : 0,
      });
    }
    if (input instanceof MonthDay) {
      return input.toTemporal();
    }
    if (input instanceof Temporal.PlainMonthDay) {
      // rebuilt from its parts, so the year Temporal keeps behind one never tells two apart
      return input.calendarId === 'iso8601'
        ? Temporal.PlainMonthDay.from({ monthCode: input.monthCode, day: input.day })
        : refuseType('unsupportedCalendar', String(input), {
          explanation: isDevelopment
            ? 'a `MonthDay` only stores dates in the ISO 8601 calendar. convert to ISO first. to display one in another calendar, place it in a year with `.in(year)` and format that date'
            : 0,
        });
    }
    if (isString(input)) {
      return MonthDay.#fromText(input, settings);
    }
    if (isPlainObject(input)) {
      const fields = singularKeys(input);
      if (!('year' in fields)) {
        return MonthDay.#fromParts(fields, JSON.stringify(input));
      }
    }
    return MonthDay.#dayOf(input, settings.zone).toPlainMonthDay();
  }

  static #fromParts(parts, at = JSON.stringify(parts), explanation) {
    return guard(
      () => Temporal.PlainMonthDay.from(wholeParts(parts, ['month', 'day']), { overflow: 'reject' }),
      'invalidMonthDay',
      at,
      explanation,
    );
  }

  static #fromText(input, settings) {
    const text = input.trim();
    // ISO marks a month-day with two dashes, '--10-17' or '--1017', and Temporal reads both
    if (text.startsWith('--')) {
      return guard(() => Temporal.PlainMonthDay.from(text), 'invalidMonthDay', input);
    }
    const parts = isoParts.exec(text) ?? twoParts.exec(text);
    if (parts) {
      const [, first, second] = parts;
      const [month, day] = settings.dayFirst && !isoParts.test(text) ? [second, first] : [first, second];
      return MonthDay.#fromParts(
        { month, day },
        input,
        isDevelopment
          ? `parsed as month ${month} and day ${day}, which is not a valid calendar date. \`monthDay()\` reads month-first ('10/17') and \`dayMonth()\` reads day-first ('17/10'), though ISO 'MM-DD' strings with a hyphen are always read month-first`
          : 0,
      );
    }
    // text that opens on a whole ISO date is a date, read as strictly as date() reads one
    if (opensOnDate(text)) {
      return MonthDay.#dayOf(input, settings.zone).toPlainMonthDay();
    }
    // no text is ever put to Date, which makes up the parts text leaves out: a year with no Feb 29
    // in it, the 1st, the month after a day too many. when loose, a month-day is also a month by
    // name and a day
    const named = settings.loose ? nameAndDay.exec(text) : null;
    const month = named && monthNamed(named[1] ?? named[4]);
    return month
      ? MonthDay.#fromParts({ month, day: named[2] ?? named[3] }, input)
      : refuse('invalidMonthDay', input, {
        explanation: isDevelopment
          ? "expected a month-day string like '10-17' or '10/17', or an ISO date like '1990-10-17'. use `dayMonth('17/10')` for day-first strings, or pass `{ loose: true }` with '@native-dates/plugins/loose' for month names like 'Oct 17'"
          : 0,
      });
  }

  // the ISO date of anything a date reads, a date's own refusals included. a Temporal date needs no
  // reading, and date() refuses one beside a zone
  static #dayOf(value, zone) {
    if (isPlainDate(value)) {
      return value.withCalendar('iso8601');
    }
    const day = value instanceof CalendarDate ? value : new CalendarDate(value, { zone });
    return day.toTemporal().withCalendar('iso8601');
  }

  // where Temporal places a month-day in a year, or nothing in the first and the last year it
  // counts, where its dates run out partway through
  static #placed(plain, year) {
    try {
      return plain.toPlainDate({ year });
    }
    catch {
      return undefined;
    }
  }

  /*******************************
            Arithmetic
  *******************************/

  // the date this falls on in a year
  in(year) {
    const count = isDigits(year) ? Number(year) : year;
    if (!Number.isInteger(count)) {
      refuse('invalidYear', `${year}-${this}`, {
        explanation: isDevelopment ? 'expected an integer year, such as `monthDay(10, 17).in(2027)`' : 0,
      });
    }
    return new CalendarDate(
      guard(() => this.#plain.toPlainDate({ year: count }), 'invalidYear', `${count}-${this}`),
      { locale: this.#locale },
    );
  }

  // the occurrence strictly after a day, or strictly before it. the day itself never counts, the way
  // next('monday') on a monday is a week away. date.next(monthDay) and date.previous(monthDay) ask here
  after(day) {
    const from = MonthDay.#dayOf(day);
    const thisYear = MonthDay.#placed(this.#plain, from.year);
    return thisYear && Temporal.PlainDate.compare(thisYear, from) > 0
      ? new CalendarDate(thisYear, { locale: this.#locale })
      : this.in(from.year + 1);
  }

  before(day) {
    const from = MonthDay.#dayOf(day);
    const thisYear = MonthDay.#placed(this.#plain, from.year);
    return thisYear && Temporal.PlainDate.compare(thisYear, from) < 0
      ? new CalendarDate(thisYear, { locale: this.#locale })
      : this.in(from.year - 1);
  }

  // the same two counted from today when no day is given: birthday.next() is the one coming up
  next(day = today()) {
    return this.after(day);
  }

  previous(day = today()) {
    return this.before(day);
  }

  as(kind) {
    return readAs(kind, { monthDay: () => this });
  }

  /*******************************
            Comparison
  *******************************/

  // the same month and day. a date beside a month-day reads as the month and day it falls on, so
  // two birthdays are equal or not whichever one asks. whether a date is the occurrence is fallsOn()
  equals(other) {
    // text as people write it has an order only under the word that read it, and equals has none
    if (isString(other) && twoParts.test(other.trim()) && !isoParts.test(other.trim())) {
      refuse('invalidMonthDay', other, {
        explanation: isDevelopment
          ? "slash and dot strings like '05/10' are ambiguous between month-first and day-first. pass an ISO string like '10-17', or wrap the string with `monthDay()` or `dayMonth()` first"
          : 0,
      });
    }
    return this.#plain.equals(MonthDay.#read(other));
  }

  // whether a date is this month-day's occurrence in the date's own year, so Feb 29 falls on Feb 28
  // in a year without one
  fallsOn(day) {
    const date = MonthDay.#dayOf(day);
    return !!MonthDay.#placed(this.#plain, date.year)?.equals(date);
  }

  // today depends on where you stand, so these take the zone to judge from
  isToday(zone) {
    return this.fallsOn(today(zone));
  }

  isTomorrow(zone) {
    return this.fallsOn(today(zone).plus({ days: 1 }));
  }

  isYesterday(zone) {
    return this.fallsOn(today(zone).minus({ days: 1 }));
  }

  /*******************************
              Output
  *******************************/

  // the locale this value is written in, or the same value written in another. an unset tag clears it
  locale(...tag) {
    return tag.length ? new MonthDay(this.#plain, { locale: tag[0] }) : this.#locale;
  }

  format(spec = 'medium', locale = this.#locale) {
    const options = partOptions(spec, ['month', 'day'], MonthDay.presets);
    return options
      ? partFormatter(options, locale).format(epochOf('date', { year: leapYear, month: this.month, day: this.day }))
      : formatTokens(this, 'month-day', spec, locale);
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
        ? 'a `MonthDay` cannot be converted to a number or ordered with `<`, `>`, or `-`. check equality with `equals()`, or attach a year with `.in(2027)` to compare dates'
        : 0,
    });
  }

  // + gives the string, while < and - still refuse through valueOf
  [Symbol.toPrimitive](hint) {
    return hint === 'number' ? this.valueOf() : this.toString();
  }

  [inspect]() {
    return `MonthDay(${this.#plain})`;
  }
}

MonthDay.prototype.lang = MonthDay.prototype.locale;

const unread = new Set([...unreadable.point, 'invalidMonthDay', 'missingMonthDay', 'unsupportedCalendar']);

// with { loose: true } (via plugins/loose) an unreadable input is null, never a throw
export const monthDay = (input, dayOrOptions) => {
  const build = () =>
    input instanceof MonthDay && dayOrOptions === undefined ? input : new MonthDay(input, dayOrOptions);
  return isPlainObject(dayOrOptions) && dayOrOptions.loose ? loosely(build, unread) : build();
};

// the same value read day first, the order most of the world writes it: dayMonth('17/10') is
// monthDay('10/17'). the word decides the order, whatever dayFirst is configured for loose dates
export const dayMonth = (input, monthOrOptions) =>
  isCount(input) && isCount(monthOrOptions)
    ? monthDay(monthOrOptions, input)
    : monthDay(input, { ...zoneOptions(monthOrOptions), dayFirst: true });

export const isMonthDay = (value) => value instanceof MonthDay;
