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

describe('dateRange()', () => {
  it('constructs an inclusive DateRange from start and end date strings', () => {
    const trip = dateRange('2026-09-01', '2026-09-07');
    expect(trip).toBeInstanceOf(DateRange);
    expect(trip.kind).toBe('date');
    expect(trip.start.toString()).toBe('2026-09-01');
    expect(trip.end.toString()).toBe('2026-09-07');
  });

  it('accepts CalendarDate instances as start and end', () => {
    expect(dateRange(date('2026-09-01'), date('2026-09-07')).toString()).toBe('2026-09-01/2026-09-07');
  });

  it('computes an inclusive end date from a day duration', () => {
    expect(dateRange('2026-09-01', '7 days').toString()).toBe('2026-09-01/2026-09-07');
    expect(dateRange('2026-09-01', '7d').toString()).toBe('2026-09-01/2026-09-07');
    expect(dateRange('2026-09-01', 'P7D').toString()).toBe('2026-09-01/2026-09-07');
    expect(dateRange('2026-09-01', days(7)).toString()).toBe('2026-09-01/2026-09-07');
    expect(dateRange('2026-09-01', { days: 7 }).toString()).toBe('2026-09-01/2026-09-07');
  });

  it('computes an inclusive end date from week and month durations', () => {
    expect(dateRange('2026-09-01', '2 weeks').toString()).toBe('2026-09-01/2026-09-14');
    expect(dateRange('2026-09-01', '1 month').toString()).toBe('2026-09-01/2026-09-30');
  });

  it('constructs a single-day DateRange for a 1-day duration', () => {
    expect(dateRange('2026-09-01', '1 day').toString()).toBe('2026-09-01/2026-09-01');
  });

  it("parses single-string intervals joined by '/', ' - ', ' – ', or ' to '", () => {
    expect(dateRange('2026-09-01/2026-09-07').toString()).toBe('2026-09-01/2026-09-07');
    expect(dateRange('2026-09-01 - 2026-09-07').toString()).toBe('2026-09-01/2026-09-07');
    expect(dateRange('2026-09-01 – 2026-09-07').toString()).toBe('2026-09-01/2026-09-07');
    expect(dateRange('2026-09-01 to 2026-09-07').toString()).toBe('2026-09-01/2026-09-07');
  });

  it('parses slash-delimited dates joined by a spaced hyphen', () => {
    expect(dateRange('2026/09/01 - 2026/09/07').toString()).toBe('2026-09-01/2026-09-07');
  });

  it('parses ISO 8601 start/duration intervals', () => {
    expect(dateRange('2026-11-06/P3D').toString()).toBe('2026-11-06/2026-11-08');
  });

  it('resolves instant strings to calendar dates in the specified timezone', () => {
    const lateEvening = dateRange('2026-09-01T02:00Z', '2026-09-03T02:00Z', 'America/Los_Angeles');
    const lateMorning = dateRange('2026-09-01T02:00Z/2026-09-03T02:00Z', { zone: 'Asia/Tokyo' });
    expect(lateEvening.toString()).toBe('2026-08-31/2026-09-02');
    expect(lateMorning.toString()).toBe('2026-09-01/2026-09-03');
  });

  it('applies the locale option to the DateRange and its endpoints', () => {
    const stay = dateRange('2026-09-01/2026-09-07', { locale: 'de-DE' });
    expect(stay.toString()).toBe('2026-09-01/2026-09-07');
    expect(stay.locale()).toBe('de-DE');
    expect(stay.end.locale()).toBe('de-DE');
  });

  it('throws invalidRange when end precedes start', () => {
    expect(() => dateRange('2026-09-07', '2026-09-01')).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'invalidRange', at: '2026-09-07 to 2026-09-01' }),
    );
  });

  it('throws invalidRange for a zero-day duration', () => {
    expect(() => dateRange('2026-09-01', '0 days')).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'invalidRange' }),
    );
  });

  it('throws unsupportedUnit for clock-unit durations', () => {
    expect(() => dateRange('2026-09-01', '2 hours')).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'unsupportedUnit', at: 'hours' }),
    );
  });

  it('throws invalidDate when the second argument is neither a date nor a duration', () => {
    expect(() => dateRange('2026-09-01', 'next week')).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'invalidDate', at: 'next week' }),
    );
  });

  it('throws missingDate when called with a single non-interval date string', () => {
    expect(() => dateRange('2026-09-01')).toThrowError(
      expect.objectContaining({ name: 'TypeError', code: 'missingDate' }),
    );
  });

  it('throws conflictingRanges when passed a range of a different kind', () => {
    expect(() => dateRange(timeRange('9am', '5pm'))).toThrowError(
      expect.objectContaining({ name: 'TypeError', code: 'conflictingRanges', at: 'timeRange as dateRange' }),
    );
  });

  // empty options object is treated as the end argument, causing invalidDate
  it.todo('accepts an empty options object alongside a single ISO interval string in dateRange()');
  it.todo('applies { locale } when wrapping an existing DateRange in dateRange()');
});

describe('datetimeRange()', () => {
  afterEach(() => {
    configure({ zone: null });
  });

  it('constructs a half-open DateTimeRange in the specified timezone', () => {
    const block = datetimeRange('2026-09-01T09:00', '2026-09-01T10:30', 'America/New_York');
    expect(block).toBeInstanceOf(DateTimeRange);
    expect(block.kind).toBe('datetime');
    expect(block.start.zone).toBe('America/New_York');
    expect(block.end.zone).toBe('America/New_York');
    expect(block.toString()).toBe('2026-09-01T13:00:00.000Z/2026-09-01T14:30:00.000Z');
  });

  it('uses the configured default timezone when no timezone is passed', () => {
    configure({ zone: 'Asia/Tokyo' });
    const block = datetimeRange('2026-09-01T09:00', '2026-09-01T10:30');
    expect(block.start.zone).toBe('Asia/Tokyo');
    expect(block.toString()).toBe('2026-09-01T00:00:00.000Z/2026-09-01T01:30:00.000Z');
  });

  it('computes end by adding an elapsed duration to start', () => {
    const meeting = datetimeRange('2026-09-01T09:00', '90m', 'America/New_York');
    expect(meeting.end.format('HH:mm')).toBe('10:30');
    expect(meeting.toString()).toBe('2026-09-01T13:00:00.000Z/2026-09-01T14:30:00.000Z');
  });

  it('interprets an unzoned end string in the timezone of start', () => {
    const fromDateTime = datetimeRange(datetime('2026-09-01T09:00', 'Asia/Tokyo'), '2026-09-01T10:30');
    const fromString = datetimeRange('2026-09-01T09:00[Asia/Tokyo]', '2026-09-01T10:30');
    expect(fromDateTime.end.zone).toBe('Asia/Tokyo');
    expect(fromDateTime.toString()).toBe('2026-09-01T00:00:00.000Z/2026-09-01T01:30:00.000Z');
    expect(fromString.toString()).toBe('2026-09-01T00:00:00.000Z/2026-09-01T01:30:00.000Z');
  });

  it('preserves the end instant while converting its timezone to match start', () => {
    const call = datetimeRange('2026-09-01T09:00[America/Los_Angeles]', '2026-09-01T19:00[Europe/Berlin]');
    expect(call.toString()).toBe('2026-09-01T16:00:00.000Z/2026-09-01T17:00:00.000Z');
    expect(call.end.zone).toBe('America/Los_Angeles');
    expect(call.end.hour).toBe(10);
  });

  it('splits single-string intervals on slash without splitting bracketed IANA timezone names', () => {
    const zoned = datetimeRange('2026-09-01T09:00[America/New_York]/2026-09-01T10:30[America/New_York]');
    expect(zoned.start.zone).toBe('America/New_York');
    expect(zoned.toString()).toBe('2026-09-01T13:00:00.000Z/2026-09-01T14:30:00.000Z');
  });

  it("parses single-string intervals joined by ' - ' or ' to '", () => {
    expect(datetimeRange('2026-09-01 09:00 - 2026-09-01 10:30', { zone: 'UTC' }).toString())
      .toBe('2026-09-01T09:00:00.000Z/2026-09-01T10:30:00.000Z');
    expect(datetimeRange('2026/09/01 09:00 - 2026/09/01 10:30', { zone: 'UTC' }).toString())
      .toBe('2026-09-01T09:00:00.000Z/2026-09-01T10:30:00.000Z');
    expect(datetimeRange('2026-09-01T09:00 to 2026-09-01T10:30', { zone: 'UTC' }).toString())
      .toBe('2026-09-01T09:00:00.000Z/2026-09-01T10:30:00.000Z');
  });

  it('preserves negative UTC offsets when splitting single-string intervals', () => {
    expect(datetimeRange('2026-09-01T09:00-04:00/2026-09-01T10:30-04:00').toString())
      .toBe('2026-09-01T13:00:00.000Z/2026-09-01T14:30:00.000Z');
    expect(datetimeRange('2026-09-01T09:00-04:00 - 2026-09-01T10:30-04:00').toString())
      .toBe('2026-09-01T13:00:00.000Z/2026-09-01T14:30:00.000Z');
  });

  it('parses ISO 8601 start/duration intervals', () => {
    expect(datetimeRange('2026-09-01T09:00Z/PT90M').toString())
      .toBe('2026-09-01T09:00:00.000Z/2026-09-01T10:30:00.000Z');
  });

  it('accepts epoch milliseconds and Date instances as start and end', () => {
    const opens = Date.UTC(2026, 8, 1, 9);
    const closes = new Date(Date.UTC(2026, 8, 1, 10));
    expect(datetimeRange(opens, closes, 'UTC').toString()).toBe('2026-09-01T09:00:00.000Z/2026-09-01T10:00:00.000Z');
  });

  it('throws invalidRange when end precedes start', () => {
    expect(() => datetimeRange('2026-09-01T10:00Z', '2026-09-01T09:00Z')).toThrowError(
      expect.objectContaining({
        name: 'RangeError',
        code: 'invalidRange',
        at: '2026-09-01T10:00:00.000Z to 2026-09-01T09:00:00.000Z',
      }),
    );
  });

  it('throws invalidRange for a negative duration', () => {
    expect(() => datetimeRange('2026-09-01T10:00Z', '-30m')).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'invalidRange' }),
    );
  });

  it('throws conflictingRanges when passed a DateRange', () => {
    expect(() => datetimeRange(dateRange('2026-09-01', '2026-09-07'))).toThrowError(
      expect.objectContaining({ name: 'TypeError', code: 'conflictingRanges', at: 'dateRange as datetimeRange' }),
    );
  });

  it.todo('accepts a timezone string alongside a single ISO interval string in datetimeRange()');
});

