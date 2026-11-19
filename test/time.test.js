import { compare, configure, date, datetime, duration, Time, time } from 'native-dates';
import { afterEach, describe, expect, it } from 'vitest';

describe('time() reading clock strings', () => {
  it.each([
    ['9am', '09:00:00'],
    ['5:30pm', '17:30:00'],
    ['9:30:15am', '09:30:15'],
    ['11:59:59.999pm', '23:59:59.999'],
  ])('reads the 12-hour time %s as %s', (text, expected) => {
    expect(time(text).toString()).toBe(expected);
  });

  it('reads 12am as midnight and 12pm as noon', () => {
    expect(time('12am').toString()).toBe('00:00:00');
    expect(time('12:30am').toString()).toBe('00:30:00');
    expect(time('12pm').toString()).toBe('12:00:00');
    expect(time('12:30pm').toString()).toBe('12:30:00');
  });

  it.each(['5:15 PM', '5:15PM', '5:15 p.m.', '5:15 P.M.', ' 5:15pm '])(
    'reads %j as 17:15, whatever the case, dots or spacing of am and pm',
    (text) => {
      expect(time(text).toString()).toBe('17:15:00');
    },
  );

  // CLDR writes a narrow no-break space before AM and PM, and a time pasted from a page keeps it
  it.each([
    ['a narrow no-break space', '5:15 PM'],
    ['a no-break space', '5:15 PM'],
  ])('reads a 12-hour time written with %s before PM', (_, text) => {
    expect(time(text).toString()).toBe('17:15:00');
  });

  it.each([
    ['09:00', '09:00:00'],
    ['17:30', '17:30:00'],
    ['17:30:15', '17:30:15'],
    ['17:30:15.250', '17:30:15.250'],
    ['00:00', '00:00:00'],
  ])('reads the 24-hour time %s as %s', (text, expected) => {
    expect(time(text).toString()).toBe(expected);
  });

  it('reads an hour written without its leading zero', () => {
    expect(time('9:30').toString()).toBe('09:30:00');
  });

  it('reads a fraction of a second down to the nanosecond', () => {
    expect(time('17:30:15.123456789')).toMatchObject({
      hour: 17,
      minute: 30,
      second: 15,
      millisecond: 123,
      microsecond: 456,
      nanosecond: 789,
    });
  });

  it.each(['0am', '13pm', '00:30am'])('throws invalidTime at %j, an hour outside 1 to 12 beside am or pm', (text) => {
    expect(() => time(text)).toThrow(expect.objectContaining({ code: 'invalidTime', at: text }));
  });

  it.each(['24:00', '25:00', '9:60', '9:30:60'])(
    'throws invalidTime at %j, a part past the end of the clock',
    (text) => {
      expect(() => time(text)).toThrow(expect.objectContaining({ code: 'invalidTime', at: text }));
    },
  );

  it.each(['whenever', '', '2026-11-16'])('throws invalidTime at %j, which names no clock time', (text) => {
    expect(() => time(text)).toThrow(expect.objectContaining({ code: 'invalidTime', at: text }));
  });

  // '1730' reads as 17:30 and '0930' throws, while '0900' throws on Node and Chromium and reads on temporal-polyfill
  it.todo("reads every time written as four digits alike, '0930' as it does '1730'");
});

