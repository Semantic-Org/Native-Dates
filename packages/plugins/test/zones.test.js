import { timezones } from '@native-dates/plugins/zones';
import {
  configure,
  date,
  dateRange,
  datetime,
  datetimeRange,
  endOfToday,
  monthDay,
  now,
  startOfToday,
  time,
  today,
  yearMonth,
} from 'native-dates';
import { afterEach, describe, expect, it } from 'vitest';

const noonInJuly = '2026-07-01T12:00:00Z';

afterEach(() => {
  delete timezones.IST;
  delete timezones.WIB;
  configure({ zone: null, zoneAliases: null });
});

describe('@native-dates/plugins/zones city resolution', () => {
  it('resolves city names to their IANA timezones', () => {
    expect(datetime(noonInJuly, 'Berlin').zone).toBe('Europe/Berlin');
    expect(datetime(noonInJuly, 'Tokyo').zone).toBe('Asia/Tokyo');
    expect(datetime(noonInJuly, 'New York').zone).toBe('America/New_York');
  });

  it('converts instants across resolved city zones', () => {
    const standup = datetime('2026-11-16T09:30', 'Los Angeles');
    expect(standup.offset).toBe('-08:00');
    expect(standup.in('Berlin')).toMatchObject({ hour: 18, minute: 30 });
  });

  it('normalizes case, diacritics, whitespace, and underscores in city names', () => {
    const spellings = [
      ['los angeles', 'America/Los_Angeles'],
      ['LOS ANGELES', 'America/Los_Angeles'],
      ['Los_Angeles', 'America/Los_Angeles'],
      [' Berlin ', 'Europe/Berlin'],
      ['São Paulo', 'America/Sao_Paulo'],
      ['sao paulo', 'America/Sao_Paulo'],
      ['Zürich', 'Europe/Zurich'],
      ['mexico city', 'America/Mexico_City'],
    ];
    for (const [spelling, zone] of spellings) {
      expect(datetime(noonInJuly, spelling).zone, spelling).toBe(zone);
    }
  });

  it('resolves lowercase space-separated full IANA identifiers', () => {
    expect(datetime(noonInJuly, 'america/new york').zone).toBe('America/New_York');
    expect(datetime(noonInJuly, 'america/north dakota/new salem').zone).toBe('America/North_Dakota/New_Salem');
  });

  it('resolves hyphenated cities written with spaces and three-segment IANA cities', () => {
    expect(datetime(noonInJuly, 'port au prince').zone).toBe('America/Port-au-Prince');
    expect(datetime(noonInJuly, 'Ushuaia').zone).toBe('America/Argentina/Ushuaia');
  });

  // V8 still lists these under legacy names (Asia/Calcutta, Europe/Kiev, Asia/Saigon)
  it('resolves modern IANA link cities such as Kolkata, Kyiv, and Ho Chi Minh', () => {
    expect(datetime(noonInJuly, 'Kolkata').zone).toBe('Asia/Kolkata');
    expect(datetime(noonInJuly, 'Kyiv').zone).toBe('Europe/Kyiv');
    expect(datetime(noonInJuly, 'ho chi minh').zone).toBe('Asia/Ho_Chi_Minh');
  });

  // V8 omits leaf names for these cities, listing Toronto for Montreal and Katmandu for Kathmandu
  it('resolves tzdb link cities omitted from Intl.supportedValuesOf()', () => {
    const offsetsInJuly = [
      ['Montreal', '-04:00'],
      ['Canberra', '+10:00'],
      ['Belfast', '+01:00'],
      ['Tel Aviv', '+03:00'],
      ['Kathmandu', '+05:45'],
      ['Asmara', '+03:00'],
    ];
    for (const [city, offset] of offsetsInJuly) {
      expect(datetime(noonInJuly, city).offset, city).toBe(offset);
    }
  });

  it('throws unknownZone when given an unrecognized zone string', () => {
    expect(() => datetime(noonInJuly, 'Atlantis')).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'unknownZone', at: 'Atlantis' }),
    );
    expect(() => datetime(noonInJuly, 'UTC').in('Atlantis')).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'unknownZone', at: 'Atlantis' }),
    );
  });

  it('throws unknownZone for empty or whitespace-only zone strings', () => {
    expect(() => datetime(noonInJuly, '')).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'unknownZone', at: '' }),
    );
    expect(() => datetime(noonInJuly, '  ')).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'unknownZone', at: '  ' }),
    );
  });
});

