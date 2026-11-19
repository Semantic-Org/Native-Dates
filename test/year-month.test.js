import {
  CalendarDate,
  compare,
  date,
  datetime,
  Duration,
  earliest,
  isYearMonth,
  latest,
  months,
  monthYear,
  today,
  YearMonth,
  yearMonth,
} from 'native-dates';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('yearMonth()', () => {
  it('parses year and month from two numbers, a fields object, or a dash-, slash-, or dot-separated string', () => {
    expect(yearMonth(2026, 11).toString()).toBe('2026-11');
    expect(yearMonth({ year: 2026, month: 11 }).toString()).toBe('2026-11');
    expect(yearMonth('2026-11').toString()).toBe('2026-11');
    expect(yearMonth('2026/11').toString()).toBe('2026-11');
    expect(yearMonth('2026.11').toString()).toBe('2026-11');
  });

  it('parses single-digit months', () => {
    expect(yearMonth('2026-5').toString()).toBe('2026-05');
    expect(yearMonth(2026, 5).toString()).toBe('2026-05');
  });

  it('parses year and month from two numeric strings', () => {
    expect(yearMonth('2026', '11').toString()).toBe('2026-11');
    expect(yearMonth('2026', '05').toString()).toBe('2026-05');
    expect(yearMonth('2026', 11).toString()).toBe('2026-11');
  });

  it('trims surrounding whitespace on input strings', () => {
    expect(yearMonth(' 2026-11 ').toString()).toBe('2026-11');
    expect(yearMonth('2026-11\n').toString()).toBe('2026-11');
  });

  it('extracts year and month from an ISO date string, CalendarDate, date fields, or Temporal.PlainDate', () => {
    expect(yearMonth('2026-11-16').toString()).toBe('2026-11');
    expect(yearMonth(date('2026-11-16')).toString()).toBe('2026-11');
    expect(yearMonth({ year: 2026, month: 11, day: 16 }).toString()).toBe('2026-11');
    expect(yearMonth(Temporal.PlainDate.from('2026-11-16')).toString()).toBe('2026-11');
  });

  it('resolves a DateTime, Date, or instant string in the specified timezone', () => {
    const instant = datetime('2026-11-01T02:00:00Z');
    expect(yearMonth(instant, 'America/Los_Angeles').toString()).toBe('2026-10');
    expect(yearMonth(instant, 'Asia/Tokyo').toString()).toBe('2026-11');
    expect(yearMonth(new Date('2026-11-01T02:00:00Z'), { zone: 'America/Los_Angeles' }).toString()).toBe('2026-10');
    expect(yearMonth('2026-11-01T02:00:00Z', 'America/Los_Angeles').toString()).toBe('2026-10');
  });

  it('uses the DateTime timezone when no timezone override is passed', () => {
    expect(yearMonth(datetime('2026-11-01T02:00:00Z', 'America/Los_Angeles')).toString()).toBe('2026-10');
  });

  it('wraps a Temporal.PlainYearMonth or clones an existing YearMonth', () => {
    expect(yearMonth(Temporal.PlainYearMonth.from('2026-11')).toString()).toBe('2026-11');
    expect(yearMonth(yearMonth(2026, 11)).toString()).toBe('2026-11');
  });

  it('attaches the locale passed in options', () => {
    expect(yearMonth('2026-11', { locale: 'fr' }).locale()).toBe('fr');
  });

  it('throws TypeError with missingYearMonth for undefined or null', () => {
    expect(() => yearMonth()).toThrowError(expect.objectContaining({ name: 'TypeError', code: 'missingYearMonth' }));
    expect(() => yearMonth(null)).toThrowError(
      expect.objectContaining({ name: 'TypeError', code: 'missingYearMonth' }),
    );
  });

  it('throws invalidYearMonth for a single number or boolean', () => {
    expect(() => yearMonth(2026)).toThrowError(expect.objectContaining({ code: 'invalidYearMonth', at: '2026' }));
    expect(() => yearMonth(true)).toThrowError(expect.objectContaining({ code: 'invalidYearMonth', at: 'true' }));
  });

  it('throws invalidYearMonth when month is outside 1..12', () => {
    expect(() => yearMonth('2026-13')).toThrowError(
      expect.objectContaining({ code: 'invalidYearMonth', at: '2026-13' }),
    );
    expect(() => yearMonth('2026-00')).toThrowError(
      expect.objectContaining({ code: 'invalidYearMonth', at: '2026-00' }),
    );
    expect(() => yearMonth(2026, 13)).toThrowError(
      expect.objectContaining({ code: 'invalidYearMonth', at: expect.stringContaining('13') }),
    );
    expect(() => yearMonth({ year: 2026, month: 0 })).toThrowError(
      expect.objectContaining({ code: 'invalidYearMonth' }),
    );
  });

  it('throws invalidYearMonth for fractional year or month numbers', () => {
    expect(() => yearMonth(2026, 5.5)).toThrowError(
      expect.objectContaining({ code: 'invalidYearMonth', at: expect.stringContaining('5.5') }),
    );
    expect(() => yearMonth(2026.5, 5)).toThrowError(
      expect.objectContaining({ code: 'invalidYearMonth', at: expect.stringContaining('2026.5') }),
    );
  });

  it('throws invalidYearMonth for invalid strings or year-only strings', () => {
    expect(() => yearMonth('not-a-month')).toThrowError(
      expect.objectContaining({ code: 'invalidYearMonth', at: 'not-a-month' }),
    );
    expect(() => yearMonth('')).toThrowError(expect.objectContaining({ code: 'invalidYearMonth', at: '' }));
    expect(() => yearMonth('2026')).toThrowError(expect.objectContaining({ code: 'invalidYearMonth', at: '2026' }));
  });

  it("throws invalidYearMonth for two-digit card expiry strings such as '11/26'", () => {
    expect(() => yearMonth('11/26')).toThrowError(expect.objectContaining({ code: 'invalidYearMonth', at: '11/26' }));
  });

  it('throws invalidYearMonth for named-month strings without { loose: true }', () => {
    expect(() => yearMonth('Nov 2026')).toThrowError(
      expect.objectContaining({ code: 'invalidYearMonth', at: 'Nov 2026' }),
    );
  });

  it('throws invalidYearMonth for incomplete fields objects missing year or month', () => {
    expect(() => yearMonth({ year: 2026 })).toThrowError(expect.objectContaining({ code: 'invalidYearMonth' }));
    expect(() => yearMonth({ month: 11 })).toThrowError(expect.objectContaining({ code: 'invalidYearMonth' }));
  });

  it('throws unsupportedCalendar for a non-ISO Temporal.PlainYearMonth', () => {
    const hebrew = Temporal.PlainYearMonth.from({ year: 5787, monthCode: 'M02', calendar: 'hebrew' });
    expect(() => yearMonth(hebrew)).toThrowError(
      expect.objectContaining({ name: 'TypeError', code: 'unsupportedCalendar' }),
    );
  });

  it('throws unknownZone for an unrecognized timezone', () => {
    expect(() => yearMonth('2026-11-01T02:00:00Z', 'Mars/Phobos')).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'unknownZone', at: 'Mars/Phobos' }),
    );
  });

  it('throws missingPlugin at loose when { loose: true } is passed without the loose plugin', () => {
    expect(() => yearMonth('Nov 2026', { loose: true })).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'missingPlugin', at: 'loose' }),
    );
    expect(() => new YearMonth('Nov 2026', { loose: true })).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'missingPlugin', at: 'loose' }),
    );
  });

  // fails because YearMonth's own 'text' property triggers unknownUnit
  it.todo('accepts an object spread from a YearMonth instance ({ ...month })');
});