describe('time() reading numbers and fields', () => {
  it('reads an hour, an hour and minute, and an hour, minute and second', () => {
    expect(time(9).toString()).toBe('09:00:00');
    expect(time(9, 30).toString()).toBe('09:30:00');
    expect(time(17, 30, 15).toString()).toBe('17:30:15');
  });

  it('reads digit strings, such as the values of a form, as numbers', () => {
    expect(time('9', '30').toString()).toBe('09:30:00');
  });

  it('reads one digit string as the hour, and three as the hour, minute and second', () => {
    expect(time('9').toString()).toBe('09:00:00');
    expect(time('17', '30', '15').toString()).toBe('17:30:15');
  });

  it.each([
    ['time(24)', [24]],
    ['time(-1)', [-1]],
    ['time(9, 60)', [9, 60]],
    ['time(9, 30, 60)', [9, 30, 60]],
  ])('throws invalidTime for %s, a number the clock does not have', (_, parts) => {
    expect(() => time(...parts)).toThrow(expect.objectContaining({ code: 'invalidTime' }));
  });

  it.each([
    ['time(9.5)', [9.5]],
    ['time(9, 30.5)', [9, 30.5]],
  ])('throws invalidTime for %s, which is not a whole number', (_, parts) => {
    expect(() => time(...parts)).toThrow(expect.objectContaining({ code: 'invalidTime' }));
  });

  it('throws at NaN rather than reading it as midnight', () => {
    expect(() => time(NaN)).toThrow(expect.objectContaining({ at: expect.stringContaining('NaN') }));
  });

  it('reads a fields object, counting any field left out as zero', () => {
    expect(time({ hour: 9, minute: 30, millisecond: 250 }).toString()).toBe('09:30:00.250');
    expect(time({ hour: 17 }).toString()).toBe('17:00:00');
  });

  it('reads plural field names as it reads singular ones', () => {
    expect(time({ hours: 9, minutes: 30 }).toString()).toBe('09:30:00');
  });

  it.each([{ hour: 25 }, { hour: 9, minute: 75 }, { hour: -1 }])(
    'throws invalidTime for the fields %j, which the clock does not have',
    (fields) => {
      expect(() => time(fields)).toThrow(expect.objectContaining({ code: 'invalidTime' }));
    },
  );

  it.each([{}, { year: 2026, month: 11, day: 16 }])(
    'throws invalidTime for %j, which holds no clock field',
    (fields) => {
      expect(() => time(fields)).toThrow(expect.objectContaining({ code: 'invalidTime' }));
    },
  );

  it('throws unknownUnit at the key for a field name it does not know', () => {
    expect(() => time({ hour: 9, minuet: 30 })).toThrow(expect.objectContaining({ code: 'unknownUnit', at: 'minuet' }));
  });

  it.todo('throws invalidTime for a fractional field such as { hour: 9.5 }, as time(9.5) does');

  // an empty form field or a null column reads as 0 today, so { hour: '' } and { hour: null } are midnight
  it.todo('throws invalidTime for a field that is null, true or an empty string, instead of reading it as 0 or 1');

  it('reads the same inputs through new Time() as through time()', () => {
    expect(new Time('5:30pm').toString()).toBe('17:30:00');
    expect(new Time(9, 30).toString()).toBe('09:30:00');
  });
});

describe('time() reading the clock of a moment', () => {
  afterEach(() => {
    configure({ zone: null });
  });

  it('reads an ISO instant as the clock it shows in the zone asked for', () => {
    expect(time('2026-11-16T17:30:00Z', 'America/New_York').toString()).toBe('12:30:00');
    expect(time('2026-11-16T17:30:00Z', { zone: 'Asia/Tokyo' }).toString()).toBe('02:30:00');
  });

  it('honours both the offset written in the string and the zone asked for', () => {
    expect(time('2026-11-16T17:30:00+02:00', 'Asia/Tokyo').toString()).toBe('00:30:00');
  });

  // i.e. what toString() on a Temporal.ZonedDateTime writes
  it('reads a string that names its zone in brackets in the zone asked for, or in its own when none is', () => {
    const fromTokyo = '2026-11-16T17:30:00+09:00[Asia/Tokyo]';
    expect(time(fromTokyo, 'UTC').toString()).toBe('08:30:00');
    expect(time(fromTokyo).toString()).toBe('17:30:00');
  });

  it('reads an instant in the configured zone when no zone is passed', () => {
    configure({ zone: 'Asia/Tokyo' });
    expect(time('2026-11-16T17:30:00Z').toString()).toBe('02:30:00');
  });

  it('keeps the clock as written when a date and time string names no offset', () => {
    expect(time('2026-11-16T17:30', 'Asia/Tokyo').toString()).toBe('17:30:00');
  });

  it('reads a DateTime as the clock it shows in its own zone', () => {
    expect(time(datetime('2026-11-16T17:30:00Z', 'Europe/Berlin')).toString()).toBe('18:30:00');
  });

  it('reads a DateTime in another zone when one is passed', () => {
    const lateInNewYork = datetime('2026-11-16T23:30', 'America/New_York');
    expect(time(lateInNewYork, 'Asia/Tokyo').toString()).toBe('13:30:00');
  });

  it('reads a JavaScript Date as the clock it shows in the zone asked for', () => {
    const moment = new Date('2026-11-16T17:30:00Z');
    expect(time(moment, 'America/New_York').toString()).toBe('12:30:00');
    expect(time(moment, 'Asia/Kolkata').toString()).toBe('23:00:00');
  });

  it('reads a Temporal.Instant and a Temporal.ZonedDateTime in the zone asked for', () => {
    expect(time(Temporal.Instant.from('2026-11-16T17:30:00Z'), 'Asia/Tokyo').toString()).toBe('02:30:00');
    expect(time(Temporal.ZonedDateTime.from('2026-11-16T08:15[Asia/Tokyo]'), 'UTC').toString()).toBe('23:15:00');
  });

  it('throws unknownZone at the zone for a zone that does not exist', () => {
    expect(() => time('2026-11-16T17:30:00Z', 'Mars/Phobos')).toThrow(
      expect.objectContaining({ code: 'unknownZone', at: 'Mars/Phobos' }),
    );
  });

  it('throws invalidNumber for a Date that holds no valid time', () => {
    expect(() => time(new Date(NaN), 'UTC')).toThrow(expect.objectContaining({ code: 'invalidNumber' }));
  });
});