describe('timeRange()', () => {
  it('constructs a TimeRange from start and end time strings', () => {
    const shift = timeRange('9am', '5pm');
    expect(shift).toBeInstanceOf(TimeRange);
    expect(shift.kind).toBe('time');
    expect(shift.start.toString()).toBe('09:00:00');
    expect(shift.end.toString()).toBe('17:00:00');
  });

  it('wraps across midnight when end is earlier on the clock than start', () => {
    const nightShift = timeRange('22:00', '06:00');
    expect(nightShift.toString()).toBe('22:00:00/06:00:00');
    expect(nightShift.duration.total('hours')).toBe(8);
  });

  it('computes end from an elapsed duration, wrapping past midnight', () => {
    expect(timeRange('9am', '90m').toString()).toBe('09:00:00/10:30:00');
    expect(timeRange('22:00', '8h').toString()).toBe('22:00:00/06:00:00');
    expect(timeRange('22:00', hours(8)).toString()).toBe('22:00:00/06:00:00');
  });

  // plural unit keys denote a Duration while singular keys denote a Time fields object
  it('interprets { hours: 8 } as an 8-hour duration and { hour: 8 } as 08:00', () => {
    expect(timeRange('22:00', { hours: 8 }).toString()).toBe('22:00:00/06:00:00');
    expect(timeRange('22:00', { hour: 8 }).toString()).toBe('22:00:00/08:00:00');
  });

  it("parses single-string intervals joined by '/', ' - ', ' – ', or ' to '", () => {
    expect(timeRange('09:00/17:00').toString()).toBe('09:00:00/17:00:00');
    expect(timeRange('9am - 5pm').toString()).toBe('09:00:00/17:00:00');
    expect(timeRange('9am – 5pm').toString()).toBe('09:00:00/17:00:00');
    expect(timeRange('9am to 5pm').toString()).toBe('09:00:00/17:00:00');
  });

  it('extracts wall-clock times from instant strings in the specified timezone', () => {
    expect(timeRange('2026-09-01T00:00Z', '2026-09-01T08:00Z', 'Asia/Tokyo').toString()).toBe('09:00:00/17:00:00');
  });

  it('throws invalidTime at the invalid segment of an interval string', () => {
    expect(() => timeRange('noon-ish - 5pm')).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'invalidTime', at: 'noon-ish' }),
    );
  });

  it('throws unsupportedUnit for calendar-unit durations', () => {
    expect(() => timeRange('9am', '1 day')).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'unsupportedUnit', at: 'days' }),
    );
  });

  it("parses unspaced hyphenated time intervals such as '09:00-17:00' and '9am-5pm' in timeRange()", () => {
    expect(timeRange('09:00-17:00').toString()).toBe('09:00:00/17:00:00');
    expect(timeRange('9am-5pm').toString()).toBe('09:00:00/17:00:00');
    expect(timeRange('9am–5pm').toString()).toBe('09:00:00/17:00:00');
    expect(timeRange('22:00-02:00').toString()).toBe('22:00:00/02:00:00');
    expect(timeRange('09:00', '17:00').overlaps('16:30-18:00')).toBe(true);
  });

  it("splits on '/' before an unspaced hyphen so instants keep their dates and negative offsets", () => {
    const shift = timeRange('2026-09-01T09:00-05:00/2026-09-01T17:00-05:00', { zone: 'UTC' });
    expect(shift.toString()).toBe('14:00:00/22:00:00');
  });
});

describe('new DateRange(), new DateTimeRange(), and new TimeRange()', () => {
  it('constructs ranges identically to dateRange(), datetimeRange(), and timeRange()', () => {
    expect(new DateRange('2026-09-01', '2026-09-07').equals(dateRange('2026-09-01', '2026-09-07'))).toBe(true);
    expect(new DateRange('2026-09-01/2026-09-07').toString()).toBe('2026-09-01/2026-09-07');
    expect(new DateTimeRange('2026-09-01T09:00', '90m', 'Asia/Tokyo').toString())
      .toBe('2026-09-01T00:00:00.000Z/2026-09-01T01:30:00.000Z');
    expect(new TimeRange('22:00', '8h').toString()).toBe('22:00:00/06:00:00');
  });
});

