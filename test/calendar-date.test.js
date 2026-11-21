import {
  CalendarDate,
  configure,
  date,
  datetime,
  days,
  duration,
  monthDay,
  now,
  time,
  today,
  tomorrow,
  yesterday,
} from 'native-dates';
import { afterEach, describe, expect, it, vi } from 'vitest';

describe('date()', () => {
  afterEach(() => {
    configure({ zone: null });
  });

  it('parses an ISO date string, numeric year/month/day arguments, and a fields object to the same CalendarDate', () => {
    expect(date('2026-11-16').toString()).toBe('2026-11-16');
    expect(date(2026, 11, 16).toString()).toBe('2026-11-16');
    expect(date({ year: 2026, month: 11, day: 16 }).toString()).toBe('2026-11-16');
  });

  it('returns a CalendarDate matching new CalendarDate()', () => {
    expect(date('2026-11-16')).toBeInstanceOf(CalendarDate);
    expect(new CalendarDate('2026-11-16').toString()).toBe('2026-11-16');
    expect(new CalendarDate(2026, 11, 16).toString()).toBe('2026-11-16');
  });

  // new Date('2026-11-16') parses as midnight UTC, which falls on Nov 15 in negative UTC offsets
  it('preserves the written calendar day of a date-only string regardless of configured timezone', () => {
    configure({ zone: 'Pacific/Pago_Pago' });
    expect(date('2026-11-16')).toMatchObject({ year: 2026, month: 11, day: 16 });
    configure({ zone: 'Pacific/Kiritimati' });
    expect(date('2026-11-16')).toMatchObject({ year: 2026, month: 11, day: 16 });
  });

  it('indexes months from 1 (January) to 12 (December)', () => {
    expect(date(2026, 1, 31).toString()).toBe('2026-01-31');
    expect(date(2026, 12, 31).toString()).toBe('2026-12-31');
    expect(date({ year: 2026, month: 12, day: 31 }).month).toBe(12);
  });

  it('parses year-first dates with slash or dot separators and unpadded month or day', () => {
    expect(date('2026/11/6').toString()).toBe('2026-11-06');
    expect(date('2026.11.06').toString()).toBe('2026-11-06');
    expect(date('2026-1-5').toString()).toBe('2026-01-05');
    expect(date(' 2026/11/06 ').toString()).toBe('2026-11-06');
  });

  it('truncates the time component of a local date-time string without an offset', () => {
    expect(date('2026-11-16T23:30').toString()).toBe('2026-11-16');
    expect(date('2026-11-16 23:30:00').toString()).toBe('2026-11-16');
  });

  it('parses numeric string arguments for year, month, and day', () => {
    expect(date('2026', '11', '16').toString()).toBe('2026-11-16');
  });

  it.todo('parses a numeric year alongside string month and day arguments');

  it('parses numeric string values in a fields object', () => {
    expect(date({ year: '2026', month: '11', day: '16' }).toString()).toBe('2026-11-16');
    const query = new URLSearchParams('year=2026&month=02&day=09');
    expect(date(Object.fromEntries(query)).toString()).toBe('2026-02-09');
  });

  it('extracts the calendar day from Temporal.PlainDate and Temporal.PlainDateTime', () => {
    expect(date(Temporal.PlainDate.from('2026-11-16')).toString()).toBe('2026-11-16');
    expect(date(Temporal.PlainDateTime.from('2026-11-16T23:30')).toString()).toBe('2026-11-16');
  });

  it('returns an equivalent CalendarDate when passed an existing CalendarDate', () => {
    expect(date(date(2026, 11, 16)).toString()).toBe('2026-11-16');
  });
});

describe('date() with timezone inputs', () => {
  // at 02:00 UTC on Nov 17 it is still Nov 16 in America/Los_Angeles and already Nov 17 in Asia/Tokyo
  const instant = '2026-11-17T02:00:00Z';

  afterEach(() => {
    configure({ zone: null });
  });

  it('resolves an ISO instant string to the calendar day in the target timezone', () => {
    expect(date(instant, 'America/Los_Angeles').toString()).toBe('2026-11-16');
    expect(date(instant, 'Asia/Tokyo').toString()).toBe('2026-11-17');
  });

  it('accepts the timezone via an options object { zone }', () => {
    expect(date(instant, { zone: 'America/Los_Angeles' }).toString()).toBe('2026-11-16');
  });

  it('resolves strings with explicit UTC offsets (including Postgres timestamptz format) into the target timezone', () => {
    expect(date('2026-11-16T23:30:00-05:00', 'Asia/Tokyo').toString()).toBe('2026-11-17');
    expect(date('2026-11-16T23:30:00-05:00', 'America/Los_Angeles').toString()).toBe('2026-11-16');
    expect(date('2026-11-16 18:00:00+00', 'Asia/Tokyo').toString()).toBe('2026-11-17');
  });

  it('resolves compact numeric UTC offsets without a colon separator', () => {
    expect(date('2026-11-16T23:30:00-0500', 'Asia/Tokyo').toString()).toBe('2026-11-17');
    expect(date('2026-11-16T23:30:00-0500', 'America/Los_Angeles').toString()).toBe('2026-11-16');
  });

  it('resolves instants in half-hour IANA timezones and fixed-offset strings', () => {
    // in Asia/Kolkata (UTC+5:30), 18:45Z crosses midnight while 18:15Z stays on Nov 16
    expect(date('2026-11-16T18:45:00Z', 'Asia/Kolkata').toString()).toBe('2026-11-17');
    expect(date('2026-11-16T18:15:00Z', 'Asia/Kolkata').toString()).toBe('2026-11-16');
    expect(date('2026-11-16T18:45:00Z', '+05:30').toString()).toBe('2026-11-17');
  });

  it('preserves a DateTime timezone by default and converts when a target timezone is passed', () => {
    const inLosAngeles = datetime(instant, 'America/Los_Angeles');
    expect(date(inLosAngeles).toString()).toBe('2026-11-16');
    expect(date(inLosAngeles, 'Asia/Tokyo').toString()).toBe('2026-11-17');
  });

  it('resolves a Date instance in the target timezone', () => {
    const jsDate = new Date(instant);
    expect(date(jsDate, 'America/Los_Angeles').toString()).toBe('2026-11-16');
    expect(date(jsDate, 'Asia/Tokyo').toString()).toBe('2026-11-17');
  });

  it('resolves a Temporal.Instant in the target timezone', () => {
    const temporalInstant = Temporal.Instant.from(instant);
    expect(date(temporalInstant, 'America/Los_Angeles').toString()).toBe('2026-11-16');
    expect(date(temporalInstant, 'Asia/Tokyo').toString()).toBe('2026-11-17');
  });

  it('preserves a Temporal.ZonedDateTime timezone by default and converts when a target timezone is passed', () => {
    const zoned = Temporal.ZonedDateTime.from('2026-11-16T18:00[America/Los_Angeles]');
    expect(date(zoned).toString()).toBe('2026-11-16');
    expect(date(zoned, 'Asia/Tokyo').toString()).toBe('2026-11-17');
  });

  it('resolves bracketed IANA timezone annotations and converts when a target timezone is passed', () => {
    const morningInTokyo = '2026-11-17T08:00+09:00[Asia/Tokyo]';
    expect(date(morningInTokyo, 'America/Los_Angeles').toString()).toBe('2026-11-16');
    expect(date('2026-11-17T08:00[Asia/Tokyo]', 'America/Los_Angeles').toString()).toBe('2026-11-16');
    configure({ zone: 'America/Los_Angeles' });
    expect(date(morningInTokyo).toString()).toBe('2026-11-17');
  });

  it('uses the configured default timezone for instants when no timezone argument is passed', () => {
    configure({ zone: 'Asia/Tokyo' });
    expect(date(instant).toString()).toBe('2026-11-17');
    expect(date(new Date(instant)).toString()).toBe('2026-11-17');

    configure({ zone: 'America/Los_Angeles' });
    expect(date(instant).toString()).toBe('2026-11-16');
    expect(date(new Date(instant)).toString()).toBe('2026-11-16');
  });

  it('resolves a local Date in the system timezone when no timezone is passed or configured', () => {
    expect(date(new Date(2026, 10, 16)).toString()).toBe('2026-11-16');
    expect(date(new Date(2026, 10, 16, 23, 59)).toString()).toBe('2026-11-16');
  });

  it('ignores the timezone argument for plain date strings, CalendarDates, and Temporal.PlainDateTimes', () => {
    expect(date('2026-11-16', 'Asia/Tokyo').toString()).toBe('2026-11-16');
    expect(date('2026-11-16T23:30', 'Asia/Tokyo').toString()).toBe('2026-11-16');
    expect(date(date(2026, 11, 16), 'Asia/Tokyo').toString()).toBe('2026-11-16');
    expect(date(Temporal.PlainDateTime.from('2026-11-16T23:30'), 'Asia/Tokyo').toString()).toBe('2026-11-16');
  });

  it.todo('preserves the calendar day of a Temporal.PlainDate when a timezone is passed');
});

