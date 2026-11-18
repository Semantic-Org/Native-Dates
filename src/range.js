import { isNumber, isPlainObject, isString } from './helpers/utils.js';

import { CalendarDate } from './calendar-date.js';
import { DateTime } from './date-time.js';
import { days, duration, hours } from './duration.js';
import { isDevelopment } from './helpers/environment.js';
import { isUnreadable, loosely, readAs, refuse, refuseType, unreadable } from './helpers/errors.js';
import { isDurationFields } from './helpers/fields.js';
import { epochOf, formatter, intlOptions, textFormat } from './helpers/format.js';
import { IS_DATE_RANGE, IS_DATE_TIME_RANGE, IS_DURATION, IS_RANGE, IS_TIME_RANGE } from './helpers/identity.js';
import { alias, inspect, isDigits, isTemporalDuration, stepOf, unit, zoneOptions } from './helpers/units.js';
import { Time } from './time.js';

/*
  an interval between two points of the same kind (DateRange, DateTimeRange, TimeRange).
  DateRange is closed [start, end] because civil date spans include their final day ('Sep 1 to Sep 7' is 7 days).
  DateTimeRange and TimeRange are half-open [start, end) so adjacent bookings or shifts share an endpoint cleanly,
  and TimeRange wraps across midnight when end < start
*/

class Range {
  // brand range
  get [IS_RANGE]() {
    return true;
  }
  static [Symbol.hasInstance](value) {
    return !!value?.[IS_RANGE];
  }

  static factoryNames = { date: 'dateRange', datetime: 'datetimeRange', time: 'timeRange' };

  // explicit strings so Node inspect output survives minifier class renaming
  static classNames = { date: 'DateRange', datetime: 'DateTimeRange', time: 'TimeRange' };

  static dayLength = 86_400e9; // 24h in nanoseconds

  // (start, end, zone), (start, end, { zone, loose }), or (interval, { zone, loose })
  constructor(start, end, options) {
    const kind = this.constructor.kind;
    this.text = undefined; // keep text first in console previews
    this.kind = kind;
    if (Range.isOptions(end)) {
      [end, options] = [undefined, end];
    }
    const settings = zoneOptions(options);
    if (start instanceof Range && end === undefined) {
      if (start.kind !== kind) {
        refuseType('conflictingRanges', `${Range.factoryNames[start.kind]} as ${Range.factoryNames[kind]}`, {
          explanation: isDevelopment
            ? 'cannot pass one range type directly into another range factory. Convert a `DateRange` to a `DateTimeRange` with `.in(zone)`, or build a new range from converted `start` and `end` endpoints'
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
    if (kind !== 'time' && this.end.isBefore(this.start)) {
      refuse('invalidRange', `${this.start} to ${this.end}`, {
        explanation: isDevelopment
          ? 'range end cannot be earlier than its start. Swap the start and end arguments, or order unknown endpoints with `earliest(a, b)` and `latest(a, b)`'
          : 0,
      });
    }
    this.text = kind === 'datetime' ? this.format(textFormat) : this.format();
    Object.freeze(this);
  }

  // distinguish trailing options in dateRange('a/b', opts) from a field-bag endpoint like { year, month, day }
  static isOptions(value) {
    return isPlainObject(value) && Object.keys(value).length > 0
      && Object.keys(value).every((key) => ['loose', 'zone', 'dayFirst', 'locale'].includes(key));
  }

  // mask bracketed '[America/New_York]' zones before splitting on '/', and check spaced ' - ' / ' to '
  // first so slash-delimited dates like '2026/11/06 - 2026/11/10' stay intact
  static #splitInterval(text) {
    const blanked = text.replace(/\[[^\]]*\]/g, (zone) => ' '.repeat(zone.length));
    const dash = blanked.match(/\s(?:-|–|to)\s/);
    if (dash) {
      return [text.slice(0, dash.index), text.slice(dash.index + dash[0].length)];
    }
    const at = blanked.indexOf('/');
    return at === -1 ? [text] : [text.slice(0, at), text.slice(at + 1)];
  }

  // coerce endpoints in start's zone and locale so both ends share one frame of reference
  static #read(kind, value, start, { zone, loose, dayFirst, locale } = {}) {
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

  // endpoints can also be durations (e.g. start.for('2h')), subtracting 1 day on inclusive DateRanges
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
      // report the point error rather than invalidDuration when neither parser recognizes the input
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

  // two overnight ranges like 22:00..06:00 and 05:00..23:00 overlap twice (05:00..06:00 and 22:00..23:00)
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
          ? 'these two time ranges wrap around midnight and overlap in two separate windows, which a single `TimeRange` cannot represent. Split the overnight range at midnight and intersect each half separately'
          : 0,
      });
    }
    return this.#make('time', Range.#timeAt(pieces[0][0]), Range.#timeAt(pieces[0][1]));
  }

  // unwrap circular times onto a linear timeline and test shifts of -24h, 0h, and +24h in #besides()
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
    // step from start (start + i * size) rather than chaining .plus() so Jan 31 monthly hits Mar 31 instead of sticking on the 28th
    for (let i = 0;; i++) {
      const next = this.start.plus(size.times(i));
      if (!this.#holds(next)) {
        return points;
      }
      points.push(next);
    }
  }

  // bare unit names like 'month' mean 1 unit, while strings with digits like '30m' parse as durations
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

  // inclusive DateRange [start, end] becomes half-open [start 00:00, (end + 1d) 00:00) in `zone`
  in(zone) {
    if (this.kind === 'date') {
      return this.#make('datetime', this.start.at('00:00', zone), this.end.plus(days(1)).at('00:00', zone));
    }
    if (this.kind === 'datetime') {
      return this.#make('datetime', this.start.in(zone), this.end.in(zone));
    }
    return refuse('unsupportedZone', String(this), {
      explanation: isDevelopment
        ? 'a `TimeRange` has no calendar date, so it cannot be placed in a time zone directly. Anchor each end to a date with `.on(day, zone)` on `start` and `end`'
        : 0,
    });
  }

  /*******************************
              Output
  *******************************/

  locale(...tag) {
    return tag.length
      ? new byKind[this.kind](this.start.locale(tag[0]), this.end.locale(tag[0]))
      : this.start.locale();
  }

  format(spec, locale = this.start.locale()) {
    const options = intlOptions(this.kind, spec);
    if (!options) {
      return `${this.start.format(spec, locale)} – ${this.end.format(spec, locale)}`;
    }
    // Intl.DateTimeFormat.formatRange() natively formats reversed same-day times (22:00 -> 06:00) as overnight ranges
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
        ? 'ranges cannot be converted to a number for `<`, `>`, or `-`. Read `.duration` to measure length, or use `compare(a, b)` and `equals()` to compare ranges'
        : 0,
    });
  }

  // '+' sends hint 'default', which would call valueOf() and throw without this
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
