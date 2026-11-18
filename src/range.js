import { isNumber, isPlainObject, isString } from './helpers/utils.js';

import { CalendarDate } from './calendar-date.js';
import { DateTime } from './date-time.js';
import { days, duration, hours } from './duration.js';
import { isDevelopment } from './helpers/environment.js';
import { isUnreadable, loosely, readAs, refuse, refuseType, unreadable } from './helpers/errors.js';
import { isDurationFields } from './helpers/fields.js';
import { epochOf, formatter, intlOptions } from './helpers/format.js';
import { IS_DATE_RANGE, IS_DATE_TIME_RANGE, IS_DURATION, IS_RANGE, IS_TIME_RANGE } from './helpers/identity.js';
import { alias, inspect, isDigits, isTemporalDuration, stepOf, unit, zoneOptions } from './helpers/units.js';
import { Time } from './time.js';

/*
  a span between two points, named by what it holds. a date range runs through its end, both days
  included, because that is how people write dates: the 1st through the 7th is seven days. a datetime
  or time range runs until its end, the end excluded, because that is how bookings and shifts abut
*/

// the shared body. the three exported classes seal it to a kind, so a value names what it holds
class Range {
  // brand range
  get [IS_RANGE]() {
    return true;
  }
  static [Symbol.hasInstance](value) {
    return !!value?.[IS_RANGE];
  }

  static factoryNames = { date: 'dateRange', datetime: 'datetimeRange', time: 'timeRange' };

  // written out, since a minified bundle renames the classes and a console would print the short name
  static classNames = { date: 'DateRange', datetime: 'DateTimeRange', time: 'TimeRange' };

  // the nanoseconds in a day, the length of the clock a time range runs around
  static dayLength = 86_400e9;

  // (start, end, zone), (start, end, { zone, loose }), or (interval, { zone, loose })
  constructor(start, end, options) {
    const kind = this.constructor.kind;
    // the ends and the kind are own properties, so a range prints them in a console without a click. the
    // text is keyed first so a preview leads with it, and filled once the ends are read
    this.text = undefined;
    this.kind = kind;
    if (Range.isOptions(end)) {
      [end, options] = [undefined, end];
    }
    const settings = zoneOptions(options);
    if (start instanceof Range && end === undefined) {
      if (start.kind !== kind) {
        refuseType('conflictingRanges', `${Range.factoryNames[start.kind]} as ${Range.factoryNames[kind]}`, {
          explanation: isDevelopment
            ? 'cannot pass one range type directly into another range factory. convert a `DateRange` to a `DateTimeRange` with `.in(zone)`, or build a new range from converted `start` and `end` endpoints'
            : 0,
        });
      }
      return start;
    }
    if (isString(start) && end === undefined) {
      [start, end] = Range.#splitInterval(start);
    }
    this.start = Range.#read(kind, start, undefined, settings);
    this.end = Range.#readEnd(kind, end, this.start, settings);
    // a time range whose end comes first crosses midnight. the other kinds run forward
    if (kind !== 'time' && this.end.isBefore(this.start)) {
      refuse('invalidRange', `${this.start} to ${this.end}`, {
        explanation: isDevelopment
          ? 'range end cannot be earlier than its start. swap the start and end arguments, or order unknown endpoints with `earliest(a, b)` and `latest(a, b)`'
          : 0,
      });
    }
    this.text = kind === 'datetime' ? this.format('text') : this.format();
    Object.freeze(this);
  }

  // dateRange('a/b', { loose }) has no end, so an options bag can sit second. a fields object end has
  // unit keys, and this has only the option keys, so the two never read as each other
  static isOptions(value) {
    return isPlainObject(value) && Object.keys(value).length > 0
      && Object.keys(value).every((key) => ['loose', 'zone', 'dayFirst', 'locale'].includes(key));
  }