describe('date() validation errors', () => {
  it('throws invalidDate for out-of-range calendar days of a month', () => {
    expect(() => date('2026-02-30')).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'invalidDate', at: '2026-02-30' }),
    );
    expect(() => date('2026/11/31')).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'invalidDate', at: '2026/11/31' }),
    );
    expect(() => date(2026, 2, 30)).toThrowError(expect.objectContaining({ name: 'RangeError', code: 'invalidDate' }));
    expect(() => date({ year: 2026, month: 2, day: 30 })).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'invalidDate' }),
    );
  });

  it('parses February 29 in leap years and throws invalidDate in non-leap years', () => {
    expect(date('2028-02-29').toString()).toBe('2028-02-29');
    expect(() => date('2026-02-29')).toThrowError(expect.objectContaining({ code: 'invalidDate', at: '2026-02-29' }));
    expect(() => date(2100, 2, 29)).toThrowError(expect.objectContaining({ code: 'invalidDate' }));
  });

  it('throws invalidDate for month 0 and month 13', () => {
    expect(() => date(2026, 0, 16)).toThrowError(expect.objectContaining({ name: 'RangeError', code: 'invalidDate' }));
    expect(() => date(2026, 13, 1)).toThrowError(expect.objectContaining({ name: 'RangeError', code: 'invalidDate' }));
    expect(() => date('2026-13-01')).toThrowError(expect.objectContaining({ code: 'invalidDate', at: '2026-13-01' }));
  });

  it('throws missingDay when numeric year and month are passed without a day', () => {
    expect(() => date(2026, 11)).toThrowError(expect.objectContaining({ name: 'RangeError', code: 'missingDay' }));
    expect(() => date(2026, 11, undefined)).toThrowError(expect.objectContaining({ code: 'missingDay' }));
  });

  it('throws invalidDate for a year-month string or fields object missing day', () => {
    expect(() => date('2026-11')).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'invalidDate', at: '2026-11' }),
    );
    expect(() => date({ year: 2026, month: 11 })).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'invalidDate' }),
    );
  });

  it('throws a TypeError with missingDate for null, undefined, and omitted input', () => {
    expect(() => date(null)).toThrowError(expect.objectContaining({ name: 'TypeError', code: 'missingDate' }));
    expect(() => date(undefined)).toThrowError(expect.objectContaining({ name: 'TypeError', code: 'missingDate' }));
    expect(() => date()).toThrowError(expect.objectContaining({ name: 'TypeError', code: 'missingDate' }));
  });

  it('throws invalidDate for empty or whitespace-only strings', () => {
    expect(() => date('')).toThrowError(expect.objectContaining({ code: 'invalidDate', at: '' }));
    expect(() => date('   ')).toThrowError(expect.objectContaining({ code: 'invalidDate', at: '   ' }));
  });

  it('throws invalidDate when a field in a fields object is an empty string', () => {
    expect(() => date({ year: '2026', month: '', day: '16' })).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'invalidDate' }),
    );
  });

  it.todo('throws invalidDate rather than unknownZone when one of three year/month/day arguments is empty');

  it('throws a TypeError with invalidDate for a single number argument', () => {
    expect(() => date(1794850200000)).toThrowError(
      expect.objectContaining({ name: 'TypeError', code: 'invalidDate', at: '1794850200000' }),
    );
    expect(() => date(2026)).toThrowError(
      expect.objectContaining({ name: 'TypeError', code: 'invalidDate', at: '2026' }),
    );
  });

  it('throws invalidDate for fractional year, month, or day numbers', () => {
    expect(() => date(2026.5, 11, 16)).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'invalidDate' }),
    );
    expect(() => date(2026, 11.5, 16)).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'invalidDate' }),
    );
    expect(() => date(2026, 11, 16.5)).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'invalidDate' }),
    );
  });

  it('throws invalidDate for ambiguous month-first or day-first date strings', () => {
    expect(() => date('03/05/2026')).toThrowError(expect.objectContaining({ code: 'invalidDate', at: '03/05/2026' }));
    expect(() => date('16.11.2026')).toThrowError(expect.objectContaining({ code: 'invalidDate', at: '16.11.2026' }));
  });

  it('throws invalidDate for a year followed by a clock time or by a month alone', () => {
    expect(() => date('2026 10:30')).toThrowError(expect.objectContaining({ code: 'invalidDate', at: '2026 10:30' }));
    expect(() => date('2026年11月')).toThrowError(expect.objectContaining({ code: 'invalidDate', at: '2026年11月' }));
  });

  it('throws invalidDate for named months or relative English words', () => {
    expect(() => date('Nov 16, 2026')).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'invalidDate', at: 'Nov 16, 2026' }),
    );
    expect(() => date('tomorrow')).toThrowError(expect.objectContaining({ code: 'invalidDate', at: 'tomorrow' }));
  });

  it("throws missingPlugin at 'loose' when { loose: true } is passed without the loose plugin", () => {
    expect(() => date('Nov 16, 2026', { loose: true })).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'missingPlugin', at: 'loose' }),
    );
  });

  it('throws a TypeError with invalidDate for booleans and arrays', () => {
    expect(() => date(true)).toThrowError(expect.objectContaining({ name: 'TypeError', code: 'invalidDate' }));
    expect(() => date([2026, 11, 16])).toThrowError(
      expect.objectContaining({ name: 'TypeError', code: 'invalidDate' }),
    );
  });

  it('throws invalidNumber for an invalid Date instance', () => {
    expect(() => date(new Date('not a date'))).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'invalidNumber' }),
    );
  });

  it('throws unknownZone for an unrecognized timezone', () => {
    expect(() => date('2026-11-17T02:00:00Z', 'Mars/Phobos')).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'unknownZone', at: 'Mars/Phobos' }),
    );
    expect(() => date('2026-11-16', 'Mars/Phobos')).toThrowError(
      expect.objectContaining({ code: 'unknownZone', at: 'Mars/Phobos' }),
    );
  });
});

describe('today(), tomorrow(), and yesterday()', () => {
  afterEach(() => {
    vi.useRealTimers();
    configure({ zone: null });
  });

  it('returns the current calendar day in the target timezone', () => {
    vi.setSystemTime(new Date('2026-11-17T02:00:00Z'));
    expect(today('America/Los_Angeles').toString()).toBe('2026-11-16');
    expect(today('Asia/Tokyo').toString()).toBe('2026-11-17');
  });

  it('returns the next and previous calendar days in the target timezone', () => {
    vi.setSystemTime(new Date('2026-11-17T02:00:00Z'));
    expect(tomorrow('America/Los_Angeles').toString()).toBe('2026-11-17');
    expect(yesterday('America/Los_Angeles').toString()).toBe('2026-11-15');
    expect(tomorrow('Asia/Tokyo').toString()).toBe('2026-11-18');
    expect(yesterday('Asia/Tokyo').toString()).toBe('2026-11-16');
  });

  it('handles year-end boundaries across timezones', () => {
    // New York is UTC-5 in January, so 04:30Z on Jan 1 is still 23:30 on Dec 31
    vi.setSystemTime(new Date('2026-01-01T04:30:00Z'));
    expect(today('America/New_York').toString()).toBe('2025-12-31');
    expect(tomorrow('America/New_York').toString()).toBe('2026-01-01');
    expect(yesterday('UTC').toString()).toBe('2025-12-31');
  });

  it('uses the configured default timezone when none is passed', () => {
    vi.setSystemTime(new Date('2026-11-17T02:00:00Z'));
    configure({ zone: 'America/Los_Angeles' });
    expect(today().toString()).toBe('2026-11-16');
    expect(tomorrow().toString()).toBe('2026-11-17');
    expect(yesterday().toString()).toBe('2026-11-15');

    configure({ zone: 'Asia/Tokyo' });
    expect(today().toString()).toBe('2026-11-17');
  });

  it('matches the local calendar date of new Date() when no timezone is passed or configured', () => {
    vi.setSystemTime(new Date('2026-11-17T02:00:00Z'));
    const local = new Date();
    expect(today()).toMatchObject({
      year: local.getFullYear(),
      month: local.getMonth() + 1,
      day: local.getDate(),
    });
  });

  it('reads the same clock as now() when fake timers mock Date without Temporal.Now', () => {
    vi.useFakeTimers({ toFake: ['Date'], now: new Date('2031-03-04T12:00:00Z') });
    expect(now('UTC').date.toString()).toBe('2031-03-04');
    expect(today('UTC').toString()).toBe('2031-03-04');
    expect(tomorrow('UTC').toString()).toBe('2031-03-05');
    expect(yesterday('UTC').toString()).toBe('2031-03-03');
  });

  it("chains today().plus(2, 'days').at('9am') into a DateTime", () => {
    vi.setSystemTime(new Date('2026-11-17T02:00:00Z'));
    configure({ zone: 'America/Los_Angeles' });
    expect(today().plus(2, 'days').at('9am').toString()).toBe('2026-11-18T17:00:00.000Z');
  });

  it('throws unknownZone for an unrecognized timezone', () => {
    expect(() => today('Mars/Phobos')).toThrowError(
      expect.objectContaining({ code: 'unknownZone', at: 'Mars/Phobos' }),
    );
    expect(() => tomorrow('Mars/Phobos')).toThrowError(
      expect.objectContaining({ code: 'unknownZone', at: 'Mars/Phobos' }),
    );
  });
});