describe('Point to(), for(), and through()', () => {
  it('builds an inclusive DateRange from CalendarDate.prototype.to()', () => {
    const trip = date('2026-09-01').to('2026-09-07');
    expect(trip).toBeInstanceOf(DateRange);
    expect(trip.toString()).toBe('2026-09-01/2026-09-07');
    expect(trip.contains('2026-09-07')).toBe(true);
  });

  it('aliases CalendarDate.prototype.through() to to()', () => {
    const checkIn = date('2026-09-01');
    expect(checkIn.through('2026-09-07').equals(checkIn.to('2026-09-07'))).toBe(true);
    expect(checkIn.through(7, 'days').equals(checkIn.to(7, 'days'))).toBe(true);
  });

  it('computes an inclusive end date from CalendarDate.prototype.for() and to() with a duration', () => {
    const checkIn = date('2026-11-06');
    expect(checkIn.for(3, 'days').toString()).toBe('2026-11-06/2026-11-08');
    expect(checkIn.for('3 days').toString()).toBe('2026-11-06/2026-11-08');
    expect(checkIn.for({ days: 3 }).toString()).toBe('2026-11-06/2026-11-08');
    expect(checkIn.for(days(3)).toString()).toBe('2026-11-06/2026-11-08');
    expect(checkIn.to(3, 'days').toString()).toBe('2026-11-06/2026-11-08');
  });

  it('computes an inclusive 14-day span for date.for(2, "weeks")', () => {
    expect(date('2026-11-02').for(2, 'weeks').end.toString()).toBe('2026-11-15');
  });

  it('throws invalidRange when duration is zero or negative or end is before start', () => {
    const checkIn = date('2026-09-01');
    const errorMatch = expect.objectContaining({ name: 'RangeError', code: 'invalidRange' });
    expect(() => checkIn.for(0, 'days')).toThrowError(errorMatch);
    expect(() => checkIn.for(-2, 'days')).toThrowError(errorMatch);
    expect(() => checkIn.to('2026-08-31')).toThrowError(errorMatch);
  });

  it('builds a DateTimeRange from DateTime.prototype.to() inheriting the start timezone', () => {
    const standup = datetime('2026-11-16T09:30', 'America/Los_Angeles');
    const slot = standup.to('2026-11-16T10:00');
    expect(slot).toBeInstanceOf(DateTimeRange);
    expect(slot.end.zone).toBe('America/Los_Angeles');
    expect(slot.duration.total('minutes')).toBe(30);
  });

  it('builds a DateTimeRange from DateTime.prototype.for() with an elapsed duration', () => {
    const standup = datetime('2026-11-16T09:30', 'America/Los_Angeles');
    expect(standup.for(90, 'minutes').end.format('HH:mm')).toBe('11:00');
    expect(standup.for('90m').end.format('HH:mm')).toBe('11:00');
    expect(standup.for(hours(1.5)).end.format('HH:mm')).toBe('11:00');
    expect(standup.to(90, 'minutes').end.format('HH:mm')).toBe('11:00');
  });

  it('preserves wall-clock time for 1 calendar day across DST while adding 24 elapsed hours for 24h', () => {
    const dayBefore = datetime('2026-03-07T12:00', 'America/New_York');
    expect(dayBefore.for(1, 'day').end.format('HH:mm')).toBe('12:00');
    expect(dayBefore.for(24, 'hours').end.format('HH:mm')).toBe('13:00');
  });

  it('throws invalidRange when DateTime.prototype.to() targets an earlier instant', () => {
    const standup = datetime('2026-11-16T09:30', 'America/Los_Angeles');
    expect(() => standup.to('2026-11-16T09:00')).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'invalidRange' }),
    );
  });

  it('builds a TimeRange from Time.prototype.to(), including across midnight', () => {
    expect(time('9:00am').to('5:00pm')).toBeInstanceOf(TimeRange);
    expect(time('9:00am').to('5:00pm').toString()).toBe('09:00:00/17:00:00');
    expect(time('22:00').to('06:00').duration.total('hours')).toBe(8);
  });

  it('builds a TimeRange from Time.prototype.for() with an elapsed duration', () => {
    expect(time('9am').for(90, 'minutes').toString()).toBe('09:00:00/10:30:00');
    expect(time('9am').for('8h').toString()).toBe('09:00:00/17:00:00');
    expect(time('9am').for(hours(8)).toString()).toBe('09:00:00/17:00:00');
  });

  // (8, 'hours') is an elapsed duration whereas bare (8) would parse as 08:00
  it('interprets (count, unit) in Time.prototype.to() as an elapsed duration', () => {
    expect(time('9am').to(8, 'hours').toString()).toBe('09:00:00/17:00:00');
  });

  // through() implies an inclusive end, which only DateRange uses
  it('exposes through() only on CalendarDate and not on DateTime or Time', () => {
    expect(datetime('2026-11-16T09:30', 'UTC').through).toBeUndefined();
    expect(time('9am').through).toBeUndefined();
  });

  it.todo('rejects a bare number without a unit in point.for()');
});

describe('CalendarDate.prototype.range() and DateTime.prototype.range()', () => {
  it('returns the full month DateRange for a CalendarDate, including leap years', () => {
    expect(date('2026-02-10').range('month').toString()).toBe('2026-02-01/2026-02-28');
    expect(date('2028-02-10').range('month').toString()).toBe('2028-02-01/2028-02-29');
  });

  it('returns year, quarter, and single-day DateRanges for a CalendarDate', () => {
    const wednesday = date('2026-11-18');
    expect(wednesday.range('year').toString()).toBe('2026-01-01/2026-12-31');
    expect(wednesday.range('quarter').toString()).toBe('2026-10-01/2026-12-31');
    expect(wednesday.range('day').toString()).toBe('2026-11-18/2026-11-18');
  });

  it('starts week ranges on the specified weekday', () => {
    const wednesday = date('2026-11-18');
    expect(wednesday.range('week', 'monday').toString()).toBe('2026-11-16/2026-11-22');
    expect(wednesday.range('week', 'sunday').toString()).toBe('2026-11-15/2026-11-21');
  });

  it('starts week ranges on the first day of the week for the instance locale', () => {
    expect(date('2026-11-18', { locale: 'en-US' }).range('week').toString()).toBe('2026-11-15/2026-11-21');
    expect(date('2026-11-18', { locale: 'de-DE' }).range('week').toString()).toBe('2026-11-16/2026-11-22');
  });

  it('throws unsupportedUnit for clock units on CalendarDate.prototype.range()', () => {
    expect(() => date('2026-11-18').range('hour')).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'unsupportedUnit', at: 'hour' }),
    );
  });

  it('returns a half-open hour DateTimeRange for a DateTime', () => {
    expect(datetime('2026-11-16T14:20Z', 'UTC').range('hour').toString())
      .toBe('2026-11-16T14:00:00.000Z/2026-11-16T15:00:00.000Z');
  });

  it('returns a midnight-to-midnight DateTimeRange in the DateTime timezone', () => {
    const afternoon = datetime('2026-11-16T14:45', 'Asia/Tokyo');
    expect(afternoon.range('day')).toBeInstanceOf(DateTimeRange);
    expect(afternoon.range('day').toString()).toBe('2026-11-15T15:00:00.000Z/2026-11-16T15:00:00.000Z');
  });

  it('returns half-open month and week DateTimeRanges', () => {
    const wednesday = datetime('2026-11-18T14:45', 'UTC');
    expect(wednesday.range('month').toString()).toBe('2026-11-01T00:00:00.000Z/2026-12-01T00:00:00.000Z');
    expect(wednesday.range('week', 'monday').toString()).toBe('2026-11-16T00:00:00.000Z/2026-11-23T00:00:00.000Z');
  });

  it('excludes the start instant of the next day from a DateTime day range', () => {
    const day = datetime('2026-11-16T14:45', 'UTC').range('day');
    expect(day.contains('2026-11-16T23:59:59.999Z')).toBe(true);
    expect(day.contains('2026-11-17T00:00:00Z')).toBe(false);
  });

  it('computes 23-hour spring-forward and 25-hour fall-back day ranges across DST', () => {
    expect(datetime('2026-03-08T14:45', 'America/New_York').range('day').duration.total('hours')).toBe(23);
    expect(datetime('2026-11-01T14:45', 'America/New_York').range('day').duration.total('hours')).toBe(25);
  });

  it('throws unknownUnit for an unrecognized unit', () => {
    expect(() => datetime('2026-11-16T14:45', 'UTC').range('fortnight')).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'unknownUnit', at: 'fortnight' }),
    );
  });

  // Havana springs forward from 00:00 to 01:00 on 2026-03-08, so the day starts at 01:00 and is 23 hours long
  it('computes datetime.range("day") end on the same calendar day when midnight is skipped by DST', () => {
    const day = datetime('2026-03-08T12:00', 'America/Havana').range('day');
    expect(day.start.format('YYYY-MM-DD HH:mm')).toBe('2026-03-08 01:00');
    expect(day.end.format('YYYY-MM-DD HH:mm')).toBe('2026-03-09 00:00');
    expect(day.duration.total('hours')).toBe(23);
    expect(day.overlaps(datetime('2026-03-09T12:00', 'America/Havana').range('day'))).toBe(false);
  });
});