describe('monthYear()', () => {
  afterEach(() => {
    YearMonth.century = 2000;
  });

  it('parses month then two-digit year from slash-, dot-, or dash-separated strings', () => {
    expect(monthYear('11/26').toString()).toBe('2026-11');
    expect(monthYear('11.26').toString()).toBe('2026-11');
    expect(monthYear('11-26').toString()).toBe('2026-11');
    expect(monthYear('1/28').toString()).toBe('2028-01');
  });

  it('parses four-digit years without adding a century offset', () => {
    expect(monthYear('05/2028').toString()).toBe('2028-05');
    expect(monthYear('11.2026').toString()).toBe('2026-11');
    expect(monthYear(11, 2026).toString()).toBe('2026-11');
  });

  it('parses month then year from two numbers', () => {
    expect(monthYear(11, 26).toString()).toBe('2026-11');
    expect(monthYear(5, 2028).toString()).toBe('2028-05');
  });

  it('parses month then year from two numeric strings', () => {
    expect(monthYear('11', '26').toString()).toBe('2026-11');
    expect(monthYear('05', '2028').toString()).toBe('2028-05');
  });

  it('trims surrounding whitespace on card expiry strings', () => {
    expect(monthYear(' 11/26 ').toString()).toBe('2026-11');
  });

  it('attaches the locale passed in options alongside a card expiry string', () => {
    expect(monthYear('11/26', { locale: 'fr' }).locale()).toBe('fr');
  });

  // two zones in different months at 02:00Z so the host timezone cannot satisfy both
  it('resolves a Date instant in the specified timezone', () => {
    const instant = new Date('2026-11-01T02:00:00Z');
    expect(monthYear(instant, 'America/Los_Angeles').toString()).toBe('2026-10');
    expect(monthYear(instant, 'Asia/Tokyo').toString()).toBe('2026-11');
  });

  it('maps two-digit years 00..99 into 2000..2099 by default', () => {
    expect(monthYear('11/00').toString()).toBe('2000-11');
    expect(monthYear('11/99').toString()).toBe('2099-11');
    expect(monthYear(11, 0).toString()).toBe('2000-11');
    expect(monthYear(11, 99).toString()).toBe('2099-11');
  });

  it('applies YearMonth.century to two-digit years', () => {
    expect(YearMonth.century).toBe(2000);
    YearMonth.century = 1900;
    expect(monthYear('11/26').toString()).toBe('1926-11');
    expect(monthYear(11, 26).toString()).toBe('1926-11');
    expect(monthYear('05/2028').toString()).toBe('2028-05');
  });

  it("parses year-first ISO 'YYYY-MM' strings identically to yearMonth()", () => {
    expect(monthYear('2026-11').toString()).toBe('2026-11');
    expect(monthYear('2026-11').equals(yearMonth('2026-11'))).toBe(true);
  });

  it('accepts fields objects, ISO date strings, and instants like yearMonth()', () => {
    expect(monthYear({ year: 2026, month: 11 }).toString()).toBe('2026-11');
    expect(monthYear('2026-11-16').toString()).toBe('2026-11');
    expect(monthYear(new Date('2026-11-01T02:00:00Z'), 'America/Los_Angeles').toString()).toBe('2026-10');
  });

  it("formats card expiry strings with format('MM/YY') in ASCII digits across locales", () => {
    expect(monthYear('11/26').format('MM/YY')).toBe('11/26');
    expect(monthYear('05/2028').format('MM/YY')).toBe('05/28');
    expect(monthYear('11/26').format('MM/YY', 'th')).toBe('11/26');
    expect(monthYear('11/26').format('MM/YY', 'ar-EG')).toBe('11/26');
  });

  it('throws invalidYearMonth when month is outside 1..12 without swapping month and year', () => {
    expect(() => monthYear('13/26')).toThrowError(expect.objectContaining({ code: 'invalidYearMonth' }));
    expect(() => monthYear('26/11')).toThrowError(expect.objectContaining({ code: 'invalidYearMonth' }));
    expect(() => monthYear(13, 26)).toThrowError(expect.objectContaining({ code: 'invalidYearMonth' }));
  });

  it('throws invalidYearMonth for single-digit years or invalid strings', () => {
    expect(() => monthYear('11/6')).toThrowError(expect.objectContaining({ code: 'invalidYearMonth', at: '11/6' }));
    expect(() => monthYear('soon')).toThrowError(expect.objectContaining({ code: 'invalidYearMonth', at: 'soon' }));
  });

  it('throws missingYearMonth for undefined or null and invalidYearMonth for a single number', () => {
    expect(() => monthYear()).toThrowError(expect.objectContaining({ name: 'TypeError', code: 'missingYearMonth' }));
    expect(() => monthYear(null)).toThrowError(
      expect.objectContaining({ name: 'TypeError', code: 'missingYearMonth' }),
    );
    expect(() => monthYear(11)).toThrowError(expect.objectContaining({ code: 'invalidYearMonth', at: '11' }));
  });
});

