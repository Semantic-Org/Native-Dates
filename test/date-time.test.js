import {
  configure,
  date,
  DateTime,
  datetime,
  duration,
  endOfToday,
  monthDay,
  now,
  startOfToday,
  time,
} from 'native-dates';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('datetime() string parsing', () => {
  it('parses a trailing Z as a UTC instant and projects it into the target timezone', () => {
    const standup = datetime('2026-11-16T17:30:00Z', 'America/Los_Angeles');
    expect(standup.toString()).toBe('2026-11-16T17:30:00.000Z');
    expect(standup).toMatchObject({ zone: 'America/Los_Angeles', hour: 9, minute: 30 });
  });

  it('parses lowercase t time separators and lowercase z UTC suffixes', () => {
    const standup = datetime('2026-11-24t09:30:00z', 'America/Los_Angeles');
    expect(standup.toString()).toBe('2026-11-24T09:30:00.000Z');
    expect(standup).toMatchObject({ zone: 'America/Los_Angeles', hour: 1, minute: 30 });
    expect(datetime('2026-11-24T09:30:00z', 'UTC').toString()).toBe('2026-11-24T09:30:00.000Z');
    expect(datetime('2026-11-24t09:30:00Z', 'UTC').toString()).toBe('2026-11-24T09:30:00.000Z');
    expect(datetime('2026-11-24t09:30:00-05:00', 'UTC').toString()).toBe('2026-11-24T14:30:00.000Z');
    expect(datetime('2026-11-24t09:30', 'America/Los_Angeles').toString()).toBe('2026-11-24T17:30:00.000Z');
    expect(datetime('2026-11-24t9:30:00z', 'UTC').toString()).toBe('2026-11-24T09:30:00.000Z');
    expect(datetime('2026-11-24t09:30[America/New_York]')).toMatchObject({
      zone: 'America/New_York',
      hour: 9,
      minute: 30,
    });
  });

  it('parses numeric UTC offsets after a T or space separator', () => {
    expect(datetime('2026-11-16T12:30:00-05:00', 'Asia/Tokyo').toString()).toBe('2026-11-16T17:30:00.000Z');
    expect(datetime('2026-11-16 12:30-05:00', 'Asia/Tokyo').toString()).toBe('2026-11-16T17:30:00.000Z');
  });

  // Postgres formats timestamptz as '2026-11-16 17:30:00+00' and strftime('%z') writes '-0500'
  it('parses hour-only and compact colonless UTC offsets', () => {
    expect(datetime('2026-11-16 17:30:00+00', 'Asia/Tokyo').toString()).toBe('2026-11-16T17:30:00.000Z');
    expect(datetime('2026-11-16 12:30:00-05', 'Asia/Tokyo').toString()).toBe('2026-11-16T17:30:00.000Z');
    expect(datetime('2026-11-16T12:30:00-0500', 'Asia/Tokyo').toString()).toBe('2026-11-16T17:30:00.000Z');
  });

  // in March Europe/Berlin is +01:00 rather than +02:00, so preserving the input offset would read 16:00
  it('uses the explicit timezone argument rather than the input string UTC offset', () => {
    const berlin = datetime('2026-03-07T16:00:00+02:00', 'Europe/Berlin');
    expect(berlin).toMatchObject({ zone: 'Europe/Berlin', offset: '+01:00', hour: 15 });
  });

  it('parses offset-free date-time strings as wall-clock time in the target timezone', () => {
    expect(datetime('2026-11-16T09:30', 'America/Los_Angeles').toString()).toBe('2026-11-16T17:30:00.000Z');
    expect(datetime('2026-11-16 09:30', 'Europe/Berlin').toString()).toBe('2026-11-16T08:30:00.000Z');
  });

  it('parses a date-only string as the start of that day in the target timezone', () => {
    const day = datetime('2026-11-16', 'America/New_York');
    expect(day.toString()).toBe('2026-11-16T05:00:00.000Z');
    expect(day).toMatchObject({ hour: 0, minute: 0, second: 0, millisecond: 0 });
  });

  it('parses slash-separated year-first dates with single-digit hours', () => {
    expect(datetime('2026/11/06 9:00', 'Asia/Tokyo').toString()).toBe('2026-11-06T00:00:00.000Z');
  });

  it('preserves a bracketed IANA timezone annotation when no timezone argument is passed', () => {
    const meeting = datetime('2026-11-16T09:30[America/New_York]');
    expect(meeting.zone).toBe('America/New_York');
    expect(meeting.toString()).toBe('2026-11-16T14:30:00.000Z');
  });

  it('converts a bracketed IANA timezone string into the target timezone while preserving the instant', () => {
    const meeting = datetime('2026-11-16T09:30[America/New_York]', 'Europe/Berlin');
    expect(meeting.toString()).toBe('2026-11-16T14:30:00.000Z');
    expect(meeting).toMatchObject({ zone: 'Europe/Berlin', hour: 15, minute: 30 });
  });

  // at 01:30 on 2026-11-01 New York repeats the hour, disambiguated by the -04:00 vs -05:00 offset
  it('parses Temporal.ZonedDateTime strings containing both an offset and a bracketed timezone', () => {
    const meeting = datetime('2026-11-16T09:30:00-05:00[America/New_York]');
    expect(meeting.zone).toBe('America/New_York');
    expect(meeting.toString()).toBe('2026-11-16T14:30:00.000Z');
    expect(datetime('2026-11-01T01:30:00-04:00[America/New_York]').toString()).toBe('2026-11-01T05:30:00.000Z');
    expect(datetime('2026-11-01T01:30:00-05:00[America/New_York]').toString()).toBe('2026-11-01T06:30:00.000Z');
  });

  it('trims leading and trailing whitespace before parsing', () => {
    expect(datetime(' 2026-11-16T17:30:00Z\n', 'UTC').toString()).toBe('2026-11-16T17:30:00.000Z');
  });

  it('preserves microsecond and nanosecond fractional seconds', () => {
    const precise = datetime('2026-11-16T17:30:00.123456789Z', 'UTC');
    expect(precise).toMatchObject({ millisecond: 123, microsecond: 456, nanosecond: 789 });
  });

  // New York skips 02:00-03:00 on 2026-03-08 and repeats 01:00-02:00 on 2026-11-01
  it('advances wall-clock strings skipped by a spring-forward DST transition', () => {
    const skipped = datetime('2026-03-08T02:30', 'America/New_York');
    expect(skipped).toMatchObject({ day: 8, hour: 3, minute: 30, offset: '-04:00' });
  });

  it('selects the earlier instant when a wall-clock string falls in a repeated fall-back DST hour', () => {
    const repeated = datetime('2026-11-01T01:30', 'America/New_York');
    expect(repeated.toString()).toBe('2026-11-01T05:30:00.000Z');
    expect(repeated.offset).toBe('-04:00');
  });
});

describe('datetime() numbers, Dates, and field objects', () => {
  it('interprets a number as Unix epoch milliseconds', () => {
    expect(datetime(1794850200000, 'Asia/Tokyo').toString()).toBe('2026-11-16T17:30:00.000Z');
  });

  it('handles 0 and negative Unix epoch milliseconds', () => {
    expect(datetime(0, 'UTC').toString()).toBe('1970-01-01T00:00:00.000Z');
    expect(datetime(-86400000, 'UTC').toString()).toBe('1969-12-31T00:00:00.000Z');
  });

  it('truncates fractional milliseconds to match Date', () => {
    expect(datetime(1794850200000.9, 'UTC').epochMilliseconds).toBe(new Date(1794850200000.9).getTime());
  });

  it('converts a Date instance at the same instant', () => {
    const stamp = new Date('2026-11-16T17:30:00.250Z');
    expect(datetime(stamp, 'Asia/Tokyo').toString()).toBe('2026-11-16T17:30:00.250Z');
  });

  it('interprets a fields object with 1-indexed months as wall-clock time in the target timezone', () => {
    const standup = datetime({ year: 2026, month: 11, day: 16, hour: 9, minute: 30 }, 'Europe/Berlin');
    expect(standup.toString()).toBe('2026-11-16T08:30:00.000Z');
  });

  it('defaults omitted clock fields in a fields object to midnight', () => {
    expect(datetime({ year: 2026, month: 11, day: 16 }, 'Asia/Tokyo').toString()).toBe('2026-11-15T15:00:00.000Z');
  });

  it('converts a CalendarDate to the start of that day in the target timezone', () => {
    expect(datetime(date('2026-11-16'), 'America/New_York').toString()).toBe('2026-11-16T05:00:00.000Z');
  });
});

describe('datetime() from DateTime and Temporal instances', () => {
  const berlin = Temporal.ZonedDateTime.from('2026-11-16T18:30:00+01:00[Europe/Berlin]');

  it('preserves the timezone of an existing DateTime when no timezone argument is passed', () => {
    const tokyo = datetime('2026-11-16T09:30', 'Asia/Tokyo');
    expect(datetime(tokyo)).toMatchObject({ zone: 'Asia/Tokyo', hour: 9, minute: 30 });
  });

  it('projects an existing DateTime into a new timezone without changing its instant', () => {
    const tokyo = datetime('2026-11-16T09:30', 'Asia/Tokyo');
    const viewed = datetime(tokyo, 'America/Los_Angeles');
    expect(viewed.toString()).toBe(tokyo.toString());
    expect(viewed).toMatchObject({ zone: 'America/Los_Angeles', day: 15, hour: 16 });
  });

  it('preserves the timezone of a Temporal.ZonedDateTime when no timezone argument is passed', () => {
    expect(datetime(berlin)).toMatchObject({ zone: 'Europe/Berlin', hour: 18, minute: 30 });
  });

  it('projects a Temporal.ZonedDateTime into a new timezone without changing its instant', () => {
    const viewed = datetime(berlin, 'America/Los_Angeles');
    expect(viewed.toString()).toBe('2026-11-16T17:30:00.000Z');
    expect(viewed).toMatchObject({ zone: 'America/Los_Angeles', hour: 9 });
  });

  it('projects a Temporal.Instant into the target timezone', () => {
    const standup = datetime(Temporal.Instant.from('2026-11-16T17:30:00Z'), 'America/Los_Angeles');
    expect(standup.toString()).toBe('2026-11-16T17:30:00.000Z');
    expect(standup).toMatchObject({ zone: 'America/Los_Angeles', hour: 9 });
  });

  it('interprets a Temporal.PlainDateTime as wall-clock time in the target timezone', () => {
    const standup = datetime(Temporal.PlainDateTime.from('2026-11-16T09:30'), 'America/Los_Angeles');
    expect(standup.toString()).toBe('2026-11-16T17:30:00.000Z');
  });

  it('converts a Temporal.PlainDate to the start of that day in the target timezone', () => {
    const day = datetime(Temporal.PlainDate.from('2026-11-16'), 'America/Los_Angeles');
    expect(day.toString()).toBe('2026-11-16T08:00:00.000Z');
  });
});

