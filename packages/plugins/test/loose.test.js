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
import { afterEach, describe, expect, it } from 'vitest';

const factories = { date, datetime, time, duration, yearMonth, monthYear, monthDay, dayMonth };
const rangeFactories = { dateRange, datetimeRange, timeRange };

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
  ])('reads %j as 6 September 2026', (text) => {
    expect(date(text, { loose: true })?.toString()).toBe('2026-09-06');
  });

  it('reads back what format() prints in en-US, in every preset', () => {
    const day = date('2026-09-06');
    for (const preset of ['short', 'medium', 'long', 'full']) {
      const printed = day.format(preset, 'en-US');
      expect(date(printed, { loose: true })?.toString(), printed).toBe('2026-09-06');
    }
  });

  it('reads a timestamp as the day it falls on in the zone asked for', () => {
    const lateEvening = 'Sun, 06 Sep 2026 20:30:00 GMT';
    expect(date(lateEvening, { loose: true, zone: 'America/New_York' })?.toString()).toBe('2026-09-06');
    expect(date(lateEvening, { loose: true, zone: 'Asia/Tokyo' })?.toString()).toBe('2026-09-07');
  });

  it('drops the clock from a date and time with no offset, whatever the zone', () => {
    expect(date('Sep 6, 2026 11:30 PM', { loose: true, zone: 'Asia/Tokyo' })?.toString()).toBe('2026-09-06');
    expect(date('Sep 6, 2026 12:30 AM', { loose: true, zone: 'America/Los_Angeles' })?.toString()).toBe('2026-09-06');
  });

  it('carries the locale passed beside loose', () => {
    expect(date('Sep 6, 2026', { loose: true, locale: 'fr' })?.locale()).toBe('fr');
  });

  // a date picker hands over a Date where a text field hands over what was typed
  it('reads a Date, a DateTime, fields and a CalendarDate as it does without loose', () => {
    const lateEvening = new Date('2026-09-06T20:30:00Z');
    expect(date(lateEvening, { loose: true, zone: 'Asia/Tokyo' })?.toString()).toBe('2026-09-07');
    expect(date(datetime(lateEvening, 'UTC'), { loose: true, zone: 'Asia/Tokyo' })?.toString()).toBe('2026-09-07');
    expect(date({ year: 2026, month: 9, day: 6 }, { loose: true })?.toString()).toBe('2026-09-06');
    expect(date(date('2026-09-06'), { loose: true })?.toString()).toBe('2026-09-06');
  });

  it.todo('reads a day, month name and year joined by hyphens, like "6-Sep-26", as that day on any machine');
});

