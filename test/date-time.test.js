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

/*******************************
         Reading Input
*******************************/

describe('datetime() reading text', () => {
  it('fixes the moment from a trailing Z and views it in the zone given', () => {
    const standup = datetime('2026-11-16T17:30:00Z', 'America/Los_Angeles');
    expect(standup.toString()).toBe('2026-11-16T17:30:00.000Z');
    expect(standup).toMatchObject({ zone: 'America/Los_Angeles', hour: 9, minute: 30 });
  });

  it('fixes the moment from a numeric offset written after a T or a space', () => {
    expect(datetime('2026-11-16T12:30:00-05:00', 'Asia/Tokyo').toString()).toBe('2026-11-16T17:30:00.000Z');
    expect(datetime('2026-11-16 12:30-05:00', 'Asia/Tokyo').toString()).toBe('2026-11-16T17:30:00.000Z');
  });

  // +02:00 is not Berlin's offset in March, so a value that kept it would read 16:00
  it('takes the zone from the argument, never from the offset the text was written with', () => {
    const berlin = datetime('2026-03-07T16:00:00+02:00', 'Europe/Berlin');
    expect(berlin).toMatchObject({ zone: 'Europe/Berlin', offset: '+01:00', hour: 15 });
  });

  it('reads text with no offset as wall-clock time in the zone given', () => {
    expect(datetime('2026-11-16T09:30', 'America/Los_Angeles').toString()).toBe('2026-11-16T17:30:00.000Z');
    expect(datetime('2026-11-16 09:30', 'Europe/Berlin').toString()).toBe('2026-11-16T08:30:00.000Z');
  });

  it('reads a date with no time as the start of that day in the zone given', () => {
    const day = datetime('2026-11-16', 'America/New_York');
    expect(day.toString()).toBe('2026-11-16T05:00:00.000Z');
    expect(day).toMatchObject({ hour: 0, minute: 0, second: 0, millisecond: 0 });
  });

  it('reads a year-first date written with slashes and a single-digit hour', () => {
    expect(datetime('2026/11/06 9:00', 'Asia/Tokyo').toString()).toBe('2026-11-06T00:00:00.000Z');
  });

  it('keeps the zone written in brackets when no zone is given', () => {
    const meeting = datetime('2026-11-16T09:30[America/New_York]');
    expect(meeting.zone).toBe('America/New_York');
    expect(meeting.toString()).toBe('2026-11-16T14:30:00.000Z');
  });

  it('views a bracketed moment in the zone given without moving it', () => {
    const meeting = datetime('2026-11-16T09:30[America/New_York]', 'Europe/Berlin');
    expect(meeting.toString()).toBe('2026-11-16T14:30:00.000Z');
    expect(meeting).toMatchObject({ zone: 'Europe/Berlin', hour: 15, minute: 30 });
  });

  it('keeps microseconds and nanoseconds written in the text', () => {
    const precise = datetime('2026-11-16T17:30:00.123456789Z', 'UTC');
    expect(precise).toMatchObject({ millisecond: 123, microsecond: 456, nanosecond: 789 });
  });

  // New York skips 2:00 to 3:00 on 2026-03-08 and repeats 1:00 to 2:00 on 2026-11-01
  it('moves wall-clock text skipped by a clock change forward by the length of the gap', () => {
    const skipped = datetime('2026-03-08T02:30', 'America/New_York');
    expect(skipped).toMatchObject({ day: 8, hour: 3, minute: 30, offset: '-04:00' });
  });

  it('reads wall-clock text repeated by a clock change as the earlier of the two moments', () => {
    const repeated = datetime('2026-11-01T01:30', 'America/New_York');
    expect(repeated.toString()).toBe('2026-11-01T05:30:00.000Z');
    expect(repeated.offset).toBe('-04:00');
  });
});

describe('datetime() reading numbers, Dates and fields', () => {
  it('reads a number as milliseconds since 1970', () => {
    expect(datetime(1794850200000, 'Asia/Tokyo').toString()).toBe('2026-11-16T17:30:00.000Z');
  });

  it('drops a fraction of a millisecond the way Date does', () => {
    expect(datetime(1794850200000.9, 'UTC').epochMilliseconds).toBe(new Date(1794850200000.9).getTime());
  });

  it('reads a Date as the moment it holds', () => {
    const stamp = new Date('2026-11-16T17:30:00.250Z');
    expect(datetime(stamp, 'Asia/Tokyo').toString()).toBe('2026-11-16T17:30:00.250Z');
  });

  it('reads a fields object as wall-clock time in the zone given, with months counted from 1', () => {
    const standup = datetime({ year: 2026, month: 11, day: 16, hour: 9, minute: 30 }, 'Europe/Berlin');
    expect(standup.toString()).toBe('2026-11-16T08:30:00.000Z');
  });

  it('starts the clock at midnight when a fields object names only a date', () => {
    expect(datetime({ year: 2026, month: 11, day: 16 }, 'Asia/Tokyo').toString()).toBe('2026-11-15T15:00:00.000Z');
  });

  it('reads a CalendarDate as the start of that day in the zone given', () => {
    expect(datetime(date('2026-11-16'), 'America/New_York').toString()).toBe('2026-11-16T05:00:00.000Z');
  });
});

describe('datetime() reading a DateTime or a Temporal value', () => {
  const berlin = Temporal.ZonedDateTime.from('2026-11-16T18:30:00+01:00[Europe/Berlin]');

  it('keeps the zone of a DateTime when no zone is given', () => {
    const tokyo = datetime('2026-11-16T09:30', 'Asia/Tokyo');
    expect(datetime(tokyo)).toMatchObject({ zone: 'Asia/Tokyo', hour: 9, minute: 30 });
  });

  it('views a DateTime in the zone given without moving it', () => {
    const tokyo = datetime('2026-11-16T09:30', 'Asia/Tokyo');
    const viewed = datetime(tokyo, 'America/Los_Angeles');
    expect(viewed.toString()).toBe(tokyo.toString());
    expect(viewed).toMatchObject({ zone: 'America/Los_Angeles', day: 15, hour: 16 });
  });

  it('keeps the zone of a Temporal.ZonedDateTime when no zone is given', () => {
    expect(datetime(berlin)).toMatchObject({ zone: 'Europe/Berlin', hour: 18, minute: 30 });
  });

  it('views a Temporal.ZonedDateTime in the zone given without moving it', () => {
    const viewed = datetime(berlin, 'America/Los_Angeles');
    expect(viewed.toString()).toBe('2026-11-16T17:30:00.000Z');
    expect(viewed).toMatchObject({ zone: 'America/Los_Angeles', hour: 9 });
  });

  it('views a Temporal.Instant in the zone given', () => {
    const standup = datetime(Temporal.Instant.from('2026-11-16T17:30:00Z'), 'America/Los_Angeles');
    expect(standup.toString()).toBe('2026-11-16T17:30:00.000Z');
    expect(standup).toMatchObject({ zone: 'America/Los_Angeles', hour: 9 });
  });

  it('reads a Temporal.PlainDateTime as wall-clock time in the zone given', () => {
    const standup = datetime(Temporal.PlainDateTime.from('2026-11-16T09:30'), 'America/Los_Angeles');
    expect(standup.toString()).toBe('2026-11-16T17:30:00.000Z');
  });

  it('reads a Temporal.PlainDate as the start of that day in the zone given', () => {
    const day = datetime(Temporal.PlainDate.from('2026-11-16'), 'America/Los_Angeles');
    expect(day.toString()).toBe('2026-11-16T08:00:00.000Z');
  });

  it.todo('reads a Temporal value kept in another calendar by the ISO calendar, or refuses it with a code');
});

