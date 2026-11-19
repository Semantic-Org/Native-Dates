import { beforeAll, describe, expect, it, vi } from 'vitest';

// this page stands in for a browser that never had Temporal, such as Safari.
// a page loads a module once, so the app boots in beforeAll and each test reads what that left
const native = globalThis.Temporal;
delete globalThis.Temporal;

describe('@native-dates/polyfill in a browser without Temporal', () => {
  let app;

  beforeAll(async () => {
    performance.clearResourceTimings();
    vi.useFakeTimers({ toFake: ['Date'], now: new Date(2026, 10, 16) });
    app = await import('./apps/default-entry/main.js');
    vi.useRealTimers();
  });

  it('boots an app whose entry imports the polyfill and then native-dates', () => {
    expect(app.launch.toString()).toBe('2026-12-16');
  });

  it('installs temporal-polyfill as globalThis.Temporal', () => {
    expect(globalThis.Temporal).toBeDefined();
    expect(globalThis.Temporal).not.toBe(native);
  });

  it('downloads temporal-polyfill', () => {
    const downloads = performance.getEntriesByType('resource').map((entry) => entry.name);
    expect(downloads.some((url) => url.includes('temporal-polyfill'))).toBe(true);
  });
});
