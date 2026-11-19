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
  ])('reads the phrase %j as %s', (phrase, iso) => {
    expect(duration(phrase).toString()).toBe(iso);
  });

  // a time tracker writes '1w 2d 3h 4m', and the short style prints '1 wk' and '1 yr'
  it.each([
    ['1w 2d 3h 4m', 'P1W2DT3H4M'],
    ['1y 6mo', 'P1Y6M'],
    ['30 secs', 'PT30S'],
    ['1 wk', 'P1W'],
    ['1 yr', 'P1Y'],
    ['6 mos', 'P6M'],
  ])('reads the shorthand %j as %s', (phrase, iso) => {
    expect(duration(phrase).toString()).toBe(iso);
  });

  // a length kept in an env file or typed into a form field
  it('reads a phrase or an ISO string with space or a line break around it', () => {
    expect(duration(' 1h 30m ').toString()).toBe('PT1H30M');
    expect(duration('PT1H30M\n').toString()).toBe('PT1H30M');
  });

  it('spills a fractional amount in a phrase into the next smaller unit', () => {
    expect(duration('1.5h').toFields()).toEqual({ hours: 1, minutes: 30 });
  });

  it('applies a leading minus to every unit in the phrase', () => {
    expect(duration('-15m').toFields()).toEqual({ minutes: -15 });
    expect(duration('-1h 30m').toFields()).toEqual({ hours: -1, minutes: -30 });
  });

  it.each([
    ['PT1H30M', { hours: 1, minutes: 30 }],
    ['P2W3D', { weeks: 2, days: 3 }],
    ['PT90M', { minutes: 90 }],
    ['PT1.5H', { hours: 1, minutes: 30 }],
    ['-PT2H', { hours: -2 }],
  ])('reads the ISO 8601 duration %s', (iso, fields) => {
    expect(duration(iso).toFields()).toEqual(fields);
  });

  it('reads M in an ISO string as months before the T and minutes after it', () => {
    expect(duration('P1M').toFields()).toEqual({ months: 1 });
    expect(duration('PT1M').toFields()).toEqual({ minutes: 1 });
  });

  it('keeps a count in the unit it was given, so 90 minutes is not 1 hour 30 minutes', () => {
    const ninety = duration(90, 'minutes');
    expect(ninety.minutes).toBe(90);
    expect(ninety.hours).toBe(0);
  });

  it.each(['hour', 'hours', 'h', 'hr', 'Hours'])('reads %j as the unit beside a count', (unit) => {
    expect(duration(2, unit).toString()).toBe('PT2H');
  });

  // moment.duration(2, 'M') is two months and moment.duration(2, 'm') two minutes
  it.each([
    ['y', 'P2Y'],
    ['M', 'P2M'],
    ['w', 'P2W'],
    ['d', 'P2D'],
    ['h', 'PT2H'],
    ['m', 'PT2M'],
    ['s', 'PT2S'],
    ['ms', 'PT0.002S'],
  ])('reads the letter %j beside a count as Moment and Day.js read it', (unit, iso) => {
    expect(duration(2, unit).toString()).toBe(iso);
  });

  it('reads a numeric string as the count when a unit is given', () => {
    expect(duration('90', 'minutes').toString()).toBe('PT90M');
  });

  it('spills a fractional count into the next smaller unit', () => {
    expect(duration(1.5, 'days').toFields()).toEqual({ days: 1, hours: 12 });
  });

  it('reads a fields object with plural or singular keys', () => {
    expect(duration({ hours: 1, minutes: 30 }).toString()).toBe('PT1H30M');
    expect(duration({ hour: 1, minute: 30 }).toString()).toBe('PT1H30M');
  });

  it('reads a bare number, or a numeric string with no unit, as milliseconds', () => {
    expect(duration(1500).toFields()).toEqual({ milliseconds: 1500 });
    expect(duration('1500').toFields()).toEqual({ milliseconds: 1500 });
  });

  it('returns the same Duration when given one', () => {
    const shift = hours(8);
    expect(duration(shift)).toBe(shift);
  });

  it('wraps a Temporal.Duration', () => {
    const temporal = Temporal.Duration.from({ hours: 2, minutes: 30 });
    expect(duration(temporal).toFields()).toEqual({ hours: 2, minutes: 30 });
  });

  it('carries the locale given in options', () => {
    expect(duration('2h', { locale: 'de' }).text).toContain('Stunden');
    expect(duration(hours(2), { locale: 'fr' }).text).toContain('heures');
  });

  it.each([[null], [undefined], [true], [[]]])('throws invalidDuration as a TypeError for %j', (input) => {
    expect(() => duration(input)).toThrowError(expect.objectContaining({ name: 'TypeError', code: 'invalidDuration' }));
  });

  // '1:30' could be an hour and a half or a minute and a half, so it is refused with the rest
  it.each(['', 'soon', '1:30', 'P1X'])('throws invalidDuration at the text for %j', (text) => {
    expect(() => duration(text)).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'invalidDuration', at: text }),
    );
  });

  it('throws invalidDuration for a count too large for a duration to hold', () => {
    expect(() => duration(1e20, 'hours')).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'invalidDuration' }),
    );
  });

  it('throws unknownUnit at the name of a unit it does not know, as an argument, in a phrase or as a key', () => {
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

  it.each([[NaN], [Infinity], [-Infinity]])('throws invalidNumber for a count of %s', (count) => {
    expect(() => duration(count, 'hours')).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'invalidNumber' }),
    );
  });

  it('throws invalidNumber for a field with no number in it, rather than counting it as zero', () => {
    expect(() => duration({ hours: 1, minutes: undefined })).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'invalidNumber' }),
    );
    expect(() => duration({ hours: null })).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'invalidNumber' }),
    );
  });

  it('throws conflictingSigns when a phrase or a fields object mixes signs', () => {
    expect(() => duration('1h -30m')).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'conflictingSigns', at: '1h -30m' }),
    );
    expect(() => duration({ hours: 1, minutes: -30 })).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'conflictingSigns' }),
    );
  });

  it('throws invalidFraction for part of a month or part of a nanosecond', () => {
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
  ])('throws invalidDuration when a unit is passed beside %s', (_, input) => {
    expect(() => duration(input, 'minutes')).toThrowError(
      expect.objectContaining({ name: 'TypeError', code: 'invalidDuration' }),
    );
  });

  it.todo("reads the capital letters in '2H 15M' as hours and minutes");
  // two performance.now() readings three hours into a session differ by 113.46000000089407
  it.todo('rounds a millisecond count finer than a nanosecond: duration(1000 / 3), duration(10800113.46 - 10800000)');
});

