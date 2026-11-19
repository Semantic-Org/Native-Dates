import { date, dayOfWeek } from 'native-dates';
import { describe, expect, it } from 'vitest';

describe('dayOfWeek()', () => {
  it.each([
    ['monday', 1],
    ['tuesday', 2],
    ['wednesday', 3],
    ['thursday', 4],
    ['friday', 5],
    ['saturday', 6],
    ['sunday', 7],
  ])('reads %s as %i', (name, number) => {
    expect(dayOfWeek(name)).toBe(number);
  });

  it.each([
    ['mon', 1],
    ['Tue', 2],
    ['WED', 3],
    ['thu', 4],
    ['Fri', 5],
    ['sat', 6],
    ['SUN', 7],
  ])('reads the three-letter prefix %s as %i in any letter case', (prefix, number) => {
    expect(dayOfWeek(prefix)).toBe(number);
  });

  it('reads a full name in any letter case', () => {
    expect(dayOfWeek('Monday')).toBe(1);
    expect(dayOfWeek('SUNDAY')).toBe(7);
  });

  it('returns a whole number from 1 to 7 as it is', () => {
    expect([1, 2, 3, 4, 5, 6, 7].map(dayOfWeek)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  it('numbers days the way the dayOfWeek property of a date does', () => {
    const monday = date('2026-11-16');
    expect(monday.dayOfWeek).toBe(dayOfWeek('monday'));
    expect(monday.plus(6, 'days').dayOfWeek).toBe(dayOfWeek('sunday'));
  });

  it.each([
    ['a name that is no weekday', 'funday', 'funday'],
    ['an empty string', '', ''],
    ['a single letter two weekdays share', 't', 't'],
    ['0, the Sunday of Date.prototype.getDay(),', 0, '0'],
    ['8', 8, '8'],
    ['a fractional number', 1.5, '1.5'],
    ['NaN', NaN, 'NaN'],
    ['null', null, 'null'],
    ['undefined', undefined, 'undefined'],
  ])('refuses %s with an unknownDayOfWeek RangeError', (label, input, at) => {
    expect(() => dayOfWeek(input)).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'unknownDayOfWeek', at }),
    );
  });

  it.todo("refuses a word that only begins like a weekday, such as 'month', 'monkey' or 'sunshine'");
});