describe('datetime() with { loose: true }', () => {
  // every row names 14:30 UTC
  // read into Tokyo because an answer shifted by the machine's own offset hides on a machine in the zone asked for
  it.each([
    ['Date.prototype.toString()', 'Sun Sep 06 2026 10:30:00 GMT-0400 (Eastern Daylight Time)'],
    ['Date.prototype.toUTCString() and HTTP headers', 'Sun, 06 Sep 2026 14:30:00 GMT'],
    ['an email Date header', 'Sun, 6 Sep 2026 16:30:00 +0200'],
    ['an old cookie expiry', 'Sunday, 06-Sep-26 14:30:00 GMT'],
    ['git log', 'Sun Sep 6 16:30:00 2026 +0200'],
    ['a Postgres timestamptz', '2026-09-06 16:30:00+02'],
    ['Date.prototype.toISOString()', '2026-09-06T14:30:00.000Z'],
    ['en-US text with a UTC marker', 'Sep 6, 2026, 2:30\u202fPM UTC'],
  ])('reads the moment written by %s', (source, text) => {
    const moment = datetime(text, { loose: true, zone: 'Asia/Tokyo' });
    expect(moment?.toString()).toBe('2026-09-06T14:30:00.000Z');
    expect(moment).toMatchObject({ zone: 'Asia/Tokyo', day: 6, hour: 23, minute: 30 });
  });

  // none of these says where it was written, so 14:30 is 14:30 in the zone asked for
  // \u202f is the narrow space Intl prints before AM and PM
  it.each([
    ['asctime()', 'Sun Sep  6 14:30:00 2026'],
    ['a SQL timestamp', '2026-09-06 14:30:00'],
    ['Date.prototype.toLocaleString("en-US")', '9/6/2026, 2:30:00\u202fPM'],
    ['an older engine, with a plain space before PM', '9/6/2026, 2:30:00 PM'],
    ['Intl.DateTimeFormat("en-US") at medium length', 'Sep 6, 2026, 2:30\u202fPM'],
    ['a person, month first', 'September 6, 2026 14:30'],
    ['a person, day first', '6 Sep 2026 14:30'],
    ['a person, with numbers', '9/6/2026 2:30 PM'],
  ])('keeps the clock written by %s in the zone asked for', (source, text) => {
    const moment = datetime(text, { loose: true, zone: 'Asia/Tokyo' });
    expect(moment).toMatchObject({ zone: 'Asia/Tokyo', year: 2026, month: 9, day: 6, hour: 14, minute: 30 });
  });

  it('shows one moment at a different hour in each zone asked for', () => {
    const header = 'Sun, 06 Sep 2026 14:30:00 GMT';
    expect(datetime(header, { loose: true, zone: 'America/New_York' })).toMatchObject({ hour: 10, offset: '-04:00' });
    expect(datetime(header, { loose: true, zone: 'Europe/Berlin' })).toMatchObject({ hour: 16, offset: '+02:00' });
  });

  // 15 June is a day no zone changes its clocks on
  it('starts a date with no clock at midnight in the zone asked for', () => {
    const moment = datetime('Jun 15, 2026', { loose: true, zone: 'Asia/Tokyo' });
    expect(moment).toMatchObject({ zone: 'Asia/Tokyo', day: 15, hour: 0, minute: 0 });
  });

  it('keeps seconds and milliseconds', () => {
    const moment = datetime('Sep 6 2026 14:30:15.250', { loose: true, zone: 'UTC' });
    expect(moment?.toString()).toBe('2026-09-06T14:30:15.250Z');
  });

  it('reads a Date and epoch milliseconds as it does without loose', () => {
    const epoch = Date.UTC(2026, 8, 6, 14, 30);
    expect(datetime(epoch, { loose: true, zone: 'UTC' })?.toString()).toBe('2026-09-06T14:30:00.000Z');
    expect(datetime(new Date(epoch), { loose: true, zone: 'UTC' })?.toString()).toBe('2026-09-06T14:30:00.000Z');
  });

  it('carries the locale passed beside loose', () => {
    expect(datetime('Sep 6, 2026 5:30 PM', { loose: true, zone: 'UTC', locale: 'fr' })?.locale()).toBe('fr');
  });

  describe('with configure({ zone })', () => {
    afterEach(() => {
      configure({ zone: null });
    });

    it('reads into the configured zone when the call passes none', () => {
      configure({ zone: 'Asia/Tokyo' });
      expect(datetime('Sep 6, 2026 5:30 PM', { loose: true })).toMatchObject({ zone: 'Asia/Tokyo', hour: 17 });
      expect(datetime('Sun, 06 Sep 2026 14:30:00 GMT', { loose: true })).toMatchObject({
        zone: 'Asia/Tokyo',
        hour: 23,
      });
    });
  });

  it.todo('reads a zone the engine knows by its letters, like "10:30:00 EDT", as the moment it names on any machine');
  it.todo('returns null for text ending in an impossible offset, like "14:30 +2500", instead of an error with no code');
  // the engine reads "GMT+2" as an offset and the plugin does not, so the clock comes back in the zone of the machine
  it.todo(
    'reads back the text of a datetime, like "Sep 6, 2026, 4:30 PM GMT+2", as the moment it names on any machine',
  );
});