describe('new Duration()', () => {
  it('reads the same inputs as duration()', () => {
    expect(new Duration('1h 30m').toString()).toBe('PT1H30M');
    expect(new Duration(90, 'minutes').toString()).toBe('PT90M');
    expect(new Duration({ hours: 1, minutes: 30 }).toString()).toBe('PT1H30M');
  });
});

describe('unit helpers, years() through milliseconds()', () => {
  it.each([
    ['years', years],
    ['months', months],
    ['weeks', weeks],
    ['days', days],
    ['hours', hours],
    ['minutes', minutes],
    ['seconds', seconds],
    ['milliseconds', milliseconds],
  ])('%s() counts in its own unit and no other', (name, helper) => {
    expect(helper(2).toFields()).toEqual({ [name]: 2 });
  });

  it.each([
    ['years', 1.5, years, { years: 1, months: 6 }],
    ['weeks', 1.5, weeks, { weeks: 1, days: 3, hours: 12 }],
    ['days', 1.5, days, { days: 1, hours: 12 }],
    ['hours', 1.5, hours, { hours: 1, minutes: 30 }],
    ['minutes', 1.5, minutes, { minutes: 1, seconds: 30 }],
    ['seconds', 1.5, seconds, { seconds: 1, milliseconds: 500 }],
    ['milliseconds', 1.5, milliseconds, { milliseconds: 1, microseconds: 500 }],
  ])('%s(%s) spills its fraction into the next smaller unit', (_, count, helper, fields) => {
    expect(helper(count).toFields()).toEqual(fields);
  });

  // 0.1 * 60 is 6.000000000000001 in floating point, which must not leave a stray nanosecond behind
  it.each([
    ['hours', 0.1, hours, { minutes: 6 }],
    ['hours', 1.1, hours, { hours: 1, minutes: 6 }],
    ['days', 0.1, days, { hours: 2, minutes: 24 }],
    ['seconds', 0.1, seconds, { milliseconds: 100 }],
  ])('%s(%s) spills a decimal fraction exactly', (_, count, helper, fields) => {
    expect(helper(count).toFields()).toEqual(fields);
  });

  it.todo('reads a third of an hour as 20 minutes: hours(1 / 3)');
  it.todo('reads a third of a year as 4 months: years(1 / 3)');

  it('counts backwards for a negative number', () => {
    expect(hours(-2).toString()).toBe('-PT2H');
    expect(hours(-1.5).toFields()).toEqual({ hours: -1, minutes: -30 });
  });

  it('reads a numeric string as the count', () => {
    expect(hours('2').toString()).toBe('PT2H');
    expect(days('1.5').toString()).toBe('P1DT12H');
  });

  it('reads a numeric string with a minus sign, or with space around it', () => {
    expect(hours('-2').toString()).toBe('-PT2H');
    expect(hours(' 2 ').toString()).toBe('PT2H');
  });

  it('throws invalidFraction for part of a month, written in months or in years', () => {
    expect(() => months(1.5)).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'invalidFraction', at: '1.5 month' }),
    );
    expect(() => years(1.3)).toThrowError(expect.objectContaining({ name: 'RangeError', code: 'invalidFraction' }));
  });

  // hours(row.estimate) with the column empty must not quietly become a zero length
  it.each([[null], [undefined]])('throws invalidDuration for a count of %j', (count) => {
    expect(() => hours(count)).toThrowError(expect.objectContaining({ name: 'TypeError', code: 'invalidDuration' }));
  });

  // hours(input.value) with the field left empty, or 1,5 typed with a decimal comma, where Number('') is 0
  it.each(['', ' ', 'abc', '1,5'])('throws invalidDuration for the text %j given as a count', (text) => {
    expect(() => hours(text)).toThrowError(expect.objectContaining({ code: 'invalidDuration' }));
  });

  it.each([[NaN], [Infinity]])('throws invalidNumber for a count of %s', (count) => {
    expect(() => hours(count)).toThrowError(expect.objectContaining({ name: 'RangeError', code: 'invalidNumber' }));
  });
});

