import {
  CalendarDate,
  configure,
  date,
  datetime,
  days,
  duration,
  monthDay,
  time,
  today,
  tomorrow,
  yesterday,
} from 'native-dates';
import { afterEach, describe, expect, it, vi } from 'vitest';

describe('date() from a calendar day', () => {
  afterEach(() => {
    configure({ zone: null });
  });

  it('reads an ISO date string, year, month and day numbers, and a fields object as the same day', () => {
    expect(date('2026-11-16').toString()).toBe('2026-11-16');
    expect(date(2026, 11, 16).toString()).toBe('2026-11-16');
    expect(date({ year: 2026, month: 11, day: 16 }).toString()).toBe('2026-11-16');
  });

  it('returns a CalendarDate, the same day new CalendarDate() builds from those inputs', () => {
    expect(date('2026-11-16')).toBeInstanceOf(CalendarDate);
    expect(new CalendarDate('2026-11-16').toString()).toBe('2026-11-16');
    expect(new CalendarDate(2026, 11, 16).toString()).toBe('2026-11-16');
  });

  // new Date('2026-11-16') is midnight UTC, which is still Nov 15 anywhere west of Greenwich
  it('keeps a date-only string on the day written, whatever zone is configured', () => {
    configure({ zone: 'Pacific/Pago_Pago' });
    expect(date('2026-11-16')).toMatchObject({ year: 2026, month: 11, day: 16 });
    configure({ zone: 'Pacific/Kiritimati' });
    expect(date('2026-11-16')).toMatchObject({ year: 2026, month: 11, day: 16 });
  });

  it('counts months from 1 for January to 12 for December', () => {
    expect(date(2026, 1, 31).toString()).toBe('2026-01-31');
    expect(date(2026, 12, 31).toString()).toBe('2026-12-31');
    expect(date({ year: 2026, month: 12, day: 31 }).month).toBe(12);
  });

  it('reads year-first dates written with slashes or dots, padded or not', () => {
    expect(date('2026/11/6').toString()).toBe('2026-11-06');
    expect(date('2026.11.06').toString()).toBe('2026-11-06');
    expect(date('2026-1-5').toString()).toBe('2026-01-05');
    expect(date(' 2026/11/06 ').toString()).toBe('2026-11-06');
  });

  it('keeps the written day of a date-time with no offset and drops its clock', () => {
    expect(date('2026-11-16T23:30').toString()).toBe('2026-11-16');
    expect(date('2026-11-16 23:30:00').toString()).toBe('2026-11-16');
  });

  it('reads digit strings from form fields as year, month and day', () => {
    expect(date('2026', '11', '16').toString()).toBe('2026-11-16');
  });

  it.todo('reads a year number beside month and day given as digit strings');

  // a form or a query string hands over every field as text
  it('reads digit strings in a fields object', () => {
    expect(date({ year: '2026', month: '11', day: '16' }).toString()).toBe('2026-11-16');
    const query = new URLSearchParams('year=2026&month=02&day=09');
    expect(date(Object.fromEntries(query)).toString()).toBe('2026-02-09');
  });

  it('reads a Temporal.PlainDate and a Temporal.PlainDateTime as their own day', () => {
    expect(date(Temporal.PlainDate.from('2026-11-16')).toString()).toBe('2026-11-16');
    expect(date(Temporal.PlainDateTime.from('2026-11-16T23:30')).toString()).toBe('2026-11-16');
  });

  it('gives a CalendarDate back as the same day', () => {
    expect(date(date(2026, 11, 16)).toString()).toBe('2026-11-16');
  });
});