describe('datetime() timezone resolution', () => {
  afterEach(() => {
    configure({ zone: null });
  });

  it('defaults to the host runtime timezone when none is passed or configured', () => {
    const local = datetime('2026-11-16T09:30');
    expect(local.zone).toBe(Intl.DateTimeFormat().resolvedOptions().timeZone);
    expect(local).toMatchObject({ hour: 9, minute: 30 });
  });

  it('uses the configured timezone when no timezone argument is passed', () => {
    configure({ zone: 'Asia/Tokyo' });
    expect(datetime('2026-11-16T09:30').toString()).toBe('2026-11-16T00:30:00.000Z');
    expect(datetime('2026-11-16T00:30:00Z')).toMatchObject({ zone: 'Asia/Tokyo', hour: 9, minute: 30 });
    expect(datetime(1794850200000).zone).toBe('Asia/Tokyo');
  });

  it('prioritizes an explicit timezone argument over a bracketed timezone and configure()', () => {
    configure({ zone: 'Asia/Tokyo' });
    expect(datetime('2026-11-16T09:30', 'Europe/Berlin').zone).toBe('Europe/Berlin');
    expect(datetime('2026-11-16T09:30[America/New_York]').zone).toBe('America/New_York');
    expect(datetime('2026-11-16T09:30[America/New_York]', 'Europe/Berlin').zone).toBe('Europe/Berlin');
  });

  it('accepts the timezone via an options object { zone }', () => {
    const standup = datetime('2026-11-16T09:30', { zone: 'America/Los_Angeles' });
    expect(standup.zone).toBe('America/Los_Angeles');
    expect(standup.toString()).toBe('2026-11-16T17:30:00.000Z');
  });

  // adding 1 day in New York across 2026-03-08 shifts to 13:00 UTC instead of 14:00 UTC
  it('accepts a fixed UTC offset as the timezone without DST adjustments', () => {
    const fixed = datetime('2026-03-07T09:00', '-05:00');
    expect(fixed).toMatchObject({ zone: '-05:00', offset: '-05:00' });
    expect(fixed.plus(1, 'day').toString()).toBe('2026-03-08T14:00:00.000Z');
  });

  it('normalizes case-insensitive IANA timezone identifiers to canonical casing', () => {
    expect(datetime('2026-11-16T09:30', 'america/new_york').zone).toBe('America/New_York');
    expect(datetime('2026-11-16T09:30', 'utc').zone).toBe('UTC');
  });

  it('constructs identical instances via new DateTime() and datetime()', () => {
    const built = new DateTime('2026-11-16T09:30', 'America/Los_Angeles');
    expect(built.toString()).toBe('2026-11-16T17:30:00.000Z');
    expect(built.zone).toBe('America/Los_Angeles');
  });
});

describe('datetime() validation errors', () => {
  it('throws a TypeError with missingDateTime for null and undefined', () => {
    expect(() => datetime(null)).toThrowError(
      expect.objectContaining({ name: 'TypeError', code: 'missingDateTime', at: 'null' }),
    );
    expect(() => datetime(undefined)).toThrowError(
      expect.objectContaining({ name: 'TypeError', code: 'missingDateTime', at: 'undefined' }),
    );
  });

  it('throws a TypeError with invalidDateTime for booleans and arrays', () => {
    expect(() => datetime(true)).toThrowError(
      expect.objectContaining({ name: 'TypeError', code: 'invalidDateTime', at: 'true' }),
    );
    expect(() => datetime([2026, 11, 16])).toThrowError(
      expect.objectContaining({ name: 'TypeError', code: 'invalidDateTime', at: '2026,11,16' }),
    );
  });

  it.each([
    ['non-timestamp text', 'not a timestamp'],
    ['an empty string', ''],
    ['a time-only string', '09:30'],
    ['an RFC 2822 string without the loose plugin', 'Mon, 16 Nov 2026 17:30:00 GMT'],
  ])('throws invalidDateTime for %s', (_, text) => {
    expect(() => datetime(text, 'UTC')).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'invalidDateTime', at: text }),
    );
  });

  it('throws invalidDateTime for ambiguous month-first date strings', () => {
    expect(() => datetime('03/05/2026', 'UTC')).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'invalidDateTime', at: '03/05/2026' }),
    );
  });

  it('throws invalidDateTime for out-of-range calendar dates', () => {
    expect(() => datetime('2026-02-30T10:00', 'UTC')).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'invalidDateTime', at: '2026-02-30T10:00' }),
    );
    expect(() => datetime({ year: 2026, month: 2, day: 30 }, 'UTC')).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'invalidDateTime', at: '{"year":2026,"month":2,"day":30}' }),
    );
    let upper;
    let lower;
    try {
      datetime('2026-02-30T10:00:00Z', 'UTC');
    }
    catch (error) {
      upper = error;
    }
    try {
      datetime('2026-02-30t10:00:00z', 'UTC');
    }
    catch (error) {
      lower = error;
    }
    expect(lower).toMatchObject({ name: 'RangeError', code: 'invalidDateTime', at: '2026-02-30t10:00:00z' });
    expect(lower.message.split('\n')[1]).toBe(upper.message.split('\n')[1]);
  });

  it('throws invalidDateTime when day is omitted from a fields object', () => {
    expect(() => datetime({ year: 2026, month: 2 }, 'UTC')).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'invalidDateTime', at: '{"year":2026,"month":2}' }),
    );
  });

  it('throws invalidDateTime when a string UTC offset conflicts with its bracketed IANA timezone', () => {
    const text = '2026-11-16T09:30-08:00[America/New_York]';
    expect(() => datetime(text)).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'invalidDateTime', at: text }),
    );
  });

  it('reports an offset or zone mismatch instead of a syntax error for invalid bracketed timezone strings', () => {
    for (
      const [text, options] of [
        ['2026-03-08T12:00:00-05:00[America/New_York]'],
        ['2026-03-08t12:00:00-05:00[America/New_York]'],
        ['2026-03-08T12:00:00-0500[America/New_York]'],
        ['2026-03-08T12:00:00-05[America/New_York]'],
        ['2026-03-08T02:30[America/New_York]', { disambiguation: 'reject' }],
        ['2026-02-30T10:00[America/New_York]'],
        ['2026-11-16T09:30[Mars/Phobos]'],
      ]
    ) {
      let thrown;
      try {
        datetime(text, options);
      }
      catch (error) {
        thrown = error;
      }
      expect(thrown).toMatchObject({ name: 'RangeError', code: 'invalidDateTime', at: text });
      const detail = thrown.message.split('\n')[1];
      expect(detail).toMatch(/offset|zone/i);
      expect(detail).not.toMatch(/expected an ISO string/i);
    }
  });

  it('throws invalidNumber for NaN, Infinity, and an invalid Date', () => {
    expect(() => datetime(NaN)).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'invalidNumber', at: 'NaN' }),
    );
    expect(() => datetime(Infinity)).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'invalidNumber', at: 'Infinity' }),
    );
    expect(() => datetime(new Date('not a date'))).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'invalidNumber', at: 'Invalid Date' }),
    );
  });

  it('throws unknownZone for an unrecognized or non-string timezone', () => {
    expect(() => datetime('2026-11-16T09:30', 'Mars/Phobos')).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'unknownZone', at: 'Mars/Phobos' }),
    );
    expect(() => datetime('2026-11-16T09:30', 5)).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'unknownZone', at: '5' }),
    );
  });
});

describe('now(), startOfToday(), and endOfToday()', () => {
  // at 17:30:00.250Z on Monday Nov 16 it is 09:30 in America/Los_Angeles and Tuesday 02:30 in Asia/Tokyo
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-16T17:30:00.250Z'));
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns the current instant to millisecond precision', () => {
    expect(now('UTC').toString()).toBe('2026-11-16T17:30:00.250Z');
  });

  it('projects the current instant into the target timezone', () => {
    expect(now('Asia/Tokyo')).toMatchObject({ zone: 'Asia/Tokyo', day: 17, hour: 2, minute: 30 });
  });

  it('returns midnight at the start of the current day in the target timezone', () => {
    expect(startOfToday('America/Los_Angeles').toString()).toBe('2026-11-16T08:00:00.000Z');
    expect(startOfToday('Asia/Tokyo').toString()).toBe('2026-11-16T15:00:00.000Z');
  });

  it('returns the final millisecond of the current day in the target timezone', () => {
    expect(endOfToday('America/Los_Angeles').toString()).toBe('2026-11-17T07:59:59.999Z');
    expect(endOfToday('Asia/Tokyo').toString()).toBe('2026-11-17T14:59:59.999Z');
  });

  it('throws unknownZone for an unrecognized timezone', () => {
    expect(() => now('Mars/Phobos')).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'unknownZone', at: 'Mars/Phobos' }),
    );
  });
});

describe('now() system clock precision', () => {
  // Temporal.Now provides sub-millisecond digits that Date and millisecond ISO strings truncate
  it('truncates sub-millisecond digits so JSON round-tripping is lossless', () => {
    const current = now('Asia/Tokyo');
    expect(current).toMatchObject({ microsecond: 0, nanosecond: 0 });
    expect(datetime(JSON.parse(JSON.stringify(current))).equals(current)).toBe(true);
  });
});

