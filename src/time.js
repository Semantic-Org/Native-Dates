import { isDate, isNumber, isPlainObject, isString } from './helpers/utils.js';

import { CalendarDate } from './calendar-date.js';
import { DateTime } from './date-time.js';
import { anchored, duration } from './duration.js';
import { isDevelopment } from './helpers/environment.js';
import { guard, loosely, parseLoose, readAs, refuse, refuseType, requireLoose } from './helpers/errors.js';
import { fieldsFrom, temporalDurationOf } from './helpers/fields.js';
import { formatIntl, intlOptions } from './helpers/format.js';
import { IS_TIME } from './helpers/identity.js';
import { formatTokens } from './helpers/tokens.js';
import {
  alias,
  endPrecision,
  inspect,
  isCount,
  isDigits,
  isInstant,
  isPlainDateTime,
  isPlainTime,
  isZonedDateTime,
  localeOf,
  namesInstant,
  singularKeys,
  stepOf,
  unit,
  wholeNumbers,
  withParts,
} from './helpers/units.js';
import { zoneId } from './helpers/zones.js';
import { TimeRange } from './range.js';

const clock = /^(\d{1,2})(?::(\d{2}))?(?::(\d{2})(?:\.(\d{1,9}))?)?\s*([ap]\.?m\.?)?$/i;

export class Time {
  // brand time
  get [IS_TIME]() {
    return true;
  }
  static [Symbol.hasInstance](value) {
    return !!value?.[IS_TIME];
  }

  #plain;
  #locale;

  // time(9, 30), time(input, zone), or time(input, { zone, loose })
  constructor(input, minuteOrOptions, second) {
    if (isDigits(input) && isCount(minuteOrOptions)) {
      [input, minuteOrOptions, second] = [
        Number(input),
        Number(minuteOrOptions),
        second === undefined ? second : Number(second),
      ];
    }
    const settings = isPlainObject(minuteOrOptions)
      ? minuteOrOptions
      : isString(minuteOrOptions)
      ? { zone: minuteOrOptions }
      : {};
    this.#locale = localeOf(settings, input);
    this.#plain =
      isPlainTime(input) && settings.zone === undefined && !settings.loose && settings.dayFirst === undefined
        ? input
        : Time.#read(input, isNumber(minuteOrOptions) ? minuteOrOptions : undefined, second, settings);
    // the parts are own properties, so a value prints them in a console without a click. the text is
    // keyed first so a preview leads with it, and filled once the parts it reads are in
    this.text = undefined;
    const plain = this.#plain;
    this.hour = plain.hour;
    this.minute = plain.minute;
    this.second = plain.second;
    this.millisecond = plain.millisecond;
    this.text = this.format();
    Object.freeze(this);
  }