describe('date() from a moment in a zone', () => {
  // 02:00 UTC on Nov 17 is still Nov 16 in Los Angeles and already Nov 17 in Tokyo
  const instant = '2026-11-17T02:00:00Z';

  afterEach(() => {
    configure({ zone: null });
  });

  it('reads an instant string as the day it falls on in the zone asked for', () => {
    expect(date(instant, 'America/Los_Angeles').toString()).toBe('2026-11-16');
    expect(date(instant, 'Asia/Tokyo').toString()).toBe('2026-11-17');
  });

  it('takes the zone as a string or as { zone }', () => {
    expect(date(instant, { zone: 'America/Los_Angeles' }).toString()).toBe('2026-11-16');
  });

  // date(instant, { timeZone: 'Asia/Tokyo' }) gives the day in the zone of the machine and says nothing
  it.todo('never ignores a zone passed as { timeZone }, the name Intl and Temporal give it');

  it('fixes the instant by a numeric offset in the string, then reads its day in the zone asked for', () => {
    expect(date('2026-11-16T23:30:00-05:00', 'Asia/Tokyo').toString()).toBe('2026-11-17');
    expect(date('2026-11-16T23:30:00-05:00', 'America/Los_Angeles').toString()).toBe('2026-11-16');
    // the text Postgres prints for a timestamptz column
    expect(date('2026-11-16 18:00:00+00', 'Asia/Tokyo').toString()).toBe('2026-11-17');
  });

  // the offset as strftime('%z') writes it
  it('fixes the instant by an offset written without its colon', () => {
    expect(date('2026-11-16T23:30:00-0500', 'Asia/Tokyo').toString()).toBe('2026-11-17');
    expect(date('2026-11-16T23:30:00-0500', 'America/Los_Angeles').toString()).toBe('2026-11-16');
  });

  it('reads the day in a zone on the half hour and in a fixed offset', () => {
    // 18:45 UTC is 00:15 the next day in India (UTC+5:30) and 18:15 UTC is 23:45 the same day
    expect(date('2026-11-16T18:45:00Z', 'Asia/Kolkata').toString()).toBe('2026-11-17');
    expect(date('2026-11-16T18:15:00Z', 'Asia/Kolkata').toString()).toBe('2026-11-16');
    expect(date('2026-11-16T18:45:00Z', '+05:30').toString()).toBe('2026-11-17');
  });

  it('reads a DateTime in its own zone, or in another zone when one is asked for', () => {
    const inLosAngeles = datetime(instant, 'America/Los_Angeles');
    expect(date(inLosAngeles).toString()).toBe('2026-11-16');
    expect(date(inLosAngeles, 'Asia/Tokyo').toString()).toBe('2026-11-17');
  });

  it('reads a JavaScript Date as the day it falls on in the zone asked for', () => {
    const jsDate = new Date(instant);
    expect(date(jsDate, 'America/Los_Angeles').toString()).toBe('2026-11-16');
    expect(date(jsDate, 'Asia/Tokyo').toString()).toBe('2026-11-17');
  });

  it('reads a Temporal.Instant in the zone asked for', () => {
    const temporalInstant = Temporal.Instant.from(instant);
    expect(date(temporalInstant, 'America/Los_Angeles').toString()).toBe('2026-11-16');
    expect(date(temporalInstant, 'Asia/Tokyo').toString()).toBe('2026-11-17');
  });

  it('reads a Temporal.ZonedDateTime in its own zone, or in another zone when one is asked for', () => {
    const zoned = Temporal.ZonedDateTime.from('2026-11-16T18:00[America/Los_Angeles]');
    expect(date(zoned).toString()).toBe('2026-11-16');
    expect(date(zoned, 'Asia/Tokyo').toString()).toBe('2026-11-17');
  });

  // the text Java prints for a ZonedDateTime, and Temporal for its own
  it('reads a string that names its zone in brackets in that zone, or in another zone when one is asked for', () => {
    const morningInTokyo = '2026-11-17T08:00+09:00[Asia/Tokyo]';
    expect(date(morningInTokyo, 'America/Los_Angeles').toString()).toBe('2026-11-16');
    expect(date('2026-11-17T08:00[Asia/Tokyo]', 'America/Los_Angeles').toString()).toBe('2026-11-16');
    configure({ zone: 'America/Los_Angeles' });
    expect(date(morningInTokyo).toString()).toBe('2026-11-17');
  });

  it('reads an instant in the configured zone when no zone is passed', () => {
    configure({ zone: 'Asia/Tokyo' });
    expect(date(instant).toString()).toBe('2026-11-17');
    expect(date(new Date(instant)).toString()).toBe('2026-11-17');

    configure({ zone: 'America/Los_Angeles' });
    expect(date(instant).toString()).toBe('2026-11-16');
    expect(date(new Date(instant)).toString()).toBe('2026-11-16');
  });

  it('reads a JavaScript Date built from local parts as that local day when no zone is passed or configured', () => {
    expect(date(new Date(2026, 10, 16)).toString()).toBe('2026-11-16');
    expect(date(new Date(2026, 10, 16, 23, 59)).toString()).toBe('2026-11-16');
  });

  it('leaves a day with no offset on the day written when a zone is passed', () => {
    expect(date('2026-11-16', 'Asia/Tokyo').toString()).toBe('2026-11-16');
    expect(date('2026-11-16T23:30', 'Asia/Tokyo').toString()).toBe('2026-11-16');
    expect(date(date(2026, 11, 16), 'Asia/Tokyo').toString()).toBe('2026-11-16');
    expect(date(Temporal.PlainDateTime.from('2026-11-16T23:30'), 'Asia/Tokyo').toString()).toBe('2026-11-16');
  });

  it.todo('leaves a Temporal.PlainDate on its own day when a zone is passed');
});

describe('date() refusals', () => {
  it('throws invalidDate at the input for a day its month does not have', () => {
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

  it('reads February 29 in a leap year and refuses it in any other', () => {
    expect(date('2028-02-29').toString()).toBe('2028-02-29');
    expect(() => date('2026-02-29')).toThrowError(expect.objectContaining({ code: 'invalidDate', at: '2026-02-29' }));
    expect(() => date(2100, 2, 29)).toThrowError(expect.objectContaining({ code: 'invalidDate' }));
  });

  it('refuses month 0 and month 13 instead of counting from zero or rolling into the next year', () => {
    expect(() => date(2026, 0, 16)).toThrowError(expect.objectContaining({ name: 'RangeError', code: 'invalidDate' }));
    expect(() => date(2026, 13, 1)).toThrowError(expect.objectContaining({ name: 'RangeError', code: 'invalidDate' }));
    expect(() => date('2026-13-01')).toThrowError(expect.objectContaining({ code: 'invalidDate', at: '2026-13-01' }));
  });

  it('throws missingDay when the numbers stop at the month', () => {
    expect(() => date(2026, 11)).toThrowError(expect.objectContaining({ name: 'RangeError', code: 'missingDay' }));
    expect(() => date(2026, 11, undefined)).toThrowError(expect.objectContaining({ code: 'missingDay' }));
  });

  it('refuses a year and month with no day in a string or a fields object, never reading it as the 1st', () => {
    expect(() => date('2026-11')).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'invalidDate', at: '2026-11' }),
    );
    expect(() => date({ year: 2026, month: 11 })).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'invalidDate' }),
    );
  });

  it('throws missingDate, a TypeError, for null, undefined and no argument', () => {
    expect(() => date(null)).toThrowError(expect.objectContaining({ name: 'TypeError', code: 'missingDate' }));
    expect(() => date(undefined)).toThrowError(expect.objectContaining({ name: 'TypeError', code: 'missingDate' }));
    expect(() => date()).toThrowError(expect.objectContaining({ name: 'TypeError', code: 'missingDate' }));
  });

  it('refuses an empty or blank string instead of reading it as today', () => {
    expect(() => date('')).toThrowError(expect.objectContaining({ code: 'invalidDate', at: '' }));
    expect(() => date('   ')).toThrowError(expect.objectContaining({ code: 'invalidDate', at: '   ' }));
  });

  it('refuses a fields object whose month was left blank in a form', () => {
    expect(() => date({ year: '2026', month: '', day: '16' })).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'invalidDate' }),
    );
  });

  // date('2026', '', '16') is refused as unknownZone at '', the blank month read as a zone
  it.todo('refuses a year or month left blank beside the other two as a date, not as a zone');

  it('refuses a single number, which could be a year or an epoch timestamp', () => {
    expect(() => date(1794850200000)).toThrowError(
      expect.objectContaining({ name: 'TypeError', code: 'invalidDate', at: '1794850200000' }),
    );
    expect(() => date(2026)).toThrowError(
      expect.objectContaining({ name: 'TypeError', code: 'invalidDate', at: '2026' }),
    );
  });

  it('refuses a fraction in the year, month or day numbers', () => {
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

  it('refuses strings that lead with the day or the month, where the order would be a guess', () => {
    expect(() => date('03/05/2026')).toThrowError(expect.objectContaining({ code: 'invalidDate', at: '03/05/2026' }));
    expect(() => date('16.11.2026')).toThrowError(expect.objectContaining({ code: 'invalidDate', at: '16.11.2026' }));
  });

  it('refuses a date whose two separators differ', () => {
    expect(() => date('2026/1-5')).toThrowError(expect.objectContaining({ code: 'invalidDate', at: '2026/1-5' }));
    expect(() => date('2026/1.5')).toThrowError(expect.objectContaining({ code: 'invalidDate', at: '2026/1.5' }));
  });

  it('refuses dates written with month names or in words', () => {
    expect(() => date('Nov 16, 2026')).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'invalidDate', at: 'Nov 16, 2026' }),
    );
    expect(() => date('tomorrow')).toThrowError(expect.objectContaining({ code: 'invalidDate', at: 'tomorrow' }));
  });

  it('throws missingPlugin at loose when { loose: true } is passed without the loose plugin imported', () => {
    expect(() => date('Nov 16, 2026', { loose: true })).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'missingPlugin', at: 'loose' }),
    );
  });

  it('refuses a boolean and an array as a TypeError', () => {
    expect(() => date(true)).toThrowError(expect.objectContaining({ name: 'TypeError', code: 'invalidDate' }));
    expect(() => date([2026, 11, 16])).toThrowError(
      expect.objectContaining({ name: 'TypeError', code: 'invalidDate' }),
    );
  });

  it('refuses an invalid JavaScript Date', () => {
    expect(() => date(new Date('not a date'))).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'invalidNumber' }),
    );
  });

  it('throws unknownZone at a zone it does not know, for an instant and for a day with no offset', () => {
    expect(() => date('2026-11-17T02:00:00Z', 'Mars/Phobos')).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'unknownZone', at: 'Mars/Phobos' }),
    );
    expect(() => date('2026-11-16', 'Mars/Phobos')).toThrowError(
      expect.objectContaining({ code: 'unknownZone', at: 'Mars/Phobos' }),
    );
  });
});

