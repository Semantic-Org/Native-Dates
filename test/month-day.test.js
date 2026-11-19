import { CalendarDate, compare, date, datetime, dayMonth, isMonthDay, MonthDay, monthDay, today } from 'native-dates';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('monthDay()', () => {
  it('reads month then day from two numbers, a fields object, and a string with a dash, slash or dot', () => {
    expect(monthDay(10, 17).toString()).toBe('10-17');
    expect(monthDay({ month: 10, day: 17 }).toString()).toBe('10-17');
    expect(monthDay('10-17').toString()).toBe('10-17');
    expect(monthDay('10/17').toString()).toBe('10-17');
    expect(monthDay('10.17').toString()).toBe('10-17');
  });

  it('reads a single-digit month and day month-first', () => {
    expect(monthDay('5-6').toString()).toBe('05-06');
    expect(monthDay('1/2').toString()).toBe('01-02');
  });

  it('reads month then day from two strings of digits, as two form fields hand them over', () => {
    expect(monthDay('10', '17').toString()).toBe('10-17');
    expect(monthDay('02', '29').toString()).toBe('02-29');
    expect(monthDay('10', 17).toString()).toBe('10-17');
  });

  it('reads a string with spaces around it', () => {
    expect(monthDay(' 10/17 ').toString()).toBe('10-17');
    expect(monthDay('10-17\n').toString()).toBe('10-17');
  });

  it("reads the ISO 8601 form with two leading dashes, '--10-17'", () => {
    expect(monthDay('--10-17').toString()).toBe('10-17');
  });

  it('accepts February 29', () => {
    expect(monthDay(2, 29)).toMatchObject({ month: 2, day: 29 });
    expect(monthDay('02-29').toString()).toBe('02-29');
  });

  it('drops the year from a date string, a CalendarDate, date fields and a Temporal.PlainDate', () => {
    expect(monthDay('1990-10-17').toString()).toBe('10-17');
    expect(monthDay(date('1990-10-17')).toString()).toBe('10-17');
    expect(monthDay({ year: 1990, month: 10, day: 17 }).toString()).toBe('10-17');
    expect(monthDay(Temporal.PlainDate.from('1990-10-17')).toString()).toBe('10-17');
  });

  it('reads a moment as the month and day it falls on in the zone asked for', () => {
    const moment = datetime('2026-10-18T02:00:00Z');
    expect(monthDay(moment, 'America/Los_Angeles').toString()).toBe('10-17');
    expect(monthDay(moment, 'Asia/Tokyo').toString()).toBe('10-18');
    expect(monthDay(new Date('2026-10-18T02:00:00Z'), { zone: 'America/Los_Angeles' }).toString()).toBe('10-17');
    expect(monthDay('2026-10-18T02:00:00Z', 'America/Los_Angeles').toString()).toBe('10-17');
  });

  it("reads a DateTime in the DateTime's own zone when no zone is passed", () => {
    expect(monthDay(datetime('2026-10-18T02:00:00Z', 'America/Los_Angeles')).toString()).toBe('10-17');
  });

  it('wraps a Temporal.PlainMonthDay and reads another MonthDay as the same month and day', () => {
    expect(monthDay(Temporal.PlainMonthDay.from('10-17')).toString()).toBe('10-17');
    expect(monthDay(monthDay(10, 17)).toString()).toBe('10-17');
  });

  it('reads a slash or dot string day-first with { dayFirst: true }', () => {
    expect(monthDay('17/10', { dayFirst: true }).toString()).toBe('10-17');
    expect(monthDay('06.05', { dayFirst: true }).toString()).toBe('05-06');
  });

  it('carries the locale passed in options', () => {
    expect(monthDay('10-17', { locale: 'fr' }).locale()).toBe('fr');
  });

  it('throws missingMonthDay for undefined or null, so a missing field never becomes today', () => {
    expect(() => monthDay()).toThrowError(expect.objectContaining({ name: 'TypeError', code: 'missingMonthDay' }));
    expect(() => monthDay(null)).toThrowError(expect.objectContaining({ name: 'TypeError', code: 'missingMonthDay' }));
  });

  it('throws invalidMonthDay for a single number or a boolean', () => {
    expect(() => monthDay(10)).toThrowError(expect.objectContaining({ code: 'invalidMonthDay', at: '10' }));
    expect(() => monthDay(true)).toThrowError(expect.objectContaining({ code: 'invalidMonthDay', at: 'true' }));
  });

  it('throws invalidMonthDay at the string when the month is past 12, never reading it as the day', () => {
    expect(() => monthDay('17/10')).toThrowError(expect.objectContaining({ code: 'invalidMonthDay', at: '17/10' }));
    expect(() => monthDay('13-01')).toThrowError(expect.objectContaining({ code: 'invalidMonthDay', at: '13-01' }));
  });

  it('throws invalidMonthDay for a day its month never has', () => {
    expect(() => monthDay(4, 31)).toThrowError(
      expect.objectContaining({ code: 'invalidMonthDay', at: expect.stringContaining('31') }),
    );
    expect(() => monthDay({ month: 2, day: 30 })).toThrowError(
      expect.objectContaining({ code: 'invalidMonthDay', at: expect.stringContaining('30') }),
    );
    expect(() => monthDay('04/31')).toThrowError(expect.objectContaining({ code: 'invalidMonthDay', at: '04/31' }));
  });

  it('throws invalidMonthDay for a fractional month or day', () => {
    expect(() => monthDay(10.5, 17)).toThrowError(
      expect.objectContaining({ code: 'invalidMonthDay', at: expect.stringContaining('10.5') }),
    );
    expect(() => monthDay(10, 17.5)).toThrowError(
      expect.objectContaining({ code: 'invalidMonthDay', at: expect.stringContaining('17.5') }),
    );
  });

  it('throws invalidMonthDay at the string for text that is not a month and day', () => {
    expect(() => monthDay('whenever')).toThrowError(
      expect.objectContaining({ code: 'invalidMonthDay', at: 'whenever' }),
    );
    expect(() => monthDay('')).toThrowError(expect.objectContaining({ code: 'invalidMonthDay', at: '' }));
    expect(() => monthDay('2026-10')).toThrowError(expect.objectContaining({ code: 'invalidMonthDay', at: '2026-10' }));
    expect(() => monthDay('10/17/2026')).toThrowError(
      expect.objectContaining({ code: 'invalidMonthDay', at: '10/17/2026' }),
    );
  });

  it('throws invalidMonthDay at a month name, which is read only with { loose: true }', () => {
    expect(() => monthDay('Oct 17')).toThrowError(expect.objectContaining({ code: 'invalidMonthDay', at: 'Oct 17' }));
  });

  it('throws invalidMonthDay for fields that leave out the month or the day', () => {
    expect(() => monthDay({ month: 10 })).toThrowError(expect.objectContaining({ code: 'invalidMonthDay' }));
    expect(() => monthDay({ day: 17 })).toThrowError(expect.objectContaining({ code: 'invalidMonthDay' }));
  });

  it('throws unsupportedCalendar for a Temporal.PlainMonthDay in a calendar other than ISO 8601', () => {
    const hebrew = Temporal.PlainMonthDay.from({ monthCode: 'M05', day: 1, calendar: 'hebrew' });
    expect(() => monthDay(hebrew)).toThrowError(
      expect.objectContaining({ name: 'TypeError', code: 'unsupportedCalendar' }),
    );
  });

  it('throws unknownZone at the zone when the zone asked for does not exist', () => {
    expect(() => monthDay('2026-10-18T02:00:00Z', 'Mars/Phobos')).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'unknownZone', at: 'Mars/Phobos' }),
    );
  });

  it('throws missingPlugin at loose when { loose: true } is passed without the loose plugin imported', () => {
    expect(() => monthDay('Oct 17', { loose: true })).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'missingPlugin', at: 'loose' }),
    );
    expect(() => new MonthDay('Oct 17', { loose: true })).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'missingPlugin', at: 'loose' }),
    );
  });

  // refused today with unknownUnit at 'text', the property every value carries
  it.todo('reads the fields a MonthDay spreads into, as one comes back from structuredClone() or a spread');
});

