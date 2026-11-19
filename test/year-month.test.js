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
  it('reads year then month from two numbers, a fields object, and a string with a dash, slash or dot', () => {
    expect(yearMonth(2026, 11).toString()).toBe('2026-11');
    expect(yearMonth({ year: 2026, month: 11 }).toString()).toBe('2026-11');
    expect(yearMonth('2026-11').toString()).toBe('2026-11');
    expect(yearMonth('2026/11').toString()).toBe('2026-11');
    expect(yearMonth('2026.11').toString()).toBe('2026-11');
  });

  it('reads a single-digit month', () => {
    expect(yearMonth('2026-5').toString()).toBe('2026-05');
    expect(yearMonth(2026, 5).toString()).toBe('2026-05');
  });

  it('drops the day from a date string, a CalendarDate, date fields and a Temporal.PlainDate', () => {
    expect(yearMonth('2026-11-16').toString()).toBe('2026-11');
    expect(yearMonth(date('2026-11-16')).toString()).toBe('2026-11');
    expect(yearMonth({ year: 2026, month: 11, day: 16 }).toString()).toBe('2026-11');
    expect(yearMonth(Temporal.PlainDate.from('2026-11-16')).toString()).toBe('2026-11');
  });

  it('reads a moment as the month it falls in, in the zone asked for', () => {
    const moment = datetime('2026-11-01T02:00:00Z');
    expect(yearMonth(moment, 'America/Los_Angeles').toString()).toBe('2026-10');
    expect(yearMonth(moment, 'Asia/Tokyo').toString()).toBe('2026-11');
    expect(yearMonth(new Date('2026-11-01T02:00:00Z'), { zone: 'America/Los_Angeles' }).toString()).toBe('2026-10');
    expect(yearMonth('2026-11-01T02:00:00Z', 'America/Los_Angeles').toString()).toBe('2026-10');
  });

  it("reads a DateTime in the DateTime's own zone when no zone is passed", () => {
    expect(yearMonth(datetime('2026-11-01T02:00:00Z', 'America/Los_Angeles')).toString()).toBe('2026-10');
  });

  it('wraps a Temporal.PlainYearMonth and reads another YearMonth as the same year and month', () => {
    expect(yearMonth(Temporal.PlainYearMonth.from('2026-11')).toString()).toBe('2026-11');
    expect(yearMonth(yearMonth(2026, 11)).toString()).toBe('2026-11');
  });

  it('carries the locale passed in options', () => {
    expect(yearMonth('2026-11', { locale: 'fr' }).locale()).toBe('fr');
  });

  it('throws missingYearMonth for undefined or null, so a missing field never becomes the current month', () => {
    expect(() => yearMonth()).toThrowError(expect.objectContaining({ name: 'TypeError', code: 'missingYearMonth' }));
    expect(() => yearMonth(null)).toThrowError(
      expect.objectContaining({ name: 'TypeError', code: 'missingYearMonth' }),
    );
  });

  it('throws invalidYearMonth for a single number or a boolean', () => {
    expect(() => yearMonth(2026)).toThrowError(expect.objectContaining({ code: 'invalidYearMonth', at: '2026' }));
    expect(() => yearMonth(true)).toThrowError(expect.objectContaining({ code: 'invalidYearMonth', at: 'true' }));
  });

  it('throws invalidYearMonth for a month outside 1 to 12', () => {
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

  it('throws invalidYearMonth for a fractional year or month', () => {
    expect(() => yearMonth(2026, 5.5)).toThrowError(
      expect.objectContaining({ code: 'invalidYearMonth', at: expect.stringContaining('5.5') }),
    );
    expect(() => yearMonth(2026.5, 5)).toThrowError(
      expect.objectContaining({ code: 'invalidYearMonth', at: expect.stringContaining('2026.5') }),
    );
  });

  it('throws invalidYearMonth at the string for text that is not a year and month', () => {
    expect(() => yearMonth('not-a-month')).toThrowError(
      expect.objectContaining({ code: 'invalidYearMonth', at: 'not-a-month' }),
    );
    expect(() => yearMonth('')).toThrowError(expect.objectContaining({ code: 'invalidYearMonth', at: '' }));
    expect(() => yearMonth('2026')).toThrowError(expect.objectContaining({ code: 'invalidYearMonth', at: '2026' }));
  });

  it('throws invalidYearMonth at a card expiry with a two-digit year, which monthYear() reads', () => {
    expect(() => yearMonth('11/26')).toThrowError(expect.objectContaining({ code: 'invalidYearMonth', at: '11/26' }));
  });

  it('throws invalidYearMonth at a month name, which is read only with { loose: true }', () => {
    expect(() => yearMonth('Nov 2026')).toThrowError(
      expect.objectContaining({ code: 'invalidYearMonth', at: 'Nov 2026' }),
    );
  });

  it('throws invalidYearMonth for fields that leave out the year or the month', () => {
    expect(() => yearMonth({ year: 2026 })).toThrowError(expect.objectContaining({ code: 'invalidYearMonth' }));
    expect(() => yearMonth({ month: 11 })).toThrowError(expect.objectContaining({ code: 'invalidYearMonth' }));
  });

  it('throws unsupportedCalendar for a Temporal.PlainYearMonth in a calendar other than ISO 8601', () => {
    const hebrew = Temporal.PlainYearMonth.from({ year: 5787, monthCode: 'M02', calendar: 'hebrew' });
    expect(() => yearMonth(hebrew)).toThrowError(
      expect.objectContaining({ name: 'TypeError', code: 'unsupportedCalendar' }),
    );
  });

  it('throws unknownZone at the zone when the zone asked for does not exist', () => {
    expect(() => yearMonth('2026-11-01T02:00:00Z', 'Mars/Phobos')).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'unknownZone', at: 'Mars/Phobos' }),
    );
  });

  it('throws missingPlugin at loose when { loose: true } is passed without the loose plugin imported', () => {
    expect(() => yearMonth('Nov 2026', { loose: true })).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'missingPlugin', at: 'loose' }),
    );
    expect(() => new YearMonth('Nov 2026', { loose: true })).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'missingPlugin', at: 'loose' }),
    );
  });
});

