import { afterEach, describe, expect, it, vi } from 'vitest';

// this page stands in for a browser that never had Temporal, such as Safari
const native = globalThis.Temporal;
delete globalThis.Temporal;

afterEach(() => vi.useRealTimers());

describe('@native-dates/polyfill/sync in a browser without Temporal', () => {
  // the default entry is still downloading when a module beside it runs, and this app throws there
  it('is in place before a module that works out a date as it loads', async () => {
    vi.useFakeTimers({ toFake: ['Date'], now: new Date(2026, 10, 16) });
    const { start } = await import('./apps/sync-entry/main.js');
    expect(start.toString()).toBe('2026-11-16');
    expect(globalThis.Temporal).not.toBe(native);
  });
});
