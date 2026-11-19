import { date, days, time, weekdayNames } from 'native-dates';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { cdp } from 'vitest/browser';

// set before constructing values so Chromium initializes Intl with de-DE as the default locale
beforeAll(() => cdp().send('Emulation.setLocaleOverride', { locale: 'de-DE' }));
afterAll(() => cdp().send('Emulation.setLocaleOverride', {}));

describe('default browser locale', () => {
  it('formats .text in the browser locale when no locale is configured or attached', () => {
    expect(date('2026-05-15').text).toBe('15.05.2026');
    expect(time('5:30pm').text).toBe('17:30');
    expect(days(2).text).toBe('2 Tage');
  });

  it('formats presets and localized tokens in the browser locale', () => {
    expect(date('2026-05-15').format('long')).toBe('15. Mai 2026');
    expect(date('2026-05-15').format('dddd, D. MMMM')).toBe('Freitag, 15. Mai');
  });

  it('derives default weekStart and weekdayNames() order from the browser locale', () => {
    expect(date('2026-11-18').startOf('week').toString()).toBe('2026-11-16');
    expect(weekdayNames('short')[0]).toBe('Mo');
  });

  it('allows a call-site locale argument to override the browser locale', () => {
    expect(date('2026-05-15').format('long', 'en-US')).toBe('May 15, 2026');
  });
});
