import {
  compare,
  date,
  datetime,
  days,
  Duration,
  duration,
  hours,
  milliseconds,
  minutes,
  months,
  seconds,
  weeks,
  yearMonth,
  years,
} from 'native-dates';
import { describe, expect, it } from 'vitest';

describe('duration()', () => {
  it.each([
    ['1h 30m', 'PT1H30M'],
    ['1h30m', 'PT1H30M'],
    ['1 hour 30 minutes', 'PT1H30M'],
    ['1 hour, 30 minutes', 'PT1H30M'],
    ['1 Hour 30 Minutes', 'PT1H30M'],
    ['2 weeks and 3 days', 'P2W3D'],
    ['2 weeks, 3 days', 'P2W3D'],
    ['2 hrs', 'PT2H'],
    ['45 mins', 'PT45M'],
    ['30 sec', 'PT30S'],
    ['250 ms', 'PT0.25S'],
    ['3 wks', 'P3W'],
    ['6 mo', 'P6M'],
    ['2 yrs', 'P2Y'],
  ])('parses duration phrase %j as %s', (phrase, iso) => {
    expect(duration(phrase).toString()).toBe(iso);
  });

  it.each([
    ['1w 2d 3h 4m', 'P1W2DT3H4M'],
    ['1y 6mo', 'P1Y6M'],
    ['30 secs', 'PT30S'],
    ['1 wk', 'P1W'],
    ['1 yr', 'P1Y'],
    ['6 mos', 'P6M'],
  ])('parses compact shorthand %j as %s', (phrase, iso) => {
    expect(duration(phrase).toString()).toBe(iso);
  });

  it('trims surrounding whitespace on duration phrases and ISO 8601 strings', () => {
    expect(duration(' 1h 30m ').toString()).toBe('PT1H30M');
    expect(duration('PT1H30M\n').toString()).toBe('PT1H30M');
  });

  it('spills fractional values in a phrase into the next smaller unit', () => {
    expect(duration('1.5h').toFields()).toEqual({ hours: 1, minutes: 30 });
  });

  it('applies a leading minus sign to every unit in a phrase', () => {
    expect(duration('-15m').toFields()).toEqual({ minutes: -15 });
    expect(duration('-1h 30m').toFields()).toEqual({ hours: -1, minutes: -30 });
  });

  it.each([
    ['PT1H30M', { hours: 1, minutes: 30 }],
    ['P2W3D', { weeks: 2, days: 3 }],
    ['PT90M', { minutes: 90 }],
    ['PT1.5H', { hours: 1, minutes: 30 }],
    ['-PT2H', { hours: -2 }],
  ])('parses ISO 8601 duration %s', (iso, fields) => {
    expect(duration(iso).toFields()).toEqual(fields);
  });

  it('parses M in an ISO 8601 string as months before T and minutes after T', () => {
    expect(duration('P1M').toFields()).toEqual({ months: 1 });
    expect(duration('PT1M').toFields()).toEqual({ minutes: 1 });
  });

  it('preserves the input unit without balancing 90 minutes into hours', () => {
    const ninety = duration(90, 'minutes');
    expect(ninety.minutes).toBe(90);
    expect(ninety.hours).toBe(0);
  });

  it.each(['hour', 'hours', 'h', 'hr', 'Hours'])('accepts unit alias %j with a numeric count', (unit) => {
    expect(duration(2, unit).toString()).toBe('PT2H');
  });

  // uppercase 'M' is months while lowercase 'm' is minutes, matching Moment and Day.js
  it.each([
    ['y', 'P2Y'],
    ['M', 'P2M'],
    ['w', 'P2W'],
    ['d', 'P2D'],
    ['h', 'PT2H'],
    ['m', 'PT2M'],
    ['s', 'PT2S'],
    ['ms', 'PT0.002S'],
  ])('parses single-unit abbreviation %j as %s', (unit, iso) => {
    expect(duration(2, unit).toString()).toBe(iso);
  });

  it('parses a numeric string count when a unit is provided', () => {
    expect(duration('90', 'minutes').toString()).toBe('PT90M');
  });

  it('spills a fractional numeric count into the next smaller unit', () => {
    expect(duration(1.5, 'days').toFields()).toEqual({ days: 1, hours: 12 });
  });

  it('accepts a fields object with plural or singular unit keys', () => {
    expect(duration({ hours: 1, minutes: 30 }).toString()).toBe('PT1H30M');
    expect(duration({ hour: 1, minute: 30 }).toString()).toBe('PT1H30M');
  });

  it('interprets a bare number or unitless numeric string as milliseconds', () => {
    expect(duration(1500).toFields()).toEqual({ milliseconds: 1500 });
    expect(duration('1500').toFields()).toEqual({ milliseconds: 1500 });
  });

  // two performance.now() readings three hours into a session differ by 113.46000000089407
  it('rounds a millisecond count with sub-nanosecond precision to the nearest nanosecond', () => {
    expect(duration(1000 / 3).toFields()).toEqual({ milliseconds: 333, microseconds: 333, nanoseconds: 333 });
    expect(duration(1000 / 60).toFields()).toEqual({ milliseconds: 16, microseconds: 666, nanoseconds: 667 });
    expect(duration(10800113.46 - 10800000).toFields()).toEqual({ milliseconds: 113, microseconds: 460 });
    expect(milliseconds(100).times(1 / 3).toString()).toBe('PT0.033333333S');
  });

  it('returns an existing Duration instance unchanged when no options are passed', () => {
    const shift = hours(8);
    expect(duration(shift)).toBe(shift);
  });

  it('wraps a Temporal.Duration instance', () => {
    const temporal = Temporal.Duration.from({ hours: 2, minutes: 30 });
    expect(duration(temporal).toFields()).toEqual({ hours: 2, minutes: 30 });
  });

  it('applies the locale option to a new or wrapped Duration', () => {
    expect(duration('2h', { locale: 'de' }).text).toContain('Stunden');
    expect(duration(hours(2), { locale: 'fr' }).text).toContain('heures');
  });

  it.each([[null], [undefined], [true], [[]]])('throws TypeError with invalidDuration for %j', (input) => {
    expect(() => duration(input)).toThrowError(expect.objectContaining({ name: 'TypeError', code: 'invalidDuration' }));
  });

  // colon-separated strings like '1:30' are ambiguous between HH:MM and MM:SS
  it.each(['', 'soon', '1:30', 'P1X'])('throws invalidDuration for invalid string %j', (text) => {
    expect(() => duration(text)).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'invalidDuration', at: text }),
    );
  });

  it('throws invalidDuration when a unit count overflows Temporal.Duration bounds', () => {
    expect(() => duration(1e20, 'hours')).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'invalidDuration' }),
    );
  });

  it('throws unknownUnit for an unrecognized unit argument, phrase token, or object key', () => {
    expect(() => duration(5, 'fortnights')).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'unknownUnit', at: 'fortnights' }),
    );
    expect(() => duration('1 fortnight')).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'unknownUnit', at: 'fortnight' }),
    );
    expect(() => duration({ minuts: 30 })).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'unknownUnit', at: 'minuts' }),
    );
  });

  it.each([[NaN], [Infinity], [-Infinity]])('throws invalidNumber for non-finite count %s', (count) => {
    expect(() => duration(count, 'hours')).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'invalidNumber' }),
    );
  });

  it('throws invalidNumber when a fields object property is undefined or null', () => {
    expect(() => duration({ hours: 1, minutes: undefined })).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'invalidNumber' }),
    );
    expect(() => duration({ hours: null })).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'invalidNumber' }),
    );
  });

  it('throws conflictingSigns when a phrase or fields object mixes positive and negative units', () => {
    expect(() => duration('1h -30m')).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'conflictingSigns', at: '1h -30m' }),
    );
    expect(() => duration({ hours: 1, minutes: -30 })).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'conflictingSigns' }),
    );
  });

  it('throws invalidFraction for fractional months or fractional nanoseconds', () => {
    expect(() => duration(1.5, 'months')).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'invalidFraction', at: '1.5 month' }),
    );
    expect(() => duration(0.5, 'nanoseconds')).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'invalidFraction', at: '0.5 nanosecond' }),
    );
  });

  it.each([
    ['a phrase', '2h'],
    ['a fields object', { hours: 2 }],
    ['a Duration', hours(2)],
    ['a Temporal.Duration', Temporal.Duration.from({ hours: 2 })],
  ])('throws invalidDuration when a unit argument is passed alongside %s', (_, input) => {
    expect(() => duration(input, 'minutes')).toThrowError(
      expect.objectContaining({ name: 'TypeError', code: 'invalidDuration' }),
    );
  });
});

