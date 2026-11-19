import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

const native = globalThis.Temporal;
delete globalThis.Temporal;

afterAll(() => {
  globalThis.Temporal = native;
});

describe('@native-dates/polyfill in a browser without Temporal', () => {
  let app;

  beforeAll(async () => {
    delete globalThis.Temporal;
    performance.clearResourceTimings();
    vi.useFakeTimers({ toFake: ['Date'], now: new Date(2026, 10, 16) });
    try {
      app = await import('./fixtures/default-entry.js');
    }
    finally {
      vi.useRealTimers();
    }
  });

  it('runs an entry module that imports the polyfill before native-dates', () => {
    expect(app.launch.toString()).toBe('2026-12-16');
  });

  it('installs temporal-polyfill onto globalThis.Temporal', () => {
    expect(globalThis.Temporal).toBeDefined();
    expect(globalThis.Temporal).not.toBe(native);
  });

  it('fetches the temporal-polyfill module dynamically', () => {
    const resources = performance.getEntriesByType('resource').map((entry) => entry.name);
    expect(resources.some((url) => url.includes('temporal-polyfill'))).toBe(true);
  });
});

describe('@native-dates/polyfill/sync in a browser without Temporal', () => {
  it('installs Temporal synchronously before sibling imports run', async () => {
    delete globalThis.Temporal;
    vi.useFakeTimers({ toFake: ['Date'], now: new Date(2026, 10, 16) });
    try {
      const { start } = await import('./fixtures/sync-entry.js');
      expect(start.toString()).toBe('2026-11-16');
      expect(globalThis.Temporal).toBeDefined();
      expect(globalThis.Temporal).not.toBe(native);
    }
    finally {
      vi.useRealTimers();
    }
  });
});
