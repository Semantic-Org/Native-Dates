import { compare, configure, date, datetime, duration, Time, time } from 'native-dates';
import { afterEach, describe, expect, it } from 'vitest';

describe('time() string parsing', () => {
  it.each([
    ['9am', '09:00:00'],
    ['5:30pm', '17:30:00'],
    ['9:30:15am', '09:30:15'],
    ['11:59:59.999pm', '23:59:59.999'],
  ])('parses 12-hour time %s as %s', (text, expected) => {
    expect(time(text).toString()).toBe(expected);
  });

  it('parses 12am as 00:00:00 and 12pm as 12:00:00', () => {
    expect(time('12am').toString()).toBe('00:00:00');
    expect(time('12:30am').toString()).toBe('00:30:00');
    expect(time('12pm').toString()).toBe('12:00:00');
    expect(time('12:30pm').toString()).toBe('12:30:00');
  });

  it.each(['5:15 PM', '5:15PM', '5:15 p.m.', '5:15 P.M.', ' 5:15pm '])(
    'parses %j as 17:15:00 across am/pm casing, periods, and whitespace',
    (text) => {
      expect(time(text).toString()).toBe('17:15:00');
    },
  );

  // narrow no-break space (U+202F) is emitted before AM/PM by Intl/CLDR formatters
  it.each([
    ['a narrow no-break space', '5:15 PM'],
    ['a no-break space', '5:15 PM'],
  ])('parses 12-hour strings containing %s before PM', (_, text) => {
    expect(time(text).toString()).toBe('17:15:00');
  });

  it.each([
    ['09:00', '09:00:00'],
    ['17:30', '17:30:00'],
    ['17:30:15', '17:30:15'],
    ['17:30:15.250', '17:30:15.250'],
    ['00:00', '00:00:00'],
  ])('parses 24-hour time %s as %s', (text, expected) => {
    expect(time(text).toString()).toBe(expected);
  });

  it('parses single-digit 24-hour strings without a leading zero', () => {
    expect(time('9:30').toString()).toBe('09:30:00');
  });

  it('parses fractional seconds down to nanosecond precision', () => {
    expect(time('17:30:15.123456789')).toMatchObject({
      hour: 17,
      minute: 30,
      second: 15,
      millisecond: 123,
      microsecond: 456,
      nanosecond: 789,
    });
  });

  it.each(['0am', '13pm', '00:30am'])('throws invalidTime for out-of-range 12-hour input %j', (text) => {
    expect(() => time(text)).toThrow(expect.objectContaining({ code: 'invalidTime', at: text }));
  });

  it.each(['24:00', '25:00', '9:60', '9:30:60'])(
    'throws invalidTime for out-of-range clock values in %j',
    (text) => {
      expect(() => time(text)).toThrow(expect.objectContaining({ code: 'invalidTime', at: text }));
    },
  );

  it.each(['whenever', '', '2026-11-16'])('throws invalidTime for non-time string %j', (text) => {
    expect(() => time(text)).toThrow(expect.objectContaining({ code: 'invalidTime', at: text }));
  });
});

describe('time() numbers and field objects', () => {
  it('parses numeric (hour), (hour, minute), and (hour, minute, second) arguments', () => {
    expect(time(9).toString()).toBe('09:00:00');
    expect(time(9, 30).toString()).toBe('09:30:00');
    expect(time(17, 30, 15).toString()).toBe('17:30:15');
  });

  it('parses numeric string arguments for hour and minute', () => {
    expect(time('9', '30').toString()).toBe('09:30:00');
  });

  it('parses 1 or 3 numeric string arguments for hour, minute, and second', () => {
    expect(time('9').toString()).toBe('09:00:00');
    expect(time('17', '30', '15').toString()).toBe('17:30:15');
  });

  it.each([
    ['time(24)', [24]],
    ['time(-1)', [-1]],
    ['time(9, 60)', [9, 60]],
    ['time(9, 30, 60)', [9, 30, 60]],
  ])('throws invalidTime for out-of-range clock values in %s', (_, parts) => {
    expect(() => time(...parts)).toThrow(expect.objectContaining({ code: 'invalidTime' }));
  });

  it.each([
    ['time(9.5)', [9.5]],
    ['time(9, 30.5)', [9, 30.5]],
  ])('throws invalidTime for fractional numeric input %s', (_, parts) => {
    expect(() => time(...parts)).toThrow(expect.objectContaining({ code: 'invalidTime' }));
  });

  it('throws invalidTime for NaN', () => {
    expect(() => time(NaN)).toThrow(
      expect.objectContaining({ name: 'RangeError', code: 'invalidTime', at: expect.stringContaining('NaN') }),
    );
  });

  it('parses a fields object and defaults omitted clock units to 0', () => {
    expect(time({ hour: 9, minute: 30, millisecond: 250 }).toString()).toBe('09:30:00.250');
    expect(time({ hour: 17 }).toString()).toBe('17:00:00');
  });

  it('accepts plural field keys in a fields object', () => {
    expect(time({ hours: 9, minutes: 30 }).toString()).toBe('09:30:00');
  });

  it.each([{ hour: 25 }, { hour: 9, minute: 75 }, { hour: -1 }])(
    'throws invalidTime for out-of-range clock values in %j',
    (fields) => {
      expect(() => time(fields)).toThrow(expect.objectContaining({ code: 'invalidTime' }));
    },
  );

  it.each([{}, { year: 2026, month: 11, day: 16 }])(
    'throws invalidTime when no clock field is present in %j',
    (fields) => {
      expect(() => time(fields)).toThrow(expect.objectContaining({ code: 'invalidTime' }));
    },
  );

  it('throws unknownUnit for an unrecognized field key', () => {
    expect(() => time({ hour: 9, minuet: 30 })).toThrow(expect.objectContaining({ code: 'unknownUnit', at: 'minuet' }));
  });

  it('constructs identical instances via new Time() and time()', () => {
    expect(new Time('5:30pm').toString()).toBe('17:30:00');
    expect(new Time(9, 30).toString()).toBe('09:30:00');
  });
});

