import { Temporal as polyfill } from 'temporal-polyfill';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const native = globalThis.Temporal;

// each test loads the entry again, since it installs once as it is imported
beforeEach(() => vi.resetModules());
afterEach(() => vi.unstubAllGlobals());

describe('@native-dates/polyfill', () => {
  it('leaves the Temporal of the runtime in place when it has one', async () => {
    await import('@native-dates/polyfill');
    expect(globalThis.Temporal).toBe(native);
  });

  it('installs temporal-polyfill as globalThis.Temporal when the runtime has none', async () => {
    vi.stubGlobal('Temporal', undefined);
    await import('@native-dates/polyfill');
    expect(globalThis.Temporal).toBe(polyfill);
  });

  it('lets native-dates imported after it run on a runtime without Temporal', async () => {
    vi.stubGlobal('Temporal', undefined);
    await import('@native-dates/polyfill');
    const { date } = await import('native-dates');
    expect(date(2026, 11, 6).plus(1, 'month').toString()).toBe('2026-12-06');
  });
});

describe('@native-dates/polyfill/sync', () => {
  it('leaves the Temporal of the runtime in place when it has one', async () => {
    await import('@native-dates/polyfill/sync');
    expect(globalThis.Temporal).toBe(native);
  });

  it('installs temporal-polyfill as globalThis.Temporal when the runtime has none', async () => {
    vi.stubGlobal('Temporal', undefined);
    await import('@native-dates/polyfill/sync');
    expect(globalThis.Temporal).toBe(polyfill);
  });
});