describe('YearMonth', () => {
  it('constructs YearMonth instances via yearMonth(), monthYear(), and new YearMonth() and checks them with isYearMonth()', () => {
    expect(yearMonth(2026, 11)).toBeInstanceOf(YearMonth);
    expect(monthYear(11, 26)).toBeInstanceOf(YearMonth);
    expect(new YearMonth(2026, 11).toString()).toBe('2026-11');
    expect(isYearMonth(yearMonth(2026, 11))).toBe(true);
    expect(isYearMonth('2026-11')).toBe(false);
  });

  it('extracts a YearMonth from CalendarDate and DateTime via .yearMonth and as("yearMonth")', () => {
    const instant = datetime('2026-11-01T02:00:00Z', 'America/Los_Angeles');
    expect(date('2026-11-16').yearMonth.toString()).toBe('2026-11');
    expect(date('2026-11-16').as('yearMonth').toString()).toBe('2026-11');
    expect(instant.yearMonth.toString()).toBe('2026-10');
    expect(instant.as('yearMonth').toString()).toBe('2026-10');
  });

  it('exposes year and 1-indexed month number properties', () => {
    expect(yearMonth('2026-01')).toMatchObject({ year: 2026, month: 1 });
    expect(yearMonth('2026-12')).toMatchObject({ year: 2026, month: 12 });
  });

  it('formats text using the instance locale', () => {
    expect(yearMonth('2026-11', { locale: 'en-US' }).text).toBe('Nov 2026');
  });

  it('freezes instances on construction', () => {
    const billing = yearMonth('2026-11');
    expect(() => {
      billing.month = 1;
    }).toThrowError(TypeError);
    expect(billing.toString()).toBe('2026-11');
  });
});

describe('YearMonth quarter, daysInMonth, daysInYear, and isLeapYear()', () => {
  it('computes quarter 1..4 across all 12 months', () => {
    const quarters = [1, 1, 1, 2, 2, 2, 3, 3, 3, 4, 4, 4];
    quarters.forEach((quarter, index) => {
      expect(yearMonth(2026, index + 1).quarter).toBe(quarter);
    });
  });

  it('returns the day count of the month from daysInMonth, including leap-year February', () => {
    expect(yearMonth('2026-11').daysInMonth).toBe(30);
    expect(yearMonth('2026-12').daysInMonth).toBe(31);
    expect(yearMonth('2026-02').daysInMonth).toBe(28);
    expect(yearMonth('2028-02').daysInMonth).toBe(29);
  });

  it('returns 365 or 366 from daysInYear', () => {
    expect(yearMonth('2026-11').daysInYear).toBe(365);
    expect(yearMonth('2028-11').daysInYear).toBe(366);
  });

  it('returns true from isLeapYear() for leap years including century rules', () => {
    expect(yearMonth('2028-06').isLeapYear()).toBe(true);
    expect(yearMonth('2026-02').isLeapYear()).toBe(false);
    expect(yearMonth('1900-02').isLeapYear()).toBe(false);
    expect(yearMonth('2000-02').isLeapYear()).toBe(true);
  });
});

describe('YearMonth start and end', () => {
  it('returns the first and last days of the month as CalendarDate instances', () => {
    const billing = yearMonth('2026-11');
    expect(billing.start).toBeInstanceOf(CalendarDate);
    expect(billing.end).toBeInstanceOf(CalendarDate);
    expect(billing.start.toString()).toBe('2026-11-01');
    expect(billing.end.toString()).toBe('2026-11-30');
  });

  it('resolves end to the 31st, 28th, or leap-year 29th of the month', () => {
    expect(yearMonth('2026-12').end.toString()).toBe('2026-12-31');
    expect(yearMonth('2026-02').end.toString()).toBe('2026-02-28');
    expect(yearMonth('2028-02').end.toString()).toBe('2028-02-29');
  });
});

