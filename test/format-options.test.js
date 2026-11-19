import { date, dateRange, datetime, monthDay, time, yearMonth } from 'native-dates';
import { describe, expect, it } from 'vitest';

const monday = date('2026-11-16');
const afternoon = time('17:30:15');
const november = yearMonth('2026-11');
const birthday = monthDay(10, 17);

describe('format() with an Intl options bag', () => {
  it('prints only the fields the bag names', () => {
    expect(monday.format({ weekday: 'long' }, 'en-US')).toBe('Monday');
    expect(monday.format({ month: 'short', day: 'numeric' }, 'en-US')).toBe('Nov 16');
  });

  it('prints a datetime from a bag of date and clock fields in the locale asked for', () => {
    const standup = datetime('2026-11-16T09:30', 'America/Los_Angeles');
    expect(standup.format({ weekday: 'short', hour: '2-digit', minute: '2-digit' }, 'de-DE')).toBe('Mo., 09:30');
  });

  it('formats a datetime, a date and a time from one bag, each keeping only its own fields', () => {
    const bag = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      timeZoneName: 'short',
    };
    const standup = datetime('2026-11-16T09:30', 'America/Los_Angeles');
    expect(standup.format(bag, 'en-US')).toBe('Monday, November 16, 2026 at 9:30 AM PST');
    expect(monday.format(bag, 'en-US')).toBe('Monday, November 16, 2026');
    expect(afternoon.format(bag, 'en-US')).toBe('5:30 PM');
  });

  it('drops the year from a month-day and the day from a year-month', () => {
    const bag = { year: 'numeric', month: 'long', day: 'numeric' };
    expect(birthday.format(bag, 'en-US')).toBe('October 17');
    expect(november.format(bag, 'en-US')).toBe('November 2026');
  });

  // \s* around the dash because ICU versions differ there
  it('prints a range through Intl, writing the month both ends share once', () => {
    const week = dateRange('2026-09-01', '2026-09-07');
    expect(week.format({ month: 'long', day: 'numeric' }, 'en-US')).toMatch(/^September 1\s*–\s*7$/);
  });

  it('prints the default date instead of midnight when a date is given only clock options', () => {
    expect(monday.format({ timeStyle: 'short' }, 'en-US')).toBe('Nov 16, 2026');
    expect(monday.format({ hour: 'numeric', minute: '2-digit' }, 'en-US')).toBe('Nov 16, 2026');
  });

  it('prints the default clock instead of 1970 when a time is given only date options', () => {
    expect(afternoon.format({ year: 'numeric' }, 'en-US')).toBe('5:30 PM');
    expect(afternoon.format({ dateStyle: 'full' }, 'en-US')).toBe('5:30 PM');
  });

  it('applies a clock setting such as hour12 to the default clock of a time', () => {
    expect(afternoon.format({ hour12: false }, 'en-US')).toBe('17:30');
  });

  it.todo('keeps the default date and clock of a datetime when the bag names no field, such as { hour12: false }');

  it('prints a datetime in the zone a bag names in timeZone, for that call only', () => {
    const standup = datetime('2026-11-16T09:30', 'America/Los_Angeles');
    const clock = { hour: 'numeric', minute: '2-digit' };
    expect(standup.format({ ...clock, timeZone: 'Asia/Tokyo' }, 'en-US')).toBe('2:30 AM');
    expect(standup.format({ dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Tokyo' }, 'en-US')).toBe(
      'Nov 17, 2026, 2:30 AM',
    );
    expect(standup.format(clock, 'en-US')).toBe('9:30 AM');
  });

  // a bag kept from toLocaleDateString(), where a zone west of Greenwich turns a date into the day before
  it('keeps a date on its own day and a time on its own clock when a bag names a timeZone', () => {
    const inHonolulu = { timeZone: 'Pacific/Honolulu' };
    expect(monday.format({ dateStyle: 'long', ...inHonolulu }, 'en-US')).toBe('November 16, 2026');
    expect(afternoon.format({ timeStyle: 'short', ...inHonolulu }, 'en-US')).toBe('5:30 PM');
    expect(birthday.format({ month: 'long', day: 'numeric', ...inHonolulu }, 'en-US')).toBe('October 17');
    expect(november.format({ year: 'numeric', month: 'long', ...inHonolulu }, 'en-US')).toBe('November 2026');
  });

  // a datetime prints the clock of the runtime's zone, and a time prints 1/1/1970
  it.todo('keeps the zone of a datetime when the bag carries timeZone: undefined');
  it.todo('keeps the default clock of a time when the bag carries timeStyle: undefined');

  it('prints the clock of a time with no zone name when a bag asks for timeStyle long or full', () => {
    expect(afternoon.format({ timeStyle: 'long' }, 'en-US')).toBe('5:30:15 PM');
    expect(afternoon.format({ timeStyle: 'full' }, 'en-US')).toBe('5:30:15 PM');
  });

  // the year alone, since Intl given a Temporal date prints the Julian day for a date before 1582
  it('prints a year before 100 as written instead of reading it as 19xx', () => {
    expect(date('0099-06-15').format({ year: 'numeric' }, 'en-US')).toBe('99');
    expect(date('0005-06-15').format({ year: 'numeric' }, 'en-US')).toBe('5');
  });

  it('prints the milliseconds of a time when a bag asks for fractional seconds', () => {
    const lap = time('17:30:15.123');
    const bag = { hour: 'numeric', minute: '2-digit', second: '2-digit', fractionalSecondDigits: 3 };
    expect(lap.format(bag, 'en-US')).toBe('5:30:15.123 PM');
  });

  it('throws unknownFormat when Intl refuses the bag', () => {
    expect(() => monday.format({ month: 'bogus' }, 'en-US')).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'unknownFormat', at: '{"month":"bogus"}' }),
    );
  });

  it('throws unknownFormat when the spec is neither a string nor a bag', () => {
    expect(() => monday.format(123)).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'unknownFormat', at: '123' }),
    );
  });
});
