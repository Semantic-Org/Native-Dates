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
  it('sorts calendar dates from earliest to latest when passed to Array.prototype.sort()', () => {
    const dates = [date('2026-12-01'), date('2026-05-10'), date('2026-08-20')];
    expect(dates.sort(compare).map(String)).toEqual(['2026-05-10', '2026-08-20', '2026-12-01']);
  });

  it.each([
    ['calendar dates', date, '2026-05-10', '2026-08-20'],
    ['moments a millisecond apart', datetime, '2026-11-16T17:30:00.000Z', '2026-11-16T17:30:00.001Z'],
    ['times of day', time, '9:00am', '5:30pm'],
    ['durations', duration, '45m', '2h'],
    ['year-months', yearMonth, '2026-10', '2026-11'],
    ['date ranges', dateRange, '2026-11-01/2026-11-05', '2026-11-10/2026-11-14'],
    ['moment ranges', datetimeRange, '2026-11-16T09:00Z/2026-11-16T10:00Z', '2026-11-16T10:00Z/2026-11-16T11:00Z'],
    ['time ranges', timeRange, '09:00/12:00', '13:00/17:00'],
  ])('returns -1, 1 and 0 for two %s in order, reversed and equal', (kind, read, earlier, later) => {
    expect(compare(read(earlier), read(later))).toBe(-1);
    expect(compare(read(later), read(earlier))).toBe(1);
    expect(compare(read(earlier), read(earlier))).toBe(0);
  });

  it('orders moments by instant, so 9:00 in New York sorts before 8:00 the same day in Los Angeles', () => {
    const newYork = datetime('2026-11-16T09:00', 'America/New_York');
    const losAngeles = datetime('2026-11-16T08:00', 'America/Los_Angeles');
    expect(compare(newYork, losAngeles)).toBe(-1);
    expect([losAngeles, newYork].sort(compare).map((moment) => moment.zone)).toEqual([
      'America/New_York',
      'America/Los_Angeles',
    ]);
  });

  it('returns 0 for one instant viewed in two zones', () => {
    expect(compare(datetime('2026-11-16T12:00', 'America/New_York'), datetime('2026-11-16T17:00Z', 'UTC'))).toBe(0);
  });

  it('tells apart moments and times that differ by one nanosecond', () => {
    expect(compare(datetime('2026-11-16T17:30:00.000000001Z'), datetime('2026-11-16T17:30:00.000000002Z'))).toBe(-1);
    expect(compare(time('09:00:00.000000002'), time('09:00:00.000000001'))).toBe(1);
  });

  it('ignores the locale a value carries', () => {
    expect(compare(date('2026-11-16').locale('de'), date('2026-11-16').locale('ja'))).toBe(0);
  });

  it('orders durations by length whatever unit they were written in', () => {
    const spans = [hours(2), minutes(45), minutes(90)].sort(compare);
    expect(spans.map(String)).toEqual(['PT45M', 'PT90M', 'PT2H']);
    expect(compare(hours(1), minutes(60))).toBe(0);
  });

  it('sorts ranges by their start and breaks a tie by their end', () => {
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

  it('reads two raw strings as dates or times by their shape, never as text', () => {
    expect(compare('2026-05-10', '2026-05-11')).toBe(-1);
    expect(compare('10:00', '9:00')).toBe(1);
    expect(compare('9am', '5:30pm')).toBe(-1);
  });

  // a createdAt column or an API field arrives as text, often several on one day
  it('reads two timestamp strings as moments, so two on one day are ordered by their time', () => {
    expect(compare('2026-11-16T09:00:00Z', '2026-11-16T17:30:00Z')).toBe(-1);
    expect(compare('2026-11-16 17:30:00', '2026-11-16 09:00:00')).toBe(1);
    const written = ['2026-11-16T17:30:00Z', '2026-11-15T23:00:00Z', '2026-11-16T09:00:00Z'];
    expect(written.sort(compare)).toEqual(['2026-11-15T23:00:00Z', '2026-11-16T09:00:00Z', '2026-11-16T17:30:00Z']);
  });

  it('orders timestamp strings by their instant, whatever offset each was written with', () => {
    expect(compare('2026-11-16T09:00:00+01:00', '2026-11-16T09:00:00-05:00')).toBe(-1);
    expect(compare('2026-11-16T09:00:00+01:00', '2026-11-16T08:00:00Z')).toBe(0);
  });

  it('ignores spaces and a line break around a raw string, as a spreadsheet cell or a typed field carries them', () => {
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
  ])('reads two %s values as the kind each one holds', (name, earlier, later) => {
    expect(compare(earlier, later)).toBe(-1);
    expect(compare(later, earlier)).toBe(1);
    expect(compare(earlier, earlier)).toBe(0);
  });

  it('reads a Date or an epoch millisecond number standing first as a moment', () => {
    expect(compare(new Date(1794840000000), datetime('2026-11-16T18:00Z'))).toBe(-1);
    expect(compare(1794840000000, datetime('2026-11-16T18:00Z'))).toBe(-1);
    expect(compare(1794850200000, 1794840000000)).toBe(1);
  });

  it('reads a raw value standing second as the kind of the first', () => {
    expect(compare(date('2026-05-10'), '2026-05-10')).toBe(0);
    expect(compare(yearMonth('2026-11'), '2026-10')).toBe(1);
    expect(compare(hours(2), '45m')).toBe(1);
  });

  it('reads a number beside a time of day as an hour', () => {
    expect(compare(time('09:00'), 9)).toBe(0);
    expect(compare(time('09:00'), 17)).toBe(-1);
  });

  it("reads a wall-clock string beside a moment in that moment's zone", () => {
    expect(compare(datetime('2026-11-16T09:00', 'Asia/Tokyo'), '2026-11-16T09:00')).toBe(0);
    expect(compare(datetime('2026-11-16T09:00', 'Pacific/Honolulu'), '2026-11-16T09:00')).toBe(0);
  });

  it('sorts a list that mixes moments with epoch millisecond numbers', () => {
    expect([3000, datetime(2000), 1000].sort(compare).map(Number)).toEqual([1000, 2000, 3000]);
  });

  it.each([
    ['a date beside a moment', () => compare(date('2026-11-16'), datetime('2026-11-16T00:00Z')), 'date with datetime'],
    ['a moment beside a date', () => compare(datetime('2026-11-16T00:00Z'), date('2026-11-16')), 'datetime with date'],
    ['a date beside a time', () => compare(date('2026-11-16'), time('9:00am')), 'date with time'],
    ['a date beside a year-month', () => compare(date('2026-11-16'), yearMonth('2026-11')), 'date with yearMonth'],
    ['a year-month beside a date', () => compare(yearMonth('2026-11'), date('2026-11-16')), 'yearMonth with date'],
    ['a date beside a duration', () => compare(date('2026-11-16'), hours(2)), 'date with duration'],
    [
      'a date range beside a time range',
      () => compare(dateRange('2026-11-01', '2026-11-07'), timeRange('9am', '5pm')),
      'dateRange with timeRange',
    ],
  ])('refuses %s with a conflictingKinds TypeError naming both kinds', (pair, call, at) => {
    expect(call).toThrowError(expect.objectContaining({ name: 'TypeError', code: 'conflictingKinds', at }));
  });

  it('refuses a calendar date beside an epoch number, since a bare number names no day', () => {
    expect(() => compare(date('2026-11-16'), 1794850200000)).toThrowError(
      expect.objectContaining({ name: 'TypeError', code: 'invalidDate', at: '1794850200000' }),
    );
  });

  it('refuses month-days, which have no order, with an invalidPoint TypeError', () => {
    expect(() => compare(monthDay('10-17'), monthDay('10-18'))).toThrowError(
      expect.objectContaining({ name: 'TypeError', code: 'invalidPoint', at: '10-17' }),
    );
  });

  it.each([
    ['null', null, 'null'],
    ['undefined', undefined, 'undefined'],
    ['a plain object', {}, '[object Object]'],
    ['a boolean', true, 'true'],
  ])('refuses %s with an invalidPoint TypeError', (label, value, at) => {
    expect(() => compare(value, date('2026-11-16'))).toThrowError(
      expect.objectContaining({ name: 'TypeError', code: 'invalidPoint', at }),
    );
  });

  it.todo('reads an interval string beside a range, as it reads a raw string beside every other kind');
});