describe('CalendarDate properties', () => {
  it('exposes year, month, and day', () => {
    expect(date('2026-11-16')).toMatchObject({ year: 2026, month: 11, day: 16 });
  });

  it('returns ISO dayOfWeek from 1 (Monday) to 7 (Sunday)', () => {
    expect(date('2026-11-16').dayOfWeek).toBe(1);
    expect(date('2026-11-20').dayOfWeek).toBe(5);
    expect(date('2026-11-22').dayOfWeek).toBe(7);
  });

  it('returns quarter from 1 to 4', () => {
    expect(date('2026-01-01').quarter).toBe(1);
    expect(date('2026-03-31').quarter).toBe(1);
    expect(date('2026-04-01').quarter).toBe(2);
    expect(date('2026-09-30').quarter).toBe(3);
    expect(date('2026-12-31').quarter).toBe(4);
  });

  it('computes dayOfYear, daysInMonth, and daysInYear across common and leap years', () => {
    expect(date('2026-11-16')).toMatchObject({ dayOfYear: 320, daysInMonth: 30, daysInYear: 365 });
    expect(date('2026-02-10').daysInMonth).toBe(28);
    expect(date('2028-02-10')).toMatchObject({ daysInMonth: 29, daysInYear: 366 });
    expect(date('2028-12-31').dayOfYear).toBe(366);
  });

  it('computes ISO 8601 weekOfYear across year boundaries', () => {
    expect(date('2026-11-16').weekOfYear).toBe(47);
    expect(date('2027-01-01').weekOfYear).toBe(53);
    expect(date('2024-12-30').weekOfYear).toBe(1);
  });

  it('exposes yearMonth and monthDay projections', () => {
    expect(date('2026-11-16').yearMonth.toString()).toBe('2026-11');
    expect(date('2026-11-16').monthDay.toString()).toBe('11-16');
  });

  it('formats text using the instance locale', () => {
    expect(date('2026-11-16', { locale: 'en-US' }).text).toBe('Nov 16, 2026');
  });
});

describe('CalendarDate.isLeapYear(), isWeekday(), and isWeekend()', () => {
  it('identifies leap years including 100-year and 400-year century rules', () => {
    expect(date('2028-06-01').isLeapYear()).toBe(true);
    expect(date('2026-06-01').isLeapYear()).toBe(false);
    expect(date('2100-06-01').isLeapYear()).toBe(false);
    expect(date('2000-06-01').isLeapYear()).toBe(true);
  });

  it('returns true from isWeekday() for Monday through Friday and from isWeekend() for Saturday and Sunday in en-US', () => {
    const [friday, saturday, sunday] = ['2026-11-20', '2026-11-21', '2026-11-22'].map((day) =>
      date(day, { locale: 'en-US' })
    );
    expect([friday.isWeekday(), friday.isWeekend()]).toEqual([true, false]);
    expect([saturday.isWeekday(), saturday.isWeekend()]).toEqual([false, true]);
    expect([sunday.isWeekday(), sunday.isWeekend()]).toEqual([false, true]);
  });
});

describe('CalendarDate.at()', () => {
  const day = date('2026-11-16');

  afterEach(() => {
    configure({ zone: null });
  });

  it('combines the date with a wall-clock time and timezone into a DateTime', () => {
    const standup = day.at('9:30am', 'America/Los_Angeles');
    expect(standup.toString()).toBe('2026-11-16T17:30:00.000Z');
    expect(standup).toMatchObject({ zone: 'America/Los_Angeles', day: 16, hour: 9, minute: 30 });
  });

  it('accepts 12-hour strings, 24-hour strings, Time instances, and time field objects', () => {
    expect(day.at('5:30pm', 'UTC').toString()).toBe('2026-11-16T17:30:00.000Z');
    expect(day.at('17:30', 'UTC').toString()).toBe('2026-11-16T17:30:00.000Z');
    expect(day.at(time('17:30'), 'UTC').toString()).toBe('2026-11-16T17:30:00.000Z');
    expect(day.at({ hour: 17, minute: 30 }, 'UTC').toString()).toBe('2026-11-16T17:30:00.000Z');
  });

  // 20:15 UTC is 12:15 in Los Angeles and 05:15 in Tokyo, so one of the two differs from any host timezone
  it('reads the time of day of a Date or ISO instant string in the target timezone', () => {
    const lunch = new Date('2026-11-16T20:15:00Z');
    expect(day.at(lunch, 'America/Los_Angeles').toString()).toBe('2026-11-16T20:15:00.000Z');
    expect(day.at(lunch, 'Asia/Tokyo')).toMatchObject({ zone: 'Asia/Tokyo', day: 16, hour: 5, minute: 15 });
    expect(day.at('2026-11-16T20:15:00Z', 'America/Los_Angeles').toString()).toBe('2026-11-16T20:15:00.000Z');
  });

  it('keeps the clock time of a DateTime from another timezone, with or without a timezone argument', () => {
    configure({ zone: 'America/New_York' });
    const berlin = datetime('2026-11-16T09:00', 'Europe/Berlin');
    expect(day.at(berlin)).toMatchObject({ zone: 'America/New_York', day: 16, hour: 9, minute: 0 });
    expect(day.at(berlin, 'America/New_York').toString()).toBe(day.at(berlin).toString());
  });

  it('accepts a Temporal.PlainTime, and a fixed-offset timezone written in digits beside a digit-only time', () => {
    expect(day.at(Temporal.PlainTime.from('08:00'), 'UTC').toString()).toBe('2026-11-16T08:00:00.000Z');
    expect(day.at('9', '+05').toString()).toBe('2026-11-16T04:00:00.000Z');
    expect(day.at('17', '+0530').toString()).toBe('2026-11-16T11:30:00.000Z');
  });

  it('defaults to the start of the day in the target timezone when time is omitted', () => {
    expect(day.at(undefined, 'UTC').toString()).toBe('2026-11-16T00:00:00.000Z');
    expect(day.at(undefined, 'Asia/Tokyo').toString()).toBe('2026-11-15T15:00:00.000Z');
  });

  it('uses the configured default timezone when none is passed', () => {
    configure({ zone: 'Asia/Tokyo' });
    expect(day.at('9:30am').toString()).toBe('2026-11-16T00:30:00.000Z');
    expect(day.at().toString()).toBe('2026-11-15T15:00:00.000Z');
  });

  it('advances wall-clock times skipped by a spring-forward DST transition', () => {
    // New York springs forward from 02:00 to 03:00 on 2026-03-08
    const skipped = date('2026-03-08').at('2:30am', 'America/New_York');
    expect(skipped.toString()).toBe('2026-03-08T07:30:00.000Z');
    expect(skipped).toMatchObject({ hour: 3, minute: 30 });
  });

  it('selects the earlier instant when a wall-clock time repeats during a fall-back DST transition', () => {
    // New York repeats 01:30 on 2026-11-01, first at UTC-4 and an hour later at UTC-5
    expect(date('2026-11-01').at('1:30am', 'America/New_York').toString()).toBe('2026-11-01T05:30:00.000Z');
  });

  it('resolves the start of day to 01:00 when midnight is skipped by DST', () => {
    // in America/Sao_Paulo clocks jumped from 23:59 on 2018-11-03 directly to 01:00 on 2018-11-04
    const start = date('2018-11-04').at(undefined, 'America/Sao_Paulo');
    expect(start.toString()).toBe('2018-11-04T03:00:00.000Z');
    expect(start).toMatchObject({ day: 4, hour: 1 });
  });

  it('throws invalidTime for an invalid time string and unknownZone for an unrecognized timezone', () => {
    expect(() => day.at('25:00', 'UTC')).toThrowError(expect.objectContaining({ code: 'invalidTime', at: '25:00' }));
    expect(() => day.at('9:30am', 'Mars/Phobos')).toThrowError(
      expect.objectContaining({ code: 'unknownZone', at: 'Mars/Phobos' }),
    );
  });

  it('throws invalidTime for an empty time string', () => {
    expect(() => day.at('', 'UTC')).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'invalidTime', at: '' }),
    );
  });
});