describe('YearMonth on()', () => {
  it('places a day number into the month as a CalendarDate', () => {
    const due = yearMonth('2026-11').on(15);
    expect(due).toBeInstanceOf(CalendarDate);
    expect(due.toString()).toBe('2026-11-15');
  });

  it('accepts a numeric day string', () => {
    expect(yearMonth('2026-11').on('15').toString()).toBe('2026-11-15');
  });

  it('clamps days exceeding daysInMonth to the last day of the month', () => {
    expect(yearMonth('2026-02').on(31).toString()).toBe('2026-02-28');
    expect(yearMonth('2028-02').on(31).toString()).toBe('2028-02-29');
    expect(yearMonth('2026-02').on(30).toString()).toBe('2026-02-28');
    expect(yearMonth('2026-04').on(31).toString()).toBe('2026-04-30');
  });

  it('throws invalidDay for out-of-range, fractional, non-numeric, or missing day arguments', () => {
    expect(() => yearMonth('2026-11').on(0)).toThrowError(
      expect.objectContaining({ code: 'invalidDay', at: expect.stringContaining('2026-11') }),
    );
    expect(() => yearMonth('2026-11').on(32)).toThrowError(
      expect.objectContaining({ code: 'invalidDay', at: expect.stringContaining('32') }),
    );
    expect(() => yearMonth('2026-11').on(1.5)).toThrowError(
      expect.objectContaining({ code: 'invalidDay', at: expect.stringContaining('1.5') }),
    );
    expect(() => yearMonth('2026-11').on('last')).toThrowError(
      expect.objectContaining({ code: 'invalidDay', at: expect.stringContaining('last') }),
    );
    expect(() => yearMonth('2026-11').on()).toThrowError(expect.objectContaining({ code: 'invalidDay' }));
  });
});

describe('YearMonth plus() and minus()', () => {
  it('adds and subtracts months, quarters, and years', () => {
    const billing = yearMonth('2026-11');
    expect(billing.plus(3, 'months').toString()).toBe('2027-02');
    expect(billing.plus(1, 'quarter').toString()).toBe('2027-02');
    expect(billing.plus(1, 'year').toString()).toBe('2027-11');
    expect(billing.minus(3, 'months').toString()).toBe('2026-08');
    expect(billing.minus(1, 'quarter').toString()).toBe('2026-08');
    expect(billing.minus(1, 'year').toString()).toBe('2025-11');
  });

  it('carries across year boundaries', () => {
    expect(yearMonth('2026-12').plus(1, 'month').toString()).toBe('2027-01');
    expect(yearMonth('2026-01').minus(1, 'month').toString()).toBe('2025-12');
    expect(yearMonth('2026-11').plus(14, 'months').toString()).toBe('2028-01');
  });

  it('accepts duration phrases, ISO 8601 strings, fields objects, Duration, and Temporal.Duration', () => {
    const billing = yearMonth('2026-11');
    expect(billing.plus('1 year').toString()).toBe('2027-11');
    expect(billing.plus('P1Y2M').toString()).toBe('2028-01');
    expect(billing.plus({ years: 1, months: 2 }).toString()).toBe('2028-01');
    expect(billing.plus(months(3)).toString()).toBe('2027-02');
    expect(billing.minus(Temporal.Duration.from({ months: 3 })).toString()).toBe('2026-08');
  });

  it('adds a Duration returned by YearMonth.prototype.until()', () => {
    const start = yearMonth('2026-03');
    expect(start.plus(start.until('2027-06')).toString()).toBe('2027-06');
  });

  it('reverses direction for negative counts', () => {
    expect(yearMonth('2026-11').plus(-1, 'month').toString()).toBe('2026-10');
    expect(yearMonth('2026-11').minus(-2, 'months').toString()).toBe('2027-01');
  });

  it('spills fractional years into whole months', () => {
    expect(yearMonth('2026-11').plus(1.5, 'years').toString()).toBe('2028-05');
  });

  it('aliases add() and subtract() to plus() and minus()', () => {
    expect(yearMonth('2026-11').add(3, 'months').toString()).toBe('2027-02');
    expect(yearMonth('2026-11').subtract(1, 'year').toString()).toBe('2025-11');
  });

  it('returns a new YearMonth without mutating the original', () => {
    const billing = yearMonth('2026-11');
    const later = billing.plus(1, 'month');
    expect(later).toBeInstanceOf(YearMonth);
    expect(later.toString()).toBe('2026-12');
    expect(billing.toString()).toBe('2026-11');
  });

  it('throws unsupportedUnit for weeks, days, and clock units', () => {
    const billing = yearMonth('2026-11');
    expect(() => billing.plus(2, 'weeks')).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'unsupportedUnit', at: 'weeks' }),
    );
    expect(() => billing.plus(1, 'day')).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'unsupportedUnit', at: 'days' }),
    );
    expect(() => billing.minus(1, 'hour')).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'unsupportedUnit', at: 'hours' }),
    );
  });

  it('throws unsupportedUnit when a duration input includes day fields', () => {
    const billing = yearMonth('2026-11');
    expect(() => billing.plus('3 days')).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'unsupportedUnit', at: 'days' }),
    );
    expect(() => billing.plus({ months: 1, days: 1 })).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'unsupportedUnit', at: 'days' }),
    );
    expect(() => billing.minus(date('2026-11-01').until('2027-02-15'))).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'unsupportedUnit', at: 'days' }),
    );
  });

  it('throws unsupportedUnit for a bare number without a unit', () => {
    expect(() => yearMonth('2026-11').plus(1)).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'unsupportedUnit' }),
    );
  });

  it('throws invalidFraction for fractional months', () => {
    expect(() => yearMonth('2026-11').plus(1.5, 'months')).toThrowError(
      expect.objectContaining({ code: 'invalidFraction' }),
    );
  });

  it('throws unknownUnit for an unrecognized unit', () => {
    expect(() => yearMonth('2026-11').plus(1, 'fortnight')).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'unknownUnit', at: 'fortnight' }),
    );
  });

  it('throws invalidDuration for missing or null inputs', () => {
    expect(() => yearMonth('2026-11').plus()).toThrowError(expect.objectContaining({ code: 'invalidDuration' }));
    expect(() => yearMonth('2026-11').minus(null)).toThrowError(expect.objectContaining({ code: 'invalidDuration' }));
  });

  it('throws cannotAdd and cannotSubtract when the result overflows Temporal bounds', () => {
    expect(() => yearMonth('2026-11').plus(300000, 'years')).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'cannotAdd' }),
    );
    expect(() => yearMonth('2026-11').minus(300000, 'years')).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'cannotSubtract' }),
    );
  });
});

