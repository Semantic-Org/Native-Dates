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

const missingPlugin = (option) => expect.objectContaining({ name: 'RangeError', code: 'missingPlugin', at: option });
const unknownZone = (zone) => expect.objectContaining({ name: 'RangeError', code: 'unknownZone', at: zone });

describe('{ loose: true } without @native-dates/plugins/loose', () => {
  const factories = { date, datetime, time, duration, yearMonth, monthYear, monthDay, dayMonth };

  it.each(Object.entries(factories))('%s() throws missingPlugin at loose for informal input', (_name, parse) => {
    expect(() => parse('Sep 6, 2026', { loose: true })).toThrowError(missingPlugin('loose'));
  });

  // prevents valid ISO inputs or null returns from hiding a missing plugin import until production
  it('throws missingPlugin at loose even for valid ISO strings, invalid text, and undefined', () => {
    expect(() => date('2026-09-06', { loose: true })).toThrowError(missingPlugin('loose'));
    expect(() => time('9am', { loose: true })).toThrowError(missingPlugin('loose'));
    expect(() => duration('2h', { loose: true })).toThrowError(missingPlugin('loose'));
    expect(() => date('TBD', { loose: true })).toThrowError(missingPlugin('loose'));
    expect(() => date(undefined, { loose: true })).toThrowError(missingPlugin('loose'));
  });

  it('throws missingPlugin at loose across dateRange(), datetimeRange(), and timeRange()', () => {
    expect(() => dateRange('2026-09-01', '2026-09-07', { loose: true })).toThrowError(missingPlugin('loose'));
    expect(() => dateRange('2026-09-01/2026-09-07', { loose: true })).toThrowError(missingPlugin('loose'));
    expect(() => datetimeRange('2026-09-01T09:00', '2026-09-01T17:00', { loose: true })).toThrowError(
      missingPlugin('loose'),
    );
    expect(() => timeRange('9am', '5pm', { loose: true })).toThrowError(missingPlugin('loose'));
  });

  it('throws missingPlugin at loose across class constructors', () => {
    expect(() => new CalendarDate('2026-09-06', { loose: true })).toThrowError(missingPlugin('loose'));
    expect(() => new DateTime('2026-09-06', { loose: true })).toThrowError(missingPlugin('loose'));
    expect(() => new Time('9am', { loose: true })).toThrowError(missingPlugin('loose'));
    expect(() => new YearMonth('2026-09', { loose: true })).toThrowError(missingPlugin('loose'));
    expect(() => new MonthDay('10-17', { loose: true })).toThrowError(missingPlugin('loose'));
    expect(() => new DateRange('2026-09-01', '2026-09-07', { loose: true })).toThrowError(missingPlugin('loose'));
  });

  it('parses valid inputs normally when loose is false or omitted', () => {
    expect(date('2026-09-06', { loose: false }).toString()).toBe('2026-09-06');
    expect(date('2026-09-06', { zone: 'UTC' }).toString()).toBe('2026-09-06');
  });
});

describe('dayFirst without @native-dates/plugins/loose', () => {
  it('throws missingPlugin at dayFirst from configure({ dayFirst })', () => {
    expect(() => configure({ dayFirst: true })).toThrowError(missingPlugin('dayFirst'));
    expect(() => configure({ dayFirst: false })).toThrowError(missingPlugin('dayFirst'));
  });

  it('leaves configure().dayFirst unchanged after configure({ dayFirst: true }) throws', () => {
    expect(() => configure({ dayFirst: true })).toThrowError(missingPlugin('dayFirst'));
    expect(configure().dayFirst).toBe(undefined);
  });

  it('throws missingPlugin at dayFirst from date(), datetime(), time(), and range factories', () => {
    expect(() => date('7/9/2026', { dayFirst: true })).toThrowError(missingPlugin('dayFirst'));
    expect(() => datetime('7/9/2026 14:30', { dayFirst: true })).toThrowError(missingPlugin('dayFirst'));
    expect(() => time('7/9/2026 14:30', { dayFirst: true })).toThrowError(missingPlugin('dayFirst'));
    expect(() => dateRange('1/9/2026', '7/9/2026', { dayFirst: true })).toThrowError(missingPlugin('dayFirst'));
  });

  it('throws missingPlugin at loose first when both loose and dayFirst are passed', () => {
    expect(() => date('7/9/2026', { loose: true, dayFirst: true })).toThrowError(missingPlugin('loose'));
  });

  it('supports numeric dayFirst in monthDay() and dayMonth() without the loose plugin', () => {
    expect(monthDay('17/10', { dayFirst: true }).toString()).toBe('10-17');
    expect(dayMonth('17/10').toString()).toBe('10-17');
  });
});

describe('zone aliases and city names without @native-dates/plugins/zones', () => {
  const noonInJuly = '2026-07-01T12:00:00Z';

  it('throws unknownZone for city names and timezone abbreviations', () => {
    expect(() => datetime(noonInJuly, 'Berlin')).toThrowError(unknownZone('Berlin'));
    expect(() => datetime(noonInJuly, 'PT')).toThrowError(unknownZone('PT'));
  });

  it('throws missingPlugin at zoneAliases from configure({ zoneAliases })', () => {
    expect(() => configure({ zoneAliases: { hq: 'Europe/Berlin' } })).toThrowError(missingPlugin('zoneAliases'));
  });
});

describe('{ format } without @native-dates/plugins/parse', () => {
  it('throws missingPlugin at format across point factories, ranges, and class constructors', () => {
    expect(() => date('24112026', { format: 'DDMMYYYY' })).toThrowError(missingPlugin('format'));
    expect(() => datetime('24112026 0930', { format: 'DDMMYYYY HHmm' })).toThrowError(missingPlugin('format'));
    expect(() => time('0930', { format: 'HHmm' })).toThrowError(missingPlugin('format'));
    expect(() => yearMonth('11/2026', { format: 'MM/YYYY' })).toThrowError(missingPlugin('format'));
    expect(() => monthDay('24/11', { format: 'DD/MM' })).toThrowError(missingPlugin('format'));
    expect(() => dateRange('24112026', '30112026', { format: 'DDMMYYYY' })).toThrowError(missingPlugin('format'));
    expect(() => new CalendarDate('24112026', { format: 'DDMMYYYY' })).toThrowError(missingPlugin('format'));
    expect(() => new DateTime('24112026 0930', { format: 'DDMMYYYY HHmm' })).toThrowError(missingPlugin('format'));
  });
});
