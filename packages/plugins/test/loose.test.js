import '@native-dates/plugins/loose';
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
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

const factories = { date, datetime, time, duration, yearMonth, monthYear, monthDay, dayMonth };
const rangeFactories = { dateRange, datetimeRange, timeRange };

afterEach(() => {
  configure({ zone: null, locale: null, dayFirst: null });
});

describe('date() with { loose: true }', () => {
  it.each([
    'September 6, 2026',
    'Sep 6, 2026',
    'Sept 6, 2026',
    'sep 6 2026',
    '6 September 2026',
    '6 Sep 2026',
    'Sunday, September 6, 2026',
    'Sun 6 Sep 2026',
    '9/6/2026',
    '09/06/2026',
    '9/6/26',
    '  Sep 6, 2026  ',
  ])('parses %j as 2026-09-06', (text) => {
    expect(date(text, { loose: true })?.toString()).toBe('2026-09-06');
  });

  // trailing -26 or -2026 is the year rather than a UTC offset
  it.each(['6-Sep-26', '06-SEP-26', '06-Sep-2026', 'Sep-6-26'])(
    'parses hyphenated day, month name, and year %j as 2026-09-06 in any target zone',
    (text) => {
      expect(date(text, { loose: true })?.toString()).toBe('2026-09-06');
      expect(date(text, { loose: true, zone: 'America/Los_Angeles' })?.toString()).toBe('2026-09-06');
      expect(date(text, { loose: true, zone: 'Asia/Tokyo' })?.toString()).toBe('2026-09-06');
    },
  );

  it('round-trips en-US format() output across all presets', () => {
    const day = date('2026-09-06');
    for (const preset of ['short', 'medium', 'long', 'full']) {
      const formatted = day.format(preset, 'en-US');
      expect(date(formatted, { loose: true })?.toString(), formatted).toBe('2026-09-06');
    }
  });

  it('converts zoned timestamps to the calendar date in the target zone', () => {
    const lateEvening = 'Sun, 06 Sep 2026 20:30:00 GMT';
    expect(date(lateEvening, { loose: true, zone: 'America/New_York' })?.toString()).toBe('2026-09-06');
    expect(date(lateEvening, { loose: true, zone: 'Asia/Tokyo' })?.toString()).toBe('2026-09-07');
  });

  it('ignores wall-clock time on unzoned datetime strings regardless of target zone', () => {
    expect(date('Sep 6, 2026 11:30 PM', { loose: true, zone: 'Asia/Tokyo' })?.toString()).toBe('2026-09-06');
    expect(date('Sep 6, 2026 12:30 AM', { loose: true, zone: 'America/Los_Angeles' })?.toString()).toBe('2026-09-06');
  });

  it('sets the locale option on the returned CalendarDate', () => {
    expect(date('Sep 6, 2026', { loose: true, locale: 'fr' })?.locale()).toBe('fr');
  });

  it('accepts Date, DateTime, plain object fields, and CalendarDate inputs', () => {
    const lateEvening = new Date('2026-09-06T20:30:00Z');
    expect(date(lateEvening, { loose: true, zone: 'Asia/Tokyo' })?.toString()).toBe('2026-09-07');
    expect(date(datetime(lateEvening, 'UTC'), { loose: true, zone: 'Asia/Tokyo' })?.toString()).toBe('2026-09-07');
    expect(date({ year: 2026, month: 9, day: 6 }, { loose: true })?.toString()).toBe('2026-09-06');
    expect(date(date('2026-09-06'), { loose: true })?.toString()).toBe('2026-09-06');
  });
});