describe('Duration fields, sign and toFields()', () => {
  it('reads each unit as its own count', () => {
    const every = duration('P1Y2M3W4DT5H6M7.008009010S');
    expect([
      every.years,
      every.months,
      every.weeks,
      every.days,
      every.hours,
      every.minutes,
      every.seconds,
      every.milliseconds,
      every.microseconds,
      every.nanoseconds,
    ]).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  });

  it('reads every unit of a negative length as negative', () => {
    const late = duration('-1h 30m');
    expect(late.hours).toBe(-1);
    expect(late.minutes).toBe(-30);
  });

  it('reports sign as 1, 0 or -1', () => {
    expect(hours(2).sign).toBe(1);
    expect(duration(0).sign).toBe(0);
    expect(hours(-2).sign).toBe(-1);
  });

  it('isNegative() is true only below zero', () => {
    expect(hours(-2).isNegative()).toBe(true);
    expect(hours(2).isNegative()).toBe(false);
    expect(duration(0).isNegative()).toBe(false);
  });

  it('isZero() is true only when every unit is zero', () => {
    expect(duration(0).isZero()).toBe(true);
    expect(hours(1).minus(hours(1)).isZero()).toBe(true);
    expect(milliseconds(1).isZero()).toBe(false);
  });

  it('toFields() lists the units that are not zero, under plural names', () => {
    expect(duration('1h 30m').toFields()).toEqual({ hours: 1, minutes: 30 });
    expect(duration(0).toFields()).toEqual({});
  });

  it('has no anchor when it was not measured between two points', () => {
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
  ])('plus() adds %s', (_, other) => {
    expect(hours(2).plus(...other).toString()).toBe('PT2H30M');
  });

  it('minus() takes the same inputs away', () => {
    expect(hours(2).minus(30, 'minutes').toString()).toBe('PT1H30M');
    expect(hours(2).minus('30m').toString()).toBe('PT1H30M');
    expect(hours(2).minus(minutes(30)).toString()).toBe('PT1H30M');
    expect(hours(2).minus(1800000).toString()).toBe('PT1H30M');
  });

  it('add() and subtract() give what plus() and minus() give', () => {
    expect(hours(2).add(30, 'minutes').toString()).toBe('PT2H30M');
    expect(hours(2).subtract('30m').toString()).toBe('PT1H30M');
  });

  it('keeps days beside hours, never folding 24 hours into a day', () => {
    expect(days(1).plus('6h').toString()).toBe('P1DT6H');
    expect(days(1).plus(hours(25)).toString()).toBe('P1DT25H');
  });

  it('borrows a year as 12 months and a week as 7 days when a subtraction needs to', () => {
    expect(years(1).minus(months(1)).toString()).toBe('P11M');
    expect(years(2).minus(months(1)).toString()).toBe('P1Y11M');
    expect(weeks(1).minus(days(1)).toString()).toBe('P6D');
  });

  it('borrows only between the two units that disagree', () => {
    expect(duration({ years: 1, weeks: 1 }).minus(months(2)).toString()).toBe('P10M1W');
  });

  it('goes negative when more is taken away than was there', () => {
    expect(hours(1).minus(minutes(90)).toString()).toBe('-PT30M');
    expect(months(1).minus(years(1)).toString()).toBe('-P11M');
  });

  it('takes a negative length away when it is added', () => {
    expect(hours(2).plus(minutes(-30)).toString()).toBe('PT1H30M');
  });

  // a day is a calendar day here and not 24 hours, and a month has no fixed count of days
  it('throws conflictingSigns when days and hours, or months and days, are left with opposite signs', () => {
    expect(() => days(1).minus(hours(1))).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'conflictingSigns' }),
    );
    expect(() => months(1).minus(days(1))).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'conflictingSigns' }),
    );
  });

  it('throws invalidDuration when a unit is passed beside a phrase', () => {
    expect(() => hours(2).plus('30m', 'minutes')).toThrowError(
      expect.objectContaining({ name: 'TypeError', code: 'invalidDuration' }),
    );
  });

  it('throws invalidDuration when there is nothing to add', () => {
    expect(() => hours(2).plus(null)).toThrowError(
      expect.objectContaining({ name: 'TypeError', code: 'invalidDuration' }),
    );
    expect(() => hours(2).minus(undefined)).toThrowError(
      expect.objectContaining({ name: 'TypeError', code: 'invalidDuration' }),
    );
  });

  it('throws unknownUnit at the unit name', () => {
    expect(() => hours(2).plus(30, 'fortnights')).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'unknownUnit', at: 'fortnights' }),
    );
  });

  it('leaves the length it was called on unchanged', () => {
    const two = hours(2);
    two.plus(30, 'minutes');
    two.minus('1h');
    expect(two.toString()).toBe('PT2H');
  });
});