describe('Range duration and as("duration")', () => {
  it('counts both endpoints inclusively in DateRange.prototype.duration', () => {
    expect(dateRange('2026-09-01', '2026-09-07').duration.days).toBe(7);
    expect(dateRange('2026-09-01', '2026-09-01').duration.days).toBe(1);
  });

  it('totals days accurately across multi-month DateRanges', () => {
    expect(dateRange('2026-09-01', '2026-10-15').duration.total('days')).toBe(45);
    expect(dateRange('2026-01-01', '2026-12-31').duration.total('days')).toBe(365);
  });

  it('counts every day of a multi-month DateRange in duration.days', () => {
    const stay = dateRange('2026-01-01', '2026-02-14');
    expect(stay.duration.days).toBe(45);
    expect(stay.duration.toString()).toBe('P45D');
    expect(stay.duration.balance('month').toString()).toBe('P1M14D');
  });

  it('measures elapsed duration between start and end on DateTimeRange', () => {
    const meeting = datetimeRange('2026-09-01T09:00', '2026-09-01T10:30', 'America/New_York');
    expect(meeting.duration.total('minutes')).toBe(90);
  });

  it('measures actual elapsed hours across DST transitions on DateTimeRange', () => {
    const springForward = datetimeRange('2026-03-08T00:00', '2026-03-09T00:00', 'America/New_York');
    const fallBack = datetimeRange('2026-11-01T00:00', '2026-11-01T04:00', 'America/New_York');
    expect(springForward.duration.total('hours')).toBe(23);
    expect(fallBack.duration.total('hours')).toBe(5);
  });

  it('measures elapsed duration within the same day on TimeRange', () => {
    expect(timeRange('9am', '5pm').duration.hours).toBe(8);
  });

  it('measures elapsed duration across midnight on TimeRange', () => {
    expect(timeRange('22:00', '06:00').duration.hours).toBe(8);
    expect(timeRange('23:30', '00:15').duration.total('minutes')).toBe(45);
  });

  it('returns an equal Duration from as("duration")', () => {
    const trip = dateRange('2026-09-01', '2026-09-07');
    expect(trip.as('duration').equals(trip.duration)).toBe(true);
  });

  it('throws unknownKind from as() for unsupported target kinds', () => {
    expect(() => dateRange('2026-09-01', '2026-09-07').as('date')).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'unknownKind', at: 'date' }),
    );
  });
});

describe('Range isEmpty()', () => {
  it('returns true for zero-duration DateTimeRange and TimeRange instances', () => {
    expect(timeRange('09:00', '09:00').isEmpty()).toBe(true);
    expect(datetimeRange('2026-09-01T10:00Z', '2026-09-01T10:00Z').isEmpty()).toBe(true);
  });

  it('returns false for non-zero DateTimeRange and TimeRange instances', () => {
    expect(timeRange('09:00', '09:01').isEmpty()).toBe(false);
    expect(timeRange('22:00', '06:00').isEmpty()).toBe(false);
    expect(datetimeRange('2026-09-01T10:00Z', '1 second').isEmpty()).toBe(false);
  });

  it('returns false for a single-day DateRange', () => {
    expect(dateRange('2026-09-01', '2026-09-01').isEmpty()).toBe(false);
  });

  it('excludes the start point and yields empty every() and split() arrays when empty', () => {
    const nothing = timeRange('09:00', '09:00');
    expect(nothing.contains('09:00')).toBe(false);
    expect(nothing.duration.total('seconds')).toBe(0);
    expect(nothing.every('hour')).toEqual([]);
    expect(nothing.split('hour')).toEqual([]);
  });
});

describe('DateRange contains() and includes()', () => {
  const stay = dateRange('2026-09-01', '2026-09-07');

  it('returns true for start, end, and days in between', () => {
    expect(stay.contains('2026-09-01')).toBe(true);
    expect(stay.contains('2026-09-04')).toBe(true);
    expect(stay.contains('2026-09-07')).toBe(true);
  });

  it('returns false for dates before start or after end', () => {
    expect(stay.contains('2026-08-31')).toBe(false);
    expect(stay.contains('2026-09-08')).toBe(false);
  });

  it('accepts CalendarDate instances as well as date strings', () => {
    expect(stay.contains(date('2026-09-04'))).toBe(true);
    expect(stay.contains(date('2026-09-08'))).toBe(false);
  });

  it('evaluates a DateTime using its calendar date in its own timezone', () => {
    expect(stay.contains(datetime('2026-09-07T23:30', 'Asia/Tokyo'))).toBe(true);
    expect(stay.contains(datetime('2026-09-07T23:30Z', 'Asia/Tokyo'))).toBe(false);
  });

  it('returns true when another DateRange lies completely within the range', () => {
    expect(stay.contains(dateRange('2026-09-02', '2026-09-05'))).toBe(true);
    expect(stay.contains(dateRange('2026-09-01', '2026-09-07'))).toBe(true);
  });

  it('returns false when another DateRange extends past start or end', () => {
    expect(stay.contains(dateRange('2026-09-05', '2026-09-08'))).toBe(false);
    expect(stay.contains(dateRange('2026-08-31', '2026-09-02'))).toBe(false);
  });

  it('aliases includes() to contains()', () => {
    expect(stay.includes('2026-09-07')).toBe(true);
    expect(stay.includes('2026-09-08')).toBe(false);
    expect(stay.includes(dateRange('2026-09-02', '2026-09-05'))).toBe(true);
  });

  it('throws conflictingRanges for a range of a different kind', () => {
    expect(() => stay.contains(timeRange('9am', '5pm'))).toThrowError(
      expect.objectContaining({ name: 'TypeError', code: 'conflictingRanges', at: 'timeRange as dateRange' }),
    );
  });

  it('throws invalidDate for an invalid date string', () => {
    expect(() => stay.contains('someday')).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'invalidDate', at: 'someday' }),
    );
  });
});

describe('DateTimeRange contains() and includes()', () => {
  const block = datetimeRange('2026-09-01T09:00', '2026-09-01T10:30', 'Asia/Tokyo');

  it('returns true for start and instants strictly before end', () => {
    expect(block.contains(datetime('2026-09-01T09:00', 'Asia/Tokyo'))).toBe(true);
    expect(block.contains(datetime('2026-09-01T10:29:59.999', 'Asia/Tokyo'))).toBe(true);
  });

  it('returns false for end and instants before start', () => {
    expect(block.contains(datetime('2026-09-01T10:30', 'Asia/Tokyo'))).toBe(false);
    expect(block.contains(datetime('2026-09-01T08:59:59.999', 'Asia/Tokyo'))).toBe(false);
  });

  it('interprets unzoned datetime strings in the range timezone', () => {
    expect(block.contains('2026-09-01T09:30')).toBe(true);
    expect(block.contains('2026-09-01T10:30')).toBe(false);
  });

  it('compares DateTime values and UTC strings by exact instant across timezones', () => {
    expect(block.contains(datetime('2026-08-31T20:15', 'America/New_York'))).toBe(true);
    expect(block.contains(datetime('2026-08-31T19:59', 'America/New_York'))).toBe(false);
    expect(block.contains('2026-09-01T01:00:00Z')).toBe(true);
  });

  it('returns true when another DateTimeRange lies within [start, end)', () => {
    expect(block.contains(datetimeRange('2026-09-01T09:30', '2026-09-01T10:30', 'Asia/Tokyo'))).toBe(true);
    expect(block.contains(block)).toBe(true);
  });

  it('returns false when another DateTimeRange extends past end', () => {
    expect(block.contains(datetimeRange('2026-09-01T09:30', '2026-09-01T10:31', 'Asia/Tokyo'))).toBe(false);
  });

  it('aliases includes() to contains()', () => {
    expect(block.includes('2026-09-01T09:30')).toBe(true);
    expect(block.includes('2026-09-01T10:30')).toBe(false);
  });
});