describe('YearMonth set()', () => {
  it('replaces year or month by field name and value', () => {
    const billing = yearMonth('2026-11');
    expect(billing.set('month', 2).toString()).toBe('2026-02');
    expect(billing.set('year', 2030).toString()).toBe('2030-11');
  });

  it('replaces year and month from a fields object', () => {
    const billing = yearMonth('2026-11');
    expect(billing.set({ month: 2 }).toString()).toBe('2026-02');
    expect(billing.set({ year: 2028, month: 2 }).toString()).toBe('2028-02');
    expect(billing.set({ year: 2028, month: 2 }).daysInMonth).toBe(29);
  });

  it('returns a new YearMonth without mutating the original', () => {
    const billing = yearMonth('2026-11');
    billing.set('month', 2);
    expect(billing.toString()).toBe('2026-11');
  });

  it('throws cannotSet for out-of-range or fractional months', () => {
    const billing = yearMonth('2026-11');
    expect(() => billing.set('month', 13)).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'cannotSet', at: expect.stringContaining('13') }),
    );
    expect(() => billing.set('month', 0)).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'cannotSet' }),
    );
    expect(() => billing.set({ month: 2.5 })).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'cannotSet', at: expect.stringContaining('2.5') }),
    );
  });

  it('throws unsupportedUnit for day or clock fields', () => {
    const billing = yearMonth('2026-11');
    expect(() => billing.set('day', 5)).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'unsupportedUnit', at: 'day' }),
    );
    expect(() => billing.set({ month: 2, hour: 9 })).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'unsupportedUnit', at: 'hour' }),
    );
  });

  it('throws unknownUnit for an unrecognized field name', () => {
    expect(() => yearMonth('2026-11').set('fortnight', 2)).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'unknownUnit', at: 'fortnight' }),
    );
  });
});

