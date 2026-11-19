import {
  CalendarDate,
  configure,
  date,
  DateRange,
  dateRange,
  DateTime,
  datetime,
  datetimeRange,
  dayMonth,
  duration,
  MonthDay,
  monthDay,
  monthYear,
  Time,
  time,
  timeRange,
  YearMonth,
  yearMonth,
} from 'native-dates';
import { describe, expect, it } from 'vitest';

// this file never imports '@native-dates/plugins/loose', and each test file loads native-dates afresh
const missingPlugin = (option) => expect.objectContaining({ name: 'RangeError', code: 'missingPlugin', at: option });

describe('{ loose: true } before @native-dates/plugins/loose is imported', () => {
  const factories = { date, datetime, time, duration, yearMonth, monthYear, monthDay, dayMonth };

  it.each(Object.entries(factories))('%s() throws missingPlugin at loose for informal text', (name, read) => {
    expect(() => read('Sep 6, 2026', { loose: true })).toThrowError(missingPlugin('loose'));
  });

  // returning null here would look like bad input, and reading strictly would hide the missing import until production
  it('throws missingPlugin for text that needs no plugin to read, and for text nothing could read', () => {
    expect(() => date('2026-09-06', { loose: true })).toThrowError(missingPlugin('loose'));
    expect(() => time('9am', { loose: true })).toThrowError(missingPlugin('loose'));
    expect(() => duration('2h', { loose: true })).toThrowError(missingPlugin('loose'));
    expect(() => date('TBD', { loose: true })).toThrowError(missingPlugin('loose'));
    expect(() => date(undefined, { loose: true })).toThrowError(missingPlugin('loose'));
  });

  it('throws missingPlugin from every range factory', () => {
    expect(() => dateRange('2026-09-01', '2026-09-07', { loose: true })).toThrowError(missingPlugin('loose'));
    expect(() => dateRange('2026-09-01/2026-09-07', { loose: true })).toThrowError(missingPlugin('loose'));
    expect(() => datetimeRange('2026-09-01T09:00', '2026-09-01T17:00', { loose: true })).toThrowError(
      missingPlugin('loose'),
    );
    expect(() => timeRange('9am', '5pm', { loose: true })).toThrowError(missingPlugin('loose'));
  });

  it('throws missingPlugin from the class constructors', () => {
    expect(() => new CalendarDate('2026-09-06', { loose: true })).toThrowError(missingPlugin('loose'));
    expect(() => new DateTime('2026-09-06', { loose: true })).toThrowError(missingPlugin('loose'));
    expect(() => new Time('9am', { loose: true })).toThrowError(missingPlugin('loose'));
    expect(() => new YearMonth('2026-09', { loose: true })).toThrowError(missingPlugin('loose'));
    expect(() => new MonthDay('10-17', { loose: true })).toThrowError(missingPlugin('loose'));
    expect(() => new DateRange('2026-09-01', '2026-09-07', { loose: true })).toThrowError(missingPlugin('loose'));
  });

  it('names the module to import in the development message', () => {
    expect(() => date('Sep 6, 2026', { loose: true })).toThrowError(
      expect.objectContaining({ message: expect.stringContaining("'@native-dates/plugins/loose'") }),
    );
  });

  it('reads as usual when loose is false or left out', () => {
    expect(date('2026-09-06', { loose: false }).toString()).toBe('2026-09-06');
    expect(date('2026-09-06', { zone: 'UTC' }).toString()).toBe('2026-09-06');
  });
});

describe('dayFirst before @native-dates/plugins/loose is imported', () => {
  it('throws missingPlugin at dayFirst from configure(), whatever the value', () => {
    expect(() => configure({ dayFirst: true })).toThrowError(missingPlugin('dayFirst'));
    expect(() => configure({ dayFirst: false })).toThrowError(missingPlugin('dayFirst'));
  });

  it('leaves the other settings unchanged when configure() refuses dayFirst', () => {
    expect(() => configure({ dayFirst: true })).toThrowError(missingPlugin('dayFirst'));
    expect(configure().dayFirst).toBe(false);
  });

  it('throws missingPlugin at dayFirst from date(), datetime(), time() and the ranges', () => {
    expect(() => date('7/9/2026', { dayFirst: true })).toThrowError(missingPlugin('dayFirst'));
    expect(() => datetime('7/9/2026 14:30', { dayFirst: true })).toThrowError(missingPlugin('dayFirst'));
    expect(() => time('7/9/2026 14:30', { dayFirst: true })).toThrowError(missingPlugin('dayFirst'));
    expect(() => dateRange('1/9/2026', '7/9/2026', { dayFirst: true })).toThrowError(missingPlugin('dayFirst'));
  });

  it('names loose when a call passes both loose and dayFirst', () => {
    expect(() => date('7/9/2026', { loose: true, dayFirst: true })).toThrowError(missingPlugin('loose'));
  });

  // monthDay() and dayMonth() read numbers day first on their own
  it('still reads a month and day with no year day first, which needs no plugin', () => {
    expect(monthDay('17/10', { dayFirst: true }).toString()).toBe('10-17');
    expect(dayMonth('17/10').toString()).toBe('10-17');
  });
});
