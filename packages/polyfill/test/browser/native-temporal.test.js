import { describe, expect, it } from 'vitest';

describe('@native-dates/polyfill in a browser with Temporal', () => {
  it('leaves the Temporal of the browser in place and downloads no polyfill', async () => {
    const native = globalThis.Temporal;
    performance.clearResourceTimings();
    await import('@native-dates/polyfill');
    const downloads = performance.getEntriesByType('resource').map((entry) => entry.name);
    expect(globalThis.Temporal).toBe(native);
    expect(downloads.some((url) => url.includes('temporal-polyfill'))).toBe(false);
  });
});
