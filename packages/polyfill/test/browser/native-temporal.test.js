import { describe, expect, it } from 'vitest';

describe('@native-dates/polyfill in a browser with native Temporal', () => {
  it('preserves native globalThis.Temporal without fetching temporal-polyfill', async () => {
    const native = globalThis.Temporal;
    performance.clearResourceTimings();
    await import('@native-dates/polyfill');
    const resources = performance.getEntriesByType('resource').map((entry) => entry.name);
    expect(globalThis.Temporal).toBe(native);
    expect(resources.some((url) => url.includes('temporal-polyfill'))).toBe(false);
  });
});