describe('dayMonth()', () => {
  it('reads day then month from two numbers and from a string with a slash or dot', () => {
    expect(dayMonth(17, 10).toString()).toBe('10-17');
    expect(dayMonth('17/10').toString()).toBe('10-17');
    expect(dayMonth('17.10').toString()).toBe('10-17');
    expect(dayMonth('06.05').toString()).toBe('05-06');
  });

  it('reads a single-digit day and month across a dash day-first', () => {
    expect(dayMonth('5-6').toString()).toBe('06-05');
  });

  it('reads two digits, a dash and two digits month-first, the form toString() and toJSON() write', () => {
    expect(dayMonth('10-17').toString()).toBe('10-17');
    expect(dayMonth('05-06').toString()).toBe('05-06');
    expect(monthDay('05-06', { dayFirst: true }).toString()).toBe('05-06');
  });

  it('reads day then month from two strings of digits, as two form fields hand them over', () => {
    expect(dayMonth('17', '10').toString()).toBe('10-17');
    expect(dayMonth('29', '02').toString()).toBe('02-29');
  });

  it('reads a string day-first and carries the locale when given options', () => {
    const birthday = dayMonth('17/10', { locale: 'fr' });
    expect(birthday.toString()).toBe('10-17');
    expect(birthday.locale()).toBe('fr');
  });

  // two zones a day apart, so no machine zone gives both answers if the zone asked for is dropped
  it('reads a moment as the month and day it falls on in the zone asked for', () => {
    const moment = new Date('2026-10-18T02:00:00Z');
    expect(dayMonth(moment, 'America/Los_Angeles').toString()).toBe('10-17');
    expect(dayMonth(moment, 'Asia/Tokyo').toString()).toBe('10-18');
  });

  it('accepts February 29 written day-first', () => {
    expect(dayMonth(29, 2).toString()).toBe('02-29');
    expect(dayMonth('29/02').toString()).toBe('02-29');
  });

  it('reads fields, dates and moments the way monthDay() does', () => {
    expect(dayMonth({ month: 10, day: 17 }).toString()).toBe('10-17');
    expect(dayMonth('1990-10-17').toString()).toBe('10-17');
    expect(dayMonth(new Date('2026-10-18T02:00:00Z'), 'America/Los_Angeles').toString()).toBe('10-17');
  });

  it('throws invalidMonthDay at the string when the month is past 12, never reading it as the day', () => {
    expect(() => dayMonth('10/17')).toThrowError(expect.objectContaining({ code: 'invalidMonthDay', at: '10/17' }));
  });

  it('throws invalidMonthDay for a day its month never has', () => {
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
  it('is what monthDay(), dayMonth() and new MonthDay() return', () => {
    expect(monthDay(10, 17)).toBeInstanceOf(MonthDay);
    expect(dayMonth(17, 10)).toBeInstanceOf(MonthDay);
    expect(new MonthDay(10, 17).toString()).toBe('10-17');
    expect(isMonthDay(monthDay(10, 17))).toBe(true);
    expect(isMonthDay('10-17')).toBe(false);
  });

  it('is read off a CalendarDate or a DateTime with .monthDay and as("monthDay")', () => {
    const moment = datetime('2026-10-18T02:00:00Z', 'America/Los_Angeles');
    expect(date('1990-10-17').monthDay.toString()).toBe('10-17');
    expect(date('1990-10-17').as('monthDay').toString()).toBe('10-17');
    expect(moment.monthDay.toString()).toBe('10-17');
    expect(moment.as('monthDay').toString()).toBe('10-17');
  });

  it('holds its month and day as numbers counted from 1', () => {
    expect(monthDay('01-09')).toMatchObject({ month: 1, day: 9 });
    expect(monthDay('12-31')).toMatchObject({ month: 12, day: 31 });
  });

  it('prints its month and day in text, in the locale it carries', () => {
    expect(monthDay('10-17', { locale: 'en-US' }).text).toBe('Oct 17');
    expect(monthDay('02-29', { locale: 'en-US' }).text).toBe('Feb 29');
  });

  it('writes text in the language of the locale it carries', () => {
    expect(monthDay(10, 17).locale('ja').text).toBe('10月17日');
    expect(monthDay('10-17', { locale: 'fr' }).text).toBe('17 oct.');
  });

  it('cannot be changed after it is made', () => {
    const birthday = monthDay(10, 17);
    expect(() => {
      birthday.month = 1;
    }).toThrowError(TypeError);
    expect(birthday.toString()).toBe('10-17');
  });
});

describe('MonthDay.in()', () => {
  it('places the month and day in a year as a CalendarDate', () => {
    const placed = monthDay(10, 17).in(2027);
    expect(placed).toBeInstanceOf(CalendarDate);
    expect(placed.toString()).toBe('2027-10-17');
  });

  it('accepts the year as a string of digits', () => {
    expect(monthDay(10, 17).in('2027').toString()).toBe('2027-10-17');
  });

  it('lands February 29 on February 28 in a year with no leap day', () => {
    expect(monthDay(2, 29).in(2027).toString()).toBe('2027-02-28');
    expect(monthDay(2, 29).in(1900).toString()).toBe('1900-02-28');
  });

  it('keeps February 29 in a leap year', () => {
    expect(monthDay(2, 29).in(2028).toString()).toBe('2028-02-29');
    expect(monthDay(2, 29).in(2000).toString()).toBe('2000-02-29');
  });

  it('throws invalidYear for a fractional year, text that is not a year, or no year', () => {
    expect(() => monthDay(10, 17).in(2027.5)).toThrowError(
      expect.objectContaining({ code: 'invalidYear', at: expect.stringContaining('2027.5') }),
    );
    expect(() => monthDay(10, 17).in('next year')).toThrowError(
      expect.objectContaining({ code: 'invalidYear', at: expect.stringContaining('next year') }),
    );
    expect(() => monthDay(10, 17).in()).toThrowError(expect.objectContaining({ code: 'invalidYear' }));
  });

  it('throws invalidYear for a year past what Temporal can hold', () => {
    expect(() => monthDay(10, 17).in(300000)).toThrowError(
      expect.objectContaining({ code: 'invalidYear', at: expect.stringContaining('300000') }),
    );
  });
});

describe('MonthDay.next() and after()', () => {
  it('returns the date in the same year when it is still ahead of the reference date', () => {
    expect(monthDay(10, 17).next('2026-05-01').toString()).toBe('2026-10-17');
    expect(monthDay(10, 17).after('2026-10-16').toString()).toBe('2026-10-17');
  });

  it('returns the date in the following year when the reference date is that month and day', () => {
    expect(monthDay(10, 17).next('2026-10-17').toString()).toBe('2027-10-17');
    expect(monthDay(10, 17).after('2026-10-17').toString()).toBe('2027-10-17');
  });

  it('returns the date in the following year when it has already passed', () => {
    expect(monthDay(10, 17).next('2026-11-16').toString()).toBe('2027-10-17');
    expect(monthDay(1, 1).next('2026-12-31').toString()).toBe('2027-01-01');
  });

  it('returns a CalendarDate', () => {
    expect(monthDay(10, 17).next('2026-05-01')).toBeInstanceOf(CalendarDate);
    expect(monthDay(10, 17).after('2026-05-01')).toBeInstanceOf(CalendarDate);
  });

  it('accepts a CalendarDate, date fields, a Temporal.PlainDate and a DateTime as the reference date', () => {
    const birthday = monthDay(10, 17);
    expect(birthday.next(date('2026-05-01')).toString()).toBe('2026-10-17');
    expect(birthday.next({ year: 2026, month: 5, day: 1 }).toString()).toBe('2026-10-17');
    expect(birthday.next(Temporal.PlainDate.from('2026-05-01')).toString()).toBe('2026-10-17');
    expect(birthday.next(datetime('2026-10-18T02:00:00Z', 'America/Los_Angeles')).toString()).toBe('2027-10-17');
  });

  it('gives February 29 its February 28 date in a year with no leap day and February 29 in a leap year', () => {
    expect(monthDay(2, 29).after('2026-03-01').toString()).toBe('2027-02-28');
    expect(monthDay(2, 29).after('2027-03-01').toString()).toBe('2028-02-29');
  });

  it('moves February 29 on to the following year from the February 28 it falls on', () => {
    expect(monthDay(2, 29).next('2027-02-28').toString()).toBe('2028-02-29');
  });

  it('steps February 29 forward one day from February 28 of a leap year', () => {
    expect(monthDay(2, 29).next('2028-02-28').toString()).toBe('2028-02-29');
  });

  it('gives the same answer from date.next(monthDay)', () => {
    expect(date('2026-11-16').next(monthDay(10, 17)).toString()).toBe('2027-10-17');
    expect(date('2026-05-01').next(monthDay(10, 17)).toString()).toBe('2026-10-17');
  });

  // real clock on purpose: a later describe holds the clock still, this proves next() reads the real one
  // next() is read before today() so a run across midnight stays inside the bounds
  it('counts next() from a day within the coming year when given no date', () => {
    const upcoming = monthDay(10, 17).next();
    const daysAway = today().until(upcoming, 'days');
    expect(daysAway).toBeGreaterThanOrEqual(0);
    expect(daysAway).toBeLessThanOrEqual(366);
  });

  it('throws missingDate from after() when given no date, where next() counts from today', () => {
    expect(() => monthDay(10, 17).after()).toThrowError(
      expect.objectContaining({ name: 'TypeError', code: 'missingDate' }),
    );
  });

  it('throws invalidDate at the value when the reference date has no year, names a weekday or cannot be read', () => {
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

describe('MonthDay.previous(), last() and before()', () => {
  it('returns the date in the same year when it has already passed', () => {
    expect(monthDay(10, 17).previous('2026-11-16').toString()).toBe('2026-10-17');
    expect(monthDay(10, 17).before('2026-10-18').toString()).toBe('2026-10-17');
  });

  it('returns the date in the year before when the reference date is that month and day', () => {
    expect(monthDay(10, 17).previous('2026-10-17').toString()).toBe('2025-10-17');
    expect(monthDay(10, 17).before('2026-10-17').toString()).toBe('2025-10-17');
  });

  it('returns the date in the year before when it is still ahead of the reference date', () => {
    expect(monthDay(10, 17).before('2026-10-01').toString()).toBe('2025-10-17');
    expect(monthDay(12, 31).previous('2026-01-01').toString()).toBe('2025-12-31');
  });

  it('gives the same answer from last() as from previous()', () => {
    expect(monthDay(10, 17).last('2026-11-16').toString()).toBe('2026-10-17');
    expect(monthDay(10, 17).last('2026-10-17').toString()).toBe('2025-10-17');
  });

  it('gives February 29 its February 28 date in a year with no leap day and February 29 in a leap year', () => {
    expect(monthDay(2, 29).previous('2027-03-01').toString()).toBe('2027-02-28');
    expect(monthDay(2, 29).previous('2028-03-01').toString()).toBe('2028-02-29');
  });

  it('moves February 29 back to the year before from the February 28 it falls on', () => {
    expect(monthDay(2, 29).previous('2027-02-28').toString()).toBe('2026-02-28');
  });

  it('gives the same answer from date.previous(monthDay)', () => {
    expect(date('2026-11-16').previous(monthDay(10, 17)).toString()).toBe('2026-10-17');
    expect(date('2026-10-17').previous(monthDay(10, 17)).toString()).toBe('2025-10-17');
  });

  // real clock on purpose, and today() is read first for the same midnight reason as next() above
  it('counts previous() back to a day within the past year when given no date', () => {
    const from = today();
    const daysAgo = monthDay(10, 17).previous().until(from, 'days');
    expect(daysAgo).toBeGreaterThanOrEqual(0);
    expect(daysAgo).toBeLessThanOrEqual(366);
  });

  it('throws missingDate from before() when given no date, where previous() counts from today', () => {
    expect(() => monthDay(10, 17).before()).toThrowError(
      expect.objectContaining({ name: 'TypeError', code: 'missingDate' }),
    );
  });
});

describe('MonthDay.next(), previous() and last() counted from today', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date', 'Temporal'], now: new Date('2026-11-18T12:00:00Z') });
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('counts next() forward from today', () => {
    expect(monthDay(12, 25).next().toString()).toBe('2026-12-25');
    expect(monthDay(10, 17).next().toString()).toBe('2027-10-17');
  });

  it('counts previous() and last() back from today', () => {
    expect(monthDay(10, 17).previous().toString()).toBe('2026-10-17');
    expect(monthDay(12, 25).previous().toString()).toBe('2025-12-25');
    expect(monthDay(12, 25).last().toString()).toBe('2025-12-25');
  });
});

describe('MonthDay.fallsOn() and isOn()', () => {
  it('is true on that month and day of any year and false on every other day', () => {
    const birthday = monthDay(10, 17);
    expect(birthday.fallsOn('2026-10-17')).toBe(true);
    expect(birthday.fallsOn('1990-10-17')).toBe(true);
    expect(birthday.fallsOn('2026-10-18')).toBe(false);
    expect(birthday.fallsOn('2026-11-17')).toBe(false);
  });

  it('is true for February 29 on February 28 of a year with no leap day', () => {
    expect(monthDay(2, 29).fallsOn('2027-02-28')).toBe(true);
    expect(monthDay(2, 29).fallsOn('2027-03-01')).toBe(false);
  });

  it('is true for February 29 only on February 29 of a leap year', () => {
    expect(monthDay(2, 29).fallsOn('2028-02-29')).toBe(true);
    expect(monthDay(2, 29).fallsOn('2028-02-28')).toBe(false);
  });

  it('is true for February 28 on February 28 of every year and never on February 29', () => {
    expect(monthDay(2, 28).fallsOn('2027-02-28')).toBe(true);
    expect(monthDay(2, 28).fallsOn('2028-02-28')).toBe(true);
    expect(monthDay(2, 28).fallsOn('2028-02-29')).toBe(false);
  });

  it('accepts a CalendarDate, date fields and a Temporal.PlainDate', () => {
    const birthday = monthDay(10, 17);
    expect(birthday.fallsOn(date('2026-10-17'))).toBe(true);
    expect(birthday.fallsOn({ year: 2026, month: 10, day: 17 })).toBe(true);
    expect(birthday.fallsOn(Temporal.PlainDate.from('2026-10-17'))).toBe(true);
  });

  it("reads a DateTime as the day it falls on in the DateTime's own zone", () => {
    const moment = datetime('2026-10-18T02:00:00Z', 'America/Los_Angeles');
    expect(monthDay(10, 17).fallsOn(moment)).toBe(true);
    expect(monthDay(10, 18).fallsOn(moment)).toBe(false);
  });

  it('gives the same answer from isOn()', () => {
    expect(monthDay(2, 29).isOn('2027-02-28')).toBe(true);
    expect(monthDay(2, 29).isOn('2028-02-28')).toBe(false);
  });

  it('throws missingDate when given no date and invalidDate at a string with no year', () => {
    expect(() => monthDay(10, 17).fallsOn()).toThrowError(
      expect.objectContaining({ name: 'TypeError', code: 'missingDate' }),
    );
    expect(() => monthDay(10, 17).fallsOn('10-17')).toThrowError(
      expect.objectContaining({ code: 'invalidDate', at: '10-17' }),
    );
  });
});

describe('MonthDay.equals()', () => {
  it('is true for the same month and day as a MonthDay, an ISO string, fields or a Temporal.PlainMonthDay', () => {
    const birthday = monthDay(10, 17);
    expect(birthday.equals(monthDay('10-17'))).toBe(true);
    expect(birthday.equals(dayMonth('17/10'))).toBe(true);
    expect(birthday.equals('10-17')).toBe(true);
    expect(birthday.equals({ month: 10, day: 17 })).toBe(true);
    expect(birthday.equals(Temporal.PlainMonthDay.from('10-17'))).toBe(true);
  });

  it('is false for another month or day', () => {
    expect(monthDay(10, 17).equals('10-18')).toBe(false);
    expect(monthDay(10, 17).equals(monthDay(11, 17))).toBe(false);
  });

  it('reads a date or a moment as its month and day, whatever the year', () => {
    expect(monthDay(10, 17).equals('1990-10-17')).toBe(true);
    expect(monthDay(10, 17).equals(date('2026-10-17'))).toBe(true);
    expect(monthDay(10, 17).equals(datetime('2026-10-18T02:00:00Z', 'America/Los_Angeles'))).toBe(true);
    expect(monthDay(10, 17).equals('1990-10-18')).toBe(false);
  });

  it('does not count February 29 as equal to the February 28 it falls on', () => {
    expect(monthDay(2, 29).equals('2027-02-28')).toBe(false);
    expect(monthDay(2, 29).equals(monthDay(2, 28))).toBe(false);
  });

  it('ignores the locale each value carries', () => {
    expect(monthDay(10, 17).locale('fr').equals(monthDay(10, 17))).toBe(true);
    expect(monthDay(10, 17).locale('fr').equals(monthDay(10, 17).locale('ja'))).toBe(true);
  });

  it('throws invalidMonthDay at a slash, dot or single-digit string, which could be read in either order', () => {
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

  it('throws invalidMonthDay at text that is not a month and day', () => {
    expect(() => monthDay(10, 17).equals('whenever')).toThrowError(
      expect.objectContaining({ code: 'invalidMonthDay', at: 'whenever' }),
    );
  });
});

describe('MonthDay.isToday(), isTomorrow() and isYesterday()', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date', 'Temporal'], now: new Date('2026-10-17T12:00:00Z') });
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('is true for the month and day of today, tomorrow and yesterday and false for the days around them', () => {
    expect(monthDay(10, 17).isToday('UTC')).toBe(true);
    expect(monthDay(10, 18).isToday('UTC')).toBe(false);
    expect(monthDay(10, 18).isTomorrow('UTC')).toBe(true);
    expect(monthDay(10, 17).isTomorrow('UTC')).toBe(false);
    expect(monthDay(10, 16).isYesterday('UTC')).toBe(true);
    expect(monthDay(10, 17).isYesterday('UTC')).toBe(false);
  });

  it('reads today in the zone asked for', () => {
    vi.setSystemTime(new Date('2026-10-18T02:00:00Z'));
    expect(monthDay(10, 17).isToday('America/Los_Angeles')).toBe(true);
    expect(monthDay(10, 17).isToday('Asia/Tokyo')).toBe(false);
    expect(monthDay(10, 18).isToday('Asia/Tokyo')).toBe(true);
    expect(monthDay(10, 18).isTomorrow('America/Los_Angeles')).toBe(true);
    expect(monthDay(10, 17).isYesterday('Asia/Tokyo')).toBe(true);
  });

  // two zones a day apart, so no machine zone gives both answers if the zone asked for is dropped
  it('reads tomorrow and yesterday in the zone asked for', () => {
    vi.setSystemTime(new Date('2026-10-18T02:00:00Z'));
    expect(monthDay(10, 18).isTomorrow('America/Los_Angeles')).toBe(true);
    expect(monthDay(10, 19).isTomorrow('Asia/Tokyo')).toBe(true);
    expect(monthDay(10, 18).isTomorrow('Asia/Tokyo')).toBe(false);
    expect(monthDay(10, 16).isYesterday('America/Los_Angeles')).toBe(true);
    expect(monthDay(10, 17).isYesterday('Asia/Tokyo')).toBe(true);
    expect(monthDay(10, 17).isYesterday('America/Los_Angeles')).toBe(false);
  });

  it('counts February 29 as today on February 28 of a year with no leap day', () => {
    vi.setSystemTime(new Date('2027-02-28T12:00:00Z'));
    expect(monthDay(2, 29).isToday('UTC')).toBe(true);
    expect(monthDay(2, 29).isTomorrow('UTC')).toBe(false);
  });

  it('counts February 29 as tomorrow, not today, on February 28 of a leap year', () => {
    vi.setSystemTime(new Date('2028-02-28T12:00:00Z'));
    expect(monthDay(2, 29).isToday('UTC')).toBe(false);
    expect(monthDay(2, 29).isTomorrow('UTC')).toBe(true);
  });

  it('is true for January 1 as tomorrow on December 31 and for December 31 as yesterday on January 1', () => {
    vi.setSystemTime(new Date('2026-12-31T12:00:00Z'));
    expect(monthDay(1, 1).isTomorrow('UTC')).toBe(true);
    vi.setSystemTime(new Date('2027-01-01T12:00:00Z'));
    expect(monthDay(12, 31).isYesterday('UTC')).toBe(true);
  });

  it('throws unknownZone at the zone when the zone asked for does not exist', () => {
    expect(() => monthDay(10, 17).isToday('Mars/Phobos')).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'unknownZone', at: 'Mars/Phobos' }),
    );
  });
});

describe('MonthDay under <, >, unary + and compare()', () => {
  it('throws unsupportedComparison at the value from <, >, unary + and valueOf()', () => {
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

  it('throws invalidPoint from compare(), so a list of month-days is never sorted by accident', () => {
    expect(() => [monthDay(10, 17), monthDay(5, 1)].sort(compare)).toThrowError(
      expect.objectContaining({ code: 'invalidPoint' }),
    );
  });
});

describe('MonthDay.locale() and lang()', () => {
  it('reads undefined until a locale is set', () => {
    expect(monthDay(5, 1).locale()).toBeUndefined();
    expect(monthDay(5, 1).lang()).toBeUndefined();
  });

  it('returns a new MonthDay carrying the tag and leaves the original without one', () => {
    const labourDay = monthDay(5, 1);
    const russian = labourDay.locale('ru');
    expect(russian.locale()).toBe('ru');
    expect(russian.toString()).toBe('05-01');
    expect(labourDay.locale()).toBeUndefined();
  });

  it('sets and reads the same tag through lang()', () => {
    expect(monthDay(5, 1).lang('fr').lang()).toBe('fr');
    expect(monthDay(5, 1).lang('fr').locale()).toBe('fr');
  });

  it('clears the tag with null, undefined or an empty string', () => {
    const russian = monthDay(5, 1).locale('ru');
    expect(russian.locale(null).locale()).toBeUndefined();
    expect(russian.locale(undefined).locale()).toBeUndefined();
    expect(russian.locale('').locale()).toBeUndefined();
  });

  it('passes the tag on to the dates it produces with in(), next() and previous()', () => {
    const russian = monthDay(5, 1).locale('ru');
    expect(russian.in(2026).locale()).toBe('ru');
    expect(russian.next('2026-01-01').locale()).toBe('ru');
    expect(russian.previous('2026-01-01').locale()).toBe('ru');
  });

  it('keeps the tag of a MonthDay or CalendarDate it is read from', () => {
    expect(monthDay(monthDay(5, 1).locale('ru')).locale()).toBe('ru');
    expect(monthDay(date('2026-05-01').locale('ru')).locale()).toBe('ru');
  });

  it('throws unknownLocale at the tag when it is not a locale', () => {
    expect(() => monthDay(5, 1).locale('not a locale')).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'unknownLocale', at: 'not a locale' }),
    );
  });
});

describe('MonthDay.format()', () => {
  it('prints the same text as the text property when given no format', () => {
    const birthday = monthDay('10-17', { locale: 'en-US' });
    expect(birthday.format()).toBe('Oct 17');
    expect(birthday.format()).toBe(birthday.text);
  });

  it('throws unsupportedToken for a year, weekday or clock token, which a month-day cannot fill', () => {
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

describe('MonthDay.as()', () => {
  it("returns the same MonthDay for 'monthDay'", () => {
    const birthday = monthDay(10, 17);
    expect(birthday.as('monthDay')).toBe(birthday);
  });

  it('throws unknownKind at the kind for a date or a year-month, which need a year', () => {
    expect(() => monthDay(10, 17).as('date')).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'unknownKind', at: 'date' }),
    );
    expect(() => monthDay(10, 17).as('yearMonth')).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'unknownKind', at: 'yearMonth' }),
    );
  });
});

