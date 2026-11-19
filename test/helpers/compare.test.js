import {
  compare,
  date,
  dateRange,
  datetime,
  datetimeRange,
  duration,
  earliest,
  hours,
  isDateTime,
  latest,
  minutes,
  monthDay,
  time,
  timeRange,
  yearMonth,
} from 'native-dates';
import { describe, expect, it } from 'vitest';

describe('compare()', () => {
  it('sorts CalendarDates from earliest to latest when passed to Array.prototype.sort()', () => {
    const dates = [date('2026-12-01'), date('2026-05-10'), date('2026-08-20')];
    expect(dates.sort(compare).map(String)).toEqual(['2026-05-10', '2026-08-20', '2026-12-01']);
  });

  it.each([
    ['CalendarDates', date, '2026-05-10', '2026-08-20'],
    ['DateTimes a millisecond apart', datetime, '2026-11-16T17:30:00.000Z', '2026-11-16T17:30:00.001Z'],
    ['Times', time, '9:00am', '5:30pm'],
    ['Durations', duration, '45m', '2h'],
    ['YearMonths', yearMonth, '2026-10', '2026-11'],
    ['DateRanges', dateRange, '2026-11-01/2026-11-05', '2026-11-10/2026-11-14'],
    ['DateTimeRanges', datetimeRange, '2026-11-16T09:00Z/2026-11-16T10:00Z', '2026-11-16T10:00Z/2026-11-16T11:00Z'],
    ['TimeRanges', timeRange, '09:00/12:00', '13:00/17:00'],
  ])('returns -1, 1, and 0 for %s in ascending, descending, and equal order', (kind, parse, earlier, later) => {
    expect(compare(parse(earlier), parse(later))).toBe(-1);
    expect(compare(parse(later), parse(earlier))).toBe(1);
    expect(compare(parse(earlier), parse(earlier))).toBe(0);
  });

  it('orders DateTimes by instant across timezones', () => {
    const newYork = datetime('2026-11-16T09:00', 'America/New_York');
    const losAngeles = datetime('2026-11-16T08:00', 'America/Los_Angeles');
    expect(compare(newYork, losAngeles)).toBe(-1);
    expect([losAngeles, newYork].sort(compare).map((value) => value.zone)).toEqual([
      'America/New_York',
      'America/Los_Angeles',
    ]);
  });

  it('returns 0 for the same instant in two timezones', () => {
    expect(compare(datetime('2026-11-16T12:00', 'America/New_York'), datetime('2026-11-16T17:00Z', 'UTC'))).toBe(0);
  });

  it('distinguishes DateTimes and Times that differ by one nanosecond', () => {
    expect(compare(datetime('2026-11-16T17:30:00.000000001Z'), datetime('2026-11-16T17:30:00.000000002Z'))).toBe(-1);
    expect(compare(time('09:00:00.000000002'), time('09:00:00.000000001'))).toBe(1);
  });

  it('ignores instance locale when comparing values', () => {
    expect(compare(date('2026-11-16').locale('de'), date('2026-11-16').locale('ja'))).toBe(0);
  });

  it('orders Durations by elapsed time regardless of unit', () => {
    const spans = [hours(2), minutes(45), minutes(90)].sort(compare);
    expect(spans.map(String)).toEqual(['PT45M', 'PT90M', 'PT2H']);
    expect(compare(hours(1), minutes(60))).toBe(0);
  });

  it('sorts ranges by start and breaks ties by end', () => {
    const windows = [
      dateRange('2026-11-10', '2026-11-20'),
      dateRange('2026-11-10', '2026-11-14'),
      dateRange('2026-11-01', '2026-11-05'),
    ];
    expect(windows.sort(compare).map(String)).toEqual([
      '2026-11-01/2026-11-05',
      '2026-11-10/2026-11-14',
      '2026-11-10/2026-11-20',
    ]);
  });

  it('compares raw date and time strings chronologically rather than alphabetically', () => {
    expect(compare('2026-05-10', '2026-05-11')).toBe(-1);
    expect(compare('10:00', '9:00')).toBe(1);
    expect(compare('9am', '5:30pm')).toBe(-1);
  });

  it('parses two timestamp strings as DateTimes and orders same-day values by time', () => {
    expect(compare('2026-11-16T09:00:00Z', '2026-11-16T17:30:00Z')).toBe(-1);
    expect(compare('2026-11-16 17:30:00', '2026-11-16 09:00:00')).toBe(1);
    const written = ['2026-11-16T17:30:00Z', '2026-11-15T23:00:00Z', '2026-11-16T09:00:00Z'];
    expect(written.sort(compare)).toEqual(['2026-11-15T23:00:00Z', '2026-11-16T09:00:00Z', '2026-11-16T17:30:00Z']);
  });

  it('orders timestamp strings by instant across different UTC offsets', () => {
    expect(compare('2026-11-16T09:00:00+01:00', '2026-11-16T09:00:00-05:00')).toBe(-1);
    expect(compare('2026-11-16T09:00:00+01:00', '2026-11-16T08:00:00Z')).toBe(0);
  });

  it('trims surrounding spaces and newlines from raw input strings', () => {
    expect(compare(' 9:00', '10:00\n')).toBe(-1);
    expect(compare(' 2026-05-11 ', '2026-05-10')).toBe(1);
    expect(earliest(' 2026-05-11 ', '2026-05-10').toString()).toBe('2026-05-10');
  });

  it.each([
    ['Temporal.PlainDate', Temporal.PlainDate.from('2026-05-10'), Temporal.PlainDate.from('2026-08-20')],
    ['Temporal.PlainTime', Temporal.PlainTime.from('09:00'), Temporal.PlainTime.from('17:30')],
    [
      'Temporal.PlainDateTime',
      Temporal.PlainDateTime.from('2026-11-16T09:00'),
      Temporal.PlainDateTime.from('2026-11-16T17:30'),
    ],
    [
      'Temporal.ZonedDateTime',
      Temporal.ZonedDateTime.from('2026-11-16T09:00[America/New_York]'),
      Temporal.ZonedDateTime.from('2026-11-16T08:00[America/Los_Angeles]'),
    ],
    ['Temporal.Instant', Temporal.Instant.from('2026-11-16T09:00Z'), Temporal.Instant.from('2026-11-16T17:30Z')],
  ])('compares two %s instances by their Temporal kind', (name, earlier, later) => {
    expect(compare(earlier, later)).toBe(-1);
    expect(compare(later, earlier)).toBe(1);
    expect(compare(earlier, earlier)).toBe(0);
  });

  it('coerces a Date or epoch millisecond number as the first argument to DateTime', () => {
    expect(compare(new Date(1794840000000), datetime('2026-11-16T18:00Z'))).toBe(-1);
    expect(compare(1794840000000, datetime('2026-11-16T18:00Z'))).toBe(-1);
    expect(compare(1794850200000, 1794840000000)).toBe(1);
  });

  it('coerces a raw value as the second argument to the kind of the first argument', () => {
    expect(compare(date('2026-05-10'), '2026-05-10')).toBe(0);
    expect(compare(yearMonth('2026-11'), '2026-10')).toBe(1);
    expect(compare(hours(2), '45m')).toBe(1);
  });

  it('coerces a numeric second argument to an hour when comparing with a Time', () => {
    expect(compare(time('09:00'), 9)).toBe(0);
    expect(compare(time('09:00'), 17)).toBe(-1);
  });

  it("interprets an offset-less string as the second argument in the first DateTime's zone", () => {
    expect(compare(datetime('2026-11-16T09:00', 'Asia/Tokyo'), '2026-11-16T09:00')).toBe(0);
    expect(compare(datetime('2026-11-16T09:00', 'Pacific/Honolulu'), '2026-11-16T09:00')).toBe(0);
  });

  it('sorts a mixed array of DateTimes and epoch millisecond numbers', () => {
    expect([3000, datetime(2000), 1000].sort(compare).map(Number)).toEqual([1000, 2000, 3000]);
  });

  it.each([
    [
      'CalendarDate and DateTime',
      () => compare(date('2026-11-16'), datetime('2026-11-16T00:00Z')),
      'date with datetime',
    ],
    [
      'DateTime and CalendarDate',
      () => compare(datetime('2026-11-16T00:00Z'), date('2026-11-16')),
      'datetime with date',
    ],
    ['CalendarDate and Time', () => compare(date('2026-11-16'), time('9:00am')), 'date with time'],
    ['CalendarDate and YearMonth', () => compare(date('2026-11-16'), yearMonth('2026-11')), 'date with yearMonth'],
    ['YearMonth and CalendarDate', () => compare(yearMonth('2026-11'), date('2026-11-16')), 'yearMonth with date'],
    ['CalendarDate and Duration', () => compare(date('2026-11-16'), hours(2)), 'date with duration'],
    [
      'DateRange and TimeRange',
      () => compare(dateRange('2026-11-01', '2026-11-07'), timeRange('9am', '5pm')),
      'dateRange with timeRange',
    ],
  ])('throws conflictingKinds TypeError when comparing %s', (pair, call, at) => {
    expect(call).toThrowError(expect.objectContaining({ name: 'TypeError', code: 'conflictingKinds', at }));
  });

  it('throws invalidDate TypeError when comparing a CalendarDate with an epoch millisecond number', () => {
    expect(() => compare(date('2026-11-16'), 1794850200000)).toThrowError(
      expect.objectContaining({ name: 'TypeError', code: 'invalidDate', at: '1794850200000' }),
    );
  });

  it('throws invalidPoint TypeError when comparing unordered MonthDays', () => {
    expect(() => compare(monthDay('10-17'), monthDay('10-18'))).toThrowError(
      expect.objectContaining({ name: 'TypeError', code: 'invalidPoint', at: '10-17' }),
    );
  });

  it.each([
    ['null', null, 'null'],
    ['undefined', undefined, 'undefined'],
    ['a plain object', {}, '[object Object]'],
    ['a boolean', true, 'true'],
  ])('throws invalidPoint TypeError when given %s', (label, value, at) => {
    expect(() => compare(value, date('2026-11-16'))).toThrowError(
      expect.objectContaining({ name: 'TypeError', code: 'invalidPoint', at }),
    );
  });

  it.todo('coerces an ISO interval string as the second argument when the first argument is a Range');
});