describe('datetime() choosing the zone', () => {
  afterEach(() => {
    configure({ zone: null });
  });

  it('reads in the zone the runtime reports when none is given or configured', () => {
    const local = datetime('2026-11-16T09:30');
    expect(local.zone).toBe(Intl.DateTimeFormat().resolvedOptions().timeZone);
    expect(local).toMatchObject({ hour: 9, minute: 30 });
  });

  it('reads in the zone set with configure() when none is given', () => {
    configure({ zone: 'Asia/Tokyo' });
    expect(datetime('2026-11-16T09:30').toString()).toBe('2026-11-16T00:30:00.000Z');
    expect(datetime('2026-11-16T00:30:00Z')).toMatchObject({ zone: 'Asia/Tokyo', hour: 9, minute: 30 });
    expect(datetime(1794850200000).zone).toBe('Asia/Tokyo');
  });

  it('prefers a zone argument, then a bracketed zone, over the configured one', () => {
    configure({ zone: 'Asia/Tokyo' });
    expect(datetime('2026-11-16T09:30', 'Europe/Berlin').zone).toBe('Europe/Berlin');
    expect(datetime('2026-11-16T09:30[America/New_York]').zone).toBe('America/New_York');
    expect(datetime('2026-11-16T09:30[America/New_York]', 'Europe/Berlin').zone).toBe('Europe/Berlin');
  });

  it('takes the zone from an options object as it does from a string', () => {
    const standup = datetime('2026-11-16T09:30', { zone: 'America/Los_Angeles' });
    expect(standup.zone).toBe('America/Los_Angeles');
    expect(standup.toString()).toBe('2026-11-16T17:30:00.000Z');
  });

  // 9:00 the next day in New York would be 13:00 UTC, an hour earlier
  it('accepts a fixed offset as the zone, which daylight saving never moves', () => {
    const fixed = datetime('2026-03-07T09:00', '-05:00');
    expect(fixed).toMatchObject({ zone: '-05:00', offset: '-05:00' });
    expect(fixed.plus(1, 'day').toString()).toBe('2026-03-08T14:00:00.000Z');
  });

  it('writes a zone name in its IANA casing however it was typed', () => {
    expect(datetime('2026-11-16T09:30', 'america/new_york').zone).toBe('America/New_York');
    expect(datetime('2026-11-16T09:30', 'utc').zone).toBe('UTC');
  });

  it('builds the same value from new DateTime() as from datetime()', () => {
    const built = new DateTime('2026-11-16T09:30', 'America/Los_Angeles');
    expect(built.toString()).toBe('2026-11-16T17:30:00.000Z');
    expect(built.zone).toBe('America/Los_Angeles');
  });
});

describe('datetime() refusing input', () => {
  it('refuses null and undefined with missingDateTime, so a missing value never becomes now', () => {
    expect(() => datetime(null)).toThrowError(
      expect.objectContaining({ name: 'TypeError', code: 'missingDateTime', at: 'null' }),
    );
    expect(() => datetime(undefined)).toThrowError(
      expect.objectContaining({ name: 'TypeError', code: 'missingDateTime', at: 'undefined' }),
    );
  });

  it('refuses a boolean and an array with a TypeError coded invalidDateTime', () => {
    expect(() => datetime(true)).toThrowError(
      expect.objectContaining({ name: 'TypeError', code: 'invalidDateTime', at: 'true' }),
    );
    expect(() => datetime([2026, 11, 16])).toThrowError(
      expect.objectContaining({ name: 'TypeError', code: 'invalidDateTime', at: '2026,11,16' }),
    );
  });

  it.each([
    ['text that is not a timestamp', 'not a timestamp'],
    ['an empty string', ''],
    ['a time with no date', '09:30'],
    ['an RFC 2822 date, which the loose plugin reads', 'Mon, 16 Nov 2026 17:30:00 GMT'],
  ])('refuses %s with a RangeError coded invalidDateTime at the text', (_, text) => {
    expect(() => datetime(text, 'UTC')).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'invalidDateTime', at: text }),
    );
  });

  it('refuses a month-first date instead of guessing which number is the month', () => {
    expect(() => datetime('03/05/2026', 'UTC')).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'invalidDateTime', at: '03/05/2026' }),
    );
  });

  it('refuses a date that does not exist instead of rolling it into the next month', () => {
    expect(() => datetime('2026-02-30T10:00', 'UTC')).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'invalidDateTime', at: '2026-02-30T10:00' }),
    );
    expect(() => datetime({ year: 2026, month: 2, day: 30 }, 'UTC')).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'invalidDateTime', at: '{"year":2026,"month":2,"day":30}' }),
    );
  });

  it('refuses a fields object that leaves out the day', () => {
    expect(() => datetime({ year: 2026, month: 2 }, 'UTC')).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'invalidDateTime', at: '{"year":2026,"month":2}' }),
    );
  });

  it('refuses an offset that disagrees with the bracketed zone', () => {
    const text = '2026-11-16T09:30-08:00[America/New_York]';
    expect(() => datetime(text)).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'invalidDateTime', at: text }),
    );
  });

  it('refuses NaN, Infinity and an invalid Date with invalidNumber', () => {
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

  it('refuses a zone it does not know, and a zone that is not text, with unknownZone', () => {
    expect(() => datetime('2026-11-16T09:30', 'Mars/Phobos')).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'unknownZone', at: 'Mars/Phobos' }),
    );
    expect(() => datetime('2026-11-16T09:30', 5)).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'unknownZone', at: '5' }),
    );
  });

  it.todo('refuses a number beyond the last moment Temporal can hold with a coded error');
  it.todo('refuses a fraction in a fields object instead of dropping it');
  it.todo('reads the time after a lowercase t instead of dropping it');
});

/*******************************
        Current Moment
*******************************/