describe('YearMonth compare(), equals(), isBefore(), and isAfter()', () => {
  it('returns -1, 0, or 1 from compare() for earlier, equal, or later months', () => {
    expect(yearMonth('2026-05').compare('2026-11')).toBe(-1);
    expect(yearMonth('2026-11').compare('2026-11')).toBe(0);
    expect(yearMonth('2026-12').compare('2026-11')).toBe(1);
  });

  it('evaluates equals(), isBefore(), and isAfter() consistently with compare()', () => {
    const november = yearMonth('2026-11');
    expect(november.equals('2026-11')).toBe(true);
    expect(november.equals('2026-12')).toBe(false);
    expect(november.isBefore('2026-12')).toBe(true);
    expect(november.isBefore('2026-10')).toBe(false);
    expect(november.isAfter('2026-10')).toBe(true);
    expect(november.isAfter('2026-12')).toBe(false);
  });

  it('returns false from both isBefore() and isAfter() for the same month', () => {
    expect(yearMonth('2026-11').isBefore('2026-11')).toBe(false);
    expect(yearMonth('2026-11').isAfter('2026-11')).toBe(false);
  });

  it('orders chronologically across year boundaries', () => {
    expect(yearMonth('2025-12').isBefore('2026-01')).toBe(true);
    expect(yearMonth('2026-01').isAfter('2025-12')).toBe(true);
    expect(yearMonth('2025-12').compare('2026-01')).toBe(-1);
  });

  it('accepts YearMonth, fields objects, and Temporal.PlainYearMonth', () => {
    const november = yearMonth('2026-11');
    expect(november.equals(monthYear('11/26'))).toBe(true);
    expect(november.equals({ year: 2026, month: 11 })).toBe(true);
    expect(november.equals(Temporal.PlainYearMonth.from('2026-11'))).toBe(true);
    expect(november.isBefore(yearMonth(2027, 1))).toBe(true);
  });

  it('compares against the year and month of a CalendarDate, ISO date string, or DateTime', () => {
    const november = yearMonth('2026-11');
    expect(november.compare('2026-11-16')).toBe(0);
    expect(november.equals(date('2026-11-30'))).toBe(true);
    expect(november.isBefore('2026-11-30')).toBe(false);
    expect(november.isBefore('2026-12-01')).toBe(true);
    expect(november.isAfter(date('2026-10-31'))).toBe(true);
    expect(november.isAfter(datetime('2026-11-01T02:00:00Z', 'America/Los_Angeles'))).toBe(true);
  });

  it('ignores instance locales when comparing values', () => {
    expect(yearMonth('2026-11').locale('fr').equals(yearMonth('2026-11'))).toBe(true);
    expect(yearMonth('2026-11').locale('fr').equals(yearMonth('2026-11').locale('ja'))).toBe(true);
    expect(yearMonth('2026-11').compare(yearMonth('2026-11').locale('ja'))).toBe(0);
  });

  it('sorts ascending with YearMonth.prototype.compare() and top-level compare()', () => {
    const unsorted = [yearMonth('2026-12'), yearMonth('2026-01'), yearMonth('2025-06')];
    const byMethod = unsorted.toSorted((a, b) => a.compare(b));
    const byHelper = unsorted.toSorted(compare);
    expect(byMethod.map(String)).toEqual(['2025-06', '2026-01', '2026-12']);
    expect(byHelper.map(String)).toEqual(['2025-06', '2026-01', '2026-12']);
  });

  it('resolves the minimum and maximum month in earliest() and latest()', () => {
    const billed = [yearMonth('2026-12'), yearMonth('2026-01'), yearMonth('2025-06')];
    expect(earliest(billed).toString()).toBe('2025-06');
    expect(latest(...billed).toString()).toBe('2026-12');
  });

  it('throws unsupportedComparison from <, >, unary +, and valueOf()', () => {
    const earlier = yearMonth('2026-05');
    const later = yearMonth('2026-11');
    expect(() => earlier < later).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'unsupportedComparison', at: '2026-05' }),
    );
    expect(() => later > earlier).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'unsupportedComparison', at: '2026-11' }),
    );
    expect(() => +later).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'unsupportedComparison', at: '2026-11' }),
    );
    expect(() => later.valueOf()).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'unsupportedComparison', at: '2026-11' }),
    );
  });

  it('throws invalidYearMonth for invalid strings or month-first card expiry strings', () => {
    expect(() => yearMonth('2026-11').equals('whenever')).toThrowError(
      expect.objectContaining({ code: 'invalidYearMonth', at: 'whenever' }),
    );
    expect(() => yearMonth('2026-11').isBefore('11/26')).toThrowError(
      expect.objectContaining({ code: 'invalidYearMonth', at: '11/26' }),
    );
  });
});

describe('YearMonth contains() and includes()', () => {
  it('returns true for the first day, last day, and days in between', () => {
    const november = yearMonth('2026-11');
    expect(november.contains('2026-11-01')).toBe(true);
    expect(november.contains('2026-11-16')).toBe(true);
    expect(november.contains('2026-11-30')).toBe(true);
  });

  it('returns false for dates in adjacent months or different years', () => {
    const november = yearMonth('2026-11');
    expect(november.contains('2026-10-31')).toBe(false);
    expect(november.contains('2026-12-01')).toBe(false);
    expect(november.contains('2025-11-16')).toBe(false);
  });

  it('accepts CalendarDate, date fields, and Temporal.PlainDate inputs', () => {
    const november = yearMonth('2026-11');
    expect(november.contains(date('2026-11-16'))).toBe(true);
    expect(november.contains({ year: 2026, month: 11, day: 16 })).toBe(true);
    expect(november.contains(Temporal.PlainDate.from('2026-12-01'))).toBe(false);
  });

  it('evaluates a DateTime in its own timezone', () => {
    const instant = datetime('2026-11-01T02:00:00Z', 'America/Los_Angeles');
    expect(yearMonth('2026-10').contains(instant)).toBe(true);
    expect(yearMonth('2026-11').contains(instant)).toBe(false);
  });

  it('aliases includes() to contains()', () => {
    expect(yearMonth('2026-11').includes('2026-11-16')).toBe(true);
    expect(yearMonth('2026-11').includes('2026-12-01')).toBe(false);
  });

  it('throws missingDate when called with no argument and invalidDate for invalid strings', () => {
    expect(() => yearMonth('2026-11').contains()).toThrowError(
      expect.objectContaining({ name: 'TypeError', code: 'missingDate' }),
    );
    expect(() => yearMonth('2026-11').contains('whenever')).toThrowError(
      expect.objectContaining({ code: 'invalidDate', at: 'whenever' }),
    );
  });
});

