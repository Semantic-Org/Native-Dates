import { build } from 'esbuild';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const native = Object.getOwnPropertyDescriptor(globalThis, 'Temporal');

beforeEach(() => {
  vi.resetModules();
});

afterEach(() => {
  vi.useRealTimers();
  Object.defineProperty(globalThis, 'Temporal', native);
});

// run missing-Temporal checks first because Node caches externalized temporal-polyfill on first load
describe.each([
  '@native-dates/polyfill',
  '@native-dates/polyfill/sync',
])('%s without globalThis.Temporal', (entry) => {
  beforeEach(() => {
    delete globalThis.Temporal;
  });

  it('installs temporal-polyfill onto globalThis.Temporal', async () => {
    await import(entry);
    expect(globalThis.Temporal).toBeDefined();
    expect(globalThis.Temporal).not.toBe(native.value);
    expect(Temporal.PlainDate.from('2026-01-31').add({ months: 1 }).toString()).toBe('2026-02-28');
  });

  it('runs native-dates date math after installing globalThis.Temporal', async () => {
    vi.useFakeTimers({ toFake: ['Date'], now: new Date(2026, 10, 16) });
    await import(entry);
    const { today } = await import('native-dates');
    expect(today().plus(30, 'days').toString()).toBe('2026-12-16');
  });
});

describe('package load order without globalThis.Temporal', () => {
  beforeEach(() => {
    delete globalThis.Temporal;
  });

  it.each([
    'native-dates',
    '@native-dates/core',
    '@native-dates/plugins/zones',
    '@native-dates/plugins/loose',
    '@native-dates/plugins/legacy-date',
  ])('imports %s cleanly before globalThis.Temporal exists', async (specifier) => {
    await expect(import(specifier)).resolves.toBeDefined();
    expect(globalThis.Temporal).toBeUndefined();
  });

  it('parses, converts, and formats dates when @native-dates/polyfill loads after native-dates', async () => {
    const { datetime } = await import('native-dates');
    await import('@native-dates/plugins/zones');
    await import('@native-dates/polyfill');
    const standup = datetime('2026-11-16T09:30', 'los angeles');
    expect(standup.in('Europe/Berlin').format('YYYY-MM-DD HH:mm')).toBe('2026-11-16 18:30');
  });
});

describe.each([
  '@native-dates/polyfill',
  '@native-dates/polyfill/sync',
])('%s with native globalThis.Temporal', (entry) => {
  it('preserves native globalThis.Temporal', async () => {
    await import(entry);
    expect(globalThis.Temporal).toBe(native.value);
  });
});

describe('@native-dates/polyfill esbuild chunk splitting', () => {
  it('splits temporal-polyfill out of the entry chunk into a lazy chunk', async () => {
    const { metafile } = await build({
      stdin: {
        contents: `
          import '@native-dates/polyfill';
          import { today } from 'native-dates';
          console.log(today());
        `,
        resolveDir: import.meta.dirname,
      },
      bundle: true,
      splitting: true,
      format: 'esm',
      outdir: 'chunks',
      write: false,
      metafile: true,
      logLevel: 'silent',
    });
    const chunks = Object.values(metafile.outputs);
    const hasPolyfill = (chunk) => Object.keys(chunk.inputs).some((file) => file.includes('temporal-polyfill'));
    const entry = chunks.find((chunk) => chunk.entryPoint === '<stdin>');
    expect(hasPolyfill(entry)).toBe(false);
    expect(chunks.filter(hasPolyfill)).toHaveLength(1);
  });
});
