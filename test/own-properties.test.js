import { date, dateRange, datetime, datetimeRange, duration, monthDay, time, timeRange, yearMonth } from 'native-dates';
import { isDeepStrictEqual } from 'node:util';
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

describe('own properties', () => {
  // a console preview lists own properties in order, so text is what a reader meets first
  it.each(classNames)('a %s lists text, a string, first among its own keys', (className) => {
    expect(Object.keys(values[className])[0]).toBe('text');
    expect(values[className].text).toBeTypeOf('string');
    expect(values[className].text).not.toBe('');
  });

  it('a DateTime spreads into its date and clock fields to the millisecond, its zone, offset and epoch', () => {
    expect({ ...values.DateTime }).toStrictEqual({
      text: expect.any(String),
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

  it('a CalendarDate spreads into its year, month, day and day of the week', () => {
    expect({ ...values.CalendarDate }).toStrictEqual({
      text: expect.any(String),
      year: 2026,
      month: 11,
      day: 16,
      dayOfWeek: 1,
    });
  });

  it('a Time spreads into its clock fields to the millisecond', () => {
    expect({ ...values.Time }).toStrictEqual({
      text: expect.any(String),
      hour: 9,
      minute: 30,
      second: 15,
      millisecond: 250,
    });
  });

  it('a Duration spreads into every unit from years to milliseconds, its sign and its anchor', () => {
    expect({ ...values.Duration }).toStrictEqual({
      text: expect.any(String),
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

  it('a YearMonth and a MonthDay spread into the two fields each holds', () => {
    expect({ ...values.YearMonth }).toStrictEqual({ text: expect.any(String), year: 2026, month: 11 });
    expect({ ...values.MonthDay }).toStrictEqual({ text: expect.any(String), month: 10, day: 17 });
  });

  it.each([
    ['DateRange', 'date', '2026-11-01', '2026-11-07'],
    ['DateTimeRange', 'datetime', '2026-11-16T09:00:00.000Z', '2026-11-16T10:00:00.000Z'],
    ['TimeRange', 'time', '09:00:00', '17:00:00'],
  ])('a %s spreads into its kind and the values at its two ends', (className, kind, start, end) => {
    const spread = { ...values[className] };
    expect(Object.keys(spread).sort()).toEqual(['end', 'kind', 'start', 'text']);
    expect(spread.kind).toBe(kind);
    expect(spread.start.toString()).toBe(start);
    expect(spread.end.toString()).toBe(end);
  });
});

describe('deep equality', () => {
  it.each([
    ['moments', datetime, '2026-11-16T17:30:00Z'],
    ['dates', date, '2026-11-16'],
    ['times', time, '9:30am'],
    ['durations', duration, '1h 30m'],
    ['year-months', yearMonth, '2026-11'],
    ['month-days', monthDay, '10-17'],
    ['date ranges', dateRange, '2026-11-01/2026-11-07'],
    ['moment ranges', datetimeRange, '2026-11-16T09:00Z/2026-11-16T10:00Z'],
    ['time ranges', timeRange, '09:00/17:00'],
  ])('holds between two %s read from the same input', (kind, read, input) => {
    expect(read(input)).toEqual(read(input));
    expect(read(input)).toStrictEqual(read(input));
    expect(isDeepStrictEqual(read(input), read(input))).toBe(true);
  });

  it.each([
    ['moments a millisecond apart', datetime('2026-11-16T17:30:00.001Z'), datetime('2026-11-16T17:30:00.002Z')],
    [
      'one instant viewed in two zones',
      datetime('2026-11-16T17:30:00Z', 'UTC'),
      datetime('2026-11-16T17:30:00Z', 'Asia/Tokyo'),
    ],
    ['dates a day apart', date('2026-11-16'), date('2026-11-17')],
    ['the same day a year apart', date('2026-11-16'), date('2027-11-16')],
    ['times a millisecond apart', time('09:30:00.001'), time('09:30:00.002')],
    ['durations a minute apart', duration('1h 30m'), duration('1h 31m')],
    ['a duration and its negative', duration('1h 30m'), duration('1h 30m').negated()],
    ['year-months a month apart', yearMonth('2026-11'), yearMonth('2026-12')],
    ['month-days a day apart', monthDay('10-17'), monthDay('10-18')],
    ['date ranges that end a day apart', dateRange('2026-11-01', '2026-11-07'), dateRange('2026-11-01', '2026-11-08')],
    ['time ranges that start an hour apart', timeRange('9:00am', '5:00pm'), timeRange('10:00am', '5:00pm')],
    ['a date and a moment at its midnight', date('2026-11-16'), date('2026-11-16').as('datetime', 'UTC')],
  ])('fails between %s', (label, one, other) => {
    expect(one).not.toEqual(other);
    expect(isDeepStrictEqual(one, other)).toBe(false);
  });
});