describe('TimeRange contains() and includes()', () => {
  const office = timeRange('09:00', '17:00');
  const night = timeRange('22:00', '06:00');

  it('returns true for start and times strictly before end', () => {
    expect(office.contains('9am')).toBe(true);
    expect(office.contains('4:59pm')).toBe(true);
    expect(office.contains(time('12:00'))).toBe(true);
  });

  it('returns false for end and times outside [start, end)', () => {
    expect(office.contains('5pm')).toBe(false);
    expect(office.contains('8:59am')).toBe(false);
  });

  it('returns true for times on both sides of midnight when wrapping', () => {
    expect(night.contains('22:00')).toBe(true);
    expect(night.contains('23:30')).toBe(true);
    expect(night.contains('00:00')).toBe(true);
    expect(night.contains('02:15')).toBe(true);
  });

  it('returns false for end and excluded daytime hours when wrapping midnight', () => {
    expect(night.contains('06:00')).toBe(false);
    expect(night.contains('12:00')).toBe(false);
    expect(night.contains('21:59:59')).toBe(false);
  });

  it('evaluates a DateTime using its wall-clock time in its own timezone', () => {
    expect(office.contains(datetime('2026-09-01T12:00', 'Asia/Tokyo'))).toBe(true);
    expect(office.contains(datetime('2026-09-01T12:00Z', 'Asia/Tokyo'))).toBe(false);
  });

  it('returns true when another TimeRange lies within a midnight-wrapping range', () => {
    expect(night.contains(timeRange('23:00', '01:00'))).toBe(true);
    expect(night.contains(timeRange('22:30', '23:30'))).toBe(true);
    expect(night.contains(timeRange('01:00', '05:00'))).toBe(true);
    expect(night.contains(night)).toBe(true);
  });

  it('returns false when another TimeRange extends outside a midnight-wrapping range', () => {
    expect(night.contains(timeRange('05:00', '07:00'))).toBe(false);
    expect(night.contains(office)).toBe(false);
    expect(office.contains(night)).toBe(false);
  });

  it('aliases includes() to contains()', () => {
    expect(night.includes('02:15')).toBe(true);
    expect(night.includes('06:00')).toBe(false);
  });
});

describe('Range overlaps()', () => {
  it('returns true when two DateRanges share at least one day', () => {
    const first = dateRange('2026-09-01', '2026-09-05');
    const second = dateRange('2026-09-05', '2026-09-10');
    expect(first.overlaps(second)).toBe(true);
    expect(second.overlaps(first)).toBe(true);
  });

  it('returns false for adjacent non-overlapping DateRanges', () => {
    const first = dateRange('2026-09-01', '2026-09-05');
    const second = dateRange('2026-09-06', '2026-09-10');
    expect(first.overlaps(second)).toBe(false);
    expect(second.overlaps(first)).toBe(false);
  });

  it('returns true when one DateRange is nested inside another', () => {
    expect(dateRange('2026-09-01', '2026-09-07').overlaps(dateRange('2026-08-01', '2026-12-01'))).toBe(true);
  });

  it('returns false when one DateTimeRange ends at the exact start of another', () => {
    const first = datetimeRange('2026-09-01T09:00', '2026-09-01T10:00', 'Asia/Tokyo');
    const second = datetimeRange('2026-09-01T10:00', '2026-09-01T11:00', 'Asia/Tokyo');
    expect(first.overlaps(second)).toBe(false);
    expect(second.overlaps(first)).toBe(false);
  });

  it('compares DateTimeRanges by exact instant across timezones', () => {
    const tokyo = datetimeRange('2026-09-01T09:00', '2026-09-01T10:30', 'Asia/Tokyo');
    expect(tokyo.overlaps(datetimeRange('2026-09-01T01:29Z', '2026-09-01T03:00Z', 'Europe/Berlin'))).toBe(true);
    expect(tokyo.overlaps(datetimeRange('2026-09-01T01:30Z', '2026-09-01T03:00Z', 'Europe/Berlin'))).toBe(false);
  });

  it('returns false when one TimeRange ends at the exact start of another', () => {
    expect(timeRange('09:00', '10:00').overlaps(timeRange('10:00', '11:00'))).toBe(false);
    expect(timeRange('10:00', '11:00').overlaps(timeRange('09:00', '10:00'))).toBe(false);
  });

  it('returns true when two TimeRanges share a non-empty interval', () => {
    expect(timeRange('09:00', '10:01').overlaps(timeRange('10:00', '11:00'))).toBe(true);
  });

  it('detects overlap on either side of midnight for a wrapping TimeRange', () => {
    const night = timeRange('22:00', '06:00');
    expect(night.overlaps(timeRange('05:00', '07:00'))).toBe(true);
    expect(night.overlaps(timeRange('21:00', '22:30'))).toBe(true);
    expect(night.overlaps(timeRange('23:00', '01:00'))).toBe(true);
    expect(timeRange('05:00', '07:00').overlaps(night)).toBe(true);
  });

  it('returns false when comparing a wrapping TimeRange with its complement', () => {
    const night = timeRange('22:00', '06:00');
    expect(night.overlaps(timeRange('06:00', '22:00'))).toBe(false);
    expect(night.overlaps(timeRange('09:00', '17:00'))).toBe(false);
    expect(timeRange('09:00', '17:00').overlaps(night)).toBe(false);
  });

  it('coerces interval strings passed to overlaps()', () => {
    expect(dateRange('2026-09-01', '2026-09-05').overlaps('2026-09-05/2026-09-10')).toBe(true);
    expect(dateRange('2026-09-01', '2026-09-05').overlaps('2026-09-06/2026-09-10')).toBe(false);
    expect(timeRange('22:00', '06:00').overlaps('5am - 7am')).toBe(true);
  });

  it('throws conflictingRanges for a range of a different kind', () => {
    const stay = dateRange('2026-09-01', '2026-09-07');
    expect(() => stay.overlaps(datetimeRange('2026-09-01T09:00Z', '1h'))).toThrowError(
      expect.objectContaining({ name: 'TypeError', code: 'conflictingRanges', at: 'datetimeRange as dateRange' }),
    );
  });

  it.todo('parses an unzoned interval string in the receiver timezone in DateTimeRange.prototype.overlaps()');
});

