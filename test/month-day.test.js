import { CalendarDate, compare, date, datetime, dayMonth, isMonthDay, MonthDay, monthDay, today } from 'native-dates';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('monthDay()', () => {
  it('parses month and day from two numbers, a fields object, or a dash-, slash-, or dot-separated string', () => {
    expect(monthDay(10, 17).toString()).toBe('10-17');
    expect(monthDay({ month: 10, day: 17 }).toString()).toBe('10-17');
    expect(monthDay('10-17').toString()).toBe('10-17');
    expect(monthDay('10/17').toString()).toBe('10-17');
    expect(monthDay('10.17').toString()).toBe('10-17');
  });

  it('parses single-digit month and day strings in month-first order', () => {
    expect(monthDay('5-6').toString()).toBe('05-06');
    expect(monthDay('1/2').toString()).toBe('01-02');
  });

  it('parses month and day from two numeric strings', () => {
    expect(monthDay('10', '17').toString()).toBe('10-17');
    expect(monthDay('02', '29').toString()).toBe('02-29');
    expect(monthDay('10', 17).toString()).toBe('10-17');
  });

  it('trims surrounding whitespace on input strings', () => {
    expect(monthDay(' 10/17 ').toString()).toBe('10-17');
    expect(monthDay('10-17\n').toString()).toBe('10-17');
  });

  it("parses the ISO 8601 '--MM-DD' form", () => {
    expect(monthDay('--10-17').toString()).toBe('10-17');
  });

  it('accepts February 29', () => {
    expect(monthDay(2, 29)).toMatchObject({ month: 2, day: 29 });
    expect(monthDay('02-29').toString()).toBe('02-29');
  });

  it('extracts month and day from an ISO date string, CalendarDate, date fields, or Temporal.PlainDate', () => {
    expect(monthDay('1990-10-17').toString()).toBe('10-17');
    expect(monthDay(date('1990-10-17')).toString()).toBe('10-17');
    expect(monthDay({ year: 1990, month: 10, day: 17 }).toString()).toBe('10-17');
    expect(monthDay(Temporal.PlainDate.from('1990-10-17')).toString()).toBe('10-17');
  });

  it('resolves a DateTime, Date, or instant string in the specified timezone', () => {
    const instant = datetime('2026-10-18T02:00:00Z');
    expect(monthDay(instant, 'America/Los_Angeles').toString()).toBe('10-17');
    expect(monthDay(instant, 'Asia/Tokyo').toString()).toBe('10-18');
    expect(monthDay(new Date('2026-10-18T02:00:00Z'), { zone: 'America/Los_Angeles' }).toString()).toBe('10-17');
    expect(monthDay('2026-10-18T02:00:00Z', 'America/Los_Angeles').toString()).toBe('10-17');
  });

  it('uses the DateTime timezone when no timezone override is passed', () => {
    expect(monthDay(datetime('2026-10-18T02:00:00Z', 'America/Los_Angeles')).toString()).toBe('10-17');
  });

  it('wraps a Temporal.PlainMonthDay or clones an existing MonthDay', () => {
    expect(monthDay(Temporal.PlainMonthDay.from('10-17')).toString()).toBe('10-17');
    expect(monthDay(monthDay(10, 17)).toString()).toBe('10-17');
  });

  it('parses slash- and dot-separated strings day-first when { dayFirst: true } is set', () => {
    expect(monthDay('17/10', { dayFirst: true }).toString()).toBe('10-17');
    expect(monthDay('06.05', { dayFirst: true }).toString()).toBe('05-06');
  });

  it('attaches the locale passed in options', () => {
    expect(monthDay('10-17', { locale: 'fr' }).locale()).toBe('fr');
  });

  it('throws TypeError with missingMonthDay for undefined or null', () => {
    expect(() => monthDay()).toThrowError(expect.objectContaining({ name: 'TypeError', code: 'missingMonthDay' }));
    expect(() => monthDay(null)).toThrowError(expect.objectContaining({ name: 'TypeError', code: 'missingMonthDay' }));
  });

  it('throws invalidMonthDay for a single number or boolean', () => {
    expect(() => monthDay(10)).toThrowError(expect.objectContaining({ code: 'invalidMonthDay', at: '10' }));
    expect(() => monthDay(true)).toThrowError(expect.objectContaining({ code: 'invalidMonthDay', at: 'true' }));
  });

  it('throws invalidMonthDay when month exceeds 12 without swapping month and day', () => {
    expect(() => monthDay('17/10')).toThrowError(expect.objectContaining({ code: 'invalidMonthDay', at: '17/10' }));
    expect(() => monthDay('13-01')).toThrowError(expect.objectContaining({ code: 'invalidMonthDay', at: '13-01' }));
  });

  it('throws invalidMonthDay when day exceeds the maximum days in that month', () => {
    expect(() => monthDay(4, 31)).toThrowError(
      expect.objectContaining({ code: 'invalidMonthDay', at: expect.stringContaining('31') }),
    );
    expect(() => monthDay({ month: 2, day: 30 })).toThrowError(
      expect.objectContaining({ code: 'invalidMonthDay', at: expect.stringContaining('30') }),
    );
    expect(() => monthDay('04/31')).toThrowError(expect.objectContaining({ code: 'invalidMonthDay', at: '04/31' }));
  });

  it('throws invalidMonthDay for fractional month or day numbers', () => {
    expect(() => monthDay(10.5, 17)).toThrowError(
      expect.objectContaining({ code: 'invalidMonthDay', at: expect.stringContaining('10.5') }),
    );
    expect(() => monthDay(10, 17.5)).toThrowError(
      expect.objectContaining({ code: 'invalidMonthDay', at: expect.stringContaining('17.5') }),
    );
  });

  it('throws invalidMonthDay for invalid strings, year-months, or slash-formatted full dates', () => {
    expect(() => monthDay('whenever')).toThrowError(
      expect.objectContaining({ code: 'invalidMonthDay', at: 'whenever' }),
    );
    expect(() => monthDay('')).toThrowError(expect.objectContaining({ code: 'invalidMonthDay', at: '' }));
    expect(() => monthDay('2026-10')).toThrowError(expect.objectContaining({ code: 'invalidMonthDay', at: '2026-10' }));
    expect(() => monthDay('10/17/2026')).toThrowError(
      expect.objectContaining({ code: 'invalidMonthDay', at: '10/17/2026' }),
    );
  });

  it('throws invalidMonthDay for named-month strings without { loose: true }', () => {
    expect(() => monthDay('Oct 17')).toThrowError(expect.objectContaining({ code: 'invalidMonthDay', at: 'Oct 17' }));
  });

  it('throws invalidMonthDay for incomplete fields objects missing month or day', () => {
    expect(() => monthDay({ month: 10 })).toThrowError(expect.objectContaining({ code: 'invalidMonthDay' }));
    expect(() => monthDay({ day: 17 })).toThrowError(expect.objectContaining({ code: 'invalidMonthDay' }));
  });

  it('throws unsupportedCalendar for a non-ISO Temporal.PlainMonthDay', () => {
    const hebrew = Temporal.PlainMonthDay.from({ monthCode: 'M05', day: 1, calendar: 'hebrew' });
    expect(() => monthDay(hebrew)).toThrowError(
      expect.objectContaining({ name: 'TypeError', code: 'unsupportedCalendar' }),
    );
  });

  it('throws unknownZone for an unrecognized timezone', () => {
    expect(() => monthDay('2026-10-18T02:00:00Z', 'Mars/Phobos')).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'unknownZone', at: 'Mars/Phobos' }),
    );
  });

  it('throws missingPlugin at loose when { loose: true } is passed without the loose plugin', () => {
    expect(() => monthDay('Oct 17', { loose: true })).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'missingPlugin', at: 'loose' }),
    );
    expect(() => new MonthDay('Oct 17', { loose: true })).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'missingPlugin', at: 'loose' }),
    );
  });

  // fails because MonthDay's own 'text' property triggers unknownUnit
  it.todo('accepts an object spread from a MonthDay instance ({ ...birthday })');
});