describe('time() reading a Time or a Temporal value with no zone', () => {
  it('returns an equal time for a Time', () => {
    expect(time(time('5:30pm')).toString()).toBe('17:30:00');
  });

  it('reads a Temporal.PlainTime as it is and a Temporal.PlainDateTime by its clock', () => {
    expect(time(Temporal.PlainTime.from('08:15')).toString()).toBe('08:15:00');
    expect(time(Temporal.PlainDateTime.from('2026-11-16T08:15')).toString()).toBe('08:15:00');
  });

  it('leaves a clock string and a Time as written when a zone is passed beside them', () => {
    expect(time('09:00', 'Asia/Tokyo').toString()).toBe('09:00:00');
    expect(time(time('9am'), 'Asia/Tokyo').toString()).toBe('09:00:00');
  });
});

describe('time() refusing what is not a time', () => {
  it.each([undefined, null])('throws a TypeError with missingTime for %s, never the current time', (nothing) => {
    expect(() => time(nothing)).toThrow(expect.objectContaining({ name: 'TypeError', code: 'missingTime' }));
  });

  it('throws invalidTime at the value for a boolean', () => {
    expect(() => time(true)).toThrow(expect.objectContaining({ code: 'invalidTime', at: 'true' }));
  });

  it('throws invalidTime at the date for a CalendarDate, which has no clock', () => {
    expect(() => time(date('2026-11-16'))).toThrow(expect.objectContaining({ code: 'invalidTime', at: '2026-11-16' }));
  });
});

describe('Time.plus() and Time.minus()', () => {
  it('moves forward and back by a count of a clock unit', () => {
    expect(time('9:00am').plus(90, 'minutes').toString()).toBe('10:30:00');
    expect(time('9:00am').minus(90, 'minutes').toString()).toBe('07:30:00');
  });

  it('wraps past midnight in both directions', () => {
    expect(time('23:00').plus(2, 'hours').toString()).toBe('01:00:00');
    expect(time('00:30').minus(45, 'minutes').toString()).toBe('23:45:00');
  });

  it('lands on the same time after 24 hours and keeps only what is left over of a longer amount', () => {
    expect(time('9am').plus(24, 'hours').toString()).toBe('09:00:00');
    expect(time('9am').plus(49, 'hours').toString()).toBe('10:00:00');
    expect(time('9am').minus(25, 'hours').toString()).toBe('08:00:00');
  });

  it('wraps at the last nanosecond of the day', () => {
    expect(time('23:59:59.999999999').plus(1, 'nanosecond').toString()).toBe('00:00:00');
    expect(time('00:00').minus(1, 'nanosecond').toString()).toBe('23:59:59.999999999');
  });

  it.each([
    ['a phrase', '1h 30m'],
    ['an ISO 8601 duration', 'PT1H30M'],
    ['a fields object', { hours: 1, minutes: 30 }],
    ['a Duration', duration('1h 30m')],
    ['a Temporal.Duration', Temporal.Duration.from({ hours: 1, minutes: 30 })],
    ['a bare number of milliseconds', 5_400_000],
  ])('moves by an hour and a half given as %s', (_, amount) => {
    expect(time('9am').plus(amount).toString()).toBe('10:30:00');
    expect(time('9am').minus(amount).toString()).toBe('07:30:00');
  });

  it('carries the fraction of a count into the smaller unit', () => {
    expect(time('9am').plus(1.5, 'hours').toString()).toBe('10:30:00');
  });

  it('moves the other way for a negative count', () => {
    expect(time('9am').plus(-1, 'hour').toString()).toBe('08:00:00');
    expect(time('9am').minus(-1, 'hour').toString()).toBe('10:00:00');
  });

  it.each(['hour', 'hours', 'h'])('reads the unit name %s as hours', (unit) => {
    expect(time('9am').plus(1, unit).toString()).toBe('10:00:00');
  });

  it('gives the same answers from add() and subtract()', () => {
    expect(time('9am').add(90, 'minutes').toString()).toBe('10:30:00');
    expect(time('9am').subtract(90, 'minutes').toString()).toBe('07:30:00');
  });

  it('returns a new Time and leaves the original as it was', () => {
    const closing = time('23:00');
    const later = closing.plus(2, 'hours');
    expect(later).not.toBe(closing);
    expect(closing.toString()).toBe('23:00:00');
  });

  it.each(['days', 'weeks', 'months', 'years'])(
    'throws unsupportedUnit at %s, which a clock time cannot count',
    (unit) => {
      const refusal = expect.objectContaining({ name: 'RangeError', code: 'unsupportedUnit', at: unit });
      expect(() => time('9am').plus(1, unit)).toThrow(refusal);
      expect(() => time('9am').minus(1, unit)).toThrow(refusal);
    },
  );

  it.each([
    ['a phrase', '1d 2h'],
    ['an ISO 8601 duration', 'P1DT2H'],
    ['a fields object', { days: 1, hours: 2 }],
    ['a Duration', duration('1d 2h')],
  ])('throws unsupportedUnit for days inside %s', (_, amount) => {
    expect(() => time('9am').plus(amount)).toThrow(
      expect.objectContaining({ name: 'RangeError', code: 'unsupportedUnit', at: 'days' }),
    );
  });

  it('throws unknownUnit at the name for a unit it does not know', () => {
    expect(() => time('9am').plus(1, 'fortnight')).toThrow(
      expect.objectContaining({ code: 'unknownUnit', at: 'fortnight' }),
    );
  });

  it('throws invalidDuration when no amount is passed', () => {
    expect(() => time('9am').plus()).toThrow(expect.objectContaining({ code: 'invalidDuration' }));
    expect(() => time('9am').minus()).toThrow(expect.objectContaining({ code: 'invalidDuration' }));
  });

  it('throws invalidDuration for a unit beside an amount that already names its own', () => {
    expect(() => time('9am').plus('1h', 'minutes')).toThrow(expect.objectContaining({ code: 'invalidDuration' }));
  });
});