  // an interval string splits on its slash, never on the one inside a bracketed zone, and a text field's
  // own separators read too: '9am - 5pm', 'Sep 1 to Sep 7'
  static #splitInterval(text) {
    const blanked = text.replace(/\[[^\]]*\]/g, (zone) => ' '.repeat(zone.length));
    // a spaced dash or 'to' is looked for first, since a date may be written with slashes of its own
    const dash = blanked.match(/\s(?:-|–|to)\s/);
    if (dash) {
      return [text.slice(0, dash.index), text.slice(dash.index + dash[0].length)];
    }
    const at = blanked.indexOf('/');
    return at === -1 ? [text] : [text.slice(0, at), text.slice(at + 1)];
  }

  // an end reads through the kind's own factory with the range's options, and a datetime end reads in
  // the start's zone
  static #read(kind, value, start, { zone, loose, dayFirst, locale } = {}) {
    // an end is written in the start's locale, so a range has one
    const readOptions = { locale: locale ?? start?.locale() };
    const targetZone = kind === 'datetime' ? (start?.zone ?? zone) : zone;
    if (targetZone !== undefined) {
      readOptions.zone = targetZone;
    }
    if (loose) {
      readOptions.loose = true;
    }
    if (dayFirst !== undefined) {
      readOptions.dayFirst = dayFirst;
    }
    if (kind === 'date') {
      return new CalendarDate(value, readOptions);
    }
    if (kind === 'datetime') {
      return new DateTime(value, readOptions);
    }
    return new Time(value, readOptions);
  }

  // an end is a length when written as one, otherwise a point of the kind, and a string or fields
  // object the kind cannot read is tried as a length: '5pm' is a time, '2h' is two hours
  static #readEnd(kind, value, start, options) {
    let unread;
    if (!(value?.[IS_DURATION] || isTemporalDuration(value) || isDurationFields(value))) {
      try {
        return Range.#read(kind, value, start, options);
      }
      catch (error) {
        if (!(isString(value) || isPlainObject(value)) || !isUnreadable(error)) {
          throw error;
        }
        unread = error;
      }
    }
    let length;
    try {
      length = duration(value);
    }
    catch (error) {
      // an end is a point first, so what reads as neither is refused as the point it was meant to be
      throw unread ?? error;
    }
    return kind === 'date' ? start.plus(length).minus(days(1)) : start.plus(length);
  }

  /*******************************
              Reads
  *******************************/

  isEmpty() {
    return this.kind !== 'date' && this.start.equals(this.end);
  }

  // the whole length, anchored at the start so months and years total. a date range counts its last
  // day, and a time range across midnight measures the long way round
  get duration() {
    if (this.kind === 'date') {
      return this.start.until(this.end.plus(days(1)));
    }
    return this.#wraps() ? this.start.until(this.end).plus(hours(24)) : this.start.until(this.end);
  }

  #wraps() {
    return this.kind === 'time' && this.end.isBefore(this.start);
  }

  as(kind) {
    return readAs(kind, { duration: () => this.duration });
  }

  /*******************************
            Comparison
  *******************************/

  contains(value) {
    if (value instanceof Range) {
      const rival = this.#make(this.kind, value);
      if (this.kind === 'time') {
        const [start, end] = Range.#spanOf(this);
        return Range.#besides(rival).some(([rivalStart, rivalEnd]) => rivalStart >= start && rivalEnd <= end);
      }
      return !rival.start.isBefore(this.start) && !rival.end.isAfter(this.end);
    }
    return this.#holds(value);
  }

  #holds(value) {
    const at = Range.#read(this.kind, value, this.start);
    if (this.#wraps()) {
      return !at.isBefore(this.start) || at.isBefore(this.end);
    }
    if (at.isBefore(this.start)) {
      return false;
    }
    return this.#inclusive() ? !at.isAfter(this.end) : at.isBefore(this.end);
  }

  #inclusive() {
    return this.kind === 'date';
  }

  overlaps(other) {
    const rival = this.#make(this.kind, other);
    if (this.kind === 'time') {
      const [start, end] = Range.#spanOf(this);
      return Range.#besides(rival).some(([rivalStart, rivalEnd]) => rivalStart < end && start < rivalEnd);
    }
    if (this.#inclusive()) {
      return !this.start.isAfter(rival.end) && !rival.start.isAfter(this.end);
    }
    return this.start.isBefore(rival.end) && rival.start.isBefore(this.end);
  }

  #make(kind, start, end) {
    return new byKind[kind](start, end, { locale: this.start.locale() });
  }

  equals(other) {
    const rival = this.#make(this.kind, other);
    return this.start.equals(rival.start) && this.end.equals(rival.end);
  }

  /*******************************
             Measure
  *******************************/

  intersection(other) {
    const rival = this.#make(this.kind, other);
    if (this.kind === 'time') {
      return this.#clockIntersection(rival);
    }
    if (!this.overlaps(rival)) {
      return null;
    }
    const start = this.start.isAfter(rival.start) ? this.start : rival.start;
    const end = this.end.isBefore(rival.end) ? this.end : rival.end;
    return this.#make(this.kind, start, end);
  }

  // two time ranges across midnight can overlap in two pieces, 22:00 until 06:00 with 05:00 until 23:00,
  // and one range cannot hold both
  #clockIntersection(rival) {
    const [start, end] = Range.#spanOf(this);
    const pieces = Range.#besides(rival)
      .map(([rivalStart, rivalEnd]) => [Math.max(start, rivalStart), Math.min(end, rivalEnd)])
      .filter(([from, to]) => from < to);
    if (!pieces.length) {
      return null;
    }
    if (pieces.length > 1) {
      refuse('unsupportedIntersection', `${this} with ${rival}`, {
        explanation: isDevelopment
          ? 'these two time ranges wrap around midnight and overlap in two separate windows, which a single `TimeRange` cannot represent. split the overnight range at midnight and intersect each half separately'
          : 0,
      });
    }
    return this.#make('time', Range.#timeAt(pieces[0][0]), Range.#timeAt(pieces[0][1]));
  }

  // the clock is a circle, so a time range may cross midnight: the night shift runs from 22:00 until
  // 06:00. its ends map to nanoseconds since midnight with an end past midnight carried a day forward,
  // and another range is laid beside it a day either side, so an overlap across midnight shows on one
  static #spanOf(range) {
    const start = Range.#sinceMidnight(range.start);
    const end = Range.#sinceMidnight(range.end);
    return [start, end < start ? end + Range.dayLength : end];
  }

  static #sinceMidnight(time) {
    return new Temporal.PlainTime().until(time.toTemporal()).total('nanosecond');
  }

  static #besides(range) {
    const [start, end] = Range.#spanOf(range);
    return [-Range.dayLength, 0, Range.dayLength].map((shift) => [start + shift, end + shift]);
  }

  static #timeAt(nanoseconds) {
    const day = Range.dayLength;
    return new Time(new Temporal.PlainTime().add({ nanoseconds: ((nanoseconds % day) + day) % day }));
  }

  // a time range walks by elapsed length, so the walk crosses midnight and ends where the range does
  points(step, name) {
    const size = Range.#step(step, name);
    const points = [];
    if (this.kind === 'time') {
      const length = this.duration.total('nanosecond');
      for (let i = 0; size.times(i).total('nanosecond') < length; i++) {
        points.push(this.start.plus(size.times(i)));
      }
      return points;
    }
    for (let i = 0;; i++) {
      const next = this.start.plus(size.times(i));
      if (!this.#holds(next)) {
        return points;
      }
      points.push(next);
    }
  }

  // points(unit) walks by whole units, points(duration) by that length. either way the steps count out from
  // the start, so monthly from the 31st lands on each month's last day rather than drifting to the 28th
  static #step(step, name) {
    const size = name !== undefined
      ? duration(step, name)
      : isString(step) && !/\d/.test(step)
      ? duration(1, step)
      : duration(step);
    if (size.isZero() || size.isNegative()) {
      refuse('invalidStep', String(size), {
        explanation: isDevelopment ? 'step duration for `points()` and `split()` must be greater than zero' : 0,
      });
    }
    return size;
  }

  split(step, name) {
    const points = this.points(step, name);
    return points.map((start, i) => {
      const following = points[i + 1];
      if (following === undefined) {
        return this.#make(this.kind, start, this.end);
      }
      return this.#make(this.kind, start, this.#inclusive() ? following.minus(days(1)) : following);
    });
  }

  // datetimes re-read in a zone. a date range becomes the datetime range covering those days there,
  // which is the bound a database query wants: midnight through the midnight after the last day
  in(zone) {
    if (this.kind === 'date') {
      return this.#make('datetime', this.start.at('00:00', zone), this.end.plus(days(1)).at('00:00', zone));
    }
    if (this.kind === 'datetime') {
      return this.#make('datetime', this.start.in(zone), this.end.in(zone));
    }
    return refuse('unsupportedZone', String(this), {
      explanation: isDevelopment
        ? 'a `TimeRange` has no calendar date, so it cannot be placed in a time zone directly. anchor each end to a date with `.on(day, zone)` on `start` and `end`'
        : 0,
    });
  }

  /*******************************
              Output
  *******************************/

  // a range is written in one locale, its start's. an unset tag clears it
  locale(...tag) {
    return tag.length
      ? new byKind[this.kind](this.start.locale(tag[0]), this.end.locale(tag[0]))
      : this.start.locale();
  }

  format(spec, locale = this.start.locale()) {
    const options = intlOptions(this.kind, spec);
    // a token pattern has no range form in Intl, so each end prints by it
    if (!options) {
      return `${this.start.format(spec, locale)} – ${this.end.format(spec, locale)}`;
    }
    // a time range across midnight is one whose end reads earlier on the same day, and Intl formats
    // that as it stands, in the locale's own range form
    const [start, end] = this.kind === 'datetime'
      ? [this.start.epochMilliseconds, this.end.epochMilliseconds]
      : [this.start.toTemporal(), this.end.toTemporal()];
    return formatter(this.kind, options, locale, this.start.zone)
      .formatRange(epochOf(this.kind, start), epochOf(this.kind, end));
  }

  toString() {
    return `${this.start}/${this.end}`;
  }

  toJSON() {
    return this.toString();
  }

  valueOf() {
    return refuse('unsupportedComparison', String(this), {
      explanation: isDevelopment
        ? 'ranges cannot be converted to a number for `<`, `>`, or `-`. read `.duration` to measure length, or use `compare(a, b)` and `equals()` to compare ranges'
        : 0,
    });
  }

  // + gives the string, while < and - still refuse through valueOf
  [Symbol.toPrimitive](hint) {
    return hint === 'number' ? this.valueOf() : this.toString();
  }

  [inspect]() {
    return `${Range.classNames[this.kind]}(${this.start} ${this.#inclusive() ? 'through' : 'until'} ${this.end})`;
  }
}

