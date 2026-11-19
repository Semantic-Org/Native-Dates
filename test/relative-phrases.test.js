import { configure, date, datetime, now, today } from 'native-dates';
import { afterEach, describe, expect, it } from 'vitest';

const noon = datetime('2026-11-16T12:00', 'UTC');
const monday = date('2026-11-16');

afterEach(() => {
  configure({ locale: null, zone: null });
});

describe('DateTime from()', () => {
  it('says now for the same instant', () => {
    expect(noon.from(noon, 'en-US')).toBe('now');
  });

  it('counts back from the other moment for a moment before it and forward for one after', () => {
    expect(noon.minus(3, 'hours').from(noon, 'en-US')).toBe('3 hours ago');
    expect(noon.plus(3, 'hours').from(noon, 'en-US')).toBe('in 3 hours');
  });

  it('counts in the unit that fits the distance, from seconds up to years', () => {
    expect(noon.plus(30, 'seconds').from(noon, 'en-US')).toBe('in 30 seconds');
    expect(noon.plus(5, 'minutes').from(noon, 'en-US')).toBe('in 5 minutes');
    expect(noon.plus(3, 'hours').from(noon, 'en-US')).toBe('in 3 hours');
    expect(noon.plus(3, 'days').from(noon, 'en-US')).toBe('in 3 days');
    expect(noon.plus(60, 'days').from(noon, 'en-US')).toBe('in 2 months');
    expect(noon.plus(730, 'days').from(noon, 'en-US')).toBe('in 2 years');
  });

  it('rounds up to an hour from 45 minutes and to a day by 23 hours, as Moment and Day.js do', () => {
    expect(noon.plus(44, 'minutes').from(noon, 'en-US')).toBe('in 44 minutes');
    expect(noon.plus(45, 'minutes').from(noon, 'en-US')).toBe('in 1 hour');
    expect(noon.minus(21, 'hours').from(noon, 'en-US')).toBe('21 hours ago');
    expect(noon.minus(23, 'hours').from(noon, 'en-US')).toBe('1 day ago');
  });

  it('rounds the past and the future alike', () => {
    expect(noon.minus(90, 'seconds').from(noon, 'en-US')).toBe('2 minutes ago');
    expect(noon.plus(90, 'seconds').from(noon, 'en-US')).toBe('in 2 minutes');
  });

  it('counts a day in numbers and never says yesterday or tomorrow', () => {
    expect(noon.minus(1, 'day').from(noon, 'en-US')).toBe('1 day ago');
    expect(noon.plus(1, 'day').from(noon, 'en-US')).toBe('in 1 day');
  });

  // 01:00 and 23:00 fall on the same day, so yesterday would be a false claim
  it('says 1 day ago for 22 hours earlier on the same calendar day', () => {
    const lateEvening = datetime('2026-11-16T23:00', 'UTC');
    expect(datetime('2026-11-16T01:00', 'UTC').from(lateEvening, 'en-US')).toBe('1 day ago');
  });

  it('measures elapsed time whatever zone either moment is read in', () => {
    expect(noon.in('Asia/Tokyo').from(noon.minus(1, 'hour').in('America/New_York'), 'en-US')).toBe('in 1 hour');
  });

  it('reads the other moment from a string, a Date or epoch milliseconds', () => {
    const earlier = noon.minus(2, 'hours');
    expect(noon.from('2026-11-16T10:00:00Z', 'en-US')).toBe('in 2 hours');
    expect(noon.from(earlier.toJSDate(), 'en-US')).toBe('in 2 hours');
    expect(noon.from(earlier.epochMilliseconds, 'en-US')).toBe('in 2 hours');
  });

  it('reads a string with no zone or offset in the zone of the moment it is called on', () => {
    const standup = datetime('2026-11-16T09:30', 'America/Los_Angeles');
    expect(standup.from('2026-11-16T07:30', 'en-US')).toBe('in 2 hours');
  });

  it('writes the phrase in the locale passed, then the one the value carries, then the configured one', () => {
    const earlier = noon.minus(3, 'hours');
    configure({ locale: 'es' });
    expect(earlier.from(noon)).toBe('hace 3 horas');
    expect(earlier.locale('fr').from(noon)).toBe('il y a 3 heures');
    expect(earlier.locale('fr').from(noon, 'de')).toBe('vor 3 Stunden');
  });

  it('keeps the locale of the moment it is called on when the other moment carries a different one', () => {
    expect(noon.minus(3, 'hours').locale('fr').from(noon.locale('de'))).toBe('il y a 3 heures');
  });

  it('gives the same phrase from formatRelative()', () => {
    expect(noon.minus(3, 'hours').formatRelative(noon, 'en-US')).toBe('3 hours ago');
  });

  it('throws invalidDateTime at the input when the other moment cannot be read', () => {
    expect(() => noon.from('soon')).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'invalidDateTime', at: 'soon' }),
    );
  });
});