describe('dayMonth()', () => {
  it('parses day then month from two numbers or a slash- or dot-separated string', () => {
    expect(dayMonth(17, 10).toString()).toBe('10-17');
    expect(dayMonth('17/10').toString()).toBe('10-17');
    expect(dayMonth('17.10').toString()).toBe('10-17');
    expect(dayMonth('06.05').toString()).toBe('05-06');
  });

  it('parses single-digit hyphenated strings in day-first order', () => {
    expect(dayMonth('5-6').toString()).toBe('06-05');
  });

  it("parses two-digit hyphenated 'MM-DD' strings month-first to preserve ISO round-tripping", () => {
    expect(dayMonth('10-17').toString()).toBe('10-17');
    expect(dayMonth('05-06').toString()).toBe('05-06');
    expect(monthDay('05-06', { dayFirst: true }).toString()).toBe('05-06');
  });

  it('parses day then month from two numeric strings', () => {
    expect(dayMonth('17', '10').toString()).toBe('10-17');
    expect(dayMonth('29', '02').toString()).toBe('02-29');
  });

  it('parses day-first strings alongside options', () => {
    const birthday = dayMonth('17/10', { locale: 'fr' });
    expect(birthday.toString()).toBe('10-17');
    expect(birthday.locale()).toBe('fr');
  });

  // two zones on different dates at 02:00Z so the host timezone cannot satisfy both
  it('resolves a Date instant in the specified timezone', () => {
    const instant = new Date('2026-10-18T02:00:00Z');
    expect(dayMonth(instant, 'America/Los_Angeles').toString()).toBe('10-17');
    expect(dayMonth(instant, 'Asia/Tokyo').toString()).toBe('10-18');
  });

  it('accepts February 29 in day-first order', () => {
    expect(dayMonth(29, 2).toString()).toBe('02-29');
    expect(dayMonth('29/02').toString()).toBe('02-29');
  });

  it('accepts fields objects, ISO date strings, and instants like monthDay()', () => {
    expect(dayMonth({ month: 10, day: 17 }).toString()).toBe('10-17');
    expect(dayMonth('1990-10-17').toString()).toBe('10-17');
    expect(dayMonth(new Date('2026-10-18T02:00:00Z'), 'America/Los_Angeles').toString()).toBe('10-17');
  });

  it('throws invalidMonthDay when the second component exceeds 12 without swapping day and month', () => {
    expect(() => dayMonth('10/17')).toThrowError(expect.objectContaining({ code: 'invalidMonthDay', at: '10/17' }));
  });

  it('throws invalidMonthDay when day exceeds the maximum days in that month', () => {
    expect(() => dayMonth(31, 4)).toThrowError(
      expect.objectContaining({ code: 'invalidMonthDay', at: expect.stringContaining('31') }),
    );
    expect(() => dayMonth('31/04')).toThrowError(expect.objectContaining({ code: 'invalidMonthDay', at: '31/04' }));
  });

  it('throws missingMonthDay for undefined or null and invalidMonthDay for a single number', () => {
    expect(() => dayMonth()).toThrowError(expect.objectContaining({ name: 'TypeError', code: 'missingMonthDay' }));
    expect(() => dayMonth(null)).toThrowError(expect.objectContaining({ name: 'TypeError', code: 'missingMonthDay' }));
    expect(() => dayMonth(17)).toThrowError(expect.objectContaining({ code: 'invalidMonthDay', at: '17' }));
  });
});

