import {
  configure,
  date,
  datetime,
  days,
  Duration,
  duration,
  hours,
  IS_DURATION,
  isDuration,
  milliseconds,
  minutes,
  months,
  seconds,
  time,
  weeks,
  yearMonth,
  years,
} from 'native-dates';
import { inspect } from 'node:util';
import { afterEach, describe, expect, it } from 'vitest';

describe('duration()', () => {
  it('reads a phrase of amounts and units, in words or shorthand', () => {
    expect(duration('1h 30m').toString()).toBe('PT1H30M');
    expect(duration('1 hour, 30 minutes').toString()).toBe('PT1H30M');
    expect(duration('2 weeks and 3 days').toString()).toBe('P2W3D');
  });

  it('keeps the fields as written, so 90 minutes stays 90 minutes', () => {
    const film = duration('90 minutes');
    expect(film.minutes).toBe(90);
    expect(film.hours).toBe(0);
  });

  it('reads an ISO 8601 duration', () => {
    expect(duration('PT1H30M').toString()).toBe('PT1H30M');
    expect(duration('P2W3D').toString()).toBe('P2W3D');
    expect(duration('-PT1H').toString()).toBe('-PT1H');
  });

  it('reads a count with a unit, the count as a number or as text', () => {
    expect(duration(90, 'minutes').toString()).toBe('PT90M');
    expect(duration('30', 'days').toString()).toBe('P30D');
  });

  it('reads a unit in singular, plural or shorthand, with M for months and m for minutes', () => {
    expect(duration(2, 'hour').toString()).toBe('PT2H');
    expect(duration(2, 'hours').toString()).toBe('PT2H');
    expect(duration(2, 'h').toString()).toBe('PT2H');
    expect(duration(2, 'M').toString()).toBe('P2M');
    expect(duration(2, 'm').toString()).toBe('PT2M');
    expect(duration(2, 'quarters').toString()).toBe('P6M');
  });

  it('reads a bare number, or digits alone, as milliseconds', () => {
    expect(duration(1500).milliseconds).toBe(1500);
    expect(duration('1500').milliseconds).toBe(1500);
  });

  it('reads a fields object', () => {
    expect(duration({ hours: 1, minutes: 30 }).toString()).toBe('PT1H30M');
  });

  it('reads a Temporal.Duration', () => {
    expect(duration(Temporal.Duration.from('PT2H')).toString()).toBe('PT2H');
  });

  it('returns a Duration it is given, the same instance', () => {
    const shift = hours(8);
    expect(duration(shift)).toBe(shift);
  });

  it('spills a fraction into the next unit down', () => {
    expect(duration(1.5, 'days').toString()).toBe('P1DT12H');
    expect(duration(1.5, 'years').toString()).toBe('P1Y6M');
    expect(duration('1.5h').toString()).toBe('PT1H30M');
    expect(duration({ hours: 1.5 }).toString()).toBe('PT1H30M');
  });

  it('throws invalidFraction for a fraction of a month, which has no fixed unit below it', () => {
    expect(() => duration(1.5, 'months')).toThrowError(
      expect.objectContaining({ code: 'invalidFraction', at: '1.5 month' }),
    );
  });

  it('negates the whole phrase for a leading minus', () => {
    expect(duration('-1h 30m').toString()).toBe('-PT1H30M');
  });

  it('throws conflictingSigns when the amounts point both ways', () => {
    expect(() => duration('1h -30m')).toThrowError(
      expect.objectContaining({ code: 'conflictingSigns', at: '1h -30m' }),
    );
    expect(() => duration({ days: 1, hours: -1 })).toThrowError(
      expect.objectContaining({ code: 'conflictingSigns', at: '{"days":1,"hours":-1}' }),
    );
  });

  it('throws invalidDuration for text that is not a length', () => {
    expect(() => duration('')).toThrowError(expect.objectContaining({ code: 'invalidDuration', at: '' }));
    expect(() => duration('soon')).toThrowError(expect.objectContaining({ code: 'invalidDuration', at: 'soon' }));
    expect(() => duration('P1X')).toThrowError(expect.objectContaining({ code: 'invalidDuration', at: 'P1X' }));
  });

  it('throws unknownUnit for an unrecognized unit', () => {
    expect(() => duration('3 fortnights')).toThrowError(
      expect.objectContaining({ code: 'unknownUnit', at: 'fortnights' }),
    );
    expect(() => duration(3, 'fortnights')).toThrowError(
      expect.objectContaining({ code: 'unknownUnit', at: 'fortnights' }),
    );
  });

  it('throws invalidDuration for a value that is not a number, a string, a fields object or a duration', () => {
    expect(() => duration(null)).toThrowError(expect.objectContaining({ code: 'invalidDuration', at: 'null' }));
    expect(() => duration(true)).toThrowError(expect.objectContaining({ code: 'invalidDuration', at: 'true' }));
  });

  it('throws invalidNumber for an amount that is not finite', () => {
    expect(() => duration(NaN)).toThrowError(
      expect.objectContaining({ code: 'invalidNumber', at: 'NaN millisecond' }),
    );
    expect(() => duration(Infinity, 'hours')).toThrowError(
      expect.objectContaining({ code: 'invalidNumber', at: 'Infinity hour' }),
    );
  });

  it('throws invalidDuration when a unit follows an input that already carries its units', () => {
    expect(() => duration('2h', 'minutes')).toThrowError(
      expect.objectContaining({ code: 'invalidDuration', at: '2h minutes' }),
    );
    expect(() => duration({ hours: 2 }, 'minutes')).toThrowError(
      expect.objectContaining({ code: 'invalidDuration', at: '{"hours":2} minutes' }),
    );
    expect(() => duration(hours(2), 'minutes')).toThrowError(
      expect.objectContaining({ code: 'invalidDuration', at: 'PT2H minutes' }),
    );
    expect(() => duration(Temporal.Duration.from('PT2H'), 'minutes')).toThrowError(
      expect.objectContaining({ code: 'invalidDuration', at: 'PT2H minutes' }),
    );
  });

  it('takes a locale in options, for new input and for a Duration it is given', () => {
    expect(duration('2h', { locale: 'de' }).locale()).toBe('de');
    const german = duration(hours(2), { locale: 'de' });
    expect(german.locale()).toBe('de');
    expect(german.toString()).toBe('PT2H');
  });

  it('throws missingPlugin for { loose: true } when the loose plugin is not imported', () => {
    expect(() => duration('2h', { loose: true })).toThrowError(
      expect.objectContaining({ code: 'missingPlugin', at: 'loose' }),
    );
  });
});

