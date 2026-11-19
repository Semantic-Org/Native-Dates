import {
  compare,
  configure,
  date,
  DateRange,
  dateRange,
  datetime,
  DateTimeRange,
  datetimeRange,
  days,
  hours,
  time,
  TimeRange,
  timeRange,
} from 'native-dates';
import { afterEach, describe, expect, it } from 'vitest';

/*******************************
            Building
*******************************/

describe('dateRange()', () => {
  it('runs from the first day through the last day given', () => {
    const trip = dateRange('2026-09-01', '2026-09-07');
    expect(trip).toBeInstanceOf(DateRange);
    expect(trip.kind).toBe('date');
    expect(trip.start.toString()).toBe('2026-09-01');
    expect(trip.end.toString()).toBe('2026-09-07');
  });

  it('takes CalendarDate values as its two days', () => {
    expect(dateRange(date('2026-09-01'), date('2026-09-07')).toString()).toBe('2026-09-01/2026-09-07');
  });

  it('counts the first day in a length, so 7 days from the 1st ends on the 7th', () => {
    expect(dateRange('2026-09-01', '7 days').toString()).toBe('2026-09-01/2026-09-07');
    expect(dateRange('2026-09-01', '7d').toString()).toBe('2026-09-01/2026-09-07');
    expect(dateRange('2026-09-01', 'P7D').toString()).toBe('2026-09-01/2026-09-07');
    expect(dateRange('2026-09-01', days(7)).toString()).toBe('2026-09-01/2026-09-07');
    expect(dateRange('2026-09-01', { days: 7 }).toString()).toBe('2026-09-01/2026-09-07');
  });

  it('ends a length of weeks or months on the day before the same day comes round again', () => {
    expect(dateRange('2026-09-01', '2 weeks').toString()).toBe('2026-09-01/2026-09-14');
    expect(dateRange('2026-09-01', '1 month').toString()).toBe('2026-09-01/2026-09-30');
  });

  it('reads a length of one day as that single day', () => {
    expect(dateRange('2026-09-01', '1 day').toString()).toBe('2026-09-01/2026-09-01');
  });

  it('reads both days from one string joined by a slash, a spaced hyphen, a spaced en dash or the word to', () => {
    expect(dateRange('2026-09-01/2026-09-07').toString()).toBe('2026-09-01/2026-09-07');
    expect(dateRange('2026-09-01 - 2026-09-07').toString()).toBe('2026-09-01/2026-09-07');
    expect(dateRange('2026-09-01 – 2026-09-07').toString()).toBe('2026-09-01/2026-09-07');
    expect(dateRange('2026-09-01 to 2026-09-07').toString()).toBe('2026-09-01/2026-09-07');
  });

  it('keeps days written with slashes whole when one string joins them with a spaced hyphen', () => {
    expect(dateRange('2026/09/01 - 2026/09/07').toString()).toBe('2026-09-01/2026-09-07');
  });

  it('reads an ISO 8601 interval that ends in a duration', () => {
    expect(dateRange('2026-11-06/P3D').toString()).toBe('2026-11-06/2026-11-08');
  });

  it('reads a moment as the day it falls on in the zone given', () => {
    const lateEvening = dateRange('2026-09-01T02:00Z', '2026-09-03T02:00Z', 'America/Los_Angeles');
    const lateMorning = dateRange('2026-09-01T02:00Z/2026-09-03T02:00Z', { zone: 'Asia/Tokyo' });
    expect(lateEvening.toString()).toBe('2026-08-31/2026-09-02');
    expect(lateMorning.toString()).toBe('2026-09-01/2026-09-03');
  });

  it('reads both days from one string and carries the locale given beside it', () => {
    const stay = dateRange('2026-09-01/2026-09-07', { locale: 'de-DE' });
    expect(stay.toString()).toBe('2026-09-01/2026-09-07');
    expect(stay.locale()).toBe('de-DE');
    expect(stay.end.locale()).toBe('de-DE');
  });

  it('throws invalidRange naming both days when the end is earlier than the start', () => {
    expect(() => dateRange('2026-09-07', '2026-09-01')).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'invalidRange', at: '2026-09-07 to 2026-09-01' }),
    );
  });

  it('throws invalidRange for a length of zero days, which would cover no day at all', () => {
    expect(() => dateRange('2026-09-01', '0 days')).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'invalidRange' }),
    );
  });

  it('throws unsupportedUnit for a length in clock units', () => {
    expect(() => dateRange('2026-09-01', '2 hours')).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'unsupportedUnit', at: 'hours' }),
    );
  });

  it('throws invalidDate at the end when it reads as neither a day nor a length', () => {
    expect(() => dateRange('2026-09-01', 'next week')).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'invalidDate', at: 'next week' }),
    );
  });

  it('throws missingDate when one day is given with no end', () => {
    expect(() => dateRange('2026-09-01')).toThrowError(
      expect.objectContaining({ name: 'TypeError', code: 'missingDate' }),
    );
  });

  it('throws conflictingRanges when handed a range of another kind', () => {
    expect(() => dateRange(timeRange('9am', '5pm'))).toThrowError(
      expect.objectContaining({ name: 'TypeError', code: 'conflictingRanges', at: 'timeRange as dateRange' }),
    );
  });

  // an empty object after one string is read as the end, so the string itself is refused as invalidDate
  it.todo('reads one interval string beside an empty options object, as it does with no options');

  // a range passed with { locale } comes back as it was
  it.todo('gives a range passed with { locale } that locale, as date() gives it to a date');
});