describe('Time.set()', () => {
  it('replaces one field and keeps the others', () => {
    expect(time('09:30:15.250').set('hour', 17).toString()).toBe('17:30:15.250');
    expect(time('09:30:15').set('minute', 45).toString()).toBe('09:45:15');
  });

  it('replaces several fields from an object', () => {
    expect(time('09:30:15').set({ hour: 17, minute: 0 }).toString()).toBe('17:00:15');
  });

  it('reads plural field names as it reads singular ones', () => {
    expect(time('09:30').set('minutes', 45).toString()).toBe('09:45:00');
    expect(time('09:30').set({ minutes: 45 }).toString()).toBe('09:45:00');
  });

  it('sets fields below the second', () => {
    expect(time('09:30').set('millisecond', 250).toString()).toBe('09:30:00.250');
    expect(time('09:30').set('nanosecond', 250).toString()).toBe('09:30:00.000000250');
  });

  it.each([
    ['minute', 75],
    ['hour', 24],
    ['hour', -1],
    ['second', 60],
  ])('throws cannotSet for %s %d, which the clock does not have', (unit, value) => {
    expect(() => time('09:30').set(unit, value)).toThrow(
      expect.objectContaining({ name: 'RangeError', code: 'cannotSet' }),
    );
  });

  it('throws cannotSet for a value that is not a whole number', () => {
    expect(() => time('09:30').set('minute', 7.5)).toThrow(
      expect.objectContaining({ name: 'RangeError', code: 'cannotSet' }),
    );
  });

  it('throws a RangeError naming the field when asked to set a calendar field', () => {
    expect(() => time('09:30').set('day', 3)).toThrow(
      expect.objectContaining({ name: 'RangeError', at: expect.stringContaining('day') }),
    );
  });

  it('throws unknownUnit at the name for a field it does not know', () => {
    expect(() => time('09:30').set('fortnight', 3)).toThrow(
      expect.objectContaining({ code: 'unknownUnit', at: 'fortnight' }),
    );
  });

  it.todo('throws cannotSet for a value that is null or true, instead of setting 0 or 1');
});