describe('DateTime properties', () => {
  const standup = datetime('2026-11-16T09:30:15.250', 'America/Los_Angeles');

  it('exposes calendar and wall-clock fields in the instance timezone', () => {
    expect(standup).toMatchObject({
      year: 2026,
      month: 11,
      day: 16,
      hour: 9,
      minute: 30,
      second: 15,
      millisecond: 250,
      zone: 'America/Los_Angeles',
    });
    expect(standup.in('Asia/Tokyo')).toMatchObject({ day: 17, hour: 2, minute: 30 });
  });

  it('returns the UTC offset active at the instant across DST and half-hour zones', () => {
    expect(datetime('2026-01-15T12:00', 'America/New_York').offset).toBe('-05:00');
    expect(datetime('2026-07-15T12:00', 'America/New_York').offset).toBe('-04:00');
    expect(datetime('2026-07-15T12:00', 'Asia/Kolkata').offset).toBe('+05:30');
    expect(datetime('2026-07-15T12:00', 'UTC').offset).toBe('+00:00');
  });

  it('computes epochSeconds, epochMilliseconds, and epochNanoseconds', () => {
    const stamp = datetime('2026-11-16T17:30:00.250Z', 'Asia/Tokyo');
    expect(stamp.epochSeconds).toBe(1794850200);
    expect(stamp.epochMilliseconds).toBe(1794850200250);
    expect(stamp.epochNanoseconds).toBe(1794850200250000000n);
  });

  it('floors epochSeconds for timestamps before and after 1970', () => {
    expect(datetime('2026-11-16T17:30:00.999Z').epochSeconds).toBe(1794850200);
    expect(datetime('1969-12-31T23:59:59.500Z').epochSeconds).toBe(-1);
  });

  // at 02:00 UTC on Monday Nov 16 it is Sunday evening in America/Los_Angeles
  it('returns ISO dayOfWeek from 1 (Monday) to 7 (Sunday) in the instance timezone', () => {
    const instant = datetime('2026-11-16T02:00:00Z', 'UTC');
    expect(instant.dayOfWeek).toBe(1);
    expect(instant.in('America/Los_Angeles').dayOfWeek).toBe(7);
  });

  it('exposes quarter, dayOfYear, and ISO weekOfYear', () => {
    expect(standup).toMatchObject({ quarter: 4, dayOfYear: 320, weekOfYear: 47 });
    expect(datetime('2026-01-01T12:00', 'UTC')).toMatchObject({ quarter: 1, dayOfYear: 1, weekOfYear: 1 });
  });

  it('maps months 1-12 to quarters 1-4', () => {
    const months = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
    const quarters = months.map((month) => datetime({ year: 2026, month, day: 15 }, 'UTC').quarter);
    expect(quarters).toEqual([1, 1, 1, 2, 2, 2, 3, 3, 3, 4, 4, 4]);
  });

  it('assigns early January days to week 53 of the previous ISO year when applicable', () => {
    expect(datetime('2027-01-01T12:00', 'UTC').weekOfYear).toBe(53);
  });

  it('computes daysInMonth, daysInYear, and identifies leap years', () => {
    const leap = datetime('2028-02-10T12:00', 'UTC');
    const common = datetime('2026-02-10T12:00', 'UTC');
    expect(leap).toMatchObject({ daysInMonth: 29, daysInYear: 366 });
    expect(common).toMatchObject({ daysInMonth: 28, daysInYear: 365 });
    expect(leap.isLeapYear()).toBe(true);
    expect(common.isLeapYear()).toBe(false);
  });

  it('computes 23, 24, or 25 for hoursInDay across DST transitions', () => {
    expect(datetime('2026-03-08T12:00', 'America/New_York').hoursInDay).toBe(23);
    expect(datetime('2026-03-09T12:00', 'America/New_York').hoursInDay).toBe(24);
    expect(datetime('2026-11-01T12:00', 'America/New_York').hoursInDay).toBe(25);
  });

  // at 03:00 UTC on Saturday Nov 14 it is Friday evening in America/Los_Angeles
  it('evaluates isWeekend() and isWeekday() in the instance timezone', () => {
    const instant = datetime('2026-11-14T03:00:00Z', 'UTC');
    expect(instant.isWeekend()).toBe(true);
    expect(instant.isWeekday()).toBe(false);
    expect(instant.in('America/Los_Angeles').isWeekend()).toBe(false);
    expect(instant.in('America/Los_Angeles').isWeekday()).toBe(true);
  });

  it('identifies Sunday as a weekend day and Monday as a weekday', () => {
    const sunday = datetime('2026-11-15T12:00', 'UTC');
    const monday = sunday.plus(1, 'day');
    expect(sunday.isWeekend()).toBe(true);
    expect(sunday.isWeekday()).toBe(false);
    expect(monday.isWeekend()).toBe(false);
    expect(monday.isWeekday()).toBe(true);
  });

  it('exposes date, time, yearMonth, and monthDay projections in the instance timezone', () => {
    const tokyo = datetime('2026-12-31T20:00:15Z', 'Asia/Tokyo');
    expect(tokyo.date.toString()).toBe('2027-01-01');
    expect(tokyo.time.toString()).toBe('05:00:15');
    expect(tokyo.yearMonth.toString()).toBe('2027-01');
    expect(tokyo.monthDay.toString()).toBe('01-01');
  });

  it('converts via as() to date, time, yearMonth, monthDay, and datetime', () => {
    const tokyo = datetime('2026-11-16T09:30', 'America/Los_Angeles').in('Asia/Tokyo');
    expect(tokyo.as('date').toString()).toBe('2026-11-17');
    expect(tokyo.as('time').toString()).toBe('02:30:00');
    expect(tokyo.as('yearMonth').toString()).toBe('2026-11');
    expect(tokyo.as('monthDay').toString()).toBe('11-17');
    expect(tokyo.as('datetime').toString()).toBe('2026-11-16T17:30:00.000Z');
  });

  it('throws unknownKind for an unrecognized as() target', () => {
    expect(() => standup.as('week')).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'unknownKind', at: 'week' }),
    );
  });

  it('freezes DateTime instances against in-place mutation', () => {
    expect(Object.isFrozen(standup)).toBe(true);
    expect(() => {
      standup.hour = 17;
    }).toThrowError(TypeError);
    expect(standup.hour).toBe(9);
  });
});

describe('DateTime.in()', () => {
  const standup = datetime('2026-11-16T09:30', 'America/Los_Angeles');

  it('projects the same instant into another timezone', () => {
    const berlin = standup.in('Europe/Berlin');
    expect(berlin).toMatchObject({ zone: 'Europe/Berlin', offset: '+01:00', hour: 18, minute: 30 });
    expect(berlin.toString()).toBe(standup.toString());
    expect(berlin.equals(standup)).toBe(true);
  });

  it('updates calendar day and dayOfWeek when the target timezone crosses midnight', () => {
    expect(standup.in('Asia/Tokyo')).toMatchObject({ day: 17, hour: 2, dayOfWeek: 2 });
  });

  it('returns a new DateTime without mutating the receiver', () => {
    standup.in('Europe/Berlin');
    expect(standup).toMatchObject({ zone: 'America/Los_Angeles', hour: 9 });
  });

  it('throws unknownZone for an unrecognized timezone', () => {
    expect(() => standup.in('Mars/Phobos')).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'unknownZone', at: 'Mars/Phobos' }),
    );
  });
});

describe('DateTime.at()', () => {
  const morning = datetime('2026-11-16T09:30:15.250', 'America/Los_Angeles');

  it('replaces the wall-clock time while preserving the calendar day and timezone', () => {
    const wrapUp = morning.at('5:00pm');
    expect(wrapUp.toString()).toBe('2026-11-17T01:00:00.000Z');
    expect(wrapUp).toMatchObject({ zone: 'America/Los_Angeles', day: 16, hour: 17, minute: 0 });
  });

  it('accepts time strings, Time instances, and time field objects', () => {
    expect(morning.at('17:45').toString()).toBe('2026-11-17T01:45:00.000Z');
    expect(morning.at(time('17:45')).toString()).toBe('2026-11-17T01:45:00.000Z');
    expect(morning.at({ hour: 17, minute: 45 }).toString()).toBe('2026-11-17T01:45:00.000Z');
  });

  // 20:15 UTC is 12:15 in Los Angeles and 05:15 the next day in Tokyo, so one of the two differs from any host timezone
  it('reads the time of day of a Date, ISO instant string, or Temporal.Instant in the instance timezone', () => {
    const lunch = new Date('2026-11-16T20:15:00Z');
    const earlyTokyo = datetime('2026-11-17T02:30', 'Asia/Tokyo');
    expect(morning.at(lunch).toString()).toBe('2026-11-16T20:15:00.000Z');
    expect(earlyTokyo.at(lunch).toString()).toBe('2026-11-16T20:15:00.000Z');
    expect(morning.at('2026-11-16T20:15:00Z').toString()).toBe('2026-11-16T20:15:00.000Z');
    expect(earlyTokyo.at(Temporal.Instant.from('2026-11-16T20:15:00Z')).toString()).toBe('2026-11-16T20:15:00.000Z');
  });

  it('keeps the clock time of a DateTime from another timezone and of a Temporal.PlainTime', () => {
    const tokyoDawn = datetime('2026-11-17T05:15', 'Asia/Tokyo');
    expect(morning.at(tokyoDawn)).toMatchObject({ zone: 'America/Los_Angeles', day: 16, hour: 5, minute: 15 });
    expect(morning.at(tokyoDawn.toTemporal())).toMatchObject({ day: 16, hour: 5, minute: 15 });
    expect(morning.at(Temporal.PlainTime.from('08:00')).toString()).toBe('2026-11-16T16:00:00.000Z');
  });

  // at 02:30 on Nov 17 in Asia/Tokyo it is still Nov 16 in UTC
  it('preserves the calendar day in the instance timezone rather than UTC', () => {
    const earlyTokyo = datetime('2026-11-17T02:30', 'Asia/Tokyo');
    expect(earlyTokyo.at('9am').toString()).toBe('2026-11-17T00:00:00.000Z');
  });

  it('advances a wall-clock time skipped by a spring-forward DST transition', () => {
    const springForward = datetime('2026-03-08T12:00', 'America/New_York');
    expect(springForward.at('2:30am')).toMatchObject({ day: 8, hour: 3, minute: 30 });
  });

  it('throws invalidTime for out-of-range clock values', () => {
    expect(() => morning.at('25:00')).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'invalidTime', at: '25:00' }),
    );
  });
});

describe('DateTime.set()', () => {
  const cutoff = datetime('2026-11-16T09:30:15.250', 'America/New_York');

  it('replaces a single field by unit name and preserves other fields', () => {
    expect(cutoff.set('hour', 17).toString()).toBe('2026-11-16T22:30:15.250Z');
    expect(cutoff.set('day', 2).toString()).toBe('2026-11-02T14:30:15.250Z');
  });

  it('replaces multiple fields from an object', () => {
    const firstOfDecember = cutoff.set({ month: 12, day: 1, hour: 0, minute: 0 });
    expect(firstOfDecember.toString()).toBe('2026-12-01T05:00:15.250Z');
  });

  it('accepts singular and plural unit names', () => {
    expect(cutoff.set('hours', 17).toString()).toBe('2026-11-16T22:30:15.250Z');
  });

  it('interprets updated fields in the instance timezone', () => {
    expect(cutoff.set('hour', 17)).toMatchObject({ zone: 'America/New_York', hour: 17, offset: '-05:00' });
  });

  it('throws cannotSet for an out-of-range day of the month', () => {
    expect(() => cutoff.set({ month: 2, day: 30 })).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'cannotSet', at: '{"month":2,"day":30}' }),
    );
  });

  it('throws cannotSet for fractional and out-of-range clock values', () => {
    expect(() => cutoff.set('hour', 9.5)).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'cannotSet', at: '{"hour":9.5}' }),
    );
    expect(() => cutoff.set('hour', 24)).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'cannotSet', at: '{"hour":24}' }),
    );
  });

  it('throws unknownUnit for an unrecognized unit', () => {
    expect(() => cutoff.set('fortnight', 2)).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'unknownUnit', at: 'fortnight' }),
    );
  });

  it('advances an hour skipped by a spring-forward DST transition', () => {
    const springForward = datetime('2026-03-08T12:30', 'America/New_York');
    expect(springForward.set('hour', 2)).toMatchObject({ day: 8, hour: 3, minute: 30 });
  });

  // at 06:30 UTC on 2026-11-01 New York is in the second 01:30 hour after fall-back
  it('preserves the DST disambiguation offset when updating minutes inside a repeated hour', () => {
    const secondHalfPastOne = datetime('2026-11-01T06:30:00Z', 'America/New_York');
    expect(secondHalfPastOne.set('minute', 45).toString()).toBe('2026-11-01T06:45:00.000Z');
  });

  it('constrains the day to month-end when set() updates month or year on day 31', () => {
    const lastOfJanuary = datetime('2026-01-31T09:00', 'UTC');
    expect(lastOfJanuary.set('month', 2).toString()).toBe('2026-02-28T09:00:00.000Z');
    expect(lastOfJanuary.set('month', 4).toString()).toBe('2026-04-30T09:00:00.000Z');
    expect(lastOfJanuary.set({ year: 2028, month: 2 }).toString()).toBe('2028-02-29T09:00:00.000Z');
  });
});