describe('Range intersection()', () => {
  it('returns the overlapping DateRange shared by two DateRanges', () => {
    const first = dateRange('2026-09-01', '2026-09-10');
    const second = dateRange('2026-09-05', '2026-09-15');
    expect(first.intersection(second)).toBeInstanceOf(DateRange);
    expect(first.intersection(second).toString()).toBe('2026-09-05/2026-09-10');
    expect(second.intersection(first).toString()).toBe('2026-09-05/2026-09-10');
  });

  it('returns a single-day DateRange when two DateRanges share one boundary day', () => {
    expect(dateRange('2026-09-01', '2026-09-05').intersection('2026-09-05/2026-09-10').toString())
      .toBe('2026-09-05/2026-09-05');
  });

  it('returns null when two DateRanges are disjoint', () => {
    expect(dateRange('2026-09-01', '2026-09-10').intersection('2026-09-20/2026-09-25')).toBeNull();
    expect(dateRange('2026-09-01', '2026-09-05').intersection('2026-09-06/2026-09-10')).toBeNull();
  });

  it('returns the overlapping DateTimeRange compared by instant across timezones', () => {
    const tokyo = datetimeRange('2026-09-01T09:00', '2026-09-01T10:30', 'Asia/Tokyo');
    const berlin = datetimeRange('2026-09-01T03:00', '2026-09-01T04:00', 'Europe/Berlin');
    expect(tokyo.intersection(berlin)).toBeInstanceOf(DateTimeRange);
    expect(tokyo.intersection(berlin).toString()).toBe('2026-09-01T01:00:00.000Z/2026-09-01T01:30:00.000Z');
    expect(berlin.intersection(tokyo).toString()).toBe('2026-09-01T01:00:00.000Z/2026-09-01T01:30:00.000Z');
  });

  it('returns null when two DateTimeRanges only touch at an endpoint', () => {
    const first = datetimeRange('2026-09-01T09:00', '2026-09-01T10:30', 'Asia/Tokyo');
    const second = datetimeRange('2026-09-01T10:30', '2026-09-01T12:00', 'Asia/Tokyo');
    expect(first.intersection(second)).toBeNull();
  });

  it('returns the overlapping TimeRange within a single day', () => {
    const office = timeRange('09:00', '17:00');
    expect(office.intersection(timeRange('12:00', '20:00'))).toBeInstanceOf(TimeRange);
    expect(office.intersection(timeRange('12:00', '20:00')).toString()).toBe('12:00:00/17:00:00');
    expect(office.intersection('12:00/20:00').toString()).toBe('12:00:00/17:00:00');
  });

  it('returns null when two TimeRanges are disjoint or only touch at an endpoint', () => {
    const office = timeRange('09:00', '17:00');
    expect(office.intersection(timeRange('17:00', '20:00'))).toBeNull();
    expect(office.intersection(timeRange('22:00', '06:00'))).toBeNull();
  });

  it('returns the contiguous intersection for a midnight-wrapping TimeRange', () => {
    const night = timeRange('22:00', '06:00');
    expect(night.intersection(timeRange('05:00', '07:00')).toString()).toBe('05:00:00/06:00:00');
    expect(night.intersection(timeRange('20:00', '23:00')).toString()).toBe('22:00:00/23:00:00');
    expect(night.intersection(timeRange('23:00', '01:00')).toString()).toBe('23:00:00/01:00:00');
  });

  it('throws unsupportedIntersection when two TimeRanges intersect in two disjoint segments', () => {
    const night = timeRange('22:00', '06:00');
    expect(() => night.intersection(timeRange('05:00', '23:00'))).toThrowError(
      expect.objectContaining({
        name: 'RangeError',
        code: 'unsupportedIntersection',
        at: '22:00:00/06:00:00 with 05:00:00/23:00:00',
      }),
    );
  });

  it('throws conflictingRanges for a range of a different kind', () => {
    expect(() => dateRange('2026-09-01', '2026-09-07').intersection(timeRange('9am', '5pm'))).toThrowError(
      expect.objectContaining({ name: 'TypeError', code: 'conflictingRanges', at: 'timeRange as dateRange' }),
    );
  });

  it.todo('preserves the receiver timezone on DateTimeRange.prototype.intersection()');
  it.todo(
    'returns an empty TimeRange rather than null from intersection() when an empty range lies inside another, matching overlaps()',
  );
});

describe('Range equals()', () => {
  it('returns true for DateRanges with identical start and end dates', () => {
    const stay = dateRange('2026-09-01', '2026-09-07');
    expect(stay.equals(dateRange('2026-09-01', '7 days'))).toBe(true);
    expect(stay.equals(date('2026-09-01').to('2026-09-07'))).toBe(true);
    expect(stay.equals('2026-09-01/2026-09-07')).toBe(true);
  });

  it('returns false for DateRanges with different start or end dates', () => {
    const stay = dateRange('2026-09-01', '2026-09-07');
    expect(stay.equals(dateRange('2026-09-01', '2026-09-08'))).toBe(false);
    expect(stay.equals(dateRange('2026-08-31', '2026-09-07'))).toBe(false);
  });

  it('returns true for DateTimeRanges with identical instants in different timezones', () => {
    const tokyo = datetimeRange('2026-09-01T09:00', '2026-09-01T10:30', 'Asia/Tokyo');
    const utc = datetimeRange('2026-09-01T00:00Z', '2026-09-01T01:30Z', 'UTC');
    expect(tokyo.equals(utc)).toBe(true);
    expect(tokyo.equals(datetimeRange('2026-09-01T00:00Z', '2026-09-01T01:31Z', 'UTC'))).toBe(false);
  });

  it('returns true for TimeRanges with identical start and end times', () => {
    expect(timeRange('9am', '5pm').equals('09:00/17:00')).toBe(true);
    expect(timeRange('22:00', '06:00').equals(timeRange('22:00', '8h'))).toBe(true);
    expect(timeRange('22:00', '06:00').equals(timeRange('06:00', '22:00'))).toBe(false);
  });
});

describe('compare() on ranges', () => {
  it('sorts ranges chronologically by start point', () => {
    const month = dateRange('2026-11-01', '2026-11-30');
    const weekend = dateRange('2026-11-07', '2026-11-08');
    expect([weekend, month].sort(compare).map(String)).toEqual(['2026-11-01/2026-11-30', '2026-11-07/2026-11-08']);
  });
});

describe('Range every()', () => {
  it('returns each CalendarDate in a DateRange inclusively', () => {
    expect(dateRange('2026-09-01', '2026-09-04').every('day').map(String))
      .toEqual(['2026-09-01', '2026-09-02', '2026-09-03', '2026-09-04']);
  });

  it('accepts a unit string, (count, unit), duration phrase, Duration, or fields object step', () => {
    const stay = dateRange('2026-09-01', '2026-09-07');
    const everyOtherDay = ['2026-09-01', '2026-09-03', '2026-09-05', '2026-09-07'];
    expect(stay.every('days')).toHaveLength(7);
    expect(stay.every(2, 'days').map(String)).toEqual(everyOtherDay);
    expect(stay.every('2 days').map(String)).toEqual(everyOtherDay);
    expect(stay.every(days(2)).map(String)).toEqual(everyOtherDay);
    expect(stay.every({ days: 2 }).map(String)).toEqual(everyOtherDay);
  });

  it('omits steps that would exceed the range end', () => {
    expect(date('2026-11-02').for(2, 'weeks').every('week').map(String)).toEqual(['2026-11-02', '2026-11-09']);
    expect(dateRange('2026-09-01', '2026-09-07').every(4, 'days').map(String)).toEqual(['2026-09-01', '2026-09-05']);
  });

  it('returns only the start point when the step exceeds the range duration', () => {
    expect(dateRange('2026-09-01', '2026-09-07').every('month').map(String)).toEqual(['2026-09-01']);
  });

  it('anchors monthly steps to the start date and clamps to shorter month ends', () => {
    expect(dateRange('2026-01-31', '2026-04-30').every('month').map(String))
      .toEqual(['2026-01-31', '2026-02-28', '2026-03-31', '2026-04-30']);
  });

  it('iterates DateTimeRange points in the range timezone and excludes end', () => {
    const block = datetimeRange('2026-09-01T09:00', '2026-09-01T10:30', 'Asia/Tokyo');
    const points = block.every(30, 'minutes');
    expect(points.map((point) => point.format('HH:mm'))).toEqual(['09:00', '09:30', '10:00']);
    expect(points.map((point) => point.zone)).toEqual(['Asia/Tokyo', 'Asia/Tokyo', 'Asia/Tokyo']);
  });

  it('skips nonexistent local hours across a spring-forward DST transition', () => {
    const earlyMorning = datetimeRange('2026-03-08T00:00', '2026-03-08T05:00', 'America/New_York');
    expect(earlyMorning.every('hour').map((point) => point.hour)).toEqual([0, 1, 3, 4]);
  });

  it('emits both occurrences of a repeated hour across a fall-back DST transition', () => {
    const earlyMorning = datetimeRange('2026-11-01T00:00', '2026-11-01T03:00', 'America/New_York');
    expect(earlyMorning.every('hour').map((point) => point.hour)).toEqual([0, 1, 1, 2]);
  });

  it('preserves local midnight when stepping by calendar days across DST', () => {
    const weekend = datetimeRange('2026-03-07T00:00', '2026-03-10T00:00', 'America/New_York');
    expect(weekend.every('day').map((point) => point.format('DD HH:mm'))).toEqual([
      '07 00:00',
      '08 00:00',
      '09 00:00',
    ]);
  });

  it('iterates TimeRange points across midnight and excludes end', () => {
    expect(timeRange('22:00', '02:00').every(1, 'hour').map(String))
      .toEqual(['22:00:00', '23:00:00', '00:00:00', '01:00:00']);
  });

  it('throws invalidStep for zero or negative steps', () => {
    const stay = dateRange('2026-09-01', '2026-09-07');
    expect(() => stay.every(0, 'days')).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'invalidStep' }),
    );
    expect(() => stay.every(-1, 'days')).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'invalidStep', at: '-P1D' }),
    );
  });

  it('throws unsupportedUnit when stepping a DateRange by clock units or a TimeRange by calendar units', () => {
    expect(() => dateRange('2026-09-01', '2026-09-07').every('hour')).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'unsupportedUnit', at: 'hours' }),
    );
    expect(() => timeRange('09:00', '17:00').every('day')).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'unsupportedUnit', at: 'days' }),
    );
    expect(() => timeRange('09:00', '09:00').every('day')).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'unsupportedUnit', at: 'days' }),
    );
  });
});