describe('years() through milliseconds()', () => {
  it('makes a duration of one unit from a count', () => {
    expect(years(2).toString()).toBe('P2Y');
    expect(months(18).toString()).toBe('P18M');
    expect(weeks(2).toString()).toBe('P2W');
    expect(days(3).toString()).toBe('P3D');
    expect(hours(2).toString()).toBe('PT2H');
    expect(minutes(90).toString()).toBe('PT90M');
    expect(seconds(45).toString()).toBe('PT45S');
    expect(milliseconds(250).toString()).toBe('PT0.25S');
  });

  it('reads a count written as text', () => {
    expect(hours('2').toString()).toBe('PT2H');
  });

  it('makes a negative duration from a negative count', () => {
    expect(hours(-2).toString()).toBe('-PT2H');
  });

  it('spills a fraction into the next unit down', () => {
    expect(years(1.5).toString()).toBe('P1Y6M');
    expect(weeks(1.5).toString()).toBe('P1W3DT12H');
    expect(days(1.5).toString()).toBe('P1DT12H');
    expect(hours(1.5).toString()).toBe('PT1H30M');
    expect(minutes(1.5).toString()).toBe('PT1M30S');
    expect(seconds(1.5).toFields()).toEqual({ seconds: 1, milliseconds: 500 });
    expect(milliseconds(1.5).toFields()).toEqual({ milliseconds: 1, microseconds: 500 });
  });

  it('throws invalidFraction for a fraction of a month', () => {
    expect(() => months(1.5)).toThrowError(expect.objectContaining({ code: 'invalidFraction', at: '1.5 month' }));
  });

  it('throws invalidDuration for a count that is not a number', () => {
    expect(() => hours('2h')).toThrowError(expect.objectContaining({ code: 'invalidDuration', at: '2h hour' }));
    expect(() => hours()).toThrowError(expect.objectContaining({ code: 'invalidDuration', at: 'undefined' }));
  });
});

describe('isDuration() and instanceof Duration', () => {
  it('accepts an instance created by a factory or the class', () => {
    expect(isDuration(hours(1))).toBe(true);
    expect(isDuration(new Duration('1h 30m'))).toBe(true);
    expect(new Duration(90, 'minutes')).toBeInstanceOf(Duration);
  });

  it('accepts any object carrying the IS_DURATION brand, so two copies of the package agree', () => {
    const fromAnotherCopy = { [IS_DURATION]: true };
    expect(isDuration(fromAnotherCopy)).toBe(true);
    expect(fromAnotherCopy instanceof Duration).toBe(true);
  });

  it('rejects an ISO string, a fields object, a Temporal.Duration and null', () => {
    expect(isDuration('PT1H')).toBe(false);
    expect(isDuration({ hours: 1 })).toBe(false);
    expect(isDuration(Temporal.Duration.from('PT1H'))).toBe(false);
    expect(isDuration(null)).toBe(false);
  });
});