describe('@native-dates/plugins/zones abbreviations', () => {
  it('converts instants between abbreviated and city zones', () => {
    const standup = datetime('2026-11-16T09:30', 'PT');
    expect(standup.zone).toBe('America/Los_Angeles');
    expect(standup.in('Berlin')).toMatchObject({ hour: 18, minute: 30 });
  });

  it.each([
    ['PT, PST, PDT, Pacific', 'America/Los_Angeles'],
    ['MT, MST, MDT, Mountain', 'America/Denver'],
    ['CT, CST, CDT, Central', 'America/Chicago'],
    ['ET, EST, EDT, Eastern', 'America/New_York'],
    ['AKT, AKST, AKDT, Alaska', 'America/Anchorage'],
    ['HT, HST, Hawaii', 'Pacific/Honolulu'],
    ['AT', 'America/Halifax'],
    ['GMT, Z', 'UTC'],
    ['UK, WET, BST', 'Europe/London'],
    ['CET, CEST, ECT', 'Europe/Paris'],
    ['EET', 'Europe/Helsinki'],
    ['IST, INST', 'Asia/Kolkata'],
    ['JST', 'Asia/Tokyo'],
    ['KST', 'Asia/Seoul'],
    ['SGT', 'Asia/Singapore'],
    ['HKT', 'Asia/Hong_Kong'],
    ['AET, AEST, AEDT', 'Australia/Sydney'],
    ['ACT', 'Australia/Adelaide'],
    ['AWT', 'Australia/Perth'],
    ['NZT, NZST, NZDT', 'Pacific/Auckland'],
    ['BRT', 'America/Sao_Paulo'],
  ])('resolves %s to %s', (spellings, zone) => {
    for (const spelling of spellings.split(', ')) {
      expect(datetime(noonInJuly, spelling).zone, spelling).toBe(zone);
    }
  });

  it('resolves abbreviations case-insensitively', () => {
    expect(datetime(noonInJuly, 'pt').zone).toBe('America/Los_Angeles');
    expect(datetime(noonInJuly, 'Est').zone).toBe('America/New_York');
    expect(datetime(noonInJuly, 'PACIFIC').zone).toBe('America/Los_Angeles');
  });

  // bare EST and MST are fixed-offset IANA links without DST unless mapped to regional zones
  it('maps EST, PST, and MST to DST-observing regional zones', () => {
    expect(datetime('2026-07-01T12:00', 'EST').offset).toBe('-04:00');
    expect(datetime('2026-01-01T12:00', 'EST').offset).toBe('-05:00');
    expect(datetime('2026-07-01T12:00', 'PST').offset).toBe('-07:00');
    expect(datetime('2026-07-01T12:00', 'MST').offset).toBe('-06:00');
  });
});

describe('@native-dates/plugins/zones canonical passthrough', () => {
  it('preserves canonical IANA identifiers, fixed offsets, and UTC', () => {
    expect(datetime(noonInJuly, 'Asia/Tokyo').zone).toBe('Asia/Tokyo');
    expect(datetime(noonInJuly, 'America/Argentina/Buenos_Aires').zone).toBe('America/Argentina/Buenos_Aires');
    expect(datetime(noonInJuly, '+05:30').zone).toBe('+05:30');
    expect(datetime(noonInJuly, 'UTC').zone).toBe('UTC');
  });

  it('keeps fixed numeric offsets constant across summer and winter', () => {
    expect(datetime('2026-07-01T12:00', '-08:00').offset).toBe('-08:00');
    expect(datetime('2026-01-01T12:00', '-08:00').offset).toBe('-08:00');
  });
});