describe('monthYear()', () => {
  afterEach(() => {
    YearMonth.century = 2000;
  });

  it('reads month then year from a card expiry written with a slash, dot or dash', () => {
    expect(monthYear('11/26').toString()).toBe('2026-11');
    expect(monthYear('11.26').toString()).toBe('2026-11');
    expect(monthYear('11-26').toString()).toBe('2026-11');
    expect(monthYear('1/28').toString()).toBe('2028-01');
  });

  it('reads a four-digit year as written', () => {
    expect(monthYear('05/2028').toString()).toBe('2028-05');
    expect(monthYear('11.2026').toString()).toBe('2026-11');
    expect(monthYear(11, 2026).toString()).toBe('2026-11');
  });

  it('reads month then year from two numbers', () => {
    expect(monthYear(11, 26).toString()).toBe('2026-11');
    expect(monthYear(5, 2028).toString()).toBe('2028-05');
  });

  it('places a two-digit year from 00 to 99 in the 2000s', () => {
    expect(monthYear('11/00').toString()).toBe('2000-11');
    expect(monthYear('11/99').toString()).toBe('2099-11');
    expect(monthYear(11, 0).toString()).toBe('2000-11');
    expect(monthYear(11, 99).toString()).toBe('2099-11');
  });

  it('places a two-digit year in the century set on YearMonth.century', () => {
    expect(YearMonth.century).toBe(2000);
    YearMonth.century = 1900;
    expect(monthYear('11/26').toString()).toBe('1926-11');
    expect(monthYear(11, 26).toString()).toBe('1926-11');
    expect(monthYear('05/2028').toString()).toBe('2028-05');
  });

  it("reads a year-first ISO string year-first, so '2026-11' means the same under both factories", () => {
    expect(monthYear('2026-11').toString()).toBe('2026-11');
    expect(monthYear('2026-11').equals(yearMonth('2026-11'))).toBe(true);
  });

  it('reads fields, dates and moments the way yearMonth() does', () => {
    expect(monthYear({ year: 2026, month: 11 }).toString()).toBe('2026-11');
    expect(monthYear('2026-11-16').toString()).toBe('2026-11');
    expect(monthYear(new Date('2026-11-01T02:00:00Z'), 'America/Los_Angeles').toString()).toBe('2026-10');
  });

  it("prints a card expiry back as it was read with format('MM/YY'), in any locale", () => {
    expect(monthYear('11/26').format('MM/YY')).toBe('11/26');
    expect(monthYear('05/2028').format('MM/YY')).toBe('05/28');
    expect(monthYear('11/26').format('MM/YY', 'th')).toBe('11/26');
    expect(monthYear('11/26').format('MM/YY', 'ar-EG')).toBe('11/26');
  });

  it('throws invalidYearMonth for a month outside 1 to 12, never reading it as the year', () => {
    expect(() => monthYear('13/26')).toThrowError(expect.objectContaining({ code: 'invalidYearMonth' }));
    expect(() => monthYear('26/11')).toThrowError(expect.objectContaining({ code: 'invalidYearMonth' }));
    expect(() => monthYear(13, 26)).toThrowError(expect.objectContaining({ code: 'invalidYearMonth' }));
  });

  it('throws invalidYearMonth at the string for a one-digit year or text that is not a month and year', () => {
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
  it('is what yearMonth(), monthYear() and new YearMonth() return', () => {
    expect(yearMonth(2026, 11)).toBeInstanceOf(YearMonth);
    expect(monthYear(11, 26)).toBeInstanceOf(YearMonth);
    expect(new YearMonth(2026, 11).toString()).toBe('2026-11');
    expect(isYearMonth(yearMonth(2026, 11))).toBe(true);
    expect(isYearMonth('2026-11')).toBe(false);
  });

  it('is read off a CalendarDate or a DateTime with .yearMonth and as("yearMonth")', () => {
    const moment = datetime('2026-11-01T02:00:00Z', 'America/Los_Angeles');
    expect(date('2026-11-16').yearMonth.toString()).toBe('2026-11');
    expect(date('2026-11-16').as('yearMonth').toString()).toBe('2026-11');
    expect(moment.yearMonth.toString()).toBe('2026-10');
    expect(moment.as('yearMonth').toString()).toBe('2026-10');
  });

  it('holds its year and month as numbers, with months counted from 1', () => {
    expect(yearMonth('2026-01')).toMatchObject({ year: 2026, month: 1 });
    expect(yearMonth('2026-12')).toMatchObject({ year: 2026, month: 12 });
  });

  it('prints its month and year in text, in the locale it carries', () => {
    expect(yearMonth('2026-11', { locale: 'en-US' }).text).toBe('Nov 2026');
  });

  it('cannot be changed after it is made', () => {
    const billing = yearMonth('2026-11');
    expect(() => {
      billing.month = 1;
    }).toThrowError(TypeError);
    expect(billing.toString()).toBe('2026-11');
  });
});

describe('YearMonth.quarter, daysInMonth, daysInYear and isLeapYear()', () => {
  it('numbers the quarter from 1 to 4, three months to each', () => {
    const quarters = [1, 1, 1, 2, 2, 2, 3, 3, 3, 4, 4, 4];
    quarters.forEach((quarter, index) => {
      expect(yearMonth(2026, index + 1).quarter).toBe(quarter);
    });
  });

  it('counts the days in the month, with 29 in February of a leap year', () => {
    expect(yearMonth('2026-11').daysInMonth).toBe(30);
    expect(yearMonth('2026-12').daysInMonth).toBe(31);
    expect(yearMonth('2026-02').daysInMonth).toBe(28);
    expect(yearMonth('2028-02').daysInMonth).toBe(29);
  });

  it('counts 365 days in the year, or 366 in a leap year', () => {
    expect(yearMonth('2026-11').daysInYear).toBe(365);
    expect(yearMonth('2028-11').daysInYear).toBe(366);
  });

  it('answers isLeapYear() for the year the month is in, by the century rule too', () => {
    expect(yearMonth('2028-06').isLeapYear()).toBe(true);
    expect(yearMonth('2026-02').isLeapYear()).toBe(false);
    expect(yearMonth('1900-02').isLeapYear()).toBe(false);
    expect(yearMonth('2000-02').isLeapYear()).toBe(true);
  });
});

describe('YearMonth.start and end', () => {
  it('give the first and last day of the month as CalendarDates', () => {
    const billing = yearMonth('2026-11');
    expect(billing.start).toBeInstanceOf(CalendarDate);
    expect(billing.end).toBeInstanceOf(CalendarDate);
    expect(billing.start.toString()).toBe('2026-11-01');
    expect(billing.end.toString()).toBe('2026-11-30');
  });

  it('give December 31, February 28, or February 29 in a leap year as the last day', () => {
    expect(yearMonth('2026-12').end.toString()).toBe('2026-12-31');
    expect(yearMonth('2026-02').end.toString()).toBe('2026-02-28');
    expect(yearMonth('2028-02').end.toString()).toBe('2028-02-29');
  });
});

describe('YearMonth.on()', () => {
  it('places a day of the month as a CalendarDate', () => {
    const due = yearMonth('2026-11').on(15);
    expect(due).toBeInstanceOf(CalendarDate);
    expect(due.toString()).toBe('2026-11-15');
  });

  it('accepts the day as a string of digits', () => {
    expect(yearMonth('2026-11').on('15').toString()).toBe('2026-11-15');
  });

  it('places a day the month does not have on its last day', () => {
    expect(yearMonth('2026-02').on(31).toString()).toBe('2026-02-28');
    expect(yearMonth('2028-02').on(31).toString()).toBe('2028-02-29');
    expect(yearMonth('2026-02').on(30).toString()).toBe('2026-02-28');
    expect(yearMonth('2026-04').on(31).toString()).toBe('2026-04-30');
  });

  it('throws invalidDay for a day outside 1 to 31, a fractional day, text or no day', () => {
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

describe('YearMonth.plus() and minus()', () => {
  it('moves forward and back by months, quarters and years', () => {
    const billing = yearMonth('2026-11');
    expect(billing.plus(3, 'months').toString()).toBe('2027-02');
    expect(billing.plus(1, 'quarter').toString()).toBe('2027-02');
    expect(billing.plus(1, 'year').toString()).toBe('2027-11');
    expect(billing.minus(3, 'months').toString()).toBe('2026-08');
    expect(billing.minus(1, 'quarter').toString()).toBe('2026-08');
    expect(billing.minus(1, 'year').toString()).toBe('2025-11');
  });

  it('crosses into the next or the previous year', () => {
    expect(yearMonth('2026-12').plus(1, 'month').toString()).toBe('2027-01');
    expect(yearMonth('2026-01').minus(1, 'month').toString()).toBe('2025-12');
    expect(yearMonth('2026-11').plus(14, 'months').toString()).toBe('2028-01');
  });

  it('accepts a phrase, an ISO 8601 duration, a fields object, a Duration and a Temporal.Duration', () => {
    const billing = yearMonth('2026-11');
    expect(billing.plus('1 year').toString()).toBe('2027-11');
    expect(billing.plus('P1Y2M').toString()).toBe('2028-01');
    expect(billing.plus({ years: 1, months: 2 }).toString()).toBe('2028-01');
    expect(billing.plus(months(3)).toString()).toBe('2027-02');
    expect(billing.minus(Temporal.Duration.from({ months: 3 })).toString()).toBe('2026-08');
  });

  it('accepts the span until() measured between two months', () => {
    const start = yearMonth('2026-03');
    expect(start.plus(start.until('2027-06')).toString()).toBe('2027-06');
  });

  it('moves the other way for a negative amount', () => {
    expect(yearMonth('2026-11').plus(-1, 'month').toString()).toBe('2026-10');
    expect(yearMonth('2026-11').minus(-2, 'months').toString()).toBe('2027-01');
  });

  it('counts half a year as six months', () => {
    expect(yearMonth('2026-11').plus(1.5, 'years').toString()).toBe('2028-05');
  });

  it('gives the same answers from add() and subtract()', () => {
    expect(yearMonth('2026-11').add(3, 'months').toString()).toBe('2027-02');
    expect(yearMonth('2026-11').subtract(1, 'year').toString()).toBe('2025-11');
  });

  it('returns a new YearMonth and leaves the original as it was', () => {
    const billing = yearMonth('2026-11');
    const later = billing.plus(1, 'month');
    expect(later).toBeInstanceOf(YearMonth);
    expect(later.toString()).toBe('2026-12');
    expect(billing.toString()).toBe('2026-11');
  });

  it('throws unsupportedUnit at the unit for weeks, days and clock units, which a year-month cannot count', () => {
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

  it('throws unsupportedUnit when a phrase, fields object or Duration carries days beside its months', () => {
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

  it('throws unsupportedUnit for a number with no unit, never reading it as months', () => {
    expect(() => yearMonth('2026-11').plus(1)).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'unsupportedUnit' }),
    );
  });

  it('throws invalidFraction for a fraction of a month', () => {
    expect(() => yearMonth('2026-11').plus(1.5, 'months')).toThrowError(
      expect.objectContaining({ code: 'invalidFraction' }),
    );
  });

  it('throws unknownUnit at a unit name that is not one', () => {
    expect(() => yearMonth('2026-11').plus(1, 'fortnight')).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'unknownUnit', at: 'fortnight' }),
    );
  });

  it('throws invalidDuration when the amount is missing', () => {
    expect(() => yearMonth('2026-11').plus()).toThrowError(expect.objectContaining({ code: 'invalidDuration' }));
    expect(() => yearMonth('2026-11').minus(null)).toThrowError(expect.objectContaining({ code: 'invalidDuration' }));
  });

  it('throws cannotAdd or cannotSubtract when the result is past what Temporal can hold', () => {
    expect(() => yearMonth('2026-11').plus(300000, 'years')).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'cannotAdd' }),
    );
    expect(() => yearMonth('2026-11').minus(300000, 'years')).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'cannotSubtract' }),
    );
  });
});