describe('DateRange count()', () => {
  it('counts total inclusive days by default or with day/days', () => {
    const sprint = dateRange('2026-05-01', '2 weeks');
    expect(sprint.count()).toBe(14);
    expect(sprint.count('days')).toBe(14);
    expect(sprint.count('day')).toBe(14);
    expect(dateRange('2026-05-01', '2026-05-01').count()).toBe(1);
  });

  it('counts weekdays, weekends, and named weekdays in O(1) matching every(day) filters', () => {
    // test every start weekday and remainder length 1..14
    for (let startDay = 1; startDay <= 7; startDay++) {
      for (let len = 1; len <= 14; len++) {
        const span = dateRange(`2026-06-0${startDay}`, `${len} days`);
        const all = span.every('day');
        expect(span.count('weekdays')).toBe(all.filter((d) => d.isWeekday()).length);
        expect(span.count('weekends')).toBe(all.filter((d) => d.isWeekend()).length);
        expect(span.count('mondays')).toBe(all.filter((d) => d.dayOfWeek === 1).length);
        expect(span.count('sundays')).toBe(all.filter((d) => d.dayOfWeek === 7).length);
      }
    }
  });

  it('normalizes whitespace, letter case, singular forms, and three-letter weekday prefixes', () => {
    const sprint = dateRange('2026-05-01', '2 weeks');
    expect(sprint.count(' Weekdays ')).toBe(10);
    expect(sprint.count('weekend')).toBe(4);
    expect(sprint.count('MON')).toBe(2);
    expect(sprint.count(' Fridays ')).toBe(2);
  });

  it('throws unknownKind for unrecognized count kinds', () => {
    const sprint = dateRange('2026-05-01', '2 weeks');
    expect(() => sprint.count('weeks')).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'unknownKind', at: 'weeks' }),
    );
    expect(() => sprint.count('monay')).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'unknownKind', at: 'monay' }),
    );
  });
});

describe('Range split() and splitBy()', () => {
  it('splits a DateRange into non-overlapping DateRanges clamping the final slice to end', () => {
    const subRanges = dateRange('2026-09-01', '2026-09-10').split(4, 'days');
    expect(subRanges.map(String)).toEqual(['2026-09-01/2026-09-04', '2026-09-05/2026-09-08', '2026-09-09/2026-09-10']);
    expect(subRanges.every((subRange) => subRange instanceof DateRange)).toBe(true);
  });

  it('splits a DateRange into equal slices when the step divides the span evenly', () => {
    expect(date('2026-11-02').for(2, 'weeks').split(1, 'week').map(String))
      .toEqual(['2026-11-02/2026-11-08', '2026-11-09/2026-11-15']);
  });

  it('splits a DateRange by calendar months anchored to start', () => {
    expect(dateRange('2026-01-15', '2026-04-10').split('month').map(String))
      .toEqual(['2026-01-15/2026-02-14', '2026-02-15/2026-03-14', '2026-03-15/2026-04-10']);
  });

  it('produces a single-day trailing DateRange when one day remains', () => {
    expect(dateRange('2026-09-01', '2026-09-09').split(4, 'days').at(-1).toString()).toBe('2026-09-09/2026-09-09');
  });

  it('splits a DateTimeRange into contiguous half-open slices in the range timezone', () => {
    const block = datetimeRange('2026-09-01T09:00', '2026-09-01T10:30', 'Asia/Tokyo');
    const subRanges = block.split(1, 'hour');
    expect(subRanges.map(String)).toEqual([
      '2026-09-01T00:00:00.000Z/2026-09-01T01:00:00.000Z',
      '2026-09-01T01:00:00.000Z/2026-09-01T01:30:00.000Z',
    ]);
    expect(subRanges.every((subRange) => subRange instanceof DateTimeRange)).toBe(true);
    expect(subRanges.map((subRange) => subRange.start.zone)).toEqual(['Asia/Tokyo', 'Asia/Tokyo']);
  });

  it('splits an 8-hour workday into sixteen 30-minute DateTimeRanges', () => {
    const day = date('2026-11-16');
    const slots = day.at('9am', 'Europe/Berlin').to(day.at('5pm', 'Europe/Berlin')).split('30m');
    expect(slots).toHaveLength(16);
    expect(slots[0].start.format('HH:mm')).toBe('09:00');
    expect(slots.at(-1).end.format('HH:mm')).toBe('17:00');
  });

  it('splits a DateTimeRange by day across spring-forward DST into 24h, 23h, and 24h slices', () => {
    const weekend = datetimeRange('2026-03-07T00:00', '2026-03-10T00:00', 'America/New_York');
    expect(weekend.split('day').map((day) => day.duration.total('hours'))).toEqual([24, 23, 24]);
  });

  it('splits a midnight-wrapping TimeRange into contiguous non-wrapping slices', () => {
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

  it('returns a single-element array equal to the full range when the step exceeds the span', () => {
    expect(dateRange('2026-09-01', '2026-09-07').split('month').map(String)).toEqual(['2026-09-01/2026-09-07']);
    expect(timeRange('09:00', '17:00').split('12h').map(String)).toEqual(['09:00:00/17:00:00']);
  });

  it('aliases splitBy() to split()', () => {
    const trip = dateRange('2026-09-01', '2026-09-10');
    expect(trip.splitBy(4, 'days').map(String)).toEqual(trip.split(4, 'days').map(String));
    expect(trip.splitBy('week').map(String)).toEqual(trip.split('week').map(String));
  });

  it('throws invalidStep for zero or negative steps', () => {
    const stay = dateRange('2026-09-01', '2026-09-07');
    expect(() => stay.split(0, 'days')).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'invalidStep' }),
    );
    expect(() => stay.splitBy(-1, 'days')).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'invalidStep', at: '-P1D' }),
    );
  });
});