describe('CalendarDate.set()', () => {
  const day = date('2026-11-16');

  it('replaces a single field by name or multiple fields from an object', () => {
    expect(day.set('day', 1).toString()).toBe('2026-11-01');
    expect(day.set('year', 2030).toString()).toBe('2030-11-16');
    expect(day.set({ month: 12, day: 31 }).toString()).toBe('2026-12-31');
  });

  it('returns a new CalendarDate without mutating the original', () => {
    day.set('day', 1);
    expect(day.toString()).toBe('2026-11-16');
  });

  it('throws cannotSet for out-of-range month or day values', () => {
    expect(() => date('2026-02-10').set('day', 30)).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'cannotSet' }),
    );
    expect(() => day.set({ month: 2, day: 30 })).toThrowError(expect.objectContaining({ code: 'cannotSet' }));
    expect(() => day.set('day', 0)).toThrowError(expect.objectContaining({ code: 'cannotSet' }));
    expect(() => day.set('month', 13)).toThrowError(expect.objectContaining({ code: 'cannotSet' }));
  });

  it('constrains the day to month-end when set() updates month or year', () => {
    expect(date('2024-02-29').set('year', 2025).toString()).toBe('2025-02-28');
    expect(date('2024-02-29').set('year', 2028).toString()).toBe('2028-02-29');
    expect(date('2026-01-31').set('month', 2).toString()).toBe('2026-02-28');
    expect(date('2026-03-31').set({ month: 4 }).toString()).toBe('2026-04-30');
  });

  it('throws cannotSet for fractional field values', () => {
    expect(() => day.set('day', 1.5)).toThrowError(expect.objectContaining({ name: 'RangeError', code: 'cannotSet' }));
  });

  it('throws unknownUnit for an unrecognized field key', () => {
    expect(() => day.set('fortnight', 1)).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'unknownUnit', at: 'fortnight' }),
    );
  });
});

describe('CalendarDate.plus() and minus()', () => {
  const day = date('2026-11-16');

  it('adds and subtracts days, weeks, months, quarters, and years', () => {
    expect(day.plus(3, 'days').toString()).toBe('2026-11-19');
    expect(day.plus(2, 'weeks').toString()).toBe('2026-11-30');
    expect(day.plus(1, 'month').toString()).toBe('2026-12-16');
    expect(day.plus(1, 'quarter').toString()).toBe('2027-02-16');
    expect(day.plus(1, 'year').toString()).toBe('2027-11-16');
    expect(day.minus(3, 'days').toString()).toBe('2026-11-13');
    expect(day.minus(2, 'weeks').toString()).toBe('2026-11-02');
    expect(day.minus(1, 'month').toString()).toBe('2026-10-16');
    expect(day.minus(1, 'quarter').toString()).toBe('2026-08-16');
    expect(day.minus(1, 'year').toString()).toBe('2025-11-16');
  });

  it('accepts duration strings, field objects, Duration instances, and Temporal.Duration values', () => {
    expect(day.plus('2 weeks').toString()).toBe('2026-11-30');
    expect(day.plus({ weeks: 2 }).toString()).toBe('2026-11-30');
    expect(day.plus(days(14)).toString()).toBe('2026-11-30');
    expect(day.plus(duration('2 weeks')).toString()).toBe('2026-11-30');
    expect(day.plus(Temporal.Duration.from({ weeks: 2 })).toString()).toBe('2026-11-30');
    expect(date('2026-03-01').minus({ weeks: 2, days: 1 }).toString()).toBe('2026-02-14');
  });

  it('constrains month-end dates to the last day of shorter target months', () => {
    expect(date('2026-01-31').plus(1, 'month').toString()).toBe('2026-02-28');
    expect(date('2028-01-31').plus(1, 'month').toString()).toBe('2028-02-29');
    expect(date('2026-03-31').minus(1, 'month').toString()).toBe('2026-02-28');
    expect(date('2028-02-29').plus(1, 'year').toString()).toBe('2029-02-28');
    expect(date('2028-02-29').plus(4, 'years').toString()).toBe('2032-02-29');
  });

  it('crosses month and year boundaries', () => {
    expect(date('2026-03-01').minus(1, 'day').toString()).toBe('2026-02-28');
    expect(date('2026-12-31').plus(1, 'day').toString()).toBe('2027-01-01');
    expect(date('2026-01-01').minus(1, 'day').toString()).toBe('2025-12-31');
  });

  it('reverses direction for negative amounts', () => {
    expect(day.plus(-1, 'day').toString()).toBe('2026-11-15');
    expect(day.minus(-1, 'day').toString()).toBe('2026-11-17');
  });

  it('aliases add() and subtract() to plus() and minus()', () => {
    expect(day.add(2, 'weeks').toString()).toBe('2026-11-30');
    expect(day.subtract(2, 'weeks').toString()).toBe('2026-11-02');
  });

  it('returns a new CalendarDate without mutating the original', () => {
    day.plus(2, 'days');
    day.minus(1, 'month');
    expect(day.toString()).toBe('2026-11-16');
  });

  it('throws unsupportedUnit for time-of-day units', () => {
    expect(() => day.plus(2, 'hours')).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'unsupportedUnit', at: 'hours' }),
    );
    expect(() => day.minus({ minutes: 30 })).toThrowError(
      expect.objectContaining({ code: 'unsupportedUnit', at: 'minutes' }),
    );
    expect(() => day.plus('90 seconds')).toThrowError(
      expect.objectContaining({ code: 'unsupportedUnit', at: 'seconds' }),
    );
  });

  // Temporal.PlainDate.prototype.add({ hours: 24 }) silently adds a day while { hours: 23 } is a no-op
  it('throws unsupportedUnit for 24 hours rather than converting to 1 day', () => {
    expect(() => day.plus(24, 'hours')).toThrowError(expect.objectContaining({ code: 'unsupportedUnit', at: 'hours' }));
    expect(() => day.plus('PT24H')).toThrowError(expect.objectContaining({ code: 'unsupportedUnit', at: 'hours' }));
  });

  it('throws unsupportedUnit for fractional days or weeks', () => {
    expect(() => day.plus(1.5, 'days')).toThrowError(expect.objectContaining({ code: 'unsupportedUnit' }));
    expect(() => day.plus(0.5, 'weeks')).toThrowError(expect.objectContaining({ code: 'unsupportedUnit' }));
  });

  it('throws unsupportedUnit for a bare number without a unit', () => {
    expect(() => day.plus(2)).toThrowError(expect.objectContaining({ name: 'RangeError', code: 'unsupportedUnit' }));
  });

  it('throws a TypeError with invalidDuration when the amount is null or omitted', () => {
    expect(() => day.plus()).toThrowError(expect.objectContaining({ name: 'TypeError', code: 'invalidDuration' }));
    expect(() => day.minus(null)).toThrowError(expect.objectContaining({ name: 'TypeError', code: 'invalidDuration' }));
  });

  it('throws unknownUnit for an unrecognized unit', () => {
    expect(() => day.plus(2, 'fortnights')).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'unknownUnit', at: 'fortnights' }),
    );
  });

  it('throws cannotAdd and cannotSubtract when the result exceeds Temporal PlainDate bounds', () => {
    expect(() => day.plus(1_000_000, 'years')).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'cannotAdd' }),
    );
    expect(() => day.minus(1_000_000, 'years')).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'cannotSubtract' }),
    );
  });
});