describe('Duration times()', () => {
  it('multiplies every unit', () => {
    expect(days(1).times(3).toString()).toBe('P3D');
    expect(duration('1h 30m').times(2).total('minutes')).toBe(180);
  });

  it('spills a fractional result into smaller units', () => {
    expect(hours(1).times(1.5).toString()).toBe('PT1H30M');
    expect(duration('1h 30m').times(0.5).toString()).toBe('PT45M');
  });

  it('turns the length around for a negative factor', () => {
    expect(hours(2).times(-1).toString()).toBe('-PT2H');
  });

  it('gives a zero length for a factor of 0', () => {
    expect(hours(2).times(0).isZero()).toBe(true);
  });

  it('throws invalidFraction when the result is part of a month', () => {
    expect(() => months(1).times(1.5)).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'invalidFraction' }),
    );
  });

  it('throws invalidNumber for NaN or no factor at all', () => {
    expect(() => hours(2).times(NaN)).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'invalidNumber' }),
    );
    expect(() => hours(2).times()).toThrowError(expect.objectContaining({ name: 'RangeError', code: 'invalidNumber' }));
  });
});

describe('Duration negated() and abs()', () => {
  it('negated() turns the length around', () => {
    expect(hours(2).negated().toString()).toBe('-PT2H');
    expect(duration('-1h 30m').negated().toString()).toBe('PT1H30M');
  });

  it('abs() makes a negative length positive and leaves a positive one alone', () => {
    expect(duration('-1h 30m').abs().toString()).toBe('PT1H30M');
    expect(hours(2).abs().toString()).toBe('PT2H');
  });
});

describe('Duration balance()', () => {
  it('carries seconds and minutes up into hours', () => {
    expect(minutes(90).balance().toFields()).toEqual({ hours: 1, minutes: 30 });
    expect(seconds(3661).balance().toFields()).toEqual({ hours: 1, minutes: 1, seconds: 1 });
  });

  it('carries months up into years', () => {
    expect(months(18).balance().toFields()).toEqual({ years: 1, months: 6 });
  });

  it("carries months into years when asked for 'year'", () => {
    expect(months(30).balance('year').toString()).toBe('P2Y6M');
  });

  // a calendar day can be 23 or 25 hours long, so hours only become days when asked
  it('leaves hours as hours and days as days when no unit is named', () => {
    expect(hours(36).balance().toString()).toBe('PT36H');
    expect(days(10).balance().toString()).toBe('P10D');
    expect(duration({ months: 14, days: 40 }).balance().toString()).toBe('P1Y2M40D');
  });

  it("carries hours into 24-hour days when asked for 'day'", () => {
    expect(hours(36).balance('day').toFields()).toEqual({ days: 1, hours: 12 });
  });

  it("carries days into 7-day weeks when asked for 'week'", () => {
    expect(duration('10d').balance('week').toString()).toBe('P1W3D');
  });

  it('carries no higher than the unit asked for', () => {
    expect(seconds(3661).balance('minute').toFields()).toEqual({ minutes: 61, seconds: 1 });
    expect(years(2).balance('month').toString()).toBe('P24M');
  });

  it('keeps a negative length negative', () => {
    expect(minutes(-90).balance().toFields()).toEqual({ hours: -1, minutes: -30 });
  });

  it('throws missingAnchor when months would become days, or days months, with no date to count from', () => {
    expect(() => months(1).balance('day')).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'missingAnchor' }),
    );
    expect(() => days(40).balance('month')).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'missingAnchor' }),
    );
  });

  it('throws unknownUnit at the unit name', () => {
    expect(() => hours(36).balance('fortnight')).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'unknownUnit', at: 'fortnight' }),
    );
  });

  it.todo('leaves weeks as weeks when no unit is named: weeks(2).balance()');
});