describe('new Duration()', () => {
  it('accepts the same input forms as duration()', () => {
    expect(new Duration('1h 30m').toString()).toBe('PT1H30M');
    expect(new Duration(90, 'minutes').toString()).toBe('PT90M');
    expect(new Duration({ hours: 1, minutes: 30 }).toString()).toBe('PT1H30M');
  });
});

describe('Duration unit factories (years() through milliseconds())', () => {
  it.each([
    ['years', years],
    ['months', months],
    ['weeks', weeks],
    ['days', days],
    ['hours', hours],
    ['minutes', minutes],
    ['seconds', seconds],
    ['milliseconds', milliseconds],
  ])('sets only the %s field in %s()', (name, factory) => {
    expect(factory(2).toFields()).toEqual({ [name]: 2 });
  });

  it.each([
    ['years', 1.5, years, { years: 1, months: 6 }],
    ['weeks', 1.5, weeks, { weeks: 1, days: 3, hours: 12 }],
    ['days', 1.5, days, { days: 1, hours: 12 }],
    ['hours', 1.5, hours, { hours: 1, minutes: 30 }],
    ['minutes', 1.5, minutes, { minutes: 1, seconds: 30 }],
    ['seconds', 1.5, seconds, { seconds: 1, milliseconds: 500 }],
    ['milliseconds', 1.5, milliseconds, { milliseconds: 1, microseconds: 500 }],
  ])('spills fractional %s(%s) into smaller units', (_, count, factory, fields) => {
    expect(factory(count).toFields()).toEqual(fields);
  });

  // IEEE-754 0.1 * 60 = 6.000000000000001 must not leave trailing nanoseconds
  it.each([
    ['hours', 0.1, hours, { minutes: 6 }],
    ['hours', 1.1, hours, { hours: 1, minutes: 6 }],
    ['days', 0.1, days, { hours: 2, minutes: 24 }],
    ['seconds', 0.1, seconds, { milliseconds: 100 }],
  ])('spills decimal fraction %s(%s) without floating-point residue', (_, count, factory, fields) => {
    expect(factory(count).toFields()).toEqual(fields);
  });

  // subtracting a large integer leaves IEEE-754 residue (e.g. 495000.3 - 495000 = 0.29999999998835847)
  it('spills decimal fractions of large counts without floating-point residue', () => {
    expect(duration(16396.1).toFields()).toEqual({ milliseconds: 16396, microseconds: 100 });
    expect(seconds(8219.3).toFields()).toEqual({ seconds: 8219, milliseconds: 300 });
    expect(minutes(525600.1).toFields()).toEqual({ minutes: 525600, seconds: 6 });
    expect(hours(1000000.1).toFields()).toEqual({ hours: 1000000, minutes: 6 });
    expect(hours(495000.3 - 495000).toString()).toBe('PT18M');
  });

  it('rounds a repeating fraction of a second at the nanosecond', () => {
    expect(seconds(1 / 3).toFields()).toEqual({ milliseconds: 333, microseconds: 333, nanoseconds: 333 });
  });

  it('preserves 9 decimal places of a remainder across positive and negative counts', () => {
    expect(seconds(1795075200.123456).microseconds).toBe(456);
    expect(hours(-123456.123456789).equals(hours(123456.123456789).negated())).toBe(true);
    expect(hours(-12345.1234567891).equals(hours(12345.1234567891).negated())).toBe(true);
  });

  // months cannot spill, so sub-nanosecond float residue around an integer must not throw invalidFraction
  it('treats a month count within 9 decimal places of an integer as whole', () => {
    expect(months(1 + 1e-10).toString()).toBe('P1M');
    expect(months(9.000000000000005).toString()).toBe('P9M');
  });

  it('creates a negative duration from a negative count', () => {
    expect(hours(-2).toString()).toBe('-PT2H');
    expect(hours(-1.5).toFields()).toEqual({ hours: -1, minutes: -30 });
  });

  it('parses a numeric string count', () => {
    expect(hours('2').toString()).toBe('PT2H');
    expect(days('1.5').toString()).toBe('P1DT12H');
  });

  it('parses signed and whitespace-padded numeric strings', () => {
    expect(hours('-2').toString()).toBe('-PT2H');
    expect(hours(' 2 ').toString()).toBe('PT2H');
  });

  it('throws invalidFraction when fractional months or years produce a non-integer month count', () => {
    expect(() => months(1.5)).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'invalidFraction', at: '1.5 month' }),
    );
    expect(() => years(1.3)).toThrowError(expect.objectContaining({ name: 'RangeError', code: 'invalidFraction' }));
  });

  // Number(null) is 0, so null and undefined must throw rather than coerce to zero
  it.each([[null], [undefined]])('throws TypeError with invalidDuration for %j', (count) => {
    expect(() => hours(count)).toThrowError(expect.objectContaining({ name: 'TypeError', code: 'invalidDuration' }));
  });

  // Number('') and Number(' ') evaluate to 0 in JS and must be rejected
  it.each(['', ' ', 'abc', '1,5'])('throws invalidDuration for non-numeric string %j', (text) => {
    expect(() => hours(text)).toThrowError(expect.objectContaining({ code: 'invalidDuration' }));
  });

  it.each([[NaN], [Infinity]])('throws invalidNumber for non-finite count %s', (count) => {
    expect(() => hours(count)).toThrowError(expect.objectContaining({ name: 'RangeError', code: 'invalidNumber' }));
  });
});