describe('datetime() with { loose: true }', () => {
  it.each([
    ['Date.prototype.toString()', 'Sun Sep 06 2026 10:30:00 GMT-0400 (Eastern Daylight Time)'],
    ['RFC 7231 / Date.prototype.toUTCString()', 'Sun, 06 Sep 2026 14:30:00 GMT'],
    ['RFC 2822 numeric offset', 'Sun, 6 Sep 2026 16:30:00 +0200'],
    ['RFC 850 cookie date', 'Sunday, 06-Sep-26 14:30:00 GMT'],
    ['git log timestamp', 'Sun Sep 6 16:30:00 2026 +0200'],
    ['PostgreSQL timestamptz', '2026-09-06 16:30:00+02'],
    ['ISO 8601 UTC string', '2026-09-06T14:30:00.000Z'],
    ['en-US formatted datetime with UTC suffix', 'Sep 6, 2026, 2:30\u202fPM UTC'],
    ['RFC 2822 zone abbreviation', 'Sun, 06 Sep 2026 10:30:00 EDT'],
    ['lowercase zone abbreviation', 'Sun, 06 Sep 2026 07:30:00 pdt'],
    ['date(1) output with the zone before the year', 'Sun Sep  6 14:30:00 UTC 2026'],
    ['GMT with a single-digit offset', 'Sep 6 2026 16:30 GMT+2'],
    ['a bare single-digit offset', 'Sep 6 2026 19:30 +5'],
    ['RFC 2822 offset followed by a zone comment', 'Sun, 06 Sep 2026 07:30:00 -0700 (PDT)'],
  ])('parses exact instant from %s into target zone', (_format, text) => {
    const parsed = datetime(text, { loose: true, zone: 'Asia/Tokyo' });
    expect(parsed?.toString()).toBe('2026-09-06T14:30:00.000Z');
    expect(parsed).toMatchObject({ zone: 'Asia/Tokyo', day: 6, hour: 23, minute: 30 });
  });

  it.each([
    ['C asctime()', 'Sun Sep  6 14:30:00 2026'],
    ['SQL timestamp without timezone', '2026-09-06 14:30:00'],
    ['en-US toLocaleString() with narrow no-break space', '9/6/2026, 2:30:00\u202fPM'],
    ['en-US toLocaleString() with ASCII space', '9/6/2026, 2:30:00 PM'],
    ['Intl medium datetime', 'Sep 6, 2026, 2:30\u202fPM'],
    ['month-first prose datetime', 'September 6, 2026 14:30'],
    ['day-first prose datetime', '6 Sep 2026 14:30'],
    ['slash-delimited numeric datetime', '9/6/2026 2:30 PM'],
    ['zone name inside a parenthesized comment', 'Sep 6 2026 14:30 (EDT)'],
    ['offset inside a parenthesized comment', 'Sep 6 2026 14:30 (GMT+2)'],
    ['zone name before the first number', 'PST Sep 6 2026 14:30'],
  ])('keeps wall-clock time in target zone for unzoned %s', (_format, text) => {
    const parsed = datetime(text, { loose: true, zone: 'Asia/Tokyo' });
    expect(parsed).toMatchObject({ zone: 'Asia/Tokyo', year: 2026, month: 9, day: 6, hour: 14, minute: 30 });
  });

  it('converts a zoned timestamp into different target zones', () => {
    const header = 'Sun, 06 Sep 2026 14:30:00 GMT';
    expect(datetime(header, { loose: true, zone: 'America/New_York' })).toMatchObject({ hour: 10, offset: '-04:00' });
    expect(datetime(header, { loose: true, zone: 'Europe/Berlin' })).toMatchObject({ hour: 16, offset: '+02:00' });
  });

  it('defaults date-only inputs to midnight in the target zone', () => {
    const parsed = datetime('Jun 15, 2026', { loose: true, zone: 'Asia/Tokyo' });
    expect(parsed).toMatchObject({ zone: 'Asia/Tokyo', day: 15, hour: 0, minute: 0 });
  });

  it('preserves seconds and milliseconds', () => {
    const parsed = datetime('Sep 6 2026 14:30:15.250', { loose: true, zone: 'UTC' });
    expect(parsed?.toString()).toBe('2026-09-06T14:30:15.250Z');
  });

  // guard against superlinear backtracking on untrusted inputs
  it('parses 200 KB of repeated zone abbreviations in under 500 ms', () => {
    const stuffed = `Sep 6 2026 14:30${' EST'.repeat(50_000)}`;
    const started = performance.now();
    datetime(stuffed, { loose: true, zone: 'UTC' });
    expect(performance.now() - started).toBeLessThan(500);
  });

  it('accepts Date instances and epoch milliseconds', () => {
    const epoch = Date.UTC(2026, 8, 6, 14, 30);
    expect(datetime(epoch, { loose: true, zone: 'UTC' })?.toString()).toBe('2026-09-06T14:30:00.000Z');
    expect(datetime(new Date(epoch), { loose: true, zone: 'UTC' })?.toString()).toBe('2026-09-06T14:30:00.000Z');
  });

  it('sets the locale option on the returned DateTime', () => {
    expect(datetime('Sep 6, 2026 5:30 PM', { loose: true, zone: 'UTC', locale: 'fr' })?.locale()).toBe('fr');
  });

  it('uses configure({ zone }) when no zone option is passed', () => {
    configure({ zone: 'Asia/Tokyo' });
    expect(datetime('Sep 6, 2026 5:30 PM', { loose: true })).toMatchObject({ zone: 'Asia/Tokyo', hour: 17 });
    expect(datetime('Sun, 06 Sep 2026 14:30:00 GMT', { loose: true })).toMatchObject({
      zone: 'Asia/Tokyo',
      hour: 23,
    });
  });

  it('returns null without throwing uncoded errors for out-of-range offsets', () => {
    expect(datetime('14:30 +2500', { loose: true })).toBeNull();
    expect(datetime('2026-09-06T14:30:00+25:00', { loose: true, zone: 'UTC' })).toBeNull();
  });
});

describe('time() with { loose: true }', () => {
  it('extracts wall-clock time from informal datetime strings', () => {
    expect(time('September 6, 2026 5:30 PM', { loose: true })?.toString()).toBe('17:30:00');
    expect(time('9/6/2026 2:30 PM', { loose: true })?.toString()).toBe('14:30:00');
    expect(time('Sun Sep  6 14:30:15 2026', { loose: true })?.toString()).toBe('14:30:15');
  });

  it('converts zoned timestamps to wall-clock time in the target zone', () => {
    const header = 'Sun, 06 Sep 2026 14:30:00 GMT';
    expect(time(header, { loose: true, zone: 'America/New_York' })?.toString()).toBe('10:30:00');
    expect(time(header, { loose: true, zone: 'Asia/Tokyo' })?.toString()).toBe('23:30:00');
  });

  it('parses standalone time strings', () => {
    expect(time('5:30 PM', { loose: true })?.toString()).toBe('17:30:00');
    expect(time('9am', { loose: true })?.toString()).toBe('09:00:00');
    expect(time('17:30:15', { loose: true })?.toString()).toBe('17:30:15');
  });

  it('accepts Date, DateTime, and plain object fields', () => {
    const afternoon = new Date('2026-09-06T14:30:00Z');
    expect(time(afternoon, { loose: true, zone: 'Asia/Tokyo' })?.toString()).toBe('23:30:00');
    expect(time(datetime(afternoon, 'UTC'), { loose: true, zone: 'Asia/Tokyo' })?.toString()).toBe('23:30:00');
    expect(time({ hour: 14, minute: 30 }, { loose: true })?.toString()).toBe('14:30:00');
  });

  it('sets the locale option on the returned Time', () => {
    expect(time('Sep 6, 2026 5:30 PM', { loose: true, locale: 'fr' })?.locale()).toBe('fr');
  });
});

