import { timezones } from '@native-dates/plugins/zones';
import { datetime } from 'native-dates';
import { describe, expect, it } from 'vitest';

const noonInJuly = '2026-07-01T12:00:00Z';

// an app edits the table once at startup, before any zone has been read, so this file does too
timezones.IST = 'Asia/Jerusalem';
timezones.WIB = 'Asia/Jakarta';

describe('timezones table of the zones plugin', () => {
  it('lists an abbreviation beside its IANA zone', () => {
    expect(timezones.JST).toBe('Asia/Tokyo');
    expect(timezones.PT).toBe('America/Los_Angeles');
  });

  it('reads an abbreviation as the zone the app set for it on startup', () => {
    expect(datetime(noonInJuly, 'IST')).toMatchObject({ zone: 'Asia/Jerusalem', offset: '+03:00' });
  });

  it('reads an abbreviation the app added on startup, in any letter case', () => {
    expect(datetime(noonInJuly, 'WIB').zone).toBe('Asia/Jakarta');
    expect(datetime(noonInJuly, 'wib').zone).toBe('Asia/Jakarta');
  });
});