describe('Duration unit getters, sign, and toFields()', () => {
  it('exposes each unit count on its corresponding getter', () => {
    const allUnits = duration('P1Y2M3W4DT5H6M7.008009010S');
    expect([
      allUnits.years,
      allUnits.months,
      allUnits.weeks,
      allUnits.days,
      allUnits.hours,
      allUnits.minutes,
      allUnits.seconds,
      allUnits.milliseconds,
      allUnits.microseconds,
      allUnits.nanoseconds,
    ]).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  });

  it('returns negative unit counts on a negative duration', () => {
    const late = duration('-1h 30m');
    expect(late.hours).toBe(-1);
    expect(late.minutes).toBe(-30);
  });

  it('returns 1, 0, or -1 from sign', () => {
    expect(hours(2).sign).toBe(1);
    expect(duration(0).sign).toBe(0);
    expect(hours(-2).sign).toBe(-1);
  });

  it('returns true from isNegative() only for negative durations', () => {
    expect(hours(-2).isNegative()).toBe(true);
    expect(hours(2).isNegative()).toBe(false);
    expect(duration(0).isNegative()).toBe(false);
  });

  it('returns true from isZero() only when every unit is zero', () => {
    expect(duration(0).isZero()).toBe(true);
    expect(hours(1).minus(hours(1)).isZero()).toBe(true);
    expect(milliseconds(1).isZero()).toBe(false);
  });

  it('returns non-zero fields with plural keys from toFields()', () => {
    expect(duration('1h 30m').toFields()).toEqual({ hours: 1, minutes: 30 });
    expect(duration(0).toFields()).toEqual({});
  });

  it('returns undefined for anchor on an unanchored Duration', () => {
    expect(hours(2).anchor).toBeUndefined();
  });
});

