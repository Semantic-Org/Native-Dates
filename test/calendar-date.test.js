import { CalendarDate, date, IS_CALENDAR_DATE, isCalendarDate } from 'native-dates';
import { describe, expect, it } from 'vitest';

describe('date()', () => {
  it('returns a CalendarDate holding the year, month and day given as numbers', () => {
    const day = date(2026, 11, 6);
    expect(day).toBeInstanceOf(CalendarDate);
    expect(day).toMatchObject({ year: 2026, month: 11, day: 6 });
  });

  it('reads an ISO date string and a { year, month, day } object as the same day', () => {
    expect(date('2026-11-06').toString()).toBe('2026-11-06');
    expect(date({ year: 2026, month: 11, day: 6 }).toString()).toBe('2026-11-06');
  });

  it('reads a moment as the day it falls on in the zone asked for', () => {
    expect(date('2026-11-06T23:30:00-05:00', 'Asia/Tokyo').toString()).toBe('2026-11-07');
  });

  it('keeps the same day when a CalendarDate is read in another zone', () => {
    expect(date(date(2026, 11, 6), 'Asia/Tokyo').toString()).toBe('2026-11-06');
  });

  it('throws invalidDate at the input when the day does not exist in its month', () => {
    expect(() => date('2026-02-30')).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'invalidDate', at: '2026-02-30' }),
    );
  });

  it('throws missingDay when the numbers stop at the month', () => {
    expect(() => date(2026, 11)).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'missingDay', at: '2026-11' }),
    );
  });

  it('throws missingPlugin at loose when { loose: true } is passed without the loose plugin imported', () => {
    expect(() => date('Nov 6 2026', { loose: true })).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'missingPlugin', at: 'loose' }),
    );
  });
});

describe('isCalendarDate() and instanceof CalendarDate', () => {
  it('accepts an instance created by the factory or the class', () => {
    expect(isCalendarDate(date(2026, 11, 6))).toBe(true);
    expect(isCalendarDate(new CalendarDate('2026-11-06'))).toBe(true);
  });

  it('accepts any object carrying the IS_CALENDAR_DATE brand, so two copies of the package agree', () => {
    const fromAnotherCopy = { [IS_CALENDAR_DATE]: true };
    expect(isCalendarDate(fromAnotherCopy)).toBe(true);
    expect(fromAnotherCopy instanceof CalendarDate).toBe(true);
  });

  it('rejects strings, fields objects and null', () => {
    expect(isCalendarDate('2026-11-06')).toBe(false);
    expect(isCalendarDate({ year: 2026, month: 11, day: 6 })).toBe(false);
    expect(isCalendarDate(null)).toBe(false);
  });
});

describe('CalendarDate own properties', () => {
  it('is frozen, with text first among its own keys', () => {
    const day = date(2026, 11, 6);
    expect(Object.isFrozen(day)).toBe(true);
    expect(Object.keys(day)[0]).toBe('text');
  });
});

describe('CalendarDate plus() and minus()', () => {
  it('returns a new date and leaves the original unchanged', () => {
    const day = date(2026, 11, 6);
    expect(day.plus(2, 'days').toString()).toBe('2026-11-08');
    expect(day.minus(1, 'week').toString()).toBe('2026-10-30');
    expect(day.toString()).toBe('2026-11-06');
  });

  it('gives the same answer under the second spellings add() and subtract()', () => {
    const day = date(2026, 11, 6);
    expect(day.add(2, 'days').equals(day.plus(2, 'days'))).toBe(true);
    expect(day.subtract(1, 'week').equals(day.minus(1, 'week'))).toBe(true);
  });

  it('throws unsupportedUnit at the unit when asked to add or subtract clock time', () => {
    const day = date(2026, 11, 6);
    expect(() => day.plus(2, 'hours')).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'unsupportedUnit', at: 'hours' }),
    );
    expect(() => day.minus({ minutes: 30 })).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'unsupportedUnit', at: 'minutes' }),
    );
  });
});

describe('CalendarDate numeric coercion', () => {
  it('throws unsupportedComparison at the date for < and -', () => {
    const day = date(2026, 11, 6);
    const later = date(2026, 11, 7);
    expect(() => day < later).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'unsupportedComparison', at: '2026-11-06' }),
    );
    expect(() => later - day).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'unsupportedComparison', at: '2026-11-07' }),
    );
  });

  it('gives its ISO string in a template literal and in JSON', () => {
    const day = date(2026, 11, 6);
    expect(`${day}`).toBe('2026-11-06');
    expect(JSON.stringify({ day })).toBe('{"day":"2026-11-06"}');
  });
});

describe('CalendarDate format()', () => {
  it('writes a preset in the locale the call passes', () => {
    expect(date(2026, 11, 6).format('long', 'en-US')).toBe('November 6, 2026');
  });

  it('writes a token pattern literally', () => {
    expect(date(2026, 11, 6).format('YYYY-MM-DD')).toBe('2026-11-06');
  });
});