describe('YearMonth isPast() and isFuture()', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date', 'Temporal'], now: new Date('2026-11-18T12:00:00Z') });
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns true from isPast() for earlier months and isFuture() for later months', () => {
    expect(yearMonth('2026-10').isPast('UTC')).toBe(true);
    expect(yearMonth('2026-10').isFuture('UTC')).toBe(false);
    expect(yearMonth('2026-12').isFuture('UTC')).toBe(true);
    expect(yearMonth('2026-12').isPast('UTC')).toBe(false);
  });

  it('returns false from both isPast() and isFuture() throughout the current month', () => {
    vi.setSystemTime(new Date('2026-11-01T12:00:00Z'));
    expect(yearMonth('2026-11').isPast('UTC')).toBe(false);
    expect(yearMonth('2026-11').isFuture('UTC')).toBe(false);
    vi.setSystemTime(new Date('2026-11-30T12:00:00Z'));
    expect(yearMonth('2026-11').isPast('UTC')).toBe(false);
    expect(yearMonth('2026-11').isFuture('UTC')).toBe(false);
  });

  it('evaluates the current month in the specified timezone', () => {
    vi.setSystemTime(new Date('2026-11-01T02:00:00Z'));
    expect(yearMonth('2026-10').isPast('Asia/Tokyo')).toBe(true);
    expect(yearMonth('2026-10').isPast('America/Los_Angeles')).toBe(false);
    expect(yearMonth('2026-11').isFuture('America/Los_Angeles')).toBe(true);
    expect(yearMonth('2026-11').isFuture('Asia/Tokyo')).toBe(false);
  });

  it('treats a card expiry YearMonth as non-past through the last day of its expiry month', () => {
    const expiry = monthYear('11/26');
    vi.setSystemTime(new Date('2026-11-30T12:00:00Z'));
    expect(expiry.isPast('UTC')).toBe(false);
    vi.setSystemTime(new Date('2026-12-01T12:00:00Z'));
    expect(expiry.isPast('UTC')).toBe(true);
  });

  it('throws unknownZone for an unrecognized timezone', () => {
    expect(() => yearMonth('2026-11').isPast('Mars/Phobos')).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'unknownZone', at: 'Mars/Phobos' }),
    );
  });
});

describe('YearMonth isPast() and isFuture() with real clock', () => {
  it('evaluates past and future months against the real system clock', () => {
    const current = today('UTC').yearMonth;
    expect(current.minus(2, 'months').isPast('UTC')).toBe(true);
    expect(current.plus(2, 'months').isFuture('UTC')).toBe(true);
    expect(current.minus(2, 'months').isFuture('UTC')).toBe(false);
    expect(current.plus(2, 'months').isPast('UTC')).toBe(false);
  });
});

describe('YearMonth until() and since()', () => {
  it('returns a Duration in years and months for a later YearMonth', () => {
    const span = yearMonth('2026-03').until('2027-06');
    expect(span).toBeInstanceOf(Duration);
    expect(span.toString()).toBe('P1Y3M');
    expect(span).toMatchObject({ years: 1, months: 3 });
  });

  it('returns a numeric total when a unit argument is passed', () => {
    const start = yearMonth('2026-03');
    expect(start.until('2027-06', 'months')).toBe(15);
    expect(start.until('2027-06', 'quarters')).toBe(5);
    expect(start.until('2027-06', 'years')).toBe(1.25);
  });

  it('returns a negative Duration or negative total when until() targets an earlier month', () => {
    expect(yearMonth('2027-06').until('2026-03').toString()).toBe('-P1Y3M');
    expect(yearMonth('2027-06').until('2026-03', 'months')).toBe(-15);
  });

  it('returns zero for identical start and end months', () => {
    expect(yearMonth('2026-03').until('2026-03', 'months')).toBe(0);
    expect(yearMonth('2026-03').until('2026-03').total('months')).toBe(0);
  });

  it('computes since() in the opposite direction of until()', () => {
    expect(yearMonth('2026-11').since('2026-05').toString()).toBe('P6M');
    expect(yearMonth('2026-11').since('2026-05', 'months')).toBe(6);
    expect(yearMonth('2026-03').since('2027-06', 'months')).toBe(-15);
  });

  it('counts days and weeks from the first day of each month', () => {
    expect(yearMonth('2026-01').until('2026-03', 'days')).toBe(59);
    expect(yearMonth('2028-01').until('2028-03', 'days')).toBe(60);
    expect(yearMonth('2026-02').until('2026-03', 'weeks')).toBe(4);
  });

  it('totals days on the returned Duration using the anchor recorded by until()', () => {
    expect(yearMonth('2026-01').until('2026-03').total('days')).toBe(59);
    expect(yearMonth('2028-01').until('2028-03').total('days')).toBe(60);
  });

  it('accepts YearMonth instances, ISO date strings, and CalendarDate inputs', () => {
    const start = yearMonth('2026-03');
    expect(start.until(yearMonth('2027-06'), 'months')).toBe(15);
    expect(start.until('2027-06-20', 'months')).toBe(15);
    expect(start.since(date('2025-12-31'), 'months')).toBe(3);
  });

  it('throws missingYearMonth when called with no argument and invalidYearMonth for invalid strings', () => {
    expect(() => yearMonth('2026-03').until()).toThrowError(
      expect.objectContaining({ name: 'TypeError', code: 'missingYearMonth' }),
    );
    expect(() => yearMonth('2026-03').since('whenever')).toThrowError(
      expect.objectContaining({ code: 'invalidYearMonth', at: 'whenever' }),
    );
  });

  it('throws unknownUnit for an unrecognized unit', () => {
    expect(() => yearMonth('2026-03').until('2027-06', 'fortnights')).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'unknownUnit', at: 'fortnights' }),
    );
  });
});

