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

const january = '2026-01-15T12:00:00Z';
const july = '2026-07-15T12:00:00Z';

describe('core timezone resolution (IANA, fixed offsets, legacy links)', () => {
  it.each(['America/New_York', 'Europe/Berlin', 'Asia/Kolkata', 'UTC'])(
    'resolves IANA timezone %s and exposes it on .zone',
    (name) => {
      expect(datetime(july, name).zone).toBe(name);
    },
  );

  it.each(['+05:30', '-08:00'])('resolves fixed offset %s as both .zone and .offset', (offset) => {
    expect(datetime(july, offset)).toMatchObject({ zone: offset, offset });
  });

  // compact ZZ format tokens emit offsets without a colon, so zone resolution accepts them back
  it.each([['-0800', '-08:00'], ['+0530', '+05:30']])(
    'normalizes colon-less fixed offset %s to %s',
    (written, offset) => {
      expect(datetime(july, written)).toMatchObject({ zone: offset, offset });
    },
  );

  // V8 still reports Asia/Calcutta on systems in India, so legacy IANA links appear in stored user profiles
  it.each([
    ['Asia/Calcutta', '+05:30', '+05:30'],
    ['US/Pacific', '-08:00', '-07:00'],
  ])('resolves legacy IANA link %s with winter and summer offsets', (name, winter, summer) => {
    expect(datetime(january, name).offset).toBe(winter);
    expect(datetime(july, name).offset).toBe(summer);
  });

  it('trims surrounding spaces and newlines from timezone strings', () => {
    expect(datetime(july, ' Europe/Berlin ').zone).toBe('Europe/Berlin');
    expect(datetime(july, 'UTC\n').zone).toBe('UTC');
  });

  it('keeps fixed offsets constant year-round while IANA zones shift across DST transitions', () => {
    expect(datetime(january, '-08:00').offset).toBe('-08:00');
    expect(datetime(july, '-08:00').offset).toBe('-08:00');
    expect(datetime(january, 'America/Los_Angeles').offset).toBe('-08:00');
    expect(datetime(july, 'America/Los_Angeles').offset).toBe('-07:00');
  });
});

describe('unknownZone errors without @native-dates/plugins/zones', () => {
  it.each([
    ['city name', 'Berlin'],
    ['timezone abbreviation', 'PT'],
    ['nonexistent IANA identifier', 'Mars/Phobos'],
    ['out-of-range offset', '+25:00'],
  ])('throws unknownZone RangeError for %s (%s)', (kind, name) => {
    expect(() => datetime(july, name)).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'unknownZone', at: name }),
    );
  });

  it('throws unknownZone RangeError for a non-string zone value', () => {
    expect(() => datetime(july, 42)).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'unknownZone', at: '42' }),
    );
  });

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
    ['in() on a DateTime', () => datetime(july, 'UTC').in('Berlin')],
    ['at() on a CalendarDate', () => date('2026-07-15').at('9:30am', 'Berlin')],
    ['on() on a Time', () => time('09:30').on('2026-07-15', 'Berlin')],
    ['in() on a DateRange', () => dateRange('2026-07-15', '2026-07-16').in('Berlin')],
    ['isToday() on a CalendarDate', () => date('2026-07-15').isToday('Berlin')],
    ['configure({ zone })', () => configure({ zone: 'Berlin' })],
  ])('throws unknownZone RangeError when passed to %s', (caller, call) => {
    expect(call).toThrowError(expect.objectContaining({ name: 'RangeError', code: 'unknownZone', at: 'Berlin' }));
  });
});