describe('Duration plus() and minus()', () => {
  it.each([
    ['a count and unit', [30, 'minutes']],
    ['a numeric string and unit', ['30', 'minutes']],
    ['a phrase', ['30m']],
    ['an ISO string', ['PT30M']],
    ['a fields object', [{ minutes: 30 }]],
    ['a Duration', [minutes(30)]],
    ['a Temporal.Duration', [Temporal.Duration.from({ minutes: 30 })]],
    ['a bare number of milliseconds', [1800000]],
  ])('adds %s in plus()', (_, other) => {
    expect(hours(2).plus(...other).toString()).toBe('PT2H30M');
  });

  it('subtracts equivalent input forms in minus()', () => {
    expect(hours(2).minus(30, 'minutes').toString()).toBe('PT1H30M');
    expect(hours(2).minus('30m').toString()).toBe('PT1H30M');
    expect(hours(2).minus(minutes(30)).toString()).toBe('PT1H30M');
    expect(hours(2).minus(1800000).toString()).toBe('PT1H30M');
  });

  it('aliases add() and subtract() to plus() and minus()', () => {
    expect(hours(2).add(30, 'minutes').toString()).toBe('PT2H30M');
    expect(hours(2).subtract('30m').toString()).toBe('PT1H30M');
  });

  it('keeps days and hours separate without balancing 24 hours into a day', () => {
    expect(days(1).plus('6h').toString()).toBe('P1DT6H');
    expect(days(1).plus(hours(25)).toString()).toBe('P1DT25H');
  });

  it('borrows 12 months from a year and 7 days from a week during subtraction', () => {
    expect(years(1).minus(months(1)).toString()).toBe('P11M');
    expect(years(2).minus(months(1)).toString()).toBe('P1Y11M');
    expect(weeks(1).minus(days(1)).toString()).toBe('P6D');
  });

  it('borrows between years and months without altering unrelated units', () => {
    expect(duration({ years: 1, weeks: 1 }).minus(months(2)).toString()).toBe('P10M1W');
  });

  it('returns a negative duration when subtracting a larger duration', () => {
    expect(hours(1).minus(minutes(90)).toString()).toBe('-PT30M');
    expect(months(1).minus(years(1)).toString()).toBe('-P11M');
  });

  it('subtracts when adding a negative duration', () => {
    expect(hours(2).plus(minutes(-30)).toString()).toBe('PT1H30M');
  });

  // calendar days are not fixed to 24 hours without an anchor
  it('throws conflictingSigns when unanchored subtraction leaves opposite signs across calendar and clock units', () => {
    expect(() => days(1).minus(hours(1))).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'conflictingSigns' }),
    );
    expect(() => months(1).minus(days(1))).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'conflictingSigns' }),
    );
  });

  it('throws invalidDuration when a unit argument is passed alongside a duration phrase', () => {
    expect(() => hours(2).plus('30m', 'minutes')).toThrowError(
      expect.objectContaining({ name: 'TypeError', code: 'invalidDuration' }),
    );
  });

  it('throws invalidDuration for null or undefined inputs', () => {
    expect(() => hours(2).plus(null)).toThrowError(
      expect.objectContaining({ name: 'TypeError', code: 'invalidDuration' }),
    );
    expect(() => hours(2).minus(undefined)).toThrowError(
      expect.objectContaining({ name: 'TypeError', code: 'invalidDuration' }),
    );
  });

  it('throws unknownUnit for an unrecognized unit', () => {
    expect(() => hours(2).plus(30, 'fortnights')).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'unknownUnit', at: 'fortnights' }),
    );
  });

  it('leaves the original Duration unchanged', () => {
    const two = hours(2);
    two.plus(30, 'minutes');
    two.minus('1h');
    expect(two.toString()).toBe('PT2H');
  });
});

describe('Duration times()', () => {
  it('multiplies every unit by the given factor', () => {
    expect(days(1).times(3).toString()).toBe('P3D');
    expect(duration('1h 30m').times(2).total('minutes')).toBe(180);
  });

  it('spills fractional products into smaller units', () => {
    expect(hours(1).times(1.5).toString()).toBe('PT1H30M');
    expect(duration('1h 30m').times(0.5).toString()).toBe('PT45M');
  });

  it('negates the duration for a negative factor', () => {
    expect(hours(2).times(-1).toString()).toBe('-PT2H');
  });

  it('returns a zero duration for a factor of 0', () => {
    expect(hours(2).times(0).isZero()).toBe(true);
  });

  it('throws invalidFraction when multiplication produces a fractional month', () => {
    expect(() => months(1).times(1.5)).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'invalidFraction' }),
    );
  });

  it('throws invalidNumber for NaN or a missing factor', () => {
    expect(() => hours(2).times(NaN)).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'invalidNumber' }),
    );
    expect(() => hours(2).times()).toThrowError(expect.objectContaining({ name: 'RangeError', code: 'invalidNumber' }));
  });
});

describe('Duration negated() and abs()', () => {
  it('negates the duration in negated()', () => {
    expect(hours(2).negated().toString()).toBe('-PT2H');
    expect(duration('-1h 30m').negated().toString()).toBe('PT1H30M');
  });

  it('converts a negative duration to positive and leaves a positive duration unchanged in abs()', () => {
    expect(duration('-1h 30m').abs().toString()).toBe('PT1H30M');
    expect(hours(2).abs().toString()).toBe('PT2H');
  });
});