describe('time() with { loose: true }', () => {
  it('reads the clock out of a date and time', () => {
    expect(time('September 6, 2026 5:30 PM', { loose: true })?.toString()).toBe('17:30:00');
    expect(time('9/6/2026 2:30 PM', { loose: true })?.toString()).toBe('14:30:00');
    expect(time('Sun Sep  6 14:30:15 2026', { loose: true })?.toString()).toBe('14:30:15');
  });

  it('reads a timestamp as the clock it shows in the zone asked for', () => {
    const header = 'Sun, 06 Sep 2026 14:30:00 GMT';
    expect(time(header, { loose: true, zone: 'America/New_York' })?.toString()).toBe('10:30:00');
    expect(time(header, { loose: true, zone: 'Asia/Tokyo' })?.toString()).toBe('23:30:00');
  });

  it('reads a plain clock time as it does without loose', () => {
    expect(time('5:30 PM', { loose: true })?.toString()).toBe('17:30:00');
    expect(time('9am', { loose: true })?.toString()).toBe('09:00:00');
    expect(time('17:30:15', { loose: true })?.toString()).toBe('17:30:15');
  });

  it('reads a Date, a DateTime and fields as it does without loose', () => {
    const afternoon = new Date('2026-09-06T14:30:00Z');
    expect(time(afternoon, { loose: true, zone: 'Asia/Tokyo' })?.toString()).toBe('23:30:00');
    expect(time(datetime(afternoon, 'UTC'), { loose: true, zone: 'Asia/Tokyo' })?.toString()).toBe('23:30:00');
    expect(time({ hour: 14, minute: 30 }, { loose: true })?.toString()).toBe('14:30:00');
  });

  it('carries the locale passed beside loose', () => {
    expect(time('Sep 6, 2026 5:30 PM', { loose: true, locale: 'fr' })?.locale()).toBe('fr');
  });
});

describe('duration() with { loose: true }', () => {
  it('reads a length as it does without loose', () => {
    expect(duration('2h', { loose: true })?.toString()).toBe('PT2H');
    expect(duration('45 mins', { loose: true })?.toString()).toBe('PT45M');
    expect(duration('2 weeks and 3 days', { loose: true })?.toString()).toBe('P2W3D');
  });

  it('carries the locale passed beside loose', () => {
    expect(duration('2h', { loose: true, locale: 'fr' })?.locale()).toBe('fr');
  });

  it.each([
    ['words that are no length', 'soon'],
    ['a unit that does not exist', '5 foo'],
    ['units that disagree in sign', '1h -30m'],
    ['a fraction of a month', '1.5 months'],
  ])('returns null for %s', (reason, text) => {
    expect(duration(text, { loose: true })).toBeNull();
  });
});

describe('dateRange(), datetimeRange() and timeRange() with { loose: true }', () => {
  it('reads two endpoints written informally', () => {
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
  ])('reads both ends out of the one string %j', (interval) => {
    expect(dateRange(interval, { loose: true })?.toString()).toBe('2026-09-01/2026-09-07');
  });

  it('reads an informal start with a length for its end', () => {
    expect(dateRange('Sep 1 2026', '7 days', { loose: true })?.toString()).toBe('2026-09-01/2026-09-07');
    expect(datetimeRange('Sep 1 2026 9:00 AM', '90m', { loose: true, zone: 'UTC' })?.toString()).toBe(
      '2026-09-01T09:00:00.000Z/2026-09-01T10:30:00.000Z',
    );
  });

  it('reads both ends of a datetime range into the zone asked for', () => {
    const meeting = datetimeRange('Sun, 06 Sep 2026 14:30:00 GMT', 'Sun, 06 Sep 2026 16:30:00 GMT', {
      loose: true,
      zone: 'America/New_York',
    });
    expect(meeting?.start).toMatchObject({ zone: 'America/New_York', hour: 10 });
    expect(meeting?.end).toMatchObject({ zone: 'America/New_York', hour: 12 });
  });

  it('reads a range that strict reading accepts to the same range', () => {
    expect(dateRange('2026-09-01/2026-09-07', { loose: true })?.toString()).toBe('2026-09-01/2026-09-07');
    expect(timeRange('9am - 5pm', { loose: true })?.toString()).toBe('09:00:00/17:00:00');
  });

  it('takes a zone and a locale beside one string that holds both ends', () => {
    const shift = datetimeRange('Sep 1 2026 9:00 AM - Sep 1 2026 5:00 PM', {
      loose: true,
      zone: 'Asia/Tokyo',
      locale: 'fr',
    });
    expect(shift?.start).toMatchObject({ zone: 'Asia/Tokyo', day: 1, hour: 9 });
    expect(shift?.end).toMatchObject({ zone: 'Asia/Tokyo', day: 1, hour: 17 });
    expect(shift?.locale()).toBe('fr');
  });

  it('carries the locale passed beside loose to the range and both its ends', () => {
    const stay = dateRange('Sep 1 2026', 'Sep 7 2026', { loose: true, locale: 'fr' });
    expect([stay?.locale(), stay?.start.locale(), stay?.end.locale()]).toEqual(['fr', 'fr', 'fr']);
  });
});