describe('today(), tomorrow() and yesterday()', () => {
  afterEach(() => {
    vi.useRealTimers();
    configure({ zone: null });
  });

  it('gives the current calendar day in the zone asked for', () => {
    // 02:00 UTC on Nov 17 is still Nov 16 in Los Angeles and already Nov 17 in Tokyo
    vi.setSystemTime(new Date('2026-11-17T02:00:00Z'));
    expect(today('America/Los_Angeles').toString()).toBe('2026-11-16');
    expect(today('Asia/Tokyo').toString()).toBe('2026-11-17');
  });

  it('gives the day after and the day before today in that zone', () => {
    vi.setSystemTime(new Date('2026-11-17T02:00:00Z'));
    expect(tomorrow('America/Los_Angeles').toString()).toBe('2026-11-17');
    expect(yesterday('America/Los_Angeles').toString()).toBe('2026-11-15');
    expect(tomorrow('Asia/Tokyo').toString()).toBe('2026-11-18');
    expect(yesterday('Asia/Tokyo').toString()).toBe('2026-11-16');
  });

  it('crosses the end of a year', () => {
    // 04:30 UTC on Jan 1 is 23:30 on Dec 31 in New York
    vi.setSystemTime(new Date('2026-01-01T04:30:00Z'));
    expect(today('America/New_York').toString()).toBe('2025-12-31');
    expect(tomorrow('America/New_York').toString()).toBe('2026-01-01');
    expect(yesterday('UTC').toString()).toBe('2025-12-31');
  });

  it('uses the configured zone when none is passed', () => {
    vi.setSystemTime(new Date('2026-11-17T02:00:00Z'));
    configure({ zone: 'America/Los_Angeles' });
    expect(today().toString()).toBe('2026-11-16');
    expect(tomorrow().toString()).toBe('2026-11-17');
    expect(yesterday().toString()).toBe('2026-11-15');

    configure({ zone: 'Asia/Tokyo' });
    expect(today().toString()).toBe('2026-11-17');
  });

  it('gives the local day a JavaScript Date shows when no zone is passed or configured', () => {
    vi.setSystemTime(new Date('2026-11-17T02:00:00Z'));
    const local = new Date();
    expect(today()).toMatchObject({
      year: local.getFullYear(),
      month: local.getMonth() + 1,
      day: local.getDate(),
    });
  });

  it.todo('reads the clock now() reads when a test mocks Date alone');

  it("chains as today().plus(2, 'days').at('9am') to 9am two days from now", () => {
    vi.setSystemTime(new Date('2026-11-17T02:00:00Z'));
    configure({ zone: 'America/Los_Angeles' });
    expect(today().plus(2, 'days').at('9am').toString()).toBe('2026-11-18T17:00:00.000Z');
  });

  it('throws unknownZone at a zone it does not know', () => {
    expect(() => today('Mars/Phobos')).toThrowError(
      expect.objectContaining({ code: 'unknownZone', at: 'Mars/Phobos' }),
    );
    expect(() => tomorrow('Mars/Phobos')).toThrowError(
      expect.objectContaining({ code: 'unknownZone', at: 'Mars/Phobos' }),
    );
  });
});

describe('CalendarDate properties', () => {
  it('reads year, month and day', () => {
    expect(date('2026-11-16')).toMatchObject({ year: 2026, month: 11, day: 16 });
  });

  it('numbers the day of the week from 1 for Monday to 7 for Sunday', () => {
    expect(date('2026-11-16').dayOfWeek).toBe(1);
    expect(date('2026-11-20').dayOfWeek).toBe(5);
    expect(date('2026-11-22').dayOfWeek).toBe(7);
  });

  it('reads the quarter from 1 to 4', () => {
    expect(date('2026-01-01').quarter).toBe(1);
    expect(date('2026-03-31').quarter).toBe(1);
    expect(date('2026-04-01').quarter).toBe(2);
    expect(date('2026-09-30').quarter).toBe(3);
    expect(date('2026-12-31').quarter).toBe(4);
  });

  it('counts the day of the year, the days in its month and the days in its year through a leap year', () => {
    expect(date('2026-11-16')).toMatchObject({ dayOfYear: 320, daysInMonth: 30, daysInYear: 365 });
    expect(date('2026-02-10').daysInMonth).toBe(28);
    expect(date('2028-02-10')).toMatchObject({ daysInMonth: 29, daysInYear: 366 });
    expect(date('2028-12-31').dayOfYear).toBe(366);
  });

  it('numbers weeks by ISO 8601, where a week belongs to the year that holds its Thursday', () => {
    expect(date('2026-11-16').weekOfYear).toBe(47);
    expect(date('2027-01-01').weekOfYear).toBe(53);
    expect(date('2024-12-30').weekOfYear).toBe(1);
  });

  it('gives its year and month as yearMonth and its month and day as monthDay', () => {
    expect(date('2026-11-16').yearMonth.toString()).toBe('2026-11');
    expect(date('2026-11-16').monthDay.toString()).toBe('11-16');
  });

  it('holds the date formatted in its locale as text', () => {
    expect(date('2026-11-16', { locale: 'en-US' }).text).toBe('Nov 16, 2026');
  });
});