describe('@native-dates/plugins/zones across zone parameters', () => {
  it.each([
    ['datetime(input, zone)', () => datetime(noonInJuly, 'Berlin').zone],
    ['datetime(input, { zone })', () => datetime(noonInJuly, { zone: 'Berlin' }).zone],
    ['now(zone)', () => now('Berlin').zone],
    ['startOfToday(zone)', () => startOfToday('Berlin').zone],
    ['endOfToday(zone)', () => endOfToday('Berlin').zone],
    ['datetime.in(zone)', () => datetime(noonInJuly, 'UTC').in('Berlin').zone],
    ['date.at(time, zone)', () => date('2026-11-16').at('9:00am', 'Berlin').zone],
    ["date.as('datetime', zone)", () => date('2026-11-16').as('datetime', 'Berlin').zone],
    ['date.points(step, zone)', () => date('2026-11-16').points('hour', 'Berlin')[0].zone],
    ['date.split(count, unit, zone)', () => date('2026-11-16').split(6, 'hours', 'Berlin')[0].start.zone],
    ['time.on(day, zone)', () => time('9am').on('2026-11-16', 'Berlin').zone],
    [
      'datetimeRange(start, end, zone)',
      () => datetimeRange('2026-11-16T09:00', '2026-11-16T10:00', 'Berlin').start.zone,
    ],
    ['dateRange.in(zone)', () => dateRange('2026-11-16', '2026-11-17').in('Berlin').start.zone],
  ])('resolves city names in %s', (_signature, getZone) => {
    expect(getZone()).toBe('Europe/Berlin');
  });

  it('resolves city names in date(datetime, zone) and time(datetime, zone)', () => {
    const lateInNewYork = datetime('2026-11-16T23:30', 'America/New_York');
    expect(date(lateInNewYork, 'Tokyo').toString()).toBe('2026-11-17');
    expect(time(lateInNewYork, 'Tokyo').hour).toBe(13);
  });

  it('resolves abbreviations in today(zone)', () => {
    expect(today('JST').equals(today('Asia/Tokyo'))).toBe(true);
  });

  it('resolves city names in configure({ zone })', () => {
    expect(configure({ zone: 'Berlin' }).zone).toBe('Europe/Berlin');
    expect(now().zone).toBe('Europe/Berlin');
  });
});

describe('configure({ zoneAliases })', () => {
  it('resolves configured aliases in datetime(), now(), and in()', () => {
    configure({ zoneAliases: { hq: 'Europe/Berlin' } });
    expect(datetime(noonInJuly, 'hq').zone).toBe('Europe/Berlin');
    expect(now('hq').zone).toBe('Europe/Berlin');
    expect(datetime(noonInJuly, 'UTC').in('hq').hour).toBe(14);
  });

  it('accepts city names and abbreviations as alias targets', () => {
    configure({ zoneAliases: { hq: 'Berlin', west: 'PT' } });
    const standup = datetime('2026-11-16T09:30', 'west');
    expect(standup.zone).toBe('America/Los_Angeles');
    expect(standup.in('hq')).toMatchObject({ zone: 'Europe/Berlin', hour: 18, minute: 30 });
  });

  it('matches aliases case-insensitively and without diacritics', () => {
    configure({ zoneAliases: { hq: 'Europe/Berlin', 'Café Central': 'Europe/Vienna' } });
    expect(datetime(noonInJuly, 'HQ').zone).toBe('Europe/Berlin');
    expect(datetime(noonInJuly, 'cafe central').zone).toBe('Europe/Vienna');
  });

  it('overrides built-in abbreviations when an alias uses the same name', () => {
    configure({ zoneAliases: { ist: 'Asia/Jerusalem' } });
    expect(datetime(noonInJuly, 'IST').zone).toBe('Asia/Jerusalem');
    configure({ zoneAliases: { ist: null } });
    expect(datetime(noonInJuly, 'IST').zone).toBe('Asia/Kolkata');
  });

  it('returns active aliases normalized to canonical IANA zones', () => {
    const aliases = { hq: 'Europe/Berlin', west: 'America/Los_Angeles' };
    expect(configure({ zoneAliases: { hq: 'Berlin', west: 'PT' } }).zoneAliases).toEqual(aliases);
    expect(configure().zoneAliases).toEqual(aliases);
  });

  it('returns a copy of zoneAliases so mutating the result does not add aliases', () => {
    configure({ zoneAliases: { hq: 'Europe/Berlin' } });
    configure().zoneAliases.lab = 'Asia/Tokyo';
    expect(configure().zoneAliases).toEqual({ hq: 'Europe/Berlin' });
    expect(() => datetime(noonInJuly, 'lab')).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'unknownZone', at: 'lab' }),
    );
  });

  it('merges new aliases into existing aliases', () => {
    configure({ zoneAliases: { hq: 'Europe/Berlin' } });
    configure({ zoneAliases: { lab: 'Asia/Tokyo' } });
    expect(configure().zoneAliases).toEqual({ hq: 'Europe/Berlin', lab: 'Asia/Tokyo' });
  });

  it('removes an individual alias when its target is null', () => {
    configure({ zoneAliases: { hq: 'Europe/Berlin', lab: 'Asia/Tokyo' } });
    configure({ zoneAliases: { hq: null } });
    expect(datetime(noonInJuly, 'lab').zone).toBe('Asia/Tokyo');
    expect(() => datetime(noonInJuly, 'hq')).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'unknownZone', at: 'hq' }),
    );
  });

  it('throws unknownZone instead of falling back to the default zone when an alias is null', () => {
    configure({ zoneAliases: { depot: null } });
    expect(() => datetime(noonInJuly, 'depot')).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'unknownZone', at: 'depot' }),
    );
  });

  it('clears all configured aliases when zoneAliases is null', () => {
    configure({ zoneAliases: { hq: 'Europe/Berlin', lab: 'Asia/Tokyo' } });
    expect(configure({ zoneAliases: null }).zoneAliases).toEqual({});
    expect(() => datetime(noonInJuly, 'lab')).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'unknownZone', at: 'lab' }),
    );
  });

  it('lets zone reference an alias configured in the same call', () => {
    configure({ zoneAliases: { hq: 'Europe/Berlin' }, zone: 'hq' });
    expect(now().zone).toBe('Europe/Berlin');
  });

  it('throws unknownZone when an alias target is invalid', () => {
    expect(() => configure({ zoneAliases: { hq: 'Atlantis' } })).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'unknownZone', at: 'Atlantis' }),
    );
  });

  it('throws invalidZoneAliases when zoneAliases is not a plain object', () => {
    expect(() => configure({ zoneAliases: 'hq' })).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'invalidZoneAliases', at: 'hq' }),
    );
    expect(() => configure({ zoneAliases: ['Europe/Berlin'] })).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'invalidZoneAliases' }),
    );
  });

  it.todo('replaces or removes an alias using case-insensitive key matching');
});