describe('now(), startOfToday() and endOfToday()', () => {
  // Monday 17:30:00.250 UTC is 9:30 that morning in Los Angeles and already 2:30 on Tuesday in Tokyo
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-16T17:30:00.250Z'));
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('reads the current moment to the millisecond', () => {
    expect(now('UTC').toString()).toBe('2026-11-16T17:30:00.250Z');
  });

  it('views the current moment in the zone given', () => {
    expect(now('Asia/Tokyo')).toMatchObject({ zone: 'Asia/Tokyo', day: 17, hour: 2, minute: 30 });
  });

  it('starts today at midnight in the zone given', () => {
    expect(startOfToday('America/Los_Angeles').toString()).toBe('2026-11-16T08:00:00.000Z');
    expect(startOfToday('Asia/Tokyo').toString()).toBe('2026-11-16T15:00:00.000Z');
  });

  it('ends today on its last millisecond in the zone given', () => {
    expect(endOfToday('America/Los_Angeles').toString()).toBe('2026-11-17T07:59:59.999Z');
    expect(endOfToday('Asia/Tokyo').toString()).toBe('2026-11-17T14:59:59.999Z');
  });

  it('refuses a zone it does not know with unknownZone', () => {
    expect(() => now('Mars/Phobos')).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'unknownZone', at: 'Mars/Phobos' }),
    );
  });
});

describe('now() on the real clock', () => {
  // the platform clock reads finer than a millisecond, which a Date and a JSON string cannot carry
  it('holds nothing finer than a millisecond, so it comes back whole from JSON', () => {
    const moment = now('Asia/Tokyo');
    expect(moment).toMatchObject({ microsecond: 0, nanosecond: 0 });
    expect(datetime(JSON.parse(JSON.stringify(moment))).equals(moment)).toBe(true);
  });
});

/*******************************
             Parts
*******************************/

describe('DateTime parts', () => {
  const standup = datetime('2026-11-16T09:30:15.250', 'America/Los_Angeles');

  it('reads the calendar and clock fields in its own zone', () => {
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

  it('reads the offset in force at that moment, which daylight saving changes', () => {
    expect(datetime('2026-01-15T12:00', 'America/New_York').offset).toBe('-05:00');
    expect(datetime('2026-07-15T12:00', 'America/New_York').offset).toBe('-04:00');
    expect(datetime('2026-07-15T12:00', 'Asia/Kolkata').offset).toBe('+05:30');
    expect(datetime('2026-07-15T12:00', 'UTC').offset).toBe('+00:00');
  });

  it('counts seconds, milliseconds and nanoseconds since 1970', () => {
    const stamp = datetime('2026-11-16T17:30:00.250Z', 'Asia/Tokyo');
    expect(stamp.epochSeconds).toBe(1794850200);
    expect(stamp.epochMilliseconds).toBe(1794850200250);
    expect(stamp.epochNanoseconds).toBe(1794850200250000000n);
  });

  it('rounds epochSeconds down, before 1970 as well as after', () => {
    expect(datetime('2026-11-16T17:30:00.999Z').epochSeconds).toBe(1794850200);
    expect(datetime('1969-12-31T23:59:59.500Z').epochSeconds).toBe(-1);
  });

  // 02:00 UTC on Monday the 16th is still Sunday evening in Los Angeles
  it('numbers the day of the week from 1 for Monday to 7 for Sunday, in its own zone', () => {
    const moment = datetime('2026-11-16T02:00:00Z', 'UTC');
    expect(moment.dayOfWeek).toBe(1);
    expect(moment.in('America/Los_Angeles').dayOfWeek).toBe(7);
  });

  it('reads the quarter, the day of the year and the ISO week', () => {
    expect(standup).toMatchObject({ quarter: 4, dayOfYear: 320, weekOfYear: 47 });
    expect(datetime('2026-01-01T12:00', 'UTC')).toMatchObject({ quarter: 1, dayOfYear: 1, weekOfYear: 1 });
  });

  it('puts three months in each quarter', () => {
    const months = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
    const quarters = months.map((month) => datetime({ year: 2026, month, day: 15 }, 'UTC').quarter);
    expect(quarters).toEqual([1, 1, 1, 2, 2, 2, 3, 3, 3, 4, 4, 4]);
  });

  it('gives the first days of January to the last ISO week of the year before when that week holds them', () => {
    expect(datetime('2027-01-01T12:00', 'UTC').weekOfYear).toBe(53);
  });

  it('counts the days in its month and its year, and knows a leap year', () => {
    const leap = datetime('2028-02-10T12:00', 'UTC');
    const common = datetime('2026-02-10T12:00', 'UTC');
    expect(leap).toMatchObject({ daysInMonth: 29, daysInYear: 366 });
    expect(common).toMatchObject({ daysInMonth: 28, daysInYear: 365 });
    expect(leap.isLeapYear()).toBe(true);
    expect(common.isLeapYear()).toBe(false);
  });

  it('counts 23, 24 or 25 hours in a day around a clock change', () => {
    expect(datetime('2026-03-08T12:00', 'America/New_York').hoursInDay).toBe(23);
    expect(datetime('2026-03-09T12:00', 'America/New_York').hoursInDay).toBe(24);
    expect(datetime('2026-11-01T12:00', 'America/New_York').hoursInDay).toBe(25);
  });

  // 03:00 UTC on Saturday the 14th is still Friday evening in Los Angeles
  it('calls Saturday and Sunday the weekend, judged in its own zone', () => {
    const moment = datetime('2026-11-14T03:00:00Z', 'UTC');
    expect(moment.isWeekend()).toBe(true);
    expect(moment.isWeekday()).toBe(false);
    expect(moment.in('America/Los_Angeles').isWeekend()).toBe(false);
    expect(moment.in('America/Los_Angeles').isWeekday()).toBe(true);
  });

  // 20:00 UTC on New Year's Eve is 5:00 on New Year's Day in Tokyo
  it('hands out its date, time, year-month and month-day as they read in its own zone', () => {
    const tokyo = datetime('2026-12-31T20:00:15Z', 'Asia/Tokyo');
    expect(tokyo.date.toString()).toBe('2027-01-01');
    expect(tokyo.time.toString()).toBe('05:00:15');
    expect(tokyo.yearMonth.toString()).toBe('2027-01');
    expect(tokyo.monthDay.toString()).toBe('01-01');
  });

  it('converts with as() to what the property of the same name holds', () => {
    const tokyo = datetime('2026-11-16T09:30', 'America/Los_Angeles').in('Asia/Tokyo');
    expect(tokyo.as('date').toString()).toBe('2026-11-17');
    expect(tokyo.as('time').toString()).toBe('02:30:00');
    expect(tokyo.as('yearMonth').toString()).toBe('2026-11');
    expect(tokyo.as('monthDay').toString()).toBe('11-17');
    expect(tokyo.as('datetime').toString()).toBe('2026-11-16T17:30:00.000Z');
  });

  it('refuses a kind as() does not know with unknownKind', () => {
    expect(() => standup.as('week')).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'unknownKind', at: 'week' }),
    );
  });

  it('cannot be changed in place', () => {
    expect(Object.isFrozen(standup)).toBe(true);
    expect(() => {
      standup.hour = 17;
    }).toThrowError(TypeError);
    expect(standup.hour).toBe(9);
  });
});

/*******************************
       Zone, Time and Fields
*******************************/

