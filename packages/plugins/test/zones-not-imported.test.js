import { configure, datetime } from 'native-dates';
import { describe, expect, it } from 'vitest';

const noonInJuly = '2026-07-01T12:00:00Z';

// nothing here may import the zones plugin, and each test file loads its own copy of native-dates
describe('native-dates without the zones plugin', () => {
  it('throws unknownZone at a city name and names the plugin that reads it', () => {
    expect(() => datetime(noonInJuly, 'Berlin')).toThrowError(
      expect.objectContaining({
        code: 'unknownZone',
        at: 'Berlin',
        message: expect.stringContaining('@native-dates/plugins/zones'),
      }),
    );
  });

  it('throws unknownZone at an abbreviation that is no IANA zone', () => {
    expect(() => datetime(noonInJuly, 'PT')).toThrowError(expect.objectContaining({ code: 'unknownZone', at: 'PT' }));
  });

  it('throws missingPlugin at zoneAliases from configure({ zoneAliases })', () => {
    expect(() => configure({ zoneAliases: { hq: 'Europe/Berlin' } })).toThrowError(
      expect.objectContaining({
        code: 'missingPlugin',
        at: 'zoneAliases',
        message: expect.stringContaining('@native-dates/plugins/zones'),
      }),
    );
  });
});
