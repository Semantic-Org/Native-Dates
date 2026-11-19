import '@native-dates/plugins/zones';
import {
  configure,
  date,
  dateRange,
  datetime,
  datetimeRange,
  endOfToday,
  now,
  startOfToday,
  time,
  today,
} from 'native-dates';
import { afterEach, describe, expect, it } from 'vitest';

const noonInJuly = '2026-07-01T12:00:00Z';

describe('zones plugin city names', () => {
  it('reads a city as its IANA zone', () => {
    expect(datetime(noonInJuly, 'Berlin').zone).toBe('Europe/Berlin');
    expect(datetime(noonInJuly, 'Tokyo').zone).toBe('Asia/Tokyo');
    expect(datetime(noonInJuly, 'New York').zone).toBe('America/New_York');
  });

  it('converts 9:30 in Los Angeles to 18:30 in Berlin', () => {
    const standup = datetime('2026-11-16T09:30', 'Los Angeles');
    expect(standup.offset).toBe('-08:00');
    expect(standup.in('Berlin')).toMatchObject({ hour: 18, minute: 30 });
  });

  it('reads a city in any letter case, without its accents, and with spaces or underscores', () => {
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

  it('reads a full IANA name typed in lowercase with spaces', () => {
    expect(datetime(noonInJuly, 'america/new york').zone).toBe('America/New_York');
    expect(datetime(noonInJuly, 'america/north dakota/new salem').zone).toBe('America/North_Dakota/New_Salem');
  });

  it('reads a hyphenated city typed with spaces, and a city from a three-part IANA name', () => {
    expect(datetime(noonInJuly, 'port au prince').zone).toBe('America/Port-au-Prince');
    expect(datetime(noonInJuly, 'Ushuaia').zone).toBe('America/Argentina/Ushuaia');
  });

  // V8 still lists these zones as Asia/Calcutta, Europe/Kiev and Asia/Saigon
  it('reads Kolkata, Kyiv and Ho Chi Minh by their current names', () => {
    expect(datetime(noonInJuly, 'Kolkata').zone).toBe('Asia/Kolkata');
    expect(datetime(noonInJuly, 'Kyiv').zone).toBe('Europe/Kyiv');
    expect(datetime(noonInJuly, 'ho chi minh').zone).toBe('Asia/Ho_Chi_Minh');
  });

  it('throws unknownZone at the name when it is no city, abbreviation or zone', () => {
    expect(() => datetime(noonInJuly, 'Atlantis')).toThrowError(
      expect.objectContaining({ code: 'unknownZone', at: 'Atlantis' }),
    );
    expect(() => datetime(noonInJuly, 'UTC').in('Atlantis')).toThrowError(
      expect.objectContaining({ code: 'unknownZone', at: 'Atlantis' }),
    );
  });

  it('throws unknownZone for a blank name, never reading it as the default zone', () => {
    expect(() => datetime(noonInJuly, '')).toThrowError(expect.objectContaining({ code: 'unknownZone', at: '' }));
    expect(() => datetime(noonInJuly, '  ')).toThrowError(expect.objectContaining({ code: 'unknownZone', at: '  ' }));
  });

  it.todo('reads Singapore, a city that is also a legacy IANA link, as Asia/Singapore');
  it.todo('reads a full IANA name typed with spaces when the runtime lists its zone under an older name');
});

describe('zones plugin abbreviations', () => {
  it('converts 9:30 PT to 18:30 in Berlin', () => {
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
  ])('reads %s as %s', (spellings, zone) => {
    for (const spelling of spellings.split(', ')) {
      expect(datetime(noonInJuly, spelling).zone, spelling).toBe(zone);
    }
  });

  it('reads an abbreviation in any letter case', () => {
    expect(datetime(noonInJuly, 'pt').zone).toBe('America/Los_Angeles');
    expect(datetime(noonInJuly, 'Est').zone).toBe('America/New_York');
    expect(datetime(noonInJuly, 'PACIFIC').zone).toBe('America/Los_Angeles');
  });

  // bare EST and MST are IANA zones of their own that never move for daylight time
  it('observes daylight saving time under EST, PST and MST', () => {
    expect(datetime('2026-07-01T12:00', 'EST').offset).toBe('-04:00');
    expect(datetime('2026-01-01T12:00', 'EST').offset).toBe('-05:00');
    expect(datetime('2026-07-01T12:00', 'PST').offset).toBe('-07:00');
    expect(datetime('2026-07-01T12:00', 'MST').offset).toBe('-06:00');
  });

  it.todo('does not read IRST, Iran Standard Time, as Europe/Dublin');
});

describe('zones plugin with IANA names, fixed offsets and UTC', () => {
  it('leaves an IANA name, a fixed offset and UTC as they are', () => {
    expect(datetime(noonInJuly, 'Asia/Tokyo').zone).toBe('Asia/Tokyo');
    expect(datetime(noonInJuly, 'America/Argentina/Buenos_Aires').zone).toBe('America/Argentina/Buenos_Aires');
    expect(datetime(noonInJuly, '+05:30').zone).toBe('+05:30');
    expect(datetime(noonInJuly, 'UTC').zone).toBe('UTC');
  });

  it('keeps a numeric offset fixed in summer and in winter', () => {
    expect(datetime('2026-07-01T12:00', '-08:00').offset).toBe('-08:00');
    expect(datetime('2026-01-01T12:00', '-08:00').offset).toBe('-08:00');
  });
});

describe('zones plugin on every zone parameter', () => {
  afterEach(() => {
    configure({ zone: null });
  });

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
  ])('%s reads a city name', (signature, zoneRead) => {
    expect(zoneRead()).toBe('Europe/Berlin');
  });

  it('date(moment, zone) and time(moment, zone) read the moment in a named city', () => {
    const lateInNewYork = datetime('2026-11-16T23:30', 'America/New_York');
    expect(date(lateInNewYork, 'Tokyo').toString()).toBe('2026-11-17');
    expect(time(lateInNewYork, 'Tokyo').hour).toBe(13);
  });

  it('today(zone) reads an abbreviation as it reads the IANA name', () => {
    expect(today('JST').equals(today('Asia/Tokyo'))).toBe(true);
  });

  it('configure({ zone }) takes a city name as the default zone', () => {
    expect(configure({ zone: 'Berlin' }).zone).toBe('Europe/Berlin');
    expect(now().zone).toBe('Europe/Berlin');
  });
});