export class DateRange extends Range {
  // brand date range
  get [IS_DATE_RANGE]() {
    return true;
  }
  static [Symbol.hasInstance](value) {
    return !!value?.[IS_DATE_RANGE];
  }
  static kind = 'date';
}

export class DateTimeRange extends Range {
  // brand datetime range
  get [IS_DATE_TIME_RANGE]() {
    return true;
  }
  static [Symbol.hasInstance](value) {
    return !!value?.[IS_DATE_TIME_RANGE];
  }
  static kind = 'datetime';
}

export class TimeRange extends Range {
  // brand time range
  get [IS_TIME_RANGE]() {
    return true;
  }
  static [Symbol.hasInstance](value) {
    return !!value?.[IS_TIME_RANGE];
  }
  static kind = 'time';
}

alias(Range, { lang: 'locale', includes: 'contains', splitBy: 'split' });

const byKind = { date: DateRange, datetime: DateTimeRange, time: TimeRange };

const build = (Kind, start, end, options) => {
  const settings = Range.isOptions(end) ? end : zoneOptions(options);
  const make = () => new Kind(start, end, options);
  return settings.loose ? loosely(make, unreadable.range) : make();
};

export const dateRange = (start, end, options) => build(DateRange, start, end, options);
export const datetimeRange = (start, end, options) => build(DateTimeRange, start, end, options);
export const timeRange = (start, end, options) => build(TimeRange, start, end, options);

export const isDateRange = (value) => value instanceof DateRange;
export const isDateTimeRange = (value) => value instanceof DateTimeRange;
export const isTimeRange = (value) => value instanceof TimeRange;