describe('Duration total() and as()', () => {
  it('gives the whole length as one number in the unit asked for', () => {
    expect(duration('7h 30m').total('hours')).toBe(7.5);
    expect(duration('7h 30m').total('minutes')).toBe(450);
    expect(minutes(90).total('hours')).toBe(1.5);
  });

  it('as() gives what total() gives', () => {
    expect(duration('7h 30m').as('minutes')).toBe(450);
    expect(hours(36).as('days')).toBe(1.5);
  });

  it('counts a day as 24 hours and a week as 7 days', () => {
    expect(days(1).total('hours')).toBe(24);
    expect(weeks(2).total('days')).toBe(14);
    expect(days(14).total('weeks')).toBe(2);
  });

  it('counts a year as 12 months with no date to count from', () => {
    expect(months(18).total('years')).toBe(1.5);
    expect(years(2).total('months')).toBe(24);
  });

  it('is negative for a negative length', () => {
    expect(hours(-90).total('days')).toBe(-3.75);
  });

  it.each(['hour', 'hours', 'h', 'hr'])('reads %j as the unit', (unit) => {
    expect(duration('1h 30m').total(unit)).toBe(1.5);
  });

  it('throws missingAnchor when months are asked for in days, or days in months', () => {
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

  it('throws unknownUnit at the unit name', () => {
    expect(() => hours(1).total('fortnights')).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'unknownUnit', at: 'fortnights' }),
    );
  });
});

describe('Duration round()', () => {
  it('rounds to the nearest whole unit and drops the smaller ones', () => {
    expect(duration('1h 20m').round('hour').toString()).toBe('PT1H');
    expect(duration('2h 45m 30s').round('hour').toString()).toBe('PT3H');
    expect(duration('1h 29m 29s').round('minute').toString()).toBe('PT1H29M');
  });

  it('rounds a half away from zero', () => {
    expect(minutes(90).round('hour').toString()).toBe('PT2H');
    expect(minutes(-90).round('hour').toString()).toBe('-PT2H');
    expect(duration('1h 29m 30s').round('minute').toString()).toBe('PT1H30M');
  });

  it('rounds hours into days of 24 hours', () => {
    expect(hours(36).round('day').toString()).toBe('P2D');
    expect(hours(35).round('day').toString()).toBe('P1D');
  });

  it('gives a zero length for less than half a unit', () => {
    expect(minutes(29).round('hour').isZero()).toBe(true);
  });

  it('throws unknownUnit at the unit name', () => {
    expect(() => minutes(90).round('fortnight')).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'unknownUnit', at: 'fortnight' }),
    );
  });
});