describe('time() from instants and DateTimes', () => {
  afterEach(() => {
    configure({ zone: null });
  });

  it('resolves the wall-clock time of an ISO instant string in the target timezone', () => {
    expect(time('2026-11-16T17:30:00Z', 'America/New_York').toString()).toBe('12:30:00');
    expect(time('2026-11-16T17:30:00Z', { zone: 'Asia/Tokyo' }).toString()).toBe('02:30:00');
    expect(time('2026-11-16t17:30:00z', 'America/New_York').toString()).toBe('12:30:00');
    expect(time('2026-11-16t17:30:00z', 'Asia/Tokyo').toString()).toBe('02:30:00');
  });

  it('applies both the input UTC offset and the target timezone', () => {
    expect(time('2026-11-16T17:30:00+02:00', 'Asia/Tokyo').toString()).toBe('00:30:00');
  });

  it('resolves Temporal.ZonedDateTime strings in the target timezone or their bracketed timezone', () => {
    const fromTokyo = '2026-11-16T17:30:00+09:00[Asia/Tokyo]';
    expect(time(fromTokyo, 'UTC').toString()).toBe('08:30:00');
    expect(time(fromTokyo).toString()).toBe('17:30:00');
  });

  it('uses the configured default timezone for instants when no timezone is passed', () => {
    configure({ zone: 'Asia/Tokyo' });
    expect(time('2026-11-16T17:30:00Z').toString()).toBe('02:30:00');
  });

  it('preserves the wall-clock time of an offset-free date-time string regardless of timezone', () => {
    expect(time('2026-11-16T17:30', 'Asia/Tokyo').toString()).toBe('17:30:00');
  });

  it('extracts the wall-clock time of a DateTime in its own timezone', () => {
    expect(time(datetime('2026-11-16T17:30:00Z', 'Europe/Berlin')).toString()).toBe('18:30:00');
  });

  it('converts a DateTime to the target timezone before extracting its wall-clock time', () => {
    const lateInNewYork = datetime('2026-11-16T23:30', 'America/New_York');
    expect(time(lateInNewYork, 'Asia/Tokyo').toString()).toBe('13:30:00');
  });

  it('resolves the wall-clock time of a Date instance in the target timezone', () => {
    const jsDate = new Date('2026-11-16T17:30:00Z');
    expect(time(jsDate, 'America/New_York').toString()).toBe('12:30:00');
    expect(time(jsDate, 'Asia/Kolkata').toString()).toBe('23:00:00');
  });

  it('resolves Temporal.Instant and Temporal.ZonedDateTime values in the target timezone', () => {
    expect(time(Temporal.Instant.from('2026-11-16T17:30:00Z'), 'Asia/Tokyo').toString()).toBe('02:30:00');
    expect(time(Temporal.ZonedDateTime.from('2026-11-16T08:15[Asia/Tokyo]'), 'UTC').toString()).toBe('23:15:00');
  });

  it('throws unknownZone for an unrecognized timezone', () => {
    expect(() => time('2026-11-16T17:30:00Z', 'Mars/Phobos')).toThrow(
      expect.objectContaining({ code: 'unknownZone', at: 'Mars/Phobos' }),
    );
  });

  it('throws invalidNumber for an invalid Date instance', () => {
    expect(() => time(new Date(NaN), 'UTC')).toThrow(expect.objectContaining({ code: 'invalidNumber' }));
  });
});

