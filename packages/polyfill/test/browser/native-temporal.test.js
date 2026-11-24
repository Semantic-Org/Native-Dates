import { describe, expect, it } from 'vitest';

describe('@native-dates/polyfill in a browser with native Temporal', () => {
  it('preserves native globalThis.Temporal and Intl.DurationFormat without fetching polyfills', async () => {
    const native = globalThis.Temporal;
    const nativeDurationFormat = Intl.DurationFormat;
    performance.clearResourceTimings();
    await import('@native-dates/polyfill');
    const resources = performance.getEntriesByType('resource').map((entry) => entry.name);
    expect(globalThis.Temporal).toBe(native);
    expect(Intl.DurationFormat).toBe(nativeDurationFormat);
    expect(resources.some((url) => url.includes('temporal-polyfill'))).toBe(false);
    expect(resources.some((url) => url.includes('duration-format'))).toBe(false);
  });
});
