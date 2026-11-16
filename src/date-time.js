import { isDate, isNumber, isPlainObject, isString } from '@semantic-ui/utils';

import { CalendarDate, today } from './calendar-date.js';
import { anchored, duration } from './duration.js';
import { isDevelopment } from './helpers/environment.js';
import { guard, loosely, parseLoose, readAs, refuse, refuseType, requireLoose } from './helpers/errors.js';
import { temporalDurationFrom } from './helpers/fields.js';
import { formatIntl, intlOptions } from './helpers/format.js';
import { IS_DATE_TIME, IS_MONTH_DAY } from './helpers/identity.js';
import { relativeSeconds } from './helpers/relative.js';
import { formatTokens } from './helpers/tokens.js';
import {
  endPrecision,
  hasOffset,
  hasTime,
  hasZoneName,
  inspect,
  isDigits,
  isInstant,
  isPlainDate,
  isPlainDateTime,
  isZonedDateTime,
  localeOf,
  quarterStart,
  singularKeys,
  stepOf,
  unit,
  weekdayNumber,
  withParts,
  zoneOptions,
} from './helpers/units.js';
import { weekStart, zoneId } from './helpers/zones.js';
import { MonthDay } from './month-day.js';
import { DateTimeRange } from './range.js';
import { Time } from './time.js';
import { YearMonth } from './year-month.js';

/*
  an exact moment with a zone to read it in. one type for timestamps, appointments and deadlines.
  an explicit zone wins, then a bracketed zone in the string, then the default. a Z or an offset in
  the string fixes the instant only, it never becomes the zone: the offset a database prints is a
  view, and arithmetic across a DST boundary needs the real zone
*/

export class DateTime {
  // brand datetime
  get [IS_DATE_TIME]() {
    return true;
  }
  static [Symbol.hasInstance](value) {
    return !!value?.[IS_DATE_TIME];
  }

  #zoned;
  #locale;

  constructor(input, options) {
    const settings = zoneOptions(options);
    this.#locale = localeOf(settings, input);
    this.#zoned =
      isZonedDateTime(input) && settings.zone === undefined && !settings.loose && settings.dayFirst === undefined
        ? input
        : DateTime.#read(input, settings);
    // the parts are own properties, so a value prints them in a console without a click and reads them without a call,
    // in the order a preview reads: the text first, filled once the parts it reads are in, then month, day, year
    this.text = undefined;
    const zoned = this.#zoned;
    this.month = zoned.month;
    this.day = zoned.day;
    this.year = zoned.year;
    this.weekday = zoned.dayOfWeek;
    this.hour = zoned.hour;
    this.minute = zoned.minute;
    this.second = zoned.second;
    this.millisecond = zoned.millisecond;
    this.zone = zoned.timeZoneId;
    this.offset = zoned.offset;
    this.epoch = zoned.epochMilliseconds;
    this.text = this.format('text');
    Object.freeze(this);
  }