describe('CalendarDate isLeapYear(), isWeekday() and isWeekend()', () => {
  it('isLeapYear() is true for years divisible by 4, except centuries not divisible by 400', () => {
    expect(date('2028-06-01').isLeapYear()).toBe(true);
    expect(date('2026-06-01').isLeapYear()).toBe(false);
    expect(date('2100-06-01').isLeapYear()).toBe(false);
    expect(date('2000-06-01').isLeapYear()).toBe(true);
  });

  it('isWeekday() is true from Monday to Friday and isWeekend() on Saturday and Sunday', () => {
    const friday = date('2026-11-20');
    const saturday = date('2026-11-21');
    const sunday = date('2026-11-22');
    expect([friday.isWeekday(), friday.isWeekend()]).toEqual([true, false]);
    expect([saturday.isWeekday(), saturday.isWeekend()]).toEqual([false, true]);
    expect([sunday.isWeekday(), sunday.isWeekend()]).toEqual([false, true]);
  });
});

describe('CalendarDate at()', () => {
  const day = date('2026-11-16');

  afterEach(() => {
    configure({ zone: null });
  });

  it('places the day at a time in a zone and returns that moment', () => {
    const standup = day.at('9:30am', 'America/Los_Angeles');
    expect(standup.toString()).toBe('2026-11-16T17:30:00.000Z');
    expect(standup).toMatchObject({ zone: 'America/Los_Angeles', day: 16, hour: 9, minute: 30 });
  });

  it('reads the time as a 12-hour or 24-hour string, a Time, or a fields object', () => {
    expect(day.at('5:30pm', 'UTC').toString()).toBe('2026-11-16T17:30:00.000Z');
    expect(day.at('17:30', 'UTC').toString()).toBe('2026-11-16T17:30:00.000Z');
    expect(day.at(time('17:30'), 'UTC').toString()).toBe('2026-11-16T17:30:00.000Z');
    expect(day.at({ hour: 17, minute: 30 }, 'UTC').toString()).toBe('2026-11-16T17:30:00.000Z');
  });

  it('returns the start of the day in the zone when no time is given', () => {
    expect(day.at(undefined, 'UTC').toString()).toBe('2026-11-16T00:00:00.000Z');
    expect(day.at(undefined, 'Asia/Tokyo').toString()).toBe('2026-11-15T15:00:00.000Z');
  });

  it('uses the configured zone when none is passed', () => {
    configure({ zone: 'Asia/Tokyo' });
    expect(day.at('9:30am').toString()).toBe('2026-11-16T00:30:00.000Z');
    expect(day.at().toString()).toBe('2026-11-15T15:00:00.000Z');
  });

  it('moves a time skipped by daylight saving forward by the length of the gap', () => {
    // clocks in New York jump from 2:00 to 3:00 on 2026-03-08, so 2:30 never happens
    const skipped = date('2026-03-08').at('2:30am', 'America/New_York');
    expect(skipped.toString()).toBe('2026-03-08T07:30:00.000Z');
    expect(skipped).toMatchObject({ hour: 3, minute: 30 });
  });

  it('returns the earlier of the two moments when a time repeats as daylight saving ends', () => {
    // 1:30 happens twice in New York on 2026-11-01, first at UTC-4 and an hour later at UTC-5
    expect(date('2026-11-01').at('1:30am', 'America/New_York').toString()).toBe('2026-11-01T05:30:00.000Z');
  });

  it('starts a day whose midnight was skipped at its first moment', () => {
    // clocks in Sao Paulo went from 23:59 on Nov 3 straight to 01:00 on 2018-11-04
    const start = date('2018-11-04').at(undefined, 'America/Sao_Paulo');
    expect(start.toString()).toBe('2018-11-04T03:00:00.000Z');
    expect(start).toMatchObject({ day: 4, hour: 1 });
  });

  it('throws invalidTime at a time it cannot read and unknownZone at a zone it does not know', () => {
    expect(() => day.at('25:00', 'UTC')).toThrowError(expect.objectContaining({ code: 'invalidTime', at: '25:00' }));
    expect(() => day.at('9:30am', 'Mars/Phobos')).toThrowError(
      expect.objectContaining({ code: 'unknownZone', at: 'Mars/Phobos' }),
    );
  });

  it('refuses an empty time, as a blank form field gives, instead of reading it as the start of the day', () => {
    expect(() => day.at('', 'UTC')).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'invalidTime', at: '' }),
    );
  });
});

describe('CalendarDate set()', () => {
  const day = date('2026-11-16');

  it('replaces one field by name, or several from an object', () => {
    expect(day.set('day', 1).toString()).toBe('2026-11-01');
    expect(day.set('year', 2030).toString()).toBe('2030-11-16');
    expect(day.set({ month: 12, day: 31 }).toString()).toBe('2026-12-31');
  });

  it('returns a new date and leaves the original unchanged', () => {
    day.set('day', 1);
    expect(day.toString()).toBe('2026-11-16');
  });

  it('throws cannotSet when asked for a day or month that does not exist', () => {
    expect(() => date('2026-02-10').set('day', 30)).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'cannotSet' }),
    );
    expect(() => day.set({ month: 2, day: 30 })).toThrowError(expect.objectContaining({ code: 'cannotSet' }));
    expect(() => day.set('day', 0)).toThrowError(expect.objectContaining({ code: 'cannotSet' }));
    expect(() => day.set('month', 13)).toThrowError(expect.objectContaining({ code: 'cannotSet' }));
  });

  it('refuses a fraction instead of dropping it', () => {
    expect(() => day.set('day', 1.5)).toThrowError(expect.objectContaining({ name: 'RangeError', code: 'cannotSet' }));
  });

  it('throws unknownUnit at a field name it does not know', () => {
    expect(() => day.set('fortnight', 1)).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'unknownUnit', at: 'fortnight' }),
    );
  });
});