describe('time() from Time and plain Temporal values', () => {
  it('returns an equivalent Time when passed an existing Time', () => {
    expect(time(time('5:30pm')).toString()).toBe('17:30:00');
  });

  it('extracts the wall-clock time from Temporal.PlainTime and Temporal.PlainDateTime', () => {
    expect(time(Temporal.PlainTime.from('08:15')).toString()).toBe('08:15:00');
    expect(time(Temporal.PlainDateTime.from('2026-11-16T08:15')).toString()).toBe('08:15:00');
  });

  it('ignores a timezone argument when passed a wall-clock string or Time instance', () => {
    expect(time('09:00', 'Asia/Tokyo').toString()).toBe('09:00:00');
    expect(time(time('9am'), 'Asia/Tokyo').toString()).toBe('09:00:00');
  });
});

describe('time() validation errors', () => {
  it.each([undefined, null])('throws a TypeError with missingTime for %s', (nothing) => {
    expect(() => time(nothing)).toThrow(expect.objectContaining({ name: 'TypeError', code: 'missingTime' }));
  });

  it('throws a TypeError with invalidTime for a boolean', () => {
    expect(() => time(true)).toThrow(expect.objectContaining({ name: 'TypeError', code: 'invalidTime', at: 'true' }));
  });

  it('throws a TypeError with invalidTime for a CalendarDate', () => {
    expect(() => time(date('2026-11-16'))).toThrow(
      expect.objectContaining({ name: 'TypeError', code: 'invalidTime', at: '2026-11-16' }),
    );
  });
});

describe('Time.plus() and Time.minus()', () => {
  it('adds and subtracts clock units', () => {
    expect(time('9:00am').plus(90, 'minutes').toString()).toBe('10:30:00');
    expect(time('9:00am').minus(90, 'minutes').toString()).toBe('07:30:00');
  });

  it('wraps modulo 24 hours across midnight in both directions', () => {
    expect(time('23:00').plus(2, 'hours').toString()).toBe('01:00:00');
    expect(time('00:30').minus(45, 'minutes').toString()).toBe('23:45:00');
  });

  it('wraps multi-day hour counts modulo 24 hours', () => {
    expect(time('9am').plus(24, 'hours').toString()).toBe('09:00:00');
    expect(time('9am').plus(49, 'hours').toString()).toBe('10:00:00');
    expect(time('9am').minus(25, 'hours').toString()).toBe('08:00:00');
  });

  it('wraps at nanosecond precision across 23:59:59.999999999 and 00:00:00', () => {
    expect(time('23:59:59.999999999').plus(1, 'nanosecond').toString()).toBe('00:00:00');
    expect(time('00:00').minus(1, 'nanosecond').toString()).toBe('23:59:59.999999999');
  });

  it.each([
    ['a phrase', '1h 30m'],
    ['an ISO 8601 duration', 'PT1H30M'],
    ['a fields object', { hours: 1, minutes: 30 }],
    ['a Duration', duration('1h 30m')],
    ['a Temporal.Duration', Temporal.Duration.from({ hours: 1, minutes: 30 })],
    ['milliseconds', 5_400_000],
  ])('accepts a 90-minute duration as %s', (_, amount) => {
    expect(time('9am').plus(amount).toString()).toBe('10:30:00');
    expect(time('9am').minus(amount).toString()).toBe('07:30:00');
  });

  it('converts fractional unit amounts into smaller clock units', () => {
    expect(time('9am').plus(1.5, 'hours').toString()).toBe('10:30:00');
  });

  it('reverses direction for negative amounts', () => {
    expect(time('9am').plus(-1, 'hour').toString()).toBe('08:00:00');
    expect(time('9am').minus(-1, 'hour').toString()).toBe('10:00:00');
  });

  it.each(['hour', 'hours', 'h'])('accepts hour unit alias %s', (unit) => {
    expect(time('9am').plus(1, unit).toString()).toBe('10:00:00');
  });

  it('aliases add() and subtract() to plus() and minus()', () => {
    expect(time('9am').add(90, 'minutes').toString()).toBe('10:30:00');
    expect(time('9am').subtract(90, 'minutes').toString()).toBe('07:30:00');
  });

  it('returns a new Time without mutating the original', () => {
    const closing = time('23:00');
    const later = closing.plus(2, 'hours');
    expect(later).not.toBe(closing);
    expect(closing.toString()).toBe('23:00:00');
  });

  it.each(['days', 'weeks', 'months', 'years'])(
    'throws unsupportedUnit for calendar unit %s',
    (unit) => {
      const errorMatch = expect.objectContaining({ name: 'RangeError', code: 'unsupportedUnit', at: unit });
      expect(() => time('9am').plus(1, unit)).toThrow(errorMatch);
      expect(() => time('9am').minus(1, unit)).toThrow(errorMatch);
    },
  );

  it.each([
    ['a phrase', '1d 2h'],
    ['an ISO 8601 duration', 'P1DT2H'],
    ['a fields object', { days: 1, hours: 2 }],
    ['a Duration', duration('1d 2h')],
  ])('throws unsupportedUnit when days are included in %s', (_, amount) => {
    expect(() => time('9am').plus(amount)).toThrow(
      expect.objectContaining({ name: 'RangeError', code: 'unsupportedUnit', at: 'days' }),
    );
  });

  it('throws unknownUnit for an unrecognized unit', () => {
    expect(() => time('9am').plus(1, 'fortnight')).toThrow(
      expect.objectContaining({ code: 'unknownUnit', at: 'fortnight' }),
    );
  });

  it('throws invalidDuration when the amount is omitted', () => {
    expect(() => time('9am').plus()).toThrow(expect.objectContaining({ code: 'invalidDuration' }));
    expect(() => time('9am').minus()).toThrow(expect.objectContaining({ code: 'invalidDuration' }));
  });

  it('throws invalidDuration when a unit argument is passed alongside a duration string', () => {
    expect(() => time('9am').plus('1h', 'minutes')).toThrow(expect.objectContaining({ code: 'invalidDuration' }));
  });
});