describe('DateTime.plus() and minus()', () => {
  // New York springs forward on 2026-03-08 and falls back on 2026-11-01
  const saturday = datetime('2026-03-07T09:00', 'America/New_York');
  const halloween = datetime('2026-10-31T09:00', 'America/New_York');

  it('preserves wall-clock time when adding calendar days across DST transitions', () => {
    expect(saturday.plus(1, 'day')).toMatchObject({ day: 8, hour: 9, offset: '-04:00' });
    expect(halloween.plus(1, 'day')).toMatchObject({ day: 1, hour: 9, offset: '-05:00' });
  });

  it('adds exact elapsed time when adding hours across DST transitions', () => {
    expect(saturday.plus(24, 'hours')).toMatchObject({ day: 8, hour: 10 });
    expect(halloween.plus(24, 'hours')).toMatchObject({ day: 1, hour: 8 });
  });

  it('preserves wall-clock time when adding weeks, months, and years', () => {
    const wednesday = datetime('2026-03-04T09:00', 'America/New_York');
    expect(wednesday.plus(1, 'week').toString()).toBe('2026-03-11T13:00:00.000Z');
    expect(wednesday.plus(1, 'month').toString()).toBe('2026-04-04T13:00:00.000Z');
    expect(wednesday.plus(1, 'year').toString()).toBe('2027-03-04T14:00:00.000Z');
  });

  it('accepts unit pairs, duration phrases, ISO durations, field objects, Durations, and milliseconds', () => {
    const later = '2026-03-07T15:30:00.000Z';
    expect(saturday.plus(90, 'minutes').toString()).toBe(later);
    expect(saturday.plus('1h 30m').toString()).toBe(later);
    expect(saturday.plus('PT90M').toString()).toBe(later);
    expect(saturday.plus({ hours: 1, minutes: 30 }).toString()).toBe(later);
    expect(saturday.plus(duration('1h 30m')).toString()).toBe(later);
    expect(saturday.plus(5400000).toString()).toBe(later);
  });

  it('adds calendar days and elapsed clock hours in a mixed duration object', () => {
    expect(saturday.plus({ days: 1, hours: 4 })).toMatchObject({ day: 8, hour: 13 });
  });

  it("distinguishes uppercase 'M' (months) from lowercase 'm' (minutes)", () => {
    expect(saturday.plus(1, 'M').toString()).toBe('2026-04-07T13:00:00.000Z');
    expect(saturday.plus(1, 'm').toString()).toBe('2026-03-07T14:01:00.000Z');
  });

  it('reverses direction for negative amounts', () => {
    expect(saturday.plus(-1, 'day').toString()).toBe('2026-03-06T14:00:00.000Z');
    expect(saturday.minus(-1, 'day').toString()).toBe('2026-03-08T13:00:00.000Z');
  });

  it('constrains month-end dates to the last day of shorter target months', () => {
    expect(datetime('2026-01-31T09:00', 'UTC').plus(1, 'month').toString()).toBe('2026-02-28T09:00:00.000Z');
    expect(datetime('2028-01-31T09:00', 'UTC').plus(1, 'month').toString()).toBe('2028-02-29T09:00:00.000Z');
    expect(datetime('2026-03-31T09:00', 'UTC').minus(1, 'month').toString()).toBe('2026-02-28T09:00:00.000Z');
    expect(datetime('2028-02-29T09:00', 'UTC').plus(1, 'year').toString()).toBe('2029-02-28T09:00:00.000Z');
  });

  it('subtracts hours and calendar field objects via minus()', () => {
    const deadline = datetime('2026-11-16T17:00', 'America/New_York');
    expect(deadline.minus(48, 'hours').toString()).toBe('2026-11-14T22:00:00.000Z');
    expect(deadline.minus({ weeks: 1, days: 2 }).toString()).toBe('2026-11-07T22:00:00.000Z');
    expect(saturday.plus(1, 'day').minus(1, 'day').toString()).toBe(saturday.toString());
  });

  it('aliases add() and subtract() to plus() and minus()', () => {
    expect(saturday.add(1, 'day').toString()).toBe(saturday.plus(1, 'day').toString());
    expect(saturday.subtract(90, 'minutes').toString()).toBe(saturday.minus(90, 'minutes').toString());
  });

  it('returns a new DateTime without mutating the original', () => {
    const later = saturday.plus(1, 'day');
    expect(later).not.toBe(saturday);
    expect(saturday.toString()).toBe('2026-03-07T14:00:00.000Z');
  });

  it('advances wall-clock times that land inside a spring-forward DST gap, and supports explicit disambiguation', () => {
    const earlySaturday = datetime('2026-03-07T02:30', 'America/New_York');
    expect(earlySaturday.plus(1, 'day')).toMatchObject({ day: 8, hour: 3, minute: 30 });

    // spring-forward gap in New York on 2026-03-08 (02:00 jumps to 03:00)
    expect(datetime('2026-03-08T02:30', { zone: 'America/New_York', disambiguation: 'earlier' })).toMatchObject({
      hour: 1,
      minute: 30,
      offset: '-05:00',
    });
    expect(datetime('2026-03-08T02:30', { zone: 'America/New_York', disambiguation: 'later' })).toMatchObject({
      hour: 3,
      minute: 30,
      offset: '-04:00',
    });
    expect(() => datetime('2026-03-08T02:30', { zone: 'America/New_York', disambiguation: 'reject' })).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'invalidDateTime' }),
    );
    expect(() => date('2026-03-08').at('02:30', { zone: 'America/New_York', disambiguation: 'reject' })).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'invalidDateTime' }),
    );
    expect(() => time('02:30').on('2026-03-08', { zone: 'America/New_York', disambiguation: 'reject' })).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'invalidDateTime' }),
    );

    // fall-back fold in New York on 2026-11-01 (01:00..02:00 repeats from -04:00 to -05:00)
    expect(datetime('2026-11-01T01:30', { zone: 'America/New_York', disambiguation: 'earlier' }).offset).toBe('-04:00');
    expect(datetime('2026-11-01T01:30', { zone: 'America/New_York', disambiguation: 'later' }).offset).toBe('-05:00');
    expect(datetime('2026-11-01T12:00', 'America/New_York').at('01:30', { disambiguation: 'later' }).offset).toBe(
      '-05:00',
    );
    expect(datetime('2026-11-01T12:00', 'America/New_York').at('09:00', { zone: 'Asia/Tokyo' }).zone).toBe(
      'America/New_York',
    );
    expect(() => datetime('2026-11-01T01:30', { zone: 'America/New_York', disambiguation: 'reject' })).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'invalidDateTime' }),
    );
    expect(() => datetime('2026-11-01T12:00', { zone: 'America/New_York', disambiguation: 'bogus' })).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'unknownDisambiguation', at: 'bogus' }),
    );
  });

  it('throws a TypeError with invalidDuration for null or undefined amounts', () => {
    expect(() => saturday.plus(null)).toThrowError(
      expect.objectContaining({ name: 'TypeError', code: 'invalidDuration', at: 'null' }),
    );
    expect(() => saturday.minus(undefined)).toThrowError(
      expect.objectContaining({ name: 'TypeError', code: 'invalidDuration', at: 'undefined' }),
    );
  });

  it('throws unknownUnit for an unrecognized unit', () => {
    expect(() => saturday.plus(1, 'fortnight')).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'unknownUnit', at: 'fortnight' }),
    );
  });

  it('throws cannotAdd and cannotSubtract when exceeding Temporal ZonedDateTime bounds', () => {
    expect(() => saturday.plus(1e9, 'years')).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'cannotAdd', at: '1000000000 years' }),
    );
    expect(() => saturday.minus(1e9, 'years')).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'cannotSubtract', at: '1000000000 years' }),
    );
  });
});

describe('DateTime.startOf() and endOf()', () => {
  const wednesday = datetime('2026-11-18T14:45:12.345', 'UTC');

  it.each([
    ['year', '2026-01-01T00:00:00.000Z', '2026-12-31T23:59:59.999Z'],
    ['quarter', '2026-10-01T00:00:00.000Z', '2026-12-31T23:59:59.999Z'],
    ['month', '2026-11-01T00:00:00.000Z', '2026-11-30T23:59:59.999Z'],
    ['day', '2026-11-18T00:00:00.000Z', '2026-11-18T23:59:59.999Z'],
    ['hour', '2026-11-18T14:00:00.000Z', '2026-11-18T14:59:59.999Z'],
    ['minute', '2026-11-18T14:45:00.000Z', '2026-11-18T14:45:59.999Z'],
    ['second', '2026-11-18T14:45:12.000Z', '2026-11-18T14:45:12.999Z'],
  ])('returns the first and final millisecond of %s', (unit, start, end) => {
    expect(wednesday.startOf(unit).toString()).toBe(start);
    expect(wednesday.endOf(unit).toString()).toBe(end);
  });

  it('resolves quarter boundaries across Q1 and Q2', () => {
    const lastOfMarch = datetime('2026-03-31T12:00', 'UTC');
    const firstOfApril = datetime('2026-04-01T12:00', 'UTC');
    expect(lastOfMarch.startOf('quarter').toString()).toBe('2026-01-01T00:00:00.000Z');
    expect(lastOfMarch.endOf('quarter').toString()).toBe('2026-03-31T23:59:59.999Z');
    expect(firstOfApril.startOf('quarter').toString()).toBe('2026-04-01T00:00:00.000Z');
    expect(firstOfApril.endOf('quarter').toString()).toBe('2026-06-30T23:59:59.999Z');
  });

  it('computes week boundaries from a weekday name or ISO weekday number', () => {
    expect(wednesday.startOf('week', 'monday').toString()).toBe('2026-11-16T00:00:00.000Z');
    expect(wednesday.endOf('week', 'monday').toString()).toBe('2026-11-22T23:59:59.999Z');
    expect(wednesday.startOf('week', 'sunday').toString()).toBe('2026-11-15T00:00:00.000Z');
    expect(wednesday.endOf('week', 7).toString()).toBe('2026-11-21T23:59:59.999Z');
  });

  it('preserves the calendar day when already on the start of the target week', () => {
    expect(wednesday.startOf('week', 'wednesday').toString()).toBe('2026-11-18T00:00:00.000Z');
  });

  it('computes day boundaries in the instance timezone', () => {
    const evening = datetime('2026-11-17T02:00:00Z', 'America/Los_Angeles');
    expect(evening.startOf('day').toString()).toBe('2026-11-16T08:00:00.000Z');
    expect(evening.endOf('day').toString()).toBe('2026-11-17T07:59:59.999Z');
  });

  // New York leaves DST on 2026-11-01, shifting the UTC offset from -04:00 to -05:00
  it('uses the UTC offset active at each boundary when a DST transition falls inside the unit', () => {
    const midNovember = datetime('2026-11-18T14:45', 'America/New_York');
    expect(midNovember.startOf('month').toString()).toBe('2026-11-01T04:00:00.000Z');
    expect(midNovember.endOf('month').toString()).toBe('2026-12-01T04:59:59.999Z');
  });

  it('returns the final millisecond of 23-hour and 25-hour DST transition days', () => {
    const springForward = datetime('2026-03-08T12:00', 'America/New_York');
    const fallBack = datetime('2026-11-01T12:00', 'America/New_York');
    expect(springForward.startOf('day').toString()).toBe('2026-03-08T05:00:00.000Z');
    expect(springForward.endOf('day').toString()).toBe('2026-03-09T03:59:59.999Z');
    expect(fallBack.startOf('day').toString()).toBe('2026-11-01T04:00:00.000Z');
    expect(fallBack.endOf('day').toString()).toBe('2026-11-02T04:59:59.999Z');
  });

  // Cairo springs forward from 00:00 to 01:00 on 2026-04-24, skipping midnight
  it("returns 01:00 in startOf('day') when midnight is skipped by DST", () => {
    const friday = datetime('2026-04-24T12:00', 'Africa/Cairo');
    expect(friday.startOf('day')).toMatchObject({ day: 24, hour: 1, minute: 0 });
    expect(friday.startOf('day').toString()).toBe('2026-04-23T22:00:00.000Z');
  });

  it('returns the final millisecond of the same calendar day in endOf("day") when midnight is skipped by DST', () => {
    const friday = datetime('2026-04-24T12:00', 'Africa/Cairo');
    expect(friday.endOf('day').toString()).toBe('2026-04-24T20:59:59.999Z');
    expect(friday.endOf('day')).toMatchObject({ day: 24, hour: 23, minute: 59 });
    expect(friday.endOf('week', 'friday').toString()).toBe('2026-04-30T20:59:59.999Z');
  });

  // Africa/Cairo skips 00:00 to 01:00 on 2026-04-24, so Apr 23 ends one millisecond before 01:00
  it('ends the day before a skipped midnight one millisecond before the next day starts', () => {
    const thursday = datetime('2026-04-23T12:00', 'Africa/Cairo');
    expect(thursday.endOf('day').toString()).toBe('2026-04-23T21:59:59.999Z');
    expect(thursday.endOf('day')).toMatchObject({ day: 23, hour: 23, minute: 59 });
  });

  // Lord Howe shifts clocks back 30 minutes at 02:00 on 2026-04-05, repeating 01:30 to 02:00
  it('spans the full 90-minute 01:xx wall-clock hour across a 30-minute fall-back transition', () => {
    const early = datetime('2026-04-05T01:15+11:00', 'Australia/Lord_Howe');
    const repeated = datetime('2026-04-05T01:45+10:30', 'Australia/Lord_Howe');
    expect(early.endOf('hour').toString()).toBe('2026-04-04T15:29:59.999Z');
    expect(repeated.endOf('hour').toString()).toBe('2026-04-04T15:29:59.999Z');
    expect(early.range('hour').toString()).toBe('2026-04-04T14:00:00.000Z/2026-04-04T15:30:00.000Z');
    expect(early.range('hour').contains(early)).toBe(true);
    expect(repeated.range('hour').contains(repeated)).toBe(true);
  });

  it('computes microsecond boundaries to nanosecond precision', () => {
    const precise = datetime('2026-11-18T14:45:12.345678912Z', 'UTC');
    expect(precise.startOf('microsecond').toString()).toBe('2026-11-18T14:45:12.345678Z');
    expect(precise.endOf('microsecond').toString()).toBe('2026-11-18T14:45:12.345678999Z');
  });

  it('returns a new DateTime without mutating the original', () => {
    wednesday.startOf('year');
    expect(wednesday.toString()).toBe('2026-11-18T14:45:12.345Z');
  });

  it('throws unknownUnit for an unrecognized unit', () => {
    expect(() => wednesday.startOf('fortnight')).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'unknownUnit', at: 'fortnight' }),
    );
    expect(() => wednesday.endOf('fortnight')).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'unknownUnit', at: 'fortnight' }),
    );
  });

  it('throws unknownDayOfWeek for an unrecognized week start argument', () => {
    expect(() => wednesday.startOf('week', 'funday')).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'unknownDayOfWeek', at: 'funday' }),
    );
  });
});