describe('YearMonth locale() and lang()', () => {
  it('returns undefined when no locale is set', () => {
    expect(yearMonth('2026-05').locale()).toBeUndefined();
    expect(yearMonth('2026-05').lang()).toBeUndefined();
  });

  it('returns a new YearMonth with the locale tag without mutating the original', () => {
    const may = yearMonth('2026-05');
    const russian = may.locale('ru');
    expect(russian.locale()).toBe('ru');
    expect(russian.toString()).toBe('2026-05');
    expect(may.locale()).toBeUndefined();
  });

  it('aliases lang() to locale()', () => {
    expect(yearMonth('2026-05').lang('fr').lang()).toBe('fr');
    expect(yearMonth('2026-05').lang('fr').locale()).toBe('fr');
  });

  it('clears the locale tag when passed null, undefined, or an empty string', () => {
    const russian = yearMonth('2026-05').locale('ru');
    expect(russian.locale(null).locale()).toBeUndefined();
    expect(russian.locale(undefined).locale()).toBeUndefined();
    expect(russian.locale('').locale()).toBeUndefined();
  });

  it('propagates the locale across plus(), minus(), and set()', () => {
    const russian = yearMonth('2026-05').locale('ru');
    expect(russian.plus(1, 'month').locale()).toBe('ru');
    expect(russian.minus(1, 'year').locale()).toBe('ru');
    expect(russian.set('month', 1).locale()).toBe('ru');
  });

  it('propagates the locale to CalendarDate and Duration values from on(), start, end, until(), and since()', () => {
    const russian = yearMonth('2026-05').locale('ru');
    expect(russian.on(1).locale()).toBe('ru');
    expect(russian.start.locale()).toBe('ru');
    expect(russian.end.locale()).toBe('ru');
    expect(russian.until('2026-08').locale()).toBe('ru');
    expect(russian.since('2026-01').locale()).toBe('ru');
  });

  it('preserves the locale when wrapping a YearMonth or CalendarDate', () => {
    expect(yearMonth(yearMonth('2026-05').locale('ru')).locale()).toBe('ru');
    expect(monthYear(yearMonth('2026-05').locale('ru')).locale()).toBe('ru');
    expect(yearMonth(date('2026-05-01').locale('ru')).locale()).toBe('ru');
  });

  it('throws unknownLocale for an invalid locale tag', () => {
    expect(() => yearMonth('2026-05').locale('not a locale')).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'unknownLocale', at: 'not a locale' }),
    );
  });
});

describe('YearMonth format()', () => {
  it('matches the text property when called with no format argument', () => {
    const billing = yearMonth('2026-11', { locale: 'en-US' });
    expect(billing.format()).toBe('Nov 2026');
    expect(billing.format()).toBe(billing.text);
  });

  it('throws unsupportedToken for day, weekday, or clock tokens', () => {
    expect(() => yearMonth('2026-11').format('YYYY-MM-DD')).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'unsupportedToken', at: expect.stringContaining('DD') }),
    );
    expect(() => yearMonth('2026-11').format('dddd')).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'unsupportedToken', at: expect.stringContaining('dddd') }),
    );
    expect(() => yearMonth('2026-11').format('HH:mm')).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'unsupportedToken', at: expect.stringContaining('HH') }),
    );
  });
});

describe('YearMonth as()', () => {
  it("returns the same YearMonth instance for 'yearMonth'", () => {
    const billing = yearMonth('2026-11');
    expect(billing.as('yearMonth')).toBe(billing);
  });

  it("throws unknownKind for 'date' and 'monthDay'", () => {
    expect(() => yearMonth('2026-11').as('date')).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'unknownKind', at: 'date' }),
    );
    expect(() => yearMonth('2026-11').as('monthDay')).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'unknownKind', at: 'monthDay' }),
    );
  });
});

describe('YearMonth toString(), toJSON(), and toTemporal()', () => {
  it("formats zero-padded 'YYYY-MM' in toString()", () => {
    expect(yearMonth(2026, 11).toString()).toBe('2026-11');
    expect(yearMonth(2026, 5).toString()).toBe('2026-05');
    expect(yearMonth(987, 5).toString()).toBe('0987-05');
  });

  it("serializes as 'YYYY-MM' in toJSON() and JSON.stringify()", () => {
    expect(yearMonth(2026, 5).toJSON()).toBe('2026-05');
    expect(JSON.stringify({ billing: yearMonth(2026, 11) })).toBe('{"billing":"2026-11"}');
  });

  it("coerces to 'YYYY-MM' in String(), template literals, and string concatenation", () => {
    const billing = yearMonth(2026, 11);
    expect(String(billing)).toBe('2026-11');
    expect(`${billing}`).toBe('2026-11');
    expect('renews ' + billing).toBe('renews 2026-11');
  });

  it('round-trips every month across sample years through toString(), JSON, yearMonth(), and monthYear()', () => {
    for (const year of [1, 987, 1999, 2026, 9999]) {
      for (let month = 1; month <= 12; month++) {
        const written = yearMonth(year, month);
        expect(yearMonth(written.toString())).toMatchObject({ year, month });
        expect(monthYear(written.toString())).toMatchObject({ year, month });
        expect(yearMonth(JSON.parse(JSON.stringify(written)))).toMatchObject({ year, month });
      }
    }
  });

  it('returns an ISO 8601 Temporal.PlainYearMonth from toTemporal()', () => {
    const plain = yearMonth(2026, 11).toTemporal();
    expect(plain).toBeInstanceOf(Temporal.PlainYearMonth);
    expect(plain.calendarId).toBe('iso8601');
    expect(plain.year).toBe(2026);
    expect(plain.month).toBe(11);
    expect(yearMonth(plain).toString()).toBe('2026-11');
  });
});