describe('MonthDay', () => {
  it('constructs MonthDay instances via monthDay(), dayMonth(), and new MonthDay() and checks them with isMonthDay()', () => {
    expect(monthDay(10, 17)).toBeInstanceOf(MonthDay);
    expect(dayMonth(17, 10)).toBeInstanceOf(MonthDay);
    expect(new MonthDay(10, 17).toString()).toBe('10-17');
    expect(isMonthDay(monthDay(10, 17))).toBe(true);
    expect(isMonthDay('10-17')).toBe(false);
  });

  it('extracts a MonthDay from CalendarDate and DateTime via .monthDay and as("monthDay")', () => {
    const instant = datetime('2026-10-18T02:00:00Z', 'America/Los_Angeles');
    expect(date('1990-10-17').monthDay.toString()).toBe('10-17');
    expect(date('1990-10-17').as('monthDay').toString()).toBe('10-17');
    expect(instant.monthDay.toString()).toBe('10-17');
    expect(instant.as('monthDay').toString()).toBe('10-17');
  });

  it('exposes 1-indexed month and day number properties', () => {
    expect(monthDay('01-09')).toMatchObject({ month: 1, day: 9 });
    expect(monthDay('12-31')).toMatchObject({ month: 12, day: 31 });
  });

  it('formats text in the en-US locale', () => {
    expect(monthDay('10-17', { locale: 'en-US' }).text).toBe('Oct 17');
    expect(monthDay('02-29', { locale: 'en-US' }).text).toBe('Feb 29');
  });

  it('formats text using the instance locale', () => {
    expect(monthDay(10, 17).locale('ja').text).toBe('10月17日');
    expect(monthDay('10-17', { locale: 'fr' }).text).toBe('17 oct.');
  });

  it('freezes instances on construction', () => {
    const birthday = monthDay(10, 17);
    expect(() => {
      birthday.month = 1;
    }).toThrowError(TypeError);
    expect(birthday.toString()).toBe('10-17');
  });
});

