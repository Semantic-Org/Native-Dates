import { build } from 'esbuild';
import vm from 'node:vm';
import { beforeAll, describe, expect, it } from 'vitest';

// what a bundler ships to a browser: minified, built for production, and with each plugin kept only
// because the package lists its file under sideEffects, since the app takes no export from it
let app;

beforeAll(async () => {
  const bundle = await build({
    bundle: true,
    minify: true,
    format: 'iife',
    globalName: 'app',
    write: false,
    logLevel: 'silent',
    define: { 'process.env.NODE_ENV': '"production"' },
    stdin: {
      contents: `
        import '@native-dates/plugins/legacy-date';
        import '@native-dates/plugins/zones';
        export { configure, datetime } from 'native-dates';
      `,
      resolveDir: import.meta.dirname,
    },
  });
  app = vm.runInThisContext(`(() => { ${bundle.outputFiles[0].text}\nreturn app; })()`);
}, 30_000);

describe('zones and legacy-date in an app bundled for production', () => {
  it('reads a city, an abbreviation and a configured alias', () => {
    const standup = app.datetime('2026-11-16T09:30', 'PT');
    expect(standup.zone).toBe('America/Los_Angeles');
    expect(standup.in('Berlin')).toMatchObject({ zone: 'Europe/Berlin', hour: 18, minute: 30 });
    app.configure({ zoneAliases: { hq: 'Tokyo' } });
    expect(standup.in('hq').zone).toBe('Asia/Tokyo');
  });

  it('throws unknownZone at a name that is no city, abbreviation or zone', () => {
    expect(() => app.datetime('2026-11-16T09:30', 'Atlantis')).toThrowError(
      expect.objectContaining({ code: 'unknownZone', at: 'Atlantis' }),
    );
  });

  it('answers the Date getters and formats in the zone of the datetime', () => {
    const flight = app.datetime('2026-09-06T14:30:15.250', 'America/New_York');
    expect(flight.getMonth()).toBe(8);
    expect(flight.getHours()).toBe(14);
    expect(flight.getUTCHours()).toBe(18);
    expect(flight.toISOString()).toBe('2026-09-06T18:30:15.250Z');
    expect(flight.toLocaleDateString('en-US')).toBe('9/6/2026');
  });

  it('throws immutable from a Date setter, at the name of the setter', () => {
    const reminder = app.datetime('2026-09-06T14:30Z');
    expect(() => reminder.setHours(9)).toThrowError(expect.objectContaining({ code: 'immutable', at: 'setHours' }));
  });
});
