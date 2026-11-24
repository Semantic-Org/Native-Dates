import { build } from 'esbuild';
import vm from 'node:vm';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';

const buildBundle = async (entry) => {
  const bundle = await build({
    bundle: true,
    minify: true,
    format: 'iife',
    globalName: 'app',
    write: false,
    logLevel: 'silent',
    define: { 'process.env.NODE_ENV': '"production"' },
    stdin: { contents: entry, resolveDir: import.meta.dirname },
  });
  return vm.runInThisContext(`(() => { ${bundle.outputFiles[0].text}\nreturn app; })()`);
};

describe('@native-dates/plugins production bundle sideEffects retention', () => {
  let withPlugins;
  let withoutPlugins;

  beforeAll(async () => {
    withPlugins = await buildBundle(`
      import '@native-dates/plugins/legacy-date';
      import '@native-dates/plugins/loose';
      import '@native-dates/plugins/parse';
      import '@native-dates/plugins/ranges';
      import '@native-dates/plugins/zones';
      export { mergeRanges } from '@native-dates/plugins/ranges';
      export { configure, date, dateRange, datetime, timeRange } from 'native-dates';
    `);
    withoutPlugins = await buildBundle(`
      export { configure, date, datetime } from 'native-dates';
    `);
  }, 30_000);

  afterEach(() => {
    withPlugins.configure({ zone: null, zoneAliases: null, dayFirst: null });
  });

  it('keeps @native-dates/plugins/loose side-effect imports when minified', () => {
    expect(withPlugins.date('Sep 6, 2026', { loose: true })?.toString()).toBe('2026-09-06');
    expect(withPlugins.date('TBD', { loose: true })).toBeNull();
  });

  it('keeps @native-dates/plugins/zones side-effect imports when minified', () => {
    const standup = withPlugins.datetime('2026-11-16T09:30', 'PT');
    expect(standup.zone).toBe('America/Los_Angeles');
    expect(standup.in('Berlin')).toMatchObject({ zone: 'Europe/Berlin', hour: 18, minute: 30 });
    withPlugins.configure({ zoneAliases: { hq: 'Tokyo' } });
    expect(standup.in('hq').zone).toBe('Asia/Tokyo');
    expect(() => withPlugins.datetime('2026-11-16T09:30', 'Atlantis')).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'unknownZone', at: 'Atlantis' }),
    );
  });

  it('keeps @native-dates/plugins/legacy-date side-effect imports when minified', () => {
    const flight = withPlugins.datetime('2026-09-06T14:30:15.250', 'America/New_York');
    expect(flight.getMonth()).toBe(8);
    expect(flight.getHours()).toBe(14);
    expect(flight.getUTCHours()).toBe(18);
    expect(flight.toISOString()).toBe('2026-09-06T18:30:15.250Z');
    expect(flight.toLocaleDateString('en-US')).toBe('9/6/2026');
    expect(() => flight.setHours(9)).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'immutable', at: 'setHours' }),
    );
  });

  it('keeps @native-dates/plugins/parse side-effect imports when minified', () => {
    expect(withPlugins.date('24112026', { format: 'DDMMYYYY' }).toString()).toBe('2026-11-24');
    expect(
      withPlugins.datetime('24/Nov/2026:12:40:01 -0500', {
        format: 'DD/MMM/YYYY:HH:mm:ss ZZ',
        zone: 'America/New_York',
        locale: 'en-US',
      }).toString(),
    ).toBe('2026-11-24T17:40:01.000Z');
  });

  it('keeps @native-dates/plugins/ranges side-effect imports when minified', () => {
    const trip = withPlugins.dateRange('2026-11-01', '2026-11-10');
    expect(trip.subtract('2026-11-04/2026-11-06').map(String)).toEqual([
      '2026-11-01/2026-11-03',
      '2026-11-07/2026-11-10',
    ]);
    expect(withPlugins.dateRange('2026-11-01', '2026-11-05').union('2026-11-06/2026-11-10')?.toString()).toBe(
      '2026-11-01/2026-11-10',
    );
    expect(
      withPlugins.mergeRanges([
        withPlugins.timeRange('22:00', '02:00'),
        withPlugins.timeRange('01:00', '06:00'),
      ]).map(String),
    ).toEqual(['22:00:00/06:00:00']);
  });

  it('throws missingPlugin in a production bundle that omits plugin imports', () => {
    expect(() => withoutPlugins.date('Sep 6, 2026', { loose: true })).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'missingPlugin', at: 'loose' }),
    );
    expect(() => withoutPlugins.date('24112026', { format: 'DDMMYYYY' })).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'missingPlugin', at: 'format' }),
    );
    expect(() => withoutPlugins.configure({ zoneAliases: { hq: 'Europe/Berlin' } })).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'missingPlugin', at: 'zoneAliases' }),
    );
  });
});
