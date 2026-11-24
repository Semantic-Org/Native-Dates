import { build } from 'esbuild';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const native = Object.getOwnPropertyDescriptor(globalThis, 'Temporal');
const nativeDurationFormat = Object.getOwnPropertyDescriptor(Intl, 'DurationFormat');

beforeEach(() => {
  vi.resetModules();
});

afterEach(() => {
  vi.useRealTimers();
  Object.defineProperty(globalThis, 'Temporal', native);
  Object.defineProperty(Intl, 'DurationFormat', nativeDurationFormat);
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
])('%s without Intl.DurationFormat', (entry) => {
  beforeEach(() => {
    delete Intl.DurationFormat;
  });

  it('installs the Intl.DurationFormat fallback onto Intl', async () => {
    await import(entry);
    expect(Intl.DurationFormat).toBeDefined();
    expect(Intl.DurationFormat).not.toBe(nativeDurationFormat.value);
    expect(Intl.DurationFormat.supportedLocalesOf(['en-US', 'fr'])).toEqual(['en-US', 'fr']);
  });

  it('formats Duration.text and all four styles end-to-end with native-dates', async () => {
    delete globalThis.Temporal;
    await import(entry);
    const { duration, hours, milliseconds, seconds } = await import('native-dates');

    const span = duration('1h 30m', { locale: 'en-US' });
    expect(span.text).toBe('1 hour, 30 minutes');
    expect(span.format('long', 'en-US')).toBe('1 hour, 30 minutes');
    expect(span.format('short', 'en-US')).toBe('1 hr, 30 min');
    expect(span.format('narrow', 'en-US')).toBe('1h 30m');
    expect(span.format('digital', 'en-US')).toBe('1:30:00');

    expect(seconds(90).format('digital', 'en-US')).toBe('01:30');
    expect(seconds(45).format('digital', 'en-US')).toBe('00:45');

    expect(hours(-2).format('long', 'en-US')).toBe('-2 hours');
    expect(duration('-1h 30m').format('short', 'en-US')).toBe('-1 hr, 30 min');
    expect(duration('-1h 30m').format('digital', 'en-US')).toBe('-1:30:00');

    expect(duration(0).format('long', 'en-US')).toBe('0 seconds');
    expect(duration(0).format('short', 'en-US')).toBe('0 sec');
    expect(duration(0).format('narrow', 'en-US')).toBe('0s');
    expect(duration(0).format('digital', 'en-US')).toBe('00:00');

    expect(milliseconds(250).format('long', 'en-US')).toBe('250 milliseconds');
    expect(milliseconds(250).format('short', 'en-US')).toBe('250 ms');
    expect(milliseconds(250).format('digital', 'en-US')).toBe('00:00.25');

    const full = duration('P1Y2M3W4DT5H6M7S');
    expect(full.format('long', 'en-US')).toBe(
      '1 year, 2 months, 3 weeks, 4 days, 5 hours, 6 minutes, 7 seconds',
    );
    expect(full.format('digital', 'en-US')).toBe('1 yr, 2 mths, 3 wks, 4 days, 5:06:07');
  });

  it('matches native Intl.DurationFormat across locales, styles, subseconds, and formatToParts', async () => {
    await import(entry);
    const NativeDF = nativeDurationFormat.value;
    const PolyDF = Intl.DurationFormat;
    const samples = [
      { hours: 2, minutes: 30 },
      { hours: 0, minutes: 1, seconds: 30 },
      { hours: 0 },
      { hours: -1, minutes: -30 },
      { days: -1, hours: -2, minutes: -30 },
      { years: 1, months: 2, weeks: 3, days: 4, hours: 5, minutes: 6, seconds: 7 },
      { seconds: 5, milliseconds: 5, microseconds: 6, nanoseconds: 7 },
      { hours: 0, milliseconds: -250 },
      { milliseconds: 250 },
      { microseconds: 500 },
      { nanoseconds: 123 },
    ];

    for (const locale of ['en-US', 'fr', 'de', 'ja', 'es', 'ar']) {
      for (const style of ['long', 'short', 'narrow', 'digital']) {
        const opts = { style, hoursDisplay: 'auto' };
        const nativeFmt = new NativeDF(locale, opts);
        const polyFmt = new PolyDF(locale, opts);
        expect(polyFmt.resolvedOptions()).toEqual(nativeFmt.resolvedOptions());
        for (const sample of samples) {
          expect(polyFmt.format(sample)).toBe(nativeFmt.format(sample));
          expect(polyFmt.formatToParts(sample)).toEqual(nativeFmt.formatToParts(sample));
        }
      }
    }
  });

  it('handles explicit unit display options, fractionalDigits, and validation errors', async () => {
    await import(entry);
    expect(new Intl.DurationFormat('en-US', { style: 'short', secondsDisplay: 'always' }).format({ seconds: 0 }))
      .toBe('0 sec');
    expect(new Intl.DurationFormat('en-US', { style: 'short' }).format({ seconds: 0 })).toBe('');
    expect(
      new Intl.DurationFormat('en-US', { style: 'digital', hoursDisplay: 'auto', fractionalDigits: 3 })
        .format({ seconds: 5, milliseconds: 250 }),
    ).toBe('00:05.250');

    const paddedMinutes = new Intl.DurationFormat('en', { style: 'digital', minutes: 'numeric' });
    expect(paddedMinutes.resolvedOptions().minutes).toBe('2-digit');
    expect(paddedMinutes.format({ hours: 1, minutes: 5 })).toBe('1:05:00');
    expect(
      new Intl.DurationFormat('en', { style: 'digital', hours: 'long' }).format({ hours: 1, minutes: 5, seconds: 7 }),
    ).toBe('1 hour, 5:07');
    expect(
      new Intl.DurationFormat('fr-CA', { style: 'digital' }).format({ hours: 1, minutes: 30, seconds: 5 }),
    ).toBe('1:30:05');
    expect(
      new Intl.DurationFormat('fi', { style: 'digital' }).format({ hours: 1, minutes: 30, seconds: 5 }),
    ).toBe('1.30.05');

    expect(() => new Intl.DurationFormat('not_a_valid_locale_123')).toThrow(RangeError);
    expect(() => new Intl.DurationFormat('en-US', { style: 'medium' })).toThrow(RangeError);
    expect(() => new Intl.DurationFormat('en-US', { hoursDisplay: 'never' })).toThrow(RangeError);
    expect(() => new Intl.DurationFormat('en', { hours: 'numeric', minutes: 'long' })).toThrow(RangeError);
    expect(() => new Intl.DurationFormat('en', { style: 'digital', milliseconds: 'short' })).toThrow(RangeError);
    expect(() => new Intl.DurationFormat('en', { milliseconds: 'numeric', microseconds: 'short' })).toThrow(RangeError);
    expect(() => new Intl.DurationFormat('en-US').format(null)).toThrow(TypeError);
    expect(() => new Intl.DurationFormat('en-US').format({})).toThrow(TypeError);
    expect(() => new Intl.DurationFormat('en-US').format({ hours: 1, minutes: -30 })).toThrow(RangeError);
    expect(() => new Intl.DurationFormat('en-US').format({ hours: 1.5 })).toThrow(RangeError);
  });
});

describe.each([
  '@native-dates/polyfill',
  '@native-dates/polyfill/sync',
])('%s with native globalThis.Temporal', (entry) => {
  it('preserves native globalThis.Temporal and Intl.DurationFormat', async () => {
    await import(entry);
    expect(globalThis.Temporal).toBe(native.value);
    expect(Intl.DurationFormat).toBe(nativeDurationFormat.value);
  });
});

describe('@native-dates/polyfill esbuild chunk splitting', () => {
  it('splits temporal-polyfill and duration-format out of the entry chunk into lazy chunks', async () => {
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
    const hasTemporalPolyfill = (chunk) => Object.keys(chunk.inputs).some((file) => file.includes('temporal-polyfill'));
    const hasDurationFormat = (chunk) => Object.keys(chunk.inputs).some((file) => file.includes('duration-format.js'));
    const entry = chunks.find((chunk) => chunk.entryPoint === '<stdin>');
    expect(hasTemporalPolyfill(entry)).toBe(false);
    expect(hasDurationFormat(entry)).toBe(false);
    expect(chunks.filter(hasTemporalPolyfill)).toHaveLength(1);
    expect(chunks.filter(hasDurationFormat)).toHaveLength(1);
  });
});