describe('Duration balance()', () => {
  it('balances seconds and minutes up into hours', () => {
    expect(minutes(90).balance().toFields()).toEqual({ hours: 1, minutes: 30 });
    expect(seconds(3661).balance().toFields()).toEqual({ hours: 1, minutes: 1, seconds: 1 });
  });

  it('balances months up into years', () => {
    expect(months(18).balance().toFields()).toEqual({ years: 1, months: 6 });
  });

  it("balances months into years when largestUnit is 'year'", () => {
    expect(months(30).balance('year').toString()).toBe('P2Y6M');
  });

  // unanchored balance() stops at hours because calendar days vary across DST
  it('keeps hours and days unbalanced when no largest unit is specified', () => {
    expect(hours(36).balance().toString()).toBe('PT36H');
    expect(days(10).balance().toString()).toBe('P10D');
    expect(duration({ months: 14, days: 40 }).balance().toString()).toBe('P1Y2M40D');
  });

  it("balances hours into 24-hour days when largestUnit is 'day'", () => {
    expect(hours(36).balance('day').toFields()).toEqual({ days: 1, hours: 12 });
  });

  it("balances days into 7-day weeks when largestUnit is 'week'", () => {
    expect(duration('10d').balance('week').toString()).toBe('P1W3D');
  });

  it('caps balancing at the specified largest unit', () => {
    expect(seconds(3661).balance('minute').toFields()).toEqual({ minutes: 61, seconds: 1 });
    expect(years(2).balance('month').toString()).toBe('P24M');
  });

  it('preserves negative sign when balancing a negative duration', () => {
    expect(minutes(-90).balance().toFields()).toEqual({ hours: -1, minutes: -30 });
  });

  it('throws missingAnchor when converting between months and days without an anchor', () => {
    expect(() => months(1).balance('day')).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'missingAnchor' }),
    );
    expect(() => days(40).balance('month')).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'missingAnchor' }),
    );
  });

  it('throws unknownUnit for an unrecognized unit', () => {
    expect(() => hours(36).balance('fortnight')).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'unknownUnit', at: 'fortnight' }),
    );
  });

  it.todo('preserves weeks in unanchored balance() when no largest unit is specified');
});

describe('Duration total() and as()', () => {
  it('returns the total duration in the specified unit', () => {
    expect(duration('7h 30m').total('hours')).toBe(7.5);
    expect(duration('7h 30m').total('minutes')).toBe(450);
    expect(minutes(90).total('hours')).toBe(1.5);
  });

  it('aliases as() to total()', () => {
    expect(duration('7h 30m').as('minutes')).toBe(450);
    expect(hours(36).as('days')).toBe(1.5);
  });

  it('converts unanchored days as 24 hours and weeks as 7 days', () => {
    expect(days(1).total('hours')).toBe(24);
    expect(weeks(2).total('days')).toBe(14);
    expect(days(14).total('weeks')).toBe(2);
  });

  it('converts unanchored years as 12 months', () => {
    expect(months(18).total('years')).toBe(1.5);
    expect(years(2).total('months')).toBe(24);
  });

  it('returns a negative number for a negative duration', () => {
    expect(hours(-90).total('days')).toBe(-3.75);
  });

  it.each(['hour', 'hours', 'h', 'hr'])('accepts unit alias %j', (unit) => {
    expect(duration('1h 30m').total(unit)).toBe(1.5);
  });

  it('throws missingAnchor when totaling months in days or days in months without an anchor', () => {
    expect(() => months(1).total('days')).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'missingAnchor', at: expect.stringContaining('P1M') }),
    );
    expect(() => weeks(8).total('months')).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'missingAnchor' }),
    );
    expect(() => duration({ months: 1, days: 3 }).total('months')).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'missingAnchor' }),
    );
  });

  it('throws unknownUnit for an unrecognized unit', () => {
    expect(() => hours(1).total('fortnights')).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'unknownUnit', at: 'fortnights' }),
    );
  });
});

describe('Duration round()', () => {
  it('rounds to the nearest integer unit and zeroes smaller units', () => {
    expect(duration('1h 20m').round('hour').toString()).toBe('PT1H');
    expect(duration('2h 45m 30s').round('hour').toString()).toBe('PT3H');
    expect(duration('1h 29m 29s').round('minute').toString()).toBe('PT1H29M');
  });

  it('rounds half-way values away from zero', () => {
    expect(minutes(90).round('hour').toString()).toBe('PT2H');
    expect(minutes(-90).round('hour').toString()).toBe('-PT2H');
    expect(duration('1h 29m 30s').round('minute').toString()).toBe('PT1H30M');
  });

  it('rounds unanchored hours into 24-hour days', () => {
    expect(hours(36).round('day').toString()).toBe('P2D');
    expect(hours(35).round('day').toString()).toBe('P1D');
  });

  it('rounds sub-half durations down to a zero duration', () => {
    expect(minutes(29).round('hour').isZero()).toBe(true);
  });

  it('throws unknownUnit for an unrecognized unit', () => {
    expect(() => minutes(90).round('fortnight')).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'unknownUnit', at: 'fortnight' }),
    );
  });
});