describe('DateTime.in()', () => {
  const standup = datetime('2026-11-16T09:30', 'America/Los_Angeles');

  it('views the same moment in another zone', () => {
    const berlin = standup.in('Europe/Berlin');
    expect(berlin).toMatchObject({ zone: 'Europe/Berlin', offset: '+01:00', hour: 18, minute: 30 });
    expect(berlin.toString()).toBe(standup.toString());
    expect(berlin.equals(standup)).toBe(true);
  });

  it('moves the calendar day when the other zone is already on the next one', () => {
    expect(standup.in('Asia/Tokyo')).toMatchObject({ day: 17, hour: 2, dayOfWeek: 2 });
  });

  it('leaves the value it was called on in its own zone', () => {
    standup.in('Europe/Berlin');
    expect(standup).toMatchObject({ zone: 'America/Los_Angeles', hour: 9 });
  });

  it('refuses a zone it does not know with unknownZone', () => {
    expect(() => standup.in('Mars/Phobos')).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'unknownZone', at: 'Mars/Phobos' }),
    );
  });
});

describe('DateTime.at()', () => {
  const morning = datetime('2026-11-16T09:30:15.250', 'America/Los_Angeles');

  it('replaces the whole time of day and keeps the day and the zone', () => {
    const wrapUp = morning.at('5:00pm');
    expect(wrapUp.toString()).toBe('2026-11-17T01:00:00.000Z');
    expect(wrapUp).toMatchObject({ zone: 'America/Los_Angeles', day: 16, hour: 17, minute: 0 });
  });

  it('takes the time as text, as a Time or as a fields object', () => {
    expect(morning.at('17:45').toString()).toBe('2026-11-17T01:45:00.000Z');
    expect(morning.at(time('17:45')).toString()).toBe('2026-11-17T01:45:00.000Z');
    expect(morning.at({ hour: 17, minute: 45 }).toString()).toBe('2026-11-17T01:45:00.000Z');
  });

  // 2:30 on the 17th in Tokyo is still the 16th in UTC and in New York
  it('keeps the day the value has in its own zone', () => {
    const earlyTokyo = datetime('2026-11-17T02:30', 'Asia/Tokyo');
    expect(earlyTokyo.at('9am').toString()).toBe('2026-11-17T00:00:00.000Z');
  });

  it('moves a time skipped by a clock change forward by the length of the gap', () => {
    const springForward = datetime('2026-03-08T12:00', 'America/New_York');
    expect(springForward.at('2:30am')).toMatchObject({ day: 8, hour: 3, minute: 30 });
  });

  it('refuses a time that does not exist with invalidTime', () => {
    expect(() => morning.at('25:00')).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'invalidTime', at: '25:00' }),
    );
  });

  it.todo('reads the time of day of a Date in its own zone, whatever zone the machine is in');
});

describe('DateTime.set()', () => {
  const cutoff = datetime('2026-11-16T09:30:15.250', 'America/New_York');

  it('replaces one field named by its unit and leaves the rest alone', () => {
    expect(cutoff.set('hour', 17).toString()).toBe('2026-11-16T22:30:15.250Z');
    expect(cutoff.set('day', 2).toString()).toBe('2026-11-02T14:30:15.250Z');
  });

  it('replaces several fields at once', () => {
    const firstOfDecember = cutoff.set({ month: 12, day: 1, hour: 0, minute: 0 });
    expect(firstOfDecember.toString()).toBe('2026-12-01T05:00:15.250Z');
  });

  it('takes the unit in the singular or the plural', () => {
    expect(cutoff.set('hours', 17).toString()).toBe('2026-11-16T22:30:15.250Z');
  });

  it('keeps the zone and reads the new fields in it', () => {
    expect(cutoff.set('hour', 17)).toMatchObject({ zone: 'America/New_York', hour: 17, offset: '-05:00' });
  });

  it('refuses a day the month does not have instead of rolling into the next month', () => {
    expect(() => cutoff.set({ month: 2, day: 30 })).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'cannotSet', at: '{"month":2,"day":30}' }),
    );
  });

  it('refuses a fraction and a value the clock does not have with cannotSet', () => {
    expect(() => cutoff.set('hour', 9.5)).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'cannotSet', at: '{"hour":9.5}' }),
    );
    expect(() => cutoff.set('hour', 24)).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'cannotSet', at: '{"hour":24}' }),
    );
  });

  it('refuses a unit it does not know with unknownUnit', () => {
    expect(() => cutoff.set('fortnight', 2)).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'unknownUnit', at: 'fortnight' }),
    );
  });

  it('moves an hour skipped by a clock change forward by the length of the gap', () => {
    const springForward = datetime('2026-03-08T12:30', 'America/New_York');
    expect(springForward.set('hour', 2)).toMatchObject({ day: 8, hour: 3, minute: 30 });
  });

  // 06:30 UTC is the second 1:30 that morning in New York, after the clocks have gone back
  it('stays on the same side of a clock change inside a repeated hour', () => {
    const secondHalfPastOne = datetime('2026-11-01T06:30:00Z', 'America/New_York');
    expect(secondHalfPastOne.set('minute', 45).toString()).toBe('2026-11-01T06:45:00.000Z');
  });

  it.todo('refuses null or true as a field value instead of reading them as 0 and 1');
});

/*******************************
           Arithmetic
*******************************/

