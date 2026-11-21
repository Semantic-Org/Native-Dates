import { isDate, isNumber, isPlainObject, isString } from './helpers/utils.js';

import { CalendarDate } from './calendar-date.js';
import { DateTime } from './date-time.js';
import { anchored, duration } from './duration.js';
import { isDevelopment } from './helpers/environment.js';
import { fail, guard, loosely, parseLoose, readAs, refuse, refuseType, requireLoose } from './helpers/errors.js';
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
  isUnzoned,
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

/*
  a wall-clock time with no date and no zone (Temporal.PlainTime).
  Arithmetic wraps modulo 24 hours and rejects calendar units until anchored to a date via .on()
*/

// minutes follow a colon or an 'h' ('14:30', '14h30', '14 h 30'). A bare '14h' stays a duration
const clock = /^(\d{1,2})(?:(?::| ?h ?)(\d{2}))?(?::(\d{2})(?:\.(\d{1,9}))?)?\s*([ap]\.?m\.?)?$/i;

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
    this.text = undefined; // keep text first in console previews
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
          ? 'a time value is required. Use `now().time` for the current time of day'
          : 0,
      });
    }
    if (isNumber(input)) {
      return guard(
        () => {
          if (!wholeNumbers([input, minute, second])) {
            fail(isDevelopment ? 'hour, minute, and second must be whole numbers' : '');
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
    // instants and zoned inputs resolve their wall-clock time in the requested (or default) zone
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
        const zoned = parseLoose(input, { ...settings, timeOnly: true });
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

  // custom regex handles 12-hour '9am' / '5:30 pm' forms before falling back to Temporal's strict ISO parser
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
              ? "12-hour times with 'am' or 'pm' must use hours from 1 to 12. Drop 'am' or 'pm' for 24-hour time like '13:00', or use '1pm'"
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
        ? "expected a clock time like '09:00', '5:30pm', or '17:30:15'. Pass `{ loose: true }` with '@native-dates/plugins/loose' to extract the time from an informal date-time string"
        : 0,
    );
  }

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

  plus(amount, name) {
    return this.#next(
      guard(() => this.#plain.add(Time.#clockFields(amount, name)), 'cannotAdd', `${amount} ${name ?? ''}`),
    );
  }

  // Temporal.PlainTime.add({ days: 1 }) silently wraps to a no-op, so reject calendar units explicitly
  static #clockFields(amount, name) {
    const fields = fieldsFrom(amount, name);
    const calendar = ['years', 'months', 'weeks', 'days'].find((field) => fields[field]);
    if (calendar) {
      refuse('unsupportedUnit', calendar, {
        explanation: isDevelopment
          ? "a `Time` has no calendar date, so it only accepts clock units like hours, minutes, or seconds. Attach a date first with `.on('2026-11-06', zone)` to add or subtract calendar units"
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
    return this.startOfNext(name).minus(endPrecision(unit(name)));
  }

  startOfNext(name) {
    return this.startOf(name).plus(stepOf(unit(name)));
  }

  startOfPrevious(name) {
    return this.startOf(name).minus(stepOf(unit(name)));
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

  // measures within a single 00:00..23:59 day (22:00 to 02:00 is -20h, whereas TimeRange wraps overnight)
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
    // Date, Temporal.Instant, and instant strings carry no zone of their own, so resolve their date in `zone`
    return new CalendarDate(day, { zone: isUnzoned(day) ? zone : undefined, locale: this.#locale }).at(this, zone);
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

  // pad sub-second precision to 3, 6, or 9 digits rather than Temporal's unpadded '.5'
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
        ? 'a `Time` cannot be converted to a number for `<`, `>`, or `-`. Compare times with `isBefore()`, `isAfter()`, or `equals()`, or measure the difference with `until()`'
        : 0,
    });
  }

  // '+' sends hint 'default', which would call valueOf() and throw without this
  [Symbol.toPrimitive](hint) {
    return hint === 'number' ? this.valueOf() : this.toString();
  }

  [inspect]() {
    return `Time(${this.#plain})`;
  }
}

alias(Time, { add: 'plus', subtract: 'minus', lang: 'locale', for: 'to' });

export const time = (input, minuteOrOptions, second) => {
  const build = () =>
    input instanceof Time && minuteOrOptions === undefined ? input : new Time(input, minuteOrOptions, second);
  return isPlainObject(minuteOrOptions) && minuteOrOptions.loose ? loosely(build) : build();
};

export const isTime = (value) => value instanceof Time;