describe('{ loose: true } returns null for input that cannot be read', () => {
  it.each(Object.entries(factories))('%s() returns null for a placeholder like "TBD" or "N/A"', (name, read) => {
    for (const text of ['TBD', 'N/A', 'not a date']) {
      expect(read(text, { loose: true }), text).toBeNull();
    }
  });

  it.each(Object.entries(factories))('%s() returns null for an empty or missing value', (name, read) => {
    for (const missing of ['', '   ', undefined, null]) {
      expect(read(missing, { loose: true }), String(missing)).toBeNull();
    }
  });

  it.each(Object.entries(factories))('%s() returns null for a value of the wrong type', (name, read) => {
    for (const value of [true, [], Number.NaN, new Date(Number.NaN)]) {
      expect(read(value, { loose: true }), String(value)).toBeNull();
    }
  });

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
  ])('returns null for %j, a day that does not exist', (text) => {
    expect(date(text, { loose: true })).toBeNull();
    expect(datetime(text, { loose: true, zone: 'UTC' })).toBeNull();
  });

  // three selects for day, month and year can post 31 February, which the engine rolls to 3 March
  it.each(['2/31/2026', 'Feb 31 2026', '31 Feb 2026'])('returns null for %j, a day February never has', (text) => {
    expect(date(text, { loose: true })).toBeNull();
    expect(datetime(text, { loose: true, zone: 'UTC' })).toBeNull();
  });

  it('returns null for the clock of a day that does not exist', () => {
    expect(time('Feb 30 2026 14:30', { loose: true })).toBeNull();
  });

  // the engine rolls 30 February into March, so these real days must not be mistaken for rolled ones
  it.each([
    ['Mar 1, 29', '2029-03-01'],
    ['Mar 2, 30', '2030-03-02'],
    ['May 1, 31', '2031-05-01'],
    ['Mar 1 2026', '2026-03-01'],
    ['Feb 29 2024', '2024-02-29'],
    ['2/29/2000', '2000-02-29'],
  ])('still reads %j, which is a real day', (text, expected) => {
    expect(date(text, { loose: true })?.toString()).toBe(expected);
  });

  it('returns null for fields that make no real date or time', () => {
    expect(date({ year: 2026, month: 2, day: 30 }, { loose: true })).toBeNull();
    expect(datetime({ year: 2026, month: 2, day: 30, hour: 9 }, { loose: true, zone: 'UTC' })).toBeNull();
    expect(time({ hour: 25 }, { loose: true })).toBeNull();
    expect(monthDay({ month: 2, day: 30 }, { loose: true })).toBeNull();
    expect(yearMonth({ year: 2026, month: 13 }, { loose: true })).toBeNull();
  });

  it('returns null for a clock time that does not exist', () => {
    expect(time('25:00', { loose: true })).toBeNull();
    expect(time('13pm', { loose: true })).toBeNull();
  });

  it('returns null for a bare number where a date is asked for', () => {
    expect(date(1794850200000, { loose: true })).toBeNull();
  });

  it.each(Object.entries(rangeFactories))('%s() returns null when neither end can be read', (name, range) => {
    expect(range('TBD', 'TBD', { loose: true })).toBeNull();
    expect(range(undefined, undefined, { loose: true })).toBeNull();
    expect(range('not a range', { loose: true })).toBeNull();
    expect(range('', { loose: true })).toBeNull();
  });

  it('returns null when only one end of a range can be read', () => {
    expect(dateRange('TBD', '2026-09-07', { loose: true })).toBeNull();
    expect(dateRange('2026-09-01', 'TBD', { loose: true })).toBeNull();
    expect(dateRange('Sep 1 2026', undefined, { loose: true })).toBeNull();
    expect(datetimeRange('2026-09-01T09:00', 'later', { loose: true })).toBeNull();
    expect(timeRange('9am', 'whenever', { loose: true })).toBeNull();
  });

  it('returns null when one end of a range is a day that does not exist', () => {
    expect(dateRange('Feb 30 2026', 'Mar 7 2026', { loose: true })).toBeNull();
    expect(dateRange('Feb 1 2026', 'Feb 30 2026', { loose: true })).toBeNull();
  });
});