describe('datetimeRange()', () => {
  afterEach(() => {
    configure({ zone: null });
  });

  it('runs from the first moment up to the second, both in the zone given', () => {
    const block = datetimeRange('2026-09-01T09:00', '2026-09-01T10:30', 'America/New_York');
    expect(block).toBeInstanceOf(DateTimeRange);
    expect(block.kind).toBe('datetime');
    expect(block.start.zone).toBe('America/New_York');
    expect(block.end.zone).toBe('America/New_York');
    expect(block.toString()).toBe('2026-09-01T13:00:00.000Z/2026-09-01T14:30:00.000Z');
  });

  it('reads both moments in the configured zone when none is given', () => {
    configure({ zone: 'Asia/Tokyo' });
    const block = datetimeRange('2026-09-01T09:00', '2026-09-01T10:30');
    expect(block.start.zone).toBe('Asia/Tokyo');
    expect(block.toString()).toBe('2026-09-01T00:00:00.000Z/2026-09-01T01:30:00.000Z');
  });

  it('reads a length as time elapsed from the start', () => {
    const meeting = datetimeRange('2026-09-01T09:00', '90m', 'America/New_York');
    expect(meeting.end.format('HH:mm')).toBe('10:30');
    expect(meeting.toString()).toBe('2026-09-01T13:00:00.000Z/2026-09-01T14:30:00.000Z');
  });

  it('reads an end written without a zone in the zone of the start', () => {
    const fromMoment = datetimeRange(datetime('2026-09-01T09:00', 'Asia/Tokyo'), '2026-09-01T10:30');
    const fromString = datetimeRange('2026-09-01T09:00[Asia/Tokyo]', '2026-09-01T10:30');
    expect(fromMoment.end.zone).toBe('Asia/Tokyo');
    expect(fromMoment.toString()).toBe('2026-09-01T00:00:00.000Z/2026-09-01T01:30:00.000Z');
    expect(fromString.toString()).toBe('2026-09-01T00:00:00.000Z/2026-09-01T01:30:00.000Z');
  });

  it('keeps the instant of an end written in another zone and shows it in the zone of the start', () => {
    const call = datetimeRange('2026-09-01T09:00[America/Los_Angeles]', '2026-09-01T19:00[Europe/Berlin]');
    expect(call.toString()).toBe('2026-09-01T16:00:00.000Z/2026-09-01T17:00:00.000Z');
    expect(call.end.zone).toBe('America/Los_Angeles');
    expect(call.end.hour).toBe(10);
  });

  it('reads both moments from one string, leaving the slash inside a bracketed zone name alone', () => {
    const zoned = datetimeRange('2026-09-01T09:00[America/New_York]/2026-09-01T10:30[America/New_York]');
    expect(zoned.start.zone).toBe('America/New_York');
    expect(zoned.toString()).toBe('2026-09-01T13:00:00.000Z/2026-09-01T14:30:00.000Z');
  });

  it('reads both moments from one string joined by a spaced hyphen or the word to', () => {
    expect(datetimeRange('2026-09-01 09:00 - 2026-09-01 10:30', { zone: 'UTC' }).toString())
      .toBe('2026-09-01T09:00:00.000Z/2026-09-01T10:30:00.000Z');
    expect(datetimeRange('2026/09/01 09:00 - 2026/09/01 10:30', { zone: 'UTC' }).toString())
      .toBe('2026-09-01T09:00:00.000Z/2026-09-01T10:30:00.000Z');
    expect(datetimeRange('2026-09-01T09:00 to 2026-09-01T10:30', { zone: 'UTC' }).toString())
      .toBe('2026-09-01T09:00:00.000Z/2026-09-01T10:30:00.000Z');
  });

  it('keeps the hyphens of UTC offsets when one string is split', () => {
    expect(datetimeRange('2026-09-01T09:00-04:00/2026-09-01T10:30-04:00').toString())
      .toBe('2026-09-01T13:00:00.000Z/2026-09-01T14:30:00.000Z');
    expect(datetimeRange('2026-09-01T09:00-04:00 - 2026-09-01T10:30-04:00').toString())
      .toBe('2026-09-01T13:00:00.000Z/2026-09-01T14:30:00.000Z');
  });

  it('reads an ISO 8601 interval that ends in a duration', () => {
    expect(datetimeRange('2026-09-01T09:00Z/PT90M').toString())
      .toBe('2026-09-01T09:00:00.000Z/2026-09-01T10:30:00.000Z');
  });

  it('takes epoch milliseconds and Date objects as its two moments', () => {
    const opens = Date.UTC(2026, 8, 1, 9);
    const closes = new Date(Date.UTC(2026, 8, 1, 10));
    expect(datetimeRange(opens, closes, 'UTC').toString()).toBe('2026-09-01T09:00:00.000Z/2026-09-01T10:00:00.000Z');
  });

  it('throws invalidRange naming both moments when the end is earlier than the start', () => {
    expect(() => datetimeRange('2026-09-01T10:00Z', '2026-09-01T09:00Z')).toThrowError(
      expect.objectContaining({
        name: 'RangeError',
        code: 'invalidRange',
        at: '2026-09-01T10:00:00.000Z to 2026-09-01T09:00:00.000Z',
      }),
    );
  });

  it('throws invalidRange for a negative length', () => {
    expect(() => datetimeRange('2026-09-01T10:00Z', '-30m')).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'invalidRange' }),
    );
  });

  it('throws conflictingRanges when handed a date range, which has to be placed in a zone first', () => {
    expect(() => datetimeRange(dateRange('2026-09-01', '2026-09-07'))).toThrowError(
      expect.objectContaining({ name: 'TypeError', code: 'conflictingRanges', at: 'dateRange as datetimeRange' }),
    );
  });

  it.todo('reads one interval string with the zone given as a plain string, as it does with { zone }');
});

describe('timeRange()', () => {
  it('runs from the first time up to the second', () => {
    const shift = timeRange('9am', '5pm');
    expect(shift).toBeInstanceOf(TimeRange);
    expect(shift.kind).toBe('time');
    expect(shift.start.toString()).toBe('09:00:00');
    expect(shift.end.toString()).toBe('17:00:00');
  });

  it('wraps across midnight when the end is earlier on the clock than the start', () => {
    const nightShift = timeRange('22:00', '06:00');
    expect(nightShift.toString()).toBe('22:00:00/06:00:00');
    expect(nightShift.duration.total('hours')).toBe(8);
  });

  it('reads a length as time elapsed from the start, carrying past midnight', () => {
    expect(timeRange('9am', '90m').toString()).toBe('09:00:00/10:30:00');
    expect(timeRange('22:00', '8h').toString()).toBe('22:00:00/06:00:00');
    expect(timeRange('22:00', hours(8)).toString()).toBe('22:00:00/06:00:00');
  });

  // the same number is a length under a plural key and a clock time under a singular one
  it("reads { hours: 8 } as a length of 8 hours and { hour: 8 } as 8 o'clock", () => {
    expect(timeRange('22:00', { hours: 8 }).toString()).toBe('22:00:00/06:00:00');
    expect(timeRange('22:00', { hour: 8 }).toString()).toBe('22:00:00/08:00:00');
  });

  it('reads both times from one string joined by a slash, a spaced hyphen, a spaced en dash or the word to', () => {
    expect(timeRange('09:00/17:00').toString()).toBe('09:00:00/17:00:00');
    expect(timeRange('9am - 5pm').toString()).toBe('09:00:00/17:00:00');
    expect(timeRange('9am – 5pm').toString()).toBe('09:00:00/17:00:00');
    expect(timeRange('9am to 5pm').toString()).toBe('09:00:00/17:00:00');
  });

  it('reads a moment as its clock time in the zone given', () => {
    expect(timeRange('2026-09-01T00:00Z', '2026-09-01T08:00Z', 'Asia/Tokyo').toString()).toBe('09:00:00/17:00:00');
  });

  it('throws invalidTime at the part of one string that is not a time', () => {
    expect(() => timeRange('noon-ish - 5pm')).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'invalidTime', at: 'noon-ish' }),
    );
  });

  it('throws unsupportedUnit for a length in calendar units', () => {
    expect(() => timeRange('9am', '1 day')).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'unsupportedUnit', at: 'days' }),
    );
  });

  // '9am-5pm' is refused as invalidTime, and '09:00-17:00' as missingTime at undefined, its end read as a UTC offset
  it.todo("reads both times from one string joined by a hyphen with no spaces, such as '09:00-17:00' or '9am-5pm'");
});

describe('new DateRange(), new DateTimeRange() and new TimeRange()', () => {
  it('build the same ranges as the factories from two ends, a start and a length, or one string', () => {
    expect(new DateRange('2026-09-01', '2026-09-07').equals(dateRange('2026-09-01', '2026-09-07'))).toBe(true);
    expect(new DateRange('2026-09-01/2026-09-07').toString()).toBe('2026-09-01/2026-09-07');
    expect(new DateTimeRange('2026-09-01T09:00', '90m', 'Asia/Tokyo').toString())
      .toBe('2026-09-01T00:00:00.000Z/2026-09-01T01:30:00.000Z');
    expect(new TimeRange('22:00', '8h').toString()).toBe('22:00:00/06:00:00');
  });
});