describe('Time.set()', () => {
  it('replaces a single field and preserves other fields', () => {
    expect(time('09:30:15.250').set('hour', 17).toString()).toBe('17:30:15.250');
    expect(time('09:30:15').set('minute', 45).toString()).toBe('09:45:15');
  });

  it('replaces multiple fields from an object', () => {
    expect(time('09:30:15').set({ hour: 17, minute: 0 }).toString()).toBe('17:00:15');
  });

  it('accepts plural field names', () => {
    expect(time('09:30').set('minutes', 45).toString()).toBe('09:45:00');
    expect(time('09:30').set({ minutes: 45 }).toString()).toBe('09:45:00');
  });

  it('sets sub-second millisecond and nanosecond fields', () => {
    expect(time('09:30').set('millisecond', 250).toString()).toBe('09:30:00.250');
    expect(time('09:30').set('nanosecond', 250).toString()).toBe('09:30:00.000000250');
  });

  it.each([
    ['minute', 75],
    ['hour', 24],
    ['hour', -1],
    ['second', 60],
  ])('throws cannotSet for out-of-range clock value %s: %d', (unit, value) => {
    expect(() => time('09:30').set(unit, value)).toThrow(
      expect.objectContaining({ name: 'RangeError', code: 'cannotSet' }),
    );
  });

  it('throws cannotSet for fractional field values', () => {
    expect(() => time('09:30').set('minute', 7.5)).toThrow(
      expect.objectContaining({ name: 'RangeError', code: 'cannotSet' }),
    );
  });

  it('throws cannotSet when passed a calendar field in unit or object form', () => {
    expect(() => time('09:30').set('day', 3)).toThrow(
      expect.objectContaining({ name: 'RangeError', code: 'cannotSet', at: expect.stringContaining('day') }),
    );
    expect(() => time('09:30').set({ hour: 10, day: 5 })).toThrow(
      expect.objectContaining({ name: 'RangeError', code: 'cannotSet', at: expect.stringContaining('day') }),
    );
  });

  it('throws unknownUnit for an unrecognized field key', () => {
    expect(() => time('09:30').set('fortnight', 3)).toThrow(
      expect.objectContaining({ code: 'unknownUnit', at: 'fortnight' }),
    );
  });
});

describe('Time.startOf() and Time.endOf()', () => {
  it.each([
    ['hour', '14:00:00'],
    ['minute', '14:37:00'],
    ['second', '14:37:22'],
    ['millisecond', '14:37:22.123'],
    ['microsecond', '14:37:22.123456'],
  ])('truncates fields smaller than %s in startOf()', (unit, expected) => {
    expect(time('14:37:22.123456789').startOf(unit).toString()).toBe(expected);
  });

  it.each([
    ['hour', '14:59:59.999'],
    ['minute', '14:37:59.999'],
    ['second', '14:37:22.999'],
  ])('advances to the final millisecond of %s in endOf()', (unit, expected) => {
    expect(time('14:37:22').endOf(unit).toString()).toBe(expected);
  });

  // sub-millisecond endOf() must use nanosecond precision so endOf() never precedes startOf()
  it.each(['millisecond', 'microsecond', 'nanosecond'])(
    "keeps endOf('%s') at or after startOf()",
    (unit) => {
      const precise = time('14:37:22.123456789');
      expect(precise.endOf(unit).isBefore(precise.startOf(unit))).toBe(false);
    },
  );

  it.each(['week', 'month'])('throws cannotRound for calendar unit %s', (unit) => {
    const errorMatch = expect.objectContaining({ code: 'cannotRound', at: unit });
    expect(() => time('14:37').startOf(unit)).toThrow(errorMatch);
    expect(() => time('14:37').endOf(unit)).toThrow(errorMatch);
  });

  it('throws unknownUnit for an unrecognized unit', () => {
    expect(() => time('14:37').startOf('fortnight')).toThrow(
      expect.objectContaining({ code: 'unknownUnit', at: 'fortnight' }),
    );
  });
});