describe('CalendarDate plus() and minus()', () => {
  const day = date('2026-11-16');

  it('moves by days, weeks, months, quarters and years', () => {
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

  it('reads the amount as a phrase, a fields object, a Duration or a Temporal.Duration', () => {
    expect(day.plus('2 weeks').toString()).toBe('2026-11-30');
    expect(day.plus({ weeks: 2 }).toString()).toBe('2026-11-30');
    expect(day.plus(days(14)).toString()).toBe('2026-11-30');
    expect(day.plus(duration('2 weeks')).toString()).toBe('2026-11-30');
    expect(day.plus(Temporal.Duration.from({ weeks: 2 })).toString()).toBe('2026-11-30');
    expect(date('2026-03-01').minus({ weeks: 2, days: 1 }).toString()).toBe('2026-02-14');
  });

  it('clamps to the last day of a shorter month instead of spilling into the next', () => {
    expect(date('2026-01-31').plus(1, 'month').toString()).toBe('2026-02-28');
    expect(date('2028-01-31').plus(1, 'month').toString()).toBe('2028-02-29');
    expect(date('2026-03-31').minus(1, 'month').toString()).toBe('2026-02-28');
    expect(date('2028-02-29').plus(1, 'year').toString()).toBe('2029-02-28');
    expect(date('2028-02-29').plus(4, 'years').toString()).toBe('2032-02-29');
  });

  it('crosses month and year ends', () => {
    expect(date('2026-03-01').minus(1, 'day').toString()).toBe('2026-02-28');
    expect(date('2026-12-31').plus(1, 'day').toString()).toBe('2027-01-01');
    expect(date('2026-01-01').minus(1, 'day').toString()).toBe('2025-12-31');
  });

  it('moves the other way for a negative count', () => {
    expect(day.plus(-1, 'day').toString()).toBe('2026-11-15');
    expect(day.minus(-1, 'day').toString()).toBe('2026-11-17');
  });

  it('gives the same answers under the second spellings add() and subtract()', () => {
    expect(day.add(2, 'weeks').toString()).toBe('2026-11-30');
    expect(day.subtract(2, 'weeks').toString()).toBe('2026-11-02');
  });

  it('returns a new date and leaves the original unchanged', () => {
    day.plus(2, 'days');
    day.minus(1, 'month');
    expect(day.toString()).toBe('2026-11-16');
  });

  it('throws unsupportedUnit at the unit for clock time, however it is written', () => {
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

  // Temporal.PlainDate.add({ hours: 24 }) adds a day and add({ hours: 23 }) adds nothing
  it('refuses 24 hours instead of reading them as a day', () => {
    expect(() => day.plus(24, 'hours')).toThrowError(expect.objectContaining({ code: 'unsupportedUnit', at: 'hours' }));
    expect(() => day.plus('PT24H')).toThrowError(expect.objectContaining({ code: 'unsupportedUnit', at: 'hours' }));
  });

  it('refuses part of a day instead of rounding it away', () => {
    expect(() => day.plus(1.5, 'days')).toThrowError(expect.objectContaining({ code: 'unsupportedUnit' }));
    expect(() => day.plus(0.5, 'weeks')).toThrowError(expect.objectContaining({ code: 'unsupportedUnit' }));
  });

  it('refuses a count with no unit instead of guessing days', () => {
    expect(() => day.plus(2)).toThrowError(expect.objectContaining({ name: 'RangeError', code: 'unsupportedUnit' }));
  });

  it('throws invalidDuration, a TypeError, when the amount is missing', () => {
    expect(() => day.plus()).toThrowError(expect.objectContaining({ name: 'TypeError', code: 'invalidDuration' }));
    expect(() => day.minus(null)).toThrowError(expect.objectContaining({ name: 'TypeError', code: 'invalidDuration' }));
  });

  it('throws unknownUnit at a unit it does not know', () => {
    expect(() => day.plus(2, 'fortnights')).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'unknownUnit', at: 'fortnights' }),
    );
  });

  it('throws cannotAdd or cannotSubtract when the answer is past the last year a date can hold', () => {
    expect(() => day.plus(1_000_000, 'years')).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'cannotAdd' }),
    );
    expect(() => day.minus(1_000_000, 'years')).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'cannotSubtract' }),
    );
  });
});

describe('CalendarDate unit names', () => {
  const day = date('2026-11-16');

  it('reads the short names Moment and Day.js give the calendar units', () => {
    expect(day.plus(1, 'y').toString()).toBe('2027-11-16');
    expect(day.plus(1, 'Q').toString()).toBe('2027-02-16');
    expect(day.plus(1, 'w').toString()).toBe('2026-11-23');
    expect(day.plus(1, 'd').toString()).toBe('2026-11-17');
  });

  // Moment and Day.js write a month as M and a minute as m, and a date has no minutes
  it("reads a capital 'M' as months in plus(), startOf() and until(), and refuses 'm' as minutes", () => {
    expect(day.plus(1, 'M').toString()).toBe('2026-12-16');
    expect(day.startOf('M').toString()).toBe('2026-11-01');
    expect(date('2026-01-01').until('2026-07-01', 'M')).toBe(6);
    expect(() => day.plus(1, 'm')).toThrowError(expect.objectContaining({ code: 'unsupportedUnit', at: 'minutes' }));
  });
});

