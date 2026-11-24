import { compare, DateRange, DateTimeRange, days, IS_RANGE, Time, TimeRange } from 'native-dates';
import { isDevelopment } from 'native-dates/helpers/environment';
import { refuse, refuseType } from 'native-dates/helpers/errors';
import { isString } from 'native-dates/helpers/utils';

// attaches subtract() and union() onto the shared Range prototype and exports mergeRanges()

const dayLength = 86_400e9;
const byKind = { date: DateRange, datetime: DateTimeRange, time: TimeRange };

const nsOf = (point) => new Temporal.PlainTime().until(point.toTemporal()).total('nanosecond');
const timeAt = (ns) =>
  new Time(new Temporal.PlainTime().add({ nanoseconds: ((ns % dayLength) + dayLength) % dayLength }));

const make = (base, start, end) =>
  new byKind[base.kind](start, end, { zone: base.start.zone, locale: base.start.locale() });

const coerce = (base, other) =>
  other?.[IS_RANGE] && other.kind === base.kind
    ? other
    : new byKind[base.kind](other, { zone: base.start.zone, locale: base.start.locale() });

// splits overnight TimeRanges at midnight so clock set math reduces to linear [0, 24h) intervals
const segmentsOf = (range) => {
  if (range.isEmpty()) {
    return [];
  }
  const start = nsOf(range.start);
  const end = nsOf(range.end);
  if (start < end) {
    return [[start, end]];
  }
  return end > 0 ? [[start, dayLength], [0, end]] : [[start, dayLength]];
};

const coalesceLinear = (segments) => {
  if (!segments.length) {
    return [];
  }
  const sorted = segments.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const merged = [sorted[0].slice()];
  for (let i = 1; i < sorted.length; i++) {
    const last = merged[merged.length - 1];
    if (sorted[i][0] <= last[1]) {
      if (sorted[i][1] > last[1]) {
        last[1] = sorted[i][1];
      }
    }
    else {
      merged.push(sorted[i].slice());
    }
  }
  return merged;
};

const fullDayError = (at) =>
  refuse('unsupportedUnion', at, {
    explanation: isDevelopment
      ? 'these time ranges cover all 24 hours, which a single `TimeRange` cannot represent because equal start and end times are empty. Anchor them to a `DateTimeRange` or split at midnight'
      : 0,
  });

function subtract(other) {
  const rival = coerce(this, other);
  if (this.isEmpty()) {
    return [];
  }
  if (rival.isEmpty()) {
    return [this];
  }
  if (this.kind === 'time') {
    if (!this.overlaps(rival)) {
      return [this];
    }
    let pieces = segmentsOf(this);
    for (const [b1, b2] of segmentsOf(rival)) {
      const next = [];
      for (const [a1, a2] of pieces) {
        if (b2 <= a1 || b1 >= a2) {
          next.push([a1, a2]);
        }
        else {
          if (a1 < b1) {
            next.push([a1, b1]);
          }
          if (a2 > b2) {
            next.push([b2, a2]);
          }
        }
      }
      pieces = next;
    }
    // stitch adjacent midnight pieces back together because segmentsOf() orders [start, 24h) before [0, end)
    for (let i = 0; i + 1 < pieces.length; i++) {
      if (pieces[i][1] === dayLength && pieces[i + 1][0] === 0) {
        pieces.splice(i, 2, [pieces[i][0], pieces[i + 1][1]]);
        break;
      }
    }
    return pieces.map(([from, to]) => make(this, timeAt(from), timeAt(to)));
  }
  const inclusive = this.kind === 'date';
  if (
    inclusive
      ? rival.end.isBefore(this.start) || rival.start.isAfter(this.end)
      : !this.start.isBefore(rival.end) || !rival.start.isBefore(this.end)
  ) {
    return [this];
  }
  const result = [];
  if (this.start.isBefore(rival.start)) {
    result.push(make(this, this.start, inclusive ? rival.start.minus(days(1)) : rival.start));
  }
  if (this.end.isAfter(rival.end)) {
    result.push(make(this, inclusive ? rival.end.plus(days(1)) : rival.end, this.end));
  }
  return result;
}