describe('timezones export', () => {
  it('exposes built-in abbreviation mappings to IANA zones', () => {
    expect(timezones.JST).toBe('Asia/Tokyo');
    expect(timezones.PT).toBe('America/Los_Angeles');
    expect(timezones.CET).toBe('Europe/Paris');
  });

  it('uses overridden entries on the timezones object', () => {
    timezones.IST = 'Asia/Jerusalem';
    expect(datetime(noonInJuly, 'IST')).toMatchObject({ zone: 'Asia/Jerusalem', offset: '+03:00' });
  });

  it('resolves custom entries added to the timezones object case-insensitively', () => {
    timezones.WIB = 'Asia/Jakarta';
    expect(datetime(noonInJuly, 'WIB').zone).toBe('Asia/Jakarta');
    expect(datetime(noonInJuly, 'wib').zone).toBe('Asia/Jakarta');
  });
});

describe('@native-dates/plugins/zones cities and abbreviations without an IANA name', () => {
  it.each([
    ['Beijing, Shenzhen, 北京', 'Asia/Shanghai'],
    ['Osaka, Fukuoka, 東京', 'Asia/Tokyo'],
    ['Busan, 서울', 'Asia/Seoul'],
    ['Mumbai, New Delhi, Bengaluru', 'Asia/Kolkata'],
    ['Brasília, Rio de Janeiro, rio', 'America/Sao_Paulo'],
    ['Saint Petersburg, St. Petersburg, SPB, Москва, мск, MSK', 'Europe/Moscow'],
    ['Ekaterinburg', 'Asia/Yekaterinburg'],
    ['Astana', 'Asia/Almaty'],
    ['Makkah, Jeddah', 'Asia/Riyadh'],
    ['Doha', 'Asia/Qatar'],
    ['Abu Dhabi', 'Asia/Dubai'],
    ['Manama', 'Asia/Bahrain'],
    ['Rabat', 'Africa/Casablanca'],
    ['Bruxelles', 'Europe/Brussels'],
    ['Geneva, Genève', 'Europe/Zurich'],
    ['Munich, Frankfurt', 'Europe/Berlin'],
    ['CDMX', 'America/Mexico_City'],
    ['La Habana', 'America/Havana'],
    ['Quito', 'America/Guayaquil'],
    ['NYC, Washington DC, Boston', 'America/New_York'],
    ['LA, San Francisco, Seattle', 'America/Los_Angeles'],
    ['Ottawa, HNE', 'America/Toronto'],
    ['ART', 'America/Argentina/Buenos_Aires'],
    ['COT', 'America/Bogota'],
    ['CLT', 'America/Santiago'],
    ['FNT', 'America/Noronha'],
    ['IRST', 'Asia/Tehran'],
  ])('resolves %s to %s', (spellings, zone) => {
    for (const spelling of spellings.split(', ')) {
      expect(datetime(noonInJuly, spelling).zone, spelling).toBe(zone);
    }
  });

  it('resolves "El Salvador" to its IANA zone and "Salvador" to America/Bahia', () => {
    expect(datetime(noonInJuly, 'El Salvador').zone).toBe('America/El_Salvador');
    expect(datetime(noonInJuly, 'Salvador').zone).toBe('America/Bahia');
  });
});