describe('Duration fields, years through nanoseconds, and sign', () => {
  it('holds each field as written', () => {
    const written = duration({
      years: 1,
      months: 2,
      weeks: 3,
      days: 4,
      hours: 5,
      minutes: 6,
      seconds: 7,
      milliseconds: 8,
      microseconds: 9,
      nanoseconds: 10,
    });
    expect(written.years).toBe(1);
    expect(written.months).toBe(2);
    expect(written.weeks).toBe(3);
    expect(written.days).toBe(4);
    expect(written.hours).toBe(5);
    expect(written.minutes).toBe(6);
    expect(written.seconds).toBe(7);
    expect(written.milliseconds).toBe(8);
    expect(written.microseconds).toBe(9);
    expect(written.nanoseconds).toBe(10);
  });

  it('signs every field of a negative duration', () => {
    const overdue = duration('-1h 30m');
    expect(overdue.hours).toBe(-1);
    expect(overdue.minutes).toBe(-30);
  });

  it('gives sign as 1, 0 or -1', () => {
    expect(hours(2).sign).toBe(1);
    expect(duration(0).sign).toBe(0);
    expect(hours(-2).sign).toBe(-1);
  });

  it('is frozen', () => {
    expect(Object.isFrozen(hours(2))).toBe(true);
  });
});

describe('Duration text', () => {
  it('is what format() prints in the long style, in the locale of the duration', () => {
    const film = duration('1h 30m', { locale: 'en-US' });
    expect(film.text).toBe(film.format('long'));
    expect(film.text).toContain('1 hour');
    expect(film.text).toContain('30 minutes');
  });

  it('is the first of its own keys, so a console preview leads with it', () => {
    expect(Object.keys(hours(2))[0]).toBe('text');
  });
});

describe('Duration anchor', () => {
  it('is undefined for a duration that was written, not measured', () => {
    expect(hours(2).anchor).toBeUndefined();
  });

  it('is the date a duration was measured from with until() or since()', () => {
    expect(date('2026-01-01').until('2026-04-01').anchor.toString()).toBe('2026-01-01');
    expect(date('2026-04-01').since('2026-01-01').anchor.toString()).toBe('2026-01-01');
  });

  it('is the moment in its zone when measured between datetimes', () => {
    const start = datetime('2026-01-01T00:00', 'UTC');
    const measured = start.until(datetime('2026-01-02T12:00', 'UTC'));
    expect(measured.anchor.toString()).toBe('2026-01-01T00:00:00+00:00[UTC]');
  });

  it('is undefined between two times of day, which have no calendar', () => {
    expect(time('09:00').until('17:30').anchor).toBeUndefined();
  });
});

describe('Duration isZero() and isNegative()', () => {
  it('reports a zero duration, however it was reached', () => {
    expect(duration(0).isZero()).toBe(true);
    expect(hours(1).minus(hours(1)).isZero()).toBe(true);
    expect(hours(1).isZero()).toBe(false);
  });

  it('reports a negative duration, and zero is not negative', () => {
    expect(hours(-1).isNegative()).toBe(true);
    expect(hours(1).isNegative()).toBe(false);
    expect(duration(0).isNegative()).toBe(false);
  });
});

describe('Duration toFields()', () => {
  it('returns the nonzero fields as a plain object', () => {
    expect(duration('1h 30m').toFields()).toEqual({ hours: 1, minutes: 30 });
    expect(duration(0).toFields()).toEqual({});
  });

  it('returns a new object each time, so changing it leaves the duration as it was', () => {
    const shift = hours(8);
    shift.toFields().hours = 12;
    expect(shift.hours).toBe(8);
  });
});

describe('Duration plus()', () => {
  it('adds a Duration, a phrase, a fields object, a count with a unit, or milliseconds', () => {
    expect(hours(2).plus(minutes(30)).toString()).toBe('PT2H30M');
    expect(hours(2).plus('30m').toString()).toBe('PT2H30M');
    expect(hours(2).plus({ minutes: 30 }).toString()).toBe('PT2H30M');
    expect(hours(2).plus(30, 'minutes').toString()).toBe('PT2H30M');
    expect(hours(2).plus(1500).toString()).toBe('PT2H1.5S');
  });

  it('returns a new Duration and leaves the receiver as it was', () => {
    const shift = hours(8);
    expect(shift.plus('30m')).not.toBe(shift);
    expect(shift.toString()).toBe('PT8H');
  });

  it('combines clock units up to the largest one written', () => {
    expect(hours(1).plus(minutes(90)).toString()).toBe('PT2H30M');
    expect(minutes(45).plus(minutes(30)).toString()).toBe('PT75M');
  });

  it('adds calendar units field by field, with no carry between them or from the clock', () => {
    expect(months(11).plus(months(2)).toString()).toBe('P13M');
    expect(days(6).plus(days(2)).toString()).toBe('P8D');
    expect(days(1).plus(hours(25)).toString()).toBe('P1DT25H');
  });

  it('keeps the anchor, whichever side carries it', () => {
    const measured = date('2026-01-31').until('2026-03-15');
    expect(measured.plus(hours(1)).anchor.toString()).toBe('2026-01-31');
    expect(hours(1).plus(measured).anchor.toString()).toBe('2026-01-31');
  });

  // a string has an anchor method of its own, which must not be taken for a duration's anchor
  it('has no anchor after a phrase is added to an unanchored duration', () => {
    expect(hours(1).plus('2h').anchor).toBeUndefined();
  });

  it('throws invalidDuration for an unreadable amount', () => {
    expect(() => hours(1).plus('soon')).toThrowError(expect.objectContaining({ code: 'invalidDuration', at: 'soon' }));
  });

  it('gives the same answer when spelled add()', () => {
    expect(hours(2).add(30, 'minutes').toString()).toBe('PT2H30M');
  });
});

