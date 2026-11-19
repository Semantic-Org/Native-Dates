import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const native = Object.getOwnPropertyDescriptor(globalThis, 'Temporal');

// each test starts as a runtime that never had Temporal, such as Safari, and loads every module again.
// nothing here imports temporal-polyfill before that, since it hands back the runtime's own Temporal
// when it loads while one is present
beforeEach(() => {
  vi.resetModules();
  delete globalThis.Temporal;
});
afterEach(() => vi.useRealTimers());
afterAll(() => Object.defineProperty(globalThis, 'Temporal', native));

describe.each([
  '@native-dates/polyfill',
  '@native-dates/polyfill/sync',
])('%s on a runtime without Temporal', (entry) => {
  it('installs temporal-polyfill as globalThis.Temporal', async () => {
    await import(entry);
    // the Temporal removed above coming back would mean the polyfill never ran
    expect(globalThis.Temporal).not.toBe(native.value);
    expect(Temporal.PlainDate.from('2026-01-31').add({ months: 1 }).toString()).toBe('2026-02-28');
  });

  it('lets native-dates imported after it work out a date from today', async () => {
    vi.useFakeTimers({ toFake: ['Date'], now: new Date(2026, 10, 16) });
    await import(entry);
    const { today } = await import('native-dates');
    expect(today().plus(30, 'days').toString()).toBe('2026-12-16');
  });
});

// an app imports the polyfill and native-dates side by side, and native-dates finishes loading first
describe('native-dates on a runtime without Temporal', () => {
  it.each([
    'native-dates',
    '@native-dates/core',
    '@native-dates/plugins/zones',
    '@native-dates/plugins/loose',
    '@native-dates/plugins/legacy-date',
  ])('loads %s before any Temporal is in place', async (name) => {
    await expect(import(name)).resolves.toBeDefined();
    expect(globalThis.Temporal).toBeUndefined();
  });

  it('reads, converts and formats a moment once the polyfill arrives after it has loaded', async () => {
    const { datetime } = await import('native-dates');
    await import('@native-dates/plugins/zones');
    await import('@native-dates/polyfill');
    const standup = datetime('2026-11-16T09:30', 'los angeles');
    expect(standup.in('Europe/Berlin').format('YYYY-MM-DD HH:mm')).toBe('2026-11-16 18:30');
  });
});