  static #read(input, minute, second, settings) {
    if (settings.zone !== undefined) {
      zoneId(settings.zone);
    }
    if (settings.loose || settings.dayFirst !== undefined) {
      requireLoose(settings.loose ? 'loose' : 'dayFirst');
    }
    if (input === undefined || input === null) {
      return refuseType('missingTime', String(input), {
        explanation: isDevelopment
          ? 'a time value is required. use `now().time` for the current time of day'
          : 0,
      });
    }
    if (isNumber(input)) {
      return guard(
        () => {
          if (!wholeNumbers([input, minute, second])) {
            throw new RangeError(isDevelopment ? 'hour, minute, and second must be whole numbers' : '');
          }
          return Temporal.PlainTime.from({ hour: input, minute: minute ?? 0, second: second ?? 0 }, {
            overflow: 'reject',
          });
        },
        'invalidTime',
        `${input}:${minute ?? 0}`,
      );
    }
    if (input instanceof Time) {
      return input.toTemporal();
    }
    // a moment falls on a different day and clock in each zone, so it is read in the zone asked for
    if (
      input instanceof DateTime || isDate(input) || isZonedDateTime(input) || isInstant(input)
      || (isString(input) && namesInstant(input))
    ) {
      return new DateTime(input, settings).toTemporal().toPlainTime();
    }
    if (isString(input)) {
      try {
        return Time.#parse(input);
      }
      catch (error) {
        if (!settings.loose || error.code !== 'invalidTime') {
          throw error;
        }
        const zoned = parseLoose(input, settings.zone, settings.dayFirst);
        if (!zoned) {
          throw error;
        }
        return zoned.toPlainTime();
      }
    }
    if (isPlainDateTime(input)) {
      return input.toPlainTime();
    }
    if (isPlainObject(input)) {
      return guard(
        () => Temporal.PlainTime.from(singularKeys(input), { overflow: 'reject' }),
        'invalidTime',
        JSON.stringify(input),
      );
    }
    return refuseType('invalidTime', String(input), {
      explanation: isDevelopment
        ? "expected a time string like '09:00' or '5:30pm', `(hour, minute, second)` numbers, a `{ hour, minute }` object, a `Date`, a `DateTime`, or a `Temporal` value"
        : 0,
    });
  }

  // '9am', '5:30 pm', '09:00', '17:30:15'. anything else goes to Temporal's ISO reader
  static #parse(text) {
    const match = clock.exec(text.trim());
    if (match) {
      const [, hourText, minute = '0', second = '0', fraction = '', meridiem] = match;
      let hour = Number(hourText);
      if (meridiem) {
        const afternoon = meridiem[0].toLowerCase() === 'p';
        if (hour < 1 || hour > 12) {
          refuse('invalidTime', text, {
            explanation: isDevelopment
              ? "12-hour times with 'am' or 'pm' must use hours from 1 to 12. drop 'am' or 'pm' for 24-hour time like '13:00', or use '1pm'"
              : 0,
          });
        }
        hour = (hour % 12) + (afternoon ? 12 : 0);
      }
      const nanos = fraction.padEnd(9, '0');
      return guard(
        () =>
          Temporal.PlainTime.from({
            hour,
            minute: Number(minute),
            second: Number(second),
            millisecond: Number(nanos.slice(0, 3)),
            microsecond: Number(nanos.slice(3, 6)),
            nanosecond: Number(nanos.slice(6)),
          }, { overflow: 'reject' }),
        'invalidTime',
        text,
      );
    }
    return guard(
      () => Temporal.PlainTime.from(text.trim()),
      'invalidTime',
      text,
      isDevelopment
        ? "expected a clock time like '09:00', '5:30pm', or '17:30:15'. pass `{ loose: true }` with '@native-dates/plugins/loose' to extract the time from an informal date-time string"
        : 0,
    );
  }

  // the locale this value is written in, or the same value written in another. an unset tag clears it
  locale(...tag) {
    return tag.length ? new Time(this.#plain, { locale: tag[0] }) : this.#locale;
  }

  #next(plain) {
    return new Time(plain, { locale: this.#locale });
  }

  /*******************************
              Reads
  *******************************/

  get microsecond() {
    return this.#plain.microsecond;
  }
  get nanosecond() {
    return this.#plain.nanosecond;
  }

  /*******************************
            Arithmetic
  *******************************/

  // arithmetic wraps like a clock face: 23:00 plus two hours is 01:00
  plus(amount, name) {
    return this.#next(
      guard(() => this.#plain.add(Time.#clockFields(amount, name)), 'cannotAdd', `${amount} ${name ?? ''}`),
    );
  }

  // a clock has no calendar, so a day added to a time is refused rather than wrapped away
  static #clockFields(amount, name) {
    const fields = fieldsFrom(amount, name);
    const calendar = ['years', 'months', 'weeks', 'days'].find((field) => fields[field]);
    if (calendar) {
      refuse('unsupportedUnit', calendar, {
        explanation: isDevelopment
          ? "a `Time` has no calendar date, so it only accepts clock units like hours, minutes, or seconds. attach a date first with `.on('2026-11-06', zone)` to add or subtract calendar units"
          : 0,
      });
    }
    return temporalDurationOf(fields);
  }

  minus(amount, name) {
    return this.#next(
      guard(
        () => this.#plain.subtract(Time.#clockFields(amount, name)),
        'cannotSubtract',
        `${amount} ${name ?? ''}`,
      ),
    );
  }

  set(fields, value) {
    const changes = isString(fields) ? { [unit(fields)]: value } : singularKeys(fields);
    return this.#next(
      guard(() => withParts(this.#plain, changes), 'cannotSet', JSON.stringify(changes)),
    );
  }

  startOf(name) {
    return this.#next(
      guard(() => this.#plain.round({ smallestUnit: unit(name), roundingMode: 'floor' }), 'cannotRound', String(name)),
    );
  }

  endOf(name) {
    const target = unit(name);
    return this.startOf(target).plus(stepOf(target)).minus(endPrecision(target));
  }

  round(increment, name) {
    return this.#round(increment, name, 'halfExpand');
  }

  floor(increment, name) {
    return this.#round(increment, name, 'floor');
  }

  ceil(increment, name) {
    return this.#round(increment, name, 'ceil');
  }

  #round(increment, name, mode) {
    const [count, target] = isString(increment) && !isDigits(increment) ? [1, increment] : [Number(increment), name];
    return this.#next(
      guard(
        () => this.#plain.round({ smallestUnit: unit(target), roundingIncrement: count, roundingMode: mode }),
        'cannotRound',
        `${count} ${target}`,
      ),
    );
  }

  // a range from this time until another, the end excluded
  to(end, name) {
    return new TimeRange(this, name === undefined ? end : duration(end, name));
  }

  /*******************************
            Comparison
  *******************************/

  equals(other) {
    return this.#compare(other) === 0;
  }

  #compare(other) {
    return Temporal.PlainTime.compare(this.#plain, new Time(other).toTemporal());
  }

  isBefore(other) {
    return this.#compare(other) < 0;
  }

  isAfter(other) {
    return this.#compare(other) > 0;
  }

  isSame(other, name) {
    if (name === undefined) {
      return this.equals(other);
    }
    return this.startOf(name).equals(new Time(other).startOf(name));
  }

  /*******************************
             Measure
  *******************************/

  // within the day, signed: 22:00 until 02:00 is minus twenty hours, not four
  until(other, name) {
    const span = anchored(
      this.#plain.until(new Time(other).toTemporal(), { largestUnit: 'hour' }),
      undefined,
      this.#locale,
    );
    return name === undefined ? span : span.total(name);
  }

  since(other, name) {
    return new Time(other, { locale: this.#locale }).until(this, name);
  }

  on(day, zone) {
    return new CalendarDate(day, { locale: this.#locale }).at(this, zone);
  }

  as(kind) {
    return readAs(kind, { time: () => this });
  }

  /*******************************
              Output
  *******************************/

  format(spec, locale = this.#locale) {
    const options = intlOptions('time', spec);
    return options ? formatIntl('time', this.#plain, options, locale) : formatTokens(this, 'time', spec, locale);
  }

  // a fraction prints in groups of three, the width its precision needs, so one precision is one width
  toString() {
    const digits = this.nanosecond ? 9 : this.microsecond ? 6 : this.millisecond ? 3 : 0;
    return this.#plain.toString({ fractionalSecondDigits: digits });
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
        ? 'a `Time` cannot be converted to a number for `<`, `>`, or `-`. compare times with `isBefore()`, `isAfter()`, or `equals()`, or measure the difference with `until()`'
        : 0,
    });
  }

  // + gives the string, while < and - still refuse through valueOf
  [Symbol.toPrimitive](hint) {
    return hint === 'number' ? this.valueOf() : this.toString();
  }

  [inspect]() {
    return `Time(${this.#plain})`;
  }
}

// for is to given a length, the word that reads aloud: start.for(8, 'hours')
alias(Time, { add: 'plus', subtract: 'minus', lang: 'locale', for: 'to' });

export const time = (input, minuteOrOptions, second) => {
  const build = () =>
    input instanceof Time && minuteOrOptions === undefined ? input : new Time(input, minuteOrOptions, second);
  return isPlainObject(minuteOrOptions) && minuteOrOptions.loose ? loosely(build) : build();
};

export const isTime = (value) => value instanceof Time;
