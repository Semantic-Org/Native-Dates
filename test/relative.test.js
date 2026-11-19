import { configure, date, datetime, now, today } from 'native-dates';
import { afterEach, describe, expect, it } from 'vitest';

const noon = datetime('2026-11-16T12:00', 'UTC');
const monday = date('2026-11-16');

afterEach(() => {
  configure({ locale: null, zone: null });
});

describe('DateTime from()', () => {
  it('returns "now" for an equal instant', () => {
    expect(noon.from(noon, 'en-US')).toBe('now');
  });

  it('formats past instants as "... ago" and future instants as "in ..."', () => {
    expect(noon.minus(3, 'hours').from(noon, 'en-US')).toBe('3 hours ago');
    expect(noon.plus(3, 'hours').from(noon, 'en-US')).toBe('in 3 hours');
  });

  it('selects units from seconds up to years based on elapsed duration', () => {
    expect(noon.plus(30, 'seconds').from(noon, 'en-US')).toBe('in 30 seconds');
    expect(noon.plus(5, 'minutes').from(noon, 'en-US')).toBe('in 5 minutes');
    expect(noon.plus(3, 'hours').from(noon, 'en-US')).toBe('in 3 hours');
    expect(noon.plus(3, 'days').from(noon, 'en-US')).toBe('in 3 days');
    expect(noon.plus(60, 'days').from(noon, 'en-US')).toBe('in 2 months');
    expect(noon.plus(730, 'days').from(noon, 'en-US')).toBe('in 2 years');
  });

  it('rounds up to 1 hour at 45 minutes and to 1 day at 23 hours, matching Moment and Day.js thresholds', () => {
    expect(noon.plus(44, 'minutes').from(noon, 'en-US')).toBe('in 44 minutes');
    expect(noon.plus(45, 'minutes').from(noon, 'en-US')).toBe('in 1 hour');
    expect(noon.minus(21, 'hours').from(noon, 'en-US')).toBe('21 hours ago');
    expect(noon.minus(23, 'hours').from(noon, 'en-US')).toBe('1 day ago');
  });

  it('transitions to minutes at 45 seconds, months at 26 days, and years at 320 days', () => {
    expect(noon.plus(44, 'seconds').from(noon, 'en-US')).toBe('in 44 seconds');
    expect(noon.plus(45, 'seconds').from(noon, 'en-US')).toBe('in 1 minute');
    expect(noon.minus(25, 'days').from(noon, 'en-US')).toBe('25 days ago');
    expect(noon.minus(26, 'days').from(noon, 'en-US')).toBe('1 month ago');
    expect(noon.minus(319, 'days').from(noon, 'en-US')).toBe('10 months ago');
    expect(noon.minus(320, 'days').from(noon, 'en-US')).toBe('1 year ago');
  });

  it('applies symmetric rounding thresholds to past and future instants', () => {
    expect(noon.minus(90, 'seconds').from(noon, 'en-US')).toBe('2 minutes ago');
    expect(noon.plus(90, 'seconds').from(noon, 'en-US')).toBe('in 2 minutes');
  });

  it('formats 1-day offsets numerically ("1 day ago", "in 1 day") rather than "yesterday" or "tomorrow"', () => {
    expect(noon.minus(1, 'day').from(noon, 'en-US')).toBe('1 day ago');
    expect(noon.plus(1, 'day').from(noon, 'en-US')).toBe('in 1 day');
  });

  // 01:00 and 23:00 fall on the same calendar day, so "yesterday" would be inaccurate
  it('returns "1 day ago" for an instant 22 hours earlier on the same calendar day', () => {
    const lateEvening = datetime('2026-11-16T23:00', 'UTC');
    expect(datetime('2026-11-16T01:00', 'UTC').from(lateEvening, 'en-US')).toBe('1 day ago');
  });

  it('compares exact instants regardless of each DateTime timezone', () => {
    expect(noon.in('Asia/Tokyo').from(noon.minus(1, 'hour').in('America/New_York'), 'en-US')).toBe('in 1 hour');
  });

  it('accepts an ISO string, Date instance, or epoch millisecond number as the anchor', () => {
    const earlier = noon.minus(2, 'hours');
    expect(noon.from('2026-11-16T10:00:00Z', 'en-US')).toBe('in 2 hours');
    expect(noon.from(earlier.toJSDate(), 'en-US')).toBe('in 2 hours');
    expect(noon.from(earlier.epochMilliseconds, 'en-US')).toBe('in 2 hours');
  });

  it('interprets a string without an offset in the receiver timezone', () => {
    const standup = datetime('2026-11-16T09:30', 'America/Los_Angeles');
    expect(standup.from('2026-11-16T07:30', 'en-US')).toBe('in 2 hours');
  });

  it('resolves call-site locale over instance locale over configured locale', () => {
    const earlier = noon.minus(3, 'hours');
    configure({ locale: 'es' });
    expect(earlier.from(noon)).toBe('hace 3 horas');
    expect(earlier.locale('fr').from(noon)).toBe('il y a 3 heures');
    expect(earlier.locale('fr').from(noon, 'de')).toBe('vor 3 Stunden');
  });

  it('uses the receiver locale when the anchor DateTime has a different locale', () => {
    expect(noon.minus(3, 'hours').locale('fr').from(noon.locale('de'))).toBe('il y a 3 heures');
  });

  it('returns the same result from formatRelative() as from()', () => {
    expect(noon.minus(3, 'hours').formatRelative(noon, 'en-US')).toBe('3 hours ago');
  });

  it('throws invalidDateTime when the anchor input cannot be parsed', () => {
    expect(() => noon.from('soon')).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'invalidDateTime', at: 'soon' }),
    );
  });
});