describe('DateTime.plus() and minus()', () => {
  // New York loses an hour on Sunday 2026-03-08 and gains one on Sunday 2026-11-01
  const saturday = datetime('2026-03-07T09:00', 'America/New_York');
  const halloween = datetime('2026-10-31T09:00', 'America/New_York');

  it('keeps the time of day when adding days across a clock change', () => {
    expect(saturday.plus(1, 'day')).toMatchObject({ day: 8, hour: 9, offset: '-04:00' });
    expect(halloween.plus(1, 'day')).toMatchObject({ day: 1, hour: 9, offset: '-05:00' });
  });

  it('counts elapsed time when adding hours across a clock change', () => {
    expect(saturday.plus(24, 'hours')).toMatchObject({ day: 8, hour: 10 });
    expect(halloween.plus(24, 'hours')).toMatchObject({ day: 1, hour: 8 });
  });

  it('keeps the time of day when adding weeks, months and years', () => {
    const wednesday = datetime('2026-03-04T09:00', 'America/New_York');
    expect(wednesday.plus(1, 'week').toString()).toBe('2026-03-11T13:00:00.000Z');
    expect(wednesday.plus(1, 'month').toString()).toBe('2026-04-04T13:00:00.000Z');
    expect(wednesday.plus(1, 'year').toString()).toBe('2027-03-04T14:00:00.000Z');
  });

  it('takes a count and unit, a phrase, an ISO duration, a fields object, a Duration or milliseconds', () => {
    const later = '2026-03-07T15:30:00.000Z';
    expect(saturday.plus(90, 'minutes').toString()).toBe(later);
    expect(saturday.plus('1h 30m').toString()).toBe(later);
    expect(saturday.plus('PT90M').toString()).toBe(later);
    expect(saturday.plus({ hours: 1, minutes: 30 }).toString()).toBe(later);
    expect(saturday.plus(duration('1h 30m')).toString()).toBe(later);
    expect(saturday.plus(5400000).toString()).toBe(later);
  });

  it('adds the days of a mixed amount by the calendar and its hours by the clock', () => {
    expect(saturday.plus({ days: 1, hours: 4 })).toMatchObject({ day: 8, hour: 13 });
  });

  it('stops at the last day of a shorter month', () => {
    expect(datetime('2026-01-31T09:00', 'UTC').plus(1, 'month').toString()).toBe('2026-02-28T09:00:00.000Z');
    expect(datetime('2028-01-31T09:00', 'UTC').plus(1, 'month').toString()).toBe('2028-02-29T09:00:00.000Z');
    expect(datetime('2026-03-31T09:00', 'UTC').minus(1, 'month').toString()).toBe('2026-02-28T09:00:00.000Z');
    expect(datetime('2028-02-29T09:00', 'UTC').plus(1, 'year').toString()).toBe('2029-02-28T09:00:00.000Z');
  });

  it('moves back with minus() by the same rules', () => {
    const deadline = datetime('2026-11-16T17:00', 'America/New_York');
    expect(deadline.minus(48, 'hours').toString()).toBe('2026-11-14T22:00:00.000Z');
    expect(deadline.minus({ weeks: 1, days: 2 }).toString()).toBe('2026-11-07T22:00:00.000Z');
    expect(saturday.plus(1, 'day').minus(1, 'day').toString()).toBe(saturday.toString());
  });

  it('answers to add() and subtract() as it does to plus() and minus()', () => {
    expect(saturday.add(1, 'day').toString()).toBe(saturday.plus(1, 'day').toString());
    expect(saturday.subtract(90, 'minutes').toString()).toBe(saturday.minus(90, 'minutes').toString());
  });

  it('returns a new value and leaves the original where it was', () => {
    const later = saturday.plus(1, 'day');
    expect(later).not.toBe(saturday);
    expect(saturday.toString()).toBe('2026-03-07T14:00:00.000Z');
  });

  it('moves a time of day skipped on the day it lands on forward by the length of the gap', () => {
    const earlySaturday = datetime('2026-03-07T02:30', 'America/New_York');
    expect(earlySaturday.plus(1, 'day')).toMatchObject({ day: 8, hour: 3, minute: 30 });
  });

  it('refuses a missing amount with a TypeError coded invalidDuration', () => {
    expect(() => saturday.plus(null)).toThrowError(
      expect.objectContaining({ name: 'TypeError', code: 'invalidDuration', at: 'null' }),
    );
    expect(() => saturday.minus(undefined)).toThrowError(
      expect.objectContaining({ name: 'TypeError', code: 'invalidDuration', at: 'undefined' }),
    );
  });

  it('refuses a unit it does not know with unknownUnit', () => {
    expect(() => saturday.plus(1, 'fortnight')).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'unknownUnit', at: 'fortnight' }),
    );
  });

  it('refuses to move past the last date it can hold with cannotAdd or cannotSubtract', () => {
    expect(() => saturday.plus(1e9, 'years')).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'cannotAdd', at: '1000000000 years' }),
    );
    expect(() => saturday.minus(1e9, 'years')).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'cannotSubtract', at: '1000000000 years' }),
    );
  });
});

/*******************************
      Boundaries and Rounding
*******************************/

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
  ])('finds the first and the last millisecond of the %s', (unit, start, end) => {
    expect(wednesday.startOf(unit).toString()).toBe(start);
    expect(wednesday.endOf(unit).toString()).toBe(end);
  });

  it('keeps the last day of March in the first quarter and the first of April in the second', () => {
    const lastOfMarch = datetime('2026-03-31T12:00', 'UTC');
    const firstOfApril = datetime('2026-04-01T12:00', 'UTC');
    expect(lastOfMarch.startOf('quarter').toString()).toBe('2026-01-01T00:00:00.000Z');
    expect(lastOfMarch.endOf('quarter').toString()).toBe('2026-03-31T23:59:59.999Z');
    expect(firstOfApril.startOf('quarter').toString()).toBe('2026-04-01T00:00:00.000Z');
    expect(firstOfApril.endOf('quarter').toString()).toBe('2026-06-30T23:59:59.999Z');
  });

  it('starts and ends the week on the first day asked for, by name or by number', () => {
    expect(wednesday.startOf('week', 'monday').toString()).toBe('2026-11-16T00:00:00.000Z');
    expect(wednesday.endOf('week', 'monday').toString()).toBe('2026-11-22T23:59:59.999Z');
    expect(wednesday.startOf('week', 'sunday').toString()).toBe('2026-11-15T00:00:00.000Z');
    expect(wednesday.endOf('week', 7).toString()).toBe('2026-11-21T23:59:59.999Z');
  });

  it('stays put when it is already the first day of the week asked for', () => {
    expect(wednesday.startOf('week', 'wednesday').toString()).toBe('2026-11-18T00:00:00.000Z');
  });

  // 02:00 UTC on the 17th is 18:00 on the 16th in Los Angeles
  it('finds the day in its own zone', () => {
    const evening = datetime('2026-11-17T02:00:00Z', 'America/Los_Angeles');
    expect(evening.startOf('day').toString()).toBe('2026-11-16T08:00:00.000Z');
    expect(evening.endOf('day').toString()).toBe('2026-11-17T07:59:59.999Z');
  });

  // New York is on daylight time until 2:00 on 2026-11-01, so November starts an hour of UTC earlier than it ends
  it('uses the offset in force at each boundary when a clock change falls inside the unit', () => {
    const midNovember = datetime('2026-11-18T14:45', 'America/New_York');
    expect(midNovember.startOf('month').toString()).toBe('2026-11-01T04:00:00.000Z');
    expect(midNovember.endOf('month').toString()).toBe('2026-12-01T04:59:59.999Z');
  });

  it('ends a 23-hour day and a 25-hour day on their own last millisecond', () => {
    const springForward = datetime('2026-03-08T12:00', 'America/New_York');
    const fallBack = datetime('2026-11-01T12:00', 'America/New_York');
    expect(springForward.startOf('day').toString()).toBe('2026-03-08T05:00:00.000Z');
    expect(springForward.endOf('day').toString()).toBe('2026-03-09T03:59:59.999Z');
    expect(fallBack.startOf('day').toString()).toBe('2026-11-01T04:00:00.000Z');
    expect(fallBack.endOf('day').toString()).toBe('2026-11-02T04:59:59.999Z');
  });

  // Cairo moves its clocks from 0:00 straight to 1:00 on Friday 2026-04-24, so that day has no midnight
  it('starts a day whose midnight is skipped at the first moment that day has', () => {
    const friday = datetime('2026-04-24T12:00', 'Africa/Cairo');
    expect(friday.startOf('day')).toMatchObject({ day: 24, hour: 1, minute: 0 });
    expect(friday.startOf('day').toString()).toBe('2026-04-23T22:00:00.000Z');
  });

  it.todo('ends a day whose midnight is skipped on the last millisecond of that same day');

  it('ends a microsecond on its last nanosecond', () => {
    const precise = datetime('2026-11-18T14:45:12.345678912Z', 'UTC');
    expect(precise.startOf('microsecond').toString()).toBe('2026-11-18T14:45:12.345678Z');
    expect(precise.endOf('microsecond').toString()).toBe('2026-11-18T14:45:12.345678999Z');
  });

  it('returns a new value and leaves the original where it was', () => {
    wednesday.startOf('year');
    expect(wednesday.toString()).toBe('2026-11-18T14:45:12.345Z');
  });

  it('refuses a unit it does not know with unknownUnit', () => {
    expect(() => wednesday.startOf('fortnight')).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'unknownUnit', at: 'fortnight' }),
    );
    expect(() => wednesday.endOf('fortnight')).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'unknownUnit', at: 'fortnight' }),
    );
  });

  it('refuses a first day of the week it does not know with unknownDayOfWeek', () => {
    expect(() => wednesday.startOf('week', 'funday')).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'unknownDayOfWeek', at: 'funday' }),
    );
  });
});