describe('CalendarDate unit aliases', () => {
  const day = date('2026-11-16');

  it('accepts single-letter unit aliases y, Q, w, and d', () => {
    expect(day.plus(1, 'y').toString()).toBe('2027-11-16');
    expect(day.plus(1, 'Q').toString()).toBe('2027-02-16');
    expect(day.plus(1, 'w').toString()).toBe('2026-11-23');
    expect(day.plus(1, 'd').toString()).toBe('2026-11-17');
  });

  it("interprets 'M' as months and throws unsupportedUnit for 'm' (minutes)", () => {
    expect(day.plus(1, 'M').toString()).toBe('2026-12-16');
    expect(day.startOf('M').toString()).toBe('2026-11-01');
    expect(date('2026-01-01').until('2026-07-01', 'M')).toBe(6);
    expect(() => day.plus(1, 'm')).toThrowError(expect.objectContaining({ code: 'unsupportedUnit', at: 'minutes' }));
  });
});

describe('CalendarDate.startOf() and endOf()', () => {
  const wednesday = date('2026-11-18');

  it('returns the first and last calendar day of the year, quarter, and month', () => {
    expect(wednesday.startOf('year').toString()).toBe('2026-01-01');
    expect(wednesday.endOf('year').toString()).toBe('2026-12-31');
    expect(wednesday.startOf('quarter').toString()).toBe('2026-10-01');
    expect(wednesday.endOf('quarter').toString()).toBe('2026-12-31');
    expect(wednesday.startOf('month').toString()).toBe('2026-11-01');
    expect(wednesday.endOf('month').toString()).toBe('2026-11-30');
  });

  it("returns Feb 28 or Feb 29 for endOf('month') in February", () => {
    expect(date('2026-02-10').endOf('month').toString()).toBe('2026-02-28');
    expect(date('2028-02-10').endOf('month').toString()).toBe('2028-02-29');
  });

  it('computes start and end dates for each calendar quarter', () => {
    expect(date('2026-02-10').startOf('quarter').toString()).toBe('2026-01-01');
    expect(date('2026-02-10').endOf('quarter').toString()).toBe('2026-03-31');
    expect(date('2026-05-31').startOf('quarter').toString()).toBe('2026-04-01');
    expect(date('2026-05-31').endOf('quarter').toString()).toBe('2026-06-30');
    expect(date('2026-09-30').startOf('quarter').toString()).toBe('2026-07-01');
    expect(date('2026-09-30').endOf('quarter').toString()).toBe('2026-09-30');
  });

  it('computes week boundaries from a weekday name or ISO weekday number', () => {
    expect(wednesday.startOf('week', 'monday').toString()).toBe('2026-11-16');
    expect(wednesday.endOf('week', 'monday').toString()).toBe('2026-11-22');
    expect(wednesday.startOf('week', 'sunday').toString()).toBe('2026-11-15');
    expect(wednesday.endOf('week', 'sunday').toString()).toBe('2026-11-21');
    expect(wednesday.startOf('week', 7).toString()).toBe('2026-11-15');
    expect(wednesday.startOf('week', 6).toString()).toBe('2026-11-14');
  });

  it('derives the first day of the week from the instance locale when omitted', () => {
    expect(date('2026-11-18', { locale: 'en-US' }).startOf('week').toString()).toBe('2026-11-15');
    expect(date('2026-11-18', { locale: 'en-US' }).endOf('week').toString()).toBe('2026-11-21');
    expect(date('2026-11-18', { locale: 'de-DE' }).startOf('week').toString()).toBe('2026-11-16');
    expect(date('2026-11-18', { locale: 'de-DE' }).endOf('week').toString()).toBe('2026-11-22');
  });

  it('preserves dates that already fall on the start or end of the week', () => {
    expect(date('2026-11-16').startOf('week', 'monday').toString()).toBe('2026-11-16');
    expect(date('2026-11-22').endOf('week', 'monday').toString()).toBe('2026-11-22');
    expect(date('2026-11-22').startOf('week', 'monday').toString()).toBe('2026-11-16');
  });

  it('computes week boundaries across month and year transitions', () => {
    expect(date('2027-01-01').startOf('week', 'monday').toString()).toBe('2026-12-28');
    expect(date('2026-12-31').endOf('week', 'monday').toString()).toBe('2027-01-03');
  });

  it("returns an equivalent CalendarDate for startOf('day') and endOf('day')", () => {
    expect(wednesday.startOf('day').toString()).toBe('2026-11-18');
    expect(wednesday.endOf('day').toString()).toBe('2026-11-18');
  });

  it('throws unsupportedUnit for clock units and unknownUnit for unrecognized units', () => {
    expect(() => wednesday.startOf('hour')).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'unsupportedUnit', at: 'hour' }),
    );
    expect(() => wednesday.endOf('minute')).toThrowError(
      expect.objectContaining({ code: 'unsupportedUnit', at: 'minute' }),
    );
    expect(() => wednesday.startOf('fortnight')).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'unknownUnit', at: 'fortnight' }),
    );
  });

  it('throws unknownDayOfWeek for an unrecognized week start argument', () => {
    expect(() => wednesday.startOf('week', 'funday')).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'unknownDayOfWeek', at: 'funday' }),
    );
    expect(() => wednesday.endOf('week', 8)).toThrowError(
      expect.objectContaining({ code: 'unknownDayOfWeek', at: '8' }),
    );
  });
});

describe('CalendarDate.startOfNext() and startOfPrevious()', () => {
  const monday = date('2026-11-16');

  it.each([
    ['year', '2027-01-01', '2025-01-01'],
    ['quarter', '2027-01-01', '2026-07-01'],
    ['month', '2026-12-01', '2026-10-01'],
    ['day', '2026-11-17', '2026-11-15'],
  ])('returns the first day of the next and the previous %s', (unit, next, previous) => {
    expect(monday.startOfNext(unit).toString()).toBe(next);
    expect(monday.startOfPrevious(unit).toString()).toBe(previous);
  });

  it('moves a whole unit when the date is already the first day of its unit', () => {
    const firstOfDecember = date('2026-12-01');
    expect(firstOfDecember.startOfNext('month').toString()).toBe('2027-01-01');
    expect(firstOfDecember.startOfPrevious('month').toString()).toBe('2026-11-01');
    expect(date('2027-01-01').startOfPrevious('year').toString()).toBe('2026-01-01');
  });

  it('returns the first day of a shorter month from the 31st and of the next or previous year from February 29', () => {
    expect(date('2026-01-31').startOfNext('month').toString()).toBe('2026-02-01');
    expect(date('2026-03-31').startOfPrevious('month').toString()).toBe('2026-02-01');
    expect(date('2024-02-29').startOfNext('year').toString()).toBe('2025-01-01');
    expect(date('2024-02-29').startOfPrevious('year').toString()).toBe('2023-01-01');
  });

  it('starts the next and the previous week on the first day of the week of the instance locale', () => {
    expect(monday.locale('en-US').startOfNext('week').toString()).toBe('2026-11-22');
    expect(monday.locale('de-DE').startOfNext('week').toString()).toBe('2026-11-23');
    expect(monday.locale('en-US').startOfPrevious('week').toString()).toBe('2026-11-08');
    expect(monday.locale('de-DE').startOfPrevious('week').toString()).toBe('2026-11-09');
  });

  it('starts the next and the previous week on a weekday name or ISO number passed as the second argument', () => {
    const american = date('2026-11-18', { locale: 'en-US' });
    expect(american.startOfNext('week', 'monday').toString()).toBe('2026-11-23');
    expect(american.startOfPrevious('week', 1).toString()).toBe('2026-11-09');
    expect(date('2026-12-31').startOfNext('week', 'monday').toString()).toBe('2027-01-04');
  });

  it('returns the same date as next() and previous() for a weekday', () => {
    expect(monday.startOfNext('wednesday').toString()).toBe('2026-11-18');
    expect(monday.startOfPrevious('wednesday').toString()).toBe('2026-11-11');
    expect(monday.startOfNext('wednesday').equals(monday.next('wednesday'))).toBe(true);
    expect(monday.startOfPrevious('wednesday').equals(monday.previous('wednesday'))).toBe(true);
  });

  it('moves a full 7 days when already on the target weekday', () => {
    expect(monday.startOfNext('monday').toString()).toBe('2026-11-23');
    expect(monday.startOfPrevious('monday').toString()).toBe('2026-11-09');
  });

  it('accepts 3-letter weekday abbreviations, mixed case, and surrounding spaces', () => {
    expect(monday.startOfNext('wed').toString()).toBe('2026-11-18');
    expect(monday.startOfNext('Wednesday').toString()).toBe('2026-11-18');
    expect(monday.startOfPrevious(' SUN ').toString()).toBe('2026-11-15');
  });

  // next(3) is Wednesday, but beside a unit a number reads as a count, and startOfNext(2, 'months') must not be Tuesday
  it('throws unknownUnit for a weekday written as a number and for a count before a unit', () => {
    expect(() => monday.startOfNext(3)).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'unknownUnit', at: '3' }),
    );
    expect(() => monday.startOfPrevious(0)).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'unknownUnit', at: '0' }),
    );
    expect(() => monday.startOfNext(2, 'months')).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'unknownUnit', at: '2' }),
    );
  });

  // the previous Sunday is yesterday, while the previous week that starts on Sunday began eight days ago
  it('reads a weekday as that day rather than as the week it starts', () => {
    expect(monday.startOfPrevious('sunday').toString()).toBe('2026-11-15');
    expect(monday.startOfPrevious('week', 'sunday').toString()).toBe('2026-11-08');
    expect(monday.startOfNext('wednesday').toString()).toBe(monday.startOfNext('week', 'wednesday').toString());
  });

  it('returns a new CalendarDate without mutating the original', () => {
    expect(monday.startOfNext('day')).not.toBe(monday);
    expect(monday.startOfPrevious('day')).not.toBe(monday);
    expect(monday.toString()).toBe('2026-11-16');
  });

  it('throws unsupportedUnit for clock units', () => {
    expect(() => monday.startOfNext('hour')).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'unsupportedUnit', at: 'hour' }),
    );
    expect(() => monday.startOfPrevious('minute')).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'unsupportedUnit', at: 'minute' }),
    );
  });

  it.each([['fortnight', 'fortnight'], ['funday', 'funday'], [undefined, 'undefined']])(
    'throws unknownUnit for %s, which names neither a unit nor a weekday',
    (target, at) => {
      expect(() => monday.startOfNext(target)).toThrowError(
        expect.objectContaining({ name: 'RangeError', code: 'unknownUnit', at }),
      );
      expect(() => monday.startOfPrevious(target)).toThrowError(
        expect.objectContaining({ name: 'RangeError', code: 'unknownUnit', at }),
      );
    },
  );

  it('throws unknownUnit for a MonthDay, which only next() and previous() accept', () => {
    expect(() => monday.startOfNext(monthDay('12-25'))).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'unknownUnit', at: '12-25' }),
    );
  });

  it('throws unknownDayOfWeek for an unrecognized week start argument', () => {
    expect(() => monday.startOfNext('week', 'funday')).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'unknownDayOfWeek', at: 'funday' }),
    );
    expect(() => monday.startOfPrevious('week', 8)).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'unknownDayOfWeek', at: '8' }),
    );
  });
});