describe('Time.startOfNext() and Time.startOfPrevious()', () => {
  const afternoon = time('14:37:22.123456789');

  it.each([
    ['hour', '15:00:00', '13:00:00'],
    ['minute', '14:38:00', '14:36:00'],
    ['second', '14:37:23', '14:37:21'],
    ['millisecond', '14:37:22.124', '14:37:22.122'],
    ['microsecond', '14:37:22.123457', '14:37:22.123455'],
    ['nanosecond', '14:37:22.123456790', '14:37:22.123456788'],
  ])('returns the start of the next and previous %s', (unit, next, previous) => {
    expect(afternoon.startOfNext(unit).toString()).toBe(next);
    expect(afternoon.startOfPrevious(unit).toString()).toBe(previous);
  });

  it('advances or rewinds a full unit when already aligned on the boundary', () => {
    const topOfHour = time('14:00:00');
    expect(topOfHour.startOfNext('hour').toString()).toBe('15:00:00');
    expect(topOfHour.startOfPrevious('hour').toString()).toBe('13:00:00');
  });

  it('wraps around midnight in both directions', () => {
    expect(time('23:37:22').startOfNext('hour').toString()).toBe('00:00:00');
    expect(time('23:37:22').endOf('hour').toString()).toBe('23:59:59.999');
    expect(time('00:15:00').startOfPrevious('hour').toString()).toBe('23:00:00');
  });

  it('returns a new Time without mutating the original', () => {
    expect(afternoon.startOfNext('hour')).not.toBe(afternoon);
    expect(afternoon.startOfPrevious('hour')).not.toBe(afternoon);
    expect(afternoon.toString()).toBe('14:37:22.123456789');
  });

  it.each(['day', 'week', 'month', 'quarter', 'year'])('throws cannotRound for calendar unit %s', (unit) => {
    const errorMatch = expect.objectContaining({ name: 'RangeError', code: 'cannotRound', at: unit });
    expect(() => time('14:37').startOfNext(unit)).toThrow(errorMatch);
    expect(() => time('14:37').startOfPrevious(unit)).toThrow(errorMatch);
  });

  it.each([['fortnight', 'fortnight'], ['wednesday', 'wednesday'], [3, '3'], [undefined, 'undefined']])(
    'throws unknownUnit for %s',
    (target, at) => {
      const errorMatch = expect.objectContaining({ name: 'RangeError', code: 'unknownUnit', at });
      expect(() => time('14:37').startOfNext(target)).toThrow(errorMatch);
      expect(() => time('14:37').startOfPrevious(target)).toThrow(errorMatch);
    },
  );
});

