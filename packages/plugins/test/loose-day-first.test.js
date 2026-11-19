import '@native-dates/plugins/loose';
import { configure, date, dateRange, datetime, datetimeRange, monthDay, time, timeRange } from 'native-dates';
import { afterEach, describe, expect, it } from 'vitest';

describe('dayFirst with { loose: true }', () => {
  it.each(['7/9/2026', '07/09/2026', '7.9.2026', '07.09.2026', '7-9-2026', '07-09-2026', '7/9/26'])(
    'reads %j as 9 July without dayFirst and as 7 September with it',
    (text) => {
      expect(date(text, { loose: true })?.toString()).toBe('2026-07-09');
      expect(date(text, { loose: true, dayFirst: false })?.toString()).toBe('2026-07-09');
      expect(date(text, { loose: true, dayFirst: true })?.toString()).toBe('2026-09-07');
    },
  );

  it.each([
    ['de-DE', '6.9.2026'],
    ['en-GB and fr-FR', '06/09/2026'],
    ['es-ES', '6/9/2026'],
    ['nl-NL', '6-9-2026'],
    ['ru-RU', '06.09.2026'],
  ])('reads what toLocaleDateString() prints in %s as 6 September when dayFirst is set', (locales, text) => {
    expect(date(text, { loose: true, dayFirst: true })?.toString()).toBe('2026-09-06');
  });

  it('reads the day first in a date with a clock, keeping the clock', () => {
    const options = { loose: true, dayFirst: true, zone: 'Asia/Tokyo' };
    const written = { zone: 'Asia/Tokyo', month: 9, day: 7, hour: 14, minute: 30 };
    expect(datetime('7/9/2026 14:30', options)).toMatchObject(written);
    expect(datetime('7/9/2026 2:30 PM', options)).toMatchObject(written);
    expect(datetime('7.9.2026, 14:30:00', options)).toMatchObject(written);
  });

  // the 30th can only be a day, so a clock comes back only if the day was read first
  it('reads the day first before taking the clock out of a date and time', () => {
    expect(time('30/9/2026 14:30', { loose: true, dayFirst: true })?.toString()).toBe('14:30:00');
    expect(time('30/9/2026 14:30', { loose: true })).toBeNull();
  });

  it('reads the day first in a date with a clock and an offset, as the moment it names', () => {
    const moment = datetime('7/9/2026 16:30 +0200', { loose: true, dayFirst: true, zone: 'Asia/Tokyo' });
    expect(moment?.toString()).toBe('2026-09-07T14:30:00.000Z');
  });

  it('reads the day first at both ends of every range', () => {
    const options = { loose: true, dayFirst: true };
    expect(dateRange('1/9/2026', '7/9/2026', options)?.toString()).toBe('2026-09-01/2026-09-07');
    expect(dateRange('1/9/2026 - 7/9/2026', options)?.toString()).toBe('2026-09-01/2026-09-07');
    expect(dateRange('01.09.2026 to 07.09.2026', options)?.toString()).toBe('2026-09-01/2026-09-07');
    expect(datetimeRange('1/9/2026 09:00', '1/9/2026 17:00', { ...options, zone: 'UTC' })?.toString()).toBe(
      '2026-09-01T09:00:00.000Z/2026-09-01T17:00:00.000Z',
    );
    expect(timeRange('30/9/2026 09:00', '30/9/2026 17:00', options)?.toString()).toBe('09:00:00/17:00:00');
  });

  it('reads the day first in a month and day with no year', () => {
    expect(monthDay('7/9', { loose: true, dayFirst: true })?.toString()).toBe('09-07');
    expect(monthDay('7/9', { loose: true })?.toString()).toBe('07-09');
  });

  it.each(['2026-09-07', '2026/09/07', '2026.09.07', '2026/9/7', '20260907', '2026-09-07T14:30'])(
    'never reorders %j, which starts with its year',
    (text) => {
      expect(date(text, { loose: true, dayFirst: true })?.toString()).toBe('2026-09-07');
    },
  );

  it.each(['7 Sep 2026', 'Sep 7 2026', 'September 7, 2026', '7/Sep/2026'])(
    'never reorders %j, which names its month',
    (text) => {
      expect(date(text, { loose: true, dayFirst: true })?.toString()).toBe('2026-09-07');
    },
  );

  it('returns null when the month would be past 12, never the other order', () => {
    expect(date('13/09/2026', { loose: true })).toBeNull();
    expect(date('09/13/2026', { loose: true, dayFirst: true })).toBeNull();
    expect(date('13/09/2026', { loose: true, dayFirst: true })?.toString()).toBe('2026-09-13');
    expect(date('09/13/2026', { loose: true })?.toString()).toBe('2026-09-13');
  });

  it('returns null for a day that does not exist when read day first', () => {
    expect(date('30/02/2026', { loose: true, dayFirst: true })).toBeNull();
    expect(date('31/04/2026', { loose: true, dayFirst: true })).toBeNull();
    expect(date('29/02/2026', { loose: true, dayFirst: true })).toBeNull();
    expect(date('29/02/2024', { loose: true, dayFirst: true })?.toString()).toBe('2024-02-29');
    expect(datetime('30/02/2026 10:00', { loose: true, dayFirst: true, zone: 'UTC' })).toBeNull();
  });

  it.todo('reads "7 / 9 / 2026" and "7 9 2026" as 7 September when dayFirst is set, as it does "7/9/2026"');
});