describe('Duration minus()', () => {
  it('subtracts a Duration, a phrase, or a count with a unit', () => {
    expect(hours(2).minus(minutes(30)).toString()).toBe('PT1H30M');
    expect(hours(2).minus('30m').toString()).toBe('PT1H30M');
    expect(hours(2).minus(30, 'minutes').toString()).toBe('PT1H30M');
  });

  it('gives a negative duration when more is taken than it holds', () => {
    expect(hours(1).minus(hours(2)).toString()).toBe('-PT1H');
    expect(days(2).minus(days(3)).toString()).toBe('-P1D');
  });

  it('borrows a year as twelve months and a week as seven days', () => {
    expect(weeks(1).minus(days(1)).toString()).toBe('P6D');
    expect(years(1).minus(months(1)).toString()).toBe('P11M');
    expect(years(2).minus(months(1)).toString()).toBe('P1Y11M');
    expect(months(1).minus(years(1)).toString()).toBe('-P11M');
  });

  it('borrows only in the pair that disagrees, leaving the other fields as written', () => {
    expect(duration({ years: 1, weeks: 1 }).minus(months(2)).toString()).toBe('P10M1W');
    expect(months(18).plus(weeks(1)).minus(days(2)).toString()).toBe('P18M5D');
  });

  it('throws conflictingSigns when the fields left disagree and have no fixed ratio', () => {
    expect(() => days(1).minus(hours(1))).toThrowError(
      expect.objectContaining({ code: 'conflictingSigns', at: '{"days":1,"hours":-1}' }),
    );
    expect(() => hours(50).minus(days(1))).toThrowError(
      expect.objectContaining({ code: 'conflictingSigns', at: '{"days":-1,"hours":50}' }),
    );
    expect(() => weeks(3).minus(hours(1))).toThrowError(
      expect.objectContaining({ code: 'conflictingSigns', at: '{"weeks":3,"hours":-1}' }),
    );
    expect(() => months(1).minus(days(1))).toThrowError(
      expect.objectContaining({ code: 'conflictingSigns', at: '{"months":1,"days":-1}' }),
    );
  });

  it('throws conflictingSigns for an anchored duration left with two signs', () => {
    const measured = date('2026-01-01').until('2026-03-15');
    expect(() => measured.minus(days(20))).toThrowError(
      expect.objectContaining({ code: 'conflictingSigns', at: '{"months":2,"days":-6}' }),
    );
  });

  it('gives the same answer when spelled subtract(), and has no remove()', () => {
    expect(hours(2).subtract('30m').toString()).toBe('PT1H30M');
    expect(hours(2).remove).toBeUndefined();
  });
});

describe('Duration times()', () => {
  it('multiplies every field, leaving each where it was written', () => {
    expect(days(1).times(3).toString()).toBe('P3D');
    expect(duration('1h 30m').times(2).toString()).toBe('PT2H60M');
  });

  it('spills a fractional product into the next unit down', () => {
    expect(hours(1).times(1.5).toString()).toBe('PT1H30M');
    expect(days(1).times(0.5).toString()).toBe('PT12H');
    expect(years(1).times(1.5).toString()).toBe('P1Y6M');
  });

  it('flips the sign for a negative factor and gives zero for zero', () => {
    expect(duration('1h 30m').times(-1).toString()).toBe('-PT1H30M');
    expect(hours(1).times(0).isZero()).toBe(true);
  });

  it('throws invalidFraction when the product leaves a fraction of a month', () => {
    expect(() => months(1).times(1.5)).toThrowError(
      expect.objectContaining({ code: 'invalidFraction', at: '1.5 month' }),
    );
  });

  it('throws invalidNumber for a factor that is not finite', () => {
    expect(() => hours(1).times(NaN)).toThrowError(expect.objectContaining({ code: 'invalidNumber', at: 'NaN hour' }));
  });
});