describe('DateTime.startOfNext() and startOfPrevious()', () => {
  const wednesday = datetime('2026-11-18T14:45:12.345', 'UTC');
  const standup = datetime('2026-11-16T09:30', 'America/New_York');

  it.each([
    ['year', '2027-01-01T00:00:00.000Z', '2025-01-01T00:00:00.000Z'],
    ['quarter', '2027-01-01T00:00:00.000Z', '2026-07-01T00:00:00.000Z'],
    ['month', '2026-12-01T00:00:00.000Z', '2026-10-01T00:00:00.000Z'],
    ['day', '2026-11-19T00:00:00.000Z', '2026-11-17T00:00:00.000Z'],
    ['hour', '2026-11-18T15:00:00.000Z', '2026-11-18T13:00:00.000Z'],
    ['minute', '2026-11-18T14:46:00.000Z', '2026-11-18T14:44:00.000Z'],
    ['second', '2026-11-18T14:45:13.000Z', '2026-11-18T14:45:11.000Z'],
    ['millisecond', '2026-11-18T14:45:12.346Z', '2026-11-18T14:45:12.344Z'],
  ])('returns the first instant of the next and the previous %s', (unit, next, previous) => {
    expect(wednesday.startOfNext(unit).toString()).toBe(next);
    expect(wednesday.startOfPrevious(unit).toString()).toBe(previous);
  });

  it('moves a whole unit when already at the first instant of its unit', () => {
    const firstOfDecember = datetime('2026-12-01T00:00', 'UTC');
    expect(firstOfDecember.startOfNext('month').toString()).toBe('2027-01-01T00:00:00.000Z');
    expect(firstOfDecember.startOfPrevious('month').toString()).toBe('2026-11-01T00:00:00.000Z');
    expect(firstOfDecember.startOfPrevious('day').toString()).toBe('2026-11-30T00:00:00.000Z');
  });

  // New York is on EST (UTC-5) in November and December, and on EDT (UTC-4) on October 1
  it('returns midnight in the instance timezone at the UTC offset active on that day', () => {
    expect(standup.startOfNext('day').toString()).toBe('2026-11-17T05:00:00.000Z');
    expect(standup.startOfNext('month').toString()).toBe('2026-12-01T05:00:00.000Z');
    expect(standup.startOfPrevious('day').toString()).toBe('2026-11-15T05:00:00.000Z');
    expect(standup.startOfPrevious('month').toString()).toBe('2026-10-01T04:00:00.000Z');
  });

  it('starts the next and the previous week on the first day of the week of the instance locale', () => {
    expect(wednesday.locale('en-US').startOfNext('week').toString()).toBe('2026-11-22T00:00:00.000Z');
    expect(wednesday.locale('de-DE').startOfNext('week').toString()).toBe('2026-11-23T00:00:00.000Z');
    expect(wednesday.locale('en-US').startOfPrevious('week').toString()).toBe('2026-11-08T00:00:00.000Z');
    expect(wednesday.locale('de-DE').startOfPrevious('week').toString()).toBe('2026-11-09T00:00:00.000Z');
  });

  it('starts the next and the previous week on a weekday name or ISO number passed as the second argument', () => {
    const american = wednesday.locale('en-US');
    expect(american.startOfNext('week', 'monday').toString()).toBe('2026-11-23T00:00:00.000Z');
    expect(american.startOfPrevious('week', 1).toString()).toBe('2026-11-09T00:00:00.000Z');
  });

  it('returns midnight on the next or previous given weekday, where next() and previous() keep the time of day', () => {
    expect(standup.startOfNext('wednesday').toString()).toBe('2026-11-18T05:00:00.000Z');
    expect(standup.next('wednesday').toString()).toBe('2026-11-18T14:30:00.000Z');
    expect(standup.startOfPrevious('wednesday').toString()).toBe('2026-11-11T05:00:00.000Z');
    expect(standup.previous('wednesday').toString()).toBe('2026-11-11T14:30:00.000Z');
  });

  it('moves a full 7 days when already on the target weekday, even at midnight', () => {
    const mondayMidnight = datetime('2026-11-16T00:00', 'America/New_York');
    expect(standup.startOfNext('monday').toString()).toBe('2026-11-23T05:00:00.000Z');
    expect(standup.startOfPrevious('monday').toString()).toBe('2026-11-09T05:00:00.000Z');
    expect(mondayMidnight.startOfNext('monday').toString()).toBe('2026-11-23T05:00:00.000Z');
    expect(mondayMidnight.startOfPrevious('monday').toString()).toBe('2026-11-09T05:00:00.000Z');
  });

  it('accepts 3-letter weekday abbreviations, mixed case, and surrounding spaces', () => {
    expect(standup.startOfNext('wed').day).toBe(18);
    expect(standup.startOfNext('Wednesday').day).toBe(18);
    expect(standup.startOfPrevious(' SUN ').day).toBe(15);
  });

  // next(3) is Wednesday, but beside a unit a number reads as a count, and startOfNext(2, 'months') must not be Tuesday
  it('throws unknownUnit for a weekday written as a number and for a count before a unit', () => {
    expect(() => standup.startOfNext(3)).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'unknownUnit', at: '3' }),
    );
    expect(() => standup.startOfPrevious(0)).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'unknownUnit', at: '0' }),
    );
    expect(() => standup.startOfNext(2, 'months')).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'unknownUnit', at: '2' }),
    );
  });

  // the previous Sunday is yesterday, while the previous week that starts on Sunday began eight days ago
  it('reads a weekday as that day rather than as the week it starts', () => {
    expect(standup.startOfPrevious('sunday').day).toBe(15);
    expect(standup.startOfPrevious('week', 'sunday').day).toBe(8);
    expect(standup.startOfNext('wednesday').equals(standup.startOfNext('week', 'wednesday'))).toBe(true);
  });

  it.each(['year', 'quarter', 'month', 'week', 'day', 'hour', 'minute', 'second'])(
    'returns the end of range(%s) and steps back from it to startOf()',
    (unit) => {
      expect(standup.startOfNext(unit).equals(standup.range(unit).end)).toBe(true);
      expect(standup.startOfNext(unit).startOfPrevious(unit).equals(standup.startOf(unit))).toBe(true);
    },
  );

  // New York skips 02:00 to 03:00 on 2026-03-08 and repeats 01:00 to 02:00 on 2026-11-01
  it('steps across the skipped hour and between the two repeated hours of a DST transition', () => {
    const beforeGap = datetime('2026-03-08T01:30', 'America/New_York');
    const afterGap = datetime('2026-03-08T03:30', 'America/New_York');
    expect(beforeGap.startOfNext('hour').toString()).toBe('2026-03-08T07:00:00.000Z');
    expect(afterGap.startOfPrevious('hour').toString()).toBe('2026-03-08T06:00:00.000Z');
    const firstPass = datetime('2026-11-01T01:30-04:00', 'America/New_York');
    const secondPass = datetime('2026-11-01T01:30-05:00', 'America/New_York');
    expect(firstPass.startOfNext('hour').toString()).toBe('2026-11-01T06:00:00.000Z');
    expect(firstPass.startOfPrevious('hour').toString()).toBe('2026-11-01T04:00:00.000Z');
    expect(secondPass.startOfNext('hour').toString()).toBe('2026-11-01T07:00:00.000Z');
    expect(secondPass.startOfPrevious('hour').toString()).toBe('2026-11-01T05:00:00.000Z');
  });

  // Lord Howe falls back 30 minutes on 2026-04-05 (02:00 -> 01:30) and springs forward 30 minutes on 2026-10-04 (02:00 -> 02:30)
  it('aligns startOfNext("hour") and startOfPrevious("hour") across 30-minute DST transitions', () => {
    const early = datetime('2026-04-05T01:15+11:00', 'Australia/Lord_Howe');
    const repeated = datetime('2026-04-05T01:45+10:30', 'Australia/Lord_Howe');
    expect(early.startOfNext('hour').toString()).toBe('2026-04-04T15:30:00.000Z');
    expect(repeated.startOfNext('hour').toString()).toBe('2026-04-04T15:30:00.000Z');
    expect(repeated.startOfPrevious('hour').toString()).toBe('2026-04-04T13:00:00.000Z');
    const afterSpring = datetime('2026-10-04T02:45+11:00', 'Australia/Lord_Howe');
    expect(afterSpring.startOfNext('hour')).toMatchObject({ hour: 3, minute: 0 });
    expect(afterSpring.startOfNext('hour').toString()).toBe('2026-10-03T16:00:00.000Z');
    expect(afterSpring.startOfPrevious('hour')).toMatchObject({ hour: 1, minute: 0 });
    expect(afterSpring.startOfPrevious('hour').toString()).toBe('2026-10-03T14:30:00.000Z');
  });

  it('returns midnight on either side of 23-hour and 25-hour DST transition days', () => {
    const springForward = datetime('2026-03-08T12:00', 'America/New_York');
    const fallBack = datetime('2026-11-01T12:00', 'America/New_York');
    expect(springForward.startOfNext('day').toString()).toBe('2026-03-09T04:00:00.000Z');
    expect(springForward.startOfPrevious('day').toString()).toBe('2026-03-07T05:00:00.000Z');
    expect(fallBack.startOfNext('day').toString()).toBe('2026-11-02T05:00:00.000Z');
    expect(fallBack.startOfPrevious('day').toString()).toBe('2026-10-31T04:00:00.000Z');
  });

  // Cairo springs forward from 00:00 to 01:00 on Friday 2026-04-24, skipping midnight
  it('returns 01:00 for a day or weekday whose midnight is skipped by DST', () => {
    const thursday = datetime('2026-04-23T12:00', 'Africa/Cairo');
    const saturday = datetime('2026-04-25T12:00', 'Africa/Cairo');
    expect(thursday.startOfNext('day')).toMatchObject({ day: 24, hour: 1, minute: 0 });
    expect(thursday.startOfNext('day').toString()).toBe('2026-04-23T22:00:00.000Z');
    expect(thursday.startOfNext('friday').toString()).toBe('2026-04-23T22:00:00.000Z');
    expect(saturday.startOfPrevious('day').toString()).toBe('2026-04-23T22:00:00.000Z');
    expect(saturday.startOfPrevious('friday').toString()).toBe('2026-04-23T22:00:00.000Z');
  });

  it('returns midnight of the day before one whose own start is 01:00', () => {
    const friday = datetime('2026-04-24T12:00', 'Africa/Cairo');
    expect(friday.startOfPrevious('day')).toMatchObject({ day: 23, hour: 0, minute: 0 });
    expect(friday.startOfPrevious('day').toString()).toBe('2026-04-22T22:00:00.000Z');
  });

  // Samoa moved across the date line at the end of 2011-12-29, so Pacific/Apia has no 2011-12-30
  it('steps over a calendar day that the timezone skipped', () => {
    const saturday = datetime('2011-12-31T09:00', 'Pacific/Apia');
    const thursday = datetime('2011-12-29T09:00', 'Pacific/Apia');
    expect(saturday.startOfPrevious('day')).toMatchObject({ day: 29, hour: 0 });
    expect(saturday.startOfPrevious('day').toString()).toBe('2011-12-29T10:00:00.000Z');
    expect(thursday.startOfNext('day')).toMatchObject({ day: 31, hour: 0 });
    expect(thursday.startOfNext('day').toString()).toBe('2011-12-30T10:00:00.000Z');
    expect(thursday.startOfNext('saturday')).toMatchObject({ day: 31, dayOfWeek: 6, hour: 0 });
  });

  // Nuuk springs forward from 23:00 on Saturday 2026-03-28 to 00:00 on Sunday 2026-03-29
  it('resolves weekday boundaries on the calendar date when the current evening hour is skipped into midnight', () => {
    const fridayLate = datetime('2026-03-27T23:30', 'America/Nuuk');
    const sundayLate = datetime('2026-03-29T23:30', 'America/Nuuk');
    expect(fridayLate.startOfNext('saturday')).toMatchObject({ day: 28, dayOfWeek: 6, hour: 0, minute: 0 });
    expect(sundayLate.startOfPrevious('saturday')).toMatchObject({ day: 28, dayOfWeek: 6, hour: 0, minute: 0 });
  });

  it('computes microsecond and nanosecond boundaries to nanosecond precision', () => {
    const precise = datetime('2026-11-18T14:45:12.345678912Z', 'UTC');
    expect(precise.startOfNext('microsecond').toString()).toBe('2026-11-18T14:45:12.345679Z');
    expect(precise.startOfPrevious('microsecond').toString()).toBe('2026-11-18T14:45:12.345677Z');
    expect(precise.startOfNext('nanosecond').toString()).toBe('2026-11-18T14:45:12.345678913Z');
    expect(precise.startOfPrevious('nanosecond').toString()).toBe('2026-11-18T14:45:12.345678911Z');
  });

  it('keeps the timezone of the original and does not mutate it', () => {
    expect(standup.startOfNext('month').zone).toBe('America/New_York');
    expect(standup.startOfPrevious('wednesday').zone).toBe('America/New_York');
    expect(standup.toString()).toBe('2026-11-16T14:30:00.000Z');
  });

  it.each([['fortnight', 'fortnight'], ['funday', 'funday'], [undefined, 'undefined']])(
    'throws unknownUnit for %s, which names neither a unit nor a weekday',
    (target, at) => {
      expect(() => standup.startOfNext(target)).toThrowError(
        expect.objectContaining({ name: 'RangeError', code: 'unknownUnit', at }),
      );
      expect(() => standup.startOfPrevious(target)).toThrowError(
        expect.objectContaining({ name: 'RangeError', code: 'unknownUnit', at }),
      );
    },
  );

  it('throws unknownUnit for a MonthDay, which only next() and previous() accept', () => {
    expect(() => standup.startOfNext(monthDay('12-25'))).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'unknownUnit', at: '12-25' }),
    );
  });

  it('throws unknownDayOfWeek for an unrecognized week start argument', () => {
    expect(() => standup.startOfNext('week', 'funday')).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'unknownDayOfWeek', at: 'funday' }),
    );
    expect(() => standup.startOfPrevious('week', 8)).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'unknownDayOfWeek', at: '8' }),
    );
  });
});

