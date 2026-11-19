import { date, days, time, weekdayNames } from 'native-dates';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { cdp } from 'vitest/browser';

// set before the first value is made, since a browser keeps one language for the life of a page
beforeAll(() => cdp().send('Emulation.setLocaleOverride', { locale: 'de-DE' }));
afterAll(() => cdp().send('Emulation.setLocaleOverride', {}));

describe('the language of the browser', () => {
  it('is the language of text when no locale is passed, carried or configured', () => {
    expect(date('2026-05-15').text).toBe('15.05.2026');
    expect(time('5:30pm').text).toBe('17:30');
    expect(days(2).text).toBe('2 Tage');
  });

  it('is the language of format() presets and token names', () => {
    expect(date('2026-05-15').format('long')).toBe('15. Mai 2026');
    expect(date('2026-05-15').format('dddd, D. MMMM')).toBe('Freitag, 15. Mai');
  });

  it('sets the day a week starts on', () => {
    expect(date('2026-11-18').startOf('week').toString()).toBe('2026-11-16');
    expect(weekdayNames('short')[0]).toBe('Mo');
  });

  it('is overridden by a locale passed to one call', () => {
    expect(date('2026-05-15').format('long', 'en-US')).toBe('May 15, 2026');
  });
});
