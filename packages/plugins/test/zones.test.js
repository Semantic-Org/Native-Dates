import '@native-dates/plugins/zones';
import { configure, datetime } from 'native-dates';
import { afterEach, describe, expect, it } from 'vitest';

const noonInJuly = '2026-07-01T12:00:00Z';

describe('zones plugin', () => {
  it('resolves a city name to its IANA zone, in any case and without its accents', () => {
    expect(datetime(noonInJuly, 'Berlin').zone).toBe('Europe/Berlin');
    expect(datetime(noonInJuly, 'los angeles').zone).toBe('America/Los_Angeles');
    expect(datetime(noonInJuly, 'São Paulo').zone).toBe('America/Sao_Paulo');
  });

  it('resolves an abbreviation to the zone that observes daylight time, never a fixed offset', () => {
    expect(datetime(noonInJuly, 'PT').zone).toBe('America/Los_Angeles');
    expect(datetime(noonInJuly, 'EST')).toMatchObject({ zone: 'America/New_York', offset: '-04:00' });
  });

  it('leaves an IANA name, a fixed offset and UTC as they are', () => {
    expect(datetime(noonInJuly, 'Asia/Tokyo').zone).toBe('Asia/Tokyo');
    expect(datetime(noonInJuly, '+05:30').zone).toBe('+05:30');
    expect(datetime(noonInJuly, 'UTC').zone).toBe('UTC');
  });

  it('throws unknownZone at the name when it is no city, abbreviation or zone', () => {
    expect(() => datetime(noonInJuly, 'Atlantis')).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'unknownZone', at: 'Atlantis' }),
    );
  });
});

describe('configure({ zoneAliases }) (zones plugin)', () => {
  afterEach(() => {
    configure({ zoneAliases: null });
  });

  it('resolves a configured alias to its zone', () => {
    configure({ zoneAliases: { hq: 'Europe/Berlin' } });
    expect(datetime(noonInJuly, 'hq').zone).toBe('Europe/Berlin');
  });

  it('removes one alias when its target is null and keeps the others', () => {
    configure({ zoneAliases: { hq: 'Europe/Berlin', lab: 'Asia/Tokyo' } });
    configure({ zoneAliases: { hq: null } });
    expect(datetime(noonInJuly, 'lab').zone).toBe('Asia/Tokyo');
    expect(() => datetime(noonInJuly, 'hq')).toThrowError(
      expect.objectContaining({ code: 'unknownZone', at: 'hq' }),
    );
  });

  it('removes every alias when zoneAliases is null', () => {
    configure({ zoneAliases: { hq: 'Europe/Berlin' } });
    expect(configure({ zoneAliases: null }).zoneAliases).toEqual({});
    expect(() => datetime(noonInJuly, 'hq')).toThrowError(
      expect.objectContaining({ code: 'unknownZone', at: 'hq' }),
    );
  });

  it('throws invalidZoneAliases when zoneAliases is not a plain object', () => {
    expect(() => configure({ zoneAliases: 'hq' })).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'invalidZoneAliases', at: 'hq' }),
    );
  });
});
