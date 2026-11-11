import { CalendarDate, DateTime, IS_MONTH_DAY, today } from 'native-dates';
import { guard, loosely, refuse, refuseType, unreadable } from 'native-dates/helpers/errors';
import { epochOf, formatter } from 'native-dates/helpers/format';
import { isDevelopment, isNumber, isObject, isPlainObject, isString } from 'native-dates/helpers/types';
import { inspect, isDigits, isPlainDate, singularKeys, wholeNumbers, zoneOptions } from 'native-dates/helpers/units';
import { zoneId } from 'native-dates/helpers/zones';

/*
  a month and a day with no year: a birthday, an anniversary, a holiday. it comes around once a year,
  and Feb 29 falls on Feb 28 in a year without one, the way Temporal places it
*/

// '10-17', '10/17' or '10.17', and ISO's own '--10-17', which is month first whoever reads it
const twoParts = /^(--)?(\d{1,2})[-/.](\d{1,2})$/;

// the parts of a formatted date that only a year can answer
const yearParts = ['year', 'relatedYear', 'yearName', 'era', 'weekday'];

// a leap year to print from, so Feb 29 has a day to stand on. Temporal keeps 1972 for the same reason
const leapYear = 1972;

// a number, or one written as text, the way a form carries it
const isCount = (value) => isNumber(value) || isDigits(value);

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
      return MonthDay.#fromFields({ month: Number(input), day: Number(dayOrOptions) });
    }
    const settings = isPlainObject(dayOrOptions)
      ? dayOrOptions
      : isString(dayOrOptions)
      ? { zone: dayOrOptions }
      : {};
    // the zone resolves first so a bad one throws even when the input turns out unreadable
    if (settings.zone !== undefined) {
      zoneId(settings.zone);
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
      return input.calendarId === 'iso8601' ? input : refuseType('notAMonthDay', String(input), {
        explanation: isDevelopment ? 'a month-day is read in the ISO calendar' : 0,
      });
    }
    if (isString(input)) {
      const parts = twoParts.exec(input.trim());
      if (parts) {
        const [, iso, first, second] = parts;
        const [month, day] = settings.dayFirst && !iso ? [second, first] : [first, second];
        return MonthDay.#fromFields(
          { month: Number(month), day: Number(day) },
          input,
          isDevelopment
            ? `that reads as month ${month}, day ${day}. monthDay reads the month first, dayMonth the day first`
            : 0,
        );
      }
    }
    if (isPlainObject(input)) {
      const fields = singularKeys(input);
      if (!('year' in fields)) {
        return MonthDay.#fromFields(fields, JSON.stringify(input));
      }
    }
    return MonthDay.#fromDate(input, settings);
  }

  static #fromFields(fields, at = JSON.stringify(fields), explanation) {
    return guard(
      () => {
        if (!wholeNumbers(Object.values(fields))) {
          throw new RangeError('a month-day reads whole numbers');
        }
        return Temporal.PlainMonthDay.from(fields, { overflow: 'reject' });
      },
      'unreadableMonthDay',
      at,
      explanation,
    );
  }

  // anything a date reads carries its year along. text that reads as neither is refused as a
  // month-day, where a value with a year in it was a date and keeps the date's own refusal
  static #fromDate(input, { zone, loose, dayFirst }) {
    try {
      const day = input instanceof CalendarDate
        ? input
        : new CalendarDate(input, loose ? { zone, loose, dayFirst } : { zone });
      return day.toTemporal().withCalendar('iso8601');
    }
    catch (error) {
      if (!isString(input) || error.code !== 'unreadableDate') {
        throw error;
      }
      return refuse('unreadableMonthDay', input, {
        explanation: isDevelopment
          ? "a month-day is '10-17' or '10/17', or a date like '1990-10-17' with its year dropped. plugins/loose adds { loose: true } for what Date reads"
          : 0,
      });
    }
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
    const rival = MonthDay.#read(other);
    return isPlainDate(rival)
      ? this.#plain.toPlainDate({ year: rival.year }).equals(rival)
      : this.#plain.equals(rival);
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
    const parts = formatter('date', options, locale)
      .formatToParts(epochOf('date', { year: leapYear, month: this.month, day: this.day }));
    const missing = parts.find((part) => yearParts.includes(part.type));
    if (missing) {
      refuse('noField', `${missing.type} in ${JSON.stringify(options)}`, {
        explanation: isDevelopment
          ? 'a month-day has no year to print. place it in one first: monthDay.in(2027).format(spec)'
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

// the occurrence strictly after a day, or strictly before it. the day itself never counts, the way
// next('monday') on a monday is a week away
const occurrenceAfter = (day, target) => {
  const thisYear = target.in(day.year);
  return thisYear.isAfter(day) ? thisYear : target.in(day.year + 1);
};
const occurrenceBefore = (day, target) => {
  const thisYear = target.in(day.year);
  return thisYear.isBefore(day) ? thisYear : target.in(day.year - 1);
};

const dayOf = (point) => (point instanceof DateTime ? point.date : point);

for (const Kind of [CalendarDate, DateTime]) {
  // a date and a datetime hand over their month-day, the way a datetime hands over its date
  Object.defineProperty(Kind.prototype, 'monthDay', {
    configurable: true,
    get() {
      return new MonthDay(this);
    },
  });

  // next() and previous() step to a weekday, which comes around each week. a month-day comes around
  // each year, so the same two verbs step to it. the step is whole days, so a datetime keeps its clock
  const toWeekday = { next: Kind.prototype.next, previous: Kind.prototype.previous };
  Kind.prototype.next = function next(target) {
    if (!(target instanceof MonthDay)) {
      return toWeekday.next.call(this, target);
    }
    const day = dayOf(this);
    return this.plus({ days: day.until(occurrenceAfter(day, target), 'days') });
  };
  Kind.prototype.previous = function previous(target) {
    if (!(target instanceof MonthDay)) {
      return toWeekday.previous.call(this, target);
    }
    const day = dayOf(this);
    return this.plus({ days: day.until(occurrenceBefore(day, target), 'days') });
  };
}