describe('to(), for() and through() on a point', () => {
  it('builds a date range that includes the end day', () => {
    const trip = date('2026-09-01').to('2026-09-07');
    expect(trip).toBeInstanceOf(DateRange);
    expect(trip.toString()).toBe('2026-09-01/2026-09-07');
    expect(trip.contains('2026-09-07')).toBe(true);
  });

  it('builds the same date range from through() as from to()', () => {
    const checkIn = date('2026-09-01');
    expect(checkIn.through('2026-09-07').equals(checkIn.to('2026-09-07'))).toBe(true);
    expect(checkIn.through(7, 'days').equals(checkIn.to(7, 'days'))).toBe(true);
  });

  it('counts the first day when a date runs for a length, so 3 days from the 6th ends on the 8th', () => {
    const checkIn = date('2026-11-06');
    expect(checkIn.for(3, 'days').toString()).toBe('2026-11-06/2026-11-08');
    expect(checkIn.for('3 days').toString()).toBe('2026-11-06/2026-11-08');
    expect(checkIn.for({ days: 3 }).toString()).toBe('2026-11-06/2026-11-08');
    expect(checkIn.for(days(3)).toString()).toBe('2026-11-06/2026-11-08');
    expect(checkIn.to(3, 'days').toString()).toBe('2026-11-06/2026-11-08');
  });

  it('runs a date for two weeks through the day before the same weekday comes round a third time', () => {
    expect(date('2026-11-02').for(2, 'weeks').end.toString()).toBe('2026-11-15');
  });

  it('throws invalidRange when a date runs for zero or fewer days, or to an earlier day', () => {
    const checkIn = date('2026-09-01');
    const refusal = expect.objectContaining({ name: 'RangeError', code: 'invalidRange' });
    expect(() => checkIn.for(0, 'days')).toThrowError(refusal);
    expect(() => checkIn.for(-2, 'days')).toThrowError(refusal);
    expect(() => checkIn.to('2026-08-31')).toThrowError(refusal);
  });

  it('builds a datetime range up to an end read in the zone of the start', () => {
    const standup = datetime('2026-11-16T09:30', 'America/Los_Angeles');
    const slot = standup.to('2026-11-16T10:00');
    expect(slot).toBeInstanceOf(DateTimeRange);
    expect(slot.end.zone).toBe('America/Los_Angeles');
    expect(slot.duration.total('minutes')).toBe(30);
  });

  it('runs a datetime for a length of elapsed time', () => {
    const standup = datetime('2026-11-16T09:30', 'America/Los_Angeles');
    expect(standup.for(90, 'minutes').end.format('HH:mm')).toBe('11:00');
    expect(standup.for('90m').end.format('HH:mm')).toBe('11:00');
    expect(standup.for(hours(1.5)).end.format('HH:mm')).toBe('11:00');
    expect(standup.to(90, 'minutes').end.format('HH:mm')).toBe('11:00');
  });

  it('ends a day later at the same clock time over a daylight saving change, and 24 hours later an hour off', () => {
    const dayBefore = datetime('2026-03-07T12:00', 'America/New_York');
    expect(dayBefore.for(1, 'day').end.format('HH:mm')).toBe('12:00');
    expect(dayBefore.for(24, 'hours').end.format('HH:mm')).toBe('13:00');
  });

  it('throws invalidRange when a datetime runs to an earlier moment', () => {
    const standup = datetime('2026-11-16T09:30', 'America/Los_Angeles');
    expect(() => standup.to('2026-11-16T09:00')).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'invalidRange' }),
    );
  });

  it('builds a time range up to a later time, or across midnight to an earlier one', () => {
    expect(time('9:00am').to('5:00pm')).toBeInstanceOf(TimeRange);
    expect(time('9:00am').to('5:00pm').toString()).toBe('09:00:00/17:00:00');
    expect(time('22:00').to('06:00').duration.total('hours')).toBe(8);
  });

  it('runs a time for a length of elapsed time', () => {
    expect(time('9am').for(90, 'minutes').toString()).toBe('09:00:00/10:30:00');
    expect(time('9am').for('8h').toString()).toBe('09:00:00/17:00:00');
    expect(time('9am').for(hours(8)).toString()).toBe('09:00:00/17:00:00');
  });

  // a count beside a unit is a length, where 8 alone would be 8 o'clock and a 23 hour range
  it('reads a count and unit given to to() on a time as a length', () => {
    expect(time('9am').to(8, 'hours').toString()).toBe('09:00:00/17:00:00');
  });

  // through() promises the end is included, which only a date range does
  it('offers through() on a date only', () => {
    expect(datetime('2026-11-16T09:30', 'UTC').through).toBeUndefined();
    expect(time('9am').through).toBeUndefined();
  });

  it.todo('never reads a bare number given to for() as a clock time or a timestamp');
});

describe('range() on a date and a datetime', () => {
  it('gives the month of a date from its first day through its last', () => {
    expect(date('2026-02-10').range('month').toString()).toBe('2026-02-01/2026-02-28');
    expect(date('2028-02-10').range('month').toString()).toBe('2028-02-01/2028-02-29');
  });

  it('gives the year, quarter and day of a date', () => {
    const wednesday = date('2026-11-18');
    expect(wednesday.range('year').toString()).toBe('2026-01-01/2026-12-31');
    expect(wednesday.range('quarter').toString()).toBe('2026-10-01/2026-12-31');
    expect(wednesday.range('day').toString()).toBe('2026-11-18/2026-11-18');
  });

  it('gives the week of a date starting on the day named', () => {
    const wednesday = date('2026-11-18');
    expect(wednesday.range('week', 'monday').toString()).toBe('2026-11-16/2026-11-22');
    expect(wednesday.range('week', 'sunday').toString()).toBe('2026-11-15/2026-11-21');
  });

  it('starts the week of a date on the first day of the locale the date carries', () => {
    expect(date('2026-11-18', { locale: 'en-US' }).range('week').toString()).toBe('2026-11-15/2026-11-21');
    expect(date('2026-11-18', { locale: 'de-DE' }).range('week').toString()).toBe('2026-11-16/2026-11-22');
  });

  it('throws unsupportedUnit for a clock unit on a date', () => {
    expect(() => date('2026-11-18').range('hour')).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'unsupportedUnit', at: 'hour' }),
    );
  });

  it('gives the hour of a datetime from the top of the hour up to the next', () => {
    expect(datetime('2026-11-16T14:20Z', 'UTC').range('hour').toString())
      .toBe('2026-11-16T14:00:00.000Z/2026-11-16T15:00:00.000Z');
  });

  it('gives the day of a datetime from midnight to the next midnight in its own zone', () => {
    const afternoon = datetime('2026-11-16T14:45', 'Asia/Tokyo');
    expect(afternoon.range('day')).toBeInstanceOf(DateTimeRange);
    expect(afternoon.range('day').toString()).toBe('2026-11-15T15:00:00.000Z/2026-11-16T15:00:00.000Z');
  });

  it('gives the month and the week of a datetime up to the start of the next one', () => {
    const wednesday = datetime('2026-11-18T14:45', 'UTC');
    expect(wednesday.range('month').toString()).toBe('2026-11-01T00:00:00.000Z/2026-12-01T00:00:00.000Z');
    expect(wednesday.range('week', 'monday').toString()).toBe('2026-11-16T00:00:00.000Z/2026-11-23T00:00:00.000Z');
  });

  it('leaves the first moment of the next day out of the day of a datetime', () => {
    const day = datetime('2026-11-16T14:45', 'UTC').range('day');
    expect(day.contains('2026-11-16T23:59:59.999Z')).toBe(true);
    expect(day.contains('2026-11-17T00:00:00Z')).toBe(false);
  });

  it('gives a 23 hour day when clocks spring forward and a 25 hour day when they fall back', () => {
    expect(datetime('2026-03-08T14:45', 'America/New_York').range('day').duration.total('hours')).toBe(23);
    expect(datetime('2026-11-01T14:45', 'America/New_York').range('day').duration.total('hours')).toBe(25);
  });

  it('throws unknownUnit at a unit it does not know', () => {
    expect(() => datetime('2026-11-16T14:45', 'UTC').range('fortnight')).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'unknownUnit', at: 'fortnight' }),
    );
  });

  it.todo('ends the day of a datetime at the next midnight when daylight saving skips the midnight it starts on');
});