describe('YearMonth.set()', () => {
  it('replaces the month or the year named, keeping the other', () => {
    const billing = yearMonth('2026-11');
    expect(billing.set('month', 2).toString()).toBe('2026-02');
    expect(billing.set('year', 2030).toString()).toBe('2030-11');
  });

  it('replaces the fields given in an object', () => {
    const billing = yearMonth('2026-11');
    expect(billing.set({ month: 2 }).toString()).toBe('2026-02');
    expect(billing.set({ year: 2028, month: 2 }).toString()).toBe('2028-02');
    expect(billing.set({ year: 2028, month: 2 }).daysInMonth).toBe(29);
  });

  it('returns a new YearMonth and leaves the original as it was', () => {
    const billing = yearMonth('2026-11');
    billing.set('month', 2);
    expect(billing.toString()).toBe('2026-11');
  });

  it('throws cannotSet for a month outside 1 to 12 or a fractional month', () => {
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

  it('throws unsupportedUnit at the unit for a day or a clock field, which a year-month does not have', () => {
    const billing = yearMonth('2026-11');
    expect(() => billing.set('day', 5)).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'unsupportedUnit', at: 'day' }),
    );
    expect(() => billing.set({ month: 2, hour: 9 })).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'unsupportedUnit', at: 'hour' }),
    );
  });

  it('throws unknownUnit at a field name that is not one', () => {
    expect(() => yearMonth('2026-11').set('fortnight', 2)).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'unknownUnit', at: 'fortnight' }),
    );
  });
});