describe('duration() with { loose: true }', () => {
  it('parses valid duration strings', () => {
    expect(duration('2h', { loose: true })?.toString()).toBe('PT2H');
    expect(duration('45 mins', { loose: true })?.toString()).toBe('PT45M');
    expect(duration('2 weeks and 3 days', { loose: true })?.toString()).toBe('P2W3D');
  });

  it('sets the locale option on the returned Duration', () => {
    expect(duration('2h', { loose: true, locale: 'fr' })?.locale()).toBe('fr');
  });

  it.each([
    ['non-duration text', 'soon'],
    ['unknown unit', '5 foo'],
    ['mixed-sign units', '1h -30m'],
    ['fractional calendar month', '1.5 months'],
  ])('returns null for %s (%j)', (_reason, text) => {
    expect(duration(text, { loose: true })).toBeNull();
  });
});

describe('dateRange(), datetimeRange(), and timeRange() with { loose: true }', () => {
  it('parses informal start and end arguments', () => {
    expect(dateRange('Sep 1 2026', 'Sep 7 2026', { loose: true })?.toString()).toBe('2026-09-01/2026-09-07');
    expect(
      datetimeRange('Sep 1 2026 9:00 AM', 'Sep 1 2026 5:00 PM', { loose: true, zone: 'UTC' })?.toString(),
    ).toBe('2026-09-01T09:00:00.000Z/2026-09-01T17:00:00.000Z');
    expect(timeRange('Sep 1 2026 9:00 AM', 'Sep 1 2026 5:00 PM', { loose: true })?.toString()).toBe(
      '09:00:00/17:00:00',
    );
  });

  it.each([
    'Sep 1, 2026 to Sep 7, 2026',
    'Sep 1, 2026 - Sep 7, 2026',
    'Sep 1, 2026 – Sep 7, 2026',
    '9/1/2026 - 9/7/2026',
    'Sep 1 2026/Sep 7 2026',
  ])('parses single-string range %j', (interval) => {
    expect(dateRange(interval, { loose: true })?.toString()).toBe('2026-09-01/2026-09-07');
  });

  it('parses an informal start paired with a duration end', () => {
    expect(dateRange('Sep 1 2026', '7 days', { loose: true })?.toString()).toBe('2026-09-01/2026-09-07');
    expect(datetimeRange('Sep 1 2026 9:00 AM', '90m', { loose: true, zone: 'UTC' })?.toString()).toBe(
      '2026-09-01T09:00:00.000Z/2026-09-01T10:30:00.000Z',
    );
  });

  it('converts zoned datetimeRange() endpoints into the target zone', () => {
    const meeting = datetimeRange('Sun, 06 Sep 2026 14:30:00 GMT', 'Sun, 06 Sep 2026 16:30:00 GMT', {
      loose: true,
      zone: 'America/New_York',
    });
    expect(meeting?.start).toMatchObject({ zone: 'America/New_York', hour: 10 });
    expect(meeting?.end).toMatchObject({ zone: 'America/New_York', hour: 12 });
  });

  it('preserves strict ISO and time-range inputs', () => {
    expect(dateRange('2026-09-01/2026-09-07', { loose: true })?.toString()).toBe('2026-09-01/2026-09-07');
    expect(timeRange('9am - 5pm', { loose: true })?.toString()).toBe('09:00:00/17:00:00');
  });

  it('applies zone and locale options to single-string datetimeRange() inputs', () => {
    const shift = datetimeRange('Sep 1 2026 9:00 AM - Sep 1 2026 5:00 PM', {
      loose: true,
      zone: 'Asia/Tokyo',
      locale: 'fr',
    });
    expect(shift?.start).toMatchObject({ zone: 'Asia/Tokyo', day: 1, hour: 9 });
    expect(shift?.end).toMatchObject({ zone: 'Asia/Tokyo', day: 1, hour: 17 });
    expect(shift?.locale()).toBe('fr');
  });

  it('propagates the locale option to the range and both endpoints', () => {
    const stay = dateRange('Sep 1 2026', 'Sep 7 2026', { loose: true, locale: 'fr' });
    expect([stay?.locale(), stay?.start.locale(), stay?.end.locale()]).toEqual(['fr', 'fr', 'fr']);
  });
});