/*******************************
             Reads
*******************************/

describe('range.duration', () => {
  it('counts the last day of a date range', () => {
    expect(dateRange('2026-09-01', '2026-09-07').duration.days).toBe(7);
    expect(dateRange('2026-09-01', '2026-09-01').duration.days).toBe(1);
  });

  it('totals every day of a date range longer than a month', () => {
    expect(dateRange('2026-09-01', '2026-10-15').duration.total('days')).toBe(45);
    expect(dateRange('2026-01-01', '2026-12-31').duration.total('days')).toBe(365);
  });

  it('measures a datetime range from its start to its end', () => {
    const meeting = datetimeRange('2026-09-01T09:00', '2026-09-01T10:30', 'America/New_York');
    expect(meeting.duration.total('minutes')).toBe(90);
  });

  it('measures the time that really passes in a datetime range over a daylight saving change', () => {
    const springForward = datetimeRange('2026-03-08T00:00', '2026-03-09T00:00', 'America/New_York');
    const fallBack = datetimeRange('2026-11-01T00:00', '2026-11-01T04:00', 'America/New_York');
    expect(springForward.duration.total('hours')).toBe(23);
    expect(fallBack.duration.total('hours')).toBe(5);
  });

  it('measures a time range within one day', () => {
    expect(timeRange('9am', '5pm').duration.hours).toBe(8);
  });

  it('measures a time range across midnight as the time from start round to end', () => {
    expect(timeRange('22:00', '06:00').duration.hours).toBe(8);
    expect(timeRange('23:30', '00:15').duration.total('minutes')).toBe(45);
  });

  it('gives the same length from as("duration")', () => {
    const trip = dateRange('2026-09-01', '2026-09-07');
    expect(trip.as('duration').equals(trip.duration)).toBe(true);
  });

  it('throws unknownKind when as() is asked for anything else', () => {
    expect(() => dateRange('2026-09-01', '2026-09-07').as('date')).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'unknownKind', at: 'date' }),
    );
  });
});

describe('range.isEmpty()', () => {
  it('is true for a datetime or time range that ends where it starts', () => {
    expect(timeRange('09:00', '09:00').isEmpty()).toBe(true);
    expect(datetimeRange('2026-09-01T10:00Z', '2026-09-01T10:00Z').isEmpty()).toBe(true);
  });

  it('is false for a datetime or time range of any length', () => {
    expect(timeRange('09:00', '09:01').isEmpty()).toBe(false);
    expect(timeRange('22:00', '06:00').isEmpty()).toBe(false);
    expect(datetimeRange('2026-09-01T10:00Z', '1 second').isEmpty()).toBe(false);
  });

  it('is false for a date range of one day, which still covers that day', () => {
    expect(dateRange('2026-09-01', '2026-09-01').isEmpty()).toBe(false);
  });

  it('marks a range that contains no time, not even its own start, and has no points or sub-ranges', () => {
    const nothing = timeRange('09:00', '09:00');
    expect(nothing.contains('09:00')).toBe(false);
    expect(nothing.duration.total('seconds')).toBe(0);
    expect(nothing.points('hour')).toEqual([]);
    expect(nothing.split('hour')).toEqual([]);
  });
});

/*******************************
           Comparison
*******************************/

describe('DateRange.contains() and includes()', () => {
  const stay = dateRange('2026-09-01', '2026-09-07');

  it('contains its first and last day and every day between', () => {
    expect(stay.contains('2026-09-01')).toBe(true);
    expect(stay.contains('2026-09-04')).toBe(true);
    expect(stay.contains('2026-09-07')).toBe(true);
  });

  it('does not contain the day before its start or the day after its end', () => {
    expect(stay.contains('2026-08-31')).toBe(false);
    expect(stay.contains('2026-09-08')).toBe(false);
  });

  it('takes a CalendarDate as well as a string', () => {
    expect(stay.contains(date('2026-09-04'))).toBe(true);
    expect(stay.contains(date('2026-09-08'))).toBe(false);
  });

  it('reads a moment as the day it falls on in its own zone', () => {
    expect(stay.contains(datetime('2026-09-07T23:30', 'Asia/Tokyo'))).toBe(true);
    expect(stay.contains(datetime('2026-09-07T23:30Z', 'Asia/Tokyo'))).toBe(false);
  });

  it('contains a date range that lies inside it, itself included', () => {
    expect(stay.contains(dateRange('2026-09-02', '2026-09-05'))).toBe(true);
    expect(stay.contains(dateRange('2026-09-01', '2026-09-07'))).toBe(true);
  });

  it('does not contain a date range that runs past either end', () => {
    expect(stay.contains(dateRange('2026-09-05', '2026-09-08'))).toBe(false);
    expect(stay.contains(dateRange('2026-08-31', '2026-09-02'))).toBe(false);
  });

  it('answers the same from includes()', () => {
    expect(stay.includes('2026-09-07')).toBe(true);
    expect(stay.includes('2026-09-08')).toBe(false);
    expect(stay.includes(dateRange('2026-09-02', '2026-09-05'))).toBe(true);
  });

  it('throws conflictingRanges for a range of another kind', () => {
    expect(() => stay.contains(timeRange('9am', '5pm'))).toThrowError(
      expect.objectContaining({ name: 'TypeError', code: 'conflictingRanges', at: 'timeRange as dateRange' }),
    );
  });

  it('throws invalidDate at a value that is not a day', () => {
    expect(() => stay.contains('someday')).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'invalidDate', at: 'someday' }),
    );
  });
});

describe('DateTimeRange.contains() and includes()', () => {
  const block = datetimeRange('2026-09-01T09:00', '2026-09-01T10:30', 'Asia/Tokyo');

  it('contains its start and every moment before its end', () => {
    expect(block.contains(datetime('2026-09-01T09:00', 'Asia/Tokyo'))).toBe(true);
    expect(block.contains(datetime('2026-09-01T10:29:59.999', 'Asia/Tokyo'))).toBe(true);
  });

  it('does not contain its end or any moment before its start', () => {
    expect(block.contains(datetime('2026-09-01T10:30', 'Asia/Tokyo'))).toBe(false);
    expect(block.contains(datetime('2026-09-01T08:59:59.999', 'Asia/Tokyo'))).toBe(false);
  });

  it('reads a string written without a zone in the zone of the range', () => {
    expect(block.contains('2026-09-01T09:30')).toBe(true);
    expect(block.contains('2026-09-01T10:30')).toBe(false);
  });

  it('compares a moment from another zone by its instant', () => {
    expect(block.contains(datetime('2026-08-31T20:15', 'America/New_York'))).toBe(true);
    expect(block.contains(datetime('2026-08-31T19:59', 'America/New_York'))).toBe(false);
    expect(block.contains('2026-09-01T01:00:00Z')).toBe(true);
  });

  it('contains a datetime range that ends where it ends, itself included', () => {
    expect(block.contains(datetimeRange('2026-09-01T09:30', '2026-09-01T10:30', 'Asia/Tokyo'))).toBe(true);
    expect(block.contains(block)).toBe(true);
  });

  it('does not contain a datetime range that runs past its end', () => {
    expect(block.contains(datetimeRange('2026-09-01T09:30', '2026-09-01T10:31', 'Asia/Tokyo'))).toBe(false);
  });

  it('answers the same from includes()', () => {
    expect(block.includes('2026-09-01T09:30')).toBe(true);
    expect(block.includes('2026-09-01T10:30')).toBe(false);
  });
});

