import { isDate, isNumber, isPlainObject, isString } from './helpers/utils.js';

import { DateTime } from './date-time.js';
import { anchored, duration } from './duration.js';
import { isDevelopment } from './helpers/environment.js';
import { fail, guard, loosely, parseLoose, readAs, refuse, refuseType, requireLoose } from './helpers/errors.js';
import { fieldsFrom, temporalDurationOf } from './helpers/fields.js';
import { formatIntl, intlOptions } from './helpers/format.js';
import { IS_CALENDAR_DATE, IS_MONTH_DAY } from './helpers/identity.js';
import { yearFirst } from './helpers/parts.js';
import { relativeDays } from './helpers/relative.js';
import { formatTokens } from './helpers/tokens.js';
import {
  alias,
  dayOfWeek,
  inspect,
  isCount,
  isDigits,
  isInstant,
  isPlainDate,
  isPlainDateTime,
  isZonedDateTime,
  localeOf,
  namesInstant,
  plural,
  quarterStart,
  singularKeys,
  stepArguments,
  stepOf,
  timeUnits,
  unit,
  wholeNumbers,
  withParts,
} from './helpers/units.js';
import { weekStart, zoneId } from './helpers/zones.js';
import { MonthDay } from './month-day.js';
import { DateRange } from './range.js';
import { Time } from './time.js';
import { YearMonth } from './year-month.js';

/*
  a calendar date with no time and no zone: a due date, a birthday, a booking night. it is not a
  moment, so it never shifts when read from another zone
*/

export class CalendarDate {
  // brand calendar date
  get [IS_CALENDAR_DATE]() {
    return true;
  }
  static [Symbol.hasInstance](value) {
    return !!value?.[IS_CALENDAR_DATE];
  }

  #plain;
  #locale;

  // date(2026, 9, 6), date(input, zone), or date(input, { zone, loose })
  constructor(input, monthOrOptions, day) {
    if (isDigits(input) && isCount(monthOrOptions)) {
      [input, monthOrOptions, day] = [Number(input), Number(monthOrOptions), day === undefined ? day : Number(day)];
    }
    const settings = isPlainObject(monthOrOptions)
      ? monthOrOptions
      : isString(monthOrOptions)
      ? { zone: monthOrOptions }
      : {};
    this.#locale = localeOf(settings, input);
    this.#plain =
      isPlainDate(input) && settings.zone === undefined && !settings.loose && settings.dayFirst === undefined
        ? input
        : CalendarDate.#read(input, isNumber(monthOrOptions) ? monthOrOptions : undefined, day, settings);
    // the parts are own properties, so a value prints them in a console without a click, in the order a
    // preview reads: the text first, filled once the parts it reads are in, then month, day, year
    this.text = undefined;
    const plain = this.#plain;
    this.month = plain.month;
    this.day = plain.day;
    this.year = plain.year;
    this.dayOfWeek = plain.dayOfWeek;
    this.text = this.format();
    Object.freeze(this);
  }