describe('CalendarDate.next() and previous()', () => {
  const monday = date('2026-11-16');

  it('advances or rewinds to the nearest matching weekday', () => {
    expect(monday.next('friday').toString()).toBe('2026-11-20');
    expect(monday.next('sunday').toString()).toBe('2026-11-22');
    expect(monday.previous('friday').toString()).toBe('2026-11-13');
    expect(monday.previous('sunday').toString()).toBe('2026-11-15');
  });

  it('moves by a full 7 days when already on the target weekday', () => {
    expect(monday.next('monday').toString()).toBe('2026-11-23');
    expect(monday.previous('monday').toString()).toBe('2026-11-09');
  });

  it('accepts full weekday names, 3-letter abbreviations, and ISO numbers 1-7', () => {
    expect(monday.next('Friday').toString()).toBe('2026-11-20');
    expect(monday.next('fri').toString()).toBe('2026-11-20');
    expect(monday.next(5).toString()).toBe('2026-11-20');
    expect(monday.previous(7).toString()).toBe('2026-11-15');
  });

  it('accepts 0 for Sunday, matching Date.prototype.getDay()', () => {
    expect(monday.next(0).toString()).toBe('2026-11-22');
    expect(monday.previous(0).toString()).toBe('2026-11-15');
    expect(monday.startOf('week', 0).toString()).toBe('2026-11-15');
  });

  it('advances or rewinds to the next or previous occurrence of a MonthDay', () => {
    expect(monday.next(monthDay('12-25')).toString()).toBe('2026-12-25');
    expect(monday.next(monthDay('10-17')).toString()).toBe('2027-10-17');
    expect(monday.previous(monthDay('10-31')).toString()).toBe('2026-10-31');
    expect(monday.previous(monthDay('12-25')).toString()).toBe('2025-12-25');
  });

  it('moves by a full year when already on the target MonthDay', () => {
    expect(monday.next(monthDay('11-16')).toString()).toBe('2027-11-16');
    expect(monday.previous(monthDay('11-16')).toString()).toBe('2025-11-16');
  });

  it("constrains monthDay('02-29') to February 28 in non-leap years", () => {
    const leapDay = monthDay('02-29');
    expect(date('2026-03-01').next(leapDay).toString()).toBe('2027-02-28');
    expect(date('2027-02-28').next(leapDay).toString()).toBe('2028-02-29');
    expect(date('2028-02-29').next(leapDay).toString()).toBe('2029-02-28');
    expect(date('2027-03-01').previous(leapDay).toString()).toBe('2027-02-28');
    expect(date('2029-01-01').previous(leapDay).toString()).toBe('2028-02-29');
  });

  it('throws unknownDayOfWeek for an invalid weekday target', () => {
    expect(() => monday.next('funday')).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'unknownDayOfWeek', at: 'funday' }),
    );
    expect(() => monday.next(-1)).toThrowError(expect.objectContaining({ code: 'unknownDayOfWeek', at: '-1' }));
    expect(() => monday.previous(8)).toThrowError(expect.objectContaining({ code: 'unknownDayOfWeek', at: '8' }));
    expect(() => monday.next()).toThrowError(expect.objectContaining({ code: 'unknownDayOfWeek' }));
  });

  it("throws unknownDayOfWeek for next('month') and previous('month')", () => {
    expect(() => monday.next('month')).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'unknownDayOfWeek', at: 'month' }),
    );
    expect(() => monday.previous('month')).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'unknownDayOfWeek', at: 'month' }),
    );
  });
});

describe('CalendarDate.equals(), isBefore(), isAfter(), and isSame()', () => {
  const day = date('2026-11-16');

  it('compares against strings, CalendarDates, field objects, and Temporal.PlainDates', () => {
    expect(day.equals('2026-11-16')).toBe(true);
    expect(day.equals(date(2026, 11, 16))).toBe(true);
    expect(day.equals({ year: 2026, month: 11, day: 16 })).toBe(true);
    expect(day.equals(Temporal.PlainDate.from('2026-11-16'))).toBe(true);
    expect(day.equals('2026-11-17')).toBe(false);
  });

  it('orders earlier and later dates with isBefore() and isAfter() and returns false for equal dates', () => {
    expect(day.isBefore('2026-11-17')).toBe(true);
    expect(day.isBefore('2026-11-15')).toBe(false);
    expect(day.isAfter('2026-11-15')).toBe(true);
    expect(day.isAfter('2026-11-17')).toBe(false);
    expect(day.isBefore('2026-11-16')).toBe(false);
    expect(day.isAfter('2026-11-16')).toBe(false);
  });

  it('orders dates chronologically across month and year boundaries', () => {
    expect(date('2026-01-31').isBefore('2026-02-01')).toBe(true);
    expect(date('2025-12-31').isBefore('2026-01-01')).toBe(true);
    expect(date('2026-02-01').isAfter('2026-01-31')).toBe(true);
  });

  it('compares against a DateTime by the calendar day in its own timezone', () => {
    expect(day.equals(datetime('2026-11-17T02:00:00Z', 'America/Los_Angeles'))).toBe(true);
    expect(day.equals(datetime('2026-11-17T02:00:00Z', 'Asia/Tokyo'))).toBe(false);
    expect(day.isBefore(datetime('2026-11-17T02:00:00Z', 'Asia/Tokyo'))).toBe(true);
  });

  it('compares exact calendar days when isSame() is called without a unit', () => {
    expect(day.isSame('2026-11-16')).toBe(true);
    expect(day.isSame('2026-11-17')).toBe(false);
  });

  it('checks whether two dates share the same year, quarter, or month in isSame()', () => {
    expect(day.isSame('2026-01-01', 'year')).toBe(true);
    expect(day.isSame('2027-11-16', 'year')).toBe(false);
    expect(day.isSame('2026-10-01', 'quarter')).toBe(true);
    expect(day.isSame('2026-09-30', 'quarter')).toBe(false);
    expect(day.isSame('2026-11-30', 'month')).toBe(true);
    expect(day.isSame('2026-12-01', 'month')).toBe(false);
    expect(day.isSame('2025-11-16', 'month')).toBe(false);
  });

  it("respects explicit weekStart or instance locale in isSame(other, 'week')", () => {
    // in 2026, Sep 6 (Sunday) and Sep 9 (Wednesday) share a Sunday-start week, not a Monday-start week
    expect(date('2026-09-09').isSame('2026-09-06', 'week', 'sunday')).toBe(true);
    expect(date('2026-09-09').isSame('2026-09-06', 'week', 'monday')).toBe(false);
    expect(date('2026-09-09', { locale: 'en-US' }).isSame('2026-09-06', 'week')).toBe(true);
    expect(date('2026-09-09', { locale: 'de-DE' }).isSame('2026-09-06', 'week')).toBe(false);
  });

  it('throws a TypeError with missingDate when the comparison target is null or undefined', () => {
    expect(() => day.equals(undefined)).toThrowError(
      expect.objectContaining({ name: 'TypeError', code: 'missingDate' }),
    );
    expect(() => day.isBefore(null)).toThrowError(expect.objectContaining({ name: 'TypeError', code: 'missingDate' }));
    expect(() => day.isAfter(undefined)).toThrowError(expect.objectContaining({ code: 'missingDate' }));
    expect(() => day.isSame(undefined, 'month')).toThrowError(expect.objectContaining({ code: 'missingDate' }));
  });

  it('throws invalidDate when the comparison target cannot be parsed', () => {
    expect(() => day.equals('next week')).toThrowError(
      expect.objectContaining({ code: 'invalidDate', at: 'next week' }),
    );
    expect(() => day.isBefore('03/05/2026')).toThrowError(
      expect.objectContaining({ code: 'invalidDate', at: '03/05/2026' }),
    );
  });

  it('throws unsupportedUnit when isSame() is called with a clock unit', () => {
    expect(() => day.isSame('2026-11-16', 'hour')).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'unsupportedUnit', at: 'hour' }),
    );
  });
});