describe('Time.startOf() and Time.endOf()', () => {
  it.each([
    ['hour', '14:00:00'],
    ['minute', '14:37:00'],
    ['second', '14:37:22'],
    ['millisecond', '14:37:22.123'],
    ['microsecond', '14:37:22.123456'],
  ])('zeroes every field smaller than the %s', (unit, expected) => {
    expect(time('14:37:22.123456789').startOf(unit).toString()).toBe(expected);
  });

  it.each([
    ['hour', '14:59:59.999'],
    ['minute', '14:37:59.999'],
    ['second', '14:37:22.999'],
  ])('moves to the last millisecond of the %s', (unit, expected) => {
    expect(time('14:37:22').endOf(unit).toString()).toBe(expected);
  });

  // an end counted in whole milliseconds would fall before the start of a unit smaller than one
  it.each(['millisecond', 'microsecond', 'nanosecond'])(
    "does not put endOf('%s') before startOf of the same unit",
    (unit) => {
      const precise = time('14:37:22.123456789');
      expect(precise.endOf(unit).isBefore(precise.startOf(unit))).toBe(false);
    },
  );

  it.each(['week', 'month'])('throws cannotRound at %s, which a clock time has no start or end of', (unit) => {
    const refusal = expect.objectContaining({ code: 'cannotRound', at: unit });
    expect(() => time('14:37').startOf(unit)).toThrow(refusal);
    expect(() => time('14:37').endOf(unit)).toThrow(refusal);
  });

  it('throws unknownUnit at the name for a unit it does not know', () => {
    expect(() => time('14:37').startOf('fortnight')).toThrow(
      expect.objectContaining({ code: 'unknownUnit', at: 'fortnight' }),
    );
  });
});

describe('Time.round(), Time.floor() and Time.ceil()', () => {
  it('rounds to the nearest whole unit', () => {
    expect(time('14:36').round('hour').toString()).toBe('15:00:00');
    expect(time('09:23').round('hour').toString()).toBe('09:00:00');
    expect(time('14:36:40').round('minute').toString()).toBe('14:37:00');
  });

  it('rounds up from exactly half way', () => {
    expect(time('14:30').round('hour').toString()).toBe('15:00:00');
    expect(time('14:29:59.999').round('hour').toString()).toBe('14:00:00');
  });

  it('rounds to the nearest step of a unit', () => {
    expect(time('14:36').round(15, 'minutes').toString()).toBe('14:30:00');
    expect(time('14:07:30').round(15, 'minutes').toString()).toBe('14:15:00');
    expect(time('14:36').round(2, 'hours').toString()).toBe('14:00:00');
  });

  it('rounds down with floor() and up with ceil()', () => {
    expect(time('14:36').floor('hour').toString()).toBe('14:00:00');
    expect(time('14:36').ceil('hour').toString()).toBe('15:00:00');
    expect(time('14:29').floor(15, 'minutes').toString()).toBe('14:15:00');
    expect(time('14:01').ceil(15, 'minutes').toString()).toBe('14:15:00');
  });

  it('reads a step given as a digit string, such as the value of a select', () => {
    expect(time('14:36').round('15', 'minutes').toString()).toBe('14:30:00');
    expect(time('14:36').floor('30', 'minutes').toString()).toBe('14:30:00');
    expect(time('14:36').ceil('30', 'minutes').toString()).toBe('15:00:00');
  });

  it('leaves a time that already sits on a step where it is', () => {
    expect(time('14:15').round(15, 'minutes').toString()).toBe('14:15:00');
    expect(time('14:15').floor(15, 'minutes').toString()).toBe('14:15:00');
    expect(time('14:15').ceil(15, 'minutes').toString()).toBe('14:15:00');
  });

  it('wraps to midnight when the last hour of the day rounds up', () => {
    expect(time('23:45').round('hour').toString()).toBe('00:00:00');
    expect(time('23:01').ceil('hour').toString()).toBe('00:00:00');
  });

  it.each([
    [7, 'minutes'],
    [5, 'hours'],
  ])('throws cannotRound for a step of %d %s, which does not divide the next unit evenly', (step, unit) => {
    const refusal = expect.objectContaining({ code: 'cannotRound', at: `${step} ${unit}` });
    expect(() => time('14:36').round(step, unit)).toThrow(refusal);
    expect(() => time('14:36').floor(step, unit)).toThrow(refusal);
    expect(() => time('14:36').ceil(step, unit)).toThrow(refusal);
  });

  it('throws cannotRound for a step of zero', () => {
    expect(() => time('14:36').round(0, 'minutes')).toThrow(expect.objectContaining({ code: 'cannotRound' }));
  });

  // round(2.5, 'minutes') rounds to steps of 2 minutes today
  it.todo('throws cannotRound for a step with a fraction, instead of rounding to the whole step below it');

  it('throws cannotRound when asked to round to a calendar unit', () => {
    expect(() => time('14:36').round('week')).toThrow(expect.objectContaining({ code: 'cannotRound' }));
  });

  it('throws unknownUnit at the name for a unit it does not know', () => {
    expect(() => time('14:36').round('fortnight')).toThrow(
      expect.objectContaining({ code: 'unknownUnit', at: 'fortnight' }),
    );
  });
});