describe('{ loose: true } still throws for a mistake in the options', () => {
  const zoned = { date, datetime, time, yearMonth, monthYear, monthDay, dayMonth };

  it.each(Object.entries(zoned))('%s() throws unknownZone even when the input cannot be read', (name, read) => {
    expect(() => read('TBD', { loose: true, zone: 'Mars/Olympus' })).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'unknownZone', at: 'Mars/Olympus' }),
    );
  });

  it.each(Object.entries(rangeFactories))('%s() throws unknownZone even when no end can be read', (name, range) => {
    expect(() => range('TBD', 'TBD', { loose: true, zone: 'Mars/Olympus' })).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'unknownZone', at: 'Mars/Olympus' }),
    );
  });

  it('throws unknownLocale from date() and dateRange() even when the input cannot be read', () => {
    const unknownLocale = expect.objectContaining({ name: 'RangeError', code: 'unknownLocale', at: 'not a locale' });
    expect(() => date('TBD', { loose: true, locale: 'not a locale' })).toThrowError(unknownLocale);
    expect(() => dateRange('TBD', 'TBD', { loose: true, locale: 'not a locale' })).toThrowError(unknownLocale);
  });

  // these three read the input before the locale, so a bad locale beside bad input comes back as null
  it.todo('throws unknownLocale from yearMonth(), monthDay() and duration() even when the input cannot be read');
});

describe('new CalendarDate() and the other classes with { loose: true }', () => {
  it('read informal text as the factories do', () => {
    expect(new CalendarDate('Sep 6, 2026', { loose: true }).toString()).toBe('2026-09-06');
    expect(new DateTime('Sep 6, 2026 5:30 PM', { loose: true, zone: 'UTC' }).toString()).toBe(
      '2026-09-06T17:30:00.000Z',
    );
    expect(new Time('Sep 6, 2026 5:30 PM', { loose: true }).toString()).toBe('17:30:00');
    expect(new YearMonth('Nov 2026', { loose: true }).toString()).toBe('2026-11');
    expect(new MonthDay('Oct 17', { loose: true }).toString()).toBe('10-17');
    expect(new DateRange('Sep 1 2026', 'Sep 7 2026', { loose: true }).toString()).toBe('2026-09-01/2026-09-07');
  });

  // a constructor has no null to give back
  it('throw the coded error at the input when it cannot be read', () => {
    const refusal = (code) => expect.objectContaining({ name: 'RangeError', code, at: 'TBD' });
    expect(() => new CalendarDate('TBD', { loose: true })).toThrowError(refusal('invalidDate'));
    expect(() => new DateTime('TBD', { loose: true })).toThrowError(refusal('invalidDateTime'));
    expect(() => new Time('TBD', { loose: true })).toThrowError(refusal('invalidTime'));
    expect(() => new YearMonth('TBD', { loose: true })).toThrowError(refusal('invalidYearMonth'));
    expect(() => new MonthDay('TBD', { loose: true })).toThrowError(refusal('invalidMonthDay'));
    expect(() => new DateRange('TBD', 'TBD', { loose: true })).toThrowError(refusal('invalidDate'));
  });
});

describe('importing @native-dates/plugins/loose', () => {
  it('leaves a call without loose refusing informal text', () => {
    const refusal = (code, at) => expect.objectContaining({ name: 'RangeError', code, at });
    expect(() => date('September 6, 2026')).toThrowError(refusal('invalidDate', 'September 6, 2026'));
    expect(() => datetime('Sun, 06 Sep 2026 14:30:00 GMT')).toThrowError(
      refusal('invalidDateTime', 'Sun, 06 Sep 2026 14:30:00 GMT'),
    );
    expect(() => time('September 6, 2026 5:30 PM')).toThrowError(refusal('invalidTime', 'September 6, 2026 5:30 PM'));
    expect(() => monthDay('Oct 17')).toThrowError(refusal('invalidMonthDay', 'Oct 17'));
    expect(() => yearMonth('Nov 2026')).toThrowError(refusal('invalidYearMonth', 'Nov 2026'));
    expect(() => date('2026-02-30', { loose: false })).toThrowError(refusal('invalidDate', '2026-02-30'));
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
  ])('reads %j with loose exactly as without it', (text) => {
    const zone = 'Asia/Tokyo';
    expect(date(text, { loose: true, zone })?.toString()).toBe(date(text, zone).toString());
    expect(datetime(text, { loose: true, zone })?.toString()).toBe(datetime(text, zone).toString());
  });

  // with an option beside it, date() and time() have no way in for the Temporal type they wrap
  it.todo('reads a Temporal.PlainDate and a Temporal.PlainTime with loose as without it, instead of returning null');
});