describe('DateTime.round(), floor() and ceil()', () => {
  const stamp = datetime('2026-11-16T09:23:40', 'UTC');

  it('rounds to the nearest whole unit', () => {
    expect(stamp.round('hour').toString()).toBe('2026-11-16T09:00:00.000Z');
    expect(stamp.round('minute').toString()).toBe('2026-11-16T09:24:00.000Z');
  });

  it('rounds to the nearest step of a unit', () => {
    expect(stamp.round(15, 'minutes').toString()).toBe('2026-11-16T09:30:00.000Z');
    expect(stamp.round(6, 'hours').toString()).toBe('2026-11-16T12:00:00.000Z');
  });

  it('rounds a value exactly half way up', () => {
    expect(datetime('2026-11-16T09:30', 'UTC').round('hour').toString()).toBe('2026-11-16T10:00:00.000Z');
    expect(datetime('2026-11-16T09:07:30', 'UTC').round(15, 'minutes').toString()).toBe('2026-11-16T09:15:00.000Z');
  });

  it('rounds down with floor() and up with ceil()', () => {
    expect(stamp.floor('hour').toString()).toBe('2026-11-16T09:00:00.000Z');
    expect(stamp.ceil('hour').toString()).toBe('2026-11-16T10:00:00.000Z');
    expect(datetime('2026-11-16T09:29', 'UTC').floor(15, 'minutes').toString()).toBe('2026-11-16T09:15:00.000Z');
    expect(datetime('2026-11-16T09:01', 'UTC').ceil(15, 'minutes').toString()).toBe('2026-11-16T09:15:00.000Z');
  });

  it('leaves a value that already sits on the step where it is', () => {
    const quarterPast = datetime('2026-11-16T09:15', 'UTC');
    expect(quarterPast.round(15, 'minutes').toString()).toBe('2026-11-16T09:15:00.000Z');
    expect(quarterPast.floor(15, 'minutes').toString()).toBe('2026-11-16T09:15:00.000Z');
    expect(quarterPast.ceil(15, 'minutes').toString()).toBe('2026-11-16T09:15:00.000Z');
  });

  it('rounds to the day, with noon going to the next one', () => {
    expect(datetime('2026-11-16T11:59', 'UTC').round('day').toString()).toBe('2026-11-16T00:00:00.000Z');
    expect(datetime('2026-11-16T12:00', 'UTC').round('day').toString()).toBe('2026-11-17T00:00:00.000Z');
  });

  // Kathmandu is 5:45 ahead of UTC, so the top of its hour is a quarter past in UTC
  it('rounds the wall clock of its own zone, not the UTC clock', () => {
    const kathmandu = datetime('2026-11-18T14:45', 'Asia/Kathmandu');
    expect(kathmandu.floor('hour')).toMatchObject({ hour: 14, minute: 0 });
    expect(kathmandu.floor('hour').toString()).toBe('2026-11-18T08:15:00.000Z');
  });

  it('refuses a unit larger than a day with cannotRound', () => {
    expect(() => stamp.round('month')).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'cannotRound', at: '1 month' }),
    );
  });

  it('refuses a step that does not divide the next larger unit evenly with cannotRound', () => {
    expect(() => stamp.round(7, 'minutes')).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'cannotRound', at: '7 minutes' }),
    );
  });

  it.todo('refuses a step with a fraction instead of rounding to the whole step below it');

  it('refuses a unit it does not know with unknownUnit', () => {
    expect(() => stamp.round('fortnight')).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'unknownUnit', at: 'fortnight' }),
    );
  });
});

/*******************************
            Stepping
*******************************/