describe('CalendarDate startOf() and endOf()', () => {
  const wednesday = date('2026-11-18');

  it('gives the first and last day of the year, quarter and month', () => {
    expect(wednesday.startOf('year').toString()).toBe('2026-01-01');
    expect(wednesday.endOf('year').toString()).toBe('2026-12-31');
    expect(wednesday.startOf('quarter').toString()).toBe('2026-10-01');
    expect(wednesday.endOf('quarter').toString()).toBe('2026-12-31');
    expect(wednesday.startOf('month').toString()).toBe('2026-11-01');
    expect(wednesday.endOf('month').toString()).toBe('2026-11-30');
  });

  it('ends February on the 28th, or the 29th in a leap year', () => {
    expect(date('2026-02-10').endOf('month').toString()).toBe('2026-02-28');
    expect(date('2028-02-10').endOf('month').toString()).toBe('2028-02-29');
  });

  it('bounds each quarter by its own three months', () => {
    expect(date('2026-02-10').startOf('quarter').toString()).toBe('2026-01-01');
    expect(date('2026-02-10').endOf('quarter').toString()).toBe('2026-03-31');
    expect(date('2026-05-31').startOf('quarter').toString()).toBe('2026-04-01');
    expect(date('2026-05-31').endOf('quarter').toString()).toBe('2026-06-30');
    expect(date('2026-09-30').startOf('quarter').toString()).toBe('2026-07-01');
    expect(date('2026-09-30').endOf('quarter').toString()).toBe('2026-09-30');
  });

  it('bounds the week by the first day passed as a name or a number', () => {
    expect(wednesday.startOf('week', 'monday').toString()).toBe('2026-11-16');
    expect(wednesday.endOf('week', 'monday').toString()).toBe('2026-11-22');
    expect(wednesday.startOf('week', 'sunday').toString()).toBe('2026-11-15');
    expect(wednesday.endOf('week', 'sunday').toString()).toBe('2026-11-21');
    expect(wednesday.startOf('week', 7).toString()).toBe('2026-11-15');
    expect(wednesday.startOf('week', 6).toString()).toBe('2026-11-14');
  });

  it('bounds the week by the locale on the date when no first day is passed', () => {
    expect(date('2026-11-18', { locale: 'en-US' }).startOf('week').toString()).toBe('2026-11-15');
    expect(date('2026-11-18', { locale: 'en-US' }).endOf('week').toString()).toBe('2026-11-21');
    expect(date('2026-11-18', { locale: 'de-DE' }).startOf('week').toString()).toBe('2026-11-16');
    expect(date('2026-11-18', { locale: 'de-DE' }).endOf('week').toString()).toBe('2026-11-22');
  });

  it('keeps a date on the first or last day of its week where it is', () => {
    expect(date('2026-11-16').startOf('week', 'monday').toString()).toBe('2026-11-16');
    expect(date('2026-11-22').endOf('week', 'monday').toString()).toBe('2026-11-22');
    expect(date('2026-11-22').startOf('week', 'monday').toString()).toBe('2026-11-16');
  });

  it('follows a week across the end of a month and a year', () => {
    expect(date('2027-01-01').startOf('week', 'monday').toString()).toBe('2026-12-28');
    expect(date('2026-12-31').endOf('week', 'monday').toString()).toBe('2027-01-03');
  });

  it('gives the same day for the start and end of a day', () => {
    expect(wednesday.startOf('day').toString()).toBe('2026-11-18');
    expect(wednesday.endOf('day').toString()).toBe('2026-11-18');
  });

  it('throws unsupportedUnit at a clock unit and unknownUnit at a unit it does not know', () => {
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

  it('throws unknownDayOfWeek at a first day it cannot read', () => {
    expect(() => wednesday.startOf('week', 'funday')).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'unknownDayOfWeek', at: 'funday' }),
    );
    expect(() => wednesday.endOf('week', 0)).toThrowError(
      expect.objectContaining({ code: 'unknownDayOfWeek', at: '0' }),
    );
  });
});

describe('CalendarDate next() and previous()', () => {
  const monday = date('2026-11-16');

  it('steps to the nearest day of the week after or before this date', () => {
    expect(monday.next('friday').toString()).toBe('2026-11-20');
    expect(monday.next('sunday').toString()).toBe('2026-11-22');
    expect(monday.previous('friday').toString()).toBe('2026-11-13');
    expect(monday.previous('sunday').toString()).toBe('2026-11-15');
  });

  it('moves a full week when the date already falls on that day', () => {
    expect(monday.next('monday').toString()).toBe('2026-11-23');
    expect(monday.previous('monday').toString()).toBe('2026-11-09');
  });

  it('reads the day as a name in any case, its first three letters, or a number from 1 for Monday to 7 for Sunday', () => {
    expect(monday.next('Friday').toString()).toBe('2026-11-20');
    expect(monday.next('fri').toString()).toBe('2026-11-20');
    expect(monday.next(5).toString()).toBe('2026-11-20');
    expect(monday.previous(7).toString()).toBe('2026-11-15');
  });

  it('steps to the next or previous time a MonthDay comes round', () => {
    expect(monday.next(monthDay('12-25')).toString()).toBe('2026-12-25');
    expect(monday.next(monthDay('10-17')).toString()).toBe('2027-10-17');
    expect(monday.previous(monthDay('10-31')).toString()).toBe('2026-10-31');
    expect(monday.previous(monthDay('12-25')).toString()).toBe('2025-12-25');
  });

  it('moves a full year when the date already falls on that MonthDay', () => {
    expect(monday.next(monthDay('11-16')).toString()).toBe('2027-11-16');
    expect(monday.previous(monthDay('11-16')).toString()).toBe('2025-11-16');
  });

  it('lands a February 29 MonthDay on February 28 in a year without one', () => {
    const leapDay = monthDay('02-29');
    expect(date('2026-03-01').next(leapDay).toString()).toBe('2027-02-28');
    expect(date('2027-02-28').next(leapDay).toString()).toBe('2028-02-29');
    expect(date('2028-02-29').next(leapDay).toString()).toBe('2029-02-28');
    expect(date('2027-03-01').previous(leapDay).toString()).toBe('2027-02-28');
    expect(date('2029-01-01').previous(leapDay).toString()).toBe('2028-02-29');
  });

  it('throws unknownDayOfWeek at a day it cannot read', () => {
    expect(() => monday.next('funday')).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'unknownDayOfWeek', at: 'funday' }),
    );
    expect(() => monday.next(0)).toThrowError(expect.objectContaining({ code: 'unknownDayOfWeek', at: '0' }));
    expect(() => monday.previous(8)).toThrowError(expect.objectContaining({ code: 'unknownDayOfWeek', at: '8' }));
    expect(() => monday.next()).toThrowError(expect.objectContaining({ code: 'unknownDayOfWeek' }));
  });

  it.todo("refuses next('month') and previous('month') instead of stepping to a Monday");
});