describe('MonthDay in()', () => {
  it('places the MonthDay into the given year as a CalendarDate', () => {
    const placed = monthDay(10, 17).in(2027);
    expect(placed).toBeInstanceOf(CalendarDate);
    expect(placed.toString()).toBe('2027-10-17');
  });

  it('accepts a numeric year string', () => {
    expect(monthDay(10, 17).in('2027').toString()).toBe('2027-10-17');
  });

  it('clamps February 29 to February 28 in non-leap years', () => {
    expect(monthDay(2, 29).in(2027).toString()).toBe('2027-02-28');
    expect(monthDay(2, 29).in(1900).toString()).toBe('1900-02-28');
  });

  it('preserves February 29 in leap years', () => {
    expect(monthDay(2, 29).in(2028).toString()).toBe('2028-02-29');
    expect(monthDay(2, 29).in(2000).toString()).toBe('2000-02-29');
  });

  it('throws invalidYear for fractional, non-numeric, or missing years', () => {
    expect(() => monthDay(10, 17).in(2027.5)).toThrowError(
      expect.objectContaining({ code: 'invalidYear', at: expect.stringContaining('2027.5') }),
    );
    expect(() => monthDay(10, 17).in('next year')).toThrowError(
      expect.objectContaining({ code: 'invalidYear', at: expect.stringContaining('next year') }),
    );
    expect(() => monthDay(10, 17).in()).toThrowError(expect.objectContaining({ code: 'invalidYear' }));
  });

  it('throws invalidYear when the year exceeds Temporal bounds', () => {
    expect(() => monthDay(10, 17).in(300000)).toThrowError(
      expect.objectContaining({ code: 'invalidYear', at: expect.stringContaining('300000') }),
    );
  });
});

describe('MonthDay next() and after()', () => {
  it('returns the date in the same year when the MonthDay is after the reference date', () => {
    expect(monthDay(10, 17).next('2026-05-01').toString()).toBe('2026-10-17');
    expect(monthDay(10, 17).after('2026-10-16').toString()).toBe('2026-10-17');
  });

  it('advances to the next year when the reference date falls on the same MonthDay', () => {
    expect(monthDay(10, 17).next('2026-10-17').toString()).toBe('2027-10-17');
    expect(monthDay(10, 17).after('2026-10-17').toString()).toBe('2027-10-17');
  });

  it('advances to the next year when the MonthDay has already passed in the reference year', () => {
    expect(monthDay(10, 17).next('2026-11-16').toString()).toBe('2027-10-17');
    expect(monthDay(1, 1).next('2026-12-31').toString()).toBe('2027-01-01');
  });

  it('returns a CalendarDate instance', () => {
    expect(monthDay(10, 17).next('2026-05-01')).toBeInstanceOf(CalendarDate);
    expect(monthDay(10, 17).after('2026-05-01')).toBeInstanceOf(CalendarDate);
  });

  it('accepts CalendarDate, date fields, Temporal.PlainDate, and DateTime reference values', () => {
    const birthday = monthDay(10, 17);
    expect(birthday.next(date('2026-05-01')).toString()).toBe('2026-10-17');
    expect(birthday.next({ year: 2026, month: 5, day: 1 }).toString()).toBe('2026-10-17');
    expect(birthday.next(Temporal.PlainDate.from('2026-05-01')).toString()).toBe('2026-10-17');
    expect(birthday.next(datetime('2026-10-18T02:00:00Z', 'America/Los_Angeles')).toString()).toBe('2027-10-17');
  });

  it('resolves February 29 to February 28 in non-leap years and February 29 in leap years', () => {
    expect(monthDay(2, 29).after('2026-03-01').toString()).toBe('2027-02-28');
    expect(monthDay(2, 29).after('2027-03-01').toString()).toBe('2028-02-29');
  });

  it('advances February 29 to the next year when the reference date is its clamped February 28', () => {
    expect(monthDay(2, 29).next('2027-02-28').toString()).toBe('2028-02-29');
  });

  it('returns February 29 of the same leap year when the reference date is February 28', () => {
    expect(monthDay(2, 29).next('2028-02-28').toString()).toBe('2028-02-29');
  });

  it('matches CalendarDate.prototype.next(monthDay)', () => {
    expect(date('2026-11-16').next(monthDay(10, 17)).toString()).toBe('2027-10-17');
    expect(date('2026-05-01').next(monthDay(10, 17)).toString()).toBe('2026-10-17');
  });

  // call next() before today() so a midnight rollover during the test keeps daysAway >= 0
  it('defaults next() to the real system clock when no reference date is passed', () => {
    const upcoming = monthDay(10, 17).next();
    const daysAway = today().until(upcoming, 'days');
    expect(daysAway).toBeGreaterThanOrEqual(0);
    expect(daysAway).toBeLessThanOrEqual(366);
  });

  it('throws missingDate from after() when called with no reference date', () => {
    expect(() => monthDay(10, 17).after()).toThrowError(
      expect.objectContaining({ name: 'TypeError', code: 'missingDate' }),
    );
  });

  it('throws invalidDate when the reference date lacks a year, names a weekday, or is invalid', () => {
    expect(() => monthDay(10, 17).next('10-17')).toThrowError(
      expect.objectContaining({ code: 'invalidDate', at: '10-17' }),
    );
    expect(() => monthDay(10, 17).next('friday')).toThrowError(
      expect.objectContaining({ code: 'invalidDate', at: 'friday' }),
    );
    expect(() => monthDay(10, 17).after('nonsense')).toThrowError(
      expect.objectContaining({ code: 'invalidDate', at: 'nonsense' }),
    );
  });
});