describe('DateTime.round(), floor(), and ceil()', () => {
  const stamp = datetime('2026-11-16T09:23:40', 'UTC');

  it('rounds to the nearest whole unit', () => {
    expect(stamp.round('hour').toString()).toBe('2026-11-16T09:00:00.000Z');
    expect(stamp.round('minute').toString()).toBe('2026-11-16T09:24:00.000Z');
  });

  it('rounds to the nearest step increment of a unit', () => {
    expect(stamp.round(15, 'minutes').toString()).toBe('2026-11-16T09:30:00.000Z');
    expect(stamp.round(6, 'hours').toString()).toBe('2026-11-16T12:00:00.000Z');
  });

  it('rounds half-way values upward', () => {
    expect(datetime('2026-11-16T09:30', 'UTC').round('hour').toString()).toBe('2026-11-16T10:00:00.000Z');
    expect(datetime('2026-11-16T09:07:30', 'UTC').round(15, 'minutes').toString()).toBe('2026-11-16T09:15:00.000Z');
  });

  it('rounds down with floor() and up with ceil()', () => {
    expect(stamp.floor('hour').toString()).toBe('2026-11-16T09:00:00.000Z');
    expect(stamp.ceil('hour').toString()).toBe('2026-11-16T10:00:00.000Z');
    expect(datetime('2026-11-16T09:29', 'UTC').floor(15, 'minutes').toString()).toBe('2026-11-16T09:15:00.000Z');
    expect(datetime('2026-11-16T09:01', 'UTC').ceil(15, 'minutes').toString()).toBe('2026-11-16T09:15:00.000Z');
  });

  it('preserves a DateTime already aligned to the rounding step', () => {
    const quarterPast = datetime('2026-11-16T09:15', 'UTC');
    expect(quarterPast.round(15, 'minutes').toString()).toBe('2026-11-16T09:15:00.000Z');
    expect(quarterPast.floor(15, 'minutes').toString()).toBe('2026-11-16T09:15:00.000Z');
    expect(quarterPast.ceil(15, 'minutes').toString()).toBe('2026-11-16T09:15:00.000Z');
  });

  it('rounds to day boundaries with noon rounding up to the next day', () => {
    expect(datetime('2026-11-16T11:59', 'UTC').round('day').toString()).toBe('2026-11-16T00:00:00.000Z');
    expect(datetime('2026-11-16T12:00', 'UTC').round('day').toString()).toBe('2026-11-17T00:00:00.000Z');
  });

  // in Asia/Kathmandu (UTC+05:45), top-of-hour in local time is :15 in UTC
  it('rounds against wall-clock time in the instance timezone rather than UTC', () => {
    const kathmandu = datetime('2026-11-18T14:45', 'Asia/Kathmandu');
    expect(kathmandu.floor('hour')).toMatchObject({ hour: 14, minute: 0 });
    expect(kathmandu.floor('hour').toString()).toBe('2026-11-18T08:15:00.000Z');
  });

  it('throws cannotRound for units larger than day', () => {
    expect(() => stamp.round('month')).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'cannotRound', at: '1 month' }),
    );
  });

  it('throws cannotRound when the step does not evenly divide the next larger unit', () => {
    expect(() => stamp.round(7, 'minutes')).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'cannotRound', at: '7 minutes' }),
    );
  });

  it('throws unknownUnit for an unrecognized unit', () => {
    expect(() => stamp.round('fortnight')).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'unknownUnit', at: 'fortnight' }),
    );
  });
});

describe('DateTime.next() and previous()', () => {
  const monday = datetime('2026-11-16T09:30:15.250', 'America/Los_Angeles');

  it('advances to the next target weekday at the same wall-clock time', () => {
    expect(monday.next('friday').toString()).toBe('2026-11-20T17:30:15.250Z');
  });

  it('rewinds to the previous target weekday at the same wall-clock time', () => {
    expect(monday.previous('friday').toString()).toBe('2026-11-13T17:30:15.250Z');
  });

  it('moves by a full 7 days when already on the target weekday', () => {
    expect(monday.next('monday')).toMatchObject({ day: 23, hour: 9 });
    expect(monday.previous('monday')).toMatchObject({ day: 9, hour: 9 });
  });

  it('accepts full weekday names, 3-letter abbreviations, and ISO numbers 1-7', () => {
    expect(monday.next('Friday').day).toBe(20);
    expect(monday.next('fri').day).toBe(20);
    expect(monday.next(5).day).toBe(20);
    expect(monday.next(7).day).toBe(22);
  });

  it('accepts 0 for Sunday, matching Date.prototype.getDay()', () => {
    expect(monday.next(0).day).toBe(22);
    expect(monday.previous(0).day).toBe(15);
  });

  it('preserves wall-clock time when advancing across a DST transition', () => {
    const saturday = datetime('2026-03-07T09:00', 'America/New_York');
    expect(saturday.next('sunday').toString()).toBe('2026-03-08T13:00:00.000Z');
  });

  it('preserves wall-clock time when rewinding across a DST transition', () => {
    const mondayAfter = datetime('2026-03-09T09:00', 'America/New_York');
    expect(mondayAfter.previous('saturday').toString()).toBe('2026-03-07T14:00:00.000Z');
  });

  // in America/Los_Angeles Oct 31 is PDT (UTC-7) and mid-November is PST (UTC-8)
  it('advances and rewinds to a MonthDay occurrence at the same wall-clock time', () => {
    expect(monday.next(monthDay('12-25')).toString()).toBe('2026-12-25T17:30:15.250Z');
    expect(monday.previous(monthDay('10-31')).toString()).toBe('2026-10-31T16:30:15.250Z');
  });

  it('moves by a full year when already on the target MonthDay', () => {
    expect(monday.next(monthDay('11-16'))).toMatchObject({ year: 2027, month: 11, day: 16 });
    expect(monday.previous(monthDay('11-16'))).toMatchObject({ year: 2025, month: 11, day: 16 });
  });

  it.each([['funday', 'funday'], [-1, '-1'], [8, '8']])(
    'throws unknownDayOfWeek for %s',
    (day, at) => {
      expect(() => monday.next(day)).toThrowError(
        expect.objectContaining({ name: 'RangeError', code: 'unknownDayOfWeek', at }),
      );
      expect(() => monday.previous(day)).toThrowError(
        expect.objectContaining({ name: 'RangeError', code: 'unknownDayOfWeek', at }),
      );
    },
  );
});