describe('earliest() and latest()', () => {
  it('returns the earliest and latest value from variadic arguments', () => {
    const dates = [date('2026-11-20'), date('2026-11-04'), date('2026-11-16')];
    expect(earliest(...dates).toString()).toBe('2026-11-04');
    expect(latest(...dates).toString()).toBe('2026-11-20');
  });

  it('accepts an array in place of variadic arguments', () => {
    const times = [time('5:30pm'), time('9:00am'), time('12:15pm')];
    expect(earliest(times).toString()).toBe('09:00:00');
    expect(latest(times).toString()).toBe('17:30:00');
  });

  it('selects the earliest and latest YearMonth', () => {
    const months = [yearMonth('2026-11'), yearMonth('2025-12'), yearMonth('2026-02')];
    expect(earliest(months).toString()).toBe('2025-12');
    expect(latest(months).toString()).toBe('2026-11');
  });

  it('returns the original instance preserving its zone and locale', () => {
    const berlin = datetime('2026-11-16T09:00', 'Europe/Berlin').locale('de');
    const tokyo = datetime('2026-11-17T09:00', 'Asia/Tokyo').locale('ja');
    expect(earliest(tokyo, berlin)).toBe(berlin);
    expect(latest(berlin, tokyo)).toBe(tokyo);
    expect(latest(berlin, tokyo).zone).toBe('Asia/Tokyo');
    expect(latest(berlin, tokyo).locale()).toBe('ja');
  });

  it('returns the input unchanged when given a single value', () => {
    const only = date('2026-11-16');
    expect(earliest(only)).toBe(only);
    expect(latest([only])).toBe(only);
  });

  it('returns the first matching instance when two DateTimes represent the same instant', () => {
    const newYork = datetime('2026-11-16T12:00', 'America/New_York');
    const utc = datetime('2026-11-16T17:00Z', 'UTC');
    expect(earliest(newYork, utc)).toBe(newYork);
    expect(earliest(utc, newYork)).toBe(utc);
    expect(latest(newYork, utc)).toBe(newYork);
    expect(latest(utc, newYork)).toBe(utc);
  });

  it('coerces Dates and epoch millisecond numbers to DateTimes', () => {
    const first = earliest(1794850200000, 1794840000000);
    expect(isDateTime(first)).toBe(true);
    expect(first.epochMilliseconds).toBe(1794840000000);
    expect(latest(new Date(1794840000000), new Date(1794850200000)).epochMilliseconds).toBe(1794850200000);
  });

  it('coerces timestamp strings to DateTimes and returns the earliest or latest instance', () => {
    const updated = ['2026-11-16T09:00:00Z', '2026-11-16T17:30:00Z', '2026-11-15T23:00:00Z'];
    expect(isDateTime(latest(updated))).toBe(true);
    expect(latest(updated).toString()).toBe('2026-11-16T17:30:00.000Z');
    expect(earliest(...updated).toString()).toBe('2026-11-15T23:00:00.000Z');
  });

  it('coerces subsequent raw arguments to the kind of the first argument', () => {
    expect(earliest(date('2026-11-20'), '2026-11-04').toString()).toBe('2026-11-04');
    expect(earliest(time('09:00'), 8).toString()).toBe('08:00:00');
  });

  it('clamps a value between min and max bounds when composed', () => {
    const [min, max] = [date('2026-11-01'), date('2026-11-30')];
    const clamp = (picked) => earliest(max, latest(min, picked)).toString();
    expect(clamp(date('2026-12-12'))).toBe('2026-11-30');
    expect(clamp(date('2026-10-12'))).toBe('2026-11-01');
    expect(clamp(date('2026-11-12'))).toBe('2026-11-12');
  });

  it('does not mutate the input array', () => {
    const [later, sooner] = [date('2026-11-20'), date('2026-11-04')];
    const list = [later, sooner];
    earliest(list);
    latest(list);
    expect(list).toHaveLength(2);
    expect(list[0]).toBe(later);
    expect(list[1]).toBe(sooner);
  });

  it.each([
    ['earliest() with no arguments', () => earliest(), 'earliest'],
    ['earliest() with an empty array', () => earliest([]), 'earliest'],
    ['latest() with no arguments', () => latest(), 'latest'],
    ['latest() with an empty array', () => latest([]), 'latest'],
  ])('throws missingPoints RangeError for %s', (label, call, at) => {
    expect(call).toThrowError(expect.objectContaining({ name: 'RangeError', code: 'missingPoints', at }));
  });

  it('throws conflictingKinds TypeError for mixed temporal kinds', () => {
    expect(() => latest(date('2026-11-16'), time('9:00am'))).toThrowError(
      expect.objectContaining({ name: 'TypeError', code: 'conflictingKinds' }),
    );
  });

  it.each([
    ['Durations', () => earliest(hours(2), minutes(45))],
    ['Ranges', () => earliest(dateRange('2026-11-10', '2026-11-20'), dateRange('2026-11-01', '2026-11-05'))],
    ['MonthDays', () => latest(monthDay('10-17'), monthDay('01-01'))],
  ])('throws invalidPoint TypeError for %s', (label, call) => {
    expect(call).toThrowError(expect.objectContaining({ name: 'TypeError', code: 'invalidPoint' }));
  });

  it.todo('coerces a year-month string alongside a YearMonth instance');
});