describe('Time.round(), Time.floor(), and Time.ceil()', () => {
  it('rounds to the nearest whole unit', () => {
    expect(time('14:36').round('hour').toString()).toBe('15:00:00');
    expect(time('09:23').round('hour').toString()).toBe('09:00:00');
    expect(time('14:36:40').round('minute').toString()).toBe('14:37:00');
  });

  it('rounds half-way values upward', () => {
    expect(time('14:30').round('hour').toString()).toBe('15:00:00');
    expect(time('14:29:59.999').round('hour').toString()).toBe('14:00:00');
  });

  it('rounds to the nearest step increment of a unit', () => {
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

  it('accepts numeric string step increments', () => {
    expect(time('14:36').round('15', 'minutes').toString()).toBe('14:30:00');
    expect(time('14:36').floor('30', 'minutes').toString()).toBe('14:30:00');
    expect(time('14:36').ceil('30', 'minutes').toString()).toBe('15:00:00');
  });

  it('preserves a Time already aligned to the rounding step', () => {
    expect(time('14:15').round(15, 'minutes').toString()).toBe('14:15:00');
    expect(time('14:15').floor(15, 'minutes').toString()).toBe('14:15:00');
    expect(time('14:15').ceil(15, 'minutes').toString()).toBe('14:15:00');
  });

  it('wraps to 00:00:00 when rounding up past 23:00', () => {
    expect(time('23:45').round('hour').toString()).toBe('00:00:00');
    expect(time('23:01').ceil('hour').toString()).toBe('00:00:00');
  });

  it.each([
    [7, 'minutes'],
    [5, 'hours'],
  ])('throws cannotRound when step %d %s does not evenly divide the next unit', (step, unit) => {
    const errorMatch = expect.objectContaining({ code: 'cannotRound', at: `${step} ${unit}` });
    expect(() => time('14:36').round(step, unit)).toThrow(errorMatch);
    expect(() => time('14:36').floor(step, unit)).toThrow(errorMatch);
    expect(() => time('14:36').ceil(step, unit)).toThrow(errorMatch);
  });

  it('throws cannotRound for a step of 0', () => {
    expect(() => time('14:36').round(0, 'minutes')).toThrow(expect.objectContaining({ code: 'cannotRound' }));
  });

  it('throws cannotRound for a calendar unit', () => {
    expect(() => time('14:36').round('week')).toThrow(expect.objectContaining({ code: 'cannotRound' }));
  });

  it('throws unknownUnit for an unrecognized unit', () => {
    expect(() => time('14:36').round('fortnight')).toThrow(
      expect.objectContaining({ code: 'unknownUnit', at: 'fortnight' }),
    );
  });
});

describe('Time.equals(), Time.isBefore(), Time.isAfter(), and Time.isSame()', () => {
  it('compares against strings, Time instances, field objects, and Temporal.PlainTime values', () => {
    const closing = time('5:30pm');
    expect(closing.equals('17:30')).toBe(true);
    expect(closing.equals(time(17, 30))).toBe(true);
    expect(closing.equals({ hour: 17, minute: 30 })).toBe(true);
    expect(closing.equals(Temporal.PlainTime.from('17:30'))).toBe(true);
  });

  it('distinguishes times separated by 1 nanosecond', () => {
    expect(time('17:30').equals('17:30:00.000000001')).toBe(false);
  });

  it('ignores instance locale when checking equality', () => {
    expect(time('17:30', { locale: 'ko-KR' }).equals(time('17:30', { locale: 'de' }))).toBe(true);
  });

  it('orders earlier and later times within the same day', () => {
    expect(time('9:00am').isBefore('5:00pm')).toBe(true);
    expect(time('9:00am').isAfter('5:00pm')).toBe(false);
    expect(time('5:00pm').isAfter('9:00am')).toBe(true);
    expect(time('5:00pm').isBefore('9:00am')).toBe(false);
  });

  it('returns false from both isBefore() and isAfter() for equal times', () => {
    expect(time('9am').isBefore('9am')).toBe(false);
    expect(time('9am').isAfter('9am')).toBe(false);
  });

  it('orders 23:00 after 01:00 without wrapping across midnight', () => {
    expect(time('23:00').isAfter('01:00')).toBe(true);
    expect(time('23:00').isBefore('01:00')).toBe(false);
  });

  it('compares truncated clock units in isSame(other, unit)', () => {
    expect(time('9:05am').isSame('9:45am', 'hour')).toBe(true);
    expect(time('9:05am').isSame('10:05am', 'hour')).toBe(false);
    expect(time('9:05am').isSame('9:05:30am', 'minute')).toBe(true);
    expect(time('9:05am').isSame('9:05:30am', 'second')).toBe(false);
  });

  it('requires larger clock units to match in isSame(other, unit)', () => {
    expect(time('9:05am').isSame('10:05am', 'minute')).toBe(false);
    expect(time('9:05:30am').isSame('9:06:30am', 'second')).toBe(false);
  });

  it('compares exact times when isSame() is called without a unit', () => {
    expect(time('9:05am').isSame('09:05')).toBe(true);
    expect(time('9:05am').isSame('9:05:30am')).toBe(false);
  });

  it('throws invalidTime when the comparison target cannot be parsed', () => {
    expect(() => time('9am').isBefore('whenever')).toThrow(
      expect.objectContaining({ code: 'invalidTime', at: 'whenever' }),
    );
  });

  it('sorts chronologically with compare()', () => {
    const times = [time('5:30pm'), time('9:00am'), time('12:15pm')];
    expect(times.sort(compare).map(String)).toEqual(['09:00:00', '12:15:00', '17:30:00']);
  });
});

describe('Time operators and string coercion', () => {
  it('throws unsupportedComparison for < and > relational operators', () => {
    const errorMatch = expect.objectContaining({ name: 'RangeError', code: 'unsupportedComparison', at: '09:00:00' });
    expect(() => time('9am') < time('10am')).toThrow(errorMatch);
    expect(() => time('9am') > time('10am')).toThrow(errorMatch);
  });

  it('throws unsupportedComparison for unary +, -, and valueOf()', () => {
    const errorMatch = expect.objectContaining({ name: 'RangeError', code: 'unsupportedComparison' });
    expect(() => +time('9am')).toThrow(errorMatch);
    expect(() => time('10am') - time('9am')).toThrow(errorMatch);
    expect(() => time('9am').valueOf()).toThrow(errorMatch);
  });

  // binary '+' passes hint 'default' to Symbol.toPrimitive, which would call valueOf() and throw without string handling
  it('formats as an ISO time string in binary + concatenation and template literals', () => {
    expect('Opens at ' + time('9am')).toBe('Opens at 09:00:00');
    expect(`Opens at ${time('9am')}`).toBe('Opens at 09:00:00');
  });
});

describe('Time.until() and Time.since()', () => {
  it('returns a Duration to a later time in hours, minutes, and seconds', () => {
    expect(time('9:00am').until('5:30pm').toString()).toBe('PT8H30M');
    expect(time('9:00am').until('10:30:15am').toString()).toBe('PT1H30M15S');
  });

  it('returns a numeric total when a unit is passed', () => {
    expect(time('9:00am').until('5:30pm', 'hours')).toBe(8.5);
    expect(time('9:00am').until('5:30pm', 'minutes')).toBe(510);
  });

  // until() measures within a single 00:00..23:59 day whereas TimeRange wraps overnight
  it('returns a negative span to an earlier time rather than wrapping across midnight', () => {
    expect(time('22:00').until('02:00', 'hours')).toBe(-20);
    expect(time('22:00').until('02:00').toString()).toBe('-PT20H');
  });

  it('returns 0 between identical times', () => {
    expect(time('9am').until('9am', 'minutes')).toBe(0);
  });

  it('computes since() as the inverse span from the other time', () => {
    expect(time('5:00pm').since('9:00am', 'hours')).toBe(8);
    expect(time('5:00pm').since('9:00am').toString()).toBe('PT8H');
    expect(time('9:00am').since('5:00pm', 'hours')).toBe(-8);
  });

  it('accepts Time and Temporal.PlainTime targets', () => {
    expect(time('9am').until(time('5pm'), 'hours')).toBe(8);
    expect(time('9am').until(Temporal.PlainTime.from('17:00'), 'hours')).toBe(8);
  });

  it('throws invalidTime when the target cannot be parsed', () => {
    expect(() => time('9am').until('whenever')).toThrow(
      expect.objectContaining({ code: 'invalidTime', at: 'whenever' }),
    );
  });

  it('throws unknownUnit for an unrecognized unit', () => {
    expect(() => time('9am').until('5pm', 'fortnight')).toThrow(
      expect.objectContaining({ code: 'unknownUnit', at: 'fortnight' }),
    );
  });
});

describe('Time.on()', () => {
  afterEach(() => {
    configure({ zone: null });
  });

  it('combines the time with a calendar date and timezone into a DateTime', () => {
    const opening = time('9:30am').on('2026-11-16', 'America/New_York');
    expect(opening.toString()).toBe('2026-11-16T14:30:00.000Z');
    expect(opening.zone).toBe('America/New_York');
    expect(time('9:30am').on('2026-11-16', 'Asia/Tokyo').toString()).toBe('2026-11-16T00:30:00.000Z');
  });

  it('accepts date strings, CalendarDates, and date field objects', () => {
    const opens = time('9:30am');
    expect(opens.on('2026-11-16', 'UTC').toString()).toBe('2026-11-16T09:30:00.000Z');
    expect(opens.on(date('2026-11-16'), 'UTC').toString()).toBe('2026-11-16T09:30:00.000Z');
    expect(opens.on({ year: 2026, month: 11, day: 16 }, 'UTC').toString()).toBe('2026-11-16T09:30:00.000Z');
  });

  // one of Asia/Tokyo (+09:00) or America/Los_Angeles (-08:00) differs in calendar date from any host timezone
  it('extracts the calendar day of a DateTime in its own timezone', () => {
    const tokyoMorning = datetime('2026-11-17T07:00', 'Asia/Tokyo');
    const losAngelesEvening = datetime('2026-11-15T19:00', 'America/Los_Angeles');
    expect(time('9:30am').on(tokyoMorning, 'Asia/Tokyo').toString()).toBe('2026-11-17T00:30:00.000Z');
    expect(time('9:30am').on(losAngelesEvening, 'America/Los_Angeles').toString()).toBe('2026-11-15T17:30:00.000Z');
  });

  it('produces the same DateTime as date.at(time, zone)', () => {
    const viaTime = time('9:30am').on('2026-11-16', 'Europe/Berlin');
    const viaDate = date('2026-11-16').at('9:30am', 'Europe/Berlin');
    expect(viaTime.equals(viaDate)).toBe(true);
  });

  it('uses the configured default timezone when none is passed', () => {
    configure({ zone: 'Asia/Tokyo' });
    const opening = time('9:30am').on('2026-11-16');
    expect(opening.zone).toBe('Asia/Tokyo');
    expect(opening.toString()).toBe('2026-11-16T00:30:00.000Z');
  });

  it('preserves nanosecond precision on the resulting DateTime', () => {
    const precise = time('17:30:15.123456789');
    expect(precise.on('2026-11-16', 'UTC').time.equals(precise)).toBe(true);
  });

  // 2026-11-17T02:00:00Z is Nov 16 in Los Angeles and Nov 17 in Tokyo, so one differs from any host timezone
  it('resolves the calendar day of a Date, ISO instant, or Temporal.Instant in the target timezone', () => {
    const instant = new Date('2026-11-17T02:00:00Z');
    expect(time('9:30am').on(instant, 'America/Los_Angeles').toString()).toBe('2026-11-16T17:30:00.000Z');
    expect(time('9:30am').on(instant, 'Asia/Tokyo').toString()).toBe('2026-11-17T00:30:00.000Z');
    expect(time('9:30am').on('2026-11-17T02:00:00Z', 'Asia/Tokyo').toString()).toBe('2026-11-17T00:30:00.000Z');
    expect(time('9:30am').on(Temporal.Instant.from('2026-11-17T02:00:00Z'), 'Asia/Tokyo').toString())
      .toBe('2026-11-17T00:30:00.000Z');
  });

  it('throws invalidDate for an out-of-range calendar date', () => {
    expect(() => time('9:30am').on('2026-02-30', 'UTC')).toThrow(
      expect.objectContaining({ code: 'invalidDate', at: '2026-02-30' }),
    );
  });

  it('throws missingDate when the date argument is omitted', () => {
    expect(() => time('9:30am').on()).toThrow(expect.objectContaining({ code: 'missingDate' }));
  });

  it('throws unknownZone for an unrecognized timezone', () => {
    expect(() => time('9:30am').on('2026-11-16', 'Mars/Phobos')).toThrow(
      expect.objectContaining({ code: 'unknownZone', at: 'Mars/Phobos' }),
    );
  });
});

describe('Time.locale() and lang()', () => {
  it('gets and sets the instance locale via time(), locale(), and lang()', () => {
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
  ])('propagates the instance locale through %s', (_, derive) => {
    expect(derive(time('5:30pm', { locale: 'ko-KR' })).locale()).toBe('ko-KR');
  });

  it('preserves the receiver locale in until() and since() when the argument has a different locale', () => {
    const closing = time('5:30pm', { locale: 'ko-KR' });
    const opening = time('9am', { locale: 'de' });
    expect(closing.until(opening).locale()).toBe('ko-KR');
    expect(closing.since(opening).locale()).toBe('ko-KR');
  });

  it('throws unknownLocale for an invalid BCP 47 locale tag', () => {
    expect(() => time('5:30pm', { locale: 'not a locale' })).toThrow(
      expect.objectContaining({ code: 'unknownLocale', at: 'not a locale' }),
    );
  });
});

describe('Time.toString(), Time.toJSON(), Time.toTemporal(), and Time.as()', () => {
  it('formats 24-hour HH:mm:ss in toString()', () => {
    expect(time('5:30pm').toString()).toBe('17:30:00');
    expect(time('12am').toString()).toBe('00:00:00');
  });

  it.each([
    ['17:30:15.25', '17:30:15.250'],
    ['17:30:15.2505', '17:30:15.250500'],
    ['17:30:15.000000001', '17:30:15.000000001'],
  ])('pads fractional seconds of %s to 3, 6, or 9 digits as %s', (text, expected) => {
    expect(time(text).toString()).toBe(expected);
  });

  it('serializes to ISO 24-hour time in toJSON() and JSON.stringify() regardless of locale', () => {
    expect(time('5:30pm').toJSON()).toBe('17:30:00');
    expect(JSON.stringify({ opens: time('9am') })).toBe('{"opens":"09:00:00"}');
    expect(JSON.stringify({ opens: time('9am', { locale: 'ko-KR' }) })).toBe('{"opens":"09:00:00"}');
  });

  it.each(['00:00', '09:30', '17:30:15', '17:30:15.250', '23:59:59.999999999'])(
    'round-trips %s through toString() and JSON serialization',
    (text) => {
      const original = time(text);
      expect(time(original.toString()).equals(original)).toBe(true);
      expect(time(JSON.parse(JSON.stringify(original))).equals(original)).toBe(true);
    },
  );

  it('returns the underlying Temporal.PlainTime from toTemporal()', () => {
    const plain = time('17:30:15.250').toTemporal();
    expect(plain).toBeInstanceOf(Temporal.PlainTime);
    expect(plain.equals(Temporal.PlainTime.from('17:30:15.250'))).toBe(true);
  });

  it("returns the same Time instance from as('time')", () => {
    const opens = time('9am');
    expect(opens.as('time')).toBe(opens);
  });

  it.each(['date', 'datetime'])('throws unknownKind when converting Time via as(%j)', (kind) => {
    expect(() => time('9am').as(kind)).toThrow(
      expect.objectContaining({ name: 'RangeError', code: 'unknownKind', at: kind }),
    );
  });
});

describe("time() string parsing with an 'h' between hours and minutes", () => {
  it.each([
    ['14h30', '14:30:00'],
    ['14 h 30', '14:30:00'],
    ['9h05', '09:05:00'],
    ['14H30', '14:30:00'],
    ['14h30:15', '14:30:15'],
  ])('parses %j as %s', (text, expected) => {
    expect(time(text).toString()).toBe(expected);
  });

  it("parses fr-CA format('short') output '14 h 30' back to the same time", () => {
    const written = time('14:30').format('short', 'fr-CA');
    expect(time(written).toString(), written).toBe('14:30:00');
  });

  it.each(['14h', '8h', 'h30', '14h3', '25h00'])('throws invalidTime for %j', (text) => {
    expect(() => time(text)).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'invalidTime', at: text }),
    );
  });

  it("parses '8h' as a duration rather than eight o'clock in Time.prototype.for()", () => {
    expect(time('22:00').for('8h').toString()).toBe('22:00:00/06:00:00');
  });
});
