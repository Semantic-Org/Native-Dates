import '@native-dates/plugins/loose';
import '@native-dates/plugins/zones';
import { configure, datetime, time } from 'native-dates';
import { afterEach, describe, expect, it } from 'vitest';

afterEach(() => {
  configure({ zone: null, locale: null, zoneAliases: null });
});

const read = (text, options) => datetime(text, { loose: true, zone: 'UTC', ...options })?.toString();

describe('zone names inside a { loose: true } string with @native-dates/plugins/zones', () => {
  it.each([
    ['KST', '2026-11-16T05:30:00.000Z'],
    ['JST', '2026-11-16T05:30:00.000Z'],
    ['BRT', '2026-11-16T17:30:00.000Z'],
    ['MSK', '2026-11-16T11:30:00.000Z'],
    ['мск', '2026-11-16T11:30:00.000Z'],
    ['CET', '2026-11-16T13:30:00.000Z'],
    ['PT', '2026-11-16T22:30:00.000Z'],
  ])('reads 14:30 %s as the instant the zone argument gives (%s)', (name, instant) => {
    expect(read(`2026-11-16 14:30 ${name}`)).toBe(instant);
    expect(datetime('2026-11-16 14:30', name).toString()).toBe(instant);
  });

  it('reads CST by the locale, matching the zone argument', () => {
    expect(read('2026-11-16 14:30 CST', { locale: 'zh-CN' })).toBe('2026-11-16T06:30:00.000Z');
    expect(read('2026-11-16 14:30 CST', { locale: 'en-US' })).toBe('2026-11-16T20:30:00.000Z');
    expect(read('2026年11月16日 14:30 CST', { locale: 'zh-CN' })).toBe('2026-11-16T06:30:00.000Z');
  });

  it('reads the name between the clock and the year in date(1) output', () => {
    expect(read('Mon Nov 16 14:30:00 CST 2026', { locale: 'zh-CN' })).toBe('2026-11-16T06:30:00.000Z');
    expect(read('Mon Nov 16 14:30:00 KST 2026')).toBe('2026-11-16T05:30:00.000Z');
  });

  it('applies zoneAliases to a name written in the string', () => {
    configure({ zoneAliases: { HQ: 'Asia/Shanghai' } });
    expect(read('2026-11-16 14:30 HQ')).toBe('2026-11-16T06:30:00.000Z');
  });

  it('follows daylight saving for EST in July, as the zone argument does', () => {
    expect(read('2026-07-04 14:30 EST')).toBe('2026-07-04T18:30:00.000Z');
    expect(datetime('2026-07-04 14:30', 'EST').toString()).toBe('2026-07-04T18:30:00.000Z');
  });

  it('fixes the instant without changing the zone of the result', () => {
    const parsed = datetime('2026-11-16 14:30 KST', { loose: true, zone: 'Europe/Berlin' });
    expect(parsed).toMatchObject({ zone: 'Europe/Berlin', hour: 6, minute: 30 });
    expect(time('2026-11-16 14:30 KST', { loose: true, zone: 'Europe/Berlin' })?.toString()).toBe('06:30:00');
  });

  it('prefers a numeric offset over the name after it, as Go prints them', () => {
    expect(read('2026-11-16 14:30:00 +0800 CST')).toBe('2026-11-16T06:30:00.000Z');
    expect(read('2026-11-16 14:30:00 +0800 CST', { locale: 'en-US' })).toBe('2026-11-16T06:30:00.000Z');
  });

  it('keeps a name before the clock, lowercase Latin words, and a parenthesized name out of the reading', () => {
    expect(read('PST Sep 6 2026 14:30')).toBe('2026-09-06T14:30:00.000Z');
    expect(read('Sep 6 2026 14:30 at home')).toBe('2026-09-06T14:30:00.000Z');
    expect(read('Sep 6 2026 9:30 wake up')).toBe('2026-09-06T09:30:00.000Z');
    expect(read('Sep 6 2026 14:30 (KST)')).toBe('2026-09-06T14:30:00.000Z');
  });

  it('reads AM and PM in capitals as the half of the day rather than a zone', () => {
    expect(read('el 16 de noviembre de 2026 2:30 PM', { locale: 'es' })).toBe('2026-11-16T14:30:00.000Z');
    expect(read('16 novembre 2026 9:05 AM JST', { locale: 'fr' })).toBe('2026-11-16T00:05:00.000Z');
  });

  it('returns null for capitals after the clock that name no zone', () => {
    expect(datetime('2026-11-16 14:30 XYZ', { loose: true, zone: 'UTC' })).toBeNull();
  });
});
