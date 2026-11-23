import { build } from 'esbuild';
import * as nativeDates from 'native-dates';
import {
  CalendarDate,
  date,
  dateRange,
  datetime,
  datetimeRange,
  duration,
  hours,
  monthDay,
  time,
  timeRange,
  yearMonth,
} from 'native-dates';
import { Console } from 'node:console';
import { Writable } from 'node:stream';
import { fileURLToPath } from 'node:url';
import { inspect, isDeepStrictEqual } from 'node:util';
import vm from 'node:vm';
import { describe, expect, it } from 'vitest';

const values = {
  DateTime: datetime('2026-11-16T09:30:15.250', 'America/Los_Angeles'),
  CalendarDate: date('2026-11-16'),
  Time: time('09:30:15.250'),
  Duration: duration('1h 30m'),
  YearMonth: yearMonth('2026-11'),
  MonthDay: monthDay('10-17'),
  DateRange: dateRange('2026-11-01', '2026-11-07'),
  DateTimeRange: datetimeRange('2026-11-16T09:00Z', '2026-11-16T10:00Z', 'UTC'),
  TimeRange: timeRange('9:00am', '5:00pm'),
};

const classNames = Object.keys(values);

const formattedCases = (dates) => [
  [
    'DateTime',
    'DateTime(2026-11-16T09:30:00-08:00[America/Los_Angeles])',
    dates.datetime('2026-11-16T09:30', 'America/Los_Angeles'),
  ],
  ['CalendarDate', 'CalendarDate(2026-11-16)', dates.date('2026-11-16')],
  ['Time', 'Time(09:30:00)', dates.time('9:30am')],
  ['Duration', 'Duration(PT1H30M)', dates.duration('1h 30m')],
  ['anchored Duration', 'Duration(P15D) from 2026-11-01', dates.date('2026-11-01').until('2026-11-16')],
  ['YearMonth', 'YearMonth(2026-11)', dates.yearMonth('2026-11')],
  ['MonthDay', 'MonthDay(10-17)', dates.monthDay('10-17')],
  ['DateRange', 'DateRange(2026-11-01 through 2026-11-07)', dates.dateRange('2026-11-01', '2026-11-07')],
  ['TimeRange', 'TimeRange(09:00:00 until 17:00:00)', dates.timeRange('9:00am', '5:00pm')],
];

const meetingFrom = (dates) => dates.datetime('2026-11-16T09:00', 'America/Los_Angeles').to('2026-11-16T10:00');

const logged = (...args) => {
  let output = '';
  const stream = new Writable({
    write(chunk, encoding, done) {
      output += chunk;
      done();
    },
  });
  new Console(stream).log(...args);
  return output.trimEnd();
};