describe('DateTime.next() and previous()', () => {
  const monday = datetime('2026-11-16T09:30:15.250', 'America/Los_Angeles');

  it('steps forward to the next given weekday at the same time of day', () => {
    expect(monday.next('friday').toString()).toBe('2026-11-20T17:30:15.250Z');
  });

  it('steps back to the most recent given weekday at the same time of day', () => {
    expect(monday.previous('friday').toString()).toBe('2026-11-13T17:30:15.250Z');
  });

  it('moves a full week when it already falls on that weekday', () => {
    expect(monday.next('monday')).toMatchObject({ day: 23, hour: 9 });
    expect(monday.previous('monday')).toMatchObject({ day: 9, hour: 9 });
  });

  it('takes a weekday as a name in any case, a three-letter prefix or a number from 1 to 7', () => {
    expect(monday.next('Friday').day).toBe(20);
    expect(monday.next('fri').day).toBe(20);
    expect(monday.next(5).day).toBe(20);
    expect(monday.next(7).day).toBe(22);
  });

  it('keeps the time of day across a clock change', () => {
    const saturday = datetime('2026-03-07T09:00', 'America/New_York');
    expect(saturday.next('sunday').toString()).toBe('2026-03-08T13:00:00.000Z');
  });

  // Los Angeles is still on daylight time on October 31, an hour of UTC earlier than in mid November
  it('steps to the next and the previous occurrence of a MonthDay at the same time of day', () => {
    expect(monday.next(monthDay('12-25')).toString()).toBe('2026-12-25T17:30:15.250Z');
    expect(monday.previous(monthDay('10-31')).toString()).toBe('2026-10-31T16:30:15.250Z');
  });

  it('moves a full year when it already falls on that MonthDay', () => {
    expect(monday.next(monthDay('11-16'))).toMatchObject({ year: 2027, month: 11, day: 16 });
    expect(monday.previous(monthDay('11-16'))).toMatchObject({ year: 2025, month: 11, day: 16 });
  });

  it.each([['funday', 'funday'], [0, '0'], [8, '8']])(
    'refuses %s as a weekday with unknownDayOfWeek',
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

/*******************************
            Comparing
*******************************/

describe('DateTime.equals(), isBefore() and isAfter()', () => {
  const noon = datetime('2026-11-16T12:00', 'America/New_York');

  it('calls two views of one moment equal, whatever their zones', () => {
    expect(noon.equals(datetime('2026-11-16T17:00Z', 'UTC'))).toBe(true);
    expect(noon.equals(noon.in('Asia/Tokyo'))).toBe(true);
    expect(noon.equals(datetime('2026-11-16T12:00', 'UTC'))).toBe(false);
  });

  it('compares with anything datetime() reads', () => {
    expect(noon.equals('2026-11-16T17:00:00Z')).toBe(true);
    expect(noon.equals(new Date('2026-11-16T17:00:00Z'))).toBe(true);
    expect(noon.equals(1794848400000)).toBe(true);
    expect(noon.equals(Temporal.ZonedDateTime.from('2026-11-16T18:00:00+01:00[Europe/Berlin]'))).toBe(true);
  });

  it('reads wall-clock text in the zone of the value it is compared with', () => {
    const tokyo = datetime('2026-11-16T09:30', 'Asia/Tokyo');
    expect(tokyo.equals('2026-11-16T09:30')).toBe(true);
    expect(tokyo.isBefore('2026-11-16T09:31')).toBe(true);
    expect(tokyo.isAfter('2026-11-16T09:29')).toBe(true);
  });

  // 9:00 in Los Angeles is 17:00 UTC and 11:00 in New York is 16:00 UTC
  it('orders moments by when they happen, not by what their clocks read', () => {
    const losAngeles = datetime('2026-11-16T09:00', 'America/Los_Angeles');
    const newYork = datetime('2026-11-16T11:00', 'America/New_York');
    expect(newYork.isBefore(losAngeles)).toBe(true);
    expect(losAngeles.isAfter(newYork)).toBe(true);
    expect(losAngeles.isBefore(newYork)).toBe(false);
    expect(newYork.isAfter(losAngeles)).toBe(false);
  });

  it('calls a moment neither before nor after itself', () => {
    expect(noon.isBefore(noon.in('UTC'))).toBe(false);
    expect(noon.isAfter(noon.in('UTC'))).toBe(false);
  });

  it('tells apart moments a millisecond from each other', () => {
    const next = noon.plus(1, 'millisecond');
    expect(noon.equals(next)).toBe(false);
    expect(noon.isBefore(next)).toBe(true);
  });

  it('refuses to compare with a missing value', () => {
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

  // 02:00 UTC on the 17th is 18:00 on the 16th in Los Angeles
  it('compares the calendar day as it reads in the zone of the value it is called on', () => {
    const lateUtc = datetime('2026-11-17T02:00Z', 'UTC');
    expect(standup.isSame(lateUtc, 'day')).toBe(true);
    expect(lateUtc.isSame(standup, 'day')).toBe(false);
  });

  it('checks for the very same moment when no unit is given', () => {
    expect(standup.isSame(standup.in('Asia/Tokyo'))).toBe(true);
    expect(standup.isSame(standup.plus(1, 'second'))).toBe(false);
  });

  it('checks the hour, the month, the quarter and the year', () => {
    expect(standup.isSame('2026-11-16T09:59:59', 'hour')).toBe(true);
    expect(standup.isSame('2026-11-16T10:00', 'hour')).toBe(false);
    expect(standup.isSame('2026-11-30T23:59', 'month')).toBe(true);
    expect(standup.isSame('2026-12-01T00:00', 'month')).toBe(false);
    expect(standup.isSame('2026-10-01T00:00', 'quarter')).toBe(true);
    expect(standup.isSame('2026-09-30T23:59', 'quarter')).toBe(false);
    expect(standup.isSame('2026-01-01T00:00', 'year')).toBe(true);
    expect(standup.isSame('2027-01-01T00:00', 'year')).toBe(false);
  });

  it('checks the week from the first day asked for', () => {
    const sunday = '2026-11-15T12:00';
    expect(standup.isSame(sunday, 'week', 'sunday')).toBe(true);
    expect(standup.isSame(sunday, 'week', 'monday')).toBe(false);
  });

  it('refuses a unit it does not know with unknownUnit', () => {
    expect(() => standup.isSame(standup, 'fortnight')).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'unknownUnit', at: 'fortnight' }),
    );
  });
});

describe('DateTime.isPast(), isFuture(), isToday(), isTomorrow() and isYesterday()', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-16T17:30:00.250Z'));
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('calls a moment before the current one past and a moment after it future', () => {
    const justNow = datetime('2026-11-16T17:30:00.249Z');
    const soon = datetime('2026-11-16T17:30:00.251Z');
    expect(justNow.isPast()).toBe(true);
    expect(justNow.isFuture()).toBe(false);
    expect(soon.isFuture()).toBe(true);
    expect(soon.isPast()).toBe(false);
  });

  it('calls the current moment neither past nor future', () => {
    expect(now().isPast()).toBe(false);
    expect(now().isFuture()).toBe(false);
  });

  // 01:00 UTC on the 17th is tomorrow by the UTC calendar and already today by Tokyo's
  it('judges today, tomorrow and yesterday by the calendar of its own zone', () => {
    const moment = datetime('2026-11-17T01:00:00Z', 'UTC');
    expect(moment.isToday()).toBe(false);
    expect(moment.isTomorrow()).toBe(true);
    expect(moment.in('Asia/Tokyo').isToday()).toBe(true);
    expect(moment.in('Asia/Tokyo').isTomorrow()).toBe(false);
  });

  it('calls any time on the previous calendar day yesterday, and no other day', () => {
    expect(datetime('2026-11-15T00:00', 'UTC').isYesterday()).toBe(true);
    expect(datetime('2026-11-15T23:59', 'UTC').isYesterday()).toBe(true);
    expect(datetime('2026-11-14T23:59', 'UTC').isYesterday()).toBe(false);
    expect(datetime('2026-11-16T00:00', 'UTC').isYesterday()).toBe(false);
  });
});

/*******************************
            Measuring
*******************************/

describe('DateTime.until() and since()', () => {
  const doors = datetime('2026-11-16T08:00', 'America/Los_Angeles');
  const standup = datetime('2026-11-16T09:30', 'America/Los_Angeles');

  it('measures the span to a later moment as a Duration', () => {
    expect(doors.until(standup).toString()).toBe('PT1H30M');
  });

  it('measures the span as a number when a unit is given', () => {
    expect(doors.until(standup, 'hours')).toBe(1.5);
    expect(doors.until(standup, 'minutes')).toBe(90);
  });

  it('measures a negative span to an earlier moment', () => {
    expect(standup.until(doors).toString()).toBe('-PT1H30M');
    expect(standup.until(doors, 'hours')).toBe(-1.5);
  });

  it('measures since() as the same span seen from the later moment', () => {
    expect(standup.since(doors).toString()).toBe('PT1H30M');
    expect(standup.since(doors, 'minutes')).toBe(90);
    expect(doors.since(standup, 'minutes')).toBe(-90);
  });

  it('reads wall-clock text in its own zone', () => {
    expect(doors.until('2026-11-16T09:30', 'minutes')).toBe(90);
    expect(standup.since('2026-11-16T08:00', 'minutes')).toBe(90);
  });

  // 2:00 on the 17th in Tokyo is 17:00 UTC on the 16th, an hour after the doors open
  it('measures between moments held in different zones', () => {
    expect(doors.until(datetime('2026-11-17T02:00', 'Asia/Tokyo'), 'hours')).toBe(1);
  });

  it('balances a long span into years, months, days and clock units', () => {
    const start = datetime('2026-01-15T09:00', 'America/New_York');
    expect(start.until('2027-03-18T10:30').toString()).toBe('P1Y2M3DT1H30M');
  });

  it('counts one calendar day across a clock change, of 23 or 25 hours', () => {
    const saturday = datetime('2026-03-07T09:00', 'America/New_York');
    const halloween = datetime('2026-10-31T09:00', 'America/New_York');
    expect(saturday.until('2026-03-08T09:00').toString()).toBe('P1D');
    expect(saturday.until('2026-03-08T09:00', 'hours')).toBe(23);
    expect(halloween.until('2026-11-01T09:00', 'days')).toBe(1);
    expect(halloween.until('2026-11-01T09:00', 'hours')).toBe(25);
  });

  // January 15 to March 15 is 59 days, one of them an hour short in New York
  it('totals months and days by the calendar and hours by the clock', () => {
    const start = datetime('2026-01-15T09:00', 'America/New_York');
    expect(start.until('2026-03-15T09:00', 'months')).toBe(2);
    expect(start.until('2026-03-15T09:00', 'days')).toBe(59);
    expect(start.until('2026-03-15T09:00', 'hours')).toBe(1415);
  });

  it('hands back a span that remembers where it started, so its months can be totalled in days', () => {
    const start = datetime('2026-01-15T09:00', 'America/New_York');
    const span = start.until('2026-03-15T09:00');
    expect(span.toString()).toBe('P2M');
    expect(span.total('days')).toBe(59);
  });

  // Saturday 9:00 to Sunday 9:00 in New York is one calendar day there and 23 hours on the UTC clock
  it('measures calendar units in the zone of the value it is called on', () => {
    const saturday = datetime('2026-03-07T09:00', 'America/New_York');
    const sundayInUtc = datetime('2026-03-08T13:00:00Z', 'UTC');
    expect(saturday.until(sundayInUtc).toString()).toBe('P1D');
    expect(sundayInUtc.since(saturday).toString()).toBe('PT23H');
  });

  it('lands on the later moment when the span is added back', () => {
    const start = datetime('2026-01-31T09:00', 'America/New_York');
    const end = datetime('2027-03-01T10:30', 'America/New_York');
    expect(start.plus(start.until(end)).toString()).toBe(end.toString());
  });

  it('refuses a missing moment with missingDateTime', () => {
    expect(() => doors.until(null)).toThrowError(
      expect.objectContaining({ name: 'TypeError', code: 'missingDateTime', at: 'null' }),
    );
    expect(() => doors.since(undefined)).toThrowError(
      expect.objectContaining({ name: 'TypeError', code: 'missingDateTime', at: 'undefined' }),
    );
  });

  it('refuses a unit it does not know with unknownUnit', () => {
    expect(() => doors.until(standup, 'fortnight')).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'unknownUnit', at: 'fortnight' }),
    );
  });
});