describe('Time.equals(), Time.isBefore(), Time.isAfter() and Time.isSame()', () => {
  it('equals the same time of day however the other one is written', () => {
    const closing = time('5:30pm');
    expect(closing.equals('17:30')).toBe(true);
    expect(closing.equals(time(17, 30))).toBe(true);
    expect(closing.equals({ hour: 17, minute: 30 })).toBe(true);
    expect(closing.equals(Temporal.PlainTime.from('17:30'))).toBe(true);
  });

  it('does not equal a time one nanosecond away', () => {
    expect(time('17:30').equals('17:30:00.000000001')).toBe(false);
  });

  it('equals the same time carrying another locale', () => {
    expect(time('17:30', { locale: 'ko-KR' }).equals(time('17:30', { locale: 'de' }))).toBe(true);
  });

  it('orders two times by where they fall between midnight and the end of the day', () => {
    expect(time('9:00am').isBefore('5:00pm')).toBe(true);
    expect(time('9:00am').isAfter('5:00pm')).toBe(false);
    expect(time('5:00pm').isAfter('9:00am')).toBe(true);
    expect(time('5:00pm').isBefore('9:00am')).toBe(false);
  });

  it('counts a time as neither before nor after itself', () => {
    expect(time('9am').isBefore('9am')).toBe(false);
    expect(time('9am').isAfter('9am')).toBe(false);
  });

  it('does not wrap when ordering, so 23:00 is after 01:00', () => {
    expect(time('23:00').isAfter('01:00')).toBe(true);
    expect(time('23:00').isBefore('01:00')).toBe(false);
  });

  it('checks whether two times share a unit with isSame(other, unit)', () => {
    expect(time('9:05am').isSame('9:45am', 'hour')).toBe(true);
    expect(time('9:05am').isSame('10:05am', 'hour')).toBe(false);
    expect(time('9:05am').isSame('9:05:30am', 'minute')).toBe(true);
    expect(time('9:05am').isSame('9:05:30am', 'second')).toBe(false);
  });

  // an alarm set for 9:05 that asks this every minute must not ring at 10:05
  it('does not count the same minute of another hour, or the same second of another minute, as the same', () => {
    expect(time('9:05am').isSame('10:05am', 'minute')).toBe(false);
    expect(time('9:05:30am').isSame('9:06:30am', 'second')).toBe(false);
  });

  it('checks for the exact same time with isSame(other) and no unit', () => {
    expect(time('9:05am').isSame('09:05')).toBe(true);
    expect(time('9:05am').isSame('9:05:30am')).toBe(false);
  });

  it('throws invalidTime at the other value when it cannot be read as a time', () => {
    expect(() => time('9am').isBefore('whenever')).toThrow(
      expect.objectContaining({ code: 'invalidTime', at: 'whenever' }),
    );
  });

  it('sorts with compare()', () => {
    const times = [time('5:30pm'), time('9:00am'), time('12:15pm')];
    expect(times.sort(compare).map(String)).toEqual(['09:00:00', '12:15:00', '17:30:00']);
  });
});

describe('Time with operators and in strings', () => {
  it('throws unsupportedComparison at the time when compared with < or >', () => {
    const refusal = expect.objectContaining({ name: 'RangeError', code: 'unsupportedComparison', at: '09:00:00' });
    expect(() => time('9am') < time('10am')).toThrow(refusal);
    expect(() => time('9am') > time('10am')).toThrow(refusal);
  });

  it('throws unsupportedComparison when turned into a number', () => {
    const refusal = expect.objectContaining({ name: 'RangeError', code: 'unsupportedComparison' });
    expect(() => +time('9am')).toThrow(refusal);
    expect(() => time('10am') - time('9am')).toThrow(refusal);
    expect(() => time('9am').valueOf()).toThrow(refusal);
  });

  // '+' asks for no particular type, which would reach valueOf() and throw if a Time did not answer with its string
  it('becomes its ISO string when joined with + or placed in a template literal', () => {
    expect('Opens at ' + time('9am')).toBe('Opens at 09:00:00');
    expect(`Opens at ${time('9am')}`).toBe('Opens at 09:00:00');
  });
});