describe('@native-dates/plugins/zones abbreviations used by several countries', () => {
  afterEach(() => {
    configure({ locale: null });
  });

  const zoneOf = (name, locale) => datetime(noonInJuly, { zone: name, locale }).zone;

  it.each([
    ['CST', 'en-US', 'America/Chicago'],
    ['CST', 'zh-CN', 'Asia/Shanghai'],
    ['CST', 'zh', 'Asia/Shanghai'],
    ['CST', 'zh-TW', 'Asia/Taipei'],
    ['CST', 'es-CU', 'America/Havana'],
    ['CST', 'de', 'America/Chicago'],
    ['CST', 'en-CN', 'Asia/Shanghai'],
    ['AST', 'en-SA', 'Asia/Riyadh'],
    ['ACT', 'en-BR', 'America/Rio_Branco'],
    ['CST', 'en-CN, en;q=0.8', 'Asia/Shanghai'],
    ['CST', 'tlh, zh-TW;q=0.8', 'Asia/Taipei'],
    ['IST', 'en-IN', 'Asia/Kolkata'],
    ['IST', 'en-IE', 'Europe/Dublin'],
    ['IST', 'he', 'Asia/Jerusalem'],
    ['PST', 'fil', 'Asia/Manila'],
    ['BST', 'bn', 'Asia/Dhaka'],
    ['AST', 'ar-SA', 'Asia/Riyadh'],
    ['ACT', 'pt-BR', 'America/Rio_Branco'],
    ['AMT', 'hy', 'Asia/Yerevan'],
    ['San Juan', 'es-PR', 'America/Puerto_Rico'],
    ['San Juan', 'es-AR', 'America/Argentina/San_Juan'],
  ])('resolves %s under locale %s to %s', (name, locale, zone) => {
    expect(zoneOf(name, locale)).toBe(zone);
  });

  it('resolves by the locale of the value in in() and at()', () => {
    const chinese = datetime(noonInJuly, 'UTC').locale('zh-CN');
    expect(chinese.in('CST').zone).toBe('Asia/Shanghai');
    expect(chinese.locale('en-US').in('CST').zone).toBe('America/Chicago');
    expect(date('2026-07-01', { locale: 'zh-CN' }).at('09:00', 'CST').offset).toBe('+08:00');
  });

  it('resolves by configure({ locale }) and to the first listed zone once the locale is cleared', () => {
    configure({ locale: 'zh-CN' });
    expect(datetime(noonInJuly, 'CST').zone).toBe('Asia/Shanghai');
    configure({ locale: null });
    expect(zoneOf('CST', 'en-US')).toBe('America/Chicago');
  });

  it('resolves zone by the locale passed in the same configure() call', () => {
    expect(configure({ locale: 'zh-CN', zone: 'CST' }).zone).toBe('Asia/Shanghai');
  });

  it('resolves by the locale option in monthDay() and yearMonth() from an instant', () => {
    const options = { zone: 'CST', locale: 'zh-CN' };
    expect(monthDay('2026-11-16T20:00:00Z', options).toString()).toBe('11-17');
    expect(yearMonth('2026-11-30T20:00:00Z', options).toString()).toBe('2026-12');
  });

  it('resolves zoneAliases and timezones entries ahead of the locale', () => {
    configure({ zoneAliases: { CST: 'America/Havana' } });
    expect(zoneOf('CST', 'zh-CN')).toBe('America/Havana');
    configure({ zoneAliases: null });
    timezones.IST = 'Asia/Jerusalem';
    expect(zoneOf('IST', 'en-IE')).toBe('Asia/Jerusalem');
  });
});