describe('DateTime fromNow()', () => {
  it('says now for the current moment', () => {
    expect(now().fromNow('en-US')).toBe('now');
  });

  it('measures from the current moment', () => {
    expect(now().minus(5, 'minutes').fromNow('en-US')).toBe('5 minutes ago');
    expect(now().plus(2, 'hours').fromNow('en-US')).toBe('in 2 hours');
  });

  it('gives the same phrase as from() and formatRelative() called with no other moment', () => {
    const later = now().plus(3, 'hours');
    expect(later.from(undefined, 'en-US')).toBe('in 3 hours');
    expect(later.formatRelative(undefined, 'en-US')).toBe('in 3 hours');
  });

  it('writes the phrase in the locale the value carries unless one is passed', () => {
    const earlier = now().minus(3, 'hours').locale('fr');
    expect(earlier.fromNow()).toBe('il y a 3 heures');
    expect(earlier.fromNow('de')).toBe('vor 3 Stunden');
  });
});

describe('CalendarDate from()', () => {
  it('says yesterday, today and tomorrow for the days either side of the other date', () => {
    expect(date('2026-11-15').from(monday, 'en-US')).toBe('yesterday');
    expect(date('2026-11-16').from(monday, 'en-US')).toBe('today');
    expect(date('2026-11-17').from(monday, 'en-US')).toBe('tomorrow');
  });

  it('counts days up to six days away', () => {
    expect(monday.plus(3, 'days').from(monday, 'en-US')).toBe('in 3 days');
    expect(monday.minus(6, 'days').from(monday, 'en-US')).toBe('6 days ago');
  });

  it('counts weeks, months and years in numbers beyond that, never as next week or last year', () => {
    expect(monday.plus(7, 'days').from(monday, 'en-US')).toBe('in 1 week');
    expect(monday.plus(14, 'days').from(monday, 'en-US')).toBe('in 2 weeks');
    expect(monday.plus(30, 'days').from(monday, 'en-US')).toBe('in 1 month');
    expect(monday.minus(60, 'days').from(monday, 'en-US')).toBe('2 months ago');
    expect(monday.minus(365, 'days').from(monday, 'en-US')).toBe('1 year ago');
    expect(monday.plus(730, 'days').from(monday, 'en-US')).toBe('in 2 years');
  });

  it('reads the other date from a string', () => {
    expect(monday.from('2026-11-15', 'en-US')).toBe('tomorrow');
  });

  // 03:00 in Tokyo is still the 14th in UTC and in New York
  it('reads a moment as the day it falls on in its own zone', () => {
    expect(monday.from(datetime('2026-11-15T03:00', 'Asia/Tokyo'), 'en-US')).toBe('tomorrow');
  });

  it('writes the phrase in the locale passed, then the one the value carries, then the configured one', () => {
    const sunday = date('2026-11-15');
    configure({ locale: 'es' });
    expect(sunday.from(monday)).toBe('ayer');
    expect(sunday.locale('de').from(monday)).toBe('gestern');
    expect(sunday.locale('de').from(monday, 'fr')).toBe('hier');
  });

  it('gives the same phrase from formatRelative()', () => {
    expect(date('2026-11-15').formatRelative(monday, 'en-US')).toBe('yesterday');
  });

  it('throws invalidDate at the input when the other date cannot be read', () => {
    expect(() => monday.from('soon')).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'invalidDate', at: 'soon' }),
    );
  });
});

describe('CalendarDate fromNow()', () => {
  it('measures from today', () => {
    expect(today().fromNow('en-US')).toBe('today');
    expect(today().minus(1, 'day').fromNow('en-US')).toBe('yesterday');
    expect(today().plus(1, 'day').fromNow('en-US')).toBe('tomorrow');
    expect(today().plus(3, 'days').fromNow('en-US')).toBe('in 3 days');
  });

  it('gives the same phrase as from() and formatRelative() called with no other date', () => {
    const nextWeek = today().plus(14, 'days');
    expect(nextWeek.from(undefined, 'en-US')).toBe('in 2 weeks');
    expect(nextWeek.formatRelative(undefined, 'en-US')).toBe('in 2 weeks');
  });

  // Honolulu is always exactly a day behind Kiritimati, and neither has daylight time
  it('takes today from the configured zone', () => {
    configure({ zone: 'Pacific/Kiritimati' });
    expect(today('Pacific/Honolulu').fromNow('en-US')).toBe('yesterday');
    configure({ zone: 'Pacific/Honolulu' });
    expect(today('Pacific/Kiritimati').fromNow('en-US')).toBe('tomorrow');
  });

  it('writes the phrase in the locale the value carries unless one is passed', () => {
    const yesterday = today().minus(1, 'day').locale('de');
    expect(yesterday.fromNow()).toBe('gestern');
    expect(yesterday.fromNow('fr')).toBe('hier');
  });
});
