import { isObject, isPlainObject, isString } from './helpers/utils.js';

import { CalendarDate, today, tomorrow, yesterday } from './calendar-date.js';
import { isDevelopment } from './helpers/environment.js';
import { guard, loosely, parseLooseParts, readAs, readPlugins, refuse, refuseType } from './helpers/errors.js';
import { epochOf, partFormatter, partOptions } from './helpers/format.js';
import { IS_MONTH_DAY } from './helpers/identity.js';
import { opensOnDate, wholeParts } from './helpers/parts.js';
import { formatTokens } from './helpers/tokens.js';
import {
  alias,
  inspect,
  isCount,
  isDigits,
  isPlainDate,
  localeOf,
  singularKeys,
  zoneOptions,
} from './helpers/units.js';
import { cachedText, zoneId } from './helpers/zones.js';

/*
  a recurring month and day with no year (Temporal.PlainMonthDay), such as a birthday or annual holiday.
  Feb 29 resolves to Feb 28 in non-leap years (Temporal's default 'constrain' overflow), and instances have
  no linear order so only equals() and fallsOn() compare them
*/

// two-digit 'MM-DD' with a hyphen is ISO 8601 and stays month-first even under dayMonth()
const isoParts = /^(\d{2})-(\d{2})$/;

const twoParts = /^(\d{1,2})[-/.](\d{1,2})$/;

const presets = {
  short: Object.freeze({ month: 'numeric', day: 'numeric' }),
  medium: Object.freeze({ month: 'short', day: 'numeric' }),
  long: Object.freeze({ month: 'long', day: 'numeric' }),
  full: Object.freeze({ month: 'long', day: 'numeric' }),
};

// reference leap year for epochOf() so Feb 29 formats without rolling into March (matches Temporal's 1972)
const leapYear = 1972;

export class MonthDay {
  // brand month day
  get [IS_MONTH_DAY]() {
    return true;
  }
  static [Symbol.hasInstance](value) {
    return !!value?.[IS_MONTH_DAY];
  }

  #plain;
  #locale;

  // monthDay(10, 17), monthDay(input, zone), or monthDay(input, { zone, loose, dayFirst })
  constructor(input, dayOrOptions) {
    this.#locale = localeOf(dayOrOptions, input);
    this.#plain = MonthDay.#read(input, dayOrOptions);
    // PlainMonthDay omits .month because lunisolar month numbers shift with leap months, so read monthCode ('M10')
    this.month = Number(this.#plain.monthCode.slice(1));
    this.day = this.#plain.day;
    Object.freeze(this);
  }

  static #read(input, dayOrOptions) {
    if (isCount(input) && isCount(dayOrOptions)) {
      return MonthDay.#fromParts({ month: input, day: dayOrOptions });
    }
    const settings = zoneOptions(dayOrOptions);
    if (settings.zone !== undefined) {
      zoneId(settings.zone);
    }
    const formatted = readPlugins('monthDay', input, settings, 1);
    if (formatted) {
      return formatted;
    }
    if (input === undefined || input === null) {
      return refuseType('missingMonthDay', String(input), {
        explanation: isDevelopment
          ? "a month-day value is required. Use `today().monthDay` for today's month and day"
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
      // rebuild via PlainMonthDay.from() to normalize custom referenceISOYear slots that would break .equals()
      return input.calendarId === 'iso8601'
        ? Temporal.PlainMonthDay.from({ monthCode: input.monthCode, day: input.day })
        : refuseType('unsupportedCalendar', String(input), {
          explanation: isDevelopment
            ? 'a `MonthDay` only stores dates in the ISO 8601 calendar. Pass `input.toPlainDate({ year })` to convert for a specific year, or use `.in(year)` before formatting an ISO month-day in another calendar'
            : 0,
        });
    }
    if (isString(input)) {
      return MonthDay.#fromText(input, settings);
    }
    if (isPlainObject(input)) {
      const fields = singularKeys(input);
      if (!('year' in fields)) {
        return MonthDay.#fromParts(fields, input);
      }
    }
    return MonthDay.#dayOf(input, settings).toPlainMonthDay();
  }

  static #fromParts(parts, at = parts, explanation) {
    return guard(
      () => Temporal.PlainMonthDay.from(wholeParts(parts, ['month', 'day']), { overflow: 'reject' }),
      'invalidMonthDay',
      at,
      explanation,
    );
  }

  static #fromText(input, settings) {
    const text = input.trim();
    // legacy RFC 3339 / ISO 8601 '--MM-DD' and '--MMDD' forms accepted by Temporal
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
    if (opensOnDate(text)) {
      return MonthDay.#dayOf(input, settings).toPlainMonthDay();
    }
    // avoid Date.parse() here: V8 defaults yearless strings like 'Feb 29' to 2001 and rolls them into March
    const named = settings.loose && parseLooseParts(text, settings);
    return named?.day
      ? MonthDay.#fromParts({ month: named.month, day: named.day }, input)
      : refuse('invalidMonthDay', input, {
        explanation: isDevelopment
          ? "expected a month-day string like '10-17' or '10/17', or an ISO date like '1990-10-17'. Use `dayMonth('17/10')` for day-first strings, or pass `{ loose: true }` with '@native-dates/plugins/loose' for month names like 'Oct 17'"
          : 0,
      });
  }