describe('TimeRange.contains() and includes()', () => {
  const office = timeRange('09:00', '17:00');
  const night = timeRange('22:00', '06:00');

  it('contains its start and every time before its end', () => {
    expect(office.contains('9am')).toBe(true);
    expect(office.contains('4:59pm')).toBe(true);
    expect(office.contains(time('12:00'))).toBe(true);
  });

  it('does not contain its end or a time outside it', () => {
    expect(office.contains('5pm')).toBe(false);
    expect(office.contains('8:59am')).toBe(false);
  });

  it('contains times on both sides of midnight when it wraps', () => {
    expect(night.contains('22:00')).toBe(true);
    expect(night.contains('23:30')).toBe(true);
    expect(night.contains('00:00')).toBe(true);
    expect(night.contains('02:15')).toBe(true);
  });

  it('does not contain its end or the daytime it skips when it wraps', () => {
    expect(night.contains('06:00')).toBe(false);
    expect(night.contains('12:00')).toBe(false);
    expect(night.contains('21:59:59')).toBe(false);
  });

  it('reads a moment as its clock time in its own zone', () => {
    expect(office.contains(datetime('2026-09-01T12:00', 'Asia/Tokyo'))).toBe(true);
    expect(office.contains(datetime('2026-09-01T12:00Z', 'Asia/Tokyo'))).toBe(false);
  });

  it('contains a time range inside it, across midnight or on either side of it', () => {
    expect(night.contains(timeRange('23:00', '01:00'))).toBe(true);
    expect(night.contains(timeRange('22:30', '23:30'))).toBe(true);
    expect(night.contains(timeRange('01:00', '05:00'))).toBe(true);
    expect(night.contains(night)).toBe(true);
  });

  it('does not contain a time range that runs past its end or covers the hours it skips', () => {
    expect(night.contains(timeRange('05:00', '07:00'))).toBe(false);
    expect(night.contains(office)).toBe(false);
    expect(office.contains(night)).toBe(false);
  });

  it('answers the same from includes()', () => {
    expect(night.includes('02:15')).toBe(true);
    expect(night.includes('06:00')).toBe(false);
  });
});

describe('range.overlaps()', () => {
  it('is true for date ranges that share a single day', () => {
    const first = dateRange('2026-09-01', '2026-09-05');
    const second = dateRange('2026-09-05', '2026-09-10');
    expect(first.overlaps(second)).toBe(true);
    expect(second.overlaps(first)).toBe(true);
  });

  it('is false for date ranges on neighbouring days', () => {
    const first = dateRange('2026-09-01', '2026-09-05');
    const second = dateRange('2026-09-06', '2026-09-10');
    expect(first.overlaps(second)).toBe(false);
    expect(second.overlaps(first)).toBe(false);
  });

  it('is true for a date range that lies wholly inside another', () => {
    expect(dateRange('2026-09-01', '2026-09-07').overlaps(dateRange('2026-08-01', '2026-12-01'))).toBe(true);
  });

  it('is false for datetime ranges where one ends as the other starts', () => {
    const first = datetimeRange('2026-09-01T09:00', '2026-09-01T10:00', 'Asia/Tokyo');
    const second = datetimeRange('2026-09-01T10:00', '2026-09-01T11:00', 'Asia/Tokyo');
    expect(first.overlaps(second)).toBe(false);
    expect(second.overlaps(first)).toBe(false);
  });

  it('is true for datetime ranges that share any time, compared by instant across zones', () => {
    const tokyo = datetimeRange('2026-09-01T09:00', '2026-09-01T10:30', 'Asia/Tokyo');
    expect(tokyo.overlaps(datetimeRange('2026-09-01T01:29Z', '2026-09-01T03:00Z', 'Europe/Berlin'))).toBe(true);
    expect(tokyo.overlaps(datetimeRange('2026-09-01T01:30Z', '2026-09-01T03:00Z', 'Europe/Berlin'))).toBe(false);
  });

  it('is false for time ranges where one ends as the other starts', () => {
    expect(timeRange('09:00', '10:00').overlaps(timeRange('10:00', '11:00'))).toBe(false);
    expect(timeRange('10:00', '11:00').overlaps(timeRange('09:00', '10:00'))).toBe(false);
  });

  it('is true for time ranges that share a minute', () => {
    expect(timeRange('09:00', '10:01').overlaps(timeRange('10:00', '11:00'))).toBe(true);
  });

  it('finds a time range that wraps midnight overlapping ranges on either side of it', () => {
    const night = timeRange('22:00', '06:00');
    expect(night.overlaps(timeRange('05:00', '07:00'))).toBe(true);
    expect(night.overlaps(timeRange('21:00', '22:30'))).toBe(true);
    expect(night.overlaps(timeRange('23:00', '01:00'))).toBe(true);
    expect(timeRange('05:00', '07:00').overlaps(night)).toBe(true);
  });

  it('is false between a time range that wraps midnight and the daytime it skips', () => {
    const night = timeRange('22:00', '06:00');
    expect(night.overlaps(timeRange('06:00', '22:00'))).toBe(false);
    expect(night.overlaps(timeRange('09:00', '17:00'))).toBe(false);
    expect(timeRange('09:00', '17:00').overlaps(night)).toBe(false);
  });

  it('reads the other range from one string', () => {
    expect(dateRange('2026-09-01', '2026-09-05').overlaps('2026-09-05/2026-09-10')).toBe(true);
    expect(dateRange('2026-09-01', '2026-09-05').overlaps('2026-09-06/2026-09-10')).toBe(false);
    expect(timeRange('22:00', '06:00').overlaps('5am - 7am')).toBe(true);
  });

  it('throws conflictingRanges for a range of another kind', () => {
    const stay = dateRange('2026-09-01', '2026-09-07');
    expect(() => stay.overlaps(datetimeRange('2026-09-01T09:00Z', '1h'))).toThrowError(
      expect.objectContaining({ name: 'TypeError', code: 'conflictingRanges', at: 'datetimeRange as dateRange' }),
    );
  });

  it.todo('reads one string written without a zone in the zone of a datetime range, as contains() does');
});