describe('{ loose: true } null return on invalid inputs', () => {
  it.each(Object.entries(factories))('%s() returns null for placeholder strings', (_name, parse) => {
    for (const text of ['TBD', 'N/A', 'not a date']) {
      expect(parse(text, { loose: true }), text).toBeNull();
    }
  });

  it.each(Object.entries(factories))(
    '%s() returns null for empty, whitespace, null, and undefined inputs',
    (_name, parse) => {
      for (const missing of ['', '   ', undefined, null]) {
        expect(parse(missing, { loose: true }), String(missing)).toBeNull();
      }
    },
  );

  it.each(Object.entries(factories))(
    '%s() returns null for booleans, arrays, NaN, and invalid Dates',
    (_name, parse) => {
      for (const value of [true, [], Number.NaN, new Date(Number.NaN)]) {
        expect(parse(value, { loose: true }), String(value)).toBeNull();
      }
    },
  );

  it.each([
    '2026-02-30',
    '02/30/2026',
    'Feb 30 2026',
    '30 Feb 2026',
    'February 30, 2026',
    'Feb 29 2026',
    'Apr 31 2026',
    'Dec 32 2026',
    '2026-02-30T10:00',
    'Feb 30, 2026 10:00:00 GMT',
    'Jun 31, 2026 5:00 PM',
  ])('returns null for nonexistent calendar date %j', (text) => {
    expect(date(text, { loose: true })).toBeNull();
    expect(datetime(text, { loose: true, zone: 'UTC' })).toBeNull();
  });

  // Date.parse rolls Feb 31 forward to March 3, so overflow detection must catch days beyond 30
  it.each(['2/31/2026', 'Feb 31 2026', '31 Feb 2026'])('returns null for overflow date %j', (text) => {
    expect(date(text, { loose: true })).toBeNull();
    expect(datetime(text, { loose: true, zone: 'UTC' })).toBeNull();
  });

  it('returns null in time() when the date portion is a nonexistent calendar day', () => {
    expect(time('Feb 30 2026 14:30', { loose: true })).toBeNull();
  });

  // two-digit years on March 1-3 must not trigger the Feb 29-31 overflow check
  it.each([
    ['Mar 1, 29', '2029-03-01'],
    ['Mar 2, 30', '2030-03-02'],
    ['May 1, 31', '2031-05-01'],
    ['Mar 1 2026', '2026-03-01'],
    ['Feb 29 2024', '2024-02-29'],
    ['2/29/2000', '2000-02-29'],
  ])('preserves valid early-March and leap-year dates like %j', (text, expected) => {
    expect(date(text, { loose: true })?.toString()).toBe(expected);
  });

  it('returns null for out-of-range object fields', () => {
    expect(date({ year: 2026, month: 2, day: 30 }, { loose: true })).toBeNull();
    expect(datetime({ year: 2026, month: 2, day: 30, hour: 9 }, { loose: true, zone: 'UTC' })).toBeNull();
    expect(time({ hour: 25 }, { loose: true })).toBeNull();
    expect(monthDay({ month: 2, day: 30 }, { loose: true })).toBeNull();
    expect(yearMonth({ year: 2026, month: 13 }, { loose: true })).toBeNull();
  });

  it('returns null for out-of-range clock strings', () => {
    expect(time('25:00', { loose: true })).toBeNull();
    expect(time('13pm', { loose: true })).toBeNull();
  });

  it('returns null when passing a numeric timestamp to date()', () => {
    expect(date(1794850200000, { loose: true })).toBeNull();
  });

  it.each(Object.entries(rangeFactories))('%s() returns null when neither endpoint can be parsed', (_name, range) => {
    expect(range('TBD', 'TBD', { loose: true })).toBeNull();
    expect(range(undefined, undefined, { loose: true })).toBeNull();
    expect(range('not a range', { loose: true })).toBeNull();
    expect(range('', { loose: true })).toBeNull();
  });

  it('returns null when either range endpoint cannot be parsed', () => {
    expect(dateRange('TBD', '2026-09-07', { loose: true })).toBeNull();
    expect(dateRange('2026-09-01', 'TBD', { loose: true })).toBeNull();
    expect(dateRange('Sep 1 2026', undefined, { loose: true })).toBeNull();
    expect(datetimeRange('2026-09-01T09:00', 'later', { loose: true })).toBeNull();
    expect(timeRange('9am', 'whenever', { loose: true })).toBeNull();
  });

  it('returns null when either range endpoint is a nonexistent calendar day', () => {
    expect(dateRange('Feb 30 2026', 'Mar 7 2026', { loose: true })).toBeNull();
    expect(dateRange('Feb 1 2026', 'Feb 30 2026', { loose: true })).toBeNull();
  });
});

describe('{ loose: true } option validation', () => {
  const zoned = { date, datetime, time, yearMonth, monthYear, monthDay, dayMonth };

  it.each(Object.entries(zoned))('%s() throws unknownZone even when input is unreadable', (_name, parse) => {
    expect(() => parse('TBD', { loose: true, zone: 'Mars/Olympus' })).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'unknownZone', at: 'Mars/Olympus' }),
    );
  });

  it.each(Object.entries(rangeFactories))(
    '%s() throws unknownZone even when endpoints are unreadable',
    (_name, range) => {
      expect(() => range('TBD', 'TBD', { loose: true, zone: 'Mars/Olympus' })).toThrowError(
        expect.objectContaining({ name: 'RangeError', code: 'unknownZone', at: 'Mars/Olympus' }),
      );
    },
  );

  it('throws unknownLocale in date() and dateRange() even when input is unreadable', () => {
    const unknownLocale = expect.objectContaining({ name: 'RangeError', code: 'unknownLocale', at: 'not a locale' });
    expect(() => date('TBD', { loose: true, locale: 'not a locale' })).toThrowError(unknownLocale);
    expect(() => dateRange('TBD', 'TBD', { loose: true, locale: 'not a locale' })).toThrowError(unknownLocale);
  });

  it.todo('validates { locale } before returning null on unreadable input in yearMonth(), monthDay(), and duration()');
});

describe('class constructors with { loose: true }', () => {
  it('parses informal strings across CalendarDate, DateTime, Time, YearMonth, MonthDay, and DateRange', () => {
    expect(new CalendarDate('Sep 6, 2026', { loose: true }).toString()).toBe('2026-09-06');
    expect(new DateTime('Sep 6, 2026 5:30 PM', { loose: true, zone: 'UTC' }).toString()).toBe(
      '2026-09-06T17:30:00.000Z',
    );
    expect(new Time('Sep 6, 2026 5:30 PM', { loose: true }).toString()).toBe('17:30:00');
    expect(new YearMonth('Nov 2026', { loose: true }).toString()).toBe('2026-11');
    expect(new MonthDay('Oct 17', { loose: true }).toString()).toBe('10-17');
    expect(new DateRange('Sep 1 2026', 'Sep 7 2026', { loose: true }).toString()).toBe('2026-09-01/2026-09-07');
  });

  it('throws a coded RangeError on unreadable input', () => {
    const errorMatch = (code) => expect.objectContaining({ name: 'RangeError', code, at: 'TBD' });
    expect(() => new CalendarDate('TBD', { loose: true })).toThrowError(errorMatch('invalidDate'));
    expect(() => new DateTime('TBD', { loose: true })).toThrowError(errorMatch('invalidDateTime'));
    expect(() => new Time('TBD', { loose: true })).toThrowError(errorMatch('invalidTime'));
    expect(() => new YearMonth('TBD', { loose: true })).toThrowError(errorMatch('invalidYearMonth'));
    expect(() => new MonthDay('TBD', { loose: true })).toThrowError(errorMatch('invalidMonthDay'));
    expect(() => new DateRange('TBD', 'TBD', { loose: true })).toThrowError(errorMatch('invalidDate'));
  });
});