describe('CalendarDate equals(), isBefore(), isAfter() and isSame()', () => {
  const day = date('2026-11-16');

  it('compares with anything date() reads', () => {
    expect(day.equals('2026-11-16')).toBe(true);
    expect(day.equals(date(2026, 11, 16))).toBe(true);
    expect(day.equals({ year: 2026, month: 11, day: 16 })).toBe(true);
    expect(day.equals(Temporal.PlainDate.from('2026-11-16'))).toBe(true);
    expect(day.equals('2026-11-17')).toBe(false);
  });

  it('isBefore() and isAfter() are true only for a strictly earlier or later day, and both false for the same day', () => {
    expect(day.isBefore('2026-11-17')).toBe(true);
    expect(day.isBefore('2026-11-15')).toBe(false);
    expect(day.isAfter('2026-11-15')).toBe(true);
    expect(day.isAfter('2026-11-17')).toBe(false);
    expect(day.isBefore('2026-11-16')).toBe(false);
    expect(day.isAfter('2026-11-16')).toBe(false);
  });

  it('orders across month and year ends by the calendar, not by the day number', () => {
    expect(date('2026-01-31').isBefore('2026-02-01')).toBe(true);
    expect(date('2025-12-31').isBefore('2026-01-01')).toBe(true);
    expect(date('2026-02-01').isAfter('2026-01-31')).toBe(true);
  });

  it('compares with a DateTime by the day it falls on in its own zone', () => {
    // 02:00 UTC on Nov 17 is Nov 16 in Los Angeles and Nov 17 in Tokyo
    expect(day.equals(datetime('2026-11-17T02:00:00Z', 'America/Los_Angeles'))).toBe(true);
    expect(day.equals(datetime('2026-11-17T02:00:00Z', 'Asia/Tokyo'))).toBe(false);
    expect(day.isBefore(datetime('2026-11-17T02:00:00Z', 'Asia/Tokyo'))).toBe(true);
  });

  it('isSame() with no unit is true only for the same day', () => {
    expect(day.isSame('2026-11-16')).toBe(true);
    expect(day.isSame('2026-11-17')).toBe(false);
  });

  it('isSame() with a unit is true for two days in the same year, quarter or month', () => {
    expect(day.isSame('2026-01-01', 'year')).toBe(true);
    expect(day.isSame('2027-11-16', 'year')).toBe(false);
    expect(day.isSame('2026-10-01', 'quarter')).toBe(true);
    expect(day.isSame('2026-09-30', 'quarter')).toBe(false);
    expect(day.isSame('2026-11-30', 'month')).toBe(true);
    expect(day.isSame('2026-12-01', 'month')).toBe(false);
    expect(day.isSame('2025-11-16', 'month')).toBe(false);
  });

  it("isSame() with 'week' bounds the week by the first day passed, or by the locale on the date", () => {
    // only a week that starts on Sunday holds both Sunday Sep 6 and Wednesday Sep 9
    expect(date('2026-09-09').isSame('2026-09-06', 'week', 'sunday')).toBe(true);
    expect(date('2026-09-09').isSame('2026-09-06', 'week', 'monday')).toBe(false);
    expect(date('2026-09-09', { locale: 'en-US' }).isSame('2026-09-06', 'week')).toBe(true);
    expect(date('2026-09-09', { locale: 'de-DE' }).isSame('2026-09-06', 'week')).toBe(false);
  });

  it('throws missingDate when the other value is missing, instead of returning false', () => {
    expect(() => day.equals(undefined)).toThrowError(
      expect.objectContaining({ name: 'TypeError', code: 'missingDate' }),
    );
    expect(() => day.isBefore(null)).toThrowError(expect.objectContaining({ name: 'TypeError', code: 'missingDate' }));
    expect(() => day.isAfter(undefined)).toThrowError(expect.objectContaining({ code: 'missingDate' }));
    expect(() => day.isSame(undefined, 'month')).toThrowError(expect.objectContaining({ code: 'missingDate' }));
  });

  it('throws invalidDate at another value it cannot read', () => {
    expect(() => day.equals('next week')).toThrowError(
      expect.objectContaining({ code: 'invalidDate', at: 'next week' }),
    );
    expect(() => day.isBefore('03/05/2026')).toThrowError(
      expect.objectContaining({ code: 'invalidDate', at: '03/05/2026' }),
    );
  });

  it('throws unsupportedUnit when isSame() is asked about a clock unit', () => {
    expect(() => day.isSame('2026-11-16', 'hour')).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'unsupportedUnit', at: 'hour' }),
    );
  });
});