describe('Duration equals() and compare()', () => {
  it('returns true from equals() for equivalent durations in different units', () => {
    expect(hours(1).equals(minutes(60))).toBe(true);
    expect(days(1).equals(hours(24))).toBe(true);
    expect(weeks(1).equals(days(7))).toBe(true);
    expect(years(1).equals(months(12))).toBe(true);
  });

  it('returns false from equals() for non-equal durations', () => {
    expect(hours(1).equals(minutes(61))).toBe(false);
    expect(hours(1).equals(hours(-1))).toBe(false);
  });

  it.each([
    ['a phrase', '60m'],
    ['an ISO string', 'PT60M'],
    ['a fields object', { minutes: 60 }],
    ['milliseconds', 3600000],
  ])('coerces %s in equals() and compare()', (_, other) => {
    expect(hours(1).equals(other)).toBe(true);
    expect(hours(1).compare(other)).toBe(0);
  });

  it('returns -1, 0, or 1 from compare() for shorter, equal, or longer durations', () => {
    expect(hours(1).compare(minutes(90))).toBe(-1);
    expect(hours(1).compare(minutes(60))).toBe(0);
    expect(minutes(90).compare(hours(1))).toBe(1);
    expect(years(1).compare(months(13))).toBe(-1);
  });

  it('orders negative durations below positive durations and more negative durations first', () => {
    expect(hours(-1).compare(hours(1))).toBe(-1);
    expect(hours(-2).compare(hours(-1))).toBe(-1);
  });

  it('sorts durations ascending with Duration.prototype.compare() and top-level compare()', () => {
    const durations = [hours(2), minutes(45), minutes(90)];
    expect(durations.toSorted(compare).map(String)).toEqual(['PT45M', 'PT90M', 'PT2H']);
    expect(durations.toSorted((a, b) => a.compare(b)).map(String)).toEqual(['PT45M', 'PT90M', 'PT2H']);
  });

  it('ignores instance locales when comparing durations', () => {
    expect(days(2).locale('de').equals(days(2).locale('fr'))).toBe(true);
  });

  it('considers unanchored durations equal when they have identical calendar and day fields', () => {
    expect(duration('1 month 15 days').equals('P1M15D')).toBe(true);
    expect(duration({ months: 1, days: 15 }).compare(duration('1mo 15d'))).toBe(0);
  });

  it('throws missingAnchor when comparing unanchored months against days', () => {
    expect(() => months(1).equals(days(30))).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'missingAnchor', at: expect.stringContaining('P1M') }),
    );
    expect(() => days(30).compare(months(1))).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'missingAnchor' }),
    );
  });

  it('throws invalidDuration for invalid comparison inputs', () => {
    expect(() => hours(1).equals('soon')).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'invalidDuration', at: 'soon' }),
    );
    expect(() => hours(1).compare(null)).toThrowError(
      expect.objectContaining({ name: 'TypeError', code: 'invalidDuration' }),
    );
  });
});

describe('Duration anchored arithmetic and totals', () => {
  it('records the starting point from until() and since() on anchor', () => {
    expect(String(date('2026-01-15').until('2026-04-15').anchor)).toBe('2026-01-15');
    expect(String(date('2026-03-31').since('2026-01-31').anchor)).toBe('2026-01-31');
  });

  it('totals calendar months in days using the spanned calendar months', () => {
    const span = date('2026-01-15').until('2026-04-15').balance('month');
    expect(span.toString()).toBe('P3M');
    expect(span.total('months')).toBe(3);
    expect(span.total('days')).toBe(90);
    expect(span.total('weeks')).toBeCloseTo(90 / 7);
  });

  it('totals February as 28 days in a common year and 29 days in a leap year', () => {
    expect(date('2026-02-01').until('2026-03-01').total('days')).toBe(28);
    expect(date('2028-02-01').until('2028-03-01').total('days')).toBe(29);
  });

  it('computes a negative duration and negative day total when until() targets an earlier date', () => {
    const back = date('2026-04-01').until('2026-01-01');
    expect(back.toString()).toBe('-P90D');
    expect(back.total('days')).toBe(-90);
    expect(back.balance('month').toString()).toBe('-P3M');
  });

  it('totals a Duration measured between two YearMonth instances in days', () => {
    const span = yearMonth('2026-03').until('2027-06');
    expect(span.toString()).toBe('P1Y3M');
    expect(span.total('days')).toBe(457);
  });

  it('compares an anchored month duration symmetrically against an unanchored day duration', () => {
    const january = date('2026-01-01').until('2026-02-01').balance('month');
    expect(january.compare(days(31))).toBe(0);
    expect(january.equals(days(30))).toBe(false);
    expect(days(31).equals(january)).toBe(true);
  });

  it('balances an anchored month duration into days when no largest unit is specified', () => {
    expect(date('2026-01-01').until('2026-04-01').balance('month').balance().toString()).toBe('P90D');
  });

  it('balances across days, weeks, months, and years using the anchor calendar', () => {
    const span = date('2026-01-01').until('2027-04-05');
    expect(span.toString()).toBe('P459D');
    expect(span.balance('year').toString()).toBe('P1Y3M4D');
    expect(span.balance('month').toString()).toBe('P15M4D');
    expect(span.balance('week').toString()).toBe('P65W4D');
    expect(span.balance('day').toString()).toBe('P459D');
    expect(span.balance('day').balance('year').toString()).toBe('P1Y3M4D');
  });

  it('rounds to whole months using the day count of the target month', () => {
    expect(date('2026-01-01').until('2026-04-10').round('month').toString()).toBe('P3M');
    expect(date('2026-01-01').until('2026-04-20').round('month').toString()).toBe('P4M');
  });

  it('converts anchored months to milliseconds for toMilliseconds() and relational operators', () => {
    const quarter = date('2026-01-01').until('2026-04-01').balance('month');
    expect(quarter.toMilliseconds()).toBe(90 * 24 * 60 * 60 * 1000);
    expect(quarter > days(89)).toBe(true);
    expect(quarter < days(91)).toBe(true);
  });

  it('totals elapsed hours across spring-forward (23h) and fall-back (25h) DST transitions', () => {
    const spring = datetime('2026-03-07T12:00', 'America/New_York').until(
      datetime('2026-03-08T12:00', 'America/New_York'),
    );
    const autumn = datetime('2026-10-31T12:00', 'America/New_York').until(
      datetime('2026-11-01T12:00', 'America/New_York'),
    );
    expect(spring.toString()).toBe('P1D');
    expect(spring.total('hours')).toBe(23);
    expect(autumn.total('hours')).toBe(25);
    expect(days(1).total('hours')).toBe(24);
  });

  it('preserves the anchor when adding an unanchored duration', () => {
    const span = date('2026-01-01').until('2026-04-01').plus(days(1));
    expect(String(span.anchor)).toBe('2026-01-01');
    expect(span.total('days')).toBe(91);
  });

  it('propagates the argument anchor when added to an unanchored duration', () => {
    const span = hours(12).plus(date('2026-01-01').until('2026-04-01'));
    expect(String(span.anchor)).toBe('2026-01-01');
    expect(span.total('days')).toBe(90.5);
  });

  it('preserves the anchor across locale() and round()', () => {
    const span = date('2026-01-01').until('2026-04-10');
    expect(span.locale('fr').total('days')).toBe(99);
    expect(span.round('month').total('days')).toBe(90);
  });

  // String.prototype.anchor is a legacy HTML method and must not be read as a Duration anchor
  it('keeps an unanchored Duration unanchored when adding a string phrase', () => {
    expect(hours(1).plus('2h').anchor).toBeUndefined();
  });

  it('omits the anchor from JSON serialization so a parsed ISO 8601 duration is unanchored', () => {
    const wire = JSON.stringify(date('2026-01-15').until('2026-04-15').balance('month'));
    const restored = duration(JSON.parse(wire));
    expect(restored.toString()).toBe('P3M');
    expect(restored.anchor).toBeUndefined();
    expect(() => restored.total('days')).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'missingAnchor' }),
    );
  });

  it.todo('adjusts or reverses the anchor on abs() and negated() so total("days") matches the measured span');
  it.todo('subtracts clock units across calendar days on an anchored Duration using its anchor');
});

