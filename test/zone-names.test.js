import {
  configure,
  date,
  dateRange,
  datetime,
  datetimeRange,
  monthDay,
  now,
  time,
  today,
  yearMonth,
} from 'native-dates';
import { describe, expect, it } from 'vitest';

// vitest loads the library afresh for each test file, and this file imports no plugin,
// so every zone here is read by core alone
const january = '2026-01-15T12:00:00Z';
const july = '2026-07-15T12:00:00Z';

describe('zone names read with no plugin imported', () => {
  it.each(['America/New_York', 'Europe/Berlin', 'Asia/Kolkata', 'UTC'])('reads %s and reports it as zone', (name) => {
    expect(datetime(july, name).zone).toBe(name);
  });

  it.each(['+05:30', '-08:00'])('reads the fixed offset %s and reports it as zone and as offset', (offset) => {
    expect(datetime(july, offset)).toMatchObject({ zone: offset, offset });
  });

  // the ZZ token writes an offset this way, so a zone printed with it has to read back
  it.each([['-0800', '-08:00'], ['+0530', '+05:30']])(
    'reads the offset %s, written with no colon, and reports it as %s',
    (written, offset) => {
      expect(datetime(july, written)).toMatchObject({ zone: offset, offset });
    },
  );

  // V8 still reports the zone of a reader in India as Asia/Calcutta, so that is the name a stored profile holds
  it.each([
    ['Asia/Calcutta', '+05:30', '+05:30'],
    ['US/Pacific', '-08:00', '-07:00'],
  ])('reads the older name %s with the clock of the zone it names', (name, winter, summer) => {
    expect(datetime(january, name).offset).toBe(winter);
    expect(datetime(july, name).offset).toBe(summer);
  });

  // a CHAR column pads its value with spaces, and a line read from a file keeps its newline
  it('reads a name with spaces or a newline around it', () => {
    expect(datetime(july, ' Europe/Berlin ').zone).toBe('Europe/Berlin');
    expect(datetime(july, 'UTC\n').zone).toBe('UTC');
  });

  it('keeps a fixed offset all year where an IANA zone moves with daylight saving time', () => {
    expect(datetime(january, '-08:00').offset).toBe('-08:00');
    expect(datetime(july, '-08:00').offset).toBe('-08:00');
    expect(datetime(january, 'America/Los_Angeles').offset).toBe('-08:00');
    expect(datetime(july, 'America/Los_Angeles').offset).toBe('-07:00');
  });
});

describe('unknownZone refusal with no plugin imported', () => {
  it.each([
    ['a city', 'Berlin'],
    ['an abbreviation', 'PT'],
    ['a name in no time zone database', 'Mars/Phobos'],
    ['an offset of 25 hours', '+25:00'],
  ])('throws a RangeError coded unknownZone at the text for %s', (kind, name) => {
    expect(() => datetime(july, name)).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'unknownZone', at: name }),
    );
  });

  it('throws unknownZone for a zone that is not a string', () => {
    expect(() => datetime(july, 42)).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'unknownZone', at: '42' }),
    );
  });

  it('names the zones plugin in its explanation, since a city or abbreviation needs it', () => {
    expect(() => datetime(july, 'Berlin')).toThrowError(
      expect.objectContaining({ message: expect.stringMatching(/\n.*@native-dates\/plugins\/zones/) }),
    );
  });

  // a zone that cannot be read is never swapped for the zone of the machine
  it.each([
    ['datetime() as a string', () => datetime(july, 'Berlin')],
    ['datetime() as { zone }', () => datetime(july, { zone: 'Berlin' })],
    ['date()', () => date('2026-07-15', 'Berlin')],
    ['time()', () => time('09:30', 'Berlin')],
    ['yearMonth()', () => yearMonth('2026-07', 'Berlin')],
    ['monthDay()', () => monthDay('07-15', 'Berlin')],
    ['datetimeRange()', () => datetimeRange('2026-07-15T09:00', '2026-07-15T10:00', 'Berlin')],
    ['now()', () => now('Berlin')],
    ['today()', () => today('Berlin')],
    ['in() on a datetime', () => datetime(july, 'UTC').in('Berlin')],
    ['at() on a date', () => date('2026-07-15').at('9:30am', 'Berlin')],
    ['on() on a time', () => time('09:30').on('2026-07-15', 'Berlin')],
    ['in() on a date range', () => dateRange('2026-07-15', '2026-07-16').in('Berlin')],
    ['isToday() on a date', () => date('2026-07-15').isToday('Berlin')],
    ['configure({ zone })', () => configure({ zone: 'Berlin' })],
  ])('throws unknownZone at the name when it is passed to %s', (door, call) => {
    expect(call).toThrowError(expect.objectContaining({ name: 'RangeError', code: 'unknownZone', at: 'Berlin' }));
  });
});