describe('instance freezing and method immutability', () => {
  it.each(classNames)('freezes %s instances on construction', (className) => {
    expect(Object.isFrozen(values[className])).toBe(true);
  });

  it.each(classNames)('throws TypeError when assigning, adding, or deleting a property on %s', (className) => {
    const value = values[className];
    const ownKey = Object.keys(value)[0];
    const before = { ...value };
    expect(() => {
      value.text = 'changed';
    }).toThrowError(TypeError);
    expect(() => {
      value[ownKey] = 'changed';
    }).toThrowError(TypeError);
    expect(() => {
      value.extra = 1;
    }).toThrowError(TypeError);
    expect(() => {
      delete value[ownKey];
    }).toThrowError(TypeError);
    expect({ ...value }).toEqual(before);
  });

  it('freezes both start and end instances on DateRange, DateTimeRange, and TimeRange', () => {
    for (const range of [values.DateRange, values.DateTimeRange, values.TimeRange]) {
      expect(Object.isFrozen(range.start)).toBe(true);
      expect(Object.isFrozen(range.end)).toBe(true);
    }
  });

  it.each([
    ['DateTime', 'plus()', values.DateTime, (value) => value.plus(1, 'hour')],
    ['DateTime', 'set()', values.DateTime, (value) => value.set('hour', 17)],
    ['DateTime', 'in()', values.DateTime, (value) => value.in('Asia/Tokyo')],
    ['DateTime', 'startOf()', values.DateTime, (value) => value.startOf('day')],
    ['DateTime', 'locale()', values.DateTime, (value) => value.locale('de')],
    ['CalendarDate', 'plus()', values.CalendarDate, (day) => day.plus(2, 'weeks')],
    ['CalendarDate', 'set()', values.CalendarDate, (day) => day.set('day', 1)],
    ['CalendarDate', 'endOf()', values.CalendarDate, (day) => day.endOf('month')],
    ['Time', 'minus()', values.Time, (clock) => clock.minus(45, 'minutes')],
    ['Time', 'round()', values.Time, (clock) => clock.round('hour')],
    ['Duration', 'plus()', values.Duration, (span) => span.plus(hours(1))],
    ['Duration', 'negated()', values.Duration, (span) => span.negated()],
    ['Duration', 'balance()', duration('90 minutes'), (span) => span.balance()],
    ['YearMonth', 'plus()', values.YearMonth, (month) => month.plus(1, 'month')],
    ['MonthDay', 'locale()', values.MonthDay, (birthday) => birthday.locale('de')],
    ['DateRange', 'in()', values.DateRange, (range) => range.in('Asia/Tokyo')],
    ['DateTimeRange', 'in()', values.DateTimeRange, (range) => range.in('Asia/Tokyo')],
    ['TimeRange', 'locale()', values.TimeRange, (range) => range.locale('de')],
  ])('returns a new %s from %s without mutating the receiver', (className, method, value, transform) => {
    const [written, text] = [value.toString(), value.text];
    const changed = transform(value);
    expect(changed).not.toBe(value);
    expect(value.toString()).toBe(written);
    expect(value.text).toBe(text);
  });
});

describe('input object and Date non-mutation', () => {
  it('does not mutate a fields object or reflect later edits to it', () => {
    const fields = { year: 2026, month: 11, day: 16, hour: 9 };
    const created = datetime(fields, 'UTC');
    expect(fields).toEqual({ year: 2026, month: 11, day: 16, hour: 9 });
    fields.year = 1999;
    expect(created.year).toBe(2026);
  });

  it('does not mutate a duration units object passed to duration(), plus(), or set()', () => {
    const units = { hours: 1, minutes: 30 };
    const span = duration(units);
    values.DateTime.plus(units);
    values.DateTime.set({ hour: 5 });
    expect(units).toEqual({ hours: 1, minutes: 30 });
    units.hours = 99;
    expect(span.hours).toBe(1);
  });

  it('does not mutate a Date input or reflect later Date mutations', () => {
    const native = new Date('2026-11-16T17:30:00Z');
    const created = datetime(native, 'UTC');
    expect(native.toISOString()).toBe('2026-11-16T17:30:00.000Z');
    native.setUTCFullYear(1999);
    expect(created.year).toBe(2026);
  });

  it('does not mutate an options object passed to factories', () => {
    const options = { zone: 'Asia/Tokyo', locale: 'ja' };
    datetime('2026-11-16T09:30', options);
    date('2026-11-16', options);
    expect(options).toEqual({ zone: 'Asia/Tokyo', locale: 'ja' });
  });
});

describe('toJSDate() and toFields() defensive copies', () => {
  it('returns a fresh Date instance from toJSDate() on each call', () => {
    const standup = values.DateTime;
    const native = standup.toJSDate();
    native.setFullYear(1999);
    expect(standup.year).toBe(2026);
    expect(standup.toJSDate().getFullYear()).toBe(2026);
  });

  it('returns a fresh plain object from Duration.prototype.toFields() on each call', () => {
    const span = values.Duration;
    const fields = span.toFields();
    fields.hours = 99;
    expect(span.toFields()).toEqual({ hours: 1, minutes: 30 });
    expect(span.hours).toBe(1);
  });
});

describe('prototype extension', () => {
  // instances are frozen while class prototypes stay extensible so plugins can attach methods
  it('allows attaching prototype methods callable on existing and newly created instances', () => {
    const before = date('2026-11-13');
    CalendarDate.prototype.nextBusinessDay = function nextBusinessDay() {
      return this.plus(this.dayOfWeek === 5 ? 3 : this.dayOfWeek === 6 ? 2 : 1, 'days');
    };
    try {
      expect(before.nextBusinessDay().toString()).toBe('2026-11-16');
      expect(date('2026-11-16').nextBusinessDay().toString()).toBe('2026-11-17');
    }
    finally {
      delete CalendarDate.prototype.nextBusinessDay;
    }
  });
});