describe('Duration negated()', () => {
  it('flips the sign of every field', () => {
    expect(duration('1h 30m').negated().toString()).toBe('-PT1H30M');
    expect(hours(-2).negated().toString()).toBe('PT2H');
  });

  it('leaves zero as zero', () => {
    expect(duration(0).negated().isZero()).toBe(true);
  });
});

describe('Duration abs()', () => {
  it('makes a negative duration positive and leaves a positive one as it was', () => {
    expect(duration('-1h 30m').abs().toString()).toBe('PT1H30M');
    expect(hours(2).abs().toString()).toBe('PT2H');
  });
});

describe('Duration balance()', () => {
  it('carries clock units up to hours', () => {
    expect(minutes(150).balance().toString()).toBe('PT2H30M');
    expect(seconds(3661).balance().toString()).toBe('PT1H1M1S');
    expect(minutes(-150).balance().toString()).toBe('-PT2H30M');
  });

  it('leaves hours past 24 as hours, since a day is a calendar unit', () => {
    expect(hours(36).balance().toString()).toBe('PT36H');
  });

  it('carries months into years with no anchor, and leaves days as written', () => {
    expect(months(18).balance().toString()).toBe('P1Y6M');
    expect(duration({ months: 14, days: 40 }).balance().toString()).toBe('P1Y2M40D');
  });

  it('balances up to the unit it is given, a day as 24 hours and a week as 7 days', () => {
    expect(hours(36).balance('day').toString()).toBe('P1DT12H');
    expect(days(10).balance('week').toString()).toBe('P1W3D');
    expect(hours(200).balance('week').toString()).toBe('P1W1DT8H');
  });

  it('breaks larger units down when given a smaller one', () => {
    expect(hours(2).balance('minute').toString()).toBe('PT120M');
    expect(weeks(2).balance('day').toString()).toBe('P14D');
  });

  it('balances years and months into each other with no anchor', () => {
    expect(months(18).balance('year').toString()).toBe('P1Y6M');
    expect(years(2).balance('month').toString()).toBe('P24M');
  });

  it('throws missingAnchor to turn months into days, or days into months, with no anchor', () => {
    expect(() => months(1).balance('day')).toThrowError(
      expect.objectContaining({ code: 'missingAnchor', at: 'balance of P1M' }),
    );
    expect(() => days(45).balance('month')).toThrowError(
      expect.objectContaining({ code: 'missingAnchor', at: 'balance to month' }),
    );
  });

  it('balances an anchored duration by its calendar, to days unless given a larger unit', () => {
    const measured = date('2026-01-01').until('2026-03-15');
    expect(measured.toString()).toBe('P2M14D');
    expect(measured.balance().toString()).toBe('P73D');
    expect(measured.balance('week').toString()).toBe('P10W3D');
    expect(measured.balance().anchor.toString()).toBe('2026-01-01');
  });

  it('throws unknownUnit for an unrecognized unit', () => {
    expect(() => hours(1).balance('fortnight')).toThrowError(
      expect.objectContaining({ code: 'unknownUnit', at: 'fortnight' }),
    );
  });
});

describe('Duration round()', () => {
  it('rounds to the nearest whole unit', () => {
    expect(duration('1h 20m').round('hour').toString()).toBe('PT1H');
    expect(duration('1h 40m').round('hour').toString()).toBe('PT2H');
    expect(seconds(89).round('minute').toString()).toBe('PT1M');
  });

  it('rounds a half away from zero', () => {
    expect(minutes(90).round('hour').toString()).toBe('PT2H');
    expect(duration('2h 30m').round('hour').toString()).toBe('PT3H');
    expect(duration('-1h 30m').round('hour').toString()).toBe('-PT2H');
  });

  it('rounds unanchored hours to days of 24 hours', () => {
    expect(hours(35).round('day').toString()).toBe('P1D');
    expect(hours(36).round('day').toString()).toBe('P2D');
  });

  it('rounds an anchored duration by its calendar and keeps the anchor', () => {
    const start = date('2026-01-01');
    expect(start.until('2026-03-10').round('month').toString()).toBe('P2M');
    expect(start.until('2026-03-20').round('month').toString()).toBe('P3M');
    expect(start.until('2026-03-20').round('month').anchor.toString()).toBe('2026-01-01');
  });

  it('throws unknownUnit for an unrecognized unit', () => {
    expect(() => hours(1).round('fortnight')).toThrowError(
      expect.objectContaining({ code: 'unknownUnit', at: 'fortnight' }),
    );
  });
});

