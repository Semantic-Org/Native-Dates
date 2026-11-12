import { CalendarDate, DateTime, IS_MONTH_DAY, today } from 'native-dates';
import { guard, loosely, refuse, refuseType, requireLoose, unreadable } from 'native-dates/helpers/errors';
import { epochOf, partFormatter } from 'native-dates/helpers/format';
import { isDevelopment, isObject, isPlainObject, isString } from 'native-dates/helpers/types';
import {
  inspect,
  isCount,
  isDigits,
  isPlainDate,
  monthNamed,
  opensOnDate,
  singularKeys,
  wholeParts,
  zoneOptions,
} from 'native-dates/helpers/units';
import { zoneId } from 'native-dates/helpers/zones';

/*
  a month and a day with no year: a birthday, an anniversary, a holiday. it comes around once a year,
  and Feb 29 falls on Feb 28 in a year without one, the way Temporal places it
*/

// a month and a day across a dash, a slash or a dot: '10-17', '10/17', '10.17'. the dash is ISO's
// and is month first whoever reads it, so what toJSON() writes reads back under either word
const twoParts = /^(\d{1,2})([-/.])(\d{1,2})$/;

// a month by its English name and a day, in either order: 'Oct 17', '17th October', 'Oct. 17,'
const nameAndDay = /^(?:([a-z]{3,9})\.?,?\s+(\d{1,2})(?:st|nd|rd|th)?|(\d{1,2})(?:st|nd|rd|th)?\s+([a-z]{3,9})\.?),?$/i;