  static #read(input, month, day, settings) {
    if (settings.zone !== undefined) {
      zoneId(settings.zone);
    }
    if (settings.loose || settings.dayFirst !== undefined) {
      requireLoose(settings.loose ? 'loose' : 'dayFirst');
    }
    if (input === undefined || input === null) {
      return refuseType('missingDate', String(input), {
        explanation: isDevelopment
          ? 'a date value is required. Use `today()` for the current date'
          : 0,
      });
    }
    if (isNumber(input) && isNumber(month)) {
      // a missing day is refused so an absent field never silently becomes the 1st
      if (day === undefined) {
        return refuse('missingDay', `${input}-${month}`, {
          explanation: isDevelopment
            ? 'numeric dates require a year, month, and day like `date(2026, 11, 16)`. For a year and month without a day, use `yearMonth(2026, 11)`'
            : 0,
        });
      }
      return guard(
        () => {
          if (!wholeNumbers([input, month, day])) {
            fail(isDevelopment ? 'year, month, and day must be whole numbers' : '');
          }
          return Temporal.PlainDate.from({ year: input, month, day }, { overflow: 'reject' });
        },
        'invalidDate',
        `${input}-${month}-${day}`,
      );
    }
    if (input instanceof CalendarDate) {
      return input.toTemporal();
    }
    // a moment falls on a different day and clock in each zone, so it is read in the zone asked for
    if (
      input instanceof DateTime || isDate(input) || isZonedDateTime(input) || isInstant(input)
      || (isString(input) && namesInstant(input))
    ) {
      return new DateTime(input, settings).toTemporal().toPlainDate();
    }
    if (isNumber(input)) {
      return refuseType('invalidDate', String(input), {
        explanation: isDevelopment
          ? 'a single number is ambiguous between a year and epoch milliseconds. Use `datetime(ms).date` for a timestamp, or `date(2026, 9, 6)` for a year, month, and day'
          : 0,
      });
    }
    if (isString(input)) {
      try {
        return CalendarDate.#parse(input);
      }
      catch (error) {
        if (!settings.loose || error.code !== 'invalidDate') {
          throw error;
        }
        const zoned = parseLoose(input, settings.zone, settings.dayFirst);
        if (!zoned) {
          throw error;
        }
        return zoned.toPlainDate();
      }
    }
    if (isPlainDateTime(input)) {
      return input.toPlainDate();
    }
    if (isPlainObject(input)) {
      return guard(
        () => Temporal.PlainDate.from(singularKeys(input), { overflow: 'reject' }),
        'invalidDate',
        JSON.stringify(input),
      );
    }
    return refuseType('invalidDate', String(input), {
      explanation: isDevelopment
        ? "expected an ISO date string like '2026-09-06', `(year, month, day)` numbers, a `{ year, month, day }` object, a `Date`, a `DateTime`, or a `Temporal` value"
        : 0,
    });
  }

  // a wall-clock string keeps its day and drops the clock
  static #parse(text) {
    const iso = yearFirst(text.trim());
    return guard(
      () => Temporal.PlainDate.from(iso),
      'invalidDate',
      text,
      // text in the right shape that still fails names a day the calendar lacks, February 30th
      isDevelopment
        ? /^\d{4}-\d{2}-\d{2}$/.test(iso)
          ? 'this calendar date does not exist. Check the year, month, and day'
          : "expected an ISO date string like '2026-09-06'. Use `yearMonth('2026-11')` for a year and month, or pass `{ loose: true }` with '@native-dates/plugins/loose' for informal date strings"
        : 0,
    );
  }

  // the locale this value is written in, or the same value written in another. an unset tag clears it
  locale(...tag) {
    return tag.length ? new CalendarDate(this.#plain, { locale: tag[0] }) : this.#locale;
  }

  #next(plain) {
    return new CalendarDate(plain, { locale: this.#locale });
  }

  /*******************************
              Reads
  *******************************/

  // the day this value's weeks start on, 1 for monday through 7 for sunday
  get weekStart() {
    return weekStart(undefined, this.#locale);
  }
  get quarter() {
    return Math.ceil(this.#plain.month / 3);
  }
  get dayOfYear() {
    return this.#plain.dayOfYear;
  }
  get weekOfYear() {
    return this.#plain.weekOfYear;
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
  isWeekend() {
    return this.#plain.dayOfWeek >= 6;
  }
  isWeekday() {
    return this.#plain.dayOfWeek < 6;
  }

  /*******************************
            Arithmetic
  *******************************/

  plus(amount, name) {
    return this.#next(
      guard(() => this.#plain.add(CalendarDate.#dateFields(amount, name)), 'cannotAdd', `${amount} ${name ?? ''}`),
    );
  }

  minus(amount, name) {
    return this.#next(
      guard(
        () => this.#plain.subtract(CalendarDate.#dateFields(amount, name)),
        'cannotSubtract',
        `${amount} ${name ?? ''}`,
      ),
    );
  }

  static #dateFields(amount, name) {
    const fields = fieldsFrom(amount, name);
    const clock = timeUnits.find((time) => fields[plural(time)]);
    if (clock) {
      refuse('unsupportedUnit', `${clock}s`, {
        explanation: isDevelopment
          ? "a `CalendarDate` has no time of day, so it only accepts calendar units like days, weeks, months, or years. Attach a time first with `.at('00:00', zone)` to add or subtract clock units"
          : 0,
      });
    }
    return temporalDurationOf(fields);
  }

  set(fields, value) {
    const changes = isString(fields) ? { [unit(fields)]: value } : singularKeys(fields);
    return this.#next(
      guard(() => withParts(this.#plain, changes), 'cannotSet', JSON.stringify(changes)),
    );
  }

  // a week starts on the configured first day, or on the one given: a picker's first day is a prop
  startOf(name, firstDay) {
    switch (unit(name)) {
      case 'year':
        return this.#next(this.#plain.with({ month: 1, day: 1 }));
      case 'quarter':
        return this.#next(this.#plain.with({ month: quarterStart(this.month), day: 1 }));
      case 'month':
        return this.#next(this.#plain.with({ day: 1 }));
      case 'week':
        return this.#next(this.#plain.subtract({ days: (this.dayOfWeek - weekStart(firstDay, this.#locale) + 7) % 7 }));
      case 'day':
        return this;
      default:
        return refuse('unsupportedUnit', String(name), {
          explanation: isDevelopment
            ? "expected a calendar unit in [year, quarter, month, week, day]. Attach a time first with `.at('00:00', zone)` for clock units"
            : 0,
        });
    }
  }

  endOf(name, firstDay) {
    return this.startOf(name, firstDay).plus(stepOf(unit(name))).minus({ days: 1 });
  }

  // steps to a weekday, which comes around each week. a month-day comes
  // around each year and finds its own occurrence. either way this day itself never counts
  next(target) {
    if (target?.[IS_MONTH_DAY]) {
      return this.#next(target.after(this).toTemporal());
    }
    const delta = (dayOfWeek(target) - this.dayOfWeek + 7) % 7 || 7;
    return this.plus({ days: delta });
  }

  previous(target) {
    if (target?.[IS_MONTH_DAY]) {
      return this.#next(target.before(this).toTemporal());
    }
    const delta = (this.dayOfWeek - dayOfWeek(target) + 7) % 7 || 7;
    return this.minus({ days: delta });
  }

  // a range from this date through another, both included, or every day of the unit it falls in
  to(end, name) {
    return new DateRange(this, name === undefined ? end : duration(end, name));
  }

  range(name, firstDay) {
    return new DateRange(this.startOf(name, firstDay), this.endOf(name, firstDay));
  }

  // a day is a range of time, so it walks and splits like one: today().split('hour') is the day's hours
  // in the zone, 23 or 25 of them on a transition day, which only the zone knows
  points(step, ...rest) {
    const [name, zone] = stepArguments(step, rest);
    return this.at('00:00', zone).range('day').points(step, name);
  }

  split(step, ...rest) {
    const [name, zone] = stepArguments(step, rest);
    return this.at('00:00', zone).range('day').split(step, name);
  }

  /*******************************
            Comparison
  *******************************/

  equals(other) {
    return this.#compare(other) === 0;
  }

  #compare(other) {
    return Temporal.PlainDate.compare(this.#plain, new CalendarDate(other).toTemporal());
  }

  isBefore(other) {
    return this.#compare(other) < 0;
  }

  isAfter(other) {
    return this.#compare(other) > 0;
  }

  isSame(other, name, firstDay) {
    if (name === undefined) {
      return this.equals(other);
    }
    // one first day for both sides, this value's, so the question is asked of one week
    const first = weekStart(firstDay, this.#locale);
    return this.startOf(name, first).equals(new CalendarDate(other).startOf(name, first));
  }

  isPast(zone) {
    return this.isBefore(today(zone));
  }

  isFuture(zone) {
    return this.isAfter(today(zone));
  }

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
             Measure
  *******************************/

  until(other, name) {
    const end = new CalendarDate(other);
    const span = anchored(this.#plain.until(end.toTemporal(), { largestUnit: 'year' }), this.#plain, this.#locale);
    return name === undefined ? span : span.total(name);
  }

  since(other, name) {
    return new CalendarDate(other, { locale: this.#locale }).until(this, name);
  }

  at(when, zone) {
    const plainTime = new Time(when ?? '00:00').toTemporal();
    return new DateTime(this.#plain.toZonedDateTime({ timeZone: zoneId(zone), plainTime }), { locale: this.#locale });
  }

  get monthDay() {
    return new MonthDay(this);
  }
  get yearMonth() {
    return new YearMonth(this);
  }

  // a date read as a datetime is its midnight in the zone
  as(kind, zone) {
    return readAs(kind, {
      date: () => this,
      datetime: () => this.at(undefined, zone),
      monthDay: () => this.monthDay,
      yearMonth: () => this.yearMonth,
    });
  }

  /*******************************
              Output
  *******************************/

  format(spec, locale = this.#locale) {
    const options = intlOptions('date', spec);
    return options ? formatIntl('date', this.#plain, options, locale) : formatTokens(this, 'date', spec, locale);
  }

  // how far this day is from another, in words: 'yesterday', 'in 3 weeks'. from today when no other
  // is given
  from(other, locale = this.#locale) {
    return relativeDays((other === undefined ? today() : new CalendarDate(other)).until(this, 'day'), locale);
  }

  fromNow(locale) {
    return this.from(undefined, locale);
  }

  toString() {
    return this.#plain.toString();
  }

  toJSON() {
    return this.#plain.toString();
  }

  toJSDate(zone) {
    return this.at('00:00', zone).toJSDate();
  }

  toTemporal() {
    return this.#plain;
  }

  valueOf() {
    return refuse('unsupportedComparison', String(this), {
      explanation: isDevelopment
        ? 'a `CalendarDate` cannot be converted to a number for `<`, `>`, or `-`. Compare dates with `isBefore()`, `isAfter()`, or `equals()`, or measure the difference with `until()`'
        : 0,
    });
  }

  // + gives the string, while < and - still refuse through valueOf
  [Symbol.toPrimitive](hint) {
    return hint === 'number' ? this.valueOf() : this.toString();
  }

  [inspect]() {
    return `CalendarDate(${this.#plain})`;
  }
}

// for is to given a length, the word that reads aloud: start.for(3, 'days'). through is to on a date
// alone, since a date range runs through its last day and the other kinds stop short of theirs
alias(CalendarDate, {
  add: 'plus',
  subtract: 'minus',
  lang: 'locale',
  formatRelative: 'from',
  for: 'to',
  through: 'to',
  splitBy: 'split',
});

export const date = (input, monthOrOptions, day) => {
  const build = () =>
    input instanceof CalendarDate && monthOrOptions === undefined
      ? input
      : new CalendarDate(input, monthOrOptions, day);
  return isPlainObject(monthOrOptions) && monthOrOptions.loose ? loosely(build) : build();
};

export const today = (zone) => new CalendarDate(Temporal.Now.plainDateISO(zoneId(zone)));
export const tomorrow = (zone) => today(zone).plus({ days: 1 });
export const yesterday = (zone) => today(zone).minus({ days: 1 });

export const isCalendarDate = (value) => value instanceof CalendarDate;