describe('YearMonth.compare(), equals(), isBefore() and isAfter()', () => {
  it('returns -1, 0 or 1 from compare() for an earlier, the same or a later month', () => {
    expect(yearMonth('2026-05').compare('2026-11')).toBe(-1);
    expect(yearMonth('2026-11').compare('2026-11')).toBe(0);
    expect(yearMonth('2026-12').compare('2026-11')).toBe(1);
  });

  it('answers equals(), isBefore() and isAfter() from the same order', () => {
    const november = yearMonth('2026-11');
    expect(november.equals('2026-11')).toBe(true);
    expect(november.equals('2026-12')).toBe(false);
    expect(november.isBefore('2026-12')).toBe(true);
    expect(november.isBefore('2026-10')).toBe(false);
    expect(november.isAfter('2026-10')).toBe(true);
    expect(november.isAfter('2026-12')).toBe(false);
  });

  it('counts the same month as neither before nor after', () => {
    expect(yearMonth('2026-11').isBefore('2026-11')).toBe(false);
    expect(yearMonth('2026-11').isAfter('2026-11')).toBe(false);
  });

  it('orders by year before month', () => {
    expect(yearMonth('2025-12').isBefore('2026-01')).toBe(true);
    expect(yearMonth('2026-01').isAfter('2025-12')).toBe(true);
    expect(yearMonth('2025-12').compare('2026-01')).toBe(-1);
  });

  it('accepts a YearMonth, a fields object and a Temporal.PlainYearMonth', () => {
    const november = yearMonth('2026-11');
    expect(november.equals(monthYear('11/26'))).toBe(true);
    expect(november.equals({ year: 2026, month: 11 })).toBe(true);
    expect(november.equals(Temporal.PlainYearMonth.from('2026-11'))).toBe(true);
    expect(november.isBefore(yearMonth(2027, 1))).toBe(true);
  });

  it('reads a date or a moment as the month it falls in', () => {
    const november = yearMonth('2026-11');
    expect(november.compare('2026-11-16')).toBe(0);
    expect(november.equals(date('2026-11-30'))).toBe(true);
    expect(november.isBefore('2026-11-30')).toBe(false);
    expect(november.isBefore('2026-12-01')).toBe(true);
    expect(november.isAfter(date('2026-10-31'))).toBe(true);
    expect(november.isAfter(datetime('2026-11-01T02:00:00Z', 'America/Los_Angeles'))).toBe(true);
  });

  it('ignores the locale each value carries', () => {
    expect(yearMonth('2026-11').locale('fr').equals(yearMonth('2026-11'))).toBe(true);
    expect(yearMonth('2026-11').locale('fr').equals(yearMonth('2026-11').locale('ja'))).toBe(true);
    expect(yearMonth('2026-11').compare(yearMonth('2026-11').locale('ja'))).toBe(0);
  });

  it('sorts an array earliest first through its own compare() and through the compare() helper', () => {
    const unsorted = [yearMonth('2026-12'), yearMonth('2026-01'), yearMonth('2025-06')];
    const byMethod = unsorted.toSorted((a, b) => a.compare(b));
    const byHelper = unsorted.toSorted(compare);
    expect(byMethod.map(String)).toEqual(['2025-06', '2026-01', '2026-12']);
    expect(byHelper.map(String)).toEqual(['2025-06', '2026-01', '2026-12']);
  });

  it('is returned by earliest() and latest() as the first and last month of a list', () => {
    const billed = [yearMonth('2026-12'), yearMonth('2026-01'), yearMonth('2025-06')];
    expect(earliest(billed).toString()).toBe('2025-06');
    expect(latest(...billed).toString()).toBe('2026-12');
  });

  it('throws unsupportedComparison at the value from <, >, unary + and valueOf()', () => {
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

  it('throws invalidYearMonth at text that is not a year and month, and at a string with the month first', () => {
    expect(() => yearMonth('2026-11').equals('whenever')).toThrowError(
      expect.objectContaining({ code: 'invalidYearMonth', at: 'whenever' }),
    );
    expect(() => yearMonth('2026-11').isBefore('11/26')).toThrowError(
      expect.objectContaining({ code: 'invalidYearMonth', at: '11/26' }),
    );
  });
});

describe('YearMonth.contains() and includes()', () => {
  it('is true for the first day, the last day and every day between', () => {
    const november = yearMonth('2026-11');
    expect(november.contains('2026-11-01')).toBe(true);
    expect(november.contains('2026-11-16')).toBe(true);
    expect(november.contains('2026-11-30')).toBe(true);
  });

  it('is false for the day before the first, the day after the last, and the same month of another year', () => {
    const november = yearMonth('2026-11');
    expect(november.contains('2026-10-31')).toBe(false);
    expect(november.contains('2026-12-01')).toBe(false);
    expect(november.contains('2025-11-16')).toBe(false);
  });

  it('accepts a CalendarDate, date fields and a Temporal.PlainDate', () => {
    const november = yearMonth('2026-11');
    expect(november.contains(date('2026-11-16'))).toBe(true);
    expect(november.contains({ year: 2026, month: 11, day: 16 })).toBe(true);
    expect(november.contains(Temporal.PlainDate.from('2026-12-01'))).toBe(false);
  });

  it("reads a DateTime as the day it falls on in the DateTime's own zone", () => {
    const moment = datetime('2026-11-01T02:00:00Z', 'America/Los_Angeles');
    expect(yearMonth('2026-10').contains(moment)).toBe(true);
    expect(yearMonth('2026-11').contains(moment)).toBe(false);
  });

  it('gives the same answer from includes()', () => {
    expect(yearMonth('2026-11').includes('2026-11-16')).toBe(true);
    expect(yearMonth('2026-11').includes('2026-12-01')).toBe(false);
  });

  it('throws missingDate when given no day and invalidDate at text that is not a date', () => {
    expect(() => yearMonth('2026-11').contains()).toThrowError(
      expect.objectContaining({ name: 'TypeError', code: 'missingDate' }),
    );
    expect(() => yearMonth('2026-11').contains('whenever')).toThrowError(
      expect.objectContaining({ code: 'invalidDate', at: 'whenever' }),
    );
  });
});

describe('YearMonth.isPast() and isFuture()', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date', 'Temporal'], now: new Date('2026-11-18T12:00:00Z') });
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('counts last month as past and next month as future', () => {
    expect(yearMonth('2026-10').isPast('UTC')).toBe(true);
    expect(yearMonth('2026-10').isFuture('UTC')).toBe(false);
    expect(yearMonth('2026-12').isFuture('UTC')).toBe(true);
    expect(yearMonth('2026-12').isPast('UTC')).toBe(false);
  });

  it('counts the month today is in as neither past nor future, from its first day to its last', () => {
    vi.setSystemTime(new Date('2026-11-01T12:00:00Z'));
    expect(yearMonth('2026-11').isPast('UTC')).toBe(false);
    expect(yearMonth('2026-11').isFuture('UTC')).toBe(false);
    vi.setSystemTime(new Date('2026-11-30T12:00:00Z'));
    expect(yearMonth('2026-11').isPast('UTC')).toBe(false);
    expect(yearMonth('2026-11').isFuture('UTC')).toBe(false);
  });

  it('reads today in the zone asked for', () => {
    vi.setSystemTime(new Date('2026-11-01T02:00:00Z'));
    expect(yearMonth('2026-10').isPast('Asia/Tokyo')).toBe(true);
    expect(yearMonth('2026-10').isPast('America/Los_Angeles')).toBe(false);
    expect(yearMonth('2026-11').isFuture('America/Los_Angeles')).toBe(true);
    expect(yearMonth('2026-11').isFuture('Asia/Tokyo')).toBe(false);
  });

  it('keeps a card that expires 11/26 out of the past until December 2026 begins', () => {
    const expiry = monthYear('11/26');
    vi.setSystemTime(new Date('2026-11-30T12:00:00Z'));
    expect(expiry.isPast('UTC')).toBe(false);
    vi.setSystemTime(new Date('2026-12-01T12:00:00Z'));
    expect(expiry.isPast('UTC')).toBe(true);
  });

  it('throws unknownZone at the zone when the zone asked for does not exist', () => {
    expect(() => yearMonth('2026-11').isPast('Mars/Phobos')).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'unknownZone', at: 'Mars/Phobos' }),
    );
  });
});