describe('MonthDay previous(), last(), and before()', () => {
  it('returns the date in the same year when the MonthDay is before the reference date', () => {
    expect(monthDay(10, 17).previous('2026-11-16').toString()).toBe('2026-10-17');
    expect(monthDay(10, 17).before('2026-10-18').toString()).toBe('2026-10-17');
  });

  it('steps back to the previous year when the reference date falls on the same MonthDay', () => {
    expect(monthDay(10, 17).previous('2026-10-17').toString()).toBe('2025-10-17');
    expect(monthDay(10, 17).before('2026-10-17').toString()).toBe('2025-10-17');
  });

  it('steps back to the previous year when the MonthDay has not yet occurred in the reference year', () => {
    expect(monthDay(10, 17).before('2026-10-01').toString()).toBe('2025-10-17');
    expect(monthDay(12, 31).previous('2026-01-01').toString()).toBe('2025-12-31');
  });

  it('aliases last() to previous()', () => {
    expect(monthDay(10, 17).last('2026-11-16').toString()).toBe('2026-10-17');
    expect(monthDay(10, 17).last('2026-10-17').toString()).toBe('2025-10-17');
  });

  it('resolves February 29 to February 28 in non-leap years and February 29 in leap years', () => {
    expect(monthDay(2, 29).previous('2027-03-01').toString()).toBe('2027-02-28');
    expect(monthDay(2, 29).previous('2028-03-01').toString()).toBe('2028-02-29');
  });

  it('steps February 29 back to the previous year when the reference date is its clamped February 28', () => {
    expect(monthDay(2, 29).previous('2027-02-28').toString()).toBe('2026-02-28');
  });

  it('matches CalendarDate.prototype.previous(monthDay)', () => {
    expect(date('2026-11-16').previous(monthDay(10, 17)).toString()).toBe('2026-10-17');
    expect(date('2026-10-17').previous(monthDay(10, 17)).toString()).toBe('2025-10-17');
  });

  // call today() before previous() so a midnight rollover during the test keeps daysAgo >= 0
  it('defaults previous() to the real system clock when no reference date is passed', () => {
    const from = today();
    const daysAgo = monthDay(10, 17).previous().until(from, 'days');
    expect(daysAgo).toBeGreaterThanOrEqual(0);
    expect(daysAgo).toBeLessThanOrEqual(366);
  });

  it('throws missingDate from before() when called with no reference date', () => {
    expect(() => monthDay(10, 17).before()).toThrowError(
      expect.objectContaining({ name: 'TypeError', code: 'missingDate' }),
    );
  });
});

describe('MonthDay next(), previous(), and last() with fake timers', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date', 'Temporal'], now: new Date('2026-11-18T12:00:00Z') });
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('resolves next() relative to today', () => {
    expect(monthDay(12, 25).next().toString()).toBe('2026-12-25');
    expect(monthDay(10, 17).next().toString()).toBe('2027-10-17');
  });

  it('resolves previous() and last() relative to today', () => {
    expect(monthDay(10, 17).previous().toString()).toBe('2026-10-17');
    expect(monthDay(12, 25).previous().toString()).toBe('2025-12-25');
    expect(monthDay(12, 25).last().toString()).toBe('2025-12-25');
  });
});