  static #read(input, { zone, loose, dayFirst } = {}) {
    // the zone resolves first so a bad one throws even when the input turns out unreadable
    const timeZone = zoneId(zone);
    if (loose || dayFirst !== undefined) {
      requireLoose(loose ? 'loose' : 'dayFirst');
    }
    if (input === undefined || input === null) {
      return refuseType('missingDateTime', String(input), {
        explanation: isDevelopment
          ? 'a datetime value is required. use `now()` for the current moment'
          : 0,
      });
    }
    if (input instanceof DateTime) {
      return zone === undefined ? input.toTemporal() : input.toTemporal().withTimeZone(timeZone);
    }
    if (input instanceof CalendarDate) {
      return input.toTemporal().toZonedDateTime({ timeZone });
    }
    if (isDate(input) || isNumber(input)) {
      const epoch = isNumber(input) ? input : input.getTime();
      if (!Number.isFinite(epoch)) {
        refuse('invalidNumber', String(input), {
          explanation: isDevelopment ? 'expected a finite timestamp or a valid `Date` instance' : 0,
        });
      }
      return Temporal.Instant.fromEpochMilliseconds(epoch).toZonedDateTimeISO(timeZone);
    }
    if (isString(input)) {
      return DateTime.#parse(input, zone, loose, dayFirst);
    }
    if (isZonedDateTime(input)) {
      return zone === undefined ? input : input.withTimeZone(timeZone);
    }
    if (isInstant(input)) {
      return input.toZonedDateTimeISO(timeZone);
    }
    if (isPlainDateTime(input)) {
      return input.toZonedDateTime(timeZone);
    }
    if (isPlainDate(input)) {
      return input.toZonedDateTime({ timeZone });
    }
    if (isPlainObject(input)) {
      return guard(
        () => Temporal.ZonedDateTime.from({ ...singularKeys(input), timeZone }, { overflow: 'reject' }),
        'invalidDateTime',
        JSON.stringify(input),
      );
    }
    return refuseType('invalidDateTime', String(input), {
      explanation: isDevelopment
        ? 'expected an ISO string, a `Date`, epoch milliseconds, a fields object, a `CalendarDate`, or a `Temporal` value'
        : 0,
    });
  }

  static #parse(text, zone, loose, dayFirst) {
    const trimmed = text.trim();
    try {
      return guard(
        () => {
          if (hasZoneName.test(trimmed)) {
            const zoned = Temporal.ZonedDateTime.from(trimmed);
            return zone === undefined ? zoned : zoned.withTimeZone(zoneId(zone));
          }
          if (hasTime.test(trimmed)) {
            return hasOffset.test(trimmed)
              ? Temporal.Instant.from(trimmed).toZonedDateTimeISO(zoneId(zone))
              : Temporal.PlainDateTime.from(trimmed).toZonedDateTime(zoneId(zone));
          }
          return Temporal.PlainDate.from(trimmed).toZonedDateTime({ timeZone: zoneId(zone) });
        },
        'invalidDateTime',
        text,
        isDevelopment
          ? "expected an ISO string like '2026-09-06T14:30:00Z', '2026-09-06T14:30', or '2026-09-06'. pass `{ loose: true }` with '@native-dates/plugins/loose' for informal date strings"
          : 0,
      );
    }
    catch (error) {
      if (!loose || error.code !== 'invalidDateTime') {
        throw error;
      }
      const zoned = parseLoose(trimmed, zone, dayFirst);
      if (!zoned) {
        throw error;
      }
      return zoned;
    }
  }

  // the locale this value is written in, or the same value written in another. it rides along through
  // every method, so a chain names its language once: now().locale('es').plus(1, 'week').format('long').
  // an unset tag clears it, so locale(preferences.language) chains whether or not there is one
  locale(...tag) {
    return tag.length ? new DateTime(this.#zoned, { locale: tag[0] }) : this.#locale;
  }

  #next(zoned) {
    return new DateTime(zoned, { locale: this.#locale });
  }

  /*******************************
              Reads
  *******************************/

  get microsecond() {
    return this.#zoned.microsecond;
  }
  get nanosecond() {
    return this.#zoned.nanosecond;
  }
  // the exact instant as a BigInt, the key two datetimes a nanosecond apart still tell apart on
  get epochNanoseconds() {
    return this.#zoned.epochNanoseconds;
  }
  // the day this value's weeks start on, 1 for monday through 7 for sunday
  get weekStart() {
    return weekStart(undefined, this.#locale);
  }
  get quarter() {
    return Math.ceil(this.#zoned.month / 3);
  }
  get dayOfYear() {
    return this.#zoned.dayOfYear;
  }
  get weekOfYear() {
    return this.#zoned.weekOfYear;
  }
  get daysInMonth() {
    return this.#zoned.daysInMonth;
  }
  get daysInYear() {
    return this.#zoned.daysInYear;
  }
  get hoursInDay() {
    return this.#zoned.hoursInDay;
  }
  isLeapYear() {
    return this.#zoned.inLeapYear;
  }
  isWeekend() {
    return this.#zoned.dayOfWeek >= 6;
  }
  isWeekday() {
    return this.#zoned.dayOfWeek < 6;
  }
  get date() {
    return new CalendarDate(this.#zoned.toPlainDate(), { locale: this.#locale });
  }
  get time() {
    return new Time(this.#zoned.toPlainTime(), { locale: this.#locale });
  }
  get monthDay() {
    return new MonthDay(this);
  }
  get yearMonth() {
    return new YearMonth(this);
  }
  as(kind) {
    return readAs(kind, {
      datetime: () => this,
      date: () => this.date,
      time: () => this.time,
      monthDay: () => this.monthDay,
      yearMonth: () => this.yearMonth,
    });
  }

  /*******************************
            Arithmetic
  *******************************/

  plus(amount, name) {
    return this.#next(
      guard(() => this.#zoned.add(temporalDurationFrom(amount, name)), 'cannotAdd', `${amount} ${name ?? ''}`),
    );
  }

  minus(amount, name) {
    return this.#next(
      guard(
        () => this.#zoned.subtract(temporalDurationFrom(amount, name)),
        'cannotSubtract',
        `${amount} ${name ?? ''}`,
      ),
    );
  }

  set(fields, value) {
    const changes = isString(fields) ? { [unit(fields)]: value } : singularKeys(fields);
    return this.#next(
      guard(() => withParts(this.#zoned, changes), 'cannotSet', JSON.stringify(changes)),
    );
  }

  at(when) {
    return this.date.at(when, this.zone);
  }

  in(zone) {
    return this.#next(this.#zoned.withTimeZone(zoneId(zone)));
  }

  // a week starts on the configured first day, or on the one given: a picker's first day is a prop
  startOf(name, firstDay) {
    const target = unit(name);
    switch (target) {
      case 'year':
        return this.#next(this.#zoned.with({ month: 1, day: 1 }).startOfDay());
      case 'quarter':
        return this.#next(this.#zoned.with({ month: quarterStart(this.month), day: 1 }).startOfDay());
      case 'month':
        return this.#next(this.#zoned.with({ day: 1 }).startOfDay());
      case 'week':
        return this.#next(
          this.#zoned.subtract({ days: (this.weekday - weekStart(firstDay, this.#locale) + 7) % 7 }).startOfDay(),
        );
      case 'day':
        return this.#next(this.#zoned.startOfDay());
      default:
        return this.#next(this.#zoned.round({ smallestUnit: target, roundingMode: 'floor' }));
    }
  }

  // the last millisecond, the precision of Date and of now(). for a query bound prefer range(unit)
  endOf(name, firstDay) {
    const target = unit(name);
    return this.startOf(target, firstDay).plus(stepOf(target)).minus(endPrecision(target));
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
        () => this.#zoned.round({ smallestUnit: unit(target), roundingIncrement: count, roundingMode: mode }),
        'cannotRound',
        `${count} ${target}`,
      ),
    );
  }

  // steps to a weekday, or to a month-day's occurrence, at this time of day in this zone
  next(target) {
    if (target?.[IS_MONTH_DAY]) {
      return this.date.next(target).at(this.time, this.zone);
    }
    const delta = (weekdayNumber(target) - this.weekday + 7) % 7 || 7;
    return this.plus({ days: delta });
  }

  previous(target) {
    if (target?.[IS_MONTH_DAY]) {
      return this.date.previous(target).at(this.time, this.zone);
    }
    const delta = (this.weekday - weekdayNumber(target) + 7) % 7 || 7;
    return this.minus({ days: delta });
  }

  // a range from this moment until another, the end excluded, or the unit this moment falls in
  to(end, name) {
    return new DateTimeRange(this, name === undefined ? end : duration(end, name));
  }

  range(name, firstDay) {
    const start = this.startOf(name, firstDay);
    return new DateTimeRange(start, start.plus(stepOf(unit(name))));
  }

  /*******************************
            Comparison
  *******************************/

  equals(other) {
    return this.#compare(other) === 0;
  }

  // exact time only, so another DateTime compares as it is and never re-zones
  #compare(other) {
    const rival = other instanceof DateTime ? other : new DateTime(other, this.zone);
    return Temporal.ZonedDateTime.compare(this.#zoned, rival.toTemporal());
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
    return this.startOf(name, first).equals(new DateTime(other, this.zone).startOf(name, first));
  }

  isPast() {
    return this.isBefore(now(this.zone));
  }

  isFuture() {
    return this.isAfter(now(this.zone));
  }

  isToday() {
    return this.date.equals(today(this.zone));
  }

  isTomorrow() {
    return this.date.equals(today(this.zone).plus({ days: 1 }));
  }

  isYesterday() {
    return this.date.equals(today(this.zone).minus({ days: 1 }));
  }

  /*******************************
             Measure
  *******************************/

  // a duration balanced from years down, remembering this moment so it can total in any unit.
  // with a unit, the total as a number
  until(other, name) {
    const end = new DateTime(other, this.zone);
    const span = anchored(this.#zoned.until(end.toTemporal(), { largestUnit: 'year' }), this.#zoned, this.#locale);
    return name === undefined ? span : span.total(name);
  }

  since(other, name) {
    return new DateTime(other, { zone: this.zone, locale: this.#locale }).until(this, name);
  }

  /*******************************
              Output
  *******************************/

  format(spec, locale = this.#locale) {
    const options = intlOptions('datetime', spec);
    return options
      ? formatIntl('datetime', this.epoch, options, locale, this.zone)
      : formatTokens(this, 'datetime', spec, locale);
  }

  // how far this moment is from another, in words: '3 hours ago', 'in 2 days'. from now when no
  // other is given
  from(other, locale = this.#locale) {
    const reference = other === undefined ? Date.now() : new DateTime(other, this.zone).epoch;
    return relativeSeconds((this.epoch - reference) / 1000, locale);
  }

  fromNow(locale) {
    return this.from(undefined, locale);
  }

  // the instant in UTC, the form every database and API reads. the zone is a view and does not travel
  toString() {
    const nanos = this.#zoned.epochNanoseconds % 1_000_000n;
    const digits = nanos === 0n ? 3 : nanos % 1000n === 0n ? 6 : 9;
    return this.#zoned.toInstant().toString({ fractionalSecondDigits: digits });
  }

  toJSON() {
    return this.toString();
  }

  toJSDate() {
    return new Date(this.epoch);
  }

  toTemporal() {
    return this.#zoned;
  }

  valueOf() {
    return this.epoch;
  }

  // + gives the string and < and - the number, the way Date decides
  [Symbol.toPrimitive](hint) {
    return hint === 'number' ? this.epoch : this.toString();
  }

  [inspect]() {
    return `DateTime(${this.#zoned})`;
  }
}

DateTime.prototype.add = DateTime.prototype.plus;
DateTime.prototype.subtract = DateTime.prototype.minus;
DateTime.prototype.remove = DateTime.prototype.minus;
DateTime.prototype.lang = DateTime.prototype.locale;
DateTime.prototype.formatRelative = DateTime.prototype.from;

// with { loose: true } (via plugins/loose) an unreadable input is null, never a throw
export const datetime = (input, options) => {
  const settings = zoneOptions(options);
  const build = () =>
    input instanceof DateTime && settings.zone === undefined && settings.dayFirst === undefined
      && settings.locale === undefined
      ? input
      : new DateTime(input, settings);
  return settings.loose ? loosely(build) : build();
};

// millisecond precision, the precision of Date, so a value survives a JSON round trip unchanged
export const now = (zone) =>
  new DateTime(Temporal.Instant.fromEpochMilliseconds(Date.now()).toZonedDateTimeISO(zoneId(zone)));

// the two bounds a query for today writes most
export const startOfToday = (zone) => now(zone).startOf('day');
export const endOfToday = (zone) => now(zone).endOf('day');

export const isDateTime = (value) => value instanceof DateTime;