describe('strict behavior alongside @native-dates/plugins/loose', () => {
  it('rejects informal strings when loose is omitted or false', () => {
    const errorMatch = (code, at) => expect.objectContaining({ name: 'RangeError', code, at });
    expect(() => date('September 6, 2026')).toThrowError(errorMatch('invalidDate', 'September 6, 2026'));
    expect(() => datetime('Sun, 06 Sep 2026 14:30:00 GMT')).toThrowError(
      errorMatch('invalidDateTime', 'Sun, 06 Sep 2026 14:30:00 GMT'),
    );
    expect(() => time('September 6, 2026 5:30 PM')).toThrowError(
      errorMatch('invalidTime', 'September 6, 2026 5:30 PM'),
    );
    expect(() => monthDay('Oct 17')).toThrowError(errorMatch('invalidMonthDay', 'Oct 17'));
    expect(() => yearMonth('Nov 2026')).toThrowError(errorMatch('invalidYearMonth', 'Nov 2026'));
    expect(() => date('2026-02-30', { loose: false })).toThrowError(errorMatch('invalidDate', '2026-02-30'));
  });

  it.each([
    '2026-11-16',
    '2026/11/6',
    '2026.11.06',
    '20261116',
    '2026-11-16T09:30',
    '2026-11-16 09:30:00',
    '2026-11-16T23:30:00-05:00',
    '2026-11-17T01:30:00Z',
    '2026-11-16T09:30[Europe/Berlin]',
  ])('matches strict parsing for ISO input %j', (text) => {
    const zone = 'Asia/Tokyo';
    expect(date(text, { loose: true, zone })?.toString()).toBe(date(text, zone).toString());
    expect(datetime(text, { loose: true, zone })?.toString()).toBe(datetime(text, zone).toString());
  });

  it.todo('accepts Temporal.PlainDate and Temporal.PlainTime inputs when { loose: true } is set');
});

describe('{ loose: true, dayFirst }', () => {
  it.each(['7/9/2026', '07/09/2026', '7.9.2026', '07.09.2026', '7-9-2026', '07-09-2026', '7/9/26'])(
    'parses %j month-first by default and day-first when dayFirst is true',
    (text) => {
      expect(date(text, { loose: true })?.toString()).toBe('2026-07-09');
      expect(date(text, { loose: true, dayFirst: false })?.toString()).toBe('2026-07-09');
      expect(date(text, { loose: true, dayFirst: true })?.toString()).toBe('2026-09-07');
    },
  );

  it.each([
    ['de-DE', '6.9.2026'],
    ['en-GB / fr-FR', '06/09/2026'],
    ['es-ES', '6/9/2026'],
    ['nl-NL', '6-9-2026'],
    ['ru-RU', '06.09.2026'],
  ])('parses %s locale date format %j as 2026-09-06 when dayFirst is true', (_locales, text) => {
    expect(date(text, { loose: true, dayFirst: true })?.toString()).toBe('2026-09-06');
  });

  it('parses day-first numeric datetime strings while preserving wall-clock time', () => {
    const options = { loose: true, dayFirst: true, zone: 'Asia/Tokyo' };
    const expected = { zone: 'Asia/Tokyo', month: 9, day: 7, hour: 14, minute: 30 };
    expect(datetime('7/9/2026 14:30', options)).toMatchObject(expected);
    expect(datetime('7/9/2026 2:30 PM', options)).toMatchObject(expected);
    expect(datetime('7.9.2026, 14:30:00', options)).toMatchObject(expected);
  });

  it('parses day-first datetime strings in time()', () => {
    expect(time('30/9/2026 14:30', { loose: true, dayFirst: true })?.toString()).toBe('14:30:00');
    expect(time('30/9/2026 14:30', { loose: true })).toBeNull();
  });

  it('parses day-first datetime strings with UTC offsets as exact instants', () => {
    const parsed = datetime('7/9/2026 16:30 +0200', { loose: true, dayFirst: true, zone: 'Asia/Tokyo' });
    expect(parsed?.toString()).toBe('2026-09-07T14:30:00.000Z');
  });

  it('parses day-first endpoints across dateRange(), datetimeRange(), and timeRange()', () => {
    const options = { loose: true, dayFirst: true };
    expect(dateRange('1/9/2026', '7/9/2026', options)?.toString()).toBe('2026-09-01/2026-09-07');
    expect(dateRange('1/9/2026 - 7/9/2026', options)?.toString()).toBe('2026-09-01/2026-09-07');
    expect(dateRange('01.09.2026 to 07.09.2026', options)?.toString()).toBe('2026-09-01/2026-09-07');
    expect(datetimeRange('1/9/2026 09:00', '1/9/2026 17:00', { ...options, zone: 'UTC' })?.toString()).toBe(
      '2026-09-01T09:00:00.000Z/2026-09-01T17:00:00.000Z',
    );
    expect(timeRange('30/9/2026 09:00', '30/9/2026 17:00', options)?.toString()).toBe('09:00:00/17:00:00');
  });

  it('parses day-first numeric month-day strings in monthDay()', () => {
    expect(monthDay('7/9', { loose: true, dayFirst: true })?.toString()).toBe('09-07');
    expect(monthDay('7/9', { loose: true })?.toString()).toBe('07-09');
  });

  it.each(['2026-09-07', '2026/09/07', '2026.09.07', '2026/9/7', '20260907', '2026-09-07T14:30'])(
    'does not reorder year-first input %j when dayFirst is true',
    (text) => {
      expect(date(text, { loose: true, dayFirst: true })?.toString()).toBe('2026-09-07');
    },
  );

  it.each(['7 Sep 2026', 'Sep 7 2026', 'September 7, 2026', '7/Sep/2026'])(
    'does not reorder named-month input %j when dayFirst is true',
    (text) => {
      expect(date(text, { loose: true, dayFirst: true })?.toString()).toBe('2026-09-07');
    },
  );

  it('returns null when the month position exceeds 12 instead of swapping day and month', () => {
    expect(date('13/09/2026', { loose: true })).toBeNull();
    expect(date('09/13/2026', { loose: true, dayFirst: true })).toBeNull();
    expect(date('13/09/2026', { loose: true, dayFirst: true })?.toString()).toBe('2026-09-13');
    expect(date('09/13/2026', { loose: true })?.toString()).toBe('2026-09-13');
  });

  it('returns null for nonexistent calendar days under dayFirst', () => {
    expect(date('30/02/2026', { loose: true, dayFirst: true })).toBeNull();
    expect(date('31/04/2026', { loose: true, dayFirst: true })).toBeNull();
    expect(date('29/02/2026', { loose: true, dayFirst: true })).toBeNull();
    expect(date('29/02/2024', { loose: true, dayFirst: true })?.toString()).toBe('2024-02-29');
    expect(datetime('30/02/2026 10:00', { loose: true, dayFirst: true, zone: 'UTC' })).toBeNull();
  });

  it('returns null for Feb 31 under dayFirst', () => {
    expect(date('31/02/2026', { loose: true, dayFirst: true })).toBeNull();
    expect(date('31/2/24', { loose: true, dayFirst: true })).toBeNull();
  });

  it('trims surrounding whitespace before applying dayFirst', () => {
    expect(date('  7/9/2026  ', { loose: true, dayFirst: true })?.toString()).toBe('2026-09-07');
    expect(datetime(' 7/9/2026 14:30', { loose: true, dayFirst: true, zone: 'UTC' })?.toString()).toBe(
      '2026-09-07T14:30:00.000Z',
    );
  });
});