  // convert non-ISO PlainDates to iso8601 before extracting month and day
  static #dayOf(value, { zone, locale } = {}) {
    if (isPlainDate(value)) {
      return value.withCalendar('iso8601');
    }
    const day = value instanceof CalendarDate ? value : new CalendarDate(value, { zone, locale });
    return day.toTemporal().withCalendar('iso8601');
  }

  // PlainDate's min/max years (-271821 and +275760) cut off mid-year, where toPlainDate() throws RangeError
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

  // exact month/day match (unlike fallsOn(), Feb 29 != Feb 28). Slash and dot strings are rejected as order-ambiguous
  equals(other) {
    if (isString(other) && twoParts.test(other.trim()) && !isoParts.test(other.trim())) {
      refuse('invalidMonthDay', other, {
        explanation: isDevelopment
          ? "slash and dot strings like '05/10' are ambiguous between month-first and day-first. Pass an ISO string like '10-17', or wrap the string with `monthDay()` or `dayMonth()` first"
          : 0,
      });
    }
    return this.#plain.equals(MonthDay.#read(other));
  }

  fallsOn(day) {
    const date = MonthDay.#dayOf(day);
    return !!MonthDay.#placed(this.#plain, date.year)?.equals(date);
  }

  isToday(zone) {
    return this.fallsOn(today(zone));
  }

  isTomorrow(zone) {
    return this.fallsOn(tomorrow(zone));
  }

  isYesterday(zone) {
    return this.fallsOn(yesterday(zone));
  }

  /*******************************
              Output
  *******************************/

  locale(...tag) {
    return tag.length ? new MonthDay(this.#plain, { locale: tag[0] }) : this.#locale;
  }

  get text() {
    return cachedText(this);
  }

  format(spec, locale = this.#locale) {
    const options = partOptions(spec, ['month', 'day'], presets);
    return options
      ? partFormatter(options, locale).format(epochOf('date', { year: leapYear, month: this.month, day: this.day }))
      : formatTokens(this, 'month-day', spec, locale);
  }

  toString() {
    return this.#plain.toString();
  }

  toJSON() {
    return this.toString();
  }

  toTemporal() {
    return this.#plain;
  }

  valueOf() {
    return refuse('unsupportedComparison', String(this), {
      explanation: isDevelopment
        ? 'a `MonthDay` cannot be converted to a number or ordered with `<`, `>`, or `-`. Check equality with `equals()`, or attach a year with `.in(2027)` to compare dates'
        : 0,
    });
  }

  // '+' sends hint 'default', which would call valueOf() and throw without this
  [Symbol.toPrimitive](hint) {
    return hint === 'number' ? this.valueOf() : this.toString();
  }

  [inspect]() {
    return `MonthDay(${this.#plain})`;
  }
}

alias(MonthDay, { lang: 'locale', isOn: 'fallsOn', last: 'previous' });

export const monthDay = (input, dayOrOptions) => {
  const build = () =>
    input instanceof MonthDay && dayOrOptions === undefined ? input : new MonthDay(input, dayOrOptions);
  return isPlainObject(dayOrOptions) && dayOrOptions.loose ? loosely(build) : build();
};

// forces day-first order on numeric strings and (day, month) pairs regardless of configure({ dayFirst })
export const dayMonth = (input, monthOrOptions) =>
  isCount(input) && isCount(monthOrOptions)
    ? monthDay(monthOrOptions, input)
    : monthDay(input, { ...zoneOptions(monthOrOptions), dayFirst: true });

export const isMonthDay = (value) => value instanceof MonthDay;