describe('DateTime.equals(), isBefore(), and isAfter()', () => {
  const noon = datetime('2026-11-16T12:00', 'America/New_York');

  it('returns true from equals() for identical instants across different timezones', () => {
    expect(noon.equals(datetime('2026-11-16T17:00Z', 'UTC'))).toBe(true);
    expect(noon.equals(noon.in('Asia/Tokyo'))).toBe(true);
    expect(noon.equals(datetime('2026-11-16T12:00', 'UTC'))).toBe(false);
  });

  it('accepts strings, Dates, epoch timestamps, and Temporal.ZonedDateTimes', () => {
    expect(noon.equals('2026-11-16T17:00:00Z')).toBe(true);
    expect(noon.equals(new Date('2026-11-16T17:00:00Z'))).toBe(true);
    expect(noon.equals(1794848400000)).toBe(true);
    expect(noon.equals(Temporal.ZonedDateTime.from('2026-11-16T18:00:00+01:00[Europe/Berlin]'))).toBe(true);
  });

  it('interprets offset-free strings in the receiver timezone', () => {
    const tokyo = datetime('2026-11-16T09:30', 'Asia/Tokyo');
    expect(tokyo.equals('2026-11-16T09:30')).toBe(true);
    expect(tokyo.isBefore('2026-11-16T09:31')).toBe(true);
    expect(tokyo.isAfter('2026-11-16T09:29')).toBe(true);
  });

  // at 09:00 in America/Los_Angeles (17:00 UTC) it is after 11:00 in New York (16:00 UTC)
  it('orders DateTimes by epoch instant rather than local wall-clock hour', () => {
    const losAngeles = datetime('2026-11-16T09:00', 'America/Los_Angeles');
    const newYork = datetime('2026-11-16T11:00', 'America/New_York');
    expect(newYork.isBefore(losAngeles)).toBe(true);
    expect(losAngeles.isAfter(newYork)).toBe(true);
    expect(losAngeles.isBefore(newYork)).toBe(false);
    expect(newYork.isAfter(losAngeles)).toBe(false);
  });

  it('returns false from both isBefore() and isAfter() for equal instants', () => {
    expect(noon.isBefore(noon.in('UTC'))).toBe(false);
    expect(noon.isAfter(noon.in('UTC'))).toBe(false);
  });

  it('distinguishes instants separated by 1 millisecond', () => {
    const next = noon.plus(1, 'millisecond');
    expect(noon.equals(next)).toBe(false);
    expect(noon.isBefore(next)).toBe(true);
  });

  it('distinguishes instants separated by 1 microsecond', () => {
    const first = datetime('2026-11-16T17:00:00.123456Z');
    const second = datetime('2026-11-16T17:00:00.123457Z');
    expect(first.equals(second)).toBe(false);
    expect(first.isBefore(second)).toBe(true);
    expect(second.isAfter(first)).toBe(true);
  });

  it('throws a TypeError with missingDateTime for null or undefined', () => {
    expect(() => noon.equals(null)).toThrowError(
      expect.objectContaining({ name: 'TypeError', code: 'missingDateTime', at: 'null' }),
    );
    expect(() => noon.isBefore(undefined)).toThrowError(
      expect.objectContaining({ name: 'TypeError', code: 'missingDateTime', at: 'undefined' }),
    );
  });
});

describe('DateTime.isSame()', () => {
  const standup = datetime('2026-11-16T09:30', 'America/Los_Angeles');

  // at 02:00 UTC on Nov 17 it is 18:00 on Nov 16 in America/Los_Angeles
  it('evaluates calendar day equality in the receiver timezone', () => {
    const lateUtc = datetime('2026-11-17T02:00Z', 'UTC');
    expect(standup.isSame(lateUtc, 'day')).toBe(true);
    expect(lateUtc.isSame(standup, 'day')).toBe(false);
  });

  it('compares exact instants when called without a unit', () => {
    expect(standup.isSame(standup.in('Asia/Tokyo'))).toBe(true);
    expect(standup.isSame(standup.plus(1, 'second'))).toBe(false);
  });

  it('compares hour, month, quarter, and year units', () => {
    expect(standup.isSame('2026-11-16T09:59:59', 'hour')).toBe(true);
    expect(standup.isSame('2026-11-16T10:00', 'hour')).toBe(false);
    expect(standup.isSame('2026-11-30T23:59', 'month')).toBe(true);
    expect(standup.isSame('2026-12-01T00:00', 'month')).toBe(false);
    expect(standup.isSame('2026-10-01T00:00', 'quarter')).toBe(true);
    expect(standup.isSame('2026-09-30T23:59', 'quarter')).toBe(false);
    expect(standup.isSame('2026-01-01T00:00', 'year')).toBe(true);
    expect(standup.isSame('2027-01-01T00:00', 'year')).toBe(false);
  });

  it('compares week boundaries using the specified weekStart day', () => {
    const sunday = '2026-11-15T12:00';
    expect(standup.isSame(sunday, 'week', 'sunday')).toBe(true);
    expect(standup.isSame(sunday, 'week', 'monday')).toBe(false);
  });

  it('throws unknownUnit for an unrecognized unit', () => {
    expect(() => standup.isSame(standup, 'fortnight')).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'unknownUnit', at: 'fortnight' }),
    );
  });
});

describe('DateTime.isPast(), isFuture(), isToday(), isTomorrow(), and isYesterday()', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-16T17:30:00.250Z'));
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('compares against the current instant for isPast() and isFuture()', () => {
    const justNow = datetime('2026-11-16T17:30:00.249Z');
    const soon = datetime('2026-11-16T17:30:00.251Z');
    expect(justNow.isPast()).toBe(true);
    expect(justNow.isFuture()).toBe(false);
    expect(soon.isFuture()).toBe(true);
    expect(soon.isPast()).toBe(false);
  });

  it('returns false from both isPast() and isFuture() at the exact current instant', () => {
    expect(now().isPast()).toBe(false);
    expect(now().isFuture()).toBe(false);
  });

  // at 01:00 UTC on Nov 17 it is tomorrow in UTC (Nov 16) and today in Asia/Tokyo (Nov 17)
  it('evaluates isToday() and isTomorrow() in the instance timezone', () => {
    const instant = datetime('2026-11-17T01:00:00Z', 'UTC');
    expect(instant.isToday()).toBe(false);
    expect(instant.isTomorrow()).toBe(true);
    expect(instant.in('Asia/Tokyo').isToday()).toBe(true);
    expect(instant.in('Asia/Tokyo').isTomorrow()).toBe(false);
  });

  it('returns true from isYesterday() across the entire previous calendar day', () => {
    expect(datetime('2026-11-15T00:00', 'UTC').isYesterday()).toBe(true);
    expect(datetime('2026-11-15T23:59', 'UTC').isYesterday()).toBe(true);
    expect(datetime('2026-11-14T23:59', 'UTC').isYesterday()).toBe(false);
    expect(datetime('2026-11-16T00:00', 'UTC').isYesterday()).toBe(false);
  });

  // at 03:00 UTC on Nov 16 it is 12:00 Nov 16 in Asia/Tokyo, where current date is Nov 17
  it('evaluates isYesterday() in the instance timezone', () => {
    const instant = datetime('2026-11-16T03:00:00Z', 'UTC');
    expect(instant.isYesterday()).toBe(false);
    expect(instant.in('Asia/Tokyo').isYesterday()).toBe(true);
  });
});