function union(other) {
  const rival = coerce(this, other);
  if (this.isEmpty()) {
    return rival.isEmpty() ? this : make(this, rival.start, rival.end);
  }
  if (rival.isEmpty()) {
    return this;
  }
  if (this.kind === 'time') {
    const merged = coalesceLinear([...segmentsOf(this), ...segmentsOf(rival)]);
    if (merged.length === 1) {
      if (merged[0][0] === 0 && merged[0][1] === dayLength) {
        return fullDayError(`${this} with ${rival}`);
      }
      return make(this, timeAt(merged[0][0]), timeAt(merged[0][1]));
    }
    if (merged.length === 2 && merged[0][0] === 0 && merged[1][1] === dayLength) {
      return make(this, timeAt(merged[1][0]), timeAt(merged[0][1]));
    }
    return null;
  }
  const gap = this.kind === 'date'
    ? this.end.plus(days(1)).isBefore(rival.start) || rival.end.plus(days(1)).isBefore(this.start)
    : this.end.isBefore(rival.start) || rival.end.isBefore(this.start);
  if (gap) {
    return null;
  }
  const start = this.start.isBefore(rival.start) ? this.start : rival.start;
  const end = this.end.isAfter(rival.end) ? this.end : rival.end;
  return make(this, start, end);
}

export function mergeRanges(ranges) {
  if (isString(ranges) || ranges == null || typeof ranges[Symbol.iterator] !== 'function') {
    refuseType('invalidRange', String(ranges), {
      explanation: isDevelopment
        ? 'expected an iterable of ranges for `mergeRanges()`. Pass an array of `DateRange`, `DateTimeRange`, or `TimeRange` instances'
        : 0,
    });
  }
  const list = [...ranges];
  if (!list.length) {
    return [];
  }
  let kind;
  for (const item of list) {
    if (!item?.[IS_RANGE]) {
      refuseType('invalidRange', String(item), {
        explanation: isDevelopment
          ? 'every item passed to `mergeRanges()` must be a `DateRange`, `DateTimeRange`, or `TimeRange` instance'
          : 0,
      });
    }
    if (!kind) {
      kind = item.kind;
    }
    else if (item.kind !== kind) {
      refuseType('conflictingRanges', `${item.kind}Range with ${kind}Range`, {
        explanation: isDevelopment
          ? 'cannot merge ranges of different types. Pass all `DateRange`, all `DateTimeRange`, or all `TimeRange` instances'
          : 0,
      });
    }
  }
  const active = list.filter((range) => !range.isEmpty());
  if (!active.length) {
    return [];
  }
  if (kind === 'time') {
    const pieces = coalesceLinear(active.flatMap(segmentsOf));
    if (pieces.length === 1 && pieces[0][0] === 0 && pieces[0][1] === dayLength) {
      return fullDayError(`${active.length} time ranges`);
    }
    if (pieces.length > 1 && pieces[0][0] === 0 && pieces[pieces.length - 1][1] === dayLength) {
      const head = pieces.shift();
      pieces[pieces.length - 1] = [pieces[pieces.length - 1][0], head[1]];
    }
    const base = active[0];
    return pieces.map(([from, to]) => make(base, timeAt(from), timeAt(to)));
  }
  const sorted = active.slice().sort(compare);
  const merged = [sorted[0]];
  for (let i = 1; i < sorted.length; i++) {
    const combined = merged[merged.length - 1].union(sorted[i]);
    if (combined) {
      merged[merged.length - 1] = combined;
    }
    else {
      merged.push(sorted[i]);
    }
  }
  return merged;
}

Object.assign(Object.getPrototypeOf(DateRange.prototype), { subtract, union });