describe('range.intersection()', () => {
  it('gives the days two date ranges share', () => {
    const first = dateRange('2026-09-01', '2026-09-10');
    const second = dateRange('2026-09-05', '2026-09-15');
    expect(first.intersection(second)).toBeInstanceOf(DateRange);
    expect(first.intersection(second).toString()).toBe('2026-09-05/2026-09-10');
    expect(second.intersection(first).toString()).toBe('2026-09-05/2026-09-10');
  });

  it('gives a one day range when two date ranges share only that day', () => {
    expect(dateRange('2026-09-01', '2026-09-05').intersection('2026-09-05/2026-09-10').toString())
      .toBe('2026-09-05/2026-09-05');
  });

  it('gives null when two date ranges share no day', () => {
    expect(dateRange('2026-09-01', '2026-09-10').intersection('2026-09-20/2026-09-25')).toBeNull();
    expect(dateRange('2026-09-01', '2026-09-05').intersection('2026-09-06/2026-09-10')).toBeNull();
  });

  it('gives the time two datetime ranges share, compared by instant across zones', () => {
    const tokyo = datetimeRange('2026-09-01T09:00', '2026-09-01T10:30', 'Asia/Tokyo');
    const berlin = datetimeRange('2026-09-01T03:00', '2026-09-01T04:00', 'Europe/Berlin');
    expect(tokyo.intersection(berlin)).toBeInstanceOf(DateTimeRange);
    expect(tokyo.intersection(berlin).toString()).toBe('2026-09-01T01:00:00.000Z/2026-09-01T01:30:00.000Z');
    expect(berlin.intersection(tokyo).toString()).toBe('2026-09-01T01:00:00.000Z/2026-09-01T01:30:00.000Z');
  });

  it('gives null when one datetime range ends as the other starts', () => {
    const first = datetimeRange('2026-09-01T09:00', '2026-09-01T10:30', 'Asia/Tokyo');
    const second = datetimeRange('2026-09-01T10:30', '2026-09-01T12:00', 'Asia/Tokyo');
    expect(first.intersection(second)).toBeNull();
  });

  it('gives the time two time ranges share within the day', () => {
    const office = timeRange('09:00', '17:00');
    expect(office.intersection(timeRange('12:00', '20:00'))).toBeInstanceOf(TimeRange);
    expect(office.intersection(timeRange('12:00', '20:00')).toString()).toBe('12:00:00/17:00:00');
    expect(office.intersection('12:00/20:00').toString()).toBe('12:00:00/17:00:00');
  });

  it('gives null when one time range ends as the other starts, or they share nothing', () => {
    const office = timeRange('09:00', '17:00');
    expect(office.intersection(timeRange('17:00', '20:00'))).toBeNull();
    expect(office.intersection(timeRange('22:00', '06:00'))).toBeNull();
  });

  it('gives the shared time on whichever side of midnight a wrapping time range meets the other', () => {
    const night = timeRange('22:00', '06:00');
    expect(night.intersection(timeRange('05:00', '07:00')).toString()).toBe('05:00:00/06:00:00');
    expect(night.intersection(timeRange('20:00', '23:00')).toString()).toBe('22:00:00/23:00:00');
    expect(night.intersection(timeRange('23:00', '01:00')).toString()).toBe('23:00:00/01:00:00');
  });

  it('throws unsupportedIntersection naming both ranges when they meet in two separate pieces', () => {
    const night = timeRange('22:00', '06:00');
    expect(() => night.intersection(timeRange('05:00', '23:00'))).toThrowError(
      expect.objectContaining({
        name: 'RangeError',
        code: 'unsupportedIntersection',
        at: '22:00:00/06:00:00 with 05:00:00/23:00:00',
      }),
    );
  });

  it('throws conflictingRanges for a range of another kind', () => {
    expect(() => dateRange('2026-09-01', '2026-09-07').intersection(timeRange('9am', '5pm'))).toThrowError(
      expect.objectContaining({ name: 'TypeError', code: 'conflictingRanges', at: 'timeRange as dateRange' }),
    );
  });

  it.todo('gives the shared time of two datetime ranges in the zone of the range it was called on');

  // overlaps() is true for a time range from 12:00 to 12:00 inside 09:00 to 17:00, and intersection() gives null
  it.todo('agrees with overlaps() about an empty time range that lies inside another');
});

describe('range.equals()', () => {
  it('is true for date ranges with the same first and last day, however they were built', () => {
    const stay = dateRange('2026-09-01', '2026-09-07');
    expect(stay.equals(dateRange('2026-09-01', '7 days'))).toBe(true);
    expect(stay.equals(date('2026-09-01').to('2026-09-07'))).toBe(true);
    expect(stay.equals('2026-09-01/2026-09-07')).toBe(true);
  });

  it('is false for date ranges that differ at either end', () => {
    const stay = dateRange('2026-09-01', '2026-09-07');
    expect(stay.equals(dateRange('2026-09-01', '2026-09-08'))).toBe(false);
    expect(stay.equals(dateRange('2026-08-31', '2026-09-07'))).toBe(false);
  });

  it('is true for datetime ranges over the same instants viewed in different zones', () => {
    const tokyo = datetimeRange('2026-09-01T09:00', '2026-09-01T10:30', 'Asia/Tokyo');
    const utc = datetimeRange('2026-09-01T00:00Z', '2026-09-01T01:30Z', 'UTC');
    expect(tokyo.equals(utc)).toBe(true);
    expect(tokyo.equals(datetimeRange('2026-09-01T00:00Z', '2026-09-01T01:31Z', 'UTC'))).toBe(false);
  });

  it('is true for time ranges with the same start and end, wrapping or not', () => {
    expect(timeRange('9am', '5pm').equals('09:00/17:00')).toBe(true);
    expect(timeRange('22:00', '06:00').equals(timeRange('22:00', '8h'))).toBe(true);
    expect(timeRange('22:00', '06:00').equals(timeRange('06:00', '22:00'))).toBe(false);
  });
});

describe('compare() on ranges', () => {
  it('sorts a range that starts first ahead of one that starts later and ends sooner', () => {
    const month = dateRange('2026-11-01', '2026-11-30');
    const weekend = dateRange('2026-11-07', '2026-11-08');
    expect([weekend, month].sort(compare).map(String)).toEqual(['2026-11-01/2026-11-30', '2026-11-07/2026-11-08']);
  });
});

/*******************************
      Stepping and Splitting
*******************************/

describe('range.points()', () => {
  it('walks a date range day by day, last day included', () => {
    expect(dateRange('2026-09-01', '2026-09-04').points('day').map(String))
      .toEqual(['2026-09-01', '2026-09-02', '2026-09-03', '2026-09-04']);
  });

  it('takes its step as a unit, a count and unit, a phrase, a Duration or a fields object', () => {
    const stay = dateRange('2026-09-01', '2026-09-07');
    const everyOtherDay = ['2026-09-01', '2026-09-03', '2026-09-05', '2026-09-07'];
    expect(stay.points('days')).toHaveLength(7);
    expect(stay.points(2, 'days').map(String)).toEqual(everyOtherDay);
    expect(stay.points('2 days').map(String)).toEqual(everyOtherDay);
    expect(stay.points(days(2)).map(String)).toEqual(everyOtherDay);
    expect(stay.points({ days: 2 }).map(String)).toEqual(everyOtherDay);
  });

  it('leaves out a step that would land past the end', () => {
    expect(date('2026-11-02').for(2, 'weeks').points('week').map(String)).toEqual(['2026-11-02', '2026-11-09']);
    expect(dateRange('2026-09-01', '2026-09-07').points(4, 'days').map(String)).toEqual(['2026-09-01', '2026-09-05']);
  });

  it('gives only the start when one step is longer than the range', () => {
    expect(dateRange('2026-09-01', '2026-09-07').points('month').map(String)).toEqual(['2026-09-01']);
  });

  it('counts each step from the start, so monthly steps from the 31st land on the last day of shorter months', () => {
    expect(dateRange('2026-01-31', '2026-04-30').points('month').map(String))
      .toEqual(['2026-01-31', '2026-02-28', '2026-03-31', '2026-04-30']);
  });

  it('walks a datetime range in its own zone and stops before the end', () => {
    const block = datetimeRange('2026-09-01T09:00', '2026-09-01T10:30', 'Asia/Tokyo');
    const points = block.points(30, 'minutes');
    expect(points.map((point) => point.format('HH:mm'))).toEqual(['09:00', '09:30', '10:00']);
    expect(points.map((point) => point.zone)).toEqual(['Asia/Tokyo', 'Asia/Tokyo', 'Asia/Tokyo']);
  });

  it('skips the hour that does not exist when it walks a datetime range over a spring forward', () => {
    const earlyMorning = datetimeRange('2026-03-08T00:00', '2026-03-08T05:00', 'America/New_York');
    expect(earlyMorning.points('hour').map((point) => point.hour)).toEqual([0, 1, 3, 4]);
  });

  it('visits the repeated hour twice when it walks a datetime range over a fall back', () => {
    const earlyMorning = datetimeRange('2026-11-01T00:00', '2026-11-01T03:00', 'America/New_York');
    expect(earlyMorning.points('hour').map((point) => point.hour)).toEqual([0, 1, 1, 2]);
  });

  it('keeps midnight when it walks a datetime range day by day over a daylight saving change', () => {
    const weekend = datetimeRange('2026-03-07T00:00', '2026-03-10T00:00', 'America/New_York');
    expect(weekend.points('day').map((point) => point.format('DD HH:mm'))).toEqual([
      '07 00:00',
      '08 00:00',
      '09 00:00',
    ]);
  });

  it('walks a time range across midnight and stops before the end', () => {
    expect(timeRange('22:00', '02:00').points(1, 'hour').map(String))
      .toEqual(['22:00:00', '23:00:00', '00:00:00', '01:00:00']);
  });

  it('throws invalidStep for a step of zero or less', () => {
    const stay = dateRange('2026-09-01', '2026-09-07');
    expect(() => stay.points(0, 'days')).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'invalidStep' }),
    );
    expect(() => stay.points(-1, 'days')).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'invalidStep', at: '-P1D' }),
    );
  });

  it('throws unsupportedUnit when a date range is stepped by a clock unit', () => {
    expect(() => dateRange('2026-09-01', '2026-09-07').points('hour')).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'unsupportedUnit', at: 'hours' }),
    );
  });
});