describe('YearMonth.isPast() and isFuture() on the real clock', () => {
  // real clock on purpose: the tests above hold the clock still, these prove the real one is read
  it('counts the month two months back as past and the month two months ahead as future', () => {
    const current = today('UTC').yearMonth;
    expect(current.minus(2, 'months').isPast('UTC')).toBe(true);
    expect(current.plus(2, 'months').isFuture('UTC')).toBe(true);
    expect(current.minus(2, 'months').isFuture('UTC')).toBe(false);
    expect(current.plus(2, 'months').isPast('UTC')).toBe(false);
  });
});

describe('YearMonth.until() and since()', () => {
  it('measures the span to a later month as a Duration of years and months', () => {
    const span = yearMonth('2026-03').until('2027-06');
    expect(span).toBeInstanceOf(Duration);
    expect(span.toString()).toBe('P1Y3M');
    expect(span).toMatchObject({ years: 1, months: 3 });
  });

  it('returns the total as a number when given a unit', () => {
    const start = yearMonth('2026-03');
    expect(start.until('2027-06', 'months')).toBe(15);
    expect(start.until('2027-06', 'quarters')).toBe(5);
    expect(start.until('2027-06', 'years')).toBe(1.25);
  });

  it('measures a negative span to an earlier month', () => {
    expect(yearMonth('2027-06').until('2026-03').toString()).toBe('-P1Y3M');
    expect(yearMonth('2027-06').until('2026-03', 'months')).toBe(-15);
  });

  it('measures nothing between a month and itself', () => {
    expect(yearMonth('2026-03').until('2026-03', 'months')).toBe(0);
    expect(yearMonth('2026-03').until('2026-03').total('months')).toBe(0);
  });

  it('measures since() from the other month to this one, positive when the other is earlier', () => {
    expect(yearMonth('2026-11').since('2026-05').toString()).toBe('P6M');
    expect(yearMonth('2026-11').since('2026-05', 'months')).toBe(6);
    expect(yearMonth('2026-03').since('2027-06', 'months')).toBe(-15);
  });

  it('counts days and weeks from the first day of each month', () => {
    expect(yearMonth('2026-01').until('2026-03', 'days')).toBe(59);
    expect(yearMonth('2028-01').until('2028-03', 'days')).toBe(60);
    expect(yearMonth('2026-02').until('2026-03', 'weeks')).toBe(4);
  });

  it('returns a Duration that totals in days, since it remembers the month it was measured from', () => {
    expect(yearMonth('2026-01').until('2026-03').total('days')).toBe(59);
    expect(yearMonth('2028-01').until('2028-03').total('days')).toBe(60);
  });

  it('accepts a YearMonth and reads a date as the month it falls in', () => {
    const start = yearMonth('2026-03');
    expect(start.until(yearMonth('2027-06'), 'months')).toBe(15);
    expect(start.until('2027-06-20', 'months')).toBe(15);
    expect(start.since(date('2025-12-31'), 'months')).toBe(3);
  });

  it('throws missingYearMonth when given no month and invalidYearMonth at text that is not one', () => {
    expect(() => yearMonth('2026-03').until()).toThrowError(
      expect.objectContaining({ name: 'TypeError', code: 'missingYearMonth' }),
    );
    expect(() => yearMonth('2026-03').since('whenever')).toThrowError(
      expect.objectContaining({ code: 'invalidYearMonth', at: 'whenever' }),
    );
  });

  it('throws unknownUnit at a unit name that is not one', () => {
    expect(() => yearMonth('2026-03').until('2027-06', 'fortnights')).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'unknownUnit', at: 'fortnights' }),
    );
  });
});