describe('MonthDay fallsOn() and isOn()', () => {
  it('returns true when a date matches the month and day and false otherwise', () => {
    const birthday = monthDay(10, 17);
    expect(birthday.fallsOn('2026-10-17')).toBe(true);
    expect(birthday.fallsOn('1990-10-17')).toBe(true);
    expect(birthday.fallsOn('2026-10-18')).toBe(false);
    expect(birthday.fallsOn('2026-11-17')).toBe(false);
  });

  it('returns true for February 29 on February 28 of a non-leap year', () => {
    expect(monthDay(2, 29).fallsOn('2027-02-28')).toBe(true);
    expect(monthDay(2, 29).fallsOn('2027-03-01')).toBe(false);
  });

  it('returns true for February 29 only on February 29 of a leap year', () => {
    expect(monthDay(2, 29).fallsOn('2028-02-29')).toBe(true);
    expect(monthDay(2, 29).fallsOn('2028-02-28')).toBe(false);
  });

  it('returns true for February 28 on February 28 of any year and false on February 29', () => {
    expect(monthDay(2, 28).fallsOn('2027-02-28')).toBe(true);
    expect(monthDay(2, 28).fallsOn('2028-02-28')).toBe(true);
    expect(monthDay(2, 28).fallsOn('2028-02-29')).toBe(false);
  });

  it('accepts CalendarDate, date fields, and Temporal.PlainDate inputs', () => {
    const birthday = monthDay(10, 17);
    expect(birthday.fallsOn(date('2026-10-17'))).toBe(true);
    expect(birthday.fallsOn({ year: 2026, month: 10, day: 17 })).toBe(true);
    expect(birthday.fallsOn(Temporal.PlainDate.from('2026-10-17'))).toBe(true);
  });

  it('evaluates a DateTime in its own timezone', () => {
    const instant = datetime('2026-10-18T02:00:00Z', 'America/Los_Angeles');
    expect(monthDay(10, 17).fallsOn(instant)).toBe(true);
    expect(monthDay(10, 18).fallsOn(instant)).toBe(false);
  });

  it('aliases isOn() to fallsOn()', () => {
    expect(monthDay(2, 29).isOn('2027-02-28')).toBe(true);
    expect(monthDay(2, 29).isOn('2028-02-28')).toBe(false);
  });

  it('throws missingDate when called with no argument and invalidDate for a yearless string', () => {
    expect(() => monthDay(10, 17).fallsOn()).toThrowError(
      expect.objectContaining({ name: 'TypeError', code: 'missingDate' }),
    );
    expect(() => monthDay(10, 17).fallsOn('10-17')).toThrowError(
      expect.objectContaining({ code: 'invalidDate', at: '10-17' }),
    );
  });
});

describe('MonthDay equals()', () => {
  it('returns true for a matching MonthDay, ISO string, fields object, or Temporal.PlainMonthDay', () => {
    const birthday = monthDay(10, 17);
    expect(birthday.equals(monthDay('10-17'))).toBe(true);
    expect(birthday.equals(dayMonth('17/10'))).toBe(true);
    expect(birthday.equals('10-17')).toBe(true);
    expect(birthday.equals({ month: 10, day: 17 })).toBe(true);
    expect(birthday.equals(Temporal.PlainMonthDay.from('10-17'))).toBe(true);
  });

  it('returns false when month or day differs', () => {
    expect(monthDay(10, 17).equals('10-18')).toBe(false);
    expect(monthDay(10, 17).equals(monthDay(11, 17))).toBe(false);
  });

  it('compares against the month and day of a CalendarDate, ISO date string, or DateTime', () => {
    expect(monthDay(10, 17).equals('1990-10-17')).toBe(true);
    expect(monthDay(10, 17).equals(date('2026-10-17'))).toBe(true);
    expect(monthDay(10, 17).equals(datetime('2026-10-18T02:00:00Z', 'America/Los_Angeles'))).toBe(true);
    expect(monthDay(10, 17).equals('1990-10-18')).toBe(false);
  });

  it('returns false when comparing February 29 against February 28 of a non-leap year', () => {
    expect(monthDay(2, 29).equals('2027-02-28')).toBe(false);
    expect(monthDay(2, 29).equals(monthDay(2, 28))).toBe(false);
  });

  it('ignores instance locales when comparing values', () => {
    expect(monthDay(10, 17).locale('fr').equals(monthDay(10, 17))).toBe(true);
    expect(monthDay(10, 17).locale('fr').equals(monthDay(10, 17).locale('ja'))).toBe(true);
  });

  it('throws invalidMonthDay for ambiguous slash, dot, or single-digit strings', () => {
    expect(() => monthDay(10, 17).equals('05/10')).toThrowError(
      expect.objectContaining({ code: 'invalidMonthDay', at: '05/10' }),
    );
    expect(() => monthDay(10, 17).equals('10.17')).toThrowError(
      expect.objectContaining({ code: 'invalidMonthDay', at: '10.17' }),
    );
    expect(() => monthDay(10, 17).equals('5-6')).toThrowError(
      expect.objectContaining({ code: 'invalidMonthDay', at: '5-6' }),
    );
  });

  it('throws invalidMonthDay for invalid strings', () => {
    expect(() => monthDay(10, 17).equals('whenever')).toThrowError(
      expect.objectContaining({ code: 'invalidMonthDay', at: 'whenever' }),
    );
  });
});