describe('own properties and object spread', () => {
  it.each(classNames)('exposes .text as a prototype getter rather than an own key on %s', (className) => {
    expect(Object.keys(values[className])).not.toContain('text');
    expect(values[className].text).toBeTypeOf('string');
    expect(values[className].text).not.toBe('');
  });

  // DevTools truncates collapsed object previews after five own properties
  it('places month, day, year, hour, and minute in the first five own keys of DateTime', () => {
    expect(Object.keys(values.DateTime).slice(0, 5)).toEqual(['month', 'day', 'year', 'hour', 'minute']);
  });

  it('spreads DateTime into calendar, clock, zone, offset, and epochMilliseconds fields', () => {
    expect({ ...values.DateTime }).toStrictEqual({
      year: 2026,
      month: 11,
      day: 16,
      dayOfWeek: 1,
      hour: 9,
      minute: 30,
      second: 15,
      millisecond: 250,
      zone: 'America/Los_Angeles',
      offset: '-08:00',
      epochMilliseconds: 1794850215250,
    });
  });

  it('spreads CalendarDate into year, month, day, and dayOfWeek fields', () => {
    expect({ ...values.CalendarDate }).toStrictEqual({
      year: 2026,
      month: 11,
      day: 16,
      dayOfWeek: 1,
    });
  });

  it('spreads Time into hour, minute, second, and millisecond fields', () => {
    expect({ ...values.Time }).toStrictEqual({
      hour: 9,
      minute: 30,
      second: 15,
      millisecond: 250,
    });
  });

  it('spreads Duration into unit fields from years to milliseconds plus sign and anchor', () => {
    expect({ ...values.Duration }).toStrictEqual({
      years: 0,
      months: 0,
      weeks: 0,
      days: 0,
      hours: 1,
      minutes: 30,
      seconds: 0,
      milliseconds: 0,
      sign: 1,
      anchor: undefined,
    });
    expect(String({ ...date('2026-11-01').until('2026-11-16') }.anchor)).toBe('2026-11-01');
  });

  it('spreads YearMonth into year and month and MonthDay into month and day', () => {
    expect({ ...values.YearMonth }).toStrictEqual({ year: 2026, month: 11 });
    expect({ ...values.MonthDay }).toStrictEqual({ month: 10, day: 17 });
  });

  it.each([
    ['DateRange', 'date', '2026-11-01', '2026-11-07'],
    ['DateTimeRange', 'datetime', '2026-11-16T09:00:00.000Z', '2026-11-16T10:00:00.000Z'],
    ['TimeRange', 'time', '09:00:00', '17:00:00'],
  ])('spreads %s into kind, start, and end', (className, kind, start, end) => {
    const spread = { ...values[className] };
    expect(Object.keys(spread).sort()).toEqual(['end', 'kind', 'start']);
    expect(spread.kind).toBe(kind);
    expect(spread.start.toString()).toBe(start);
    expect(spread.end.toString()).toBe(end);
  });
});