describe('DateTime.until() and since()', () => {
  const doors = datetime('2026-11-16T08:00', 'America/Los_Angeles');
  const standup = datetime('2026-11-16T09:30', 'America/Los_Angeles');

  it('returns a Duration to a later DateTime', () => {
    expect(doors.until(standup).toString()).toBe('PT1H30M');
  });

  it('returns a numeric total when a unit is passed', () => {
    expect(doors.until(standup, 'hours')).toBe(1.5);
    expect(doors.until(standup, 'minutes')).toBe(90);
  });

  it('returns a negative Duration or total for an earlier DateTime', () => {
    expect(standup.until(doors).toString()).toBe('-PT1H30M');
    expect(standup.until(doors, 'hours')).toBe(-1.5);
  });

  it('computes since() as the elapsed span from an earlier DateTime', () => {
    expect(standup.since(doors).toString()).toBe('PT1H30M');
    expect(standup.since(doors, 'minutes')).toBe(90);
    expect(doors.since(standup, 'minutes')).toBe(-90);
  });

  it('interprets offset-free target strings in the receiver timezone', () => {
    expect(doors.until('2026-11-16T09:30', 'minutes')).toBe(90);
    expect(standup.since('2026-11-16T08:00', 'minutes')).toBe(90);
  });

  // at 02:00 Nov 17 in Asia/Tokyo (17:00 UTC Nov 16) it is 1 hour after 08:00 PST (16:00 UTC)
  it('measures elapsed time between DateTimes in different timezones', () => {
    expect(doors.until(datetime('2026-11-17T02:00', 'Asia/Tokyo'), 'hours')).toBe(1);
  });

  it("measures multi-year spans in days and clock units, and in years and months through balance('year')", () => {
    const start = datetime('2026-01-15T09:00', 'America/New_York');
    expect(start.until('2027-03-18T10:30').toString()).toBe('P427DT1H30M');
    expect(start.until('2027-03-18T10:30').balance('year').toString()).toBe('P1Y2M3DT1H30M');
  });

  it('counts 1 calendar day across 23-hour and 25-hour DST transitions while counting exact hours', () => {
    const saturday = datetime('2026-03-07T09:00', 'America/New_York');
    const halloween = datetime('2026-10-31T09:00', 'America/New_York');
    expect(saturday.until('2026-03-08T09:00').toString()).toBe('P1D');
    expect(saturday.until('2026-03-08T09:00', 'hours')).toBe(23);
    expect(halloween.until('2026-11-01T09:00', 'days')).toBe(1);
    expect(halloween.until('2026-11-01T09:00', 'hours')).toBe(25);
  });

  // from Jan 15 to Mar 15 2026 is 59 calendar days, with one 23-hour spring-forward day in New York
  it('totals months and days by the calendar and hours by exact elapsed time', () => {
    const start = datetime('2026-01-15T09:00', 'America/New_York');
    expect(start.until('2026-03-15T09:00', 'months')).toBe(2);
    expect(start.until('2026-03-15T09:00', 'days')).toBe(59);
    expect(start.until('2026-03-15T09:00', 'hours')).toBe(1415);
  });

  it("anchors the returned Duration so total('months') and balance('month') resolve calendar months", () => {
    const start = datetime('2026-01-15T09:00', 'America/New_York');
    const span = start.until('2026-03-15T09:00');
    expect(span.toString()).toBe('P59D');
    expect(span.total('months')).toBe(2);
    expect(span.balance('month').toString()).toBe('P2M');
  });

  // from Saturday 09:00 to Sunday 09:00 in New York across spring-forward is P1D locally and PT23H in UTC
  it('measures calendar units in the receiver timezone', () => {
    const saturday = datetime('2026-03-07T09:00', 'America/New_York');
    const sundayInUtc = datetime('2026-03-08T13:00:00Z', 'UTC');
    expect(saturday.until(sundayInUtc).toString()).toBe('P1D');
    expect(sundayInUtc.since(saturday).toString()).toBe('PT23H');
  });

  it('round-trips start.plus(start.until(end)) back to end and measures exact hours from a fall-back fold hour', () => {
    const start = datetime('2026-01-31T09:00', 'America/New_York');
    const end = datetime('2027-03-01T10:30', 'America/New_York');
    expect(start.plus(start.until(end)).toString()).toBe(end.toString());

    const foldStart = datetime('2026-10-25T01:30:00Z', 'Europe/Berlin');
    const shiftEnd = datetime('2026-10-25T09:30:00Z', 'Europe/Berlin');
    expect(foldStart.until(shiftEnd, 'hours')).toBe(8);
    expect(foldStart.until(shiftEnd).toString()).toBe('PT8H');
    expect(foldStart.plus(foldStart.until(shiftEnd)).toString()).toBe(shiftEnd.toString());
    expect(foldStart.until('2026-10-25T01:00:00Z').toString()).toBe('-PT30M');
    expect(foldStart.until('2026-10-25T00:30:00Z', 'hours')).toBe(-1);
  });

  it('measures fractional days accurately across both occurrences of a fall-back repeated hour', () => {
    const first = datetime('2026-11-01T01:30:00-04:00[America/New_York]');
    const second = datetime('2026-11-01T01:30:00-05:00[America/New_York]');
    const after = datetime('2026-11-01T02:30:00-05:00[America/New_York]');
    const before = datetime('2026-11-01T00:30:00-04:00[America/New_York]');

    expect(Object.is(second.until(second, 'days'), 0)).toBe(true);
    expect(second.until(after, 'days')).toBeCloseTo(1 / 24, 12);
    expect(second.until(first, 'days')).toBeCloseTo(-1 / 25, 12);
    expect(second.until(before, 'days')).toBeCloseTo(-2 / 25, 12);
    expect(second.until(second.minus(30, 'minutes'), 'days')).toBeCloseTo(-0.5 / 25, 12);
    expect(first.until(first.plus(30, 'minutes'), 'days')).toBeCloseTo(0.5 / 25, 12);
    expect(first.until(second, 'days')).toBeCloseTo(1 / 25, 12);
    expect(second.until('2026-11-02T01:30:00-05:00[America/New_York]', 'days')).toBe(1);
    expect(second.until('2026-10-31T01:30:00-04:00[America/New_York]', 'days')).toBe(-1);

    const lordHoweSecond = datetime('2026-04-05T01:45:00+10:30[Australia/Lord_Howe]');
    expect(lordHoweSecond.until(lordHoweSecond.plus(1, 'hour'), 'days')).toBeCloseTo(1 / 24, 12);
    expect(lordHoweSecond.until(lordHoweSecond.minus(30, 'minutes'), 'days')).toBeCloseTo(-0.5 / 24.5, 12);
  });

  it('preserves exact sub-second precision across multi-century spans', () => {
    const start = datetime('1800-01-01T00:00:00.000Z');
    const end = datetime('2026-06-01T00:00:00.008Z');
    expect(start.until(end, 'milliseconds')).toBe(7144934400008);
    expect(end.since(start, 'milliseconds')).toBe(7144934400008);
    expect(end.until(start, 'milliseconds')).toBe(-7144934400008);
    expect(Object.is(start.until(start, 'milliseconds'), 0)).toBe(true);
  });

  it('throws a TypeError with missingDateTime for null or undefined targets', () => {
    expect(() => doors.until(null)).toThrowError(
      expect.objectContaining({ name: 'TypeError', code: 'missingDateTime', at: 'null' }),
    );
    expect(() => doors.since(undefined)).toThrowError(
      expect.objectContaining({ name: 'TypeError', code: 'missingDateTime', at: 'undefined' }),
    );
  });

  it('throws unknownUnit for an unrecognized unit', () => {
    expect(() => doors.until(standup, 'fortnight')).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'unknownUnit', at: 'fortnight' }),
    );
  });
});

describe('DateTime serialization and conversion', () => {
  const standup = datetime('2026-11-16T09:30', 'America/Los_Angeles');
  const wrapUp = datetime('2026-11-16T17:00', 'America/Los_Angeles');

  it('formats toString() as a UTC ISO 8601 string with milliseconds regardless of timezone', () => {
    expect(standup.toString()).toBe('2026-11-16T17:30:00.000Z');
    expect(standup.in('Asia/Tokyo').toString()).toBe('2026-11-16T17:30:00.000Z');
  });

  it('coerces to a UTC ISO 8601 string in String(), template literals, and concatenation', () => {
    expect(String(standup)).toBe('2026-11-16T17:30:00.000Z');
    expect(`${standup}`).toBe('2026-11-16T17:30:00.000Z');
    expect('starts ' + standup).toBe('starts 2026-11-16T17:30:00.000Z');
  });

  it('serializes to a UTC ISO 8601 string in toJSON() and JSON.stringify()', () => {
    expect(standup.toJSON()).toBe('2026-11-16T17:30:00.000Z');
    expect(JSON.stringify({ standup })).toBe('{"standup":"2026-11-16T17:30:00.000Z"}');
  });

  it('round-trips through JSON serialization into the target timezone', () => {
    const readBack = datetime(JSON.parse(JSON.stringify(standup)), 'America/Los_Angeles');
    expect(readBack.equals(standup)).toBe(true);
    expect(readBack).toMatchObject({ zone: 'America/Los_Angeles', hour: 9, minute: 30 });
  });

  it('includes microsecond or nanosecond digits in toString() only when non-zero', () => {
    const micro = datetime('2026-11-16T17:30:00.123456Z', 'UTC');
    const nano = datetime('2026-11-16T17:30:00.123456789Z', 'UTC');
    expect(micro.toString()).toBe('2026-11-16T17:30:00.123456Z');
    expect(nano.toString()).toBe('2026-11-16T17:30:00.123456789Z');
    expect(datetime(nano.toString(), 'UTC').epochNanoseconds).toBe(nano.epochNanoseconds);
  });

  it('coerces to Unix epoch milliseconds in valueOf(), unary +, and Number()', () => {
    expect(standup.valueOf()).toBe(1794850200000);
    expect(+standup).toBe(1794850200000);
    expect(Number(standup)).toBe(1794850200000);
  });

  it('supports <, >, and subtraction in milliseconds', () => {
    expect(standup < wrapUp).toBe(true);
    expect(standup > wrapUp).toBe(false);
    expect(wrapUp - standup).toBe(7.5 * 60 * 60 * 1000);
  });

  it('sorts chronologically with a numeric subtraction comparator', () => {
    const tokyo = datetime('2026-11-17T03:00', 'Asia/Tokyo');
    const sorted = [wrapUp, tokyo, standup].sort((a, b) => a - b);
    expect(sorted.map(String)).toEqual([
      '2026-11-16T17:30:00.000Z',
      '2026-11-16T18:00:00.000Z',
      '2026-11-17T01:00:00.000Z',
    ]);
  });

  it('converts to a Date at the same instant via toJSDate()', () => {
    const stamp = standup.toJSDate();
    expect(stamp).toBeInstanceOf(Date);
    expect(stamp.toISOString()).toBe('2026-11-16T17:30:00.000Z');
    expect(new Date(standup).getTime()).toBe(1794850200000);
  });

  it('converts to a Temporal.ZonedDateTime in the same timezone via toTemporal()', () => {
    const zoned = standup.toTemporal();
    expect(zoned).toBeInstanceOf(Temporal.ZonedDateTime);
    expect(zoned.toString()).toBe('2026-11-16T09:30:00-08:00[America/Los_Angeles]');
  });

  it('truncates sub-millisecond precision in valueOf() and toJSDate()', () => {
    const precise = datetime('2026-11-16T17:30:00.123999999Z', 'UTC');
    expect(precise.valueOf()).toBe(1794850200123);
    expect(precise.toJSDate().toISOString()).toBe('2026-11-16T17:30:00.123Z');
  });
});

describe('datetime() year-first string parsing with any separator', () => {
  it.each([
    ['Han units before a clock', '2026年11月16日 14:30'],
    ['Hangul units before a clock', '2026년 11월 16일 14:30'],
    ['Korean spaced dots before a clock', '2026. 11. 16. 14:30'],
  ])('parses %s (%j) as wall-clock time in the target zone', (_form, text) => {
    expect(datetime(text, 'Asia/Tokyo')).toMatchObject({ year: 2026, month: 11, day: 16, hour: 14, minute: 30 });
  });
});

describe('datetime() from Temporal values and strings in another calendar', () => {
  it('converts a Persian ZonedDateTime, PlainDateTime, and PlainDate to ISO fields', () => {
    const zoned = Temporal.ZonedDateTime.from('2026-11-16T10:00[Asia/Tehran][u-ca=persian]');
    const moment = datetime(zoned);
    expect(moment).toMatchObject({ year: 2026, month: 11, day: 16, zone: 'Asia/Tehran' });
    expect(moment.format('YYYY-MM-DD')).toBe('2026-11-16');
    expect(moment.date.toString()).toBe('2026-11-16');
    expect(datetime(zoned.toPlainDateTime(), 'UTC')).toMatchObject({ year: 2026, month: 11, day: 16 });
    expect(datetime(zoned.toPlainDate(), 'UTC')).toMatchObject({ year: 2026, month: 11, day: 16 });
  });

  it('converts a [u-ca=persian] string to ISO fields', () => {
    expect(datetime('2026-11-16T10:00[Asia/Tokyo][u-ca=persian]')).toMatchObject({ year: 2026, month: 11, day: 16 });
  });
});

describe('DateTime.isWeekend() and isWeekday() by locale', () => {
  it('returns true on Friday and false on Sunday for ar-SA in the instance timezone', () => {
    const friday = datetime('2026-11-20T12:00', 'Asia/Riyadh').locale('ar-SA');
    expect([friday.isWeekend(), friday.isWeekday()]).toEqual([true, false]);
    expect(friday.plus(2, 'days').isWeekend()).toBe(false);
    expect(friday.locale('en-US').isWeekend()).toBe(false);
  });
});
