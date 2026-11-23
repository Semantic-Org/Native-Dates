import '@native-dates/plugins/loose';
import '@native-dates/plugins/zones';
import { configure, datetime, time } from 'native-dates';
import { afterEach, describe, expect, it } from 'vitest';

afterEach(() => {
  configure({ zone: null, locale: null, zoneAliases: null });
});

const read = (text, options) => datetime(text, { loose: true, zone: 'UTC', ...options })?.toString();

describe('datetime() zone abbreviations in the input string with { loose: true } and @native-dates/plugins/zones', () => {
  it.each([
    ['KST', '2026-11-16T05:30:00.000Z'],
    ['JST', '2026-11-16T05:30:00.000Z'],
    ['BRT', '2026-11-16T17:30:00.000Z'],
    ['MSK', '2026-11-16T11:30:00.000Z'],
    ['мск', '2026-11-16T11:30:00.000Z'],
    ['CET', '2026-11-16T13:30:00.000Z'],
    ['PT', '2026-11-16T22:30:00.000Z'],
  ])('parses 14:30 %s to the same instant as the zone argument (%s)', (name, instant) => {
    expect(read(`2026-11-16 14:30 ${name}`)).toBe(instant);
    expect(datetime('2026-11-16 14:30', name).toString()).toBe(instant);
  });

  it('parses CST as Asia/Shanghai under zh-CN and America/Chicago under en-US', () => {
    expect(read('2026-11-16 14:30 CST', { locale: 'zh-CN' })).toBe('2026-11-16T06:30:00.000Z');
    expect(read('2026-11-16 14:30 CST', { locale: 'en-US' })).toBe('2026-11-16T20:30:00.000Z');
    expect(read('2026年11月16日 14:30 CST', { locale: 'zh-CN' })).toBe('2026-11-16T06:30:00.000Z');
  });

  it('parses an abbreviation between the clock and the year in date(1) output', () => {
    expect(read('Mon Nov 16 14:30:00 CST 2026', { locale: 'zh-CN' })).toBe('2026-11-16T06:30:00.000Z');
    expect(read('Mon Nov 16 14:30:00 KST 2026')).toBe('2026-11-16T05:30:00.000Z');
  });

  it('applies zoneAliases to an abbreviation in the string', () => {
    configure({ zoneAliases: { HQ: 'Asia/Shanghai' } });
    expect(read('2026-11-16 14:30 HQ')).toBe('2026-11-16T06:30:00.000Z');
  });

  it('keeps fixed UTC offsets for explicit US/EU/UK/AU/NZ inline codes while bare zone arguments observe DST', () => {
    expect(read('2026-07-04 14:30 EST')).toBe('2026-07-04T19:30:00.000Z');
    expect(read('2026-07-04 14:30 EDT')).toBe('2026-07-04T18:30:00.000Z');
    expect(read('2026-07-04 14:30 PST')).toBe('2026-07-04T22:30:00.000Z');
    expect(read('2026-01-04 14:30 PDT')).toBe('2026-01-04T21:30:00.000Z');
    expect(read('2026-07-15 14:30 CET')).toBe('2026-07-15T13:30:00.000Z');
    expect(read('2026-07-15 14:30 CEST')).toBe('2026-07-15T12:30:00.000Z');
    expect(read('2026-01-15 14:30 BST')).toBe('2026-01-15T13:30:00.000Z');
    expect(read('2026-01-15 14:30 BST', { locale: 'bn' })).toBe('2026-01-15T08:30:00.000Z');
    expect(read('2026-01-15 14:30 AEST')).toBe('2026-01-15T04:30:00.000Z');
    expect(read('2026-07-15 14:30 AEDT')).toBe('2026-07-15T03:30:00.000Z');
    expect(read('2026-01-15 14:30 NZST')).toBe('2026-01-15T02:30:00.000Z');
    expect(read('2026-07-15 14:30 NZDT')).toBe('2026-07-15T01:30:00.000Z');
    expect(datetime('2026-07-04 14:30', 'EST').toString()).toBe('2026-07-04T18:30:00.000Z');
  });

  it('sets the instant from the abbreviation and keeps the zone option on the result', () => {
    const parsed = datetime('2026-11-16 14:30 KST', { loose: true, zone: 'Europe/Berlin' });
    expect(parsed).toMatchObject({ zone: 'Europe/Berlin', hour: 6, minute: 30 });
    expect(time('2026-11-16 14:30 KST', { loose: true, zone: 'Europe/Berlin' })?.toString()).toBe('06:30:00');
  });

  it('uses the numeric offset over the abbreviation after it in Go timestamps', () => {
    expect(read('2026-11-16 14:30:00 +0800 CST')).toBe('2026-11-16T06:30:00.000Z');
    expect(read('2026-11-16 14:30:00 +0800 CST', { locale: 'en-US' })).toBe('2026-11-16T06:30:00.000Z');
  });

  it('ignores an abbreviation before the clock, lowercase words, and a parenthesized abbreviation', () => {
    expect(read('PST Sep 6 2026 14:30')).toBe('2026-09-06T14:30:00.000Z');
    expect(read('Sep 6 2026 14:30 at home')).toBe('2026-09-06T14:30:00.000Z');
    expect(read('Sep 6 2026 9:30 wake up')).toBe('2026-09-06T09:30:00.000Z');
    expect(read('Sep 6 2026 14:30 (KST)')).toBe('2026-09-06T14:30:00.000Z');
  });

  it('parses uppercase AM and PM as the meridiem rather than a zone', () => {
    expect(read('el 16 de noviembre de 2026 2:30 PM', { locale: 'es' })).toBe('2026-11-16T14:30:00.000Z');
    expect(read('16 novembre 2026 9:05 AM JST', { locale: 'fr' })).toBe('2026-11-16T00:05:00.000Z');
  });

  it('returns null for an unknown uppercase abbreviation after the clock', () => {
    expect(datetime('2026-11-16 14:30 XYZ', { loose: true, zone: 'UTC' })).toBeNull();
  });
});