describe('MonthDay isToday(), isTomorrow(), and isYesterday()', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date', 'Temporal'], now: new Date('2026-10-17T12:00:00Z') });
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('matches the month and day of today, tomorrow, and yesterday in UTC', () => {
    expect(monthDay(10, 17).isToday('UTC')).toBe(true);
    expect(monthDay(10, 18).isToday('UTC')).toBe(false);
    expect(monthDay(10, 18).isTomorrow('UTC')).toBe(true);
    expect(monthDay(10, 17).isTomorrow('UTC')).toBe(false);
    expect(monthDay(10, 16).isYesterday('UTC')).toBe(true);
    expect(monthDay(10, 17).isYesterday('UTC')).toBe(false);
  });

  it('evaluates today in the specified timezone', () => {
    vi.setSystemTime(new Date('2026-10-18T02:00:00Z'));
    expect(monthDay(10, 17).isToday('America/Los_Angeles')).toBe(true);
    expect(monthDay(10, 17).isToday('Asia/Tokyo')).toBe(false);
    expect(monthDay(10, 18).isToday('Asia/Tokyo')).toBe(true);
    expect(monthDay(10, 18).isTomorrow('America/Los_Angeles')).toBe(true);
    expect(monthDay(10, 17).isYesterday('Asia/Tokyo')).toBe(true);
  });

  it('evaluates tomorrow and yesterday in the specified timezone', () => {
    vi.setSystemTime(new Date('2026-10-18T02:00:00Z'));
    expect(monthDay(10, 18).isTomorrow('America/Los_Angeles')).toBe(true);
    expect(monthDay(10, 19).isTomorrow('Asia/Tokyo')).toBe(true);
    expect(monthDay(10, 18).isTomorrow('Asia/Tokyo')).toBe(false);
    expect(monthDay(10, 16).isYesterday('America/Los_Angeles')).toBe(true);
    expect(monthDay(10, 17).isYesterday('Asia/Tokyo')).toBe(true);
    expect(monthDay(10, 17).isYesterday('America/Los_Angeles')).toBe(false);
  });

  it('treats February 29 as today on February 28 of a non-leap year', () => {
    vi.setSystemTime(new Date('2027-02-28T12:00:00Z'));
    expect(monthDay(2, 29).isToday('UTC')).toBe(true);
    expect(monthDay(2, 29).isTomorrow('UTC')).toBe(false);
  });

  it('treats February 29 as tomorrow rather than today on February 28 of a leap year', () => {
    vi.setSystemTime(new Date('2028-02-28T12:00:00Z'));
    expect(monthDay(2, 29).isToday('UTC')).toBe(false);
    expect(monthDay(2, 29).isTomorrow('UTC')).toBe(true);
  });

  it('handles year boundaries between December 31 and January 1', () => {
    vi.setSystemTime(new Date('2026-12-31T12:00:00Z'));
    expect(monthDay(1, 1).isTomorrow('UTC')).toBe(true);
    vi.setSystemTime(new Date('2027-01-01T12:00:00Z'));
    expect(monthDay(12, 31).isYesterday('UTC')).toBe(true);
  });

  it('throws unknownZone for an unrecognized timezone', () => {
    expect(() => monthDay(10, 17).isToday('Mars/Phobos')).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'unknownZone', at: 'Mars/Phobos' }),
    );
  });
});

describe('MonthDay numeric coercion and compare()', () => {
  it('throws unsupportedComparison from <, >, unary +, and valueOf()', () => {
    const earlier = monthDay(5, 1);
    const later = monthDay(10, 17);
    expect(() => earlier < later).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'unsupportedComparison', at: '05-01' }),
    );
    expect(() => later > earlier).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'unsupportedComparison', at: '10-17' }),
    );
    expect(() => +later).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'unsupportedComparison', at: '10-17' }),
    );
    expect(() => later.valueOf()).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'unsupportedComparison', at: '10-17' }),
    );
  });

  it('throws invalidPoint when passed to top-level compare()', () => {
    expect(() => [monthDay(10, 17), monthDay(5, 1)].sort(compare)).toThrowError(
      expect.objectContaining({ code: 'invalidPoint' }),
    );
  });
});