describe('Duration equals() and compare()', () => {
  it('equals the same length written in other units', () => {
    expect(hours(1).equals(minutes(60))).toBe(true);
    expect(days(1).equals(hours(24))).toBe(true);
    expect(weeks(1).equals(days(7))).toBe(true);
    expect(years(1).equals(months(12))).toBe(true);
  });

  it('does not equal a longer or a shorter length', () => {
    expect(hours(1).equals(minutes(61))).toBe(false);
    expect(hours(1).equals(hours(-1))).toBe(false);
  });

  it.each([
    ['a phrase', '60m'],
    ['an ISO string', 'PT60M'],
    ['a fields object', { minutes: 60 }],
    ['milliseconds', 3600000],
  ])('reads %s to compare against', (_, other) => {
    expect(hours(1).equals(other)).toBe(true);
    expect(hours(1).compare(other)).toBe(0);
  });

  it('compare() gives -1 for shorter, 0 for the same length and 1 for longer', () => {
    expect(hours(1).compare(minutes(90))).toBe(-1);
    expect(hours(1).compare(minutes(60))).toBe(0);
    expect(minutes(90).compare(hours(1))).toBe(1);
    expect(years(1).compare(months(13))).toBe(-1);
  });

  it('orders a negative length below a positive one, and a longer negative below a shorter', () => {
    expect(hours(-1).compare(hours(1))).toBe(-1);
    expect(hours(-2).compare(hours(-1))).toBe(-1);
  });

  it('sorts a list shortest first, by its own compare() or the one the package exports', () => {
    const lengths = [hours(2), minutes(45), minutes(90)];
    expect(lengths.toSorted(compare).map(String)).toEqual(['PT45M', 'PT90M', 'PT2H']);
    expect(lengths.toSorted((a, b) => a.compare(b)).map(String)).toEqual(['PT45M', 'PT90M', 'PT2H']);
  });

  it('pays no attention to the locale either length carries', () => {
    expect(days(2).locale('de').equals(days(2).locale('fr'))).toBe(true);
  });

  it('equals a length written the same way when it mixes months and days, with no date to count from', () => {
    expect(duration('1 month 15 days').equals('P1M15D')).toBe(true);
    expect(duration({ months: 1, days: 15 }).compare(duration('1mo 15d'))).toBe(0);
  });

  it('throws missingAnchor when months are compared with days and neither was measured from a date', () => {
    expect(() => months(1).equals(days(30))).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'missingAnchor', at: expect.stringContaining('P1M') }),
    );
    expect(() => days(30).compare(months(1))).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'missingAnchor' }),
    );
  });

  it('throws invalidDuration when the other length cannot be read', () => {
    expect(() => hours(1).equals('soon')).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'invalidDuration', at: 'soon' }),
    );
    expect(() => hours(1).compare(null)).toThrowError(
      expect.objectContaining({ name: 'TypeError', code: 'invalidDuration' }),
    );
  });

  it.todo("reads a count and unit as plus() does: hours(1).equals(60, 'minutes')");
  // Node 26.1 prints both as 'PT40M', and compare() takes two lengths with one ISO string to be equal
  it.todo('tells 40 minutes and 250 milliseconds apart from 40 minutes on Node');
});

describe('Duration measured by until() or since()', () => {
  it('remembers the point it was measured from as its anchor', () => {
    expect(String(date('2026-01-15').until('2026-04-15').anchor)).toBe('2026-01-15');
    expect(String(date('2026-03-31').since('2026-01-31').anchor)).toBe('2026-01-31');
  });

  it('totals months in days by the months it really crossed', () => {
    const span = date('2026-01-15').until('2026-04-15');
    expect(span.toString()).toBe('P3M');
    expect(span.total('months')).toBe(3);
    expect(span.total('days')).toBe(90);
    expect(span.total('weeks')).toBeCloseTo(90 / 7);
  });

  it('counts February by the year it fell in', () => {
    expect(date('2026-02-01').until('2026-03-01').total('days')).toBe(28);
    expect(date('2028-02-01').until('2028-03-01').total('days')).toBe(29);
  });

  it('counts back from a later date to an earlier one as a negative length', () => {
    const back = date('2026-04-01').until('2026-01-01');
    expect(back.toString()).toBe('-P3M');
    expect(back.total('days')).toBe(-90);
  });

  it('totals a span of whole months measured between two year-months in days', () => {
    const span = yearMonth('2026-03').until('2027-06');
    expect(span.toString()).toBe('P1Y3M');
    expect(span.total('days')).toBe(457);
  });

  it('compares with a length in days, whichever of the two is asked', () => {
    const january = date('2026-01-01').until('2026-02-01');
    expect(january.compare(days(31))).toBe(0);
    expect(january.equals(days(30))).toBe(false);
    expect(days(31).equals(january)).toBe(true);
  });

  it('balances into days when no unit is named', () => {
    expect(date('2026-01-01').until('2026-04-01').balance().toString()).toBe('P90D');
  });

  it('balances between days, weeks, months and years by the calendar it crossed', () => {
    const span = date('2026-01-01').until('2027-04-05');
    expect(span.toString()).toBe('P1Y3M4D');
    expect(span.balance('month').toString()).toBe('P15M4D');
    expect(span.balance('week').toString()).toBe('P65W4D');
    expect(span.balance('day').toString()).toBe('P459D');
    expect(span.balance('day').balance('year').toString()).toBe('P1Y3M4D');
  });

  it('rounds to whole months by the length of the month it ends in', () => {
    expect(date('2026-01-01').until('2026-04-10').round('month').toString()).toBe('P3M');
    expect(date('2026-01-01').until('2026-04-20').round('month').toString()).toBe('P4M');
  });

  it('turns months into milliseconds, so < and > work against a length in days', () => {
    const quarter = date('2026-01-01').until('2026-04-01');
    expect(quarter.toMilliseconds()).toBe(90 * 24 * 60 * 60 * 1000);
    expect(quarter > days(89)).toBe(true);
    expect(quarter < days(91)).toBe(true);
  });

  // clocks in New York go forward on 2026-03-08 and back on 2026-11-01
  it('counts the hours a day really had across a daylight saving change', () => {
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

  it('keeps its anchor when a length is added to it', () => {
    const span = date('2026-01-01').until('2026-04-01').plus(days(1));
    expect(String(span.anchor)).toBe('2026-01-01');
    expect(span.total('days')).toBe(91);
  });

  it('gives its anchor to a bare length it is added to', () => {
    const span = hours(12).plus(date('2026-01-01').until('2026-04-01'));
    expect(String(span.anchor)).toBe('2026-01-01');
    expect(span.total('days')).toBe(90.5);
  });

  it('keeps its anchor when it is given a locale or rounded', () => {
    const span = date('2026-01-01').until('2026-04-10');
    expect(span.locale('fr').total('days')).toBe(99);
    expect(span.round('month').total('days')).toBe(90);
  });

  // String.prototype.anchor exists, so a phrase must not be mistaken for a measured length
  it('leaves a bare length without an anchor when a phrase is added to it', () => {
    expect(hours(1).plus('2h').anchor).toBeUndefined();
  });

  it('does not carry its anchor in its ISO string, so a length read back cannot total months in days', () => {
    const wire = JSON.stringify(date('2026-01-15').until('2026-04-15'));
    const restored = duration(JSON.parse(wire));
    expect(restored.toString()).toBe('P3M');
    expect(restored.anchor).toBeUndefined();
    expect(() => restored.total('days')).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'missingAnchor' }),
    );
  });

  it.todo(
    'abs() and negated() cover the days the length itself did: April 1 back to January 1, then abs(), is 90 days',
  );
  // throws conflictingSigns, and so does a measured year minus a month, which years(1).minus(months(1)) answers
  it.todo('takes hours away from a measured day by the date it was measured from: 1 day 2 hours minus 3 hours is 23');
});