describe('MonthDay.toString(), toJSON() and toTemporal()', () => {
  it("writes two digits for the month and the day, as 'MM-DD'", () => {
    expect(monthDay(5, 6).toString()).toBe('05-06');
    expect(monthDay(10, 17).toString()).toBe('10-17');
    expect(monthDay(2, 29).toString()).toBe('02-29');
  });

  it('writes the same string into JSON', () => {
    expect(monthDay(5, 6).toJSON()).toBe('05-06');
    expect(JSON.stringify({ birthday: monthDay(10, 17) })).toBe('{"birthday":"10-17"}');
  });

  it('joins into a string or a template as that same string', () => {
    const birthday = monthDay(10, 17);
    expect(String(birthday)).toBe('10-17');
    expect(`${birthday}`).toBe('10-17');
    expect('born on ' + birthday).toBe('born on 10-17');
  });

  it('reads every day of the year back from its own string as the same month and day', () => {
    const daysInMonth = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    daysInMonth.forEach((days, index) => {
      for (let day = 1; day <= days; day++) {
        const written = monthDay(index + 1, day);
        expect(monthDay(written.toString())).toMatchObject({ month: index + 1, day });
        expect(monthDay(JSON.parse(JSON.stringify(written)))).toMatchObject({ month: index + 1, day });
      }
    });
  });

  it('reads every day of the year back from its own string under dayMonth() too', () => {
    const daysInMonth = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    daysInMonth.forEach((days, index) => {
      for (let day = 1; day <= days; day++) {
        const written = monthDay(index + 1, day);
        expect(dayMonth(written.toString())).toMatchObject({ month: index + 1, day });
        expect(dayMonth(JSON.parse(JSON.stringify(written)))).toMatchObject({ month: index + 1, day });
      }
    });
  });

  it('returns a Temporal.PlainMonthDay in the ISO 8601 calendar that reads back as the same value', () => {
    const plain = monthDay(10, 17).toTemporal();
    expect(plain).toBeInstanceOf(Temporal.PlainMonthDay);
    expect(plain.calendarId).toBe('iso8601');
    expect(plain.monthCode).toBe('M10');
    expect(plain.day).toBe(17);
    expect(monthDay(plain).toString()).toBe('10-17');
  });
});