describe('range.split() and splitBy()', () => {
  it('cuts a date range into sub-ranges of the step that share no day, the last one stopping at the end', () => {
    const subRanges = dateRange('2026-09-01', '2026-09-10').split(4, 'days');
    expect(subRanges.map(String)).toEqual(['2026-09-01/2026-09-04', '2026-09-05/2026-09-08', '2026-09-09/2026-09-10']);
    expect(subRanges.every((subRange) => subRange instanceof DateRange)).toBe(true);
  });

  it('cuts a date range into equal sub-ranges when the step divides it', () => {
    expect(date('2026-11-02').for(2, 'weeks').split(1, 'week').map(String))
      .toEqual(['2026-11-02/2026-11-08', '2026-11-09/2026-11-15']);
  });

  it('cuts a date range month by month from its start day', () => {
    expect(dateRange('2026-01-15', '2026-04-10').split('month').map(String))
      .toEqual(['2026-01-15/2026-02-14', '2026-02-15/2026-03-14', '2026-03-15/2026-04-10']);
  });

  it('gives a one day sub-range when a single day is left over', () => {
    expect(dateRange('2026-09-01', '2026-09-09').split(4, 'days').at(-1).toString()).toBe('2026-09-09/2026-09-09');
  });

  it('cuts a datetime range into sub-ranges in its own zone that each end where the next starts', () => {
    const block = datetimeRange('2026-09-01T09:00', '2026-09-01T10:30', 'Asia/Tokyo');
    const subRanges = block.split(1, 'hour');
    expect(subRanges.map(String)).toEqual([
      '2026-09-01T00:00:00.000Z/2026-09-01T01:00:00.000Z',
      '2026-09-01T01:00:00.000Z/2026-09-01T01:30:00.000Z',
    ]);
    expect(subRanges.every((subRange) => subRange instanceof DateTimeRange)).toBe(true);
    expect(subRanges.map((subRange) => subRange.start.zone)).toEqual(['Asia/Tokyo', 'Asia/Tokyo']);
  });

  it('cuts a working day into half hour slots', () => {
    const day = date('2026-11-16');
    const slots = day.at('9am', 'Europe/Berlin').to(day.at('5pm', 'Europe/Berlin')).split('30m');
    expect(slots).toHaveLength(16);
    expect(slots[0].start.format('HH:mm')).toBe('09:00');
    expect(slots.at(-1).end.format('HH:mm')).toBe('17:00');
  });

  it('cuts a datetime range over a spring forward into days of 24, 23 and 24 hours', () => {
    const weekend = datetimeRange('2026-03-07T00:00', '2026-03-10T00:00', 'America/New_York');
    expect(weekend.split('day').map((day) => day.duration.total('hours'))).toEqual([24, 23, 24]);
  });

  it('cuts a time range across midnight into sub-ranges that end and start at midnight, never wrapping a day', () => {
    const subRanges = timeRange('22:00', '02:00').split(1, 'hour');
    expect(subRanges.map(String)).toEqual([
      '22:00:00/23:00:00',
      '23:00:00/00:00:00',
      '00:00:00/01:00:00',
      '01:00:00/02:00:00',
    ]);
    expect(subRanges.every((subRange) => subRange instanceof TimeRange)).toBe(true);
    expect(subRanges.map((subRange) => subRange.duration.total('hours'))).toEqual([1, 1, 1, 1]);
  });

  it('gives the whole range as its only sub-range when one step is longer than the range', () => {
    expect(dateRange('2026-09-01', '2026-09-07').split('month').map(String)).toEqual(['2026-09-01/2026-09-07']);
    expect(timeRange('09:00', '17:00').split('12h').map(String)).toEqual(['09:00:00/17:00:00']);
  });

  it('gives the same sub-ranges from splitBy()', () => {
    const trip = dateRange('2026-09-01', '2026-09-10');
    expect(trip.splitBy(4, 'days').map(String)).toEqual(trip.split(4, 'days').map(String));
    expect(trip.splitBy('week').map(String)).toEqual(trip.split('week').map(String));
  });

  it('throws invalidStep for a step of zero or less', () => {
    const stay = dateRange('2026-09-01', '2026-09-07');
    expect(() => stay.split(0, 'days')).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'invalidStep' }),
    );
    expect(() => stay.splitBy(-1, 'days')).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'invalidStep', at: '-P1D' }),
    );
  });
});

describe('CalendarDate.split(), splitBy() and points()', () => {
  afterEach(() => {
    configure({ zone: null });
  });

  it('cuts the day into datetime range slices from midnight to the next midnight in the zone given', () => {
    const halves = date('2026-11-16').split(12, 'hours', 'UTC');
    expect(halves.every((half) => half instanceof DateTimeRange)).toBe(true);
    expect(halves.map(String)).toEqual([
      '2026-11-16T00:00:00.000Z/2026-11-16T12:00:00.000Z',
      '2026-11-16T12:00:00.000Z/2026-11-17T00:00:00.000Z',
    ]);
  });

  it('takes its step as a unit or a phrase before the zone', () => {
    const day = date('2026-11-16');
    expect(day.split('hour', 'Asia/Tokyo')).toHaveLength(24);
    expect(day.split('6h', 'Asia/Tokyo').map((slice) => slice.start.format('HH:mm')))
      .toEqual(['00:00', '06:00', '12:00', '18:00']);
    expect(day.points('6h', 'Asia/Tokyo')[0].toString()).toBe('2026-11-15T15:00:00.000Z');
  });

  it('takes a count written as a string, as a form field hands it over, before the unit and the zone', () => {
    const day = date('2026-11-16');
    expect(day.split('12', 'hours', 'UTC').map(String)).toEqual([
      '2026-11-16T00:00:00.000Z/2026-11-16T12:00:00.000Z',
      '2026-11-16T12:00:00.000Z/2026-11-17T00:00:00.000Z',
    ]);
    expect(day.points('6', 'hours', 'UTC')).toHaveLength(4);
  });

  it('gives the same slices from splitBy()', () => {
    const day = date('2026-11-16');
    expect(day.splitBy(12, 'hours', 'UTC').map(String)).toEqual(day.split(12, 'hours', 'UTC').map(String));
    expect(day.splitBy('hour', 'UTC').map(String)).toEqual(day.split('hour', 'UTC').map(String));
  });

  it('cuts 23 hourly slices on the day clocks spring forward and 25 on the day they fall back', () => {
    expect(date('2026-03-08').split('hour', 'America/New_York')).toHaveLength(23);
    expect(date('2026-11-01').split('hour', 'America/New_York')).toHaveLength(25);
  });

  it('walks the day as moments from midnight, stopping before the next midnight', () => {
    expect(date('2026-11-16').points(6, 'hours', 'UTC').map(String)).toEqual([
      '2026-11-16T00:00:00.000Z',
      '2026-11-16T06:00:00.000Z',
      '2026-11-16T12:00:00.000Z',
      '2026-11-16T18:00:00.000Z',
    ]);
  });

  it('uses the configured zone when none is given', () => {
    configure({ zone: 'Asia/Tokyo' });
    const day = date('2026-11-16');
    expect(day.split('12h').map(String)).toEqual([
      '2026-11-15T15:00:00.000Z/2026-11-16T03:00:00.000Z',
      '2026-11-16T03:00:00.000Z/2026-11-16T15:00:00.000Z',
    ]);
    expect(day.points('12h')[0].zone).toBe('Asia/Tokyo');
  });

  it('throws invalidStep for a step of zero or less', () => {
    expect(() => date('2026-11-16').split(0, 'hours', 'UTC')).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'invalidStep' }),
    );
  });

  it.todo('keeps every slice and point inside the day when daylight saving skips its midnight');
});