// what a month-day has to print. anything else would be read off the leap year it prints through
const printable = ['month', 'day', 'literal'];

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
  };

  #plain;

  // monthDay(10, 17), monthDay(input, zone), or monthDay(input, { zone, loose, dayFirst })
  constructor(input, dayOrOptions) {
    const read = MonthDay.#read(input, dayOrOptions);
    this.#plain = isPlainDate(read) ? read.toPlainMonthDay() : read;
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

  // a value with a year in it reads as a date, and one without as a month-day. the constructor drops
  // the year, and equals() keeps it to ask whether the date is this month-day's occurrence that year
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
      return refuseType('notAMonthDay', String(input), {
        explanation: isDevelopment
          ? 'today().monthDay is the current one. a missing value is refused so an absent field never silently becomes today'
          : 0,
      });
    }
    if (!isString(input) && !isObject(input)) {
      return refuseType('notAMonthDay', String(input), {
        explanation: isDevelopment
          ? "a month-day is '10-17' or '10/17', two numbers, a fields object, a date, or a Temporal value"
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
        : refuseType('notAMonthDay', String(input), {
          explanation: isDevelopment ? 'a month-day is read in the ISO calendar' : 0,
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
    return MonthDay.#fromDate(input, settings);
  }

  static #fromParts(parts, at = JSON.stringify(parts), explanation) {
    return guard(
      () => Temporal.PlainMonthDay.from(wholeParts(parts, ['month', 'day']), { overflow: 'reject' }),
      'unreadableMonthDay',
      at,
      explanation,
    );
  }

  static #fromText(input, settings) {
    const text = input.trim();
    // ISO marks a month-day with two dashes, '--10-17' or '--1017', and Temporal reads both
    if (text.startsWith('--')) {
      return guard(() => Temporal.PlainMonthDay.from(text), 'unreadableMonthDay', input);
    }
    const parts = twoParts.exec(text);
    if (parts) {
      const [, first, separator, second] = parts;
      const [month, day] = settings.dayFirst && separator !== '-' ? [second, first] : [first, second];
      return MonthDay.#fromParts(
        { month, day },
        input,
        isDevelopment
          ? `that reads as month ${month}, day ${day}. monthDay reads the month first and dayMonth the day first, and a dash is ISO's, month first for both`
          : 0,
      );
    }
    // text that opens on a whole ISO date is whatever date() reads
    if (opensOnDate(text)) {
      return MonthDay.#fromDate(input, settings);
    }
    // no other text is put to Date, which makes up the parts text leaves out: a year with no Feb 29
    // in it, the 1st, January. when loose, a month-day is also a month by name and a day
    const named = settings.loose ? nameAndDay.exec(text) : null;
    const month = named && monthNamed(named[1] ?? named[4]);
    return month
      ? MonthDay.#fromParts({ month, day: named[2] ?? named[3] }, input)
      : refuse('unreadableMonthDay', input, {
        explanation: isDevelopment
          ? "a month-day is '10-17' or '10/17', or a date like '1990-10-17' with its year dropped. plugins/loose adds { loose: true } for a month by name, 'Oct 17'. a date written any other way is date(text, { loose: true }).monthDay"
          : 0,
      });
  }

  // anything a date reads, a date's own refusals included. a Temporal date needs no reading, and
  // date() refuses one beside a zone
  static #fromDate(input, { zone, loose, dayFirst }) {
    if (isPlainDate(input)) {
      return input.withCalendar('iso8601');
    }
    const day = input instanceof CalendarDate
      ? input
      : new CalendarDate(input, loose ? { zone, loose, dayFirst } : { zone });
    return day.toTemporal().withCalendar('iso8601');
  }

  /*******************************
            Arithmetic
  *******************************/

  // the date this falls on in a year
  in(year) {
    const count = isDigits(year) ? Number(year) : year;
    if (!Number.isInteger(count)) {
      refuse('unreadableDate', `${year}-${this}`, {
        explanation: isDevelopment ? 'a year is a whole number: monthDay.in(2027)' : 0,
      });
    }
    return new CalendarDate(
      guard(() => this.#plain.toPlainDate({ year: count }), 'unreadableDate', `${count}-${this}`),
    );
  }

  /*******************************
            Comparison
  *******************************/

  // against a date the question is whether it is this month-day's occurrence in the date's year, so
  // Feb 29 answers to Feb 28 in a year without one. against another month-day it is the same parts
  equals(other) {
    // text across a slash or a dot has an order only under the word that read it, and equals has none
    const separator = isString(other) ? twoParts.exec(other.trim())?.[2] : undefined;
    if (separator === '/' || separator === '.') {
      refuse('unreadableMonthDay', other, {
        explanation: isDevelopment
          ? "equals reads ISO text, '10-17'. read text across a slash or a dot with monthDay() or dayMonth() first, which say whether the month or the day leads"
          : 0,
      });
    }
    const rival = MonthDay.#read(other);
    return isPlainDate(rival) ? !!MonthDay.#placed(this.#plain, rival.year)?.equals(rival) : this.#plain.equals(rival);
  }

  // where Temporal places a month-day in a year, or nothing in the year its dates run out
  static #placed(plain, year) {
    try {
      return plain.toPlainDate({ year });
    }
    catch {
      return undefined;
    }
  }

  // today depends on where you stand, so these take the zone to judge from
  isToday(zone) {
    return this.equals(today(zone));
  }

  isTomorrow(zone) {
    return this.equals(today(zone).plus({ days: 1 }));
  }

  isYesterday(zone) {
    return this.equals(today(zone).minus({ days: 1 }));
  }

  /*******************************
              Output
  *******************************/

  format(spec = 'medium', locale) {
    const options = isPlainObject(spec)
      ? spec
      : Object.hasOwn(MonthDay.presets, spec)
      ? MonthDay.presets[spec]
      : refuse('unknownFormat', String(spec), {
        explanation: isDevelopment
          ? "a month-day formats as 'short', 'medium' or 'long', or with an Intl options object"
          : 0,
      });
    const format = partFormatter(options, locale) ?? refuse('unknownFormat', `calendar ${options.calendar}`, {
      explanation: isDevelopment
        ? 'an ISO month and day fall on other days of that calendar each year. place it in a year to print there: monthDay.in(2027).format(spec)'
        : 0,
    });
    const parts = format.formatToParts(epochOf('date', { year: leapYear, month: this.month, day: this.day }));
    const missing = parts.find((part) => !printable.includes(part.type));
    if (missing) {
      refuse('noField', `${missing.type} in ${JSON.stringify(options)}`, {
        explanation: isDevelopment
          ? 'a month-day has a month and a day to print. place it in a year for the rest: monthDay.in(2027).format(spec)'
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
        ? 'a month-day is not a point on the number line. compare with equals, or place it in a year: monthDay.in(2027)'
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

const unread = new Set([...unreadable.point, 'unreadableMonthDay', 'notAMonthDay']);

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

// a date and a datetime hand over their month-day, the way a datetime hands over its date
for (const Kind of [CalendarDate, DateTime]) {
  Object.defineProperty(Kind.prototype, 'monthDay', {
    configurable: true,
    get() {
      return new MonthDay(this);
    },
  });
}

// the day's ISO year, the calendar a month-day is in
const isoYear = (day) => day.toTemporal().withCalendar('iso8601').year;

// the occurrence in a year, or nothing in the first and the last year Temporal counts, where its
// dates run out partway through
const occurrenceIn = (target, year) => {
  try {
    return target.in(year);
  }
  catch (error) {
    if (error.code !== 'unreadableDate') {
      throw error;
    }
    return undefined;
  }
};

// the occurrence strictly after a day, or strictly before it. the day itself never counts, the way
// next('monday') on a monday is a week away
const occurrenceAfter = (day, target) => {
  const thisYear = occurrenceIn(target, isoYear(day));
  return thisYear?.isAfter(day) ? thisYear : target.in(isoYear(day) + 1);
};
const occurrenceBefore = (day, target) => {
  const thisYear = occurrenceIn(target, isoYear(day));
  return thisYear?.isBefore(day) ? thisYear : target.in(isoYear(day) - 1);
};

// next() and previous() step to a weekday, which comes around each week. a month-day comes around
// each year, so the same two verbs step to it
const dateSteps = { next: CalendarDate.prototype.next, previous: CalendarDate.prototype.previous };
CalendarDate.prototype.next = function next(target) {
  return target instanceof MonthDay ? occurrenceAfter(this, target) : dateSteps.next.call(this, target);
};
CalendarDate.prototype.previous = function previous(target) {
  return target instanceof MonthDay ? occurrenceBefore(this, target) : dateSteps.previous.call(this, target);
};

// a datetime lands on the occurrence at its own time of day, in its own zone
const datetimeSteps = { next: DateTime.prototype.next, previous: DateTime.prototype.previous };
DateTime.prototype.next = function next(target) {
  return target instanceof MonthDay
    ? occurrenceAfter(this.date, target).at(this.time, this.zone)
    : datetimeSteps.next.call(this, target);
};
DateTime.prototype.previous = function previous(target) {
  return target instanceof MonthDay
    ? occurrenceBefore(this.date, target).at(this.time, this.zone)
    : datetimeSteps.previous.call(this, target);
};