describe('Duration total()', () => {
  it('gives the whole length in one unit, with its fraction', () => {
    expect(minutes(90).total('hours')).toBe(1.5);
    expect(hours(1).total('seconds')).toBe(3600);
    expect(hours(-36).total('days')).toBe(-1.5);
  });

  it('counts a day as 24 hours and a week as 7 days with no anchor', () => {
    expect(days(1).total('hours')).toBe(24);
    expect(weeks(2).total('days')).toBe(14);
  });

  it('counts a year as 12 months and a quarter as 3, with no anchor', () => {
    expect(years(2).total('months')).toBe(24);
    expect(months(18).total('years')).toBe(1.5);
    expect(months(18).total('quarters')).toBe(6);
  });

  it('throws missingAnchor between months and any smaller unit with no anchor', () => {
    expect(() => months(1).total('days')).toThrowError(
      expect.objectContaining({ code: 'missingAnchor', at: 'total in day of P1M' }),
    );
    expect(() => duration({ months: 1, days: 3 }).total('months')).toThrowError(
      expect.objectContaining({ code: 'missingAnchor', at: 'total in month of P1M3D' }),
    );
    expect(() => weeks(8).total('months')).toThrowError(
      expect.objectContaining({ code: 'missingAnchor', at: 'total in month' }),
    );
  });

  it('totals an anchored duration by the calendar it was measured on', () => {
    expect(date('2026-01-01').until('2026-04-01').total('days')).toBe(90);
    expect(date('2026-02-01').until('2026-03-01').total('days')).toBe(28);
    expect(date('2028-02-01').until('2028-03-01').total('days')).toBe(29);
  });

  it('totals anchored years and months in years, as it does unanchored ones', () => {
    expect(yearMonth('2026-01').until('2027-07').total('years')).toBe(1.5);
    expect(yearMonth('2026-01').until('2027-07', 'years')).toBe(1.5);
  });

  it('totals a day measured across a daylight saving change by its real hours', () => {
    const noon = datetime('2026-03-07T12:00', 'America/New_York');
    const nextNoon = datetime('2026-03-08T12:00', 'America/New_York');
    expect(noon.until(nextNoon).toString()).toBe('P1D');
    expect(noon.until(nextNoon).total('hours')).toBe(23);
  });

  it('throws unknownUnit for an unrecognized unit', () => {
    expect(() => hours(1).total('fortnights')).toThrowError(
      expect.objectContaining({ code: 'unknownUnit', at: 'fortnights' }),
    );
  });

  it('gives the same answer when spelled as()', () => {
    expect(hours(36).as('days')).toBe(1.5);
  });
});

describe('Duration compare()', () => {
  it('returns -1, 0 or 1 by length, however the fields are written', () => {
    expect(hours(1).compare(minutes(90))).toBe(-1);
    expect(minutes(90).compare(hours(1))).toBe(1);
    expect(hours(1).compare(minutes(60))).toBe(0);
  });

  it('reads the other side as duration() would', () => {
    expect(hours(1).compare('60m')).toBe(0);
    expect(hours(1).compare({ minutes: 60 })).toBe(0);
    expect(hours(1).compare(3_600_000)).toBe(0);
  });

  it('sorts an array from shortest to longest', () => {
    const sorted = [hours(2), minutes(30), days(1)].sort((a, b) => a.compare(b));
    expect(sorted.map(String)).toEqual(['PT30M', 'PT2H', 'P1D']);
  });

  it('compares years with months with no anchor', () => {
    expect(years(1).compare(months(13))).toBe(-1);
    expect(months(18).compare(years(1))).toBe(1);
  });

  it('compares months with days by the anchor of either side', () => {
    const january = date('2026-01-01').until('2026-02-01');
    expect(january.compare(days(31))).toBe(0);
    expect(days(30).compare(january)).toBe(-1);
  });

  it('throws missingAnchor comparing months with days when neither side is anchored', () => {
    expect(() => months(1).compare(days(30))).toThrowError(
      expect.objectContaining({ code: 'missingAnchor', at: 'compare of P1M' }),
    );
    expect(() => days(30).compare(months(1))).toThrowError(
      expect.objectContaining({ code: 'missingAnchor', at: 'compare of P1M' }),
    );
  });
});

describe('Duration equals()', () => {
  it('is true for the same length written in different units', () => {
    expect(hours(1).equals(minutes(60))).toBe(true);
    expect(weeks(1).equals(days(7))).toBe(true);
    expect(years(1).equals(months(12))).toBe(true);
    expect(hours(1).equals(minutes(61))).toBe(false);
  });

  it('is true for the same months with no anchor, since the fields are the same', () => {
    expect(duration({ months: 1, days: 3 }).equals({ months: 1, days: 3 })).toBe(true);
  });

  it('is true for an anchored month and the days it covers', () => {
    expect(date('2026-02-01').until('2026-03-01').equals(days(28))).toBe(true);
  });

  it('ignores the locale each side is written in', () => {
    expect(hours(1).locale('de').equals(hours(1).locale('fr'))).toBe(true);
  });

  it('throws missingAnchor for months against days with no anchor', () => {
    expect(() => months(1).equals(days(30))).toThrowError(
      expect.objectContaining({ code: 'missingAnchor', at: 'compare of P1M' }),
    );
  });
});

