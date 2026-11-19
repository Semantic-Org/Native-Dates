import '@native-dates/plugins/zones';
import { configure, datetime, now } from 'native-dates';
import { afterEach, describe, expect, it } from 'vitest';

const noonInJuly = '2026-07-01T12:00:00Z';

describe('configure({ zoneAliases }) with the zones plugin', () => {
  afterEach(() => {
    configure({ zone: null, zoneAliases: null });
  });

  it('reads a configured alias in datetime(), now() and in()', () => {
    configure({ zoneAliases: { hq: 'Europe/Berlin' } });
    expect(datetime(noonInJuly, 'hq').zone).toBe('Europe/Berlin');
    expect(now('hq').zone).toBe('Europe/Berlin');
    expect(datetime(noonInJuly, 'UTC').in('hq').hour).toBe(14);
  });

  it('takes a city or an abbreviation as the target of an alias', () => {
    configure({ zoneAliases: { hq: 'Berlin', west: 'PT' } });
    const standup = datetime('2026-11-16T09:30', 'west');
    expect(standup.zone).toBe('America/Los_Angeles');
    expect(standup.in('hq')).toMatchObject({ zone: 'Europe/Berlin', hour: 18, minute: 30 });
  });

  it('matches an alias in any letter case and without its accents', () => {
    configure({ zoneAliases: { hq: 'Europe/Berlin', 'Café Central': 'Europe/Vienna' } });
    expect(datetime(noonInJuly, 'HQ').zone).toBe('Europe/Berlin');
    expect(datetime(noonInJuly, 'cafe central').zone).toBe('Europe/Vienna');
  });

  it('reads an alias ahead of a built-in abbreviation of the same name', () => {
    configure({ zoneAliases: { ist: 'Asia/Jerusalem' } });
    expect(datetime(noonInJuly, 'IST').zone).toBe('Asia/Jerusalem');
    configure({ zoneAliases: { ist: null } });
    expect(datetime(noonInJuly, 'IST').zone).toBe('Asia/Kolkata');
  });

  it('returns the active aliases, each with its target as an IANA zone', () => {
    const aliases = { hq: 'Europe/Berlin', west: 'America/Los_Angeles' };
    expect(configure({ zoneAliases: { hq: 'Berlin', west: 'PT' } }).zoneAliases).toEqual(aliases);
    expect(configure().zoneAliases).toEqual(aliases);
  });

  it('adds to the aliases already configured', () => {
    configure({ zoneAliases: { hq: 'Europe/Berlin' } });
    configure({ zoneAliases: { lab: 'Asia/Tokyo' } });
    expect(configure().zoneAliases).toEqual({ hq: 'Europe/Berlin', lab: 'Asia/Tokyo' });
  });

  it('removes one alias when its target is null and keeps the others', () => {
    configure({ zoneAliases: { hq: 'Europe/Berlin', lab: 'Asia/Tokyo' } });
    configure({ zoneAliases: { hq: null } });
    expect(datetime(noonInJuly, 'lab').zone).toBe('Asia/Tokyo');
    expect(() => datetime(noonInJuly, 'hq')).toThrowError(expect.objectContaining({ code: 'unknownZone', at: 'hq' }));
  });

  it('never aliases a name to the default zone when its target is null', () => {
    configure({ zoneAliases: { depot: null } });
    expect(() => datetime(noonInJuly, 'depot')).toThrowError(
      expect.objectContaining({ code: 'unknownZone', at: 'depot' }),
    );
  });

  it('removes every alias when zoneAliases is null', () => {
    configure({ zoneAliases: { hq: 'Europe/Berlin', lab: 'Asia/Tokyo' } });
    expect(configure({ zoneAliases: null }).zoneAliases).toEqual({});
    expect(() => datetime(noonInJuly, 'lab')).toThrowError(expect.objectContaining({ code: 'unknownZone', at: 'lab' }));
  });

  it('sets the default zone by an alias configured in the same call', () => {
    configure({ zoneAliases: { hq: 'Europe/Berlin' }, zone: 'hq' });
    expect(now().zone).toBe('Europe/Berlin');
  });

  it('throws unknownZone at the target when an alias points at no zone', () => {
    expect(() => configure({ zoneAliases: { hq: 'Atlantis' } })).toThrowError(
      expect.objectContaining({ code: 'unknownZone', at: 'Atlantis' }),
    );
  });

  it('throws invalidZoneAliases when zoneAliases is not a plain object', () => {
    expect(() => configure({ zoneAliases: 'hq' })).toThrowError(
      expect.objectContaining({ code: 'invalidZoneAliases', at: 'hq' }),
    );
    expect(() => configure({ zoneAliases: ['Europe/Berlin'] })).toThrowError(
      expect.objectContaining({ code: 'invalidZoneAliases' }),
    );
  });

  it.todo('replaces or removes an alias written in another letter case than it was configured in');
});