describe('CalendarDate.isToday(), isTomorrow(), isYesterday(), isPast(), and isFuture()', () => {
  const instant = new Date('2026-11-17T02:00:00Z');

  afterEach(() => {
    vi.useRealTimers();
    configure({ zone: null });
  });

  it('evaluates isToday(), isTomorrow(), and isYesterday() against the current date in the target timezone', () => {
    vi.setSystemTime(instant);
    const day = date('2026-11-16');
    expect(day.isToday('America/Los_Angeles')).toBe(true);
    expect(day.isToday('Asia/Tokyo')).toBe(false);
    expect(day.isYesterday('Asia/Tokyo')).toBe(true);
    expect(date('2026-11-17').isTomorrow('America/Los_Angeles')).toBe(true);
    expect(date('2026-11-17').isTomorrow('Asia/Tokyo')).toBe(false);
  });

  it('returns true from isPast() and isFuture() only for dates strictly before or after today', () => {
    vi.setSystemTime(instant);
    const zone = 'America/Los_Angeles';
    expect(date('2026-11-15').isPast(zone)).toBe(true);
    expect(date('2026-11-15').isFuture(zone)).toBe(false);
    expect(date('2026-11-17').isFuture(zone)).toBe(true);
    expect(date('2026-11-17').isPast(zone)).toBe(false);
    expect(date('2026-11-16').isPast(zone)).toBe(false);
    expect(date('2026-11-16').isFuture(zone)).toBe(false);
  });

  it('resolves the same CalendarDate as tomorrow, today, or yesterday depending on timezone', () => {
    // at 10:30Z on Nov 17, Pago Pago (UTC-11) is Nov 16 and Kiritimati (UTC+14) is Nov 18
    vi.setSystemTime(new Date('2026-11-17T10:30:00Z'));
    const day = date('2026-11-17');
    expect(day.isTomorrow('Pacific/Pago_Pago')).toBe(true);
    expect(day.isFuture('Pacific/Pago_Pago')).toBe(true);
    expect(day.isToday('UTC')).toBe(true);
    expect(day.isYesterday('Pacific/Kiritimati')).toBe(true);
    expect(day.isPast('Pacific/Kiritimati')).toBe(true);
  });

  it('uses the configured default timezone when none is passed', () => {
    vi.setSystemTime(instant);
    configure({ zone: 'America/Los_Angeles' });
    expect(date('2026-11-16').isToday()).toBe(true);
    expect(date('2026-11-17').isTomorrow()).toBe(true);
    expect(date('2026-11-15').isYesterday()).toBe(true);
    expect(date('2026-11-17').isFuture()).toBe(true);
    expect(date('2026-11-15').isPast()).toBe(true);

    configure({ zone: 'Asia/Tokyo' });
    expect(date('2026-11-17').isToday()).toBe(true);
  });
});

describe('CalendarDate.until() and since()', () => {
  it('measures the Duration to a target date as a count of days', () => {
    expect(date('2026-01-01').until('2027-04-05').toString()).toBe('P459D');
    expect(date('2026-01-01').until('2026-02-15').days).toBe(45);
    expect(date('2026-01-01').until('2027-04-05')).toMatchObject({ years: 0, months: 0, days: 459 });
  });

  it("balances the measured Duration into years, months, and days with balance('year')", () => {
    const span = date('2026-01-01').until('2027-04-05').balance('year');
    expect(span.toString()).toBe('P1Y3M4D');
    expect(span).toMatchObject({ years: 1, months: 3, days: 4 });
  });

  it('returns a numeric total when a target unit is passed', () => {
    expect(date('2026-01-01').until('2027-04-05', 'days')).toBe(459);
    expect(date('2026-11-02').until('2026-11-16', 'weeks')).toBe(2);
    expect(date('2026-01-01').until('2026-07-01', 'months')).toBe(6);
    expect(date('2026-01-01').until('2027-01-01', 'years')).toBe(1);
  });

  it('returns a fractional total when the span does not divide the unit evenly', () => {
    expect(date('2026-01-01').until('2026-01-04', 'weeks')).toBeCloseTo(3 / 7);
    expect(date('2026-01-01').until('2026-02-15', 'months')).toBe(1.5);
  });

  it('returns negative values for earlier target dates and 0 for identical dates', () => {
    expect(date('2026-01-01').until('2025-12-25').toString()).toBe('-P7D');
    expect(date('2026-01-01').until('2025-12-25', 'days')).toBe(-7);
    expect(date('2026-01-01').until('2026-01-01', 'days')).toBe(0);
  });

  it('computes since() as the inverse calendar span from an earlier date', () => {
    expect(date('2026-11-16').since('2026-11-02').days).toBe(14);
    expect(date('2026-11-16').since('2026-11-02', 'weeks')).toBe(2);
    expect(date('2027-04-05').since('2026-01-01').toString()).toBe('P459D');
    expect(date('2026-11-16').since('2026-11-20', 'days')).toBe(-4);
  });

  it("counts full elapsed years in balance('year') only once the anniversary month and day are reached", () => {
    const born = date('1990-05-10');
    expect(born.until('2026-05-09').balance('year').years).toBe(35);
    expect(born.until('2026-05-10').balance('year').years).toBe(36);
    expect(date('2026-05-10').since(born).balance('year').years).toBe(36);
  });

  it('round-trips start.plus(start.until(end)) back to end across month-end boundaries', () => {
    const pairs = [
      ['2026-01-01', '2027-04-05'],
      ['2026-01-31', '2026-02-28'],
      ['2026-01-31', '2026-03-30'],
      ['2026-02-28', '2026-03-31'],
      ['2026-03-31', '2026-02-28'],
      ['2028-02-29', '2029-02-28'],
      ['2026-12-31', '2026-01-01'],
    ];
    for (const [from, to] of pairs) {
      const start = date(from);
      expect(start.plus(start.until(to)).toString()).toBe(to);
    }
  });

  it('anchors the returned Duration so total() resolves calendar months and days', () => {
    expect(date('2026-01-01').until('2026-07-01').total('months')).toBe(6);
    expect(date('2026-01-01').until('2027-04-05').total('days')).toBe(459);
  });

  it('measures against a DateTime using its calendar day in its own timezone', () => {
    expect(date('2026-11-16').until(datetime('2026-11-18T23:00', 'Asia/Tokyo'), 'days')).toBe(2);
  });

  it('throws missingDate for undefined input and invalidDate for unparseable strings', () => {
    expect(() => date('2026-01-01').until(undefined)).toThrowError(
      expect.objectContaining({ name: 'TypeError', code: 'missingDate' }),
    );
    expect(() => date('2026-01-01').since('next week')).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'invalidDate', at: 'next week' }),
    );
  });
});