/*******************************
              Zones
*******************************/

describe('range.in()', () => {
  afterEach(() => {
    configure({ zone: null });
  });

  it('turns a date range into the moments from its first midnight to the midnight after its last day', () => {
    const days = dateRange('2026-09-01', '2026-09-03').in('UTC');
    expect(days).toBeInstanceOf(DateTimeRange);
    expect(days.toString()).toBe('2026-09-01T00:00:00.000Z/2026-09-04T00:00:00.000Z');
  });

  it('contains every moment of the last day of the date range and not the midnight after it', () => {
    const days = dateRange('2026-09-01', '2026-09-03').in('UTC');
    expect(days.contains('2026-09-03T23:59:59.999Z')).toBe(true);
    expect(days.contains('2026-09-04T00:00:00Z')).toBe(false);
  });

  it('takes the midnights of a date range from the zone given', () => {
    const days = dateRange('2026-09-01', '2026-09-03').in('Asia/Tokyo');
    expect(days.start.zone).toBe('Asia/Tokyo');
    expect(days.toString()).toBe('2026-08-31T15:00:00.000Z/2026-09-03T15:00:00.000Z');
  });

  it('places a date range in the configured zone when none is given', () => {
    configure({ zone: 'Asia/Tokyo' });
    expect(dateRange('2026-09-01', '2026-09-03').in().toString())
      .toBe('2026-08-31T15:00:00.000Z/2026-09-03T15:00:00.000Z');
  });

  it('covers the real length of days in a date range over a daylight saving change', () => {
    expect(dateRange('2026-03-08', '2026-03-08').in('America/New_York').duration.total('hours')).toBe(23);
    expect(dateRange('2026-03-07', '2026-03-09').in('America/New_York').duration.total('hours')).toBe(71);
  });

  // Cuba moves its clocks at midnight, so 2026-03-08 has no 00:00 there
  it('starts a date range at the first moment of its first day when daylight saving skips midnight', () => {
    const day = dateRange('2026-03-08', '2026-03-08').in('America/Havana');
    expect(day.start.format('YYYY-MM-DD HH:mm')).toBe('2026-03-08 01:00');
    expect(day.end.format('YYYY-MM-DD HH:mm')).toBe('2026-03-09 00:00');
    expect(day.duration.total('hours')).toBe(23);
  });

  it('shows a datetime range in another zone without moving its instants', () => {
    const tokyo = datetimeRange('2026-09-01T09:00', '2026-09-01T10:30', 'Asia/Tokyo');
    const newYork = tokyo.in('America/New_York');
    expect(newYork.start.zone).toBe('America/New_York');
    expect(newYork.end.zone).toBe('America/New_York');
    expect(newYork.start.format('YYYY-MM-DD HH:mm')).toBe('2026-08-31 20:00');
    expect(newYork.equals(tokyo)).toBe(true);
    expect(tokyo.start.zone).toBe('Asia/Tokyo');
  });

  it('throws unsupportedZone at a time range, which has no date to place in a zone', () => {
    expect(() => timeRange('09:00', '17:00').in('UTC')).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'unsupportedZone', at: '09:00:00/17:00:00' }),
    );
  });
});

/*******************************
             Output
*******************************/

describe('range.format() with a token pattern', () => {
  it('writes both ends in the locale passed to the call', () => {
    expect(dateRange('2026-09-01', '2026-09-07').format('D MMMM', 'fr')).toBe('1 septembre – 7 septembre');
  });
});

describe('range.toString() and toJSON()', () => {
  const stay = dateRange('2026-09-01', '2026-09-07');
  const block = datetimeRange('2026-09-01T09:00', '2026-09-01T10:30', 'Asia/Tokyo');
  const night = timeRange('22:00', '06:00');

  it('writes a date range as its two days joined by a slash', () => {
    expect(stay.toString()).toBe('2026-09-01/2026-09-07');
  });

  it('writes a datetime range as two UTC instants whatever zone it is viewed in', () => {
    expect(block.toString()).toBe('2026-09-01T00:00:00.000Z/2026-09-01T01:30:00.000Z');
    expect(block.in('America/New_York').toString()).toBe('2026-09-01T00:00:00.000Z/2026-09-01T01:30:00.000Z');
  });

  it('writes a time range start first, also when it wraps midnight', () => {
    expect(night.toString()).toBe('22:00:00/06:00:00');
  });

  it('gives the same text from toJSON(), String() and a template literal', () => {
    expect(stay.toJSON()).toBe('2026-09-01/2026-09-07');
    expect(String(stay)).toBe('2026-09-01/2026-09-07');
    expect(`${night}`).toBe('22:00:00/06:00:00');
  });

  it('joins onto a string with +', () => {
    expect('Booked ' + stay).toBe('Booked 2026-09-01/2026-09-07');
    expect('Open ' + night).toBe('Open 22:00:00/06:00:00');
  });

  it('serializes as that string inside JSON.stringify()', () => {
    expect(JSON.stringify({ stay, night })).toBe('{"stay":"2026-09-01/2026-09-07","night":"22:00:00/06:00:00"}');
    expect(JSON.stringify([block])).toBe('["2026-09-01T00:00:00.000Z/2026-09-01T01:30:00.000Z"]');
  });

  it('reads back from its own string as an equal range', () => {
    const revived = JSON.parse(JSON.stringify({ stay, block, night }));
    expect(dateRange(revived.stay).equals(stay)).toBe(true);
    expect(datetimeRange(revived.block).equals(block)).toBe(true);
    expect(timeRange(revived.night).equals(night)).toBe(true);
  });

  it('throws unsupportedComparison at the range under <, - and unary +, since a range is not one number', () => {
    const refusal = expect.objectContaining({
      name: 'RangeError',
      code: 'unsupportedComparison',
      at: '2026-09-01/2026-09-07',
    });
    expect(() => stay < dateRange('2026-10-01', '2026-10-07')).toThrowError(refusal);
    expect(() => stay - stay).toThrowError(refusal);
    expect(() => +stay).toThrowError(refusal);
  });
});
