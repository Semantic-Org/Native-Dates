import { isDate, isNumber, isPlainObject, isString } from './helpers/utils.js';

import { CalendarDate, today } from './calendar-date.js';
import { anchored, duration } from './duration.js';
import { isDevelopment } from './helpers/environment.js';
import { guard, loosely, parseLoose, readAs, refuse, refuseType, requireLoose } from './helpers/errors.js';
import { temporalDurationFrom } from './helpers/fields.js';
import { formatIntl, intlOptions, textFormat } from './helpers/format.js';
import { IS_DATE_TIME, IS_MONTH_DAY } from './helpers/identity.js';
import { yearFirst } from './helpers/parts.js';
import { relativeSeconds } from './helpers/relative.js';
import { formatTokens } from './helpers/tokens.js';
import {
  alias,
  dayOfWeek,
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
  weekdayNamed,
  withParts,
  zoneOptions,
} from './helpers/units.js';
import { checkedDisambiguation, isWeekend, weekStart, zoneId } from './helpers/zones.js';
import { MonthDay } from './month-day.js';
import { DateTimeRange } from './range.js';
import { Time } from './time.js';
import { YearMonth } from './year-month.js';

/*
  an exact instant paired with an IANA zone (Temporal.ZonedDateTime).
  Explicit `zone` wins, then a bracketed `[Zone]` in the input string, then the configured or system zone.
  Trailing `Z` or numeric offsets (`-05:00`) fix the instant without setting `this.zone`, so arithmetic across
  DST transitions uses real zone rules rather than a frozen offset
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
    const read = isZonedDateTime(input) && settings.zone === undefined && !settings.loose
        && settings.dayFirst === undefined && settings.disambiguation === undefined
      ? input
      : DateTime.#read(input, settings);
    const zoned = read.calendarId === 'iso8601' ? read : read.withCalendar('iso8601');
    this.#zoned = zoned;
    // keep month, day, year, hour, minute in the first five own fields so browser DevTools previews distinguish same-day times
    this.month = zoned.month;
    this.day = zoned.day;
    this.year = zoned.year;
    this.hour = zoned.hour;
    this.minute = zoned.minute;
    this.second = zoned.second;
    this.millisecond = zoned.millisecond;
    this.dayOfWeek = zoned.dayOfWeek;
    this.zone = zoned.timeZoneId;
    this.offset = zoned.offset;
    this.epochMilliseconds = zoned.epochMilliseconds;
    Object.freeze(this);
  }

  static #read(input, settings) {
    const { zone, loose, dayFirst } = settings;
    // validate zone and disambiguation up front so bad options throw even when loose: true returns null on bad input
    const timeZone = zoneId(zone, settings.locale);
    const disambiguation = checkedDisambiguation(settings.disambiguation);
    if (loose || dayFirst !== undefined) {
      requireLoose(loose ? 'loose' : 'dayFirst');
    }
    if (input === undefined || input === null) {
      return refuseType('missingDateTime', String(input), {
        explanation: isDevelopment
          ? 'a datetime value is required. Use `now()` for the current moment'
          : 0,
      });
    }
    if (input instanceof DateTime) {
      return zone === undefined ? input.toTemporal() : input.toTemporal().withTimeZone(timeZone);
    }
    if (input instanceof CalendarDate) {
      return guard(
        () => input.toTemporal().toZonedDateTime({ timeZone }),
        'invalidDateTime',
        String(input),
      );
    }
    if (isDate(input) || isNumber(input)) {
      const epoch = isNumber(input) ? input : input.getTime();
      if (!Number.isFinite(epoch)) {
        refuse('invalidNumber', String(input), {
          explanation: isDevelopment ? 'expected a finite timestamp or a valid `Date` instance' : 0,
        });
      }
      // performance.now() and arithmetic can produce fractional ms, which Date truncates and Temporal rejects
      return Temporal.Instant.fromEpochMilliseconds(Math.trunc(epoch)).toZonedDateTimeISO(timeZone);
    }
    if (isString(input)) {
      return DateTime.#parse(input, settings, timeZone, disambiguation);
    }
    if (isZonedDateTime(input)) {
      return zone === undefined ? input : input.withTimeZone(timeZone);
    }
    if (isInstant(input)) {
      return input.toZonedDateTimeISO(timeZone);
    }
    if (isPlainDateTime(input)) {
      return guard(() => input.toZonedDateTime(timeZone, { disambiguation }), 'invalidDateTime', String(input));
    }
    if (isPlainDate(input)) {
      return guard(() => input.toZonedDateTime({ timeZone }), 'invalidDateTime', String(input));
    }
    if (isPlainObject(input)) {
      return guard(
        () => Temporal.ZonedDateTime.from({ ...singularKeys(input), timeZone }, { overflow: 'reject', disambiguation }),
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

  static #parse(text, settings, timeZone, disambiguation) {
    const trimmed = yearFirst(text.trim());
    try {
      return guard(
        () => {
          if (hasZoneName.test(trimmed)) {
            const zoned = Temporal.ZonedDateTime.from(trimmed, { disambiguation });
            return settings.zone === undefined ? zoned : zoned.withTimeZone(timeZone);
          }
          if (hasTime.test(trimmed)) {
            return hasOffset.test(trimmed)
              ? Temporal.Instant.from(trimmed).toZonedDateTimeISO(timeZone)
              : Temporal.PlainDateTime.from(trimmed).toZonedDateTime(timeZone, { disambiguation });
          }
          return Temporal.PlainDate.from(trimmed).toZonedDateTime({ timeZone });
        },
        'invalidDateTime',
        text,
        // separate out-of-range fields (like Feb 30) from malformed string syntax
        isDevelopment
          ? /^\d{4}-\d{2}-\d{2}(?:[T ]\d{2}:\d{2}(?::\d{2}(?:\.\d{1,9})?)?(?:[zZ]|[+-](?:[01]\d|2[0-3]):[0-5]\d)?)?$/
              .test(trimmed)
            ? 'this date or time does not exist. Check the year, month, day, and time fields'
            : "expected an ISO string like '2026-09-06T14:30:00Z', '2026-09-06T14:30', or '2026-09-06'. Pass `{ loose: true }` with '@native-dates/plugins/loose' for informal date strings"
          : 0,
      );
    }
    catch (error) {
      if (!settings.loose || error.code !== 'invalidDateTime') {
        throw error;
      }
      const zoned = parseLoose(trimmed, settings);
      if (!zoned) {
        throw error;
      }
      return zoned;
    }
  }

  locale(...tag) {
    return tag.length ? new DateTime(this.#zoned, { locale: tag[0] }) : this.#locale;
  }

  #next(zoned) {
    return new DateTime(zoned, this.#locale ? { locale: this.#locale } : undefined);
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
  // floor rather than trunc so pre-1970 timestamps step back to the preceding whole second
  get epochSeconds() {
    return Math.floor(this.epochMilliseconds / 1000);
  }
  get epochNanoseconds() {
    return this.#zoned.epochNanoseconds;
  }
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
    return isWeekend(this.#zoned.dayOfWeek, this.#locale);
  }
  isWeekday() {
    return !this.isWeekend();
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
    return this.#next(guard(() => withParts(this.#zoned, changes), 'cannotSet', JSON.stringify(changes)));
  }

  at(when, options) {
    return this.date.at(when, isPlainObject(options) ? { ...options, zone: this.zone } : this.zone);
  }

  in(zone) {
    return this.#next(this.#zoned.withTimeZone(zoneId(zone, this.#locale)));
  }

  // startOfDay() handles zones where midnight itself is skipped by a DST transition (e.g. Havana)
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
          this.#zoned.subtract({ days: (this.dayOfWeek - weekStart(firstDay, this.#locale) + 7) % 7 }).startOfDay(),
        );
      case 'day':
        return this.#next(this.#zoned.startOfDay());
      default:
        return this.#next(this.#zoned.round({ smallestUnit: target, roundingMode: 'floor' }));
    }
  }

  // inclusive last ms (or ns for sub-ms units). Prefer range(unit) for half-open query bounds
  endOf(name, firstDay) {
    return this.#nextStart(name, firstDay).minus(endPrecision(unit(name)));
  }

  // re-anchor after stepping so skipped midnights or 30-minute DST transitions land on the next true boundary
  #nextStart(name, firstDay) {
    const step = stepOf(unit(name));
    const first = this.startOf(name, firstDay).plus(step);
    const next = first.startOf(name, firstDay);
    return next.isAfter(this) ? next : first.plus(step).startOf(name, firstDay);
  }

  startOfNext(target, firstDay) {
    return weekdayNamed(target)
      ? this.date.next(target).at(undefined, this.zone)
      : this.#nextStart(target, firstDay);
  }

  // step 1ns before startOf() rather than subtracting 1 unit, which can land inside a skipped DST day or hour
  startOfPrevious(target, firstDay) {
    return weekdayNamed(target)
      ? this.date.previous(target).at(undefined, this.zone)
      : this.startOf(target, firstDay).minus({ nanoseconds: 1 }).startOf(target, firstDay);
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

  next(target) {
    if (target?.[IS_MONTH_DAY]) {
      return this.date.next(target).at(this.time, this.zone);
    }
    const delta = (dayOfWeek(target) - this.dayOfWeek + 7) % 7 || 7;
    return this.plus({ days: delta });
  }

  previous(target) {
    if (target?.[IS_MONTH_DAY]) {
      return this.date.previous(target).at(this.time, this.zone);
    }
    const delta = (this.dayOfWeek - dayOfWeek(target) + 7) % 7 || 7;
    return this.minus({ days: delta });
  }

  to(end, name) {
    return new DateTimeRange(this, name === undefined ? end : duration(end, name));
  }

  range(name, firstDay) {
    return new DateTimeRange(this.startOf(name, firstDay), this.#nextStart(name, firstDay));
  }

  /*******************************
            Comparison
  *******************************/

  equals(other) {
    return this.#compare(other) === 0;
  }

  // compare exact instants across zones, parsing raw wall-clock inputs in this.zone
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
    // align both values to this instance's weekStart so differing locales test the same week boundaries
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

  until(other, name) {
    const end = new DateTime(other, this.zone);
    const span = anchored(this.#zoned.until(end.toTemporal(), { largestUnit: 'day' }), this.#zoned, this.#locale);
    return name === undefined ? span : span.total(name);
  }

  since(other, name) {
    return new DateTime(other, { zone: this.zone, locale: this.#locale }).until(this, name);
  }

  /*******************************
              Output
  *******************************/

  get text() {
    return this.format(textFormat);
  }

  format(spec, locale = this.#locale) {
    const options = intlOptions('datetime', spec);
    return options
      ? formatIntl('datetime', this.epochMilliseconds, options, locale, this.zone)
      : formatTokens(this, 'datetime', spec, locale);
  }

  from(other, locale = this.#locale) {
    const reference = other === undefined ? Date.now() : new DateTime(other, this.zone).epochMilliseconds;
    return relativeSeconds((this.epochMilliseconds - reference) / 1000, locale);
  }

  fromNow(locale) {
    return this.from(undefined, locale);
  }

  // serialize as standard UTC '...Z' (databases and Date.parse reject Temporal's '[Zone]' suffix),
  // defaulting to .sssZ like Date.toISOString() unless µs or ns digits are nonzero
  toString() {
    const nanos = this.#zoned.epochNanoseconds % 1_000_000n;
    const digits = nanos === 0n ? 3 : nanos % 1000n === 0n ? 6 : 9;
    return this.#zoned.toInstant().toString({ fractionalSecondDigits: digits });
  }

  toJSON() {
    return this.toString();
  }

  toJSDate() {
    return new Date(this.epochMilliseconds);
  }

  toTemporal() {
    return this.#zoned;
  }

  valueOf() {
    return this.epochMilliseconds;
  }

  // '+' sends hint 'default', which would return ms instead of toString() without this
  [Symbol.toPrimitive](hint) {
    return hint === 'number' ? this.epochMilliseconds : this.toString();
  }

  [inspect]() {
    return `DateTime(${this.#zoned})`;
  }
}

alias(DateTime, { add: 'plus', subtract: 'minus', lang: 'locale', formatRelative: 'from', for: 'to' });

export const datetime = (input, options) => {
  const settings = zoneOptions(options);
  const build = () =>
    input instanceof DateTime && settings.zone === undefined && settings.dayFirst === undefined
      && settings.locale === undefined && settings.disambiguation === undefined
      ? input
      : new DateTime(input, settings);
  return settings.loose ? loosely(build) : build();
};

// use Date.now() ms precision rather than Temporal.Now ns so values survive a JSON or Date round trip unchanged
export const now = (zone) =>
  new DateTime(Temporal.Instant.fromEpochMilliseconds(Date.now()).toZonedDateTimeISO(zoneId(zone)));

export const startOfToday = (zone) => now(zone).startOf('day');
export const endOfToday = (zone) => now(zone).endOf('day');

export const isDateTime = (value) => value instanceof DateTime;