describe('configure({ dayFirst })', () => {
  it('defaults to false and reflects updates from configure()', () => {
    expect(configure().dayFirst).toBe(false);
    expect(configure({ dayFirst: true }).dayFirst).toBe(true);
    expect(configure().dayFirst).toBe(true);
  });

  it('applies dayFirst across loose factories and ranges when omitted per call', () => {
    configure({ dayFirst: true });
    expect(date('7/9/26', { loose: true })?.toString()).toBe('2026-09-07');
    expect(datetime('7/9/2026 14:30', { loose: true, zone: 'UTC' })?.toString()).toBe('2026-09-07T14:30:00.000Z');
    expect(time('30/9/2026 14:30', { loose: true })?.toString()).toBe('14:30:00');
    expect(dateRange('1/9/2026', '7/9/2026', { loose: true })?.toString()).toBe('2026-09-01/2026-09-07');
    expect(dateRange('1/9/2026 - 7/9/2026', { loose: true })?.toString()).toBe('2026-09-01/2026-09-07');
    expect(datetimeRange('1/9/2026 09:00', '1/9/2026 17:00', { loose: true, zone: 'UTC' })?.start.month).toBe(9);
    expect(timeRange('30/9/2026 09:00', '30/9/2026 17:00', { loose: true })?.toString()).toBe('09:00:00/17:00:00');
  });

  it('is overridden by an explicit per-call dayFirst option', () => {
    configure({ dayFirst: true });
    expect(date('07.09.2026', { loose: true, dayFirst: false })?.toString()).toBe('2026-07-09');
    configure({ dayFirst: false });
    expect(date('07.09.2026', { loose: true, dayFirst: true })?.toString()).toBe('2026-09-07');
  });

  it('does not affect year-first or named-month inputs', () => {
    configure({ dayFirst: true });
    expect(date('2026-07-09', { loose: true })?.toString()).toBe('2026-07-09');
    expect(datetime('2026-07-09T10:00:00Z', { loose: true, zone: 'UTC' })?.toString()).toBe('2026-07-09T10:00:00.000Z');
    expect(date('Jul 9, 2026', { loose: true })?.toString()).toBe('2026-07-09');
  });

  it('resets to month-first when set to false or null', () => {
    configure({ dayFirst: true });
    configure({ dayFirst: false });
    expect(date('7/9/2026', { loose: true })?.toString()).toBe('2026-07-09');
    configure({ dayFirst: true });
    expect(configure({ dayFirst: null }).dayFirst).toBe(false);
    expect(date('7/9/2026', { loose: true })?.toString()).toBe('2026-07-09');
  });

  it('persists across unrelated configure() calls', () => {
    configure({ dayFirst: true });
    configure({ zone: 'UTC' });
    configure({ zone: null });
    expect(date('7/9/2026', { loose: true })?.toString()).toBe('2026-09-07');
  });

  it.todo('applies configure({ dayFirst: true }) to monthDay() when { loose: true } is set');
});