describe('MonthDay locale() and lang()', () => {
  it('returns undefined when no locale is set', () => {
    expect(monthDay(5, 1).locale()).toBeUndefined();
    expect(monthDay(5, 1).lang()).toBeUndefined();
  });

  it('returns a new MonthDay with the locale tag without mutating the original', () => {
    const labourDay = monthDay(5, 1);
    const russian = labourDay.locale('ru');
    expect(russian.locale()).toBe('ru');
    expect(russian.toString()).toBe('05-01');
    expect(labourDay.locale()).toBeUndefined();
  });

  it('aliases lang() to locale()', () => {
    expect(monthDay(5, 1).lang('fr').lang()).toBe('fr');
    expect(monthDay(5, 1).lang('fr').locale()).toBe('fr');
  });

  it('clears the locale tag when passed null, undefined, or an empty string', () => {
    const russian = monthDay(5, 1).locale('ru');
    expect(russian.locale(null).locale()).toBeUndefined();
    expect(russian.locale(undefined).locale()).toBeUndefined();
    expect(russian.locale('').locale()).toBeUndefined();
  });

  it('propagates the locale to CalendarDate instances returned by in(), next(), and previous()', () => {
    const russian = monthDay(5, 1).locale('ru');
    expect(russian.in(2026).locale()).toBe('ru');
    expect(russian.next('2026-01-01').locale()).toBe('ru');
    expect(russian.previous('2026-01-01').locale()).toBe('ru');
  });

  it('preserves the locale when wrapping a MonthDay or CalendarDate', () => {
    expect(monthDay(monthDay(5, 1).locale('ru')).locale()).toBe('ru');
    expect(monthDay(date('2026-05-01').locale('ru')).locale()).toBe('ru');
  });

  it('throws unknownLocale for an invalid locale tag', () => {
    expect(() => monthDay(5, 1).locale('not a locale')).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'unknownLocale', at: 'not a locale' }),
    );
  });
});

describe('MonthDay format()', () => {
  it('matches the text property when called with no format argument', () => {
    const birthday = monthDay('10-17', { locale: 'en-US' });
    expect(birthday.format()).toBe('Oct 17');
    expect(birthday.format()).toBe(birthday.text);
  });

  it('throws unsupportedToken for year, weekday, or clock tokens', () => {
    expect(() => monthDay(10, 17).format('YYYY-MM-DD')).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'unsupportedToken', at: expect.stringContaining('YYYY') }),
    );
    expect(() => monthDay(10, 17).format('dddd')).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'unsupportedToken', at: expect.stringContaining('dddd') }),
    );
    expect(() => monthDay(10, 17).format('HH:mm')).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'unsupportedToken', at: expect.stringContaining('HH') }),
    );
  });
});

describe('MonthDay as()', () => {
  it("returns the same MonthDay instance for 'monthDay'", () => {
    const birthday = monthDay(10, 17);
    expect(birthday.as('monthDay')).toBe(birthday);
  });

  it("throws unknownKind for 'date' and 'yearMonth'", () => {
    expect(() => monthDay(10, 17).as('date')).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'unknownKind', at: 'date' }),
    );
    expect(() => monthDay(10, 17).as('yearMonth')).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'unknownKind', at: 'yearMonth' }),
    );
  });
});

describe('MonthDay toString(), toJSON(), and toTemporal()', () => {
  it("formats zero-padded 'MM-DD' in toString()", () => {
    expect(monthDay(5, 6).toString()).toBe('05-06');
    expect(monthDay(10, 17).toString()).toBe('10-17');
    expect(monthDay(2, 29).toString()).toBe('02-29');
  });

  it("serializes as 'MM-DD' in toJSON() and JSON.stringify()", () => {
    expect(monthDay(5, 6).toJSON()).toBe('05-06');
    expect(JSON.stringify({ birthday: monthDay(10, 17) })).toBe('{"birthday":"10-17"}');
  });

  it("coerces to 'MM-DD' in String(), template literals, and string concatenation", () => {
    const birthday = monthDay(10, 17);
    expect(String(birthday)).toBe('10-17');
    expect(`${birthday}`).toBe('10-17');
    expect('born on ' + birthday).toBe('born on 10-17');
  });

  it('round-trips every day of a leap year through toString(), JSON, and monthDay()', () => {
    const daysInMonth = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    daysInMonth.forEach((days, index) => {
      for (let day = 1; day <= days; day++) {
        const written = monthDay(index + 1, day);
        expect(monthDay(written.toString())).toMatchObject({ month: index + 1, day });
        expect(monthDay(JSON.parse(JSON.stringify(written)))).toMatchObject({ month: index + 1, day });
      }
    });
  });

  it('round-trips every day of a leap year through toString(), JSON, and dayMonth()', () => {
    const daysInMonth = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    daysInMonth.forEach((days, index) => {
      for (let day = 1; day <= days; day++) {
        const written = monthDay(index + 1, day);
        expect(dayMonth(written.toString())).toMatchObject({ month: index + 1, day });
        expect(dayMonth(JSON.parse(JSON.stringify(written)))).toMatchObject({ month: index + 1, day });
      }
    });
  });

  it('returns an ISO 8601 Temporal.PlainMonthDay from toTemporal()', () => {
    const plain = monthDay(10, 17).toTemporal();
    expect(plain).toBeInstanceOf(Temporal.PlainMonthDay);
    expect(plain.calendarId).toBe('iso8601');
    expect(plain.monthCode).toBe('M10');
    expect(plain.day).toBe(17);
    expect(monthDay(plain).toString()).toBe('10-17');
  });
});