describe('configure({ dayFirst }) with the loose plugin', () => {
  afterEach(() => {
    configure({ dayFirst: null });
  });

  it('reports false until it is set', () => {
    expect(configure().dayFirst).toBe(false);
    expect(configure({ dayFirst: true }).dayFirst).toBe(true);
    expect(configure().dayFirst).toBe(true);
  });

  it('reads the day first in every loose call that passes no dayFirst', () => {
    configure({ dayFirst: true });
    expect(date('7/9/26', { loose: true })?.toString()).toBe('2026-09-07');
    expect(datetime('7/9/2026 14:30', { loose: true, zone: 'UTC' })?.toString()).toBe('2026-09-07T14:30:00.000Z');
    expect(time('30/9/2026 14:30', { loose: true })?.toString()).toBe('14:30:00');
    expect(dateRange('1/9/2026', '7/9/2026', { loose: true })?.toString()).toBe('2026-09-01/2026-09-07');
    expect(dateRange('1/9/2026 - 7/9/2026', { loose: true })?.toString()).toBe('2026-09-01/2026-09-07');
    expect(datetimeRange('1/9/2026 09:00', '1/9/2026 17:00', { loose: true, zone: 'UTC' })?.start.month).toBe(9);
    expect(timeRange('30/9/2026 09:00', '30/9/2026 17:00', { loose: true })?.toString()).toBe('09:00:00/17:00:00');
  });

  it('gives way to dayFirst passed on the call', () => {
    configure({ dayFirst: true });
    expect(date('07.09.2026', { loose: true, dayFirst: false })?.toString()).toBe('2026-07-09');
    configure({ dayFirst: false });
    expect(date('07.09.2026', { loose: true, dayFirst: true })?.toString()).toBe('2026-09-07');
  });

  it('leaves dates that start with their year or name their month alone', () => {
    configure({ dayFirst: true });
    expect(date('2026-07-09', { loose: true })?.toString()).toBe('2026-07-09');
    expect(datetime('2026-07-09T10:00:00Z', { loose: true, zone: 'UTC' })?.toString()).toBe('2026-07-09T10:00:00.000Z');
    expect(date('Jul 9, 2026', { loose: true })?.toString()).toBe('2026-07-09');
  });

  it('goes back to month first when set to false or null', () => {
    configure({ dayFirst: true });
    configure({ dayFirst: false });
    expect(date('7/9/2026', { loose: true })?.toString()).toBe('2026-07-09');
    configure({ dayFirst: true });
    expect(configure({ dayFirst: null }).dayFirst).toBe(false);
    expect(date('7/9/2026', { loose: true })?.toString()).toBe('2026-07-09');
  });

  it('keeps its setting when configure() is called for something else', () => {
    configure({ dayFirst: true });
    configure({ zone: 'UTC' });
    configure({ zone: null });
    expect(date('7/9/2026', { loose: true })?.toString()).toBe('2026-09-07');
  });

  it.todo('reads monthDay("7/9", { loose: true }) as 7 September after configure({ dayFirst: true })');
});