describe('monthDay() month names with { loose: true }', () => {
  it.each([
    'Oct 17',
    'October 17',
    'Oct. 17',
    'oct 17',
    'OCT 17',
    'Oct 17th',
    '17 Oct',
    '17 October',
    '17th October',
  ])('parses %j as 10-17', (text) => {
    expect(monthDay(text, { loose: true })?.toString()).toBe('10-17');
  });

  it('parses non-standard abbreviations like "Sept" and "Sept."', () => {
    expect(monthDay('Sept 17', { loose: true })?.toString()).toBe('09-17');
    expect(monthDay('17 Sept.', { loose: true })?.toString()).toBe('09-17');
  });

  // locale "nl" shortens "maart" to "mrt", which is not a prefix
  it('parses short month names that are not prefixes of the full month name', () => {
    expect(monthDay('5 mrt', { loose: true, locale: 'nl' })?.toString()).toBe('03-05');
  });

  it('parses English ordinal day suffixes (1st, 2nd, 3rd, 4th)', () => {
    expect(monthDay('Jan 1st', { loose: true })?.toString()).toBe('01-01');
    expect(monthDay('2nd Feb', { loose: true })?.toString()).toBe('02-02');
    expect(monthDay('3rd Mar', { loose: true })?.toString()).toBe('03-03');
    expect(monthDay('July 4th', { loose: true })?.toString()).toBe('07-04');
  });

  it.each([
    ['fr', '17 octobre'],
    ['de', '17. Oktober'],
    ['es', '17 de octubre'],
    ['pt', '17 de outubro'],
    ['it', '17 ottobre'],
    ['nl', '17 oktober'],
    ['pl', '17 października'],
    ['cs', '17. října'],
    ['fi', '17. lokakuuta'],
    ['tr', '17 Ekim'],
    ['el', '17 Οκτωβρίου'],
    ['ru', '17 октября'],
    ['uk', '17 жовтня'],
    ['ar', '17 أكتوبر'],
    ['hi', '17 अक्टूबर'],
    ['th', '17 ตุลาคม'],
  ])('parses October 17 in locale %s (%j)', (locale, text) => {
    expect(monthDay(text, { loose: true, locale })?.toString()).toBe('10-17');
  });

  it('accepts English month names regardless of the active locale', () => {
    expect(monthDay('Oct 17', { loose: true, locale: 'fr' })?.toString()).toBe('10-17');
    expect(monthDay('17 October', { loose: true, locale: 'ja' })?.toString()).toBe('10-17');
  });

  // locale "fi" uses "marraskuu" for November, which also starts with "mar"
  it('resolves English "Mar" to March under locale "fi" without breaking full "marraskuuta"', () => {
    expect(monthDay('Mar 17', { loose: true, locale: 'fi' })?.toString()).toBe('03-17');
    expect(monthDay('17. marraskuuta', { loose: true, locale: 'fi' })?.toString()).toBe('11-17');
  });

  it('returns null for month names outside the specified locale and English', () => {
    expect(monthDay('17 octobre', { loose: true, locale: 'en' })).toBeNull();
    expect(monthDay('17 octobre', { loose: true, locale: 'de' })).toBeNull();
  });

  it('sets the locale option on the returned MonthDay', () => {
    expect(monthDay('17 octobre', { loose: true, locale: 'fr' })?.locale()).toBe('fr');
  });

  it('accepts Feb 29 and returns null for out-of-range days', () => {
    expect(monthDay('Feb 29', { loose: true })?.toString()).toBe('02-29');
    expect(monthDay('Feb 30', { loose: true })).toBeNull();
    expect(monthDay('Jun 31', { loose: true })).toBeNull();
    expect(monthDay('Oct 0', { loose: true })).toBeNull();
  });

  it('returns null for incomplete or ambiguous month-day strings', () => {
    expect(monthDay('Oct', { loose: true })).toBeNull();
    expect(monthDay('17', { loose: true })).toBeNull();
    expect(monthDay('Oct 2026', { loose: true })).toBeNull();
    expect(monthDay('Ma 17', { loose: true })).toBeNull();
  });

  it('preserves strict numeric and ISO month-day parsing', () => {
    expect(monthDay('10-17', { loose: true })?.toString()).toBe('10-17');
    expect(monthDay('10/17', { loose: true })?.toString()).toBe('10-17');
    expect(monthDay('1990-10-17', { loose: true })?.toString()).toBe('10-17');
  });
});

describe('dayMonth() with { loose: true }', () => {
  it('parses named months with the day before or after the month', () => {
    expect(dayMonth('17 Oct', { loose: true })?.toString()).toBe('10-17');
    expect(dayMonth('Oct 17', { loose: true })?.toString()).toBe('10-17');
  });

  it('parses numeric inputs day-first', () => {
    expect(dayMonth('17/10', { loose: true })?.toString()).toBe('10-17');
    expect(dayMonth('7/9', { loose: true })?.toString()).toBe('09-07');
  });
});

describe('yearMonth() month names with { loose: true }', () => {
  it.each(['Nov 2026', 'November 2026', 'Nov. 2026', 'November, 2026', 'nov 2026', '2026 Nov', '2026 November'])(
    'parses %j as 2026-11',
    (text) => {
      expect(yearMonth(text, { loose: true })?.toString()).toBe('2026-11');
    },
  );

  it.each([
    ['fr', 'novembre 2026'],
    ['es', 'noviembre de 2026'],
    ['pt', 'novembro de 2026'],
    ['it', 'novembre 2026'],
    ['pl', 'listopad 2026'],
    ['fi', 'marraskuu 2026'],
    ['tr', 'Kasım 2026'],
    ['el', 'Νοέμβριος 2026'],
    ['el', 'Νοεμβρίου 2026'],
    ['ru', 'ноябрь 2026'],
    ['ar', 'نوفمبر 2026'],
    ['hi', 'नवंबर 2026'],
  ])('parses November 2026 in locale %s (%j)', (locale, text) => {
    expect(yearMonth(text, { loose: true, locale })?.toString()).toBe('2026-11');
  });

  it('resolves English "Mar 2026" to March under locale "fi"', () => {
    expect(yearMonth('Mar 2026', { loose: true, locale: 'fi' })?.toString()).toBe('2026-03');
  });

  it('parses non-prefix and four-letter month abbreviations', () => {
    expect(yearMonth('Sept 2026', { loose: true })?.toString()).toBe('2026-09');
    expect(yearMonth('mrt 2026', { loose: true, locale: 'nl' })?.toString()).toBe('2026-03');
  });

  it('returns null for unrecognized month names', () => {
    expect(yearMonth('novembre 2026', { loose: true, locale: 'en' })).toBeNull();
    expect(yearMonth('Foo 2026', { loose: true })).toBeNull();
  });

  it('sets the locale option on the returned YearMonth', () => {
    expect(yearMonth('novembre 2026', { loose: true, locale: 'fr' })?.locale()).toBe('fr');
  });

  it('returns null when year or month is missing or two-digit', () => {
    expect(yearMonth('Nov', { loose: true })).toBeNull();
    expect(yearMonth('2026', { loose: true })).toBeNull();
    expect(yearMonth('Oct 17', { loose: true })).toBeNull();
    expect(yearMonth('Nov 26', { loose: true })).toBeNull();
    expect(yearMonth('11/26', { loose: true })).toBeNull();
  });

  it('preserves strict ISO year-month and date parsing', () => {
    expect(yearMonth('2026-11', { loose: true })?.toString()).toBe('2026-11');
    expect(yearMonth('2026/11', { loose: true })?.toString()).toBe('2026-11');
    expect(yearMonth('2026-11-16', { loose: true })?.toString()).toBe('2026-11');
  });
});