describe('Time.until() and Time.since()', () => {
  it('measures the Duration to a later time in hours and smaller units', () => {
    expect(time('9:00am').until('5:30pm').toString()).toBe('PT8H30M');
    expect(time('9:00am').until('10:30:15am').toString()).toBe('PT1H30M15S');
  });

  it('measures the length in one unit as a number when a unit is passed', () => {
    expect(time('9:00am').until('5:30pm', 'hours')).toBe(8.5);
    expect(time('9:00am').until('5:30pm', 'minutes')).toBe(510);
  });

  // measured inside one day from midnight to midnight, a TimeRange is what wraps overnight
  it('returns a negative length for an earlier time instead of wrapping past midnight', () => {
    expect(time('22:00').until('02:00', 'hours')).toBe(-20);
    expect(time('22:00').until('02:00').toString()).toBe('-PT20H');
  });

  it('measures zero to the same time', () => {
    expect(time('9am').until('9am', 'minutes')).toBe(0);
  });

  it('measures since() from the other time to this one', () => {
    expect(time('5:00pm').since('9:00am', 'hours')).toBe(8);
    expect(time('5:00pm').since('9:00am').toString()).toBe('PT8H');
    expect(time('9:00am').since('5:00pm', 'hours')).toBe(-8);
  });

  it('measures to a Time and to a Temporal.PlainTime as it does to a string', () => {
    expect(time('9am').until(time('5pm'), 'hours')).toBe(8);
    expect(time('9am').until(Temporal.PlainTime.from('17:00'), 'hours')).toBe(8);
  });

  it('throws invalidTime at the other value when it cannot be read as a time', () => {
    expect(() => time('9am').until('whenever')).toThrow(
      expect.objectContaining({ code: 'invalidTime', at: 'whenever' }),
    );
  });

  it('throws unknownUnit at the name for a unit it does not know', () => {
    expect(() => time('9am').until('5pm', 'fortnight')).toThrow(
      expect.objectContaining({ code: 'unknownUnit', at: 'fortnight' }),
    );
  });
});

describe('Time.on()', () => {
  afterEach(() => {
    configure({ zone: null });
  });

  it('places the time on a date in the zone asked for', () => {
    const opening = time('9:30am').on('2026-11-16', 'America/New_York');
    expect(opening.toString()).toBe('2026-11-16T14:30:00.000Z');
    expect(opening.zone).toBe('America/New_York');
    expect(time('9:30am').on('2026-11-16', 'Asia/Tokyo').toString()).toBe('2026-11-16T00:30:00.000Z');
  });

  it('takes the date as a CalendarDate or a fields object as it does a string', () => {
    const opens = time('9:30am');
    expect(opens.on('2026-11-16', 'UTC').toString()).toBe('2026-11-16T09:30:00.000Z');
    expect(opens.on(date('2026-11-16'), 'UTC').toString()).toBe('2026-11-16T09:30:00.000Z');
    expect(opens.on({ year: 2026, month: 11, day: 16 }, 'UTC').toString()).toBe('2026-11-16T09:30:00.000Z');
  });

  // wherever the tests run, one of these two moments falls on another day there than in its own zone
  it('takes the day a DateTime shows in its own zone', () => {
    const tokyoMorning = datetime('2026-11-17T07:00', 'Asia/Tokyo');
    const losAngelesEvening = datetime('2026-11-15T19:00', 'America/Los_Angeles');
    expect(time('9:30am').on(tokyoMorning, 'Asia/Tokyo').toString()).toBe('2026-11-17T00:30:00.000Z');
    expect(time('9:30am').on(losAngelesEvening, 'America/Los_Angeles').toString()).toBe('2026-11-15T17:30:00.000Z');
  });

  it('gives the same moment as date.at(time, zone)', () => {
    const viaTime = time('9:30am').on('2026-11-16', 'Europe/Berlin');
    const viaDate = date('2026-11-16').at('9:30am', 'Europe/Berlin');
    expect(viaTime.equals(viaDate)).toBe(true);
  });

  it('uses the configured zone when no zone is passed', () => {
    configure({ zone: 'Asia/Tokyo' });
    const opening = time('9:30am').on('2026-11-16');
    expect(opening.zone).toBe('Asia/Tokyo');
    expect(opening.toString()).toBe('2026-11-16T00:30:00.000Z');
  });

  it('keeps the time down to the nanosecond', () => {
    const precise = time('17:30:15.123456789');
    expect(precise.on('2026-11-16', 'UTC').time.equals(precise)).toBe(true);
  });

  // i.e. 22:00 UTC on the 16th is already the 17th in Tokyo, so 9:30am there falls on the 17th
  it.todo('reads the day of a JavaScript Date or an ISO instant in the zone the time is placed in');

  it('throws invalidDate at the date for a day that does not exist', () => {
    expect(() => time('9:30am').on('2026-02-30', 'UTC')).toThrow(
      expect.objectContaining({ code: 'invalidDate', at: '2026-02-30' }),
    );
  });

  it('throws missingDate when no date is passed', () => {
    expect(() => time('9:30am').on()).toThrow(expect.objectContaining({ code: 'missingDate' }));
  });

  it('throws unknownZone at the zone for a zone that does not exist', () => {
    expect(() => time('9:30am').on('2026-11-16', 'Mars/Phobos')).toThrow(
      expect.objectContaining({ code: 'unknownZone', at: 'Mars/Phobos' }),
    );
  });
});