describe('CalendarDate isToday(), isTomorrow(), isYesterday(), isPast() and isFuture()', () => {
  // 02:00 UTC on Nov 17 is still Nov 16 in Los Angeles and already Nov 17 in Tokyo
  const instant = new Date('2026-11-17T02:00:00Z');

  afterEach(() => {
    vi.useRealTimers();
    configure({ zone: null });
  });

  it('isToday(), isTomorrow() and isYesterday() go by the current day in the zone asked for', () => {
    vi.setSystemTime(instant);
    const day = date('2026-11-16');
    expect(day.isToday('America/Los_Angeles')).toBe(true);
    expect(day.isToday('Asia/Tokyo')).toBe(false);
    expect(day.isYesterday('Asia/Tokyo')).toBe(true);
    expect(date('2026-11-17').isTomorrow('America/Los_Angeles')).toBe(true);
    expect(date('2026-11-17').isTomorrow('Asia/Tokyo')).toBe(false);
  });

  it('isPast() and isFuture() are true for days before and after today, and both false for today', () => {
    vi.setSystemTime(instant);
    const zone = 'America/Los_Angeles';
    expect(date('2026-11-15').isPast(zone)).toBe(true);
    expect(date('2026-11-15').isFuture(zone)).toBe(false);
    expect(date('2026-11-17').isFuture(zone)).toBe(true);
    expect(date('2026-11-17').isPast(zone)).toBe(false);
    expect(date('2026-11-16').isPast(zone)).toBe(false);
    expect(date('2026-11-16').isFuture(zone)).toBe(false);
  });

  it('one date is tomorrow, today and yesterday at the same moment in three zones', () => {
    // 10:30 UTC on Nov 17 is 23:30 on Nov 16 in Pago Pago and 00:30 on Nov 18 in Kiritimati
    vi.setSystemTime(new Date('2026-11-17T10:30:00Z'));
    const day = date('2026-11-17');
    expect(day.isTomorrow('Pacific/Pago_Pago')).toBe(true);
    expect(day.isFuture('Pacific/Pago_Pago')).toBe(true);
    expect(day.isToday('UTC')).toBe(true);
    expect(day.isYesterday('Pacific/Kiritimati')).toBe(true);
    expect(day.isPast('Pacific/Kiritimati')).toBe(true);
  });

  it('uses the configured zone when none is passed', () => {
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

describe('CalendarDate until() and since()', () => {
  it('measures the calendar span to a later date in years, months and days', () => {
    expect(date('2026-01-01').until('2027-04-05').toString()).toBe('P1Y3M4D');
    expect(date('2026-01-01').until('2027-04-05')).toMatchObject({ years: 1, months: 3, days: 4 });
  });

  it('gives the span as one number when a unit is passed', () => {
    expect(date('2026-01-01').until('2027-04-05', 'days')).toBe(459);
    expect(date('2026-11-02').until('2026-11-16', 'weeks')).toBe(2);
    expect(date('2026-01-01').until('2026-07-01', 'months')).toBe(6);
    expect(date('2026-01-01').until('2027-01-01', 'years')).toBe(1);
  });

  it('gives a fraction when the span is not a whole number of the unit', () => {
    expect(date('2026-01-01').until('2026-01-04', 'weeks')).toBeCloseTo(3 / 7);
    // half of the 28 days of February 2026
    expect(date('2026-01-01').until('2026-02-15', 'months')).toBe(1.5);
  });

  it('gives a negative span to an earlier date and a zero span to the same date', () => {
    expect(date('2026-01-01').until('2025-12-25').toString()).toBe('-P7D');
    expect(date('2026-01-01').until('2025-12-25', 'days')).toBe(-7);
    expect(date('2026-01-01').until('2026-01-01', 'days')).toBe(0);
  });

  it('measures since() as the same span read from the later date', () => {
    expect(date('2026-11-16').since('2026-11-02').days).toBe(14);
    expect(date('2026-11-16').since('2026-11-02', 'weeks')).toBe(2);
    expect(date('2027-04-05').since('2026-01-01').toString()).toBe('P1Y3M4D');
    expect(date('2026-11-16').since('2026-11-20', 'days')).toBe(-4);
  });

  it('counts a year of age only once the birthday comes round', () => {
    const born = date('1990-05-10');
    expect(born.until('2026-05-09').years).toBe(35);
    expect(born.until('2026-05-10').years).toBe(36);
    expect(date('2026-05-10').since(born).years).toBe(36);
  });

  it('returns a span that, added back with plus(), lands on the other date, month ends included', () => {
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

  it('returns a Duration that can total its months and years from the starting date', () => {
    expect(date('2026-01-01').until('2026-07-01').total('months')).toBe(6);
    expect(date('2026-01-01').until('2027-04-05').total('days')).toBe(459);
  });

  it('measures to a DateTime by the day it falls on in its own zone', () => {
    expect(date('2026-11-16').until(datetime('2026-11-18T23:00', 'Asia/Tokyo'), 'days')).toBe(2);
  });

  it('throws missingDate when the other date is missing and invalidDate when it cannot be read', () => {
    expect(() => date('2026-01-01').until(undefined)).toThrowError(
      expect.objectContaining({ name: 'TypeError', code: 'missingDate' }),
    );
    expect(() => date('2026-01-01').since('next week')).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'invalidDate', at: 'next week' }),
    );
  });
});

describe('CalendarDate as a string and in JSON', () => {
  const day = date('2026-11-16');

  it('writes itself as YYYY-MM-DD from toString() and toJSON()', () => {
    expect(day.toString()).toBe('2026-11-16');
    expect(day.toJSON()).toBe('2026-11-16');
    expect(date(2026, 1, 5).toString()).toBe('2026-01-05');
  });

  it('writes itself as YYYY-MM-DD in JSON.stringify(), a template literal and string concatenation', () => {
    expect(JSON.stringify({ due: day })).toBe('{"due":"2026-11-16"}');
    expect(`${day}`).toBe('2026-11-16');
    expect('Due ' + day).toBe('Due 2026-11-16');
    expect(String(day)).toBe('2026-11-16');
  });

  it('reads its own string and JSON back as the same day', () => {
    expect(date(day.toString()).equals(day)).toBe(true);
    expect(date(JSON.parse(JSON.stringify({ due: day })).due).equals(day)).toBe(true);
  });

  it('throws unsupportedComparison at the date for <, >, - and unary +', () => {
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

describe('CalendarDate toJSDate(), toTemporal() and as()', () => {
  const day = date('2026-11-16');

  afterEach(() => {
    configure({ zone: null });
  });

  it('gives a JavaScript Date at the start of the day in the zone asked for', () => {
    expect(day.toJSDate('UTC')).toBeInstanceOf(Date);
    expect(day.toJSDate('UTC').toISOString()).toBe('2026-11-16T00:00:00.000Z');
    expect(day.toJSDate('Asia/Tokyo').toISOString()).toBe('2026-11-15T15:00:00.000Z');
    expect(day.toJSDate('America/Los_Angeles').toISOString()).toBe('2026-11-16T08:00:00.000Z');
  });

  it('gives a JavaScript Date in the configured zone when none is passed', () => {
    configure({ zone: 'Asia/Tokyo' });
    expect(day.toJSDate().toISOString()).toBe('2026-11-15T15:00:00.000Z');
  });

  it('gives a JavaScript Date whose local parts are this day at midnight when no zone is passed or configured', () => {
    const local = day.toJSDate();
    expect([local.getFullYear(), local.getMonth() + 1, local.getDate()]).toEqual([2026, 11, 16]);
    expect([local.getHours(), local.getMinutes()]).toEqual([0, 0]);
  });

  it('reads the JavaScript Date it gave back as the same day in the same zone', () => {
    expect(date(day.toJSDate('Asia/Tokyo'), 'Asia/Tokyo').equals(day)).toBe(true);
    expect(date(day.toJSDate('America/Los_Angeles'), 'America/Los_Angeles').equals(day)).toBe(true);
  });

  it('gives a Temporal.PlainDate for the same day', () => {
    const plain = day.toTemporal();
    expect(plain).toBeInstanceOf(Temporal.PlainDate);
    expect(plain.toString()).toBe('2026-11-16');
    expect(date(plain).equals(day)).toBe(true);
  });

  it('converts with as() to a moment at the start of the day, a YearMonth or a MonthDay', () => {
    expect(day.as('datetime', 'UTC').toString()).toBe('2026-11-16T00:00:00.000Z');
    expect(day.as('datetime', 'Asia/Tokyo').toString()).toBe('2026-11-15T15:00:00.000Z');
    expect(day.as('yearMonth').toString()).toBe('2026-11');
    expect(day.as('monthDay').toString()).toBe('11-16');
    expect(day.as('date').toString()).toBe('2026-11-16');
  });

  it('throws unknownKind at a kind a date cannot become', () => {
    expect(() => day.as('time')).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'unknownKind', at: 'time' }),
    );
  });
});