describe('YearMonth.locale() and lang()', () => {
  it('reads undefined until a locale is set', () => {
    expect(yearMonth('2026-05').locale()).toBeUndefined();
    expect(yearMonth('2026-05').lang()).toBeUndefined();
  });

  it('returns a new YearMonth carrying the tag and leaves the original without one', () => {
    const may = yearMonth('2026-05');
    const russian = may.locale('ru');
    expect(russian.locale()).toBe('ru');
    expect(russian.toString()).toBe('2026-05');
    expect(may.locale()).toBeUndefined();
  });

  it('sets and reads the same tag through lang()', () => {
    expect(yearMonth('2026-05').lang('fr').lang()).toBe('fr');
    expect(yearMonth('2026-05').lang('fr').locale()).toBe('fr');
  });

  it('clears the tag with null, undefined or an empty string', () => {
    const russian = yearMonth('2026-05').locale('ru');
    expect(russian.locale(null).locale()).toBeUndefined();
    expect(russian.locale(undefined).locale()).toBeUndefined();
    expect(russian.locale('').locale()).toBeUndefined();
  });

  it('passes the tag on through plus(), minus() and set()', () => {
    const russian = yearMonth('2026-05').locale('ru');
    expect(russian.plus(1, 'month').locale()).toBe('ru');
    expect(russian.minus(1, 'year').locale()).toBe('ru');
    expect(russian.set('month', 1).locale()).toBe('ru');
  });

  it('passes the tag on to the dates from on(), start and end and to the Duration from until()', () => {
    const russian = yearMonth('2026-05').locale('ru');
    expect(russian.on(1).locale()).toBe('ru');
    expect(russian.start.locale()).toBe('ru');
    expect(russian.end.locale()).toBe('ru');
    expect(russian.until('2026-08').locale()).toBe('ru');
    expect(russian.since('2026-01').locale()).toBe('ru');
  });

  it('keeps the tag of a YearMonth or CalendarDate it is read from', () => {
    expect(yearMonth(yearMonth('2026-05').locale('ru')).locale()).toBe('ru');
    expect(monthYear(yearMonth('2026-05').locale('ru')).locale()).toBe('ru');
    expect(yearMonth(date('2026-05-01').locale('ru')).locale()).toBe('ru');
  });

  it('throws unknownLocale at the tag when it is not a locale', () => {
    expect(() => yearMonth('2026-05').locale('not a locale')).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'unknownLocale', at: 'not a locale' }),
    );
  });
});