describe('monthYear() with { loose: true }', () => {
  it('parses named months with a four-digit year', () => {
    expect(monthYear('Nov 2026', { loose: true })?.toString()).toBe('2026-11');
  });

  it('parses two-digit card expiry strings month-first', () => {
    expect(monthYear('11/26', { loose: true })?.toString()).toBe('2026-11');
  });
});

describe('configure({ locale }) month name parsing with { loose: true }', () => {
  it('parses month names using the configured locale when per-call locale is omitted', () => {
    configure({ locale: 'fr' });
    expect(monthDay('17 octobre', { loose: true })?.toString()).toBe('10-17');
    expect(yearMonth('novembre 2026', { loose: true })?.toString()).toBe('2026-11');
  });

  it('still accepts English month names when a non-English locale is configured', () => {
    configure({ locale: 'fr' });
    expect(monthDay('Oct 17', { loose: true })?.toString()).toBe('10-17');
    expect(yearMonth('Nov 2026', { loose: true })?.toString()).toBe('2026-11');
  });

  it('lets a per-call locale override configure({ locale })', () => {
    configure({ locale: 'fr' });
    expect(monthDay('17. Oktober', { loose: true, locale: 'de' })?.toString()).toBe('10-17');
    expect(monthDay('17 octobre', { loose: true, locale: 'de' })).toBeNull();
  });
});

// process TZ is fixed once V8 initializes Intl/Temporal, so verify positive and negative host offsets in child processes
const parseInHostZone = (hostZone) => {
  const script = `
    import '@native-dates/plugins/loose';
    import { date, dateRange, datetime, time } from 'native-dates';
    const loose = { loose: true, zone: 'Asia/Kolkata' };
    const formatClock = (value) => value?.format('YYYY-MM-DD HH:mm');
    const defaultZoned = datetime('Sep 6, 2026 5:30 PM', { loose: true });
    console.log(JSON.stringify({
      typedDay: date('Sep 6, 2026', loose)?.toString(),
      numericDay: date('9/6/2026', loose)?.toString(),
      dayFirst: date('6/9/2026', { ...loose, dayFirst: true })?.toString(),
      lateEvening: formatClock(datetime('Sep 6, 2026 11:30 PM', loose)),
      afterMidnight: formatClock(datetime('9/6/2026, 12:15:00 AM', loose)),
      clockAlone: time('Sep 6, 2026 11:30 PM', loose)?.toString(),
      header: datetime('Sun, 06 Sep 2026 14:30:00 GMT', loose)?.toString(),
      zoneName: datetime('Sun, 06 Sep 2026 10:30:00 EDT', loose)?.toString(),
      zoneComment: formatClock(datetime('Sep 6, 2026 2:30 PM (PST)', loose)),
      hyphenated: date('06-Sep-2026', loose)?.toString(),
      headerDay: date('Sun, 06 Sep 2026 20:30:00 GMT', loose)?.toString(),
      range: dateRange('Sep 1, 2026 - Sep 7, 2026', loose)?.toString(),
      noSuchDay: date('Feb 30 2026', loose),
      firstOfMarch: date('Mar 1 2026', loose)?.toString(),
      defaultZoned: [defaultZoned?.zone, formatClock(defaultZoned)],
    }));
  `;
  const output = execFileSync(process.execPath, ['--input-type=module', '--eval', script], {
    cwd: resolve(import.meta.dirname, '../../..'),
    env: { ...process.env, TZ: hostZone },
    encoding: 'utf8',
  });
  return JSON.parse(output);
};

describe('{ loose: true } across host TZ offsets', () => {
  it.each(['Asia/Tokyo', 'America/Los_Angeles'])(
    'parses identically regardless of host TZ (%s)',
    (hostZone) => {
      expect(parseInHostZone(hostZone)).toEqual({
        typedDay: '2026-09-06',
        numericDay: '2026-09-06',
        dayFirst: '2026-09-06',
        lateEvening: '2026-09-06 23:30',
        afterMidnight: '2026-09-06 00:15',
        clockAlone: '23:30:00',
        header: '2026-09-06T14:30:00.000Z',
        zoneName: '2026-09-06T14:30:00.000Z',
        zoneComment: '2026-09-06 14:30',
        hyphenated: '2026-09-06',
        headerDay: '2026-09-07',
        range: '2026-09-01/2026-09-07',
        noSuchDay: null,
        firstOfMarch: '2026-03-01',
        defaultZoned: [hostZone, '2026-09-06 17:30'],
      });
    },
    30_000,
  );
});