describe('Duration format() and text', () => {
  it.each([
    ['long', '2 hours, 30 minutes'],
    ['short', '2 hr, 30 min'],
    ['narrow', '2h 30m'],
    ['digital', '2:30:00'],
  ])('formats %s style in en-US', (style, formatted) => {
    expect(duration({ hours: 2, minutes: 30 }).format(style, 'en-US')).toBe(formatted);
  });

  it('formats sub-hour durations in digital style as MM:SS', () => {
    expect(seconds(90).format('digital', 'en-US')).toBe('01:30');
    expect(seconds(45).format('digital', 'en-US')).toBe('00:45');
  });

  it('defaults format() to the long style', () => {
    expect(duration('2h 30m', { locale: 'en-US' }).format()).toBe('2 hours, 30 minutes');
  });

  // whitespace between number and unit varies across CLDR versions, so assert unit substring
  it('formats text in the long style using the instance locale', () => {
    expect(duration('2h 30m', { locale: 'en-US' }).text).toBe('2 hours, 30 minutes');
    expect(days(2).locale('de').text).toContain('Tage');
  });

  it('overrides the instance locale when a locale argument is passed to format()', () => {
    expect(days(2).locale('de').format('long', 'fr')).toContain('jours');
    expect(days(2).format('long', 'ar')).toBe('يومان');
  });

  it('balances minutes into hours for display without mutating stored fields', () => {
    const ninety = minutes(90);
    expect(ninety.format('long', 'en-US')).toBe('1 hour, 30 minutes');
    expect(ninety.format('digital', 'en-US')).toBe('1:30:00');
    expect(ninety.toString()).toBe('PT90M');
  });

  it('formats hours, days, and months using their stored unbalanced counts', () => {
    expect(hours(36).format('long', 'en-US')).toBe('36 hours');
    expect(days(10).format('long', 'en-US')).toBe('10 days');
    expect(months(18).format('long', 'en-US')).toBe('18 months');
  });

  it('formats all units from years down to seconds', () => {
    expect(duration('P1Y2M3W4DT5H6M7S').format('long', 'en-US')).toBe(
      '1 year, 2 months, 3 weeks, 4 days, 5 hours, 6 minutes, 7 seconds',
    );
  });

  it('omits sub-second units when the duration is one second or longer', () => {
    expect(seconds(1.5).format('long', 'en-US')).toBe('1 second');
    expect(duration({ hours: 1, milliseconds: 500 }).format('long', 'en-US')).toBe('1 hour');
  });

  it('formats milliseconds when the duration is shorter than one second', () => {
    expect(milliseconds(250).format('long', 'en-US')).toBe('250 milliseconds');
  });

  // Intl.DurationFormat omits zero fields unless seconds is explicitly populated
  it('formats a zero duration as zero seconds', () => {
    expect(duration(0).format('long', 'en-US')).toBe('0 seconds');
    expect(duration(0).format('short', 'en-US')).toBe('0 sec');
    expect(duration(0).format('narrow', 'en-US')).toBe('0s');
    expect(duration(0, { locale: 'en-US' }).text).toBe('0 seconds');
  });

  it('formats a zero duration in digital style as MM:SS like every other sub-hour duration', () => {
    expect(seconds(1).format('digital', 'en-US')).toBe('00:01');
    expect(duration(0).format('digital', 'en-US')).toBe('00:00');
  });

  it('prefixes negative durations with a minus sign', () => {
    expect(hours(-2).format('long', 'en-US')).toBe('-2 hours');
    expect(duration('-1h 30m').format('digital', 'en-US')).toBe('-1:30:00');
  });

  it('round-trips English long, short, and narrow output through duration()', () => {
    const flight = duration('2h 30m');
    expect(duration(flight.format('long', 'en-US')).toString()).toBe('PT2H30M');
    expect(duration(flight.format('short', 'en-US')).toString()).toBe('PT2H30M');
    expect(duration(flight.format('narrow', 'en-US')).toString()).toBe('PT2H30M');
  });

  it('throws unknownFormat for an unrecognized format style or token pattern', () => {
    expect(() => hours(1).format('nope')).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'unknownFormat', at: 'nope' }),
    );
    expect(() => hours(1).format('medium')).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'unknownFormat', at: 'medium' }),
    );
    expect(() => hours(1).format('HH:mm')).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'unknownFormat', at: 'HH:mm' }),
    );
  });
});