describe('Duration format()', () => {
  afterEach(() => configure({ locale: null, formats: null }));

  it('prints unit words in the long style, and defaults to it', () => {
    const film = duration('2h 30m');
    expect(film.format('long', 'en-US')).toContain('2 hours');
    expect(film.format('long', 'en-US')).toContain('30 minutes');
    expect(film.format(undefined, 'en-US')).toBe(film.format('long', 'en-US'));
  });

  it('prints abbreviations in the short style and the tightest form in narrow', () => {
    const film = duration('2h 30m');
    expect(film.format('short', 'en-US')).toMatch(/2 hr\b.*30 min\b/);
    expect(film.format('narrow', 'en-US')).toMatch(/2h\b.*30m\b/);
  });

  it('prints a clock in the digital style', () => {
    expect(duration('2h 30m').format('digital', 'en-US')).toMatch(/^2\D30\D00$/);
  });

  it('prints in the locale it is given', () => {
    const german = duration('2h 30m').format('long', 'de');
    expect(german).toContain('Stunden');
    expect(german).toContain('Minuten');
  });

  it('balances the clock for reading and leaves the fields as written', () => {
    const film = minutes(90);
    expect(film.format('long', 'en-US')).toContain('1 hour');
    expect(film.format('long', 'en-US')).toContain('30 minutes');
    expect(film.minutes).toBe(90);
  });

  it('prints calendar units as written', () => {
    expect(months(18).format('long', 'en-US')).toContain('18 months');
    expect(duration({ days: 1, hours: 25 }).format('long', 'en-US')).toMatch(/1 day\b.*25 hours/);
  });

  it('prints milliseconds only when nothing larger is set', () => {
    expect(milliseconds(250).format('long', 'en-US')).toContain('250 milliseconds');
    expect(milliseconds(3_661_500).format('long', 'en-US')).not.toContain('millisecond');
  });

  // Intl.DurationFormat prints an empty string for a zero duration
  it('prints zero as zero seconds, or as a clock of zeros in the digital style', () => {
    expect(duration(0).format('long', 'en-US')).toContain('0 seconds');
    expect(duration(0).format('digital', 'en-US')).toMatch(/^0+(\D0+)+$/);
  });

  it('prints a minus sign on a negative duration', () => {
    expect(hours(-2).format('long', 'en-US')).toMatch(/^-2/);
  });

  // compared with what the runtime prints itself, so the test holds on a machine in any locale
  it('takes its locale from the argument, then the duration, then configure(), then the runtime', () => {
    const shift = hours(2);
    expect(shift.format()).toBe(new Intl.DurationFormat(undefined, { style: 'long' }).format({ hours: 2 }));
    configure({ locale: 'fr' });
    expect(shift.format()).toContain('heures');
    expect(shift.locale('de').format()).toContain('Stunden');
    expect(shift.locale('de').format('long', 'en-US')).toContain('hours');
  });

  it('throws unknownFormat for an unrecognized style', () => {
    expect(() => hours(2).format('meduim')).toThrowError(
      expect.objectContaining({ code: 'unknownFormat', at: 'meduim' }),
    );
  });

  it('throws unknownFormat for a format named in configure({ formats }), and keeps its own short style', () => {
    configure({ formats: { stamp: 'YYYY-MM-DD', short: 'YYYY' } });
    expect(() => hours(2).format('stamp')).toThrowError(
      expect.objectContaining({ code: 'unknownFormat', at: 'stamp' }),
    );
    expect(hours(2).format('short', 'en-US')).toContain('2 hr');
  });

  it('throws unknownLocale for a locale that is not a tag', () => {
    expect(() => hours(2).format('long', 'not a locale')).toThrowError(
      expect.objectContaining({ code: 'unknownLocale', at: 'not a locale' }),
    );
  });
});