describe('CalendarDate serialization and operators', () => {
  const day = date('2026-11-16');

  it('serializes to YYYY-MM-DD in toString() and toJSON()', () => {
    expect(day.toString()).toBe('2026-11-16');
    expect(day.toJSON()).toBe('2026-11-16');
    expect(date(2026, 1, 5).toString()).toBe('2026-01-05');
  });

  it('coerces to YYYY-MM-DD in JSON.stringify(), template literals, and string concatenation', () => {
    expect(JSON.stringify({ due: day })).toBe('{"due":"2026-11-16"}');
    expect(`${day}`).toBe('2026-11-16');
    expect('Due ' + day).toBe('Due 2026-11-16');
    expect(String(day)).toBe('2026-11-16');
  });

  it('round-trips through toString() and JSON serialization', () => {
    expect(date(day.toString()).equals(day)).toBe(true);
    expect(date(JSON.parse(JSON.stringify({ due: day })).due).equals(day)).toBe(true);
  });

  it('throws unsupportedComparison for relational (<, >) and numeric (-, +, valueOf) coercion', () => {
    const later = date('2026-11-17');
    expect(() => day < later).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'unsupportedComparison', at: '2026-11-16' }),
    );
    expect(() => later > day).toThrowError(
      expect.objectContaining({ code: 'unsupportedComparison', at: '2026-11-17' }),
    );
    expect(() => later - day).toThrowError(
      expect.objectContaining({ code: 'unsupportedComparison', at: '2026-11-17' }),
    );
    expect(() => +day).toThrowError(expect.objectContaining({ code: 'unsupportedComparison', at: '2026-11-16' }));
    expect(() => day.valueOf()).toThrowError(expect.objectContaining({ code: 'unsupportedComparison' }));
  });
});

describe('CalendarDate.toJSDate(), toTemporal(), and as()', () => {
  const day = date('2026-11-16');

  afterEach(() => {
    configure({ zone: null });
  });

  it('converts to a Date at the start of the day in the target timezone', () => {
    expect(day.toJSDate('UTC')).toBeInstanceOf(Date);
    expect(day.toJSDate('UTC').toISOString()).toBe('2026-11-16T00:00:00.000Z');
    expect(day.toJSDate('Asia/Tokyo').toISOString()).toBe('2026-11-15T15:00:00.000Z');
    expect(day.toJSDate('America/Los_Angeles').toISOString()).toBe('2026-11-16T08:00:00.000Z');
  });

  it('uses the configured default timezone in toJSDate() when none is passed', () => {
    configure({ zone: 'Asia/Tokyo' });
    expect(day.toJSDate().toISOString()).toBe('2026-11-15T15:00:00.000Z');
  });

  it('returns a local-midnight Date in toJSDate() when no timezone is passed or configured', () => {
    const local = day.toJSDate();
    expect([local.getFullYear(), local.getMonth() + 1, local.getDate()]).toEqual([2026, 11, 16]);
    expect([local.getHours(), local.getMinutes()]).toEqual([0, 0]);
  });

  it('round-trips through toJSDate(zone) and date(jsDate, zone)', () => {
    expect(date(day.toJSDate('Asia/Tokyo'), 'Asia/Tokyo').equals(day)).toBe(true);
    expect(date(day.toJSDate('America/Los_Angeles'), 'America/Los_Angeles').equals(day)).toBe(true);
  });

  it('returns the underlying Temporal.PlainDate from toTemporal()', () => {
    const plain = day.toTemporal();
    expect(plain).toBeInstanceOf(Temporal.PlainDate);
    expect(plain.toString()).toBe('2026-11-16');
    expect(date(plain).equals(day)).toBe(true);
  });

  it('converts to DateTime, YearMonth, MonthDay, or CalendarDate via as()', () => {
    expect(day.as('datetime', 'UTC').toString()).toBe('2026-11-16T00:00:00.000Z');
    expect(day.as('datetime', 'Asia/Tokyo').toString()).toBe('2026-11-15T15:00:00.000Z');
    expect(day.as('yearMonth').toString()).toBe('2026-11');
    expect(day.as('monthDay').toString()).toBe('11-16');
    expect(day.as('date').toString()).toBe('2026-11-16');
  });

  it("throws unknownKind when converting a CalendarDate via as('time')", () => {
    expect(() => day.as('time')).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'unknownKind', at: 'time' }),
    );
  });
});

describe('date() year-first string parsing with any separator', () => {
  it.each([
    ['Han year, month, and day units', '2026年11月16日'],
    ['unpadded Han units', '2026年1月5日', '2026-01-05'],
    ['Hangul units with spaces', '2026년 11월 16일'],
    ['Korean spaced dots with a closing dot', '2026. 11. 16.'],
    ['spaces', '2026 11 16'],
    ['mixed slash and hyphen', '2026/11-16'],
  ])('parses %s (%j)', (_form, text, expected = '2026-11-16') => {
    expect(date(text).toString()).toBe(expected);
  });

  it('parses long and medium format() output of ja, zh-CN, and ko back to the same date', () => {
    const day = date('2026-11-16');
    for (
      const [locale, preset] of [['ja', 'long'], ['zh-CN', 'long'], ['zh-CN', 'medium'], ['ko', 'long'], [
        'ko',
        'medium',
      ]]
    ) {
      const written = day.format(preset, locale);
      expect(date(written).toString(), written).toBe('2026-11-16');
    }
  });

  it.each(['16年11月2026日', '11/16/2026'])('throws invalidDate for %j, which has no leading year', (text) => {
    expect(() => date(text)).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'invalidDate', at: text }),
    );
  });

  it.each(['2026-W05-1', '2026W051', '2026-Q4-1', '2026x11y16'])(
    'throws invalidDate for %j, where a letter separates the numbers as in ISO weeks and quarters',
    (text) => {
      expect(() => date(text)).toThrowError(
        expect.objectContaining({ name: 'RangeError', code: 'invalidDate', at: text }),
      );
    },
  );
});

describe('date() from Temporal values and strings in another calendar', () => {
  const persian = Temporal.PlainDate.from('2026-11-16').withCalendar('persian');

  it('converts a Persian, Hebrew, or Japanese-era Temporal.PlainDate to the same ISO date', () => {
    const reiwa = Temporal.PlainDate.from({ calendar: 'japanese', era: 'reiwa', eraYear: 8, month: 11, day: 16 });
    for (const plain of [persian, persian.withCalendar('hebrew'), reiwa]) {
      const day = date(plain);
      expect(day).toMatchObject({ year: 2026, month: 11, day: 16 });
      expect(day.toString()).toBe('2026-11-16');
      expect(JSON.stringify(day)).toBe('"2026-11-16"');
    }
  });

  it('formats and calculates with ISO fields after converting a Persian Temporal.PlainDate', () => {
    const day = date(persian);
    expect(day.format('YYYY-MM-DD')).toBe('2026-11-16');
    expect(day.format('medium', 'en-US')).toBe('Nov 16, 2026');
    expect(day.plus(1, 'month').toString()).toBe('2026-12-16');
    expect(date('2026-11-15').until(persian).toString()).toBe('P1D');
  });

  it('converts a Persian Temporal.PlainDateTime and a [u-ca=persian] string to ISO fields', () => {
    expect(date(persian.toPlainDateTime()).toString()).toBe('2026-11-16');
    expect(date('2026-11-16[u-ca=persian]')).toMatchObject({ year: 2026, month: 11, day: 16 });
  });
});

describe('CalendarDate.isWeekend() and isWeekday() by locale', () => {
  const [thursday, friday, saturday, sunday] = ['2026-11-19', '2026-11-20', '2026-11-21', '2026-11-22'].map((day) =>
    date(day)
  );

  afterEach(() => {
    configure({ locale: null });
  });

  it.each([
    ['en-US', [false, false, true, true]],
    ['ar-SA', [false, true, true, false]],
    ['he-IL', [false, true, true, false]],
    ['fa-IR', [false, true, false, false]],
    ['hi-IN', [false, false, false, true]],
  ])('returns the %s weekend days for Thursday through Sunday', (locale, weekend) => {
    const days = [thursday, friday, saturday, sunday].map((day) => day.locale(locale));
    expect(days.map((day) => day.isWeekend())).toEqual(weekend);
    expect(days.map((day) => day.isWeekday())).toEqual(weekend.map((rests) => !rests));
  });

  it('uses configure({ locale }) when the date has no locale', () => {
    configure({ locale: 'ar-EG' });
    expect([friday.isWeekend(), sunday.isWeekend()]).toEqual([true, false]);
  });
});