describe('DateTime fromNow()', () => {
  it('returns "now" for now()', () => {
    expect(now().fromNow('en-US')).toBe('now');
  });

  it('formats elapsed time relative to now()', () => {
    expect(now().minus(5, 'minutes').fromNow('en-US')).toBe('5 minutes ago');
    expect(now().plus(2, 'hours').fromNow('en-US')).toBe('in 2 hours');
  });

  it('matches from() and formatRelative() when the anchor is omitted', () => {
    const later = now().plus(3, 'hours');
    expect(later.from(undefined, 'en-US')).toBe('in 3 hours');
    expect(later.formatRelative(undefined, 'en-US')).toBe('in 3 hours');
  });

  it('uses the instance locale unless overridden at the call site', () => {
    const earlier = now().minus(3, 'hours').locale('fr');
    expect(earlier.fromNow()).toBe('il y a 3 heures');
    expect(earlier.fromNow('de')).toBe('vor 3 Stunden');
  });
});

describe('CalendarDate from()', () => {
  it('returns "yesterday", "today", and "tomorrow" for -1, 0, and +1 day offsets', () => {
    expect(date('2026-11-15').from(monday, 'en-US')).toBe('yesterday');
    expect(date('2026-11-16').from(monday, 'en-US')).toBe('today');
    expect(date('2026-11-17').from(monday, 'en-US')).toBe('tomorrow');
  });

  it('formats offsets of 2 through 6 days in days', () => {
    expect(monday.plus(3, 'days').from(monday, 'en-US')).toBe('in 3 days');
    expect(monday.minus(6, 'days').from(monday, 'en-US')).toBe('6 days ago');
  });

  it('formats offsets of 7 days or more numerically in weeks, months, or years', () => {
    expect(monday.plus(7, 'days').from(monday, 'en-US')).toBe('in 1 week');
    expect(monday.plus(14, 'days').from(monday, 'en-US')).toBe('in 2 weeks');
    expect(monday.plus(30, 'days').from(monday, 'en-US')).toBe('in 1 month');
    expect(monday.minus(60, 'days').from(monday, 'en-US')).toBe('2 months ago');
    expect(monday.minus(365, 'days').from(monday, 'en-US')).toBe('1 year ago');
    expect(monday.plus(730, 'days').from(monday, 'en-US')).toBe('in 2 years');
  });

  it('transitions from weeks to months at 26 days and from months to years at 320 days', () => {
    expect(monday.plus(25, 'days').from(monday, 'en-US')).toBe('in 4 weeks');
    expect(monday.plus(26, 'days').from(monday, 'en-US')).toBe('in 1 month');
    expect(monday.minus(319, 'days').from(monday, 'en-US')).toBe('10 months ago');
    expect(monday.minus(320, 'days').from(monday, 'en-US')).toBe('1 year ago');
  });

  it('rounds day counts to the nearest week within the weeks range', () => {
    expect(monday.plus(13, 'days').from(monday, 'en-US')).toBe('in 2 weeks');
    expect(monday.minus(13, 'days').from(monday, 'en-US')).toBe('2 weeks ago');
  });

  it('accepts an ISO date string as the anchor', () => {
    expect(monday.from('2026-11-15', 'en-US')).toBe('tomorrow');
  });

  // 03:00 in Tokyo is still the 14th in UTC and New York
  it('uses the calendar date of a DateTime anchor in its own timezone', () => {
    expect(monday.from(datetime('2026-11-15T03:00', 'Asia/Tokyo'), 'en-US')).toBe('tomorrow');
  });

  it('resolves call-site locale over instance locale over configured locale', () => {
    const sunday = date('2026-11-15');
    configure({ locale: 'es' });
    expect(sunday.from(monday)).toBe('ayer');
    expect(sunday.locale('de').from(monday)).toBe('gestern');
    expect(sunday.locale('de').from(monday, 'fr')).toBe('hier');
  });

  it('returns the same result from formatRelative() as from()', () => {
    expect(date('2026-11-15').formatRelative(monday, 'en-US')).toBe('yesterday');
  });

  it('throws invalidDate when the anchor input cannot be parsed', () => {
    expect(() => monday.from('soon')).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'invalidDate', at: 'soon' }),
    );
  });
});

describe('CalendarDate fromNow()', () => {
  it('formats relative day offsets against today()', () => {
    expect(today().fromNow('en-US')).toBe('today');
    expect(today().minus(1, 'day').fromNow('en-US')).toBe('yesterday');
    expect(today().plus(1, 'day').fromNow('en-US')).toBe('tomorrow');
    expect(today().plus(3, 'days').fromNow('en-US')).toBe('in 3 days');
  });

  it('matches from() and formatRelative() when the anchor is omitted', () => {
    const nextWeek = today().plus(14, 'days');
    expect(nextWeek.from(undefined, 'en-US')).toBe('in 2 weeks');
    expect(nextWeek.formatRelative(undefined, 'en-US')).toBe('in 2 weeks');
  });

  // Honolulu is always a day behind Kiritimati and neither observes DST
  it('resolves today against the configured default timezone', () => {
    configure({ zone: 'Pacific/Kiritimati' });
    expect(today('Pacific/Honolulu').fromNow('en-US')).toBe('yesterday');
    configure({ zone: 'Pacific/Honolulu' });
    expect(today('Pacific/Kiritimati').fromNow('en-US')).toBe('tomorrow');
  });

  it('uses the instance locale unless overridden at the call site', () => {
    const yesterday = today().minus(1, 'day').locale('de');
    expect(yesterday.fromNow()).toBe('gestern');
    expect(yesterday.fromNow('fr')).toBe('hier');
  });
});