describe('CalendarDate split(), splitBy(), and every()', () => {
  afterEach(() => {
    configure({ zone: null });
  });

  it('splits a CalendarDate into half-open DateTimeRanges across that day in the specified timezone', () => {
    const halves = date('2026-11-16').split(12, 'hours', 'UTC');
    expect(halves.every((half) => half instanceof DateTimeRange)).toBe(true);
    expect(halves.map(String)).toEqual([
      '2026-11-16T00:00:00.000Z/2026-11-16T12:00:00.000Z',
      '2026-11-16T12:00:00.000Z/2026-11-17T00:00:00.000Z',
    ]);
  });

  it('accepts a unit name or duration phrase before the timezone argument', () => {
    const day = date('2026-11-16');
    expect(day.split('hour', 'Asia/Tokyo')).toHaveLength(24);
    expect(day.split('6h', 'Asia/Tokyo').map((slice) => slice.start.format('HH:mm')))
      .toEqual(['00:00', '06:00', '12:00', '18:00']);
    expect(day.every('6h', 'Asia/Tokyo')[0].toString()).toBe('2026-11-15T15:00:00.000Z');
  });

  it('accepts a numeric string count before unit and timezone arguments', () => {
    const day = date('2026-11-16');
    expect(day.split('12', 'hours', 'UTC').map(String)).toEqual([
      '2026-11-16T00:00:00.000Z/2026-11-16T12:00:00.000Z',
      '2026-11-16T12:00:00.000Z/2026-11-17T00:00:00.000Z',
    ]);
    expect(day.every('6', 'hours', 'UTC')).toHaveLength(4);
  });

  it('aliases splitBy() to split()', () => {
    const day = date('2026-11-16');
    expect(day.splitBy(12, 'hours', 'UTC').map(String)).toEqual(day.split(12, 'hours', 'UTC').map(String));
    expect(day.splitBy('hour', 'UTC').map(String)).toEqual(day.split('hour', 'UTC').map(String));
  });

  it('produces 23 hourly slices on spring-forward days and 25 on fall-back days', () => {
    expect(date('2026-03-08').split('hour', 'America/New_York')).toHaveLength(23);
    expect(date('2026-11-01').split('hour', 'America/New_York')).toHaveLength(25);
  });

  it('returns DateTime instants from midnight up to the next midnight in every()', () => {
    expect(date('2026-11-16').every(6, 'hours', 'UTC').map(String)).toEqual([
      '2026-11-16T00:00:00.000Z',
      '2026-11-16T06:00:00.000Z',
      '2026-11-16T12:00:00.000Z',
      '2026-11-16T18:00:00.000Z',
    ]);
  });

  it('uses the configured default timezone when no timezone argument is passed', () => {
    configure({ zone: 'Asia/Tokyo' });
    const day = date('2026-11-16');
    expect(day.split('12h').map(String)).toEqual([
      '2026-11-15T15:00:00.000Z/2026-11-16T03:00:00.000Z',
      '2026-11-16T03:00:00.000Z/2026-11-16T15:00:00.000Z',
    ]);
    expect(day.every('12h')[0].zone).toBe('Asia/Tokyo');
  });

  it('throws invalidStep for zero or negative steps', () => {
    expect(() => date('2026-11-16').split(0, 'hours', 'UTC')).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'invalidStep' }),
    );
  });

  it('keeps all split() slices and every() within the calendar day when midnight is skipped by DST', () => {
    const day = date('2026-03-08');
    expect(day.split('hour', 'America/Havana')).toHaveLength(23);
    expect(day.every('hour', 'America/Havana').at(-1).format('YYYY-MM-DD HH:mm')).toBe('2026-03-08 23:00');
  });
});

describe('Range in()', () => {
  afterEach(() => {
    configure({ zone: null });
  });

  it('converts a DateRange into a half-open DateTimeRange from start midnight to the midnight after end', () => {
    const days = dateRange('2026-09-01', '2026-09-03').in('UTC');
    expect(days).toBeInstanceOf(DateTimeRange);
    expect(days.toString()).toBe('2026-09-01T00:00:00.000Z/2026-09-04T00:00:00.000Z');
  });

  it('includes the last millisecond of the end date and excludes the next midnight', () => {
    const days = dateRange('2026-09-01', '2026-09-03').in('UTC');
    expect(days.contains('2026-09-03T23:59:59.999Z')).toBe(true);
    expect(days.contains('2026-09-04T00:00:00Z')).toBe(false);
  });

  it('computes start and end midnights in the specified timezone', () => {
    const days = dateRange('2026-09-01', '2026-09-03').in('Asia/Tokyo');
    expect(days.start.zone).toBe('Asia/Tokyo');
    expect(days.toString()).toBe('2026-08-31T15:00:00.000Z/2026-09-03T15:00:00.000Z');
  });

  it('uses the configured default timezone when called with no argument on a DateRange', () => {
    configure({ zone: 'Asia/Tokyo' });
    expect(dateRange('2026-09-01', '2026-09-03').in().toString())
      .toBe('2026-08-31T15:00:00.000Z/2026-09-03T15:00:00.000Z');
  });

  it('preserves actual DST day durations when converting a DateRange to a DateTimeRange', () => {
    expect(dateRange('2026-03-08', '2026-03-08').in('America/New_York').duration.total('hours')).toBe(23);
    expect(dateRange('2026-03-07', '2026-03-09').in('America/New_York').duration.total('hours')).toBe(71);
  });

  // America/Havana transitions DST at 00:00, skipping 2026-03-08T00:00
  it('starts at the first valid local instant on the start date when DST skips midnight', () => {
    const day = dateRange('2026-03-08', '2026-03-08').in('America/Havana');
    expect(day.start.format('YYYY-MM-DD HH:mm')).toBe('2026-03-08 01:00');
    expect(day.end.format('YYYY-MM-DD HH:mm')).toBe('2026-03-09 00:00');
    expect(day.duration.total('hours')).toBe(23);
  });

  it('converts a DateTimeRange to another timezone while preserving its instants', () => {
    const tokyo = datetimeRange('2026-09-01T09:00', '2026-09-01T10:30', 'Asia/Tokyo');
    const newYork = tokyo.in('America/New_York');
    expect(newYork.start.zone).toBe('America/New_York');
    expect(newYork.end.zone).toBe('America/New_York');
    expect(newYork.start.format('YYYY-MM-DD HH:mm')).toBe('2026-08-31 20:00');
    expect(newYork.equals(tokyo)).toBe(true);
    expect(tokyo.start.zone).toBe('Asia/Tokyo');
  });

  it('throws unsupportedZone on TimeRange.prototype.in()', () => {
    expect(() => timeRange('09:00', '17:00').in('UTC')).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'unsupportedZone', at: '09:00:00/17:00:00' }),
    );
  });
});

describe('Range format()', () => {
  it('formats start and end with a token pattern in the specified locale', () => {
    expect(dateRange('2026-09-01', '2026-09-07').format('D MMMM', 'fr')).toBe('1 septembre – 7 septembre');
  });
});

describe('Range toString(), toJSON(), and numeric coercion', () => {
  const stay = dateRange('2026-09-01', '2026-09-07');
  const block = datetimeRange('2026-09-01T09:00', '2026-09-01T10:30', 'Asia/Tokyo');
  const night = timeRange('22:00', '06:00');

  it("serializes a DateRange as 'YYYY-MM-DD/YYYY-MM-DD'", () => {
    expect(stay.toString()).toBe('2026-09-01/2026-09-07');
  });

  it('serializes a DateTimeRange as UTC ISO instants regardless of display timezone', () => {
    expect(block.toString()).toBe('2026-09-01T00:00:00.000Z/2026-09-01T01:30:00.000Z');
    expect(block.in('America/New_York').toString()).toBe('2026-09-01T00:00:00.000Z/2026-09-01T01:30:00.000Z');
  });

  it("serializes a TimeRange as 'HH:mm:ss/HH:mm:ss' including across midnight", () => {
    expect(night.toString()).toBe('22:00:00/06:00:00');
  });

  it('returns the same interval string from toJSON(), String(), and template literals', () => {
    expect(stay.toJSON()).toBe('2026-09-01/2026-09-07');
    expect(String(stay)).toBe('2026-09-01/2026-09-07');
    expect(`${night}`).toBe('22:00:00/06:00:00');
  });

  it('concatenates as an interval string with the + operator', () => {
    expect('Booked ' + stay).toBe('Booked 2026-09-01/2026-09-07');
    expect('Open ' + night).toBe('Open 22:00:00/06:00:00');
  });

  it('serializes via toJSON() inside JSON.stringify()', () => {
    expect(JSON.stringify({ stay, night })).toBe('{"stay":"2026-09-01/2026-09-07","night":"22:00:00/06:00:00"}');
    expect(JSON.stringify([block])).toBe('["2026-09-01T00:00:00.000Z/2026-09-01T01:30:00.000Z"]');
  });

  it('round-trips serialized strings back through dateRange(), datetimeRange(), and timeRange()', () => {
    const revived = JSON.parse(JSON.stringify({ stay, block, night }));
    expect(dateRange(revived.stay).equals(stay)).toBe(true);
    expect(datetimeRange(revived.block).equals(block)).toBe(true);
    expect(timeRange(revived.night).equals(night)).toBe(true);
  });

  it('throws unsupportedComparison from <, -, and unary +', () => {
    const errorMatch = expect.objectContaining({
      name: 'RangeError',
      code: 'unsupportedComparison',
      at: '2026-09-01/2026-09-07',
    });
    expect(() => stay < dateRange('2026-10-01', '2026-10-07')).toThrowError(errorMatch);
    expect(() => stay - stay).toThrowError(errorMatch);
    expect(() => +stay).toThrowError(errorMatch);
  });
});