describe('YearMonth.format()', () => {
  it('prints the same text as the text property when given no format', () => {
    const billing = yearMonth('2026-11', { locale: 'en-US' });
    expect(billing.format()).toBe('Nov 2026');
    expect(billing.format()).toBe(billing.text);
  });

  it('throws unsupportedToken for a day, weekday or clock token, which a year-month cannot fill', () => {
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

describe('YearMonth.as()', () => {
  it("returns the same YearMonth for 'yearMonth'", () => {
    const billing = yearMonth('2026-11');
    expect(billing.as('yearMonth')).toBe(billing);
  });

  it('throws unknownKind at the kind for a date or a month-day, which need a day', () => {
    expect(() => yearMonth('2026-11').as('date')).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'unknownKind', at: 'date' }),
    );
    expect(() => yearMonth('2026-11').as('monthDay')).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'unknownKind', at: 'monthDay' }),
    );
  });
});

describe('YearMonth.toString(), toJSON() and toTemporal()', () => {
  it("writes a four-digit year and a two-digit month, as 'YYYY-MM'", () => {
    expect(yearMonth(2026, 11).toString()).toBe('2026-11');
    expect(yearMonth(2026, 5).toString()).toBe('2026-05');
    expect(yearMonth(987, 5).toString()).toBe('0987-05');
  });

  it('writes the same string into JSON', () => {
    expect(yearMonth(2026, 5).toJSON()).toBe('2026-05');
    expect(JSON.stringify({ billing: yearMonth(2026, 11) })).toBe('{"billing":"2026-11"}');
  });

  it('joins into a string or a template as that same string', () => {
    const billing = yearMonth(2026, 11);
    expect(String(billing)).toBe('2026-11');
    expect(`${billing}`).toBe('2026-11');
    expect('renews ' + billing).toBe('renews 2026-11');
  });

  it('reads every month back from its own string under yearMonth() and monthYear() alike', () => {
    for (const year of [1, 987, 1999, 2026, 9999]) {
      for (let month = 1; month <= 12; month++) {
        const written = yearMonth(year, month);
        expect(yearMonth(written.toString())).toMatchObject({ year, month });
        expect(monthYear(written.toString())).toMatchObject({ year, month });
        expect(yearMonth(JSON.parse(JSON.stringify(written)))).toMatchObject({ year, month });
      }
    }
  });

  it('returns a Temporal.PlainYearMonth in the ISO 8601 calendar that reads back as the same value', () => {
    const plain = yearMonth(2026, 11).toTemporal();
    expect(plain).toBeInstanceOf(Temporal.PlainYearMonth);
    expect(plain.calendarId).toBe('iso8601');
    expect(plain.year).toBe(2026);
    expect(plain.month).toBe(11);
    expect(yearMonth(plain).toString()).toBe('2026-11');
  });
});