describe('Time.locale() across the values a Time gives back', () => {
  it('reads back the locale passed to time() or set with locale() and lang()', () => {
    expect(time('5:30pm').locale()).toBeUndefined();
    expect(time('5:30pm', { locale: 'ko-KR' }).locale()).toBe('ko-KR');
    expect(time('5:30pm').locale('ko-KR').locale()).toBe('ko-KR');
    expect(time('5:30pm').lang('ko-KR').lang()).toBe('ko-KR');
  });

  it.each([
    ['plus()', (closing) => closing.plus(1, 'hour')],
    ['minus()', (closing) => closing.minus(1, 'hour')],
    ['set()', (closing) => closing.set('minute', 0)],
    ['startOf()', (closing) => closing.startOf('hour')],
    ['endOf()', (closing) => closing.endOf('hour')],
    ['round()', (closing) => closing.round('hour')],
    ['floor()', (closing) => closing.floor('hour')],
    ['ceil()', (closing) => closing.ceil('hour')],
    ['until()', (closing) => closing.until('11pm')],
    ['since()', (closing) => closing.since('9am')],
    ['on()', (closing) => closing.on('2026-05-01', 'Asia/Seoul')],
  ])('keeps its locale on the value %s returns', (_, derive) => {
    expect(derive(time('5:30pm', { locale: 'ko-KR' })).locale()).toBe('ko-KR');
  });

  it('keeps its own locale when the other time carries a different one', () => {
    const closing = time('5:30pm', { locale: 'ko-KR' });
    const opening = time('9am', { locale: 'de' });
    expect(closing.until(opening).locale()).toBe('ko-KR');
    expect(closing.since(opening).locale()).toBe('ko-KR');
  });

  it('throws unknownLocale at the tag for a locale that is not one', () => {
    expect(() => time('5:30pm', { locale: 'not a locale' })).toThrow(
      expect.objectContaining({ code: 'unknownLocale', at: 'not a locale' }),
    );
  });
});

describe('Time.toString(), Time.toJSON(), Time.toTemporal() and Time.as()', () => {
  it('prints the 24-hour ISO time with seconds', () => {
    expect(time('5:30pm').toString()).toBe('17:30:00');
    expect(time('12am').toString()).toBe('00:00:00');
  });

  it.each([
    ['17:30:15.25', '17:30:15.250'],
    ['17:30:15.2505', '17:30:15.250500'],
    ['17:30:15.000000001', '17:30:15.000000001'],
  ])('prints the fraction of %s in groups of three digits, as %s', (text, expected) => {
    expect(time(text).toString()).toBe(expected);
  });

  it('serializes to the same string in JSON, whatever locale it carries', () => {
    expect(time('5:30pm').toJSON()).toBe('17:30:00');
    expect(JSON.stringify({ opens: time('9am') })).toBe('{"opens":"09:00:00"}');
    expect(JSON.stringify({ opens: time('9am', { locale: 'ko-KR' }) })).toBe('{"opens":"09:00:00"}');
  });

  it.each(['00:00', '09:30', '17:30:15', '17:30:15.250', '23:59:59.999999999'])(
    'reads its own string for %s back as an equal time',
    (text) => {
      const original = time(text);
      expect(time(original.toString()).equals(original)).toBe(true);
      expect(time(JSON.parse(JSON.stringify(original))).equals(original)).toBe(true);
    },
  );

  it('returns a Temporal.PlainTime of the same time from toTemporal()', () => {
    const plain = time('17:30:15.250').toTemporal();
    expect(plain).toBeInstanceOf(Temporal.PlainTime);
    expect(plain.equals(Temporal.PlainTime.from('17:30:15.250'))).toBe(true);
  });

  it("returns itself from as('time')", () => {
    const opens = time('9am');
    expect(opens.as('time')).toBe(opens);
  });

  it.each(['date', 'datetime'])('throws unknownKind at %s, a kind a clock time cannot become', (kind) => {
    expect(() => time('9am').as(kind)).toThrow(
      expect.objectContaining({ name: 'RangeError', code: 'unknownKind', at: kind }),
    );
  });
});