describe('Duration locale()', () => {
  it('is undefined until one is set', () => {
    expect(hours(2).locale()).toBeUndefined();
  });

  it('returns the same length written in the locale, leaving the receiver as it was', () => {
    const shift = hours(2);
    const german = shift.locale('de');
    expect(german.locale()).toBe('de');
    expect(german.text).toContain('Stunden');
    expect(german.toString()).toBe('PT2H');
    expect(shift.locale()).toBeUndefined();
  });

  it('clears the locale for null, undefined or an empty tag, and still chains', () => {
    const german = hours(2).locale('de');
    expect(german.locale(null).locale()).toBeUndefined();
    expect(german.locale(undefined).locale()).toBeUndefined();
    expect(german.locale('').locale()).toBeUndefined();
    expect(german.locale(null).plus('1h').toString()).toBe('PT3H');
  });

  it('is kept by every method that returns a Duration', () => {
    const german = minutes(90).locale('de');
    expect(german.plus('30m').locale()).toBe('de');
    expect(german.minus('30m').locale()).toBe('de');
    expect(german.times(2).locale()).toBe('de');
    expect(german.negated().locale()).toBe('de');
    expect(german.abs().locale()).toBe('de');
    expect(german.balance().locale()).toBe('de');
    expect(german.balance('day').locale()).toBe('de');
    expect(german.round('hour').locale()).toBe('de');
    expect(days(10).locale('de').balance('week').locale()).toBe('de');
    expect(months(18).locale('de').balance('year').locale()).toBe('de');
  });

  it('keeps the anchor of a measured duration, and the locale when it balances by that anchor', () => {
    const measured = date('2026-01-01').until('2026-03-15').locale('de');
    expect(measured.anchor.toString()).toBe('2026-01-01');
    expect(measured.balance().locale()).toBe('de');
  });

  it('keeps the locale of the receiver when the other duration carries a different one', () => {
    expect(hours(1).locale('de').plus(hours(1).locale('fr')).locale()).toBe('de');
    expect(hours(1).locale('de').minus(hours(1).locale('fr')).locale()).toBe('de');
  });

  it('comes from the date a duration was measured from', () => {
    expect(date('2026-01-01', { locale: 'de' }).until('2026-04-01').locale()).toBe('de');
  });

  it('throws unknownLocale for a tag that is not a locale', () => {
    expect(() => hours(2).locale('not a locale')).toThrowError(
      expect.objectContaining({ code: 'unknownLocale', at: 'not a locale' }),
    );
  });

  it('gives the same answer when spelled lang()', () => {
    expect(hours(2).lang('de').lang()).toBe('de');
  });
});

describe('Duration toString() and toJSON()', () => {
  it('writes ISO 8601 with the fields as written', () => {
    expect(duration('1h 30m').toString()).toBe('PT1H30M');
    expect(minutes(90).toString()).toBe('PT90M');
    expect(duration('-1h 30m').toString()).toBe('-PT1H30M');
    expect(duration(0).toString()).toBe('PT0S');
  });

  it('serializes to the same ISO text, whatever locale the duration carries', () => {
    const cache = { ttl: duration('1h 30m').locale('de') };
    expect(cache.ttl.toJSON()).toBe('PT1H30M');
    expect(JSON.stringify(cache)).toBe('{"ttl":"PT1H30M"}');
  });

  it('is read back by duration()', () => {
    const stored = JSON.parse(JSON.stringify({ ttl: duration('1h 30m') }));
    expect(duration(stored.ttl).equals('1h 30m')).toBe(true);
  });
});

describe('Duration toTemporal()', () => {
  it('returns a Temporal.Duration of the same length', () => {
    const temporal = hours(2).toTemporal();
    expect(temporal).toBeInstanceOf(Temporal.Duration);
    expect(temporal.toString()).toBe('PT2H');
  });

  it('returns the Temporal.Duration it was made from', () => {
    const temporal = Temporal.Duration.from('PT2H');
    expect(duration(temporal).toTemporal()).toBe(temporal);
  });
});

describe('Duration toMilliseconds() and valueOf()', () => {
  it('gives the whole length in milliseconds', () => {
    expect(hours(2).toMilliseconds()).toBe(7_200_000);
    expect(hours(2).valueOf()).toBe(7_200_000);
    expect(days(1).toMilliseconds()).toBe(86_400_000);
  });

  it('gives an anchored month the milliseconds of the days it covers', () => {
    expect(date('2026-02-01').until('2026-03-01').toMilliseconds()).toBe(28 * 86_400_000);
  });

  it('throws missingAnchor for months with no anchor', () => {
    expect(() => months(1).toMilliseconds()).toThrowError(
      expect.objectContaining({ code: 'missingAnchor', at: 'total in millisecond of P1M' }),
    );
  });

  it('compares and subtracts as a number of milliseconds', () => {
    expect(hours(2) > minutes(90)).toBe(true);
    expect(hours(2) - minutes(90)).toBe(1_800_000);
    expect(Number(seconds(2))).toBe(2000);
  });

  it('joins text as its ISO string', () => {
    expect(`${hours(2)}`).toBe('PT2H');
    expect(hours(2) + '').toBe('PT2H');
  });
});

describe('Duration in util.inspect()', () => {
  // a minified build renames the class, so the label cannot come from its name
  it('prints the class name and the ISO text', () => {
    expect(inspect(hours(2))).toBe('Duration(PT2H)');
  });

  it('adds the anchor of a measured duration', () => {
    expect(inspect(date('2026-01-01').until('2026-04-01'))).toMatch(/^Duration\(P3M\).*2026-01-01/);
  });
});