describe('structural deep equality', () => {
  it('treats equal values with different instance locales as deeply equal', () => {
    const en = date('2026-11-16').locale('en-US');
    const fr = date('2026-11-16').locale('fr');
    expect(en.text).not.toBe(fr.text);
    expect(en).toEqual(fr);
    expect(isDeepStrictEqual(en, fr)).toBe(true);
  });
  it.each([
    ['DateTimes', datetime, '2026-11-16T17:30:00Z'],
    ['CalendarDates', date, '2026-11-16'],
    ['Times', time, '9:30am'],
    ['Durations', duration, '1h 30m'],
    ['YearMonths', yearMonth, '2026-11'],
    ['MonthDays', monthDay, '10-17'],
    ['DateRanges', dateRange, '2026-11-01/2026-11-07'],
    ['DateTimeRanges', datetimeRange, '2026-11-16T09:00Z/2026-11-16T10:00Z'],
    ['TimeRanges', timeRange, '09:00/17:00'],
  ])('treats two %s parsed from identical input as deeply equal', (kind, parse, input) => {
    expect(parse(input)).toEqual(parse(input));
    expect(parse(input)).toStrictEqual(parse(input));
    expect(isDeepStrictEqual(parse(input), parse(input))).toBe(true);
  });

  it.each([
    ['DateTimes a millisecond apart', datetime('2026-11-16T17:30:00.001Z'), datetime('2026-11-16T17:30:00.002Z')],
    [
      'the same instant in two different timezones',
      datetime('2026-11-16T17:30:00Z', 'UTC'),
      datetime('2026-11-16T17:30:00Z', 'Asia/Tokyo'),
    ],
    ['CalendarDates a day apart', date('2026-11-16'), date('2026-11-17')],
    ['the same month and day a year apart', date('2026-11-16'), date('2027-11-16')],
    ['Times a millisecond apart', time('09:30:00.001'), time('09:30:00.002')],
    ['Durations a minute apart', duration('1h 30m'), duration('1h 31m')],
    ['a Duration and its negation', duration('1h 30m'), duration('1h 30m').negated()],
    ['YearMonths a month apart', yearMonth('2026-11'), yearMonth('2026-12')],
    ['MonthDays a day apart', monthDay('10-17'), monthDay('10-18')],
    ['DateRanges ending a day apart', dateRange('2026-11-01', '2026-11-07'), dateRange('2026-11-01', '2026-11-08')],
    ['TimeRanges starting an hour apart', timeRange('9:00am', '5:00pm'), timeRange('10:00am', '5:00pm')],
    ['a CalendarDate and its midnight DateTime', date('2026-11-16'), date('2026-11-16').as('datetime', 'UTC')],
  ])('distinguishes %s under deep equality', (label, one, other) => {
    expect(one).not.toEqual(other);
    expect(isDeepStrictEqual(one, other)).toBe(false);
  });
});

describe('util.inspect() formatting', () => {
  it.each(formattedCases(nativeDates))('formats %s as %s in util.inspect() and console.log()', (label, text, value) => {
    expect(inspect(value)).toBe(text);
    expect(logged(value)).toBe(text);
  });

  it('formats DateTimeRange as DateTimeRange(<start> until <end>)', () => {
    expect(logged(meetingFrom(nativeDates))).toMatch(/^DateTimeRange\(\S+ until \S+\)$/);
  });

  it('formats inclusive DateRange with "through" and half-open TimeRange and DateTimeRange with "until"', () => {
    expect(inspect(nativeDates.dateRange('2026-11-01', '2026-11-07'))).toContain(' through ');
    expect(inspect(nativeDates.timeRange('9:00am', '5:00pm'))).toContain(' until ');
    expect(inspect(meetingFrom(nativeDates))).toContain(' until ');
  });

  it('formats instances nested inside objects and arrays', () => {
    expect(logged({ due: nativeDates.date('2026-11-16') })).toBe('{ due: CalendarDate(2026-11-16) }');
    expect(logged([nativeDates.time('9:30am'), nativeDates.time('2:00pm')])).toBe('[ Time(09:30:00), Time(14:00:00) ]');
  });

  it('formats deeply nested instances beyond default util.inspect object depth', () => {
    const deep = { order: { line: { due: nativeDates.date('2026-11-16') } } };
    expect(logged(deep)).toContain('due: CalendarDate(2026-11-16)');
  });

  // minifiers mangle class names, so custom inspect uses an explicit string label rather than constructor.name
  it('preserves class names in util.inspect output after esbuild minification', async () => {
    const bundle = await build({
      bundle: true,
      minify: true,
      format: 'iife',
      globalName: 'nativeDates',
      write: false,
      logLevel: 'silent',
      stdin: {
        contents: "export * from 'native-dates';",
        resolveDir: fileURLToPath(new URL('../..', import.meta.url)),
      },
    });
    const minified = vm.runInThisContext(`(() => { ${bundle.outputFiles[0].text}\nreturn nativeDates; })()`);
    expect(minified.DateRange.name).not.toBe('DateRange');
    for (const [, text, value] of formattedCases(minified)) {
      expect(inspect(value)).toBe(text);
    }
    expect(inspect(meetingFrom(minified))).toMatch(/^DateTimeRange\(/);
  }, 30_000);
});