/*******************************
             Output
*******************************/

describe('DateTime as a string and as JSON', () => {
  const standup = datetime('2026-11-16T09:30', 'America/Los_Angeles');

  it('writes itself as a UTC ISO 8601 string with milliseconds, whatever its zone', () => {
    expect(standup.toString()).toBe('2026-11-16T17:30:00.000Z');
    expect(standup.in('Asia/Tokyo').toString()).toBe('2026-11-16T17:30:00.000Z');
  });

  it('writes the same string for String(), a template literal and string concatenation', () => {
    expect(String(standup)).toBe('2026-11-16T17:30:00.000Z');
    expect(`${standup}`).toBe('2026-11-16T17:30:00.000Z');
    expect('starts ' + standup).toBe('starts 2026-11-16T17:30:00.000Z');
  });

  it('writes the same string into JSON', () => {
    expect(standup.toJSON()).toBe('2026-11-16T17:30:00.000Z');
    expect(JSON.stringify({ standup })).toBe('{"standup":"2026-11-16T17:30:00.000Z"}');
  });

  it('reads back from its string as the same moment in the zone asked for', () => {
    const readBack = datetime(JSON.parse(JSON.stringify(standup)), 'America/Los_Angeles');
    expect(readBack.equals(standup)).toBe(true);
    expect(readBack).toMatchObject({ zone: 'America/Los_Angeles', hour: 9, minute: 30 });
  });

  it('writes microseconds or nanoseconds only when it holds them, and reads them back', () => {
    const micro = datetime('2026-11-16T17:30:00.123456Z', 'UTC');
    const nano = datetime('2026-11-16T17:30:00.123456789Z', 'UTC');
    expect(micro.toString()).toBe('2026-11-16T17:30:00.123456Z');
    expect(nano.toString()).toBe('2026-11-16T17:30:00.123456789Z');
    expect(datetime(nano.toString(), 'UTC').epochNanoseconds).toBe(nano.epochNanoseconds);
  });
});

describe('DateTime as a number, a Date and a Temporal value', () => {
  const standup = datetime('2026-11-16T09:30', 'America/Los_Angeles');
  const wrapUp = datetime('2026-11-16T17:00', 'America/Los_Angeles');

  it('is its milliseconds since 1970 wherever a number is asked for', () => {
    expect(standup.valueOf()).toBe(1794850200000);
    expect(+standup).toBe(1794850200000);
    expect(Number(standup)).toBe(1794850200000);
  });

  it('orders with < and > and subtracts to milliseconds', () => {
    expect(standup < wrapUp).toBe(true);
    expect(standup > wrapUp).toBe(false);
    expect(wrapUp - standup).toBe(7.5 * 60 * 60 * 1000);
  });

  it('sorts into time order with a subtracting comparator', () => {
    const tokyo = datetime('2026-11-17T03:00', 'Asia/Tokyo');
    const sorted = [wrapUp, tokyo, standup].sort((a, b) => a - b);
    expect(sorted.map(String)).toEqual([
      '2026-11-16T17:30:00.000Z',
      '2026-11-16T18:00:00.000Z',
      '2026-11-17T01:00:00.000Z',
    ]);
  });

  it('converts to a Date at the same moment', () => {
    const stamp = standup.toJSDate();
    expect(stamp).toBeInstanceOf(Date);
    expect(stamp.toISOString()).toBe('2026-11-16T17:30:00.000Z');
    expect(new Date(standup).getTime()).toBe(1794850200000);
  });

  it('converts to a Temporal.ZonedDateTime at the same moment in the same zone', () => {
    const zoned = standup.toTemporal();
    expect(zoned).toBeInstanceOf(Temporal.ZonedDateTime);
    expect(zoned.toString()).toBe('2026-11-16T09:30:00-08:00[America/Los_Angeles]');
  });

  it('drops what is finer than a millisecond from the number and the Date', () => {
    const precise = datetime('2026-11-16T17:30:00.123999999Z', 'UTC');
    expect(precise.valueOf()).toBe(1794850200123);
    expect(precise.toJSDate().toISOString()).toBe('2026-11-16T17:30:00.123Z');
  });
});