describe('Duration locale() and lang()', () => {
  it('returns the configured locale tag or undefined from locale()', () => {
    expect(days(2).locale('de').locale()).toBe('de');
    expect(days(2).locale()).toBeUndefined();
  });

  it('aliases lang() to locale()', () => {
    expect(days(2).lang('fr').text).toContain('jours');
    expect(days(2).locale('de').lang()).toBe('de');
  });

  it('clears the locale tag when passed null or an empty string', () => {
    expect(days(2).locale('de').locale(null).locale()).toBeUndefined();
    expect(days(2).locale('de').locale('').locale()).toBeUndefined();
  });

  it('propagates the locale across plus(), minus(), times(), negated(), abs(), balance(), and round()', () => {
    const german = minutes(90).locale('de');
    expect(german.plus('1h').locale()).toBe('de');
    expect(german.minus('30m').locale()).toBe('de');
    expect(german.times(2).locale()).toBe('de');
    expect(german.negated().locale()).toBe('de');
    expect(german.abs().locale()).toBe('de');
    expect(german.balance().locale()).toBe('de');
    expect(german.round('hour').locale()).toBe('de');
    expect(german.balance().text).toMatch(/Stunde.+Minuten/);
  });
});

describe('Duration serialization, numeric coercion, and toTemporal()', () => {
  it('serializes the ISO 8601 duration with the stored units in toString()', () => {
    expect(duration('1h 30m').toString()).toBe('PT1H30M');
    expect(minutes(90).toString()).toBe('PT90M');
    expect(hours(-2).toString()).toBe('-PT2H');
    expect(duration(0).toString()).toBe('PT0S');
  });

  it('returns the ISO 8601 string from toJSON() and JSON.stringify()', () => {
    const ttl = duration('1h 30m');
    expect(ttl.toJSON()).toBe('PT1H30M');
    expect(JSON.stringify({ ttl })).toBe('{"ttl":"PT1H30M"}');
  });

  it('round-trips ISO 8601 strings through duration() with identical fields', () => {
    const allUnits = duration('P1Y2M3W4DT5H6M7S');
    expect(duration(allUnits.toString()).toFields()).toEqual(allUnits.toFields());
    expect(duration(JSON.parse(JSON.stringify(minutes(90)))).toFields()).toEqual({ minutes: 90 });
  });

  it('coerces to an ISO 8601 string in template literals', () => {
    expect(`${hours(2)}`).toBe('PT2H');
  });

  it('concatenates as an ISO 8601 string with the + operator', () => {
    expect('Took ' + hours(2)).toBe('Took PT2H');
  });

  it('returns the duration in milliseconds from toMilliseconds(), valueOf(), and unary +', () => {
    expect(hours(2).toMilliseconds()).toBe(7200000);
    expect(duration('1h 30m').toMilliseconds()).toBe(5400000);
    expect(hours(2).valueOf()).toBe(7200000);
    expect(+hours(2)).toBe(7200000);
  });

  it('supports relational and arithmetic operators (<, >, -) via numeric coercion', () => {
    expect(hours(2) > minutes(90)).toBe(true);
    expect(hours(1) < minutes(90)).toBe(true);
    expect(hours(1) - minutes(30)).toBe(1800000);
    expect([hours(2), minutes(45), minutes(90)].toSorted((a, b) => a - b).map(String)).toEqual([
      'PT45M',
      'PT90M',
      'PT2H',
    ]);
  });

  it('throws missingAnchor when coercing unanchored months or years to milliseconds', () => {
    expect(() => months(1).toMilliseconds()).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'missingAnchor' }),
    );
    expect(() => +years(1)).toThrowError(expect.objectContaining({ name: 'RangeError', code: 'missingAnchor' }));
    expect(() => months(1) > days(1)).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'missingAnchor' }),
    );
  });

  it('returns the underlying Temporal.Duration from toTemporal()', () => {
    const shift = duration('7h 30m');
    expect(shift.toTemporal()).toBeInstanceOf(Temporal.Duration);
    expect(shift.toTemporal().toString()).toBe('PT7H30M');
    expect(shift.toTemporal()).toBe(shift.toTemporal());
  });
});