describe('earliest() and latest()', () => {
  it('return the first and the last of several dates passed as arguments', () => {
    const dates = [date('2026-11-20'), date('2026-11-04'), date('2026-11-16')];
    expect(earliest(...dates).toString()).toBe('2026-11-04');
    expect(latest(...dates).toString()).toBe('2026-11-20');
  });

  it('accept one array in place of separate arguments', () => {
    const times = [time('5:30pm'), time('9:00am'), time('12:15pm')];
    expect(earliest(times).toString()).toBe('09:00:00');
    expect(latest(times).toString()).toBe('17:30:00');
  });

  it('pick among year-months', () => {
    const months = [yearMonth('2026-11'), yearMonth('2025-12'), yearMonth('2026-02')];
    expect(earliest(months).toString()).toBe('2025-12');
    expect(latest(months).toString()).toBe('2026-11');
  });

  it('return the very value passed in, so its zone and locale come back with it', () => {
    const berlin = datetime('2026-11-16T09:00', 'Europe/Berlin').locale('de');
    const tokyo = datetime('2026-11-17T09:00', 'Asia/Tokyo').locale('ja');
    expect(earliest(tokyo, berlin)).toBe(berlin);
    expect(latest(berlin, tokyo)).toBe(tokyo);
    expect(latest(berlin, tokyo).zone).toBe('Asia/Tokyo');
    expect(latest(berlin, tokyo).locale()).toBe('ja');
  });

  it('return the only value when given one', () => {
    const only = date('2026-11-16');
    expect(earliest(only)).toBe(only);
    expect(latest([only])).toBe(only);
  });

  it('keep the earlier item in the list when two moments are the same instant', () => {
    const newYork = datetime('2026-11-16T12:00', 'America/New_York');
    const utc = datetime('2026-11-16T17:00Z', 'UTC');
    expect(earliest(newYork, utc)).toBe(newYork);
    expect(earliest(utc, newYork)).toBe(utc);
    expect(latest(newYork, utc)).toBe(newYork);
    expect(latest(utc, newYork)).toBe(utc);
  });

  it('turn Dates and epoch millisecond numbers into DateTimes', () => {
    const first = earliest(1794850200000, 1794840000000);
    expect(isDateTime(first)).toBe(true);
    expect(first.epochMilliseconds).toBe(1794840000000);
    expect(latest(new Date(1794840000000), new Date(1794850200000)).epochMilliseconds).toBe(1794850200000);
  });

  // the last time any row was updated, read straight off a list of updatedAt strings
  it('read timestamp strings as moments and return the DateTime of the first or the last', () => {
    const updated = ['2026-11-16T09:00:00Z', '2026-11-16T17:30:00Z', '2026-11-15T23:00:00Z'];
    expect(isDateTime(latest(updated))).toBe(true);
    expect(latest(updated).toString()).toBe('2026-11-16T17:30:00.000Z');
    expect(earliest(...updated).toString()).toBe('2026-11-15T23:00:00.000Z');
  });

  it('read raw values after the first as the kind of the first', () => {
    expect(earliest(date('2026-11-20'), '2026-11-04').toString()).toBe('2026-11-04');
    expect(earliest(time('09:00'), 8).toString()).toBe('08:00:00');
  });

  it('clamp a value between two bounds when combined', () => {
    const [min, max] = [date('2026-11-01'), date('2026-11-30')];
    const clamp = (picked) => earliest(max, latest(min, picked)).toString();
    expect(clamp(date('2026-12-12'))).toBe('2026-11-30');
    expect(clamp(date('2026-10-12'))).toBe('2026-11-01');
    expect(clamp(date('2026-11-12'))).toBe('2026-11-12');
  });

  it('leave the array passed in as it was', () => {
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
  ])('%s is refused with a missingPoints RangeError', (label, call, at) => {
    expect(call).toThrowError(expect.objectContaining({ name: 'RangeError', code: 'missingPoints', at }));
  });

  it('refuse a mix of kinds with a conflictingKinds TypeError', () => {
    expect(() => latest(date('2026-11-16'), time('9:00am'))).toThrowError(
      expect.objectContaining({ name: 'TypeError', code: 'conflictingKinds' }),
    );
  });

  it.each([
    ['durations', () => earliest(hours(2), minutes(45))],
    ['ranges', () => earliest(dateRange('2026-11-10', '2026-11-20'), dateRange('2026-11-01', '2026-11-05'))],
    ['month-days', () => latest(monthDay('10-17'), monthDay('01-01'))],
  ])('refuse %s, which are not points on a timeline, with an invalidPoint TypeError', (label, call) => {
    expect(call).toThrowError(expect.objectContaining({ name: 'TypeError', code: 'invalidPoint' }));
  });

  it.todo('read a year-month string beside a YearMonth, as compare() does');
});