describe('Duration format() and text', () => {
  it.each([
    ['long', '2 hours, 30 minutes'],
    ['short', '2 hr, 30 min'],
    ['narrow', '2h 30m'],
    ['digital', '2:30:00'],
  ])('prints the %s style in en-US', (style, printed) => {
    expect(duration({ hours: 2, minutes: 30 }).format(style, 'en-US')).toBe(printed);
  });

  it('prints the digital style under an hour as minutes and seconds', () => {
    expect(seconds(90).format('digital', 'en-US')).toBe('01:30');
    expect(seconds(45).format('digital', 'en-US')).toBe('00:45');
  });

  it('prints the long style when no style is named', () => {
    expect(duration('2h 30m', { locale: 'en-US' }).format()).toBe('2 hours, 30 minutes');
  });

  // the space between a number and its unit differs by locale and by CLDR release, so only the words are checked
  it('text is the long style in the locale the length carries', () => {
    expect(duration('2h 30m', { locale: 'en-US' }).text).toBe('2 hours, 30 minutes');
    expect(days(2).locale('de').text).toContain('Tage');
  });

  it('prints in the locale passed to the call, over the one the length carries', () => {
    expect(days(2).locale('de').format('long', 'fr')).toContain('jours');
    expect(days(2).format('long', 'ar')).toBe('يومان');
  });

  it('prints seconds and minutes carried up into hours, leaving the length itself as written', () => {
    const ninety = minutes(90);
    expect(ninety.format('long', 'en-US')).toBe('1 hour, 30 minutes');
    expect(ninety.format('digital', 'en-US')).toBe('1:30:00');
    expect(ninety.toString()).toBe('PT90M');
  });

  it('prints hours, days and months in the count they were written in', () => {
    expect(hours(36).format('long', 'en-US')).toBe('36 hours');
    expect(days(10).format('long', 'en-US')).toBe('10 days');
    expect(months(18).format('long', 'en-US')).toBe('18 months');
  });

  it('prints every unit from years to seconds', () => {
    expect(duration('P1Y2M3W4DT5H6M7S').format('long', 'en-US')).toBe(
      '1 year, 2 months, 3 weeks, 4 days, 5 hours, 6 minutes, 7 seconds',
    );
  });

  it('leaves out what is below a second once the length reaches a second', () => {
    expect(seconds(1.5).format('long', 'en-US')).toBe('1 second');
    expect(duration({ hours: 1, milliseconds: 500 }).format('long', 'en-US')).toBe('1 hour');
  });

  it('prints milliseconds for a length under a second', () => {
    expect(milliseconds(250).format('long', 'en-US')).toBe('250 milliseconds');
  });

  // Intl.DurationFormat prints an empty string for a length with nothing in it
  it('prints a zero length as zero seconds', () => {
    expect(duration(0).format('long', 'en-US')).toBe('0 seconds');
    expect(duration(0).format('short', 'en-US')).toBe('0 sec');
    expect(duration(0).format('narrow', 'en-US')).toBe('0s');
    expect(duration(0, { locale: 'en-US' }).text).toBe('0 seconds');
  });

  it('prints a negative length with a minus sign', () => {
    expect(hours(-2).format('long', 'en-US')).toBe('-2 hours');
    expect(duration('-1h 30m').format('digital', 'en-US')).toBe('-1:30:00');
  });

  it('reads back what the long, short and narrow styles print in English', () => {
    const flight = duration('2h 30m');
    expect(duration(flight.format('long', 'en-US')).toString()).toBe('PT2H30M');
    expect(duration(flight.format('short', 'en-US')).toString()).toBe('PT2H30M');
    expect(duration(flight.format('narrow', 'en-US')).toString()).toBe('PT2H30M');
  });

  it('throws unknownFormat at a style that is not one of its four', () => {
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

  it.todo("prints a zero length in the digital style in the shape one second has: '00:00' beside '00:01'");
});

describe('Duration locale() and lang()', () => {
  it('locale() reads the tag the length carries, and undefined when it carries none', () => {
    expect(days(2).locale('de').locale()).toBe('de');
    expect(days(2).locale()).toBeUndefined();
  });

  it('lang() gives what locale() gives', () => {
    expect(days(2).lang('fr').text).toContain('jours');
    expect(days(2).locale('de').lang()).toBe('de');
  });

  it('clears the tag for null or an empty string', () => {
    expect(days(2).locale('de').locale(null).locale()).toBeUndefined();
    expect(days(2).locale('de').locale('').locale()).toBeUndefined();
  });

  it('keeps the locale on what plus(), minus(), times(), negated(), abs(), balance() and round() return', () => {
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

describe('Duration toString(), toJSON(), valueOf() and toTemporal()', () => {
  it('toString() is the ISO 8601 duration, in the units as written', () => {
    expect(duration('1h 30m').toString()).toBe('PT1H30M');
    expect(minutes(90).toString()).toBe('PT90M');
    expect(hours(-2).toString()).toBe('-PT2H');
    expect(duration(0).toString()).toBe('PT0S');
  });

  it('toJSON() and JSON.stringify() give the same ISO string', () => {
    const ttl = duration('1h 30m');
    expect(ttl.toJSON()).toBe('PT1H30M');
    expect(JSON.stringify({ ttl })).toBe('{"ttl":"PT1H30M"}');
  });

  it('reads its own ISO string back into the same fields', () => {
    const every = duration('P1Y2M3W4DT5H6M7S');
    expect(duration(every.toString()).toFields()).toEqual(every.toFields());
    expect(duration(JSON.parse(JSON.stringify(minutes(90)))).toFields()).toEqual({ minutes: 90 });
  });

  it('is its ISO string in a template literal', () => {
    expect(`${hours(2)}`).toBe('PT2H');
  });

  it('is its ISO string when joined to a string with +, as every other kind of value is', () => {
    expect('Took ' + hours(2)).toBe('Took PT2H');
  });

  it('toMilliseconds(), valueOf() and a unary + give the length in milliseconds', () => {
    expect(hours(2).toMilliseconds()).toBe(7200000);
    expect(duration('1h 30m').toMilliseconds()).toBe(5400000);
    expect(hours(2).valueOf()).toBe(7200000);
    expect(+hours(2)).toBe(7200000);
  });

  it('works with <, > and -, so lengths can be compared and sorted as numbers', () => {
    expect(hours(2) > minutes(90)).toBe(true);
    expect(hours(1) < minutes(90)).toBe(true);
    expect(hours(1) - minutes(30)).toBe(1800000);
    expect([hours(2), minutes(45), minutes(90)].toSorted((a, b) => a - b).map(String)).toEqual([
      'PT45M',
      'PT90M',
      'PT2H',
    ]);
  });

  it('throws missingAnchor when months or years with no date to count from are turned into a number', () => {
    expect(() => months(1).toMilliseconds()).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'missingAnchor' }),
    );
    expect(() => +years(1)).toThrowError(expect.objectContaining({ name: 'RangeError', code: 'missingAnchor' }));
    expect(() => months(1) > days(1)).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'missingAnchor' }),
    );
  });

  it('toTemporal() gives the Temporal.Duration it holds', () => {
    const shift = duration('7h 30m');
    expect(shift.toTemporal()).toBeInstanceOf(Temporal.Duration);
    expect(shift.toTemporal().toString()).toBe('PT7H30M');
    expect(shift.toTemporal()).toBe(shift.toTemporal());
  });
});
